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
import { calculatePoints, calculateTotalGoals } from "../utils/matchUtils";

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
        const vigontinaPoints = calculatePoints(match, "vigontina");
        const opponentPoints = calculatePoints(match, "opponent");
        const vigontinaGoals = calculateTotalGoals(match, "vigontina");
        const opponentGoals = calculateTotalGoals(match, "opponent");
        
        await addDoc(collection(db, "matches"), {
          ...match,
          finalPoints: {
            vigontina: vigontinaPoints,
            opponent: opponentPoints,
          },
          finalGoals: {
            vigontina: vigontinaGoals,
            opponent: opponentGoals,
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

  // Helper per ottenere i punti di una partita
  // SEMPRE ricalcola per garantire coerenza, ignora finalPoints che potrebbero essere vecchi
  const getMatchPoints = useCallback((match, team) => {
    return calculatePoints(match, team);
  }, []);

  // Helper per ottenere i gol di una partita
  // SEMPRE ricalcola per garantire coerenza
  const getMatchGoals = useCallback((match, team) => {
    return calculateTotalGoals(match, team);
  }, []);

  // Calcola le statistiche generali
  const stats = useMemo(() => {
    const totalMatches = matchHistory.length;
    
    const wins = matchHistory.filter((m) => {
      const vigontinaPoints = getMatchPoints(m, "vigontina");
      const opponentPoints = getMatchPoints(m, "opponent");
      return vigontinaPoints > opponentPoints;
    }).length;
    
    const draws = matchHistory.filter((m) => {
      const vigontinaPoints = getMatchPoints(m, "vigontina");
      const opponentPoints = getMatchPoints(m, "opponent");
      return vigontinaPoints === opponentPoints;
    }).length;
    
    const losses = matchHistory.filter((m) => {
      const vigontinaPoints = getMatchPoints(m, "vigontina");
      const opponentPoints = getMatchPoints(m, "opponent");
      return vigontinaPoints < opponentPoints;
    }).length;
    
    return { totalMatches, wins, draws, losses };
  }, [matchHistory, getMatchPoints]);

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
    getMatchPoints,
    getMatchGoals,
  };
};