// components/LiveDashboard.jsx (render a list of recent events)
import React, { useState, useMemo } from 'react';
import { Eye, Shield, Link as LinkIcon, Check, Clock } from 'lucide-react';

const LiveDashboard = ({ match, lastEvent, onManage }) => {
  const [copied, setCopied] = useState(false);
  if (!match) return null;

  const score = useMemo(() => ({
    vigontina: match.periods?.reduce((a,p)=>a+(p?.vigontina||0),0) || 0,
    opponent: match.periods?.reduce((a,p)=>a+(p?.opponent||0),0) || 0,
  }), [match.periods]);

  const shareUrl = `${window.location.origin}?match=${match.id || ''}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false), 2000); }
    catch { const ta=document.createElement('textarea'); ta.value=shareUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); setCopied(true); setTimeout(()=>setCopied(false), 2000); }
  };

  const events = useMemo(() => {
    const list = match?.realtime?.events ? Object.values(match.realtime.events) : [];
    // Map to displayable text; assume event.text exists
    return list
      .sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      .slice(-5);
  }, [match?.realtime?.events]);

  return (
    <div className="bg-white rounded-lg shadow p-4 border mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          <span className="text-red-700 font-semibold">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="flex items-center gap-1 text-sm px-3 py-1.5 border rounded hover:bg-gray-50" title="Copia link live">
            {copied ? <Check className="w-4 h-4 text-green-600"/> : <LinkIcon className="w-4 h-4"/>}
            {copied ? 'Copiato' : 'Copia link'}
          </button>
          <button onClick={onManage} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
            <Shield className="w-4 h-4" /> Gestisci Partita
          </button>
        </div>
      </div>
      <div className="text-center py-2">
        <div className="text-sm text-gray-600 mb-1">{match.isHome ? '🏠 Casa' : '✈️ Trasferta'} • {new Date(match.date).toLocaleDateString('it-IT')}</div>
        <div className="text-xl font-semibold">Vigontina vs {match.opponent}</div>
        <div className="text-4xl font-bold mt-1">{score.vigontina} - {score.opponent}</div>
      </div>

      {/* Last Events */}
      {events.length > 0 && (
        <div className="mt-3 bg-gray-50 border rounded p-3 text-sm">
          <div className="text-gray-700 font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/>Ultimi eventi</div>
          <div className="space-y-1">
            {events.map((ev, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span className="text-gray-800">{ev.text || lastEvent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback single last event */}
      {!events.length && lastEvent && (
        <div className="mt-3 bg-gray-50 border rounded p-3 text-sm">
          <div className="text-gray-700 font-medium mb-1">Ultimo evento</div>
          <div className="text-gray-800">{lastEvent}</div>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;
