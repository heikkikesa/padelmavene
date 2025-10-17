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

// Helper function to create a unique key for a pair of players
const createPairKey = (player1: Player, player2: Player): string => {
  const ids = [player1.id, player2.id].sort();
  return `${ids[0]}-${ids[1]}`;
};

// Helper function to check if a match uses unique pairs
const hasUniquePairs = (
  team1: [Player, Player],
  team2: [Player, Player],
  usedPairs: Set<string>
): boolean => {
  const pair1Key = createPairKey(team1[0], team1[1]);
  const pair2Key = createPairKey(team2[0], team2[1]);

  return !usedPairs.has(pair1Key) && !usedPairs.has(pair2Key);
};

// Helper function to get all possible team combinations for 4 players
const getTeamCombinations = (
  fourPlayers: Player[]
): Array<{ team1: [Player, Player]; team2: [Player, Player] }> => {
  const [p1, p2, p3, p4] = fourPlayers;

  return [
    { team1: [p1, p2], team2: [p3, p4] },
    { team1: [p1, p3], team2: [p2, p4] },
    { team1: [p1, p4], team2: [p2, p3] },
  ];
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
    // For 5+ players: generate matches ensuring unique pairs
    const usedPairs = new Set<string>();
    const playerMatchCounts = new Map<number, number>();

    // Initialize match counts for each player
    players.forEach((player) => {
      playerMatchCounts.set(player.id, 0);
    });

    const maxAttempts = 1000; // Prevent infinite loops
    let attempts = 0;

    // Generate as many matches as players, ensuring unique pairs
    for (
      let matchId = 1;
      matchId <= playerCount && attempts < maxAttempts;
      matchId++
    ) {
      let validMatchFound = false;
      let currentAttempts = 0;
      const maxCurrentAttempts = 100;

      while (!validMatchFound && currentAttempts < maxCurrentAttempts) {
        attempts++;
        currentAttempts++;

        // Create a shuffled copy of players
        const shuffledPlayers = shuffleArray(players);

        // Sort players by how many matches they've played (ascending)
        // This helps balance participation
        shuffledPlayers.sort((a, b) => {
          const aCount = playerMatchCounts.get(a.id) || 0;
          const bCount = playerMatchCounts.get(b.id) || 0;
          return aCount - bCount;
        });

        // Take first 4 players (those who have played the least)
        const fourPlayers = shuffledPlayers.slice(0, 4);

        // Try all possible team combinations for these 4 players
        const teamCombinations = getTeamCombinations(fourPlayers);
        const shuffledCombinations = shuffleArray(teamCombinations);

        for (const combo of shuffledCombinations) {
          if (hasUniquePairs(combo.team1, combo.team2, usedPairs)) {
            // Found a valid combination with unique pairs
            const pair1Key = createPairKey(combo.team1[0], combo.team1[1]);
            const pair2Key = createPairKey(combo.team2[0], combo.team2[1]);

            // Mark these pairs as used
            usedPairs.add(pair1Key);
            usedPairs.add(pair2Key);

            // Update match counts for players
            fourPlayers.forEach((player) => {
              const currentCount = playerMatchCounts.get(player.id) || 0;
              playerMatchCounts.set(player.id, currentCount + 1);
            });

            // Randomly shuffle player positions within each team
            const randomizedTeam1 = randomizeTeam(combo.team1);
            const randomizedTeam2 = randomizeTeam(combo.team2);

            // Randomly decide which team goes left/right
            const shouldSwapTeams = Math.random() < 0.5;

            matches.push({
              id: matchId,
              team1: shouldSwapTeams ? randomizedTeam2 : randomizedTeam1,
              team2: shouldSwapTeams ? randomizedTeam1 : randomizedTeam2,
            });

            validMatchFound = true;
            break;
          }
        }
      }

      // If we couldn't find a valid match with unique pairs after many attempts,
      // it means we've exhausted most unique combinations
      if (!validMatchFound) {
        console.warn(
          `Could not generate match ${matchId} with unique pairs after ${currentAttempts} attempts`
        );
        break;
      }
    }

    // If we have fewer matches than players due to unique pair constraints,
    // that's okay - we've maximized unique combinations
    console.log(
      `Generated ${matches.length} matches for ${playerCount} players with unique pairs`
    );
  }

  return matches;
};
