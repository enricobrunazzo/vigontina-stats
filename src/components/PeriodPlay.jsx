// components/PeriodPlay.jsx (hide actions for shared viewers)
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import PenaltyModal from "./modals/PenaltyModal";
import LineupModal from "./modals/LineupModal";

const PeriodPlay = ({
  match,
  periodIndex,
  timer,
  onAddGoal,
  onAddOwnGoal,
  onAddOpponentGoal,
  onAddPenalty,
  onUpdateScore,
  onFinish,
  isEditing,
  onBack,
  onSetLineup,
  isShared = false,
  userRole = 'viewer',
}) => {
  const period = match.periods[periodIndex];
  const isProvaTecnica = period.name === "PROVA TECNICA";
  const isViewer = isShared && userRole !== 'organizer';

  // Modal states
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [showLineupDialog, setShowLineupDialog] = useState(false);

  // Manual score mode
  const [manualScoreMode, setManualScoreMode] = useState(false);

  const availablePlayers = useMemo(
    () => PLAYERS.filter((p) => !(match.notCalled?.includes?.(p.num))),
    [match.notCalled]
  );

  // Get period title
  const periodNumberMatch = period.name.match(/(\d+)°/);
  const periodNumber = periodNumberMatch ? periodNumberMatch[1] : "";
  const periodTitle = isProvaTecnica
    ? "Prova Tecnica"
    : `${periodNumber}° Tempo`;

  // Auto-open lineup modal for normal periods without lineup
  useEffect(() => {
    if (!isProvaTecnica && !isViewer && (!period.lineup || period.lineup.length !== 9)) {
      setShowLineupDialog(true);
    }
  }, [periodIndex, isProvaTecnica, period.lineup, isViewer]);

  const handleAddGoal = (scorerNum, assistNum) => {
    onAddGoal(scorerNum, assistNum);
    setShowGoalDialog(false);
  };

  const handleAddPenalty = (team, scored, scorerNum) => {
    onAddPenalty(team, scored, scorerNum);
    setShowPenaltyDialog(false);
  };

  const handleSetLineup = (lineupNums) => {
    onSetLineup?.(periodIndex, lineupNums);
    setShowLineupDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Modals (solo se non viewer) */}
        {!isViewer && showGoalDialog && (
          <GoalModal
            availablePlayers={availablePlayers}
            onConfirm={handleAddGoal}
            onCancel={() => setShowGoalDialog(false)}
          />
        )}

        {!isViewer && showPenaltyDialog && (
          <PenaltyModal
            availablePlayers={availablePlayers}
            opponentName={match.opponent}
            onConfirm={handleAddPenalty}
            onCancel={() => setShowPenaltyDialog(false)}
          />
        )}

        {!isViewer && showLineupDialog && (
          <LineupModal
            availablePlayers={availablePlayers}
            initialLineup={period.lineup || []}
            onConfirm={handleSetLineup}
            onCancel={() => setShowLineupDialog(false)}
          />
        )}

        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna alla Panoramica
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            Vigontina vs {match.opponent} - {periodTitle}
          </h2>

          {/* Lineup and manual score controls */}
          {!isViewer && !isProvaTecnica && (
            <div className="flex justify-end -mt-2 mb-2 gap-2">
              <button
                onClick={() => setShowLineupDialog(true)}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200"
                title="Modifica i 9 in campo"
              >
                👥 9 in campo
              </button>
              <button
                onClick={() => setManualScoreMode((m) => !m)}
                className={`text-xs px-2 py-1 rounded border ${
                  manualScoreMode
                    ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
                title="Attiva/Disattiva modifica manuale punteggio"
              >
                {manualScoreMode
                  ? "✔️ Modifica punteggio attiva"
                  : "✏️ Modifica punteggio"}
              </button>
            </div>
          )}

          {/* Timer (only for normal periods) */}
          {!isProvaTecnica && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-mono font-bold text-gray-800">
                  {timer.formatTime(timer.timerSeconds)}
                </div>
              </div>
              {!isViewer && (
                <div className="flex gap-2">
                  <button
                    onClick={
                      timer.isTimerRunning ? timer.pauseTimer : timer.startTimer
                    }
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                  >
                    {timer.isTimerRunning ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {timer.isTimerRunning ? "Pausa" : "Avvia"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Score Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">
                {isProvaTecnica ? "Punteggio Prova Tecnica" : "Punteggio Tempo"}
              </p>
              <div className="flex justify-center items-center gap-6">
                <div>
                  <p className="text-xs text-gray-600">Vigontina</p>
                  <p className="text-4xl font-bold text-green-700">
                    {period.vigontina}
                  </p>
                </div>
                <span className="text-2xl">-</span>
                <div>
                  <p className="text-xs text-gray-600">{match.opponent}</p>
                  <p className="text-4xl font-bold text-green-700">
                    {period.opponent}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isViewer && (
            <div className="space-y-3 mb-6">
              {isProvaTecnica ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <p className="text-sm text-blue-800 text-center">
                      <strong>Prova Tecnica:</strong> Inserisci i punti manualmente. Al termine, la squadra vincente guadagna 1 punto nel punteggio finale.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => onUpdateScore("vigontina", -1)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600"><Minus className="w-4 h-4" /></button>
                      <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Punti Vigontina</span></div>
                      <button onClick={() => onUpdateScore("vigontina", 1)} className="bg-green-500 text-white p-2 rounded hover:bg-green-600"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => onUpdateScore("opponent", -1)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600"><Minus className="w-4 h-4" /></button>
                      <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Punti Avversario</span></div>
                      <button onClick={() => onUpdateScore("opponent", 1)} className="bg-green-500 text-white p-2 rounded hover:bg-green-600"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              ) : manualScoreMode ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => onUpdateScore("vigontina", -1)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Gol Vigontina</span></div>
                    <button onClick={() => onUpdateScore("vigontina", 1)} className="bg-green-500 text-white p-2 rounded hover:bg-green-600"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => onUpdateScore("opponent", -1)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Gol {match.opponent}</span></div>
                    <button onClick={() => onUpdateScore("opponent", 1)} className="bg-green-500 text-white p-2 rounded hover:bg-green-600"><Plus className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Nota: le modifiche manuali aggiornano il punteggio del tempo ma non creano eventi Gol.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowGoalDialog(true)} className="bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium text-sm">⚽ GOL</button>
                  <button onClick={onAddOwnGoal} className="bg-red-500 text-white py-2 rounded hover:bg-red-600 font-medium flex items-center justify-center gap-1 text-sm"><span className="bg-red-800 rounded-full w-4 h-4 flex items-center justify-center text-xs">⚽</span>AUTOGOL</button>
                  <button onClick={onAddOpponentGoal} className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 font-medium text-sm">Gol {match.opponent}</button>
                  <button onClick={() => setShowPenaltyDialog(true)} className="bg-purple-500 text-white py-2 rounded hover:bg-purple-600 font-medium text-sm">🎯 RIGORE</button>
                </div>
              )}
            </div>
          )}

          {/* Events List */}
          {!isProvaTecnica && period.goals && period.goals.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Eventi Partita</h3>
              <div className="space-y-2">
                {period.goals.map((event, idx) => (
                  <EventCard key={idx} event={event} opponentName={match.opponent} />
                ))}
              </div>
            </div>
          )}

          {/* Finish Button */}
          <div>
            {!isViewer && (
              <button onClick={onFinish} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 font-medium text-sm">
                {isEditing ? "Salva Modifiche" : `Termina ${periodTitle}`}
              </button>
            )}
            {isViewer && (
              <div className="text-center text-sm text-gray-600">Modalità condivisa: sola lettura</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, opponentName }) => {
  if (event.type === "goal") {
    return (
      <div className="bg-green-50 p-3 rounded border border-green-200">
        <p className="font-medium text-green-800">⚽ {event.minute}' - {event.scorer} {event.scorerName}</p>
        {event.assist && (<p className="text-sm text-green-700">Assist: {event.assist} {event.assistName}</p>)}
      </div>
    );
  }
  if (event.type === "own-goal") {
    return (
      <div className="bg-red-50 p-3 rounded border border-red-200">
        <p className="font-medium text-red-800 flex items-center gap-2"><span className="bg-red-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">⚽</span>{event.minute}' - Autogol</p>
      </div>
    );
  }
  if (event.type === "opponent-goal") {
    return (
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="font-medium text-blue-800">⚽ {event.minute}' - Gol {opponentName}</p>
      </div>
    );
  }
  if (event.type === "penalty-goal") {
    return (
      <div className="bg-green-50 p-3 rounded border border-green-200">
        <p className="font-medium text-green-800">⚽ {event.minute}' - Gol RIG. - {event.scorer} {event.scorerName}</p>
      </div>
    );
  }
  if (event.type === "penalty-missed") {
    return (
      <div className="bg-red-50 p-3 rounded border border-red-200">
        <p className="font-medium text-red-800 flex items-center gap-2"><span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>{event.minute}' - RIG. FALLITO</p>
      </div>
    );
  }
  if (event.type === "penalty-opponent-goal") {
    return (
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="font-medium text-blue-800">⚽ {event.minute}' - Gol RIG. {opponentName}</p>
      </div>
    );
  }
  if (event.type === "penalty-opponent-missed") {
    return (
      <div className="bg-red-50 p-3 rounded border border-red-200">
        <p className="font-medium text-red-800 flex items-center gap-2"><span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">⚽</span>{event.minute}' - RIG. FALLITO {opponentName}</p>
      </div>
    );
  }
  return null;
};

export default PeriodPlay;
