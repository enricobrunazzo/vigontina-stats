// hooks/cloudPersistence.js
// Cloud-first persistence helpers for shared matches (Firebase Realtime DB)
import { ref, get, onValue, off, set, serverTimestamp, update } from 'firebase/database';
import { realtimeDb } from '../config/firebase';

const LS_ACTIVE_KEY = 'myActiveMatch';

export const getActiveMatchCode = () => {
  try { return localStorage.getItem(LS_ACTIVE_KEY) || null; } catch { return null; }
};
export const setActiveMatchCode = (code) => {
  try { if (code) localStorage.setItem(LS_ACTIVE_KEY, code); else localStorage.removeItem(LS_ACTIVE_KEY); } catch {}
};

export const getMatchSnapshot = async (code) => {
  const snap = await get(ref(realtimeDb, `active-matches/${code}`));
  return snap.exists() ? snap.val() : null;
};

export const isMatchActive = async (code) => {
  const data = await getMatchSnapshot(code);
  return !!(data && data.isActive);
};

export const watchMatch = (code, cb) => {
  const r = ref(realtimeDb, `active-matches/${code}`);
  const unsub = onValue(r, (snap) => cb(snap.exists() ? snap.val() : null));
  return () => off(r, 'value', unsub);
};

export const ensureOrganizerAccess = async (code, password) => {
  if (password !== 'Vigontina14!') throw new Error('Password errata');
  const r = ref(realtimeDb, `active-matches/${code}/organizerSession`);
  await set(r, { hasAccess: true, lastSeen: serverTimestamp() });
  return true;
};

export const updateTimerState = async (code, timer) => {
  // timer: { isRunning, seconds }
  const r = ref(realtimeDb, `active-matches/${code}/timer`);
  await update(r, { ...timer, lastUpdate: serverTimestamp() });
};

export const pushRealtimeEvent = async (code, event) => {
  // For append-only feeds you would push to a list; here we keep a compact feed on the client side.
  const r = ref(realtimeDb, `active-matches/${code}/realtime`);
  await update(r, { lastEvent: event, updates: serverTimestamp() });
};
