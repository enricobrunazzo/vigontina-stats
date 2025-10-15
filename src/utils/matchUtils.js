// utils/matchUtils.js

// src/utils/matchUtils.js

/**
 * Helpers
 */
const isTechnicalTest = (period) =>
  (period?.name || "").trim().toUpperCase() === "PROVA TECNICA";

const safeNumber = (v) => (Number.isFinite(v) ? v : 0);

// ✅ FIX: Considera solo periodi completati (non la Prova Tecnica)
const getEffectivePeriods = (match) =>
  Array.isArray(match?.periods) 
    ? match.periods.filter((p) => !isTechnicalTest(p) && p.completed === true) 
    : [];

/**
 * Calcola i punti totali per una squadra (regola: win=1, draw=1, loss=0).
 * @param {Object} match - Oggetto partita
 * @param {string} team - 'vigontina' | 'opponent'
 * @returns {number}
 */
export const calculatePoints = (match, team) => {
  if (!match || !match.periods) return 0;
  let points = 0;

  for (const period of getEffectivePeriods(match)) {
    const v = safeNumber(period.vigontina);
    const o = safeNumber(period.opponent);

    if (v === o) {
      points += 1; // pareggio: 1 punto ad entrambe
    } else if (v > o) {
      points += team === "vigontina" ? 1 : 0;
    } else {
      points += team === "opponent" ? 1 : 0;
    }
  }

  return points;
};

/**
 * Calcola i gol totali per una squadra (escludendo la PROVA TECNICA)
 * @param {Object} match
 * @param {string} team - 'vigontina' | 'opponent'
 * @returns {number}
 */
export const calculateTotalGoals = (match, team) => {
  if (!match || !match.periods) return 0;

  return getEffectivePeriods(match).reduce((sum, period) => {
    const v = safeNumber(period.vigontina);
    const o = safeNumber(period.opponent);
    return sum + (team === "vigontina" ? v : o);
  }, 0);
};

/**
 * Calcola le statistiche di una partita (escludendo la PROVA TECNICA dagli eventi)
 * @param {Object} match
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

  // Escludiamo PROVA TECNICA anche dal tracciamento degli eventi
  const allGoals = match.periods
    .filter((p) => !isTechnicalTest(p))
    .flatMap((period) =>
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

  for (const event of allGoals) {
    switch (event.type) {
      case "goal": {
        if (event.scorer != null) {
          const num = parseInt(event.scorer, 10);
          if (Number.isFinite(num)) scorers[num] = (scorers[num] || 0) + 1;
        }
        if (event.assist != null) {
          const a = parseInt(event.assist, 10);
          if (Number.isFinite(a)) assisters[a] = (assisters[a] || 0) + 1;
        }
        break;
      }
      case "penalty-goal": {
        if (event.scorer != null) {
          const num = parseInt(event.scorer, 10);
          if (Number.isFinite(num)) scorers[num] = (scorers[num] || 0) + 1;
        }
        penaltiesScored += 1;
        break;
      }
      case "penalty-missed": {
        if (event.team === "vigontina") penaltiesMissed += 1;
        break;
      }
      case "own-goal": {
        ownGoalsCount += 1;
        break;
      }
      // Eventi dell'avversario non impattano marcatori/assist della Vigontina
      default:
        break;
    }
  }

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
 * Determina il risultato della partita (in base ai PUNTI)
 * @param {Object} match
 * @returns {{isWin:boolean,isDraw:boolean,isLoss:boolean,resultText:string,resultColor:string,resultBg:string}}
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
 * @param {Object} matchData
 * @returns {Object} Oggetto partita completo
 */
export const createMatchStructure = (matchData) => {
  const periods =
    matchData.competition === "Amichevole"
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