import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Genera PDF del Rapporto Gara FIGC
 * @param {Object} match - Dati partita
 * @param {Object} formData - Dati form compilato
 * @param {Function} calculatePeriodPoints - Funzione per calcolare punti periodo
 * @param {Function} calculateFinalScore - Funzione per calcolare punteggio finale
 */
export const exportFIGCReportToPDF = async (match, formData, calculatePeriodPoints, calculateFinalScore) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const centerText = (text, yPos, fontSize = 12, style = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    doc.text(text, pageWidth / 2, yPos, { align: "center" });
  };

  try {
    const logoUrl = `${import.meta.env.BASE_URL || "/"}logo-lnd.png`;
    const logoResponse = await fetch(logoUrl);
    const logoBlob = await logoResponse.blob();
    const logoDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(logoBlob);
    });
    doc.addImage(logoDataUrl, "PNG", margin, y, 50, 50);
  } catch {}

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Federazione Italiana Giuoco Calcio", pageWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(12);
  doc.text("Lega Nazionale Dilettanti", pageWidth / 2, y + 27, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 153);
  const delegazioneText = "DELEGAZIONE PROVINCIALE DI PADOVA";
  const textWidth = doc.getTextWidth(delegazioneText);
  doc.text(delegazioneText, pageWidth / 2, y + 45, { align: "center" });
  doc.line(pageWidth / 2 - textWidth / 2, y + 47, pageWidth / 2 + textWidth / 2, y + 47);
  doc.setTextColor(0, 0, 0);
  y += 65;

  doc.setFillColor(220, 235, 255);
  doc.setDrawColor(100, 149, 237);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(formData.competition || match.competition, pageWidth / 2, y + 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("Categoria ESORDIENTI", pageWidth / 2, y + 28, { align: "center" });
  y += 50;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.rect(margin, y, 8, 8);
  doc.text("X", margin + 2, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text("ESORDIENTI 1° Anno 2014 - 9>9 (sigla X1)", margin + 12, y + 6);
  y += 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Rapporto Gara Dirigente Arbitro:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Sig. ${formData.refereeManager}`, margin + 180, y);
  doc.text(`della Società ${formData.refereeSociety}`, margin + 320, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text("GARA:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(formData.homeTeam, margin + 50, y);
  doc.text(" - ", pageWidth / 2 - 10, y);
  doc.text(formData.awayTeam, pageWidth / 2 + 10, y);
  y += 15;
  doc.setFontSize(9);
  doc.text("(Società ospitante)", margin + 50, y);
  doc.text("(Società ospitata)", pageWidth / 2 + 10, y);
  doc.setFontSize(10);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text(`Valevole per la ${formData.matchDay || '__'}`, margin, y);
  doc.text(" Giornata  GIRONE ", margin + 140, y);
  doc.text(formData.girone || '__', margin + 230, y);
  doc.text(" del ", margin + 250, y);
  const dateFormatted = new Date(formData.date).toLocaleDateString('it-IT');
  doc.text(dateFormatted, margin + 280, y);
  doc.text(" ore ", margin + 360, y);
  doc.text(formData.time, margin + 390, y);
  y += 20;
  doc.text("Disputata a ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(formData.location, margin + 70, y);
  doc.setFont("helvetica", "bold");
  doc.text(" campo ", margin + 300, y);
  doc.setFont("helvetica", "normal");
  doc.text(formData.fieldType, margin + 345, y);
  y += 25;

  const finalScore = calculateFinalScore();
  const tableData = [
    [ 'Ospitante', ...match.periods.map(p => calculatePeriodPoints(p, 'home').toString()), finalScore.home.toString() ],
    [ 'Ospitata', ...match.periods.map(p => calculatePeriodPoints(p, 'away').toString()), finalScore.away.toString() ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['SQUADRE\nGARA', 'Prova\nTecnica', 'Risultato\n1° tempo', 'Risultato\n2° tempo', 'Risultato\n3° tempo', 'Risultato\n4° tempo', 'Risultato\nFINALE']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { fillColor: [255, 255, 200] }, 6: { fillColor: [200, 220, 255], fontStyle: 'bold', fontSize: 11 } },
    margin: { left: margin, right: margin }
  });
  y = doc.lastAutoTable.finalY + 14;

  // Lineup per tempo (se disponibile)
  if (match.periods?.some(p => Array.isArray(p.lineup) && p.lineup.length > 0)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("9 IN CAMPO PER TEMPO:", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    match.periods.forEach(p => {
      if (Array.isArray(p.lineup) && p.lineup.length > 0) {
        const labels = p.lineup.map(num => {
          const pl = (match.playersCatalog || []).find(x => x.num === num);
          return pl ? `${pl.num} ${pl.name}` : `#${num}`;
        });
        doc.text(`${p.name}: ${labels.join(', ')}`, margin, y);
        y += 12;
      }
    });

    y += 8;
  }

  doc.setFontSize(10);
  doc.setFillColor(220, 255, 220);
  doc.rect(margin, y, (pageWidth - margin * 2) / 2 - 5, 100, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("SQUADRA OSPITANTE", margin + 5, y + 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Da compilare a cura del DIRIGENTE OSPITATO", margin + 5, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const homeChecks = [
    { label: "Saluto Inizio e Fine Gara", value: formData.homeGreeting },
    { label: "Appello prima della gara", value: formData.homeAppeal },
    { label: "Tutti i giocatori hanno partecipato", value: formData.homeAllPlayed },
    { label: "Sostituzioni Regolari", value: formData.homeSubstitutions },
    { label: "Distinta Giocatori Regolare", value: formData.homeLineup }
  ];
  homeChecks.forEach((check, idx) => { const yPos = y + 35 + (idx * 12); doc.text(check.label, margin + 5, yPos); doc.text("SI", margin + 140, yPos); doc.rect(margin + 150, yPos - 5, 6, 6); if (check.value === 'SI') doc.text("X", margin + 151, yPos - 1); doc.text("NO", margin + 165, yPos); doc.rect(margin + 178, yPos - 5, 6, 6); if (check.value === 'NO') doc.text("X", margin + 179, yPos - 1); });

  const midX = pageWidth / 2 + 5;
  doc.setFillColor(220, 235, 255);
  doc.rect(midX, y, (pageWidth - margin * 2) / 2 - 5, 100, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SQUADRA OSPITATA", midX + 5, y + 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Da compilare a cura DEL DIRIGENTE OSPITANTE", midX + 5, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const awayChecks = [
    { label: "Saluto Inizio e Fine Gara", value: formData.awayGreeting },
    { label: "Appello prima della gara", value: formData.awayAppeal },
    { label: "Tutti i giocatori hanno partecipato", value: formData.awayAllPlayed },
    { label: "Sostituzioni Regolari", value: formData.awaySubstitutions },
    { label: "Distinta Giocatori Regolare", value: formData.awayLineup }
  ];
  awayChecks.forEach((check, idx) => { const yPos = y + 35 + (idx * 12); doc.text(check.label, midX + 5, yPos); doc.text("SI", midX + 140, yPos); doc.rect(midX + 150, yPos - 5, 6, 6); if (check.value === 'SI') doc.text("X", midX + 151, yPos - 1); doc.text("NO", midX + 165, yPos); doc.rect(midX + 178, yPos - 5, 6, 6); if (check.value === 'NO') doc.text("X", midX + 179, yPos - 1); });
  y += 120;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MISURA DELLE PORTE: 6,00 m. x 2,00", margin, y);
  doc.text("SI", pageWidth - 100, y); doc.rect(pageWidth - 85, y - 5, 6, 6); if (formData.goalsCorrect === 'SI') doc.text("X", pageWidth - 84, y - 1);
  doc.text("NO", pageWidth - 70, y); doc.rect(pageWidth - 55, y - 5, 6, 6); if (formData.goalsCorrect === 'NO') doc.text("X", pageWidth - 54, y - 1);
  y += 20;

  doc.setFont("helvetica", "bold"); doc.text("NOTE:", margin, y); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("infortuni ai giocatori, mancata disputa della gara, comportamento pubblico e tesserati,", margin, y + 10); doc.text("GIOCATORI ammoniti o espulsi (indicare minuto, cognome nome, n. maglia, società, motivazione), ecc.", margin, y + 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.rect(margin, y + 25, pageWidth - margin * 2, 40);
  if (formData.notes) { const lines = doc.splitTextToSize(formData.notes, pageWidth - margin * 2 - 10); doc.text(lines, margin + 5, y + 35); }
  y += 70;

  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y); y += 15; doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("FIRMA DEI DIRIGENTI:", margin, y);
  const signWidth = 140; const signHeight = 60;
  doc.rect(margin + 120, y - 10, signWidth, signHeight);
  if (formData.homeManagerSignature) { try { doc.addImage(formData.homeManagerSignature, 'PNG', margin + 125, y - 5, signWidth - 10, signHeight - 10); } catch {}
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("(Ospitante)", margin + 165, y + 55);

  doc.rect(pageWidth - margin - signWidth, y - 10, signWidth, signHeight);
  if (formData.awayManagerSignature) { try { doc.addImage(formData.awayManagerSignature, 'PNG', pageWidth - margin - signWidth + 5, y - 5, signWidth - 10, signHeight - 10); } catch {}
  }
  doc.text("(Ospitato)", pageWidth - margin - 75, y + 55);
  y += 75;

  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Dirigente Arbitro Gara reperibile al cellulare:", margin, y);
  doc.setFont("helvetica", "normal"); doc.text(formData.refereePhone || '_______________', margin + 220, y);
  const refSignWidth = 120; const refSignHeight = 50; doc.rect(pageWidth - margin - refSignWidth, y - 10, refSignWidth, refSignHeight);
  if (formData.refereeSignature) { try { doc.addImage(formData.refereeSignature, 'PNG', pageWidth - margin - refSignWidth + 5, y - 5, refSignWidth - 10, refSignHeight - 10); } catch {} }
  doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("(Firma dell'arbitro)", pageWidth - margin - 60, y + 45);
  y += 60;

  if (y > pageHeight - 80) { doc.addPage(); y = margin; }

  doc.setFont("helvetica", "italic"); doc.setFontSize(9);
  const footerText = [
    "Il Rapporto Gara, assieme alle distinte delle squadre, dovrà pervenire alla Delegazione di Padova esclusivamente",
    "tramite scansione IN UN UNICO FILE PDF (NO FOTO) all'indirizzo email PADOVA.REFERTIBASE@LND.IT entro",
    "il venerdì successivo alla disputa della gara."
  ];
  footerText.forEach((line, idx) => { doc.text(line, pageWidth / 2, y + (idx * 12), { align: "center" }); });

  const fileName = `Rapporto_Gara_FIGC_${formData.homeTeam.replace(/\s+/g, '_')}_vs_${formData.awayTeam.replace(/\s+/g, '_')}_${dateFormatted.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};