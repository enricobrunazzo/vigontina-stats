// components/FreeKickStepModal.jsx
import React, { useState } from "react";

const FreeKickStepModal = ({
  show,
  onClose,
  availablePlayers = [],
  opponentName = "Avversario",
  onConfirm
}) => {
  const [step, setStep] = useState(0); // 0: esito, 1: squadra, 2: giocatore
  const [outcome, setOutcome] = useState(null); // 'goal'|'fuori'|'parata'|'palo'|'traversa'
  const [team, setTeam] = useState(null);

  if (!show) return null;
  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-center">Esito della Punizione</h3>
          <div className="space-y-3">
            <button onClick={() => {setOutcome('goal'); setStep(1);}} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 font-medium">⚽ Gol</button>
            <button onClick={() => {setOutcome('fuori'); setStep(1);}} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">❌ Fuori</button>
            <button onClick={() => {setOutcome('parata'); setStep(1);}} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧤 Parata</button>
            <button onClick={() => {setOutcome('palo'); setStep(1);}} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">🧱 Palo</button>
            <button onClick={() => {setOutcome('traversa'); setStep(1);}} className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 font-medium">⎯ Traversa</button>
            <button onClick={onClose} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
          </div>
        </div>
      </div>
    )
  }
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-center">Chi ha battuto la punizione?</h3>
          <div className="space-y-3">
            <button onClick={() => {setTeam('vigontina'); setStep(outcome==='goal'?2:null); if(outcome!=='goal') onConfirm(outcome, 'vigontina', null, outcome); }} className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 font-medium">Vigontina</button>
            <button onClick={() => onConfirm(outcome, 'opponent', null, outcome)} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium">{opponentName}</button>
            <button onClick={onClose} className="w-full bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400">Annulla</button>
          </div>
        </div>
      </div>
    )
  }
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-center">Seleziona giocatore (Punizione)</h3>
          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
            {availablePlayers.map((p)=>(
              <button key={p.num} onClick={() => onConfirm('goal','vigontina',p.num)} className="bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm text-gray-800">{p.num} {p.name}</button>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-3 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Annulla</button>
        </div>
      </div>
    )
  }
}

export default FreeKickStepModal;