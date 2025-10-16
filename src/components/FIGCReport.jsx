// components/FIGCReport.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { exportFIGCReportToPDF } from '../utils/figcExportUtils';

const FIGCReport = ({ match, onBack }) => {
  const [formData, setFormData] = useState({
    // Categoria FISSA: X1 = Esordienti 1° Anno 2014
    category: 'X1',
    
    // Dati gara
    refereeManager: match.assistantReferee || '',
    refereeSociety: 'Vigontina San Paolo',
    homeTeam: match.isHome ? 'VIGONTINA SAN PAOLO' : match.opponent,
    awayTeam: match.isHome ? match.opponent : 'VIGONTINA SAN PAOLO',
    matchDay: match.matchDay || '',
    girone: '',
    date: match.date,
    time: '15:00',
    location: 'Via A. Moro - Busa di Vigonza (PD)',
    fieldType: 'Comunale',
    
    // Valutazioni squadra ospitante (da compilare da ospitato)
    homeGreeting: 'SI',
    homeAppeal: 'SI',
    homeAllPlayed: 'SI',
    homeSubstitutions: 'SI',
    homeLineup: 'SI',
    
    // Valutazioni squadra ospitata (da compilare da ospitante)
    awayGreeting: 'SI',
    awayAppeal: 'SI',
    awayAllPlayed: 'SI',
    awaySubstitutions: 'SI',
    awayLineup: 'SI',
    
    // Note
    notes: '',
    goalsCorrect: 'SI',
    
    // Firme
    homeManagerSignature: null,
    awayManagerSignature: null,
    refereeSignature: null,
    refereePhone: ''
  });

  // Calcola punti FIGC: 1 punto per vittoria o pareggio, 0 per sconfitta
  const calculatePeriodPoints = (period, team) => {
    const v = period.vigontina;
    const o = period.opponent;
    
    // Se siamo ospitati, invertiamo i risultati
    const isHome = match.isHome;
    const homeScore = isHome ? v : o;
    const awayScore = isHome ? o : v;
    
    if (team === 'home') {
      return (homeScore >= awayScore) ? 1 : 0;
    } else {
      return (awayScore >= homeScore) ? 1 : 0;
    }
  };

  const calculateFinalScore = () => {
    // Solo i 4 tempi contano (esclusa Prova Tecnica)
    const home = match.periods
      .filter(p => p.completed && p.name !== "PROVA TECNICA")
      .reduce((sum, p) => sum + calculatePeriodPoints(p, 'home'), 0);
    
    const away = match.periods
      .filter(p => p.completed && p.name !== "PROVA TECNICA")
      .reduce((sum, p) => sum + calculatePeriodPoints(p, 'away'), 0);
    
    return { home, away };
  };

  const getPeriodResult = (period, team) => {
    return calculatePeriodPoints(period, team);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExportPDF = async () => {
    try {
      await exportFIGCReportToPDF(match, formData, calculatePeriodPoints, calculateFinalScore);
      alert('✅ PDF del Rapporto Gara generato con successo!');
    } catch (error) {
      console.error('Errore export PDF FIGC:', error);
      alert('❌ Errore durante la generazione del PDF');
    }
  };

  const finalScore = calculateFinalScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* Header compatto */}
          <button
            onClick={onBack}
            className="mb-3 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-blue-200">
                  <img
                    src={`${import.meta.env.BASE_URL}logo-lnd.png`}
                    alt="LND Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-blue-900">
                    Federazione Italiana Giuoco Calcio
                  </h1>
                  <p className="text-xs text-gray-600">Lega Nazionale Dilettanti - Del. Prov. PADOVA</p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
              <h2 className="font-bold text-sm text-blue-900">{match.competition}</h2>
              <p className="text-xs text-blue-800">ESORDIENTI 1° Anno 2014 - 9&gt;9 (sigla X1)</p>
            </div>
          </div>

          {/* Dati Dirigente Arbitro + Dati Gara in una griglia */}
          <div className="mb-3 bg-gray-50 p-3 rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Dirigente Arbitro *</label>
                <input
                  type="text"
                  value={formData.refereeManager}
                  onChange={(e) => handleInputChange('refereeManager', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Società</label>
                <input
                  type="text"
                  value={formData.refereeSociety}
                  readOnly
                  className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Giornata</label>
                <input
                  type="text"
                  value={formData.matchDay}
                  onChange={(e) => handleInputChange('matchDay', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Girone</label>
                <input
                  type="text"
                  value={formData.girone}
                  onChange={(e) => handleInputChange('girone', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ospitante</label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  readOnly
                  className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ospitata</label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  readOnly
                  className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ora</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Disputata a</label>
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Campo</label>
                <input
                  type="text"
                  value={formData.fieldType}
                  readOnly
                  className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Risultati compatti */}
          <div className="mb-3 bg-gray-50 p-3 rounded-lg border">
            <h3 className="font-semibold text-sm mb-2">Risultati (V/P = 1 pt, S = 0 pt)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border p-1">Squadra</th>
                    <th className="border p-1 bg-yellow-50 text-xs">PT</th>
                    <th className="border p-1">1°T</th>
                    <th className="border p-1">2°T</th>
                    <th className="border p-1">3°T</th>
                    <th className="border p-1">4°T</th>
                    <th className="border p-1 bg-blue-200 font-bold">FIN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-1 font-medium text-xs">Ospitante</td>
                    {match.periods.map((period, idx) => {
                      const points = getPeriodResult(period, 'home');
                      const isPT = period.name === "PROVA TECNICA";
                      return (
                        <td key={idx} className={`border p-1 text-center ${isPT ? 'bg-yellow-50' : ''}`}>
                          <div className="font-bold text-lg">{points}</div>
                        </td>
                      );
                    })}
                    <td className="border p-1 text-center font-bold bg-blue-50 text-xl">
                      {finalScore.home}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-1 font-medium text-xs">Ospitata</td>
                    {match.periods.map((period, idx) => {
                      const points = getPeriodResult(period, 'away');
                      const isPT = period.name === "PROVA TECNICA";
                      return (
                        <td key={idx} className={`border p-1 text-center ${isPT ? 'bg-yellow-50' : ''}`}>
                          <div className="font-bold text-lg">{points}</div>
                        </td>
                      );
                    })}
                    <td className="border p-1 text-center font-bold bg-blue-50 text-xl">
                      {finalScore.away}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Valutazioni compatte side by side */}
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Squadra Ospitante */}
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <h3 className="font-semibold text-xs mb-2 text-green-900">
                  OSPITANTE (compila ospitato)
                </h3>
                <div className="space-y-1">
                  {[
                    { key: 'homeGreeting', label: 'Saluto' },
                    { key: 'homeAppeal', label: 'Appello' },
                    { key: 'homeAllPlayed', label: 'Tutti giocato' },
                    { key: 'homeSubstitutions', label: 'Sostituzioni' },
                    { key: 'homeLineup', label: 'Distinta' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                      <span>{item.label}</span>
                      <div className="flex gap-2">
                        {['SI', 'NO'].map(option => (
                          <label key={option} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              checked={formData[item.key] === option}
                              onChange={() => handleInputChange(item.key, option)}
                              className="w-3 h-3"
                            />
                            <span className="text-xs">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Squadra Ospitata */}
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <h3 className="font-semibold text-xs mb-2 text-blue-900">
                  OSPITATA (compila ospitante)
                </h3>
                <div className="space-y-1">
                  {[
                    { key: 'awayGreeting', label: 'Saluto' },
                    { key: 'awayAppeal', label: 'Appello' },
                    { key: 'awayAllPlayed', label: 'Tutti giocato' },
                    { key: 'awaySubstitutions', label: 'Sostituzioni' },
                    { key: 'awayLineup', label: 'Distinta' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                      <span>{item.label}</span>
                      <div className="flex gap-2">
                        {['SI', 'NO'].map(option => (
                          <label key={option} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              checked={formData[item.key] === option}
                              onChange={() => handleInputChange(item.key, option)}
                              className="w-3 h-3"
                            />
                            <span className="text-xs">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Misura porte PRIMA delle note */}
          <div className="mb-3 bg-gray-50 p-2 rounded border">
            <label className="flex items-center justify-between text-xs">
              <span className="font-medium">MISURA PORTE: 6,00 m. x 2,00</span>
              <div className="flex gap-3">
                {['SI', 'NO'].map(option => (
                  <label key={option} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.goalsCorrect === option}
                      onChange={() => handleInputChange('goalsCorrect', option)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">{option}</span>
                  </label>
                ))}
              </div>
            </label>
          </div>

          {/* Note */}
          <div className="mb-3 bg-gray-50 p-2 rounded border">
            <label className="block text-xs font-medium mb-1">NOTE</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border rounded px-2 py-1 h-16 text-xs"
              placeholder="Infortuni, ammonizioni, espulsioni..."
            />
          </div>

          {/* Firme più grandi per facilitare firma con dito */}
          <div className="mb-3">
            <h3 className="font-semibold text-sm mb-2">Firme Digitali (usa il dito o il mouse)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <SignatureBox
                label="Firma Dirigente OSPITANTE"
                signature={formData.homeManagerSignature}
                onSave={(sig) => handleInputChange('homeManagerSignature', sig)}
                height={120}
              />
              <SignatureBox
                label="Firma Dirigente OSPITATO"
                signature={formData.awayManagerSignature}
                onSave={(sig) => handleInputChange('awayManagerSignature', sig)}
                height={120}
              />
            </div>
            
            {/* Arbitro: cellulare e firma affiancati */}
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <h4 className="font-semibold text-sm mb-2">Dirigente Arbitro</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Cellulare reperibile
                  </label>
                  <input
                    type="tel"
                    value={formData.refereePhone}
                    onChange={(e) => handleInputChange('refereePhone', e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="340 1234567"
                  />
                </div>
                <SignatureBox
                  label="Firma Arbitro"
                  signature={formData.refereeSignature}
                  onSave={(sig) => handleInputChange('refereeSignature', sig)}
                  height={120}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Footer compatto */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs mb-3">
            <p className="font-semibold text-xs">📤 Invio: PADOVA.REFERTIBASE@LND.IT (PDF unico, entro venerdì)</p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleExportPDF}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium"
          >
            <Download className="w-5 h-5" />
            Genera PDF Firmato
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente SignatureBox più grande per firmare con il dito
const SignatureBox = ({ label, signature, onSave, height = 120, compact = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (signature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = signature;
    }
  }, [signature]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3; // Linea più spessa per vedere meglio
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSignature) {
      const canvas = canvasRef.current;
      onSave(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave(null);
  };

  return (
    <div>
      {!compact && <label className="block text-xs font-medium mb-1">{label}</label>}
      {compact && <label className="block text-xs font-medium mb-1">{label}</label>}
      <div className="border-2 border-gray-400 rounded overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={height}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {hasSignature && (
        <button
          onClick={clearSignature}
          className="mt-1 text-xs text-red-600 hover:text-red-800 font-medium"
        >
          🗑️ Cancella firma
        </button>
      )}
    </div>
  );
};

export default FIGCReport;