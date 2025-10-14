// components/NewMatchForm.jsx
import React, { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { PLAYERS } from "../constants/players";

const NewMatchForm = ({ onSubmit, onCancel }) => {
  const [competition, setCompetition] = useState("Torneo Provinciale Autunnale");
  const [matchDay, setMatchDay] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [assistantReferee, setAssistantReferee] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [notCalled, setNotCalled] = useState([]);
  const [captain, setCaptain] = useState(null);

  const availablePlayers = useMemo(
    () => PLAYERS.filter((p) => !notCalled.includes(p.num)),
    [notCalled]
  );

  const toggleNotCalled = (num) => {
    setNotCalled((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
    if (captain === num) setCaptain(null);
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

    onSubmit({
      competition,
      matchDay: competition.includes("Torneo") ? matchDay : null,
      isHome,
      opponent,
      date,
      assistantReferee,
      teamManager,
      notCalled,
      captain,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-cyan-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={onCancel}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Indietro
          </button>
          
          <h2 className="text-2xl font-bold mb-6">Nuova Partita</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
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
                <label className="block text-sm font-medium mb-1">
                  Giornata
                </label>
                <input
                  type="number"
                  value={matchDay}
                  onChange={(e) => setMatchDay(e.target.value)}
                  placeholder="Es: 1"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Luogo</label>
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

            <div>
              <label className="block text-sm font-medium mb-1">
                Avversario *
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Assistente Arbitro
              </label>
              <select
                value={assistantReferee}
                onChange={(e) => setAssistantReferee(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option>Vendramin Enrico</option>
                <option>Brunazzo Enrico</option>
                <option>Campello Francesco</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Dirigente Accompagnatore
              </label>
              <select
                value={teamManager}
                onChange={(e) => setTeamManager(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleziona...</option>
                <option>Vendramin Enrico</option>
                <option>Brunazzo Enrico</option>
                <option>Campello Francesco</option>
              </select>
            </div>

            {/* Non convocati */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Non Convocati
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2">
                {PLAYERS.map((player) => (
                  <button
                    key={player.num}
                    onClick={() => toggleNotCalled(player.num)}
                    className={`w-full p-2 rounded border text-sm text-left ${
                      notCalled.includes(player.num)
                        ? "bg-red-100 border-red-300 text-red-800"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {player.num} {player.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Capitano */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Capitano *
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availablePlayers.map((player) => (
                    <button
                      key={player.num}
                      type="button"
                      onClick={() => setCaptain(player.num)}
                      className={`p-2 rounded border text-sm text-left ${
                        captain === player.num
                          ? "bg-yellow-500 text-white border-yellow-600 font-semibold"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {captain === player.num && "⭐ "}
                      {player.num} {player.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition font-medium"
            >
              Inizia Partita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMatchForm;