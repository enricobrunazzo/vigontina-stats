// components/LiveBanner.jsx
import React from 'react';
import { Radio, Eye } from 'lucide-react';

const LiveBanner = ({ matchId, onOpen }) => {
  if (!matchId) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-700 font-semibold">LIVE</span>
        <span className="text-sm text-gray-700">Partita condivisa attiva — codice</span>
        <code className="bg-white border px-2 py-0.5 rounded text-sm font-mono">{matchId}</code>
      </div>
      <button onClick={onOpen} className="flex items-center gap-1 text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700">
        <Eye className="w-4 h-4"/>
        Apri live
      </button>
    </div>
  );
};

export default LiveBanner;