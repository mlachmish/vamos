# Data Model

## Match State

```typescript
interface Match {
  id: string;                  // Unique match ID (nanoid or uuid)
  created_at: string;          // ISO timestamp
  status: 'in_progress' | 'completed';

  // Teams
  team_a: TeamInfo;
  team_b: TeamInfo;

  // Current score
  score: MatchScore;

  // Point history (for undo & replay)
  point_history: PointEvent[];

  // Settings
  settings: MatchSettings;
}

interface TeamInfo {
  name: string;
  player_1: string;
  player_2: string;
}

interface MatchScore {
  sets: SetScore[];           // Array of set scores
  current_set: number;        // Index of current set (0-based)
  current_game: GameScore;    // Current game score
  serving_team: 'a' | 'b';
  winner: 'a' | 'b' | null;
}

interface SetScore {
  games_a: number;
  games_b: number;
  tiebreak: boolean;
  winner: 'a' | 'b' | null;
}

interface GameScore {
  points_a: PadelPoint;       // '0' | '15' | '30' | '40' | 'AD'
  points_b: PadelPoint;
  is_tiebreak: boolean;
  tiebreak_points_a?: number;
  tiebreak_points_b?: number;
}

type PadelPoint = '0' | '15' | '30' | '40' | 'AD';

interface PointEvent {
  team: 'a' | 'b';           // Team that scored
  timestamp: string;
  score_snapshot: MatchScore; // State BEFORE this point
}

interface MatchSettings {
  sets_to_win: number;        // Default: 2 (best of 3)
  games_per_set: number;      // Default: 6
  tiebreak_points: number;    // Default: 7
  golden_point: boolean;      // Default: false (use deuce/advantage)
  super_tiebreak: boolean;    // Default: false
}
```

## Supabase Table

```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'in_progress',
  team_a JSONB NOT NULL,
  team_b JSONB NOT NULL,
  score JSONB NOT NULL,
  point_history JSONB DEFAULT '[]',
  settings JSONB NOT NULL
);

-- Allow anyone with the match ID to read/write (no auth for MVP)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON matches
  FOR ALL USING (true) WITH CHECK (true);
```
