// hooks/useMatch.js - Versione completa ripristinata
import { useState, useCallback } from "react";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";

export const useMatch = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const createMatch = useCallback((matchData) => {
    const newMatch = createMatchStructure(matchData);
    // Inizializza flag lineupPrompted per evitare richieste continue
    newMatch.periods = newMatch.periods.map(p => ({ 
      ...p, 
      lineupPrompted: false, 
      goals: Array.isArray(p.goals) ? p.goals : [] 
    }));
    setCurrentMatch(newMatch);
    return newMatch;
  }, []);

  const resetMatch = useCallback(() => {
    setCurrentMatch(null);
    setCurrentPeriod(null);
  }, []);

  const setPeriod = useCallback((periodIndex) => {
    setCurrentPeriod(periodIndex);
  }, []);

  const resetPeriod = useCallback(() => {
    setCurrentPeriod(null);
  }, []);

  const setLineupPrompted = useCallback((periodIndex, value = true) => {
    setCurrentMatch(prev => {
      if (!prev || !prev.periods[periodIndex]) return prev;
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      updated.periods[periodIndex] = { 
        ...updated.periods[periodIndex], 
        lineupPrompted: !!value 
      };
      return updated;
    });
  }, []);

  const setLineup = useCallback((periodIndex, lineup) => {
    setCurrentMatch(prev => {
      if (!prev || !prev.periods[periodIndex]) return prev;
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      updated.periods[periodIndex] = { 
        ...updated.periods[periodIndex], 
        lineup: Array.isArray(lineup) ? lineup : [],
        lineupPrompted: true // Marca come già richiesta
      };
      return updated;
    });
  }, []);

  const completePeriod = useCallback(() => {
    if (!currentMatch || currentPeriod === null) return false;
    
    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      updated.periods[currentPeriod] = { 
        ...updated.periods[currentPeriod], 
        completed: true 
      };
      return updated;
    });
    return true;
  }, [currentMatch, currentPeriod]);

  // Helper per determinare se è prova tecnica
  const isProvaTecnica = useCallback(() => {
    if (!currentMatch || currentPeriod === null) return false;
    const period = currentMatch.periods[currentPeriod];
    return period?.name === "PROVA TECNICA";
  }, [currentMatch, currentPeriod]);

  const addGoal = useCallback((scorerNum, assistNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;
    
    // Blocca gol nella prova tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti gol: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const goal = {
      scorer: scorerNum,
      scorerName: PLAYERS.find((p) => p.num === scorerNum)?.name,
      assist: assistNum,
      assistName: assistNum ? PLAYERS.find((p) => p.num === assistNum)?.name : null,
      minute,
      type: 'goal',
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, goal];
      period.vigontina = (period.vigontina || 0) + 1;
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod, isProvaTecnica]);

  const addOpponentGoal = useCallback((getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;
    
    // Blocca gol nella prova tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti gol: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const goal = {
      minute,
      type: 'opponent-goal',
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, goal];
      period.opponent = (period.opponent || 0) + 1;
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod, isProvaTecnica]);

  const addOwnGoal = useCallback((team, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;
    
    // Blocca gol nella prova tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti autogol: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const goal = {
      minute,
      type: team === 'vigontina' ? 'own-goal' : 'opponent-own-goal',
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, goal];
      
      // Autogol vigontina = punto avversario, autogol avversario = punto vigontina
      if (team === 'vigontina') {
        period.opponent = (period.opponent || 0) + 1;
      } else {
        period.vigontina = (period.vigontina || 0) + 1;
      }
      
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod, isProvaTecnica]);

  const addPenalty = useCallback((team, scored, scorerNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;
    
    // Blocca rigori nella prova tecnica
    if (isProvaTecnica()) {
      alert("Nella PROVA TECNICA non sono previsti rigori: usa i pulsanti +/- per i punti.");
      return;
    }

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const scorerName = scorerNum ? PLAYERS.find((p) => p.num === scorerNum)?.name : null;
    
    const penalty = {
      minute,
      type: scored 
        ? (team === 'vigontina' ? 'penalty-goal' : 'penalty-opponent-goal')
        : (team === 'vigontina' ? 'penalty-missed' : 'penalty-opponent-missed'),
      scorer: scorerNum,
      scorerName,
      team,
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, penalty];
      
      if (scored) {
        if (team === 'vigontina') {
          period.vigontina = (period.vigontina || 0) + 1;
        } else {
          period.opponent = (period.opponent || 0) + 1;
        }
      }
      
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod, isProvaTecnica]);

  // Metodo per aggiornare punteggio manualmente (per prova tecnica)
  const updateScore = useCallback((team, delta) => {
    if (!currentMatch || currentPeriod === null) return;

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      
      if (team === "vigontina") {
        period.vigontina = Math.max(0, (period.vigontina || 0) + delta);
      } else {
        period.opponent = Math.max(0, (period.opponent || 0) + delta);
      }
      
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  // Aggiungi altri metodi per azioni salienti
  const addSave = useCallback((team, playerNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const playerName = playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null;
    
    const save = {
      minute,
      type: team === 'vigontina' ? 'save' : 'opponent-save',
      player: playerNum,
      playerName,
      team,
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, save];
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  const addMissedShot = useCallback((team, playerNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const playerName = playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null;
    
    const missedShot = {
      minute,
      type: team === 'vigontina' ? 'missed-shot' : 'opponent-missed-shot',
      player: playerNum,
      playerName,
      team,
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, missedShot];
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  const addShotBlocked = useCallback((team, playerNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const playerName = playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null;
    
    const shotBlocked = {
      minute,
      type: team === 'vigontina' ? 'shot-blocked' : 'opponent-shot-blocked',
      player: playerNum,
      playerName,
      team,
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, shotBlocked];
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  const addPostCrossbar = useCallback((type, team, playerNum, getCurrentMinute) => {
    if (!currentMatch || currentPeriod === null) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const playerName = playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null;
    
    const hit = {
      minute,
      type: `${type}-${team}`,
      hitType: type,
      player: playerNum,
      playerName,
      team,
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, hit];
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  const addSubstitution = useCallback((periodIndex, outPlayerNum, inPlayerNum, getCurrentMinute) => {
    if (!currentMatch) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const outPlayer = PLAYERS.find((p) => p.num === outPlayerNum);
    const inPlayer = PLAYERS.find((p) => p.num === inPlayerNum);
    
    // FIXED: Create plain objects with only primitive values for Firebase compatibility
    const substitution = {
      minute,
      type: 'substitution',
      out: { 
        num: outPlayerNum, 
        name: outPlayer?.name || "" 
      },
      in: { 
        num: inPlayerNum, 
        name: inPlayer?.name || "" 
      },
      timestamp: Date.now()
    };

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[periodIndex] };
      
      // Aggiorna lineup
      const newLineup = [...(period.lineup || [])];
      const outIndex = newLineup.indexOf(outPlayerNum);
      if (outIndex !== -1) {
        newLineup[outIndex] = inPlayerNum;
      }
      
      period.lineup = newLineup;
      period.goals = [...period.goals, substitution];
      updated.periods[periodIndex] = period;
      return updated;
    });
  }, [currentMatch]);

  const addFreeKick = useCallback((outcome, team, playerNum, getCurrentMinute, hitType) => {
    if (!currentMatch || currentPeriod === null) return;

    const minute = typeof getCurrentMinute === 'function' ? getCurrentMinute() : 0;
    const playerName = playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null;
    
    const base = `free-kick-${outcome}`;
    const type = team === 'opponent' ? `${base}-opponent` : base;

    const freeKick = {
      minute,
      type,
      player: playerNum,
      playerName,
      team,
      timestamp: Date.now()
    };

    if (outcome === 'hit' && hitType) {
      freeKick.hitType = hitType; // 'palo' | 'traversa'
    }

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      period.goals = [...period.goals, freeKick];
      updated.periods[currentPeriod] = period;
      return updated;
    });
  }, [currentMatch, currentPeriod]);

  const deleteEvent = useCallback((periodIndex, eventIndex, reason) => {
    if (!currentMatch) return;

    setCurrentMatch(prev => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[periodIndex] };
      const events = [...period.goals];
      
      if (events[eventIndex]) {
        events[eventIndex] = {
          ...events[eventIndex],
          deletionReason: reason,
          deletedAt: Date.now()
        };
        
        // Se era un gol, rimuovi il punto
        const event = events[eventIndex];
        if (['goal', 'penalty-goal', 'opponent-own-goal'].includes(event.type)) {
          period.vigontina = Math.max(0, (period.vigontina || 0) - 1);
        } else if (['opponent-goal', 'penalty-opponent-goal', 'own-goal'].includes(event.type)) {
          period.opponent = Math.max(0, (period.opponent || 0) - 1);
        }
      }
      
      period.goals = events;
      updated.periods[periodIndex] = period;
      return updated;
    });
  }, [currentMatch]);

  return {
    currentMatch,
    currentPeriod,
    createMatch,
    resetMatch,
    setPeriod,
    resetPeriod,
    setCurrentMatch,
    setLineupPrompted,
    setLineup,
    completePeriod,
    addGoal,
    addOpponentGoal,
    addOwnGoal,
    addPenalty,
    updateScore,
    addSave,
    addMissedShot,
    addShotBlocked,
    addPostCrossbar,
    addSubstitution,
    addFreeKick,
    deleteEvent,
    isProvaTecnica
  };
};