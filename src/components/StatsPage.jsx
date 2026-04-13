// components/StatsPage.jsx
import React, { useMemo } from "react";
import { ArrowLeft, Trophy, ShieldOff } from "lucide-react";
import { PLAYERS } from "../constants/players";
import { calculateTotalGoals } from "../utils/matchUtils";

/**
 * Calcola la classifica marcatori da tutto lo storico partite.
 * Conta: goal + penalty-goal + opponent-own-goal (autogol avversario che vale per Vigontina)
 * Esclude: eventi con deletionReason (cancellati), periodi PROVA TECNICA
 */
const buildScorerRanking = (matchHistory) => {
  // Mappa: playerKey (num + name) -> { num, name, goals, assists, matches: Set }
  const map = new Map();

  const getKey = (num, name) => `${num}__${name}`;

  const ensurePlayer = (num, name) => {
    const key = getKey(num, name);
    if (!map.has(key)) {
      map.set(key, { num, name, goals: 0, assists: 0, matchIds: new Set() });
    }
    return map.get(key);
  };

  matchHistory.forEach((match) => {
    if (!Array.isArray(match.periods)) return;
    match.periods.forEach((period) => {
      // Escludi PROVA TECNICA
      if ((period?.name || "").trim().toUpperCase() === "PROVA TECNICA") return;
      if (!Array.isArray(period.goals)) return;

      period.goals.forEach((event) => {
        // Salta eventi cancellati
        if (event.deletionReason) return;

        const type = event.type || "";

        // Gol Vigontina (normale o rigore)
        if (
          (type === "goal" || type === "penalty-goal") &&
          Number.isFinite(event.scorer)
        ) {
          // Cerca il nome preferendo quello salvato nell'evento, poi da PLAYERS
          const playerObj = PLAYERS.find(
            (p) => p.num === event.scorer && p.name === event.scorerName
          ) || PLAYERS.find((p) => p.num === event.scorer);
          const name = event.scorerName || playerObj?.name || `#${event.scorer}`;
          const entry = ensurePlayer(event.scorer, name);
          entry.goals += 1;
          if (match.id) entry.matchIds.add(match.id);

          // Assist
          if (Number.isFinite(event.assist)) {
            const aObj = PLAYERS.find(
              (p) => p.num === event.assist && p.name === event.assistName
            ) || PLAYERS.find((p) => p.num === event.assist);
            const aName = event.assistName || aObj?.name || `#${event.assist}`;
            const aEntry = ensurePlayer(event.assist, aName);
            aEntry.assists += 1;
            if (match.id) aEntry.matchIds.add(match.id);
          }
        }

        // Autogol avversario (punto a Vigontina, ma non di un giocatore specifico)
        // Non viene attribuito a nessuno — solo i gol con scorer vengono contati
      });
    });
  });

  // Converti in array e ordina: prima per gol desc, poi per assist desc, poi per numero maglia asc
  return Array.from(map.values())
    .filter((p) => p.goals > 0 || p.assists > 0)
    .map((p) => ({ ...p, matchCount: p.matchIds.size }))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.num - b.num;
    });
};

const getMedalColor = (rank) => {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-amber-600";
  return "text-gray-300";
};

const getMedalEmoji = (rank) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

const StatsPage = ({ matchHistory, onBack }) => {
  const scorers = useMemo(() => buildScorerRanking(matchHistory), [matchHistory]);

  // Totali stagione
  const totalGoals = useMemo(
    () => scorers.reduce((sum, p) => sum + p.goals, 0),
    [scorers]
  );

  // Gol subiti stagione (somma dei gol avversari in tutte le partite, esclusa PROVA TECNICA)
  const totalGoalsConceded = useMemo(
    () =>
      matchHistory.reduce(
        (sum, match) => sum + calculateTotalGoals(match, "opponent"),
        0
      ),
    [matchHistory]
  );

  // Partite senza gol subiti (clean sheet)
  const cleanSheets = useMemo(
    () =>
      matchHistory.filter(
        (match) => calculateTotalGoals(match, "opponent") === 0
      ).length,
    [matchHistory]
  );

  // Media gol subiti a partita
  const avgConceded = useMemo(
    () =>
      matchHistory.length > 0
        ? (totalGoalsConceded / matchHistory.length).toFixed(1)
        : "0.0",
    [totalGoalsConceded, matchHistory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Statistiche</h2>
          </div>

          {/* Riepilogo stagione */}
          <div className="bg-gradient-to-r from-slate-50 to-cyan-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-3 text-center">Stagione 2025-2026</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Gol segnati */}
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">{totalGoals}</p>
                <p className="text-sm text-gray-600">
                  {totalGoals === 1 ? "gol segnato" : "gol segnati"} in{" "}
                  {matchHistory.length}{" "}
                  {matchHistory.length === 1 ? "partita" : "partite"}
                </p>
              </div>
              {/* Gol subiti */}
              <div className="text-center border-l border-gray-200">
                <p className="text-3xl font-bold text-red-500">{totalGoalsConceded}</p>
                <p className="text-sm text-gray-600">
                  {totalGoalsConceded === 1 ? "gol subito" : "gol subiti"}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiche difensive */}
          {matchHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ShieldOff className="w-5 h-5 text-red-400" />
                Difesa
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{totalGoalsConceded}</p>
                  <p className="text-xs text-gray-500 mt-1">Gol Subiti Totali</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{cleanSheets}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Clean Sheet{cleanSheets !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center col-span-2">
                  <p className="text-2xl font-bold text-orange-600">{avgConceded}</p>
                  <p className="text-xs text-gray-500 mt-1">Media Gol Subiti / Partita</p>
                </div>
              </div>
            </div>
          )}

          {/* Classifica marcatori */}
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            ⚽ Classifica Marcatori
          </h3>

          {scorers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🏟️</p>
              <p className="font-medium">Nessun gol registrato</p>
              <p className="text-sm mt-1">
                I dati appariranno dopo aver salvato almeno una partita con gol.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scorers.map((player, idx) => {
                const rank = idx + 1;
                const medal = getMedalEmoji(rank);
                return (
                  <div
                    key={`${player.num}__${player.name}`}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                      rank === 1
                        ? "bg-yellow-50 border-yellow-200"
                        : rank === 2
                        ? "bg-gray-50 border-gray-200"
                        : rank === 3
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    {/* Posizione + nome */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold w-7 text-center ${getMedalColor(rank)}`}
                      >
                        {medal || rank}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 w-5 text-right">
                          {player.num}
                        </span>
                        <span className="font-semibold text-gray-800 text-sm">
                          {player.name}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      {player.assists > 0 && (
                        <span className="text-blue-600 text-xs">
                          🅰️ {player.assists}
                        </span>
                      )}
                      <span
                        className={`font-bold text-base ${
                          rank <= 3 ? "text-gray-800" : "text-gray-600"
                        }`}
                      >
                        {player.goals} ⚽
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legenda */}
          {scorers.length > 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              ⚽ gol segnati &nbsp;·&nbsp; 🅰️ assist &nbsp;·&nbsp; Periodi
              "Prova Tecnica" esclusi &nbsp;·&nbsp; Gol cancellati esclusi
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
