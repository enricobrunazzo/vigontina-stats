// components/modals/SubstitutionModal.jsx
import React, { useMemo, useState } from "react";
import { PLAYERS } from "../../constants/players";

const SubstitutionModal = ({ periodLineup = [], notCalled = [], onConfirm, onCancel }) => {
  const lineupPlayers = useMemo(() => PLAYERS.filter(p => periodLineup.includes(p.num)), [periodLineup]);
  const benchPlayers = useMemo(() => PLAYERS.filter(p => !periodLineup.includes(p.num) && !(notCalled||[]).includes(p.num)), [periodLineup, notCalled]);
  const [outNum, setOutNum] = useState(lineupPlayers[0]?.num || "");
  const [inNum, setInNum] = useState(benchPlayers[0]?.num || "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-center">Sostituzione Vigontina</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Esce</label>
            <select value={outNum} onChange={(e)=>setOutNum(parseInt(e.target.value))} className="w-full border rounded p-2">
              {lineupPlayers.map(p => (
                <option key={p.num} value={p.num}>{p.num} {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Entra</label>
            <select value={inNum} onChange={(e)=>setInNum(parseInt(e.target.value))} className="w-full border rounded p-2">
              {benchPlayers.map(p => (
                <option key={p.num} value={p.num}>{p.num} {p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={()=>onConfirm(outNum, inNum)} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Conferma</button>
            <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">Annulla</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionModal;
