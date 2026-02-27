'use client';

import { use } from 'react';
import { useMatch } from '@/lib/use-match';
import { getGameScoreDisplay } from '@/lib/score-engine';

export default function RemotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { match, loading, error, score, undo } = useMatch(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-foreground/50 animate-pulse">Connecting...</div>
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

  // Match complete
  if (match.score.winner) {
    const winnerName = match.score.winner === 'a' ? match.team_a.name : match.team_b.name;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="text-4xl font-bold">VAMOS!</div>
          <div className="text-xl">
            <span className={match.score.winner === 'a' ? 'text-team-a' : 'text-team-b'}>
              {winnerName}
            </span>
            {' '}wins!
          </div>
          <div className="flex gap-3 justify-center font-mono">
            {match.score.sets.filter(s => s.winner).map((set, i) => (
              <span key={i}>{set.games_a}-{set.games_b}</span>
            ))}
          </div>
          <a
            href="/"
            className="inline-block mt-4 py-3 px-6 bg-accent text-background font-bold rounded-xl"
          >
            New Match
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Score Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="text-team-a font-bold">{gameScore.a}</span>
          <span className="text-foreground/30">:</span>
          <span className="text-team-b font-bold">{gameScore.b}</span>
        </div>
        <div className="text-foreground/50">
          Set {match.score.current_set + 1}
        </div>
        <div className="flex gap-1">
          {match.score.sets.map((set, i) => (
            <span key={i} className="text-foreground/50">
              {set.games_a}-{set.games_b}
            </span>
          ))}
        </div>
      </div>

      {/* Tap Zones */}
      <div className="flex-1 flex">
        {/* Team A Zone */}
        <button
          onClick={() => score('a')}
          className="flex-1 flex flex-col items-center justify-center bg-team-a/10 border-r border-surface-light active:bg-team-a/30 transition-colors"
        >
          <div className="text-team-a text-3xl font-bold uppercase tracking-wide">
            {match.team_a.name}
          </div>
          <div className="text-team-a/50 text-sm mt-2">TAP TO SCORE</div>
          {match.score.serving_team === 'a' && (
            <div className="mt-3 w-2.5 h-2.5 rounded-full bg-accent" />
          )}
        </button>

        {/* Undo Strip */}
        <button
          onClick={undo}
          disabled={match.point_history.length === 0}
          className="w-16 flex flex-col items-center justify-center bg-surface hover:bg-surface-light active:bg-surface-light transition-colors disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
          </svg>
          <span className="text-xs text-foreground/30 mt-1">Undo</span>
        </button>

        {/* Team B Zone */}
        <button
          onClick={() => score('b')}
          className="flex-1 flex flex-col items-center justify-center bg-team-b/10 border-l border-surface-light active:bg-team-b/30 transition-colors"
        >
          <div className="text-team-b text-3xl font-bold uppercase tracking-wide">
            {match.team_b.name}
          </div>
          <div className="text-team-b/50 text-sm mt-2">TAP TO SCORE</div>
          {match.score.serving_team === 'b' && (
            <div className="mt-3 w-2.5 h-2.5 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </div>
  );
}
