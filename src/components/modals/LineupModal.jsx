// components/modals/LineupModal.jsx
import React, { useMemo, useState } from "react";
import { PLAYERS } from "../../constants/players";

const LineupModal = ({ availablePlayers, initialLineup = [], onConfirm, onCancel }) => {
  // Se availablePlayers non è passato, ricava dai PLAYERS globali esclusi i non convocati (fallback)
  const candidates = useMemo(() => (availablePlayers && availablePlayers.length ? availablePlayers : PLAYERS), [availablePlayers]);

  const [selected, setSelected] = useState(initialLineup.slice(0, 9));

  const toggle = (num) => {
    setSelected((prev) => {
      const exists = prev.includes(num);
      if (exists) return prev.filter((n) => n !== num);
      if (prev.length >= 9) return prev; // limite 9
      return [...prev, num];
    });
  };

  const confirm = () => {
    if (selected.length !== 9) {
      alert("Seleziona esattamente 9 giocatori.");
      return;
    }
    onConfirm?.(selected);
  };

  const isSelected = (num) => selected.includes(num);
  const disabledAdd = (num) => !isSelected(num) && selected.length >= 9;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-1 text-center">Seleziona i 9 in campo</h3>
        <p className="text-xs text-gray-600 mb-3 text-center">Selezionati: {selected.length}/9</p>

        {/* Griglia stile selezione tiri: pulsanti rapidi numero+cognome */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {candidates.map((p) => {
            const selectedState = isSelected(p.num);
            const disabled = disabledAdd(p.num);
            return (
              <button
                key={p.num}
                onClick={() => !disabled && toggle(p.num)}
                className={`rounded px-2 py-2 text-sm border transition select-none
                  ${selectedState ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={`${p.num} ${p.name}`}
              >
                <span className="font-semibold mr-1">{p.num}</span>{p.name}
              </button>
            );
          })}
        </div>

        {/* Azioni */}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded">Annulla</button>
          <button onClick={confirm} className={`flex-1 py-2 rounded text-white ${selected.length===9? 'bg-blue-600 hover:bg-blue-700':'bg-blue-300 cursor-not-allowed'}`}>Conferma ({selected.length})</button>
        </div>
      </div>
    </div>
  );
};

export default LineupModal;
