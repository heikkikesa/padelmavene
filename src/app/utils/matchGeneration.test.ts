import { describe, expect, it } from "vitest";
import { generateAmericanoMatches, getScheduleInfo } from "./matchGeneration";
import type { Player } from "../types";
import scheduleData from "./pairing-list.json";

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
  }));
}

const identity = (count: number) => Array.from({ length: count }, (_, i) => i);

const EXPECTED = {
  4: { matchCount: 3, courtCount: 1, rounds: 3 },
  5: { matchCount: 5, courtCount: 1, rounds: 5 },
  6: { matchCount: 6, courtCount: 1, rounds: 6 },
  7: { matchCount: 7, courtCount: 1, rounds: 7 },
  8: { matchCount: 14, courtCount: 2, rounds: 7 },
} as const;

describe("getScheduleInfo", () => {
  it.each([4, 5, 6, 7, 8] as const)(
    "matches pairing-list.json for %i players",
    (count) => {
      expect(getScheduleInfo(count)).toEqual({
        matchCount: EXPECTED[count].matchCount,
        courtCount: EXPECTED[count].courtCount,
      });
    }
  );

  it("returns null outside 4–8", () => {
    expect(getScheduleInfo(3)).toBeNull();
    expect(getScheduleInfo(9)).toBeNull();
  });
});

describe("generateAmericanoMatches", () => {
  it("returns no matches outside 4–8", () => {
    expect(generateAmericanoMatches(makePlayers(3))).toEqual([]);
    expect(generateAmericanoMatches(makePlayers(9))).toEqual([]);
  });

  it.each([4, 5, 6, 7, 8] as const)(
    "builds the static %i-player schedule with identity mapping",
    (count) => {
      const players = makePlayers(count);
      const matches = generateAmericanoMatches(players, identity(count));
      const expected = EXPECTED[count];

      expect(matches).toHaveLength(expected.matchCount);
      expect(new Set(matches.map((m) => m.round)).size).toBe(expected.rounds);
      expect(matches.every((m) => m.team1.length === 2 && m.team2.length === 2)).toBe(
        true
      );

      const template =
        scheduleData.scheduleTemplates[
          String(count) as keyof typeof scheduleData.scheduleTemplates
        ];
      let i = 0;
      for (const round of template.rounds) {
        for (const slot of round.matches) {
          const match = matches[i++];
          expect(match.round).toBe(round.round_id);
          expect(match.court).toBe(slot.court);
          expect(match.team1.map((p) => p.id)).toEqual(
            slot.team1.map((idx) => players[idx].id)
          );
          expect(match.team2.map((p) => p.id)).toEqual(
            slot.team2.map((idx) => players[idx].id)
          );
        }
      }
    }
  );

  it("keeps 4-player partner rotation with identity mapping", () => {
    const players = makePlayers(4);
    const matches = generateAmericanoMatches(players, identity(4));
    const partners = new Set(
      matches.flatMap((match) => [
        [match.team1[0].id, match.team1[1].id].sort().join("-"),
        [match.team2[0].id, match.team2[1].id].sort().join("-"),
      ])
    );
    expect(partners.size).toBe(6);
  });

  it("shuffle changes who occupies a slot but not schedule shape", () => {
    const players = makePlayers(8);
    const shaped = generateAmericanoMatches(players, identity(8));
    const shuffled = generateAmericanoMatches(players);

    expect(shuffled).toHaveLength(shaped.length);
    expect(shuffled.map((m) => m.round)).toEqual(shaped.map((m) => m.round));
    expect(shuffled.map((m) => m.court)).toEqual(shaped.map((m) => m.court));

    const playerIds = new Set(players.map((p) => p.id));
    for (const match of shuffled) {
      for (const player of [...match.team1, ...match.team2]) {
        expect(playerIds.has(player.id)).toBe(true);
      }
    }
  });

  it("every generated match has four distinct players", () => {
    for (const count of [4, 5, 6, 7, 8]) {
      const matches = generateAmericanoMatches(makePlayers(count));
      for (const match of matches) {
        const ids = [...match.team1, ...match.team2].map((p) => p.id);
        expect(new Set(ids).size).toBe(4);
      }
    }
  });
});
