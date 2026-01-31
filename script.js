// ------------------------------------------------------------
// Robustheit (mobil): "Script error" abfangen statt White Screen
// ------------------------------------------------------------
window.addEventListener("error", (e) => {
  const box = document.getElementById("statusBox");
  if (box) {
    box.textContent = "Hinweis: Ein Skript-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).";
    box.style.display = "block";
  }
  console.warn("Global error caught:", e?.message || e);
});

// ------------------------------------------------------------
// Modell: 8 Variablen (Reihenfolge wie von dir festgelegt)
// ------------------------------------------------------------
const VARIABLES = [
  { key: "freiheit", label: "Freiheit" },
  { key: "gerechtigkeit", label: "Gerechtigkeit" },
  { key: "effizienz", label: "Effizienz" },
  { key: "wahrheit", label: "Wahrheit" },
  { key: "harmonie", label: "Harmonie" },
  { key: "mittel", label: "Mittel" },
  { key: "handlungsspielraum", label: "Handlungsspielraum" },
  { key: "balance", label: "Balance" },
];

// ------------------------------------------------------------
// Antworten: exakt 3 Optionen (0.2 / 0.5 / 0.8)
// ------------------------------------------------------------
const ANSWERS = [
  { value: 0.2, label: "unklar / schwach" },
  { value: 0.5, label: "teils / gemischt" },
  { value: 0.8, label: "klar / stark" },
];

// ------------------------------------------------------------
// Fragen: 24 (3 pro Variable)
// -> Du kannst Texte später leicht austauschen (nur Strings)
// ------------------------------------------------------------
const QUESTIONS = [
  // Freiheit
  { v: "freiheit", t: "Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
  { v: "freiheit", t: "Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
  { v: "freiheit", t: "Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },

  // Gerechtigkeit
  { v: "gerechtigkeit", t: "Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
  { v: "gerechtigkeit", t: "Werden Konflikte so geklärt, dass sich niemand dauerhaft übergangen fühlt?" },
  { v: "gerechtigkeit", t: "Fühlt sich Anerkennung (Respekt, Zeit, Aufmerksamkeit) bei euch grundsätzlich gerecht an?" },

  // Effizienz
  { v: "effizienz", t: "Werden Probleme bei euch eher praktisch gelöst als endlos diskutiert?" },
  { v: "effizienz", t: "Gelingt es, Pläne umzusetzen, ohne dass dabei Beziehungen leiden?" },
  { v: "effizienz", t: "Wie oft führt „Optimierung“ bei euch zu Stress statt Entlastung?" },

  // Wahrheit
  { v: "wahrheit", t: "Werden schwierige Themen bei euch offen angesprochen, statt umgangen?" },
  { v: "wahrheit", t: "Kannst du ehrlich sein, ohne dass es sofort eskaliert?" },
  { v: "wahrheit", t: "Wie zuverlässig stimmen Worte und Taten in deinem Umfeld überein?" },

  // Harmonie
  { v: "harmonie", t: "Fühlst du dich in deinem Alltag emotional eher getragen als ausgelaugt?" },
  { v: "harmonie", t: "Gibt es in deinem Umfeld spürbar mehr Ruhe als Spannung?" },
  { v: "harmonie", t: "Kannst du dich erholen, ohne dass sofort neue Konflikte entstehen?" },

  // Mittel
  { v: "mittel", t: "Hast du ausreichend Ressourcen (Zeit, Geld, Energie), um stabil zu handeln?" },
  { v: "mittel", t: "Wie oft führen fehlende Mittel bei euch zu Streit oder Druck?" },
  { v: "mittel", t: "Kannst du Mittel so einsetzen, dass sie wirklich entlasten (statt nur kurzfristig)?" },

  // Handlungsspielraum
  { v: "handlungsspielraum", t: "Gibt es bei euch realistische Optionen, wenn etwas schief läuft?" },
  { v: "handlungsspielraum", t: "Könnt ihr Regeln/Strukturen anpassen, ohne dass jemand blockiert?" },
  { v: "handlungsspielraum", t: "Wie oft fühlst du dich in einer Lage, in der du gar nichts tun kannst?" },

  // Balance
  { v: "balance", t: "Halten sich Geben und Nehmen in deinen Beziehungen ungefähr die Waage?" },
  { v: "balance", t: "Werden Freiheit und Grenzen so gesetzt, dass beides tragbar bleibt?" },
  { v: "balance", t: "Ist das Gesamtsystem für dich eher stabil als fragil?" },
];

// ------------------------------------------------------------
// Zeitfenster-Hinweise (vereinfachte, praktische Deutung)
// ------------------------------------------------------------
const TIMEWINDOW = {
  harmonie: "Harmonie wirkt sofort – wächst langsam. Intervention: kleine, sichere Schritte jetzt; Geduld bei Aufbau.",
  wahrheit: "Wahrheit wirkt verzögert – erschüttert schnell. Intervention: vorbereiten, dosieren, klarer Rahmen statt „alles auf einmal“.",
  balance: "Balance entsteht langsam – bricht schnell. Intervention: keine Schnellschüsse; zuerst Spannungen entladen, dann neu austarieren.",
  handlungsspielraum: "Handlungsspielraum muss früh kommen – wirkt lange. Intervention: Optionen sofort schaffen (Plan A/B), bevor du diskutierst.",
  gerechtigkeit: "Gerechtigkeit wirkt spät – aber tief. Intervention: Konsequenzen sauber setzen, aber erst nachdem Stabilität gesichert ist.",
  effizienz: "Effizienz wirkt schnell – verschleißt. Intervention: nur begrenzt optimieren; Pausen/Reserven bewusst einplanen.",
  mittel: "Mittel wirken sofort – aber instabil. Intervention: kurzfristig helfen sie, langfristig braucht es Struktur & Grenzen.",
  freiheit: "Freiheit wirkt sofort – kann gefährlich sein. Intervention: Freiheit dosieren + klare Leitplanken, sonst Chaos/Überforderung."
};

// ------------------------------------------------------------
// UI Boot
// ------------------------------------------------------------
const formArea = document.getElementById("formArea");
const btnEvaluate = document.getElementById("btnEvaluate");
const btnReset = document.getElementById("btnReset");
const results = document.getElementById("results");
const barsEl = document.getElementById("bars");
const weakestEl = document.getElementById("weakest");
const timeWindowEl = document.getElementById("timeWindow");

buildForm();

btnEvaluate.addEventListener("click", () => {
  const data = readAnswers();
  if (!data.ok) {
    showStatus("Bitte beantworte alle Fragen, bevor du auswertest.");
    return;
  }
  hideStatus();
  const score = computeScores(data.answers);
  renderBars(score.perVar);
  renderWeakest(score.weakest);
  renderTimeWindow(score.weakest);
  drawCoordinateSystem(score.perVar);
  results.style.display = "block";
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

btnReset.addEventListener("click", () => {
  document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
  results.style.display = "none";
  hideStatus();
});

// ------------------------------------------------------------
// Form Builder
// ------------------------------------------------------------
function buildForm(){
  formArea.innerHTML = "";
  QUESTIONS.forEach((q, idx) => {
    const box = document.createElement("div");
    box.className = "q";

    const top = document.createElement("div");
    top.className = "qTop";

    const title = document.createElement("p");
    title.className = "qTitle";
    title.textContent = q.t;

    const meta = document.createElement("div");
    meta.className = "qMeta";
    meta.textContent = `${idx+1}/24 · ${labelOf(q.v)}`;

    top.appendChild(title);
    top.appendChild(meta);

    const opts = document.createElement("div");
    opts.className = "opts";

    ANSWERS.forEach((a) => {
      const lab = document.createElement("label");
      lab.className = "opt";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q_${idx}`;
      input.value = a.value;

      const span = document.createElement("span");
      span.textContent = a.label;

      lab.appendChild(input);
      lab.appendChild(span);
      opts.appendChild(lab);
    });

    box.appendChild(top);
    box.appendChild(opts);
    formArea.appendChild(box);
  });
}

function labelOf(key){
  return (VARIABLES.find(v => v.key === key)?.label) || key;
}

// ------------------------------------------------------------
// Read + Compute
// ------------------------------------------------------------
function readAnswers(){
  const answers = [];
  for (let i=0; i<QUESTIONS.length; i++){
    const selected = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!selected) return { ok:false };
    answers.push({ var: QUESTIONS[i].v, val: Number(selected.value) });
  }
  return { ok:true, answers };
}

function computeScores(ans){
  const per = {};
  VARIABLES.forEach(v => per[v.key] = []);
  ans.forEach(a => per[a.var].push(a.val));

  const perVar = {};
  VARIABLES.forEach(v => {
    const arr = per[v.key];
    const avg = arr.reduce((s,x)=>s+x,0) / arr.length;
    perVar[v.key] = round2(avg);
  });

  let weakest = VARIABLES[0].key;
  VARIABLES.forEach(v => {
    if (perVar[v.key] < perVar[weakest]) weakest = v.key;
  });

  return { perVar, weakest };
}

function round2(n){ return Math.round(n*100)/100; }

// ------------------------------------------------------------
// Render: Bars, Weakest, TimeWindow
// ------------------------------------------------------------
function renderBars(perVar){
  barsEl.innerHTML = "";
  VARIABLES.forEach(v => {
    const val = perVar[v.key];
    const row = document.createElement("div");
    row.className = "barRow";

    const name = document.createElement("div");
    name.className = "barName";
    name.textContent = v.label;

    const track = document.createElement("div");
    track.className = "barTrack";

    const fill = document.createElement("div");
    fill.className = "barFill";
    fill.style.width = `${Math.round(val*100)}%`;

    track.appendChild(fill);

    const out = document.createElement("div");
    out.className = "barVal";
    out.textContent = val.toFixed(2);

    row.appendChild(name);
    row.appendChild(track);
    row.appendChild(out);

    barsEl.appendChild(row);
  });
}

function renderWeakest(weakKey){
  const label = labelOf(weakKey);
  weakestEl.innerHTML =
    `<strong>${label}</strong> ist aktuell der schwächste Punkt (Ansatzpunkt).<br>` +
    `Wenn du stabilisieren willst, beginne dort: kleine Interventionen, die diese Variable entlasten – ohne die anderen zu überfordern.`;
}

function renderTimeWindow(weakKey){
  const txt = TIMEWINDOW[weakKey] || "Zeitfenster: Für diese Variable liegt kein Hinweis vor.";
  timeWindowEl.innerHTML = `<strong>${labelOf(weakKey)}</strong><br>${txt}`;
}

// ------------------------------------------------------------
// Plot: Koordinatensystem (Vanilla Canvas)
// Idee: 8 Achsen als „Radar-ähnliches“ Koordinatensystem + Punkte
// (Du wolltest 3D – ohne Library ist echtes 3D unnötig fragil.
//  Das hier ist die stabile, „funktional starke“ Variante.)
// ------------------------------------------------------------
function drawCoordinateSystem(perVar){
  const c = document.getElementById("plot");
  const ctx = c.getContext("2d");

  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  // Hintergrund
  ctx.fillStyle = "#0a0b10";
  ctx.fillRect(0,0,W,H);

  const cx = W/2, cy = H/2;
  const R = Math.min(W,H)*0.36;

  // Gitter (Kreise)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  [0.25,0.5,0.75,1.0].forEach(k=>{
    ctx.beginPath();
    ctx.arc(cx,cy,R*k,0,Math.PI*2);
    ctx.stroke();
  });

  // Achsen
  const n = VARIABLES.length;
  for (let i=0;i<n;i++){
    const a = (Math.PI*2)*(i/n) - Math.PI/2;
    const x = cx + Math.cos(a)*R;
    const y = cy + Math.sin(a)*R;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(x,y);
    ctx.stroke();

    // Labels
    const lx = cx + Math.cos(a)*(R+22);
    const ly = cy + Math.sin(a)*(R+22);
    ctx.fillStyle = "rgba(230,234,245,0.9)";
    ctx.font = "12px system-ui";
    ctx.textAlign = (Math.cos(a) > 0.2) ? "left" : (Math.cos(a) < -0.2 ? "right" : "center");
    ctx.textBaseline = (Math.sin(a) > 0.2) ? "top" : (Math.sin(a) < -0.2 ? "bottom" : "middle");
    ctx.fillText(VARIABLES[i].label, lx, ly);
  }

  // Polygon (dein Zustand)
  ctx.beginPath();
  for (let i=0;i<n;i++){
    const key = VARIABLES[i].key;
    const v = perVar[key]; // 0.2..0.8
    const a = (Math.PI*2)*(i/n) - Math.PI/2;
    const rr = R * v;
    const x = cx + Math.cos(a)*rr;
    const y = cy + Math.sin(a)*rr;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(231,231,231,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(231,231,231,0.65)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Punkte
  for (let i=0;i<n;i++){
    const key = VARIABLES[i].key;
    const v = perVar[key];
    const a = (Math.PI*2)*(i/n) - Math.PI/2;
    const rr = R * v;
    const x = cx + Math.cos(a)*rr;
    const y = cy + Math.sin(a)*rr;

    ctx.beginPath();
    ctx.arc(x,y,4.2,0,Math.PI*2);
    ctx.fillStyle = "rgba(231,231,231,0.95)";
    ctx.fill();
  }

  // Zentrum
  ctx.beginPath();
  ctx.arc(cx,cy,3,0,Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();
}

// ------------------------------------------------------------
// Status helper
// ------------------------------------------------------------
function showStatus(msg){
  const box = document.getElementById("statusBox");
  if (!box) return;
  box.textContent = msg;
  box.style.display = "block";
}
function hideStatus(){
  const box = document.getElementById("statusBox");
  if (!box) return;
  box.style.display = "none";
}
