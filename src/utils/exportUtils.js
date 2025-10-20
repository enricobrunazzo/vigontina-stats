// utils/exportUtils.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { PLAYERS } from "../constants/players";
import { calculatePoints, calculateTotalGoals, calculateMatchStats, getMatchResult } from "./matchUtils";
import { exportMatchHistoryToExcel } from "./excelExport";

const isTechnicalTest = (p) => (p?.name || "").trim().toUpperCase() === "PROVA TECNICA";
const nonTechnicalPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => !isTechnicalTest(p)) : [];
const technicalTestPeriods = (match) => Array.isArray(match?.periods) ? match.periods.filter((p) => isTechnicalTest(p)) : [];
const safeNum = (v) => (Number.isFinite(v) ? v : 0);
const fmtDateIT = (d) => { const date = new Date(d); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("it-IT") : ""; };

function periodOutcome(period, opponentName = "Avversari") {
  const v = safeNum(period.vigontina); const o = safeNum(period.opponent);
  if (v === o) return { label: "Pareggio", winner: "draw" };
  if (v > o) return { label: "Vigontina", winner: "vigontina" };
  return { label: opponentName, winner: "opponent" };
}

function eventLabel(e, opponentName = "Avversari") {
  const min = e.minute != null ? `${e.minute}'` : "";
  const scorer = e.scorerName || e.scorer || "";
  const assistName = e.assistName || e.assist || "";
  const isHit = e.type?.includes('palo-') || e.type?.includes('traversa-');
  const hitLabel = e.hitType === 'palo' ? 'Palo' : e.hitType === 'traversa' ? 'Traversa' : null;
  switch (e.type) {
    case "goal": { const base = `${min} - Gol ${scorer}`.trim(); return assistName ? `${base} (assist ${assistName})` : base; }
    case "own-goal": return `${min} - Autogol Vigontina (gol a ${opponentName})`;
    case "opponent-own-goal": return `${min} - Autogol ${opponentName} (gol a Vigontina)`;
    case "opponent-goal": return `${min} - Gol ${opponentName}`;
    case "penalty-goal": { const base = `${min} - Gol (Rig.) ${scorer}`.trim(); return assistName ? `${base} (assist ${assistName})` : base; }
    case "penalty-missed": return `${min} - Rigore fallito Vigontina`;
    case "penalty-opponent-goal": return `${min} - Gol (Rig.) ${opponentName}`;
    case "penalty-opponent-missed": return `${min} - Rigore fallito ${opponentName}`;
    case "save": return `${min} - Parata ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-save": return `${min} - Parata portiere ${opponentName}`;
    case "missed-shot": return `${min} - Tiro fuori ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-missed-shot": return `${min} - Tiro fuori ${opponentName}`;
    case "shot-blocked": return `${min} - Tiro parato ${e.player ? `${e.player} ${e.playerName || ''}`.trim() : ''}`.trim();
    case "opponent-shot-blocked": return `${min} - Tiro parato ${opponentName}`;
    default: if (isHit) { const who = e.team === 'vigontina' ? `${e.player || ''} ${e.playerName || ''}`.trim() : opponentName; return `${min} - ${hitLabel || 'Legno'} ${who}`.trim(); } return `${min} - Evento`;
  }
}

export const exportMatchToPDF = async (match, opts = {}) => {
  if (!match) return;
  const opponentName = match.opponent || "Avversari";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  const vp = calculatePoints(match, "vigontina");
  const op = calculatePoints(match, "opponent");
  const vg = calculateTotalGoals(match, "vigontina");
  const og = calculateTotalGoals(match, "opponent");
  const stats = calculateMatchStats(match);
  const { resultText, isWin, isDraw } = getMatchResult(match);

  const logoUrl = opts.logoUrl ?? `${import.meta.env.BASE_URL || "/"}logo-vigontina.png`;
  let y = margin; const logoW=42, logoH=42;
  try { const res = await fetch(logoUrl, { cache: 'no-store' }); const blob = await res.blob(); const reader = new FileReader(); await new Promise((resolve)=>{ reader.onloadend=resolve; reader.readAsDataURL(blob); }); const dataUrl = reader.result; if (dataUrl) doc.addImage(dataUrl, "PNG", margin, y, logoW, logoH, undefined, "FAST"); } catch {}

  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text("VIGONTINA SAN PAOLO - REPORT PARTITA", pageWidth/2, y+18, { align:"center" });
  y = Math.max(y+18, y+logoH) + 12;

  const bg = isWin ? [220,252,231] : isDraw ? [254,249,195] : [254,226,226];
  const bd = isWin ? [16,185,129] : isDraw ? [250,204,21] : [239,68,68];
  const tx = isWin ? [4,120,87] : isDraw ? [161,98,7] : [153,27,27];
  const bannerX=margin, bannerW=pageWidth-margin*2, bannerH=28;
  doc.setFillColor(...bg); doc.setDrawColor(...bd); doc.roundedRect(bannerX,y,bannerW,bannerH,6,6,"FD");
  doc.setTextColor(...tx); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(resultText, bannerX+10, y+19);
  doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60); doc.text(`Punti: Vigontina ${vp} - ${op} ${opponentName}`, bannerX+bannerW-10, y+19, { align:"right" });
  doc.setTextColor(0,0,0); y += bannerH + 14;

  doc.setFont("helvetica","normal"); doc.setFontSize(11);
  const metaLines = [ `Vigontina San Paolo vs ${opponentName}`, `${match.competition || ""}${match.matchDay ? ` - Giornata ${match.matchDay}` : ""}`, `${match.isHome ? "Casa" : "Trasferta"} - ${fmtDateIT(match.date)}` ];
  if (match.captain) { const captainName = PLAYERS.find(p=>p.num===match.captain)?.name || ""; metaLines.push(`Capitano: ${match.captain} ${captainName}`); }
  if (match.coach) metaLines.push(`Allenatore: ${match.coach}`);
  if (match.assistantReferee) metaLines.push(`Assistente Arbitro: ${match.assistantReferee}`);
  if (match.teamManager) metaLines.push(`Dirigente Accompagnatore: ${match.teamManager}`);
  metaLines.forEach(l=>{ doc.text(l, margin, y); y+=14; });

  doc.setFont("helvetica","bold"); doc.text(`Gol (senza PT): ${vg} - ${og}`, margin, y); y+=18;
  doc.setFont("helvetica","bold"); doc.text("DETTAGLIO PERIODI", margin, y); y+=6;
  autoTable(doc,{ startY:y, head:[["Periodo","Vigontina",opponentName,"Completato","Esito"]], body: nonTechnicalPeriods(match).map(p=>{ const completed=p?.completed===true; const outcome=periodOutcome(p,opponentName).label; return [p.name||"", safeNum(p.vigontina), safeNum(p.opponent), completed?"Si":"No", outcome]; }), theme:"grid", styles:{ fontSize:9, cellPadding:3 }, headStyles:{ fillColor:[54,96,146], textColor:255 }, margin:{ left:margin, right:margin } });
  y = doc.lastAutoTable.finalY + 14;

  const pt = technicalTestPeriods(match);
  if (pt.length>0) { doc.setFont("helvetica","bold"); doc.text("PROVA TECNICA", margin, y); y+=6; autoTable(doc,{ startY:y, head:[["Periodo","Vigontina",opponentName,"Esito"]], body: pt.map(p=>{ const outcome=periodOutcome(p,opponentName).label; return [p.name||"Prova Tecnica", safeNum(p.vigontina), safeNum(p.opponent), outcome]; }), theme:"grid", styles:{ fontSize:9, cellPadding:3 }, headStyles:{ fillColor:[107,114,128], textColor:255 }, margin:{ left:margin, right:margin } }); y = doc.lastAutoTable.finalY + 14; }

  const statsObj = stats; const hasScorers = Object.keys(statsObj.scorers||{}).length>0; const hasAssisters = Object.keys(statsObj.assisters||{}).length>0; const hasOther = statsObj.ownGoalsCount>0 || statsObj.penaltiesScored>0 || statsObj.penaltiesMissed>0;
  if (hasScorers) { doc.setFont("helvetica","bold"); doc.text("MARCATORI", margin, y); y+=6; const body = Object.entries(statsObj.scorers).sort((a,b)=>b[1]-a[1]).map(([num,count])=>{ const p=PLAYERS.find(pp=>pp.num===parseInt(num,10)); return [`${num} ${p?.name||'Sconosciuto'}`, count]; }); autoTable(doc,{ startY:y, head:[["Giocatore","Gol"]], body, theme:"grid", styles:{ fontSize:9, cellPadding:3 }, headStyles:{ fillColor:[54,96,146], textColor:255 }, margin:{ left:margin, right:margin } }); y = doc.lastAutoTable.finalY + 12; }
  if (hasAssisters) { doc.setFont("helvetica","bold"); doc.text("ASSIST", margin, y); y+=6; const body = Object.entries(statsObj.assisters).sort((a,b)=>b[1]-a[1]).map(([num,count])=>{ const p=PLAYERS.find(pp=>pp.num===parseInt(num,10)); return [`${num} ${p?.name||'Sconosciuto'}`, count]; }); autoTable(doc,{ startY:y, head:[["Giocatore","Assist"]], body, theme:"grid", styles:{ fontSize:9, cellPadding:3 }, headStyles:{ fillColor:[54,96,146], textColor:255 }, margin:{ left:margin, right:margin } }); y = doc.lastAutoTable.finalY + 12; }
  if (hasOther) { doc.setFont("helvetica","bold"); doc.text("ALTRI EVENTI", margin, y); y+=14; doc.setFont("helvetica","normal"); if (statsObj.ownGoalsCount>0) { doc.text(`Autogol: ${statsObj.ownGoalsCount}`, margin, y); y+=14; } if (statsObj.penaltiesScored>0) { doc.text(`Rigori segnati: ${statsObj.penaltiesScored}`, margin, y); y+=14; } if (statsObj.penaltiesMissed>0) { doc.text(`Rigori sbagliati: ${statsObj.penaltiesMissed}`, margin, y); y+=14; } }

  doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.text("Nota: i PUNTI considerano solo i tempi giocati (Prova Tecnica esclusa).", margin, y+10);

  const fileName = `Vigontina_vs_${(opponentName||"").replace(/\s+/g,"_")}_${fmtDateIT(match.date)}.pdf`;
  doc.save(fileName);
};

// IMPLEMENTAZIONI AGGIUNTE
export const exportMatchToExcel = async (match) => {
  if (!match) return;
  return exportMatchHistoryToExcel([match]);
};

export const exportHistoryToExcel = async (matches) => {
  if (!Array.isArray(matches) || matches.length === 0) return;
  return exportMatchHistoryToExcel(matches);
};
