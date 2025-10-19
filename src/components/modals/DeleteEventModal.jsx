// components/modals/DeleteEventModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

const DeleteEventModal = ({ events, onConfirm, onCancel, opponentName }) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState("");
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  // Filtra solo gli eventi NON già eliminati
  const availableEvents = events.filter(event => !event.deleted && !event.deletionReason);

  const handleEventSelect = (eventIndex) => {
    setSelectedEventIndex(eventIndex);
    const actualIndex = parseInt(eventIndex);
    const event = events[actualIndex];
    
    // Se è un gol, mostra il campo per la motivazione
    const isGoalEvent = event?.type?.includes('goal') || (event?.type?.includes('penalty') && !event?.type?.includes('missed'));
    setShowReasonInput(isGoalEvent);
    
    if (!isGoalEvent) {
      setReason(""); // Reset reason for non-goal events
    }
  };

  const handleConfirm = () => {
    if (selectedEventIndex === "") return;
    
    const actualIndex = parseInt(selectedEventIndex);
    const event = events[actualIndex];
    const isGoalEvent = event?.type?.includes('goal') || (event?.type?.includes('penalty') && !event?.type?.includes('missed'));
    
    // Per i gol, la motivazione è obbligatoria
    if (isGoalEvent && !reason.trim()) {
      alert("Inserisci una motivazione per l'annullamento del gol");
      return;
    }
    
    onConfirm(actualIndex, reason.trim() || null);
  };

  const getEventDisplay = (event, index) => {
    if (!event) return "";
    
    const minute = event.minute || "?";
    
    switch (event.type) {
      case "goal":
        return `⚽ ${minute}' - Gol ${event.scorer} ${event.scorerName || ""}`;
      case "opponent-goal":
        return `⚽ ${minute}' - Gol ${opponentName}`;
      case "own-goal":
        return `⚽ ${minute}' - Autogol Vigontina`;
      case "opponent-own-goal":
        return `⚽ ${minute}' - Autogol ${opponentName}`;
      case "penalty-goal":
        return `🎯 ${minute}' - Rigore segnato ${event.scorer} ${event.scorerName || ""}`;
      case "penalty-opponent-goal":
        return `🎯 ${minute}' - Rigore segnato ${opponentName}`;
      case "penalty-missed":
        return `❌ ${minute}' - Rigore fallito Vigontina`;
      case "penalty-opponent-missed":
        return `❌ ${minute}' - Rigore fallito ${opponentName}`;
      case "save":
        return `🧤 ${minute}' - Parata ${event.player} ${event.playerName || ""}`;
      case "opponent-save":
        return `🧤 ${minute}' - Parata ${opponentName}`;
      case "missed-shot":
        return `🎯 ${minute}' - Tiro fuori ${event.player} ${event.playerName || ""}`;
      case "opponent-missed-shot":
        return `🎯 ${minute}' - Tiro fuori ${opponentName}`;
      case "palo-vigontina":
      case "traversa-vigontina":
        const hitType = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
        return `${hitType} ${minute}' - ${event.player} ${event.playerName || ""}`;
      case "palo-opponent":
      case "traversa-opponent":
        const hitTypeOpp = event.hitType === 'palo' ? '🧱 Palo' : '⎯ Traversa';
        return `${hitTypeOpp} ${minute}' - ${opponentName}`;
      default:
        return `${minute}' - Evento sconosciuto`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Elimina Evento</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {availableEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nessun evento disponibile da eliminare</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seleziona evento da eliminare:
                </label>
                <select
                  value={selectedEventIndex}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleziona un evento --</option>
                  {events.map((event, index) => {
                    // Mostra solo eventi non eliminati
                    if (event.deleted || event.deletionReason) return null;
                    
                    return (
                      <option key={index} value={index}>
                        {getEventDisplay(event, index)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {showReasonInput && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-red-600">
                    Motivazione annullamento gol *:
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Seleziona motivazione --</option>
                    <option value="Fallo">Annullato per fallo</option>
                    <option value="Fuorigioco">Annullato per fuorigioco</option>
                    <option value="Irregolarità">Annullato per irregolarità</option>
                    <option value="Errore arbitrale">Errore arbitrale</option>
                    <option value="Altro">Altro</option>
                  </select>
                  {reason === "Altro" && (
                    <input
                      type="text"
                      placeholder="Specifica il motivo..."
                      value={reason === "Altro" ? "" : reason}
                      onChange={(e) => setReason(`Altro: ${e.target.value}`)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                    />
                  )}
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ L'eliminazione di un gol influirà sul punteggio della partita
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedEventIndex === "" || (showReasonInput && !reason.trim())}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Elimina Evento
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEventModal;