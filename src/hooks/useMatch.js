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
    updateScore,

    // Lineup operations
    setLineup,

    // Helpers
    getAvailablePlayers,
  };
};