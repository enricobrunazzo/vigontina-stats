// utils/exportUtils.js — Fix jsPDF.line invalid args; robust separators
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculatePoints, calculateMatchStats, getMatchResult } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

const BADGE_COLORS = { vigontina: [160, 212, 180], opponent: [242, 180, 180], draw: [245, 225, 160] };

const loadLogoAsBase64 = async () => {
  const paths = ['/logo-vigontina.png','/public/logo-vigontina.png','/assets/logo-vigontina.png','./logo-vigontina.png'];
  for (const p of paths) {
    try { const r = await fetch(p); if (r.ok) { const b = await r.blob(); const rd = new FileReader(); return await new Promise((res, rej)=>{ rd.onload=()=>res(rd.result); rd.onerror=()=>res(null); rd.readAsDataURL(b); }); } } catch {}
  }
  return null;
};

const safeLine = (doc, x1, y1, x2, y2) => {
  const toNum = (v)=> Number.isFinite(v)? v : 0;
  try { doc.line(toNum(x1), toNum(y1), toNum(x2), toNum(y2)); } catch { /* ignore */ }
};

function drawHeader(doc, match, logoBase64) {
  const marginL = 20; let y = 18;
  if (logoBase64) { try { doc.addImage(logoBase64, 'PNG', marginL, 12, 22, 22); } catch {} }
  doc.setTextColor(33,33,33); doc.setFont("helvetica","bold"); doc.setFontSize(14);
  const titleX = logoBase64 ? marginL + 28 : marginL;
  doc.text("VIGONTINA SAN PAOLO", titleX, y);
  y += 6; doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(90,90,90);
  const sub = `${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent} · ${match.competition || ''} · ${match.isHome ? 'Casa' : 'Trasferta'} · ${fmtDateIT(match.date)}`.replace(/\s·\s·/g,' · ').trim();
  doc.text(sub, titleX, y);
  doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); safeLine(doc, marginL, y+6, 190, y+6);
  return y + 12;
}

function drawOutcomeLine(doc, match, startY) {
  const res = getMatchResult(match); const vp = calculatePoints(match,'vigontina'); const op = calculatePoints(match,'opponent');
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(33,33,33);
  const text = `Risultato: Vigontina ${vp} – ${op} ${match.opponent}`; doc.text(text, 20, startY);
  const badge = res.winner === 'vigontina' ? 'VITTORIA' : res.winner === 'opponent' ? 'SCONFITTA' : 'PAREGGIO';
  const color = res.winner === 'vigontina' ? BADGE_COLORS.vigontina : res.winner === 'opponent' ? BADGE_COLORS.opponent : BADGE_COLORS.draw;
  const badgeX = 150; const badgeY = startY - 6; const bw = 40; const bh = 8;
  doc.setFillColor(...color); try { doc.rect(badgeX, badgeY, bw, bh, 'F'); } catch {}
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(60,60,60);
  doc.text(badge, badgeX + bw/2, badgeY + 5.6, {align:'center'});
  doc.setDrawColor(220,220,220); doc.setLineWidth(0.2); safeLine(doc, 20, startY+4, 190, startY+4);
  return startY + 10;
}

function drawPlainTable(doc, options) {
  const { title, head, body, startY, colStyles } = options;
  if (!Array.isArray(body) || body.length === 0) return startY;
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(33,33,33); doc.text(title, 20, startY);
  autoTable(doc, {
    startY: startY + 4,
    theme: 'plain',
    head: [head],
    body,
    styles: { font: 'helvetica', fontSize: 10, textColor: [33,33,33], cellPadding: {top:3,bottom:3,left:2,right:2} },
    headStyles: { fontStyle:'bold', halign:'left', textColor:[33,33,33] },
    columnStyles: colStyles || {},
    margin: { left: 20, right: 20 },
    didDrawPage: (data)=>{ try { const {table} = data; const y = table.head?.[0]?.sectionHeight + table.head?.[0]?.y; if (Number.isFinite(y)) { doc.setDrawColor(210,210,210); doc.setLineWidth(0.2); safeLine(doc, 20, y, 190, y); } } catch {} }
  });
  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : startY + 10;
}

function collectEvents(match) {
  const evs = []; (match.periods || []).forEach(p => { const arrs = [p.events||[], p.goals||[], p.substitutions||[], p.fouls||[], p.cards||[], p.allEvents||[]]; arrs.forEach(a=>Array.isArray(a)&&a.forEach(e=> e && evs.push({ ...e, periodName: p.name }))); });
  if (Array.isArray(match.events)) match.events.forEach(e=> e && evs.push({ ...e, periodName: e.periodName || 'Match' }));
  return evs.filter(e=>!e.deletionReason);
}

function labelEvent(e, opponentName) {
  const min = e.minute!=null?`${e.minute}'`:''; const who=(pl,n)=> (pl?`${pl} ${n||''}`.trim():'').trim();
  if (e.type==='substitution') { const outStr = e.out?`${e.out.num||e.out.number||''} ${e.out.name||''}`.trim():'N/A'; const inStr = e.in?`${e.in.num||e.in.number||''} ${e.in.name||''}`.trim():'N/A'; return `${min} Sostituzione: ${outStr} → ${inStr}`; }
  if (e.type?.startsWith('free-kick') || e.type==='foul' || e.type==='punizione') { const isOpp = e.type.includes('opponent') || e.team==='opponent'; const shooter = isOpp ? opponentName : who(e.player, e.playerName); if (e.type.includes('goal')) return `${min} Punizione gol ${shooter}`; if (e.type.includes('saved')) return `${min} Punizione parata ${shooter}`; if (e.type.includes('missed')) return `${min} Punizione fuori ${shooter}`; if (e.type.includes('hit')) { const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} Punizione ${hl} ${shooter}`; } return `${min} Punizione ${shooter}`; }
  if (e.type==='yellow-card' || e.type==='cartellino-giallo') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} Ammonizione ${pl}`; }
  if (e.type==='red-card' || e.type==='cartellino-rosso') { const pl = who(e.player, e.playerName) || (e.team==='opponent'?opponentName:'Giocatore'); return `${min} Espulsione ${pl}`; }
  const scorer = e.scorerName || e.scorer || who(e.player, e.playerName); const assist = e.assistName || e.assist || '';
  switch(e.type){ case 'goal': { const base = `${min} Gol ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'own-goal': return `${min} Autogol Vigontina (gol a ${opponentName})`; case 'opponent-own-goal': return `${min} Autogol ${opponentName} (gol a Vigontina)`; case 'opponent-goal': return `${min} Gol ${opponentName}`; case 'penalty-goal': { const base = `${min} Gol (Rig.) ${scorer}`; return assist?`${base} (assist ${assist})`:base; } case 'penalty-missed': return `${min} Rigore fallito Vigontina`; case 'penalty-opponent-goal': return `${min} Gol (Rig.) ${opponentName}`; case 'penalty-opponent-missed': return `${min} Rigore fallito ${opponentName}`; case 'save': return `${min} Parata ${who(e.player, e.playerName)}`; case 'opponent-save': return `${min} Parata portiere ${opponentName}`; case 'missed-shot': return `${min} Tiro fuori ${who(e.player, e.playerName)}`; case 'opponent-missed-shot': return `${min} Tiro fuori ${opponentName}`; case 'shot-blocked': return `${min} Tiro parato ${who(e.player, e.playerName)}`; case 'opponent-shot-blocked': return `${min} Tiro parato ${opponentName}`; default: { if (e.hitType==='palo' || e.hitType==='traversa'){ const whoStr = e.team==='vigontina'?who(e.player, e.playerName):opponentName; const hl = e.hitType==='traversa'?'traversa':'palo'; return `${min} ${hl} ${whoStr}`; } return `${min} ${e.type||'Evento'}`; } }
}

function drawScorers(doc, match, startY) {
  const stats = calculateMatchStats(match); const map = {}; stats.allGoals.filter(e=>!e.deletionReason && (e.type==='goal' || e.type==='penalty-goal')).forEach(e=>{ const name = e.scorerName || e.scorer || 'Sconosciuto'; map[name]=(map[name]||0)+1; });
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(33,33,33); doc.text('Marcatori', 20, startY);
  const rows = Object.keys(map).length? Object.entries(map).map(([n,g])=>[n,String(g)]) : [["Nessun marcatore","-"]];
  autoTable(doc, { startY: startY + 4, theme: 'plain', head: [["Giocatore","Gol"]], body: rows, styles: { font: 'helvetica', fontSize: 10, textColor: [33,33,33], cellPadding: {top:3,bottom:3,left:2,right:2} }, headStyles: { fontStyle:'bold', halign:'left', textColor:[33,33,33] }, columnStyles: { 0:{cellWidth:70}, 1:{halign:'center', cellWidth:18} }, margin: { left: 20, right: 20 }, didDrawPage: (data)=>{ try { const {table} = data; const y = table.head?.[0]?.sectionHeight + table.head?.[0]?.y; if (Number.isFinite(y)) { doc.setDrawColor(210,210,210); doc.setLineWidth(0.2); safeLine(doc, 20, y, 190, y); } } catch {} } });
  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : startY + 12;
}

function drawChronologyTable(doc, match, startY) {
  const all = collectEvents(match); const byPeriod = {}; all.forEach(e=>{ const k = e.periodName || e.period || 'N/A'; (byPeriod[k]||(byPeriod[k]=[])).push(e); });
  const order = (s)=> s?.includes?.('1°')?1: s?.includes?.('2°')?2: s?.includes?.('3°')?3: s?.includes?.('4°')?4: 5; const rows = [];
  Object.entries(byPeriod).sort(([a],[b])=>order(a)-order(b)).forEach(([p,evs])=>{ evs.sort((a,b)=>(a.minute||0)-(b.minute||0)).forEach(e=> rows.push([p, labelEvent(e, match.opponent)])); });
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(33,33,33); doc.text('Cronologia eventi', 20, startY);
  if (rows.length===0) { doc.setFont("helvetica","italic"); doc.setFontSize(10); doc.setTextColor(90,90,90); doc.text('Nessun evento registrato durante la partita.', 20, startY+6); return startY+12; }
  autoTable(doc, { startY: startY + 4, theme: 'plain', head: [["Periodo","Evento"]], body: rows, styles: { font: 'helvetica', fontSize: 9, textColor: [33,33,33], cellPadding: {top:2.5,bottom:2.5,left:2,right:2} }, headStyles: { fontStyle:'bold', halign:'left', textColor:[33,33,33] }, columnStyles: { 0:{cellWidth:30}, 1:{cellWidth:130} }, margin: { left: 20, right: 20 }, didDrawPage: (data)=>{ try { const {table} = data; const y = table.head?.[0]?.sectionHeight + table.head?.[0]?.y; if (Number.isFinite(y)) { doc.setDrawColor(210,210,210); doc.setLineWidth(0.2); safeLine(doc, 20, y, 190, y); } } catch {} } });
  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : startY + 12;
}

export const exportMatchToPDF = async (match) => {
  if (!match) { alert("Nessuna partita selezionata per l'esportazione"); return; }
  try {
    const doc = new jsPDF(); const logo = await loadLogoAsBase64();
    let y = drawHeader(doc, match, logo);
    y = drawOutcomeLine(doc, match, y);
    y = drawPlainTable(doc, { title: 'Dettaglio periodi', head: ["Periodo","Vigontina", match.opponent, "Esito"], body: nonTechnicalPeriods(match).map(p=>[p.name, safeNum(p.vigontina), safeNum(p.opponent), safeNum(p.vigontina)===safeNum(p.opponent)?"Pareggio":(safeNum(p.vigontina)>safeNum(p.opponent)?"Vigontina":match.opponent)]), startY: y, colStyles: { 0:{cellWidth:36},1:{halign:'center',cellWidth:24},2:{halign:'center',cellWidth:24},3:{halign:'center',cellWidth:36} } });
    y = drawPlainTable(doc, { title: 'Prova tecnica', head: ["Periodo","Vigontina", match.opponent, "Esito"], body: technicalTestPeriods(match).map(p=>[p.name, safeNum(p.vigontina), safeNum(p.opponent), safeNum(p.vigontina)===safeNum(p.opponent)?"Pareggio":(safeNum(p.vigontina)>safeNum(p.opponent)?"Vigontina":match.opponent)]), startY: y, colStyles: { 0:{cellWidth:36},1:{halign:'center',cellWidth:24},2:{halign:'center',cellWidth:24},3:{halign:'center',cellWidth:36} } });
    y = drawScorers(doc, match, y);
    y = drawChronologyTable(doc, match, y);
    const ph = doc.internal.pageSize.height; doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(110,110,110); doc.text('Nota: i punti escludono la Prova Tecnica.', 20, ph-10);
    const pageCount = doc.getNumberOfPages(); for (let i=1;i<=pageCount;i++){ doc.setPage(i); doc.text(`Pag. ${i}/${pageCount}`, 190, ph-10, {align:'right'}); }
    const fileName = `Vigontina_vs_${(match.opponent||'Avversario').replace(/[^a-zA-Z0-9]/g,'_')}_${fmtDateIT(match.date).replace(/\//g,'_')}.pdf`; doc.save(fileName);
  } catch (e) { console.error('Errore export PDF:', e); alert(`Errore durante l'esportazione PDF: ${e?.message||'Errore sconosciuto'}`); }
};

export const exportMatchToExcel = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione Excel"); return; } return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length===0) { alert("Nessuna partita disponibile per l'esportazione storico"); return; } return exportMatchHistoryToExcel(matches); };
