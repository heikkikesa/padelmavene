// Simple test to verify match generation counts
// Run with: node test-match-counts.mjs

const expectedCounts = {
  8: 14,
  9: 18,
  10: 22,
  11: 27,
  12: 33,
  13: 39,
  14: 45,
  15: 45,
};

console.log("Expected Match Counts:");
console.log("======================\n");

for (const [players, matches] of Object.entries(expectedCounts)) {
  const courts =
    players <= 7
      ? 1
      : players <= 11
      ? 2
      : players <= 15
      ? 3
      : Math.ceil(players / 4);
  const matchesPerPlayer = (matches * 4) / players;
  const rounds = Math.ceil(matches / courts);

  console.log(`${players} players:`);
  console.log(`  - Total matches: ${matches}`);
  console.log(`  - Courts: ${courts}`);
  console.log(`  - Rounds: ${rounds}`);
  console.log(`  - Matches per player: ${matchesPerPlayer.toFixed(1)}`);
  console.log("");
}

console.log("\nTo verify in the app:");
console.log("1. Run: npm run dev");
console.log("2. Select a player count (8-15)");
console.log(
  '3. Check that the "Start Tournament" button shows the correct match count'
);
console.log(
  "4. Start the tournament and verify the actual number of generated matches"
);
