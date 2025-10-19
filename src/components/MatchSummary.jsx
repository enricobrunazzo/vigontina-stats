// components/MatchSummary.jsx
import React, { useMemo } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PLAYERS } from "../constants/players";
import { calculateMatchStats, getMatchResult } from "../utils/matchUtils";

const MatchSummary = ({ match, onBack, onExportExcel, onExportPDF, onFIGCReport }) => {
  const stats = useMemo(() => calculateMatchStats(match), [match]);
  const result = useMemo(() => getMatchResult(match), [match]);

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
                  <h3 className="font-semibold mb-2 text-sm">📊 Altri Eventi</h3>
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

            {/* Match Timeline: INCLUDI TUTTI GLI EVENTI */}
            {match.periods && match.periods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">
                  📋 Cronologia Partita (tutti gli eventi)
                </h3>
                <div className="space-y-6">
                  {match.periods.map((period, periodIdx) => {
                    const periodEvents = period.goals ?? [];
                    if (
                      periodEvents.length === 0 &&
                      period.vigontina === 0 &&
                      period.opponent === 0
                    )
                      return null;

                    return (
                      <FullPeriodTimeline
                        key={periodIdx}
                        period={period}
                        opponentName={match.opponent}
                      />
                    );
                  })}
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

// Full Period Timeline: include tutti i tipi di evento con stile coerente
const FullPeriodTimeline = ({ period, opponentName }) => {
  const events = period.goals || [];
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

      {events.length > 0 ? (
        <div className="divide-y">
          {events.map((event, idx) => (
            <FullEventRow key={idx} event={event} opponentName={opponentName} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-gray-500">Nessun evento registrato</div>
      )}
    </div>
  );
};

// Riga evento singolo con supporto barratura e motivi per gol annullati
const FullEventRow = ({ event, opponentName }) => {
  const isDeleted = !!event.deletionReason;
  const baseClasses = isDeleted ? "opacity-60" : "";
  const textClasses = isDeleted ? "line-through" : "";
  const minute = event.minute ?? "?";

  // Helper label per eventi palo/traversa
  const hitLabel = event.hitType === 'palo' ? '🧱 Palo' : event.hitType === 'traversa' ? '⎯ Traversa' : null;

  let content = null;
  switch (event.type) {
    case 'goal':
      content = (
        <>
          <span className={`font-medium ${textClasses}`}>⚽ {minute}' - {event.scorer} {event.scorerName}</span>
          {event.assist && (
            <span className={`text-xs text-gray-600 ${textClasses}`}> • Assist: {event.assist} {event.assistName}</span>
          )}
        </>
      );
      break;
    case 'opponent-goal':
      content = <span className={`font-medium ${textClasses}`}>⚽ {minute}' - Gol {opponentName}</span>;
      break;
    case 'penalty-goal':
      content = <span className={`font-medium ${textClasses}`}>🎯 {minute}' - Rigore {event.scorer} {event.scorerName}</span>;
      break;
    case 'penalty-opponent-goal':
      content = <span className={`font-medium ${textClasses}`}>🎯 {minute}' - Rigore {opponentName}</span>;
      break;
    case 'penalty-missed':
      content = <span className="font-medium">❌ {minute}' - Rigore fallito Vigontina</span>;
      break;
    case 'penalty-opponent-missed':
      content = <span className="font-medium">❌ {minute}' - Rigore fallito {opponentName}</span>;
      break;
    case 'own-goal':
      content = <span className={`font-medium ${textClasses}`}>⚽ {minute}' - Autogol Vigontina (gol a {opponentName})</span>;
      break;
    case 'opponent-own-goal':
      content = <span className={`font-medium ${textClasses}`}>⚽ {minute}' - Autogol {opponentName} (gol a Vigontina)</span>;
      break;
    case 'save':
      content = <span className="font-medium">🧤 {minute}' - Parata {event.player} {event.playerName}</span>;
      break;
    case 'opponent-save':
      content = <span className="font-medium">🧤 {minute}' - Parata portiere {opponentName}</span>;
      break;
    case 'missed-shot':
      content = <span className="font-medium">🎯 {minute}' - Tiro fuori {event.player} {event.playerName}</span>;
      break;
    case 'opponent-missed-shot':
      content = <span className="font-medium">🎯 {minute}' - Tiro fuori {opponentName}</span>;
      break;
    default:
      if (hitLabel) {
        const who = event.team === 'vigontina' ? `${event.player} ${event.playerName}` : opponentName;
        content = <span className="font-medium">{hitLabel} {minute}' - {who}</span>;
      }
  }

  return (
    <div className={`p-3 ${baseClasses}`}>
      <div className="text-gray-900 text-sm flex flex-wrap items-center gap-1">
        {content}
      </div>
      {isDeleted && (
        <p className="text-xs text-red-600 italic mt-1">⚠️ Annullato: {event.deletionReason}</p>
      )}
    </div>
  );
};

export default MatchSummary;