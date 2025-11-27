# Multi-Court Tournament Implementation

## Overview

This document describes the implementation of multi-court support for Padelmavene, enabling tournaments with 8-15 players (and extensible beyond).

## Key Features

### Automatic Court Allocation

- **8-11 players**: 2 courts
- **12-15 players**: 3 courts
- **16+ players**: Automatically scales using `Math.ceil(playerCount / 4)`

### Round-Based Play

- Matches organized into rounds
- Multiple matches happen simultaneously on different courts
- Each round shows court assignments clearly

### Smart Pairing Algorithm

The multi-court algorithm ensures:

1. **New Partnerships Priority**: Players partner with different people each round when possible
2. **Varied Oppositions**: Players face different opponents across rounds
3. **Balanced Participation**: All players get approximately equal match time
4. **Fair Rotation**: Smart scheduling across courts
5. **Specific Match Counts**: Generates exact match counts per player count:
   - 8 players: 14 matches (7 per player)
   - 9 players: 18 matches (8 per player)
   - 10 players: 22 matches (8.8 per player avg)
   - 11 players: 27 matches (9.8 per player avg)
   - 12 players: 33 matches (11 per player)
   - 13 players: 39 matches (12 per player)
   - 14 players: 45 matches (12.9 per player avg)
   - 15 players: 45 matches (12 per player, limited)

## Implementation Details

### Type Changes (`src/app/types.ts`)

```typescript
export interface Match {
  id: number;
  team1: [Player, Player];
  team2: [Player, Player];
  court?: number;  // NEW: Court assignment
  round?: number;  // NEW: Round number
  score?: { ... };
}
```

### Match Generation (`src/app/utils/matchGeneration.ts`)

#### New Function: `generateMultiCourtMatches()`

This function handles 8+ player tournaments:

1. **Target Match Calculation**: Uses specific match counts per player count
   - Switch statement ensures exact counts (14/18/22/27/33/39/45 matches)
   - 15 players limited to 45 matches to prevent excessive play
   - Larger tournaments use scaled formula with 60-match cap
2. **Court Calculation**: `Math.ceil(playerCount / 4)` determines courts needed
3. **Round Generation**: Creates rounds until target match count reached
4. **Pairing Tracking**: Maintains maps of partnerships and oppositions
5. **Smart Selection**:
   - Prioritizes players with fewer matches
   - Avoids duplicate partnerships when possible
   - Minimizes repeat oppositions
   - Gracefully degrades if constraints can't be met
   - Stops when target match count is reached

#### Algorithm Flow

```
Calculate target match count based on player count
Calculate number of rounds needed (target matches / courts)

For each round (until target match count reached):
  1. Sort players by match count (ascending)
  2. For each court (stop if target reached):
     a. Select 4 available players
     b. Try different team combinations
     c. Prefer new partnerships/oppositions
     d. Accept repeats if no alternatives
     e. Update tracking maps
  3. Add completed round matches
  4. Continue until target match count achieved
```

### UI Changes

#### TournamentSetup (`src/app/components/TournamentSetup.tsx`)

- Extended player count selection from 4-7 to 4-15
- Added two rows of buttons for better layout
- Start button shows court count for 8+ players
- Validation updated to accept 4-15 players

#### MatchesList (`src/app/components/MatchesList.tsx`)

- Detects multi-court tournaments via `court` property
- Groups matches by round number
- Displays round headers with completion status
- Shows court badges on each match
- Maintains single-court display for 4-7 players

### Display Example

**Multi-Court Tournament (10 players):**

```
Round 1 (2 / 2 completed)
  Match 1 [Court 1]: Alice & Bob vs Carol & Dave
  Match 2 [Court 2]: Eve & Frank vs Grace & Henry

Round 2 (1 / 2 completed)
  Match 3 [Court 1]: Alice & Carol vs Eve & Grace
  Match 4 [Court 2]: Bob & Frank vs Dave & Henry
```

## Testing

### Manual Testing Steps

1. Start dev server: `npm run dev`
2. Select 8-15 players
3. Enter player names
4. Verify button shows court count
5. Start tournament
6. Check matches are grouped by rounds
7. Verify court assignments are visible
8. Enter scores and verify standings update correctly

### Validation Points

- [ ] All players get approximately equal matches
- [ ] Partnerships rarely repeat
- [ ] Oppositions vary across rounds
- [ ] Court badges display correctly
- [ ] Round grouping is clear
- [ ] Score entry works for multi-court matches
- [ ] Standings calculate correctly

## Algorithm Complexity

### Time Complexity

- **Best case**: O(R × C × P) where R=rounds, C=courts, P=players
- **Worst case**: O(R × C × P × A) where A=max attempts per court

### Space Complexity

- O(P²) for partnership and opposition tracking maps
- O(M) for match storage where M = total matches

## Future Enhancements

### Potential Improvements

1. **Dynamic Round Sizing**: Adjust courts per round based on fatigue
2. **Rest Rotation**: Track rest periods and balance them
3. **Skill Balancing**: Optional skill-based team balancing
4. **Court Preferences**: Allow players to prefer certain courts
5. **Match History**: Show partnership/opposition history per player
6. **Export Schedule**: Generate printable tournament brackets

### Scalability

The algorithm is designed to scale beyond 15 players:

- Court calculation: `Math.ceil(playerCount / 4)`
- No hard limits in the algorithm
- UI automatically adapts to any round count
- Could support 20, 24, 28+ players without code changes

## Performance Considerations

### Optimization Strategies

1. **Early Termination**: Accepts repeats after attempts threshold
2. **Smart Selection**: Prioritizes least-played players first
3. **Randomization**: Breaks ties efficiently with Fisher-Yates shuffle
4. **Map-Based Tracking**: O(1) lookups for pair history

### Potential Bottlenecks

- Very large player counts (32+) may need more attempts
- Complex constraint satisfaction could be slow
- Consider caching or pre-computation for very large tournaments

## Known Limitations

1. **Minimum Players**: Still requires 4 players (1 match = 4 people)
2. **Odd Numbers**: Some players may get slightly more/fewer matches
3. **Constraint Conflicts**: Rare cases where perfect rotation isn't possible
4. **No Skill Levels**: Algorithm doesn't consider player skill differences

## Conclusion

The multi-court implementation successfully extends Padelmavene to support larger tournaments while maintaining the core Americano principles. The algorithm is efficient, extensible, and provides a fair tournament experience for all participants.
