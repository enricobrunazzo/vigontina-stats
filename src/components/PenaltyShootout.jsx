// components/PenaltyShootout.jsx
// Schermata spareggio rigori per Torneo Cadoneghe
import React, { useState } from "react";
import { ArrowLeft, Target } from "lucide-react";
import { PLAYERS } from "../constants/players";

const PenaltyShootout = ({ match, onSave, onBack }) => {
  // Ogni kick: { team: 'vigontina'|'opponent', playerNum: null|number, scored: bool }
  const [kicks, setKicks] = useState([]);
  const [pendingTeam, setPendingTeam] = useState("vigontina"); // chi tira il prossimo rigore
  const [pendingPlayer, setPendingPlayer] = useState(null);
  const [step, setStep] = useState("pick-player"); // 'pick-player' | 'pick-outcome'

  const availablePlayers = (match?.notCalled ?? [])
    ? PLAYERS.filter((p) => !(match?.notCalled ?? []).includes(p.num))
    : PLAYERS;

  const vigKicks = kicks.filter((k) => k.team === "vigontina");
  const oppKicks = kicks.filter((k) => k.team === "opponent");
  const vigScored = vigKicks.filter((k) => k.scored).length;
  const oppScored = oppKicks.filter((k) => k.scored).length;

  const handleAddKick = (scored) => {
    const kick = {
      team: pendingTeam,
      playerNum: pendingTeam === "vigontina" ? pendingPlayer : null,
      scored,
    };
    const newKicks = [...kicks, kick];
    setKicks(newKicks);
    setPendingPlayer(null);
    // alterna squadra
    setPendingTeam((t) => (t === "vigontina" ? "opponent" : "vigontina"));
    setStep("pick-player");
  };

  const handleRemoveLast = () => {
    if (kicks.length === 0) return;
    const last = kicks[kicks.length - 1];
    setKicks(kicks.slice(0, -1));
    setPendingTeam(last.team);
    setPendingPlayer(null);
    setStep("pick-player");
  };

  const canSave = vigKicks.length > 0 && oppKicks.length > 0 && vigScored !== oppScored;

  const handleSave = () => {
    const winner = vigScored > oppScored ? "vigontina" : "opponent";
    onSave({
      kicks,
      vigontina: vigScored,
      opponent: oppScored,
      winner,
    });
  };

  const isVigontinaTurn = pendingTeam === "vigontina";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="text-white hover:text-gray-200 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Torna alla Panoramica
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">Spareggio Rigori</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Vigontina vs {match.opponent} — Torneo Cadoneghe
          </p>

          {/* Tabellone rigori */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Vigontina */}
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-2 text-center">Vigontina</p>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {vigKicks.map((k, i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        k.scored ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {k.scored ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
                <p className="text-3xl font-bold text-center text-purple-800">{vigScored}</p>
              </div>
              {/* Avversario */}
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-2 text-center">{match.opponent}</p>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {oppKicks.map((k, i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        k.scored ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {k.scored ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
                <p className="text-3xl font-bold text-center text-purple-800">{oppScored}</p>
              </div>
            </div>
          </div>

          {/* Input prossimo rigore */}
          <div className={`rounded-lg border-2 p-4 mb-4 ${
            isVigontinaTurn
              ? "border-green-300 bg-green-50"
              : "border-blue-300 bg-blue-50"
          }`}>
            <p className={`text-sm font-semibold mb-3 ${
              isVigontinaTurn ? "text-green-800" : "text-blue-800"
            }`}>
              🎯 Prossimo rigore: <strong>{isVigontinaTurn ? "Vigontina" : match.opponent}</strong>
            </p>

            {/* Selezione giocatore (solo Vigontina) */}
            {isVigontinaTurn && step === "pick-player" && (
              <>
                <p className="text-xs text-gray-600 mb-2">Seleziona il rigorista:</p>
                <div className="grid grid-cols-3 gap-1 max-h-40 overflow-auto mb-3">
                  {availablePlayers.map((p) => (
                    <button
                      key={p.num}
                      onClick={() => { setPendingPlayer(p.num); setStep("pick-outcome"); }}
                      className={`text-xs p-1.5 rounded border ${
                        pendingPlayer === p.num
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p.num} {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Esito rigore */}
            {(step === "pick-outcome" || !isVigontinaTurn) && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddKick(true)}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  ✅ Segnato
                </button>
                <button
                  onClick={() => handleAddKick(false)}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold text-sm"
                >
                  ❌ Sbagliato
                </button>
              </div>
            )}
          </div>

          {/* Annulla ultimo */}
          {kicks.length > 0 && (
            <button
              onClick={handleRemoveLast}
              className="w-full mb-4 py-2 rounded border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
            >
              ↩ Annulla ultimo rigore
            </button>
          )}

          {/* Messaggio stato */}
          {vigKicks.length > 0 && oppKicks.length > 0 && vigScored === oppScored && (
            <p className="text-center text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
              ⚠️ Ancora in parità — continua ad aggiungere rigori
            </p>
          )}

          {canSave && (
            <div className={`rounded-lg p-3 mb-4 text-center text-sm font-semibold ${
              vigScored > oppScored
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}>
              {vigScored > oppScored
                ? `🏆 Vigontina vince ai rigori ${vigScored}-${oppScored}!`
                : `😔 ${match.opponent} vince ai rigori ${oppScored}-${vigScored}`}
            </div>
          )}

          {/* Salva */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-3 rounded-lg font-semibold text-white text-sm ${
              canSave
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            💾 Salva Spareggio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PenaltyShootout;
