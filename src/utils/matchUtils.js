// utils/matchUtils.js

/**
 * Helpers
 */
const isTechnicalTest = (period) =>
  (period?.name || "").trim().toUpperCase() === "PROVA TECNICA";

const isExtraTime = (period) => {
  const name = (period?.name || "").trim().toUpperCase();
  return name === "1° SUPPLEMENTARE" || name === "2° SUPPLEMENTARE";
};

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
  "Torneo Derby Cup Dolo",
  "Trofeo della Saccisica - Codevigo",
]);

/**
 * Competizioni con solo 2 tempi.
 * Timer: 20 minuti per tempo.
 */
export const TWO_HALF_COMPETITIONS = new Set([
  "Torneo Mirabilandia Festival",
  "Torneo Piove di Sacco",
  "Torneo Derby Cup Dolo",
  "Trofeo della Saccisica - Codevigo",
]);

/**
 * Competizioni con 3 tempi + 2 supplementari da 5 min.
 * Timer: 20 minuti per i tempi regolamentari, 5 per i supplementari.
 */
export const THREE_HALF_COMPETITIONS = new Set([
  "Torneo Cadoneghe",
]);

/**
 * Competizioni che prevedono spareggio rigori in caso di parità totale.
 */
export const SHOOTOUT_COMPETITIONS = new Set([
  "Torneo Cadoneghe",
]);

/**
 * Durata in secondi di un periodo dato nome e competizione.
 */
export const getPeriodDuration = (periodName, competition) => {
  const name = (periodName || "").trim().toUpperCase();
  if (
    THREE_HALF_COMPETITIONS.has(competition) &&
    (name === "1° SUPPLEMENTARE" || name === "2° SUPPLEMENTARE")
  ) {
    return 300; // 5 minuti
  }
  if (TWO_HALF_COMPETITIONS.has(competition)) return 1200; // 20 min
  return 1320; // 22 min default
};

const isSingleMatchLogic = (match) =>
  SINGLE_MATCH_COMPETITIONS.has(match?.competition);

/**
 * Verifica se tutti i tempi effettivi (inclusi supplementari se presenti) sono completati.
 */
export const allPeriodsCompleted = (match) => {
  if (!match || !Array.isArray(match.periods)) return false;
  const effective = match.periods.filter((p) => !isTechnicalTest(p));
  return effective.length > 0 && effective.every((p) => p.completed === true);
};

/**
 * Verifica se i soli 3 tempi regolamentari sono tutti completati e in parità
 * (serve per decidere se mostrare il pulsante supplementari — ma ora li aggiungiamo subito,
 * quindi questa funzione non viene più usata per quello scopo).
 */
export const regularPeriodsInDraw = (match) => {
  if (!SHOOTOUT_COMPETITIONS.has(match?.competition)) return false;
  const regular = (match?.periods || []).filter(
    (p) => !isTechnicalTest(p) && !isExtraTime(p) && p.completed === true
  );
  if (regular.length === 0) return false;
  let vp = 0, op = 0;
  for (const p of regular) {
    const v = safeNumber(p.vigontina);
    const o = safeNumber(p.opponent);
    if (v === o) { vp += 1; op += 1; }
    else if (v > o) vp += 1;
    else op += 1;
  }
  return vp === op;
};

/**
 * Verifica se serve lo spareggio rigori:
 * solo dopo che TUTTI i periodi (inclusi supplementari) sono completati e c'è parità.
 */
export const needsShootout = (match) => {
  if (!SHOOTOUT_COMPETITIONS.has(match?.competition)) return false;
  if (!allPeriodsCompleted(match)) return false;
  if (match.shootout) return false;
  const vp = calculatePoints(match, "vigontina");
  const op = calculatePoints(match, "opponent");
  return vp === op;
};

/**
 * Calcola i punti totali per una squadra.
 */
export const calculatePoints = (match, team) => {
  if (!match || !match.periods) return 0;

  if (isSingleMatchLogic(match)) {
    return calculateTotalGoals(match, team);
  }

  let points = 0;
  for (const period of getEffectivePeriods(match)) {
    const v = safeNumber(period.vigontina);
    const o = safeNumber(period.opponent);

    if (v === o) {
      points += 1;
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
 * Per Cadoneghe: se c'è uno spareggio registrato, usa quello per determinare win/loss.
 */
export const getMatchResult = (match) => {
  let isWin, isDraw;

  if (match?.shootout) {
    isWin = match.shootout.winner === "vigontina";
    isDraw = false;
  } else if (isSingleMatchLogic(match)) {
    const vigontinaGoals = calculateTotalGoals(match, "vigontina");
    const opponentGoals = calculateTotalGoals(match, "opponent");
    isWin = vigontinaGoals > opponentGoals;
    isDraw = vigontinaGoals === opponentGoals;
  } else {
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
 * Crea una nuova struttura partita.
 * Cadoneghe: 3 tempi da 20 min + 2 supplementari da 5 min.
 */
export const createMatchStructure = (matchData) => {
  const isFriendlyLike = matchData?.competition === "Amichevole";
  const isTwoHalves = TWO_HALF_COMPETITIONS.has(matchData?.competition);
  const isThreeHalves = THREE_HALF_COMPETITIONS.has(matchData?.competition);

  const periods = isThreeHalves
    ? ["1° TEMPO", "2° TEMPO", "3° TEMPO", "1° SUPPLEMENTARE", "2° SUPPLEMENTARE"]
    : isTwoHalves
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
