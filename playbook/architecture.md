# Architecture

## High-Level Flow

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   SCOREBOARD    │◄───────►│   SUPABASE   │◄───────►│  REMOTE CONTROL │
│   (Phone A)     │  real-  │   REALTIME   │  real-  │  (Phone B /     │
│   Full-screen   │  time   │              │  time   │   Watch / any)  │
│   display       │  sync   │  Match state │  sync   │   Tap to score  │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Pages / Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — create new match or join existing |
| `/match/[id]/scoreboard` | Full-screen scoreboard display |
| `/match/[id]/remote` | Remote control interface |

## How a Match Session Works

1. User creates a match on the home page (enters 4 player names, team name auto-generated as "P1 & P2")
2. A unique match ID is generated
3. App shows a QR code + link for the remote control
4. Scoreboard opens full-screen on the current device
5. Second device scans QR / opens link → gets the remote control
6. Both views stay in sync via Supabase Realtime subscriptions

## Key Components

### Frontend
- **ScoreEngine** — Pure TypeScript scoring logic (points, games, sets, tiebreak, match state)
- **ScoreboardView** — Full-screen display component
- **RemoteView** — Tap-to-score controller component
- **MatchProvider** — React context for match state + Supabase subscription

### Backend (Supabase)
- **matches table** — Stores match state (teams, score, history)
- **Realtime subscriptions** — Broadcasts score changes to all connected clients
- **Row Level Security** — Anyone with match ID can read/write (friendly matches, no auth needed for MVP)

## State Management
- Match state lives in Supabase (source of truth)
- Local React state mirrors it via realtime subscription
- Score mutations go through Supabase → broadcast to all clients
- ScoreEngine runs on the client that triggers the action, computes new state, writes to Supabase
