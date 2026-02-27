'use client';

import { use, useState } from 'react';
import { useMatch } from '@/lib/use-match';
import { getGameScoreDisplay } from '@/lib/score-engine';
import { QRCodeSVG } from 'qrcode.react';

export default function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { match, loading, error } = useMatch(id);
  const [showQR, setShowQR] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-foreground/50 animate-pulse">Loading match...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl text-foreground/50">Match not found</div>
          <a href="/" className="text-accent hover:underline">Back to home</a>
        </div>
      </div>
    );
  }

  const gameScore = getGameScoreDisplay(match.score.current_game);
  const currentSet = match.score.sets[match.score.current_set];
  const remoteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/match/${id}/remote`
    : '';

  // Match complete overlay
  if (match.score.winner) {
    const winnerName = match.score.winner === 'a' ? match.team_a.name : match.team_b.name;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen flex flex-col relative select-none">
      {/* QR Code Modal */}
      {showQR && (
        <div
          className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setShowQR(false)}
        >
          <div className="bg-surface p-8 rounded-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Scan to control</h3>
            <QRCodeSVG value={remoteUrl} size={200} bgColor="#1a2236" fgColor="#f0f0f0" />
            <p className="text-sm text-foreground/50 max-w-[200px] break-all">{remoteUrl}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(remoteUrl);
              }}
              className="text-accent text-sm hover:underline"
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      {/* Set Scores Header */}
      <div className="flex justify-center gap-1 pt-4 pb-2">
        {match.score.sets.map((set, i) => (
          <div key={i} className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${
            i === match.score.current_set ? 'bg-surface-light' : 'bg-surface'
          }`}>
            <span className="text-team-a">{set.games_a}</span>
            <span className="text-foreground/30 mx-1">-</span>
            <span className="text-team-b">{set.games_b}</span>
          </div>
        ))}
      </div>

      {/* Main Scoreboard */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Team A */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-3">
            {match.score.serving_team === 'a' && (
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            )}
            <div className="text-2xl font-bold text-team-a uppercase tracking-wide">
              {match.team_a.name}
            </div>
          </div>
          <div className="text-[8rem] leading-none font-bold font-mono text-team-a">
            {gameScore.a}
          </div>
        </div>

        {/* Divider */}
        <div className="text-foreground/20 text-4xl font-thin">vs</div>

        {/* Team B */}
        <div className="text-center space-y-1">
          <div className="text-[8rem] leading-none font-bold font-mono text-team-b">
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
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-4">
        <div className="text-foreground/30 text-sm">
          {currentSet && `Game ${currentSet.games_a + currentSet.games_b + 1} · Set ${match.score.current_set + 1}`}
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="text-foreground/30 hover:text-foreground transition-colors text-sm px-3 py-1 rounded-lg bg-surface"
        >
          QR Remote
        </button>
      </div>
    </div>
  );
}
