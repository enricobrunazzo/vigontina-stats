// components/LiveDashboard.jsx (simplified resume flow)
import React, { useState, useMemo } from 'react';
import { Play, Link as LinkIcon, Check, Clock } from 'lucide-react';

const LiveDashboard = ({ match, lastEvent, onManage }) => {
  const [copied, setCopied] = useState(false);
  if (!match) return null;

  const score = useMemo(() => ({
    vigontina: match.periods?.reduce((a,p)=>a+(p?.vigontina||0),0) || 0,
    opponent: match.periods?.reduce((a,p)=>a+(p?.opponent||0),0) || 0,
  }), [match.periods]);

  const shareUrl = `${window.location.origin}?match=${match.id || ''}`;
  const copyLink = async () => {
    try { 
      await navigator.clipboard.writeText(shareUrl); 
      setCopied(true); 
      setTimeout(()=>setCopied(false), 2000); 
    } catch { 
      const ta=document.createElement('textarea'); 
      ta.value=shareUrl; 
      document.body.appendChild(ta); 
      ta.select(); 
      document.execCommand('copy'); 
      document.body.removeChild(ta); 
      setCopied(true); 
      setTimeout(()=>setCopied(false), 2000); 
    }
  };

  const events = useMemo(() => {
    const list = match?.realtime?.events ? Object.values(match.realtime.events) : [];
    // Map to displayable text; assume event.text exists
    return list
      .sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      .slice(-5);
  }, [match?.realtime?.events]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-red-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
          <span className="text-red-700 font-bold text-lg">PARTITA IN CORSO</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={copyLink} 
            className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-gray-50" 
            title="Copia link live"
          >
            {copied ? <Check className="w-3 h-3 text-green-600"/> : <LinkIcon className="w-3 h-3"/>}
            {copied ? 'Copiato' : 'Link'}
          </button>
        </div>
      </div>
      
      <div className="text-center py-3">
        <div className="text-sm text-gray-600 mb-2">
          {match.isHome ? '🏠 Casa' : '✈️ Trasferta'} • {new Date(match.date).toLocaleDateString('it-IT')}
        </div>
        <div className="text-xl font-semibold mb-2">Vigontina vs {match.opponent}</div>
        <div className="text-5xl font-bold text-blue-600 mb-3">
          {score.vigontina} - {score.opponent}
        </div>
        
        {/* Resume button - main action */}
        <button 
          onClick={onManage} 
          className="flex items-center gap-2 mx-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
        >
          <Play className="w-5 h-5" /> Riprendi Partita
        </button>
      </div>

      {/* Last Events */}
      {events.length > 0 && (
        <div className="mt-4 bg-gray-50 border rounded-lg p-3 text-sm">
          <div className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4"/>Ultimi eventi
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {events.map((ev, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-800 text-xs">{ev.text || lastEvent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback single last event */}
      {!events.length && lastEvent && (
        <div className="mt-4 bg-gray-50 border rounded-lg p-3 text-sm">
          <div className="text-gray-700 font-medium mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4"/>Ultimo evento
          </div>
          <div className="text-gray-800 text-sm">{lastEvent}</div>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;