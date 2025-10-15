import { useState, useCallback, useMemo } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { calculatePoints } from "../utils/matchUtils";

export const useMatchHistory = () => {
  const [matchHistory, setMatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica lo storico delle partite da Firebase
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "matches"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const matches = [];
      querySnapshot.forEach((docSnap) => {
        matches.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMatchHistory(matches);
      return matches;
    } catch (error) {
      console.error("Errore caricamento storico:", error);
      setError(error.message ?? "Errore sconosciuto");
      alert(
        `⚠️ Errore nel caricamento dello storico: ${error.message ?? "Errore sconosciuto"}`
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salva una nuova partita
  const saveMatch = useCallback(
    async (match) => {
      if (!window.confirm("Sei sicuro di voler salvare e terminare questa partita?")) {
        return false;
      }
      setIsLoading(true);
      setError(null);
      try {
        await addDoc(collection(db, "matches"), {
          ...match,
          finalPoints: {
            vigontina: calculatePoints(match, "vigontina"),
            opponent: calculatePoints(match, "opponent"),
          },
          savedAt: Date.now(),
        });
        alert("✅ Partita salvata con successo!");
        await loadHistory();
        return true;
      } catch (error) {
        console.error("Errore salvataggio:", error);
        setError(error.message ?? "Errore sconosciuto");
        alert(
          `❌ Errore nel salvataggio della partita: ${error.message ?? "Errore sconosciuto"}\n\nRiprova o contatta l'assistenza.`
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadHistory]
  );

  // Elimina una partita
  const deleteMatch = useCallback(
    async (matchId) => {
      if (
        !window.confirm(
          "⚠️ Sei sicuro di voler eliminare questa partita?\n\nQuesta azione è irreversibile!"
        )
      ) {
        return false;
      }
      const password = prompt(
        "Inserisci la password per confermare l'eliminazione:"
      );
      if (password !== "Vigontina2526") {
        if (password !== null) {
          alert("❌ Password errata. Eliminazione annullata.");
        }
        return false;
      }
      setIsLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, "matches", matchId));
        alert("✅ Partita eliminata con successo!");
        await loadHistory();
        return true;
      } catch (error) {
        console.error("Errore eliminazione:", error);
        setError(error.message ?? "Errore sconosciuto");
        alert(
          `❌ Errore nell'eliminazione: ${error.message ?? "Errore sconosciuto"}`
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadHistory]
  );

  // Calcola le statistiche generali (patchata per coerenza con lo storico)
  const stats = useMemo(() => {
    const totalMatches = matchHistory.length;
    const wins = matchHistory.filter(
      (m) => calculatePoints(m, "vigontina") > calculatePoints(m, "opponent")
    ).length;
    const draws = matchHistory.filter(
      (m) => calculatePoints(m, "vigontina") === calculatePoints(m, "opponent")
    ).length;
    const losses = matchHistory.filter(
      (m) => calculatePoints(m, "vigontina") < calculatePoints(m, "opponent")
    ).length;
    return { totalMatches, wins, draws, losses };
  }, [matchHistory]);

  // Ottiene l'ultima partita giocata
  const lastPlayedMatch = useMemo(() => {
    if (!matchHistory || matchHistory.length === 0) return null;
    return [...matchHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  }, [matchHistory]);

  return {
    matchHistory,
    isLoading,
    error,
    loadHistory,
    saveMatch,
    deleteMatch,
    stats,
    lastPlayedMatch,
  };
};