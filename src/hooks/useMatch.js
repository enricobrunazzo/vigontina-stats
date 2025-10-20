// hooks/useMatch.js (add lineupPrompted flag handling)
import { useState, useCallback } from "react";
import { PLAYERS } from "../constants/players";
import { createMatchStructure } from "../utils/matchUtils";

export const useMatch = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const createMatch = useCallback((matchData) => {
    const newMatch = createMatchStructure(matchData);
    // init lineupPrompted flags
    newMatch.periods = newMatch.periods.map(p => ({ ...p, lineupPrompted: false, goals: Array.isArray(p.goals)? p.goals : [] }));
    setCurrentMatch(newMatch);
    return newMatch;
  }, []);

  const setPeriod = useCallback((periodIndex) => { setCurrentPeriod(periodIndex); }, []);

  const setLineupPrompted = useCallback((periodIndex, value=true) => {
    setCurrentMatch(prev => {
      const m = { ...prev };
      m.periods = [...prev.periods];
      m.periods[periodIndex] = { ...m.periods[periodIndex], lineupPrompted: !!value };
      return m;
    });
  }, []);

  // ... rest of hook remains unchanged

  return {
    currentMatch,
    currentPeriod,
    createMatch,
    setPeriod,
    setCurrentMatch,
    // expose setter
    setLineupPrompted,
    // other methods are already exported below in the file
  };
};
