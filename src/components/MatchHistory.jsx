// components/MatchHistory.jsx
import React from "react";
import { ArrowLeft, Download, FileText, FileSpreadsheet } from "lucide-react";
import { calculatePoints } from "../utils/matchUtils";

const MatchHistory = ({
  matches,
  onBack,
  onViewStats,
  onExportExcel,
  onExportPDF,
  onDelete,
  onExportHistory,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>
          
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-2xl font-bold">Storico Partite</h2>
            
            {/* PULSANTE EXPORT STORICO - discreto ma visibile */}
            {matches.length > 0 && (
              <button
                onClick={onExportHistory}
                className="text-xs px-3 py-1 rounded bg-green-500 text-white border border-green-500 hover:bg-green-600 flex items-center gap-1 shadow-sm"
                title="Esporta tutto lo storico in Excel"
              >
                <FileSpreadsheet className="w-3 h-3" />
                Esporta Storico
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 text-gray-400">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">
                Nessuna partita salvata
              </p>
              <p className="text-gray-500 text-sm">
                Le partite completate appariranno qui
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-semibold">{matches.length}</span> partite totali
              </div>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onViewStats={() => onViewStats(match)}
                    onExportExcel={() => onExportExcel(match)}
                    onExportPDF={() => onExportPDF(match)}
                    onDelete={() => onDelete(match.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Match Card Component
const MatchCard = ({
  match,
  onViewStats,
  onExportExcel,
  onExportPDF,
  onDelete,
}) => {
  // Calcolo live dei punti secondo la nuova logica
  const vigontinaPoints = calculatePoints(match, "vigontina");
  const opponentPoints = calculatePoints(match, "opponent");
  const isWin = vigontinaPoints > opponentPoints;
  const isLoss = vigontinaPoints < opponentPoints;
  
  const bgColor = isWin
    ? "bg-green-50"
    : isLoss
      ? "bg-red-50"
      : "bg-yellow-50";
  
  const resultText = isWin ? "VINTA" : isLoss ? "PERSA" : "PAREGGIO";
  
  const resultColor = isWin
    ? "text-green-700"
    : isLoss
      ? "text-red-700"
      : "text-yellow-700";

  return (
    <div className={`border rounded-lg p-4 relative ${bgColor} hover:shadow-md transition-shadow`}>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
        title="Elimina partita"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="pr-8">
        {/* Titolo */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">
            Vigontina vs {match.opponent}
          </h3>
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${resultColor} bg-opacity-20`}
          >
            {resultText}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{match.isHome ? "🏠" : "✈️"}</span>
            <span>{match.competition}</span>
            {match.matchDay && (
              <>
                <span>•</span>
                <span>Giornata {match.matchDay}</span>
              </>
            )}
            <span>•</span>
            <span>
              {new Date(match.date).toLocaleDateString("it-IT")}
            </span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">
              {vigontinaPoints} - {opponentPoints}
            </p>
          </div>
        </div>
      </div>

      {/* Riga azioni: Dettagli + Excel + PDF a fianco */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onViewStats}
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-xs font-medium"
          title="Apri riepilogo partita"
        >
          <FileText className="w-3 h-3" />
          Dettagli
        </button>
        <button
          onClick={onExportExcel}
          className="bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 text-xs font-medium"
          title="Esporta Excel"
        >
          <Download className="w-3 h-3" />
          Excel
        </button>
        <button
          onClick={onExportPDF}
          className="bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2 text-xs font-medium"
          title="Esporta PDF"
        >
          <Download className="w-3 h-3" />
          PDF
        </button>
      </div>
    </div>
  );
};

export default MatchHistory;
