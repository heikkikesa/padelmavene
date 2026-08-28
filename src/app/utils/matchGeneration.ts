import { Player, Match } from "../types";
import scheduleData from "./pairing-list.json";

type ScheduleTemplates = {
  scheduleTemplates: {
    [key: string]: {
      rounds_count: number;
      description: string;
      rounds: Array<{
        round_id: number;
        matches: Array<{
          team1: number[];
          team2: number[];
          court?: number;
        }>;
        bye?: number[];
        byes?: number[];
      }>;
    };
  };
};

const templates = scheduleData as ScheduleTemplates;

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;

function getTemplate(playerCount: number) {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return undefined;
  }
  return templates.scheduleTemplates[String(playerCount)];
}

function identityIndices(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

function shuffledIndices(count: number): number[] {
  const indices = identityIndices(count);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function getScheduleInfo(playerCount: number): {
  matchCount: number;
  courtCount: number;
} | null {
  const template = getTemplate(playerCount);
  if (!template) return null;

  const courtIds = new Set<number>();
  let matchCount = 0;
  for (const round of template.rounds) {
    for (const match of round.matches) {
      matchCount++;
      if (match.court !== undefined) {
        courtIds.add(match.court);
      }
    }
  }

  return {
    matchCount,
    courtCount: courtIds.size > 0 ? courtIds.size : 1,
  };
}

export const generateAmericanoMatches = (
  players: Player[],
  indexMap?: readonly number[]
): Match[] => {
  const count = players.length;
  const template = getTemplate(count);
  if (!template) {
    return [];
  }

  const indices =
    indexMap && indexMap.length === count
      ? [...indexMap]
      : shuffledIndices(count);

  const matches: Match[] = [];
  let id = 1;
  template.rounds.forEach((round) => {
    round.matches.forEach((m) => {
      const team1Players = m.team1.map((idx) => players[indices[idx]]);
      const team2Players = m.team2.map((idx) => players[indices[idx]]);
      matches.push({
        id: id++,
        team1: [team1Players[0], team1Players[1]],
        team2: [team2Players[0], team2Players[1]],
        round: round.round_id,
        court: m.court,
      });
    });
  });
  return matches;
};
