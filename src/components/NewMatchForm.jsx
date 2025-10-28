// components/NewMatchForm.jsx (fix: campo manager mappato correttamente)
import React, { useState, useMemo } from "react";
import { ArrowLeft, Users, X, Lock } from "lucide-react";
import { PLAYERS } from "../constants/players";

const NewMatchForm = ({ onSubmit, onCancel, requestPassword = false }) => {
  const [competition, setCompetition] = useState("Torneo Provinciale Autunnale");
  const [matchDay, setMatchDay] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [organizerPassword, setOrganizerPassword] = useState("");

  // Staff
  const [assistantReferee, setAssistantReferee] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [coach, setCoach] = useState("Gianmaria Tonolo");

  // Giocatori
  const [notCalled, setNotCalled] = useState([]);
  const [captain, setCaptain] = useState(null);

  // Picker states
  const [showNotCalledPicker, setShowNotCalledPicker] = useState(false);
  const [showCaptainPicker, setShowCaptainPicker] = useState(false);

  const availableForCaptain = useMemo(
    () => PLAYERS.filter((p) => !notCalled.includes(p.num)),
    [notCalled]
  );

  const toggleNotCalled = (num) => {
    setNotCalled((prev) => {
      const exists = prev.includes(num);
      const next = exists ? prev.filter((n) => n !== num) : [...prev, num];
      if (next.includes(captain)) setCaptain(null);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!opponent.trim()) {
      alert("Inserisci il nome dell'avversario");
      return;
    }
    if (!captain) {
      alert("Seleziona il capitano");
      return;
    }
    if (requestPassword && !organizerPassword.trim()) {
      alert("Inserisci la password organizzatore per creare la partita");
      return;
    }
    
    const captainPlayer = PLAYERS.find(p => p.num === captain);
    
    onSubmit({
      competition,
      matchDay: competition.includes("Torneo") ? matchDay : null,
      isHome,
      opponent,
      date,
      assistantReferee,
      manager: teamManager,
      coach,
      notCalled,
      captain: captainPlayer ? { num: captainPlayer.num, number: captainPlayer.num, name: captainPlayer.name } : null,
    }, organizerPassword);
  };

  const canSubmit = opponent.trim().length > 0 && !!captain && (!requestPassword || organizerPassword.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
              title="Indietro"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Indietro</span>
            </button>
          </div>
          <h2 className="text-xl font-semibold mb-4">Nuova Partita</h2>

          {requestPassword && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-blue-600" />
                <label className="block text-sm font-medium text-blue-800">
                  Password Organizzatore *
                </label>
              </div>
              <input
                type="password"
                value={organizerPassword}
                onChange={(e) => setOrganizerPassword(e.target.value)}
                placeholder="Inserisci password organizzatore..."
                className="w-full border rounded px-3 py-2 mb-2"
                required
              />
              <p className="text-xs text-blue-600">
                Necessaria per creare partite condivise e gestire eventi durante il match
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Competizione
              </label>
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>Torneo Provinciale Autunnale</option>
                <option>Torneo Provinciale Primaverile</option>
                <option>Amichevole</option>
              </select>
            </div>

            {competition.includes("Torneo") && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giornata
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={matchDay}
                  onChange={(e) => setMatchDay(e.target.value)}
                  placeholder="Es: 1"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Luogo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`flex-1 py-2 rounded ${
                    isHome ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  🏠 Casa
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`flex-1 py-2 rounded ${
                    !isHome ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  ✈️ Trasferta
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Avversario *
              </label>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Es: Padova"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Allenatore
              </label>
              <input
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                placeholder="Gianmaria Tonolo"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-4 p-3 rounded border bg-slate-50">
            <h3 className="font-medium text-slate-800 mb-2">Staff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assistente Arbitro
                </label>
                <select
                  value={assistantReferee}
                  onChange={(e) => setAssistantReferee(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seleziona...</option>
                  <option>Enrico Vendramin</option>
                  <option>Enrico Brunazzo</option>
                  <option>Francesco Campello</option>
                </select>
              </div>
              <div>
                <label className="block text sm font-medium text-slate-700 mb-1">
                  Dirigente Accompagnatore
                </label>
                <select
                  value={teamManager}
                  onChange={(e) => setTeamManager(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seleziona...</option>
                  <option>Enrico Vendramin</option>
                  <option>Enrico Brunazzo</option>
                  <option>Francesco Campello</option>
                </select>
              </div>
            </div>
          </div>

          <div className="my-4 border-t" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Non Convocati: {" "}
                <span className="font-semibold">
                  {notCalled.length > 0 ? `${notCalled.length} selezionati` : "nessuno"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNotCalledPicker(true)}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded border text-sm"
              >
                <Users size={16} />
                Non Convocati
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Capitano: {" "}
                <span className="font-semibold">
                  {captain
                    ? `${captain} ${PLAYERS.find((p) => p.num === captain)?.name ?? ""}`
                    : "non selezionato"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCaptainPicker(true)}
                className="inline-flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 px-3 py-2 rounded border text-sm"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 bg-white text-yellow-600 rounded border border-yellow-600 text-xs font-bold">
                  C
                </span>
                Capitano
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded text-white ${
                canSubmit ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              Inizia Partita
            </button>
          </div>

          {requestPassword && (
            <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Suggerimento:</strong> La password è <code className="bg-gray-200 px-1 rounded">vigontina2025</code>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Non Convocati (griglia toggle rosso/grigio) */}
      {showNotCalledPicker && (
        <PickerModal title={`Seleziona Non Convocati • Esclusi: ${notCalled.length}`} onClose={() => setShowNotCalledPicker(false)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-auto pr-1">
            {PLAYERS.map((player) => {
              const excluded = notCalled.includes(player.num);
              const isCaptain = captain === player.num;
              const base = excluded
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";
              return (
                <button
                  key={player.num}
                  type="button"
                  onClick={() => !isCaptain && toggleNotCalled(player.num)}
                  disabled={isCaptain}
                  className={`w-full text-left p-2 border rounded ${base} ${isCaptain ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={isCaptain ? "Non selezionabile: è il capitano" : `${player.num} ${player.name}`}
                >
                  <span className="font-semibold mr-1">{player.num}</span>{player.name}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowNotCalledPicker(false)}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Conferma
            </button>
          </div>
        </PickerModal>
      )}

      {/* MODAL: Capitano (single-select) - rimane invariato */}
      {showCaptainPicker && (
        <PickerModal title="Seleziona Capitano" onClose={() => setShowCaptainPicker(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-auto pr-1">
            {availableForCaptain.map((player) => (
              <button
                key={player.num}
                type="button"
                onClick={() => setCaptain(player.num)}
                className={`w-full text-left p-2 border rounded flex items-center gap-2 ${
                  captain === player.num
                    ? "bg-yellow-500 text-white border-yellow-600"
                    : "bg-white border-slate-200 hover:bg-gray-50"
                }`}
              >
                {captain === player.num && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-white text-yellow-600 rounded border border-yellow-600 text-xs font-bold">
                    C
                  </span>
                )}
                <span>{player.num} {player.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setCaptain(null)}
              className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
              title="Azzera capitano"
            >
              Azzera
            </button>
            <button
              onClick={() => setShowCaptainPicker(false)}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Conferma
            </button>
          </div>
        </PickerModal>
      )}
    </div>
  );
};

const PickerModal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:w-[560px] bg-white rounded-t-lg sm:rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default NewMatchForm;
