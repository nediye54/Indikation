// v11 — Deutsch-only. Stabil. Radar (Canvas) polished + arrow/label gap + DeepDive premium cards.
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
  // Freiheit (3)
  { v:"Freiheit", q:"Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
  { v:"Freiheit", q:"Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
  { v:"Freiheit", q:"Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },

  // Gerechtigkeit (3)
  { v:"Gerechtigkeit", q:"Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
  { v:"Gerechtigkeit", q:"Gibt es Regeln, die für manche gelten und für andere nicht?" },
  { v:"Gerechtigkeit", q:"Fühlst du dich in Entscheidungen, die dich betreffen, ausreichend berücksichtigt?" },

  // Wahrheit (3)
  { v:"Wahrheit", q:"Werden Probleme offen benannt, auch wenn es unangenehm ist?" },
  { v:"Wahrheit", q:"Kannst du Kritik ansprechen, ohne dass sofort Abwehr oder Schuldzuweisung entsteht?" },
  { v:"Wahrheit", q:"Gibt es Themen, die „nicht gesagt werden dürfen“, obwohl alle sie spüren?" },

  // Harmonie (3)
  { v:"Harmonie", q:"Gibt es in deinem Alltag Phasen von Ruhe, in denen du innerlich „runterkommst“?" },
  { v:"Harmonie", q:"Werden Konflikte so gelöst, dass danach wieder Nähe/Respekt möglich ist?" },
  { v:"Harmonie", q:"Fühlst du dich mit anderen grundsätzlich verbunden statt dauerhaft im Wettkampf?" },

  // Effizienz (3)
  { v:"Effizienz", q:"Führt dein Aufwand meistens zu klaren Ergebnissen?" },
  { v:"Effizienz", q:"Gibt es unnötige Schleifen, Wiederholungen oder chaotische Zuständigkeiten?" },
  { v:"Effizienz", q:"Kannst du dich gut fokussieren, ohne ständig von „Feuerwehr-Themen“ abgelenkt zu werden?" },

  // Handlungsspielraum (3)
  { v:"Handlungsspielraum", q:"Hast du realistische Optionen, Dinge zu verändern, wenn etwas nicht passt?" },
  { v:"Handlungsspielraum", q:"Kannst du „Nein“ sagen, ohne echte Nachteile befürchten zu müssen?" },
  { v:"Handlungsspielraum", q:"Gibt es Ressourcen/Unterstützung, die du aktiv nutzen kannst?" },

  // Mittel (3)
  { v:"Mittel", q:"Reichen deine verfügbaren Mittel (Zeit, Geld, Energie) für das, was erwartet wird?" },
  { v:"Mittel", q:"Gibt es Engpässe, die regelmäßig Stress oder Konflikte auslösen?" },
  { v:"Mittel", q:"Sind Mittel so verteilt, dass das System nicht „ausblutet“ (z.B. dauerhaftes Überziehen)?" },

  // Balance (3)
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

// Nur anzeigen, wenn es wirklich unser script.js betrifft (keine Addons)
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
    left.textContent = `${idx+1}/${QUESTIONS.length} · ${item.v}`;

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

    // Points
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

    // Arrow to weakest + label (mit Abstand & seitlichem Versatz)
    const wIdx = VARS.indexOf(weak.key);
    if (wIdx >= 0){
      const a = angleFor(wIdx);
      const endR = R * 1.12;
      const tipX = cx + Math.cos(a) * endR;
      const tipY = cy + Math.sin(a) * endR;

      // glow
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = arrowGlow;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.stroke();

      // main
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = arrowStroke;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // head
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

      // Label box
      const label = `Schwach: ${weak.key} · ${weak.val.toFixed(2)}`;

      ctx.font = "700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const m = 10;
      const tw = ctx.measureText(label).width;
      const bw = tw + m*2;
      const bh = 30;

      // Abstand + seitlicher Versatz (damit Pfeil erkennbar bleibt)
      const gap = 38;   // <- hier kannst du später feinjustieren
      const side = 15;  // <- seitlicher Versatz

      let bx = tipX + (Math.cos(a) * gap) + (-Math.sin(a) * side);
      let by = tipY + (Math.sin(a) * gap) + ( Math.cos(a) * side);

      // Clamp inside
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

// --- Deep Dive (Worker) ---
let LAST_SCORES = null;

function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a,b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k);
}

function escapeHTML(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Premium Renderer:
 * - akzeptiert plain text (data.text)
 * - akzeptiert später strukturiert: data.cards = [{title,pill,bullets,body,timeline:[{t,txt}]}]
 */
function renderDeepDivePremium(data, meta){
  const host = el("deepDiveOut");
  if (!host) return;

  host.style.display = "block";

  // Structured mode (falls du später data.cards aus dem Worker lieferst)
  if (data && Array.isArray(data.cards) && data.cards.length){
    host.innerHTML = buildCardsHTML(data.cards);
    return;
  }

  // Plain text / Markdown
  const raw = (data && (data.text || data.output || data.result)) ? String(data.text || data.output || data.result) : "";
  const text = raw.trim();

  if (!text){
    host.innerHTML = `<div class="ddCards">
      <div class="ddCard">
        <div class="ddTitle"><h4>Hinweis</h4><span class="ddPill">keine Ausgabe</span></div>
        <div class="ddText">Der Worker hat keine Textausgabe geliefert.</div>
      </div>
    </div>`;
    return;
  }

  // === MARKDOWN -> Sections ===
  const sections = splitByMarkdownHeadings(text);

  // Erwartete Reihenfolge / Titel normalisieren
  const cards = [];

  for (const s of sections){
    const title = normalizeTitle(s.title);
    const pill = makePill(meta);

    // Inhalte: Bullets + Resttext
    const { bullets, paragraphs, timeline } = parseSectionBody(s.body, meta);

    // Card bauen – je nach Typ
    if (title.includes("plan") && timeline.length){
      cards.push({ title: "Plan nach Zeitfenster", pill: "Ablauf", timeline });
      continue;
    }

    if (title.includes("hebel")){
      cards.push({ title: "Hebel & Interventionen", pill: "Handlung", bullets: bullets.length ? bullets : guessActionBulletsFromText(s.body) });
      continue;
    }

    if (title.includes("coach")){
      cards.push({ title: "Coach Guide", pill: "Session", bullets: bullets.length ? bullets : buildCoachQuestions(meta?.weakest || []) });
      continue;
    }

    if (title.includes("kernhypothesen")){
      cards.push({ title: "Kernhypothesen", pill: "Systembild", bullets: bullets.length ? bullets : paragraphs.slice(0,6) });
      continue;
    }

    if (title.includes("systembild")){
      cards.push({ title: "Systembild", pill: pill, body: paragraphs.join(" ") || s.body });
      continue;
    }

    if (title.includes("executive")){
      cards.push({ title: "Executive Summary", pill: pill, body: paragraphs.join(" ") || s.body });
      continue;
    }

    // Fallback: generische Card
    cards.push({
      title: s.title || "Deep Dive",
      pill: pill,
      body: paragraphs.join(" ") || s.body,
      bullets: bullets.length ? bullets : null
    });
  }

  // Falls Worker manche Sections nicht liefert: stabil auffüllen
  const have = (name) => cards.some(c => (c.title || "").toLowerCase().includes(name));
  if (!have("executive")) cards.unshift({ title:"Executive Summary", pill: makePill(meta), body: text.split("\n").slice(0,4).join(" ") });
  if (!have("plan")) cards.push({ title:"Plan nach Zeitfenster", pill:"Ablauf", timeline: buildTimeline(meta?.timeframe || "heute", text) });
  if (!have("coach")) cards.push({ title:"Coach Guide", pill:"Session", bullets: buildCoachQuestions(meta?.weakest || []) });

  host.innerHTML = buildCardsHTML(cards);
}

function splitByMarkdownHeadings(text){
  // Splittet nach ### Überschriften (dein Output nutzt das)
  const lines = text.split("\n");
  const out = [];
  let cur = { title: "", body: [] };

  const push = () => {
    const body = cur.body.join("\n").trim();
    if (cur.title || body) out.push({ title: (cur.title || "").trim(), body });
  };

  for (const line of lines){
    const m = line.match(/^#{2,4}\s*(.+?)\s*$/); // ## / ### / ####
    if (m){
      push();
      cur = { title: m[1], body: [] };
      continue;
    }
    cur.body.push(line);
  }
  push();
  return out.filter(s => (s.title || s.body).trim().length);
}

function normalizeTitle(t){
  const s = String(t || "").toLowerCase();
  if (s.includes("executive")) return "executive summary";
  if (s.includes("systembild")) return "systembild";
  if (s.includes("kernhypoth")) return "kernhypothesen";
  if (s.includes("hebel")) return "hebel";
  if (s.includes("plan")) return "plan";
  if (s.includes("coach")) return "coach";
  return s || "deep dive";
}

function parseSectionBody(body, meta){
  const lines = String(body || "").split("\n").map(x=>x.trim()).filter(Boolean);

  const bullets = [];
  const paragraphs = [];
  for (const l of lines){
    // Entfernt Markdown-Sternchen **Text**
    const clean = l.replace(/\*\*(.*?)\*\*/g, "$1").trim();

    // Bullet-Erkennung
    if (/^[-•*]\s+/.test(clean)){
      bullets.push(clean.replace(/^[-•*]\s+/, ""));
      continue;
    }

    // Viele deiner Zeilen sind "1. ..." -> auch als Bullet behandeln
    if (/^\d+\.\s+/.test(clean)){
      bullets.push(clean.replace(/^\d+\.\s+/, ""));
      continue;
    }

    paragraphs.push(clean);
  }

  // Timeline aus Plan-Sektion extrahieren (Heut/7 Tage/30 Tage/Woche etc.)
  const timeline = [];
  const joined = paragraphs.join(" \n");
  const re = /(Heute|Jetzt|24–72h|72h|7 Tage|30 Tage|Woche\s*\d+)[^\n]*?:\s*([^#]+)/gi;
  let m;
  while ((m = re.exec(joined)) !== null){
    timeline.push({ t: m[1], txt: m[2].trim().replace(/\s+/g, " ") });
  }

  return { bullets, paragraphs, timeline };
}

function makePill(meta){
  const weakest = meta?.weakest?.join(", ") || "";
  const tf = meta?.timeframe || "";
  if (weakest && tf) return `${weakest} · ${tf}`;
  return weakest || tf || "Analyse";
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

function guessActionBulletsFromText(text){
  // ultra-sicherer Fallback, wenn Worker keine Bulletpoints liefert
  const base = [
    "Benennen: Was genau wird im System vermieden oder verdrängt?",
    "Grenze: Wo brauchst du eine klare Linie (ohne Eskalation)?",
    "Ressource: Welche Unterstützung ist realistisch aktivierbar?",
    "Struktur: Was lässt sich in 7 Tagen messbar vereinfachen?",
    "Dialog: Welches Gespräch ist fällig – mit welchem Ziel?"
  ];
  return base;
}

function buildTimeline(timeframe, text){
  // stabile Default-Timeline (Coach-tauglich), unabhängig vom Worker-Text
  if (timeframe === "30tage"){
    return [
      { t: "Heute", txt: "1 klare Beobachtung formulieren (ohne Urteil). 1 Mini-Schritt festlegen (≤10 Minuten)." },
      { t: "7 Tage", txt: "1 Gespräch/Intervention durchführen. Reaktion protokollieren: besser/schlechter/gleich." },
      { t: "30 Tage", txt: "Stabilisierungsroutine definieren: Was bleibt, was endet, was wird delegiert?" },
    ];
  }
  if (timeframe === "7tage"){
    return [
      { t: "Heute", txt: "Trigger + Muster identifizieren: Was kippt wann? 1 Schutzregel setzen." },
      { t: "72h", txt: "Kleine Strukturänderung testen (z.B. klare Zuständigkeit / klare Grenze)." },
      { t: "7 Tage", txt: "Wirksamkeit prüfen: Welche Variable bewegt sich? Nächste Intervention auswählen." },
    ];
  }
  return [
    { t: "Jetzt", txt: "Akuter Fokus: Was schadet gerade unmittelbar? Sofortmaßnahme definieren." },
    { t: "24–72h", txt: "1 Intervention mit maximaler Hebelwirkung: Grenze / Wahrheit / Entlastung." },
    { t: "1–2 Wochen", txt: "Stabilisierung: Regel, Routine oder Struktur einführen, die Rückfälle verhindert." },
  ];
}

function buildCoachQuestions(weakest){
  const w = weakest && weakest.length ? weakest : ["(Schwerpunkt)"];
  const v1 = w[0] || "(Variable)";
  const v2 = w[1] || null;

  const qs = [
    `Wenn ${v1} „kippt“: Woran merkt man es als Erstes – im Verhalten, im Körper, im Denken?`,
    `Welche Wahrheit wird vermieden, weil sie kurzfristig Konflikt erzeugen könnte – langfristig aber Stabilität bringt?`,
    `Welche Grenze wäre fair – und welche Konsequenz ist realistisch, wenn sie nicht respektiert wird?`,
    `Was ist die kleinste Intervention, die man in 24h wirklich umsetzen kann (ohne neue Abhängigkeiten)?`,
  ];
  if (v2) qs.push(`Was ist die Wechselwirkung zwischen ${v1} und ${v2}? (z.B. „wenn X sinkt, steigt Y“).`);
  return qs;
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

  const payload = {
    language: "de",
    timeframe,
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

    // Premium render
    renderDeepDivePremium(data, { weakest, timeframe });

  } catch (e) {
    deepDiveOut.style.display = "block";
    deepDiveOut.innerHTML = `<div class="ddCards">
      <div class="ddCard">
        <div class="ddTitle"><h4>Fehler</h4><span class="ddPill">Request</span></div>
        <div class="ddText">${escapeHTML(String(e.message || e))}</div>
        <div class="ddSmall">Hinweis: Wenn das wiederholt auftritt, ist es fast immer CORS / CSP oder ein Worker-Fehler.</div>
      </div>
    </div>`;
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
});
