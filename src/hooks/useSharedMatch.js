// hooks/useSharedMatch.js (log realtime events on scoring actions)
import { useState, useEffect, useCallback } from "react";
import { ref, onValue, set, off, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../config/firebase";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";
import { getActiveMatchCode } from "./cloudPersistence";
import { pushRealtimeEvent } from "./cloudPersistence";

const isOrganizer = (role) => role === 'organizer';

export const useSharedMatch = () => {
  const [sharedMatch, setSharedMatch] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [participants, setParticipants] = useState([]);

  const generateMatchCode = useCallback(() => Math.floor(100000 + Math.random() * 900000).toString(), []);

  const createSharedMatch = useCallback(async (matchData) => {
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
    return newMatchId;
  }, [generateMatchCode]);

  const joinMatch = useCallback(async (code, role = 'viewer') => {
    const matchRef = ref(realtimeDb, `active-matches/${code}`);
    return new Promise((resolve, reject) => {
      const stop = onValue(matchRef, (snap) => {
        off(matchRef, 'value', stop);
        if (!snap.exists()) return reject(new Error('Partita non trovata'));
        const data = snap.val();
        if (!data.isActive) return reject(new Error('Partita non più attiva'));
        setMatchId(code);
        setUserRole(role);
        resolve(code);
      });
    });
  }, []);

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
    if (!matchId) return;
    if (!isOrganizer(userRole)) { console.warn('Bloccato aggiornamento: utente non organizzatore'); return; }
    try { await set(ref(realtimeDb, `active-matches/${matchId}`), { ...sharedMatch, ...updates }); }
    catch (e) { console.error('Errore aggiornamento partita condivisa:', e); }
  }, [matchId, sharedMatch, userRole]);

  const setSharedPeriod = useCallback(async (periodIndex) => {
    if (!isOrganizer(userRole)) return;
    await updateSharedMatch({ currentPeriod: periodIndex });
  }, [updateSharedMatch, userRole]);

  const addSharedGoal = useCallback(async (scorerNum, assistNum, getCurrentMinute) => {
    if (!sharedMatch || sharedMatch.currentPeriod === null) return;
    if (!isOrganizer(userRole)) return;
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
    const code = matchId || getActiveMatchCode();
    if (code) await pushRealtimeEvent(code, { text: `${minute}' Gol: ${goal.scorer} ${goal.scorerName}${goal.assist ? ` (assist ${goal.assistName})` : ''}`, ts: Date.now() });
  }, [sharedMatch, updateSharedMatch, userRole, matchId]);

  const endSharedMatch = useCallback(async () => {
    if (!isOrganizer(userRole)) return;
    await updateSharedMatch({ isActive: false, endedAt: serverTimestamp() });
    setMatchId(null); setSharedMatch(null); setIsConnected(false);
  }, [updateSharedMatch, userRole]);

  const leaveMatch = useCallback(() => { setMatchId(null); setSharedMatch(null); setIsConnected(false); setUserRole('viewer'); }, []);

  const getShareUrl = useCallback(() => { if (!matchId) return null; return `${window.location.origin}?match=${matchId}`; }, [matchId]);

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
    getShareUrl,
    generateMatchCode,
  };
};