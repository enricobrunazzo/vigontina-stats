// App.jsx (versione aggiornata con funzionalità condivise multi-utente)
import React, { useState, useEffect, useCallback } from "react";

// Hooks
import { useTimer } from "./hooks/useTimer";
import { useMatchHistory } from "./hooks/useMatchHistory";
import { useMatch } from "./hooks/useMatch";
import { useSharedMatch } from "./hooks/useSharedMatch";

// Components
import NewMatchForm from "./components/NewMatchForm";
import MatchOverview from "./components/MatchOverview";
import PeriodPlay from "./components/PeriodPlay";
import MatchHistory from "./components/MatchHistory";
import MatchSummary from "./components/MatchSummary";
import FIGCReport from "./components/FIGCReport";
import SharedMatchManager from "./components/SharedMatchManager";

// Utils
import { exportMatchToExcel, exportMatchToPDF, exportHistoryToExcel } from "./utils/exportUtils";
import { calculatePoints } from "./utils/matchUtils";

const VigontinaStats = () => {
  // Routing
  const [page, setPage] = useState("home");
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState(null);
  const [matchMode, setMatchMode] = useState('local'); // 'local' | 'shared'

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

  // Determina quale match usare (locale o condiviso)
  const currentMatch = matchMode === 'shared' && sharedMatch.sharedMatch 
    ? sharedMatch.sharedMatch 
    : match.currentMatch;
  
  const currentPeriod = matchMode === 'shared' && sharedMatch.sharedMatch
    ? sharedMatch.sharedMatch.currentPeriod
    : match.currentPeriod;

  // Match management
  const handleCreateNewMatch = useCallback(
    (matchData) => {
      if (matchMode === 'shared') {
        // Crea partita condivisa
        sharedMatch.createSharedMatch(matchData).then(() => {
          setPage("match-overview");
        }).catch(error => {
          console.error('Errore creazione partita condivisa:', error);
          // Fallback a locale
          match.createMatch(matchData);
          setMatchMode('local');
          setPage("match-overview");
        });
      } else {
        // Crea partita locale
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
        sharedMatch.setSharedPeriod(periodIndex);
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
      if (matchMode === 'shared') {
        // Per partite condivise, usiamo lo stesso periodo dal shared match
        // Non modifichiamo il currentPeriod del shared match per la visualizzazione
      } else {
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
    
    if (matchMode === 'shared' && sharedMatch.userRole === 'organizer') {
      // Solo l'organizzatore può completare i periodi nelle partite condivise
      // Implementa la logica per completare il periodo nelle partite condivise
      completed = true; // Semplificato per ora
    } else if (matchMode === 'local') {
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

  // Handler per export storico
  const handleExportHistory = useCallback(() => {
    exportHistoryToExcel(matchHistory);
  }, [matchHistory]);

  // Handler per aprire FIGC Report da storico
  const handleOpenHistoryFIGCReport = useCallback((selectedMatch) => {
    setSelectedHistoryMatch(selectedMatch);
    setPage("history-figc-report");
  }, []);

  // Event handlers che si adattano al tipo di partita
  const handleAddGoal = useCallback(
    (scorerNum, assistNum) => {
      if (matchMode === 'shared' && sharedMatch.userRole !== 'viewer') {
        sharedMatch.addSharedGoal(scorerNum, assistNum, timer.getCurrentMinute);
      } else if (matchMode === 'local') {
        match.addGoal(scorerNum, assistNum, timer.getCurrentMinute);
      }
    },
    [match, sharedMatch, timer, matchMode]
  );
  
  const handleAddOwnGoal = useCallback(() => {
    if (matchMode === 'local') {
      match.addOwnGoal(timer.getCurrentMinute);
    }
    // Implementa per shared match se necessario
  }, [match, timer, matchMode]);
  
  const handleAddOpponentGoal = useCallback(() => {
    if (matchMode === 'local') {
      match.addOpponentGoal(timer.getCurrentMinute);
    }
    // Implementa per shared match se necessario
  }, [match, timer, matchMode]);
  
  const handleAddPenalty = useCallback(
    (team, scored, scorerNum) => {
      if (matchMode === 'local') {
        match.addPenalty(team, scored, scorerNum, timer.getCurrentMinute);
      }
      // Implementa per shared match se necessario
    },
    [match, timer, matchMode]
  );

  const handleUpdateScore = useCallback(
    (team, delta) => {
      if (matchMode === 'local') {
        match.updateScore(team, delta);
      }
      // Implementa per shared match se necessario
    },
    [match, matchMode]
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
        onJoinSharedMatch={() => setPage("shared-match")}
      />
    );
  }

  if (page === "shared-match") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Partita Condivisa</h1>
              <button
                onClick={() => setPage("home")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Indietro
              </button>
            </div>
            
            <SharedMatchManager
              onCreateSharedMatch={async (matchData) => {
                setMatchMode('shared');
                return handleCreateNewMatch(matchData);
              }}
              onJoinSharedMatch={handleJoinSharedMatch}
              sharedMatchId={sharedMatch.matchId}
              userRole={sharedMatch.userRole}
              participants={sharedMatch.participants}
              isConnected={sharedMatch.isConnected}
            />
            
            {sharedMatch.isConnected && (
              <div className="mt-6">
                <button
                  onClick={() => setPage("match-overview")}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
                >
                  Vai alla Partita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === "new-match") {
    return (
      <div className="space-y-6">
        {/* Selezione modalità partita */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tipo di Partita</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMatchMode('local')}
              className={`p-4 border-2 rounded-lg transition ${
                matchMode === 'local'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <h4 className="font-semibold">Partita Locale</h4>
              <p className="text-sm text-gray-600 mt-1">
                Solo per te, salvata sul dispositivo
              </p>
            </button>
            
            <button
              onClick={() => setMatchMode('shared')}
              className={`p-4 border-2 rounded-lg transition ${
                matchMode === 'shared'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <h4 className="font-semibold">Partita Condivisa</h4>
              <p className="text-sm text-gray-600 mt-1">
                Visibile da più persone in tempo reale
              </p>
            </button>
          </div>
        </div>
        
        <NewMatchForm
          onSubmit={handleCreateNewMatch}
          onCancel={() => setPage("home")}
          isShared={matchMode === 'shared'}
        />
      </div>
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
        sharedMatchId={sharedMatch.matchId}
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

  // FIGC Report per partita corrente
  if (page === "figc-report" && currentMatch) {
    return (
      <FIGCReport
        match={currentMatch}
        onBack={() => setPage("match-overview")}
      />
    );
  }

  // FIGC Report per partita storica
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

// HomeScreen Component (aggiornato con pulsante partita condivisa)
const HomeScreen = ({
  stats,
  lastPlayedMatch,
  onNewMatch,
  onViewHistory,
  onViewLastMatch,
  onJoinSharedMatch,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
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
              onClick={onJoinSharedMatch}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition text-base font-medium"
            >
              Partita Condivisa
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