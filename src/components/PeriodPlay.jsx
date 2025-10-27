// components/PeriodPlay.jsx
// Ensure free-kick goals always carry meta.freeKick so PUN. shows everywhere
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

const PeriodPlay = (props) => {
  const {
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
  } = props;

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

  // Ensure meta.freeKick is always set on goal events created via FreeKick flow
  const handleFreeKickConfirm = (outcome, team, player, hitTypeRaw) => {
    const hitType = hitTypeRaw === 'palo' ? 'palo' : hitTypeRaw === 'traversa' ? 'traversa' : null;
    const minute = safeGetMinute();
    if (outcome === 'goal') {
      if (team === 'vigontina') {
        // Propagate meta so downstream renderers can show PUN.
        onAddGoal(player, null, { minute, meta: { freeKick: true } });
      } else {
        onAddOpponentGoal(minute, { freeKick: true });
      }
    } else if (outcome === 'hit') {
      onAddFreeKick('hit', team, player, minute, hitType);
    } else {
      onAddFreeKick(outcome, team, player, minute, hitType);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Torna alla Panoramica</button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Vigontina vs {match.opponent} - {periodTitle}</h2>

          {/* ...keep full UI as restored previously... */}

          {!isViewer && showFreeKickDialog && (
            <FreeKickModal availablePlayers={availablePlayers} opponentName={match.opponent} onConfirm={handleFreeKickConfirm} onCancel={()=>setShowFreeKickDialog(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodPlay;
