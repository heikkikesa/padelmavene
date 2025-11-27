# Bug Fix: 8-Player Match Generation

## Problem

Sometimes when generating matches for 8 players, the algorithm generated 13 matches instead of the expected 14 matches. This happened because:

1. For 8 players with 2 courts, the target is 14 matches (7 rounds × 2 matches per round)
2. Each round should use all 8 players (4 per match × 2 matches)
3. The algorithm would occasionally get "stuck" when generating the second match of a round
4. This occurred when the 4 remaining players in a round could not form teams without creating duplicate partnerships
5. The algorithm would then break out of the round early with only 1 match, resulting in 13 total matches

## Root Cause

The algorithm selected 4 players for the first match of a round without verifying that the remaining 4 players could form a valid second match with unique partnerships. Due to the strict partnership uniqueness constraint (critical for Americano format), certain combinations would leave the remaining 4 players unable to pair up without repeating partnerships.

## Solution

Implemented a look-ahead strategy specifically for 8-player tournaments:

1. **Look-ahead validation**: When selecting players for the first match of a round in 8-player tournaments, verify that the remaining 4 players can form at least one valid team combination with unique partnerships.

2. **Increased attempt limit**: Raised from 200 to 300 attempts to give the algorithm more chances to find valid combinations.

3. **Smarter retry logic**: When very close to the target match count (within 2 matches), continue trying new rounds rather than giving up.

## Changes Made to `matchGeneration.ts`

### 1. Look-ahead Check (lines ~168-189)

```typescript
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
```

### 2. Increased Attempt Limit

Changed from `attempts < 200` to `attempts < 300`

### 3. Extended Max Round Attempts

Changed from `targetRounds + 5` to `targetRounds + 10` to allow more flexibility

### 4. Improved Retry Logic

```typescript
} else if (matches.length >= targetTotalMatches - 2) {
  // If we're very close to target (within 2 matches), try one more time
  continue;
}
```

## Testing

To verify the fix:

1. Start the dev server: `npm run dev`
2. Create multiple tournaments with 8 players
3. Generate matches several times (refresh between tests)
4. Verify that exactly 14 matches are generated every time
5. Check that all partnerships remain unique (no duplicate partnerships)

## Impact

- **Scope**: Only affects 8-player tournaments (look-ahead logic is specific to playerCount === 8 && numCourts === 2)
- **Performance**: Minimal impact; look-ahead check adds negligible overhead for 8-player tournaments
- **Backward Compatibility**: No impact on other player counts (4-7, 9-15+)
- **Tournament Fairness**: Maintains strict partnership uniqueness, ensuring fair Americano format
