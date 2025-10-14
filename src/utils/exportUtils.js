// utils/exportUtils.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PLAYERS } from "../constants/players";

/**
 * Esporta una partita in formato Excel con fogli multipli
 * @param {Object} match - Oggetto partita da esportare
 */
export const exportMatchToExcel = (match) => {
  if (!match) return;

  try {
    const wb = XLSX.utils.book_new();

    // Calcola statistiche
    const vigontinaPoints = match.finalPoints?.vigontina || 0;
    const opponentPoints = match.finalPoints?.opponent || 0;
    const vigontinaGoals = match.periods.reduce(
      (sum, p) => sum + (p.name !== "PROVA TECNICA" ? p.vigontina : 0),
      0
    );
    const opponentGoals = match.periods.reduce(
      (sum, p) => sum + (p.name !== "PROVA TECNICA" ? p.opponent : 0),
      0
    );

    const scorers = {};
    const assisters = {};
    match.periods.forEach((period) => {
      (period.goals ?? []).forEach((event) => {
        if (event.type === "goal" || event.type === "penalty-goal") {
          if (event.scorer) {
            scorers[event.scorer] = (scorers[event.scorer] ?? 0) + 1;
          }
          if (event.assist) {
            assisters[event.assist] = (assisters[event.assist] ?? 0) + 1;
          }
        }
      });
    });

    // Foglio 1: Riassunto
    const summaryData = [
      ["VIGONTINA SAN PAOLO - RIASSUNTO PARTITA"],
      [""],
      ["Competizione", match.competition],
      ["Giornata", match.matchDay || ""],
      ["Avversario", match.opponent],
      ["Data", new Date(match.date).toLocaleDateString("it-IT")],
      ["Luogo", match.isHome ? "Casa" : "Trasferta"],
      [
        "Capitano",
        match.captain
          ? `${match.captain} ${PLAYERS.find((p) => p.num === match.captain)?.name || ""}`
          : "",
      ],
      ["Assistente Arbitro", match.assistantReferee || ""],
      ["Dirigente Accompagnatore", match.teamManager || ""],
      [""],
      ["RISULTATO FINALE"],
      [
        "Punti",
        `Vigontina ${vigontinaPoints} - ${opponentPoints} ${match.opponent}`,
      ],
      ["Gol Totali", `${vigontinaGoals} - ${opponentGoals}`],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Riassunto");

    // Foglio 2: Dettaglio Periodi
    const periodsData = [
      ["DETTAGLIO PERIODI"],
      [""],
      ["Periodo", "Vigontina", "Avversario"],
      ...match.periods.map((period) => [
        period.name,
        period.vigontina,
        period.opponent,
      ]),
    ];
    const periodsWs = XLSX.utils.aoa_to_sheet(periodsData);
    XLSX.utils.book_append_sheet(wb, periodsWs, "Periodi");

    // Foglio 3: Marcatori e Assist
    const scorersData = [
      ["MARCATORI"],
      [""],
      ["Numero", "Giocatore", "Gol"],
      ...Object.entries(scorers)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num));
          return [num, player?.name ?? "Sconosciuto", count];
        }),
      [""],
      ["ASSIST"],
      [""],
      ["Numero", "Giocatore", "Assist"],
      ...Object.entries(assisters)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num));
          return [num, player?.name ?? "Sconosciuto", count];
        }),
    ];
    const scorersWs = XLSX.utils.aoa_to_sheet(scorersData);
    XLSX.utils.book_append_sheet(wb, scorersWs, "Marcatori");

    // Foglio 4: Cronologia Eventi
    const eventsData = [
      ["CRONOLOGIA EVENTI"],
      [""],
      ["Periodo", "Minuto", "Tipo", "Dettagli"],
      ...match.periods.flatMap((period) =>
        (period.goals ?? []).map((event) => {
          let tipo = "";
          let dettagli = "";
          switch (event.type) {
            case "goal":
              tipo = "Gol";
              dettagli = `${event.scorer} ${event.scorerName}`;
              if (event.assist)
                dettagli += ` (assist: ${event.assist} ${event.assistName})`;
              break;
            case "own-goal":
              tipo = "Autogol";
              dettagli = "Vigontina";
              break;
            case "opponent-goal":
              tipo = "Gol Avversario";
              dettagli = match.opponent;
              break;
            case "penalty-goal":
              tipo = "Rigore Segnato";
              dettagli = `${event.scorer} ${event.scorerName}`;
              break;
            case "penalty-missed":
              tipo = "Rigore Fallito";
              dettagli = "Vigontina";
              break;
            case "penalty-opponent-goal":
              tipo = "Rigore Segnato Avversario";
              dettagli = match.opponent;
              break;
            case "penalty-opponent-missed":
              tipo = "Rigore Fallito Avversario";
              dettagli = match.opponent;
              break;
            default:
              break;
          }
          return [period.name, `${event.minute}'`, tipo, dettagli];
        })
      ),
    ];
    const eventsWs = XLSX.utils.aoa_to_sheet(eventsData);
    XLSX.utils.book_append_sheet(wb, eventsWs, "Eventi");

    // Formattazione avanzata per tutti i fogli
    const worksheets = [
      { ws: summaryWs, data: summaryData },
      { ws: periodsWs, data: periodsData },
      { ws: scorersWs, data: scorersData },
      { ws: eventsWs, data: eventsData },
    ];

    worksheets.forEach(({ ws, data }) => {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      
      for (let R = 0; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!ws[cell_ref]) continue;

          const cell = ws[cell_ref];

          // Headers principali bold e blu
          if (R === 0) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
              fill: { fgColor: { rgb: "366092" } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
          // Sub-headers bold e grigio
          else if (
            data[R] &&
            typeof data[R][0] === "string" &&
            data[R][0].match(
              /^(RISULTATO|DETTAGLIO|MARCATORI|ASSIST|CRONOLOGIA)$/
            )
          ) {
            cell.s = {
              font: { bold: true, color: { rgb: "000000" }, sz: 12 },
              fill: { fgColor: { rgb: "DDEBF7" } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
          // Intestazioni tabelle bold
          else if (
            R > 0 &&
            data[R] &&
            data[R].length > 1 &&
            (data[R][0] === "Numero" || data[R][0] === "Periodo")
          ) {
            cell.s = {
              font: { bold: true, color: { rgb: "000000" }, sz: 11 },
              fill: { fgColor: { rgb: "E2EFDA" } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
          // Celle dati con bordi
          else {
            cell.s = {
              alignment: {
                horizontal: "left",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
        }
      }

      // Auto-adjust column widths
      const colWidths = [];
      for (let C = 0; C <= range.e.c; ++C) {
        let maxLength = 0;
        for (let R = 0; R <= range.e.r; ++R) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (ws[cell_ref]) {
            maxLength = Math.max(
              maxLength,
              ws[cell_ref].v ? ws[cell_ref].v.toString().length : 0
            );
          }
        }
        colWidths[C] = { wch: Math.min(maxLength + 2, 50) };
      }
      ws["!cols"] = colWidths;
    });

    // Salva il file
    const fileName = `Vigontina_vs_${match.opponent.replace(/\s+/g, "_")}_${match.date}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(
      "✅ File Excel multi-foglio scaricato con successo!\n\nApri con Microsoft Excel per visualizzare i fogli formattati."
    );
  } catch (error) {
    console.error("Errore export Excel:", error);
    alert(
      `❌ Errore durante l'esportazione Excel: ${error.message ?? "Errore sconosciuto"}`
    );
  }
};

/**
 * Esporta una partita in formato PDF
 * @param {Object} match - Oggetto partita da esportare
 */
export const exportMatchToPDF = (match) => {
  if (!match) return;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("VIGONTINA SAN PAOLO - REPORT PARTITA", pageWidth / 2, 20, {
      align: "center",
    });

    // Info partita
    let yPos = 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Competizione: ${match.competition}`, 20, yPos);
    yPos += 10;
    
    if (match.matchDay) {
      doc.text(`Giornata: ${match.matchDay}`, 20, yPos);
      yPos += 10;
    }
    
    doc.text(`Avversario: ${match.opponent}`, 20, yPos);
    yPos += 10;
    doc.text(
      `Data: ${new Date(match.date).toLocaleDateString("it-IT")}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text(`Luogo: ${match.isHome ? "Casa" : "Trasferta"}`, 20, yPos);
    yPos += 10;
    
    if (match.captain) {
      const captainName =
        PLAYERS.find((p) => p.num === match.captain)?.name || "";
      doc.text(`Capitano: ${match.captain} ${captainName}`, 20, yPos);
      yPos += 10;
    }
    
    if (match.assistantReferee) {
      doc.text(`Assistente Arbitro: ${match.assistantReferee}`, 20, yPos);
      yPos += 10;
    }
    
    if (match.teamManager) {
      doc.text(`Dirigente Accompagnatore: ${match.teamManager}`, 20, yPos);
      yPos += 10;
    }

    // Risultato finale
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text("RISULTATO FINALE", 20, yPos);
    yPos += 10;
    doc.setFont("helvetica", "normal");
    
    const vigontinaPoints = match.finalPoints?.vigontina || 0;
    const opponentPoints = match.finalPoints?.opponent || 0;
    const vigontinaGoals = match.periods.reduce(
      (sum, p) => sum + (p.name !== "PROVA TECNICA" ? p.vigontina : 0),
      0
    );
    const opponentGoals = match.periods.reduce(
      (sum, p) => sum + (p.name !== "PROVA TECNICA" ? p.opponent : 0),
      0
    );
    
    doc.text(
      `Punti: Vigontina ${vigontinaPoints} - ${opponentPoints} ${match.opponent}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text(`Gol Totali: ${vigontinaGoals} - ${opponentGoals}`, 20, yPos);

    // Dettaglio Periodi
    yPos += 20;
    doc.setFont("helvetica", "bold");
    doc.text("DETTAGLIO PERIODI", 20, yPos);
    yPos += 10;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Periodo", "Vigontina", "Avversario"]],
      body: match.periods.map((period) => [
        period.name,
        period.vigontina,
        period.opponent,
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [54, 96, 146] },
      margin: { left: 20, right: 20 },
    });
    yPos = doc.lastAutoTable.finalY + 20;

    // Marcatori
    const scorers = {};
    match.periods.forEach((period) => {
      (period.goals ?? []).forEach((event) => {
        if (event.type === "goal" || event.type === "penalty-goal") {
          if (event.scorer) {
            scorers[event.scorer] = (scorers[event.scorer] ?? 0) + 1;
          }
        }
      });
    });
    
    if (Object.keys(scorers).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("MARCATORI", 20, yPos);
      yPos += 10;
      
      const scorersBody = Object.entries(scorers)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num));
          return [`${num} ${player?.name || "Sconosciuto"}`, count];
        });
      
      autoTable(doc, {
        startY: yPos,
        head: [["Giocatore", "Gol"]],
        body: scorersBody,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [54, 96, 146] },
        margin: { left: 20, right: 20 },
      });
      yPos = doc.lastAutoTable.finalY + 20;
    }

    // Assist
    const assisters = {};
    match.periods.forEach((period) => {
      (period.goals ?? []).forEach((event) => {
        if (event.assist) {
          assisters[event.assist] = (assisters[event.assist] ?? 0) + 1;
        }
      });
    });
    
    if (Object.keys(assisters).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("ASSIST", 20, yPos);
      yPos += 10;
      
      const assistersBody = Object.entries(assisters)
        .sort((a, b) => b[1] - a[1])
        .map(([num, count]) => {
          const player = PLAYERS.find((p) => p.num === parseInt(num));
          return [`${num} ${player?.name || "Sconosciuto"}`, count];
        });
      
      autoTable(doc, {
        startY: yPos,
        head: [["Giocatore", "Assist"]],
        body: assistersBody,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [54, 96, 146] },
        margin: { left: 20, right: 20 },
      });
      yPos = doc.lastAutoTable.finalY + 20;
    }

    // Cronologia
    doc.setFont("helvetica", "bold");
    doc.text("CRONOLOGIA EVENTI", 20, yPos);
    yPos += 10;
    
    const eventsBody = match.periods.flatMap((period) =>
      (period.goals ?? []).map((event) => {
        let tipo = "";
        let dettagli = "";
        
        switch (event.type) {
          case "goal":
            tipo = "Gol";
            dettagli = `${event.scorer} ${event.scorerName}${event.assist ? ` (assist: ${event.assist} ${event.assistName})` : ""}`;
            break;
          case "own-goal":
            tipo = "Autogol";
            dettagli = "Vigontina";
            break;
          case "opponent-goal":
            tipo = "Gol Avversario";
            dettagli = match.opponent;
            break;
          case "penalty-goal":
            tipo = "Rigore Segnato";
            dettagli = `${event.scorer} ${event.scorerName}`;
            break;
          case "penalty-missed":
            tipo = "Rigore Fallito";
            dettagli = "Vigontina";
            break;
          case "penalty-opponent-goal":
            tipo = "Rigore Segnato Avversario";
            dettagli = match.opponent;
            break;
          case "penalty-opponent-missed":
            tipo = "Rigore Fallito Avversario";
            dettagli = match.opponent;
            break;
          default:
            break;
        }
        
        return [period.name, `${event.minute}'`, tipo, dettagli];
      })
    );
    
    autoTable(doc, {
      startY: yPos,
      head: [["Periodo", "Minuto", "Tipo", "Dettagli"]],
      body: eventsBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [54, 96, 146] },
      margin: { left: 20, right: 20 },
      columnStyles: { 3: { cellWidth: 80 } },
    });

    // Salva PDF
    const fileName = `Vigontina_vs_${match.opponent.replace(/\s+/g, "_")}_${match.date}.pdf`;
    doc.save(fileName);

    alert(
      "✅ File PDF scaricato con successo!\n\nApri con un lettore PDF per visualizzare il report."
    );
  } catch (error) {
    console.error("Errore export PDF:", error);
    alert(
      `❌ Errore durante l'esportazione PDF: ${error.message ?? "Errore sconosciuto"}`
    );
  }
};