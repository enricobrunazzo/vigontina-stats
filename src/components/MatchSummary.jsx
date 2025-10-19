// components/MatchSummary.jsx
import React, { useMemo } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PLAYERS } from "../constants/players";
import { calculateMatchStats, getMatchResult } from "../utils/matchUtils";

const MatchSummary = ({ match, onBack, onExportExcel, onExportPDF, onFIGCReport }) => {
  const stats = useMemo(() => calculateMatchStats(match), [match]);
  const result = useMemo(() => getMatchResult(match), [match]);

  // NUOVO: Organizza eventi per squadra
  const organizedEventsByPeriod = useMemo(() => {
    if (!match.periods) return [];
    
    return match.periods.map((period, periodIdx) => {
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
        period,
        periodIdx,
        vigontina: vigontinaEvents.sort((a, b) => (a.minute || 0) - (b.minute || 0)),
        opponent: opponentEvents.sort((a, b) => (a.minute || 0) - (b.minute || 0))
      };
    }).filter(p => p.vigontina.length > 0 || p.opponent.length > 0 || p.period.vigontina > 0 || p.period.opponent > 0);
  }, [match.periods]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>
          
          <h2 className="text-2xl font-bold mb-6">Riepilogo Partita</h2>

          {/* Result Banner */}
          <div className={`border rounded-lg p-6 mb-6 ${result.resultBg}`}>
            <div className="text-center mb-4">
              <p className={`text-3xl font-black mb-2 ${result.resultColor}`}>
                {result.resultText}
              </p>
              <div className="flex items-center justify-center gap-8 mb-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    Vigontina San Paolo
                  </p>
                  <p className="text-5xl font-bold text-gray-900">
                    {stats.vigontinaPoints}
                  </p>
                </div>
                <span className="text-3xl text-gray-400">-</span>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{match.opponent}</p>
                  <p className="text-5xl font-bold text-gray-900">
                    {stats.opponentPoints}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Gol totali: {stats.vigontinaGoals} - {stats.opponentGoals}
              </p>
            </div>

            <div className="bg-white/50 p-3 rounded text-sm">
              <p className="text-center">
                <strong>{match.competition}</strong>
                {match.matchDay && ` - Giornata ${match.matchDay}`}
                {" • "}
                {match.isHome ? "🏠 Casa" : "✈️ Trasferta"}
                {" • "}
                {new Date(match.date).toLocaleDateString("it-IT")}
                {match.coach && (
                  <>
                    {" • "}
                    <span><strong>Allenatore:</strong> {match.coach}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Scorers */}
              {Object.keys(stats.scorers).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">⚽ Marcatori</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.scorers)
                      .sort((a, b) => b[1] - a[1])
                      .map(([num, count]) => {
                        const player = PLAYERS.find(
                          (p) => p.num === parseInt(num)
                        );
                        return (
                          <div
                            key={num}
                            className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm"
                          >
                            <span>
                              {num} {player?.name}
                            </span>
                            <span className="font-bold">{count}⚽</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Assists */}
              {Object.keys(stats.assisters).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">🎯 Assist</h3>
                  <div className="space-y-1">
                    {Object.entries(stats.assisters)
                      .sort((a, b) => b[1] - a[1])
                      .map(([num, count]) => {
                        const player = PLAYERS.find(
                          (p) => p.num === parseInt(num)
                        );
                        return (
                          <div
                            key={num}
                            className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm"
                          >
                            <span>
                              {num} {player?.name}
                            </span>
                            <span className="font-bold">{count}🎯</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Other Events */}
              {(stats.ownGoalsCount > 0 ||
                stats.penaltiesScored > 0 ||
                stats.penaltiesMissed > 0) && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">📄 Altri Eventi</h3>
                  <div className="space-y-1">
                    {stats.ownGoalsCount > 0 && (
                      <div className="bg-red-50 p-2 rounded flex justify-between items-center text-sm border border-red-200">
                        <span className="text-red-800">Autogol</span>
                        <span className="font-bold text-red-800">
                          {stats.ownGoalsCount}
                        </span>
                      </div>
                    )}
                    {stats.penaltiesScored > 0 && (
                      <div className="bg-green-50 p-2 rounded flex justify-between items-center text-sm border border-green-200">
                        <span className="text-green-800">Rigori segnati</span>
                        <span className="font-bold text-green-800">
                          {stats.penaltiesScored}
                        </span>
                      </div>
                    )}
                    {stats.penaltiesMissed > 0 && (
                      <div className="bg-orange-50 p-2 rounded flex justify-between items-center text-sm border border-orange-200">
                        <span className="text-orange-800">Rigori falliti</span>
                        <span className="font-bold text-orange-800">
                          {stats.penaltiesMissed}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AGGIORNATO: Match Timeline con eventi organizzati per squadra */}
            {organizedEventsByPeriod.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">
                  📋 Cronologia Partita per Squadra
                </h3>
                <div className="space-y-6">
                  {organizedEventsByPeriod.map((periodData) => (
                    <TeamOrganizedPeriodTimeline
                      key={periodData.periodIdx}
                      periodData={periodData}
                      opponentName={match.opponent}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {(match.assistantReferee || match.teamManager || match.coach) && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-sm text-gray-600">
                  Informazioni Aggiuntive
                </h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  {match.coach && (
                    <p>
                      <strong>Allenatore:</strong> {match.coach}
                    </p>
                  )}
                  {match.assistantReferee && (
                    <p>
                      <strong>Assistente Arbitro:</strong>{" "}
                      {match.assistantReferee}
                    </p>
                  )}
                  {match.teamManager && (
                    <p>
                      <strong>Dirigente Accompagnatore:</strong>{" "}
                      {match.teamManager}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Export Buttons - colori più tenui */}
            <div className="pt-4 border-t grid grid-cols-2 gap-2">
              <button
                onClick={onExportExcel}
                className="bg-green-400 text-white py-2 rounded hover:bg-green-500 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Esporta Excel
              </button>
              <button
                onClick={onExportPDF}
                className="bg-red-400 text-white py-2 rounded hover:bg-red-500 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Esporta PDF
              </button>
            </div>

            {/* FIGC Report Button */}
            {onFIGCReport && (
              <div className="pt-2">
                <button
                  onClick={onFIGCReport}
                  className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500 font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Genera Rapporto FIGC
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// NUOVO: Timeline organizzata per squadra
const TeamOrganizedPeriodTimeline = ({ periodData, opponentName }) => {
  const { period, vigontina, opponent } = periodData;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-3 border-b">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-800">{period.name}</h4>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">
              Vigontina {period.vigontina} - {period.opponent} {opponentName}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Colonna Vigontina */}
        <div>
          <h5 className="text-sm font-semibold text-green-700 mb-2 text-center bg-green-50 py-1 rounded">
            Vigontina San Paolo
          </h5>
          <div className="space-y-2">
            {vigontina.length > 0 ? (
              vigontina.map((event) => (
                <SummaryEventCard key={event.originalIndex} event={event} team="vigontina" opponentName={opponentName} />
              ))
            ) : (
              <div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded">Nessun evento</div>
            )}
          </div>
        </div>
        
        {/* Colonna Avversario */}
        <div>
          <h5 className="text-sm font-semibold text-blue-700 mb-2 text-center bg-blue-50 py-1 rounded">
            {opponentName}
          </h5>
          <div className="space-y-2">
            {opponent.length > 0 ? (
              opponent.map((event) => (
                <SummaryEventCard key={event.originalIndex} event={event} team="opponent" opponentName={opponentName} />
              ))
            ) : (
              <div className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded">Nessun evento</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// NUOVO: Event Card per il riepilogo
const SummaryEventCard = ({ event, team, opponentName }) => {
  const isDeleted = !!event.deletionReason;
  const baseClasses = isDeleted ? "opacity-60" : "";
  const textClasses = isDeleted ? "line-through" : "";
  const minute = event.minute ?? "?";

  // Colori base per le squadre
  const teamColors = {
    vigontina: "bg-green-50 border-green-200 text-green-800",
    opponent: "bg-blue-50 border-blue-200 text-blue-800"
  };
  
  const cardStyle = teamColors[team] || "bg-gray-50 border-gray-200 text-gray-800";
  
  let content = null;
  
  if (event.type === "goal" || event.type === "penalty-goal") {
    content = (
      <div className={`${cardStyle} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>
          ⚽ {minute}' - {event.scorer} {event.scorerName}
        </p>
        {event.assist && (
          <p className={`text-xs ${textClasses}`}>Assist: {event.assist} {event.assistName}</p>
        )}
        {isDeleted && (
          <p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "opponent-goal" || event.type === "penalty-opponent-goal") {
    content = (
      <div className={`${cardStyle} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>
          ⚽ {minute}' - {event.type.includes('penalty') ? 'Rigore' : 'Gol'} {opponentName}
        </p>
        {isDeleted && (
          <p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "own-goal") {
    content = (
      <div className={`${cardStyle} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>
          ⚽ {minute}' - Autogol Vigontina
        </p>
        {isDeleted && (
          <p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type === "opponent-own-goal") {
    content = (
      <div className={`${cardStyle} p-2 rounded border text-xs ${baseClasses}`}>
        <p className={`font-medium ${textClasses}`}>
          ⚽ {minute}' - Autogol {opponentName}
        </p>
        {isDeleted && (
          <p className="text-xs text-red-600 italic mt-1">⚠️ {event.deletionReason}</p>
        )}
      </div>
    );
  } else if (event.type.includes('penalty') && event.type.includes('missed')) {
    const teamName = event.type === 'penalty-missed' ? 'Vigontina' : opponentName;
    content = (
      <div className="bg-red-50 border-red-200 text-red-800 p-2 rounded border text-xs">
        <p className="font-medium">
          ❌ {minute}' - Rigore fallito {teamName}
        </p>
      </div>
    );
  } else if (event.type === "save" || event.type === "opponent-save") {
    const isVigontina = event.type === "save";
    content = (
      <div className="bg-orange-50 border-orange-200 text-orange-800 p-2 rounded border text-xs">
        <p className="font-medium">
          🧤 {minute}' - Parata {isVigontina ? `${event.player} ${event.playerName}` : `portiere ${opponentName}`}
        </p>
      </div>
    );
  } else if (event.type === "missed-shot" || event.type === "opponent-missed-shot") {
    const isVigontina = event.type === "missed-shot";
    content = (
      <div className="bg-gray-50 border-gray-200 text-gray-800 p-2 rounded border text-xs">
        <p className="font-medium">
          🎯 {minute}' - Tiro fuori {isVigontina ? `${event.player} ${event.playerName}` : opponentName}
        </p>
      </div>
    );
  } else if (event.type === "shot-blocked" || event.type === "opponent-shot-blocked") {
    const isVigontina = event.type === "shot-blocked";
    content = (
      <div className="bg-orange-100 border-orange-300 text-orange-900 p-2 rounded border text-xs">
        <p className="font-medium">
          🧤 {minute}' - {isVigontina ? `${event.player} ${event.playerName}` : opponentName} tiro parato
        </p>
      </div>
    );
  } else if (event.type?.includes('palo-') || event.type?.includes('traversa-')) {
    const isVigontina = event.team === 'vigontina';
    const hitTypeDisplay = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
    content = (
      <div className="bg-yellow-50 border-yellow-200 text-yellow-800 p-2 rounded border text-xs">
        <p className="font-medium">
          {hitTypeDisplay} {minute}' - {isVigontina ? `${event.player} ${event.playerName}` : opponentName}
        </p>
      </div>
    );
  }
  
  return content;
};

export default MatchSummary;