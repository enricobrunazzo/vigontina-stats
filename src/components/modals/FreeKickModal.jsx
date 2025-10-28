// components/modals/FreeKickModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

const FreeKickModal = ({ onConfirm, onCancel, opponentName, availablePlayers }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [hitType, setHitType] = useState(null); // per palo/traversa
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleConfirm = () => {
    if (!selectedOutcome || !selectedTeam) return;
    if (selectedTeam === 'vigontina' && !selectedPlayer) return;
    if (selectedOutcome === 'hit' && !hitType) return;
    onConfirm(selectedOutcome, selectedTeam, selectedPlayer, hitType);
  };

  const canConfirm = selectedOutcome && selectedTeam &&
    (selectedTeam !== 'vigontina' || selectedPlayer) &&
    (selectedOutcome !== 'hit' || hitType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-orange-700">🟧 Calcio di Punizione</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Seleziona squadra */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Chi ha calciato la punizione?</p>
          <div className="space-y-2">
            <button onClick={() => setSelectedTeam('vigontina')} className={`w-full p-3 rounded-lg border-2 text-left ${selectedTeam === 'vigontina' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <p className="font-medium text-gray-800">Vigontina</p>
            </button>
            <button onClick={() => setSelectedTeam('opponent')} className={`w-full p-3 rounded-lg border-2 text-left ${selectedTeam === 'opponent' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <p className="font-medium text-gray-800">{opponentName}</p>
            </button>
          </div>
        </div>

        {/* Step 2: Esito della punizione */}
        {selectedTeam && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Esito della punizione:</p>
            <div className="space-y-2">
              <button onClick={() => { setSelectedOutcome('missed'); setHitType(null); }} className={`w-full p-3 rounded-lg border-2 text-left ${selectedOutcome === 'missed' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <p className="font-medium text-gray-800">🎯 Fuori</p>
              </button>
              <button onClick={() => { setSelectedOutcome('saved'); setHitType(null); }} className={`w-full p-3 rounded-lg border-2 text-left ${selectedOutcome === 'saved' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <p className="font-medium text-gray-800">🧤 Parata</p>
              </button>
              <button onClick={() => setSelectedOutcome('hit')} className={`w-full p-3 rounded-lg border-2 text-left ${selectedOutcome === 'hit' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <p className="font-medium text-gray-800">🧱 Palo/Traversa</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Se palo/traversa, scegli quale */}
        {selectedTeam && selectedOutcome === 'hit' && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Tipo di impatto:</p>
            <div className="flex gap-2">
              <button onClick={() => setHitType('palo')} className={`flex-1 p-2 rounded-lg border-2 ${hitType === 'palo' ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>🧱 Palo</button>
              <button onClick={() => setHitType('traversa')} className={`flex-1 p-2 rounded-lg border-2 ${hitType === 'traversa' ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>⎯ Traversa</button>
            </div>
          </div>
        )}

        {/* Step 4: Se Vigontina, scegli giocatore */}
        {selectedTeam === 'vigontina' && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Seleziona il giocatore:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availablePlayers.map((player) => (
                <button key={player.num} onClick={() => setSelectedPlayer(player.num)} className={`w-full p-2 rounded text-left text-sm ${selectedPlayer === player.num ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {player.num} {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium">Annulla</button>
          <button onClick={handleConfirm} disabled={!canConfirm} className={`flex-1 px-4 py-2 rounded font-medium ${canConfirm ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Conferma</button>
        </div>
      </div>
    </div>
  );
};

export default FreeKickModal;
