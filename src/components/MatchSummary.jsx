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

            {/* Match Timeline */}
            {match.periods && match.periods.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">
                  📋 Cronologia Partita
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

                    const vigontinaEvents = periodEvents.filter(
                      (e) =>
                        e.type === "goal" ||
                        e.type === "penalty-goal" ||
                        e.type === "own-goal" ||
                        (e.type === "penalty-missed" && e.team === "vigontina")
                    );
                    const opponentEvents = periodEvents.filter(
                      (e) =>
                        e.type === "opponent-goal" ||
                        e.type === "penalty-opponent-goal" ||
                        e.type === "penalty-opponent-missed"
                    );

                    return (
                      <PeriodTimeline
                        key={periodIdx}
                        period={period}
                        vigontinaEvents={vigontinaEvents}
                        opponentEvents={opponentEvents}
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

            {/* Export Buttons */}
            <div className="pt-4 border-t grid grid-cols-2 gap-2">
              <button
                onClick={onExportExcel}
                className="bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Esporta Excel
              </button>
              <button
                onClick={onExportPDF}
                className="bg-red-500 text-white py-2 rounded hover:bg-red-600 font-medium flex items-center justify-center gap-2 text-sm"
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
                  className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 font-medium flex items-center justify-center gap-2 text-sm"
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

// Period Timeline Component
const PeriodTimeline = ({
  period,
  vigontinaEvents,
  opponentEvents,
  opponentName,
}) => {
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

      {vigontinaEvents.length > 0 || opponentEvents.length > 0 ? (
        <div className="grid grid-cols-2 divide-x">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
              VIGONTINA
            </p>
            <div className="space-y-2">
              {vigontinaEvents.map((event, idx) => (
                <EventCard key={idx} event={event} />
              ))}
              {vigontinaEvents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Nessun evento
                </p>
              )}
            </div>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase">
              {opponentName}
            </p>
            <div className="space-y-2">
              {opponentEvents.map((event, idx) => (
                <EventCard key={idx} event={event} isOpponent />
              ))}
              {opponentEvents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Nessun evento
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-gray-500">
          Nessun evento registrato
        </div>
      )}
    </div>
  );
};

// Event Card Component for Timeline
const EventCard = ({ event, isOpponent = false }) => {
  const baseColor = isOpponent ? "blue" : "green";

  if (event.type === "goal") {
    return (
      <div className={`bg-${baseColor}-50 p-2 rounded border border-${baseColor}-200 text-sm`}>
        <p className={`font-medium text-${baseColor}-800`}>
          ⚽ {event.minute}' - {event.scorer} {event.scorerName}
        </p>
        {event.assist && (
          <p className={`text-xs text-${baseColor}-700`}>
            Assist: {event.assist} {event.assistName}
          </p>
        )}
      </div>
    );
  }

  if (event.type === "penalty-goal") {
    return (
      <div className={`bg-${baseColor}-50 p-2 rounded border border-${baseColor}-200 text-sm`}>
        <p className={`font-medium text-${baseColor}-800`}>
          🎯 {event.minute}' - Rigore {event.scorer} {event.scorerName}
        </p>
      </div>
    );
  }

  if (event.type === "own-goal") {
    return (
      <div className="bg-red-50 p-2 rounded border border-red-200 text-sm">
        <p className="font-medium text-red-800 flex items-center gap-1">
          <span className="bg-red-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">
            ⚽
          </span>
          {event.minute}' - Autogol
        </p>
      </div>
    );
  }

  if (event.type === "penalty-missed") {
    return (
      <div className="bg-red-50 p-2 rounded border border-red-200 text-sm">
        <p className="font-medium text-red-800 flex items-center gap-1">
          ❌ {event.minute}' - Rigore fallito
        </p>
      </div>
    );
  }

  if (event.type === "opponent-goal") {
    return (
      <div className="bg-blue-50 p-2 rounded border border-blue-200 text-sm">
        <p className="font-medium text-blue-800">⚽ {event.minute}' - Gol</p>
      </div>
    );
  }

  if (event.type === "penalty-opponent-goal") {
    return (
      <div className="bg-blue-50 p-2 rounded border border-blue-200 text-sm">
        <p className="font-medium text-blue-800">🎯 {event.minute}' - Rigore</p>
      </div>
    );
  }

  if (event.type === "penalty-opponent-missed") {
    return (
      <div className="bg-red-50 p-2 rounded border border-red-200 text-sm">
        <p className="font-medium text-red-800 flex items-center gap-1">
          ❌ {event.minute}' - Rigore fallito
        </p>
      </div>
    );
  }

  return null;
};

export default MatchSummary;
