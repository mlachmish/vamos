// ===== Vamos — Match Types =====

export type Team = 'a' | 'b';

export type PadelPoint = '0' | '15' | '30' | '40' | 'AD';

export interface TeamInfo {
  name: string;
  player_1: string;
  player_2: string;
}

export interface MatchSettings {
  sets_to_win: number;        // Default: 2 (best of 3)
  games_per_set: number;      // Default: 6
  tiebreak_points: number;    // Default: 7
  golden_point: boolean;      // Default: false (use deuce/advantage)
  super_tiebreak: boolean;    // Default: false
}

export interface GameScore {
  points_a: PadelPoint;
  points_b: PadelPoint;
  is_tiebreak: boolean;
  tiebreak_points_a: number;
  tiebreak_points_b: number;
}

export interface SetScore {
  games_a: number;
  games_b: number;
  tiebreak: boolean;
  winner: Team | null;
}

export interface MatchScore {
  sets: SetScore[];
  current_set: number;
  current_game: GameScore;
  serving_team: Team;
  winner: Team | null;
}

export interface PointEvent {
  team: Team;
  timestamp: string;
  score_snapshot: MatchScore;
}

export interface Match {
  id: string;
  created_at: string;
  status: 'in_progress' | 'completed';
  team_a: TeamInfo;
  team_b: TeamInfo;
  score: MatchScore;
  point_history: PointEvent[];
  settings: MatchSettings;
}

// ===== Defaults =====

export const DEFAULT_SETTINGS: MatchSettings = {
  sets_to_win: 2,
  games_per_set: 6,
  tiebreak_points: 7,
  golden_point: false,
  super_tiebreak: false,
};

export function createInitialGameScore(is_tiebreak = false): GameScore {
  return {
    points_a: '0',
    points_b: '0',
    is_tiebreak,
    tiebreak_points_a: 0,
    tiebreak_points_b: 0,
  };
}

export function createInitialSetScore(): SetScore {
  return {
    games_a: 0,
    games_b: 0,
    tiebreak: false,
    winner: null,
  };
}

export function createInitialScore(): MatchScore {
  return {
    sets: [createInitialSetScore()],
    current_set: 0,
    current_game: createInitialGameScore(),
    serving_team: 'a',
    winner: null,
  };
}
