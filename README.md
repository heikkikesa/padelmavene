# Padelmavene

A Next.js application for managing small Padel Americano tournaments (4–8 players) using a static pre-defined schedule, built with TypeScript and Tailwind CSS.

## Features

- **Player Setup**: Select number of players (4–8) and enter player names
- **Multi-Court Support**: Static schedule uses 2 courts only for 8 players
- **Tournament Configuration**: Choose maximum score per match (16, 24, or 32 points)
- **Americano Format**: Matches come from a static schedule (no algorithms)
  - 4 players: 3 matches (everyone partners everyone once)
  - 5 players: 5 matches (each pair appears exactly once, one bye per round)
  - 6 players: 5 matches (inefficient legacy schedule – player 1 appears each match)
  - 7 players: 7 matches (inefficient legacy schedule – each player 4 matches)
  - 8 players: 14 matches (7 rounds × 2 courts, complete partner rotation)
- **Round-Based Play**: For multi-court tournaments, matches are organized in rounds
- **Score Input**: Easy score entry interface - click a team and select their score
- **Live Standings**: Real-time tournament standings with comprehensive statistics
- **New Round**: Start a new round with the same players and settings
- **Persistent State**: Tournament state is saved in local storage, allowing you to resume later
- **Results**: Comprehensive tournament results showing:
  - Final rankings based on point differences
  - Individual player statistics
  - Match history
  - Cumulative match history

## Getting Started

### Prerequisites

- Node.js 22 or later
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

### Firebase Hosting

This app is configured for Firebase hosting with static export.

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):

   ```bash
   firebase init hosting
   ```

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Match Generation Approach

Previous versions used dynamic algorithms to construct schedules and balance partnerships/oppositions for larger player counts (up to 15). That logic has been removed. The application now uses a static lookup file (`src/app/utils/pairing-list.json`) containing deterministic round-by-round match templates for 4–8 players only.

Key points:

- No runtime pairing algorithms. Matches are read from a static template.
- Player-to-index assignment is shuffled per generation. This keeps the round/court order identical but varies who occupies each template slot, making "play again" feel fresh while scores remain tied to the correct Player objects.
- Courts are only relevant for the 8-player schedule (two simultaneous matches per round).
- 5 & 6 player schedules include byes; the UI ignores bye metadata (only matches are shown).
- 6 & 7 player schedules are marked "inefficient" in the template – they remain for completeness but do not guarantee balanced appearances.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── TournamentSetup.tsx  # Player setup (4-15 players) and tournament configuration
│   │   ├── MatchesList.tsx      # Match management, score input, and round display
│   │   └── Results.tsx          # Tournament results and rankings
│   ├── utils/
│   │   └── matchGeneration.ts   # Static schedule lookup (no algorithms)
│   ├── types.ts                 # TypeScript type definitions
│   └── page.tsx                 # Main application component
├── globals.css                  # Global styles
└── layout.tsx                   # Root layout
```

## Technologies Used

- **Next.js 15** – App Router, static export
- **TypeScript** – Type safety
- **Tailwind CSS** – Styling
- **Firebase** – Hosting platform

## Static Schedules Summary

| Players | Matches | Courts | Notes                               |
| ------- | ------- | ------ | ----------------------------------- |
| 4       | 3       | 1      | Full partner rotation               |
| 5       | 5       | 1      | Every pair once, one bye each round |
| 6       | 5       | 1      | Inefficient (player 1 every match)  |
| 7       | 7       | 1      | Inefficient, each player 4 matches  |
| 8       | 14      | 2      | Complete unique partnerships        |

> For future changes, update `pairing-list.json` and the UI will automatically reflect the new schedule for that player count.
