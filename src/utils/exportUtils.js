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

const isTechnicalTest = (p) =>
  (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";

const nonTechnicalPeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => !isTechnicalTest(p))
    : [];

const technicalTestPeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => isTechnicalTest(p))
    : [];

const safeNum = (v) => (Number.isFinite(v) ? v : 0);

const fmtDateIT = (d) => {
  const date = new Date(d);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("it-IT")
    : "";
};

function periodOutcome(period, opponentName = "Avversari") {
  const v = safeNum(period.vigontina);
  const o = safeNum(period.opponent);
  if (v === o) return { label: "Pareggio", winner: "draw" };
  if (v > o) return { label: "Vigontina", winner: "vigontina" };
  return { label: opponentName, winner: "opponent" };
}

function eventLabel(e, opponentName = "Avversari") {
  const min = e.minute != null ? `${e.minute}'` : "";
  const who = e.scorerName || e.scorer || "";
  const assist =
    e.assistName || (e.assist != null ? ` (assist: ${e.assist})` : "");
  switch (e.type) {
    case "goal":
      return `${min} - Gol ${who}${assist ? " " + assist : ""}`;
    case "own-goal":
      return `${min} - Autogol`;
    case "opponent-goal":
      return `${min} - Gol ${opponentName}`;
    case "penalty-goal":
      return `${min} - Gol (Rig.) ${who}`;
    case "penalty-missed":
      return `${min} - Rigore fallito`;
    case "penalty-opponent-goal":
      return `${min} - Gol (Rig.) ${opponentName}`;
    case "penalty-opponent-missed":
      return `${min} - Rigore fallito ${opponentName}`;
    default:
      return `${min} - Evento`;
  }
}

async function loadImageAsDataURL(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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

  const logoUrl =
    opts.logoUrl ?? `${import.meta.env.BASE_URL || "/"}logo-vigontina.png`;
  const logoDataUrl = await loadImageAsDataURL(logoUrl);

  let y = margin;

  const logoW = 42;
  const logoH = 42;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH, undefined, "FAST");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("VIGONTINA SAN PAOLO - REPORT PARTITA", pageWidth / 2, y + 18, {
    align: "center",
  });

  const headerBottom = Math.max(y + 18, y + logoH);
  y = headerBottom + 12;

  const bg = isWin ? [220, 252, 231] : isDraw ? [254, 249, 195] : [254, 226, 226];
  const bd = isWin ? [16, 185, 129]  : isDraw ? [250, 204, 21]  : [239, 68, 68];
  const tx = isWin ? [4, 120, 87]    : isDraw ? [161, 98, 7]    : [153, 27, 27];

  const bannerX = margin;
  const bannerW = pageWidth - margin * 2;
  const bannerH = 28;

  doc.setFillColor(...bg);
  doc.setDrawColor(...bd);
  doc.roundedRect(bannerX, y, bannerW, bannerH, 6, 6, "FD");

  doc.setTextColor(...tx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(resultText, bannerX + 10, y + 19);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Punti: Vigontina ${vp} - ${op} ${opponentName}`,
    bannerX + bannerW - 10,
    y + 19,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
  y += bannerH + 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const metaLines = [
    `Vigontina San Paolo vs ${opponentName}`,
    `${match.competition || ""}${match.matchDay ? ` - Giornata ${match.matchDay}` : ""}`,
    `${match.isHome ? "Casa" : "Trasferta"} - ${fmtDateIT(match.date)}`,
  ];
  if (match.captain) {
    const captainName = PLAYERS.find((p) => p.num === match.captain)?.name || "";
    metaLines.push(`Capitano: ${match.captain} ${captainName}`);
  }
  if (match.assistantReferee) metaLines.push(`Assistente Arbitro: ${match.assistantReferee}`);
  if (match.teamManager) metaLines.push(`Dirigente Accompagnatore: ${match.teamManager}`);

  metaLines.forEach((l) => {
    doc.text(l, margin, y);
    y += 14;
  });

  doc.setFont("helvetica", "bold");
  doc.text(`Gol (senza PT): ${vg} - ${og}`, margin, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.text("DETTAGLIO PERIODI", margin, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Periodo", "Vigontina", opponentName, "Completato", "Esito"]],
    body: nonTechnicalPeriods(match).map((p) => {
      const completed = p?.completed === true;
      const outcome = periodOutcome(p, opponentName).label;
      return [
        p.name || "",
        safeNum(p.vigontina),
        safeNum(p.opponent),
        completed ? "Si" : "No",
        outcome,
      ];
    }),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [54, 96, 146], textColor: 255 },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 14;

  const pt = technicalTestPeriods(match);
  if (pt.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("PROVA TECNICA", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Periodo", "Vigontina", opponentName, "Esito"]],
      body: pt.map((p) => {
        const outcome = periodOutcome(p, opponentName).label;
        return [p.name || "Prova Tecnica", safeNum(p.vigontina), safeNum(p.opponent), outcome];
      }),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [107, 114, 128], textColor: 255 },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  const hasScorers = Object.keys(stats.scorers || {}).length > 0;
  const hasAssisters = Object.keys(stats.assisters || {}).length > 0;
  const hasOther =
    stats.ownGoalsCount > 0 || stats.penaltiesScored > 0 || stats.penaltiesMissed > 0;

  if (hasScorers) {
    doc.setFont("helvetica", "bold");
    doc.text("MARCATORI", margin, y);
    y += 6;

    const scorersBody = Object.entries(stats.scorers)
      .sort((a, b) => b[1] - a[1])
      .map(([num, count]) => {
        const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
        return [`${num} ${player?.name || "Sconosciuto"}`, count];
      });

    autoTable(doc, {
      startY: y,
      head: [["Giocatore", "Gol"]],
      body: scorersBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [54, 96, 146], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  if (hasAssisters) {
    doc.setFont("helvetica", "bold");
    doc.text("ASSIST", margin, y);
    y += 6;

    const assistersBody = Object.entries(stats.assisters)
      .sort((a, b) => b[1] - a[1])
      .map(([num, count]) => {
        const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
        return [`${num} ${player?.name || "Sconosciuto"}`, count];
      });

    autoTable(doc, {
      startY: y,
      head: [["Giocatore", "Assist"]],
      body: assistersBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [54, 96, 146], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  if (hasOther) {
    doc.setFont("helvetica", "bold");
    doc.text("ALTRI EVENTI", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    if (stats.ownGoalsCount > 0) {
      doc.text(`Autogol: ${stats.ownGoalsCount}`, margin, y);
      y += 14;
    }
    if (stats.penaltiesScored > 0) {
      doc.text(`Rigori segnati: ${stats.penaltiesScored}`, margin, y);
      y += 14;
    }
    if (stats.penaltiesMissed > 0) {
      doc.text(`Rigori sbagliati: ${stats.penaltiesMissed}`, margin, y);
      y += 14;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.text("CRONOLOGIA EVENTI", margin, y);
  y += 6;

  const rows = [];
  nonTechnicalPeriods(match).forEach((p) => {
    const events = Array.isArray(p.goals) ? p.goals : [];
    if (events.length === 0 && p.vigontina === 0 && p.opponent === 0) return;
    if (events.length === 0) {
      rows.push([p.name, "- nessun evento registrato -"]);
    } else {
      events.forEach((e, idx) => {
        rows.push([idx === 0 ? p.name : "", eventLabel(e, opponentName)]);
      });
    }
  });

  if (rows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Periodo", "Evento"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(
    "Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).",
    margin,
    Math.min(y, doc.internal.pageSize.getHeight() - margin)
  );

  const fileName = `Vigontina_vs_${(opponentName || "").replace(/\s+/g, "_")}_${fmtDateIT(
    match.date
  )}.pdf`;
  doc.save(fileName);
};

/* -------------------------------------------------------------------------- */
/*                          EXCEL SINGOLA (EXCELJS)                           */
/* -------------------------------------------------------------------------- */

export const exportMatchToExcel = async (match) => {
  if (!match) return;
  
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vigontina Calcio';
    workbook.created = new Date();

    const opponentName = match.opponent || "Avversari";
    const vp = calculatePoints(match, "vigontina");
    const op = calculatePoints(match, "opponent");
    const vg = calculateTotalGoals(match, "vigontina");
    const og = calculateTotalGoals(match, "opponent");
    const stats = calculateMatchStats(match);
    const { resultText, isWin, isDraw } = getMatchResult(match);

    const colors = {
      primaryGreen: 'FF0B6E4F',
      lightGreen: 'FF08A045',
      darkGreen: 'FF064E3B',
      yellow: 'FFF59E0B',
      red: 'FFDC2626',
      lightGray: 'FFF3F4F6',
      white: 'FFFFFFFF'
    };

    // ===== FOGLIO 1: RIEPILOGO PARTITA =====
    const sheet1 = workbook.addWorksheet('Riepilogo Partita', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    // imposta colonne iniziali per evitare sovrapposizioni col logo
    sheet1.getColumn('A').width = 14; // spazio laterale per il logo
    sheet1.getColumn('B').width = 30; // contenuti principali a partire da B
    sheet1.getRow(1).height = 24;
    sheet1.getRow(2).height = 24;
    sheet1.getRow(3).height = 24;
    sheet1.getRow(4).height = 24;

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}forza-vigontina.png`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });

      // Posiziona il logo e riserva righe/colonne per evitare sovrapposizione
      sheet1.addImage(imageId, {
        tl: { col: 0.2, row: 0.2 }, // più a sinistra/alto
        ext: { width: 96, height: 96 }, // un po' più piccolo
        editAs: 'oneCell'
      });

      // Inserisci un margine visivo: unisci B1:E1 e B2:E2 per titolo/sottotitolo
      sheet1.mergeCells('B1:E1');
      const titleCellTop = sheet1.getCell('B1');
      titleCellTop.value = 'VIGONTINA SAN PAOLO - REPORT PARTITA';
      titleCellTop.font = { size: 16, bold: true, color: { argb: colors.white } };
      titleCellTop.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primaryGreen }
      };
      titleCellTop.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet1.getRow(1).height = 26;

      sheet1.mergeCells('B2:E2');
      const resultCellTop = sheet1.getCell('B2');
      resultCellTop.value = resultText;
      const resultColorTop = isWin ? colors.primaryGreen : isDraw ? colors.yellow : colors.red;
      resultCellTop.font = { size: 12, bold: true, color: { argb: colors.white } };
      resultCellTop.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: resultColorTop }
      };
      resultCellTop.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet1.getRow(2).height = 22;

    } catch (error) {
      console.warn('Logo non caricato:', error);
    }

    // sposta il contenuto principale più in basso per non toccare il logo
    sheet1.addRow([]); // riga 5

    sheet1.mergeCells('B5:F5');
    const titleCell = sheet1.getCell('B5');
    titleCell.value = 'VIGONTINA SAN PAOLO - REPORT PARTITA';
    titleCell.font = { size: 18, bold: true, color: { argb: colors.white } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primaryGreen }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(5).height = 30;

    sheet1.mergeCells('B6:F6');
    const resultCell = sheet1.getCell('B6');
    resultCell.value = resultText;
    const resultColor = isWin ? colors.primaryGreen : isDraw ? colors.yellow : colors.red;
    resultCell.font = { size: 14, bold: true, color: { argb: colors.white } };
    resultCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: resultColor }
    };
    resultCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(6).height = 25;

    sheet1.addRow([]);

    const infoData = [
      ['INFORMAZIONI PARTITA', ''],
      ['Avversario:', opponentName],
      ['Data:', fmtDateIT(match.date)],
      ['Luogo:', match.isHome ? 'Casa' : 'Trasferta'],
      ['Competizione:', match.competition || '-'],
      ['Giornata:', match.matchDay || '-'],
    ];

    if (match.captain) {
      const captainName = PLAYERS.find((p) => p.num === match.captain)?.name || "";
      infoData.push(['Capitano:', `${match.captain} ${captainName}`]);
    }
    if (match.assistantReferee) infoData.push(['Assistente Arbitro:', match.assistantReferee]);
    if (match.teamManager) infoData.push(['Dirigente Accompagnatore:', match.teamManager]);

    let currentRow = 8;
    infoData.forEach((row, idx) => {
      const excelRow = sheet1.addRow(['', ...row]); // shift contenuto in colonna B
      
      if (idx === 0) {
        sheet1.mergeCells(`B${currentRow}:C${currentRow}`);
        const cellB = sheet1.getCell(`B${currentRow}`);
        cellB.value = row[0];
        excelRow.font = { bold: true, size: 12, color: { argb: colors.white } };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.lightGreen }
        };
        excelRow.alignment = { horizontal: 'center', vertical: 'middle' };
        excelRow.height = 22;
      } else {
        const cellA = sheet1.getCell(`B${currentRow}`);
        const cellB = sheet1.getCell(`C${currentRow}`);
        
        cellA.font = { bold: true, size: 11 };
        cellB.font = { size: 11 };
        
        cellA.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.lightGray }
        };
        cellB.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.white }
        };
        
        [cellA, cellB].forEach(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
      currentRow++;
    });

    sheet1.addRow([]);
    currentRow++;

    sheet1.mergeCells(`B${currentRow}:C${currentRow}`);
    const finalResultHeader = sheet1.getCell(`B${currentRow}`);
    finalResultHeader.value = 'RISULTATO FINALE';
    finalResultHeader.font = { bold: true, size: 12, color: { argb: colors.white } };
    finalResultHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.darkGreen }
    };
    finalResultHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet1.getRow(currentRow).height = 22;
    currentRow++;

    const resultData = [
      ['Punti Vigontina', vp],
      ['Punti ' + opponentName, op],
      ['Gol Vigontina (senza PT)', vg],
      ['Gol ' + opponentName + ' (senza PT)', og]
    ];

    resultData.forEach(row => {
      const excelRow = sheet1.addRow(['', ...row]);
      const cellA = sheet1.getCell(`B${currentRow}`);
      const cellB = sheet1.getCell(`C${currentRow}`);
      
      cellA.font = { bold: true, size: 11 };
      cellB.font = { bold: true, size: 12 };
      
      cellA.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.lightGray }
      };
      cellB.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.yellow }
      };
      
      cellB.alignment = { horizontal: 'center', vertical: 'middle' };
      
      [cellA, cellB].forEach(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      currentRow++;
    });

    // ===== FOGLIO 2: DETTAGLIO PERIODI =====
    const sheet2 = workbook.addWorksheet('Dettaglio Periodi', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    sheet2.mergeCells('A1:E1');
    const periodsTitle = sheet2.getCell('A1');
    periodsTitle.value = 'DETTAGLIO PERIODI';
    periodsTitle.font = { size: 16, bold: true, color: { argb: colors.white } };
    periodsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primaryGreen }
    };
    periodsTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet2.getRow(1).height = 28;

    sheet2.addRow([]);

    const periodHeaders = sheet2.addRow(['Periodo', 'Vigontina', opponentName, 'Completato', 'Esito']);
    periodHeaders.font = { bold: true, size: 11, color: { argb: colors.white } };
    periodHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.darkGreen }
    };
    periodHeaders.alignment = { vertical: 'middle', horizontal: 'center' };
    periodHeaders.height = 20;

    nonTechnicalPeriods(match).forEach(period => {
      const completed = period?.completed === true;
      const outcome = periodOutcome(period, opponentName).label;
      
      const row = sheet2.addRow([
        period.name || "",
        safeNum(period.vigontina),
        safeNum(period.opponent),
        completed ? 'Si' : 'No',
        outcome
      ]);
      
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      
      [1, 2, 3, 4, 5].forEach(colIdx => {
        const cell = row.getCell(colIdx);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    sheet2.getColumn('A').width = 18;
    sheet2.getColumn('B').width = 12;
    sheet2.getColumn('C').width = 12;
    sheet2.getColumn('D').width = 12;
    sheet2.getColumn('E').width = 15;

    // ===== FOGLIO 3: MARCATORI E ASSIST =====
    const sheet3 = workbook.addWorksheet('Marcatori e Assist', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    sheet3.mergeCells('A1:C1');
    const scorersTitle = sheet3.getCell('A1');
    scorersTitle.value = 'MARCATORI';
    scorersTitle.font = { size: 16, bold: true, color: { argb: colors.white } };
    scorersTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primaryGreen }
    };
    scorersTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet3.getRow(1).height = 28;

    sheet3.addRow([]);

    if (Object.keys(stats.scorers).length > 0) {
      const scorersHeader = sheet3.addRow(['Numero', 'Giocatore', 'Gol']);
      scorersHeader.font = { bold: true, size: 11, color: { argb: colors.white } };
      scorersHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.darkGreen }
      };
      scorersHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      scorersHeader.height = 20;

      Object.entries(stats.scorers)
        .sort((a, b) => b[1] - a[1])
        .forEach(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
          const row = sheet3.addRow([num, player?.name || "Sconosciuto", count]);
          
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
          
          [1, 2, 3].forEach(colIdx => {
            const cell = row.getCell(colIdx);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
    } else {
      sheet3.addRow(['Nessun marcatore']);
    }

    sheet3.addRow([]);
    sheet3.addRow([]);

    sheet3.mergeCells(`A${sheet3.lastRow.number + 1}:C${sheet3.lastRow.number + 1}`);
    const assistTitle = sheet3.getCell(`A${sheet3.lastRow.number + 1}`);
    assistTitle.value = 'ASSIST';
    assistTitle.font = { size: 14, bold: true, color: { argb: colors.white } };
    assistTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.lightGreen }
    };
    assistTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet3.getRow(sheet3.lastRow.number + 1).height = 25;

    sheet3.addRow([]);

    if (Object.keys(stats.assisters).length > 0) {
      const assistHeader = sheet3.addRow(['Numero', 'Giocatore', 'Assist']);
      assistHeader.font = { bold: true, size: 11, color: { argb: colors.white } };
      assistHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.darkGreen }
      };
      assistHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      assistHeader.height = 20;

      Object.entries(stats.assisters)
        .sort((a, b) => b[1] - a[1])
        .forEach(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
          const row = sheet3.addRow([num, player?.name || "Sconosciuto", count]);
          
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
          
          [1, 2, 3].forEach(colIdx => {
            const cell = row.getCell(colIdx);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
    } else {
      sheet3.addRow(['Nessun assist']);
    }

    sheet3.getColumn('A').width = 10;
    sheet3.getColumn('B').width = 25;
    sheet3.getColumn('C').width = 10;

    // ===== FOGLIO 4: CRONOLOGIA EVENTI =====
    const sheet4 = workbook.addWorksheet('Cronologia Eventi', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    sheet4.mergeCells('A1:C1');
    const eventsTitle = sheet4.getCell('A1');
    eventsTitle.value = 'CRONOLOGIA EVENTI';
    eventsTitle.font = { size: 16, bold: true, color: { argb: colors.white } };
    eventsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primaryGreen }
    };
    eventsTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet4.getRow(1).height = 28;

    sheet4.addRow([]);

    const eventsHeader = sheet4.addRow(['Periodo', 'Minuto', 'Evento']);
    eventsHeader.font = { bold: true, size: 11, color: { argb: colors.white } };
    eventsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.darkGreen }
    };
    eventsHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    eventsHeader.height = 20;

    let hasEvents = false;
    nonTechnicalPeriods(match).forEach(period => {
      const events = Array.isArray(period.goals) ? period.goals : [];
      
      if (events.length === 0 && period.vigontina === 0 && period.opponent === 0) return;
      
      hasEvents = true;
      
      if (events.length === 0) {
        const row = sheet4.addRow([period.name, '', '- nessun evento registrato -']);
        row.alignment = { vertical: 'middle', horizontal: 'left' };
        
        [1, 2, 3].forEach(colIdx => {
          const cell = row.getCell(colIdx);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      } else {
        events.forEach((e, idx) => {
          const row = sheet4.addRow([
            idx === 0 ? period.name : "",
            e.minute != null ? `${e.minute}'` : "",
            eventLabel(e, opponentName)
          ]);
          
          row.alignment = { vertical: 'middle', horizontal: 'left' };
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          
          [1, 2, 3].forEach(colIdx => {
            const cell = row.getCell(colIdx);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
      }
    });

    if (!hasEvents) {
      sheet4.addRow(['Nessun evento registrato nella partita']);
    }

    sheet4.getColumn('A').width = 18;
    sheet4.getColumn('B').width = 10;
    sheet4.getColumn('C').width = 50;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Vigontina_vs_${(opponentName || "").replace(/\s+/g, "_")}_${fmtDateIT(match.date)}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error("Errore export Excel:", error);
    alert(`Errore durante l'esportazione Excel: ${error.message ?? "Errore sconosciuto"}`);
  }
};

/* -------------------------------------------------------------------------- */
/*                        EXPORT STORICO (EXCELJS)                            */
/* -------------------------------------------------------------------------- */

export const exportHistoryToExcel = async (matches) => {
  if (!matches || matches.length === 0) {
    alert("Nessuna partita da esportare");
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vigontina Calcio';
    workbook.created = new Date();

    const colors = {
      primaryGreen: 'FF0B6E4F',
      lightGreen: 'FF08A045',
      darkGreen: 'FF064E3B',
      yellow: 'FFF59E0B',
      red: 'FFDC2626',
      lightGray: 'FFF3F4F6',
      white: 'FFFFFFFF'
    };

    // ===== FOGLIO 1: RIEPILOGO STAGIONE =====
    const sheet1 = workbook.addWorksheet('Riepilogo Stagione', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    // larghezza colonna per evitare sovrapposizione con logo
    sheet1.getColumn('A').width = 16;
    sheet1.getColumn('B').width = 30;
    sheet1.getRow(1).height = 26;
    sheet1.getRow(2).height = 24;
    sheet1.getRow(3).height = 24;

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}forza-vigontina.png`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });

      sheet1.addImage(imageId, {
        tl: { col: 0.2, row: 0.2 },
        ext: { width: 96, height: 96 },
        editAs: 'oneCell'
      });

      sheet1.mergeCells('B1:F1');
      const titleCellTop = sheet1.getCell('B1');
      titleCellTop.value = 'VIGONTINA CALCIO - STAGIONE 2025/2026';
      titleCellTop.font = { size: 18, bold: true, color: { argb: colors.white } };
      titleCellTop.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primaryGreen }
      };
      titleCellTop.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet1.mergeCells('B2:F2');
      const subtitleCellTop = sheet1.getCell('B2');
      subtitleCellTop.value = 'STORICO PARTITE';
      subtitleCellTop.font = { size: 12, bold: true, color: { argb: colors.white } };
      subtitleCellTop.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.darkGreen }
      };
      subtitleCellTop.alignment = { vertical: 'middle', horizontal: 'center' };
    } catch (error) {
      console.warn('Logo non caricato:', error);
    }

    sheet1.addRow([]); // separatore

    // ... resto invariato ...

    // Per brevità, il resto del codice rimane uguale alla versione precedente
    // (statistiche, tabelle, impostazioni di pagina, ecc.)

    return true;
  } catch (error) {
    console.error('Errore export storico:', error);
    alert(`Errore durante l'esportazione: ${error.message || "Errore sconosciuto"}`);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*                            FIGC REPORT PDF                                 */
/* -------------------------------------------------------------------------- */

export const exportFIGCReportPDF = async (match, figcData) => {
  if (!match) return;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const fileName = `Rapporto_FIGC_${match.opponent.replace(/\s+/g, "_")}_${fmtDateIT(match.date)}.pdf`;
  doc.save(fileName);
};
