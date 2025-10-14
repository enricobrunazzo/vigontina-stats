// hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const TIMER_DURATION = 1200; // 20 minuti in secondi

export const useTimer = () => {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Carica lo stato del timer da Firebase all'avvio
  const loadTimerState = useCallback(async () => {
    try {
      const q = query(collection(db, "activeTimer"));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const timerData = querySnapshot.docs[0].data();
        
        if (timerData.isRunning) {
          setTimerStartTime(timerData.startTime);
          setIsTimerRunning(true);
          const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
          setTimerSeconds(Math.min(elapsed, TIMER_DURATION));
        }
      }
    } catch (error) {
      console.error("Errore caricamento timer:", error);
    }
  }, []);

  // Salva lo stato del timer su Firebase
  const saveTimerState = async (startTime, isRunning) => {
    try {
      const q = query(collection(db, "activeTimer"));
      const querySnapshot = await getDocs(q);
      
      const timerData = {
        startTime: startTime,
        isRunning: isRunning,
        lastUpdate: Date.now(),
      };

      if (querySnapshot.empty) {
        await addDoc(collection(db, "activeTimer"), timerData);
      } else {
        const timerDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "activeTimer", timerDoc.id), timerData);
      }
    } catch (error) {
      console.error("Errore salvataggio timer:", error);
    }
  };

  // Elimina lo stato del timer da Firebase
  const clearTimerState = async () => {
    try {
      const q = query(collection(db, "activeTimer"));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const timerDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, "activeTimer", timerDoc.id));
      }
    } catch (error) {
      console.error("Errore eliminazione timer:", error);
    }
  };

  // Richiede il wake lock per mantenere lo schermo acceso
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log("Wake Lock error:", err);
    }
  };

  // Rilascia il wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Avvia il timer
  const startTimer = useCallback(() => {
    const startTime = Date.now() - timerSeconds * 1000;
    setTimerStartTime(startTime);
    setIsTimerRunning(true);
    saveTimerState(startTime, true);
  }, [timerSeconds]);

  // Mette in pausa il timer
  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
    saveTimerState(timerStartTime, false);
  }, [timerStartTime]);

  // Resetta il timer
  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    clearTimerState();
  }, []);

  // Formatta il tempo in MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Ottiene il minuto corrente
  const getCurrentMinute = useCallback(() => Math.floor(timerSeconds / 60), [timerSeconds]);

  // Effetto per gestire il tick del timer e il wake lock
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
          
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
        } else {
          setTimerSeconds(elapsed);
        }
      }, 100);
    } else {
      releaseWakeLock();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timerStartTime]);

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

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