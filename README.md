# Padelmavene

A Next.js application for managing Padel tournaments using the Americano format, built with TypeScript and Tailwind CSS.

## Features

- **Player Setup**: Select number of players (4-7) and enter player names
- **Tournament Configuration**: Choose maximum score per match (16 or 32 points)
- **Americano Format**: Automatically generates matches where every player plays with every other player exactly once
- **Score Input**: Easy score entry interface - click a team and select their score
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

- Every player plays with every other player exactly once as a partner (unless uneven number of players)
- This creates a fair tournament where everyone gets to play with and against everyone else
- Scoring is based on individual wins and point differences
- The app automatically generates all necessary matches

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── TournamentSetup.tsx  # Player setup and tournament configuration
│   │   ├── MatchesList.tsx      # Match management and score input
│   │   └── Results.tsx          # Tournament results and rankings
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
