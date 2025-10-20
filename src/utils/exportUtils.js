// utils/exportUtils.js (patch for labels)
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { PLAYERS } from "../constants/players";
import { calculatePoints, calculateTotalGoals, calculateMatchStats, getMatchResult } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

function periodOutcome(period, opponentName = "Avversari") {
  const v = safeNum(period.vigontina); const o = safeNum(period.opponent);
  if (v === o) return { label: "Pareggio", winner: "draw" };
  if (v > o) return { label: "Vigontina", winner: "vigontina" };
  return { label: opponentName, winner: "opponent" };
}

function eventLabel(e, opponentName = "Avversari") {
  const min = e.minute != null ? `${e.minute}'` : "";
  const scorer = e.scorerName || e.scorer || "";
  const assistName = e.assistName || e.assist || "";
  const isHit = e.type?.includes('palo-') || e.type?.includes('traversa-') || e.type?.includes('free-kick-') && (e.hitType==='palo' || e.hitType==='traversa');
  const hitLabel = e.hitType === 'palo' ? 'Palo' : e.hitType === 'traversa' ? 'Traversa' : null;
  // Free-kick mapping
  if (e.type?.startsWith('free-kick')) {
    const isOpp = e.type.includes('opponent');
    if (e.type.includes('missed')) return `${min} - Punizione fuori ${isOpp ? opponentName : (e.player ? `${e.player} ${e.playerName||''}`.trim() : '')}`.trim();
    if (e.type.includes('saved')) return `${min} - Punizione parata ${isOpp ? opponentName : (e.player ? `${e.player} ${e.playerName||''}`.trim() : '')}`.trim();
    if (e.type.includes('hit')) return `${min} - Punizione ${hitLabel || 'Legno'} ${isOpp ? opponentName : (e.player ? `${e.player} ${e.playerName||''}`.trim() : '')}`.trim();
  }
  if (e.type === "substitution") {
    return `${min} - Sostituzione: ${e.out?.num} ${e.out?.name} → ${e.in?.num} ${e.in?.name}`;
  }
  switch (e.type) {
    case "goal": { const base = `${min} - Gol ${scorer}`.trim(); return assistName ? `${base} (assist ${assistName})` : base; }
    case "own-goal": return `${min} - Autogol Vigontina (gol a ${opponentName})`;
    case "opponent-own-goal": return `${min} - Autogol ${opponentName} (gol a Vigontina)`;
    case "opponent-goal": return `${min} - Gol ${opponentName}`;
    case "penalty-goal": { const base = `${min} - Gol (Rig.) ${scorer}`.trim(); return assistName ? `${base} (assist ${assistName})` : base; }
    case "penalty-missed": return `${min} - Rigore fallito Vigontina`;
    case "penalty-opponent-goal": return `${min} - Gol (Rig.) ${opponentName}`;
    case "penalty-opponent-missed": return `${min} - Rigore fallito ${opponentName}`;
    case "save": return `${min} - Parata ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-save": return `${min} - Parata portiere ${opponentName}`;
    case "missed-shot": return `${min} - Tiro fuori ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-missed-shot": return `${min} - Tiro fuori ${opponentName}`;
    case "shot-blocked": return `${min} - Tiro parato ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-shot-blocked": return `${min} - Tiro parato ${opponentName}`;
    default: if (isHit) { const who = e.team === 'vigontina' ? `${e.player || ''} ${e.playerName || ''}`.trim() : opponentName; return `${min} - ${hitLabel || 'Legno'} ${who}`.trim(); } return `${min} - Evento`;
  }
}

export const exportMatchToPDF = async (match, opts = {}) => { /* unchanged above */ };

export const exportMatchToExcel = async (match) => { if (!match) return; return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length === 0) return; return exportMatchHistoryToExcel(matches); };
