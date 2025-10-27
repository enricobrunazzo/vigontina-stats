import ExcelJS from 'exceljs';

/**
 * Esporta lo storico partite in Excel con formattazione professionale
 * @param {Array} matches - Array di partite dallo storico
 */
export const exportMatchHistoryToExcel = async (matches) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vigontina Calcio';
    workbook.created = new Date();

    // Colori Vigontina
    const colors = {
      primaryGreen: 'FF0B6E4F',    // Verde principale
      lightGreen: 'FF08A045',       // Verde chiaro
      darkGreen: 'FF064E3B',        // Verde scuro
      yellow: 'FFF59E0B',           // Giallo per vittorie
      red: 'FFDC2626',              // Rosso per sconfitte
      lightGray: 'FFF3F4F6',        // Grigio chiaro
      white: 'FFFFFFFF'
    };

    // ===== FOGLIO 1: RIEPILOGO STAGIONE =====
    const sheet1 = workbook.addWorksheet('Riepilogo Stagione', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    // Carica il logo
    try {
      const response = await fetch('/forza-vigontina.png');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });

      // Logo centrato in alto
      sheet1.addImage(imageId, {
        tl: { col: 1.5, row: 0.5 },
        ext: { width: 150, height: 100 }
      });
    } catch (error) {
      console.warn('Logo non caricato:', error);
    }

    // Spazio per il logo
    sheet1.getRow(1).height = 25;
    sheet1.getRow(2).height = 25;
    sheet1.getRow(3).height = 25;
    sheet1.getRow(4).height = 25;

    // Titolo principale
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

    // Sottotitolo
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

    // Spazio
    sheet1.addRow([]);

    // Calcola statistiche stagione
    const stats = {
      totPartite: matches.length,
      vittorie: 0,
      pareggi: 0,
      sconfitte: 0,
      golFatti: 0,
      golSubiti: 0
    };

    matches.forEach(match => {
      const vigontinaPts = match.finalPoints?.vigontina || 0;
      const opponentPts = match.finalPoints?.opponent || 0;

      if (vigontinaPts > opponentPts) stats.vittorie++;
      else if (vigontinaPts === opponentPts) stats.pareggi++;
      else stats.sconfitte++;

      // Somma gol dai periodi
      match.periods?.forEach(period => {
        stats.golFatti += period.vigontina || 0;
        stats.golSubiti += period.opponent || 0;
      });
    });

    // Box statistiche
    const statsData = [
      ['STATISTICHE STAGIONE', '', '', ''],
      ['Partite Giocate', stats.totPartite, 'Gol Fatti', stats.golFatti],
      ['Vittorie', stats.vittorie, 'Gol Subiti', stats.golSubiti],
      ['Pareggi', stats.pareggi, 'Differenza Reti', stats.golFatti - stats.golSubiti],
      ['Sconfitte', stats.sconfitte, '', '']
    ];

    let currentRow = 9;
    statsData.forEach((row, idx) => {
      const excelRow = sheet1.addRow(row);
      excelRow.height = 22;

      if (idx === 0) {
        // Intestazione statistiche
        sheet1.mergeCells(`A${currentRow}:D${currentRow}`);
        excelRow.font = { bold: true, size: 12, color: { argb: colors.white } };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.lightGreen }
        };
        excelRow.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        // Dati statistiche
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

    // Spazio
    sheet1.addRow([]);
    sheet1.addRow([]);

    // Tabella partite
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

    // Intestazioni tabella
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

    // Dati partite (ordinate dalla più recente)
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedMatches.forEach(match => {
      const vigontinaPts = match.finalPoints?.vigontina || 0;
      const opponentPts = match.finalPoints?.opponent || 0;
      const isWin = vigontinaPts > opponentPts;
      const isLoss = vigontinaPts < opponentPts;

      // Calcola gol totali
      let vigontinaGoals = 0;
      let opponentGoals = 0;
      match.periods?.forEach(period => {
        vigontinaGoals += period.vigontina || 0;
        opponentGoals += period.opponent || 0;
      });

      const rowData = [
        new Date(match.date).toLocaleDateString('it-IT'),
        match.opponent,
        `${vigontinaGoals} - ${opponentGoals}`,
        `${vigontinaPts} - ${opponentPts}`,
        match.competition || '-',
        match.isHome ? '🏠 Casa' : '✈️ Trasferta'
      ];

      const dataRow = sheet1.addRow(rowData);
      dataRow.height = 18;
      dataRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Colore riga in base al risultato
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

        // Risultato e punti in grassetto
        if (idx === 2 || idx === 3) {
          cell.font = { bold: true, size: 11 };
        }
      });
      currentRow++;
    });

    // Larghezza colonne
    sheet1.getColumn('A').width = 12;  // Data
    sheet1.getColumn('B').width = 25;  // Avversario
    sheet1.getColumn('C').width = 12;  // Risultato
    sheet1.getColumn('D').width = 10;  // Punti
    sheet1.getColumn('E').width = 20;  // Competizione
    sheet1.getColumn('F').width = 15;  // Casa/Trasferta

    // ===== FOGLIO 2: DETTAGLIO PARTITE =====
    const sheet2 = workbook.addWorksheet('Dettaglio Partite', {
      properties: { tabColor: { argb: colors.primaryGreen } }
    });

    sortedMatches.forEach((match, matchIdx) => {
      const startRow = matchIdx === 0 ? 1 : sheet2.lastRow.number + 3;

      // Intestazione partita
      sheet2.mergeCells(`A${startRow}:E${startRow}`);
      const matchHeaderCell = sheet2.getCell(`A${startRow}`);
      matchHeaderCell.value = `${match.opponent} - ${new Date(match.date).toLocaleDateString('it-IT')}`;
      matchHeaderCell.font = { size: 14, bold: true, color: { argb: colors.white } };
      matchHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primaryGreen }
      };
      matchHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet2.getRow(startRow).height = 25;

      // Info partita
      let infoRow = startRow + 1;
      sheet2.getCell(`A${infoRow}`).value = 'Competizione:';
      sheet2.getCell(`B${infoRow}`).value = match.competition || '-';
      sheet2.getCell(`C${infoRow}`).value = match.isHome ? '🏠 Casa' : '✈️ Trasferta';
      
      ['A', 'B', 'C'].forEach(col => {
        const cell = sheet2.getCell(`${col}${infoRow}`);
        cell.font = { size: 10, bold: col === 'A' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.lightGray }
        };
      });

      // Periodi
      infoRow += 2;
      const periodHeaders = ['Periodo', 'Vigontina', match.opponent];
      const periodHeaderRow = sheet2.getRow(infoRow);
      periodHeaders.forEach((header, idx) => {
        const cell = sheet2.getCell(`${String.fromCharCode(65 + idx)}${infoRow}`);
        cell.value = header;
        cell.font = { bold: true, size: 10, color: { argb: colors.white } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.darkGreen }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      infoRow++;

      // Dati periodi
      match.periods?.forEach(period => {
        const periodRow = sheet2.getRow(infoRow);
        periodRow.getCell(1).value = period.name;
        periodRow.getCell(2).value = period.vigontina || 0;
        periodRow.getCell(3).value = period.opponent || 0;

        [1, 2, 3].forEach(colIdx => {
          const cell = periodRow.getCell(colIdx);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        infoRow++;
      });

      // Totale punti
      const totalRow = sheet2.getRow(infoRow);
      totalRow.getCell(1).value = 'TOTALE PUNTI';
      totalRow.getCell(2).value = match.finalPoints?.vigontina || 0;
      totalRow.getCell(3).value = match.finalPoints?.opponent || 0;
      
      [1, 2, 3].forEach(colIdx => {
        const cell = totalRow.getCell(colIdx);
        cell.font = { bold: true, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.yellow }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };
      });
      infoRow++;

      // Eventi partita (FIXED - usa la struttura corretta degli eventi)
      let hasEvents = false;
      const allEvents = [];
      
      match.periods?.forEach(period => {
        if (period.goals && period.goals.length > 0) {
          hasEvents = true;
          period.goals.forEach(event => {
            // Gestisci diversi tipi di eventi con la struttura corretta
            let eventText = '';
            const minute = event.minute || '?';
            
            if (event.type === 'goal' || event.type === 'penalty-goal') {
              const playerName = event.scorerName || event.scorer || 'Sconosciuto';
              eventText = `${minute}' - GOL: ${playerName}`;
              if (event.type === 'penalty-goal') eventText += ' (Rigore)';
              if (event.assistName) eventText += ` (Assist: ${event.assistName})`;
            } else if (event.type === 'opponent-goal' || event.type === 'penalty-opponent-goal') {
              eventText = `${minute}' - GOL AVVERSARIO`;
              if (event.type === 'penalty-opponent-goal') eventText += ' (Rigore)';
            } else if (event.type === 'own-goal') {
              eventText = `${minute}' - AUTOGOL VIGONTINA`;
            } else if (event.type === 'opponent-own-goal') {
              eventText = `${minute}' - AUTOGOL AVVERSARIO`;
            } else if (event.type === 'substitution') {
              const outPlayer = event.out?.name || event.out?.num || 'N/A';
              const inPlayer = event.in?.name || event.in?.num || 'N/A';
              eventText = `${minute}' - SOSTITUZIONE: ${outPlayer} → ${inPlayer}`;
            } else if (event.type === 'save' || event.type === 'opponent-save') {
              const playerName = event.playerName || 'Portiere';
              eventText = `${minute}' - PARATA: ${playerName}`;
            } else if (event.type === 'missed-shot' || event.type === 'opponent-missed-shot') {
              const playerName = event.playerName || 'Giocatore';
              eventText = `${minute}' - TIRO FUORI: ${playerName}`;
            } else if (event.type?.includes('free-kick')) {
              const playerName = event.playerName || 'Giocatore';
              const outcome = event.type.includes('missed') ? 'FUORI' : 
                           event.type.includes('saved') ? 'PARATA' : 'PUNIZIONE';
              eventText = `${minute}' - PUNIZIONE ${outcome}: ${playerName}`;
            } else {
              // Altri tipi di eventi
              eventText = `${minute}' - ${event.type?.toUpperCase() || 'EVENTO'}`;
              if (event.playerName) eventText += `: ${event.playerName}`;
            }
            
            allEvents.push(eventText);
          });
        }
      });

      // Mostra eventi se presenti
      if (hasEvents && allEvents.length > 0) {
        infoRow += 1;
        sheet2.getCell(`A${infoRow}`).value = 'EVENTI PARTITA:';
        sheet2.getCell(`A${infoRow}`).font = { bold: true, size: 10 };
        infoRow++;

        allEvents.forEach(eventText => {
          const eventRow = sheet2.getRow(infoRow);
          eventRow.getCell(1).value = eventText;
          eventRow.getCell(1).font = { size: 9 };
          infoRow++;
        });
      }
    });

    // Larghezza colonne foglio 2
    sheet2.getColumn('A').width = 40;
    sheet2.getColumn('B').width = 12;
    sheet2.getColumn('C').width = 12;
    sheet2.getColumn('D').width = 12;
    sheet2.getColumn('E').width = 12;

    // Salva il file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Vigontina_Storico_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('Errore export Excel:', error);
    alert('Errore durante l\'esportazione del file Excel');
    return false;
  }
};