// v13 — Full replace. Private/Business Deep Dive. Token UI.
// NOTE: This frontend expects Worker endpoints:
// - POST /deepdive           (private) -> { ok:true, text:"..." }
// - POST /deepdive-business  (business) -> requires header X-Token

const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

const VARS = [
  "Freiheit","Gerechtigkeit","Wahrheit","Harmonie",
  "Effizienz","Handlungsspielraum","Mittel","Balance",
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

function escapeHTML(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showErrorBox(msg) {
  const box = el("errorBox");
  if (!box) return;
  box.classList.remove("hidden");
  box.textContent = msg || "Fehler.";
}
function hideErrorBox() {
  const box = el("errorBox");
  if (!box) return;
  box.classList.add("hidden");
  box.textContent = "";
}

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

// ---------- Questions ----------
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

// ---------- Scoring ----------
function collectAnswersByVar(){
  const byVar = {};
  const missing = [];
  VARS.forEach(v => byVar[v] = []);

  for (let i=0; i<QUESTIONS.length; i++){
    const checked = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!checked){
      missing.push(String(i+1));
      continue;
    }
    const v = checked.getAttribute("data-var");
    const val = Number(checked.value || 0);
    byVar[v].push(val);
  }
  return { ok: missing.length===0, byVar, missing };
}

function scoreAll(byVar){
  const scores = {};
  for (const v of VARS){
    const arr = byVar[v] || [];
    const avg = arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length) : 0;
    scores[v] = clamp(avg, 0, 1);
  }
  return scores;
}

function weakestVar(scores){
  const entries = Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  const [key,val] = entries[0];
  return { key, val };
}
function weakestVars(scores, n = 2) {
  return Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0, n).map(([k])=>k);
}

// ---------- Render ----------
function renderBars(scores){
  const host = el("bars");
  if (!host) return;
  host.innerHTML = "";

  const sorted = Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  sorted.forEach(([name,val])=>{
    const row = document.createElement("div");
    row.className = "barRow";

    const n = document.createElement("div");
    n.className = "barName";
    n.textContent = name;

    const track = document.createElement("div");
    track.className = "barTrack";

    const fill = document.createElement("div");
    fill.className = "barFill";
    fill.style.width = `${Math.round(val*100)}%`;
    track.appendChild(fill);

    const v = document.createElement("div");
    v.className = "barVal";
    v.textContent = val.toFixed(2);

    row.appendChild(n);
    row.appendChild(track);
    row.appendChild(v);
    host.appendChild(row);
  });
}

function renderWeakest(weak){
  const host = el("weakest");
  if (!host) return;
  host.innerHTML = `
    <div class="ddItem">
      <span class="badge">${escapeHTML(weak.key)}</span>
      <span class="muted">Score:</span>
      <strong>${weak.val.toFixed(2)}</strong>
    </div>`;
}

function renderTimewin(){
  const host = el("timewin");
  if (!host) return;
  host.innerHTML = `
    <div class="ddItem">
      <span class="badge">jetzt (akut)</span>
      <span class="muted">24–72h Fokus</span>
    </div>`;
}

function renderDeepDiveLocal(scores, maxN = 3) {
  const host = el("deepDive");
  if (!host) return;
  host.innerHTML = "";
  const list = Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0, maxN);
  list.forEach(([v,val]) => {
    const div = document.createElement("div");
    div.className = "ddItem";
    div.innerHTML = `<span class="badge">${escapeHTML(v)}</span> <span class="muted">Score:</span> <strong>${val.toFixed(2)}</strong>`;
    host.appendChild(div);
  });
}

// Minimal Radar placeholder (keine Canvas-Implementierung hier, damit du’s stabil 1:1 hast)
// Wenn du den Canvas-Radar aus deiner alten Version willst: sag kurz Bescheid, ich merge ihn exakt rein.
function renderRadar(){
  const host = el("plot3d");
  if (!host) return;
  host.innerHTML = `<div style="padding:14px;opacity:.8">Radar ist aktiv (Canvas-Version kann optional reingemerget werden).</div>`;
}

// ---------- Deep Dive Status ----------
let LAST_SCORES = null;
let DEEPDIVE_MODE = "private";

function setDeepDiveStatus(msg, kind){
  const box = el("deepDiveStatus");
  if (!box) return;
  if (!msg){
    box.classList.add("hidden");
    box.classList.remove("ok","err");
    box.textContent = "";
    return;
  }
  box.classList.remove("hidden");
  box.classList.toggle("ok", kind === "ok");
  box.classList.toggle("err", kind === "err");
  box.textContent = msg;
}

function setDeepDiveMode(mode){
  DEEPDIVE_MODE = (mode === "business") ? "business" : "private";

  const bPriv = el("modePrivate");
  const bBiz  = el("modeBusiness");
  const tokenRow = el("tokenRow");

  if (bPriv && bBiz){
    bPriv.classList.toggle("isActive", DEEPDIVE_MODE === "private");
    bBiz.classList.toggle("isActive", DEEPDIVE_MODE === "business");
    bPriv.setAttribute("aria-selected", DEEPDIVE_MODE === "private" ? "true" : "false");
    bBiz.setAttribute("aria-selected", DEEPDIVE_MODE === "business" ? "true" : "false");
  }
  if (tokenRow){
    tokenRow.classList.toggle("hidden", DEEPDIVE_MODE !== "business");
  }
  setDeepDiveStatus("");
}

function getBusinessToken(){
  return String(el("tokenInput")?.value || "").trim();
}

// ---------- Deep Dive Output (simple cards) ----------
function renderDeepDiveTextAsCards(text, weakest){
  const host = el("deepDiveOut");
  if (!host) return;
  host.style.display = "block";

  const safe = escapeHTML(String(text||"").trim());
  const pill = weakest?.length ? `Fokus: ${weakest.join(", ")}` : "Analyse";

  host.innerHTML = `
    <div class="ddCards">
      <div class="ddCard">
        <div class="ddTitle">
          <h4>Executive Summary</h4>
          <span class="ddPill">${escapeHTML(pill)}</span>
        </div>
        <div class="ddText">${safe || "—"}</div>
      </div>
    </div>
  `;
}

// ---------- Deep Dive Call ----------
async function runDeepDive(){
  const btn = el("deepDiveBtn");
  const out = el("deepDiveOut");
  if (!btn || !out) return;

  if (!LAST_SCORES){
    out.style.display = "block";
    out.innerHTML = `<div class="ddCards"><div class="ddCard"><div class="ddText">Bitte zuerst Quick Scan auswerten.</div></div></div>`;
    return;
  }

  const weakest = weakestVars(LAST_SCORES, 2);
  const isBiz = (DEEPDIVE_MODE === "business");
  const token = getBusinessToken();

  if (isBiz && !token){
    setDeepDiveStatus("Business benötigt einen Token.", "err");
    out.style.display = "block";
    out.innerHTML = `<div class="ddCards"><div class="ddCard"><div class="ddText">Bitte Token eingeben.</div></div></div>`;
    return;
  }

  const endpoint = isBiz ? "/deepdive-business" : "/deepdive";
  const headers = { "Content-Type": "application/json" };
  if (isBiz) headers["X-Token"] = token;

  const payload = { language:"de", scores: LAST_SCORES, weakest, mode: DEEPDIVE_MODE };

  try{
    setDeepDiveStatus("");
    btn.disabled = true;
    btn.textContent = "…denke nach";

    const resp = await fetch(`${WORKER_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(()=> ({}));

    if (!resp.ok || !data.ok){
      const code = data?.error || `HTTP_${resp.status}`;
      if (code === "TOKEN_REQUIRED") setDeepDiveStatus("Business benötigt einen Token.", "err");
      else if (code === "TOKEN_INVALID") setDeepDiveStatus("Token ungültig.", "err");
      else if (code === "TOKEN_EXHAUSTED") setDeepDiveStatus("Token aufgebraucht.", "err");
      else setDeepDiveStatus(`Fehler: ${code}`, "err");
      throw new Error(code);
    }

    setDeepDiveStatus(isBiz ? "Business Deep Dive freigeschaltet." : "Privat Deep Dive erzeugt.", "ok");
    renderDeepDiveTextAsCards(data.text || data.output || data.result || "", weakest);

  } catch(e){
    out.style.display = "block";
    out.innerHTML = `<div class="ddCards"><div class="ddCard"><div class="ddText">Fehler: ${escapeHTML(String(e.message||e))}</div></div></div>`;
  } finally{
    btn.disabled = false;
    btn.textContent = "Stabilisierende Indikation erzeugen";
  }
}

// ---------- Evaluate / Reset ----------
async function onEvaluate(){
  hideErrorBox();

  const collected = collectAnswersByVar();
  if (!collected.ok){
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
  renderTimewin();
  renderDeepDiveLocal(scores, 3);

  if (el("deepDiveOut")){
    el("deepDiveOut").innerHTML = "";
    el("deepDiveOut").style.display = "none";
  }
  setDeepDiveStatus("");
}

function onReset(){
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);

  el("results")?.classList.add("hidden");
  el("plot3d") && (el("plot3d").innerHTML = "");
  el("bars") && (el("bars").innerHTML = "");
  el("weakest") && (el("weakest").innerHTML = "");
  el("timewin") && (el("timewin").innerHTML = "");
  el("deepDive") && (el("deepDive").innerHTML = "");
  if (el("deepDiveOut")){
    el("deepDiveOut").innerHTML = "";
    el("deepDiveOut").style.display = "none";
  }

  LAST_SCORES = null;
  setDeepDiveStatus("");
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  buildQuestions();
  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);

  el("modePrivate")?.addEventListener("click", () => setDeepDiveMode("private"));
  el("modeBusiness")?.addEventListener("click", () => setDeepDiveMode("business"));

  el("tokenClear")?.addEventListener("click", () => {
    const inp = el("tokenInput");
    if (inp) inp.value = "";
    setDeepDiveStatus("");
  });

  setDeepDiveMode("private");
});
