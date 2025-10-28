// components/ProvaTecnicaPanel.jsx
import React from "react";
import { Plus, Minus } from "lucide-react";

const ScoreBox = ({ leftLabel, rightLabel, leftScore, rightScore }) => (
  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-4">
    <h4 className="text-center text-sm text-gray-700 font-semibold mb-3">Punteggio Prova Tecnica</h4>
    <div className="grid grid-cols-3 items-center text-center">
      <div>
        <p className="text-xs text-gray-600 mb-1">{leftLabel}</p>
        <p className="text-4xl font-bold text-emerald-700">{leftScore}</p>
      </div>
      <div className="text-2xl font-bold text-gray-500">-</div>
      <div>
        <p className="text-xs text-gray-600 mb-1">{rightLabel}</p>
        <p className="text-4xl font-bold text-emerald-700">{rightScore}</p>
      </div>
    </div>
  </div>
);

const Row = ({ label, minusDisabled, onMinus, onPlus }) => (
  <div className="grid grid-cols-[52px_1fr_52px] gap-3 mb-3">
    <button
      onClick={onMinus}
      disabled={minusDisabled}
      className={`h-12 rounded-lg text-white text-lg font-bold shadow-sm transition ${minusDisabled ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
      aria-label="Diminuisci punteggio"
      title="- 1 punto"
    >
      <Minus className="w-5 h-5 mx-auto" />
    </button>
    <div className="h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 font-medium">
      {label}
    </div>
    <button
      onClick={onPlus}
      className="h-12 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold shadow-sm transition"
      aria-label="Aumenta punteggio"
      title="+ 1 punto"
    >
      <Plus className="w-5 h-5 mx-auto" />
    </button>
  </div>
);

const Info = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center mb-4">
    <p className="text-sm text-gray-700">
      <span className="font-semibold">Prova Tecnica:</span> Inserisci i punti manualmente. Il risultato non influisce nel punteggio finale della gara.
    </p>
  </div>
);

const ProvaTecnicaPanel = ({
  opponentName,
  vigScore,
  oppScore,
  onVigMinus,
  onVigPlus,
  onOppMinus,
  onOppPlus,
  onFinish,
}) => {
  return (
    <div>
      <ScoreBox
        leftLabel="Vigontina"
        rightLabel={opponentName || "Avversario"}
        leftScore={vigScore}
        rightScore={oppScore}
      />
      <Info />
      <Row
        label="Punti Vigontina"
        minusDisabled={(vigScore || 0) <= 0}
        onMinus={onVigMinus}
        onPlus={onVigPlus}
      />
      <Row
        label={`Punti ${opponentName || "Avversario"}`}
        minusDisabled={(oppScore || 0) <= 0}
        onMinus={onOppMinus}
        onPlus={onOppPlus}
      />
      <button
        onClick={onFinish}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
      >
        Termina Prova Tecnica
      </button>
    </div>
  );
};

export default ProvaTecnicaPanel;
