// hooks/useTimer.js (migrated to Realtime Database)
import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, update, remove, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../config/firebase";
import { getActiveMatchCode } from "./cloudPersistence";

const TIMER_DURATION = 1200; // 20 minuti in secondi

export const useTimer = () => {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Helpers RTDB
  const getTimerRef = useCallback(() => {
    const code = getActiveMatchCode();
    return code ? ref(realtimeDb, `active-matches/${code}/timer`) : null;
  }, []);

  const loadTimerState = useCallback(async () => {
    try {
      const r = getTimerRef();
      if (!r) return;
      // one-shot read via onValue with { onlyOnce: true } alternative is get(), but keep onValue for consistency
      await new Promise((resolve) => {
        const unsub = onValue(r, (snap) => {
          const data = snap.exists() ? snap.val() : null;
          if (data?.isRunning && data?.startTime) {
            setTimerStartTime(data.startTime);
            setIsTimerRunning(true);
            const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
            setTimerSeconds(Math.min(elapsed, TIMER_DURATION));
          }
          unsub();
          resolve();
        });
      });
    } catch (error) {
      console.error("Errore caricamento timer (RTDB):", error);
    }
  }, [getTimerRef]);

  const saveTimerState = useCallback(async (startTime, running) => {
    try {
      const r = getTimerRef();
      if (!r) return;
      await update(r, { startTime, isRunning: running, lastUpdate: serverTimestamp() });
    } catch (error) {
      console.error("Errore salvataggio timer (RTDB):", error);
    }
  }, [getTimerRef]);

  const clearTimerState = useCallback(async () => {
    try {
      const r = getTimerRef();
      if (!r) return;
      await remove(r);
    } catch (error) {
      console.error("Errore eliminazione timer (RTDB):", error);
    }
  }, [getTimerRef]);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log("Wake Lock error:", err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    const startTime = Date.now() - timerSeconds * 1000;
    setTimerStartTime(startTime);
    setIsTimerRunning(true);
    saveTimerState(startTime, true);
  }, [timerSeconds, saveTimerState]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
    saveTimerState(timerStartTime, false);
  }, [timerStartTime, saveTimerState]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    clearTimerState();
  }, [clearTimerState]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getCurrentMinute = useCallback(() => Math.floor(timerSeconds / 60), [timerSeconds]);

  useEffect(() => {
    if (isTimerRunning && timerStartTime) {
      requestWakeLock();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        if (elapsed >= TIMER_DURATION) {
          setTimerSeconds(TIMER_DURATION);
          setIsTimerRunning(false);
          clearTimerState();
          alert("⏰ FINE TEMPO!\n\nIl tempo è scaduto.");
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        } else {
          setTimerSeconds(elapsed);
        }
      }, 100);
    } else {
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timerStartTime, clearTimerState]);

  useEffect(() => { return () => { releaseWakeLock(); }; }, []);

  return {
    timerSeconds,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime,
    getCurrentMinute,
    loadTimerState,
  };
};
