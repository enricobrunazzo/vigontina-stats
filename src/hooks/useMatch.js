// hooks/useMatch.js
import { useState, useCallback } from "react";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";

export const useMatch = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const createMatch = useCallback((matchData) => {
    const newMatch = createMatchStructure(matchData);
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

  const getCurrentPeriodData = useCallback(() => {
    if (!currentMatch || currentPeriod === null) return null;
    return currentMatch.periods[currentPeriod];
  }, [currentMatch, currentPeriod]);

  const isProvaTecnica = useCallback(() => {
    const period = getCurrentPeriodData();
    return period?.name === "PROVA TECNICA";
  }, [getCurrentPeriodData]);

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
          vigontina: team === 'opponent' ? updated.periods[currentPeriod].vigontina + 1 : updated.periods[currentPeriod].vigontina,
          opponent: team === 'vigontina' ? updated.periods[currentPeriod].opponent + 1 : updated.periods[currentPeriod].opponent,
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

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

  // NUOVO: Handler per tiri parati
  const addShotBlocked = useCallback(
    (team, playerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica("l'aggiunta del tiro parato")) return;

      const shotBlocked = {
        minute: getCurrentMinute(),
        type: team === "vigontina" ? "shot-blocked" : "opponent-shot-blocked",
        team: team,
        player: playerNum,
        playerName: playerNum ? PLAYERS.find((p) => p.num === playerNum)?.name : null,
      };

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        updated.periods[currentPeriod] = {
          ...updated.periods[currentPeriod],
          goals: [...updated.periods[currentPeriod].goals, shotBlocked],
        };
        return updated;
      });
    },
    [currentMatch, currentPeriod, guardProvaTecnica]
  );

  const addPostCrossbar = useCallback(
    (type, team, playerNum, getCurrentMinute) => {
      if (currentMatch === null || currentPeriod === null) return;
      if (guardProvaTecnica(`l'aggiunta del ${type}`)) return;

      const postCrossbar = {
        minute: getCurrentMinute(),
        type: `${type}-${team}`,
        hitType: type,
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

  // Elimina evento: SOLO i gol annullati restano visibili con barratura; gli altri eventi vengono rimossi
  const deleteEvent = useCallback(
    (periodIndex, eventIndex, reason = null) => {
      if (currentMatch === null || periodIndex === null) return;
      const period = currentMatch.periods[periodIndex];
      if (!period || !period.goals || eventIndex >= period.goals.length) return;
      const event = period.goals[eventIndex];
      if (!event) return;

      const isScoringEvent = event.type === 'goal' || event.type === 'penalty-goal' || event.type === 'opponent-own-goal' || event.type === 'opponent-goal' || event.type === 'penalty-opponent-goal' || event.type === 'own-goal';
      const isGoalForVigontina = event.type === 'goal' || event.type === 'penalty-goal' || event.type === 'opponent-own-goal';
      const isGoalForOpponent = event.type === 'opponent-goal' || event.type === 'penalty-opponent-goal' || event.type === 'own-goal';

      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        const updPeriod = { ...updated.periods[periodIndex] };

        if (isScoringEvent) {
          // 1) Scala il punteggio
          if (isGoalForVigontina) updPeriod.vigontina = Math.max(0, updPeriod.vigontina - 1);
          if (isGoalForOpponent) updPeriod.opponent = Math.max(0, updPeriod.opponent - 1);

          // 2) Mantieni l'evento ma segnalo annullato
          updPeriod.goals = [...updPeriod.goals];
          updPeriod.goals[eventIndex] = {
            ...event,
            deletionReason: reason || "Annullato",
            deleted: true,
          };
        } else {
          // Eventi non-di-rete: rimuovi dalla lista
          updPeriod.goals = updPeriod.goals.filter((_, idx) => idx !== eventIndex);
        }

        updated.periods[periodIndex] = updPeriod;
        return updated;
      });
    },
    [currentMatch]
  );

  const updateScore = useCallback(
    (team, delta) => {
      if (currentMatch === null || currentPeriod === null) return;
      setCurrentMatch((prev) => {
        const updated = { ...prev };
        updated.periods = [...prev.periods];
        const period = { ...updated.periods[currentPeriod] };
        if (team === "vigontina") period.vigontina = Math.max(0, period.vigontina + delta);
        else period.opponent = Math.max(0, period.opponent + delta);
        updated.periods[currentPeriod] = period;
        return updated;
      });
    },
    [currentMatch, currentPeriod]
  );

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
      updated.periods[currentPeriod] = { ...updated.periods[currentPeriod], completed: true };
      return updated;
    });
    return true;
  }, [currentMatch, currentPeriod]);

  const getAvailablePlayers = useCallback(() => {
    if (!currentMatch) return PLAYERS;
    return PLAYERS.filter((p) => !currentMatch.notCalled?.includes(p.num));
  }, [currentMatch]);

  const getCurrentPeriodTitle = useCallback(() => {
    const period = getCurrentPeriodData();
    if (!period) return "";
    if (period.name === "PROVA TECNICA") return "Prova Tecnica";
    const periodNumberMatch = period.name.match(/(\d+)°/);
    const periodNumber = periodNumberMatch ? periodNumberMatch[1] : "";
    return `${periodNumber}° Tempo`;
  }, [getCurrentPeriodData]);

  return {
    currentMatch,
    currentPeriod,
    createMatch,
    resetMatch,
    setCurrentMatch,
    setPeriod,
    resetPeriod,
    completePeriod,
    getCurrentPeriodData,
    getCurrentPeriodTitle,
    isProvaTecnica,
    addGoal,
    addOwnGoal,
    addOpponentGoal,
    addPenalty,
    addSave,
    addMissedShot,
    addShotBlocked, // NUOVO
    addPostCrossbar,
    deleteEvent,
    updateScore,
    setLineup,
    getAvailablePlayers,
  };
};