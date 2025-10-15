// components/FIGCReportForm.jsx
import React, { useState } from "react";
import { X, FileText } from "lucide-react";

const FIGCReportForm = ({ match, onClose, onGenerate }) => {
  // Dati arbitro
  const [refereeName, setRefereeName] = useState("");
  const [refereeClub, setRefereeClub] = useState("");
  const [refereePhone, setRefereePhone] = useState("");

  // Dati gara
  const [category, setCategory] = useState("ESORDIENTI 1° Anno 2014 - 9>9 (sigla X1)");
  const [girone, setGirone] = useState("");
  const [location, setLocation] = useState("");
  const [fieldType, setFieldType] = useState("Comunale");

  // Checklist Squadra Ospitante (compilata da ospitato)
  const [homeGreeting, setHomeGreeting] = useState(true);
  const [homeRollCall, setHomeRollCall] = useState(true);
  const [homeAllPlayed, setHomeAllPlayed] = useState(true);
  const [homeSubstitutions, setHomeSubstitutions] = useState(true);
  const [homeRoster, setHomeRoster] = useState(true);

  // Checklist Squadra Ospitata (compilata da ospitante)
  const [awayGreeting, setAwayGreeting] = useState(true);
  const [awayRollCall, setAwayRollCall] = useState(true);
  const [awayAllPlayed, setAwayAllPlayed] = useState(true);
  const [awaySubstitutions, setAwaySubstitutions] = useState(true);
  const [awayRoster, setAwayRoster] = useState(true);

  // Note e altro
  const [notes, setNotes] = useState("");
  const [correctGoals, setCorrectGoals] = useState(true);

  const handleGenerate = () => {
    const figcData = {
      // Dati arbitro
      refereeName,
      refereeClub,
      refereePhone,

      // Dati gara
      category,
      girone,
      location,
      fieldType,

      // Checklist ospitante
      homeChecklist: {
        greeting: homeGreeting,
        rollCall: homeRollCall,
        allPlayed: homeAllPlayed,
        substitutions: homeSubstitutions,
        roster: homeRoster,
      },

      // Checklist ospitata
      awayChecklist: {
        greeting: awayGreeting,
        rollCall: awayRollCall,
        allPlayed: awayAllPlayed,
        substitutions: awaySubstitutions,
        roster: awayRoster,
      },

      // Note
      notes,
      correctGoals,
    };

    onGenerate(figcData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl my-8">
        <div className="sticky top-0 bg-white border-b p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Rapporto Gara FIGC</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Info Partita (readonly) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Informazioni Partita</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Ospitante:</span>{" "}
                <span className="font-medium">Vigontina San Paolo</span>
              </div>
              <div>
                <span className="text-gray-600">Ospitata:</span>{" "}
                <span className="font-medium">{match.opponent}</span>
              </div>
              <div>
                <span className="text-gray-600">Data:</span>{" "}
                <span className="font-medium">
                  {new Date(match.date).toLocaleDateString("it-IT")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Competizione:</span>{" "}
                <span className="font-medium">{match.competition}</span>
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Categoria *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option>ESORDIENTI 2° Anno 2013 - 9&gt;9 (sigla F/)</option>
              <option>ESORDIENTI 1° Anno 2014 - 9&gt;9 (sigla X1)</option>
              <option>ESORDIENTI MISTI 2013/14 - 9&gt;9 (sigla Y2)</option>
            </select>
          </div>

          {/* Dati Arbitro */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Dirigente Arbitro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome e Cognome *
                </label>
                <input
                  type="text"
                  value={refereeName}
                  onChange={(e) => setRefereeName(e.target.value)}
                  placeholder="Es: Mario Rossi"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Società *
                </label>
                <input
                  type="text"
                  value={refereeClub}
                  onChange={(e) => setRefereeClub(e.target.value)}
                  placeholder="Es: ASD Vigontina"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cellulare
                </label>
                <input
                  type="tel"
                  value={refereePhone}
                  onChange={(e) => setRefereePhone(e.target.value)}
                  placeholder="Es: 333 1234567"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Dati Campo */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Dettagli Campo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Girone
                </label>
                <input
                  type="text"
                  value={girone}
                  onChange={(e) => setGirone(e.target.value)}
                  placeholder="Es: A"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Luogo
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Es: Vigonza"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo Campo *
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option>Parrocchiale</option>
                  <option>Comunale</option>
                  <option>Privato</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checklist Ospitante */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Squadra Ospitante (Vigontina San Paolo)
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Da compilare a cura del DIRIGENTE OSPITATO
            </p>
            <div className="space-y-2">
              <CheckboxField
                label="Saluto Inizio e Fine Gara"
                checked={homeGreeting}
                onChange={setHomeGreeting}
              />
              <CheckboxField
                label="Appello prima della gara"
                checked={homeRollCall}
                onChange={setHomeRollCall}
              />
              <CheckboxField
                label="Tutti i giocatori hanno partecipato"
                checked={homeAllPlayed}
                onChange={setHomeAllPlayed}
              />
              <CheckboxField
                label="Sostituzioni Regolari"
                checked={homeSubstitutions}
                onChange={setHomeSubstitutions}
              />
              <CheckboxField
                label="Distinta Giocatori Regolare"
                checked={homeRoster}
                onChange={setHomeRoster}
              />
            </div>
          </div>

          {/* Checklist Ospitata */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Squadra Ospitata ({match.opponent})
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Da compilare a cura del DIRIGENTE OSPITANTE
            </p>
            <div className="space-y-2">
              <CheckboxField
                label="Saluto Inizio e Fine Gara"
                checked={awayGreeting}
                onChange={setAwayGreeting}
              />
              <CheckboxField
                label="Appello prima della gara"
                checked={awayRollCall}
                onChange={setAwayRollCall}
              />
              <CheckboxField
                label="Tutti i giocatori hanno partecipato"
                checked={awayAllPlayed}
                onChange={setAwayAllPlayed}
              />
              <CheckboxField
                label="Sostituzioni Regolari"
                checked={awaySubstitutions}
                onChange={setAwaySubstitutions}
              />
              <CheckboxField
                label="Distinta Giocatori Regolare"
                checked={awayRoster}
                onChange={setAwayRoster}
              />
            </div>
          </div>

          {/* Misura Porte */}
          <div className="border-t pt-4">
            <CheckboxField
              label="MISURA DELLE PORTE: 6,00 m. x 2,00"
              checked={correctGoals}
              onChange={setCorrectGoals}
            />
          </div>

          {/* Note */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Note (Facoltative)
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Infortuni ai giocatori, mancata disputa della gara, comportamento
              pubblico e tesserati, giocatori ammoniti o espulsi, ecc.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inserisci eventuali note..."
              rows={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 rounded-b-lg flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Annulla
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Genera Rapporto PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const CheckboxField = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};

export default FIGCReportForm;