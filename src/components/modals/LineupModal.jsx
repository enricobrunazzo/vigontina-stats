// components/modals/LineupModal.jsx
import React, { useState } from "react";

const LineupModal = ({ availablePlayers, initialLineup, onConfirm, onCancel }) => {
  const [selectedLineup, setSelectedLineup] = useState(initialLineup || []);

  const togglePlayer = (playerNum) => {
    setSelectedLineup((prev) => {
      if (prev.includes(playerNum)) {
        return prev.filter((n) => n !== playerNum);
      } else if (prev.length < 9) {
        return [...prev, playerNum];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedLineup.length !== 9) {
      alert("Seleziona esattamente 9 giocatori.");
      return;
    }
    onConfirm(selectedLineup);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-2">Seleziona i 9 in campo</h3>
        <p className="text-sm text-gray-600 mb-3">
          Convocati disponibili: {availablePlayers.length} • Selezionati:{" "}
          {selectedLineup.length}/9
        </p>

        {availablePlayers.length < 9 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded p-2 mb-3">
            Attenzione: i convocati sono meno di 9. Aggiorna le convocazioni o
            prosegui quando saranno disponibili.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {availablePlayers.map((player) => {
            const checked = selectedLineup.includes(player.num);
            const disabled = !checked && selectedLineup.length >= 9;
            
            return (
              <button
                key={player.num}
                onClick={() => !disabled && togglePlayer(player.num)}
                className={`p-2 rounded border text-sm text-left
                  ${
                    checked
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-300"
                  }
                  ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
              >
                {player.num} {player.name}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 py-2 rounded"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
          >
            Conferma ({selectedLineup.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineupModal;