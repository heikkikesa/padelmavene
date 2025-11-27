# Padelmavene - AI Coding Agent Instructions

## Project Overview

Padelmavene is a Next.js 15 tournament management app for Padel (Americano format) with static export for Firebase Hosting. The app manages player pairings, match generation, score tracking, and cumulative statistics across multiple rounds.

## Architecture

### App Structure

- **Next.js App Router** with client-side state management (no server components used)
- **Static export** (`output: "export"`) - all components use `"use client"` directive
- **Three-view flow**: Setup → Matches → Results
- **State persistence** via localStorage (keys: `padelmavene_currentView`, `padelmavene_tournamentData`, `padelmavene_overallStandings`)
- **Multi-court support**: 8-15 players use 2-3 courts with round-based scheduling

### Core Data Flow

1. `page.tsx` orchestrates view transitions and maintains overall tournament state
2. State flows down through props; updates bubble up via callbacks
3. Round-based cumulative statistics: `overallStandings` accumulates across multiple rounds
4. Match generation algorithm ensures unique player pairings (see `matchGeneration.ts`)

### Key Components

- `TournamentSetup.tsx` - Player count (4-15), names, max score (16/24/32)
- `MatchesList.tsx` - Score input with modal UI, live standings table, round-based display for multi-court
- `Results.tsx` - Tabbed view: current round + overall cumulative standings

## Critical Patterns

### Match Generation Algorithm (`src/app/utils/matchGeneration.ts`)

- **4 players**: Fixed 3-match schedule (everyone plays with everyone)
- **5 players**: Deterministic 5-match schedule where each pair appears exactly once
- **6 players**: 6-match schedule with 12 unique pairs (each player in 4 matches)
- **7 players**: Greedy algorithm prioritizing balanced participation
- **8+ players**: Multi-court round-based algorithm with smart pairing
  - 8-11 players use 2 courts
  - 12-15 players use 3 courts
  - Extensible: `Math.ceil(playerCount / 4)` for larger tournaments
  - Prioritizes new partnerships and oppositions
  - Balances match participation across all players
  - Generates rounds with simultaneous matches on different courts
- Always randomizes team positions and left/right sides for variety
- Uses Fisher-Yates shuffle for fair randomization

### State Management Conventions

- All state updates must sync to localStorage via `useEffect` hooks
- Match updates use immutable patterns: `setMatches(matches.map(...))`
- Statistics calculation is pure: derives from match results, never mutates
- Confirmation modals for destructive actions (reset tournament, finish early)

### Scoring System

- Point difference is primary ranking metric, wins are tiebreaker
- Unscored matches can auto-fill with even scores (maxScore/2 - maxScore/2)
- Score validation: team scores must sum to maxScore
- Winner determined automatically from scores

### TypeScript Types (`src/app/types.ts`)

- `Match` - Includes optional score, court assignment, and round number for multi-court support
- `TournamentData` - Distinguish between active matches and completed results
- `PlayerStats` - Used for both current round and cumulative overall standings

## Development Workflow

### Commands

- `npm run dev` - Development with Turbopack
- `npm run build` - Production build (generates static export in `out/`)
- `npm run lint` - ESLint

### Firebase Deployment

```bash
npm run build
firebase deploy
```

Configuration in `firebase.json` uses root directory, not `out/` (Next.js handles build output)

### Styling

- Tailwind CSS v4 with PostCSS
- Dark theme: gray-800 backgrounds, gray-700 cards, green/red accents
- Responsive grid layouts, modal overlays with z-50

## Common Tasks

### Adding New Player Counts

Update `matchGeneration.ts` with deterministic schedule to ensure optimal pairing coverage. Test that all unique pairs appear and players participate fairly. For counts beyond 15, the multi-court algorithm automatically scales using `Math.ceil(playerCount / 4)` to calculate courts needed.

### Modifying Score Options

Update `TournamentSetup.tsx` score selection buttons and ensure divisibility logic in `MatchesList.tsx` for even-score handling.

### Extending Statistics

Statistics calculation is centralized in `calculatePlayerStats()` (used in both MatchesList and Results). Extend `PlayerStats` type and update all three calculation instances.

### State Persistence

When adding new state, remember the three-part pattern:

1. Load from localStorage in initial `useEffect`
2. Save to localStorage in reactive `useEffect`
3. Clear on reset/new tournament

## Important Constraints

- **No server-side features** - Static export only (no API routes, SSR, ISR)
- **Client-side only** - All components must use `"use client"` directive
- **No image optimization** - `images: { unoptimized: true }` required for static export
- **Path aliases** - Use `@/` prefix (resolves to `src/`, configured in `tsconfig.json`)
- **Match generation is deterministic** - Don't introduce randomness that breaks unique pair guarantees for 4-6 players
- **Multi-court rounds** - For 8+ players, matches are grouped by rounds with simultaneous court play
