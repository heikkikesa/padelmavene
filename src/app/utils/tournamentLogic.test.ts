import { describe, expect, it } from "vitest";
import {
  accumulateOverallStandings,
  applyMatchScore,
  calculatePlayerStats,
  createTournament,
  fillUnscoredWithEvenScores,
  finishTournament,
  parseOverallStandings,
  parseTournamentData,
  parseView,
  playAgain,
  resolveView,
  scoreFromTeamInput,
  startNewTournament,
} from "./tournamentLogic";
import { generateAmericanoMatches } from "./matchGeneration";
import type { Match, Player, TournamentData } from "../types";

const players: Player[] = [
  { id: 1, name: "Anna" },
  { id: 2, name: "Bert" },
  { id: 3, name: "Cara" },
  { id: 4, name: "Dave" },
];

function match(partial: Partial<Match> & Pick<Match, "id">): Match {
  return {
    team1: [players[0], players[1]],
    team2: [players[2], players[3]],
    round: 1,
    ...partial,
  };
}

describe("scoreFromTeamInput / applyMatchScore", () => {
  it("assigns the remainder of maxScore to the other team", () => {
    expect(scoreFromTeamInput("team1", 16, 16)).toEqual({
      team1Score: 16,
      team2Score: 0,
      winner: "team1",
    });
    expect(scoreFromTeamInput("team2", 10, 16)).toEqual({
      team1Score: 6,
      team2Score: 10,
      winner: "team2",
    });
  });

  it("treats equal scores as a tie, including 0–max and even split", () => {
    expect(scoreFromTeamInput("team1", 8, 16).winner).toBe("tie");
    expect(scoreFromTeamInput("team1", 0, 16)).toEqual({
      team1Score: 0,
      team2Score: 16,
      winner: "team2",
    });
  });

  it("updates only the selected match immutably", () => {
    const matches = [
      match({ id: 1 }),
      match({ id: 2, team1: [players[0], players[2]], team2: [players[1], players[3]] }),
    ];
    const updated = applyMatchScore(matches, 2, "team1", 16, 16);

    expect(updated[0]).toBe(matches[0]);
    expect(updated[1].score).toEqual({
      team1Score: 16,
      team2Score: 0,
      winner: "team1",
    });
    expect(matches[1].score).toBeUndefined();
  });
});

describe("calculatePlayerStats", () => {
  it("ignores unscored matches and ranks by point difference then wins", () => {
    const matches = [
      match({
        id: 1,
        score: { team1Score: 16, team2Score: 0, winner: "team1" },
      }),
      match({ id: 2 }),
    ];
    const standings = calculatePlayerStats(players, matches);

    expect(standings.map((s) => s.player.name)).toEqual([
      "Anna",
      "Bert",
      "Cara",
      "Dave",
    ]);
    expect(standings[0]).toMatchObject({
      wins: 1,
      losses: 0,
      pointsFor: 16,
      pointsAgainst: 0,
      pointsDifference: 16,
      matchesPlayed: 1,
    });
    expect(standings[2]).toMatchObject({
      wins: 0,
      losses: 1,
      pointsDifference: -16,
      matchesPlayed: 1,
    });
  });

  it("counts ties for both teams", () => {
    const matches = [
      match({
        id: 1,
        score: { team1Score: 8, team2Score: 8, winner: "tie" },
      }),
    ];
    const standings = calculatePlayerStats(players, matches);
    expect(standings.every((s) => s.ties === 1 && s.wins === 0 && s.losses === 0)).toBe(
      true
    );
  });
});

describe("finish, play again, and new tournament", () => {
  it("fills remaining matches with even scores", () => {
    const matches = [
      match({
        id: 1,
        score: { team1Score: 16, team2Score: 0, winner: "team1" },
      }),
      match({ id: 2 }),
    ];
    const filled = fillUnscoredWithEvenScores(matches, 16);
    expect(filled[0].score).toEqual(matches[0].score);
    expect(filled[1].score).toEqual({
      team1Score: 8,
      team2Score: 8,
      winner: "tie",
    });
  });

  it("finish stores results and adds them to overall standings", () => {
    const data: TournamentData = {
      players,
      maxScore: 16,
      matches: generateAmericanoMatches(players, [0, 1, 2, 3]),
    };
    const results = applyMatchScore(data.matches, 1, "team1", 16, 16);
    const finished = finishTournament(data, results, []);

    expect(finished.view).toBe("results");
    expect(finished.tournamentData.results).toEqual(results);
    expect(finished.overallStandings[0].player.name).toBe("Anna");
    expect(finished.overallStandings[0].wins).toBe(1);
  });

  it("accumulates overall standings across two finished rounds", () => {
    const round1 = [
      match({
        id: 1,
        score: { team1Score: 16, team2Score: 0, winner: "team1" },
      }),
    ];
    const afterFirst = accumulateOverallStandings([], players, round1);
    const round2 = [
      match({
        id: 1,
        score: { team1Score: 16, team2Score: 0, winner: "team1" },
      }),
    ];
    const afterSecond = accumulateOverallStandings(afterFirst, players, round2);

    expect(afterSecond.find((s) => s.player.id === 1)).toMatchObject({
      wins: 2,
      pointsFor: 32,
      matchesPlayed: 2,
    });
  });

  it("play again keeps the same players, drops results, and makes a new schedule", () => {
    const finished: TournamentData = {
      players,
      maxScore: 16,
      matches: generateAmericanoMatches(players, [0, 1, 2, 3]),
      results: [match({ id: 1, score: { team1Score: 16, team2Score: 0, winner: "team1" } })],
    };
    const next = playAgain(finished, 24);

    expect(next.view).toBe("matches");
    expect(next.tournamentData.players).toEqual(players);
    expect(next.tournamentData.maxScore).toBe(24);
    expect(next.tournamentData.results).toBeUndefined();
    expect(next.tournamentData.matches).toHaveLength(3);
    expect(next.tournamentData.matches.every((m) => !m.score)).toBe(true);
  });

  it("start new tournament clears all persisted tournament state", () => {
    expect(startNewTournament()).toEqual({
      tournamentData: null,
      overallStandings: [],
      view: "setup",
    });
  });

  it("createTournament builds a scored-ready 4-player event", () => {
    const data = createTournament(players, 16);
    expect(data.maxScore).toBe(16);
    expect(data.matches).toHaveLength(3);
    expect(data.results).toBeUndefined();
  });
});

describe("resolveView", () => {
  const data: TournamentData = {
    players,
    maxScore: 16,
    matches: [match({ id: 1 })],
  };

  it("falls back to setup when match/result views have no tournament", () => {
    expect(resolveView("matches", null)).toBe("setup");
    expect(resolveView("results", null)).toBe("setup");
    expect(resolveView("setup", null)).toBe("setup");
  });

  it("sends results view back to matches when results are missing", () => {
    expect(resolveView("results", data)).toBe("matches");
    expect(resolveView("results", { ...data, results: data.matches })).toBe(
      "results"
    );
  });

  it("does not steal an in-progress tournament that is still on setup", () => {
    expect(resolveView("setup", data)).toBe("setup");
    expect(resolveView("matches", data)).toBe("matches");
  });
});

describe("persisted payload parsing", () => {
  it("accepts a valid stored tournament and standings", () => {
    const data = createTournament(players, 16);
    expect(parseTournamentData(JSON.stringify(data))).toEqual(data);
    expect(parseOverallStandings("[]")).toEqual([]);
    expect(parseView("matches")).toBe("matches");
    expect(parseView("nope")).toBe("setup");
  });

  it("rejects corrupt tournament JSON shapes", () => {
    expect(() => parseTournamentData(JSON.stringify({ foo: 1 }))).toThrow();
    expect(() => parseOverallStandings(JSON.stringify([{ wins: 1 }]))).toThrow();
  });
});
