"use client";

import Image from "next/image";
import TournamentSetup from "./components/TournamentSetup";
import MatchesList from "./components/MatchesList";
import Results from "./components/Results";
import { Match, TournamentData } from "./types";
import { useLocalStorageState } from "./utils/useLocalStorageState";
import {
  EMPTY_STANDINGS,
  finishTournament,
  parseOverallStandings,
  parseTournamentData,
  parseView,
  playAgain,
  resolveView,
  serializeView,
  startNewTournament,
} from "./utils/tournamentLogic";
import logo from "./logo.png";

export default function Home() {
  const [currentView, setCurrentView] = useLocalStorageState(
    "padelmavene_currentView",
    "setup" as const,
    parseView,
    serializeView
  );
  const [tournamentData, setTournamentData] =
    useLocalStorageState<TournamentData | null>(
      "padelmavene_tournamentData",
      null,
      parseTournamentData
    );
  const [overallStandings, setOverallStandings] = useLocalStorageState(
    "padelmavene_overallStandings",
    EMPTY_STANDINGS,
    parseOverallStandings
  );

  const view = resolveView(currentView, tournamentData);

  const handleTournamentSetup = (data: TournamentData) => {
    setTournamentData(data);
    setCurrentView("matches");
  };

  const handleMatchesUpdate = (updatedMatches: Match[]) => {
    setTournamentData((prev: TournamentData | null) =>
      prev ? { ...prev, matches: updatedMatches } : null
    );
  };

  const handleFinishMatches = (results: Match[]) => {
    if (!tournamentData) return;
    const finished = finishTournament(
      tournamentData,
      results,
      overallStandings
    );
    setTournamentData(finished.tournamentData);
    setOverallStandings(finished.overallStandings);
    setCurrentView(finished.view);
  };

  const resetTournament = () => {
    const reset = startNewTournament();
    setTournamentData(reset.tournamentData);
    setOverallStandings(reset.overallStandings);
    setCurrentView(reset.view);
  };

  const handleReshuffleTournament = (maxScore: number) => {
    if (!tournamentData) return;
    const next = playAgain(tournamentData, maxScore);
    setTournamentData(next.tournamentData);
    setCurrentView(next.view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {view === "setup" && (
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

        {view === "setup" && (
          <TournamentSetup onSetupComplete={handleTournamentSetup} />
        )}

        {view === "matches" && tournamentData && (
          <MatchesList
            tournamentData={tournamentData}
            onFinishMatches={handleFinishMatches}
            onMatchesUpdate={handleMatchesUpdate}
            onResetTournament={resetTournament}
          />
        )}

        {view === "results" &&
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
