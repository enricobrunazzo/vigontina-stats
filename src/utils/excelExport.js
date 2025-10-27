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
      const response = await fetch('/forza-vigontina.png');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageId = workbook.addImage({ buffer: arrayBuffer, extension: 'png' });
      sheet1.addImage(imageId, { tl: { col: 1.5, row: 0.5 }, ext: { width: 150, height: 100 } });
    } catch {}

    sheet1.getRow(1).height = 25; sheet1.getRow(2).height = 25; sheet1.getRow(3).height = 25; sheet1.getRow(4).height = 25;

    sheet1.mergeCells('A6:F6');
    const titleCell = sheet1.getCell('A6');
    titleCell.value = 'VIGONTINA CALCIO - STAGIONE 2025/2026';
    titleCell.font = { size: 20, bold: true, color: { argb: colors.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryGreen } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(6).height = 35;

    sheet1.mergeCells('A7:F7');
    const subtitleCell = sheet1.getCell('A7');
    subtitleCell.value = 'STORICO PARTITE';
    subtitleCell.font = { size: 14, bold: true, color: { argb: colors.white } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.darkGreen } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(7).height = 25;

    sheet1.addRow([]);

    const stats = { totPartite: matches.length, vittorie: 0, pareggi: 0, sconfitte: 0, golFatti: 0, golSubiti: 0 };
    matches.forEach(match => {
      const vigontinaPts = match.finalPoints?.vigontina || 0; const opponentPts = match.finalPoints?.opponent || 0;
      if (vigontinaPts > opponentPts) stats.vittorie++; else if (vigontinaPts === opponentPts) stats.pareggi++; else stats.sconfitte++;
      match.periods?.forEach(period => { stats.golFatti += period.vigontina || 0; stats.golSubiti += period.opponent || 0; });
    });

    const statsData = [
      ['STATISTICHE STAGIONE', '', '', ''],
      ['Partite Giocate', stats.totPartite, 'Gol Fatti', stats.golFatti],
      ['Vittorie', stats.vittorie, 'Gol Subiti', stats.golSubiti],
      ['Pareggi', stats.pareggi, 'Differenza Reti', stats.golFatti - stats.golSubiti],
      ['Sconfitte', stats.sconfitte, '', '']
    ];

    let currentRow = 9;
    statsData.forEach((row, idx) => {
      const r = sheet1.addRow(row); r.height = 22;
      if (idx === 0) { sheet1.mergeCells(`A${currentRow}:D${currentRow}`); r.font = { bold: true, size: 12, color: { argb: colors.white } }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGreen } }; r.alignment = { horizontal: 'center', vertical: 'middle' }; }
      else { ['A','B','C','D'].forEach(col => { const c = sheet1.getCell(`${col}${currentRow}`); c.font = { size: 11, bold: col==='A'||col==='C' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGray } }; c.alignment = { horizontal: (col==='A'||col==='C')? 'left':'center', vertical: 'middle' }; c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }); }
      currentRow++;
    });

    sheet1.addRow([]); sheet1.addRow([]);

    sheet1.mergeCells(`A${currentRow}:F${currentRow}`);
    const matchesHeaderCell = sheet1.getCell(`A${currentRow}`);
    matchesHeaderCell.value = 'DETTAGLIO PARTITE';
    matchesHeaderCell.font = { size: 12, bold: true, color: { argb: colors.white } };
    matchesHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGreen } };
    matchesHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(currentRow).height = 22; currentRow++;

    const headers = ['Data', 'Avversario', 'Risultato', 'Punti', 'Competizione', 'Casa/Trasferta'];
    const headerRow = sheet1.addRow(headers);
    headerRow.font = { bold: true, size: 11, color: { argb: colors.white } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.darkGreen } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }; headerRow.height = 20;
    headers.forEach((_, idx) => { const c = sheet1.getCell(`${String.fromCharCode(65+idx)}${currentRow}`); c.border = { top:{style:'medium'},left:{style:'medium'},bottom:{style:'medium'},right:{style:'medium'} }; });
    currentRow++;

    const sortedMatches = [...matches].sort((a,b)=> new Date(b.date) - new Date(a.date));
    sortedMatches.forEach(match => {
      const vigontinaPts = match.finalPoints?.vigontina || 0; const opponentPts = match.finalPoints?.opponent || 0;
      const isWin = vigontinaPts > opponentPts; const isLoss = vigontinaPts < opponentPts;
      let vigontinaGoals = 0; let opponentGoals = 0; match.periods?.forEach(p=>{ vigontinaGoals += p.vigontina || 0; opponentGoals += p.opponent || 0; });
      const rowData = [ new Date(match.date).toLocaleDateString('it-IT'), match.opponent, `${vigontinaGoals} - ${opponentGoals}`, `${vigontinaPts} - ${opponentPts}`, match.competition || '-', match.isHome ? '🏠 Casa' : '✈️ Trasferta' ];
      const dataRow = sheet1.addRow(rowData); dataRow.height = 18; dataRow.alignment = { vertical:'middle', horizontal:'center' };
      const rowColor = isWin ? 'FFD1FAE5' : isLoss ? 'FFFECACA' : 'FFFEF3C7';
      rowData.forEach((_, idx)=>{ const c = sheet1.getCell(`${String.fromCharCode(65+idx)}${currentRow}`); c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: rowColor } }; c.border = { top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} }; if (idx===2||idx===3) c.font = { bold:true, size:11 }; });
      currentRow++;
    });

    sheet1.getColumn('A').width=12; sheet1.getColumn('B').width=25; sheet1.getColumn('C').width=12; sheet1.getColumn('D').width=10; sheet1.getColumn('E').width=20; sheet1.getColumn('F').width=15;

    const sheet2 = workbook.addWorksheet('Dettaglio Partite', { properties: { tabColor: { argb: colors.primaryGreen } } });

    sortedMatches.forEach((match, matchIdx) => {
      const startRow = matchIdx === 0 ? 1 : sheet2.lastRow.number + 3;
      sheet2.mergeCells(`A${startRow}:E${startRow}`);
      const matchHeaderCell = sheet2.getCell(`A${startRow}`);
      matchHeaderCell.value = `${match.opponent} - ${new Date(match.date).toLocaleDateString('it-IT')}`;
      matchHeaderCell.font = { size: 14, bold: true, color: { argb: colors.white } };
      matchHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryGreen } };
      matchHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet2.getRow(startRow).height = 25;

      let infoRow = startRow + 1;
      sheet2.getCell(`A${infoRow}`).value = 'Competizione:'; sheet2.getCell(`B${infoRow}`).value = match.competition || '-'; sheet2.getCell(`C${infoRow}`).value = match.isHome ? '🏠 Casa' : '✈️ Trasferta';
      ['A','B','C'].forEach(col=>{ const cell = sheet2.getCell(`${col}${infoRow}`); cell.font = { size:10, bold: col==='A' }; cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: colors.lightGray } }; });

      // Lineup per periodo (se presente)
      infoRow += 1;
      if (match.periods?.some(p => Array.isArray(p.lineup) && p.lineup.length>0)) {
        sheet2.getCell(`A${infoRow}`).value = '9 IN CAMPO PER TEMPO:'; sheet2.getCell(`A${infoRow}`).font = { bold: true, size: 10 }; infoRow++;
        match.periods.forEach(p=>{
          if (Array.isArray(p.lineup) && p.lineup.length>0) {
            sheet2.getCell(`A${infoRow}`).value = p.name; sheet2.getCell(`A${infoRow}`).font = { bold:true, size:9 };
            const labels = p.lineup.map(num=>{ const pl = PLAYERS.find(x=>x.num===num); return pl? `${pl.num} ${pl.name}` : `#${num}`; });
            sheet2.getCell(`B${infoRow}`).value = labels.join(', ');
            infoRow++;
          }
        });
      }

      infoRow += 1;
      const periodHeaders = ['Periodo', 'Vigontina', match.opponent];
      periodHeaders.forEach((h, idx)=>{ const c = sheet2.getCell(`${String.fromCharCode(65+idx)}${infoRow}`); c.value = h; c.font = { bold:true, size:10, color:{ argb: colors.white } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: colors.darkGreen } }; c.alignment = { horizontal:'center', vertical:'middle' }; c.border = { top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} }; });
      infoRow++;

      match.periods?.forEach(period=>{ const r = sheet2.getRow(infoRow); r.getCell(1).value = period.name; r.getCell(2).value = period.vigontina || 0; r.getCell(3).value = period.opponent || 0; [1,2,3].forEach(ci=>{ const c = r.getCell(ci); c.alignment={ horizontal:'center', vertical:'middle' }; c.border={ top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} }; }); infoRow++; });

      const totalRow = sheet2.getRow(infoRow); totalRow.getCell(1).value='TOTALE PUNTI'; totalRow.getCell(2).value=match.finalPoints?.vigontina || 0; totalRow.getCell(3).value=match.finalPoints?.opponent || 0;
      [1,2,3].forEach(ci=>{ const c = totalRow.getCell(ci); c.font={ bold:true, size:11 }; c.fill={ type:'pattern', pattern:'solid', fgColor:{ argb: colors.yellow } }; c.alignment={ horizontal:'center', vertical:'middle' }; c.border={ top:{style:'medium'},left:{style:'medium'},bottom:{style:'medium'},right:{style:'medium'} }; });
      infoRow++;

      // Eventi partita
      let hasEvents=false; const allEvents=[];
      match.periods?.forEach(period=>{ if (period.goals?.length>0){ hasEvents=true; period.goals.forEach(event=>{ const minute=event.minute||'?'; let txt=''; if(event.type==='goal'||event.type==='penalty-goal'){ const name=event.scorerName||event.scorer||'Sconosciuto'; txt=`${minute}' - GOL: ${name}`; if(event.type==='penalty-goal') txt+=' (Rigore)'; if(event.assistName) txt+=` (Assist: ${event.assistName})`; } else if(event.type==='opponent-goal'||event.type==='penalty-opponent-goal'){ txt=`${minute}' - GOL AVVERSARIO${event.type==='penalty-opponent-goal'?' (Rigore)':''}`; } else if(event.type==='own-goal'){ txt=`${minute}' - AUTOGOL VIGONTINA`; } else if(event.type==='opponent-own-goal'){ txt=`${minute}' - AUTOGOL AVVERSARIO`; } else if(event.type==='substitution'){ const outN=event.out?.name||event.out?.num||'N/A'; const inN=event.in?.name||event.in?.num||'N/A'; txt=`${minute}' - SOSTITUZIONE: ${outN} → ${inN}`; } else if(event.type==='save'||event.type==='opponent-save'){ const n=event.playerName||'Portiere'; txt=`${minute}' - PARATA: ${n}`; } else if(event.type==='missed-shot'||event.type==='opponent-missed-shot'){ const n=event.playerName||'Giocatore'; txt=`${minute}' - TIRO FUORI: ${n}`; } else if(event.type?.startsWith('free-kick')){ const n=event.playerName||'Giocatore'; const outc= event.type.includes('missed')?'FUORI': event.type.includes('saved')?'PARATA':'PUNIZIONE'; txt=`${minute}' - PUNIZIONE ${outc}: ${n}`; } else { txt=`${minute}' - ${event.type?.toUpperCase()||'EVENTO'}`; if(event.playerName) txt+=`: ${event.playerName}`; } allEvents.push(txt); }); }});
      if(hasEvents && allEvents.length>0){ infoRow+=1; sheet2.getCell(`A${infoRow}`).value='EVENTI PARTITA:'; sheet2.getCell(`A${infoRow}`).font={ bold:true, size:10 }; infoRow++; allEvents.forEach(t=>{ const r=sheet2.getRow(infoRow); r.getCell(1).value=t; r.getCell(1).font={ size:9 }; infoRow++; }); }
    });

    sheet2.getColumn('A').width=42; sheet2.getColumn('B').width=40; sheet2.getColumn('C').width=12; sheet2.getColumn('D').width=12; sheet2.getColumn('E').width=12;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Vigontina_Storico_${new Date().toLocaleDateString('it-IT').replace(/\//g,'-')}.xlsx`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click(); URL.revokeObjectURL(link.href);
    return true;
  } catch (error) {
    console.error('Errore export Excel:', error); alert('Errore durante l\'esportazione del file Excel'); return false;
  }
};