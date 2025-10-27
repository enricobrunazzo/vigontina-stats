// components/PeriodPlay.jsx (DEFINITIVO: tutti i controlli completi)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus, Flag, Repeat } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
import SubstitutionModal from "./modals/SubstitutionModal";
import FreeKickModal from "./modals/FreeKickModal";
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
  const [showFreeKickDialog, setShowFreeKickDialog] = useState(false);
  const [lineupAlreadyAsked, setLineupAlreadyAsked] = useState(false);
  const [manualScoreMode, setManualScoreMode] = useState(false);

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

  const handleFreeKickConfirm = (outcome, team, player, hitType) => {
    const minute = safeGetMinute();
    onAddFreeKick(outcome, team, player, minute, hitType);
    setShowFreeKickDialog(false);
  };

  const startShotFlow = () => { setShowShotSelectionDialog(true); };
  const pickShotOutcome = (outcome) => { setShowShotSelectionDialog(false); setPendingShotOutcome(outcome); setShowShotTeamDialog(true); };

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
        ['goal','penalty-goal','penalty-missed','save','missed-shot','shot-blocked','substitution','free-kick-missed','free-kick-saved','free-kick-hit'].includes(event.type)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {/* BARRA CONTROLLI SUPERIORE - solo tempi normali */}
          {!isProvaTecnica && !isViewer && (
            <div className="flex justify-end -mt-2 mb-4 gap-2">
              <button onClick={() => setShowLineupDialog(true)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Modifica i 9 in campo">👥 9 in campo</button>
              <button onClick={() => setManualScoreMode((m) => !m)} className={`text-xs px-2 py-1 rounded border ${manualScoreMode? "bg-yellow-100 border-yellow-300 text-yellow-800" : "bg-gray-50 border-gray-200 text-gray-700"}`} title="Attiva/Disattiva modifica manuale punteggio">{manualScoreMode? "✅ Modifica punteggio attiva" : "✏️ Modifica punteggio"}</button>
            </div>
          )}

          {/* PROVA TECNICA - pannello dedicato */}
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
              {/* PUNTEGGIO ATTUALE con modifica manuale */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Punteggio Attuale</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center flex items-center gap-2">
                      {manualScoreMode && !isViewer && (
                        <button onClick={() => onUpdateScore?.('vigontina', -1)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600" disabled={(period.vigontina || 0) <= 0}>
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Vigontina</p>
                        <p className="text-3xl font-bold text-green-600">{period.vigontina || 0}</p>
                      </div>
                      {manualScoreMode && !isViewer && (
                        <button onClick={() => onUpdateScore?.('vigontina', 1)} className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-600">
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-gray-400">-</span>
                    <div className="text-center flex items-center gap-2">
                      {manualScoreMode && !isViewer && (
                        <button onClick={() => onUpdateScore?.('opponent', -1)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600" disabled={(period.opponent || 0) <= 0}>
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">{match.opponent}</p>
                        <p className="text-3xl font-bold text-blue-600">{period.opponent || 0}</p>
                      </div>
                      {manualScoreMode && !isViewer && (
                        <button onClick={() => onUpdateScore?.('opponent', 1)} className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600">
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMER */}
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

              {/* AZIONI PARTITA */}
              {!isViewer && (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowGoalDialog(true)} className="bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 font-medium text-sm">⚽ Gol Vigontina</button>
                    <button onClick={() => onAddOpponentGoal(safeGetMinute)} className="bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 font-medium text-sm">⚽ Gol {match.opponent}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowOwnGoalDialog(true)} className="bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 font-medium text-sm">⚽ Autogol</button>
                    <button onClick={() => setShowPenaltyDialog(true)} className="bg-purple-500 text-white py-2 px-3 rounded hover:bg-purple-600 font-medium text-sm">🎯 Rigore</button>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-800 text-center mb-3">Azioni Salienti</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={startShotFlow} className="bg-gray-600 text-white py-2 px-2 rounded hover:bg-gray-700 font-medium text-xs">🎯 Tiro</button>
                      <button onClick={()=>setShowSubstitution(true)} className="bg-indigo-600 text-white py-2 px-2 rounded hover:bg-indigo-700 font-medium text-xs flex items-center justify-center gap-1"><Repeat className="w-3 h-3" /> Sostituzione</button>
                      <button onClick={()=>setShowFreeKickDialog(true)} className="bg-orange-600 text-white py-2 px-2 rounded hover:bg-orange-700 font-medium text-xs">🟧 Punizione</button>
                      <button onClick={() => setShowDeleteEventDialog(true)} className="bg-red-600 text-white py-2 px-2 rounded hover:bg-red-700 font-medium text-xs" disabled={events.length === 0}>🗑️ Elimina Evento</button>
                    </div>
                  </div>
                </div>
              )}

              {/* EVENTI ORGANIZZATI */}
              {(organizedEvents.vigontina.length > 0 || organizedEvents.opponent.length > 0) && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {organizedEvents.vigontina.map((event) => (
                      <TeamEventCard key={event.originalIndex} event={event} team="vigontina" opponentName={match.opponent} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {organizedEvents.opponent.map((event) => (
                      <TeamEventCard key={event.originalIndex} event={event} team="opponent" opponentName={match.opponent} />
                    ))}
                  </div>
                </div>
              )}

              {/* TERMINA TEMPO - spostato in fondo */}
              {!isViewer && (
                <div className="mt-8">
                  <button onClick={onFinish} className="w-full py-4 rounded-lg font-semibold text-white text-base shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-300 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2" title={isEditing ? "Salva Modifiche" : `Termina ${periodTitle}`}>
                    <Flag className="w-5 h-5" /> {isEditing ? "Salva Modifiche" : `Termina ${periodTitle}`}
                  </button>
                </div>
              )}
            </>
          )}

          {/* MODALS - tutte le interazioni */}
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
            <DeleteEventModal events={events} opponentName={match.opponent} onConfirm={(idx,reason)=>{ onDeleteEvent?.(periodIndex, idx, reason); setShowDeleteEventDialog(false);} } onCancel={()=>setShowDeleteEventDialog(false)} />
          )}
          {!isViewer && showSubstitution && (
            <SubstitutionModal periodLineup={period.lineup||[]} notCalled={match.notCalled||[]} onConfirm={(outNum,inNum)=>{ onAddSubstitution?.(periodIndex, outNum, inNum, safeGetMinute()); setShowSubstitution(false);} } onCancel={()=>setShowSubstitution(false)} />
          )}
          {!isViewer && showFreeKickDialog && (
            <FreeKickModal availablePlayers={availablePlayers} opponentName={match.opponent} onConfirm={handleFreeKickConfirm} onCancel={()=>setShowFreeKickDialog(false)} />
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
                  {availablePlayers.map((p)=>(
                    <button key={p.num} onClick={()=>confirmShotForPlayer(p.num)} className="bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm text-gray-800">{p.num} {p.name}</button>
                  ))}
                </div>
                <button onClick={()=>setShowShotPlayerDialog(false)} className="w-full mt-3 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Annulla</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, color='indigo' }) => (
  <span className={`ml-2 text-[10px] leading-3 px-1.5 py-0.5 rounded border font-semibold align-middle inline-block bg-${color}-50 border-${color}-200 text-${color}-700`}>{children}</span>
);

const TeamEventCard = ({ event, team, opponentName }) => {
  const isDeleted = event.deletionReason;
  const baseClasses = isDeleted ? "opacity-60" : "";
  const textClasses = isDeleted ? "line-through" : "";
  const grayCard = (children) => (
    <div className={`bg-gray-50 p-2 rounded border border-gray-200 text-xs ${baseClasses}`}>{children}</div>
  );
  const greenCard = (children) => (
    <div className={`bg-green-50 p-2 rounded border border-green-200 text-xs ${baseClasses}`}>{children}</div>
  );
  const blueCard = (children) => (
    <div className={`bg-blue-50 p-2 rounded border border-blue-200 text-xs ${baseClasses}`}>{children}</div>
  );
  const redBall = <span className="text-red-600 font-bold" style={{color: '#dc2626'}}>⚽</span>;

  if (event.type === "goal" || event.type === "penalty-goal") {
    const isRig = event.type === 'penalty-goal';
    return greenCard(
      <p className={`font-medium text-green-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.scorer} {event.scorerName}
        {isRig && <Badge color="purple">RIG.</Badge>}
      </p>
    );
  }
  if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    const isRig = event.type === 'penalty-opponent-goal';
    return blueCard(
      <p className={`font-medium text-blue-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.type.includes('penalty') ? 'Rigore' : 'Gol'} {opponentName}
        {isRig && <Badge color="purple">RIG.</Badge>}
      </p>
    );
  }
  if (event.type === "opponent-own-goal") {
    return greenCard(
      <p className={`font-medium text-green-800 ${textClasses}`}>
        {redBall} {event.minute}' - Autogol {opponentName}
        <Badge color="red">AUTOGOL</Badge>
      </p>
    );
  }
  if (event.type === "own-goal") {
    return blueCard(
      <p className={`font-medium text-blue-800 ${textClasses}`}>
        {redBall} {event.minute}' - Autogol Vigontina
        <Badge color="red">AUTOGOL</Badge>
      </p>
    );
  }
  if (event.type.includes('penalty') && event.type.includes('missed')) {
    const isVig = event.type === 'penalty-missed';
    return grayCard(
      <p className="font-medium text-gray-800">
        ❌ {event.minute}' - Rigore fallito {isVig ? 'Vigontina' : opponentName}
        <Badge color="purple">RIG.</Badge>
      </p>
    );
  }
  if (event.type === "missed-shot" || event.type === "opponent-missed-shot") {
    const isVig = event.type === 'missed-shot';
    return grayCard(<p className="font-medium text-gray-800">🎯 {event.minute}' - Tiro fuori {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type === "shot-blocked" || event.type === "opponent-shot-blocked") {
    const isVig = event.type === 'shot-blocked';
    return grayCard(<p className="font-medium text-gray-800">🧤 {event.minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName} tiro parato</p>);
  }
  if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVig = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    return grayCard(<p className="font-medium text-gray-800">{hitTypeDisplay} {event.minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type?.startsWith('free-kick')) {
    const isOpp = event.type.includes('opponent');
    if (event.type.includes('missed')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione fuori {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()} <Badge color="orange">PUN.</Badge></p>);
    if (event.type.includes('saved')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione parata {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()} <Badge color="orange">PUN.</Badge></p>);
    if (event.type.includes('hit')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione {event.hitType==='palo'?'🧱 Palo':'⎯ Traversa'} {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()} <Badge color="orange">PUN.</Badge></p>);
  }
  if (event.type === 'substitution') {
    return grayCard(
      <p className="font-medium text-gray-800">
        🔁 {event.minute}' - Sostituzione: {event.out?.num} {event.out?.name} → {event.in?.num} {event.in?.name}
      </p>
    );
  }
  return null;
};

export default PeriodPlay;