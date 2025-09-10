"use client";

import { useState, useEffect } from "react";
import TournamentSetup from "./components/TournamentSetup";
import MatchesList from "./components/MatchesList";
import Results from "./components/Results";
import { TournamentData, Match, Player, PlayerStats } from "./types";

export default function Home() {
  const [currentView, setCurrentView] = useState<
    "setup" | "matches" | "results"
  >("setup");
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(
    null
  );
  const [overallStandings, setOverallStandings] = useState<PlayerStats[]>([]);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedCurrentView = localStorage.getItem("padelmavene_currentView");
    const savedTournamentData = localStorage.getItem(
      "padelmavene_tournamentData"
    );
    const savedOverallStandings = localStorage.getItem(
      "padelmavene_overallStandings"
    );

    if (savedCurrentView) {
      setCurrentView(savedCurrentView as "setup" | "matches" | "results");
    }

    if (savedTournamentData) {
      try {
        const parsedData = JSON.parse(savedTournamentData);
        setTournamentData(parsedData);
      } catch (error) {
        console.error("Failed to parse saved tournament data:", error);
        // Clear corrupted data
        localStorage.removeItem("padelmavene_tournamentData");
        localStorage.removeItem("padelmavene_currentView");
      }
    }

    if (savedOverallStandings) {
      try {
        const parsedStandings = JSON.parse(savedOverallStandings);
        setOverallStandings(parsedStandings);
      } catch (error) {
        console.error("Failed to parse saved overall standings:", error);
        localStorage.removeItem("padelmavene_overallStandings");
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("padelmavene_currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    if (tournamentData) {
      localStorage.setItem(
        "padelmavene_tournamentData",
        JSON.stringify(tournamentData)
      );
    } else {
      localStorage.removeItem("padelmavene_tournamentData");
    }
  }, [tournamentData]);

  useEffect(() => {
    localStorage.setItem(
      "padelmavene_overallStandings",
      JSON.stringify(overallStandings)
    );
  }, [overallStandings]);

  const generateAmericanoMatches = (players: Player[]): Match[] => {
    const matches: Match[] = [];
    const playerCount = players.length;

    if (playerCount === 4) {
      // Special case: 4 players = 3 matches (everyone plays with everyone)
      const combinations = [
        { team1: [players[0], players[1]], team2: [players[2], players[3]] },
        { team1: [players[0], players[2]], team2: [players[1], players[3]] },
        { team1: [players[0], players[3]], team2: [players[1], players[2]] },
      ];

      combinations.forEach((combo, index) => {
        matches.push({
          id: index + 1,
          team1: combo.team1 as [Player, Player],
          team2: combo.team2 as [Player, Player],
        });
      });
    } else {
      // For 5, 6, 7 players: generate as many matches as players
      for (let matchId = 1; matchId <= playerCount; matchId++) {
        // Create a shuffled copy of players for each match
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

        // Take first 4 players for the match, others sit out
        const team1: [Player, Player] = [
          shuffledPlayers[0],
          shuffledPlayers[1],
        ];
        const team2: [Player, Player] = [
          shuffledPlayers[2],
          shuffledPlayers[3],
        ];

        matches.push({
          id: matchId,
          team1,
          team2,
        });
      }
    }

    return matches;
  };

  const handleTournamentSetup = (data: TournamentData) => {
    setTournamentData(data);
    setCurrentView("matches");
  };

  const handleMatchesUpdate = (updatedMatches: Match[]) => {
    setTournamentData((prev: TournamentData | null) =>
      prev ? { ...prev, matches: updatedMatches } : null
    );
  };

  const updateOverallStandings = (
    currentRoundResults: Match[],
    players: Player[]
  ) => {
    const currentRoundStats: { [playerId: number]: PlayerStats } = {};

    // Initialize stats for all players
    players.forEach((player) => {
      currentRoundStats[player.id] = {
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

    // Calculate stats from current round results
    currentRoundResults.forEach((match) => {
      if (match.score) {
        const team1Players = match.team1;
        const team2Players = match.team2;
        const { team1Score, team2Score, winner } = match.score;

        // Update stats for team 1 players
        team1Players.forEach((player) => {
          const playerStats = currentRoundStats[player.id];
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
          const playerStats = currentRoundStats[player.id];
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

    // Calculate point differences for current round
    Object.values(currentRoundStats).forEach((playerStats) => {
      playerStats.pointsDifference =
        playerStats.pointsFor - playerStats.pointsAgainst;
    });

    // Update overall standings by adding current round stats
    const updatedOverallStandings = [...overallStandings];

    Object.values(currentRoundStats).forEach((currentStats) => {
      const existingPlayerIndex = updatedOverallStandings.findIndex(
        (overall) => overall.player.id === currentStats.player.id
      );

      if (existingPlayerIndex >= 0) {
        // Add to existing player stats
        const existing = updatedOverallStandings[existingPlayerIndex];
        updatedOverallStandings[existingPlayerIndex] = {
          ...existing,
          wins: existing.wins + currentStats.wins,
          losses: existing.losses + currentStats.losses,
          ties: existing.ties + currentStats.ties,
          pointsFor: existing.pointsFor + currentStats.pointsFor,
          pointsAgainst: existing.pointsAgainst + currentStats.pointsAgainst,
          pointsDifference:
            existing.pointsDifference + currentStats.pointsDifference,
          matchesPlayed: existing.matchesPlayed + currentStats.matchesPlayed,
        };
      } else {
        // Add new player to overall standings
        updatedOverallStandings.push(currentStats);
      }
    });

    // Sort overall standings by point difference first, then by wins
    updatedOverallStandings.sort((a, b) => {
      if (a.pointsDifference !== b.pointsDifference) {
        return b.pointsDifference - a.pointsDifference;
      }
      return b.wins - a.wins;
    });

    setOverallStandings(updatedOverallStandings);
  };

  const handleFinishMatches = (results: Match[]) => {
    if (tournamentData) {
      updateOverallStandings(results, tournamentData.players);
    }
    setTournamentData((prev: TournamentData | null) =>
      prev ? { ...prev, results } : null
    );
    setCurrentView("results");
  };

  const resetTournament = () => {
    setTournamentData(null);
    setOverallStandings([]);
    setCurrentView("setup");
    // Clear saved data from localStorage
    localStorage.removeItem("padelmavene_tournamentData");
    localStorage.removeItem("padelmavene_currentView");
    localStorage.removeItem("padelmavene_overallStandings");
  };

  const handleReshuffleTournament = () => {
    if (!tournamentData) return;

    // Generate new matches with the same players and settings
    const newMatches = generateAmericanoMatches(tournamentData.players);

    // Reset tournament data with new matches (no scores)
    setTournamentData({
      players: tournamentData.players,
      maxScore: tournamentData.maxScore,
      matches: newMatches,
    });

    // Go back to matches view
    setCurrentView("matches");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Padelmavene
        </h1>

        {currentView === "setup" && (
          <TournamentSetup onSetupComplete={handleTournamentSetup} />
        )}

        {currentView === "matches" && tournamentData && (
          <MatchesList
            tournamentData={tournamentData}
            onFinishMatches={handleFinishMatches}
            onMatchesUpdate={handleMatchesUpdate}
          />
        )}

        {currentView === "results" &&
          tournamentData &&
          tournamentData.results && (
            <Results
              tournamentData={
                tournamentData as TournamentData & { results: Match[] }
              }
              overallStandings={overallStandings}
              onResetTournament={resetTournament}
              onReshuffleTournament={handleReshuffleTournament}
            />
          )}
      </div>
    </div>
  );
}
