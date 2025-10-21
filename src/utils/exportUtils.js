// utils/exportUtils.js — Template-aligned PDF (logo left, centered title, badge row, points row, grid tables, optional 'Altri eventi', full chronology)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculatePoints, calculateMatchStats, getMatchResult } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

const loadLogoAsBase64 = async () => {
  const p = '/logo-vigontina.png';
  try { const r = await fetch(p); if (!r.ok) return null; const b = await r.blob(); const rd = new FileReader(); return await new Promise((res)=>{ rd.onload=()=>res(rd.result); rd.onerror=()=>res(null); rd.readAsDataURL(b); }); } catch { return null; }
};

const safeLine = (doc, x1, y1, x2, y2) => { const n=(v)=>Number.isFinite(v)?v:0; try { doc.line(n(x1),n(y1),n(x2),n(y2)); } catch {} };

function drawTemplateHeader(doc, match, logoBase64) {
  // Logo sinistra + titolo centrato su riga propria
  const pageW = doc.internal.pageSize.width;
  const marginL = 20;
  // Logo
  if (logoBase64) { try { doc.addImage(logoBase64, 'PNG', marginL, 12, 22, 22); } catch {} }
  // Titolo centrato
  doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(0,0,0);
  doc.text('VIGONTINA SAN PAOLO - REPORT PARTITA', pageW/2, 20, { align: 'center' });
  let y = 28;
  // Riga badge esito (centrata ma resa come riga dedicata)
  const res = getMatchResult(match);
  const badge = res.winner === 'vigontina' ? 'VITTORIA' : res.winner === 'opponent' ? 'SCONFITTA' : 'PAREGGIO';
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.text(badge, pageW/2, y, { align: 'center' });
  y += 6;
  // Riga punti separata
  const vp = calculatePoints(match,'vigontina'); const op = calculatePoints(match,'opponent');
  doc.setFont("helvetica","normal"); doc.setFontSize(12);
  doc.text(`Punti: Vigontina ${vp} - ${op} ${match.opponent}`, pageW/2, y, { align: 'center' });
  y += 8;
  return y;
}

function drawMatchInfoAndStaff(doc, match, startY) {
  // Blocchi info su righe separate, Helvetica 11pt, come template
  let y = startY;
  doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(0,0,0);
  doc.text(`${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent}`, 20, y); y += 6;
  doc.text(`${match.competition || ''}`, 20, y); y += 6;
  doc.text(`${match.isHome ? 'Casa' : 'Trasferta'} - ${fmtDateIT(match.date)}`, 20, y); y += 8;
  if (match.captain) { const c = match.captain; doc.text(`Capitano: ${c.number||c.num||''} ${(c.name||'').toUpperCase()}`, 20, y); y += 6; }
  if (match.coach) { doc.text(`Allenatore: ${match.coach}`, 20, y); y += 6; }
  if (match.manager) { doc.text(`Dirigente Accompagnatore: ${match.manager}`, 20, y); y += 8; }
  return y;
}

function tableGrid(doc, opts) {
  const { title, head, body, startY, colStyles } = opts;
  if (!Array.isArray(body) || body.length===0) return startY;
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(0,0,0);
  doc.text(title, 20, startY);
  autoTable(doc, {
    startY: startY + 4,
    theme: 'grid',
    head: [head],
    body,
    styles: { font: 'helvetica', fontSize: 10, textColor: [0,0,0], cellPadding: {top:3,bottom:3,left:2,right:2} },
    headStyles: { fontStyle:'bold', halign:'left', textColor:[0,0,0] },
    columnStyles: colStyles || {},
    margin: { left: 20, right: 20 }
  });
  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : startY + 12;
}

function drawPeriods(doc, match, startY) {
  const rows = nonTechnicalPeriods(match).map(p=>[
    p.name,
    String(safeNum(p.vigontina)),
    String(safeNum(p.opponent)),
    'Si',
    safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
  ]);
  return tableGrid(doc, { title: 'DETTAGLIO PERIODI', head: ['Periodo','Vigontina', match.opponent, 'Completato','Esito'], body: rows, startY, colStyles: { 0:{cellWidth:36}, 1:{halign:'center',cellWidth:24}, 2:{halign:'center',cellWidth:24}, 3:{halign:'center',cellWidth:26}, 4:{halign:'center',cellWidth:32} } });
}

function drawTechTest(doc, match, startY) {
  const rows = technicalTestPeriods(match).map(p=>[
    p.name,
    String(safeNum(p.vigontina)),
    String(safeNum(p.opponent)),
    safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)
  ]);
  return tableGrid(doc, { title: 'PROVA TECNICA', head: ['Periodo','Vigontina', match.opponent, 'Esito'], body: rows, startY, colStyles: { 0:{cellWidth:36}, 1:{halign:'center',cellWidth:24}, 2:{halign:'center',cellWidth:24}, 3:{halign:'center',cellWidth:36} } });
}

function drawScorers(doc, match, startY) {
  const stats = calculateMatchStats(match);
  const map = {};
  stats.allGoals.filter(e=>!e.deletionReason && (e.type==='goal'||e.type==='penalty-goal')).forEach(e=>{ const n = e.scorerName||e.scorer||'Sconosciuto'; map[n]=(map[n]||0)+1; });
  const body = Object.keys(map).length? Object.entries(map).map(([n,g])=>[n,String(g)]) : [["Nessun marcatore","-"]];
  return tableGrid(doc, { title: 'MARCATORI', head: ['Giocatore','Gol'], body, startY, colStyles: { 0:{cellWidth:70}, 1:{halign:'center',cellWidth:18} } });
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
  if (e.type==='substitution') {
    const outStr = e.out?`${e.out.num||e.out.number||''} ${e.out.name||''}`.trim():'N/A';
    const inStr = e.in?`${e.in.num||e.in.number||''} ${e.in.name||''}`.trim():'N/A';
    return `${min} - Sostituzione: ${outStr} → ${inStr}`;
  }
  if (e.type?.startsWith('free-kick') || e.type==='foul' || e.type==='punizione') {
    const isOpp = e.type.includes('opponent') || e.team==='opponent'; const shooter = isOpp? opponentName : who(e.player, e.playerName);
    if (e.type.includes('goal')) return `${min} - Punizione gol ${shooter}`;
    if (e.type.includes('saved')) return `${min} - Punizione parata ${shooter}`;
    if (e.type.includes('missed')) return `${min} - Punizione fuori ${shooter}`;
    if (e.type.includes('hit')) { const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - Punizione ${hl} ${shooter}`; }
    return `${min} - Punizione ${shooter}`;
  }
  if (e.type==='yellow-card'||e.type==='cartellino-giallo') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Ammonizione ${pl}`; }
  if (e.type==='red-card'||e.type==='cartellino-rosso') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} - Espulsione ${pl}`; }
  const scorer = e.scorerName||e.scorer||who(e.player,e.playerName); const assist = e.assistName||e.assist||'';
  switch(e.type){
    case 'goal': { const base = `${min} - Gol ${scorer}`; return assist?`${base} (assist ${assist})`:base; }
    case 'own-goal': return `${min} - Autogol Vigontina (gol a ${opponentName})`;
    case 'opponent-own-goal': return `${min} - Autogol ${opponentName} (gol a Vigontina)`;
    case 'opponent-goal': return `${min} - Gol ${opponentName}`;
    case 'penalty-goal': { const base = `${min} - Gol (Rig.) ${scorer}`; return assist?`${base} (assist ${assist})`:base; }
    case 'penalty-missed': return `${min} - Rigore fallito Vigontina`;
    case 'penalty-opponent-goal': return `${min} - Gol (Rig.) ${opponentName}`;
    case 'penalty-opponent-missed': return `${min} - Rigore fallito ${opponentName}`;
    case 'save': return `${min} - Parata ${who(e.player, e.playerName)}`;
    case 'opponent-save': return `${min} - Parata portiere ${opponentName}`;
    case 'missed-shot': return `${min} - Tiro fuori ${who(e.player, e.playerName)}`;
    case 'opponent-missed-shot': return `${min} - Tiro fuori ${opponentName}`;
    case 'shot-blocked': return `${min} - Tiro parato ${who(e.player, e.playerName)}`;
    case 'opponent-shot-blocked': return `${min} - Tiro parato ${opponentName}`;
    default: { if (e.hitType==='palo'||e.hitType==='traversa'){ const whoStr = e.team==='vigontina'?who(e.player,e.playerName):opponentName; const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} - ${hl} ${whoStr}`; } return `${min} - ${e.type||'Evento'}`; }
  }
}

function drawChronology(doc, match, startY) {
  const all = collectEvents(match);
  const byPeriod = {};
  all.forEach(e=>{ const k = e.periodName||e.period||'N/A'; (byPeriod[k]||(byPeriod[k]=[])).push(e); });
  const ord=(s)=> s?.includes?.('1°')?1: s?.includes?.('2°')?2: s?.includes?.('3°')?3: s?.includes?.('4°')?4: 5;
  const rows=[]; Object.entries(byPeriod).sort(([a],[b])=>ord(a)-ord(b)).forEach(([p,evs])=>{ evs.sort((a,b)=>(a.minute||0)-(b.minute||0)).forEach(e=> rows.push([p, labelEvent(e, match.opponent)])); });
  return tableGrid(doc, { title: 'CRONOLOGIA EVENTI', head: ['Periodo','Evento'], body: rows, startY, colStyles: { 0:{cellWidth:36}, 1:{cellWidth:124} } });
}

export const exportMatchToPDF = async (match) => {
  if (!match) { alert("Nessuna partita selezionata per l'esportazione"); return; }
  try {
    const doc = new jsPDF();
    const logo = await loadLogoAsBase64();
    let y = drawTemplateHeader(doc, match, logo);
    y = drawMatchInfoAndStaff(doc, match, y);
    y = drawPeriods(doc, match, y);
    y = drawTechTest(doc, match, y);
    y = drawScorers(doc, match, y);
    // Altri eventi: mostrare solo se presenti
    const stats = calculateMatchStats(match);
    const penaltyGoals = stats.allGoals.filter(e=>!e.deletionReason && e.type==='penalty-goal').length;
    if (penaltyGoals > 0) {
      y = tableGrid(doc, { title: 'ALTRI EVENTI', head: ['Voce','Valore'], body: [["Rigori segnati", String(penaltyGoals)]], startY: y, colStyles: { 0:{cellWidth:60}, 1:{halign:'center',cellWidth:30} } });
    }
    y = drawChronology(doc, match, y);
    // Nota finale
    const ph = doc.internal.pageSize.height; doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(0,0,0);
    doc.text('Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).', 105, ph-10, { align: 'center' });
    const fileName = `Vigontina_vs_${(match.opponent||'Avversario').replace(/[^a-zA-Z0-9]/g,'_')}_${fmtDateIT(match.date).replace(/\//g,'_')}.pdf`;
    doc.save(fileName);
  } catch (e) {
    console.error('Errore export PDF:', e); alert(`Errore durante l'esportazione PDF: ${e?.message||'Errore sconosciuto'}`);
  }
};

export const exportMatchToExcel = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione Excel"); return; } return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length===0) { alert("Nessuna partita disponibile per l'esportazione storico"); return; } return exportMatchHistoryToExcel(matches); };
