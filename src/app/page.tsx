'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/match-service';
import { MatchSettings, DEFAULT_SETTINGS } from '@/lib/types';

type FormatPreset = 'standard' | 'golden_point' | 'short_sets' | 'single_set';

const FORMAT_PRESETS: Record<FormatPreset, { label: string; description: string; settings: Partial<MatchSettings> }> = {
  standard: {
    label: 'Standard',
    description: 'Best of 3, deuce/advantage',
    settings: {},
  },
  golden_point: {
    label: 'Golden Point',
    description: 'Best of 3, no deuce',
    settings: { golden_point: true },
  },
  short_sets: {
    label: 'Short Sets',
    description: 'Best of 3, first to 4',
    settings: { games_per_set: 4 },
  },
  single_set: {
    label: 'Single Set',
    description: 'One set to 6 games',
    settings: { sets_to_win: 1 },
  },
};

export default function Home() {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [format, setFormat] = useState<FormatPreset>('standard');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!teamAName.trim() || !teamBName.trim()) return;
    setCreating(true);

    try {
      const match = await createMatch(
        { name: teamAName.trim(), player_1: '', player_2: '' },
        { name: teamBName.trim(), player_1: '', player_2: '' },
        FORMAT_PRESETS[format].settings
      );
      router.push(`/match/${match.id}/scoreboard`);
    } catch {
      setCreating(false);
    }
  }

  function handleJoin() {
    const code = joinCode.trim();
    if (!code) return;
    const matchId = code.includes('/') ? code.split('/').filter(Boolean).pop() : code;
    router.push(`/match/${matchId}/remote`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-bold tracking-tight">VAMOS</h1>
          <p className="text-foreground/50 text-lg">Padel Scoreboard</p>
        </div>

        {!showSetup ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowSetup(true)}
              className="w-full py-4 px-6 bg-accent text-background font-bold text-xl rounded-2xl hover:brightness-110 transition-all active:scale-[0.98]"
            >
              New Match
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter match code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-1 py-3 px-4 bg-surface border border-surface-light rounded-xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleJoin}
                className="py-3 px-5 bg-surface-light rounded-xl font-semibold hover:bg-surface-light/80 transition-all"
              >
                Join
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 bg-surface p-6 rounded-2xl">
            <h2 className="text-xl font-bold">New Match</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-foreground/50 mb-1 block">Team A</label>
                <input
                  type="text"
                  placeholder="Team name..."
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full py-3 px-4 bg-background border-2 border-team-a/30 rounded-xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-team-a"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-foreground/50 mb-1 block">Team B</label>
                <input
                  type="text"
                  placeholder="Team name..."
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full py-3 px-4 bg-background border-2 border-team-b/30 rounded-xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-team-b"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/50 block">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FORMAT_PRESETS) as [FormatPreset, typeof FORMAT_PRESETS[FormatPreset]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`py-3 px-3 rounded-xl text-sm font-medium transition-all text-left ${
                      format === key
                        ? 'bg-accent/20 border-2 border-accent text-accent'
                        : 'bg-background border-2 border-surface-light text-foreground/70 hover:border-foreground/30'
                    }`}
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 py-3 bg-surface-light rounded-xl font-semibold hover:bg-surface-light/80 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!teamAName.trim() || !teamBName.trim() || creating}
                className="flex-2 py-3 px-6 bg-accent text-background font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:hover:brightness-100"
              >
                {creating ? 'Creating...' : 'Start Match'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
