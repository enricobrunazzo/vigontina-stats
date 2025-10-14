// App.jsx (versione ottimizzata con useMatch)
import React, { useState, useEffect, useCallback } from "react";

// Hooks
import { useTimer } from "./hooks/useTimer";
import { useMatchHistory } from "./hooks/useMatchHistory";
import { useMatch } from "./hooks/useMatch";

// Components
import NewMatchForm from "./components/NewMatchForm";
import MatchOverview from "./components/MatchOverview";
import PeriodPlay from "./components/PeriodPlay";
import MatchHistory from "./components/MatchHistory";
import MatchSummary from "./components/MatchSummary";

// Utils
import { exportMatchToExcel, exportMatchToPDF } from "./utils/exportUtils";

const VigontinaStats = () => {
  // Routing
  const [page, setPage] = useState("home");
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState(null);

  // Custom hooks
  const timer = useTimer();
  const {
    matchHistory,
    loadHistory,
    saveMatch,
    deleteMatch,
    stats,
    lastPlayedMatch,
  } = useMatchHistory();
  
  const match = useMatch();

  // Load history and timer state on mount
  useEffect(() => {
    loadHistory();
    timer.loadTimerState();
  }, [loadHistory, timer.loadTimerState]);

  // Match management
  const handleCreateNewMatch = useCallback((matchData) => {
    match.createMatch(matchData);
    setPage("match-overview");
  }, [match]);

  const handleStartPeriod = useCallback((periodIndex) => {
    match.setPeriod(periodIndex);
    timer.resetTimer();
    setPage("period");
  }, [match, timer]);

  const handleViewCompletedPeriod = useCallback((periodIndex) => {
    match.setPeriod(periodIndex);
    setPage("period-view");
  }, [match]);

  const handleSaveMatch = async () => {
    const success = await saveMatch(match.currentMatch);
    if (success) {
      match.resetMatch();
      setPage("home");
    }
  };

  const handleFinishPeriod = () => {
    const completed = match.completePeriod();
    if (completed) {
      timer.resetTimer();
      match.resetPeriod();
      setPage("match-overview");
    }
  };

  const handleBackFromPeriod = () => {
    setPage("match-overview");
    match.resetPeriod();
  };

  const handleAbandonMatch = () => {
    if (window.confirm("Sei sicuro? I dati non salvati andranno persi.")) {
      match.resetMatch();
      setPage("home");
    }
  };

  // Event handlers that use timer.getCurrentMinute
  const handleAddGoal = useCallback(
    (scorerNum, assistNum) => {
      match.addGoal(scorerNum, assistNum, timer.getCurrentMinute);
    },
    [match, timer]
  );

  const handleAddOwnGoal = useCallback(() => {
    match.addOwnGoal(timer.getCurrentMinute);
  }, [match, timer]);

  const handleAddOpponentGoal = useCallback(() => {
    match.addOpponentGoal(timer.getCurrentMinute);
  }, [match, timer]);

  const handleAddPenalty = useCallback(
    (team, scored, scorerNum) => {
      match.addPenalty(team, scored, scorerNum, timer.getCurrentMinute);
    },
    [match, timer]
  );

  // Render routes
  if (page === "home") {
    return (
      <HomeScreen
        stats={stats}
        lastPlayedMatch={lastPlayedMatch}
        onNewMatch={() => setPage("new-match")}
        onViewHistory={() => setPage("history")}
        onViewLastMatch={(selectedMatch) => {
          setSelectedHistoryMatch(selectedMatch);
          setPage("history-summary");
        }}
      />
    );
  }

  if (page === "new-match") {
    return (
      <NewMatchForm
        onSubmit={handleCreateNewMatch}
        onCancel={() => setPage("home")}
      />
    );
  }

  if (page === "match-overview" && match.currentMatch) {
    return (
      <MatchOverview
        match={match.currentMatch}
        onStartPeriod={handleStartPeriod}
        onViewPeriod={handleViewCompletedPeriod}
        onSave={handleSaveMatch}
        onExportExcel={() => exportMatchToExcel(match.currentMatch)}
        onExportPDF={() => exportMatchToPDF(match.currentMatch)}
        onSummary={() => setPage("summary")}
        isTimerRunning={timer.isTimerRunning}
        onBack={handleAbandonMatch}
      />
    );
  }

  if (page === "period" && match.currentMatch && match.currentPeriod !== null) {
    return (
      <PeriodPlay
        match={match.currentMatch}
        periodIndex={match.currentPeriod}
        timer={timer}
        onAddGoal={handleAddGoal}
        onAddOwnGoal={handleAddOwnGoal}
        onAddOpponentGoal={handleAddOpponentGoal}
        onAddPenalty={handleAddPenalty}
        onUpdateScore={match.updateScore}
        onFinish={handleFinishPeriod}
        onSetLineup={match.setLineup}
        onBack={handleBackFromPeriod}
      />
    );
  }

  if (page === "period-view" && match.currentMatch && match.currentPeriod !== null) {
    return (
      <PeriodPlay
        match={match.currentMatch}
        periodIndex={match.currentPeriod}
        timer={timer}
        onAddGoal={handleAddGoal}
        onAddOwnGoal={handleAddOwnGoal}
        onAddOpponentGoal={handleAddOpponentGoal}
        onAddPenalty={handleAddPenalty}
        onUpdateScore={match.updateScore}
        onFinish={handleFinishPeriod}
        isEditing={true}
        onSetLineup={match.setLineup}
        onBack={handleBackFromPeriod}
      />
    );
  }

  if (page === "history") {
    return (
      <MatchHistory
        matches={matchHistory}
        onBack={() => setPage("home")}
        onViewStats={(selectedMatch) => {
          setSelectedHistoryMatch(selectedMatch);
          setPage("history-summary");
        }}
        onExportExcel={exportMatchToExcel}
        onExportPDF={exportMatchToPDF}
        onDelete={deleteMatch}
      />
    );
  }

  if (page === "summary" && match.currentMatch) {
    return (
      <MatchSummary
        match={match.currentMatch}
        onBack={() => setPage("match-overview")}
        onExportExcel={() => exportMatchToExcel(match.currentMatch)}
        onExportPDF={() => exportMatchToPDF(match.currentMatch)}
      />
    );
  }

  if (page === "history-summary" && selectedHistoryMatch) {
    return (
      <MatchSummary
        match={selectedHistoryMatch}
        onBack={() => {
          setSelectedHistoryMatch(null);
          setPage("history");
        }}
        onExportExcel={() => exportMatchToExcel(selectedHistoryMatch)}
        onExportPDF={() => exportMatchToPDF(selectedHistoryMatch)}
      />
    );
  }

  return null;
};

// HomeScreen Component
const HomeScreen = ({
  stats,
  lastPlayedMatch,
  onNewMatch,
  onViewHistory,
  onViewLastMatch,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-slate-200">
              <img
                src="/logo-vigontina.png"
                alt="Logo Vigontina San Paolo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Vigontina San Paolo
              </h1>
              <p className="text-sm text-gray-600">Esordienti 2025-2026</p>
            </div>
          </div>

          {stats.totalMatches > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-cyan-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3 text-center">
                Stagione 2025-2026
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalMatches}
                  </p>
                  <p className="text-xs text-gray-600">Partite</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.wins}
                  </p>
                  <p className="text-xs text-gray-600">Vinte</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.draws}
                  </p>
                  <p className="text-xs text-gray-600">Pareggiate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.losses}
                  </p>
                  <p className="text-xs text-gray-600">Perse</p>
                </div>
              </div>
            </div>
          )}

          {lastPlayedMatch && (
            <div className="bg-white rounded-lg shadow mb-6 border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Ultima partita</h3>
                <p className="text-xs text-gray-500">
                  {new Date(lastPlayedMatch.date).toLocaleDateString("it-IT")}
                  {" • "}
                  {lastPlayedMatch.isHome ? "🏠 Casa" : "✈️ Trasferta"}
                  {" • "}
                  {lastPlayedMatch.competition}
                  {lastPlayedMatch.matchDay &&
                    ` - Giornata ${lastPlayedMatch.matchDay}`}
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600">Vigontina</p>
                    <p className="text-3xl font-bold">
                      {lastPlayedMatch.finalPoints?.vigontina ?? 0}
                    </p>
                  </div>
                  <span className="px-3 text-gray-400">-</span>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600">
                      {lastPlayedMatch.opponent}
                    </p>
                    <p className="text-3xl font-bold">
                      {lastPlayedMatch.finalPoints?.opponent ?? 0}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onViewLastMatch(lastPlayedMatch)}
                  className="w-full mt-3 bg-blue-500 text-white py-1 rounded hover:bg-blue-600 text-sm"
                >
                  Dettagli ultima partita
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onNewMatch}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition text-base font-medium"
            >
              Nuova Partita
            </button>
            <button
              onClick={onViewHistory}
              className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition text-base font-medium"
            >
              Storico Partite ({stats.totalMatches})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VigontinaStats;