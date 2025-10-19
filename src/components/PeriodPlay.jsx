// components/PeriodPlay.jsx (riorganizzato con nuove azioni salienti)
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import SaveModal from "./modals/SaveModal";
import MissedShotModal from "./modals/MissedShotModal";
import PostCrossbarModal from "./modals/PostCrossbarModal";
import ShotBlockedModal from "./modals/ShotBlockedModal";
import DeleteEventModal from "./modals/DeleteEventModal";

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
  onAddShotBlocked, // NUOVO handler per tiri parati
  onUpdateScore,
  onDeleteEvent,
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
  const [showOwnGoalDialog, setShowOwnGoalDialog] = useState(false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [showLineupDialog, setShowLineupDialog] = useState(false);
  // NUOVI modal states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showMissedShotDialog, setShowMissedShotDialog] = useState(false);
  const [showPostCrossbarDialog, setShowPostCrossbarDialog] = useState(false);
  const [showDeleteEventDialog, setShowDeleteEventDialog] = useState(false);
  // NUOVO: Modal per selezione tiro
  const [showShotSelectionDialog, setShowShotSelectionDialog] = useState(false);
  // NUOVO: Modal per tiro parato
  const [showShotBlockedDialog, setShowShotBlockedDialog] = useState(false);

  // Manual score mode
  const [manualScoreMode, setManualScoreMode] = useState(false);

  const availablePlayers = useMemo(
    () => PLAYERS.filter((p) => !(match.notCalled?.includes?.(p.num))),
    [match.notCalled]
  );

  // NUOVO: Organizzazione eventi per squadra
  const organizedEvents = useMemo(() => {
    const events = period.goals || [];
    const vigontinaEvents = [];
    const opponentEvents = [];

    events.forEach((event, idx) => {
      const eventWithIndex = { ...event, originalIndex: idx };
      
      // Determina a quale squadra appartiene l'evento
      switch (event.type) {
        // Eventi Vigontina
        case 'goal':
        case 'penalty-goal':
        case 'penalty-missed':
        case 'save':
        case 'missed-shot':
        case 'shot-blocked':
          vigontinaEvents.push(eventWithIndex);
          break;
        case 'opponent-own-goal': // Autogol avversario = evento positivo per Vigontina
          vigontinaEvents.push(eventWithIndex);
          break;
        case 'palo-vigontina':
        case 'traversa-vigontina':
          vigontinaEvents.push(eventWithIndex);
          break;
        
        // Eventi Avversario
        case 'opponent-goal':
        case 'penalty-opponent-goal':
        case 'penalty-opponent-missed':
        case 'opponent-save':
        case 'opponent-missed-shot':
        case 'opponent-shot-blocked':
          opponentEvents.push(eventWithIndex);
          break;
        case 'own-goal': // Autogol Vigontina = evento positivo per l'avversario
          opponentEvents.push(eventWithIndex);
          break;
        case 'palo-opponent':
        case 'traversa-opponent':
          opponentEvents.push(eventWithIndex);
          break;
        
        // Default case per eventi con formato hitType
        default:
          if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
            if (event.team === 'vigontina') {
              vigontinaEvents.push(eventWithIndex);
            } else {
              opponentEvents.push(eventWithIndex);
            }
          }
          break;
      }
    });

    return {
      vigontina: vigontinaEvents.sort((a, b) => (a.minute || 0) - (b.minute || 0)),
      opponent: opponentEvents.sort((a, b) => (a.minute || 0) - (b.minute || 0))
    };
  }, [period.goals]);

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

  const handleAddOwnGoal = (team) => {
    onAddOwnGoal(team);
    setShowOwnGoalDialog(false);
  };

  const handleAddPenalty = (team, scored, scorerNum) => {
    onAddPenalty(team, scored, scorerNum);
    setShowPenaltyDialog(false);
  };

  // NUOVI handlers
  const handleAddSave = (team, playerNum) => {
    onAddSave(team, playerNum);
    setShowSaveDialog(false);
  };

  const handleAddMissedShot = (team, playerNum) => {
    onAddMissedShot(team, playerNum);
    setShowMissedShotDialog(false);
  };

  const handleAddPostCrossbar = (type, team, playerNum) => {
    onAddPostCrossbar(type, team, playerNum);
    setShowPostCrossbarDialog(false);
  };

  // NUOVO: Handler per tiro parato
  const handleAddShotBlocked = (team, playerNum) => {
    onAddShotBlocked?.(team, playerNum);
    setShowShotBlockedDialog(false);
  };

  const handleDeleteEvent = (eventIndex, reason) => {
    onDeleteEvent?.(periodIndex, eventIndex, reason);
    setShowDeleteEventDialog(false);
  };

  const handleSetLineup = (lineupNums) => {
    onSetLineup?.(periodIndex, lineupNums);
    setShowLineupDialog(false);
  };

  // NUOVO: Handler per apertura selezione tiro
  const handleShotClick = () => {
    setShowShotSelectionDialog(true);
  };

  // AGGIORNATO: Handler per selezione esito tiro con opzione "parato"
  const handleShotOutcome = (outcome) => {
    setShowShotSelectionDialog(false);
    if (outcome === 'fuori') {
      setShowMissedShotDialog(true);
    } else if (outcome === 'parato') {
      setShowShotBlockedDialog(true);
    }
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

        {!isViewer && showOwnGoalDialog && (
          <OwnGoalModal
            opponentName={match.opponent}
            onConfirm={handleAddOwnGoal}
            onCancel={() => setShowOwnGoalDialog(false)}
          />
        )}

        {!isViewer && showPenaltyDialog && (
          <PenaltyAdvancedModal
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

        {/* NUOVI MODALI */}
        {!isViewer && showSaveDialog && (
          <SaveModal
            availablePlayers={availablePlayers}
            opponentName={match.opponent}
            onConfirm={handleAddSave}
            onCancel={() => setShowSaveDialog(false)}
          />
        )}

        {!isViewer && showMissedShotDialog && (
          <MissedShotModal
            availablePlayers={availablePlayers}
            opponentName={match.opponent}
            onConfirm={handleAddMissedShot}
            onCancel={() => setShowMissedShotDialog(false)}
          />
        )}

        {!isViewer && showPostCrossbarDialog && (
          <PostCrossbarModal
            availablePlayers={availablePlayers}
            opponentName={match.opponent}
            onConfirm={handleAddPostCrossbar}
            onCancel={() => setShowPostCrossbarDialog(false)}
          />
        )}

        {/* NUOVO MODAL per tiro parato */}
        {!isViewer && showShotBlockedDialog && (
          <ShotBlockedModal
            availablePlayers={availablePlayers}
            opponentName={match.opponent}
            onConfirm={handleAddShotBlocked}
            onCancel={() => setShowShotBlockedDialog(false)}
          />
        )}

        {/* MODAL PER ELIMINAZIONE EVENTI */}
        {!isViewer && showDeleteEventDialog && (
          <DeleteEventModal
            events={period.goals || []}
            opponentName={match.opponent}
            onConfirm={handleDeleteEvent}
            onCancel={() => setShowDeleteEventDialog(false)}
          />
        )}

        {/* AGGIORNATO: MODAL PER SELEZIONE ESITO TIRO con opzione "Parato" */}
        {!isViewer && showShotSelectionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">Esito del Tiro</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleShotOutcome('fuori')}
                  className="w-full bg-gray-500 text-white p-3 rounded hover:bg-gray-600 font-medium"
                >
                  ❌ Fuori
                </button>
                <button
                  onClick={() => handleShotOutcome('parato')}
                  className="w-full bg-orange-500 text-white p-3 rounded hover:bg-orange-600 font-medium"
                >
                  🧤 Parato
                </button>
                <button
                  onClick={() => setShowShotSelectionDialog(false)}
                  className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
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
                    className="flex-1 bg-blue-400 text-white py-2 rounded hover:bg-blue-500 flex items-center justify-center gap-2 text-sm"
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

          {/* Action Buttons - COLORI UNIFORMATI */}
          {!isViewer && (
            <div className="space-y-4 mb-6">
              {isProvaTecnica ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <p className="text-sm text-blue-800 text-center">
                      <strong>Prova Tecnica:</strong> Inserisci i punti manualmente. Al termine, la squadra vincente guadagna 1 punto nel punteggio finale.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => onUpdateScore("vigontina", -1)} className="bg-red-400 text-white p-2 rounded hover:bg-red-500"><Minus className="w-4 h-4" /></button>
                      <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Punti Vigontina</span></div>
                      <button onClick={() => onUpdateScore("vigontina", 1)} className="bg-green-400 text-white p-2 rounded hover:bg-green-500"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => onUpdateScore("opponent", -1)} className="bg-red-400 text-white p-2 rounded hover:bg-red-500"><Minus className="w-4 h-4" /></button>
                      <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Punti {match.opponent}</span></div>
                      <button onClick={() => onUpdateScore("opponent", 1)} className="bg-green-400 text-white p-2 rounded hover:bg-green-500"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              ) : manualScoreMode ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => onUpdateScore("vigontina", -1)} className="bg-red-400 text-white p-2 rounded hover:bg-red-500"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Gol Vigontina</span></div>
                    <button onClick={() => onUpdateScore("vigontina", 1)} className="bg-green-400 text-white p-2 rounded hover:bg-green-500"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => onUpdateScore("opponent", -1)} className="bg-red-400 text-white p-2 rounded hover:bg-red-500"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 text-center bg-gray-100 py-2 rounded text-sm"><span className="font-medium">Gol {match.opponent}</span></div>
                    <button onClick={() => onUpdateScore("opponent", 1)} className="bg-green-400 text-white p-2 rounded hover:bg-green-500"><Plus className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Nota: le modifiche manuali aggiornano il punteggio del tempo ma non creano eventi Gol.</p>
                </div>
              ) : (
                // COLORI UNIFORMATI PER TUTTI I PULSANTI AZIONI SALIENTI
                <div className="space-y-3">
                  {/* Riga 1: Gol Vigontina + Gol Avversario */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowGoalDialog(true)} 
                      className="bg-green-400 text-white py-2 px-3 rounded hover:bg-green-500 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      ⚽ Gol Vigontina
                    </button>
                    <button 
                      onClick={onAddOpponentGoal} 
                      className="bg-blue-400 text-white py-2 px-3 rounded hover:bg-blue-500 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      ⚽ Gol {match.opponent}
                    </button>
                  </div>
                  
                  {/* Riga 2: Autogol + Rigore */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowOwnGoalDialog(true)} 
                      className="bg-red-400 text-white py-2 px-3 rounded hover:bg-red-500 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <span className="bg-red-600 rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        ⚽
                      </span>
                      Autogol
                    </button>
                    <button 
                      onClick={() => setShowPenaltyDialog(true)} 
                      className="bg-purple-400 text-white py-2 px-3 rounded hover:bg-purple-500 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      🎯 Rigore
                    </button>
                  </div>

                  {/* AZIONI SALIENTI CON COLORI UNIFORMATI GRIGIO */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-800 text-center mb-3">Azioni Salienti</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleShotClick}
                        className="bg-gray-500 text-white py-2 px-2 rounded hover:bg-gray-600 font-medium text-xs flex items-center justify-center gap-1"
                      >
                        🎯 Tiro
                      </button>
                      <button 
                        onClick={() => setShowSaveDialog(true)} 
                        className="bg-gray-500 text-white py-2 px-2 rounded hover:bg-gray-600 font-medium text-xs flex items-center justify-center gap-1"
                      >
                        🧤 Parata
                      </button>
                      <button 
                        onClick={() => setShowPostCrossbarDialog(true)} 
                        className="bg-gray-500 text-white py-2 px-2 rounded hover:bg-gray-600 font-medium text-xs flex items-center justify-center gap-1"
                      >
                        🧱 Palo/Traversa
                      </button>
                      <button 
                        onClick={() => setShowDeleteEventDialog(true)} 
                        className="bg-red-500 text-white py-2 px-2 rounded hover:bg-red-600 font-medium text-xs flex items-center justify-center gap-1"
                        disabled={(period.goals || []).length === 0}
                      >
                        🗑️ Elimina Evento
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NUOVO: Eventi organizzati per squadra */}
          {!isProvaTecnica && (organizedEvents.vigontina.length > 0 || organizedEvents.opponent.length > 0) && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Eventi Partita</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Colonna Vigontina */}
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 text-center bg-green-50 py-1 rounded">
                    Vigontina
                  </h4>
                  <div className="space-y-2">
                    {organizedEvents.vigontina.length > 0 ? (
                      organizedEvents.vigontina.map((event) => (
                        <TeamEventCard key={event.originalIndex} event={event} team="vigontina" opponentName={match.opponent} />
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">Nessun evento</div>
                    )}
                  </div>
                </div>
                
                {/* Colonna Avversario */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-700 mb-2 text-center bg-blue-50 py-1 rounded">
                    {match.opponent}
                  </h4>
                  <div className="space-y-2">
                    {organizedEvents.opponent.length > 0 ? (
                      organizedEvents.opponent.map((event) => (
                        <TeamEventCard key={event.originalIndex} event={event} team="opponent" opponentName={match.opponent} />
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">Nessun evento</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Finish Button */}
          <div>
            {!isViewer && (
              <button onClick={onFinish} className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500 font-medium text-sm">
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

// NUOVO: Event Card Component per squadre specifiche
const TeamEventCard = ({ event, team, opponentName }) => {
  const isDeleted = event.deletionReason;
  const baseClasses = isDeleted ? "opacity-60" : "";
  const textClasses = isDeleted ? "line-through" : "";
  
  // Colori base per le squadre
  const teamColors = {
    vigontina: "bg-green-50 border-green-200",
    opponent: "bg-blue-50 border-blue-200"
  };
  
  const bgColor = teamColors[team] || "bg-gray-50 border-gray-200";
  
  // Renderizza l'evento
  let content = null;
  
  if (event.type === "goal" || event.type === "penalty-goal") {
    content = (
      <div className={`${bgColor} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium text-green-800 ${textClasses}`}>
          ⚽ {event.minute}' - {event.scorer} {event.scorerName}
        </p>
        {event.assist && (
          <p className={`text-green-700 ${textClasses}`}>Assist: {event.assist} {event.assistName}</p>
        )}
        {event.deletionReason && (
          <p className="text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    content = (
      <div className={`${bgColor} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium text-blue-800 ${textClasses}`}>
          ⚽ {event.minute}' - {event.type.includes('penalty') ? 'Rigore' : 'Gol'} {opponentName}
        </p>
        {event.deletionReason && (
          <p className="text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "own-goal") {
    content = (
      <div className={`${bgColor} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium text-blue-800 ${textClasses}`}>
          ⚽ {event.minute}' - Autogol Vigontina
        </p>
        {event.deletionReason && (
          <p className="text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "opponent-own-goal") {
    content = (
      <div className={`${bgColor} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium text-green-800 ${textClasses}`}>
          ⚽ {event.minute}' - Autogol {opponentName}
        </p>
        {event.deletionReason && (
          <p className="text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type.includes('penalty') && event.type.includes('missed')) {
    const isVigontina = event.type === 'penalty-missed';
    content = (
      <div className="bg-red-50 p-2 rounded border border-red-200 text-xs">
        <p className="font-medium text-red-800">
          ❌ {event.minute}' - Rigore fallito {isVigontina ? 'Vigontina' : opponentName}
        </p>
      </div>
    );
  } else if (event.type === "save" || event.type === "opponent-save") {
    const isVigontina = event.type === "save";
    content = (
      <div className="bg-orange-50 p-2 rounded border border-orange-200 text-xs">
        <p className="font-medium text-orange-800">
          🧤 {event.minute}' - Parata {isVigontina ? `${event.player} ${event.playerName}` : `portiere ${opponentName}`}
        </p>
      </div>
    );
  } else if (event.type === "missed-shot" || event.type === "opponent-missed-shot") {
    const isVigontina = event.type === "missed-shot";
    content = (
      <div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
        <p className="font-medium text-gray-800">
          🎯 {event.minute}' - Tiro fuori {isVigontina ? `${event.player} ${event.playerName}` : opponentName}
        </p>
      </div>
    );
  } else if (event.type === "shot-blocked" || event.type === "opponent-shot-blocked") {
    const isVigontina = event.type === "shot-blocked";
    content = (
      <div className="bg-orange-100 p-2 rounded border border-orange-300 text-xs">
        <p className="font-medium text-orange-900">
          🧤 {event.minute}' - {isVigontina ? `${event.player} ${event.playerName}` : opponentName} tiro parato
        </p>
      </div>
    );
  } else if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVigontina = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    content = (
      <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs">
        <p className="font-medium text-yellow-800">
          {hitTypeDisplay} {event.minute}' - {isVigontina ? `${event.player} ${event.playerName}` : opponentName}
        </p>
      </div>
    );
  }
  
  return content;
};

export default PeriodPlay;