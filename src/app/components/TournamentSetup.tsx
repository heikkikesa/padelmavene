"use client";

import { useState } from "react";
import { Player, TournamentData } from "../types";
import { generateAmericanoMatches } from "../utils/matchGeneration";

interface TournamentSetupProps {
  onSetupComplete: (data: TournamentData) => void;
}

export default function TournamentSetup({
  onSetupComplete,
}: TournamentSetupProps) {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [maxScore, setMaxScore] = useState<number>(16);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newPlayers = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: "",
    }));
    setPlayers(newPlayers);
  };

  const handlePlayerNameChange = (id: number, name: string) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === id ? { ...player, name } : player))
    );
  };

  const handleStartTournament = () => {
    if (
      players.length < 4 ||
      players.length > 8 ||
      players.some((p) => !p.name.trim())
    ) {
      alert("Please enter names for all players (4-8 players supported)");
      return;
    }

    const matches = generateAmericanoMatches(players);
    onSetupComplete({
      players,
      maxScore,
      matches,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-white">Tournament Setup</h2>

      {/* Player Count Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-200">
          Number of Players
        </h3>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {[4, 5, 6, 7, 8].map((count) => (
            <button
              key={count}
              onClick={() => handlePlayerCountChange(count)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                playerCount === count
                  ? "border-blue-400 bg-blue-900 text-blue-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Player Names */}
      {playerCount > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">
            Player Names
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map((player) => (
              <input
                key={player.id}
                type="text"
                value={player.name}
                onChange={(e) =>
                  handlePlayerNameChange(player.id, e.target.value)
                }
                className="p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder={`Player ${player.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Max Score Selection */}
      {playerCount > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">
            Maximum Score per Match
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setMaxScore(16)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                maxScore === 16
                  ? "border-green-400 bg-green-900 text-green-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 hover:bg-green-600"
              }`}
            >
              16 Points
            </button>
            <button
              onClick={() => setMaxScore(24)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                maxScore === 24
                  ? "border-green-400 bg-green-900 text-green-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 hover:bg-green-600"
              }`}
            >
              24 Points
            </button>
            <button
              onClick={() => setMaxScore(32)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                maxScore === 32
                  ? "border-green-400 bg-green-900 text-green-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 hover:bg-green-600"
              }`}
            >
              32 Points
            </button>
          </div>
        </div>
      )}

      {/* Start Tournament Button */}
      {playerCount > 0 && (
        <button
          onClick={handleStartTournament}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Start Tournament (
          {(() => {
            const matches = generateAmericanoMatches(players);
            const courts = playerCount === 8 ? 2 : 1;
            return courts > 1
              ? `${matches.length} matches, ${courts} courts`
              : `${matches.length} matches`;
          })()}
          )
        </button>
      )}
    </div>
  );
}
