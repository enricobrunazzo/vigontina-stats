// components/SharedMatchManager.jsx
import React, { useState, useEffect } from 'react';
import { Users, Share2, Play, Eye, Edit3, Copy, CheckCircle } from 'lucide-react';

const SharedMatchManager = ({ 
  onCreateSharedMatch, 
  onJoinSharedMatch,
  sharedMatchId,
  userRole,
  participants = [],
  isConnected 
}) => {
  const [matchCode, setMatchCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Controlla se c'è un codice partita nell'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchParam = urlParams.get('match');
    if (matchParam && !sharedMatchId) {
      setMatchCode(matchParam);
      setShowJoinForm(true);
    }
  }, [sharedMatchId]);

  const handleCreateMatch = async (matchData) => {
    setLoading(true);
    setError('');
    
    try {
      await onCreateSharedMatch(matchData);
    } catch (err) {
      setError('Errore nella creazione della partita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!matchCode.trim()) {
      setError('Inserisci un codice partita valido');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onJoinSharedMatch(matchCode.trim());
      setShowJoinForm(false);
    } catch (err) {
      setError('Errore nell\'accesso alla partita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!sharedMatchId) return;
    
    const shareUrl = `${window.location.origin}?match=${sharedMatchId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'organizer': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'collaborator': return <Users className="w-4 h-4 text-green-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'organizer': return 'Organizzatore';
      case 'collaborator': return 'Collaboratore';
      default: return 'Spettatore';
    }
  };

  // Se già connesso a una partita
  if (sharedMatchId && isConnected) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-gray-800">Partita Condivisa Attiva</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getRoleIcon(userRole)}
            <span>{getRoleLabel(userRole)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Codice Partita:</div>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-3 py-1 rounded font-mono text-lg font-bold">
                {sharedMatchId}
              </code>
              <button
                onClick={copyShareLink}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copia link di condivisione"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Partecipanti ({participants.length}):
            </div>
            <div className="flex flex-wrap gap-1">
              {participants.map((participant, index) => (
                <div 
                  key={participant.id || index}
                  className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border text-xs"
                >
                  {getRoleIcon(participant.role)}
                  <span>{getRoleLabel(participant.role)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {copied && (
          <div className="mt-3 p-2 bg-green-100 text-green-700 rounded text-sm">
            ✓ Link copiato negli appunti!
          </div>
        )}
      </div>
    );
  }

  // Form per unirsi o creare partita
  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Partita Condivisa
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unisciti a partita esistente */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Unisciti a Partita Esistente</h4>
          
          {!showJoinForm ? (
            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-5 h-5 mx-auto mb-1" />
              Inserisci Codice Partita
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={matchCode}
                onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
                placeholder="Codice partita (6 cifre)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
                disabled={loading}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinMatch}
                  disabled={loading || !matchCode.trim()}
                  className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connessione...' : 'Unisciti'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setMatchCode('');
                    setError('');
                  }}
                  disabled={loading}
                  className="px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Crea nuova partita */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Crea Nuova Partita</h4>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Play className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Partita da Organizzatore</p>
                <p>Crea una partita che altri potranno seguire in tempo reale. Riceverai un codice di 6 cifre da condividere.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2">Come Funziona:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Organizzatore:</strong> Crea la partita e può registrare eventi</li>
          <li>• <strong>Spettatori:</strong> Possono seguire la partita in tempo reale</li>
          <li>• Tutti vedono punteggio, eventi e timer aggiornati automaticamente</li>
          <li>• La partita rimane attiva fino al termine deciso dall'organizzatore</li>
        </ul>
      </div>
    </div>
  );
};

export default SharedMatchManager;