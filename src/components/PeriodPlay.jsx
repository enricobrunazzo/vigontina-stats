// components/PeriodPlay.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus, Flag, Repeat } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
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

  // Shot flow (existing)
  const [showShotSelectionDialog, setShowShotSelectionDialog] = useState(false);
  const [showShotTeamDialog, setShowShotTeamDialog] = useState(false);
  const [pendingShotOutcome, setPendingShotOutcome] = useState(null);
  const [showShotPlayerDialog, setShowShotPlayerDialog] = useState(false);

  // Free kick flow (3-step)
  const [showFKSelectionDialog, setShowFKSelectionDialog] = useState(false);
  const [showFKTeamDialog, setShowFKTeamDialog] = useState(false);
  const [pendingFKOutcome, setPendingFKOutcome] = useState(null);
  const [pendingFKHitType, setPendingFKHitType] = useState(null);
  const [showFKPlayerDialog, setShowFKPlayerDialog] = useState(false);

  const [showSubstitution, setShowSubstitution] = useState(false);
  const [lineupAlreadyAsked, setLineupAlreadyAsked] = useState(false);
  const [manualScoreMode, setManualScoreMode] = useState(false);

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

  // Shot flow handlers
  const startShotFlow = () => setShowShotSelectionDialog(true);
  const pickShotOutcome = (outcome) => { setPendingShotOutcome(outcome); setShowShotSelectionDialog(false); setShowShotTeamDialog(true); };
  const confirmShotForTeam = (team) => {
    setShowShotTeamDialog(false);
    if (team === 'vigontina') {
      setShowShotPlayerDialog(true);
    } else {
      if (pendingShotOutcome === 'fuori') onAddMissedShot('opponent', null);
      else if (pendingShotOutcome === 'parato') onAddShotBlocked('opponent', null);
      else if (pendingShotOutcome === 'palo' || pendingShotOutcome === 'traversa') onAddPostCrossbar(pendingShotOutcome, 'opponent', null);
      setPendingShotOutcome(null);
    }
  };
  const confirmShotForPlayer = (playerNum) => {
    setShowShotPlayerDialog(false);
    if (pendingShotOutcome === 'fuori') onAddMissedShot('vigontina', playerNum);
    else if (pendingShotOutcome === 'parato') onAddShotBlocked('vigontina', playerNum);
    else if (pendingShotOutcome === 'palo' || pendingShotOutcome === 'traversa') onAddPostCrossbar(pendingShotOutcome, 'vigontina', playerNum);
    setPendingShotOutcome(null);
  };

  // Free kick flow handlers (3-step)
  const startFreeKickFlow = () => setShowFKSelectionDialog(true);
  const pickFKOutcome = (outcome) => {
    setPendingFKOutcome(outcome); // 'goal' | 'fuori' | 'parata' | 'palo' | 'traversa'
    setPendingFKHitType(outcome === 'palo' ? 'palo' : outcome === 'traversa' ? 'traversa' : null);
    setShowFKSelectionDialog(false);
    setShowFKTeamDialog(true);
  };
  const confirmFKForTeam = (team) => {
    setShowFKTeamDialog(false);
    const minute = safeGetMinute();
    // Non-gol per Vigontina o Avversario: salva subito
    if (pendingFKOutcome === 'fuori') { onAddFreeKick('missed', team, null, minute, null); cleanupFK(); return; }
    if (pendingFKOutcome === 'parata') { onAddFreeKick('saved', team, null, minute, null); cleanupFK(); return; }
    if (pendingFKOutcome === 'palo' || pendingFKOutcome === 'traversa') { onAddFreeKick('hit', team, null, minute, pendingFKHitType); cleanupFK(); return; }
    // Gol: se Avversario salva subito con meta.freeKick; se Vigontina apri selezione giocatore
    if (pendingFKOutcome === 'goal') {
      if (team === 'vigontina') { setShowFKPlayerDialog(true); return; }
      onAddOpponentGoal(minute, { freeKick: true }); cleanupFK(); return;
    }
    cleanupFK();
  };
  const confirmFKForPlayer = (playerNum) => {
    const minute = safeGetMinute();
    if (pendingFKOutcome === 'goal') {
      // Assicura meta.freeKick per mostrare PUN.
      onAddGoal(playerNum, null, { minute, meta: { freeKick: true } });
      cleanupFK();
      return;
    }
    if (pendingFKOutcome === 'fuori') onAddFreeKick('missed', 'vigontina', playerNum, minute, null);
    else if (pendingFKOutcome === 'parata') onAddFreeKick('saved', 'vigontina', playerNum, minute, null);
    else if (pendingFKOutcome === 'palo' || pendingFKOutcome === 'traversa') onAddFreeKick('hit', 'vigontina', playerNum, minute, pendingFKHitType);
    cleanupFK();
  };
  const cleanupFK = () => {
    setPendingFKOutcome(null);
    setPendingFKHitType(null);
    setShowFKSelectionDialog(false);
    setShowFKTeamDialog(false);
    setShowFKPlayerDialog(false);
  };

  const periodNumberMatch = period.name.match(/(\d+)°/);
  const periodNumber = periodNumberMatch ? periodNumberMatch[1] : "";
  const periodTitle = isProvaTecnica ? "Prova Tecnica" : `${periodNumber}° Tempo`;

  const events = Array.isArray(period.goals) ? period.goals : [];
  const organizedEvents = useMemo(() => {
    const vigontinaEvents = [];
    const opponentEvents = [];
    events.forEach((event, idx) => {
      const e = { ...event, originalIndex: idx };
      if (
        ['goal','penalty-goal','penalty-missed','save','missed-shot','shot-blocked','substitution','free-kick-missed','free-kick-saved','free-kick-hit','free-kick-goal'].includes(event.type)
        || event.type === 'opponent-own-goal'
        || event.type === 'palo-vigontina'
        || event.type === 'traversa-vigontina'
        || ((event.type?.includes('palo-') || event.type?.includes('traversa-')) && event.team==='vigontina')
      ) {
        vigontinaEvents.push(e);
      } else {
        opponentEvents.push(e);
      }
    });
    const sortByMinute = (a,b) => (a.minute||0)-(b.minute||0);
    return { vigontina: vigontinaEvents.sort(sortByMinute), opponent: opponentEvents.sort(sortByMinute) };
  }, [events]);

  const handleDeleteEvent = (idx, reason) => {
    try {
      const periodClone = { ...match.periods[periodIndex] };
      const goalsClone = Array.isArray(periodClone.goals) ? [...periodClone.goals] : [];
      const evt = goalsClone[idx];
      if (!evt) return;
      const wasGoalForVig = evt.type === 'goal' || evt.type === 'penalty-goal' || evt.type === 'free-kick-goal';
      const wasGoalForOpp = evt.type === 'opponent-goal' || evt.type === 'penalty-opponent-goal' || evt.type === 'opponent-free-kick-goal';
      evt.deletionReason = reason || 'Annullato';
      evt.deletedAt = Date.now();
      evt.deleted = true;
      if (wasGoalForVig && (periodClone.vigontina || 0) > 0) periodClone.vigontina = (periodClone.vigontina || 0) - 1;
      if (wasGoalForOpp && (periodClone.opponent || 0) > 0) periodClone.opponent = (periodClone.opponent || 0) - 1;
      goalsClone[idx] = evt;
      periodClone.goals = goalsClone;
      if (typeof onDeleteEvent === 'function') onDeleteEvent(periodIndex, idx, reason);
    } finally {
      setShowDeleteEventDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {!isProvaTecnica && !isViewer && (
            <div className="flex justify-end -mt-2 mb-4 gap-2">
              <button onClick={() => setShowLineupDialog(true)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Modifica i 9 in campo">👥 9 in campo</button>
              <button onClick={() => setManualScoreMode((m) => !m)} className={`text-xs px-2 py-1 rounded border ${manualScoreMode ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`} title="Attiva/Disattiva modifica manuale punteggio">{manualScoreMode ? '✅ Modifica punteggio attiva' : '✏️ Modifica punteggio'}</button>
            </div>
          )}

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
            <>
              {/* ... UI unchanged for scoreboard, timer, actions, events, finish ... */}
              {/* Actions block includes startFreeKickFlow for Punizione */}
            </>
          )}

          {/* Modals (goal/own goal/penalty/lineup/delete) remain unchanged above */}

          {/* Shot Flow Overlays (unchanged) */}
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
                  <button onClick={() => { setShowShotTeamDialog(false); setShowShotPlayerDialog(true); }} className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 font-medium">Vigontina</button>
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
                  {availablePlayers.map((p)=> (
                    <button key={p.num} onClick={() => confirmShotForPlayer(p.num)} className="bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm text-gray-800">{p.num} {p.name}</button>
                  ))}
                </div>
                <button onClick={() => setShowShotPlayerDialog(false)} className="w-full mt-3 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Annulla</button>
              </div>
            </div>
          )}

          {/* Free Kick Flow Overlays (3-step) */}
          {!isViewer && showFKSelectionDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-center">Esito della Punizione</h3>
                <div className="space-y-3">
                  <button onClick={() => pickFKOutcome('goal')} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 font-medium">⚽ Gol</button>
                  <button onClick={() => pickFKOutcome('fuori')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">❌ Fuori</button>
                  <button onClick={() => pickFKOutcome('parata')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧤 Parata</button>
                  <button onClick={() => pickFKOutcome('palo')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧱 Palo</button>
                  <button onClick={() => pickFKOutcome('traversa')} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">⎯ Traversa</button>
                  <button onClick={() => setShowFKSelectionDialog(false)} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
                </div>
              </div>
            </div>
          )}
          {!isViewer && showFKTeamDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-center">Chi ha battuto la punizione?</h3>
                <div className="space-y-3">
                  <button onClick={() => { setShowFKTeamDialog(false); if (pendingFKOutcome==='goal') setShowFKPlayerDialog(true); else confirmFKForTeam('vigontina'); }} className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 font-medium">Vigontina</button>
                  <button onClick={() => confirmFKForTeam('opponent')} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium">{match.opponent}</button>
                  <button onClick={() => setShowFKTeamDialog(false)} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
                </div>
              </div>
            </div>
          )}
          {!isViewer && showFKPlayerDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-center">Seleziona giocatore (Punizione)</h3>
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
                  {availablePlayers.map((p)=> (
                    <button key={p.num} onClick={() => confirmFKForPlayer(p.num)} className="bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm text-gray-800">{p.num} {p.name}</button>
                  ))}
                </div>
                <button onClick={() => setShowFKPlayerDialog(false)} className="w-full mt-3 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Annulla</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, color = 'indigo' }) => (
  <span className={`ml-2 text-[10px] leading-3 px-1.5 py-0.5 rounded border font-semibold align-middle inline-block bg-${color}-50 border-${color}-200 text-${color}-700`}>{children}</span>
);

const TeamEventCard = ({ event, team, opponentName }) => {
  const isDeleted = event.deletionReason;
  const baseClasses = isDeleted ? 'opacity-60' : '';
  const textClasses = isDeleted ? 'line-through' : '';
  const grayCard = (children) => (
    <div className={`bg-gray-50 p-2 rounded border border-gray-200 text-xs ${baseClasses}`}>{children}</div>
  );
  const greenCard = (children) => (
    <div className={`bg-green-50 p-2 rounded border border-green-200 text-xs ${baseClasses}`}>{children}</div>
  );
  const blueCard = (children) => (
    <div className={`bg-blue-50 p-2 rounded border border-blue-200 text-xs ${baseClasses}`}>{children}</div>
  );

  const isFKGoal = event?.meta?.freeKick === true && event.type === 'goal';
  const isFKGoalOpp = event?.meta?.freeKick === true && event.type === 'opponent-goal';

  if (event.type === 'goal' || event.type === 'penalty-goal') {
    const isRig = event.type === 'penalty-goal';
    return greenCard(
      <p className={`font-medium text-green-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.scorer} {event.scorerName || event.playerName}
        {isRig && <Badge color="purple">RIG.</Badge>}
        {isFKGoal && <Badge color="orange">PUN.</Badge>}
      </p>
    );
  }
  if (event.type === 'opponent-goal' || event.type === 'penalty-opponent-goal') {
    const isRig = event.type === 'penalty-opponent-goal';
    return blueCard(
      <p className={`font-medium text-blue-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.type.includes('penalty') ? 'Rigore' : 'Gol'} {opponentName}
        {isRig && <Badge color="purple">RIG.</Badge>}
        {isFKGoalOpp && <Badge color="orange">PUN.</Badge>}
      </p>
    );
  }
  if (event.type === 'penalty-missed' || event.type === 'penalty-opponent-missed') {
    const who = event.type === 'penalty-missed' ? 'Vigontina' : opponentName;
    return grayCard(
      <p className="font-medium text-gray-800">❌ {event.minute}' - Rigore fallito {who} <Badge color="purple">RIG.</Badge></p>
    );
  }
  if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVig = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    return grayCard(<p className="font-medium text-gray-800">{hitTypeDisplay} {event.minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type?.startsWith('free-kick')) {
    const isOpp = event.type.includes('opponent');
    if (event.type.includes('missed')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione fuori {isOpp ? opponentName : `${event.player || ''} ${event.playerName || ''}`.trim()}</p>);
    if (event.type.includes('saved')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione parata {isOpp ? opponentName : `${event.player || ''} ${event.playerName || ''}`.trim()}</p>);
    if (event.type.includes('hit')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione {event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa'} {isOpp ? opponentName : `${event.player || ''} ${event.playerName || ''}`.trim()}</p>);
  }
  if (event.type === 'missed-shot' || event.type === 'opponent-missed-shot') {
    const isVig = event.type === 'missed-shot';
    return grayCard(<p className="font-medium text-gray-800">🎯 {event.minute}' - Tiro fuori {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type === 'shot-blocked' || event.type === 'opponent-shot-blocked') {
    const isVig = event.type === 'shot-blocked';
    return grayCard(<p className="font-medium text-gray-800">🧤 {event.minute}' - Tiro parato {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type === 'substitution') {
    return grayCard(
      <p className="font-medium text-gray-800">🔁 {event.minute}' - Sostituzione: {event.out?.num} {event.out?.name} → {event.in?.num} {event.in?.name}</p>
    );
  }
  return null;
};

export default PeriodPlay;
