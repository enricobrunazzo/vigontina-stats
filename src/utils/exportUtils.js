// utils/exportUtils.js (PDF export with full chronology including substitutions and detailed free-kick labels)
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

// Return a normalized, human-friendly label for events, covering substitutions and free-kicks explicitly
function eventLabel(e, opponentName = "Avversari") {
  const min = e.minute != null ? `${e.minute}'` : "";
  const who = (player, name) => (player ? `${player} ${name || ''}`.trim() : '').trim();

  // Substitutions (ensure appear in chronology)
  if (e.type === 'substitution') {
    const outStr = e.out ? `${e.out.num || e.out.number || ''} ${e.out.name || ''}`.trim() : 'N/A';
    const inStr = e.in ? `${e.in.num || e.in.number || ''} ${e.in.name || ''}`.trim() : 'N/A';
    return `${min} - Sostituzione: ${outStr} → ${inStr}`.trim();
  }

  // Free-kicks (Punizione) with explicit outcomes - FIXED to appear in events
  if (e.type?.startsWith('free-kick') || e.type === 'foul' || e.type === 'punizione') {
    const isOpp = e.type.includes('opponent') || e.team === 'opponent';
    const shooter = isOpp ? opponentName : who(e.player, e.playerName);
    
    if (e.type.includes('goal')) return `${min} - Punizione gol ${shooter}`.trim();
    if (e.type.includes('saved')) return `${min} - Punizione parata ${shooter}`.trim();
    if (e.type.includes('missed')) return `${min} - Punizione fuori ${shooter}`.trim();
    if (e.type.includes('hit')) {
      const hl = e.hitType === 'traversa' ? 'traversa' : 'palo';
      return `${min} - Punizione ${hl} ${shooter}`.trim();
    }
    // Generic free-kick/foul
    return `${min} - Punizione ${shooter}`.trim();
  }

  // Fouls/Cards - ADDED to ensure they appear in summary
  if (e.type === 'yellow-card' || e.type === 'cartellino-giallo') {
    const player = who(e.player, e.playerName) || (e.team === 'opponent' ? opponentName : 'Giocatore');
    return `${min} - Ammonizione ${player}`.trim();
  }
  
  if (e.type === 'red-card' || e.type === 'cartellino-rosso') {
    const player = who(e.player, e.playerName) || (e.team === 'opponent' ? opponentName : 'Giocatore');
    return `${min} - Espulsione ${player}`.trim();
  }

  // General shots and outcomes
  const scorer = e.scorerName || e.scorer || who(e.player, e.playerName);
  const assistName = e.assistName || e.assist || "";

  switch (e.type) {
    case "goal": {
      const base = `${min} - Gol ${scorer}`.trim();
      return assistName ? `${base} (assist ${assistName})` : base;
    }
    case "own-goal":
      return `${min} - Autogol Vigontina (gol a ${opponentName})`;
    case "opponent-own-goal":
      return `${min} - Autogol ${opponentName} (gol a Vigontina)`;
    case "opponent-goal":
      return `${min} - Gol ${opponentName}`;
    case "penalty-goal": {
      const base = `${min} - Gol (Rig.) ${scorer}`.trim();
      return assistName ? `${base} (assist ${assistName})` : base;
    }
    case "penalty-missed":
      return `${min} - Rigore fallito Vigontina`;
    case "penalty-opponent-goal":
      return `${min} - Gol (Rig.) ${opponentName}`;
    case "penalty-opponent-missed":
      return `${min} - Rigore fallito ${opponentName}`;
    case "save":
      return `${min} - Parata ${who(e.player, e.playerName)}`.trim();
    case "opponent-save":
      return `${min} - Parata portiere ${opponentName}`;
    case "missed-shot":
      return `${min} - Tiro fuori ${who(e.player, e.playerName)}`.trim();
    case "opponent-missed-shot":
      return `${min} - Tiro fuori ${opponentName}`;
    case "shot-blocked":
      return `${min} - Tiro parato ${who(e.player, e.playerName)}`.trim();
    case "opponent-shot-blocked":
      return `${min} - Tiro parato ${opponentName}`;
    default: {
      // hits outside free-kicks handled above
      if (e.hitType === 'palo' || e.hitType === 'traversa') {
        const whoStr = e.team === 'vigontina' ? who(e.player, e.playerName) : opponentName;
        const hl = e.hitType === 'traversa' ? 'traversa' : 'palo';
        return `${min} - ${hl} ${whoStr}`.trim();
      }
      // Fallback for any unhandled event types
      return `${min} - ${e.type || 'Evento'}`.trim();
    }
  }
}

// Function to load logo image as base64 - FIXED error handling
const loadLogoAsBase64 = async () => {
  try {
    // Try multiple potential logo paths
    const logoPaths = [
      '/logo-vigontina.png',
      '/public/logo-vigontina.png', 
      '/assets/logo-vigontina.png',
      './logo-vigontina.png'
    ];
    
    for (const path of logoPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
          });
        }
      } catch (err) {
        // Continue to next path
        continue;
      }
    }
    
    console.warn('Logo not found in any expected location');
    return null;
  } catch (error) {
    console.warn('Could not load logo:', error);
    return null;
  }
};

export const exportMatchToPDF = async (match) => {
  if (!match) {
    console.warn("Nessuna partita da esportare");
    alert("Nessuna partita selezionata per l'esportazione");
    return;
  }

  try {
    console.log('Starting PDF export for match:', match.opponent);
    
    const doc = new jsPDF();
    
    // Load logo with better error handling
    let logoBase64 = null;
    try {
      logoBase64 = await loadLogoAsBase64();
    } catch (logoError) {
      console.warn('Logo loading failed, continuing without logo:', logoError);
    }
    
    // === PROFESSIONAL HEADER WITH LOGO AND BRANDING ===
    
    // Header background rectangle
    doc.setFillColor(30, 58, 138); // Dark blue background
    doc.rect(0, 0, 210, 50, 'F');
    
    // Add logo if available
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
      } catch (imgError) {
        console.warn('Error adding logo to PDF:', imgError);
      }
    }
    
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
      doc.text(`Capitano: ${captain.number || captain.num || ''} ${(captain.name || '').toUpperCase()}`, 20, yPos);
      doc.setFontSize(16);
      doc.text('♚', 15, yPos);
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
    
    const nonTech = nonTechnicalPeriods(match);
    const totalGoalsV = nonTech.reduce((sum, p) => sum + safeNum(p.vigontina), 0);
    const totalGoalsO = nonTech.reduce((sum, p) => sum + safeNum(p.opponent), 0);
    
    doc.text(`Gol (senza PT): ${totalGoalsV} - ${totalGoalsO}`, 20, yPos);
    yPos += 20;
    
    // === PERIODS DETAIL TABLE ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('DETTAGLIO PERIODI', 20, yPos);
    yPos += 10;
    
    const periodsData = [];
    nonTech.forEach((period) => {
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
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 },
        bodyStyles: { fontSize: 10 },
        margin: { left: 20, right: 20 },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 25, halign: 'center' }, 3: { cellWidth: 25, halign: 'center' }, 4: { cellWidth: 35, halign: 'center' } }
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
        techData.push([ period.name, safeNum(period.vigontina).toString(), safeNum(period.opponent).toString(), outcome.label ]);
      });
      autoTable(doc, { startY: yPos, head: [['Periodo', 'Vigontina', match.opponent, 'Esito']], body: techData, theme: 'grid', headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 }, bodyStyles: { fontSize: 10 }, margin: { left: 20, right: 20 } });
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // === SCORERS SECTION ===
    const stats = calculateMatchStats(match);
    const scorers = {};
    stats.allGoals.filter(e => !e.deletionReason && (e.type === 'goal' || e.type === 'penalty-goal')).forEach(e => { const name = e.scorerName || e.scorer || 'Sconosciuto'; scorers[name] = (scorers[name] || 0) + 1; });
    if (Object.keys(scorers).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('MARCATORI', 20, yPos);
      yPos += 10;
      const scorersData = Object.entries(scorers).map(([name, goals]) => [ name, goals.toString() ]);
      autoTable(doc, { startY: yPos, head: [['Giocatore', 'Gol']], body: scorersData, theme: 'grid', headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 }, bodyStyles: { fontSize: 10 }, margin: { left: 20, right: 20 } });
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
    
    // === ENHANCED CHRONOLOGY SECTION (FIXED to include substitutions and fouls) ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('CRONOLOGIA EVENTI', 20, yPos);
    yPos += 10;

    const allEvents = [];
    
    // Collect ALL types of events from periods, including substitutions and fouls
    (match.periods || []).forEach(p => {
      // Check multiple possible event arrays
      const eventArrays = [
        p.events || [],
        p.goals || [],
        p.substitutions || [],
        p.fouls || [],
        p.cards || [],
        p.allEvents || []
      ];
      
      eventArrays.forEach(eventArray => {
        if (Array.isArray(eventArray)) {
          eventArray.forEach(e => {
            if (e && typeof e === 'object') {
              // Enrich with period name for ordering
              allEvents.push({ ...e, periodName: p.name });
            }
          });
        }
      });
    });

    // Also collect from match-level events if they exist
    if (match.events && Array.isArray(match.events)) {
      match.events.forEach(e => {
        if (e && typeof e === 'object') {
          allEvents.push({ ...e, periodName: e.periodName || 'Match' });
        }
      });
    }

    // Fallback to stats if no events collected from periods
    if (allEvents.length === 0) {
      stats.allGoals.filter(e => !e.deletionReason).forEach(e => allEvents.push(e));
    }

    // Group events by period
    const eventsByPeriod = {};
    allEvents.filter(e => e && !e.deletionReason).forEach(e => {
      const periodName = e.periodName || e.period || 'N/A';
      if (!eventsByPeriod[periodName]) eventsByPeriod[periodName] = [];
      eventsByPeriod[periodName].push(e);
    });

    const eventsData = [];
    Object.entries(eventsByPeriod)
      .sort(([a],[b]) => {
        const ord = (s) => s.includes('1°') ? 1 : s.includes('2°') ? 2 : s.includes('3°') ? 3 : s.includes('4°') ? 4 : 5;
        return ord(a)-ord(b);
      })
      .forEach(([periodName, evs]) => {
        evs.sort((a,b) => (a.minute||0) - (b.minute||0)).forEach(e => {
          eventsData.push([ periodName, eventLabel(e, match.opponent) ]);
        });
      });

    if (eventsData.length > 0) {
      autoTable(doc, { 
        startY: yPos, 
        head: [['Periodo', 'Evento']], 
        body: eventsData, 
        theme: 'striped', 
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 }, 
        bodyStyles: { fontSize: 9 }, 
        margin: { left: 20, right: 20 }, 
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 130 } } 
      });
      yPos = doc.lastAutoTable.finalY + 15;
    } else {
      // Show message if no events found
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text('Nessun evento registrato durante la partita.', 20, yPos);
      yPos += 15;
    }

    // === PROFESSIONAL FOOTER ===
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 25, 210, 25, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text('Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).', 105, pageHeight - 10, { align: 'center' });

    const fileName = `Vigontina_vs_${(match.opponent || 'Avversario').replace(/[^a-zA-Z0-9]/g, '_')}_${fmtDateIT(match.date).replace(/\//g, '_')}.pdf`;
    
    console.log('PDF export completed successfully');
    doc.save(fileName);
    
  } catch (error) {
    console.error('Errore export PDF:', error);
    alert(`Errore durante l'esportazione PDF: ${error.message || 'Errore sconosciuto'}`);
  }
};

export const exportMatchToExcel = async (match) => { 
  if (!match) {
    alert("Nessuna partita selezionata per l'esportazione Excel");
    return; 
  }
  return exportMatchHistoryToExcel([match]); 
};

export const exportHistoryToExcel = async (matches) => { 
  if (!Array.isArray(matches) || matches.length === 0) {
    alert("Nessuna partita disponibile per l'esportazione storico");
    return; 
  }
  return exportMatchHistoryToExcel(matches); 
};