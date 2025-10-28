// components/modals/OwnGoalModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

const OwnGoalModal = ({ onConfirm, onCancel, opponentName }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleConfirm = () => {
    if (!selectedTeam) return;
    onConfirm(selectedTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-700">Autogol</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Seleziona quale squadra ha commesso l'autogol. Il gol sarà assegnato alla squadra avversaria.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedTeam('vigontina')}
            className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 ${
              selectedTeam === 'vigontina'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">
              ⚽
            </span>
            <div>
              <p className="font-medium text-gray-800">Autogol Vigontina</p>
              <p className="text-xs text-gray-500">Il gol viene assegnato a {opponentName}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedTeam('opponent')}
            className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 ${
              selectedTeam === 'opponent'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">
              ⚽
            </span>
            <div>
              <p className="font-medium text-gray-800">Autogol {opponentName}</p>
              <p className="text-xs text-gray-500">Il gol viene assegnato a Vigontina</p>
            </div>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTeam}
            className={`flex-1 px-4 py-2 rounded font-medium ${
              selectedTeam
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnGoalModal;