// components/MatchSummary.jsx
import React, { useMemo } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PLAYERS } from "../constants/players";
import { calculateMatchStats, getMatchResult } from "../utils/matchUtils";

const MatchSummary = ({ match, onBack, onExportExcel, onExportPDF, onFIGCReport }) => {
  const stats = useMemo(() => calculateMatchStats(match), [match]);
  const result = useMemo(() => getMatchResult(match), [match]);

  const organizedEventsByPeriod = useMemo(() => {
    if (!match.periods) return [];
    return match.periods.map((period, periodIdx) => {
      const events = period.goals || [];
      const vigontinaEvents = [];
      const opponentEvents = [];
      events.forEach((event, idx) => {
        const e = { ...event, originalIndex: idx };
        if (
          ['goal','penalty-goal','penalty-missed','save','missed-shot','shot-blocked'].includes(event.type)
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
      return { period, periodIdx, vigontina: vigontinaEvents.sort(sortByMinute), opponent: opponentEvents.sort(sortByMinute) };
    }).filter(p => p.vigontina.length>0 || p.opponent.length>0 || p.period.vigontina>0 || p.period.opponent>0);
  }, [match.periods]);

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
                <div className="text-center"><p className="text-sm text-gray-600 mb-1">Vigontina San Paolo</p><p className="text-5xl font-bold text-gray-900">{stats.vigontinaPoints}</p></div>
                <span className="text-3xl text-gray-400">-</span>
                <div className="text-center"><p className="text-sm text-gray-600 mb-1">{match.opponent}</p><p className="text-5xl font-bold text-gray-900">{stats.opponentPoints}</p></div>
              </div>
              <p className="text-sm text-gray-600">Gol totali: {stats.vigontinaGoals} - {stats.opponentGoals}</p>
            </div>

            <div className="bg-white/50 p-3 rounded text-sm">
              <p className="text-center">
                <strong>{match.competition}</strong>
                {match.matchDay && ` - Giornata ${match.matchDay}`}
                {" • "}
                {match.isHome ? "🏠 Casa" : "✈️ Trasferta"}
                {" • "}
                {new Date(match.date).toLocaleDateString("it-IT")}
                {match.coach && (<> {" • "}<span><strong>Allenatore:</strong> {match.coach}</span></>)}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(stats.scorers).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">⚽ Marcatori</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.scorers).sort((a,b)=>b[1]-a[1]).map(([num,count])=>{
                      const player = PLAYERS.find((p)=>p.num===parseInt(num));
                      return (<div key={num} className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm"><span>{num} {player?.name}</span><span className="font-bold">{count}⚽</span></div>);
                    })}
                  </div>
                </div>
              )}
              {Object.keys(stats.assisters).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">🎯 Assist</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.assisters).sort((a,b)=>b[1]-a[1]).map(([num,count])=>{
                      const player = PLAYERS.find((p)=>p.num===parseInt(num));
                      return (<div key={num} className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm"><span>{num} {player?.name}</span><span className="font-bold">{count}🎯</span></div>);
                    })}
                  </div>
                </div>
              )}
              {(stats.ownGoalsCount>0 || stats.penaltiesScored>0 || stats.penaltiesMissed>0) && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">📄 Altri Eventi</h3>
                  <div className="space-y-1">
                    {stats.ownGoalsCount>0 && (<div className="bg-red-50 p-2 rounded flex justify-between items-center text-sm border border-red-200"><span className="text-red-800">Autogol</span><span className="font-bold text-red-800">{stats.ownGoalsCount}</span></div>)}
                    {stats.penaltiesScored>0 && (<div className="bg-green-50 p-2 rounded flex justify-between items-center text-sm border border-green-200"><span className="text-green-800">Rigori segnati</span><span className="font-bold text-green-800">{stats.penaltiesScored}</span></div>)}
                    {stats.penaltiesMissed>0 && (<div className="bg-orange-50 p-2 rounded flex justify-between items-center text-sm border border-orange-200"><span className="text-orange-800">Rigori falliti</span><span className="font-bold text-orange-800">{stats.penaltiesMissed}</span></div>)}
                  </div>
                </div>
              )}
            </div>

            {organizedEventsByPeriod.length>0 && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">📋 Cronologia Partita per Squadra</h3>
                <div className="space-y-6">
                  {organizedEventsByPeriod.map((p)=> (
                    <div key={p.periodIdx} className="border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800">{p.period.name}</h4>
                          <span className="text-sm font-semibold text-gray-600">Vigontina {p.period.vigontina} - {p.period.opponent} {match.opponent}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="space-y-2">
                          {p.vigontina.length>0 ? p.vigontina.map((event)=>(
                            <SummaryEventCard key={event.originalIndex} event={event} team="vigontina" opponentName={match.opponent} />
                          )) : (<div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded">Nessun evento</div>)}
                        </div>
                        <div className="space-y-2">
                          {p.opponent.length>0 ? p.opponent.map((event)=>(
                            <SummaryEventCard key={event.originalIndex} event={event} team="opponent" opponentName={match.opponent} />
                          )) : (<div className="text-xs text-gray-400 text-center py-2 bg_gray-50 rounded">Nessun evento</div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t grid grid-cols-2 gap-2">
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

  if (event.type === "goal" || event.type === "penalty-goal") {
    return (
      <div className={`bg-green-50 border border-green-200 text-green-800 p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>⚽ {minute}' - {event.scorer} {event.scorerName}</p>
        {event.assist && (<p className={`text-xs ${textClasses}`}>Assist: {event.assist} {event.assistName}</p>)}
        {isDeleted && (<p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>)}
      </div>
    );
  }
  if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    return (
      <div className={`bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>⚽ {minute}' - {event.type.includes('penalty')? 'Rigore' : 'Gol'} {opponentName}</p>
        {isDeleted && (<p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>)}
      </div>
    );
  }
  if (event.type === "own-goal" || event.type === "opponent-own-goal") {
    const who = event.type === 'own-goal' ? 'Vigontina' : opponentName;
    return grayCard(<p className={`font-medium ${textClasses}`}>⚽ {minute}' - Autogol {who}</p>);
  }
  if (event.type.includes('penalty') && event.type.includes('missed')) {
    const who = event.type === 'penalty-missed' ? 'Vigontina' : opponentName;
    return grayCard(<p className="font-medium">❌ {minute}' - Rigore fallito {who}</p>);
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
    return grayCard(<p className="font-medium">🧤 {minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName} tiro parato</p>);
  }
  if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVig = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    return grayCard(<p className="font-medium">{hitTypeDisplay} {minute}' - {isVig ? `${event.player} ${event.playerName}` : opponentName}</p>);
  }
  return null;
};

export default MatchSummary;