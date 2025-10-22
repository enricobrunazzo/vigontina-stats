// utils/exportUtils.js — Banner uniforme al riepilogo (punti per tempo)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateMatchStats, getMatchResult, calculatePoints } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

const PALETTE = { blue: [40, 92, 140], gray: [110, 115, 120], green: [16, 128, 98], grid: [215, 220, 225], banner: { win:{fill:[184,228,199],border:[134,198,160],title:[22,122,86]}, draw:{fill:[252,236,178],border:[238,206,120],title:[177,134,16]}, lose:{fill:[246,205,205],border:[225,150,150],title:[156,30,30]} } };
const MARGINS = { left: 14, right: 14 };

const loadLogoAsBase64 = async () => { const p = '/logo-vigontina.png'; try { const r = await fetch(p); if (!r.ok) return null; const b = await r.blob(); const rd = new FileReader(); return await new Promise((res)=>{ rd.onload=()=>res(rd.result); rd.onerror=()=>res(null); rd.readAsDataURL(b); }); } catch { return null; } };

function drawHeader(doc, match) { const pageW = doc.internal.pageSize.width; const logo = match.__logoBase64; if (logo) { try { doc.addImage(logo, 'PNG', MARGINS.left, 10, 22, 22); } catch {} } doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(0,0,0); doc.text('VIGONTINA SAN PAOLO - REPORT PARTITA', pageW/2, 18, { align: 'center' }); return 34; }

function bannerOutcome(doc, match, startY) { 
  const pageW = doc.internal.pageSize.width; 
  const { isWin, isDraw } = getMatchResult(match);
  const kind = isWin ? 'win' : isDraw ? 'draw' : 'lose';
  const scheme = kind==='win'?PALETTE.banner.win: kind==='lose'?PALETTE.banner.lose: PALETTE.banner.draw; 
  const x = MARGINS.left, w = pageW - MARGINS.left - MARGINS.right, h = 16, y = startY; 
  doc.setDrawColor(...scheme.border); 
  doc.setLineWidth(0.12); 
  try { doc.setFillColor(...scheme.fill); doc.roundedRect(x, y, w, h, 3, 3, 'FD'); } catch { doc.setFillColor(...scheme.fill); doc.rect(x, y, w, h, 'F'); }
  const title = kind==='win'?'VITTORIA':kind==='lose'?'SCONFITTA':'PAREGGIO'; 
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...scheme.title); doc.text(title, x + 6, y + 7);

  // Uniforme al riepilogo: punti per tempo (periodi completati, PT esclusa)
  const vigPts = calculatePoints(match, 'vigontina');
  const oppPts = calculatePoints(match, 'opponent');

  // Gol totali (solo informativi), esclusa Prova Tecnica
  let vGoals=0,oGoals=0; nonTechnicalPeriods(match).forEach(p=>{ vGoals+=safeNum(p.vigontina); oGoals+=safeNum(p.opponent); });

  doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
  doc.text(`Punti tempi: Vigontina ${vigPts} - ${oppPts} ${match.opponent}`, x + w - 6, y + 7, { align: 'right' });
  doc.setFontSize(9); doc.setTextColor(90,90,90);
  doc.text(`Gol: ${vGoals}-${oGoals}`, x + w - 6, y + 13, { align: 'right' });
  return y + h + 8; 
}

function infoBlock(doc, match, startY) {
  let y = startY;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(0,0,0);
  doc.text(`${match.teamName || 'Vigontina San Paolo'} vs ${match.opponent}`, MARGINS.left, y); y += 6;
  if (match.competition) { doc.text(`${match.competition}`, MARGINS.left, y); y += 6; }
  doc.text(`${match.isHome ? 'Casa' : 'Trasferta'} - ${fmtDateIT(match.date)}`, MARGINS.left, y); y += 6;
  if (match.captain) { const c = match.captain; doc.text(`Capitano: ${c.number||c.num||''} ${(c.name||'').toUpperCase()}`, MARGINS.left, y); y += 6; }
  if (match.coach) { doc.text(`Allenatore: ${match.coach}`, MARGINS.left, y); y += 6; }
  if (match.assistantReferee) { doc.text(`Assistente Arbitro: ${match.assistantReferee}`, MARGINS.left, y); y += 6; }
  if (match.manager) { doc.text(`Dirigente Accompagnatore: ${match.manager}`, MARGINS.left, y); y += 8; }
  return y;
}

function gridTable(doc, { title, head, body, startY, widths, headColor }) { if (!Array.isArray(body) || body.length===0) return startY; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0,0,0); doc.text(title, MARGINS.left, startY); const columnStyles = {}; if (Array.isArray(widths)) widths.forEach((w, i)=>{ columnStyles[i] = { cellWidth: w, halign: i>0 ? 'center' : 'left' }; }); autoTable(doc, { startY: startY + 4, theme: 'grid', head: [head], body, styles: { font: 'helvetica', fontSize: 9.5, lineColor: PALETTE.grid, lineWidth: 0.1, cellPadding: {top:2,bottom:2,left:2,right:2}, textColor: [0,0,0] }, headStyles: { fillColor: headColor, textColor: [255,255,255], fontStyle:'bold', halign:'left', lineWidth: 0.1, lineColor: PALETTE.grid, fontSize: 10 }, columnStyles, margin: { left: MARGINS.left, right: MARGINS.right }, }); return (doc.lastAutoTable?.finalY || (startY+12)) + 6; }

// Sanitize text to avoid broken spacing/encoding in PDF
const sanitize = (s = "") => String(s)
  .normalize('NFC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

function formatEventLine(e, opponentName) {
  const min = Number.isFinite(e.minute) ? `${e.minute}' - ` : '';
  const t = e.type || '';
  const pn = sanitize(e.playerName || '');
  const ps = e.player ? sanitize(`${e.player} ${pn}`) : pn;
  const opp = sanitize(opponentName || 'Avversario');
  if (t === 'goal' || t === 'penalty-goal') { const rig = t === 'penalty-goal' ? 'Rigore ' : ''; return sanitize(`${min}${rig}${e.scorer||''} ${(e.scorerName||'').trim()}`); }
  if (t === 'opponent-goal' || t === 'penalty-opponent-goal') { const rig = t === 'penalty-opponent-goal' ? 'Rigore ' : 'Gol '; return sanitize(`${min}${rig}${opp}`); }
  if (t === 'own-goal') return sanitize(`${min}Autogol Vigontina`);
  if (t === 'opponent-own-goal') return sanitize(`${min}Autogol ${opp}`);
  if (t.includes('penalty') && t.includes('missed')) { const who = t === 'penalty-missed' ? 'Vigontina' : opp; return sanitize(`${min}Rigore fallito ${who}`); }
  if (t === 'missed-shot' || t === 'opponent-missed-shot') { const isVig = t === 'missed-shot'; return sanitize(`${min}Tiro fuori ${isVig ? (ps||'Vigontina') : opp}`); }
  if (t === 'shot-blocked' || t === 'opponent-shot-blocked') { const isVig = t === 'shot-blocked'; return sanitize(`${min}${isVig ? (ps||'Vigontina') : opp} tiro parato`); }
  if (t === 'save' || t === 'opponent-save') { const isVig = t === 'save'; return sanitize(`${min}Parata ${isVig ? (ps||'Vigontina') : `portiere ${opp}`}`); }
  if (t?.includes('palo-') || t?.includes('traversa-')) { const isVig = e.team === 'vigontina'; const hit = e.hitType === 'palo' ? 'Palo' : 'Traversa'; return sanitize(`${min}${hit} ${isVig ? (ps||'Vigontina') : opp}`); }
  if (t?.startsWith('free-kick')) { const isOpp = t.includes('opponent'); if (t.includes('missed')) return sanitize(`${min}Punizione fuori ${isOpp ? opp : (ps||'')}`); if (t.includes('saved')) return sanitize(`${min}Punizione parata ${isOpp ? opp : (ps||'')}`); if (t.includes('hit')) return sanitize(`${min}Punizione ${e.hitType==='palo'?'Palo':'Traversa'} ${isOpp ? opp : (ps||'')}`); }
  if (t === 'substitution') { const out = e.out ? sanitize(`${e.out?.num||''} ${e.out?.name||''}`) : ''; const inn = e.in ? sanitize(`${e.in?.num||''} ${e.in?.name||''}`) : ''; return sanitize(`${min}Sostituzione: ${out} -> ${inn}`); }
  return sanitize(`${min}${e.label || t || 'Evento'}`);
}

export const exportMatchToPDF = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione"); return; } try { const doc = new jsPDF(); match.__logoBase64 = await loadLogoAsBase64(); let y = drawHeader(doc, match); y = bannerOutcome(doc, match, y); y = infoBlock(doc, match, y); const pageW = doc.internal.pageSize.width; const fullW = pageW - MARGINS.left - MARGINS.right; const periodsRows = nonTechnicalPeriods(match).map(p=>[p.name,String(safeNum(p.vigontina)),String(safeNum(p.opponent)),'Si',safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)]); y = gridTable(doc, { title:'DETTAGLIO PERIODI', head:['Periodo','Vigontina', match.opponent, 'Completato','Esito'], body: periodsRows, startY: y, widths:[fullW*0.27, fullW*0.14, fullW*0.14, fullW*0.18, fullW*0.27], headColor: PALETTE.blue }); const techRows = technicalTestPeriods(match).map(p=>[p.name,String(safeNum(p.vigontina)),String(safeNum(p.opponent)),safeNum(p.vigontina)===safeNum(p.opponent)?'Pareggio':(safeNum(p.vigontina)>safeNum(p.opponent)?'Vigontina':match.opponent)]); y = gridTable(doc, { title:'PROVA TECNICA', head:['Periodo','Vigontina', match.opponent, 'Esito'], body: techRows, startY: y, widths:[fullW*0.33, fullW*0.22, fullW*0.22, fullW*0.23], headColor: PALETTE.gray }); const stats = calculateMatchStats(match); const map = {}; stats.allGoals.filter(e=>!e.deletionReason && (e.type==='goal'||e.type==='penalty-goal')).forEach(e=>{ const n = e.scorerName||e.scorer||'Sconosciuto'; map[n]=(map[n]||0)+1; }); const scorersBody = Object.keys(map).length? Object.entries(map).map(([n,g])=>[n,String(g)]) : [["Nessun marcatore","-"]]; y = gridTable(doc, { title:'MARCATORI', head:['Giocatore','Gol'], body: scorersBody, startY: y, widths:[fullW*0.8, fullW*0.2], headColor: PALETTE.blue }); const penaltyGoals = stats.allGoals.filter(e=>!e.deletionReason && e.type==='penalty-goal').length; if (penaltyGoals > 0) { y = gridTable(doc, { title:'ALTRI EVENTI', head:['Voce','Valore'], body:[["Rigori segnati", String(penaltyGoals)]], startY: y, widths:[fullW*0.7, fullW*0.3], headColor: PALETTE.blue }); } const all=[]; (match.periods||[]).forEach(p=>{ const source = Array.isArray(p.goals)? p.goals : []; source.forEach(e=> all.push({ ...e, periodName: p.name })); }); const byPeriod={}; all.forEach(e=>{ const k=e.periodName||e.period||'N/A'; (byPeriod[k]||(byPeriod[k]=[])).push(e); }); const ord=(s)=> s?.includes?.('1°')?1: s?.includes?.('2°')?2: s?.includes?.('3°')?3: s?.includes?.('4°')?4: 5; const rows=[]; Object.entries(byPeriod).sort(([a],[b])=>ord(a)-ord(b)).forEach(([p,evs])=>{ evs.sort((a,b)=>(a.minute||0)-(b.minute||0)).forEach(e=> rows.push([sanitize(p), formatEventLine(e, match.opponent)])); }); y = gridTable(doc, { title:'CRONOLOGIA EVENTI', head:['Periodo','Evento'], body: rows, startY: y, widths:[fullW*0.26, fullW*0.74], headColor: PALETTE.green }); const ph = doc.internal.pageSize.height; doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(0,0,0); doc.text('Nota: punteggio allineato al riepilogo (punti per tempo, Prova Tecnica esclusa).', pageW/2, ph-10, { align: 'center' }); const fileName = `Vigontina_vs_${(match.opponent||'Avversario').replace(/[^a-zA-Z0-9]/g,'_')}_${fmtDateIT(match.date).replace(/\//g,'_')}.pdf`; doc.save(fileName); } catch (e) { console.error('Errore export PDF:', e); alert(`Errore durante l'esportazione PDF: ${e?.message||'Errore sconosciuto'}`); } };

export const exportMatchToExcel = async (match) => { if (!match) { alert("Nessuna partita selezionata per l'esportazione Excel"); return; } return exportMatchHistoryToExcel([match]); };
export const exportHistoryToExcel = async (matches) => { if (!Array.isArray(matches) || matches.length===0) { alert("Nessuna partita disponibile per l'esportazione storico"); return; } return exportMatchHistoryToExcel(matches); };