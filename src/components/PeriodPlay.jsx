// components/PeriodPlay.jsx (updated)
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus, Flag, Repeat } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
import SubstitutionModal from "./modals/SubstitutionModal";

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
  userRole = 'viewer',
  onAddSubstitution,
  onAddFreeKick,
}) => {
  const period = match.periods[periodIndex];
  const isProvaTecnica = period.name === "PROVA TECNICA";
  const isViewer = isShared && userRole !== 'organizer';

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
  const [manualScoreMode, setManualScoreMode] = useState(false);

  const availablePlayers = useMemo(
    () => PLAYERS.filter((p) => !(match.notCalled?.includes?.(p.num))),
    [match.notCalled]
  );

  useEffect(() => {
    if (!isProvaTecnica && !isViewer && (!period.lineup || period.lineup.length !== 9)) {
      setShowLineupDialog(true);
    }
  }, [periodIndex, isProvaTecnica, period.lineup, isViewer]);

  const confirmShotForTeam = (team) => {
    setShowShotTeamDialog(false);
    if (team === 'vigontina') {
      setShowShotPlayerDialog(true);
    } else {
      if (pendingShotOutcome === 'fuori') onAddMissedShot('opponent', null, timer.getCurrentMinute);
      else if (pendingShotOutcome === 'parato') onAddShotBlocked('opponent', null, timer.getCurrentMinute);
      else if (pendingShotOutcome === 'palo' || pendingShotOutcome === 'traversa') onAddPostCrossbar(pendingShotOutcome, 'opponent', null, timer.getCurrentMinute);
      setPendingShotOutcome(null);
    }
  };

  const confirmShotForPlayer = (playerNum) => {
    setShowShotPlayerDialog(false);
    if (pendingShotOutcome === 'fuori') onAddMissedShot('vigontina', playerNum, timer.getCurrentMinute);
    else if (pendingShotOutcome === 'parato') onAddShotBlocked('vigontina', playerNum, timer.getCurrentMinute);
    else if (pendingShotOutcome === 'palo' || pendingShotOutcome === 'traversa') onAddPostCrossbar(pendingShotOutcome, 'vigontina', playerNum, timer.getCurrentMinute);
    setPendingShotOutcome(null);
  };

  const startShotFlow = () => { setShowShotSelectionDialog(true); };
  const pickShotOutcome = (outcome) => { setShowShotSelectionDialog(false); setPendingShotOutcome(outcome); setShowShotTeamDialog(true); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
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
          <LineupModal availablePlayers={availablePlayers} initialLineup={period.lineup || []} onConfirm={(ln)=>{ onSetLineup?.(periodIndex, ln); setShowLineupDialog(false); }} onCancel={()=>setShowLineupDialog(false)} />
        )}
        {!isViewer && showDeleteEventDialog && (
          <DeleteEventModal events={period.goals || []} opponentName={match.opponent} onConfirm={(idx,reason)=>{ onDeleteEvent?.(periodIndex, idx, reason); setShowDeleteEventDialog(false);} } onCancel={()=>setShowDeleteEventDialog(false)} />
        )}
        {!isViewer && showShotSelectionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">Esito del Tiro</h3>
              <div className="space-y-3">
                <button onClick={() => pickShotOutcome('fuori')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">❌ Fuori</button>
                <button onClick={() => pickShotOutcome('parato')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧤 Parato</button>
                <button onClick={() => pickShotOutcome('palo')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧱 Palo</button>
                <button onClick={() => pickShotOutcome('traversa')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">⎯ Traversa</button>
                <button onClick={() => setShowShotSelectionDialog(false)} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
              </div>
            </div>
          </div>
        )}
        {!isViewer && showShotTeamDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">Chi ha effettuato il tiro?</h3>
              <div className="space-y-3">
                <button onClick={() => confirmShotForTeam('vigontina')} className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 font-medium">Vigontina</button>
                <button onClick={() => confirmShotForTeam('opponent')} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium">{match.opponent}</button>
                <button onClick={() => setShowShotTeamDialog(false)} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
              </div>
            </div>
          </div>
        )}
        {!isViewer && showShotPlayerDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">Seleziona giocatore</h3>
              <div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
                {availablePlayers.map((p)=>(
                  <button key={p.num} onClick={()=>confirmShotForPlayer(p.num)} className="bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm text-gray-800">{p.num} {p.name}</button>
                ))}
              </div>
              <button onClick={()=>setShowShotPlayerDialog(false)} className="w-full mt-3 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Annulla</button>
            </div>
          </div>
        )}
        {!isViewer && showSubstitution && (
          <SubstitutionModal periodLineup={period.lineup||[]} notCalled={match.notCalled||[]} onConfirm={(outNum,inNum)=>{ onAddSubstitution?.(periodIndex, outNum, inNum, timer.getCurrentMinute); setShowSubstitution(false);} } onCancel={()=>setShowSubstitution(false)} />
        )}

        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Vigontina vs {match.opponent} - {isProvaTecnica ? "Prova Tecnica" : `${period.name}`}</h2>

          {!isViewer && !isProvaTecnica && (
            <div className="flex justify-end -mt-2 mb-2 gap-2">
              <button onClick={() => setShowLineupDialog(true)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Modifica i 9 in campo">👥 9 in campo</button>
              <button onClick={() => setManualScoreMode((m) => !m)} className={`text-xs px-2 py-1 rounded border ${manualScoreMode? "bg-yellow-100 border-yellow-300 text-yellow-800" : "bg-gray-50 border-gray-200 text-gray-700"}`} title="Attiva/Disattiva modifica manuale punteggio">{manualScoreMode? "✔️ Modifica punteggio attiva" : "✏️ Modifica punteggio"}</button>
            </div>
          )}

          {!isProvaTecnica && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-mono font-bold text-gray-800">{timer.formatTime(timer.timerSeconds)}</div>
              </div>
              {!isViewer && (
                <div className="flex gap-2">
                  <button onClick={timer.isTimerRunning ? timer.pauseTimer : timer.startTimer} className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm">
                    {timer.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {timer.isTimerRunning ? "Pausa" : "Avvia"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isViewer && (
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowGoalDialog(true)} className="bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 font-medium text-sm">⚽ Gol Vigontina</button>
                <button onClick={onAddOpponentGoal} className="bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 font-medium text-sm">⚽ Gol {match.opponent}</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowOwnGoalDialog(true)} className="bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 font-medium text-sm"><span className="bg-red-700 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] mr-1">⚽</span>Autogol</button>
                <button onClick={() => setShowPenaltyDialog(true)} className="bg-purple-500 text-white py-2 px-3 rounded hover:bg-purple-600 font-medium text-sm">🎯 Rigore</button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-800 text-center mb-3">Azioni Salienti</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={startShotFlow} className="bg-gray-600 text-white py-2 px-2 rounded hover:bg-gray-700 font-medium text-xs">🎯 Tiro</button>
                  <button onClick={()=>setShowSubstitution(true)} className="bg-indigo-600 text-white py-2 px-2 rounded hover:bg-indigo-700 font-medium text-xs flex items-center justify-center gap-1"><Repeat className="w-3 h-3" /> Sostituzione</button>
                  <button onClick={()=>{ setShowShotSelectionDialog(true); }} className="bg-orange-600 text-white py-2 px-2 rounded hover:bg-orange-700 font-medium text-xs">🟧 Punizione</button>
                  <button onClick={() => setShowDeleteEventDialog(true)} className="bg-red-600 text-white py-2 px-2 rounded hover:bg-red-700 font-medium text-xs" disabled={(period.goals || []).length === 0}>🗑️ Elimina Evento</button>
                </div>
                <p className="text-[11px] text-center text-orange-700 mt-2">Punizione usa lo stesso flusso di Tiro per esito/squadra/giocatore.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodPlay;
