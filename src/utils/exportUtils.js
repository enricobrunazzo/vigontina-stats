// utils/exportUtils.js
// Esportazione PDF/Excel coerente con la logica dell'app (punti/gol/periodi)

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { PLAYERS } from "../constants/players";
import {
  calculatePoints,
  calculateTotalGoals,
  calculateMatchStats,
  getMatchResult,
} from "./matchUtils";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

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

// Formattazione evento migliorata: gestisce nuovi tipi autogol
function eventLabel(e, opponentName = "Avversari") {
  const min = e.minute != null ? `${e.minute}'` : "";
  const scorer = e.scorerName || e.scorer || "";
  const assistName = e.assistName || e.assist || "";
  switch (e.type) {
    case "goal": {
      const base = `${min} - Gol ${scorer}`.trim();
      return assistName ? `${base} assist ${assistName}` : base;
    }
    case "own-goal":
      return `${min} - Autogol Vigontina (gol a ${opponentName})`;
    case "opponent-own-goal":
      return `${min} - Autogol ${opponentName} (gol a Vigontina)`;
    case "opponent-goal":
      return `${min} - Gol ${opponentName}`;
    case "penalty-goal": {
      const base = `${min} - Gol (Rig.) ${scorer}`.trim();
      return assistName ? `${base} assist ${assistName}` : base;
    }
    case "penalty-missed":
      return `${min} - Rigore fallito Vigontina`;
    case "penalty-opponent-goal":
      return `${min} - Gol (Rig.) ${opponentName}`;
    case "penalty-opponent-missed":
      return `${min} - Rigore fallito ${opponentName}`;
    default:
      return `${min} - Evento`;
  }
}

async function loadImageAsDataURL(url) {
  try { const res = await fetch(url, { cache: "no-store" }); const blob = await res.blob();
    return await new Promise((resolve) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.readAsDataURL(blob); });
  } catch { return null; }
}

/* -------------------------------------------------------------------------- */
/*                                    PDF                                     */
/* -------------------------------------------------------------------------- */

export const exportMatchToPDF = async (match, opts = {}) => {
  if (!match) return;
  const opponentName = match.opponent || "Avversari";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  const vp = calculatePoints(match, "vigontina");
  const op = calculatePoints(match, "opponent");
  const vg = calculateTotalGoals(match, "vigontina");
  const og = calculateTotalGoals(match, "opponent");
  const stats = calculateMatchStats(match);
  const { resultText, isWin, isDraw } = getMatchResult(match);

  const logoUrl = opts.logoUrl ?? `${import.meta.env.BASE_URL || "/"}logo-vigontina.png`;
  const logoDataUrl = await loadImageAsDataURL(logoUrl);

  let y = margin;
  const logoW = 42; const logoH = 42;
  if (logoDataUrl) { doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH, undefined, "FAST"); }

  doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text("VIGONTINA SAN PAOLO - REPORT PARTITA", pageWidth / 2, y + 18, { align: "center" });

  const headerBottom = Math.max(y + 18, y + logoH); y = headerBottom + 12;

  const bg = isWin ? [220, 252, 231] : isDraw ? [254, 249, 195] : [254, 226, 226];
  const bd = isWin ? [16, 185, 129] : isDraw ? [250, 204, 21] : [239, 68, 68];
  const tx = isWin ? [4, 120, 87] : isDraw ? [161, 98, 7] : [153, 27, 27];

  const bannerX = margin; const bannerW = pageWidth - margin * 2; const bannerH = 28;
  doc.setFillColor(...bg); doc.setDrawColor(...bd); doc.roundedRect(bannerX, y, bannerW, bannerH, 6, 6, "FD");
  doc.setTextColor(...tx); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(resultText, bannerX + 10, y + 19);
  doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
  doc.text(`Punti: Vigontina ${vp} - ${op} ${opponentName}`, bannerX + bannerW - 10, y + 19, { align: "right" });

  doc.setTextColor(0, 0, 0); y += bannerH + 14;

  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const metaLines = [
    `Vigontina San Paolo vs ${opponentName}`,
    `${match.competition || ""}${match.matchDay ? ` - Giornata ${match.matchDay}` : ""}`,
    `${match.isHome ? "Casa" : "Trasferta"} - ${fmtDateIT(match.date)}`,
  ];
  if (match.captain) { const captainName = PLAYERS.find((p) => p.num === match.captain)?.name || ""; metaLines.push(`Capitano: ${match.captain} ${captainName}`); }
  if (match.coach) metaLines.push(`Allenatore: ${match.coach}`);
  if (match.assistantReferee) metaLines.push(`Assistente Arbitro: ${match.assistantReferee}`);
  if (match.teamManager) metaLines.push(`Dirigente Accompagnatore: ${match.teamManager}`);
  metaLines.forEach((l) => { doc.text(l, margin, y); y += 14; });

  doc.setFont("helvetica", "bold"); doc.text(`Gol (senza PT): ${vg} - ${og}`, margin, y); y += 18;
  doc.setFont("helvetica", "bold"); doc.text("DETTAGLIO PERIODI", margin, y); y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Periodo", "Vigontina", opponentName, "Completato", "Esito"]],
    body: nonTechnicalPeriods(match).map((p) => { const completed = p?.completed === true; const outcome = periodOutcome(p, opponentName).label; return [p.name || "", safeNum(p.vigontina), safeNum(p.opponent), completed ? "Si" : "No", outcome]; }),
    theme: "grid", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [54, 96, 146], textColor: 255 }, margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 14;
  const pt = technicalTestPeriods(match);
  if (pt.length > 0) {
    doc.setFont("helvetica", "bold"); doc.text("PROVA TECNICA", margin, y); y += 6;
    autoTable(doc, { startY: y, head: [["Periodo", "Vigontina", opponentName, "Esito"]], body: pt.map((p) => { const outcome = periodOutcome(p, opponentName).label; return [p.name || "Prova Tecnica", safeNum(p.vigontina), safeNum(p.opponent), outcome]; }), theme: "grid", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [107, 114, 128], textColor: 255 }, margin: { left: margin, right: margin }, });
    y = doc.lastAutoTable.finalY + 14;
  }

  const statsObj = stats;
  const hasScorers = Object.keys(statsObj.scorers || {}).length > 0;
  const hasAssisters = Object.keys(statsObj.assisters || {}).length > 0;
  const hasOther = statsObj.ownGoalsCount > 0 || statsObj.penaltiesScored > 0 || statsObj.penaltiesMissed > 0;

  if (hasScorers) {
    doc.setFont("helvetica", "bold"); doc.text("MARCATORI", margin, y); y += 6;
    const scorersBody = Object.entries(statsObj.scorers).sort((a, b) => b[1] - a[1]).map(([num, count]) => { const player = PLAYERS.find((p) => p.num === parseInt(num, 10)); return [`${num} ${player?.name || "Sconosciuto"}`, count]; });
    autoTable(doc, { startY: y, head: [["Giocatore", "Gol"]], body: scorersBody, theme: "grid", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [54, 96, 146], textColor: 255 }, margin: { left: margin, right: margin }, });
    y = doc.lastAutoTable.finalY + 12;
  }

  if (hasAssisters) {
    doc.setFont("helvetica", "bold"); doc.text("ASSIST", margin, y); y += 6;
    const assistersBody = Object.entries(statsObj.assisters).sort((a, b) => b[1] - a[1]).map(([num, count]) => { const player = PLAYERS.find((p) => p.num === parseInt(num, 10)); return [`${num} ${player?.name || "Sconosciuto"}`, count]; });
    autoTable(doc, { startY: y, head: [["Giocatore", "Assist"]], body: assistersBody, theme: "grid", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [54, 96, 146], textColor: 255 }, margin: { left: margin, right: margin }, });
    y = doc.lastAutoTable.finalY + 12;
  }

  if (hasOther) {
    doc.setFont("helvetica", "bold"); doc.text("ALTRI EVENTI", margin, y); y += 14;
    doc.setFont("helvetica", "normal");
    if (statsObj.ownGoalsCount > 0) { doc.text(`Autogol: ${statsObj.ownGoalsCount}`, margin, y); y += 14; }
    if (statsObj.penaltiesScored > 0) { doc.text(`Rigori segnati: ${statsObj.penaltiesScored}`, margin, y); y += 14; }
    if (statsObj.penaltiesMissed > 0) { doc.text(`Rigori sbagliati: ${statsObj.penaltiesMissed}`, margin, y); y += 14; }
  }

  doc.setFont("helvetica", "bold"); doc.text("CRONOLOGIA EVENTI", margin, y); y += 6;
  const rows = []; nonTechnicalPeriods(match).forEach((p) => { const events = Array.isArray(p.goals) ? p.goals : []; if (events.length === 0 && p.vigontina === 0 && p.opponent === 0) return; if (events.length === 0) { rows.push([p.name, "- nessun evento registrato -"]); } else { events.forEach((e, idx) => { rows.push([idx === 0 ? p.name : "", eventLabel(e, opponentName)]); }); } });
  if (rows.length > 0) { autoTable(doc, { startY: y, head: [["Periodo", "Evento"]], body: rows, theme: "grid", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [16, 185, 129], textColor: 255 }, margin: { left: margin, right: margin }, }); y = doc.lastAutoTable.finalY + 14; }

  // Nota sui punti spostata in fondo
  doc.setFont("helvetica", "italic"); doc.setFontSize(9);
  doc.text("Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).", margin, y + 10);

  const fileName = `Vigontina_vs_${(opponentName || "").replace(/\s+/g, "_")}_${fmtDateIT(match.date)}.pdf`;
  doc.save(fileName);
};

/* -------------------------------------------------------------------------- */
/*                          EXCEL SINGOLA (EXCELJS)                           */
/* -------------------------------------------------------------------------- */

export const exportMatchToExcel = async (match) => {
  if (!match) return;
  try {
    const workbook = new ExcelJS.Workbook(); workbook.creator = 'Vigontina Calcio'; workbook.created = new Date();

    const opponentName = match.opponent || "Avversari";
    const vp = calculatePoints(match, "vigontina"); const op = calculatePoints(match, "opponent");
    const vg = calculateTotalGoals(match, "vigontina"); const og = calculateTotalGoals(match, "opponent");
    const stats = calculateMatchStats(match);
    const { resultText, isWin, isDraw } = getMatchResult(match);

    const colors = { primaryGreen:'FF0B6E4F', lightGreen:'FF08A045', darkGreen:'FF064E3B', yellow:'FFF59E0B', red:'FFDC2626', lightGray:'FFF3F4F6', white:'FFFFFFFF' };
    const sheet = workbook.addWorksheet('Riepilogo Partita', { properties: { tabColor: { argb: colors.primaryGreen } } });

    // Layout anti-overlap definitivo (nessun banner duplicato)
    sheet.getColumn('A').width = 16; sheet.getColumn('B').width = 30; sheet.getColumn('C').width = 25;

    // Logo
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}forza-vigontina.png`); const blob = await res.blob(); const ab = await blob.arrayBuffer();
      const imageId = workbook.addImage({ buffer: ab, extension: 'png' });
      sheet.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 80, height: 80 }, editAs: 'oneCell' });
    } catch {}

    // Unico banner intestazione
    sheet.mergeCells('B3:F3'); const bannerTitle = sheet.getCell('B3');
    bannerTitle.value = 'VIGONTINA SAN PAOLO - REPORT PARTITA';
    bannerTitle.font = { size: 18, bold: true, color: { argb: colors.white } };
    bannerTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryGreen } };
    bannerTitle.alignment = { vertical: 'middle', horizontal: 'center' }; sheet.getRow(3).height = 28;

    sheet.mergeCells('B4:F4'); const bannerResult = sheet.getCell('B4');
    bannerResult.value = resultText; const resultColor = isWin ? colors.primaryGreen : isDraw ? colors.yellow : colors.red;
    bannerResult.font = { size: 14, bold: true, color: { argb: colors.white } };
    bannerResult.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: resultColor } };
    bannerResult.alignment = { vertical: 'middle', horizontal: 'center' }; sheet.getRow(4).height = 24;

    // Riga vuota separatrice
    sheet.addRow([]); // row 5

    // Sezione RISULTATO FINALE (ripristinata, non duplicata)
    let r = 6;
    sheet.mergeCells(`B${r}:C${r}`); const finalHeader = sheet.getCell(`B${r}`);
    finalHeader.value = 'RISULTATO FINALE'; finalHeader.font = { bold: true, size: 12, color: { argb: colors.white } };
    finalHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.darkGreen } };
    finalHeader.alignment = { horizontal: 'center', vertical: 'middle' }; sheet.getRow(r).height = 22; r++;

    const resultData = [ ['Punti Vigontina', vp], ['Punti ' + opponentName, op], ['Gol Vigontina (senza PT)', vg], ['Gol ' + opponentName + ' (senza PT)', og] ];
    resultData.forEach(([label, val]) => {
      sheet.addRow(['', label, val]);
      const a = sheet.getCell(`B${r}`); const b = sheet.getCell(`C${r}`);
      a.font = { bold: true, size: 11 }; b.font = { bold: true, size: 12 };
      a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGray } };
      b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } };
      b.alignment = { horizontal: 'center', vertical: 'middle' };
      [a, b].forEach(c => c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} });
      r++;
    });

    sheet.addRow([]); r++;

    // Sezione INFORMAZIONI PARTITA
    sheet.addRow(['', 'INFORMAZIONI PARTITA', '']);
    sheet.mergeCells(`B${r}:C${r}`);
    const infoHdr = sheet.getCell(`B${r}`);
    infoHdr.font = { bold: true, size: 12, color: { argb: colors.white } };
    infoHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGreen } };
    infoHdr.alignment = { horizontal: 'center', vertical: 'middle' }; sheet.getRow(r).height = 22; r++;

    const infoRows = [ ['Avversario:', opponentName], ['Data:', fmtDateIT(match.date)], ['Luogo:', match.isHome ? 'Casa' : 'Trasferta'], ['Competizione:', match.competition || '-'], ['Giornata:', match.matchDay || '-'] ];
    if (match.captain) { const captainName = PLAYERS.find((p) => p.num === match.captain)?.name || ""; infoRows.push(['Capitano:', `${match.captain} ${captainName}`]); }
    if (match.coach) { infoRows.push(['Allenatore:', match.coach]); }
    if (match.assistantReferee) infoRows.push(['Assistente Arbitro:', match.assistantReferee]);
    if (match.teamManager) infoRows.push(['Dirigente Accompagnatore:', match.teamManager]);

    infoRows.forEach(([k, v]) => {
      sheet.addRow(['', k, v]); const a = sheet.getCell(`B${r}`); const b = sheet.getCell(`C${r}`);
      a.font = { bold: true, size: 11 }; b.font = { size: 11 };
      a.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: colors.lightGray } }; b.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: colors.white } };
      [a, b].forEach(c => c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }); r++;
    });

    // Fogli aggiuntivi invariati (Dettaglio Periodi, Marcatori e Assist, Cronologia Eventi)
    const detail = workbook.addWorksheet('Dettaglio Periodi', { properties:{ tabColor:{ argb: colors.primaryGreen } } });
    detail.mergeCells('A1:E1'); const pTitle = detail.getCell('A1'); pTitle.value = 'DETTAGLIO PERIODI'; pTitle.font = { size:16, bold:true, color:{argb:colors.white} }; pTitle.fill = { type:'pattern', pattern:'solid', fgColor:{argb:colors.primaryGreen} }; pTitle.alignment = { vertical:'middle', horizontal:'center' }; detail.getRow(1).height = 28;
    detail.addRow([]);
    const header = detail.addRow(['Periodo','Vigontina',opponentName,'Completato','Esito']); header.font = { bold:true, size:11, color:{argb:colors.white} }; header.fill = { type:'pattern', pattern:'solid', fgColor:{argb:colors.darkGreen} }; header.alignment = { vertical:'middle', horizontal:'center' }; header.height = 20;
    nonTechnicalPeriods(match).forEach(p => { const completed = p?.completed === true; const outcome = periodOutcome(p, opponentName).label; const row = detail.addRow([p.name||'', safeNum(p.vigontina), safeNum(p.opponent), completed?'Si':'No', outcome]); row.alignment = { vertical:'middle', horizontal:'center' }; row.getCell(1).alignment = { vertical:'middle', horizontal:'left' }; [1,2,3,4,5].forEach(i=>{ const c=row.getCell(i); c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); });
    detail.getColumn('A').width=18; detail.getColumn('B').width=12; detail.getColumn('C').width=12; detail.getColumn('D').width=12; detail.getColumn('E').width=15;

    const scorersSheet = workbook.addWorksheet('Marcatori e Assist', { properties:{ tabColor:{ argb: colors.primaryGreen } } });
    scorersSheet.mergeCells('A1:C1'); const sTitle = scorersSheet.getCell('A1'); sTitle.value='MARCATORI'; sTitle.font={ size:16, bold:true, color:{argb:colors.white} }; sTitle.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.primaryGreen} }; sTitle.alignment={ vertical:'middle', horizontal:'center' }; scorersSheet.getRow(1).height=28; scorersSheet.addRow([]);
    if (Object.keys(stats.scorers).length > 0) {
      const sh = scorersSheet.addRow(['Numero','Giocatore','Gol']); sh.font={ bold:true, size:11, color:{argb:colors.white} }; sh.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.darkGreen} }; sh.alignment={ vertical:'middle', horizontal:'center' }; sh.height=20;
      Object.entries(stats.scorers).sort((a,b)=>b[1]-a[1]).forEach(([num,count])=>{ const player = PLAYERS.find((p)=>p.num===parseInt(num,10)); const row = scorersSheet.addRow([num, player?.name||'Sconosciuto', count]); row.alignment={ vertical:'middle', horizontal:'center' }; row.getCell(2).alignment={ vertical:'middle', horizontal:'left' }; [1,2,3].forEach(i=>{ const c=row.getCell(i); c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); });
    } else { scorersSheet.addRow(['Nessun marcatore']); }
    scorersSheet.addRow([]); scorersSheet.addRow([]);
    scorersSheet.mergeCells(`A${scorersSheet.lastRow.number + 1}:C${scorersSheet.lastRow.number + 1}`);
    const aTitle = scorersSheet.getCell(`A${scorersSheet.lastRow.number + 1}`); aTitle.value='ASSIST'; aTitle.font={ size:14, bold:true, color:{argb:colors.white} }; aTitle.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.lightGreen} }; aTitle.alignment={ vertical:'middle', horizontal:'center' }; scorersSheet.getRow(scorersSheet.lastRow.number + 1).height=25; scorersSheet.addRow([]);
    if (Object.keys(stats.assisters).length > 0) {
      const ah = scorersSheet.addRow(['Numero','Giocatore','Assist']); ah.font={ bold:true, size:11, color:{argb:colors.white} }; ah.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.darkGreen} }; ah.alignment={ vertical:'middle', horizontal:'center' }; ah.height=20;
      Object.entries(stats.assisters).sort((a,b)=>b[1]-a[1]).forEach(([num,count])=>{ const player = PLAYERS.find((p)=>p.num===parseInt(num,10)); const row = scorersSheet.addRow([num, player?.name||'Sconosciuto', count]); row.alignment={ vertical:'middle', horizontal:'center' }; row.getCell(2).alignment={ vertical:'middle', horizontal:'left' }; [1,2,3].forEach(i=>{ const c=row.getCell(i); c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); });
    } else { scorersSheet.addRow(['Nessun assist']); }
    scorersSheet.getColumn('A').width=10; scorersSheet.getColumn('B').width=25; scorersSheet.getColumn('C').width=10;

    const eventsSheet = workbook.addWorksheet('Cronologia Eventi', { properties:{ tabColor:{ argb: colors.primaryGreen } } });
    eventsSheet.mergeCells('A1:C1'); const eTitle = eventsSheet.getCell('A1'); eTitle.value='CRONOLOGIA EVENTI'; eTitle.font={ size:16, bold:true, color:{argb:colors.white} }; eTitle.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.primaryGreen} }; eTitle.alignment={ vertical:'middle', horizontal:'center' }; eventsSheet.getRow(1).height=28; eventsSheet.addRow([]);
    const eh = eventsSheet.addRow(['Periodo','Minuto','Evento']); eh.font={ bold:true, size:11, color:{argb:colors.white} }; eh.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.darkGreen} }; eh.alignment={ vertical:'middle', horizontal:'center' }; eh.height=20;
    let hasEvents = false; nonTechnicalPeriods(match).forEach(period => { const events = Array.isArray(period.goals) ? period.goals : []; if (events.length === 0 && period.vigontina === 0 && period.opponent === 0) return; hasEvents = true; if (events.length === 0) { const row = eventsSheet.addRow([period.name, '', '- nessun evento registrato -']); row.alignment={ vertical:'middle', horizontal:'left' }; [1,2,3].forEach(i=>{ const c=row.getCell(i); c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); } else { events.forEach((e, idx)=>{ const row = eventsSheet.addRow([idx===0?period.name:'', e.minute != null ? `${e.minute}'` : '', eventLabel(e, opponentName)]); row.alignment={ vertical:'middle', horizontal:'left' }; row.getCell(2).alignment={ vertical:'middle', horizontal:'center' }; [1,2,3].forEach(i=>{ const c=row.getCell(i); c.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); }); } });
    if (!hasEvents) eventsSheet.addRow(['Nessun evento registrato nella partita']); eventsSheet.getColumn('A').width=18; eventsSheet.getColumn('B').width=10; eventsSheet.getColumn('C').width=50;

    const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Vigontina_Storico_${fmtDateIT(new Date()).replace(/\//g,'-')}.xlsx`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click(); URL.revokeObjectURL(link.href);
    alert("Storico esportato con successo!"); return true;
  } catch (error) { console.error('Errore export storico:', error); alert(`Errore durante l'esportazione: ${error.message || "Errore sconosciuto"}`); return false; }
};

/* -------------------------------------------------------------------------- */
/*                        EXPORT STORICO (EXCELJS)                            */
/* -------------------------------------------------------------------------- */

export const exportHistoryToExcel = async (matches) => {
  if (!matches || matches.length === 0) { alert("Nessuna partita da esportare"); return; }
  try {
    const workbook = new ExcelJS.Workbook(); workbook.creator = 'Vigontina Calcio'; workbook.created = new Date();
    const colors = { primaryGreen:'FF0B6E4F', lightGreen:'FF08A045', darkGreen:'FF064E3B', yellow:'FFF59E0B', red:'FFDC2626', lightGray:'FFF3F4F6', white:'FFFFFFFF' };

    const sheet = workbook.addWorksheet('Riepilogo Stagione', { properties: { tabColor: { argb: colors.primaryGreen } } });
    sheet.getColumn('A').width = 16; sheet.getColumn('B').width = 30; sheet.getColumn('C').width = 25;

    // Logo e banner
    try { const res = await fetch(`${import.meta.env.BASE_URL}forza-vigontina.png`); const blob = await res.blob(); const ab = await blob.arrayBuffer(); const imageId = workbook.addImage({ buffer: ab, extension: 'png' }); sheet.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 80, height: 80 }, editAs: 'oneCell' }); } catch {}
    sheet.mergeCells('B3:F3'); const titleTop = sheet.getCell('B3'); titleTop.value='VIGONTINA CALCIO - STAGIONE 2025/2026'; titleTop.font={ size:18, bold:true, color:{argb:colors.white} }; titleTop.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.primaryGreen} }; titleTop.alignment={ vertical:'middle', horizontal:'center' }; sheet.getRow(3).height=28;
    sheet.mergeCells('B4:F4'); const subtitleTop = sheet.getCell('B4'); subtitleTop.value='STORICO PARTITE'; subtitleTop.font={ size:14, bold:true, color:{argb:colors.white} }; subtitleTop.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.darkGreen} }; subtitleTop.alignment={ vertical:'middle', horizontal:'center' }; sheet.getRow(4).height=24;

    // Riga vuota
    sheet.addRow([]); // row 5

    // Riepilogo stagione (ripristinato interamente)
    let r = 6;
    const stats = { totPartite: matches.length, vittorie: 0, pareggi: 0, sconfitte: 0, golFatti: 0, golSubiti: 0, puntiFatti: 0, puntiSubiti: 0 };
    matches.forEach(m => { const vp = calculatePoints(m, "vigontina"); const op = calculatePoints(m, "opponent"); const vg = calculateTotalGoals(m, "vigontina"); const og = calculateTotalGoals(m, "opponent"); stats.puntiFatti += vp; stats.puntiSubiti += op; stats.golFatti += vg; stats.golSubiti += og; if (vp > op) stats.vittorie++; else if (vp === op) stats.pareggi++; else stats.sconfitte++; });

    sheet.mergeCells(`B${r}:E${r}`); const statsHdr = sheet.getCell(`B${r}`); statsHdr.value='STATISTICHE STAGIONE'; statsHdr.font={ bold:true, size:12, color:{argb:colors.white} }; statsHdr.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.lightGreen} }; statsHdr.alignment={ horizontal:'center', vertical:'middle' }; sheet.getRow(r).height=22; r++;

    const statsData = [ ['Partite Giocate', stats.totPartite, 'Punti Fatti', stats.puntiFatti], ['Vittorie', stats.vittorie, 'Punti Subiti', stats.puntiSubiti], ['Pareggi', stats.pareggi, 'Gol Fatti', stats.golFatti], ['Sconfitte', stats.sconfitte, 'Gol Subiti', stats.golSubiti], ['', '', 'Differenza Reti', stats.golFatti - stats.golSubiti] ];
    statsData.forEach(row => { sheet.addRow(['', ...row]); ['B','C','D','E'].forEach((col, idx) => { const cell = sheet.getCell(`${col}${r}`); cell.font={ size:11, bold: col==='B' || col==='D' }; cell.fill={ type:'pattern', pattern:'solid', fgColor:{argb: colors.lightGray} }; cell.alignment={ horizontal: (col==='B'||col==='D')?'left':'center', vertical:'middle' }; cell.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); sheet.getRow(r).height=22; r++; });

    sheet.addRow([]); r += 2;

    // Dettaglio partite
    sheet.mergeCells(`B${r}:G${r}`); const detHdr = sheet.getCell(`B${r}`); detHdr.value='DETTAGLIO PARTITE'; detHdr.font={ size:12, bold:true, color:{argb:colors.white} }; detHdr.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.lightGreen} }; detHdr.alignment={ vertical:'middle', horizontal:'center' }; sheet.getRow(r).height=22; r++;

    const headers = ['Data','Avversario','Risultato','Punti','Competizione','Casa/Trasferta'];
    const hRow = sheet.addRow(['', ...headers]); hRow.font={ bold:true, size:11, color:{argb:colors.white} }; hRow.fill={ type:'pattern', pattern:'solid', fgColor:{argb:colors.primaryGreen} }; hRow.alignment={ vertical:'middle', horizontal:'center' }; hRow.height=20;
    headers.forEach((_, idx) => { const cell = sheet.getCell(`${String.fromCharCode(66 + idx)}${r}`); cell.border={ top:{style:'medium'}, left:{style:'medium'}, bottom:{style:'medium'}, right:{style:'medium'} }; }); r++;

    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedMatches.forEach(m => {
      const vp = calculatePoints(m, "vigontina"); const op = calculatePoints(m, "opponent");
      const vg = calculateTotalGoals(m, "vigontina"); const og = calculateTotalGoals(m, "opponent");
      const isWin = vp > op; const isLoss = vp < op; const rowData = [ fmtDateIT(m.date), m.opponent, `${vg} - ${og}`, `${vp} - ${op}`, m.competition || '-', m.isHome ? 'Casa' : 'Trasferta' ];
      const dataRow = sheet.addRow(['', ...rowData]); dataRow.height=22; dataRow.alignment={ vertical:'middle', horizontal:'center', wrapText:true };
      const rowColor = isWin ? 'FFD1FAE5' : isLoss ? 'FFFECACA' : 'FFFEF3C7';
      rowData.forEach((_, idx) => { const cell = sheet.getCell(`${String.fromCharCode(66 + idx)}${r}`); cell.fill={ type:'pattern', pattern:'solid', fgColor:{argb: rowColor} }; cell.border={ top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; if (idx===2 || idx===3) { cell.font={ bold:true, size:11 }; } });
      r++;
    });

    sheet.getColumn('B').width=11; sheet.getColumn('C').width=20; sheet.getColumn('D').width=10; sheet.getColumn('E').width=9; sheet.getColumn('F').width=18; sheet.getColumn('G').width=13;

    const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Vigontina_Storico_${fmtDateIT(new Date()).replace(/\//g,'-')}.xlsx`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click(); URL.revokeObjectURL(link.href);
    alert("Storico esportato con successo!"); return true;
  } catch (error) { console.error('Errore export storico:', error); alert(`Errore durante l'esportazione: ${error.message || "Errore sconosciuto"}`); return false; }
};
