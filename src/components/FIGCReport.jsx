// components/FIGCReport.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { exportFIGCReportToPDF } from '../utils/figcExportUtils';

const FIGCReport = ({ match, onBack }) => {
  const [formData, setFormData] = useState({
    // Categoria
    category: 'Y2', // F slash = 2013, X1 = 2014, Y2 = MISTI
    
    // Dati gara
    refereeManager: match.assistantReferee || '',
    refereeSociety: '',
    homeTeam: match.isHome ? 'VIGONTINA SAN PAOLO' : match.opponent,
    awayTeam: match.isHome ? match.opponent : 'VIGONTINA SAN PAOLO',
    matchDay: match.matchDay || '',
    girone: '',
    date: match.date,
    time: '15:00',
    location: '',
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-blue-200">
                  <img
                    src={`${import.meta.env.BASE_URL}logo-vigontina.png`}
                    alt="FIGC Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-900">
                    Federazione Italiana Giuoco Calcio
                  </h1>
                  <p className="text-sm text-gray-600">Lega Nazionale Dilettanti</p>
                  <p className="text-sm font-semibold text-blue-800">
                    DELEGAZIONE PROVINCIALE DI PADOVA
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Genera PDF
              </button>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
              <h2 className="font-bold text-blue-900">
                {match.competition}
              </h2>
              <p className="text-sm text-blue-800">Categoria ESORDIENTI</p>
            </div>
          </div>

          {/* Categoria Selection */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Seleziona Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { value: 'F/', label: 'ESORDIENTI 2° Anno 2013 - 9>9' },
                { value: 'X1', label: 'ESORDIENTI 1° Anno 2014 - 9>9' },
                { value: 'Y2', label: 'ESORDIENTI MISTI 2013/14 - 9>9' }
              ].map(cat => (
                <label
                  key={cat.value}
                  className={`flex items-center gap-2 p-3 border rounded cursor-pointer ${
                    formData.category === cat.value
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.category === cat.value}
                    onChange={() => handleInputChange('category', cat.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dati Dirigente Arbitro */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Dirigente Arbitro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome Dirigente Arbitro *
                </label>
                <input
                  type="text"
                  value={formData.refereeManager}
                  onChange={(e) => handleInputChange('refereeManager', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Es: Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Società
                </label>
                <input
                  type="text"
                  value={formData.refereeSociety}
                  onChange={(e) => handleInputChange('refereeSociety', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Es: ASD Esempio"
                />
              </div>
            </div>
          </div>

          {/* Dati Gara */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Dettagli Gara</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Squadra Ospitante *
                </label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Squadra Ospitata *
                </label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giornata
                </label>
                <input
                  type="text"
                  value={formData.matchDay}
                  onChange={(e) => handleInputChange('matchDay', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Girone
                </label>
                <input
                  type="text"
                  value={formData.girone}
                  onChange={(e) => handleInputChange('girone', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Es: A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ora *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Luogo *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Es: Campo Sportivo Comunale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo Campo *
                </label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => handleInputChange('fieldType', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Parrocchiale">Parrocchiale</option>
                  <option value="Comunale">Comunale</option>
                  <option value="Privato">Privato</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risultati */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Risultati per Tempo</h3>
            <p className="text-xs text-gray-600 mb-3">
              📊 <strong>Sistema FIGC:</strong> Vittoria o Pareggio = 1 punto, Sconfitta = 0 punti<br/>
              ⚠️ La Prova Tecnica viene refertata ma NON incide sul risultato finale
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border p-2 text-left">Squadra</th>
                    <th className="border p-2 text-center bg-yellow-50">
                      Prova Tecnica
                      <div className="text-xs font-normal text-gray-600">(non conta)</div>
                    </th>
                    <th className="border p-2 text-center">1° Tempo</th>
                    <th className="border p-2 text-center">2° Tempo</th>
                    <th className="border p-2 text-center">3° Tempo</th>
                    <th className="border p-2 text-center">4° Tempo</th>
                    <th className="border p-2 text-center bg-blue-200">FINALE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium">Ospitante</td>
                    {match.periods.map((period, idx) => {
                      const points = getPeriodResult(period, 'home');
                      const isPT = period.name === "PROVA TECNICA";
                      return (
                        <td key={idx} className={`border p-2 text-center ${isPT ? 'bg-yellow-50' : ''}`}>
                          <div className="font-bold text-2xl">{points}</div>
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center font-bold bg-blue-50 text-3xl">
                      {finalScore.home}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Ospitata</td>
                    {match.periods.map((period, idx) => {
                      const points = getPeriodResult(period, 'away');
                      const isPT = period.name === "PROVA TECNICA";
                      return (
                        <td key={idx} className={`border p-2 text-center ${isPT ? 'bg-yellow-50' : ''}`}>
                          <div className="font-bold text-2xl">{points}</div>
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center font-bold bg-blue-50 text-3xl">
                      {finalScore.away}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-2 rounded">
              💡 <strong>Esempio:</strong> Se il 1° tempo finisce 2-2 (pareggio), entrambe le squadre ottengono 1 punto. 
              Se finisce 3-1 per l'Ospitante, Ospitante prende 1 punto e Ospitata 0 punti.
            </div>
          </div>

          {/* Valutazioni */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Squadra Ospitante */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 text-green-900">
                  SQUADRA OSPITANTE
                  <br />
                  <span className="text-xs font-normal">
                    (Da compilare a cura del DIRIGENTE OSPITATO)
                  </span>
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'homeGreeting', label: 'Saluto Inizio e Fine Gara' },
                    { key: 'homeAppeal', label: 'Appello prima della gara' },
                    { key: 'homeAllPlayed', label: 'Tutti i giocatori hanno partecipato' },
                    { key: 'homeSubstitutions', label: 'Sostituzioni Regolari' },
                    { key: 'homeLineup', label: 'Distinta Giocatori Regolare' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <div className="flex gap-2">
                        {['SI', 'NO'].map(option => (
                          <label key={option} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              checked={formData[item.key] === option}
                              onChange={() => handleInputChange(item.key, option)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Squadra Ospitata */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">
                  SQUADRA OSPITATA
                  <br />
                  <span className="text-xs font-normal">
                    (Da compilare a cura DEL DIRIGENTE OSPITANTE)
                  </span>
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'awayGreeting', label: 'Saluto Inizio e Fine Gara' },
                    { key: 'awayAppeal', label: 'Appello prima della gara' },
                    { key: 'awayAllPlayed', label: 'Tutti i giocatori hanno partecipato' },
                    { key: 'awaySubstitutions', label: 'Sostituzioni Regolari' },
                    { key: 'awayLineup', label: 'Distinta Giocatori Regolare' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <div className="flex gap-2">
                        {['SI', 'NO'].map(option => (
                          <label key={option} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              checked={formData[item.key] === option}
                              onChange={() => handleInputChange(item.key, option)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">NOTE</h3>
            <p className="text-xs text-gray-600 mb-2">
              Infortuni ai giocatori, mancata disputa della gara, comportamento pubblico e tesserati, 
              GIOCATORI ammoniti o espulsi (indicare minuto, cognome nome, n. maglia, società, motivazione), ecc.
            </p>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="Inserisci eventuali note..."
            />
            
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium">MISURA DELLE PORTE: 6,00 m. x 2,00</span>
                <div className="flex gap-3 ml-auto">
                  {['SI', 'NO'].map(option => (
                    <label key={option} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.goalsCorrect === option}
                        onChange={() => handleInputChange('goalsCorrect', option)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </label>
            </div>
          </div>

          {/* Firme */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Firme Digitali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <SignatureBox
                label="Firma Dirigente OSPITANTE"
                signature={formData.homeManagerSignature}
                onSave={(sig) => handleInputChange('homeManagerSignature', sig)}
              />
              <SignatureBox
                label="Firma Dirigente OSPITATO"
                signature={formData.awayManagerSignature}
                onSave={(sig) => handleInputChange('awayManagerSignature', sig)}
              />
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold mb-3">Dirigente Arbitro</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cellulare reperibile
                  </label>
                  <input
                    type="tel"
                    value={formData.refereePhone}
                    onChange={(e) => handleInputChange('refereePhone', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Es: 340 1234567"
                  />
                </div>
              </div>
              <SignatureBox
                label="Firma Arbitro"
                signature={formData.refereeSignature}
                onSave={(sig) => handleInputChange('refereeSignature', sig)}
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm mb-6">
            <p className="font-semibold mb-2">📤 Invio Rapporto</p>
            <p className="text-gray-700">
              Il Rapporto Gara, assieme alle distinte delle squadre, dovrà pervenire alla 
              Delegazione di Padova esclusivamente tramite scansione{' '}
              <strong>IN UN UNICO FILE PDF (NO FOTO)</strong> all'indirizzo email{' '}
              <strong className="text-blue-700">PADOVA.REFERTIBASE@LND.IT</strong>{' '}
              entro il venerdì successivo alla disputa della gara.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium"
            >
              <Download className="w-5 h-5" />
              Genera PDF Firmato
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente SignatureBox con canvas per firma touch/mouse
const SignatureBox = ({ label, signature, onSave }) => {
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
    ctx.lineWidth = 2;
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
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={300}
          height={150}
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
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Cancella firma
        </button>
      )}
    </div>
  );
};

export default FIGCReport;