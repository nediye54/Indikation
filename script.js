// v61 — IDG/ADG Platform (SVG charts + Board PDF ready)
// - Default: IDG + Private
// - Pro output via Worker (token required, prefix enforced client-side; server enforces too)
// - Charts: Radar Canvas (existing vibe) + Trend SVG + Ist→Soll SVG
// - PDF export: inline SVG (crisp)

const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

// ======= CHECKOUT LINKS =======
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

// for PDF export assets
let LAST_RADAR_DATAURL = null;
let LAST_TREND_SVG = null;
let LAST_ISTSOLL_SVG = null;

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
window.addEventListener("error", () => {
  showErrorBox("Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).");
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

// ======= Radar Canvas (same as before, moved to #plotRadar) =======
let _radarResizeObserver = null;
let _radarCanvasRef = null;

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

function renderRadar(scores, weak) {
  const host = el("plotRadar");
  if (!host) return;
  host.innerHTML = "";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  host.appendChild(canvas);
  _radarCanvasRef = canvas;

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

      const label = `Schwach: ${weak.key} · ${weak.val.toFixed(2)}`;
      ctx.font = "700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const m = 10;
      const tw = ctx.measureText(label).width;
      const bw = tw + m*2;
      const bh = 30;

      const gap = 30;
      const side = 20;

      let bx = tipX + (Math.cos(a) * gap) + (-Math.sin(a) * side);
      let by = tipY + (Math.sin(a) * gap) + ( Math.cos(a) * side);

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

    try {
      LAST_RADAR_DATAURL = canvas.toDataURL("image/png");
    } catch {
      LAST_RADAR_DATAURL = null;
    }
  };

  draw();
  if (_radarResizeObserver) _radarResizeObserver.disconnect();
  _radarResizeObserver = new ResizeObserver(() => draw());
  _radarResizeObserver.observe(host);
}

// ======= SVG helpers =======
function escapeHTML(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function clamp01(x){ return Math.max(0, Math.min(1, Number(x)||0)); }
function svgEl(tag, attrs={}, children=""){
  const a = Object.entries(attrs).map(([k,v]) => `${k}="${String(v)}"`).join(" ");
  return `<${tag}${a ? " "+a : ""}>${children}</${tag}>`;
}
function line(x1,y1,x2,y2,attrs={}){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(" ")} />`;
}
function circle(x,y,r,attrs={}){
  return `<circle cx="${x}" cy="${y}" r="${r}" ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(" ")} />`;
}
function text(x,y,txt,attrs={}){
  return `<text x="${x}" y="${y}" ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(" ")}>${escapeHTML(txt)}</text>`;
}

// ======= Trend SVG (Base/Best/Failure, D0->D30->D90) =======
function buildTrendSeries(scores){
  // Simple deterministic projection: stability = avg(low vars), performance = avg(high vars)
  // (Worker output can later supply real projections; this is a stable visual.)
  const vals = Object.values(scores).map(clamp01);
  const mean = vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);
  const spread = Math.max(...vals) - Math.min(...vals);

  const s0 = clamp01(mean - spread*0.10);
  const p0 = clamp01(mean - spread*0.05);

  const base = [
    {t:"D0",  s:s0,                 p:p0},
    {t:"D30", s:clamp01(s0+0.08),   p:clamp01(p0+0.06)},
    {t:"D90", s:clamp01(s0+0.14),   p:clamp01(p0+0.12)},
  ];
  const best = base.map((pt,i)=>({
    ...pt,
    s: clamp01(pt.s + (i===0?0:0.06)),
    p: clamp01(pt.p + (i===0?0:0.10)),
  }));
  const fail = base.map((pt,i)=>({
    ...pt,
    s: clamp01(pt.s - (i===0?0:0.08)),
    p: clamp01(pt.p - (i===0?0:0.10)),
  }));
  return { base, best, fail };
}

function renderTrendSVG(scores){
  const host = el("plotTrend");
  if (!host) return;
  const rect = host.getBoundingClientRect();
  const W = Math.max(520, Math.floor(rect.width));
  const H = Math.max(300, Math.floor(rect.height));

  const pad = {l:58, r:18, t:18, b:44};
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const x = (v)=> pad.l + iw*clamp01(v);              // Stability
  const y = (v)=> pad.t + ih*(1-clamp01(v));          // Performance

  const { base, best, fail } = buildTrendSeries(scores);

  const bg = svgEl("rect", {x:0,y:0,width:W,height:H, rx:16, fill:"rgba(255,255,255,0.02)", stroke:"rgba(255,255,255,0.08)"});
  const grid = [];
  for (let i=0;i<=5;i++){
    const gx = pad.l + iw*(i/5);
    const gy = pad.t + ih*(i/5);
    grid.push(line(gx, pad.t, gx, pad.t+ih, {stroke:"rgba(255,255,255,0.10)", "stroke-width":"1"}));
    grid.push(line(pad.l, gy, pad.l+iw, gy, {stroke:"rgba(255,255,255,0.10)", "stroke-width":"1"}));
  }
  const axisLabels = [
    text(pad.l, H-16, "Stability (0→1)", {fill:"rgba(255,255,255,0.70)", "font-size":"12", "font-weight":"600"}),
    text(12, pad.t+12, "Performance (0→1)", {fill:"rgba(255,255,255,0.70)", "font-size":"12", "font-weight":"600", transform:`rotate(-90 12 ${pad.t+12})`}),
  ];

  function pathFor(arr){
    return arr.map((pt,i)=> `${i===0?"M":"L"} ${x(pt.s).toFixed(1)} ${y(pt.p).toFixed(1)}`).join(" ");
  }
  function dotsFor(arr, label){
    return arr.map((pt)=> {
      const cx = x(pt.s), cy = y(pt.p);
      return circle(cx,cy,4.2,{fill:"rgba(255,255,255,0.90)", stroke:"rgba(0,0,0,0.40)", "stroke-width":"1"})
        + text(cx+8, cy-8, pt.t, {fill:"rgba(255,255,255,0.78)", "font-size":"12", "font-weight":"700"});
    }).join("");
  }

  const legend = `
    ${text(pad.l+6, pad.t+14, "Base",    {fill:"rgba(246,204,114,0.95)","font-size":"12","font-weight":"700"})}
    ${text(pad.l+6, pad.t+30, "Best",    {fill:"rgba(158,240,216,0.90)","font-size":"12","font-weight":"700"})}
    ${text(pad.l+6, pad.t+46, "Failure", {fill:"rgba(255,160,160,0.88)","font-size":"12","font-weight":"700"})}
  `;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
  ${bg}
  ${grid.join("")}
  ${axisLabels.join("")}
  ${legend}

  <path d="${pathFor(base)}" fill="none" stroke="rgba(246,204,114,0.95)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${pathFor(best)}" fill="none" stroke="rgba(158,240,216,0.85)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${pathFor(fail)}" fill="none" stroke="rgba(255,160,160,0.80)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

  ${dotsFor(base)}
</svg>`.trim();

  host.innerHTML = svg;
  LAST_TREND_SVG = svg;
}

// ======= IST→SOLL SVG (LOW/MED/HIGH) =======
function buildIstSoll(scores){
  const vals = Object.values(scores).map(clamp01);
  const mean = vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);
  const min = Math.min(...vals);
  const spread = Math.max(...vals) - min;

  // IST: stability ~ mean, performance ~ mean - weakness penalty
  const ist = { s: clamp01(mean), p: clamp01(mean - spread*0.18) };

  // Targets depend on weakest severity
  const low  = { s: clamp01(ist.s + 0.10), p: clamp01(ist.p + 0.08) };
  const med  = { s: clamp01(ist.s + 0.16), p: clamp01(ist.p + 0.14) };
  const high = { s: clamp01(ist.s + 0.22), p: clamp01(ist.p + 0.22) };

  return { ist, low, med, high };
}

function renderIstSollSVG(scores){
  const host = el("plotIstSoll");
  if (!host) return;

  const rect = host.getBoundingClientRect();
  const W = Math.max(520, Math.floor(rect.width));
  const H = Math.max(300, Math.floor(rect.height));

  const pad = {l:58, r:18, t:18, b:44};
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const x = (v)=> pad.l + iw*clamp01(v);     // Stability
  const y = (v)=> pad.t + ih*(1-clamp01(v)); // Performance

  const { ist, low, med, high } = buildIstSoll(scores);

  const bg = svgEl("rect", {x:0,y:0,width:W,height:H, rx:16, fill:"rgba(255,255,255,0.02)", stroke:"rgba(255,255,255,0.08)"});
  const grid = [];
  for (let i=0;i<=5;i++){
    const gx = pad.l + iw*(i/5);
    const gy = pad.t + ih*(i/5);
    grid.push(line(gx, pad.t, gx, pad.t+ih, {stroke:"rgba(255,255,255,0.10)", "stroke-width":"1"}));
    grid.push(line(pad.l, gy, pad.l+iw, gy, {stroke:"rgba(255,255,255,0.10)", "stroke-width":"1"}));
  }

  const axisLabels = [
    text(pad.l, H-16, "Stability (0→1)", {fill:"rgba(255,255,255,0.70)", "font-size":"12", "font-weight":"600"}),
    text(12, pad.t+12, "Performance (0→1)", {fill:"rgba(255,255,255,0.70)", "font-size":"12", "font-weight":"600", transform:`rotate(-90 12 ${pad.t+12})`}),
  ];

  function vec(to, stroke){
    return `
      <path d="M ${x(ist.s)} ${y(ist.p)} L ${x(to.s)} ${y(to.p)}"
        fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
      ${circle(x(to.s), y(to.p), 4.6, {fill:"rgba(255,255,255,0.92)", stroke:"rgba(0,0,0,0.40)", "stroke-width":"1"})}
    `;
  }

  // label placement: offset so it never sits on top of each other
  function labelAt(pt, name, dx, dy){
    return text(x(pt.s)+dx, y(pt.p)+dy, `${name} (${pt.s.toFixed(2)}, ${pt.p.toFixed(2)})`,
      {fill:"rgba(255,255,255,0.88)","font-size":"12","font-weight":"800"});
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
  ${bg}
  ${grid.join("")}
  ${axisLabels.join("")}

  ${circle(x(ist.s), y(ist.p), 5.2, {fill:"rgba(246,204,114,0.95)", stroke:"rgba(0,0,0,0.35)", "stroke-width":"1"})}
  ${text(x(ist.s)+10, y(ist.p)+14, `IST (${ist.s.toFixed(2)}, ${ist.p.toFixed(2)})`, {fill:"rgba(246,204,114,0.95)","font-size":"12","font-weight":"900"})}

  ${vec(low,  "rgba(158,240,216,0.60)")}
  ${vec(med,  "rgba(158,240,216,0.78)")}
  ${vec(high, "rgba(158,240,216,0.92)")}

  ${labelAt(low,  "LOW",  10,  12)}
  ${labelAt(med,  "MED",  10,  -8)}
  ${labelAt(high, "HIGH", 10,  12)}
</svg>`.trim();

  host.innerHTML = svg;
  LAST_ISTSOLL_SVG = svg;
}

// ======= Cards render =======
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
function requiredPrefix(){ return TOKEN_PREFIX[productKey()] || "TOKEN-"; }
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
  if (e.includes("TOKEN_EXHAUSTED")) return "Token ist aufgebraucht (1x nutzbar).";
  if (e.includes("TOKEN_WRONG_TYPE")) return "Falscher Token-Typ (Prefix passt nicht zum Produkt).";
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
      const raw = String(data.text || "").trim();
      out.innerHTML = buildCardsHTML([{ title:"Ausgabe", pill:key.toUpperCase(), body: raw || "(leer)" }]);
    }

    // single-use: remove stored token after success
    localStorage.removeItem(LS_TOKEN[key]);
    hydrateTokenInput();

    const pdfBtn = el("pdfBtn");
    if (pdfBtn) pdfBtn.disabled = false;

  } catch (e) {
    out.style.display = "block";
    out.innerHTML = buildCardsHTML([
      { title:"Fehler", pill:"Request", body: mapWorkerError(String(e.message || e)), small:"Token/Typ prüfen und erneut versuchen." }
    ]);
    const pdfBtn = el("pdfBtn");
    if (pdfBtn) pdfBtn.disabled = true;
  } finally {
    btn.textContent = "Pro-Ausgabe erzeugen";
    updateRunButtonState();
  }
}

// ======= PDF Export (inline SVG for crispness) =======
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

  const key = productKey();
  const title = `Indikation & Architektur des Gleichgewichts — ${key.replace("_"," ").toUpperCase()}`;
  const weakTxt = `${LAST_WEAK.key} (${LAST_WEAK.val.toFixed(2)})`;
  const timeTxt = timeWindowFor(LAST_WEAK.val);

  const radarImg = LAST_RADAR_DATAURL
    ? `<img src="${LAST_RADAR_DATAURL}" alt="Radar" style="width:100%;max-width:720px;border:1px solid #e5e7eb;border-radius:12px" />`
    : `<div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;color:#6b7280">Radar konnte nicht eingebettet werden.</div>`;

  const trendSvg = LAST_TREND_SVG
    ? `<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">${LAST_TREND_SVG}</div>`
    : `<div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;color:#6b7280">Trend fehlt.</div>`;

  const istSollSvg = LAST_ISTSOLL_SVG
    ? `<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">${LAST_ISTSOLL_SVG}</div>`
    : `<div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;color:#6b7280">Ist→Soll fehlt.</div>`;

  const rows = VARS.map(v => {
    const val = Number(LAST_SCORES?.[v] ?? 0);
    return `<tr><td>${escapeHTML(v)}</td><td style="text-align:right">${val.toFixed(2)}</td></tr>`;
  }).join("");

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
  .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; align-items:start; margin-top:14px; }
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
  svg{ width:100%; height:320px; display:block; }
  @media print{ body{ margin:0; } }
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
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px 0">Variable</th>
            <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:8px 0">Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  <div class="divider"></div>

  <div class="grid">
    <div class="card">
      <div class="secTitle">Trend</div>
      ${trendSvg}
    </div>
    <div class="card">
      <div class="secTitle">Ist → Soll</div>
      ${istSollSvg}
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
  setTimeout(() => { try { w.print(); } catch {} }, 350);
}

// ======= Evaluate / Reset =======
async function onEvaluate() {
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

  renderRadar(scores, weak);
  renderTrendSVG(scores);
  renderIstSollSVG(scores);

  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  renderMini(scores, 3);

  clearOutput();
  updateTokenUI();
  updateRunButtonState();
}

function onReset() {
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);

  el("results")?.classList.add("hidden");

  ["plotRadar","plotTrend","plotIstSoll","bars","weakest","timewin","deepMini"].forEach(id=>{
    const node = el(id);
    if (node) node.innerHTML = "";
  });

  clearOutput();

  LAST_SCORES = null;
  LAST_PATTERN = null;
  LAST_WEAK = null;
  LAST_RADAR_DATAURL = null;
  LAST_TREND_SVG = null;
  LAST_ISTSOLL_SVG = null;

  updateRunButtonState();
}

// ======= Boot =======
document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();

  const savedLayer = localStorage.getItem(LS_LAYER);
  const savedMode = localStorage.getItem(LS_MODE);

  setLayer(savedLayer === "adg" ? "adg" : "idg");
  setMode(savedMode === "business" ? "business" : "private");

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
