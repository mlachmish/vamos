'use client';

import { use, useState, useCallback, useRef, useEffect } from 'react';
import { useMatch } from '@/lib/use-match';
import { getGameScoreDisplay } from '@/lib/score-engine';
import { QRCodeSVG } from 'qrcode.react';
import { Team } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { match, loading, error, score, undo } = useMatch(id);
  const [showQR, setShowQR] = useState(false);
  const [scorePopKey, setScorePopKey] = useState(0);
  const [tapPulseA, setTapPulseA] = useState(false);
  const [tapPulseB, setTapPulseB] = useState(false);

  // Trigger score pop animation when game score changes
  const prevScoreRef = useRef<string | null>(null);
  useEffect(() => {
    if (!match || match.score.winner) return;
    const current = `${match.score.current_game.points_a}-${match.score.current_game.points_b}-${match.score.current_game.tiebreak_points_a}-${match.score.current_game.tiebreak_points_b}`;
    if (prevScoreRef.current !== null && prevScoreRef.current !== current) {
      setScorePopKey(k => k + 1);
    }
    prevScoreRef.current = current;
  }, [match]);

  // Confetti on game/set wins — track total games to detect changes
  const prevTotalGamesRef = useRef<number | null>(null);
  const prevCompletedSetsRef = useRef<number | null>(null);
  useEffect(() => {
    if (!match) return;

    const totalGames = match.score.sets.reduce((sum, s) => sum + s.games_a + s.games_b, 0);
    const completedSets = match.score.sets.filter(s => s.winner).length;

    // Match win — big celebration
    if (match.score.winner) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } }), 300);
    }
    // Set won — medium burst
    else if (prevCompletedSetsRef.current !== null && completedSets > prevCompletedSetsRef.current) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
    }
    // Game won — small burst
    else if (prevTotalGamesRef.current !== null && totalGames > prevTotalGamesRef.current) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }

    prevTotalGamesRef.current = totalGames;
    prevCompletedSetsRef.current = completedSets;
  }, [match]);

  // Match timer
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!match || match.score.winner) return;
    const start = new Date(match.created_at).getTime();
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [match?.created_at, match?.score.winner]);

  // Debounce taps to prevent sweaty double-taps
  const lastTapRef = useRef(0);
  const debouncedScore = useCallback((team: Team) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;

    // Tap pulse animation
    if (team === 'a') {
      setTapPulseA(true);
      setTimeout(() => setTapPulseA(false), 400);
    } else {
      setTapPulseB(true);
      setTimeout(() => setTapPulseB(false), 400);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    score(team);
  }, [score]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl text-foreground/50 animate-pulse">Loading match...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl text-foreground/50">Match not found</div>
          <a href="/" className="text-accent hover:underline">Back to home</a>
        </div>
      </div>
    );
  }

  const gameScore = getGameScoreDisplay(match.score.current_game);
  const currentSet = match.score.sets[match.score.current_set];
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/match/${id}/scoreboard`
    : '';

  // Match complete overlay
  if (match.score.winner) {
    const winnerName = match.score.winner === 'a' ? match.team_a.name : match.team_b.name;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-6">
          <div className="text-5xl font-bold animate-bounce">VAMOS!</div>
          <div className="text-3xl font-bold">
            <span className={match.score.winner === 'a' ? 'text-team-a' : 'text-team-b'}>
              {winnerName}
            </span>
            {' '}wins!
          </div>
          <div className="flex gap-4 justify-center text-2xl font-mono">
            {match.score.sets.filter(s => s.winner).map((set, i) => (
              <div key={i} className="bg-surface px-4 py-2 rounded-xl">
                {set.games_a}-{set.games_b}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <a
              href="/"
              className="py-3 px-6 bg-accent text-background font-bold rounded-xl hover:brightness-110 transition-all"
            >
              New Match
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col relative select-none">
      {/* QR Code Modal */}
      {showQR && (
        <div
          className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setShowQR(false)}
        >
          <div className="bg-surface p-8 rounded-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Scan to join</h3>
            <QRCodeSVG value={shareUrl} size={200} bgColor="#1a2236" fgColor="#f0f0f0" />
            <p className="text-sm text-foreground/50 max-w-[200px] break-all">{shareUrl}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
              className="text-accent text-sm hover:underline"
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      {/* Set Scores Header */}
      <div className="flex justify-center gap-3 pt-4 pb-3 landscape:pt-2 landscape:pb-2">
        {match.score.sets.map((set, i) => {
          const isCurrentSet = i === match.score.current_set;
          const isCompleted = set.winner !== null;
          const teamAWinning = set.games_a > set.games_b;
          const teamBWinning = set.games_b > set.games_a;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`text-xs uppercase tracking-wider font-bold ${
                isCurrentSet ? 'text-accent' : 'text-foreground/40'
              }`}>
                Set {i + 1}
              </div>
              <div className={`px-4 py-1.5 rounded-lg font-mono font-bold transition-all ${
                isCurrentSet ? 'bg-surface-light ring-1 ring-accent/30' : 'bg-surface'
              } ${isCompleted && !isCurrentSet ? 'opacity-60' : ''}`}>
                <span className={`transition-all ${
                  teamAWinning ? 'text-team-a text-lg font-black' : 'text-team-a/80 text-base'
                }`}>
                  {set.games_a}
                </span>
                <span className="text-foreground/30 mx-1.5 text-base">-</span>
                <span className={`transition-all ${
                  teamBWinning ? 'text-team-b text-lg font-black' : 'text-team-b/80 text-base'
                }`}>
                  {set.games_b}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tiebreak Banner */}
      {match.score.current_game.is_tiebreak && (
        <div className="flex justify-center py-2 landscape:py-1">
          <div className="bg-accent/15 border-2 border-accent/50 px-5 py-1.5 rounded-full flex items-center gap-2 animate-tiebreak-pulse">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-accent font-bold uppercase tracking-widest text-sm">
              Tiebreak
            </span>
          </div>
        </div>
      )}

      {/* Main Scoreboard — Portrait: vertical stack, Landscape: side-by-side */}
      <div className={`flex-1 flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-0 px-6 landscape:px-0 transition-all ${
        match.score.current_game.is_tiebreak ? 'bg-accent/5 border-y-2 border-accent/20' : ''
      }`}>
        {/* Team A — tap zone */}
        <button
          onClick={() => debouncedScore('a')}
          className={`flex-1 flex flex-col items-center justify-center w-full landscape:h-full transition-colors rounded-2xl landscape:rounded-none relative overflow-hidden ${
            tapPulseA ? 'bg-team-a/20' : 'active:bg-team-a/10'
          }`}
          data-testid="score-team-a"
        >
          {tapPulseA && <div className="absolute inset-0 bg-team-a/30 animate-tap-pulse" />}
          <div className="flex items-center justify-center gap-3">
            {match.score.serving_team === 'a' && (
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            )}
            <div className="text-2xl font-bold text-team-a uppercase tracking-wide">
              {match.team_a.name}
            </div>
          </div>
          <div
            key={`score-a-${scorePopKey}`}
            className="text-[8rem] landscape:text-[min(20vh,8rem)] leading-none font-bold font-mono text-team-a animate-score-pop"
          >
            {gameScore.a}
          </div>
        </button>

        {/* Divider — Portrait: "vs" text, Landscape: thin vertical line */}
        <div className="landscape:hidden text-foreground/20 text-4xl font-thin">vs</div>
        <div className="hidden landscape:block w-px self-stretch bg-foreground/10 mx-0" />

        {/* Team B — tap zone */}
        <button
          onClick={() => debouncedScore('b')}
          className={`flex-1 flex flex-col items-center justify-center w-full landscape:h-full transition-colors rounded-2xl landscape:rounded-none relative overflow-hidden ${
            tapPulseB ? 'bg-team-b/20' : 'active:bg-team-b/10'
          }`}
          data-testid="score-team-b"
        >
          {tapPulseB && <div className="absolute inset-0 bg-team-b/30 animate-tap-pulse" />}
          <div
            key={`score-b-${scorePopKey}`}
            className="text-[8rem] landscape:text-[min(20vh,8rem)] leading-none font-bold font-mono text-team-b animate-score-pop"
          >
            {gameScore.b}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="text-2xl font-bold text-team-b uppercase tracking-wide">
              {match.team_b.name}
            </div>
            {match.score.serving_team === 'b' && (
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            )}
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-4 landscape:p-2">
        <div className="text-foreground/30 text-sm flex items-center gap-2">
          <span>{currentSet && `Game ${currentSet.games_a + currentSet.games_b + 1} · Set ${match.score.current_set + 1}`}</span>
          {elapsed && <span className="font-mono">{elapsed}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={match.point_history.length === 0}
            className="text-foreground/30 hover:text-foreground transition-colors text-sm px-3 py-1 rounded-lg bg-surface disabled:opacity-30 flex items-center gap-1.5"
            data-testid="undo-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
            </svg>
            Undo
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="text-foreground/30 hover:text-foreground transition-colors text-sm px-3 py-1 rounded-lg bg-surface"
          >
            QR Remote
          </button>
        </div>
      </div>
    </div>
  );
}
