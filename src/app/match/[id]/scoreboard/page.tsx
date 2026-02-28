'use client';

import { use, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMatch } from '@/lib/use-match';
import { getGameScoreDisplay } from '@/lib/score-engine';
import { createMatch } from '@/lib/match-service';
import { QRCodeSVG } from 'qrcode.react';
import { Team, TeamInfo } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { match, loading, error, score, undo, endMatch } = useMatch(id);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
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

    // Match win — big initial burst + looping celebration
    if (match.score.winner) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } }), 300);
      const loop = setInterval(() => {
        confetti({ particleCount: 30, spread: 80, origin: { x: Math.random(), y: Math.random() * 0.4 + 0.3 }, gravity: 0.8 });
      }, 1500);
      return () => clearInterval(loop);
    }
    // Set won — 3 rounds of 100 from the winning side
    else if (prevCompletedSetsRef.current !== null && completedSets > prevCompletedSetsRef.current) {
      const lastWonSet = match.score.sets.filter(s => s.winner).slice(-1)[0];
      const winnerY = lastWonSet?.winner === 'a' ? 0.3 : 0.7;
      confetti({ particleCount: 100, spread: 100, origin: { x: 0.5, y: winnerY } });
      setTimeout(() => confetti({ particleCount: 100, spread: 110, origin: { x: 0.4, y: winnerY } }), 300);
      setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { x: 0.6, y: winnerY } }), 600);
    }
    // Game won — satisfying burst
    else if (prevTotalGamesRef.current !== null && totalGames > prevTotalGamesRef.current) {
      confetti({ particleCount: 100, spread: 120, origin: { y: 0.6 } });
    }

    prevTotalGamesRef.current = totalGames;
    prevCompletedSetsRef.current = completedSets;
  }, [match]);

  // Match timer
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!match) return;
    const start = new Date(match.created_at).getTime();
    const tick = () => {
      if (!match.score.winner) {
        const diff = Math.floor((Date.now() - start) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
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
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/match/${id}/scoreboard`
    : '';

  // Match complete overlay
  if (match.score.winner) {
    const winnerName = match.score.winner === 'a' ? match.team_a.name : match.team_b.name;

    const startNewMatch = async (teamA: TeamInfo, teamB: TeamInfo) => {
      const newMatch = await createMatch(teamA, teamB, match.settings);
      router.push(`/match/${newMatch.id}/scoreboard`);
    };

    const handleRematch = () => {
      startNewMatch(match.team_a, match.team_b);
    };

    const handleShuffle = () => {
      const players = [
        match.team_a.player_1, match.team_a.player_2,
        match.team_b.player_1, match.team_b.player_2,
      ];
      // Fisher-Yates shuffle
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }
      startNewMatch(
        { name: `${players[0]} & ${players[1]}`, player_1: players[0], player_2: players[1] },
        { name: `${players[2]} & ${players[3]}`, player_1: players[2], player_2: players[3] },
      );
    };

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
                <span className={set.games_a > set.games_b ? 'text-team-a font-black' : 'text-team-a/60'}>{set.games_a}</span>
                <span className="text-foreground/30 mx-1">-</span>
                <span className={set.games_b > set.games_a ? 'text-team-b font-black' : 'text-team-b/60'}>{set.games_b}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 w-full max-w-xs mx-auto">
            <button
              onClick={handleRematch}
              className="py-3 px-6 bg-accent text-background font-bold rounded-xl hover:brightness-110 transition-all"
            >
              Rematch
            </button>
            <button
              onClick={handleShuffle}
              className="py-3 px-6 bg-surface text-foreground font-bold rounded-xl hover:brightness-125 transition-all"
            >
              Shuffle Teams
            </button>
            <a
              href="/"
              className="py-3 px-6 text-foreground/40 font-bold rounded-xl hover:text-foreground/70 transition-all text-sm"
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

      {/* End Match Confirmation */}
      {showEndConfirm && (
        <div
          className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setShowEndConfirm(false)}
        >
          <div className="bg-surface p-8 rounded-2xl text-center space-y-5 max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">End match?</h3>
            <p className="text-foreground/60 text-sm">Who won?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowEndConfirm(false); endMatch('a'); }}
                className="py-3 px-6 bg-team-a/20 text-team-a font-bold rounded-xl hover:bg-team-a/30 transition-all"
              >
                {match.team_a.name}
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); endMatch('b'); }}
                className="py-3 px-6 bg-team-b/20 text-team-b font-bold rounded-xl hover:bg-team-b/30 transition-all"
              >
                {match.team_b.name}
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="py-2 text-foreground/40 text-sm hover:text-foreground/70 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header — Set scores and actions */}
      <div className="relative pt-3 pb-1 landscape:pt-2 landscape:pb-1">
        {/* Action buttons — top right corner */}
        <div className="absolute top-2 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={undo}
            disabled={match.point_history.length === 0}
            className="text-foreground/25 hover:text-foreground/60 transition-colors p-1.5 rounded-lg disabled:opacity-30"
            data-testid="undo-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
            </svg>
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="text-foreground/25 hover:text-foreground/60 transition-colors p-1.5 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="text-foreground/25 hover:text-foreground/60 transition-colors p-1.5 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
            </svg>
          </button>
        </div>

        {/* Set scores */}
        <div className="flex justify-center gap-[min(4vw,1.5rem)]">
          {match.score.sets.map((set, i) => {
            const isCurrentSet = i === match.score.current_set;
            const isCompleted = set.winner !== null;
            const teamAWinning = set.games_a > set.games_b;
            const teamBWinning = set.games_b > set.games_a;

            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className={`text-[min(3.5vw,1rem)] uppercase tracking-wider font-bold ${
                  isCurrentSet ? 'text-accent' : 'text-foreground/40'
                }`}>
                  Set {i + 1}
                </div>
                <div className={`px-[min(4vw,1.5rem)] py-1.5 rounded-xl font-mono font-bold transition-all ${
                  isCurrentSet ? 'bg-surface-light ring-1 ring-accent/30' : 'bg-surface'
                } ${isCompleted && !isCurrentSet ? 'opacity-60' : ''}`}>
                  <span className={`transition-all ${
                    teamAWinning ? 'text-team-a text-[min(7vw,2.5rem)] font-black' : 'text-team-a/80 text-[min(6vw,2rem)]'
                  }`}>
                    {set.games_a}
                  </span>
                  <span className="text-foreground/30 mx-[min(2vw,0.75rem)] text-[min(6vw,2rem)]">-</span>
                  <span className={`transition-all ${
                    teamBWinning ? 'text-team-b text-[min(7vw,2.5rem)] font-black' : 'text-team-b/80 text-[min(6vw,2rem)]'
                  }`}>
                    {set.games_b}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

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
      <div className={`flex-1 flex flex-col landscape:flex-row items-center justify-center gap-2 landscape:gap-0 px-4 landscape:px-0 transition-all ${
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
          <div className="flex items-center justify-center gap-[min(3vw,1rem)]">
            <div className={`text-[min(7vw,2.5rem)] landscape:text-[min(3.5vw,2rem)] font-bold uppercase tracking-wide flex items-center gap-[min(2vw,0.5rem)] ${
              match.score.serving_team === 'a' && match.score.serving_player_a === 1 ? 'text-accent' : 'text-team-a'
            }`}>
              {match.score.serving_team === 'a' && match.score.serving_player_a === 1 && (
                <div className="w-[min(3vw,1rem)] h-[min(3vw,1rem)] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
              {match.team_a.player_1}
            </div>
            <span className="text-foreground/20 text-[min(5vw,1.5rem)]">&</span>
            <div className={`text-[min(7vw,2.5rem)] landscape:text-[min(3.5vw,2rem)] font-bold uppercase tracking-wide flex items-center gap-[min(2vw,0.5rem)] ${
              match.score.serving_team === 'a' && match.score.serving_player_a === 2 ? 'text-accent' : 'text-team-a'
            }`}>
              {match.team_a.player_2}
              {match.score.serving_team === 'a' && match.score.serving_player_a === 2 && (
                <div className="w-[min(3vw,1rem)] h-[min(3vw,1rem)] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </div>
          </div>
          <div
            key={`score-a-${scorePopKey}`}
            className="text-[min(45vw,30vh)] landscape:text-[min(25vw,35vh)] leading-none font-bold font-mono text-team-a animate-score-pop"
          >
            {gameScore.a}
          </div>
        </button>

        {/* Divider — Portrait: thin line, Landscape: thin vertical line */}
        <div className="landscape:hidden w-1/2 h-px bg-foreground/10" />
        <div className="hidden landscape:block w-px self-stretch bg-foreground/10 mx-0" />

        {/* Team B — tap zone */}
        <button
          onClick={() => debouncedScore('b')}
          className={`flex-1 flex flex-col-reverse landscape:flex-col items-center justify-center w-full landscape:h-full transition-colors rounded-2xl landscape:rounded-none relative overflow-hidden ${
            tapPulseB ? 'bg-team-b/20' : 'active:bg-team-b/10'
          }`}
          data-testid="score-team-b"
        >
          {tapPulseB && <div className="absolute inset-0 bg-team-b/30 animate-tap-pulse" />}
          <div className="flex items-center justify-center gap-[min(3vw,1rem)]">
            <div className={`text-[min(7vw,2.5rem)] landscape:text-[min(3.5vw,2rem)] font-bold uppercase tracking-wide flex items-center gap-[min(2vw,0.5rem)] ${
              match.score.serving_team === 'b' && match.score.serving_player_b === 1 ? 'text-accent' : 'text-team-b'
            }`}>
              {match.score.serving_team === 'b' && match.score.serving_player_b === 1 && (
                <div className="w-[min(3vw,1rem)] h-[min(3vw,1rem)] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
              {match.team_b.player_1}
            </div>
            <span className="text-foreground/20 text-[min(5vw,1.5rem)]">&</span>
            <div className={`text-[min(7vw,2.5rem)] landscape:text-[min(3.5vw,2rem)] font-bold uppercase tracking-wide flex items-center gap-[min(2vw,0.5rem)] ${
              match.score.serving_team === 'b' && match.score.serving_player_b === 2 ? 'text-accent' : 'text-team-b'
            }`}>
              {match.team_b.player_2}
              {match.score.serving_team === 'b' && match.score.serving_player_b === 2 && (
                <div className="w-[min(3vw,1rem)] h-[min(3vw,1rem)] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </div>
          </div>
          <div
            key={`score-b-${scorePopKey}`}
            className="text-[min(45vw,30vh)] landscape:text-[min(25vw,35vh)] leading-none font-bold font-mono text-team-b animate-score-pop"
          >
            {gameScore.b}
          </div>
        </button>
      </div>

      {/* Match Timer — bottom bar */}
      {elapsed && (
        <div className="flex justify-center items-center py-2 landscape:py-1">
          <span className="text-[min(10vw,4rem)] landscape:text-[min(5vw,2.5rem)] font-mono font-bold text-foreground/50 tracking-wider">{elapsed}</span>
        </div>
      )}
    </div>
  );
}
