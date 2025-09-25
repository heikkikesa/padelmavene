"use client";

import { Match, PlayerStats, TournamentData } from "../types";
import { useState } from "react";

interface ResultsProps {
  tournamentData: TournamentData & { results: Match[] };
  overallStandings: PlayerStats[];
  onResetTournament: () => void;
  onReshuffleTournament: () => void;
}

export default function Results({
  tournamentData,
  overallStandings,
  onResetTournament,
  onReshuffleTournament,
}: ResultsProps) {
  const [activeTab, setActiveTab] = useState<"current" | "overall">("current");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmReshuffle, setShowConfirmReshuffle] = useState(false);

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
    tournamentData.results.forEach((match) => {
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

  const renderStandingsTable = (standings: PlayerStats[], title: string) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">
                Rank
              </th>
              <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">
                Player
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Difference
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Points For
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Points Against
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Matches
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Wins
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Ties
              </th>
              <th className="border border-gray-600 px-4 py-3 text-center text-gray-200">
                Losses
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((stats, index) => (
              <tr key={stats.player.id} className="bg-gray-700">
                <td className="border border-gray-600 px-4 py-3 font-semibold text-white">
                  {index === 0 && "🥇"} {index === 1 && "🥈"}{" "}
                  {index === 2 && "🥉"} #{index + 1}
                </td>
                <td className="border border-gray-600 px-4 py-3 font-semibold text-white">
                  {stats.player.name}
                </td>
                <td
                  className={`border border-gray-600 px-4 py-3 text-center font-semibold ${
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
                <td className="border border-gray-600 px-4 py-3 text-center text-gray-300">
                  {stats.pointsFor}
                </td>
                <td className="border border-gray-600 px-4 py-3 text-center text-gray-300">
                  {stats.pointsAgainst}
                </td>
                <td className="border border-gray-600 px-4 py-3 text-center text-gray-300">
                  {stats.matchesPlayed}
                </td>
                <td className="border border-gray-600 px-4 py-3 text-center text-green-400 font-semibold">
                  {stats.wins}
                </td>
                <td className="border border-gray-600 px-4 py-3 text-center text-yellow-400 font-semibold">
                  {stats.ties}
                </td>
                <td className="border border-gray-600 px-4 py-3 text-center text-red-400 font-semibold">
                  {stats.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const playerStats = calculatePlayerStats();
  const completedMatches = tournamentData.results.filter(
    (match) => match.score
  ).length;

  const handleResetTournamentClick = () => {
    setShowConfirmReset(true);
  };

  const handleReshuffleTournamentClick = () => {
    setShowConfirmReshuffle(true);
  };

  const confirmReset = () => {
    setShowConfirmReset(false);
    onResetTournament();
  };

  const cancelReset = () => {
    setShowConfirmReset(false);
  };

  const confirmReshuffle = () => {
    setShowConfirmReshuffle(false);
    onReshuffleTournament();
  };

  const cancelReshuffle = () => {
    setShowConfirmReshuffle(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Tournament Results</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetTournamentClick}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            New Tournament
          </button>
          <button
            onClick={handleReshuffleTournamentClick}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>

      <div className="mb-6 text-center text-gray-300">
        {completedMatches} matches completed
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "current"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Current Round
          </button>
          <button
            onClick={() => setActiveTab("overall")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "overall"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Overall Standings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "current" && (
        <>
          {renderStandingsTable(playerStats, "Final Rankings")}

          {/* Match Results Summary */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">
              Match Results
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tournamentData.results
                .filter((match) => match.score)
                .map((match) => (
                  <div
                    key={match.id}
                    className="flex justify-between items-center p-3 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-400">
                        Match {match.id}:{" "}
                      </span>
                      <span
                        className={
                          match.score?.winner === "team1"
                            ? "font-semibold text-green-400"
                            : match.score?.winner === "tie"
                            ? "font-semibold text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        {match.team1[0].name} & {match.team1[1].name}
                      </span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span
                        className={
                          match.score?.winner === "team2"
                            ? "font-semibold text-green-400"
                            : match.score?.winner === "tie"
                            ? "font-semibold text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        {match.team2[0].name} & {match.team2[1].name}
                      </span>
                    </div>
                    <div className="font-bold text-white">
                      {match.score?.team1Score} - {match.score?.team2Score}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "overall" && (
        <div>
          {overallStandings.length > 0 ? (
            renderStandingsTable(
              overallStandings,
              "Overall Tournament Standings"
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No overall standings yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Play another round to see cumulative standings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reset Tournament Confirmation Modal */}
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

      {/* Reshuffle Tournament Confirmation Modal */}
      {showConfirmReshuffle && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center text-white">
                Play Again
              </h3>

              <div className="text-center text-gray-300">
                Are you sure you want to play again with the same players?
                <br />
                <span className="font-semibold text-green-400">
                  Current results will be saved
                </span>
                <br />
                <span className="text-sm">
                  but you&apos;ll start a new round.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelReshuffle}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReshuffle}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
