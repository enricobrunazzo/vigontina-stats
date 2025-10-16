// App.jsx (single "Nuova Partita" with mode dialog, LIVE banner, shared read-only)
import React, { useState, useEffect, useCallback } from "react";

// Hooks
import { useTimer } from "./hooks/useTimer";
import { useMatchHistory } from "./hooks/useMatchHistory";
import { useMatch } from "./hooks/useMatch";
import { useSharedMatch } from "./hooks/useSharedMatch";
import { canModifyShared } from "./hooks/sharedConstants";

// Components
import NewMatchForm from "./components/NewMatchForm";
import MatchOverview from "./components/MatchOverview";
import PeriodPlay from "./components/PeriodPlay";
import MatchHistory from "./components/MatchHistory";
import MatchSummary from "./components/MatchSummary";
import FIGCReport from "./components/FIGCReport";
import SharedMatchManager from "./components/SharedMatchManager";
import NewMatchModeDialog from "./components/NewMatchModeDialog";
import LiveBanner from "./components/LiveBanner";

// Utils
import { exportMatchToExcel, exportMatchToPDF, exportHistoryToExcel } from "./utils/exportUtils";
import { calculatePoints } from "./utils/matchUtils";

const VigontinaStats = () => {
  // Routing
  const [page, setPage] = useState("home");
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState(null);
  const [matchMode, setMatchMode] = useState('local'); // 'local' | 'shared'
  const [showModeDialog, setShowModeDialog] = useState(false);

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
  const sharedMatch = useSharedMatch();

  // Load history and timer state on mount
  useEffect(() => {
    loadHistory();
    timer.loadTimerState();
  }, [loadHistory, timer.loadTimerState]);

  // Persist matchMode across reloads
  useEffect(() => {
    const storedMode = localStorage.getItem('matchMode');
    if (storedMode) setMatchMode(storedMode);
  }, []);
  useEffect(() => {
    localStorage.setItem('matchMode', matchMode);
  }, [matchMode]);

  // Auto-join if URL has ?match=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('match');
    if (code && !sharedMatch.matchId) {
      sharedMatch.joinMatch(code).then(() => {
        setMatchMode('shared');
        setPage('match-overview');
      }).catch(() => {
        // ignore join error; keep home
      });
    }
  }, [sharedMatch.matchId]);

  // Choose current source (local/shared)
  const currentMatch = matchMode === 'shared' && sharedMatch.sharedMatch 
    ? sharedMatch.sharedMatch 
    : match.currentMatch;
  
  const currentPeriod = matchMode === 'shared' && sharedMatch.sharedMatch
    ? sharedMatch.sharedMatch.currentPeriod
    : match.currentPeriod;

  // Start flow
  const openNewMatch = useCallback(() => {
    setShowModeDialog(true);
  }, []);

  const handleModeSelected = useCallback(async ({ mode }) => {
    setMatchMode(mode);
    setShowModeDialog(false);
    setPage("new-match");
  }, []);

  const handleCreateNewMatch = useCallback(
    (matchData) => {
      if (matchMode === 'shared') {
        sharedMatch.createSharedMatch(matchData).then(() => {
          // After creating shared, go back to Home where LIVE banner appears
          setPage("home");
        }).catch(error => {
          console.error('Errore creazione partita condivisa:', error);
          // Fallback to local
          match.createMatch(matchData);
          setMatchMode('local');
          setPage("match-overview");
        });
      } else {
        match.createMatch(matchData);
        setPage("match-overview");
      }
    },
    [match, sharedMatch, matchMode]
  );

  const handleJoinSharedMatch = useCallback(
    async (code) => {
      await sharedMatch.joinMatch(code);
      setMatchMode('shared');
      setPage("match-overview");
    },
    [sharedMatch]
  );

  const handleStartPeriod = useCallback(
    (periodIndex) => {
      if (matchMode === 'shared') {
        if (canModifyShared(sharedMatch.userRole)) {
          sharedMatch.setSharedPeriod(periodIndex);
        }
      } else {
        match.setPeriod(periodIndex);
      }
      timer.resetTimer();
      setPage("period");
    },
    [match, sharedMatch, timer, matchMode]
  );

  const handleViewCompletedPeriod = useCallback(
    (periodIndex) => {
      if (matchMode === 'local') {
        match.setPeriod(periodIndex);
      }
      setPage("period-view");
    },
    [match, matchMode]
  );

  const handleSaveMatch = async () => {
    const matchToSave = matchMode === 'shared' ? sharedMatch.sharedMatch : match.currentMatch;
    const success = await saveMatch(matchToSave);
    if (success) {
      if (matchMode === 'shared') {
        sharedMatch.endSharedMatch();
        setMatchMode('local');
      } else {
        match.resetMatch();
      }
      setPage("home");
    }
  };

  const handleFinishPeriod = () => {
    let completed = false;
    
    if (matchMode === 'shared') {
      if (canModifyShared(sharedMatch.userRole)) {
        // For now, mark as completed in shared data
        sharedMatch.updateSharedMatch({
          periods: currentMatch.periods.map((p, idx) => idx === currentPeriod ? { ...p, completed: true } : p )
        });
        completed = true;
      }
    } else {
      completed = match.completePeriod();
    }
    
    if (completed) {
      timer.resetTimer();
      if (matchMode === 'local') {
        match.resetPeriod();
      }
      setPage("match-overview");
    }
  };

  const handleBackFromPeriod = () => {
    setPage("match-overview");
    if (matchMode === 'local') {
      match.resetPeriod();
    }
  };

  const handleAbandonMatch = () => {
    if (window.confirm("Sei sicuro? I dati non salvati andranno persi.")) {
      if (matchMode === 'shared') {
        sharedMatch.leaveMatch();
        setMatchMode('local');
      } else {
        match.resetMatch();
      }
      setPage("home");
    }
  };

  // Export history
  const handleExportHistory = useCallback(() => {
    exportHistoryToExcel(matchHistory);
  }, [matchHistory]);

  const handleOpenHistoryFIGCReport = useCallback((selectedMatch) => {
    setSelectedHistoryMatch(selectedMatch);
    setPage("history-figc-report");
  }, []);

  // Event handlers (respect shared read-only for viewers)
  const handleAddGoal = useCallback(
    (scorerNum, assistNum) => {
      if (matchMode === 'shared') {
        if (canModifyShared(sharedMatch.userRole)) {
          sharedMatch.addSharedGoal(scorerNum, assistNum, timer.getCurrentMinute);
        }
      } else {
        match.addGoal(scorerNum, assistNum, timer.getCurrentMinute);
      }
    },
    [match, sharedMatch, timer, matchMode]
  );
  
  const handleAddOwnGoal = useCallback(() => {
    if (matchMode === 'local') {
      match.addOwnGoal(timer.getCurrentMinute);
    }
  }, [match, timer, matchMode]);
  
  const handleAddOpponentGoal = useCallback(() => {
    if (matchMode === 'local') {
      match.addOpponentGoal(timer.getCurrentMinute);
    }
  }, [match, timer, matchMode]);
  
  const handleAddPenalty = useCallback(
    (team, scored, scorerNum) => {
      if (matchMode === 'local') {
        match.addPenalty(team, scored, scorerNum, timer.getCurrentMinute);
      }
    },
    [match, timer, matchMode]
  );

  const handleUpdateScore = useCallback(
    (team, delta) => {
      if (matchMode === 'local') {
        match.updateScore(team, delta);
      }
    },
    [match, matchMode]
  );

  // RENDER
  if (page === "home") {
    return (
      <HomeScreen
        stats={stats}
        lastPlayedMatch={lastPlayedMatch}
        onNewMatch={openNewMatch}
        onViewHistory={() => setPage("history")}
        onViewLastMatch={(selectedMatch) => {
          setSelectedHistoryMatch(selectedMatch);
          setPage("history-summary");
        }}
        sharedBanner={
          sharedMatch.matchId && sharedMatch.isConnected ? (
            <LiveBanner matchId={sharedMatch.matchId} onOpen={() => setPage("match-overview")} />
          ) : null
        }
        modeDialog={
          showModeDialog ? (
            <NewMatchModeDialog
              onSelect={handleModeSelected}
              onCancel={() => setShowModeDialog(false)}
            />
          ) : null
        }
      />
    );
  }

  if (page === "new-match") {
    return (
      <NewMatchForm
        onSubmit={handleCreateNewMatch}
        onCancel={() => setPage("home")}
        isShared={matchMode === 'shared'}
      />
    );
  }

  if (page === "match-overview" && currentMatch) {
    return (
      <MatchOverview
        match={currentMatch}
        onStartPeriod={handleStartPeriod}
        onViewPeriod={handleViewCompletedPeriod}
        onSave={handleSaveMatch}
        onExportExcel={() => exportMatchToExcel(currentMatch)}
        onExportPDF={() => exportMatchToPDF(currentMatch)}
        onSummary={() => setPage("summary")}
        onFIGCReport={() => setPage("figc-report")}
        isTimerRunning={timer.isTimerRunning}
        onBack={handleAbandonMatch}
        isShared={matchMode === 'shared'}
        userRole={sharedMatch.userRole}
      />
    );
  }

  if (page === "period" && currentMatch && currentPeriod !== null) {
    return (
      <PeriodPlay
        match={currentMatch}
        periodIndex={currentPeriod}
        timer={timer}
        onAddGoal={handleAddGoal}
        onAddOwnGoal={handleAddOwnGoal}
        onAddOpponentGoal={handleAddOpponentGoal}
        onAddPenalty={handleAddPenalty}
        onUpdateScore={handleUpdateScore}
        onFinish={handleFinishPeriod}
        onSetLineup={matchMode === 'local' ? match.setLineup : null}
        onBack={handleBackFromPeriod}
        isShared={matchMode === 'shared'}
        userRole={sharedMatch.userRole}
      />
    );
  }

  if (page === "period-view" && currentMatch && currentPeriod !== null) {
    return (
      <PeriodPlay
        match={currentMatch}
        periodIndex={currentPeriod}
        timer={timer}
        onAddGoal={handleAddGoal}
        onAddOwnGoal={handleAddOwnGoal}
        onAddOpponentGoal={handleAddOpponentGoal}
        onAddPenalty={handleAddPenalty}
        onUpdateScore={handleUpdateScore}
        onFinish={handleFinishPeriod}
        isEditing={true}
        onSetLineup={matchMode === 'local' ? match.setLineup : null}
        onBack={handleBackFromPeriod}
        isShared={matchMode === 'shared'}
        userRole={sharedMatch.userRole}
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
        onExportHistory={handleExportHistory}
      />
    );
  }

  if (page === "summary" && currentMatch) {
    return (
      <MatchSummary
        match={currentMatch}
        onBack={() => setPage("match-overview")}
        onExportExcel={() => exportMatchToExcel(currentMatch)}
        onExportPDF={() => exportMatchToPDF(currentMatch)}
        onFIGCReport={() => setPage("figc-report")}
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
        onFIGCReport={() => handleOpenHistoryFIGCReport(selectedHistoryMatch)}
      />
    );
  }

  if (page === "figc-report" && currentMatch) {
    return (
      <FIGCReport
        match={currentMatch}
        onBack={() => setPage("match-overview")}
      />
    );
  }

  if (page === "history-figc-report" && selectedHistoryMatch) {
    return (
      <FIGCReport
        match={selectedHistoryMatch}
        onBack={() => setPage("history-summary")}
      />
    );
  }

  return null;
};

// HomeScreen updated to accept banner and dialog overlays
const HomeScreen = ({
  stats,
  lastPlayedMatch,
  onNewMatch,
  onViewHistory,
  onViewLastMatch,
  sharedBanner,
  modeDialog,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 relative">
          {modeDialog}
          {sharedBanner}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-slate-200">
              <img
                src={`${import.meta.env.BASE_URL}logo-vigontina.png`}
                alt="Logo Vigontina San Paolo"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
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
              <h3 className="font-semibold mb-3 text-center">Stagione 2025-2026</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{stats.totalMatches}</p>
                  <p className="text-xs text-gray-600">Partite</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
                  <p className="text-xs text-gray-600">Vinte</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.draws}</p>
                  <p className="text-xs text-gray-600">Pareggiate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
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
                  {new Date(lastPlayedMatch.date).toLocaleDateString("it-IT")} {" • "}
                  {lastPlayedMatch.isHome ? "🏠 Casa" : "✈️ Trasferta"} {" • "}
                  {lastPlayedMatch.competition}
                  {lastPlayedMatch.matchDay && ` - Giornata ${lastPlayedMatch.matchDay}`}
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600">Vigontina</p>
                    <p className="text-3xl font-bold">
                      {calculatePoints(lastPlayedMatch, "vigontina")}
                    </p>
                  </div>
                  <span className="px-3 text-gray-400">-</span>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600">{lastPlayedMatch.opponent}</p>
                    <p className="text-3xl font-bold">
                      {calculatePoints(lastPlayedMatch, "opponent")}
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
