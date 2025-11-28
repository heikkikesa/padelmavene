import { Player, Match } from "../types";
import scheduleData from "./pairing-list.json";

// New implementation: purely static schedule lookup for 4–8 players.
// The JSON file contains zero-based player indexes which we map to the
// provided players array (whose ids start at 1). No shuffling or dynamic
// algorithm is performed – the order is exactly as listed in the template.

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
        bye?: number[]; // 5-player template naming
        byes?: number[]; // 6/7-player template naming
      }>;
    };
  };
};

const templates = scheduleData as ScheduleTemplates;

export const generateAmericanoMatches = (players: Player[]): Match[] => {
  const count = players.length;
  if (count < 4 || count > 8) {
    // Out of supported range – return empty array.
    return [];
  }

  const template = templates.scheduleTemplates[String(count)];
  if (!template) return [];

  // Shuffle player-to-index mapping for variety without changing round order.
  // We create a random permutation of 0..count-1 and use it when mapping
  // template indices to actual players. This keeps scores tied to the Player
  // objects in the generated matches while giving a fresh feel between runs.
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

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
