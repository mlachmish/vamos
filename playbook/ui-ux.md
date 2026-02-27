# UI / UX

## Design Principles
- **Readable from 3 meters away** — Scoreboard must have huge text
- **One-thumb operation** — Remote control works with one hand
- **Minimal chrome** — No unnecessary UI elements during a match
- **Fun & vibrant** — Use bold colors, smooth animations, satisfying interactions

## Screens

### 1. Home (`/`)
- App logo / title
- "New Match" button (primary)
- "Join Match" input (enter code or scan QR)
- Recent matches list (if any stored locally)

### 2. Match Setup (modal or page)
- Team A: name + player names (optional)
- Team B: name + player names (optional)
- Format selector (MVP: just standard)
- "Start Match" button
- On start → creates match in Supabase → shows QR + scoreboard

### 3. Scoreboard (`/match/[id]/scoreboard`)
- Full-screen, landscape-friendly
- Large set scores at the top
- Giant current game score in the center
- Team names on each side
- Serving indicator (ball icon)
- Subtle "QR" button to show the remote link
- Auto-hides browser chrome (fullscreen API)

```
┌──────────────────────────────────────────┐
│          SET 1    SET 2    SET 3          │
│  TEAM A   6        3        -            │
│  TEAM B   4        5        -            │
│                                          │
│         🎾                               │
│     TEAM A          TEAM B               │
│       30      :       15                 │
│                                          │
│              Game 4 · Set 2              │
└──────────────────────────────────────────┘
```

### 4. Remote Control (`/match/[id]/remote`)
- Two large tap zones (left = Team A, right = Team B)
- Current score displayed small at top (for reference)
- Undo button (small, in corner)
- Haptic feedback on tap (if supported)

```
┌──────────────────────────────────────────┐
│      30 : 15  │  Set 2  │  3-5          │
├───────────────┼─────────┼───────────────┤
│               │         │               │
│               │         │               │
│    TEAM A     │  UNDO   │    TEAM B     │
│     TAP       │   ↩     │     TAP       │
│   TO SCORE    │         │   TO SCORE    │
│               │         │               │
│               │         │               │
└──────────────────────────────────────────┘
```

### 5. Match Complete (overlay)
- Winner announcement with animation
- Final score summary
- "New Match" / "Share" buttons

## Color Ideas
- Background: Dark (easier to read outdoors)
- Team A: Blue tones
- Team B: Orange/red tones
- Accent: White text, green for active serve
