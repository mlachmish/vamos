'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, Team } from './types';
import { scorePoint, undoLastPoint } from './score-engine';
import { getMatch, updateMatch, subscribeToMatch } from './match-service';

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const matchRef = useRef<Match | null>(null);

  // Keep ref in sync
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  // Fetch match on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getMatch(matchId);
      if (cancelled) return;

      if (!data) {
        setError('Match not found');
        setLoading(false);
        return;
      }

      setMatch(data);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [matchId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (updated) => {
      setMatch(updated);
    });

    return unsubscribe;
  }, [matchId]);

  // Score a point — uses ref to avoid stale closure
  const score = useCallback(async (team: Team) => {
    const current = matchRef.current;
    if (!current || current.score.winner) return;

    const updated = scorePoint(current, team);
    matchRef.current = updated;
    setMatch(updated);
    await updateMatch(updated);
  }, []);

  // Undo last point — uses ref to avoid stale closure
  const undo = useCallback(async () => {
    const current = matchRef.current;
    if (!current || current.point_history.length === 0) return;

    const updated = undoLastPoint(current);
    matchRef.current = updated;
    setMatch(updated);
    await updateMatch(updated);
  }, []);

  return { match, loading, error, score, undo };
}
