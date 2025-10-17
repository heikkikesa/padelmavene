import { generateAmericanoMatches } from "./src/app/utils/matchGeneration.js";

// Test function to verify unique pairs
function testUniquePairs() {
  console.log("Testing match generation with unique pairs...\n");

  // Test with 5 players
  const fivePlayers = [
    { id: 1, name: "Player 1" },
    { id: 2, name: "Player 2" },
    { id: 3, name: "Player 3" },
    { id: 4, name: "Player 4" },
    { id: 5, name: "Player 5" },
  ];

  console.log("=== Testing with 5 players ===");
  const fivePlayerMatches = generateAmericanoMatches(fivePlayers);

  console.log(`Generated ${fivePlayerMatches.length} matches:`);

  const usedPairs = new Set();
  let duplicatesFound = 0;

  fivePlayerMatches.forEach((match, index) => {
    console.log(
      `Match ${match.id}: [${match.team1[0].name}, ${match.team1[1].name}] vs [${match.team2[0].name}, ${match.team2[1].name}]`
    );

    // Check for duplicate pairs
    const pair1Key = [match.team1[0].id, match.team1[1].id].sort().join("-");
    const pair2Key = [match.team2[0].id, match.team2[1].id].sort().join("-");

    if (usedPairs.has(pair1Key)) {
      console.log(
        `  ❌ DUPLICATE PAIR: ${match.team1[0].name} & ${match.team1[1].name}`
      );
      duplicatesFound++;
    }
    if (usedPairs.has(pair2Key)) {
      console.log(
        `  ❌ DUPLICATE PAIR: ${match.team2[0].name} & ${match.team2[1].name}`
      );
      duplicatesFound++;
    }

    usedPairs.add(pair1Key);
    usedPairs.add(pair2Key);
  });

  console.log(
    `\nResult: ${
      duplicatesFound === 0
        ? "✅ No duplicate pairs found!"
        : `❌ Found ${duplicatesFound} duplicate pairs`
    }\n`
  );

  // Test with 6 players
  const sixPlayers = [...fivePlayers, { id: 6, name: "Player 6" }];

  console.log("=== Testing with 6 players ===");
  const sixPlayerMatches = generateAmericanoMatches(sixPlayers);

  console.log(`Generated ${sixPlayerMatches.length} matches:`);

  const usedPairs6 = new Set();
  let duplicatesFound6 = 0;

  sixPlayerMatches.forEach((match, index) => {
    console.log(
      `Match ${match.id}: [${match.team1[0].name}, ${match.team1[1].name}] vs [${match.team2[0].name}, ${match.team2[1].name}]`
    );

    // Check for duplicate pairs
    const pair1Key = [match.team1[0].id, match.team1[1].id].sort().join("-");
    const pair2Key = [match.team2[0].id, match.team2[1].id].sort().join("-");

    if (usedPairs6.has(pair1Key)) {
      console.log(
        `  ❌ DUPLICATE PAIR: ${match.team1[0].name} & ${match.team1[1].name}`
      );
      duplicatesFound6++;
    }
    if (usedPairs6.has(pair2Key)) {
      console.log(
        `  ❌ DUPLICATE PAIR: ${match.team2[0].name} & ${match.team2[1].name}`
      );
      duplicatesFound6++;
    }

    usedPairs6.add(pair1Key);
    usedPairs6.add(pair2Key);
  });

  console.log(
    `\nResult: ${
      duplicatesFound6 === 0
        ? "✅ No duplicate pairs found!"
        : `❌ Found ${duplicatesFound6} duplicate pairs`
    }\n`
  );
}

// Run the test
testUniquePairs();
