-- Realtime needs FULL replica identity to filter by column values
-- and to include all columns in change payloads
ALTER TABLE matches REPLICA IDENTITY FULL;
