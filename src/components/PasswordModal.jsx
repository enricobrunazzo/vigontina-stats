// components/PasswordModal.jsx - Modale per inserire password organizzatore
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

const PasswordModal = ({ onConfirm, onCancel, title = "Autenticazione Organizzatore" }) => {
  const [password, setPassword] = useState('');
  const [showAsViewer, setShowAsViewer] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showAsViewer) {
      onConfirm(''); // Password vuota = modalità viewer
    } else {
      onConfirm(password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Organizzatore
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci password..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={showAsViewer}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAsViewer}
                onChange={(e) => setShowAsViewer(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Entra come spettatore (sola lettura)
              </span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <strong>Organizzatore:</strong> Può modificare eventi e punteggi<br/>
              <strong>Spettatore:</strong> Può solo visualizzare la partita
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Password: <code className="bg-blue-100 px-1 rounded">vigontina2025</code>
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {showAsViewer ? 'Entra come Spettatore' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;