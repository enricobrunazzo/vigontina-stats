// utils/exportUtils.js — Ultra-thin lines everywhere + correct outcome based on total goals
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateMatchStats } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

// Elegant palette
const PALETTE = {
  blue: [40, 92, 140], blueLight: [60, 130, 190], gray: [110, 115, 120], green: [16, 128, 98],
  grid: [215, 220, 225],
  banner: {
    win: { fill: [184, 228, 199], border: [134, 198, 160], title: [22, 122, 86] },
    draw:{ fill: [252, 236, 178], border: [238, 206, 120], title: [177, 134, 16] },
    lose:{ fill: [246, 205, 205], border: [225, 150, 150], title: [156, 30, 30] }
  }
};
const MARGINS = { left: 14, right: 14 };

const loadLogoAsBase64 = async () => {
  const p = '/logo-vigontina.png';
  try { const r = await fetch(p); if (!r.ok) return null; const b = await r.blob(); const rd = new FileReader(); return await new Promise((res)=>{ rd.onload=()=>res(rd.result); rd.onerror=()=>res(null); rd.readAsDataURL(b); }); } catch { return null; }
};

function drawHeader(doc, match) {
  const pageW = doc.internal.pageSize.width; const logo = match.__logoBase64;
  if (logo) { try { doc.addImage(logo, 'PNG', MARGINS.left, 10, 22, 22); } catch {} }
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(0,0,0);
  doc.text('VIGONTINA SAN PAOLO - REPORT PARTITA', pageW/2, 18, { align: 'center' });
  return 34;
}

function computeOutcomeByGoals(match) {
  // Sum goals from non-technical periods only
  let v=0,o=0; (match.periods||[]).filter(p=>!isTechnicalTest(p)).forEach(p=>{ v+=safeNum(p.vigontina); o+=safeNum(p.opponent); });
  return v>o? 'win' : v<o? 'lose' : 'draw';
}

function bannerOutcome(doc, match, startY) {
  const pageW = doc.internal.pageSize.width;
  const outcome = computeOutcomeByGoals(match);
  const scheme = outcome==='win'?PALETTE.banner.win: outcome==='lose'?PALETTE.banner.lose: PALETTE.banner.draw;
  const x = MARGINS.left, w = pageW - MARGINS.left - MARGINS.right, h = 11, y = startY;
  doc.setDrawColor(...scheme.border); doc.setLineWidth(0.12); // ultra-thin
  if (doc.roundedRect) { try { doc.setFillColor(...scheme.fill); doc.roundedRect(x, y, w, h, 3, 3, 'FD'); } catch { doc.setFillColor(...scheme.fill); doc.rect(x, y, w, h, 'F'); } }
  else { doc.setFillColor(...scheme.fill); doc.rect(x, y, w, h, 'F'); }
  const title = outcome==='win'?'VITTORIA': outcome==='lose'?'SCONFITTA':'PAREGGIO';
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...scheme.title);
  doc.text(title, x + 6, y + 7.5);
  // Points (by periods only)
  let v=0,o=0; (match.periods||[]).filter(p=>!isTechnicalTest(p)).forEach(p=>{ v+=safeNum(p.vigontina); o+=safeNum(p.opponent); });
  doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
  doc.text(`Punti: Vigontina ${v} - ${o} ${match.opponent}`, x + w - 6, y + 7.5, { align: 'right' });
  return y + h + 8;
}

function infoBlock(doc, match, startY) {
  let y = startY; doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(0,0,0);
  doc.text(`${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent}`, MARGINS.left, y); y += 6;
  if (match.competition) { doc.text(`${match.competition}`, MARGINS.left, y); y += 6; }
  doc.text(`${match.isHome ? 'Casa' : 'Trasferta'} - ${fmtDateIT(match.date)}`, MARGINS.left, y); y += 6;
  if (match.captain) { const c = match.captain; doc.text(`Capitano: ${c.number||c.num||''} ${(c.name||'').toUpperCase()}`, MARGINS.left, y); y += 6; }
  if (match.coach) { doc.text(`Allenatore: ${match.coach}`, MARGINS.left, y); y += 8; }
  return y;
}

function gridTable(doc, { title, head, body, startY, widths, headColor }) {
  if (!Array.isArray(body) || body.length===0) return startY;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0,0,0);
  doc.text(title, MARGINS.left, startY);
  const columnStyles = {}; if (Array.isArray(widths)) widths.forEach((w, i)=>{ columnStyles[i] = { cellWidth: w, halign: i>0 ? 'center' : 'left' }; });
  autoTable(doc, {
    startY: startY + 4,
    theme: 'grid',
    head: [head],
    body,
    styles: { font: 'helvetica', fontSize: 10, lineColor: PALETTE.grid, lineWidth: 0.12, textColor: [0,0,0], cellPadding: {top:3,bottom:3,left:2,right:2} },
    headStyles: { fillColor: headColor, textColor: [255,255,255], fontStyle:'bold', halign:'left', lineWidth: 0.12, lineColor: PALETTE.grid },
    columnStyles,
    margin: { left: MARGINS.left, right: MARGINS.right },
  });
  return (doc.lastAutoTable?.finalY || (startY+12)) + 8;
}

const buildPeriodsRows = (match) => nonTechnicalPeriods(match).map(p=>[
  p.name, String(safeNum(p.vigontina)), String(safeNum(p.opponent)), 'Si', safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
]);
const buildTechRows = (match) => technicalTestPeriods(match).map(p=>[
  p.name, String(safeNum(p.vigontina)), String(safeNum(p.opponent)), safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
]);

function drawScorers(doc, match, startY, fullW) {
  const stats = calculateMatchStats(match); const map = {};
  stats.allGoals.filter(e=>!e.deletionReason && (e.type==='goal'||e.type==='penalty-goal')).forEach(e=>{ const n = e.scorerName||e.scorer||'Sconosciuto'; map[n]=(map[n]||0)+1; });
  const body = Object.keys(map).length? Object.entries(map).map(([n,g])=>[n,String(g)]) : [["Nessun marcatore","-"]];
  return gridTable(doc, { title:'MARCATORI', head:['Giocatore','Gol'], body, startY, widths:[fullW*0.8, fullW*0.2], headColor: PALETTE.blue });
}

function collectEvents(match) { const acc = []; (match.periods||[]).forEach(p=>{ [p.events||[], p.goals||[], p.substitutions||[], p.fouls||[], p.cards||[], p.allEvents||[]].forEach(arr => Array.isArray(arr) && arr.forEach(e => e && acc.push({ ...e, periodName: p.name }))); }); if (Array.isArray(match.events)) match.events.forEach(e=> e && acc.push({ ...e, periodName: e.periodName || 'Match' })); return acc.filter(e=>!e.deletionReason); }

function labelEvent(e, opponentName) { const min = e.minute!=null?`${e.minute}'`:''; const who=(pl,n)=> (pl?`${pl} ${n||''}`.trim():'').trim(); if (e.type==='substitution') { const outStr = e.out?`${e.out.num||e.out.number||''} ${e.out.name||''}`.trim():'N/A'; const inStr = e.in?`${e.in.num||e.in.number||''} ${e.in.name||''}`.trim():'N/A'; return `${min} - Sostituzione: ${outStr} → ${inStr}`; } if (e.type?.startsWith('free-kick') || e.type==='foul' || e.type==='punizione') { const isOpp = e.type.includes('opponent') || e.team==='opponent'; const shooter = isOpp? opponentName : who(e.player, e.playerName); if (e.type.includes('goal')) return `${min} - Punizione gol ${shooter}`; if (e.type.includes('saved')) return `${min} - Punizione parata ${shooter}`; if (e.type.includes('missed')) return `${min} - Punizione fuori ${shooter}`; if (e.type.includes('hit')) { const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - Punizione ${hl} ${shooter}`; } return `${min} - Punizione ${shooter}`; } if (e.type==='yellow-card'||e.type==='cartellino-giallo') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Ammonizione ${pl}`; } if (e.type==='red-card'||e.type==='cartellino-rosso') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Espulsione ${pl}`; } const scorer = e.scorerName||e.scorer||who(e.player,e.playerName); const assist = e.assistName||e.assist||''; switch(e.type){ case 'goal': { const base = `${min} - Gol ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'own-goal': return `${min} - Autogol Vigontina (gol a ${opponentName})`; case 'opponent-own-goal': return `${min} - Autogol ${opponentName} (gol a Vigontina)`; case 'opponent-goal': return `${min} - Gol ${opponentName}`; case 'penalty-goal': { const base = `${min} - Gol (Rig.) ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'penalty-missed': return `${min} - Rigore fallito Vigontina`; case 'penalty-opponent-goal': return `${min} - Gol (Rig.) ${opponentName}`; case 'penalty-opponent-missed': return `${min} - Rigore fallito ${opponentName}`; case 'save': return `${min} - Parata ${who(e.player, e.playerName)}`; case 'opponent-save': return `${min} - Parata portiere ${opponentName}`; case 'missed-shot': return `${min} - Tiro fuori ${who(e.player, e.playerName)}`; case 'opponent-missed-shot': return `${min} - Tiro fuori ${opponentName}`; case 'shot-blocked': return `${min} - Tiro parato ${who(e.player, e.playerName)}`; case 'opponent-shot-blocked': return `${min} - Tiro parato ${opponentName}`; default: { if (e.hitType==='palo'||e.hitType==='traversa'){ const whoStr = e.team==='vigontina'?who(e.player,e.playerName):opponentName; const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - ${hl} ${whoStr}`; } return `${min} - ${e.type||'Evento'}`; } }
}

export const exportMatchToPDF = async (match) => {
  if (!match) { alert("Nessuna partita selezionata per l'esportazione"); return; }
  try {
    const doc = new jsPDF();
    match.__logoBase64 = await loadLogoAsBase64();
    let y = drawHeader(doc, match);
    y = bannerOutcome(doc, match, y);
    y = infoBlock(doc, match, y);

    const pageW = doc.internal.pageSize.width; const fullW = pageW - MARGINS.left - MARGINS.right;
    y = gridTable(doc, { title:'DETTAGLIO PERIODI', head:['Periodo','Vigontina', match.opponent, 'Completato','Esito'], body: nonTechnicalPeriods(match).map(p=>[p.name,String(safeNum(p.vigontina)),String(safeNum(p.opponent)),'Si',safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)]), startY: y, widths:[fullW*0.27, fullW*0.14, fullW*0.14, fullW*0.18, fullW*0.27], headColor: PALETTE.blue });
    y = gridTable(doc, { title:'PROVA TECNICA', head:['Periodo','Vigontina', match.opponent, 'Esito'], body: technicalTestPeriods(match).map(p=>[p.name,String(safeNum(p.vigontina)),String(safeNum(p.opponent)),safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)]), startY: y, widths:[fullW*0.33, fullW*0.22, fullW*0.22, fullW*0.23], headColor: PALETTE.gray });
    y = drawScorers(doc, match, y, fullW);

    const stats = calculateMatchStats(match); const penaltyGoals = stats.allGoals.filter(e=>!e.deletionReason && e.type==='penalty-goal').length; if (penaltyGoals > 0) { y = gridTable(doc, { title:'ALTRI EVENTI', head:['Voce','Valore'], body:[["Rigori segnati", String(penaltyGoals)]], startY: y, widths:[fullW*0.7, fullW*0.3], headColor: PALETTE.blue }); }

    const all = collectEvents(match); const byPeriod = {}; all.forEach(e=>{ const k=e.periodName||e.period||'N/A'; (byPeriod[k]||(byPeriod[k]=[])).push(e); }); const ord=(s)=> s?.includes?.('1°')?1: s?.includes?.('2°')?2: s?.includes?.('3°')?3: s?.includes?.('4°')?4: 5; const rows=[]; Object.entries(byPeriod).sort(([a],[b])=>ord(a)-ord(b)).forEach(([p,evs])=>{ evs.sort((a,b)=>(a.minute||0)-(b.minute||0)).forEach(e=> rows.push([p, labelEvent(e, match.opponent)])); }); y = gridTable(doc, { title:'CRONOLOGIA EVENTI', head:['Periodo','Evento'], body: rows, startY: y, widths:[fullW*0.26, fullW*0.74], headColor: PALETTE.green });

    const ph = doc.internal.pageSize.height; doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(0,0,0); doc.text('Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).', pageW/2, ph-10, { align: 'center' });

    const fileName = `Vigontina_vs_${(match.opponent||'Avversario').replace(/[^a-zA-Z0-9]/g,'_')}_${fmtDateIT(match.date).replace(/\//g,'_')}.pdf`;
    doc.save(fileName);
  } catch (e) { console.error('Errore export PDF:', e); alert(`Errore durante l'esportazione PDF: ${e?.message||'Errore sconosciuto'}`); }
};

export const exportMatchToExcel = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione Excel"); return; } return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length===0) { alert("Nessuna partita disponibile per l'esportazione storico"); return; } return exportMatchHistoryToExcel(matches); };
