"use client";

import { useState, useEffect } from "react";
import { Match, TournamentData, PlayerStats } from "../types";

interface MatchesListProps {
  tournamentData: TournamentData;
  onFinishMatches: (results: Match[]) => void;
  onMatchesUpdate: (matches: Match[]) => void;
  onResetTournament: () => void;
}

// Helper function to get court badge colors
const getCourtBadgeClasses = (court: number): string => {
  const colors = [
    "bg-blue-900 text-blue-300", // Court 1: Blue
    "bg-orange-900 text-orange-300", // Court 2: Orange
    "bg-rose-900 text-rose-300", // Court 3: Rose
    "bg-purple-900 text-purple-300", // Court 4: Purple
    "bg-pink-900 text-pink-300", // Court 5: Pink
    "bg-cyan-900 text-cyan-300", // Court 6: Cyan
  ];
  return colors[(court - 1) % colors.length] || "bg-gray-900 text-gray-300";
};

export default function MatchesList({
  tournamentData,
  onFinishMatches,
  onMatchesUpdate,
  onResetTournament,
}: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>(tournamentData.matches);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"team1" | "team2" | null>(
    null
  );
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  // Sync matches state when tournamentData changes (e.g., from localStorage restore)
  useEffect(() => {
    setMatches(tournamentData.matches);
  }, [tournamentData.matches]);

  const calculatePlayerStats = (): PlayerStats[] => {
    const stats: { [playerId: number]: PlayerStats } = {};

    // Initialize stats for all players
    tournamentData.players.forEach((player) => {
      stats[player.id] = {
        player,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDifference: 0,
        matchesPlayed: 0,
      };
    });

    // Calculate stats from completed matches
    matches.forEach((match) => {
      if (match.score) {
        const team1Players = match.team1;
        const team2Players = match.team2;
        const { team1Score, team2Score, winner } = match.score;

        // Update stats for team 1 players
        team1Players.forEach((player) => {
          const playerStats = stats[player.id];
          playerStats.matchesPlayed++;
          playerStats.pointsFor += team1Score;
          playerStats.pointsAgainst += team2Score;

          if (winner === "team1") {
            playerStats.wins++;
          } else if (winner === "tie") {
            playerStats.ties++;
          } else {
            playerStats.losses++;
          }
        });

        // Update stats for team 2 players
        team2Players.forEach((player) => {
          const playerStats = stats[player.id];
          playerStats.matchesPlayed++;
          playerStats.pointsFor += team2Score;
          playerStats.pointsAgainst += team1Score;

          if (winner === "team2") {
            playerStats.wins++;
          } else if (winner === "tie") {
            playerStats.ties++;
          } else {
            playerStats.losses++;
          }
        });
      }
    });

    // Calculate point differences
    Object.values(stats).forEach((playerStats) => {
      playerStats.pointsDifference =
        playerStats.pointsFor - playerStats.pointsAgainst;
    });

    // Sort by point difference first, then by wins
    return Object.values(stats).sort((a, b) => {
      if (a.pointsDifference !== b.pointsDifference) {
        return b.pointsDifference - a.pointsDifference; // Better point difference first
      }
      return b.wins - a.wins; // More wins as tiebreaker
    });
  };

  const handleScoreInput = (
    matchId: number,
    team: "team1" | "team2",
    teamScore: number
  ) => {
    const otherTeamScore = tournamentData.maxScore - teamScore;
    let winner: "team1" | "team2" | "tie";

    if (teamScore > otherTeamScore) {
      winner = team;
    } else if (teamScore < otherTeamScore) {
      winner = team === "team1" ? "team2" : "team1";
    } else {
      winner = "tie";
    }

    const updatedMatches = matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            score: {
              team1Score: team === "team1" ? teamScore : otherTeamScore,
              team2Score: team === "team2" ? teamScore : otherTeamScore,
              winner,
            },
          }
        : match
    );

    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);

    setSelectedMatch(null);
    setSelectedTeam(null);
  };

  const handleTeamSelect = (matchId: number, team: "team1" | "team2") => {
    setSelectedMatch(matchId);
    setSelectedTeam(team);
  };

  const handleScoreSelect = (score: number) => {
    if (selectedMatch && selectedTeam) {
      handleScoreInput(selectedMatch, selectedTeam, score);
    }
  };

  const closeModal = () => {
    setSelectedMatch(null);
    setSelectedTeam(null);
  };

  const handleResetTournamentClick = () => {
    setShowConfirmReset(true);
  };

  const confirmReset = () => {
    setShowConfirmReset(false);
    onResetTournament();
  };

  const cancelReset = () => {
    setShowConfirmReset(false);
  };

  const completedMatches = matches.filter((match) => match.score).length;
  const totalMatches = matches.length;
  const unscoredMatches = matches.filter((match) => !match.score);
  const playerStats = calculatePlayerStats();

  // Check if this is a multi-court tournament
  const isMultiCourt = matches.some((match) => match.court !== undefined);

  // Group matches by round for multi-court tournaments
  const matchesByRound = isMultiCourt
    ? matches.reduce((acc, match) => {
        const round = match.round || 1;
        if (!acc[round]) {
          acc[round] = [];
        }
        acc[round].push(match);
        return acc;
      }, {} as Record<number, Match[]>)
    : { 1: matches };

  const handleFinishTournament = () => {
    if (unscoredMatches.length > 0) {
      setShowConfirmFinish(true);
    } else {
      onFinishMatches(matches);
    }
  };

  const handleFinishWithEvenScores = () => {
    const evenScore = Math.floor(tournamentData.maxScore / 2);

    const updatedMatches = matches.map((match) => {
      if (!match.score) {
        return {
          ...match,
          score: {
            team1Score: evenScore,
            team2Score: evenScore,
            winner: "tie" as const,
          },
        };
      }
      return match;
    });

    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);
    setShowConfirmFinish(false);
    onFinishMatches(updatedMatches);
  };

  const handleFinishWithoutEvenScores = () => {
    setShowConfirmFinish(false);
    onFinishMatches(matches);
  };

  const cancelFinish = () => {
    setShowConfirmFinish(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      {/* Current Standings */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">
            Current Standings
          </h3>
          <button
            onClick={handleResetTournamentClick}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            New Tournament
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-700">
                <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">
                  Name
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  +
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  -
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  Diff
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  M
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  W
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  T
                </th>
                <th className="border border-gray-600 px-4 py-2 text-center text-gray-200">
                  L
                </th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stats) => (
                <tr key={stats.player.id} className="bg-gray-700">
                  <td className="border border-gray-600 px-4 py-2 font-semibold text-white">
                    {stats.player.name}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-gray-300">
                    {stats.pointsFor}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-gray-300">
                    {stats.pointsAgainst}
                  </td>
                  <td
                    className={`border border-gray-600 px-4 py-2 text-center font-semibold ${
                      stats.pointsDifference > 0
                        ? "text-green-400"
                        : stats.pointsDifference < 0
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {stats.pointsDifference > 0 ? "+" : ""}
                    {stats.pointsDifference}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-gray-300">
                    {stats.matchesPlayed}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-green-400 font-semibold">
                    {stats.wins}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-yellow-400 font-semibold">
                    {stats.ties}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 text-center text-red-400 font-semibold">
                    {stats.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Matches</h2>
        <div className="text-sm text-gray-300">
          {completedMatches} / {totalMatches} completed
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedMatches / totalMatches) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {isMultiCourt
          ? // Multi-court display: grouped by rounds
            Object.keys(matchesByRound)
              .sort((a, b) => Number(a) - Number(b))
              .map((roundKey) => {
                const round = Number(roundKey);
                const roundMatches = matchesByRound[round];

                return (
                  <div
                    key={round}
                    className="border border-gray-500 rounded-lg p-4 bg-gray-750"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        Round {round}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {roundMatches.filter((m) => m.score).length} /{" "}
                        {roundMatches.length} completed
                      </span>
                    </div>

                    <div className="space-y-3">
                      {roundMatches
                        .sort((a, b) => (a.court || 0) - (b.court || 0))
                        .map((match) => (
                          <div
                            key={match.id}
                            className={`border rounded-lg p-4 ${
                              match.score
                                ? "border-gray-600 bg-gray-700"
                                : "border-yellow-600 bg-gray-700"
                            }`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <div className="text-sm text-gray-400">
                                Match {match.id}
                                {match.court && (
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getCourtBadgeClasses(
                                      match.court
                                    )}`}
                                  >
                                    Court {match.court}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 sm:gap-4">
                              {/* Team 1 Score */}
                              <div
                                className={`text-2xl sm:text-3xl font-bold w-10 sm:w-12 text-center ${
                                  match.score
                                    ? match.score.winner === "team1"
                                      ? "text-green-400"
                                      : match.score.winner === "tie"
                                      ? "text-orange-400"
                                      : "text-red-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {match.score ? match.score.team1Score : ""}
                              </div>

                              {/* Team 1 Button */}
                              <button
                                onClick={() =>
                                  handleTeamSelect(match.id, "team1")
                                }
                                className="bg-gray-600 hover:bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors border border-gray-500 hover:border-green-400 text-xs sm:text-sm w-[120px] sm:w-[140px] overflow-hidden"
                              >
                                <div className="truncate">
                                  {match.team1[0].name}
                                </div>
                                <div className="truncate">
                                  {match.team1[1].name}
                                </div>
                              </button>

                              {/* VS */}
                              <span className="text-gray-400 font-normal text-xs sm:text-base">
                                vs
                              </span>

                              {/* Team 2 Button */}
                              <button
                                onClick={() =>
                                  handleTeamSelect(match.id, "team2")
                                }
                                className="bg-gray-600 hover:bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors border border-gray-500 hover:border-green-400 text-xs sm:text-sm w-[120px] sm:w-[140px] overflow-hidden"
                              >
                                <div className="truncate">
                                  {match.team2[0].name}
                                </div>
                                <div className="truncate">
                                  {match.team2[1].name}
                                </div>
                              </button>

                              {/* Team 2 Score */}
                              <div
                                className={`text-2xl sm:text-3xl font-bold w-10 sm:w-12 text-center ${
                                  match.score
                                    ? match.score.winner === "team2"
                                      ? "text-green-400"
                                      : match.score.winner === "tie"
                                      ? "text-orange-400"
                                      : "text-red-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {match.score ? match.score.team2Score : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })
          : // Single court display: simple list
            matches.map((match) => (
              <div
                key={match.id}
                className="border border-gray-600 bg-gray-700 rounded-lg p-4"
              >
                <div className="text-sm text-gray-400 mb-3 text-center">
                  Match {match.id}
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  {/* Team 1 Score */}
                  <div
                    className={`text-2xl sm:text-3xl font-bold w-10 sm:w-12 text-center ${
                      match.score
                        ? match.score.winner === "team1"
                          ? "text-green-400"
                          : match.score.winner === "tie"
                          ? "text-orange-400"
                          : "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {match.score ? match.score.team1Score : ""}
                  </div>

                  {/* Team 1 Button */}
                  <button
                    onClick={() => handleTeamSelect(match.id, "team1")}
                    className="bg-gray-600 hover:bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors border border-gray-500 hover:border-green-400 text-xs sm:text-sm w-[120px] sm:w-[140px] overflow-hidden"
                  >
                    <div className="truncate">{match.team1[0].name}</div>
                    <div className="truncate">{match.team1[1].name}</div>
                  </button>

                  {/* VS */}
                  <span className="text-gray-400 font-normal text-xs sm:text-base">
                    vs
                  </span>

                  {/* Team 2 Button */}
                  <button
                    onClick={() => handleTeamSelect(match.id, "team2")}
                    className="bg-gray-600 hover:bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors border border-gray-500 hover:border-green-400 text-xs sm:text-sm w-[120px] sm:w-[140px] overflow-hidden"
                  >
                    <div className="truncate">{match.team2[0].name}</div>
                    <div className="truncate">{match.team2[1].name}</div>
                  </button>

                  {/* Team 2 Score */}
                  <div
                    className={`text-2xl sm:text-3xl font-bold w-10 sm:w-12 text-center ${
                      match.score
                        ? match.score.winner === "team2"
                          ? "text-green-400"
                          : match.score.winner === "tie"
                          ? "text-orange-400"
                          : "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {match.score ? match.score.team2Score : ""}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Score Input Modal */}
      {selectedMatch && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4">
            {(() => {
              const match = matches.find((m) => m.id === selectedMatch)!;
              const teamName =
                selectedTeam === "team1"
                  ? `${match.team1[0].name} & ${match.team1[1].name}`
                  : `${match.team2[0].name} & ${match.team2[1].name}`;

              return (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-center text-white">
                    Match {selectedMatch}
                  </h3>

                  <div className="text-center text-gray-300">
                    Score for
                    <br />
                    <span className="font-semibold text-white">{teamName}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(
                      { length: tournamentData.maxScore + 1 },
                      (_, i) => i
                    ).map((score) => (
                      <button
                        key={score}
                        onClick={() => handleScoreSelect(score)}
                        className="p-3 border border-gray-500 bg-gray-600 text-white rounded hover:bg-green-600 hover:border-green-400 transition-colors font-semibold"
                      >
                        {score}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center text-white">
                New Tournament
              </h3>

              <div className="text-center text-gray-300">
                Are you sure you want to start a new tournament?
                <br />
                <span className="font-semibold text-red-400">
                  All current progress will be lost.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelReset}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Start New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finish Tournament Confirmation Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center text-white">
                Finish Tournament
              </h3>

              <div className="text-center text-gray-300">
                {unscoredMatches.length > 0 && (
                  <>
                    {unscoredMatches.length} matches don&apos;t have scores yet.
                    <br />
                    <span className="font-semibold text-yellow-400">
                      Should the remaining matches get even scores?
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFinishWithEvenScores}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Yes, Apply Even Scores (
                  {Math.floor(tournamentData.maxScore / 2)}-
                  {Math.floor(tournamentData.maxScore / 2)})
                </button>
                <button
                  onClick={handleFinishWithoutEvenScores}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  No, Finish As-Is
                </button>
                <button
                  onClick={cancelFinish}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleFinishTournament}
        disabled={completedMatches === 0}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Finish Tournament
      </button>
    </div>
  );
}
