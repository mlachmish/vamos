# Decision Log

Documenting key decisions and the reasoning behind them.

---

### 001 — Web App over Native
**Date:** 2026-02-27
**Decision:** Build as a web app (Next.js) instead of a native mobile app.
**Reasoning:**
- No app store friction — just share a link
- Remote control works on any device with a browser (phone, watch, tablet)
- Faster to build and iterate
- Can always wrap in a PWA or native shell later

### 002 — Supabase for Real-time Sync
**Date:** 2026-02-27
**Decision:** Use Supabase Realtime for syncing scoreboard and remote control.
**Reasoning:**
- Free tier is more than enough for friendly matches
- Built-in realtime subscriptions (Postgres changes)
- Simple SDK, good DX
- No need to manage a WebSocket server ourselves

### 003 — No Auth for MVP
**Date:** 2026-02-27
**Decision:** Skip user authentication for the MVP. Anyone with a match ID can view/control the match.
**Reasoning:**
- These are friendly matches among friends — no need for accounts
- Reduces friction to zero (no sign-up)
- Match IDs are random enough that guessing is impractical
- Can add optional auth later for match history features

### 005 — App Name: Vamos
**Date:** 2026-02-27
**Decision:** Name the app "Vamos".
**Reasoning:**
- Short, energetic, fun to say
- Padel has Spanish roots — "Vamos" is the iconic celebration shout
- Instantly recognizable to anyone who plays padel or watches it
- Works as a brand name and domain name

---

### 004 — Score Logic as Pure TypeScript Engine
**Date:** 2026-02-27
**Decision:** Implement scoring logic as a pure TypeScript module (no side effects, no framework deps).
**Reasoning:**
- Easy to unit test
- Can be reused across client/server
- Separation of concerns — UI doesn't need to know scoring rules
- Makes undo trivial (replay from history)
