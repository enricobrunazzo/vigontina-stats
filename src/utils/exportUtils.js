// utils/exportUtils.js (complete with PDF function restored)
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

export const exportMatchToPDF = async (match) => {
  if (!match) {
    console.warn("Nessuna partita da esportare");
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('VIGONTINA SAN PAOLO', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Report Partita', 105, 30, { align: 'center' });
    
    let yPos = 50;
    
    // Match info
    doc.setFontSize(12);
    doc.text(`Data: ${fmtDateIT(match.date)}`, 20, yPos);
    yPos += 8;
    doc.text(`Avversario: ${match.opponent}`, 20, yPos);
    yPos += 8;
    doc.text(`Competizione: ${match.competition}`, 20, yPos);
    yPos += 8;
    doc.text(`${match.isHome ? 'Casa' : 'Trasferta'}`, 20, yPos);
    yPos += 15;
    
    // Final result
    const result = getMatchResult(match);
    doc.setFontSize(14);
    doc.text('RISULTATO FINALE:', 20, yPos);
    yPos += 10;
    doc.text(`Vigontina ${calculatePoints(match, 'vigontina')} - ${calculatePoints(match, 'opponent')} ${match.opponent}`, 20, yPos);
    yPos += 8;
    doc.text(result.resultText, 20, yPos);
    yPos += 20;
    
    // Periods table
    const periodsData = [];
    match.periods.forEach((period) => {
      if (!isTechnicalTest(period)) {
        const outcome = periodOutcome(period, match.opponent);
        periodsData.push([
          period.name,
          `${safeNum(period.vigontina)} - ${safeNum(period.opponent)}`,
          outcome.label
        ]);
      }
    });
    
    if (periodsData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Periodo', 'Punteggio', 'Vincitore']],
        body: periodsData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 }
      });
      yPos = doc.lastAutoTable.finalY + 20;
    }
    
    // Events
    const stats = calculateMatchStats(match);
    if (stats.allGoals.length > 0) {
      doc.setFontSize(12);
      doc.text('CRONOLOGIA EVENTI:', 20, yPos);
      yPos += 10;
      
      const eventsData = stats.allGoals
        .filter(e => !e.deletionReason)
        .sort((a, b) => (a.minute || 0) - (b.minute || 0))
        .map(e => [eventLabel(e, match.opponent)]);
      
      if (eventsData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Evento']],
          body: eventsData,
          theme: 'striped',
          headStyles: { fillColor: [52, 152, 219] },
          margin: { left: 20, right: 20 }
        });
      }
    }
    
    // Save PDF
    const fileName = `Vigontina-vs-${match.opponent.replace(/[^a-zA-Z0-9]/g, '_')}-${fmtDateIT(match.date).replace(/\//g, '_')}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Errore export PDF:', error);
    alert('Errore durante l\'esportazione PDF');
  }
};

export const exportMatchToExcel = async (match) => {
  if (!match) return;
  return exportMatchHistoryToExcel([match]);
};

export const exportHistoryToExcel = async (matches) => {
  if (!Array.isArray(matches) || matches.length === 0) return;
  return exportMatchHistoryToExcel(matches);
};