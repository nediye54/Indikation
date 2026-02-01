// v7 — frontend script.js (NO worker code inside)
// Quick Scan UI + Radar + DeepDive fetch to Worker

const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

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

// ---------------- Error box ----------------
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

// ---------------- Build questions ----------------
function buildQuestions() {
  const host = el("questions");
  if (!host) return;
  host.innerHTML = "";

  QUESTIONS.forEach((item, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "q";

    const top = document.createElement("div");
    top.className = "qTop";

    const left = document.createElement("div");
    left.className = "qIdx";
    left.textContent = `${idx + 1}/${QUESTIONS.length} · ${item.v}`;

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

    wrap.appendChild(top);
    wrap.appendChild(p);
    wrap.appendChild(opts);
    host.appendChild(wrap);
  });
}

// ---------------- Collect & score ----------------
let LAST_SCORES = null;

function collectAnswersByVar() {
  const byVar = {};
  VARS.forEach(v => (byVar[v] = []));

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
  VARS.forEach(v => (scores[v] = avg(byVar[v])));
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

// ---------------- Render: bars / labels ----------------
function renderBars(scores) {
  const host = el("bars");
  if (!host) return;
  host.innerHTML = "";

  for (const v of VARS) {
    const val = scores[v];
    const row = document.createElement("div");
    row.className = "barRow";

    row.innerHTML = `
      <div class="barName">${v}</div>
      <div class="barTrack"><div class="barFill" style="width:${Math.round(val*100)}%"></div></div>
      <div class="barVal">${val.toFixed(2)}</div>
    `;
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
  const host = el("deepDive") || el("deepDiveOut");
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

// ---------------- Radar (canvas) ----------------
// requires <canvas id="radar" width="520" height="420"></canvas> in your HTML (inside plot box)
function renderRadar(scores, weak) {
  const c = el("radar");
  if (!c) return; // if you don’t have it yet, nothing breaks
  const ctx = c.getContext("2d");

  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  const cx = W * 0.5;
  const cy = H * 0.52;
  const R = Math.min(W,H) * 0.33;

  // background vignette
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W,H)*0.55);
  g.addColorStop(0, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;

  const rings = 5;
  for (let r=1; r<=rings; r++) {
    const rr = (R * r) / rings;
    ctx.beginPath();
    for (let i=0; i<VARS.length; i++) {
      const a = (Math.PI*2*i)/VARS.length - Math.PI/2;
      const x = cx + Math.cos(a)*rr;
      const y = cy + Math.sin(a)*rr;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // spokes
  for (let i=0; i<VARS.length; i++) {
    const a = (Math.PI*2*i)/VARS.length - Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
    ctx.stroke();
  }

  // polygon
  ctx.fillStyle = "rgba(120, 220, 220, 0.18)";
  ctx.strokeStyle = "rgba(120, 220, 220, 0.55)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  VARS.forEach((v,i) => {
    const a = (Math.PI*2*i)/VARS.length - Math.PI/2;
    const val = scores[v] ?? 0;
    const rr = R * val;
    const x = cx + Math.cos(a)*rr;
    const y = cy + Math.sin(a)*rr;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // points + labels
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  VARS.forEach((v,i) => {
    const a = (Math.PI*2*i)/VARS.length - Math.PI/2;
    const val = scores[v] ?? 0;
    const rr = R * val;
    const x = cx + Math.cos(a)*rr;
    const y = cy + Math.sin(a)*rr;

    // dot
    ctx.beginPath();
    ctx.arc(x,y,3.5,0,Math.PI*2);
    ctx.fill();

    // axis label
    const lx = cx + Math.cos(a)*(R + 28);
    const ly = cy + Math.sin(a)*(R + 28);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(v, lx, ly);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
  });

  // arrow to weakest (10–15% longer)
  if (weak && weak.key) {
    const i = VARS.indexOf(weak.key);
    if (i >= 0) {
      const a = (Math.PI*2*i)/VARS.length - Math.PI/2;
      const len = R * 1.12; // +12% (in your requested range)
      const x2 = cx + Math.cos(a)*len;
      const y2 = cy + Math.sin(a)*len;

      ctx.strokeStyle = "rgba(255,190,90,0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // arrow head
      const head = 12;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a-0.35)*head, y2 - Math.sin(a-0.35)*head);
      ctx.lineTo(x2 - Math.cos(a+0.35)*head, y2 - Math.sin(a+0.35)*head);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,190,90,0.95)";
      ctx.fill();

      // label box (simple)
      const label = `Schwach: ${weak.key} · ${weak.val.toFixed(2)}`;
      const bw = Math.min(260, ctx.measureText(label).width + 24);
      const bx = Math.max(12, Math.min(W - bw - 12, x2 - bw*0.45));
      const by = Math.max(12, y2 - 34);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.strokeStyle = "rgba(255,190,90,0.8)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, bw, 28, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.fillText(label, bx + bw/2, by + 14);
    }
  }

  // helper text
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left";
  ctx.fillText("Radar-Profil: niedrig = innen, hoch = außen · Pfeil = schwächste Variable", 12, H - 14);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

// ---------------- Deep Dive (Worker) ----------------
function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a,b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k);
}

async function runDeepDive() {
  const deepDiveBtn = el("deepDiveBtn");
  const deepDiveOut = el("deepDiveOut");
  const timeframeSel = el("timeframe");

  if (!deepDiveBtn || !deepDiveOut) return;

  if (!LAST_SCORES) {
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = "Bitte zuerst Quick Scan auswerten.";
    return;
  }

  const timeframe = timeframeSel?.value || "heute";
  const weakest = weakestVars(LAST_SCORES, 2);

  const payload = { language: "de", timeframe, scores: LAST_SCORES, weakest };

  try {
    deepDiveBtn.disabled = true;
    deepDiveBtn.textContent = "…denke nach";

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) throw new Error(data?.error || `Worker HTTP ${resp.status}`);

    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = data.text || "(keine Ausgabe)";
  } catch (e) {
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = `Fehler: ${String(e.message || e)}`;
  } finally {
    deepDiveBtn.disabled = false;
    deepDiveBtn.textContent = "Stabilisierende Indikation erzeugen";
  }
}

// ---------------- Main evaluate / reset ----------------
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
  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  renderDeepDiveLocal(scores, 3);
  renderRadar(scores, weak); // radar+arrow+label
}

function onReset() {
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);
  el("results")?.classList.add("hidden");

  if (el("bars")) el("bars").innerHTML = "";
  if (el("weakest")) el("weakest").innerHTML = "";
  if (el("timewin")) el("timewin").innerHTML = "";
  const dd = el("deepDive") || el("deepDiveOut");
  if (dd) dd.innerHTML = "";

  const c = el("radar");
  if (c) c.getContext("2d").clearRect(0,0,c.width,c.height);
}

document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();
  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);
});
