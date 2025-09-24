import { Player, Match } from "../types";

// Utility function for shuffling arrays using Fisher-Yates algorithm
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Function to randomize team positions
const randomizeTeam = (team: [Player, Player]): [Player, Player] => {
  return Math.random() < 0.5 ? [team[0], team[1]] : [team[1], team[0]];
};

export const generateAmericanoMatches = (players: Player[]): Match[] => {
  const matches: Match[] = [];
  const playerCount = players.length;

  if (playerCount === 4) {
    // Special case: 4 players = 3 matches (everyone plays with everyone)
    const combinations = [
      { team1: [players[0], players[1]], team2: [players[2], players[3]] },
      { team1: [players[0], players[2]], team2: [players[1], players[3]] },
      { team1: [players[0], players[3]], team2: [players[1], players[2]] },
    ];

    // Shuffle the order of matches
    const shuffledCombinations = shuffleArray(combinations);

    shuffledCombinations.forEach((combo, index) => {
      // Randomly shuffle player positions within each team
      const randomizedTeam1 = randomizeTeam(combo.team1 as [Player, Player]);
      const randomizedTeam2 = randomizeTeam(combo.team2 as [Player, Player]);

      // Randomly decide which team goes left/right
      const shouldSwapTeams = Math.random() < 0.5;

      matches.push({
        id: index + 1,
        team1: shouldSwapTeams ? randomizedTeam2 : randomizedTeam1,
        team2: shouldSwapTeams ? randomizedTeam1 : randomizedTeam2,
      });
    });
  } else {
    // For 5, 6, 7 players: generate as many matches as players
    const matchData = [];

    for (let matchId = 1; matchId <= playerCount; matchId++) {
      // Create a shuffled copy of players for each match
      const shuffledPlayers = shuffleArray(players);

      // Take first 4 players for the match, others sit out
      const team1: [Player, Player] = randomizeTeam([
        shuffledPlayers[0],
        shuffledPlayers[1],
      ]);
      const team2: [Player, Player] = randomizeTeam([
        shuffledPlayers[2],
        shuffledPlayers[3],
      ]);

      matchData.push({ team1, team2 });
    }

    // Shuffle the order of matches
    const shuffledMatches = shuffleArray(matchData);

    shuffledMatches.forEach((match, index) => {
      // Randomly decide which team goes left/right
      const shouldSwapTeams = Math.random() < 0.5;

      matches.push({
        id: index + 1,
        team1: shouldSwapTeams ? match.team2 : match.team1,
        team2: shouldSwapTeams ? match.team1 : match.team2,
      });
    });
  }

  return matches;
};
