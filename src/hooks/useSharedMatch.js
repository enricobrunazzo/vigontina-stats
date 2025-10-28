// hooks/useSharedMatch.js (fix: debug eventi + password corretta)
import { useState, useEffect, useCallback } from "react";
import { ref, onValue, set, off, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../config/firebase";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";
import { getActiveMatchCode, pushRealtimeEvent } from "./cloudPersistence";

const isOrganizer = (role) => role === 'organizer';

// Password semplice per organizzatore (CORRETTA)
const ORGANIZER_PASSWORD = "vigontina2025";

export const useSharedMatch = () => {
  const [sharedMatch, setSharedMatch] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [participants, setParticipants] = useState([]);

  const generateMatchCode = useCallback(() => Math.floor(100000 + Math.random() * 900000).toString(), []);

  // Verifica password organizzatore
  const authenticateOrganizer = useCallback((password) => {
    console.log('🔐 Verifica password:', { input: password, expected: ORGANIZER_PASSWORD, match: password === ORGANIZER_PASSWORD });
    return password === ORGANIZER_PASSWORD;
  }, []);

  const createSharedMatch = useCallback(async (matchData, organizerPassword = '') => {
    console.log('🆕 Creazione partita con password:', organizerPassword);
    // Verifica password per creare partita
    if (!authenticateOrganizer(organizerPassword)) {
      throw new Error('Password organizzatore non corretta. Usa: vigontina2025');
    }

    const newMatchId = generateMatchCode();
    const newMatch = createMatchStructure(matchData);
    const sharedMatchData = {
      ...newMatch,
      id: newMatchId,
      createdAt: serverTimestamp(),
      createdBy: 'organizer',
      isActive: true,
      currentPeriod: null,
      participants: { organizer: { role: 'organizer', joinedAt: serverTimestamp() } },
      settings: { allowViewers: true, allowCollaborators: false }
    };
    await set(ref(realtimeDb, `active-matches/${newMatchId}`), sharedMatchData);
    setMatchId(newMatchId);
    setUserRole('organizer');
    console.log('✅ Partita creata con successo, ruolo:', 'organizer');
    return newMatchId;
  }, [generateMatchCode, authenticateOrganizer]);

  const joinMatch = useCallback(async (code, password = '') => {
    console.log('🔗 Join partita con password:', password);
    const matchRef = ref(realtimeDb, `active-matches/${code}`);
    return new Promise((resolve, reject) => {
      const unsubscribe = onValue(matchRef, (snap) => {
        unsubscribe();
        if (!snap.exists()) return reject(new Error('Partita non trovata'));
        const data = snap.val();
        if (!data.isActive) return reject(new Error('Partita non più attiva'));
        
        // Determina il ruolo in base alla password
        const role = authenticateOrganizer(password) ? 'organizer' : 'viewer';
        console.log('👤 Ruolo assegnato:', role);
        
        setMatchId(code);
        setUserRole(role);
        resolve(code);
      });
    });
  }, [authenticateOrganizer]);

  useEffect(() => {
    if (!matchId) { setSharedMatch(null); setIsConnected(false); return; }
    const matchRef = ref(realtimeDb, `active-matches/${matchId}`);
    const unsub = onValue(matchRef, (snap) => {
      if (!snap.exists()) { setSharedMatch(null); setIsConnected(false); return; }
      const data = snap.val();
      setSharedMatch(data);
      setIsConnected(true);
      if (data.participants) {
        setParticipants(Object.entries(data.participants).map(([id, info]) => ({ id, ...info })));
      }
    });
    return () => { off(matchRef, 'value', unsub); };
  }, [matchId]);

  const updateSharedMatch = useCallback(async (updates) => {
    if (!matchId) {
      console.warn('❌ Nessun matchId per aggiornamento');
      return;
    }
    if (!isOrganizer(userRole)) { 
      console.warn('❌ Bloccato aggiornamento: utente non organizzatore, ruolo:', userRole);
      alert('❌ Solo l\'organizzatore può modificare la partita. Il tuo ruolo: ' + userRole);
      return; 
    }
    try { 
      console.log('📝 Aggiornamento partita:', updates);
      await set(ref(realtimeDb, `active-matches/${matchId}`), { ...sharedMatch, ...updates }); 
      console.log('✅ Partita aggiornata con successo');
    }
    catch (e) { 
      console.error('❌ Errore aggiornamento partita condivisa:', e); 
    }
  }, [matchId, sharedMatch, userRole]);

  const setSharedPeriod = useCallback(async (periodIndex) => {
    console.log('⏱️ Impostazione periodo:', periodIndex, 'Ruolo:', userRole);
    if (!isOrganizer(userRole)) {
      console.warn('❌ Solo l\'organizzatore può avviare periodi');
      return;
    }
    await updateSharedMatch({ currentPeriod: periodIndex });
  }, [updateSharedMatch, userRole]);

  const composeAndPushEvent = useCallback(async (text, minute) => {
    const code = matchId || getActiveMatchCode();
    if (!code) return;
    await pushRealtimeEvent(code, { text: minute != null ? `${minute}' ${text}` : text, ts: Date.now() });
  }, [matchId]);

  // Helper per verificare se è Prova Tecnica
  const isProvaTecnica = useCallback(() => {
    if (!sharedMatch || sharedMatch.currentPeriod === null) return false;
    const period = sharedMatch.periods[sharedMatch.currentPeriod];
    return period?.name === "PROVA TECNICA";
  }, [sharedMatch]);

  const addSharedGoal = useCallback(async (scorerNum, assistNum, getCurrentMinute) => {
    console.log('⚽ Tentativo aggiunta gol - Ruolo:', userRole, 'È organizzatore:', isOrganizer(userRole));
    
    if (!sharedMatch || sharedMatch.currentPeriod === null) {
      console.warn('❌ Match o periodo non validi');
      return;
    }
    if (!isOrganizer(userRole)) {
      console.warn('❌ Solo l\'organizzatore può aggiungere gol');
      alert('❌ Solo l\'organizzatore può aggiungere eventi. Il tuo ruolo: ' + userRole);
      return;
    }
    
    // Blocca eventi nella Prova Tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti gol: usa i pulsanti +/- per i punti.");
      return;
    }

    console.log('✅ Aggiunta gol autorizzata, procedo...');
    const minute = getCurrentMinute();
    const goal = {
      scorer: scorerNum,
      scorerName: PLAYERS.find((p) => p.num === scorerNum)?.name,
      assist: assistNum,
      assistName: assistNum ? PLAYERS.find((p) => p.num === assistNum)?.name : null,
      minute,
      type: 'goal',
      timestamp: Date.now()
    };
    
    const updated = { ...sharedMatch };
    updated.periods = [...sharedMatch.periods];
    updated.periods[sharedMatch.currentPeriod] = {
      ...updated.periods[sharedMatch.currentPeriod],
      goals: [...updated.periods[sharedMatch.currentPeriod].goals, goal],
      vigontina: updated.periods[sharedMatch.currentPeriod].vigontina + 1,
    };
    
    await updateSharedMatch(updated);
    const txt = `Gol: ${goal.scorer} ${goal.scorerName}${goal.assist ? ` (assist ${goal.assistName})` : ''}`;
    await composeAndPushEvent(txt, minute);
    console.log('✅ Gol aggiunto con successo');
  }, [sharedMatch, updateSharedMatch, userRole, composeAndPushEvent, isProvaTecnica]);

  const addOpponentGoal = useCallback(async (getCurrentMinute) => {
    console.log('⚽ Tentativo aggiunta gol avversario - Ruolo:', userRole);
    
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    if (!isOrganizer(userRole)) {
      alert('❌ Solo l\'organizzatore può aggiungere eventi. Il tuo ruolo: ' + userRole);
      return;
    }
    
    // Blocca eventi nella Prova Tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti gol: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = getCurrentMinute();
    const updated = { ...sharedMatch };
    updated.periods = [...sharedMatch.periods];
    updated.periods[sharedMatch.currentPeriod] = {
      ...updated.periods[sharedMatch.currentPeriod],
      goals: [...updated.periods[sharedMatch.currentPeriod].goals, { minute, type: 'opponent-goal' }],
      opponent: updated.periods[sharedMatch.currentPeriod].opponent + 1,
    };
    await updateSharedMatch(updated);
    await composeAndPushEvent('Gol avversario', minute);
  }, [sharedMatch, updateSharedMatch, userRole, composeAndPushEvent, isProvaTecnica]);

  const addOwnGoal = useCallback(async (getCurrentMinute) => {
    console.log('⚽ Tentativo aggiunta autogol - Ruolo:', userRole);
    
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    if (!isOrganizer(userRole)) {
      alert('❌ Solo l\'organizzatore può aggiungere eventi. Il tuo ruolo: ' + userRole);
      return;
    }
    
    // Blocca eventi nella Prova Tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti gol: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = getCurrentMinute();
    const updated = { ...sharedMatch };
    updated.periods = [...sharedMatch.periods];
    updated.periods[sharedMatch.currentPeriod] = {
      ...updated.periods[sharedMatch.currentPeriod],
      goals: [...updated.periods[sharedMatch.currentPeriod].goals, { minute, type: 'own-goal' }],
      vigontina: updated.periods[sharedMatch.currentPeriod].vigontina + 1,
    };
    await updateSharedMatch(updated);
    await composeAndPushEvent('Autogol', minute);
  }, [sharedMatch, updateSharedMatch, userRole, composeAndPushEvent, isProvaTecnica]);

  const addPenalty = useCallback(async (team, scored, scorerNum, getCurrentMinute) => {
    console.log('🎯 Tentativo aggiunta rigore - Ruolo:', userRole);
    
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    if (!isOrganizer(userRole)) {
      alert('❌ Solo l\'organizzatore può aggiungere eventi. Il tuo ruolo: ' + userRole);
      return;
    }
    
    // Blocca eventi nella Prova Tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti rigori: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = getCurrentMinute();
    const scorerName = scorerNum ? PLAYERS.find((p) => p.num === scorerNum)?.name : null;
    const type = scored
      ? team === 'vigontina' ? 'penalty-goal' : 'penalty-opponent-goal'
      : team === 'vigontina' ? 'penalty-missed' : 'penalty-opponent-missed';

    const updated = { ...sharedMatch };
    updated.periods = [...sharedMatch.periods];
    const period = { ...updated.periods[sharedMatch.currentPeriod] };
    period.goals = [...period.goals, { minute, type, scorer: scorerNum, scorerName }];
    if (scored) {
      if (team === 'vigontina') period.vigontina++; else period.opponent++;
    }
    updated.periods[sharedMatch.currentPeriod] = period;
    await updateSharedMatch(updated);

    let txt = '';
    if (team === 'vigontina') {
      txt = scored ? `Rigore: ${scorerNum} ${scorerName} (gol)` : `Rigore: ${scorerNum ? `${scorerNum} ${scorerName} ` : ''}(sbagliato)`;
    } else {
      txt = scored ? 'Rigore avversario (gol)' : 'Rigore avversario (sbagliato)';
    }
    await composeAndPushEvent(txt, minute);
  }, [sharedMatch, updateSharedMatch, userRole, composeAndPushEvent, isProvaTecnica]);

  // FUNZIONE: updateScore per modifiche manuali (Prova Tecnica)
  const updateScore = useCallback(async (team, delta) => {
    console.log('📊 Tentativo aggiorna punteggio - Ruolo:', userRole, 'Team:', team, 'Delta:', delta);
    
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    if (!isOrganizer(userRole)) {
      alert('❌ Solo l\'organizzatore può modificare i punteggi. Il tuo ruolo: ' + userRole);
      return;
    }

    const updated = { ...sharedMatch };
    updated.periods = [...sharedMatch.periods];
    const period = { ...updated.periods[sharedMatch.currentPeriod] };
    
    if (team === "vigontina") {
      period.vigontina = Math.max(0, period.vigontina + delta);
    } else {
      period.opponent = Math.max(0, period.opponent + delta);
    }
    
    updated.periods[sharedMatch.currentPeriod] = period;
    await updateSharedMatch(updated);

    // Log evento per Prova Tecnica
    if (isProvaTecnica()) {
      const teamName = team === "vigontina" ? "Vigontina" : "Avversario";
      const action = delta > 0 ? "+" : "";
      await composeAndPushEvent(`Punteggio ${teamName}: ${action}${delta} (${period[team]} punti)`, null);
    }
    console.log('✅ Punteggio aggiornato con successo');
  }, [sharedMatch, updateSharedMatch, userRole, isProvaTecnica, composeAndPushEvent]);

  const endSharedMatch = useCallback(async () => {
    if (!isOrganizer(userRole)) return;
    await updateSharedMatch({ isActive: false, endedAt: serverTimestamp() });
    setMatchId(null); setSharedMatch(null); setIsConnected(false);
  }, [updateSharedMatch, userRole]);

  const leaveMatch = useCallback(() => { 
    setMatchId(null); 
    setSharedMatch(null); 
    setIsConnected(false); 
    setUserRole('viewer'); 
  }, []);

  const getShareUrl = useCallback(() => { 
    if (!matchId) return null; 
    return `${window.location.origin}?match=${matchId}`; 
  }, [matchId]);

  return {
    sharedMatch,
    matchId,
    isConnected,
    userRole,
    participants,
    createSharedMatch,
    joinMatch,
    leaveMatch,
    endSharedMatch,
    updateSharedMatch,
    setSharedPeriod,
    addSharedGoal,
    addOpponentGoal,
    addOwnGoal,
    addPenalty,
    updateScore, 
    getShareUrl,
    generateMatchCode,
    authenticateOrganizer,
  };
};