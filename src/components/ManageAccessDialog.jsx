// components/ManageAccessDialog.jsx
import React, { useState } from 'react';

const ManageAccessDialog = ({ onConfirm, onCancel }) => {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handle = async () => {
    try {
      await onConfirm(pwd);
    } catch (e) {
      setErr(e?.message || 'Errore accesso');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3">Accesso Organizzatore</h3>
        <p className="text-sm text-gray-600 mb-3">Inserisci la password per gestire la partita in corso</p>
        <input type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="Password" className="w-full border rounded p-2 mb-2" />
        {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-3 py-1.5 border rounded">Annulla</button>
          <button onClick={handle} className="px-3 py-1.5 bg-blue-600 text-white rounded">Conferma</button>
        </div>
      </div>
    </div>
  );
};

export default ManageAccessDialog;
