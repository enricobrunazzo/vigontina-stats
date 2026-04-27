// utils/matchUtils.js

// src/utils/matchUtils.js

/**
 * Helpers
 */
const isTechnicalTest = (period) =>
  (period?.name || "").trim().toUpperCase() === "PROVA TECNICA";

const safeNumber = (v) => (Number.isFinite(v) ? v : 0);

// Considera solo periodi completati (non la Prova Tecnica)
const getEffectivePeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => !isTechnicalTest(p) && p.completed === true)
    : [];

/**
 * Competizioni che usano la logica "partita singola":
 * il risultato si determina sui gol totali, non sui punti per tempo.
 */
const SINGLE_MATCH_COMPETITIONS = new Set([
  "Torneo Mirabilandia Festival",
  "Torneo Piove di Sacco",
  "Torneo Dolo",
  "Torneo Cadoneghe",
  "Trofeo della Saccisica - Codevigo",
]);

/**
 * Verifica se la competizione usa la logica "partita singola" (gol totali, no punti per tempo)
 * @param {Object} match
 * @returns {boolean}
 */
const isSingleMatchLogic = (match) =>
  SINGLE_MATCH_COMPETITIONS.has(match?.competition);

/**
 * Calcola i punti totali per una squadra.
 * - Logica standard (tornei a tempi): win=1, draw=1, loss=0 per ogni tempo completato.
 * - Logica partita singola: restituisce i GOL TOTALI,
 *   poiché il risultato si determina sul computo complessivo dei gol, non sui tempi.
 * @param {Object} match - Oggetto partita
 * @param {string} team - 'vigontina' | 'opponent'
 * @returns {number}
 */
export const calculatePoints = (match, team) => {
  if (!match || !match.periods) return 0;

  // Logica partita singola: non ci sono punti per tempo, si mostrano i gol totali
  if (isSingleMatchLogic(match)) {
    return calculateTotalGoals(match, team);
  }

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
      default:
        break;
    }
  }

  const vigontinaGoals = calculateTotalGoals(match, "vigontina");
  const opponentGoals = calculateTotalGoals(match, "opponent");
  // Per le competizioni a logica singola i "points" coincidono con i gol totali
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
 * Determina il risultato della partita.
 * - Logica standard: in base ai PUNTI accumulati per tempo.
 * - Logica partita singola: in base ai GOL TOTALI complessivi.
 * @param {Object} match
 * @returns {{isWin:boolean,isDraw:boolean,isLoss:boolean,resultText:string,resultColor:string,resultBg:string}}
 */
export const getMatchResult = (match) => {
  let isWin, isDraw;

  if (isSingleMatchLogic(match)) {
    // Logica partita singola: risultato basato sui gol totali
    const vigontinaGoals = calculateTotalGoals(match, "vigontina");
    const opponentGoals = calculateTotalGoals(match, "opponent");
    isWin = vigontinaGoals > opponentGoals;
    isDraw = vigontinaGoals === opponentGoals;
  } else {
    // Logica standard: risultato basato sui punti per tempo
    const vigontinaPoints = calculatePoints(match, "vigontina");
    const opponentPoints = calculatePoints(match, "opponent");
    isWin = vigontinaPoints > opponentPoints;
    isDraw = vigontinaPoints === opponentPoints;
  }

  return {
    isWin,
    isDraw,
    isLoss: !isWin && !isDraw,
    resultText: isWin ? "VITTORIA" : isDraw ? "PAREGGIO" : "SCONFITTA",
    resultColor: isWin ? "text-green-700" : isDraw ? "text-yellow-700" : "text-red-700",
    resultBg:
      isWin
        ? "bg-green-50 border-green-200"
        : isDraw
          ? "bg-yellow-50 border-yellow-200"
          : "bg-red-50 border-red-200",
  };
};

/**
 * Crea una nuova struttura partita
 * @param {Object} matchData
 * @returns {Object} Oggetto partita completo
 */
export const createMatchStructure = (matchData) => {
  const isFriendlyLike = matchData?.competition === "Amichevole";
  const isMirabilandia = matchData?.competition === "Torneo Mirabilandia Festival";

  const periods = isMirabilandia
    ? ["1° TEMPO", "2° TEMPO"]
    : isFriendlyLike
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
