// utils/matchUtils.js

/**
 * Calcola i punti totali per una squadra
 * @param {Object} match - Oggetto partita
 * @param {string} team - 'vigontina' o 'opponent'
 * @returns {number} Punti totali
 */
export const calculatePoints = (match, team) => {
  if (!match || !match.periods) return 0;

  let points = 0;
  match.periods.forEach((period) => {
    // Escludi la Prova Tecnica dal conteggio punti
    if (period.name === "PROVA TECNICA") return;
    // Salta se non ci sono gol
    if (period.vigontina === 0 && period.opponent === 0) return;

    if (team === "vigontina") {
      if (period.vigontina > period.opponent) points++;
      else if (period.vigontina === period.opponent) points++;
    } else {
      if (period.opponent > period.vigontina) points++;
      else if (period.opponent === period.vigontina) points++;
    }
  });

  return points;
};

/**
 * Calcola i gol totali per una squadra (escludendo la Prova Tecnica)
 * @param {Object} match - Oggetto partita
 * @param {string} team - 'vigontina' o 'opponent'
 * @returns {number} Gol totali
 */
export const calculateTotalGoals = (match, team) => {
  if (!match || !match.periods) return 0;

  return match.periods.reduce((sum, period) => {
    // Escludi la Prova Tecnica dal conteggio gol
    if (period.name === "PROVA TECNICA") return sum;

    return sum + (team === "vigontina" ? period.vigontina : period.opponent);
  }, 0);
};

/**
 * Calcola le statistiche di una partita
 * @param {Object} match - Oggetto partita
 * @returns {Object} Statistiche complete
 */
export const calculateMatchStats = (match) => {
  if (!match || !match.periods) {
    return {
      allGoals: [],
      scorers: {},
      assisters: {},
      ownGoalsCount: 0,
      penaltiesScored: 0,
      penaltiesMissed: 0,
      vigontinaGoals: 0,
      opponentGoals: 0,
      vigontinaPoints: 0,
      opponentPoints: 0,
    };
  }

  const allGoals = match.periods.flatMap((period) =>
    (period.goals || []).map((goal) => ({
      ...goal,
      period: period.name,
    }))
  );

  const scorers = {};
  const assisters = {};
  let ownGoalsCount = 0;
  let penaltiesScored = 0;
  let penaltiesMissed = 0;

  allGoals.forEach((event) => {
    if (event.type === "goal") {
      if (event.scorer) {
        scorers[event.scorer] = (scorers[event.scorer] || 0) + 1;
      }
      if (event.assist) {
        assisters[event.assist] = (assisters[event.assist] || 0) + 1;
      }
    } else if (event.type === "own-goal") {
      ownGoalsCount++;
    } else if (event.type === "penalty-goal") {
      if (event.scorer) {
        scorers[event.scorer] = (scorers[event.scorer] || 0) + 1;
      }
      penaltiesScored++;
    } else if (event.type === "penalty-missed") {
      penaltiesMissed++;
    }
  });

  const vigontinaGoals = calculateTotalGoals(match, "vigontina");
  const opponentGoals = calculateTotalGoals(match, "opponent");
  const vigontinaPoints = calculatePoints(match, "vigontina");
  const opponentPoints = calculatePoints(match, "opponent");

  return {
    allGoals,
    scorers,
    assisters,
    ownGoalsCount,
    penaltiesScored,
    penaltiesMissed,
    vigontinaGoals,
    opponentGoals,
    vigontinaPoints,
    opponentPoints,
  };
};

/**
 * Determina il risultato della partita
 * @param {Object} match - Oggetto partita
 * @returns {Object} Risultato con testo, colore e background
 */
export const getMatchResult = (match) => {
  const vigontinaPoints = calculatePoints(match, "vigontina");
  const opponentPoints = calculatePoints(match, "opponent");

  const isWin = vigontinaPoints > opponentPoints;
  const isDraw = vigontinaPoints === opponentPoints;

  return {
    isWin,
    isDraw,
    isLoss: !isWin && !isDraw,
    resultText: isWin ? "VITTORIA" : isDraw ? "PAREGGIO" : "SCONFITTA",
    resultColor: isWin ? "text-green-700" : isDraw ? "text-yellow-700" : "text-red-700",
    resultBg: isWin ? "bg-green-50 border-green-200" : isDraw ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200",
  };
};

/**
 * Crea una nuova struttura partita
 * @param {Object} matchData - Dati iniziali della partita
 * @returns {Object} Oggetto partita completo
 */
export const createMatchStructure = (matchData) => {
  const periods = matchData.competition === "Amichevole"
    ? ["1° TEMPO", "2° TEMPO", "3° TEMPO", "4° TEMPO"]
    : ["PROVA TECNICA", "1° TEMPO", "2° TEMPO", "3° TEMPO", "4° TEMPO"];

  return {
    ...matchData,
    periods: periods.map((name) => ({
      name,
      vigontina: 0,
      opponent: 0,
      goals: [],
      completed: false,
      lineup: [],
    })),
    timestamp: Date.now(),
  };
};