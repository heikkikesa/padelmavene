import { Match, Player, PlayerStats, TournamentData } from "../types";
import { generateAmericanoMatches } from "./matchGeneration";

export type View = "setup" | "matches" | "results";

export const VIEWS: readonly View[] = ["setup", "matches", "results"];
export const EMPTY_STANDINGS: PlayerStats[] = [];

export type MatchScore = NonNullable<Match["score"]>;

export function scoreFromTeamInput(
  team: "team1" | "team2",
  teamScore: number,
  maxScore: number
): MatchScore {
  const otherTeamScore = maxScore - teamScore;
  let winner: MatchScore["winner"];

  if (teamScore > otherTeamScore) {
    winner = team;
  } else if (teamScore < otherTeamScore) {
    winner = team === "team1" ? "team2" : "team1";
  } else {
    winner = "tie";
  }

  return {
    team1Score: team === "team1" ? teamScore : otherTeamScore,
    team2Score: team === "team2" ? teamScore : otherTeamScore,
    winner,
  };
}

export function applyMatchScore(
  matches: Match[],
  matchId: number,
  team: "team1" | "team2",
  teamScore: number,
  maxScore: number
): Match[] {
  const score = scoreFromTeamInput(team, teamScore, maxScore);
  return matches.map((match) =>
    match.id === matchId ? { ...match, score } : match
  );
}

export function fillUnscoredWithEvenScores(
  matches: Match[],
  maxScore: number
): Match[] {
  const evenScore = Math.floor(maxScore / 2);

  return matches.map((match) => {
    if (!match.score) {
      return {
        ...match,
        score: {
          team1Score: evenScore,
          team2Score: evenScore,
          winner: "tie" as const,
        },
      };
    }
    return match;
  });
}

export function calculatePlayerStats(
  players: Player[],
  matches: Match[]
): PlayerStats[] {
  const stats: { [playerId: number]: PlayerStats } = {};

  players.forEach((player) => {
    stats[player.id] = {
      player,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDifference: 0,
      matchesPlayed: 0,
    };
  });

  matches.forEach((match) => {
    if (match.score) {
      const team1Players = match.team1;
      const team2Players = match.team2;
      const { team1Score, team2Score, winner } = match.score;

      team1Players.forEach((player) => {
        const playerStats = stats[player.id];
        if (!playerStats) return;
        playerStats.matchesPlayed++;
        playerStats.pointsFor += team1Score;
        playerStats.pointsAgainst += team2Score;

        if (winner === "team1") {
          playerStats.wins++;
        } else if (winner === "tie") {
          playerStats.ties++;
        } else {
          playerStats.losses++;
        }
      });

      team2Players.forEach((player) => {
        const playerStats = stats[player.id];
        if (!playerStats) return;
        playerStats.matchesPlayed++;
        playerStats.pointsFor += team2Score;
        playerStats.pointsAgainst += team1Score;

        if (winner === "team2") {
          playerStats.wins++;
        } else if (winner === "tie") {
          playerStats.ties++;
        } else {
          playerStats.losses++;
        }
      });
    }
  });

  Object.values(stats).forEach((playerStats) => {
    playerStats.pointsDifference =
      playerStats.pointsFor - playerStats.pointsAgainst;
  });

  return Object.values(stats).sort((a, b) => {
    if (a.pointsDifference !== b.pointsDifference) {
      return b.pointsDifference - a.pointsDifference;
    }
    return b.wins - a.wins;
  });
}

export function mergeOverallStandings(
  existingStandings: PlayerStats[],
  currentRoundStats: PlayerStats[]
): PlayerStats[] {
  const updatedOverallStandings = [...existingStandings];

  currentRoundStats.forEach((currentStats) => {
    const existingPlayerIndex = updatedOverallStandings.findIndex(
      (overall) => overall.player.id === currentStats.player.id
    );

    if (existingPlayerIndex >= 0) {
      const existing = updatedOverallStandings[existingPlayerIndex];
      updatedOverallStandings[existingPlayerIndex] = {
        ...existing,
        wins: existing.wins + currentStats.wins,
        losses: existing.losses + currentStats.losses,
        ties: existing.ties + currentStats.ties,
        pointsFor: existing.pointsFor + currentStats.pointsFor,
        pointsAgainst: existing.pointsAgainst + currentStats.pointsAgainst,
        pointsDifference:
          existing.pointsDifference + currentStats.pointsDifference,
        matchesPlayed: existing.matchesPlayed + currentStats.matchesPlayed,
      };
    } else {
      updatedOverallStandings.push(currentStats);
    }
  });

  updatedOverallStandings.sort((a, b) => {
    if (a.pointsDifference !== b.pointsDifference) {
      return b.pointsDifference - a.pointsDifference;
    }
    return b.wins - a.wins;
  });

  return updatedOverallStandings;
}

export function accumulateOverallStandings(
  existingStandings: PlayerStats[],
  players: Player[],
  matches: Match[]
): PlayerStats[] {
  return mergeOverallStandings(
    existingStandings,
    calculatePlayerStats(players, matches)
  );
}

export function resolveView(
  view: View,
  tournamentData: TournamentData | null
): View {
  if (view === "matches" && !tournamentData) {
    return "setup";
  }
  if (view === "results") {
    if (!tournamentData) {
      return "setup";
    }
    if (!tournamentData.results) {
      return "matches";
    }
  }
  return view;
}

export function createTournament(
  players: Player[],
  maxScore: number
): TournamentData {
  return {
    players,
    maxScore,
    matches: generateAmericanoMatches(players),
  };
}

export function finishTournament(
  data: TournamentData,
  results: Match[],
  overallStandings: PlayerStats[]
): {
  tournamentData: TournamentData;
  overallStandings: PlayerStats[];
  view: "results";
} {
  return {
    tournamentData: { ...data, matches: results, results },
    overallStandings: accumulateOverallStandings(
      overallStandings,
      data.players,
      results
    ),
    view: "results",
  };
}

export function playAgain(
  data: TournamentData,
  maxScore: number
): { tournamentData: TournamentData; view: "matches" } {
  return {
    tournamentData: {
      players: data.players,
      maxScore,
      matches: generateAmericanoMatches(data.players),
    },
    view: "matches",
  };
}

export function startNewTournament(): {
  tournamentData: null;
  overallStandings: PlayerStats[];
  view: "setup";
} {
  return {
    tournamentData: null,
    overallStandings: EMPTY_STANDINGS,
    view: "setup",
  };
}

export function isMultiCourt(matches: Match[]): boolean {
  return matches.some((match) => match.court !== undefined);
}

function isPlayer(value: unknown): value is Player {
  if (typeof value !== "object" || value === null) return false;
  const player = value as Record<string, unknown>;
  return typeof player.id === "number" && typeof player.name === "string";
}

function isTeam(value: unknown): value is [Player, Player] {
  return Array.isArray(value) && value.length === 2 && value.every(isPlayer);
}

function isScore(value: unknown): value is MatchScore {
  if (typeof value !== "object" || value === null) return false;
  const score = value as Record<string, unknown>;
  return (
    typeof score.team1Score === "number" &&
    typeof score.team2Score === "number" &&
    (score.winner === "team1" ||
      score.winner === "team2" ||
      score.winner === "tie")
  );
}

function isMatch(value: unknown): value is Match {
  if (typeof value !== "object" || value === null) return false;
  const match = value as Record<string, unknown>;
  if (typeof match.id !== "number" || !isTeam(match.team1) || !isTeam(match.team2)) {
    return false;
  }
  if (match.court !== undefined && typeof match.court !== "number") {
    return false;
  }
  if (match.round !== undefined && typeof match.round !== "number") {
    return false;
  }
  if (match.score !== undefined && !isScore(match.score)) {
    return false;
  }
  return true;
}

function isPlayerStats(value: unknown): value is PlayerStats {
  if (typeof value !== "object" || value === null) return false;
  const stats = value as Record<string, unknown>;
  return (
    isPlayer(stats.player) &&
    typeof stats.wins === "number" &&
    typeof stats.losses === "number" &&
    typeof stats.ties === "number" &&
    typeof stats.pointsFor === "number" &&
    typeof stats.pointsAgainst === "number" &&
    typeof stats.pointsDifference === "number" &&
    typeof stats.matchesPlayed === "number"
  );
}

export function parseView(raw: string): View {
  return VIEWS.includes(raw as View) ? (raw as View) : "setup";
}

export function serializeView(value: View): string {
  return value;
}

export function parseTournamentData(raw: string): TournamentData | null {
  const value = JSON.parse(raw) as unknown;
  if (value === null) return null;
  if (typeof value !== "object") {
    throw new Error("Invalid tournament data");
  }
  const data = value as Record<string, unknown>;
  if (
    !Array.isArray(data.players) ||
    !data.players.every(isPlayer) ||
    typeof data.maxScore !== "number" ||
    !Number.isFinite(data.maxScore) ||
    !Array.isArray(data.matches) ||
    !data.matches.every(isMatch)
  ) {
    throw new Error("Invalid tournament data");
  }
  if (data.results !== undefined) {
    if (!Array.isArray(data.results) || !data.results.every(isMatch)) {
      throw new Error("Invalid tournament data");
    }
  }
  return data as unknown as TournamentData;
}

export function parseOverallStandings(raw: string): PlayerStats[] {
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value) || !value.every(isPlayerStats)) {
    throw new Error("Invalid overall standings");
  }
  return value;
}
