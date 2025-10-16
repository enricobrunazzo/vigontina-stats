// components/LiveDashboard.jsx
import React from 'react';
import { Eye, Shield } from 'lucide-react';

const LiveDashboard = ({ match, lastEvent, onManage }) => {
  if (!match) return null;
  const score = {
    vigontina: match.periods?.reduce((a,p)=>a+(p?.vigontina||0),0) || 0,
    opponent: match.periods?.reduce((a,p)=>a+(p?.opponent||0),0) || 0,
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 border mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          <span className="text-red-700 font-semibold">LIVE</span>
        </div>
        <button onClick={onManage} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
          <Shield className="w-4 h-4" /> Gestisci Partita
        </button>
      </div>
      <div className="text-center py-2">
        <div className="text-sm text-gray-600 mb-1">{match.isHome ? '🏠 Casa' : '✈️ Trasferta'} • {new Date(match.date).toLocaleDateString('it-IT')}</div>
        <div className="text-xl font-semibold">Vigontina vs {match.opponent}</div>
        <div className="text-4xl font-bold mt-1">{score.vigontina} - {score.opponent}</div>
      </div>
      {lastEvent && (
        <div className="mt-3 bg-gray-50 border rounded p-3 text-sm">
          <div className="text-gray-700 font-medium mb-1">Ultimo evento</div>
          <div className="text-gray-800">{lastEvent}</div>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;
