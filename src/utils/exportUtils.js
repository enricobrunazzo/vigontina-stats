// utils/exportUtils.js
// Esportazione PDF/Excel coerente con la logica dell'app (punti/gol/periodi)

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

// Carica un’immagine come DataURL (per jsPDF.addImage)
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

/**
 * Esporta PDF coerente con l'app, con BANNER RISULTATO e LOGO.
 *
 * @param {Object} match - Oggetto partita
 * @param {Object} [opts]
 * @param {string} [opts.logoUrl] - URL/Path logo (default: `${import.meta.env.BASE_URL}logo-vigontina.png`)
 */
export const exportMatchToPDF = async (match, opts = {}) => {
  if (!match) return;

  const opponentName = match.opponent || "Avversari";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  // --- Calcoli coerenti con l'app ---
  const vp = calculatePoints(match, "vigontina");     // solo periodi non-PT e completed
  const op = calculatePoints(match, "opponent");
  const vg = calculateTotalGoals(match, "vigontina"); // senza PT
  const og = calculateTotalGoals(match, "opponent");
  const stats = calculateMatchStats(match);           // eventi senza PT
  const { resultText, isWin, isDraw /* isLoss */ } = getMatchResult(match);

  // --- Carica LOGO (facoltativo) ---
  const logoUrl =
    opts.logoUrl ?? `${import.meta.env.BASE_URL || "/"}logo-vigontina.png`;
  const logoDataUrl = await loadImageAsDataURL(logoUrl);

  /* ------------------------------- HEADER ------------------------------- */
  let y = margin;

  // Logo a sinistra (se disponibile)
  const logoW = 42;
  const logoH = 42;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH, undefined, "FAST");
  }

  // Titolo centrato
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("VIGONTINA SAN PAOLO - REPORT PARTITA", pageWidth / 2, y + 18, {
    align: "center",
  });

  // Spazio di sicurezza sotto il titolo e il logo
  const headerBottom = Math.max(y + 18, y + logoH);
  y = headerBottom + 12;

  /* --------------------------- BANNER RISULTATO ------------------------- */
  // Banner più sottile per evitare sovrapposizione con il logo
  const bg = isWin ? [220, 252, 231] : isDraw ? [254, 249, 195] : [254, 226, 226];
  const bd = isWin ? [16, 185, 129]  : isDraw ? [250, 204, 21]  : [239, 68, 68];
  const tx = isWin ? [4, 120, 87]    : isDraw ? [161, 98, 7]    : [153, 27, 27];

  const bannerX = margin;
  const bannerW = pageWidth - margin * 2;
  const bannerH = 28; // <-- più sottile

  doc.setFillColor(...bg);
  doc.setDrawColor(...bd);
  doc.roundedRect(bannerX, y, bannerW, bannerH, 6, 6, "FD");

  // Testo risultato a sinistra
  doc.setTextColor(...tx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(resultText, bannerX + 10, y + 19);

  // Punteggio a punti a destra
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Punti: Vigontina ${vp} - ${op} ${opponentName}`,
    bannerX + bannerW - 10,
    y + 19,
    { align: "right" }
  );

  // Reset colori testo
  doc.setTextColor(0, 0, 0);
  y += bannerH + 14;

  /* ------------------------------- META -------------------------------- */
  // ATTENZIONE: niente emoji e niente em-dash per evitare caratteri strani
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

  // Gol (senza PT)
  doc.setFont("helvetica", "bold");
  doc.text(`Gol (senza PT): ${vg} - ${og}`, margin, y);
  y += 18;

  /* --------------------------- DETTAGLIO PERIODI ----------------------- */
  doc.setFont("helvetica", "bold");
  doc.text("DETTAGLIO PERIODI", margin, y);
  y += 6;

  // >>>> RIMOSSA la colonna "Conta nei Punti"
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
        completed ? "Sì" : "No",
        outcome,
      ];
    }),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [54, 96, 146], textColor: 255 },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 14;

  /* ------------------------- ESITO PROVA TECNICA ------------------------ */
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
      headStyles: { fillColor: [107, 114, 128], textColor: 255 }, // grigio
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  /* ------------------------ MARCATORI / ASSIST / ALTRI ----------------- */
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

  /* --------------------------- CRONOLOGIA EVENTI ----------------------- */
  doc.setFont("helvetica", "bold");
  doc.text("CRONOLOGIA EVENTI", margin, y);
  y += 6;

  const rows = [];
  nonTechnicalPeriods(match).forEach((p) => {
    const events = Array.isArray(p.goals) ? p.goals : [];
    if (events.length === 0 && p.vigontina === 0 && p.opponent === 0) return;
    if (events.length === 0) {
      rows.push([p.name, "— nessun evento registrato —"]);
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

  // Nota footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(
    "Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa). I gol non includono la Prova Tecnica.",
    margin,
    Math.min(y, doc.internal.pageSize.getHeight() - margin)
  );

  // Salva PDF
  const fileName = `Vigontina_vs_${(opponentName || "").replace(/\s+/g, "_")}_${fmtDateIT(
    match.date
  )}.pdf`;
  doc.save(fileName);
};

/* -------------------------------------------------------------------------- */
/*                                   EXCEL                                    */
/* -------------------------------------------------------------------------- */

/**
 * Export Excel multi-foglio, coerente con la logica dell'app.
 * (stile minimale ma chiaro)
 */
export const exportMatchToExcel = (match) => {
  if (!match) return;
  try {
    const wb = XLSX.utils.book_new();
    const opponentName = match.opponent || "Avversari";

    // Calcoli coerenti con l'app
    const vp = calculatePoints(match, "vigontina");
    const op = calculatePoints(match, "opponent");
    const vg = calculateTotalGoals(match, "vigontina");
    const og = calculateTotalGoals(match, "opponent");
    const stats = calculateMatchStats(match);

    /* ------------------------------ Riassunto ------------------------------ */
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

    /* --------------------------- Dettaglio periodi ------------------------ */
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
          completed ? "Sì" : "No",
          outcome,
        ];
      }),
    ];
    const wsPeriods = XLSX.utils.aoa_to_sheet(periods);
    XLSX.utils.book_append_sheet(wb, wsPeriods, "Periodi");

    /* --------------------------- Marcatori/Assist ------------------------- */
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

    /* --------------------------- Cronologia Eventi ------------------------ */
    const eventsRows = [
      ["CRONOLOGIA EVENTI"],
      [""],
      ["Periodo", "Minuto", "Evento"],
    ];
    nonTechnicalPeriods(match).forEach((p) => {
      const events = Array.isArray(p.goals) ? p.goals : [];
      if (events.length === 0 && p.vigontina === 0 && p.opponent === 0) return;
      if (events.length === 0) {
        eventsRows.push([p.name, "", "— nessun evento registrato —"]);
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
    alert(`❌ Errore durante l'esportazione Excel: ${error.message ?? "Errore sconosciuto"}`);
  }
};