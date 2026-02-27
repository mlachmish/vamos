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

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON matches
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE matches;
