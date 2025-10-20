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

// Function to load logo image as base64
const loadLogoAsBase64 = async () => {
  try {
    const response = await fetch('/logo-vigontina.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load logo:', error);
    return null;
  }
};

export const exportMatchToPDF = async (match) => {
  if (!match) {
    console.warn("Nessuna partita da esportare");
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Load and add logo
    const logoBase64 = await loadLogoAsBase64();
    
    // === PROFESSIONAL HEADER WITH LOGO AND BRANDING ===
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
    }
    
    // Header background rectangle
    doc.setFillColor(30, 58, 138); // Dark blue background
    doc.rect(0, 0, 210, 50, 'F');
    
    // Main title with white text on blue background
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('VIGONTINA SAN PAOLO - REPORT PARTITA', 105, 25, { align: 'center' });
    
    // Match result with emphasis
    const result = getMatchResult(match);
    const vigontinaPoints = calculatePoints(match, 'vigontina');
    const opponentPoints = calculatePoints(match, 'opponent');
    
    doc.setFontSize(16);
    const resultText = result.winner === 'vigontina' ? 'VITTORIA' : 
                      result.winner === 'opponent' ? 'SCONFITTA' : 'PAREGGIO';
    
    // Result background color based on outcome
    let resultColor;
    if (result.winner === 'vigontina') {
      resultColor = [34, 197, 94]; // Green for victory
    } else if (result.winner === 'opponent') {
      resultColor = [239, 68, 68]; // Red for defeat
    } else {
      resultColor = [251, 191, 36]; // Yellow for draw
    }
    
    doc.setFillColor(...resultColor);
    doc.rect(60, 35, 90, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(resultText, 105, 43, { align: 'center' });
    
    // Points display with white text
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Punti: Vigontina ${vigontinaPoints} - ${opponentPoints} ${match.opponent}`, 105, 38, { align: 'center' });
    
    // Reset text color to black for body content
    doc.setTextColor(0, 0, 0);
    
    let yPos = 65;
    
    // === MATCH INFO SECTION ===
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent}`, 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`${match.competition || 'Torneo Provinciale Autunnale'}`, 20, yPos);
    yPos += 8;
    doc.text(`${match.isHome ? 'Casa' : 'Trasferta'} - ${fmtDateIT(match.date)}`, 20, yPos);
    yPos += 15;
    
    // === TEAM STAFF INFO ===
    const captain = match.captain;
    if (captain) {
      doc.setFont("helvetica", "normal");
      doc.text(`Capitano: ${captain.number} ${captain.name.toUpperCase()}`, 20, yPos);
      // Add crown symbol for captain
      doc.setFontSize(16);
      doc.text('♚', 15, yPos); // Crown symbol
      doc.setFontSize(12);
      yPos += 8;
    }
    
    if (match.coach) {
      doc.text(`Allenatore: ${match.coach}`, 20, yPos);
      yPos += 8;
    }
    
    if (match.manager) {
      doc.text(`Dirigente Accompagnatore: ${match.manager}`, 20, yPos);
      yPos += 8;
    }
    
    // Goals summary (excluding technical tests)
    const nonTechPeriods = nonTechnicalPeriods(match);
    const totalGoalsVigontina = nonTechPeriods.reduce((sum, p) => sum + safeNum(p.vigontina), 0);
    const totalGoalsOpponent = nonTechPeriods.reduce((sum, p) => sum + safeNum(p.opponent), 0);
    
    doc.text(`Gol (senza PT): ${totalGoalsVigontina} - ${totalGoalsOpponent}`, 20, yPos);
    yPos += 20;
    
    // === PERIODS DETAIL TABLE ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('DETTAGLIO PERIODI', 20, yPos);
    yPos += 10;
    
    const periodsData = [];
    nonTechPeriods.forEach((period) => {
      const outcome = periodOutcome(period, match.opponent);
      periodsData.push([
        period.name,
        safeNum(period.vigontina).toString(),
        safeNum(period.opponent).toString(),
        'Si',
        outcome.label
      ]);
    });
    
    if (periodsData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Periodo', 'Vigontina', match.opponent, 'Completato', 'Esito']],
        body: periodsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'center' }
        }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // === TECHNICAL TEST SECTION ===
    const techPeriods = technicalTestPeriods(match);
    if (techPeriods.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('PROVA TECNICA', 20, yPos);
      yPos += 10;
      
      const techData = [];
      techPeriods.forEach((period) => {
        const outcome = periodOutcome(period, match.opponent);
        techData.push([
          period.name,
          safeNum(period.vigontina).toString(),
          safeNum(period.opponent).toString(),
          outcome.label
        ]);
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Periodo', 'Vigontina', match.opponent, 'Esito']],
        body: techData,
        theme: 'grid',
        headStyles: { 
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10
        },
        margin: { left: 20, right: 20 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // === SCORERS SECTION ===
    const stats = calculateMatchStats(match);
    const scorers = {};
    stats.allGoals
      .filter(e => !e.deletionReason && (e.type === 'goal' || e.type === 'penalty-goal'))
      .forEach(e => {
        const name = e.scorerName || e.scorer || 'Sconosciuto';
        scorers[name] = (scorers[name] || 0) + 1;
      });
    
    if (Object.keys(scorers).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('MARCATORI', 20, yPos);
      yPos += 10;
      
      const scorersData = Object.entries(scorers).map(([name, goals]) => [
        name,
        goals.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Giocatore', 'Gol']],
        body: scorersData,
        theme: 'grid',
        headStyles: { 
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10
        },
        margin: { left: 20, right: 20 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // === OTHER EVENTS SECTION ===
    const penaltyGoals = stats.allGoals.filter(e => !e.deletionReason && e.type === 'penalty-goal').length;
    
    if (penaltyGoals > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('ALTRI EVENTI', 20, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Rigori segnati: ${penaltyGoals}`, 20, yPos);
      yPos += 15;
    }
    
    // === CHRONOLOGY SECTION ===
    if (stats.allGoals.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('CRONOLOGIA EVENTI', 20, yPos);
      yPos += 10;
      
      const eventsData = [];
      
      // Group events by period
      const eventsByPeriod = {};
      stats.allGoals
        .filter(e => !e.deletionReason)
        .forEach(e => {
          const periodName = e.periodName || 'N/A';
          if (!eventsByPeriod[periodName]) {
            eventsByPeriod[periodName] = [];
          }
          eventsByPeriod[periodName].push(e);
        });
      
      // Add events in period order
      Object.entries(eventsByPeriod)
        .sort(([a], [b]) => {
          const aOrder = a.includes('1°') ? 1 : a.includes('2°') ? 2 : a.includes('3°') ? 3 : a.includes('4°') ? 4 : 5;
          const bOrder = b.includes('1°') ? 1 : b.includes('2°') ? 2 : b.includes('3°') ? 3 : b.includes('4°') ? 4 : 5;
          return aOrder - bOrder;
        })
        .forEach(([periodName, events]) => {
          events
            .sort((a, b) => (a.minute || 0) - (b.minute || 0))
            .forEach(e => {
              eventsData.push([
                periodName,
                eventLabel(e, match.opponent)
              ]);
            });
        });
      
      if (eventsData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Periodo', 'Evento']],
          body: eventsData,
          theme: 'striped',
          headStyles: { 
            fillColor: [71, 85, 105],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
          },
          bodyStyles: {
            fontSize: 9
          },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 130 }
          }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }
    }
    
    // === PROFESSIONAL FOOTER ===
    const pageHeight = doc.internal.pageSize.height;
    
    // Footer background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 25, 210, 25, 'F');
    
    // Footer text
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text('Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).', 105, pageHeight - 10, { align: 'center' });
    
    // Save PDF with professional filename
    const fileName = `Vigontina_vs_${match.opponent.replace(/[^a-zA-Z0-9]/g, '_')}_${fmtDateIT(match.date).replace(/\//g, '_')}.pdf`;
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