// components/modals/PenaltyModal.jsx
import React, { useState } from "react";

const PenaltyModal = ({ availablePlayers, opponentName, onConfirm, onCancel }) => {
  const [penaltyTeam, setPenaltyTeam] = useState("vigontina");
  const [penaltyScored, setPenaltyScored] = useState(true);
  const [penaltyScorer, setPenaltyScorer] = useState(null);

  const handleConfirm = () => {
    if (penaltyTeam === "vigontina" && penaltyScored && !penaltyScorer) {
      alert("Seleziona il rigorista");
      return;
    }
    onConfirm(penaltyTeam, penaltyScored, penaltyScorer);
  };

  const handleCancel = () => {
    setPenaltyTeam("vigontina");
    setPenaltyScored(true);
    setPenaltyScorer(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Rigore</h3>

        <div className="mb-4">
          <label className="block font-medium mb-2">Squadra</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPenaltyTeam("vigontina")}
              className={`p-3 rounded border ${
                penaltyTeam === "vigontina"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-300"
              }`}
            >
              Vigontina
            </button>
            <button
              onClick={() => setPenaltyTeam("opponent")}
              className={`p-3 rounded border ${
                penaltyTeam === "opponent"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-300"
              }`}
            >
              {opponentName}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-2">Risultato</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPenaltyScored(true)}
              className={`p-3 rounded border ${
                penaltyScored
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              ⚽ Realizzato
            </button>
            <button
              onClick={() => setPenaltyScored(false)}
              className={`p-3 rounded border ${
                !penaltyScored
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white border-gray-300"
              }`}
            >
              ❌ Fallito
            </button>
          </div>
        </div>

        {penaltyTeam === "vigontina" && penaltyScored && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Rigorista *</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availablePlayers.map((player) => (
                <button
                  key={player.num}
                  onClick={() => setPenaltyScorer(player.num)}
                  className={`p-2 rounded border text-sm ${
                    penaltyScorer === player.num
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {player.num} {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-200 py-2 rounded"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default PenaltyModal;
