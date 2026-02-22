// v62 — IDG/ADG Platform (stable charts + PDF embed)
// - Radar + Trend + Ist->Soll are rendered as canvases with fixed heights (CSS)
// - Each chart stores a PNG dataURL for PDF export
// - Buy buttons text standardized to "Token kaufen (...)"

const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

// ======= CHECKOUT LINKS (your Lemon Squeezy links) =======
const CHECKOUT = {
  idg_private:  "https://mdg-indikation.lemonsqueezy.com/checkout/buy/c501c852-fa81-4410-99c9-aa3080667d5e",
  idg_business: "https://mdg-indikation.lemonsqueezy.com/checkout/buy/dc64687b-2237-44de-8d71-38eb547b0f41",
  adg_private:  "https://mdg-indikation.lemonsqueezy.com/checkout/buy/ecedd96b-a2a7-4370-badc-d2ba08976a05",
  adg_business: "https://mdg-indikation.lemonsqueezy.com/checkout/buy/fc7aaf51-ea60-4747-a315-fb12c5a48de2",
};

// ======= TOKEN PREFIXES (hard separation) =======
const TOKEN_PREFIX = {
  idg_private:  "IDGP-",
  idg_business: "IDGB-",
  adg_private:  "ADGP-",
  adg_business: "ADGB-",
};

// ======= Scan model =======
const VARS = [
  "Freiheit",
  "Gerechtigkeit",
  "Wahrheit",
  "Harmonie",
  "Effizienz",
  "Handlungsspielraum",
  "Mittel",
  "Balance",
];

const QUESTIONS = [
  { v:"Freiheit", q:"Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
  { v:"Freiheit", q:"Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
  { v:"Freiheit", q:"Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },

  { v:"Gerechtigkeit", q:"Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
  { v:"Gerechtigkeit", q:"Gibt es Regeln, die für manche gelten und für andere nicht?" },
  { v:"Gerechtigkeit", q:"Fühlst du dich in Entscheidungen, die dich betreffen, ausreichend berücksichtigt?" },

  { v:"Wahrheit", q:"Werden Probleme offen benannt, auch wenn es unangenehm ist?" },
  { v:"Wahrheit", q:"Kannst du Kritik ansprechen, ohne dass sofort Abwehr oder Schuldzuweisung entsteht?" },
  { v:"Wahrheit", q:"Gibt es Themen, die „nicht gesagt werden dürfen“, obwohl alle sie spüren?" },

  { v:"Harmonie", q:"Gibt es in deinem Alltag Phasen von Ruhe, in denen du innerlich „runterkommst“?" },
  { v:"Harmonie", q:"Werden Konflikte so gelöst, dass danach wieder Nähe/Respekt möglich ist?" },
  { v:"Harmonie", q:"Fühlst du dich mit anderen grundsätzlich verbunden statt dauerhaft im Wettkampf?" },

  { v:"Effizienz", q:"Führt dein Aufwand meistens zu klaren Ergebnissen?" },
  { v:"Effizienz", q:"Gibt es unnötige Schleifen, Wiederholungen oder chaotische Zuständigkeiten?" },
  { v:"Effizienz", q:"Kannst du dich gut fokussieren, ohne ständig von „Feuerwehr-Themen“ abgelenkt zu werden?" },

  { v:"Handlungsspielraum", q:"Hast du realistische Optionen, Dinge zu verändern, wenn etwas nicht passt?" },
  { v:"Handlungsspielraum", q:"Kannst du „Nein“ sagen, ohne echte Nachteile befürchten zu müssen?" },
  { v:"Handlungsspielraum", q:"Gibt es Ressourcen/Unterstützung, die du aktiv nutzen kannst?" },

  { v:"Mittel", q:"Reichen deine verfügbaren Mittel (Zeit, Geld, Energie) für das, was erwartet wird?" },
  { v:"Mittel", q:"Gibt es Engpässe, die regelmäßig Stress oder Konflikte auslösen?" },
  { v:"Mittel", q:"Sind Mittel so verteilt, dass das System nicht „ausblutet“ (z.B. dauerhaftes Überziehen)?" },

  { v:"Balance", q:"Ist die Balance zwischen Geben und Nehmen in deinem Umfeld stimmig?" },
  { v:"Balance", q:"Gibt es Extrem-Ausschläge (zu viel Kontrolle / zu viel Chaos)?" },
  { v:"Balance", q:"Fühlst du dich insgesamt „im Gleichgewicht“, auch wenn nicht alles perfekt ist?" }
];

const SCALE = [
  { label:"unklar / schwach", value:0.2 },
  { label:"teils / gemischt", value:0.5 },
  { label:"klar / stark", value:0.8 },
];

const el = (id) => document.getElementById(id);

// ======= State =======
const LS_MODE = "mdg_mode";      // private|business
const LS_LAYER = "mdg_layer";    // idg|adg

const LS_TOKEN = {
  idg_private:  "tok_idg_private",
  idg_business: "tok_idg_business",
  adg_private:  "tok_adg_private",
  adg_business: "tok_adg_business",
};

let CURRENT_MODE = "private";
let CURRENT_LAYER = "idg";

let LAST_SCORES = null;
let LAST_PATTERN = null;
let LAST_WEAK = null;

// PNG snapshots for PDF
let LAST_RADAR_DATAURL = null;
let LAST_TREND_DATAURL = null;
let LAST_ISTSOLL_DATAURL = null;

// ======= Error UI =======
function showErrorBox(msg) {
  const box = el("errorBox");
  if (!box) return;
  box.classList.remove("hidden");
  box.textContent = msg || "Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden.";
}
function hideErrorBox() {
  const box = el("errorBox");
  if (!box) return;
  box.classList.add("hidden");
}
window.addEventListener("error", (e) => {
  try {
    const file = (e && e.filename) ? String(e.filename) : "";
    if (file.includes("script.js")) showErrorBox("Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).");
  } catch {}
});
window.addEventListener("unhandledrejection", () => {
  showErrorBox("Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).");
});

// ======= Questions UI =======
function buildQuestions() {
  const host = el("questions");
  if (!host) return;
  host.innerHTML = "";

  QUESTIONS.forEach((item, idx) => {
    const qWrap = document.createElement("div");
    qWrap.className = "q";

    const top = document.createElement("div");
    top.className = "qTop";

    const left = document.createElement("div");
    left.className = "qIdx";
    left.textContent = `${idx+1}/${QUESTIONS.length}`;

    const right = document.createElement("div");
    right.className = "qVar";
    right.textContent = item.v;

    top.appendChild(left);
    top.appendChild(right);

    const p = document.createElement("p");
    p.className = "qText";
    p.textContent = item.q;

    const opts = document.createElement("div");
    opts.className = "opts";

    SCALE.forEach((o) => {
      const label = document.createElement("label");
      label.className = "opt";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q_${idx}`;
      input.value = String(o.value);
      input.setAttribute("data-var", item.v);

      const span = document.createElement("span");
      span.textContent = o.label;

      label.appendChild(input);
      label.appendChild(span);
      opts.appendChild(label);
    });

    qWrap.appendChild(top);
    qWrap.appendChild(p);
    qWrap.appendChild(opts);
    host.appendChild(qWrap);
  });
}

// ======= Score helpers =======
function collectAnswersByVar() {
  const byVar = {};
  VARS.forEach(v => byVar[v] = []);

  const missing = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const chosen = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!chosen) { missing.push(i + 1); continue; }
    const v = chosen.getAttribute("data-var");
    byVar[v].push(Number(chosen.value));
  }
  return { ok: missing.length === 0, byVar, missing };
}
function avg(arr) { return (!arr || !arr.length) ? 0 : arr.reduce((a,b)=>a+b,0) / arr.length; }
function scoreAll(byVar) {
  const scores = {};
  VARS.forEach(v => scores[v] = avg(byVar[v]));
  return scores;
}
function weakestVar(scores) {
  let w = null;
  for (const v of VARS) {
    const val = scores[v];
    if (w === null || val < w.val) w = { key: v, val };
  }
  return w;
}
function weakestVars(scores, n = 2) {
  return Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0,n).map(([k])=>k);
}
function timeWindowFor(value) {
  if (value <= 0.3) return "jetzt (akut) · 24–72h Fokus";
  if (value <= 0.55) return "bald · 1–2 Wochen Fokus";
  return "stabil · nur Feintuning nötig";
}
function clamp01(x){ return Math.max(0, Math.min(1, Number(x)||0)); }

function calcPattern(scores){
  const vals = Object.values(scores);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const spread = Number((max - min).toFixed(2));
  const sorted = Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  const low_cluster = sorted.filter(([,v])=>v <= 0.4).map(([k])=>k);
  const high_cluster = sorted.filter(([,v])=>v >= 0.7).map(([k])=>k);
  return { low_cluster, high_cluster, spread, min:Number(min.toFixed(2)), max:Number(max.toFixed(2)) };
}

// ======= Render right panel =======
function renderBars(scores) {
  const host = el("bars");
  if (!host) return;
  host.innerHTML = "";
  for (const v of VARS) {
    const val = scores[v];
    const row = document.createElement("div");
    row.className = "barRow";

    const name = document.createElement("div");
    name.className = "barName";
    name.textContent = v;

    const track = document.createElement("div");
    track.className = "barTrack";

    const fill = document.createElement("div");
    fill.className = "barFill";
    fill.style.width = `${Math.round(val * 100)}%`;
    track.appendChild(fill);

    const num = document.createElement("div");
    num.className = "barVal";
    num.textContent = val.toFixed(2);

    row.appendChild(name); row.appendChild(track); row.appendChild(num);
    host.appendChild(row);
  }
}
function renderWeakest(weak) {
  const host = el("weakest");
  if (!host) return;
  host.innerHTML = `<span class="badge">${weak.key}</span> <span class="muted">Score:</span> <strong>${weak.val.toFixed(2)}</strong>`;
}
function renderTimewin(weak) {
  const host = el("timewin");
  if (!host) return;
  host.innerHTML = `<span class="badge">${timeWindowFor(weak.val)}</span>`;
}
function renderMini(scores, maxN = 3) {
  const host = el("deepMini");
  if (!host) return;
  host.innerHTML = "";
  Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0,maxN).forEach(([v,val])=>{
    const div = document.createElement("div");
    div.className = "ddItem";
    div.innerHTML = `<span class="badge">${v}</span> <span class="muted">Score:</span> <strong>${val.toFixed(2)}</strong>`;
    host.appendChild(div);
  });
}

// ======= Drawing helpers =======
function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}
function textBadge(ctx, x, y, text, opt = {}){
  const padX = opt.padX ?? 10;
  const padY = opt.padY ?? 7;
  const r = opt.r ?? 10;
  const bg = opt.bg ?? "rgba(15,21,34,0.86)";
  const stroke = opt.stroke ?? "rgba(255,255,255,0.18)";
  const color = opt.color ?? "rgba(255,255,255,0.92)";
  const font = opt.font ?? "700 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

  ctx.save();
  ctx.font = font;
  const tw = ctx.measureText(text).width;
  const w = tw + padX*2;
  const h = 26 + padY - 7;
  const bx = Math.round(x);
  const by = Math.round(y);

  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 12;

  ctx.fillStyle = bg;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  roundRect(ctx, bx, by, w, h, r);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + padX, by + h/2);
  ctx.restore();

  return { w, h };
}

function getCanvasIn(host){
  host.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  host.appendChild(canvas);
  return canvas;
}

function snapshotCanvas(canvas){
  try { return canvas.toDataURL("image/png"); } catch { return null; }
}

// ======= Radar =======
let _radarResizeObserver = null;
function renderRadar(scores, weak) {
  const host = el("plot3d");
  if (!host) return;

  const canvas = getCanvasIn(host);

  const draw = () => {
    const rect = host.getBoundingClientRect();
    const cssW = Math.max(260, Math.floor(rect.width));
    const cssH = Math.max(260, Math.floor(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0,0,cssW,cssH);

    const cx = cssW * 0.50;
    const cy = cssH * 0.52;
    const R  = Math.min(cssW, cssH) * 0.34;
    const labelR = R * 1.18;
    const levels = 5;
    const angleFor = (i) => (-Math.PI/2) + (Math.PI * 2 * i / VARS.length);

    const gridStroke = "rgba(255,255,255,0.18)";
    const gridStroke2 = "rgba(255,255,255,0.10)";
    const axisStroke = "rgba(255,255,255,0.10)";
    const polyStroke = "rgba(158,240,216,0.85)";
    const polyFill   = "rgba(158,240,216,0.16)";
    const dotFill    = "rgba(255,255,255,0.78)";
    const dotStroke  = "rgba(0,0,0,0.35)";
    const arrowStroke= "rgba(246,204,114,0.95)";
    const arrowGlow  = "rgba(246,204,114,0.22)";

    const g = ctx.createRadialGradient(cx, cy, R*0.2, cx, cy, R*1.45);
    g.addColorStop(0, "rgba(158,240,216,0.09)");
    g.addColorStop(0.6, "rgba(0,0,0,0.00)");
    g.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,cssW,cssH);

    for (let lv=1; lv<=levels; lv++){
      const rr = (R * lv/levels);
      ctx.beginPath();
      for (let i=0;i<VARS.length;i++){
        const a = angleFor(i);
        const x = cx + Math.cos(a)*rr;
        const y = cy + Math.sin(a)*rr;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = (lv === levels) ? gridStroke : gridStroke2;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i=0;i<VARS.length;i++){
      const a = angleFor(i);
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
      ctx.strokeStyle = axisStroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const pts = VARS.map((v,i)=>{
      const val = scores[v] || 0;
      const a = angleFor(i);
      const rr = R * (0.18 + 0.82*val);
      return { v, val, a, x: cx + Math.cos(a)*rr, y: cy + Math.sin(a)*rr };
    });

    ctx.beginPath();
    pts.forEach((p, i) => (i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y)));
    ctx.closePath();
    ctx.fillStyle = polyFill;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => (i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y)));
    ctx.closePath();
    ctx.strokeStyle = polyStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    pts.forEach((p)=>{
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.6, 0, Math.PI*2);
      ctx.fillStyle = dotFill;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = dotStroke;
      ctx.stroke();
    });

    ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    pts.forEach((p)=>{
      const lx = cx + Math.cos(p.a)*labelR;
      const ly = cy + Math.sin(p.a)*labelR;
      const c = Math.cos(p.a);
      ctx.textAlign = (c > 0.25) ? "left" : (c < -0.25 ? "right" : "center");
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;
      ctx.fillText(p.v, lx, ly);
      ctx.restore();
    });

    const wIdx = VARS.indexOf(weak.key);
    if (wIdx >= 0){
      const a = angleFor(wIdx);
      const endR = R * 1.12;
      const tipX = cx + Math.cos(a) * endR;
      const tipY = cy + Math.sin(a) * endR;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = arrowGlow;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = arrowStroke;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      const head = 10;
      const leftA = a + Math.PI*0.86;
      const rightA= a - Math.PI*0.86;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(leftA)*head,  tipY + Math.sin(leftA)*head);
      ctx.lineTo(tipX + Math.cos(rightA)*head, tipY + Math.sin(rightA)*head);
      ctx.closePath();
      ctx.fillStyle = arrowStroke;
      ctx.fill();

      // label in top-right area, but clamped
      const label = `Schwach: ${weak.key} · ${weak.val.toFixed(2)}`;
      ctx.font = "700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const m = 10;
      const tw = ctx.measureText(label).width;
      const bw = tw + m*2;
      const bh = 30;

      let bx = tipX + 18;
      let by = tipY - 18 - bh;
      bx = Math.max(10, Math.min(cssW - bw - 10, bx));
      by = Math.max(10, Math.min(cssH - bh - 10, by));

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(15,21,34,0.86)";
      ctx.strokeStyle = "rgba(246,204,114,0.65)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + m, by + bh/2);
    }

    LAST_RADAR_DATAURL = snapshotCanvas(canvas);
  };

  draw();
  if (_radarResizeObserver) _radarResizeObserver.disconnect();
  _radarResizeObserver = new ResizeObserver(() => draw());
  _radarResizeObserver.observe(host);
}

// ======= Indices for XY charts =======
function stabilityIndex(scores){
  // “Stability” tends to be fairness/truth/balance/harmony (governance + tension)
  const s = avg([scores.Gerechtigkeit, scores.Wahrheit, scores.Balance, scores.Harmonie].map(clamp01));
  return clamp01(s);
}
function performanceIndex(scores){
  // “Performance” tends to be efficiency/agency/resources (execution capacity)
  const p = avg([scores.Effizienz, scores.Handlungsspielraum, scores.Mittel, scores.Freiheit].map(clamp01));
  return clamp01(p);
}

// ======= Generic XY grid chart =======
let _trendResizeObserver = null;
let _istsollResizeObserver = null;

function renderXYGrid(hostId, build, onSnapshot){
  const host = el(hostId);
  if (!host) return;

  const canvas = getCanvasIn(host);

  const draw = () => {
    const rect = host.getBoundingClientRect();
    const cssW = Math.max(260, Math.floor(rect.width));
    const cssH = Math.max(220, Math.floor(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0,0,cssW,cssH);

    // chart area
    const padL = 44, padR = 14, padT = 18, padB = 30;
    const x0 = padL, y0 = padT;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;

    // background glow
    const g = ctx.createRadialGradient(cssW*0.6, cssH*0.25, 10, cssW*0.6, cssH*0.25, cssW*0.9);
    g.addColorStop(0, "rgba(158,240,216,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,cssW,cssH);

    // grid
    const grid = "rgba(255,255,255,0.12)";
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;

    const steps = 5;
    for (let i=0;i<=steps;i++){
      const xx = x0 + (w * i/steps);
      ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0+h); ctx.stroke();
      const yy = y0 + (h * i/steps);
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0+w, yy); ctx.stroke();
    }

    const toX = (x) => x0 + clamp01(x)*w;
    const toY = (y) => y0 + (1-clamp01(y))*h;

    // axes labels
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("Stability (0→1)", x0, y0+h+10);
    ctx.translate(12, y0+h);
    ctx.rotate(-Math.PI/2);
    ctx.fillText("Performance (0→1)", 0, 0);
    ctx.restore();

    build({ ctx, cssW, cssH, x0, y0, w, h, toX, toY });

    onSnapshot(canvas);
  };

  draw();
  return { canvas, draw };
}

// ======= Trend chart =======
function renderTrend(scores){
  const base = { x: stabilityIndex(scores), y: performanceIndex(scores) };

  // deterministic projections (no fluff, but visually clear)
  const weak2 = weakestVars(scores, 2);
  const weakness = clamp01(1 - avg(weak2.map(k => scores[k] ?? 0)));

  // best-case: stability + performance rise
  const best30 = { x: clamp01(base.x + 0.10 + 0.10*weakness), y: clamp01(base.y + 0.08 + 0.10*weakness) };
  const best90 = { x: clamp01(best30.x + 0.07), y: clamp01(best30.y + 0.09) };

  // failure-case: stability erodes and/or performance stalls
  const fail30 = { x: clamp01(base.x - (0.05 + 0.07*weakness)), y: clamp01(base.y - (0.03 + 0.05*weakness)) };
  const fail90 = { x: clamp01(fail30.x - 0.05), y: clamp01(fail30.y - 0.05) };

  const base30 = { x: clamp01(base.x + 0.04), y: clamp01(base.y + 0.03) };
  const base90 = { x: clamp01(base30.x + 0.04), y: clamp01(base30.y + 0.04) };

  const points = {
    Base:   [ {t:"D0",...base}, {t:"D30",...base30}, {t:"D90",...base90} ],
    Best:   [ {t:"D0",...base}, {t:"D30",...best30}, {t:"D90",...best90} ],
    Failure:[ {t:"D0",...base}, {t:"D30",...fail30}, {t:"D90",...fail90} ],
  };

  const { draw } = renderXYGrid("trendPlot", ({ ctx, toX, toY }) => {
    const colors = {
      Base: "rgba(255,255,255,0.70)",
      Best: "rgba(158,240,216,0.90)",
      Failure: "rgba(246,204,114,0.95)",
    };

    // legend
    ctx.save();
    ctx.font = "700 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    const lx = 16, ly = 8;
    const items = ["Base","Best","Failure"];
    items.forEach((k, i)=>{
      ctx.fillStyle = colors[k];
      ctx.fillText(k, lx, ly + i*16);
    });
    ctx.restore();

    // series
    for (const name of Object.keys(points)){
      const arr = points[name];
      const col = colors[name];

      // line
      ctx.beginPath();
      arr.forEach((p, i)=>{
        const x = toX(p.x), y = toY(p.y);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();

      // points + labels
      arr.forEach((p)=>{
        const x = toX(p.x), y = toY(p.y);

        ctx.beginPath();
        ctx.arc(x,y,4.2,0,Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();

        // D0/D30/D90 label (small) with anti-overlap shift by series
        const shift = (name === "Base") ? {dx: 8, dy: -18} : (name === "Best" ? {dx: 8, dy: -2} : {dx: -34, dy: 4});
        textBadge(ctx, x + shift.dx, y + shift.dy, p.t, {
          padX: 8, padY: 6, r: 10,
          bg: "rgba(15,21,34,0.78)",
          stroke: "rgba(255,255,255,0.14)",
          font: "800 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        });
      });
    }
  }, (canvas)=>{
    LAST_TREND_DATAURL = snapshotCanvas(canvas);
  });

  // optional: keep function handle if later needed
  return { draw, points };
}

// ======= Ist->Soll chart =======
function renderIstSoll(scores){
  const ist = { x: stabilityIndex(scores), y: performanceIndex(scores) };

  // three intervention strengths as vectors
  const low  = { x: clamp01(ist.x + 0.06), y: clamp01(ist.y + 0.04) };
  const med  = { x: clamp01(ist.x + 0.12), y: clamp01(ist.y + 0.08) };
  const high = { x: clamp01(ist.x + 0.18), y: clamp01(ist.y + 0.14) };

  const pts = [
    { name:"IST",  p: ist,  key:"ist"  },
    { name:"LOW",  p: low,  key:"low"  },
    { name:"MED",  p: med,  key:"med"  },
    { name:"HIGH", p: high, key:"high" },
  ];

  // label placement with simple collision-avoidance
  function placeLabels(points, toX, toY){
    const placed = [];
    return points.map((d)=>{
      const x = toX(d.p.x), y = toY(d.p.y);

      // default offsets
      let dx = 10, dy = -18;
      if (d.key === "ist"){ dx = -28; dy = 10; }
      if (d.key === "high"){ dx = 10; dy = -28; }

      // nudge until not overlapping already-placed
      let bx = x + dx, by = y + dy;
      const box = (w,h)=>({x:bx,y:by,w,h});

      for (let tries=0; tries<10; tries++){
        let collide = false;
        for (const b of placed){
          const w = 140, h = 24;
          const r = box(w,h);
          const inter = !(r.x+r.w < b.x || r.x > b.x+b.w || r.y+r.h < b.y || r.y > b.y+b.h);
          if (inter){ collide = true; break; }
        }
        if (!collide) break;
        by += 18; // stack down
        bx += (tries%2===0) ? 10 : -10;
      }
      // store an approximate box (good enough)
      placed.push({x:bx,y:by,w:140,h:24});
      return { x, y, bx, by };
    });
  }

  const { draw } = renderXYGrid("istSollPlot", ({ ctx, toX, toY }) => {
    const colVec = "rgba(158,240,216,0.90)";
    const colGlow= "rgba(158,240,216,0.18)";
    const colIst = "rgba(246,204,114,0.95)";

    // draw vectors IST->LOW->MED->HIGH
    const path = [ist, low, med, high].map(p => ({x:toX(p.x), y:toY(p.y)}));

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i=1;i<path.length;i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = colGlow;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i=1;i<path.length;i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = colVec;
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.stroke();

    // arrow head for HIGH
    const a = Math.atan2(path[3].y - path[2].y, path[3].x - path[2].x);
    const head = 10;
    ctx.beginPath();
    ctx.moveTo(path[3].x, path[3].y);
    ctx.lineTo(path[3].x + Math.cos(a + Math.PI*0.85)*head, path[3].y + Math.sin(a + Math.PI*0.85)*head);
    ctx.lineTo(path[3].x + Math.cos(a - Math.PI*0.85)*head, path[3].y + Math.sin(a - Math.PI*0.85)*head);
    ctx.closePath();
    ctx.fillStyle = colVec;
    ctx.fill();

    // points
    pts.forEach((d)=>{
      const x = toX(d.p.x), y = toY(d.p.y);
      ctx.beginPath();
      ctx.arc(x,y,4.6,0,Math.PI*2);
      ctx.fillStyle = (d.key==="ist") ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.82)";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.stroke();

      // mark IST with a warm ring
      if (d.key==="ist"){
        ctx.beginPath();
        ctx.arc(x,y,7.6,0,Math.PI*2);
        ctx.strokeStyle = colIst;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    });

    // labels with anti-overlap placement
    const placed = placeLabels(pts, toX, toY);
    placed.forEach((pos, i)=>{
      const d = pts[i];
      const label = `${d.name} (${d.p.x.toFixed(2)}, ${d.p.y.toFixed(2)})`;
      const bg = (d.key==="ist") ? "rgba(246,204,114,0.18)" : "rgba(15,21,34,0.82)";
      const stroke = (d.key==="ist") ? "rgba(246,204,114,0.70)" : "rgba(255,255,255,0.14)";
      textBadge(ctx, pos.bx, pos.by, label, {
        bg,
        stroke,
        padX: 10,
        font: "800 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      });

      // small connector line
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.bx + 10, pos.by + 12);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, (canvas)=>{
    LAST_ISTSOLL_DATAURL = snapshotCanvas(canvas);
  });

  return { draw, ist, low, med, high };
}

// ======= Cards render =======
function escapeHTML(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function buildCardsHTML(cards){
  const html = [`<div class="ddCards">`];
  for (const c of cards){
    const title = escapeHTML(c.title || "Abschnitt");
    const pill = escapeHTML(c.pill || "");
    const body = c.body ? `<div class="ddText">${escapeHTML(c.body)}</div>` : "";
    const bullets = Array.isArray(c.bullets) && c.bullets.length
      ? `<ul class="ddList">${c.bullets.map(b=>`
          <li><span class="ddBullet"></span><div>${escapeHTML(b)}</div></li>
        `).join("")}</ul>`
      : "";
    const timeline = Array.isArray(c.timeline) && c.timeline.length
      ? `<div class="ddTimeline">${
          c.timeline.map(step => `
            <div class="ddTime">${escapeHTML(step.t)}</div>
            <div class="ddStep">${escapeHTML(step.txt)}</div>
          `).join("")
        }</div>`
      : "";
    html.push(`
      <div class="ddCard">
        <div class="ddTitle">
          <h4>${title}</h4>
          ${pill ? `<span class="ddPill">${pill}</span>` : ``}
        </div>
        ${body}
        ${bullets}
        ${timeline}
        ${c.small ? `<div class="ddSmall">${escapeHTML(c.small)}</div>` : ``}
      </div>
    `);
  }
  html.push(`</div>`);
  return html.join("");
}

// ======= Product selection =======
function productKey(){
  if (CURRENT_LAYER === "idg" && CURRENT_MODE === "private") return "idg_private";
  if (CURRENT_LAYER === "idg" && CURRENT_MODE === "business") return "idg_business";
  if (CURRENT_LAYER === "adg" && CURRENT_MODE === "private") return "adg_private";
  return "adg_business";
}
function requiredPrefix(){
  return TOKEN_PREFIX[productKey()] || "TOKEN-";
}
function getToken(){
  const key = productKey();
  const input = el("tokenInput");
  const fromInput = (input?.value || "").trim();
  const stored = localStorage.getItem(LS_TOKEN[key]) || "";
  return (fromInput || stored).trim();
}
function setTokenToStorage(raw){
  const key = productKey();
  const v = String(raw || "").trim();
  if (!v) return;
  localStorage.setItem(LS_TOKEN[key], v);
}
function tokenLooksValidForSelection(tok){
  const pfx = requiredPrefix();
  return tok && tok.toUpperCase().startsWith(pfx);
}

// ======= UI state =======
function setLayer(layer){
  CURRENT_LAYER = (layer === "adg") ? "adg" : "idg";
  localStorage.setItem(LS_LAYER, CURRENT_LAYER);

  const bIDG = el("layerIDG");
  const bADG = el("layerADG");
  const hint = el("layerHint");

  if (bIDG && bADG){
    bIDG.classList.toggle("active", CURRENT_LAYER === "idg");
    bADG.classList.toggle("active", CURRENT_LAYER === "adg");
    bIDG.setAttribute("aria-selected", String(CURRENT_LAYER === "idg"));
    bADG.setAttribute("aria-selected", String(CURRENT_LAYER === "adg"));
  }
  if (hint){
    hint.textContent = (CURRENT_LAYER === "adg")
      ? "ADG: Strukturumbau (Tragfähigkeit, Entscheidungen, Institutionalisierung)"
      : "IDG: Stabilisierung (Fokus, Hebel, Interventionen, Zeitfenster)";
  }

  hydrateTokenInput();
  updateTokenUI();
  updateRunButtonState();
  clearOutput();
}

function setMode(mode){
  CURRENT_MODE = (mode === "business") ? "business" : "private";
  localStorage.setItem(LS_MODE, CURRENT_MODE);

  const bPriv = el("modePrivate");
  const bBus  = el("modeBusiness");
  const hint  = el("modeHint");

  if (bPriv && bBus){
    bPriv.classList.toggle("active", CURRENT_MODE === "private");
    bBus.classList.toggle("active", CURRENT_MODE === "business");
    bPriv.setAttribute("aria-selected", String(CURRENT_MODE === "private"));
    bBus.setAttribute("aria-selected", String(CURRENT_MODE === "business"));
  }
  if (hint){
    hint.textContent = (CURRENT_MODE === "business")
      ? "Business: Organisation/Team · Boardfähiger Output"
      : "Privat: persönlich/Beziehung · klare Orientierung";
  }

  hydrateTokenInput();
  updateTokenUI();
  updateRunButtonState();
  clearOutput();
}

function hydrateTokenInput(){
  const input = el("tokenInput");
  if (!input) return;
  const key = productKey();
  const stored = localStorage.getItem(LS_TOKEN[key]) || "";
  input.value = stored;
  input.placeholder = `${requiredPrefix()}XXXX-XXXX-XXXX`;
}

function updateTokenUI(){
  const key = productKey();

  const tokenLabel = el("tokenLabel");
  const tokenSmall = el("tokenSmall");
  if (tokenLabel){
    const names = {
      idg_private:  "IDG Privat Token",
      idg_business: "IDG Business Token",
      adg_private:  "ADG Privat Token",
      adg_business: "ADG Business Token",
    };
    tokenLabel.textContent = names[key] || "Token";
  }
  if (tokenSmall){
    tokenSmall.textContent = `Erforderlich: Token mit Prefix ${requiredPrefix()}`;
  }

  const buyIDGP = el("buyIDGPrivate");
  const buyIDGB = el("buyIDGBusiness");
  const buyADGP = el("buyADGPrivate");
  const buyADGB = el("buyADGBusiness");

  if (buyIDGP) buyIDGP.href = CHECKOUT.idg_private;
  if (buyIDGB) buyIDGB.href = CHECKOUT.idg_business;
  if (buyADGP) buyADGP.href = CHECKOUT.adg_private;
  if (buyADGB) buyADGB.href = CHECKOUT.adg_business;

  // button text: Token kaufen
  if (buyIDGP) buyIDGP.textContent = "Token kaufen (19,99€)";
  if (buyIDGB) buyIDGB.textContent = "Token kaufen (299,99€)";
  if (buyADGP) buyADGP.textContent = "Token kaufen (49,99€)";
  if (buyADGB) buyADGB.textContent = "Token kaufen (1.199,99€)";

  const show = (node, on) => { if (node) node.style.display = on ? "inline-flex" : "none"; };
  show(buyIDGP, key === "idg_private");
  show(buyIDGB, key === "idg_business");
  show(buyADGP, key === "adg_private");
  show(buyADGB, key === "adg_business");
}

function updateRunButtonState(){
  const btn = el("runBtn");
  if (!btn) return;
  const tok = getToken();
  const ok = tokenLooksValidForSelection(tok);
  btn.disabled = !LAST_SCORES || !ok;
}

function clearOutput(){
  const out = el("deepOut");
  if (out){
    out.innerHTML = "";
    out.style.display = "none";
  }
  const pdfBtn = el("pdfBtn");
  if (pdfBtn) pdfBtn.disabled = true;
}

function applyToken(){
  const input = el("tokenInput");
  const raw = (input?.value || "").trim();
  if (!raw) { updateRunButtonState(); return; }
  setTokenToStorage(raw);
  updateRunButtonState();
}

// ======= Worker errors mapping =======
function mapWorkerError(err){
  const e = String(err || "");
  if (e.includes("TOKEN_REQUIRED")) return "Token erforderlich.";
  if (e.includes("TOKEN_INVALID")) return "Token ungültig.";
  if (e.includes("TOKEN_EXHAUSTED")) return "Token ist aufgebraucht.";
  if (e.includes("TOKEN_WRONG_TYPE")) return "Falscher Token-Typ für diese Ausgabe.";
  if (e.includes("RATE_LIMIT")) return "Limit erreicht. Bitte später erneut versuchen.";
  return e;
}

// ======= Deep output request =======
async function runProOutput(){
  hideErrorBox();

  const btn = el("runBtn");
  const out = el("deepOut");
  if (!btn || !out) return;

  if (!LAST_SCORES){
    showErrorBox("Bitte zuerst Quick Scan auswerten.");
    return;
  }

  const tok = getToken();
  if (!tokenLooksValidForSelection(tok)){
    showErrorBox(`Falscher Token: Erwartet Prefix ${requiredPrefix()}`);
    updateRunButtonState();
    return;
  }

  const key = productKey();
  const weakest = weakestVars(LAST_SCORES, 2);
  const pattern = LAST_PATTERN || calcPattern(LAST_SCORES);

  const payload = {
    layer: CURRENT_LAYER,
    mode: CURRENT_MODE,
    token: tok,
    language: "de",
    scores: LAST_SCORES,
    weakest,
    pattern,
    meta: { product: key, tone: (CURRENT_MODE === "business") ? "board" : "clear" }
  };

  try {
    btn.disabled = true;
    btn.textContent = "…generiere";

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(()=>({}));

    if (!resp.ok || !data.ok) {
      throw new Error(data?.error || `Worker HTTP ${resp.status}`);
    }

    out.style.display = "block";
    if (Array.isArray(data.cards) && data.cards.length){
      out.innerHTML = buildCardsHTML(data.cards);
    } else {
      const raw = String(data.text || data.output || data.result || "").trim();
      out.innerHTML = buildCardsHTML([{ title:"Ausgabe", pill:key.toUpperCase(), body: raw || "(leer)" }]);
    }

    // single-use: clear after success
    localStorage.removeItem(LS_TOKEN[key]);
    hydrateTokenInput();

    const pdfBtn = el("pdfBtn");
    if (pdfBtn) pdfBtn.disabled = false;

  } catch (e) {
    out.style.display = "block";
    out.innerHTML = buildCardsHTML([
      { title:"Fehler", pill:"Request", body: mapWorkerError(String(e.message || e)), small:"Bitte Token/Typ prüfen und erneut versuchen." }
    ]);
    const pdfBtn = el("pdfBtn");
    if (pdfBtn) pdfBtn.disabled = true;
  } finally {
    btn.textContent = "Pro-Ausgabe erzeugen";
    updateRunButtonState();
  }
}

// ======= PDF Export =======
function barsAsTableHTML(scores){
  const rows = VARS.map(v => {
    const val = Number(scores?.[v] ?? 0);
    return `<tr><td>${escapeHTML(v)}</td><td style="text-align:right">${val.toFixed(2)}</td></tr>`;
  }).join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:10px">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px 0">Variable</th>
          <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:8px 0">Score</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function exportPDF(){
  hideErrorBox();

  const out = el("deepOut");
  if (!out || out.style.display === "none"){
    showErrorBox("Bitte zuerst eine Pro-Ausgabe erzeugen.");
    return;
  }
  if (!LAST_SCORES || !LAST_WEAK){
    showErrorBox("Profil fehlt. Bitte Quick Scan auswerten.");
    return;
  }

  // Ensure latest snapshots exist
  if (!LAST_RADAR_DATAURL || !LAST_TREND_DATAURL || !LAST_ISTSOLL_DATAURL){
    showErrorBox("Diagramm-Snapshots fehlen. Bitte einmal kurz warten, dann erneut PDF exportieren (oder Seite hard refresh).");
    return;
  }

  const key = productKey();
  const title = `Indikation & Architektur des Gleichgewichts — ${key.replace("_"," ").toUpperCase()}`;
  const weakTxt = `${LAST_WEAK.key} (${LAST_WEAK.val.toFixed(2)})`;
  const timeTxt = timeWindowFor(LAST_WEAK.val);

  const radarImg = `<img src="${LAST_RADAR_DATAURL}" alt="Radar" style="width:100%;max-width:720px;border:1px solid #e5e7eb;border-radius:12px" />`;
  const trendImg = `<img src="${LAST_TREND_DATAURL}" alt="Trend" style="width:100%;max-width:720px;border:1px solid #e5e7eb;border-radius:12px" />`;
  const istSollImg = `<img src="${LAST_ISTSOLL_DATAURL}" alt="Ist-Soll" style="width:100%;max-width:720px;border:1px solid #e5e7eb;border-radius:12px" />`;

  const html = `
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(title)}</title>
<style>
  body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#0b0f17; margin:24px; }
  h1{ margin:0 0 6px; font-size:22px; }
  .muted{ color:#4b5563; font-size:12px; }
  .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:18px; align-items:start; margin-top:14px; }
  .card{ border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
  .pill{ display:inline-block; padding:6px 10px; border:1px solid #e5e7eb; border-radius:999px; background:#f8fafc; font-size:12px; }
  .secTitle{ font-size:12px; letter-spacing:.6px; text-transform:uppercase; color:#374151; margin:0 0 8px; }
  .divider{ height:1px; background:#e5e7eb; margin:14px 0; }
  table td{ padding:6px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
  .out{ margin-top:14px; }
  .ddCard{ break-inside: avoid; page-break-inside: avoid; border:1px solid #e5e7eb; border-radius:14px; padding:12px; margin:12px 0; }
  .ddTitle{ display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:8px; }
  .ddTitle h4{ margin:0; font-size:12px; letter-spacing:.6px; text-transform:uppercase; color:#111827; }
  .ddPill{ display:inline-block; padding:6px 10px; border:1px solid #e5e7eb; border-radius:999px; background:#f8fafc; font-size:12px; color:#111827; }
  .ddText{ font-size:13px; line-height:1.5; color:#111827; }
  .ddList{ list-style:none; padding:0; margin:10px 0 0; }
  .ddList li{ border:1px solid #eef2f7; border-radius:12px; padding:10px; margin:8px 0; font-size:13px; }
  .ddTimeline{ display:grid; grid-template-columns:110px 1fr; gap:10px; margin-top:10px; }
  .ddTime{ font-size:12px; letter-spacing:.6px; text-transform:uppercase; color:#374151; border:1px solid #e5e7eb; background:#f8fafc; border-radius:999px; padding:7px 10px; height:fit-content; width:fit-content; }
  .ddStep{ border:1px solid #eef2f7; border-radius:12px; padding:10px; font-size:13px; line-height:1.45; }
  @media print{
    body{ margin:0; }
  }
</style>
</head>
<body>
  <div class="muted">Export · ${new Date().toLocaleString("de-DE")} · ${escapeHTML(key.toUpperCase())}</div>
  <h1>${escapeHTML(title)}</h1>
  <div class="muted">Schwächste Variable: <span class="pill">${escapeHTML(weakTxt)}</span> · Zeitfenster: <span class="pill">${escapeHTML(timeTxt)}</span></div>

  <div class="grid">
    <div class="card">
      <div class="secTitle">Radar</div>
      ${radarImg}
    </div>
    <div class="card">
      <div class="secTitle">Scores</div>
      ${barsAsTableHTML(LAST_SCORES)}
    </div>
  </div>

  <div class="grid" style="margin-top:18px">
    <div class="card">
      <div class="secTitle">Trend · Base / Best / Failure (D0 → D30 → D90)</div>
      ${trendImg}
    </div>
    <div class="card">
      <div class="secTitle">Ist → Soll · Maßnahmen-Vektoren (LOW / MED / HIGH)</div>
      ${istSollImg}
    </div>
  </div>

  <div class="divider"></div>

  <div class="out">
    <div class="secTitle">Pro-Ausgabe</div>
    ${out.innerHTML}
  </div>

  <div class="divider"></div>
  <div class="muted">Hinweis: Strukturierte Orientierung und Entscheidungsunterstützung. Keine medizinische, therapeutische, rechtliche oder finanzielle Beratung.</div>
</body>
</html>
  `.trim();

  const w = window.open("", "_blank");
  if (!w){
    showErrorBox("Pop-up blockiert. Bitte Pop-ups erlauben oder erneut versuchen.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();

  w.focus();
  setTimeout(() => {
    try { w.print(); } catch {}
  }, 350);
}

// ======= Evaluate / Reset =======
function onEvaluate() {
  hideErrorBox();

  const collected = collectAnswersByVar();
  if (!collected.ok) {
    showErrorBox(`Bitte beantworte alle Fragen. Fehlend: ${collected.missing.slice(0,5).join(", ")}${collected.missing.length>5?"…":""}`);
    return;
  }

  const scores = scoreAll(collected.byVar);
  LAST_SCORES = scores;

  const weak = weakestVar(scores);
  LAST_WEAK = weak;

  const pattern = calcPattern(scores);
  LAST_PATTERN = pattern;

  el("results")?.classList.remove("hidden");

  // Radar
  renderRadar(scores, weak);

  // Bars + smalls
  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  renderMini(scores, 3);

  // Ensure plot containers exist (create if missing in HTML)
  // Trend + Ist/Soll are optional; if your index.html does not have them yet, we create below dynamically.
  ensureXYContainers();
  renderTrend(scores);
  renderIstSoll(scores);

  clearOutput();
  updateTokenUI();
  updateRunButtonState();
}

function onReset() {
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);

  el("results")?.classList.add("hidden");
  el("plot3d") && (el("plot3d").innerHTML = "");
  el("bars") && (el("bars").innerHTML = "");
  el("weakest") && (el("weakest").innerHTML = "");
  el("timewin") && (el("timewin").innerHTML = "");
  el("deepMini") && (el("deepMini").innerHTML = "");
  el("trendPlot") && (el("trendPlot").innerHTML = "");
  el("istSollPlot") && (el("istSollPlot").innerHTML = "");

  clearOutput();

  LAST_SCORES = null;
  LAST_PATTERN = null;
  LAST_WEAK = null;

  LAST_RADAR_DATAURL = null;
  LAST_TREND_DATAURL = null;
  LAST_ISTSOLL_DATAURL = null;

  updateRunButtonState();
}

// ======= Ensure XY containers exist in DOM =======
// If your index.html already contains these divs, nothing happens.
// If not, we inject them into the left-side panel grid.
function ensureXYContainers(){
  const trend = el("trendPlot");
  const ist = el("istSollPlot");
  if (trend && ist) return;

  // We insert into the RESULTS section after radar panel if possible.
  // Safe strategy: find plot3d container, then build a 2nd panel block if missing.
  const plot3d = el("plot3d");
  if (!plot3d) return;

  // If trend/ist already somewhere else, stop.
  if (el("trendPlot") || el("istSollPlot")) return;

  // Try to find the grid2 layout
  const results = el("results");
  if (!results) return;

  // Find the left panel container (parent of plot3d)
  const radarPanel = plot3d.closest(".panel");
  if (!radarPanel) return;

  // Create wrappers that match your existing UI style (panel boxes)
  // We reuse "panel" + "panelTitle" classes.
  const grid2 = results.querySelector(".grid2");
  if (!grid2) return;

  // Create a new panel to the right of radar? No: we keep existing layout.
  // We add two blocks below the Radar inside the same panel (clean, no index edits required).
  const wrap = document.createElement("div");
  wrap.style.marginTop = "14px";
  wrap.innerHTML = `
    <div class="divider"></div>
    <h3 class="panelTitle">Trend</h3>
    <div id="trendPlot" class="plotXY" aria-label="Trend Chart"></div>
    <div class="plotHint">Achsen: Stability (0→1) · Performance (0→1)</div>

    <div class="divider"></div>
    <h3 class="panelTitle">Ist → Soll</h3>
    <div id="istSollPlot" class="plotXY" aria-label="Ist-Soll Chart"></div>
    <div class="plotHint">Ist→Soll: Maßnahmen-Vektoren (LOW/MED/HIGH)</div>
  `;
  radarPanel.appendChild(wrap);
}

// ======= Boot =======
document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();

  const savedLayer = localStorage.getItem(LS_LAYER);
  const savedMode = localStorage.getItem(LS_MODE);

  setLayer(savedLayer === "adg" ? "adg" : "idg");                 // default IDG
  setMode(savedMode === "business" ? "business" : "private");     // default private

  updateTokenUI();
  hydrateTokenInput();
  updateRunButtonState();

  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);

  el("layerIDG")?.addEventListener("click", () => setLayer("idg"));
  el("layerADG")?.addEventListener("click", () => setLayer("adg"));

  el("modePrivate")?.addEventListener("click", () => setMode("private"));
  el("modeBusiness")?.addEventListener("click", () => setMode("business"));

  el("tokenApply")?.addEventListener("click", () => applyToken());
  el("tokenInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") applyToken(); });
  el("tokenInput")?.addEventListener("input", () => updateRunButtonState());

  el("runBtn")?.addEventListener("click", runProOutput);
  el("pdfBtn")?.addEventListener("click", exportPDF);
});
