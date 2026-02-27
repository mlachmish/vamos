// ===== Vamos — Match CRUD + Realtime =====

import { supabase } from './supabase';
import { Match, MatchSettings, TeamInfo, Team, DEFAULT_SETTINGS, createInitialScore } from './types';
import { nanoid } from 'nanoid';

function backfillServingPlayer(match: Match): void {
  if (match.score.serving_player_a === undefined) match.score.serving_player_a = 1;
  if (match.score.serving_player_b === undefined) match.score.serving_player_b = 1;
}

// ===== Create Match =====

export async function createMatch(
  teamA: TeamInfo,
  teamB: TeamInfo,
  settings: Partial<MatchSettings> = {},
  servingTeam: Team = 'a'
): Promise<Match> {
  const match: Match = {
    id: nanoid(10),
    created_at: new Date().toISOString(),
    status: 'in_progress',
    team_a: teamA,
    team_b: teamB,
    score: createInitialScore(servingTeam),
    point_history: [],
    settings: { ...DEFAULT_SETTINGS, ...settings },
  };

  const { error } = await supabase.from('matches').insert(match);
  if (error) throw new Error(`Failed to create match: ${error.message}`);

  return match;
}

// ===== Get Match =====

export async function getMatch(id: string): Promise<Match | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  const match = data as Match;
  backfillServingPlayer(match);
  return match;
}

// ===== Update Match =====

export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      status: match.status,
      score: match.score,
      point_history: match.point_history,
      settings: match.settings,
      team_a: match.team_a,
      team_b: match.team_b,
    })
    .eq('id', match.id);

  if (error) throw new Error(`Failed to update match: ${error.message}`);
}

// ===== Subscribe to Match Changes =====

export function subscribeToMatch(
  matchId: string,
  onUpdate: (match: Match) => void
) {
  const channel = supabase
    .channel(`match-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        const match = payload.new as Match;
        backfillServingPlayer(match);
        onUpdate(match);
      }
    )
    .subscribe((status, err) => {
      if (err) console.error(`[Vamos] Realtime error:`, err);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
