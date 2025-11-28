# 8-Player Multi-Court Schedule

## Overview

Multi-court play is now limited to the 8-player static schedule. All other player counts (4–7) use a single court and sequential matches. Dynamic scaling beyond 8 players has been removed.

## Static 8-Player Structure

- Rounds: 7
- Courts: 2 (simultaneous matches)
- Total Matches: 14
- Format: Each partnership appears exactly once; comprehensive rotation.

| Round | Court 1        | Court 2        |
| ----- | -------------- | -------------- |
| 1     | (0,1) vs (2,3) | (4,5) vs (6,7) |
| 2     | (0,2) vs (4,6) | (1,7) vs (3,5) |
| 3     | (0,3) vs (5,6) | (1,4) vs (2,7) |
| 4     | (0,4) vs (3,7) | (1,5) vs (2,6) |
| 5     | (0,5) vs (2,4) | (1,6) vs (3,7) |
| 6     | (0,6) vs (1,2) | (3,4) vs (5,7) |
| 7     | (0,7) vs (1,3) | (2,5) vs (4,6) |

Indexes correspond to zero-based positions in the players array; the app maps them to actual player objects.

## Implementation Notes

- Source file: `src/app/utils/pairing-list.json` (template key `"8"`).
- Lookup only; no randomization of teams or side swapping.
- Match IDs increment sequentially across rounds.
- UI groups matches by `round` and displays `court` when present.

## Rationale for Static Replacement

The previous algorithm introduced complexity (attempt loops, duplication checks, look-ahead logic) and occasional edge issues. A curated static schedule guarantees deterministic fairness and eliminates generation bugs.

## Adding Future Multi-Court Templates

1. Extend `pairing-list.json` with a new key (e.g. `"9"`).
2. Provide `rounds`, `court` per match, and partner coverage comment.
3. Ensure `matchGeneration.ts` still enforces supported range (would need widening).
4. Update README & instructions accordingly.

Until such templates are added, only 8-player tournaments use two courts.
