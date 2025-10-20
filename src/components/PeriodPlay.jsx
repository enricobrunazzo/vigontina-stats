// components/PeriodPlay.jsx (full component restored)
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
  userRole = 'viewer',
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

  const events = Array.isArray(period.goals) ? period.goals : [];
  const organizedEvents = useMemo(() => {
    const byMinute = (a,b) => (a.minute||0)-(b.minute||0);
    const vig = [];
    const opp = [];
    events.forEach((e, idx) => {
      const ev = { ...e, originalIndex: idx };
      const isV = ev.team === 'vigontina' || ['goal','penalty-goal','missed-shot','shot-blocked','save','substitution'].includes(ev.type) || ev.type?.startsWith('free-kick');
      (isV ? vig : opp).push(ev);
    });
    return { vigontina: vig.sort(byMinute), opponent: opp.sort(byMinute) };
  }, [events]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {isProvaTecnica ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-mono font-bold text-gray-800">{typeof timer?.formatTime === 'function' ? timer.formatTime(timer.timerSeconds) : "00:00"}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={timer?.isTimerRunning ? timer.pauseTimer : timer?.startTimer} className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm">
                  {timer?.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timer?.isTimerRunning ? "Pausa" : "Avvia"}
                </button>
              </div>
            </div>
          )}

          {/* Modals */}
          {showGoalDialog && <GoalModal availablePlayers={availablePlayers} onConfirm={(sc,as)=>{ onAddGoal(sc,as); setShowGoalDialog(false);} } onCancel={()=>setShowGoalDialog(false)} />}
          {showOwnGoalDialog && <OwnGoalModal opponentName={match.opponent} onConfirm={(team)=>{ onAddOwnGoal(team); setShowOwnGoalDialog(false);} } onCancel={()=>setShowOwnGoalDialog(false)} />}
          {showPenaltyDialog && <PenaltyAdvancedModal availablePlayers={availablePlayers} opponentName={match.opponent} onConfirm={(...args)=>{ onAddPenalty(...args); setShowPenaltyDialog(false);} } onCancel={()=>setShowPenaltyDialog(false)} />}
          {showLineupDialog && <LineupModal availablePlayers={availablePlayers} initialLineup={period.lineup || []} onConfirm={handleLineupConfirm} onCancel={handleLineupCancel} />}
          {showDeleteEventDialog && <DeleteEventModal events={events} opponentName={match.opponent} onConfirm={(idx,reason)=>{ onDeleteEvent?.(periodIndex, idx, reason); setShowDeleteEventDialog(false);} } onCancel={()=>setShowDeleteEventDialog(false)} />}
        </div>
      </div>
    </div>
  );
};

export default PeriodPlay;
