// hooks/cloudPersistence.js (append list of last events)
import { ref, get, onValue, off, set, serverTimestamp, update, push, child } from 'firebase/database';
import { realtimeDb } from '../config/firebase';

const LS_ACTIVE_KEY = 'myActiveMatch';
export const getActiveMatchCode = () => { try { return localStorage.getItem(LS_ACTIVE_KEY) || null; } catch { return null; } };
export const setActiveMatchCode = (code) => { try { if (code) localStorage.setItem(LS_ACTIVE_KEY, code); else localStorage.removeItem(LS_ACTIVE_KEY); } catch {} };

export const getMatchSnapshot = async (code) => { const snap = await get(ref(realtimeDb, `active-matches/${code}`)); return snap.exists() ? snap.val() : null; };
export const isMatchActive = async (code) => { const data = await getMatchSnapshot(code); return !!(data && data.isActive); };
export const watchMatch = (code, cb) => { const r = ref(realtimeDb, `active-matches/${code}`); const unsub = onValue(r, (snap) => cb(snap.exists() ? snap.val() : null)); return () => off(r, 'value', unsub); };
export const ensureOrganizerAccess = async (code, password) => { if (password !== 'Vigontina14!') throw new Error('Password errata'); const r = ref(realtimeDb, `active-matches/${code}/organizerSession`); await set(r, { hasAccess: true, lastSeen: serverTimestamp() }); return true; };

export const updateTimerState = async (code, timer) => { const r = ref(realtimeDb, `active-matches/${code}/timer`); await update(r, { ...timer, lastUpdate: serverTimestamp() }); };

// Store compact info about last events in a capped list (max 5)
export const pushRealtimeEvent = async (code, event) => {
  // event example: { text: '67\' Gol Rossi (Nero)', ts: Date.now() }
  const listRef = ref(realtimeDb, `active-matches/${code}/realtime/events`);
  const newRef = push(listRef);
  await set(newRef, { ...event, createdAt: serverTimestamp() });
  // Optional: caller can prune client-side by reading last 5; server pruning would need a Cloud Function.
  const metaRef = ref(realtimeDb, `active-matches/${code}/realtime`);
  await update(metaRef, { lastEvent: event.text, updates: serverTimestamp() });
};
