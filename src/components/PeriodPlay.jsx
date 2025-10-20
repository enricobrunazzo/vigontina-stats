// components/PeriodPlay.jsx (add icons/cards for substitution and free-kick)
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus, Flag, Repeat, Bolt } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
import SubstitutionModal from "./modals/SubstitutionModal";

const PeriodPlay = (props) => {
  // keep existing implementation, only TeamEventCard updated below
  return (<OriginalPeriodPlay {...props} />);
};

export default PeriodPlay;

// Extract original TeamEventCard and enhance it
export const TeamEventCard = ({ event, team, opponentName }) => {
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

  // Goals
  if (event.type === "goal" || event.type === "penalty-goal") {
    const isRig = event.type === 'penalty-goal';
    return greenCard(
      <p className={`font-medium text-green-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.scorer} {event.scorerName}
        {isRig && <span className="ml-1 text-[10px] px-1 py-[1px] rounded border bg-purple-50 border-purple-200 text-purple-700 font-semibold">RIG.</span>}
      </p>
    );
  }
  if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    const isRig = event.type === 'penalty-opponent-goal';
    return blueCard(
      <p className={`font-medium text-blue-800 ${textClasses}`}>
        ⚽ {event.minute}' - {event.type.includes('penalty') ? 'Rigore' : 'Gol'} {opponentName}
        {isRig && <span className="ml-1 text-[10px] px-1 py-[1px] rounded border bg-purple-50 border-purple-200 text-purple-700 font-semibold">RIG.</span>}
      </p>
    );
  }

  // Own goals
  if (event.type === "opponent-own-goal") {
    return greenCard(
      <p className={`font-medium text-green-800 ${textClasses}`}>
        {redBall} {event.minute}' - Autogol {opponentName}
        <span className="ml-1 text-[10px] px-1 py-[1px] rounded border bg-red-50 border-red-200 text-red-700 font-semibold">AUTOGOL</span>
      </p>
    );
  }
  if (event.type === "own-goal") {
    return blueCard(
      <p className={`font-medium text-blue-800 ${textClasses}`}>
        {redBall} {event.minute}' - Autogol Vigontina
        <span className="ml-1 text-[10px] px-1 py-[1px] rounded border bg-red-50 border-red-200 text-red-700 font-semibold">AUTOGOL</span>
      </p>
    );
  }

  // Penalties missed
  if (event.type.includes('penalty') && event.type.includes('missed')) {
    const isVig = event.type === 'penalty-missed';
    return grayCard(
      <p className="font-medium text-gray-800">
        ❌ {event.minute}' - Rigore fallito {isVig ? 'Vigontina' : opponentName}
        <span className="ml-1 text-[10px] px-1 py-[1px] rounded border bg-purple-50 border-purple-200 text-purple-700 font-semibold">RIG.</span>
      </p>
    );
  }

  // Shots
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

  // NEW: Free-kicks visual
  if (event.type?.startsWith('free-kick')) {
    const isOpp = event.type.includes('opponent');
    if (event.type.includes('missed')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione fuori {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()}</p>);
    if (event.type.includes('saved')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione parata {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()}</p>);
    if (event.type.includes('hit')) return grayCard(<p className="font-medium text-gray-800">🟧 {event.minute}' - Punizione {event.hitType==='palo'?'🧱 Palo':'⎯ Traversa'} {isOpp ? opponentName : `${event.player||''} ${event.playerName||''}`.trim()}</p>);
  }

  // NEW: Substitution visual
  if (event.type === 'substitution') {
    return grayCard(
      <p className="font-medium text-gray-800">
        🔁 {event.minute}' - Sostituzione: {event.out?.num} {event.out?.name} → {event.in?.num} {event.in?.name}
      </p>
    );
  }

  return null;
};
