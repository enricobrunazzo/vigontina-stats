// utils/exportUtils.js — Banner outcome full-width + uniform table widths + header tweaks
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculatePoints, calculateMatchStats, getMatchResult } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

// Colors (soft)
const COLORS = {
  headerBlue: [45, 90, 130],
  gridBorder: [180, 186, 194],
  outcome: {
    win: [192, 228, 205],     // soft green
    draw: [245, 234, 178],    // soft yellow
    lose: [242, 200, 200],    // soft red
  }
};

const loadLogoAsBase64 = async () => {
  const p = '/logo-vigontina.png';
  try { const r = await fetch(p); if (!r.ok) return null; const b = await r.blob(); const rd = new FileReader(); return await new Promise((res)=>{ rd.onload=()=>res(rd.result); rd.onerror=()=>res(null); rd.readAsDataURL(b); }); } catch { return null; }
};

function bannerOutcome(doc, match, startY, pageWidth) {
  const res = getMatchResult(match);
  const vp = calculatePoints(match,'vigontina');
  const op = calculatePoints(match,'opponent');
  const color = res.winner === 'vigontina' ? COLORS.outcome.win : res.winner === 'opponent' ? COLORS.outcome.lose : COLORS.outcome.draw;
  const marginL = 20, marginR = 20, h = 10; const x = marginL; const w = pageWidth - marginL - marginR; const y = startY;
  doc.setFillColor(...color); doc.rect(x, y, w, h, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(40,40,40);
  const outcomeText = res.winner === 'vigontina' ? 'VITTORIA' : res.winner === 'opponent' ? 'SCONFITTA' : 'PAREGGIO';
  doc.text(outcomeText, x + 6, y + 7);
  doc.setFont('helvetica','normal');
  const pointsText = `Punti: Vigontina ${vp} - ${op} ${match.opponent}`;
  doc.text(pointsText, x + w - 6, y + 7, { align: 'right' });
  return y + h + 6;
}

function drawHeader(doc, match) {
  const pageW = doc.internal.pageSize.width; const marginL = 20;
  const logo = match.__logoBase64; if (logo) { try { doc.addImage(logo, 'PNG', marginL, 12, 22, 22); } catch {} }
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(0,0,0);
  doc.text('VIGONTINA SAN PAOLO - REPORT PARTITA', pageW/2, 20, { align: 'center' });
  return 30;
}

// Unified grid table helper with uniform width
function gridTable(doc, { title, head, body, startY, widths }) {
  if (!Array.isArray(body) || body.length===0) return startY;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0,0,0);
  doc.text(title, 20, startY);
  const columnStyles = {};
  if (Array.isArray(widths)) widths.forEach((w, i)=>{ columnStyles[i] = { cellWidth: w, halign: i>0 ? 'center' : 'left' }; });
  autoTable(doc, {
    startY: startY + 4,
    theme: 'grid',
    head: [head],
    body,
    styles: { font: 'helvetica', fontSize: 10, lineColor: COLORS.gridBorder, textColor: [0,0,0], cellPadding: {top:3,bottom:3,left:2,right:2} },
    headStyles: { fillColor: COLORS.headerBlue, textColor: [255,255,255], fontStyle:'bold', halign:'left' },
    columnStyles,
    margin: { left: 20, right: 20 },
  });
  return (doc.lastAutoTable?.finalY || (startY+12)) + 6;
}

function drawInfo(doc, match, startY) {
  let y = startY;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(0,0,0);
  doc.text(`${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent}`, 20, y); y += 6;
  if (match.competition) { doc.text(`${match.competition}`, 20, y); y += 6; }
  doc.text(`${match.isHome ? 'Trasferta' : 'Casa'} - ${fmtDateIT(match.date)}`, 20, y); y += 6;
  if (match.captain) { const c = match.captain; doc.text(`Capitano: ${c.number||c.num||''} ${(c.name||'').toUpperCase()}`, 20, y); y += 6; }
  if (match.coach) { doc.text(`Allenatore: ${match.coach}`, 20, y); y += 6; }
  if (match.manager) { doc.text(`Dirigente Accompagnatore: ${match.manager}`, 20, y); y += 6; }
  if (Number.isFinite(match.goalsNoPTV) && Number.isFinite(match.goalsNoPTO)) { doc.text(`Gol (senza PT): ${match.goalsNoPTV} - ${match.goalsNoPTO}`, 20, y); y += 6; }
  y += 4; return y;
}

function buildPeriodsRows(match) {
  return nonTechnicalPeriods(match).map(p=>[
    p.name,
    String(safeNum(p.vigontina)),
    String(safeNum(p.opponent)),
    'Si',
    safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
  ]);
}

function buildTechRows(match) {
  return technicalTestPeriods(match).map(p=>[
    p.name,
    String(safeNum(p.vigontina)),
    String(safeNum(p.opponent)),
    safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
  ]);
}

function drawScorers(doc, match, startY) {
  const stats = calculateMatchStats(match); const map = {};
  stats.allGoals.filter(e=>!e.deletionReason && (e.type==='goal'||e.type==='penalty-goal')).forEach(e=>{ const n = e.scorerName||e.scorer||'Sconosciuto'; map[n]=(map[n]||0)+1; });
  const body = Object.keys(map).length? Object.entries(map).map(([n,g])=>[n,String(g)]) : [["Nessun marcatore","-"]];
  return gridTable(doc, { title:'MARCATORI', head:['Giocatore','Gol'], body, startY, widths:[120,20] });
}

function collectEvents(match) {
  const acc = [];
  (match.periods||[]).forEach(p=>{
    [p.events||[], p.goals||[], p.substitutions||[], p.fouls||[], p.cards||[], p.allEvents||[]]
      .forEach(arr => Array.isArray(arr) && arr.forEach(e => e && acc.push({ ...e, periodName: p.name })));
  });
  if (Array.isArray(match.events)) match.events.forEach(e=> e && acc.push({ ...e, periodName: e.periodName || 'Match' }));
  return acc.filter(e=>!e.deletionReason);
}

function labelEvent(e, opponentName) {
  const min = e.minute!=null?`${e.minute}'`:''; const who=(pl,n)=> (pl?`${pl} ${n||''}`.trim():'').trim();
  if (e.type==='substitution') { const outStr = e.out?`${e.out.num||e.out.number||''} ${e.out.name||''}`.trim():'N/A'; const inStr = e.in?`${e.in.num||e.in.number||''} ${e.in.name||''}`.trim():'N/A'; return `${min} - Sostituzione: ${outStr} → ${inStr}`; }
  if (e.type?.startsWith('free-kick') || e.type==='foul' || e.type==='punizione') { const isOpp = e.type.includes('opponent') || e.team==='opponent'; const shooter = isOpp? opponentName : who(e.player, e.playerName); if (e.type.includes('goal')) return `${min} - Punizione gol ${shooter}`; if (e.type.includes('saved')) return `${min} - Punizione parata ${shooter}`; if (e.type.includes('missed')) return `${min} - Punizione fuori ${shooter}`; if (e.type.includes('hit')) { const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - Punizione ${hl} ${shooter}`; } return `${min} - Punizione ${shooter}`; }
  if (e.type==='yellow-card'||e.type==='cartellino-giallo') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Ammonizione ${pl}`; }
  if (e.type==='red-card'||e.type==='cartellino-rosso') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Espulsione ${pl}`; }
  const scorer = e.scorerName||e.scorer||who(e.player,e.playerName); const assist = e.assistName||e.assist||'';
  switch(e.type){ case 'goal': { const base = `${min} - Gol ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'own-goal': return `${min} - Autogol Vigontina (gol a ${opponentName})`; case 'opponent-own-goal': return `${min} - Autogol ${opponentName} (gol a Vigontina)`; case 'opponent-goal': return `${min} - Gol ${opponentName}`; case 'penalty-goal': { const base = `${min} - Gol (Rig.) ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'penalty-missed': return `${min} - Rigore fallito Vigontina`; case 'penalty-opponent-goal': return `${min} - Gol (Rig.) ${opponentName}`; case 'penalty-opponent-missed': return `${min} - Rigore fallito ${opponentName}`; case 'save': return `${min} - Parata ${who(e.player, e.playerName)}`; case 'opponent-save': return `${min} - Parata portiere ${opponentName}`; case 'missed-shot': return `${min} - Tiro fuori ${who(e.player, e.playerName)}`; case 'opponent-missed-shot': return `${min} - Tiro fuori ${opponentName}`; case 'shot-blocked': return `${min} - Tiro parato ${who(e.player, e.playerName)}`; case 'opponent-shot-blocked': return `${min} - Tiro parato ${opponentName}`; default: { if (e.hitType==='palo'||e.hitType==='traversa'){ const whoStr = e.team==='vigontina'?who(e.player,e.playerName):opponentName; const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - ${hl} ${whoStr}`; } return `${min} - ${e.type||'Evento'}`; } }
}

export const exportMatchToPDF = async (match) => {
  if (!match) { alert("Nessuna partita selezionata per l'esportazione"); return; }
  try {
    const doc = new jsPDF();
    match.__logoBase64 = await loadLogoAsBase64();
    let y = drawHeader(doc, match);
    y = bannerOutcome(doc, match, y, doc.internal.pageSize.width);
    y = drawInfo(doc, match, y);
    // Tables with uniform widths (sum fits page width with margins 20/20)
    y = gridTable(doc, { title:'DETTAGLIO PERIODI', head:['Periodo','Vigontina', match.opponent, 'Completato','Esito'], body: buildPeriodsRows(match), startY: y, widths:[36,24,24,28,40] });
    y = gridTable(doc, { title:'PROVA TECNICA', head:['Periodo','Vigontina', match.opponent, 'Esito'], body: buildTechRows(match), startY: y, widths:[36,24,24,40] });
    y = drawScorers(doc, match, y);
    // Altri Eventi (solo se presenti)
    const stats = calculateMatchStats(match);
    const penaltyGoals = stats.allGoals.filter(e=>!e.deletionReason && e.type==='penalty-goal').length;
    if (penaltyGoals > 0) {
      y = gridTable(doc, { title:'ALTRI EVENTI', head:['Voce','Valore'], body:[["Rigori segnati", String(penaltyGoals)]], startY: y, widths:[60,30] });
    }
    // Cronologia
    const all = collectEvents(match);
    const byPeriod = {}; all.forEach(e=>{ const k=e.periodName||e.period||'N/A'; (byPeriod[k]||(byPeriod[k]=[])).push(e); });
    const ord=(s)=> s?.includes?.('1°')?1: s?.includes?.('2°')?2: s?.includes?.('3°')?3: s?.includes?.('4°')?4: 5;
    const rows=[]; Object.entries(byPeriod).sort(([a],[b])=>ord(a)-ord(b)).forEach(([p,evs])=>{ evs.sort((a,b)=>(a.minute||0)-(b.minute||0)).forEach(e=> rows.push([p, labelEvent(e, match.opponent)])); });
    y = gridTable(doc, { title:'CRONOLOGIA EVENTI', head:['Periodo','Evento'], body: rows, startY: y, widths:[36,120] });

    // Footer note
    const ph = doc.internal.pageSize.height; doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(0,0,0);
    doc.text('Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).', 105, ph-10, { align: 'center' });

    const fileName = `Vigontina_vs_${(match.opponent||'Avversario').replace(/[^a-zA-Z0-9]/g,'_')}_${fmtDateIT(match.date).replace(/\//g,'_')}.pdf`;
    doc.save(fileName);
  } catch (e) {
    console.error('Errore export PDF:', e); alert(`Errore durante l'esportazione PDF: ${e?.message||'Errore sconosciuto'}`);
  }
};

export const exportMatchToExcel = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione Excel"); return; } return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length===0) { alert("Nessuna partita disponibile per l'esportazione storico"); return; } return exportMatchHistoryToExcel(matches); };
