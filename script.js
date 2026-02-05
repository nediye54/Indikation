// v13 — Deutsch-only. Stabil. Radar polished.
// Deep Dive: Mode Switch (Privat/Business). Business erfordert Token.
// Worker liefert Text (oder später cards), Frontend rendert Premium Cards.

const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

// Variablen (Deutsch)
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

// Fragen (Deutsch)
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

// 3 Antwortstufen
const SCALE = [
  { label:"unklar / schwach", value:0.2 },
  { label:"teils / gemischt", value:0.5 },
  { label:"klar / stark", value:0.8 },
];

const el = (id) => document.getElementById(id);

// ===== Mode Switch State =====
const MODE_PRIVATE = "private";
const MODE_BUSINESS = "business";
let DEEPDIVE_MODE = MODE_PRIVATE;

// --- Error UI ---
function showErrorBox(msg) {
  const box = el("errorBox");
  if (!box) return;
  box.classList.remove("hidden");
  if (msg) box.textContent = msg;
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

// --- Build Questions UI ---
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

// --- Collect & score ---
function collectAnswersByVar() {
  const byVar = {};
  VARS.forEach(v => byVar[v] = []);

  const missing = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const chosen = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!chosen) {
      missing.push(i + 1);
      continue;
    }
    const v = chosen.getAttribute("data-var");
    byVar[v].push(Number(chosen.value));
  }

  return { ok: missing.length === 0, byVar, missing };
}

function avg(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

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

function timeWindowFor(value) {
  if (value <= 0.3) return "jetzt (akut) · 24–72h Fokus";
  if (value <= 0.55) return "bald · 1–2 Wochen Fokus";
  return "stabil · nur Feintuning nötig";
}

// --- Render: Bars / Weakest / Timewin ---
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

    row.appendChild(name);
    row.appendChild(track);
    row.appendChild(num);
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

function renderDeepDiveLocal(scores, maxN = 3) {
  const host = el("deepDive");
  if (!host) return;
  host.innerHTML = "";

  const list = Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0, maxN);
  list.forEach(([v,val]) => {
    const div = document.createElement("div");
    div.className = "ddItem";
    div.innerHTML = `<span class="badge">${v}</span> <span class="muted">Score:</span> <strong>${val.toFixed(2)}</strong>`;
    host.appendChild(div);
  });
}

// ========= Radar (Canvas) =========
let _radarResizeObserver = null;

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
  const host = el("plot3d");
  if (!host) return;

  host.innerHTML = "";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  host.appendChild(canvas);

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

    // Grid
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

    // Axes
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

    // Fill polygon
    ctx.beginPath();
    pts.forEach((p, i) => (i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y)));
    ctx.closePath();
    ctx.fillStyle = polyFill;
    ctx.fill();

    // Stroke polygon
    ctx.beginPath();
    pts.forEach((p, i) => (i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y)));
    ctx.closePath();
    ctx.strokeStyle = polyStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    pts.forEach((p)=>{
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.6, 0, Math.PI*2);
      ctx.fillStyle = dotFill;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = dotStroke;
      ctx.stroke();
    });

    // Labels
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

    // Arrow + label box (gap/side = feinjustierbar)
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

      // <-- HIER kannst du später selbst feinjustieren
      const gap = 34;   // Abstand vom Pfeil-Tip
      const side = 22;  // seitlicher Versatz

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
  };

  draw();

  if (_radarResizeObserver) _radarResizeObserver.disconnect();
  _radarResizeObserver = new ResizeObserver(() => draw());
  _radarResizeObserver.observe(host);
}

// --- Deep Dive Premium (Cards) ---
let LAST_SCORES = null;

function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a,b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k);
}

function escapeHTML(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripMd(s){
  return String(s ?? "")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "")
    .trim();
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

function buildFallbackCards(text, weakest){
  const focus = weakest?.length ? `Fokus: ${weakest.join(", ")}` : "Analyse";
  return [
    { title:"Executive Summary", pill:focus, body: stripMd(text).slice(0, 450) + (stripMd(text).length>450?" …":"") }
  ];
}

function renderDeepDivePremium(data, meta){
  const host = el("deepDiveOut");
  if (!host) return;

  host.style.display = "block";

  if (data && Array.isArray(data.cards) && data.cards.length){
    host.innerHTML = buildCardsHTML(data.cards);
    return;
  }

  const raw = (data && (data.text || data.output || data.result)) ? String(data.text || data.output || data.result) : "";
  const text = raw.trim();

  if (!text){
    host.innerHTML = buildCardsHTML([{ title:"Hinweis", pill:"keine Ausgabe", body:"Der Worker hat keine Textausgabe geliefert." }]);
    return;
  }

  // Wenn Worker (noch) Plaintext liefert → 1 Card reicht als safe default
  host.innerHTML = buildCardsHTML(buildFallbackCards(text, meta?.weakest || []));
}

// --- Mode Switch UI Logic ---
function setMode(mode){
  DEEPDIVE_MODE = mode;

  const btnPriv = el("modePrivate");
  const btnBiz  = el("modeBusiness");
  const tokenRow = el("tokenRow");

  if (btnPriv) btnPriv.dataset.active = String(mode === MODE_PRIVATE);
  if (btnBiz)  btnBiz.dataset.active  = String(mode === MODE_BUSINESS);

  if (tokenRow) tokenRow.style.display = (mode === MODE_BUSINESS) ? "flex" : "none";
}

// --- Deep Dive (Worker) ---
async function runDeepDive() {
  const deepDiveBtn = el("deepDiveBtn");
  const deepDiveOut = el("deepDiveOut");

  if (!deepDiveBtn || !deepDiveOut) return;

  if (!LAST_SCORES) {
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = "Bitte zuerst Quick Scan auswerten.";
    return;
  }

  const weakest = weakestVars(LAST_SCORES, 2);

  const token = (el("tokenInput")?.value || "").trim();

  // Business verlangt Token (damit das später sauber monetarisierbar ist)
  if (DEEPDIVE_MODE === MODE_BUSINESS && !token){
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = "Business Deep Dive benötigt einen Token.";
    return;
  }

  const payload = {
    language: "de",
    mode: DEEPDIVE_MODE,     // "private" | "business"
    token: token || null,    // nur relevant bei business
    scores: LAST_SCORES,
    weakest
  };

  try {
    deepDiveBtn.disabled = true;
    deepDiveBtn.textContent = "…denke nach";

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data.ok) {
      throw new Error(data?.error || `Worker HTTP ${resp.status}`);
    }

    renderDeepDivePremium(data, { weakest });

  } catch (e) {
    deepDiveOut.style.display = "block";
    deepDiveOut.innerHTML = buildCardsHTML([{
      title:"Fehler",
      pill:"Request",
      body: String(e.message || e)
    }]);
  } finally {
    deepDiveBtn.disabled = false;
    deepDiveBtn.textContent = "Stabilisierende Indikation erzeugen";
  }
}

// --- Main evaluate ---
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

  el("results")?.classList.remove("hidden");

  renderRadar(scores, weak);
  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  renderDeepDiveLocal(scores, 3);
}

function onReset() {
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);

  el("results")?.classList.add("hidden");

  if (el("plot3d")) el("plot3d").innerHTML = "";
  if (el("bars")) el("bars").innerHTML = "";
  if (el("weakest")) el("weakest").innerHTML = "";
  if (el("timewin")) el("timewin").innerHTML = "";
  if (el("deepDive")) el("deepDive").innerHTML = "";
  if (el("deepDiveOut")) {
    el("deepDiveOut").innerHTML = "";
    el("deepDiveOut").style.display = "none";
  }

  LAST_SCORES = null;
}

document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();

  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);

  // Mode Switch Buttons (müssen in index.html existieren)
  el("modePrivate")?.addEventListener("click", () => setMode(MODE_PRIVATE));
  el("modeBusiness")?.addEventListener("click", () => setMode(MODE_BUSINESS));

  // Default
  setMode(MODE_PRIVATE);
});
