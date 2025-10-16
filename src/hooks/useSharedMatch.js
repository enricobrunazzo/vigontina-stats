// hooks/useSharedMatch.js
import { useState, useEffect, useCallback } from "react";
import { ref, onValue, set, push, off, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../config/firebase";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";

/**
 * Hook per gestire partite condivise in tempo reale tra più utenti
 */
export const useSharedMatch = () => {
  const [sharedMatch, setSharedMatch] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState('viewer'); // 'organizer', 'collaborator', 'viewer'
  const [participants, setParticipants] = useState([]);

  /**
   * Genera un codice univoco di 6 cifre per la partita
   */
  const generateMatchCode = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  /**
   * Crea una nuova partita condivisa
   */
  const createSharedMatch = useCallback(async (matchData) => {
    try {
      const newMatchId = generateMatchCode();
      const newMatch = createMatchStructure(matchData);
      
      // Struttura dati per Firebase
      const sharedMatchData = {
        ...newMatch,
        id: newMatchId,
        createdAt: serverTimestamp(),
        createdBy: 'organizer', // In futuro con autenticazione
        isActive: true,
        currentPeriod: null,
        participants: {
          organizer: {
            role: 'organizer',
            joinedAt: serverTimestamp()
          }
        },
        settings: {
          allowViewers: true,
          allowCollaborators: false
        }
      };

      // Salva su Firebase
      const matchRef = ref(realtimeDb, `active-matches/${newMatchId}`);
      await set(matchRef, sharedMatchData);

      setMatchId(newMatchId);
      setUserRole('organizer');
      
      return newMatchId;
    } catch (error) {
      console.error('Errore nella creazione della partita condivisa:', error);
      throw error;
    }
  }, [generateMatchCode]);

  /**
   * Si connette a una partita esistente tramite codice
   */
  const joinMatch = useCallback(async (code, role = 'viewer') => {
    try {
      const matchRef = ref(realtimeDb, `active-matches/${code}`);
      
      // Verifica se la partita esiste
      return new Promise((resolve, reject) => {
        const checkMatch = onValue(matchRef, (snapshot) => {
          off(matchRef, 'value', checkMatch);
          
          if (snapshot.exists()) {
            const matchData = snapshot.val();
            if (matchData.isActive) {
              setMatchId(code);
              setUserRole(role);
              
              // Aggiunge il partecipante
              const participantRef = ref(realtimeDb, `active-matches/${code}/participants/${Date.now()}`);
              set(participantRef, {
                role: role,
                joinedAt: serverTimestamp()
              });
              
              resolve(code);
            } else {
              reject(new Error('Partita non più attiva'));
            }
          } else {
            reject(new Error('Partita non trovata'));
          }
        });
      });
    } catch (error) {
      console.error('Errore nel join della partita:', error);
      throw error;
    }
  }, []);

  /**
   * Listener per i cambiamenti della partita in tempo reale
   */
  useEffect(() => {
    if (!matchId) {
      setSharedMatch(null);
      setIsConnected(false);
      return;
    }

    const matchRef = ref(realtimeDb, `active-matches/${matchId}`);
    
    const unsubscribe = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        const matchData = snapshot.val();
        setSharedMatch(matchData);
        setIsConnected(true);
        
        // Aggiorna lista partecipanti
        if (matchData.participants) {
          setParticipants(Object.entries(matchData.participants).map(([id, data]) => ({
            id,
            ...data
          })));
        }
      } else {
        setSharedMatch(null);
        setIsConnected(false);
      }
    });

    return () => {
      off(matchRef, 'value', unsubscribe);
    };
  }, [matchId]);

  /**
   * Aggiorna i dati della partita su Firebase
   */
  const updateSharedMatch = useCallback(async (updates) => {
    if (!matchId || userRole === 'viewer') {
      console.warn('Non autorizzato a modificare la partita');
      return;
    }

    try {
      const matchRef = ref(realtimeDb, `active-matches/${matchId}`);
      await set(matchRef, { ...sharedMatch, ...updates });
    } catch (error) {
      console.error('Errore nell\'aggiornamento della partita:', error);
    }
  }, [matchId, sharedMatch, userRole]);

  /**
   * Imposta il periodo corrente
   */
  const setSharedPeriod = useCallback(async (periodIndex) => {
    await updateSharedMatch({ currentPeriod: periodIndex });
  }, [updateSharedMatch]);

  /**
   * Aggiunge un gol alla partita condivisa
   */
  const addSharedGoal = useCallback(async (scorerNum, assistNum, getCurrentMinute) => {
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    
    const goal = {
      scorer: scorerNum,
      scorerName: PLAYERS.find((p) => p.num === scorerNum)?.name,
      assist: assistNum,
      assistName: assistNum ? PLAYERS.find((p) => p.num === assistNum)?.name : null,
      minute: getCurrentMinute(),
      type: "goal",
      timestamp: Date.now()
    };

    const updatedMatch = { ...sharedMatch };
    updatedMatch.periods = [...sharedMatch.periods];
    updatedMatch.periods[sharedMatch.currentPeriod] = {
      ...updatedMatch.periods[sharedMatch.currentPeriod],
      goals: [...updatedMatch.periods[sharedMatch.currentPeriod].goals, goal],
      vigontina: updatedMatch.periods[sharedMatch.currentPeriod].vigontina + 1,
    };

    await updateSharedMatch(updatedMatch);
  }, [sharedMatch, updateSharedMatch]);

  /**
   * Termina la partita condivisa
   */
  const endSharedMatch = useCallback(async () => {
    if (userRole !== 'organizer') {
      console.warn('Solo l\'organizzatore può terminare la partita');
      return;
    }

    await updateSharedMatch({ isActive: false, endedAt: serverTimestamp() });
    
    // Disconnette l'utente
    setMatchId(null);
    setSharedMatch(null);
    setIsConnected(false);
  }, [userRole, updateSharedMatch]);

  /**
   * Disconnette dalla partita corrente
   */
  const leaveMatch = useCallback(() => {
    setMatchId(null);
    setSharedMatch(null);
    setIsConnected(false);
    setUserRole('viewer');
  }, []);

  /**
   * Ottiene l'URL di condivisione per la partita
   */
  const getShareUrl = useCallback(() => {
    if (!matchId) return null;
    return `${window.location.origin}?match=${matchId}`;
  }, [matchId]);

  return {
    // State
    sharedMatch,
    matchId,
    isConnected,
    userRole,
    participants,

    // Actions
    createSharedMatch,
    joinMatch,
    leaveMatch,
    endSharedMatch,
    
    // Match operations
    updateSharedMatch,
    setSharedPeriod,
    addSharedGoal,
    
    // Utilities
    getShareUrl,
    generateMatchCode
  };
};