// v6 — clean: single evaluate flow, VARS defined, worker optional, no duplicate blocks.
const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

// Variablen-Reihenfolge
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

// Fragen
const QUESTIONS = [
  // Freiheit (3)
  { v: "Freiheit", q: "Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
  { v: "Freiheit", q: "Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
  { v: "Freiheit", q: "Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },

  // Gerechtigkeit (3)
  { v: "Gerechtigkeit", q: "Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
  { v: "Gerechtigkeit", q: "Gibt es Regeln, die für manche gelten und für andere nicht?" },
  { v: "Gerechtigkeit", q: "Fühlst du dich in Entscheidungen, die dich betreffen, ausreichend berücksichtigt?" },

  // Wahrheit (3)
  { v: "Wahrheit", q: "Werden Probleme offen benannt, auch wenn es unangenehm ist?" },
  { v: "Wahrheit", q: "Kannst du Kritik ansprechen, ohne dass sofort Abwehr oder Schuldzuweisung entsteht?" },
  { v: "Wahrheit", q: "Gibt es Themen, die „nicht gesagt werden dürfen“, obwohl alle sie spüren?" },

  // Harmonie (3)
  { v: "Harmonie", q: "Gibt es in deinem Alltag Phasen von Ruhe, in denen du innerlich „runterkommst“?" },
  { v: "Harmonie", q: "Werden Konflikte so gelöst, dass danach wieder Nähe/Respekt möglich ist?" },
  { v: "Harmonie", q: "Fühlst du dich mit anderen grundsätzlich verbunden statt dauerhaft im Wettkampf?" },

  // Effizienz (3)
  { v: "Effizienz", q: "Führt dein Aufwand meistens zu klaren Ergebnissen?" },
  { v: "Effizienz", q: "Gibt es unnötige Schleifen, Wiederholungen oder chaotische Zuständigkeiten?" },
  { v: "Effizienz", q: "Kannst du dich gut fokussieren, ohne ständig von „Feuerwehr-Themen“ abgelenkt zu werden?" },

  // Handlungsspielraum (3)
  { v: "Handlungsspielraum", q: "Hast du realistische Optionen, Dinge zu verändern, wenn etwas nicht passt?" },
  { v: "Handlungsspielraum", q: "Kannst du „Nein“ sagen, ohne echte Nachteile befürchten zu müssen?" },
  { v: "Handlungsspielraum", q: "Gibt es Ressourcen/Unterstützung, die du aktiv nutzen kannst?" },

  // Mittel (3)
  { v: "Mittel", q: "Reichen deine verfügbaren Mittel (Zeit, Geld, Energie) für das, was erwartet wird?" },
  { v: "Mittel", q: "Gibt es Engpässe, die regelmäßig Stress oder Konflikte auslösen?" },
  { v: "Mittel", q: "Sind Mittel so verteilt, dass das System nicht „ausblutet“ (z.B. dauerhaftes Überziehen)?" },

  // Balance (3)
  { v: "Balance", q: "Ist die Balance zwischen Geben und Nehmen in deinem Umfeld stimmig?" },
  { v: "Balance", q: "Gibt es Extrem-Ausschläge (zu viel Kontrolle / zu viel Chaos)?" },
  { v: "Balance", q: "Fühlst du dich insgesamt „im Gleichgewicht“, auch wenn nicht alles perfekt ist?" },
];

// 3 Antwortstufen: 0.2 / 0.5 / 0.8
const SCALE = [
  { label: "unklar / schwach", value: 0.2 },
  { label: "teils / gemischt", value: 0.5 },
  { label: "klar / stark", value: 0.8 },
];

const el = (id) => document.getElementById(id);

// --- Deep Dive state (set after evaluate) ---
let LAST_SCORES = null;

// --- Error UI (optional message) ---
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

// Nur anzeigen, wenn es wirklich unser script.js betrifft (keine Addons)
window.addEventListener("error", (e) => {
  try {
    const file = (e && e.filename) ? String(e.filename) : "";
    if (file.includes("script.js")) {
      showErrorBox("Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).");
    }
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

    qWrap.appendChild(top);
    qWrap.appendChild(p);
    qWrap.appendChild(opts);
    host.appendChild(qWrap);
  });
}

// --- Collect & score ---
function collectAnswersByVar() {
  const byVar = {};
  VARS.forEach((v) => (byVar[v] = []));

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
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function scoreAll(byVar) {
  const scores = {};
  VARS.forEach((v) => (scores[v] = avg(byVar[v])));
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

// --- Render helpers ---
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
  host.innerHTML = `<span class="badge">${weak.key}</span> <span class="muted">Score:</span> <strong>${weak.val.toFixed(
    2
  )}</strong>`;
}

function renderTimewin(weak) {
  const host = el("timewin");
  if (!host) return;
  host.innerHTML = `<span class="badge">${timeWindowFor(weak.val)}</span>`;
}

function render3D(scores) {
  const host = el("plot3d");
  if (!host) return;
  host.innerHTML = "";

  const rect = host.getBoundingClientRect();
  const cx = rect.width * 0.5;
  const cy = rect.height * 0.62;
  const R = Math.min(rect.width, rect.height) * 0.33;

  VARS.forEach((v, i) => {
    const a = (Math.PI * 2 * i) / VARS.length;
    const val = scores[v];
    const x = cx + Math.cos(a) * R * (0.72 + val * 0.5);
    const y = cy + Math.sin(a) * R * (0.38 + (1 - val) * 0.35);

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;

    const lab = document.createElement("div");
    lab.className = "dotLabel";
    lab.textContent = v;

    dot.appendChild(lab);
    host.appendChild(dot);
  });
}

function renderDeepDiveLocal(scores, maxN = 3) {
  const host = el("deepDive") || el("deepDiveOut");
  if (!host) return;
  host.innerHTML = "";

  const list = Object.entries(scores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, maxN);

  list.forEach(([v, val]) => {
    const div = document.createElement("div");
    div.className = "ddItem";
    div.innerHTML = `<span class="badge">${v}</span> <span class="muted">Score:</span> <strong>${val.toFixed(
      2
    )}</strong>`;
    host.appendChild(div);
  });
}

// --- Deep Dive helper ---
function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k);
}

// --- Main evaluate ---
async function onEvaluate() {
  hideErrorBox();

  const collected = collectAnswersByVar();
  if (!collected.ok) {
    showErrorBox(
      `Bitte beantworte alle Fragen. Fehlend: ${collected.missing.slice(0, 5).join(", ")}${
        collected.missing.length > 5 ? "…" : ""
      }`
    );
    return;
  }

  const scores = scoreAll(collected.byVar);
  LAST_SCORES = scores;
  const weak = weakestVar(scores);

  el("results")?.classList.remove("hidden");
  render3D(scores);
  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  renderDeepDiveLocal(scores, 3);
}

function onReset() {
  hideErrorBox();
  LAST_SCORES = null;

  document.querySelectorAll('input[type="radio"]').forEach((i) => (i.checked = false));
  el("results")?.classList.add("hidden");

  if (el("plot3d")) el("plot3d").innerHTML = "";
  if (el("bars")) el("bars").innerHTML = "";
  if (el("weakest")) el("weakest").innerHTML = "";
  if (el("timewin")) el("timewin").innerHTML = "";

  const out = el("deepDiveOut");
  if (out) {
    out.style.display = "none";
    out.textContent = "";
  }
  const dd = el("deepDive");
  if (dd) dd.innerHTML = "";
}

// --- Deep Dive (Worker + OpenAI) ---
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

  const payload = {
    language: "de",
    timeframe,
    scores: LAST_SCORES,
    weakest,
  };

  try {
    deepDiveBtn.disabled = true;
    deepDiveBtn.textContent = "…denke nach";

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) {
      throw new Error(data?.error || `Worker HTTP ${resp.status}`);
    }

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

document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();
  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);
});

/* =========================
   WOW Radar / Spinnennetz (Add-on)
   -> NICHTS ersetzen, nur unten anfügen
   ========================= */

/**
 * Render a radar/spider chart into the existing #plot3d container.
 * Uses <canvas> so it stays crisp and "wow".
 * Works with VARS + scores object { "Freiheit":0.4, ... }.
 */
function renderRadar(scores) {
  const host = document.getElementById("plot3d");
  if (!host) return;

  // Ensure host has size; if not, give it a minimum so canvas can render
  const rect0 = host.getBoundingClientRect();
  if (rect0.width < 10 || rect0.height < 10) {
    host.style.minHeight = "320px";
  }

  // Create/find canvas
  let canvas = host.querySelector("canvas.radarCanvas");
  if (!canvas) {
    // Keep your existing background (if any) – we don't wipe host completely.
    // We just overlay a canvas at the end.
    canvas = document.createElement("canvas");
    canvas.className = "radarCanvas";
    host.appendChild(canvas);
  }

  // Measure again
  const rect = host.getBoundingClientRect();
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(280, Math.floor(rect.height));
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Layout
  const vars = (typeof VARS !== "undefined" && Array.isArray(VARS)) ? VARS.slice() : Object.keys(scores || {});
  const n = vars.length || 1;

  const cx = w * 0.5;
  const cy = h * 0.54;
  const R = Math.min(w, h) * 0.34;

  // Find weakest/strongest for subtle emphasis
  let weakest = null;
  let strongest = null;
  for (const v of vars) {
    const val = Math.max(0, Math.min(1, (scores && scores[v] != null) ? Number(scores[v]) : 0));
    if (!weakest || val < weakest.val) weakest = { v, val };
    if (!strongest || val > strongest.val) strongest = { v, val };
  }

  // Background vignette
  const vign = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.9);
  vign.addColorStop(0, "rgba(255,255,255,0.06)");
  vign.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, w, h);

  // Grid rings
  const rings = 5;
  ctx.lineWidth = 1;

  for (let r = 1; r <= rings; r++) {
    const rr = (R * r) / rings;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = (r === rings)
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.08)";
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();
  }

  // Points for polygon
  const pts = [];
  for (let i = 0; i < n; i++) {
    const v = vars[i];
    const val = Math.max(0, Math.min(1, (scores && scores[v] != null) ? Number(scores[v]) : 0));
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const rr = R * (0.12 + 0.88 * val); // avoid collapsing to center
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    pts.push({ v, val, a, x, y });
  }

  // Glow fill
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = "rgba(120,200,255,0.10)";
  ctx.shadowColor = "rgba(120,200,255,0.35)";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Main fill + outline
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(170,230,255,0.55)";
  ctx.stroke();

  // Dots (highlight weakest/strongest)
  for (const p of pts) {
    let r = 3.6;
    let fill = "rgba(255,255,255,0.85)";
    let stroke = "rgba(0,0,0,0.35)";

    if (weakest && p.v === weakest.v) {
      r = 5.2;
      fill = "rgba(255,180,120,0.95)";
      stroke = "rgba(255,180,120,0.35)";
    } else if (strongest && p.v === strongest.v) {
      r = 5.2;
      fill = "rgba(140,255,200,0.92)";
      stroke = "rgba(140,255,200,0.35)";
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  // Labels (outside ring)
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "rgba(255,255,255,0.85)";

  const labelR = R * 1.15;
  for (let i = 0; i < n; i++) {
    const v = vars[i];
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    const x = cx + Math.cos(a) * labelR;
    const y = cy + Math.sin(a) * labelR;

    // align based on side
    const cos = Math.cos(a);
    if (cos > 0.25) ctx.textAlign = "left";
    else if (cos < -0.25) ctx.textAlign = "right";
    else ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Subtle shadow for readability
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6;
    ctx.fillText(v, x, y);
    ctx.restore();
  }

  // Mini legend text
  const legend = `Radar-Profil · niedrig = innen, hoch = außen`;
  ctx.font = "11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(legend, 14, h - 12);
}

/**
 * Hook: Whenever results become visible, try to render radar.
 * Works without changing your existing onEvaluate().
 */
(function setupRadarAutoRender() {
  function tryRender() {
    // Prefer LAST_SCORES if your app provides it, else try to reconstruct from bars
    let scores = null;

    if (typeof LAST_SCORES !== "undefined" && LAST_SCORES) {
      scores = LAST_SCORES;
    }

    // Fallback: if bars exist with text values, skip (your app already has scores).
    if (scores) renderRadar(scores);
  }

  // 1) Try after evaluate button click (capturing)
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;
    // Works whether you use btnEval or something else, but primary:
    if (t.id === "btnEval") {
      // wait for DOM updates
      setTimeout(tryRender, 50);
      setTimeout(tryRender, 200);
    }
  }, true);

  // 2) Also try once on load (in case results are already visible)
  window.addEventListener("load", () => {
    setTimeout(tryRender, 200);
  });

  // 3) Re-render on resize (nice)
  window.addEventListener("resize", () => {
    setTimeout(tryRender, 150);
  });
})();
