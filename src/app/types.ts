export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  team1: [Player, Player];
  team2: [Player, Player];
  court?: number; // Court assignment for multi-court tournaments
  round?: number; // Round number for multi-court tournaments
  score?: {
    team1Score: number;
    team2Score: number;
    winner: "team1" | "team2" | "tie";
  };
}

export interface TournamentData {
  players: Player[];
  maxScore: number;
  matches: Match[];
  results?: Match[];
}

export interface PlayerStats {
  player: Player;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  matchesPlayed: number;
}
