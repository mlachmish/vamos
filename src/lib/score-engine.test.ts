import { describe, it, expect } from 'vitest';
import { scorePoint, undoLastPoint, getGameScoreDisplay } from './score-engine';
import {
  Match,
  DEFAULT_SETTINGS,
  createInitialScore,
  createInitialGameScore,
} from './types';

function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'test-match',
    created_at: new Date().toISOString(),
    status: 'in_progress',
    team_a: { name: 'Team A', player_1: 'Player 1', player_2: 'Player 2' },
    team_b: { name: 'Team B', player_1: 'Player 3', player_2: 'Player 4' },
    score: createInitialScore(),
    point_history: [],
    settings: { ...DEFAULT_SETTINGS },
    ...overrides,
  };
}

// Helper: score N points for a team
function scorePoints(match: Match, team: 'a' | 'b', count: number): Match {
  let m = match;
  for (let i = 0; i < count; i++) {
    m = scorePoint(m, team);
  }
  return m;
}

// Helper: score a full game for a team (4 consecutive points from 0-0)
function scoreGame(match: Match, team: 'a' | 'b'): Match {
  return scorePoints(match, team, 4);
}

// Helper: score N games for a team
function scoreGames(match: Match, team: 'a' | 'b', count: number): Match {
  let m = match;
  for (let i = 0; i < count; i++) {
    m = scoreGame(m, team);
  }
  return m;
}

describe('Score Engine', () => {
  describe('Point Scoring (within a game)', () => {
    it('scores points in sequence: 0 → 15 → 30 → 40 → game', () => {
      let match = createTestMatch();

      match = scorePoint(match, 'a');
      expect(match.score.current_game.points_a).toBe('15');

      match = scorePoint(match, 'a');
      expect(match.score.current_game.points_a).toBe('30');

      match = scorePoint(match, 'a');
      expect(match.score.current_game.points_a).toBe('40');

      match = scorePoint(match, 'a');
      // Game won — score resets, game count increases
      expect(match.score.sets[0].games_a).toBe(1);
      expect(match.score.current_game.points_a).toBe('0');
    });

    it('handles deuce correctly', () => {
      let match = createTestMatch();
      // Get to 40-40
      match = scorePoints(match, 'a', 3); // 40-0
      match = scorePoints(match, 'b', 3); // 40-40 (deuce)

      expect(match.score.current_game.points_a).toBe('40');
      expect(match.score.current_game.points_b).toBe('40');
    });

    it('handles advantage correctly', () => {
      let match = createTestMatch();
      match = scorePoints(match, 'a', 3);
      match = scorePoints(match, 'b', 3); // Deuce

      match = scorePoint(match, 'a'); // Advantage A
      expect(match.score.current_game.points_a).toBe('AD');

      match = scorePoint(match, 'b'); // Back to deuce
      expect(match.score.current_game.points_a).toBe('40');
      expect(match.score.current_game.points_b).toBe('40');
    });

    it('wins game on advantage + point', () => {
      let match = createTestMatch();
      match = scorePoints(match, 'a', 3);
      match = scorePoints(match, 'b', 3); // Deuce

      match = scorePoint(match, 'a'); // AD
      match = scorePoint(match, 'a'); // Game

      expect(match.score.sets[0].games_a).toBe(1);
    });

    it('handles golden point (no deuce)', () => {
      let match = createTestMatch({
        settings: { ...DEFAULT_SETTINGS, golden_point: true },
      });
      match = scorePoints(match, 'a', 3);
      match = scorePoints(match, 'b', 3); // 40-40

      match = scorePoint(match, 'b'); // Golden point — B wins
      expect(match.score.sets[0].games_b).toBe(1);
    });
  });

  describe('Game → Set Progression', () => {
    it('wins a set at 6-4', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 6);
      match = scoreGames(match, 'b', 4);

      // A should have won the set
      expect(match.score.sets[0].games_a).toBe(6);
      expect(match.score.sets[0].winner).toBe('a');
    });

    it('does not win set at 6-5 (must win by 2)', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 5);
      match = scoreGames(match, 'b', 5);
      match = scoreGame(match, 'a'); // 6-5

      expect(match.score.sets[0].winner).toBeNull();
    });

    it('triggers tiebreak at 6-6', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 5);
      match = scoreGames(match, 'b', 5);
      match = scoreGame(match, 'a'); // 6-5
      match = scoreGame(match, 'b'); // 6-6

      expect(match.score.current_game.is_tiebreak).toBe(true);
    });

    it('wins tiebreak at 7-5', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 5);
      match = scoreGames(match, 'b', 5);
      match = scoreGame(match, 'a'); // 6-5
      match = scoreGame(match, 'b'); // 6-6 → tiebreak

      // Score tiebreak to 7-5
      match = scorePoints(match, 'a', 5); // 5-0
      match = scorePoints(match, 'b', 5); // 5-5
      match = scorePoints(match, 'a', 2); // 7-5

      expect(match.score.sets[0].winner).toBe('a');
      expect(match.score.sets[0].games_a).toBe(7);
    });

    it('tiebreak requires win by 2', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 5);
      match = scoreGames(match, 'b', 5);
      match = scoreGame(match, 'a');
      match = scoreGame(match, 'b'); // 6-6 → tiebreak

      match = scorePoints(match, 'a', 6); // 6-0
      match = scorePoints(match, 'b', 6); // 6-6

      // Not won yet
      expect(match.score.sets[0].winner).toBeNull();

      match = scorePoints(match, 'a', 2); // 8-6
      expect(match.score.sets[0].winner).toBe('a');
    });
  });

  describe('Set → Match Progression', () => {
    it('wins match after winning 2 sets (best of 3)', () => {
      let match = createTestMatch();

      // Win set 1: 6-0
      match = scoreGames(match, 'a', 6);
      expect(match.score.sets[0].winner).toBe('a');
      expect(match.score.current_set).toBe(1);

      // Win set 2: 6-0
      match = scoreGames(match, 'a', 6);
      expect(match.score.sets[1].winner).toBe('a');
      expect(match.score.winner).toBe('a');
      expect(match.status).toBe('completed');
    });

    it('goes to 3rd set when split 1-1', () => {
      let match = createTestMatch();

      match = scoreGames(match, 'a', 6); // A wins set 1
      match = scoreGames(match, 'b', 6); // B wins set 2

      expect(match.score.current_set).toBe(2);
      expect(match.score.winner).toBeNull();
    });

    it('does not score after match is won', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 6); // Set 1
      match = scoreGames(match, 'a', 6); // Set 2 — match won

      const before = JSON.stringify(match.score);
      match = scorePoint(match, 'b');
      expect(JSON.stringify(match.score)).toBe(before);
    });
  });

  describe('Short Sets', () => {
    it('wins set at 4 games (short set format)', () => {
      let match = createTestMatch({
        settings: { ...DEFAULT_SETTINGS, games_per_set: 4 },
      });

      match = scoreGames(match, 'a', 4);
      expect(match.score.sets[0].winner).toBe('a');
    });
  });

  describe('Super Tiebreak', () => {
    it('plays super tiebreak to 10 in final set', () => {
      let match = createTestMatch({
        settings: { ...DEFAULT_SETTINGS, super_tiebreak: true },
      });

      match = scoreGames(match, 'a', 6); // A wins set 1
      match = scoreGames(match, 'b', 6); // B wins set 2

      // 3rd set should be a super tiebreak
      expect(match.score.current_game.is_tiebreak).toBe(true);

      // Score to 10-5
      match = scorePoints(match, 'a', 10);
      match = scorePoints(match, 'b', 5);

      expect(match.score.winner).toBe('a');
      expect(match.status).toBe('completed');
    });
  });

  describe('Undo', () => {
    it('undoes the last point', () => {
      let match = createTestMatch();
      match = scorePoint(match, 'a'); // 15-0
      match = scorePoint(match, 'a'); // 30-0

      match = undoLastPoint(match);
      expect(match.score.current_game.points_a).toBe('15');
      expect(match.point_history.length).toBe(1);
    });

    it('undoes across game boundary', () => {
      let match = createTestMatch();
      match = scorePoints(match, 'a', 4); // Game won
      expect(match.score.sets[0].games_a).toBe(1);

      match = undoLastPoint(match);
      expect(match.score.sets[0].games_a).toBe(0);
      expect(match.score.current_game.points_a).toBe('40');
    });

    it('does nothing when no history', () => {
      const match = createTestMatch();
      const result = undoLastPoint(match);
      expect(result).toEqual(match);
    });

    it('restores match status after undo from completed', () => {
      let match = createTestMatch();
      match = scoreGames(match, 'a', 6); // Set 1
      match = scoreGames(match, 'a', 6); // Match won
      expect(match.status).toBe('completed');

      match = undoLastPoint(match);
      expect(match.status).toBe('in_progress');
    });
  });

  describe('Serve Rotation', () => {
    it('alternates serve every game', () => {
      let match = createTestMatch();
      expect(match.score.serving_team).toBe('a');

      match = scoreGame(match, 'a'); // Game 1 done
      expect(match.score.serving_team).toBe('b');

      match = scoreGame(match, 'b'); // Game 2 done
      expect(match.score.serving_team).toBe('a');
    });
  });

  describe('Display Helpers', () => {
    it('returns correct game score display for regular game', () => {
      let match = createTestMatch();
      match = scorePoint(match, 'a');
      match = scorePoint(match, 'b');

      const display = getGameScoreDisplay(match.score.current_game);
      expect(display).toEqual({ a: '15', b: '15' });
    });

    it('returns numeric display for tiebreak', () => {
      let match = createTestMatch();
      // Get to tiebreak
      match = scoreGames(match, 'a', 5);
      match = scoreGames(match, 'b', 5);
      match = scoreGame(match, 'a');
      match = scoreGame(match, 'b'); // 6-6 tiebreak

      match = scorePoint(match, 'a');
      match = scorePoint(match, 'b');

      const display = getGameScoreDisplay(match.score.current_game);
      expect(display).toEqual({ a: '1', b: '1' });
    });
  });
});
