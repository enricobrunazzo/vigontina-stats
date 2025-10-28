// components/modals/PenaltyAdvancedModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

const PenaltyAdvancedModal = ({ onConfirm, onCancel, opponentName, availablePlayers }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isScored, setIsScored] = useState(null);
  const [selectedScorer, setSelectedScorer] = useState(null);

  const handleConfirm = () => {
    if (!selectedTeam || isScored === null) return;
    if (selectedTeam === 'vigontina' && isScored && !selectedScorer) return;
    onConfirm(selectedTeam, isScored, selectedScorer);
  };

  const canConfirm = selectedTeam && isScored !== null && (selectedTeam !== 'vigontina' || !isScored || selectedScorer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-purple-700">🎯 Rigore</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Seleziona squadra che calcia */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Chi calcia il rigore?</p>
          <div className="space-y-2">
            <button onClick={() => setSelectedTeam('vigontina')} className={`w-full p-3 rounded-lg border-2 text-left ${selectedTeam === 'vigontina' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <p className="font-medium text-gray-800">Vigontina</p>
            </button>
            <button onClick={() => setSelectedTeam('opponent')} className={`w-full p-3 rounded-lg border-2 text-left ${selectedTeam === 'opponent' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <p className="font-medium text-gray-800">{opponentName}</p>
            </button>
          </div>
        </div>

        {/* Step 2: Segnato o sbagliato */}
        {selectedTeam && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Esito del rigore:</p>
            <div className="flex gap-2">
              <button onClick={() => setIsScored(true)} className={`flex-1 p-2 rounded-lg border-2 ${isScored === true ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>⚽ Segnato</button>
              <button onClick={() => setIsScored(false)} className={`flex-1 p-2 rounded-lg border-2 ${isScored === false ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>❌ Sbagliato</button>
            </div>
          </div>
        )}

        {/* Step 3: Se Vigontina segna, scegli giocatore */}
        {selectedTeam === 'vigontina' && isScored && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Chi ha segnato?</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availablePlayers.map((player) => (
                <button key={player.num} onClick={() => setSelectedScorer(player.num)} className={`w-full p-2 rounded text-left text-sm ${selectedScorer === player.num ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {player.num} {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium">Annulla</button>
          <button onClick={handleConfirm} disabled={!canConfirm} className={`flex-1 px-4 py-2 rounded font-medium ${canConfirm ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Conferma</button>
        </div>
      </div>
    </div>
  );
};

export default PenaltyAdvancedModal;