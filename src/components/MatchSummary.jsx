// components/MatchSummary.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, Users } from "lucide-react";
import { PLAYERS } from "../constants/players";
import { calculateMatchStats, getMatchResult } from "../utils/matchUtils";

const Badge = ({ children, color='indigo' }) => (
  <span className={`ml-2 text-[10px] leading-3 px-1.5 py-0.5 rounded border font-semibold align-middle inline-block bg-${color}-50 border-${color}-200 text-${color}-700`}>{children}</span>
);

const MatchSummary = ({ match, onBack, onExportExcel, onExportPDF, onFIGCReport }) => {
  const stats = useMemo(() => calculateMatchStats(match), [match]);
  const result = useMemo(() => getMatchResult(match), [match]);
  const [showLineups, setShowLineups] = useState(false);

  const organizedEventsByPeriod = useMemo(() => {
    if (!match.periods) return [];
    return match.periods.map((period, periodIdx) => {
      const events = period.goals || [];
      const vigontinaEvents = [];
      const opponentEvents = [];

      events.forEach((event, idx) => {
        const e = { ...event, originalIndex: idx };
        const type = event.type || "";
        const isVig = event.team === 'vigontina' || [
          'goal','penalty-goal','penalty-missed','save','missed-shot','shot-blocked',
          'free-kick-missed','free-kick-saved','free-kick-hit','opponent-own-goal','substitution'
        ].includes(type) || ((type.includes('palo-') || type.includes('traversa-')) && event.team==='vigontina');

        if (isVig) {
          vigontinaEvents.push(e);
        } else {
          opponentEvents.push(e);
        }
      });

      const sortByMinute = (a,b) => (a.minute||0)-(b.minute||0);
      return { period, periodIdx, vigontina: vigontinaEvents.sort(sortByMinute), opponent: opponentEvents.sort(sortByMinute) };
    }).filter(p => p.vigontina.length>0 || p.opponent.length>0 || p.period.vigontina>0 || p.period.opponent>0);
  }, [match.periods]);

  const getPlayerLabel = (num) => {
    const p = PLAYERS.find(pl => pl.num === num);
    return p ? `${p.num} ${p.name}` : `#${num}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Indietro</button>
          
          <h2 className="text-2xl font-bold mb-6">Riepilogo Partita</h2>

          <div className={`border rounded-lg p-6 mb-6 ${result.resultBg}`}>
            <div className="text-center mb-4">
              <p className={`text-3xl font-black mb-2 ${result.resultColor}`}>{result.resultText}</p>
              <div className="flex items-center justify-center gap-8 mb-3">
                <div className="text-center"><p className="text-sm text_gray-600 mb-1">Vigontina San Paolo</p><p className="text-5xl font-bold text-gray-900">{stats.vigontinaPoints}</p></div>
                <span className="text-3xl text-gray-400">-</span>
                <div className="text-center"><p className="text-sm text-gray-600 mb-1">{match.opponent}</p><p className="text-5xl font-bold text-gray-900">{stats.opponentPoints}</p></div>
              </div>
              <p className="text-sm text-gray-600">Gol totali: {stats.vigontinaGoals} - {stats.opponentGoals}</p>
            </div>

            <div className="bg-white/50 p-3 rounded text-sm">
              <p className="text-center">
                <strong>{match.competition}</strong>
                {typeof match.matchDay !== 'undefined' && match.matchDay !== null && ` • Giornata ${match.matchDay}`}
                {" • "}
                {match.isHome ? "🏠 Casa" : "✈️ Trasferta"}
                {" • "}
                {new Date(match.date).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {organizedEventsByPeriod.length>0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">📋 Cronologia Partita per Squadra</h3>
                  {match.periods?.some(p => Array.isArray(p.lineup) && p.lineup.length > 0) && (
                    <button onClick={()=>setShowLineups(s=>!s)} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1" title="Mostra/Nascondi 9 in campo per tempo">
                      <Users className="w-3 h-3" /> {showLineups ? 'Nascondi 9 in campo' : '9 in campo'}
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {organizedEventsByPeriod.map((p)=> (
                    <div key={p.periodIdx} className="border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800">{p.period.name}</h4>
                          <span className="text-sm font-semibold text-gray-600">Vigontina {p.period.vigontina} - {p.period.opponent} {match.opponent}</span>
                        </div>
                        {showLineups && Array.isArray(p.period.lineup) && p.period.lineup.length > 0 && (
                          <div className="mt-2 text-[11px] text-gray-600">
                            <span className="font-semibold mr-1">9 in campo:</span>
                            <span className="inline-block align-middle">
                              {p.period.lineup.map((num, idx)=> (
                                <span key={idx} className="mr-2 whitespace-nowrap">{getPlayerLabel(num)}</span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="space-y-2">
                          {p.vigontina.length>0 ? p.vigontina.map((event)=> (
                            <SummaryEventCard key={event.originalIndex} event={event} team="vigontina" opponentName={match.opponent} />
                          )) : (<div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded">Nessun evento</div>)}
                        </div>
                        <div className="space-y-2">
                          {p.opponent.length>0 ? p.opponent.map((event)=> (
                            <SummaryEventCard key={event.originalIndex} event={event} team="opponent" opponentName={match.opponent} />
                          )) : (<div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded">Nessun evento</div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(match.coach || match.assistantReferee || match.manager) && (
              <div className="mt-2 pt-4 border-t text-sm text-gray-700">
                {match.coach && (<p><strong>Allenatore:</strong> {match.coach}</p>)}
                {match.assistantReferee && (<p><strong>Assistente Arbitro:</strong> {match.assistantReferee}</p>)}
                {match.manager && (<p><strong>Dirigente Accompagnatore:</strong> {match.manager}</p>)}
              </div>
            )}

            <div className="pt-4 grid grid-cols-2 gap-2">
              <button onClick={onExportExcel} className="bg-green-400 text-white py-2 rounded hover:bg-green-500 font-medium flex items-center justify-center gap-2 text-sm"><Download className="w-4 h-4" />Esporta Excel</button>
              <button onClick={onExportPDF} className="bg-red-400 text-white py-2 rounded hover:bg-red-500 font-medium flex items-center justify-center gap-2 text-sm"><Download className="w-4 h-4" />Esporta PDF</button>
            </div>

            {onFIGCReport && (<div className="pt-2"><button onClick={onFIGCReport} className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500 font-medium flex items-center justify-center gap-2 text-sm"><FileText className="w-4 h-4" />Genera Rapporto FIGC</button></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryEventCard = ({ event, team, opponentName }) => {
  const isDeleted = !!event.deletionReason;
  const baseClasses = isDeleted ? "opacity-60" : "";
  const textClasses = isDeleted ? "line-through" : "";
  const minute = event.minute ?? "?";

  const grayCard = (children) => (
    <div className={`bg-gray-50 border border-gray-200 text-gray-800 p-2 rounded border text-xs ${baseClasses}`}>{children}</div>
  );
  const greenCard = (children) => (
    <div className={`bg-green-50 border border-green-200 text-green-800 p-2 rounded border text-xs ${baseClasses}`}>{children}</div>
  );
  const blueCard = (children) => (
    <div className={`bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded border text-xs ${baseClasses}`}>{children}</div>
  );
  const redBall = <span className="text-red-600 font-bold" style={{color: '#dc2626'}}>⚽</span>;

  if (event.type === "goal" || event.type === "penalty-goal") {
    const isRig = event.type === 'penalty-goal';
    return (
      greenCard(
        <div>
          <p className={`font-medium ${textClasses}`}>
            ⚽ {minute}' - {event.scorer} {event.scorerName}
            {isRig && <Badge color="purple">RIG.</Badge>}
          </p>
          {event.assist && (<p className={`text-xs ${textClasses}`}>Assist: {event.assist} {event.assistName}</p>)}
          {isDeleted && (<p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>)}
        </div>
      )
    );
  }
  if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    const isRig = event.type === 'penalty-opponent-goal';
    return (
      blueCard(
        <div>
          <p className={`font-medium ${textClasses}`}>
            ⚽ {minute}' - {event.type.includes('penalty')? 'Rigore' : 'Gol'} {opponentName}
            {isRig && <Badge color="purple">RIG.</Badge>}
          </p>
          {isDeleted && (<p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>)}
        </div>
      )
    );
  }
  if (event.type === "own-goal") {
    return (
      blueCard(
        <p className={`font-medium ${textClasses}`}>{redBall} {minute}' - Autogol Vigontina</p>
      )
    );
  }
  if (event.type === "opponent-own-goal") {
    return (
      greenCard(
        <p className={`font-medium ${textClasses}`}>{redBall} {minute}' - Autogol {opponentName}</p>
      )
    );
  }
  if (event.type.includes('penalty') && event.type.includes('missed')) {
    const who = event.type === 'penalty-missed' ? 'Vigontina' : opponentName;
    return grayCard(
      <p className="font-medium">
        ❌ {minute}' - Rigore fallito {who}
        <Badge color="purple">RIG.</Badge>
      </p>
    );
  }
  if (event.type === "save" || event.type === "opponent-save") {
    const isVig = event.type === 'save';
    return grayCard(<p className="font-medium">🧤 {minute}' - Parata {isVig ? `${event.player} ${event.playerName}` : `portiere ${opponentName}`}</p>);
  }
  if (event.type === "missed-shot" || event.type === "opponent-missed-shot") {
    const isVig = event.type === 'missed-shot';
    return grayCard(<p className="font-medium">🎯 {minute}' - Tiro fuori {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type === "shot-blocked" || event.type === "opponent-shot-blocked") {
    const isVig = event.type === 'shot-blocked';
    return grayCard(<p className="font-medium">🧤 {minute}' - Tiro parato {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVig = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    return grayCard(<p className="font-medium">{hitTypeDisplay} {minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  if (event.type?.startsWith('free-kick')) {
    const label = event.type.includes('missed') ? 'Punizione fuori' : event.type.includes('saved') ? 'Punizione parata' : 'Punizione';
    const suffix = event.hitType === 'palo' ? ' (Palo)' : event.hitType === 'traversa' ? ' (Traversa)' : '';
    const isVig = event.team !== 'opponent';
    return grayCard(<p className="font-medium">🎯 {minute}' - {label}{suffix} {isVig ? `${event.player||''} ${event.playerName||''}`.trim() : opponentName}</p>);
  }
  if (event.type === 'substitution') {
    return grayCard(
      <p className={`font-medium ${textClasses}`}>
        🔁 {minute}' - Sostituzione: {event.out?.num} {event.out?.name} → {event.in?.num} {event.in?.name}
        {isDeleted && (<span className="text-xs text-red-600 italic ml-1">⚠️ {event.deletionReason}</span>)}
      </p>
    );
  }
  return null;
};

export default MatchSummary;
