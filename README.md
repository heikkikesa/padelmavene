# Padelmavene

A Next.js application for managing Padel tournaments using the Americano format, built with TypeScript and Tailwind CSS.

## Features

- **Player Setup**: Select number of players (4-15) and enter player names
- **Multi-Court Support**: Automatic court allocation for 8+ players
  - 8-11 players: 2 courts
  - 12-15 players: 3 courts
  - Extensible for larger tournaments
- **Tournament Configuration**: Choose maximum score per match (16, 24, or 32 points)
- **Americano Format**: Automatically generates matches following Americano rules
  - 4-7 players: Single court with optimized pairing schedules
  - 8+ players: Multi-court rounds with smart rotation
  - Players rotate partners and opponents throughout the tournament
  - Balanced participation across all players
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

## How the Americano Format Works

In the Americano tournament format:

- Players continuously rotate partners and opponents throughout the tournament
- Each player should play with as many different partners as possible
- Each player should face as many different opponents as possible
- Matches ensure balanced participation across all players
- Scoring is based on individual point differences and wins

### Single Court (4-7 Players)

- Each player gets a similar number of matches
- Optimized pairing schedules ensure fair rotation
- All matches played sequentially

### Multi-Court (8+ Players)

- Matches organized into rounds
- Multiple matches happen simultaneously on different courts
- Smart algorithm ensures:
  - New partnerships are prioritized
  - Players face different opponents each round
  - Balanced match participation
  - Efficient rotation across courts

The app automatically generates all necessary matches following these principles.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── TournamentSetup.tsx  # Player setup (4-15 players) and tournament configuration
│   │   ├── MatchesList.tsx      # Match management, score input, and round display
│   │   └── Results.tsx          # Tournament results and rankings
│   ├── utils/
│   │   └── matchGeneration.ts   # Match generation algorithms (single & multi-court)
│   ├── types.ts                 # TypeScript type definitions
│   └── page.tsx                 # Main application component
├── globals.css                  # Global styles
└── layout.tsx                   # Root layout
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Hosting platform
