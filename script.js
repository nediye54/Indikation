// ===== IDG MVP (ohne OpenAI) =====
// 3 Antwortoptionen: unklar / gemischt / klar -> 0.2 / 0.5 / 0.8
const SCALE = { 0: 0.2, 1: 0.5, 2: 0.8 };

const MODEL = [
  { key:"freiheit", title:"Freiheit", qs:[
    "Kannst du Nein sagen, ohne Angst vor Konsequenzen?",
    "Kannst du Entscheidungen treffen, ohne dass dir konstant reingeredet wird?",
    "Lebst du eher nach eigenen Werten als nach Erwartungen anderer?"
  ]},
  { key:"gerechtigkeit", title:"Gerechtigkeit", qs:[
    "Fühlt sich die Verteilung von Last und Nutzen überwiegend fair an?",
    "Werden Fehler dort getragen, wo sie verursacht werden?",
    "Werden Regeln/Entscheidungen konsistent angewendet (nicht willkürlich)?"
  ]},
  { key:"wahrheit", title:"Wahrheit", qs:[
    "Werden Probleme früh benannt statt verschoben?",
    "Ist das Gesagte überwiegend verlässlich (wenig Taktik, wenig Verzerrung)?",
    "Gibt es Klarheit darüber, was wirklich der Fall ist?"
  ]},
  { key:"harmonie", title:"Harmonie", qs:[
    "Bleibt Respekt im Ton – auch wenn es knallt?",
    "Entsteht nach Konflikt wieder Verbindung (statt Eiszeit)?",
    "Werden Unterschiede gehalten, ohne dass es eskaliert?"
  ]},
  { key:"mittel", title:"Mittel", qs:[
    "Sind Zeit/Energie/Geld aktuell eher ausreichend als knapp?",
    "Gibt es Reserven, falls etwas schiefgeht?",
    "Kannst du mit dem Vorhandenen real handeln (statt nur reagieren)?"
  ]},
  { key:"effizienz", title:"Effizienz", qs:[
    "Führt Aufwand bei dir/meinem System meistens zu Wirkung?",
    "Werden Konflikte gelöst, ohne dass alles unnötig teuer wird (Zeit/Nerven)?",
    "Ist der Alltag eher klar als zäh (wenig Reibungsverlust)?"
  ]},
  { key:"handlungsspielraum", title:"Handlungsspielraum", qs:[
    "Hast du reale Optionen (mehr als nur Pflichten)?",
    "Kannst du einen Kurs ändern, wenn du merkst, es kippt?",
    "Gibt es Alternativen, wenn ein Weg blockiert ist?"
  ]},
  { key:"balance", title:"Balance", qs:[
    "Kompensieren sich Spannungen – oder stapeln sie sich?",
    "Fühlst du dich überwiegend getragen statt gekippt?",
    "Ist dein Zustand eher stabil als fragil?"
  ]}
];

const OPTS = [
  { label:"Eher unklar / instabil", v:0 },
  { label:"Gemischt / schwankend", v:1 },
  { label:"Eher klar / stabil", v:2 }
];

const formEl = document.getElementById("form");
const resEl = document.getElementById("result");

function renderForm() {
  formEl.innerHTML = "";
  MODEL.forEach((m, mi) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="vtitle">${mi+1}. ${m.title}</div>`;
    m.qs.forEach((q, qi) => {
      const name = `${m.key}_${qi}`;
      const wrap = document.createElement("div");
      wrap.className = "q";
      wrap.innerHTML = `<div>${q}</div>`;
      const opts = document.createElement("div");
      opts.className = "opts";
      OPTS.forEach((o) => {
        const id = `${name}_${o.v}`;
        const lab = document.createElement("label");
        lab.setAttribute("for", id);
        lab.innerHTML = `
          <input id="${id}" type="radio" name="${name}" value="${o.v}">
          <span>${o.label}</span>
        `;
        opts.appendChild(lab);
      });
      wrap.appendChild(opts);
      card.appendChild(wrap);
    });
    formEl.appendChild(card);
  });
}

function getAnswersOrThrow() {
  const scores = {};
  for (const m of MODEL) {
    let sum = 0;
    for (let qi = 0; qi < m.qs.length; qi++) {
      const name = `${m.key}_${qi}`;
      const chosen = document.querySelector(`input[name="${name}"]:checked`);
      if (!chosen) throw new Error(`Bitte beantworte alle Fragen. (Fehlt: ${m.title})`);
      sum += SCALE[Number(chosen.value)];
    }
    scores[m.key] = sum / m.qs.length; // 0.2..0.8
  }
  return scores;
}

function avg(obj) {
  const vals = Object.values(obj);
  return vals.reduce((a,b)=>a+b,0) / vals.length;
}

function labelState(gq) {
  if (gq < 0.40) return "instabil";
  if (gq < 0.65) return "im Übergang";
  return "stabil";
}

function weakestStrongest(scores) {
  const entries = Object.entries(scores).sort((a,b)=>a[1]-b[1]);
  return { weakest: entries[0], strongest: entries[entries.length-1] };
}

function prettyKey(k) {
  const found = MODEL.find(x=>x.key===k);
  return found ? found.title : k;
}

function stabilizingIndication(scores) {
  const { weakest, strongest } = weakestStrongest(scores);
  const w = weakest[0], s = strongest[0];
  // bewusst simpel (MVP): Hebel = schwächste Variable, Ressource = stärkste Variable
  return {
    weakest: prettyKey(w),
    strongest: prettyKey(s),
    text:
`Nutze ${prettyKey(s)} als Ressource, um ${prettyKey(w)} zu entlasten.

Mini-Intervention (24h):
Wähle heute eine einzige Situation, in der ${prettyKey(w)} typischerweise kippt – und setze dort bewusst einen kleinen Schritt, der ${prettyKey(s)} auf die Wirkung ausrichtet.

Wichtig:
Nicht „perfekt“ werden. Nur stabiler.`
  };
}

function renderResult(scores) {
  const gq = avg(scores);
  const state = labelState(gq);
  const ind = stabilizingIndication(scores);

  const rows = Object.entries(scores).map(([k,v]) => {
    const pct = Math.round((v / 0.8) * 100);
    return `
      <div class="row">
        <div class="k">${prettyKey(k)}</div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="small">${v.toFixed(2)}</div>
      </div>
    `;
  }).join("");

  resEl.innerHTML = `
    <div class="k">Gleichgewicht (GQ): ${gq.toFixed(2)} → <b>${state}</b></div>
    <div class="small">Skala: 0.2 (unklar) · 0.5 (gemischt) · 0.8 (klar)</div>
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0;" />
    ${rows}
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0;" />
    <div class="k">Stabilisierende Indikation</div>
    <div class="small">Schwächste Variable: <b>${ind.weakest}</b> · Ressource: <b>${ind.strongest}</b></div>
    <pre style="white-space:pre-wrap;font-family:inherit;margin-top:10px;">${ind.text}</pre>
  `;
  resEl.style.display = "block";
  resEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("btnEval").addEventListener("click", () => {
  try {
    const scores = getAnswersOrThrow();
    renderResult(scores);
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById("btnReset").addEventListener("click", () => {
  document.querySelectorAll("input[type=radio]").forEach(r=>r.checked=false);
  resEl.style.display = "none";
  resEl.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderForm();
