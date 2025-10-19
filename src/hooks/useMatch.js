// hooks/useMatch.js
import { useState, useCallback } from "react";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";

/**
 * Hook personalizzato per gestire lo stato e le operazioni della partita corrente
 */
export const useMatch = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  /** Crea una nuova partita */
  const createMatch = useCallback((matchData) => {
    const newMatch = createMatchStructure(matchData);
    setCurrentMatch(newMatch);
    return newMatch;
  }, []);

  /** Resetta la partita corrente */
  const resetMatch = useCallback(() => {
    setCurrentMatch(null);
    setCurrentPeriod(null);
  }, []);

  /** Imposta il periodo corrente */
  const setPeriod = useCallback((periodIndex) => {
    setCurrentPeriod(periodIndex);
  }, []);

  /** Resetta il periodo corrente */
  const resetPeriod = useCallback(() => {
    setCurrentPeriod(null);
  }, []);

  /** Ritorna i dati del periodo corrente */
  const getCurrentPeriodData = useCallback(() => {
    if (!currentMatch || currentPeriod === null) return null;
    return currentMatch.periods[currentPeriod];
  }, [currentMatch, currentPeriod]);

  /** Verifica se il periodo corrente è la Prova Tecnica */
  const isProvaTecnica = useCallback(() => {
    const period = getCurrentPeriodData();
    return period?.name === "PROVA TECNICA";
  }, [getCurrentPeriodData]);

  /** Helper: blocca azioni in Prova Tecnica, mostra avviso e restituisce true se interrompere */
  const guardProvaTecnica = useCallback(
    (actionLabel = "questa azione") => {
      if (isProvaTecnica()) {
        if (typeof window !== "undefined" && window?.alert) {
          window.alert(
            "Nella PROVA TECNICA non sono previsti gol: " +
              actionLabel +
              " è stata ignorata."
          );
        }
        return true;
      }
      return false;
    },
    [isProvaTecnica]
  );

  /** Aggiunge un gol */
  const addGoal = useCallback(
    (scorerNum, assistNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta del gol")) return;

      const goal = {
        scorer: scorerNum,
        scorerName: PLAYERS.find((p) => p.num === scorerNum)?.name,
        assist: assistNum,
        assistName: assistNum ? PLAYERS.find((p) => p.num === assistNum)?.name : null,
        minute: getCurrentMinute(),
        type: "goal",
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, goal],
          vigontina: updated.periods[currentPeriod].vigontina + 1,
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** Aggiunge un autogol - NUOVO: accetta parametro squadra */
  const addOwnGoal = useCallback(
    (team, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta dell'AUTOGOL")) return;

      const ownGoal = {
        minute: getCurrentMinute(),
        type: team === 'vigontina' ? "own-goal" : "opponent-own-goal",
        team: team,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, ownGoal],
          // Autogol: il gol va alla squadra avversaria
          vigontina: team === 'opponent' ? updated.periods[currentPeriod].vigontina + 1 : updated.periods[currentPeriod].vigontina,
          opponent: team === 'vigontina' ? updated.periods[currentPeriod].opponent + 1 : updated.periods[currentPeriod].opponent,
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** Aggiunge un gol dell'avversario */
  const addOpponentGoal = useCallback(
    (getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta del gol avversario")) return;

      const opponentGoal = {
        minute: getCurrentMinute(),
        type: "opponent-goal",
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, opponentGoal],
          opponent: updated.periods[currentPeriod].opponent + 1,
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** Aggiunge un rigore */
  const addPenalty = useCallback(
    (team, scored, scorerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'inserimento del rigore")) return;

      const penalty = {
        minute: getCurrentMinute(),
        type: scored
          ? team === "vigontina"
            ? "penalty-goal"
            : "penalty-opponent-goal"
          : team === "vigontina"
          ? "penalty-missed"
          : "penalty-opponent-missed",
        scorer: scorerNum,
        scorerName: scorerNum ? PLAYERS.find((p) => p.num === scorerNum)?.name : null,
        team: team,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        const period = { ...updated.periods[currentPeriod] };
        period.goals = [...period.goals, penalty];
        if (scored) {
          if (team === "vigontina") period.vigontina++;
          else period.opponent++;
        }
        updated.periods[currentPeriod] = period;
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** NUOVA FUNZIONE: Aggiunge una parata */
  const addSave = useCallback(
    (team, playerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta della parata")) return;

      const save = {
        minute: getCurrentMinute(),
        type: team === "vigontina" ? "save" : "opponent-save",
        team: team,
        player: playerNum,
        playerName: playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, save],
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** NUOVA FUNZIONE: Aggiunge un tiro fuori */
  const addMissedShot = useCallback(
    (team, playerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta del tiro fuori")) return;

      const missedShot = {
        minute: getCurrentMinute(),
        type: team === "vigontina" ? "missed-shot" : "opponent-missed-shot",
        team: team,
        player: playerNum,
        playerName: playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, missedShot],
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** NUOVA FUNZIONE: Aggiunge palo/traversa */
  const addPostCrossbar = useCallback(
    (type, team, playerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica(`l'aggiunta del ${type}`)) return;

      const postCrossbar = {
        minute: getCurrentMinute(),
        type: `${type}-${team}`, // "palo-vigontina", "palo-opponent", "traversa-vigontina", "traversa-opponent"
        hitType: type, // "palo" o "traversa"
        team: team,
        player: playerNum,
        playerName: playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, postCrossbar],
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  /** NUOVA FUNZIONE: Elimina un evento */
  const deleteEvent = useCallback(
    (periodIndex, eventIndex, reason = null) => {
      if (currentMatch === null || periodIndex === null) return;
      
      const period = currentMatch.periods[periodIndex];
      if (!period || !period.goals || eventIndex >= period.goals.length) return;
      
      const event = period.goals[eventIndex];
      if (!event) return;
      
      // Verifica se l'evento influisce sul punteggio
      const isGoalEvent = event.type?.includes('goal') || event.type?.includes('penalty');
      
      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        const updatedPeriod = { ...updated.periods[periodIndex] };
        
        // Rimuovi l'evento dalla lista
        updatedPeriod.goals = updatedPeriod.goals.filter((_, idx) => idx !== eventIndex);
        
        // Aggiorna il punteggio se necessario
        if (isGoalEvent && !event.type.includes('missed')) {
          // Determina quale squadra aveva segnato per decrementare il punteggio corretto
          if (event.type === 'goal' || event.type === 'penalty-goal' || event.type === 'opponent-own-goal') {
            // Era un gol per la Vigontina
            updatedPeriod.vigontina = Math.max(0, updatedPeriod.vigontina - 1);
          } else if (event.type === 'opponent-goal' || event.type === 'penalty-opponent-goal' || event.type === 'own-goal') {
            // Era un gol per l'avversario
            updatedPeriod.opponent = Math.max(0, updatedPeriod.opponent - 1);
          }
        }
        
        updated.periods[periodIndex] = updatedPeriod;
        return updated;
      });
      
      // Mostra conferma con motivazione se fornita
      if (reason && isGoalEvent) {
        setTimeout(() => {
          if (typeof window !== "undefined" && window?.alert) {
            window.alert(`Evento eliminato: ${reason}`);
          }
        }, 100);
      }
    },
    [currentMatch]
  );

  /** Aggiorna manualmente il punteggio */
const updateScore = useCallback(
  (team, delta) => {
    if (currentMatch === null || currentPeriod === null) return;
    // ✅ RIMOSSO guardProvaTecnica - updateScore DEVE funzionare nella PT!

    setCurrentMatch((prev) => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      const period = { ...updated.periods[currentPeriod] };
      if (team === "vigontina") {
        period.vigontina = Math.max(0, period.vigontina + delta);
      } else {
        period.opponent = Math.max(0, period.opponent + delta);
      }
      updated.periods[currentPeriod] = period;
      return updated;
    });
  },
  [currentMatch, currentPeriod] // ✅ Rimosso guardProvaTecnica dalla dependency
);

  /** Imposta la formazione per un periodo */
  const setLineup = useCallback((periodIndex, lineupNums) => {
    setCurrentMatch((prev) => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      updated.periods[periodIndex] = {
        ...updated.periods[periodIndex],
        lineup: lineupNums,
      };
      return updated;
    });
  }, []);

  /** Completa un periodo */
  const completePeriod = useCallback(() => {
    if (currentMatch === null || currentPeriod === null) return false;

    const period = currentMatch.periods[currentPeriod];
    const isPT = period.name === "PROVA TECNICA";
    const confirmMessage = isPT
      ? "Confermi di voler terminare la Prova Tecnica?"
      : "Confermi di voler terminare questo tempo? Il timer verrà azzerato.";

    if (!window.confirm(confirmMessage)) return false;

    setCurrentMatch((prev) => {
      const updated = { ...prev };
      updated.periods = [...prev.periods];
      updated.periods[currentPeriod] = {
        ...updated.periods[currentPeriod],
        completed: true,
      };
      return updated;
    });
    return true;
  }, [currentMatch, currentPeriod]);

  /** Ottiene i giocatori disponibili (non convocati esclusi) */
  const getAvailablePlayers = useCallback(() => {
    if (!currentMatch) return PLAYERS;
    return PLAYERS.filter((p) => !currentMatch.notCalled?.includes(p.num));
  }, [currentMatch]);

  /** Titolo del periodo corrente */
  const getCurrentPeriodTitle = useCallback(() => {
    const period = getCurrentPeriodData();
    if (!period) return "";
    if (period.name === "PROVA TECNICA") return "Prova Tecnica";
    const periodNumberMatch = period.name.match(/(\d+)°/);
    const periodNumber = periodNumberMatch ? periodNumberMatch[1] : "";
    return `${periodNumber}° Tempo`;
  }, [getCurrentPeriodData]);

  return {
    // State
    currentMatch,
    currentPeriod,

    // Match operations
    createMatch,
    resetMatch,
    setCurrentMatch,

    // Period operations
    setPeriod,
    resetPeriod,
    completePeriod,
    getCurrentPeriodData,
    getCurrentPeriodTitle,
    isProvaTecnica,

    // Event operations
    addGoal,
    addOwnGoal,
    addOpponentGoal,
    addPenalty,
    addSave,        // NUOVO
    addMissedShot,  // NUOVO
    addPostCrossbar, // NUOVO
    deleteEvent,    // NUOVO
    updateScore,

    // Lineup operations
    setLineup,

    // Helpers
    getAvailablePlayers,
  };
};