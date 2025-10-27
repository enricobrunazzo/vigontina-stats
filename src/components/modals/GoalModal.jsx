import React, { useState } from "react";

const GoalModal = ({ availablePlayers, onConfirm, onCancel }) => {
  const [selectedScorer, setSelectedScorer] = useState(null);
  const [selectedAssist, setSelectedAssist] = useState(null);

  const handleConfirm = () => {
    if (!selectedScorer) {
      alert("Seleziona il marcatore");
      return;
    }
    onConfirm(selectedScorer, selectedAssist);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Segna Gol</h3>

        {/* Marcatore */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Marcatore *</label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {availablePlayers.map((player) => (
              <button
                key={player.num}
                onClick={() => setSelectedScorer(player.num)}
                className={`px-2 py-2 rounded border text-sm transition ${
                  selectedScorer === player.num
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
                title={`${player.num} ${player.name}`}
              >
                <span className="font-semibold mr-1">{player.num}</span>{player.name}
              </button>
            ))}
          </div>
        </div>

        {/* Assist */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Assist</label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => setSelectedAssist(null)}
              className={`px-2 py-2 rounded border text-sm transition ${
                selectedAssist === null
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Nessuno
            </button>
            {availablePlayers
              .filter((p) => p.num !== selectedScorer)
              .map((player) => (
                <button
                  key={player.num}
                  onClick={() => setSelectedAssist(player.num)}
                  className={`px-2 py-2 rounded border text-sm transition ${
                    selectedAssist === player.num
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                  }`}
                  title={`${player.num} ${player.name}`}
                >
                  <span className="font-semibold mr-1">{player.num}</span>{player.name}
                </button>
              ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-gray-200 py-2 rounded">Annulla</button>
          <button onClick={handleConfirm} className="flex-1 bg-blue-600 text-white py-2 rounded">Conferma</button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
