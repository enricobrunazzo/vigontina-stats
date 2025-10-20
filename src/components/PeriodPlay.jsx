// components/PeriodPlay.jsx (final full version with actions + prova tecnica)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Pause, Flag, Repeat } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
import SubstitutionModal from "./modals/SubstitutionModal";
import ProvaTecnicaPanel from "./ProvaTecnicaPanel";

const PeriodPlay = ({
  match,
  periodIndex,
  timer,
  onAddGoal,
  onAddOwnGoal,
  onAddOpponentGoal,
  onAddPenalty,
  onAddSave,
  onAddMissedShot,
  onAddPostCrossbar,
  onAddShotBlocked,
  onUpdateScore,
  onDeleteEvent,
  onFinish,
  isEditing,
  onBack,
  onSetLineup,
  isShared = false,
  userRole = 'organizer',
  onAddSubstitution,
  onAddFreeKick,
}) => {
  const hasMatch = !!match && Array.isArray(match.periods);
  const period = hasMatch && periodIndex != null ? match.periods[periodIndex] : null;
  if (!hasMatch || !period) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
        <div className="max-w-2xl mx-auto text-white text-center">
          <p className="mb-3">Errore: periodo non disponibile.</p>
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded">Torna indietro</button>
        </div>
      </div>
    );
  }

  const isProvaTecnica = period.name === "PROVA TECNICA";
  const isViewer = isShared && userRole !== 'organizer';
  const safeGetMinute = typeof timer?.getCurrentMinute === 'function' ? timer.getCurrentMinute : () => 0;

  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showOwnGoalDialog, setShowOwnGoalDialog] = useState(false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [showLineupDialog, setShowLineupDialog] = useState(false);
  const [showDeleteEventDialog, setShowDeleteEventDialog] = useState(false);
  const [showShotSelectionDialog, setShowShotSelectionDialog] = useState(false);
  const [showShotTeamDialog, setShowShotTeamDialog] = useState(false);
  const [pendingShotOutcome, setPendingShotOutcome] = useState(null);
  const [showShotPlayerDialog, setShowShotPlayerDialog] = useState(false);
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [lineupAlreadyAsked, setLineupAlreadyAsked] = useState(false);

  const availablePlayers = useMemo(
    () => PLAYERS.filter((p) => !(match.notCalled?.includes?.(p.num))),
    [match.notCalled]
  );

  // Chiedi formazione una sola volta, solo nei tempi normali
  useEffect(() => {
    if (!isProvaTecnica && !isViewer && (!period.lineup || period.lineup.length !== 9) && !lineupAlreadyAsked && !period.lineupPrompted) {
      setShowLineupDialog(true);
      setLineupAlreadyAsked(true);
    }
  }, [period.name, isProvaTecnica, isViewer, lineupAlreadyAsked, period.lineupPrompted, period.lineup]);

  const handleLineupConfirm = useCallback((lineup) => {
    onSetLineup?.(periodIndex, lineup);
    setShowLineupDialog(false);
  }, [onSetLineup, periodIndex]);

  const handleLineupCancel = useCallback(() => {
    setShowLineupDialog(false);
  }, []);

  const periodNumberMatch = period.name.match(/(\d+)°/);
  const periodNumber = periodNumberMatch ? periodNumberMatch[1] : "";
  const periodTitle = isProvaTecnica ? "Prova Tecnica" : `${periodNumber}° Tempo`;

  // Rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {/* Prova Tecnica UI */}
          {isProvaTecnica && (
            <ProvaTecnicaPanel
              opponentName={match.opponent}
              vigScore={period.vigontina || 0}
              oppScore={period.opponent || 0}
              onVigMinus={() => onUpdateScore?.('vigontina', -1)}
              onVigPlus={() => onUpdateScore?.('vigontina', 1)}
              onOppMinus={() => onUpdateScore?.('opponent', -1)}
              onOppPlus={() => onUpdateScore?.('opponent', 1)}
              onFinish={onFinish}
            />
          )}

          {/* Timer e azioni per tempi normali */}
          {!isProvaTecnica && (
            <>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-mono font-bold text-gray-800">{typeof timer?.formatTime === 'function' ? timer.formatTime(timer.timerSeconds) : "00:00"}</div>
                </div>
                {!isViewer && (
                  <div className="flex gap-2">
                    <button onClick={timer?.isTimerRunning ? timer.pauseTimer : timer?.startTimer} className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm">
                      {timer?.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {timer?.isTimerRunning ? "Pausa" : "Avvia"}
                    </button>
                  </div>
                )}
              </div>

              {!isViewer && (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowGoalDialog(true)} className="bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 font-medium text-sm">⚽ Gol Vigontina</button>
                    <button onClick={() => onAddOpponentGoal(safeGetMinute)} className="bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 font-medium text-sm">⚽ Gol {match.opponent}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowOwnGoalDialog(true)} className="bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 font-medium text-sm">Autogol</button>
                    <button onClick={() => setShowPenaltyDialog(true)} className="bg-purple-500 text-white py-2 px-3 rounded hover:bg-purple-600 font-medium text-sm">🎯 Rigore</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowShotSelectionDialog(true)} className="bg-gray-600 text-white py-2 px-3 rounded hover:bg-gray-700 font-medium text-sm">🎯 Tiro</button>
                    <button onClick={()=>setShowSubstitution(true)} className="bg-indigo-600 text-white py-2 px-3 rounded hover:bg-indigo-700 font-medium text-sm"><Repeat className="w-4 h-4 inline" /> Sostituzione</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => setShowDeleteEventDialog(true)} className="bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 font-medium text-sm">🗑️ Elimina Evento</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modals */}
          {!isViewer && showGoalDialog && (
            <GoalModal availablePlayers={availablePlayers} onConfirm={(sc,as)=>{ onAddGoal(sc,as); setShowGoalDialog(false);} } onCancel={()=>setShowGoalDialog(false)} />
          )}
          {!isViewer && showOwnGoalDialog && (
            <OwnGoalModal opponentName={match.opponent} onConfirm={(team)=>{ onAddOwnGoal(team); setShowOwnGoalDialog(false);} } onCancel={()=>setShowOwnGoalDialog(false)} />
          )}
          {!isViewer && showPenaltyDialog && (
            <PenaltyAdvancedModal availablePlayers={availablePlayers} opponentName={match.opponent} onConfirm={(...args)=>{ onAddPenalty(...args); setShowPenaltyDialog(false);} } onCancel={()=>setShowPenaltyDialog(false)} />
          )}
          {!isViewer && showLineupDialog && (
            <LineupModal availablePlayers={availablePlayers} initialLineup={period.lineup || []} onConfirm={handleLineupConfirm} onCancel={handleLineupCancel} />
          )}
          {!isViewer && showDeleteEventDialog && (
            <DeleteEventModal events={period.goals||[]} opponentName={match.opponent} onConfirm={(idx,reason)=>{ onDeleteEvent?.(periodIndex, idx, reason); setShowDeleteEventDialog(false);} } onCancel={()=>setShowDeleteEventDialog(false)} />
          )}
          {!isViewer && showSubstitution && (
            <SubstitutionModal periodLineup={period.lineup||[]} notCalled={match.notCalled||[]} onConfirm={(outNum,inNum)=>{ onAddSubstitution?.(periodIndex, outNum, inNum, safeGetMinute); setShowSubstitution(false);} } onCancel={()=>setShowSubstitution(false)} />
          )}

          {/* CTA Termina */}
          {!isViewer && (
            <div className="mt-4">
              <button onClick={onFinish} className="w-full py-4 rounded-lg font-semibold text-white text-base shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-300 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2" title={isEditing ? "Salva Modifiche" : `Termina ${periodTitle}`}>
                <Flag className="w-5 h-5" /> {isEditing ? "Salva Modifiche" : `Termina ${periodTitle}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodPlay;
