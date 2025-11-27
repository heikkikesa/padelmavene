// Test script to verify 8-player match generation consistently produces 14 matches
// Run with: node test-8-players.mjs

import { generateAmericanoMatches } from "./src/app/utils/matchGeneration.ts";

function runTest() {
  const players = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
  }));

  const matches = generateAmericanoMatches(players);
  return matches.length;
}

console.log("Testing 8-player match generation (100 iterations)...\n");

const results = {};
let totalMatches = 0;

for (let i = 1; i <= 100; i++) {
  const matchCount = runTest(i);
  totalMatches += matchCount;
  results[matchCount] = (results[matchCount] || 0) + 1;

  // Show progress every 10 iterations
  if (i % 10 === 0) {
    process.stdout.write(`Completed ${i}/100 tests...\r`);
  }
}

console.log("\n\nResults:");
console.log("========");
Object.entries(results)
  .sort(([a], [b]) => Number(a) - Number(b))
  .forEach(([matchCount, occurrences]) => {
    const percentage = ((occurrences / 100) * 100).toFixed(1);
    console.log(`${matchCount} matches: ${occurrences} times (${percentage}%)`);
  });

console.log(`\nAverage: ${(totalMatches / 100).toFixed(2)} matches`);
console.log(`Expected: 14 matches every time\n`);

// Check for the bug
if (results["13"]) {
  console.log(
    "⚠️  WARNING: Bug detected! Generated 13 matches in some iterations."
  );
  process.exit(1);
} else if (Object.keys(results).length === 1 && results["14"] === 100) {
  console.log("✅ SUCCESS: All 100 iterations generated exactly 14 matches!");
  process.exit(0);
} else {
  console.log("❌ UNEXPECTED: Match counts vary in unexpected ways.");
  process.exit(1);
}
