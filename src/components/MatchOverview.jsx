// components/MatchOverview.jsx (aggiornato con pulsante FIGC)
import React from "react";
import { ArrowLeft, Save, Download, FileText, ClipboardCheck } from "lucide-react";
import { calculatePoints, calculateTotalGoals } from "../utils/matchUtils";

const MatchOverview = ({
  match,
  onStartPeriod,
  onViewPeriod,
  onSave,
  onExportExcel,
  onExportPDF,
  onSummary,
  onFIGCReport,
  isTimerRunning,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Abbandona Partita
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">
              Vigontina vs {match.opponent}
            </h2>
            {isTimerRunning && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {match.isHome ? "🏠 Casa" : "✈️ Trasferta"}
          </p>
          
          <p className="text-sm text-gray-600 mb-4">
            {match.competition}
            {match.matchDay && ` - Giornata ${match.matchDay}`}
            {" • "}
            {new Date(match.date).toLocaleDateString("it-IT")}
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">Risultato Attuale</p>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Punti</p>
                  <p className="text-4xl font-bold text-green-700">
                    {calculatePoints(match, "vigontina")}
                  </p>
                </div>
                <span className="text-2xl">-</span>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Punti</p>
                  <p className="text-4xl font-bold text-green-700">
                    {calculatePoints(match, "opponent")}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Gol: {calculateTotalGoals(match, "vigontina")} -{" "}
                {calculateTotalGoals(match, "opponent")}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {match.periods.map((period, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  period.completed ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{period.name}</h3>
                    <p className="text-sm text-gray-600">
                      {period.vigontina} - {period.opponent}
                      {period.goals &&
                        period.goals.length > 0 &&
                        ` (${period.goals.length} eventi)`}
                    </p>
                  </div>
                  {!period.completed ? (
                    <button
                      onClick={() => onStartPeriod(idx)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      {period.name === "PROVA TECNICA" ? "Inizia" : "Gioca"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewPeriod(idx)}
                      className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 flex items-center gap-1 text-sm"
                    >
                      <FileText className="w-3 h-3" />
                      Dettagli
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* NUOVO: Pulsante Rapporto FIGC */}
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Rapporto Gara FIGC
                </h3>
                <p className="text-xs text-blue-800 mb-3">
                  Compila il rapporto gara ufficiale da inviare alla Delegazione Provinciale di Padova
                </p>
                <button
                  onClick={onFIGCReport}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Compila Rapporto FIGC
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onSummary}
              className="bg-purple-500 text-white py-2 rounded hover:bg-purple-600 flex items-center justify-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Riepilogo
            </button>
            <button
              onClick={onExportExcel}
              className="bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
          
          <button
            onClick={onExportPDF}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>

          <button
            onClick={onSave}
            className="w-full mt-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 font-medium flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            Termina e Salva Partita
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchOverview;