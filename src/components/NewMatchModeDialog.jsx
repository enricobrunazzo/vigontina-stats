// components/NewMatchModeDialog.jsx
import React, { useState } from 'react';

const NewMatchModeDialog = ({ onSelect, onCancel }) => {
  const [mode, setMode] = useState('local');
  const [password, setPassword] = useState('');
  const REQUIRED_PWD = 'Vigontina14!';

  const handleConfirm = () => {
    if (mode === 'shared') {
      if (password !== REQUIRED_PWD) {
        alert('Password partita condivisa non corretta.');
        return;
      }
    }
    onSelect({ mode, password: mode === 'shared' ? password : null });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Nuova Partita</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
            <input type="radio" name="mode" value="local" checked={mode==='local'} onChange={()=>setMode('local')} />
            <div>
              <div className="font-medium">Locale</div>
              <div className="text-sm text-gray-500">Avvio come prima, modificabile da questo dispositivo</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
            <input type="radio" name="mode" value="shared" checked={mode==='shared'} onChange={()=>setMode('shared')} />
            <div>
              <div className="font-medium">Condivisa (solo visualizzazione)</div>
              <div className="text-sm text-gray-500">Popola la Home con il live; nessuna modifica consentita qui</div>
            </div>
          </label>
          {mode==='shared' && (
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Password organizzatore</label>
              <input type="password" className="w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Vigontina14!" />
              <p className="text-xs text-gray-500">Richiesta per creare la partita condivisa</p>
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border rounded">Annulla</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded">Continua</button>
        </div>
      </div>
    </div>
  );
};

export default NewMatchModeDialog;