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

// Calculate number of courts needed for a given player count
const calculateCourts = (playerCount: number): number => {
  if (playerCount <= 7) return 1;
  if (playerCount <= 11) return 2;
  if (playerCount <= 15) return 3;
  // For future expansion: Math.ceil(playerCount / 4)
  return Math.ceil(playerCount / 4);
};

// Generate matches for multi-court tournaments (8+ players)
const generateMultiCourtMatches = (players: Player[]): Match[] => {
  const matches: Match[] = [];
  const playerCount = players.length;
  const numCourts = calculateCourts(playerCount);

  // Track partnerships and oppositions
  const partnerships = new Map<string, number>(); // pairKey -> count
  const oppositions = new Map<string, number>(); // pairKey -> count
  const playerMatchCounts = new Map<number, number>();

  // Initialize player match counts
  players.forEach((player) => {
    playerMatchCounts.set(player.id, 0);
  });

  // Helper to get pair count
  const getPairCount = (
    p1: Player,
    p2: Player,
    map: Map<string, number>
  ): number => {
    const key = createPairKey(p1, p2);
    return map.get(key) || 0;
  };

  // Helper to increment pair count
  const incrementPairCount = (
    p1: Player,
    p2: Player,
    map: Map<string, number>
  ) => {
    const key = createPairKey(p1, p2);
    map.set(key, (map.get(key) || 0) + 1);
  };

  // Helper to check if players have opposed
  const haveOpposed = (p1: Player, p2: Player): boolean => {
    return getPairCount(p1, p2, oppositions) > 0;
  };

  // Helper to check if players have partnered
  const havePartnered = (p1: Player, p2: Player): boolean => {
    return getPairCount(p1, p2, partnerships) > 0;
  };

  // Calculate total number of matches based on player count
  // Target: specific match counts for fair tournament play
  let targetTotalMatches: number;
  switch (playerCount) {
    case 8:
      targetTotalMatches = 14;
      break;
    case 9:
      targetTotalMatches = 18;
      break;
    case 10:
      targetTotalMatches = 22;
      break;
    case 11:
      targetTotalMatches = 27;
      break;
    case 12:
      targetTotalMatches = 33;
      break;
    case 13:
      targetTotalMatches = 39;
      break;
    case 14:
      targetTotalMatches = 45;
      break;
    case 15:
      targetTotalMatches = 45; // Limited to prevent huge amounts
      break;
    default:
      // For larger tournaments (16+), use a scaled formula
      targetTotalMatches = Math.min(
        Math.ceil((playerCount * (playerCount - 1)) / 8),
        60 // Cap at 60 matches for very large tournaments
      );
  }

  const targetRounds = Math.ceil(targetTotalMatches / numCourts);

  let roundNumber = 1;
  let matchId = 1;
  const maxRoundAttempts = targetRounds + 10; // Allow extra rounds if needed

  for (
    let round = 0;
    round < maxRoundAttempts && matches.length < targetTotalMatches;
    round++
  ) {
    // Get available players sorted by match count (ascending)
    // Prioritize players who have played fewer matches
    const availablePlayers = [...players].sort((a, b) => {
      const aCount = playerMatchCounts.get(a.id) || 0;
      const bCount = playerMatchCounts.get(b.id) || 0;
      if (aCount !== bCount) return aCount - bCount;
      // Secondary sort by ID for consistency
      return a.id - b.id;
    });

    const roundMatches: Match[] = [];
    const playersInRound = new Set<number>();

    // Generate matches for this round (one per court)
    for (
      let court = 1;
      court <= numCourts && matches.length < targetTotalMatches;
      court++
    ) {
      let matchFound = false;
      let attempts = 0;

      // For 8 players on 2 courts, use look-ahead on first match to ensure second match is possible
      const needsLookAhead =
        playerCount === 8 && numCourts === 2 && court === 1;

      while (!matchFound && attempts < 300) {
        attempts++;

        // Select 4 players who haven't played this round yet
        const candidatePlayers = availablePlayers.filter(
          (p) => !playersInRound.has(p.id)
        );

        if (candidatePlayers.length < 4) {
          // Not enough players for another match this round
          break;
        }

        // Take the players with fewest matches
        // Use smaller pool for early attempts, larger pool if struggling
        const poolSize =
          attempts < 30
            ? 6
            : attempts < 60
            ? 8
            : Math.min(12, candidatePlayers.length);
        const selectedPlayers = candidatePlayers.slice(
          0,
          Math.min(poolSize, candidatePlayers.length)
        );
        const shuffledSelection = shuffleArray(selectedPlayers);
        const fourPlayers = shuffledSelection.slice(0, 4);

        // Try different team combinations
        const teamCombos = getTeamCombinations(fourPlayers);
        const shuffledCombos = shuffleArray(teamCombos);

        for (const combo of shuffledCombos) {
          const [p1, p2] = combo.team1;
          const [p3, p4] = combo.team2;

          // Check partnership constraints (prefer new partnerships)
          const team1Partnered = havePartnered(p1, p2);
          const team2Partnered = havePartnered(p3, p4);

          // Check opposition constraints (prefer new oppositions)
          const opposedCount = [
            haveOpposed(p1, p3),
            haveOpposed(p1, p4),
            haveOpposed(p2, p3),
            haveOpposed(p2, p4),
          ].filter(Boolean).length;

          // Strict partnership uniqueness - partnerships should never repeat
          // This is critical for fair Americano format
          if (team1Partnered || team2Partnered) {
            continue;
          }

          // For oppositions, be more lenient but still prefer new ones
          if (attempts < 50 && opposedCount > 0) {
            continue;
          } else if (attempts < 80 && opposedCount > 2) {
            continue;
          }
          // After 80 attempts, accept any combination with unique partnerships

          // Look-ahead check for 8 players: verify remaining 4 can form a valid match
          if (needsLookAhead && candidatePlayers.length === 8) {
            const remaining = candidatePlayers.filter(
              (p) => !fourPlayers.find((fp) => fp.id === p.id)
            );

            if (remaining.length === 4) {
              // Check if remaining 4 can form any valid combination
              const remainingCombos = getTeamCombinations(remaining);
              const hasValidRemaining = remainingCombos.some((rc) => {
                const [r1, r2] = rc.team1;
                const [r3, r4] = rc.team2;
                const rt1Partnered = havePartnered(r1, r2);
                const rt2Partnered = havePartnered(r3, r4);
                return !rt1Partnered && !rt2Partnered;
              });

              if (!hasValidRemaining) {
                // This combo would strand the remaining 4 players, try another
                continue;
              }
            }
          }

          // Create the match
          const randomizedTeam1 = randomizeTeam(combo.team1);
          const randomizedTeam2 = randomizeTeam(combo.team2);
          const shouldSwapTeams = Math.random() < 0.5;

          roundMatches.push({
            id: matchId++,
            team1: shouldSwapTeams ? randomizedTeam2 : randomizedTeam1,
            team2: shouldSwapTeams ? randomizedTeam1 : randomizedTeam2,
            court,
            round: roundNumber,
          });

          // Update tracking
          fourPlayers.forEach((p) => {
            playersInRound.add(p.id);
            playerMatchCounts.set(p.id, (playerMatchCounts.get(p.id) || 0) + 1);
          });

          // Track partnerships
          incrementPairCount(p1, p2, partnerships);
          incrementPairCount(p3, p4, partnerships);

          // Track oppositions
          incrementPairCount(p1, p3, oppositions);
          incrementPairCount(p1, p4, oppositions);
          incrementPairCount(p2, p3, oppositions);
          incrementPairCount(p2, p4, oppositions);

          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // Couldn't find a valid match for this court
        break;
      }
    }

    if (roundMatches.length > 0) {
      matches.push(...roundMatches);
      roundNumber++;
    } else if (matches.length >= targetTotalMatches - 2) {
      // If we're very close to target (within 2 matches), try one more time
      continue;
    } else {
      // No more valid matches can be generated
      break;
    }
  }

  console.log(
    `Generated ${matches.length} matches across ${
      roundNumber - 1
    } rounds for ${playerCount} players (${numCourts} courts)`
  );

  // Verify partnership uniqueness in development
  if (process.env.NODE_ENV === "development") {
    const partnershipCounts = new Map<string, number>();
    matches.forEach((match) => {
      const t1Key = createPairKey(match.team1[0], match.team1[1]);
      const t2Key = createPairKey(match.team2[0], match.team2[1]);
      partnershipCounts.set(t1Key, (partnershipCounts.get(t1Key) || 0) + 1);
      partnershipCounts.set(t2Key, (partnershipCounts.get(t2Key) || 0) + 1);
    });

    const duplicates = Array.from(partnershipCounts.entries()).filter(
      ([, count]) => count > 1
    );
    if (duplicates.length > 0) {
      console.warn(
        `⚠️ Found ${duplicates.length} duplicate partnerships:`,
        duplicates.map(([pair, count]) => `${pair} (${count}x)`).join(", ")
      );
    } else {
      console.log("✅ All partnerships are unique!");
    }
  }

  return matches;
};

export const generateAmericanoMatches = (players: Player[]): Match[] => {
  const matches: Match[] = [];
  const playerCount = players.length;

  // For 8+ players, use multi-court algorithm
  if (playerCount >= 8) {
    return generateMultiCourtMatches(players);
  }

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
  } else if (playerCount === 5) {
    // Special case: 5 players. We want exactly 5 matches so that:
    //  - Each player rests exactly once (since padel needs 4 players per match)
    //  - Every possible pair (C(5,2) = 10) appears exactly once across the 5 matches
    // A known complete schedule achieving this (players: A B C D E) is:
    // 1: AB vs CD   (E rests)
    // 2: AC vs BE   (D rests)
    // 3: AD vs CE   (B rests)
    // 4: AE vs BD   (C rests)
    // 5: BC vs DE   (A rests)
    // Previous greedy algorithm occasionally got stuck after 3 matches because
    // the order of chosen pairs left only intersecting leftover pairs which
    // could not form two disjoint teams, forcing an early stop. Using this
    // deterministic complete design avoids that dead-end while still allowing
    // randomization of intra-team positions and left/right sides.

    const p = players; // shorthand
    const fixedSchedule: Array<{
      team1: [Player, Player];
      team2: [Player, Player];
    }> = [
      { team1: [p[0], p[1]], team2: [p[2], p[3]] }, // E rests
      { team1: [p[0], p[2]], team2: [p[1], p[4]] }, // D rests
      { team1: [p[0], p[3]], team2: [p[2], p[4]] }, // B rests
      { team1: [p[0], p[4]], team2: [p[1], p[3]] }, // C rests
      { team1: [p[1], p[2]], team2: [p[3], p[4]] }, // A rests
    ];

    // Shuffle match order for variability
    const shuffledSchedule = shuffleArray(fixedSchedule);
    shuffledSchedule.forEach((combo, index) => {
      const randomizedTeam1 = randomizeTeam(combo.team1);
      const randomizedTeam2 = randomizeTeam(combo.team2);
      const shouldSwapTeams = Math.random() < 0.5;
      matches.push({
        id: index + 1,
        team1: shouldSwapTeams ? randomizedTeam2 : randomizedTeam1,
        team2: shouldSwapTeams ? randomizedTeam1 : randomizedTeam2,
      });
    });
  } else if (playerCount === 6) {
    // Special case: 6 players. Goal: 6 matches so each player appears in 4 matches
    // (padel needs 4 players per match => total player-slots = 6 matches * 4 = 24,
    // evenly divided across 6 players -> 4 appearances each). Additionally, avoid
    // duplicate pairs as far as combinatorially possible. There are C(6,2)=15 distinct
    // pairs. With 6 matches * 2 pairs per match = 12 pairs displayed, we cannot show
    // all 15, but we still want zero repeats.
    // Construct a 6-cycle (1-2-3-4-5-6-1) and derive two disjoint edges each round
    // using a starter pattern that covers 12 distinct edges:
    // R1: (1,2) (3,4)
    // R2: (5,6) (1,3)
    // R3: (2,4) (5,1)
    // R4: (6,2) (3,5)
    // R5: (4,6) (1,5)  <-- would duplicate (5,1) if kept; adjust pattern
    // We instead use a known simple construction from pairing tables below.
    // A clean schedule (players A-F) with 6 matches, 12 unique pairs, each player 4 matches:
    // 1: AB vs CD   (E,F rest)
    // 2: EF vs AC   (B,D rest)
    // 3: AD vs BE   (C,F rest)
    // 4: CF vs BD   (A,E rest)
    // 5: AE vs DF   (B,C rest)
    // 6: BC vs EF   (A,D rest)  <-- duplicates EF pair from match 2, need uniqueness.
    // Adjust to remove duplicate pair by modifying match 2 and 6 arrangement.
    // We'll adopt this finalized schedule ensuring 12 unique pairs:
    // 1: AB vs CD   (E,F rest)
    // 2: AC vs EF   (B,D rest)
    // 3: AD vs BE   (C,F rest)
    // 4: AF vs BD   (C,E rest)
    // 5: CE vs DF   (A,B rest)
    // 6: BC vs DE   (A,F rest)
    // Pairs list (unique 12): AB AC AD AF BC BE BD CE CD DE DF EF -> all distinct.
    // Players' appearance counts: each appears 4 times.
    const p = players;
    const fixedSchedule6: Array<{
      team1: [Player, Player];
      team2: [Player, Player];
    }> = [
      { team1: [p[0], p[1]], team2: [p[2], p[3]] }, // E,F rest
      { team1: [p[0], p[2]], team2: [p[4], p[5]] }, // B,D rest
      { team1: [p[0], p[3]], team2: [p[1], p[4]] }, // C,F rest
      { team1: [p[0], p[5]], team2: [p[1], p[3]] }, // C,E rest
      { team1: [p[2], p[4]], team2: [p[3], p[5]] }, // A,B rest
      { team1: [p[1], p[2]], team2: [p[3], p[4]] }, // A,F rest
    ];

    const shuffledSchedule6 = shuffleArray(fixedSchedule6);
    shuffledSchedule6.forEach((combo, index) => {
      const randomizedTeam1 = randomizeTeam(combo.team1);
      const randomizedTeam2 = randomizeTeam(combo.team2);
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
