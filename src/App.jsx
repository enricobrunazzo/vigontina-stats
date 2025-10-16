// App.jsx (simplified cloud-first with resume functionality)
import React, { useState, useEffect, useCallback } from "react";

// Hooks
import { useTimer } from "./hooks/useTimer";
import { useMatchHistory } from "./hooks/useMatchHistory";
import { useMatch } from "./hooks/useMatch";
import { useSharedMatch } from "./hooks/useSharedMatch";
import { canModifyShared } from "./hooks/sharedConstants";
import { getActiveMatchCode, setActiveMatchCode, isMatchActive, watchMatch } from "./hooks/cloudPersistence";

// Components
import NewMatchForm from "./components/NewMatchForm";
import MatchOverview from "./components/MatchOverview";
import PeriodPlay from "./components/PeriodPlay";
import MatchHistory from "./components/MatchHistory";
import MatchSummary from "./components/MatchSummary";
import FIGCReport from "./components/FIGCReport";
import LiveDashboard from "./components/LiveDashboard";

// Utils
import { exportMatchToExcel, exportMatchToPDF, exportHistoryToExcel } from "./utils/exportUtils";
import { calculatePoints } from "./utils/matchUtils";

const VigontinaStats = () => {
  // Routing
  const [page, setPage] = useState("home");
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState(null);
  const [liveMatchData, setLiveMatchData] = useState(null);
  const [liveLastEvent, setLiveLastEvent] = useState("");
  const [hasActiveMatch, setHasActiveMatch] = useState(false);

  // Custom hooks
  const timer = useTimer();
  const { matchHistory, loadHistory, saveMatch, deleteMatch, stats, lastPlayedMatch } = useMatchHistory();
  const match = useMatch();
  const sharedMatch = useSharedMatch();

  // Load history and timer state on mount
  useEffect(() => {
    loadHistory();
    timer.loadTimerState();
  }, [loadHistory, timer.loadTimerState]);

  // Check for active match on startup
  useEffect(() => {
    const checkActiveMatch = async () => {
      const saved = getActiveMatchCode();
      if (!saved) {
        setHasActiveMatch(false);
        return;
      }
      
      try {
        const active = await isMatchActive(saved);
        if (active) {
          setHasActiveMatch(true);
          // Subscribe to live updates
          const unsub = watchMatch(saved, (data) => {
            setLiveMatchData(data);
            setLiveLastEvent(data?.realtime?.lastEvent || "");
          });
          return () => unsub && unsub();
        } else {
          // Clean up if match is no longer active
          setActiveMatchCode(null);
          setHasActiveMatch(false);
        }
      } catch (error) {
        console.error('Error checking active match:', error);
        setActiveMatchCode(null);
        setHasActiveMatch(false);
      }
    };
    
    checkActiveMatch();
  }, []);

  // Choose current source (always use shared when available, fallback to local)
  const currentMatch = sharedMatch.sharedMatch || match.currentMatch;
  const currentPeriod = sharedMatch.sharedMatch ? sharedMatch.sharedMatch.currentPeriod : match.currentPeriod;
  const isSharedMode = !!sharedMatch.sharedMatch;

  // Start new match - automatically create in cloud
  const handleCreateNewMatch = useCallback(async (matchData) => {
    try {
      // Always try to create shared match first
      const matchId = await sharedMatch.createSharedMatch(matchData);
      setActiveMatchCode(matchId);
      setHasActiveMatch(true);
      setPage("match-overview");
    } catch (error) {
      console.error('Failed to create shared match, using local:', error);
      // Fallback to local match
      match.createMatch(matchData);
      setPage("match-overview");
    }
  }, [match, sharedMatch]);

  // Resume active match
  const handleResumeMatch = useCallback(async () => {
    const code = getActiveMatchCode();
    if (!code) return;
    
    try {
      await sharedMatch.joinMatch(code, 'organizer');
      setPage("match-overview");
    } catch (error) {
      console.error('Failed to resume match:', error);
      // Clean up invalid match code
      setActiveMatchCode(null);
      setHasActiveMatch(false);
    }
  }, [sharedMatch]);

  const handleStartPeriod = useCallback((periodIndex) => {
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.setSharedPeriod(periodIndex);
      }
    } else {
      match.setPeriod(periodIndex);
    }
    timer.resetTimer();
    setPage("period");
  }, [match, sharedMatch, timer, isSharedMode]);

  const handleViewCompletedPeriod = useCallback((periodIndex) => {
    if (!isSharedMode) {
      match.setPeriod(periodIndex);
    }
    setPage("period-view");
  }, [match, isSharedMode]);

  const handleSaveMatch = async () => {
    const matchToSave = currentMatch;
    const success = await saveMatch(matchToSave);
    if (success) {
      // End the shared match and clean up
      if (isSharedMode) {
        await sharedMatch.endSharedMatch();
      } else {
        match.resetMatch();
      }
      setActiveMatchCode(null);
      setHasActiveMatch(false);
      setLiveMatchData(null);
      setPage("home");
    }
  };

  const handleFinishPeriod = () => {
    let completed = false;
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.updateSharedMatch({
          periods: currentMatch.periods.map((p, idx) => 
            idx === currentPeriod ? { ...p, completed: true } : p
          )
        });
        completed = true;
      }
    } else {
      completed = match.completePeriod();
    }
    
    if (completed) {
      timer.resetTimer();
      if (!isSharedMode) match.resetPeriod();
      setPage("match-overview");
    }
  };

  const handleBackFromPeriod = () => {
    setPage("match-overview");
    if (!isSharedMode) match.resetPeriod();
  };

  const handleAbandonMatch = () => {
    if (window.confirm("Sei sicuro? La partita verrà abbandonata definitivamente.")) {
      if (isSharedMode) {
        sharedMatch.endSharedMatch();
      } else {
        match.resetMatch();
      }
      setActiveMatchCode(null);
      setHasActiveMatch(false);
      setLiveMatchData(null);
      setPage("home");
    }
  };

  // Export history
  const handleExportHistory = useCallback(() => exportHistoryToExcel(matchHistory), [matchHistory]);
  const handleOpenHistoryFIGCReport = useCallback((selectedMatch) => {
    setSelectedHistoryMatch(selectedMatch);
    setPage("history-figc-report");
  }, []);

  // Event handlers (respect shared read-only for viewers)
  const handleAddGoal = useCallback((scorerNum, assistNum) => {
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.addSharedGoal(scorerNum, assistNum, timer.getCurrentMinute);
      }
    } else {
      match.addGoal(scorerNum, assistNum, timer.getCurrentMinute);
    }
  }, [match, sharedMatch, timer, isSharedMode]);

  const handleAddOwnGoal = useCallback(() => {
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.addOwnGoal(timer.getCurrentMinute);
      }
    } else {
      match.addOwnGoal(timer.getCurrentMinute);
    }
  }, [match, sharedMatch, timer, isSharedMode]);

  const handleAddOpponentGoal = useCallback(() => {
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.addOpponentGoal(timer.getCurrentMinute);
      }
    } else {
      match.addOpponentGoal(timer.getCurrentMinute);
    }
  }, [match, sharedMatch, timer, isSharedMode]);

  const handleAddPenalty = useCallback((team, scored, scorerNum) => {
    if (isSharedMode) {
      if (canModifyShared(sharedMatch.userRole)) {
        sharedMatch.addPenalty(team, scored, scorerNum, timer.getCurrentMinute);
      }
    } else {
      match.addPenalty(team, scored, scorerNum, timer.getCurrentMinute);
    }
  }, [match, sharedMatch, timer, isSharedMode]);

  const handleUpdateScore = useCallback((team, delta) => {
    if (!isSharedMode) {
      match.updateScore(team, delta);
    }
  }, [match, isSharedMode]);

  // RENDER
  if (page === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Live Dashboard - shown when there's an active match */}
          {hasActiveMatch && liveMatchData?.isActive && (
            <LiveDashboard 
              match={liveMatchData} 
              lastEvent={liveLastEvent} 
              onManage={handleResumeMatch}
            />
          )}
          
          <HomeScreen
            stats={stats}
            lastPlayedMatch={lastPlayedMatch}
            onNewMatch={() => setPage("new-match")}
            onResumeMatch={handleResumeMatch}
            onViewHistory={() => setPage("history")}
            onViewLastMatch={(selectedMatch) => {
              setSelectedHistoryMatch(selectedMatch);
              setPage("history-summary");
            }}
            hasActiveMatch={hasActiveMatch}
          />
        </div>
      </div>
    );
  }

  if (page === "new-match") {
    return (
      <NewMatchForm
        onSubmit={handleCreateNewMatch}
        onCancel={() => setPage("home")}
        isShared={true} // Always cloud-enabled
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
        isShared={isSharedMode}
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
        onSetLineup={!isSharedMode ? match.setLineup : null}
        onBack={handleBackFromPeriod}
        isShared={isSharedMode}
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
        onSetLineup={!isSharedMode ? match.setLineup : null}
        onBack={handleBackFromPeriod}
        isShared={isSharedMode}
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

// Updated HomeScreen Component with conditional button text
const HomeScreen = ({
  stats,
  lastPlayedMatch,
  onNewMatch,
  onResumeMatch,
  onViewHistory,
  onViewLastMatch,
  hasActiveMatch
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
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
              {new Date(lastPlayedMatch.date).toLocaleDateString("it-IT")}
              {" • "}
              {lastPlayedMatch.isHome ? "🏠 Casa" : "✈️ Trasferta"}
              {" • "}
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
        {/* Conditional button text based on active match */}
        {hasActiveMatch ? (
          <button
            onClick={onResumeMatch}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition text-base font-medium"
          >
            Riprendi Partita
          </button>
        ) : (
          <button
            onClick={onNewMatch}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition text-base font-medium"
          >
            Nuova Partita
          </button>
        )}
        
        <button
          onClick={onViewHistory}
          className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition text-base font-medium"
        >
          Storico Partite ({stats.totalMatches})
        </button>
      </div>
    </div>
  );
};

export default VigontinaStats;