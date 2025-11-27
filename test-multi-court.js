// Test script for multi-court match generation
// Run with: node test-multi-court.js

function createPairKey(id1, id2) {
  return [id1, id2].sort().join("-");
}

function analyzeTournament(players, matches) {
  console.log(`\n=== Tournament Analysis for ${players.length} Players ===`);
  console.log(`Total matches: ${matches.length}`);

  // Get court and round info
  const courts = [...new Set(matches.map((m) => m.court).filter(Boolean))];
  const rounds = [...new Set(matches.map((m) => m.round).filter(Boolean))];

  if (courts.length > 0) {
    console.log(`Courts: ${courts.length}`);
    console.log(`Rounds: ${rounds.length}`);
  }

  // Count player participations
  const playerMatches = {};
  players.forEach((p) => {
    playerMatches[p.id] = 0;
  });

  matches.forEach((match) => {
    match.team1.forEach((p) => playerMatches[p.id]++);
    match.team2.forEach((p) => playerMatches[p.id]++);
  });

  console.log("\nPlayer Participations:");
  Object.entries(playerMatches).forEach(([id, count]) => {
    const player = players.find((p) => p.id === Number(id));
    console.log(`  ${player.name}: ${count} matches`);
  });

  // Count partnerships
  const partnerships = {};
  matches.forEach((match) => {
    const team1Key = createPairKey(match.team1[0].id, match.team1[1].id);
    const team2Key = createPairKey(match.team2[0].id, match.team2[1].id);
    partnerships[team1Key] = (partnerships[team1Key] || 0) + 1;
    partnerships[team2Key] = (partnerships[team2Key] || 0) + 1;
  });

  const duplicatePartnerships = Object.entries(partnerships).filter(
    ([_, count]) => count > 1
  );
  console.log(
    `\nTotal unique partnerships: ${Object.keys(partnerships).length}`
  );
  console.log(`Duplicate partnerships: ${duplicatePartnerships.length}`);
  if (duplicatePartnerships.length > 0 && duplicatePartnerships.length <= 5) {
    duplicatePartnerships.forEach(([pair, count]) => {
      const [id1, id2] = pair.split("-").map(Number);
      const p1 = players.find((p) => p.id === id1);
      const p2 = players.find((p) => p.id === id2);
      console.log(`  ${p1.name} & ${p2.name}: ${count} times`);
    });
  }

  // Count oppositions
  const oppositions = {};
  matches.forEach((match) => {
    const team1 = match.team1;
    const team2 = match.team2;
    team1.forEach((p1) => {
      team2.forEach((p2) => {
        const key = createPairKey(p1.id, p2.id);
        oppositions[key] = (oppositions[key] || 0) + 1;
      });
    });
  });

  const duplicateOppositions = Object.entries(oppositions).filter(
    ([_, count]) => count > 1
  );
  console.log(`\nTotal unique oppositions: ${Object.keys(oppositions).length}`);
  console.log(`Duplicate oppositions: ${duplicateOppositions.length}`);
  if (duplicateOppositions.length > 0 && duplicateOppositions.length <= 5) {
    duplicateOppositions.forEach(([pair, count]) => {
      const [id1, id2] = pair.split("-").map(Number);
      const p1 = players.find((p) => p.id === id1);
      const p2 = players.find((p) => p.id === id2);
      console.log(`  ${p1.name} vs ${p2.name}: ${count} times`);
    });
  }

  // Show matches by round for multi-court
  if (rounds.length > 0) {
    console.log("\nMatches by Round:");
    rounds
      .sort((a, b) => a - b)
      .forEach((round) => {
        const roundMatches = matches.filter((m) => m.round === round);
        console.log(`\n  Round ${round} (${roundMatches.length} matches):`);
        roundMatches
          .sort((a, b) => (a.court || 0) - (b.court || 0))
          .forEach((match) => {
            const court = match.court || "?";
            const t1 = `${match.team1[0].name} & ${match.team1[1].name}`;
            const t2 = `${match.team2[0].name} & ${match.team2[1].name}`;
            console.log(`    Court ${court}: ${t1} vs ${t2}`);
          });
      });
  }
}

// Test different player counts
function testPlayerCount(count) {
  const players = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
  }));

  // We need to import the actual generation function
  // For now, just create a placeholder
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing with ${count} players would generate matches here`);
  console.log(
    `Expected courts: ${
      count <= 7 ? 1 : count <= 11 ? 2 : count <= 15 ? 3 : Math.ceil(count / 4)
    }`
  );
}

console.log("Multi-Court Tournament Test");
console.log("============================\n");
console.log("This script shows expected behavior for multi-court tournaments.");
console.log("Run the actual app to see real match generation.\n");

[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(testPlayerCount);

console.log("\n\nTo test in the app:");
console.log("1. Run: npm run dev");
console.log("2. Select 8-15 players");
console.log("3. Check that matches are grouped by rounds");
console.log("4. Verify court assignments are shown");
console.log("5. Confirm players rotate partners and opponents\n");
