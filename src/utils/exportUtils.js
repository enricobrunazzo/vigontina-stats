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

const isScorable = (p) => !isTechnicalTest(p) && p?.completed === true;

const nonTechnicalPeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => !isTechnicalTest(p))
    : [];

const technicalTestPeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => isTechnicalTest(p))
    : [];

const scorablePeriods = (match) =>
  Array.isArray(match?.periods)
    ? match.periods.filter((p) => isScorable(p))
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

// Carica un'immagine come DataURL (per jsPDF.addImage)
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
/*                               EXCEL SINGOLA                                */
/* -------------------------------------------------------------------------- */

export const exportMatchToExcel = (match) => {
  if (!match) return;
  try {
    const wb = XLSX.utils.book_new();
    const opponentName = match.opponent || "Avversari";

    const vp = calculatePoints(match, "vigontina");
    const op = calculatePoints(match, "opponent");
    const vg = calculateTotalGoals(match, "vigontina");
    const og = calculateTotalGoals(match, "opponent");
    const stats = calculateMatchStats(match);

    const summary = [
      ["VIGONTINA SAN PAOLO - RIASSUNTO PARTITA"],
      [""],
      ["Competizione", match.competition || ""],
      ["Giornata", match.matchDay ?? ""],
      ["Avversario", opponentName],
      ["Data", fmtDateIT(match.date)],
      ["Luogo", match.isHome ? "Casa" : "Trasferta"],
      [
        "Capitano",
        match.captain
          ? `${match.captain} ${
              PLAYERS.find((p) => p.num === match.captain)?.name || ""
            }`
          : "",
      ],
      ["Assistente Arbitro", match.assistantReferee ?? ""],
      ["Dirigente Accompagnatore", match.teamManager ?? ""],
      [""],
      ["RISULTATO FINALE"],
      ["Punti", `Vigontina ${vp} - ${op} ${opponentName}`],
      ["Gol Totali (senza PT)", `${vg} - ${og}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Riassunto");

    const periods = [
      ["DETTAGLIO PERIODI"],
      [""],
      ["Periodo", "Vigontina", opponentName, "Completato", "Esito"],
      ...nonTechnicalPeriods(match).map((p) => {
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
    ];
    const wsPeriods = XLSX.utils.aoa_to_sheet(periods);
    XLSX.utils.book_append_sheet(wb, wsPeriods, "Periodi");

    const scorersRows = [
      ["MARCATORI"],
      [""],
      ["Numero", "Giocatore", "Gol"],
      ...Object.entries(stats.scorers)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
          return [num, player?.name ?? "Sconosciuto", count];
        }),
      [""],
      ["ASSIST"],
      [""],
      ["Numero", "Giocatore", "Assist"],
      ...Object.entries(stats.assisters)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num, 10));
          return [num, player?.name ?? "Sconosciuto", count];
        }),
    ];
    const wsScorers = XLSX.utils.aoa_to_sheet(scorersRows);
    XLSX.utils.book_append_sheet(wb, wsScorers, "Marcatori");

    const eventsRows = [
      ["CRONOLOGIA EVENTI"],
      [""],
      ["Periodo", "Minuto", "Evento"],
    ];
    nonTechnicalPeriods(match).forEach((p) => {
      const events = Array.isArray(p.goals) ? p.goals : [];
      if (events.length === 0 && p.vigontina === 0 && p.opponent === 0) return;
      if (events.length === 0) {
        eventsRows.push([p.name, "", "- nessun evento registrato -"]);
      } else {
        events.forEach((e, idx) => {
          eventsRows.push([
            idx === 0 ? p.name : "",
            e.minute != null ? `${e.minute}'` : "",
            eventLabel(e, opponentName),
          ]);
        });
      }
    });
    const wsEvents = XLSX.utils.aoa_to_sheet(eventsRows);
    XLSX.utils.book_append_sheet(wb, wsEvents, "Eventi");

    const fileName = `Vigontina_vs_${(opponentName || "").replace(/\s+/g, "_")}_${fmtDateIT(
      match.date
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

    const sheet1 = workbook.addWorksheet('Riepilogo Stagione', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}forza-vigontina.png`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });

      sheet1.addImage(imageId, {
        tl: { col: 1.5, row: 0.5 },
        ext: { width: 150, height: 100 }
      });
    } catch (error) {
      console.warn('Logo non caricato:', error);
    }

    sheet1.getRow(1).height = 25;
    sheet1.getRow(2).height = 25;
    sheet1.getRow(3).height = 25;
    sheet1.getRow(4).height = 25;

    sheet1.mergeCells('A6:F6');
    const titleCell = sheet1.getCell('A6');
    titleCell.value = 'VIGONTINA CALCIO - STAGIONE 2025/2026';
    titleCell.font = { size: 20, bold: true, color: { argb: colors.white } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primaryGreen }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(6).height = 35;

    sheet1.mergeCells('A7:F7');
    const subtitleCell = sheet1.getCell('A7');
    subtitleCell.value = 'STORICO PARTITE';
    subtitleCell.font = { size: 14, bold: true, color: { argb: colors.white } };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.darkGreen }
    };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(7).height = 25;

    sheet1.addRow([]);

    const stats = {
      totPartite: matches.length,
      vittorie: 0,
      pareggi: 0,
      sconfitte: 0,
      golFatti: 0,
      golSubiti: 0,
      puntiFatti: 0,
      puntiSubiti: 0
    };

    matches.forEach(match => {
      const vp = calculatePoints(match, "vigontina");
      const op = calculatePoints(match, "opponent");
      const vg = calculateTotalGoals(match, "vigontina");
      const og = calculateTotalGoals(match, "opponent");

      stats.puntiFatti += vp;
      stats.puntiSubiti += op;
      stats.golFatti += vg;
      stats.golSubiti += og;

      if (vp > op) stats.vittorie++;
      else if (vp === op) stats.pareggi++;
      else stats.sconfitte++;
    });

    const statsData = [
      ['STATISTICHE STAGIONE', '', '', ''],
      ['Partite Giocate', stats.totPartite, 'Punti Fatti', stats.puntiFatti],
      ['Vittorie', stats.vittorie, 'Punti Subiti', stats.puntiSubiti],
      ['Pareggi', stats.pareggi, 'Gol Fatti', stats.golFatti],
      ['Sconfitte', stats.sconfitte, 'Gol Subiti', stats.golSubiti],
      ['', '', 'Differenza Reti', stats.golFatti - stats.golSubiti]
    ];

    let currentRow = 9;
    statsData.forEach((row, idx) => {
      const excelRow = sheet1.addRow(row);
      excelRow.height = 22;

      if (idx === 0) {
        sheet1.mergeCells(`A${currentRow}:D${currentRow}`);
        excelRow.font = { bold: true, size: 12, color: { argb: colors.white } };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.lightGreen }
        };
        excelRow.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        ['A', 'B', 'C', 'D'].forEach(col => {
          const cell = sheet1.getCell(`${col}${currentRow}`);
          cell.font = { size: 11, bold: col === 'A' || col === 'C' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.lightGray }
          };
          cell.alignment = { horizontal: col === 'A' || col === 'C' ? 'left' : 'center', vertical: 'middle' };
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
    sheet1.addRow([]);

    sheet1.mergeCells(`A${currentRow}:F${currentRow}`);
    const matchesHeaderCell = sheet1.getCell(`A${currentRow}`);
    matchesHeaderCell.value = 'DETTAGLIO PARTITE';
    matchesHeaderCell.font = { size: 12, bold: true, color: { argb: colors.white } };
    matchesHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.lightGreen }
    };
    matchesHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(currentRow).height = 22;
    currentRow++;

    const headers = ['Data', 'Avversario', 'Risultato', 'Punti', 'Competizione', 'Casa/Trasferta'];
    const headerRow = sheet1.addRow(headers);
    headerRow.font = { bold: true, size: 11, color: { argb: colors.white } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.darkGreen }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    headers.forEach((_, idx) => {
      const cell = sheet1.getCell(`${String.fromCharCode(65 + idx)}${currentRow}`);
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    });
    currentRow++;

    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedMatches.forEach(match => {
      const vp = calculatePoints(match, "vigontina");
      const op = calculatePoints(match, "opponent");
      const vg = calculateTotalGoals(match, "vigontina");
      const og = calculateTotalGoals(match, "opponent");
      const isWin = vp > op;
      const isLoss = vp < op;

      const rowData = [
        fmtDateIT(match.date),
        match.opponent,
        `${vg} - ${og}`,
        `${vp} - ${op}`,
        match.competition || '-',
        match.isHome ? 'Casa' : 'Trasferta'
      ];

      const dataRow = sheet1.addRow(rowData);
      dataRow.height = 18;
      dataRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const rowColor = isWin ? 'FFD1FAE5' : isLoss ? 'FFFECACA' : 'FFFEF3C7';
      
      rowData.forEach((_, idx) => {
        const cell = sheet1.getCell(`${String.fromCharCode(65 + idx)}${currentRow}`);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowColor }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        if (idx === 2 || idx === 3) {
          cell.font = { bold: true, size: 11 };
        }
      });
      currentRow++;
    });

    sheet1.getColumn('A').width = 12;
    sheet1.getColumn('B').width = 25;
    sheet1.getColumn('C').width = 12;
    sheet1.getColumn('D').width = 10;
    sheet1.getColumn('E').width = 20;
    sheet1.getColumn('F').width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Vigontina_Storico_${fmtDateIT(new Date()).replace(/\//g, '-')}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    alert("Storico esportato con successo!");
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