"use client";

import Image from "next/image";
import TournamentSetup from "./components/TournamentSetup";
import MatchesList from "./components/MatchesList";
import Results from "./components/Results";
import { TournamentData, Match, Player, PlayerStats } from "./types";
import { generateAmericanoMatches } from "./utils/matchGeneration";
import { useLocalStorageState } from "./utils/useLocalStorageState";
import logo from "./logo.png";

type View = "setup" | "matches" | "results";

const VIEWS: readonly View[] = ["setup", "matches", "results"];
const EMPTY_STANDINGS: PlayerStats[] = [];

function parseView(raw: string): View {
  return VIEWS.includes(raw as View) ? (raw as View) : "setup";
}

function serializeView(value: View): string {
  return value;
}

export default function Home() {
  const [currentView, setCurrentView] = useLocalStorageState<View>(
    "padelmavene_currentView",
    "setup",
    parseView,
    serializeView
  );
  const [tournamentData, setTournamentData] =
    useLocalStorageState<TournamentData | null>(
      "padelmavene_tournamentData",
      null
    );
  const [overallStandings, setOverallStandings] = useLocalStorageState<
    PlayerStats[]
  >("padelmavene_overallStandings", EMPTY_STANDINGS);

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
    setOverallStandings(EMPTY_STANDINGS);
    setCurrentView("setup");
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
        {currentView === "setup" && (
          <div className="flex justify-center mb-8">
            <div className="w-96 h-96 rounded-full overflow-hidden">
              <Image
                src={logo}
                alt="Padelmavene Logo"
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {currentView === "setup" && (
          <TournamentSetup onSetupComplete={handleTournamentSetup} />
        )}

        {currentView === "matches" && tournamentData && (
          <MatchesList
            tournamentData={tournamentData}
            onFinishMatches={handleFinishMatches}
            onMatchesUpdate={handleMatchesUpdate}
            onResetTournament={resetTournament}
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
