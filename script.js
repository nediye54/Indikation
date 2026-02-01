// vX — i18n + stable var-ids + deepdive language passthrough
const WORKER_BASE = "https://mdg-indikation-api.selim-87-cfe.workers.dev";

// ---------------- i18n ----------------
const I18N = {
  de: {
    ui: {
      quickScan: "Quick Scan",
      answerHint: "Beantworte jede Frage mit einer von drei Optionen. Danach erhältst du:",
      resultHint: "Koordinatensystem (3D-Look), Balken, schwächste Variable, Zeitfenster.",
      eval: "Auswerten",
      reset: "Zurücksetzen",
      errorReload: "Hinweis: Ein Script-Fehler wurde abgefangen. Bitte Seite neu laden (ggf. privater Modus).",
      missing: "Bitte beantworte alle Fragen. Fehlend:",
      deepDiveBtn: "Stabilisierende Indikation erzeugen",
      thinking: "…denke nach",
      ddNeedScan: "Bitte zuerst Quick Scan auswerten.",
      ddNoOutput: "(keine Ausgabe)"
    },
    scale: [
      { label: "unklar / schwach", value: 0.2 },
      { label: "teils / gemischt", value: 0.5 },
      { label: "klar / stark", value: 0.8 }
    ],
    vars: {
      freedom: "Freiheit",
      justice: "Gerechtigkeit",
      truth: "Wahrheit",
      harmony: "Harmonie",
      efficiency: "Effizienz",
      agency: "Handlungsspielraum",
      means: "Mittel",
      balance: "Balance"
    },
    questions: [
      // freedom
      { v:"freedom", q:"Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
      { v:"freedom", q:"Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
      { v:"freedom", q:"Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },
      // justice
      { v:"justice", q:"Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
      { v:"justice", q:"Gibt es Regeln, die für manche gelten und für andere nicht?" },
      { v:"justice", q:"Fühlst du dich in Entscheidungen, die dich betreffen, ausreichend berücksichtigt?" },
      // truth
      { v:"truth", q:"Werden Probleme offen benannt, auch wenn es unangenehm ist?" },
      { v:"truth", q:"Kannst du Kritik ansprechen, ohne dass sofort Abwehr oder Schuldzuweisung entsteht?" },
      { v:"truth", q:"Gibt es Themen, die „nicht gesagt werden dürfen“, obwohl alle sie spüren?" },
      // harmony
      { v:"harmony", q:"Gibt es in deinem Alltag Phasen von Ruhe, in denen du innerlich „runterkommst“?" },
      { v:"harmony", q:"Werden Konflikte so gelöst, dass danach wieder Nähe/Respekt möglich ist?" },
      { v:"harmony", q:"Fühlst du dich mit anderen grundsätzlich verbunden statt dauerhaft im Wettkampf?" },
      // efficiency
      { v:"efficiency", q:"Führt dein Aufwand meistens zu klaren Ergebnissen?" },
      { v:"efficiency", q:"Gibt es unnötige Schleifen, Wiederholungen oder chaotische Zuständigkeiten?" },
      { v:"efficiency", q:"Kannst du dich gut fokussieren, ohne ständig von „Feuerwehr-Themen“ abgelenkt zu werden?" },
      // agency
      { v:"agency", q:"Hast du realistische Optionen, Dinge zu verändern, wenn etwas nicht passt?" },
      { v:"agency", q:"Kannst du „Nein“ sagen, ohne echte Nachteile befürchten zu müssen?" },
      { v:"agency", q:"Gibt es Ressourcen/Unterstützung, die du aktiv nutzen kannst?" },
      // means
      { v:"means", q:"Reichen deine verfügbaren Mittel (Zeit, Geld, Energie) für das, was erwartet wird?" },
      { v:"means", q:"Gibt es Engpässe, die regelmäßig Stress oder Konflikte auslösen?" },
      { v:"means", q:"Sind Mittel so verteilt, dass das System nicht „ausblutet“ (z.B. dauerhaftes Überziehen)?" },
      // balance
      { v:"balance", q:"Ist die Balance zwischen Geben und Nehmen in deinem Umfeld stimmig?" },
      { v:"balance", q:"Gibt es Extrem-Ausschläge (zu viel Kontrolle / zu viel Chaos)?" },
      { v:"balance", q:"Fühlst du dich insgesamt „im Gleichgewicht“, auch wenn nicht alles perfekt ist?" }
    ]
  },

  en: {
    ui: {
      quickScan: "Quick Scan",
      answerHint: "Answer each question with one of three options. Then you get:",
      resultHint: "Radar (3D look), bars, weakest variable, time window.",
      eval: "Evaluate",
      reset: "Reset",
      errorReload: "Note: A script error was caught. Please reload the page (try private mode).",
      missing: "Please answer all questions. Missing:",
      deepDiveBtn: "Generate stabilizing guidance",
      thinking: "…thinking",
      ddNeedScan: "Please evaluate the Quick Scan first.",
      ddNoOutput: "(no output)"
    },
    scale: [
      { label: "unclear / weak", value: 0.2 },
      { label: "mixed / partial", value: 0.5 },
      { label: "clear / strong", value: 0.8 }
    ],
    vars: {
      freedom: "Freedom",
      justice: "Justice",
      truth: "Truth",
      harmony: "Harmony",
      efficiency: "Efficiency",
      agency: "Agency",
      means: "Resources",
      balance: "Balance"
    },
    questions: [
      { v:"freedom", q:"How free are you to make everyday decisions without fear of consequences?" },
      { v:"freedom", q:"How often do you feel trapped in roles or expectations you didn’t choose?" },
      { v:"freedom", q:"Can you set boundaries without feeling guilt or pressure afterwards?" },

      { v:"justice", q:"Are burdens and benefits generally distributed fairly in your environment?" },
      { v:"justice", q:"Are there rules that apply to some people but not to others?" },
      { v:"justice", q:"Do you feel sufficiently considered in decisions that affect you?" },

      { v:"truth", q:"Are problems named openly, even when it’s uncomfortable?" },
      { v:"truth", q:"Can you voice criticism without immediate defensiveness or blame?" },
      { v:"truth", q:"Are there topics that ‘must not be said’ even though everyone senses them?" },

      { v:"harmony", q:"Do you have moments of calm in which you can truly wind down?" },
      { v:"harmony", q:"Are conflicts resolved in a way that restores closeness and respect?" },
      { v:"harmony", q:"Do you feel connected with others rather than constantly competing?" },

      { v:"efficiency", q:"Does your effort usually lead to clear outcomes?" },
      { v:"efficiency", q:"Are there unnecessary loops, repetition, or chaotic responsibilities?" },
      { v:"efficiency", q:"Can you focus well without being constantly pulled into ‘firefighting’?" },

      { v:"agency", q:"Do you have realistic options to change things when something doesn’t fit?" },
      { v:"agency", q:"Can you say ‘no’ without fearing real disadvantages?" },
      { v:"agency", q:"Do you have resources/support you can actively use?" },

      { v:"means", q:"Are your available resources (time, money, energy) enough for what’s expected?" },
      { v:"means", q:"Are there bottlenecks that regularly trigger stress or conflict?" },
      { v:"means", q:"Are resources distributed so the system doesn’t ‘bleed out’ over time?" },

      { v:"balance", q:"Is the balance between giving and receiving in your environment sound?" },
      { v:"balance", q:"Are there extreme swings (too much control / too much chaos)?" },
      { v:"balance", q:"Overall, do you feel ‘balanced’, even if not everything is perfect?" }
    ]
  },

  fr: {
    ui: {
      quickScan: "Scan rapide",
      answerHint: "Réponds à chaque question avec l’une des trois options. Ensuite tu obtiens :",
      resultHint: "Radar (style 3D), barres, variable la plus faible, fenêtre temporelle.",
      eval: "Évaluer",
      reset: "Réinitialiser",
      errorReload: "Note : une erreur de script a été interceptée. Recharge la page (mode privé si besoin).",
      missing: "Merci de répondre à toutes les questions. Manquantes :",
      deepDiveBtn: "Générer une indication stabilisante",
      thinking: "…réflexion",
      ddNeedScan: "Évalue d’abord le Scan rapide.",
      ddNoOutput: "(aucune sortie)"
    },
    scale: [
      { label: "flou / faible", value: 0.2 },
      { label: "mitigé", value: 0.5 },
      { label: "clair / fort", value: 0.8 }
    ],
    vars: {
      freedom: "Liberté",
      justice: "Justice",
      truth: "Vérité",
      harmony: "Harmonie",
      efficiency: "Efficacité",
      agency: "Marge d’action",
      means: "Ressources",
      balance: "Équilibre"
    },
    questions: [
      { v:"freedom", q:"Dans ton quotidien, à quel point peux-tu décider librement sans crainte des conséquences ?" },
      { v:"freedom", q:"À quelle fréquence te sens-tu coincé·e dans des rôles ou attentes que tu n’as pas choisis ?" },
      { v:"freedom", q:"Peux-tu poser des limites sans culpabilité ni pression ensuite ?" },

      { v:"justice", q:"Les charges et avantages sont-ils globalement répartis de manière juste ?" },
      { v:"justice", q:"Y a-t-il des règles qui s’appliquent à certain·e·s mais pas à d’autres ?" },
      { v:"justice", q:"Te sens-tu suffisamment pris·e en compte dans les décisions qui te concernent ?" },

      { v:"truth", q:"Les problèmes sont-ils nommés ouvertement, même si c’est inconfortable ?" },
      { v:"truth", q:"Peux-tu exprimer une critique sans réaction défensive ou accusation immédiate ?" },
      { v:"truth", q:"Existe-t-il des sujets ‘interdits’ alors que tout le monde les ressent ?" },

      { v:"harmony", q:"As-tu des moments de calme où tu peux vraiment redescendre ?" },
      { v:"harmony", q:"Les conflits se résolvent-ils de façon à retrouver proximité et respect ?" },
      { v:"harmony", q:"Te sens-tu relié·e aux autres plutôt qu’en compétition permanente ?" },

      { v:"efficiency", q:"Ton effort mène-t-il le plus souvent à des résultats clairs ?" },
      { v:"efficiency", q:"Y a-t-il des boucles inutiles, répétitions ou responsabilités chaotiques ?" },
      { v:"efficiency", q:"Peux-tu rester concentré·e sans être constamment happé·e par l’urgence ?" },

      { v:"agency", q:"As-tu des options réalistes pour changer les choses quand ça ne convient pas ?" },
      { v:"agency", q:"Peux-tu dire ‘non’ sans craindre de réels désavantages ?" },
      { v:"agency", q:"As-tu des ressources/soutiens que tu peux mobiliser activement ?" },

      { v:"means", q:"Tes ressources (temps, argent, énergie) suffisent-elles pour ce qui est attendu ?" },
      { v:"means", q:"Y a-t-il des goulots d’étranglement qui déclenchent régulièrement stress ou conflits ?" },
      { v:"means", q:"Les ressources sont-elles réparties pour éviter l’épuisement chronique du système ?" },

      { v:"balance", q:"L’équilibre entre donner et recevoir est-il sain autour de toi ?" },
      { v:"balance", q:"Y a-t-il des extrêmes (trop de contrôle / trop de chaos) ?" },
      { v:"balance", q:"Globalement, te sens-tu ‘en équilibre’, même si tout n’est pas parfait ?" }
    ]
  },

  es: {
    ui: {
      quickScan: "Escaneo rápido",
      answerHint: "Responde cada pregunta con una de tres opciones. Después obtendrás:",
      resultHint: "Radar (look 3D), barras, variable más débil, ventana de tiempo.",
      eval: "Evaluar",
      reset: "Restablecer",
      errorReload: "Nota: se detectó un error de script. Recarga la página (modo privado si hace falta).",
      missing: "Por favor responde todas las preguntas. Faltan:",
      deepDiveBtn: "Generar indicación estabilizadora",
      thinking: "…pensando",
      ddNeedScan: "Primero evalúa el Escaneo rápido.",
      ddNoOutput: "(sin salida)"
    },
    scale: [
      { label: "incierto / débil", value: 0.2 },
      { label: "mixto", value: 0.5 },
      { label: "claro / fuerte", value: 0.8 }
    ],
    vars: {
      freedom: "Libertad",
      justice: "Justicia",
      truth: "Verdad",
      harmony: "Armonía",
      efficiency: "Eficiencia",
      agency: "Margen de acción",
      means: "Recursos",
      balance: "Equilibrio"
    },
    questions: [
      { v:"freedom", q:"¿Qué tan libre eres para tomar decisiones diarias sin temor a consecuencias?" },
      { v:"freedom", q:"¿Con qué frecuencia te sientes atrapado/a en roles o expectativas que no elegiste?" },
      { v:"freedom", q:"¿Puedes poner límites sin sentir culpa o presión después?" },

      { v:"justice", q:"¿Se reparten de forma justa las cargas y los beneficios en tu entorno?" },
      { v:"justice", q:"¿Hay reglas que aplican para unos y no para otros?" },
      { v:"justice", q:"¿Te sientes suficientemente considerado/a en decisiones que te afectan?" },

      { v:"truth", q:"¿Se nombran los problemas abiertamente, incluso si es incómodo?" },
      { v:"truth", q:"¿Puedes expresar críticas sin que haya defensa o culpa inmediata?" },
      { v:"truth", q:"¿Hay temas que ‘no se pueden decir’ aunque todos los perciban?" },

      { v:"harmony", q:"¿Tienes momentos de calma en los que realmente puedes bajar revoluciones?" },
      { v:"harmony", q:"¿Se resuelven los conflictos de forma que se recupere cercanía y respeto?" },
      { v:"harmony", q:"¿Te sientes conectado/a con otros en vez de competir constantemente?" },

      { v:"efficiency", q:"¿Tu esfuerzo suele llevar a resultados claros?" },
      { v:"efficiency", q:"¿Hay bucles innecesarios, repeticiones o responsabilidades caóticas?" },
      { v:"efficiency", q:"¿Puedes enfocarte sin que te arrastren siempre las urgencias?" },

      { v:"agency", q:"¿Tienes opciones realistas para cambiar cosas cuando algo no encaja?" },
      { v:"agency", q:"¿Puedes decir ‘no’ sin temer consecuencias reales?" },
      { v:"agency", q:"¿Tienes recursos/apoyo que puedas usar activamente?" },

      { v:"means", q:"¿Tus recursos (tiempo, dinero, energía) alcanzan para lo que se espera?" },
      { v:"means", q:"¿Hay cuellos de botella que generen estrés o conflictos con frecuencia?" },
      { v:"means", q:"¿Se distribuyen los recursos para evitar que el sistema se agote?" },

      { v:"balance", q:"¿El equilibrio entre dar y recibir en tu entorno es sano?" },
      { v:"balance", q:"¿Hay extremos (demasiado control / demasiado caos)?" },
      { v:"balance", q:"En general, ¿te sientes ‘en equilibrio’ aunque no todo sea perfecto?" }
    ]
  },

  tr: {
    ui: {
      quickScan: "Hızlı Tarama",
      answerHint: "Her soruyu üç seçenekten biriyle yanıtla. Sonrasında şunları görürsün:",
      resultHint: "Radar (3D görünüm), çubuklar, en zayıf değişken, zaman penceresi.",
      eval: "Değerlendir",
      reset: "Sıfırla",
      errorReload: "Not: Bir script hatası yakalandı. Lütfen sayfayı yenile (gerekirse gizli mod).",
      missing: "Lütfen tüm soruları cevapla. Eksik:",
      deepDiveBtn: "Dengeleyici yönlendirme üret",
      thinking: "…düşünüyorum",
      ddNeedScan: "Önce Hızlı Tarama’yı değerlendir.",
      ddNoOutput: "(çıktı yok)"
    },
    scale: [
      { label: "belirsiz / zayıf", value: 0.2 },
      { label: "karışık / kısmen", value: 0.5 },
      { label: "net / güçlü", value: 0.8 }
    ],
    vars: {
      freedom: "Özgürlük",
      justice: "Adalet",
      truth: "Hakikat",
      harmony: "Uyum",
      efficiency: "Verimlilik",
      agency: "Hareket alanı",
      means: "Kaynaklar",
      balance: "Denge"
    },
    questions: [
      { v:"freedom", q:"Günlük kararlarını sonuç korkusu olmadan ne kadar özgürce alabiliyorsun?" },
      { v:"freedom", q:"Seçmediğin rol ve beklentilere ne kadar sık sık sıkışmış hissediyorsun?" },
      { v:"freedom", q:"Sınır koyduğunda sonrasında suçluluk ya da baskı hissediyor musun?" },

      { v:"justice", q:"Çevrende yükler ve faydalar genel olarak adil dağıtılıyor mu?" },
      { v:"justice", q:"Bazıları için geçerli olup başkaları için geçerli olmayan kurallar var mı?" },
      { v:"justice", q:"Seni etkileyen kararlarda yeterince dikkate alındığını hissediyor musun?" },

      { v:"truth", q:"Sorunlar rahatsız edici olsa bile açıkça konuşuluyor mu?" },
      { v:"truth", q:"Eleştiri dile getirdiğinde hemen savunma ya da suçlama oluşuyor mu?" },
      { v:"truth", q:"Herkesin hissettiği ama ‘söylenemeyen’ konular var mı?" },

      { v:"harmony", q:"Gün içinde gerçekten sakinleşebildiğin anlar oluyor mu?" },
      { v:"harmony", q:"Çatışmalar, sonrasında yakınlık ve saygıyı geri getirecek şekilde çözülüyor mu?" },
      { v:"harmony", q:"Sürekli rekabet yerine genel olarak bağlılık hissediyor musun?" },

      { v:"efficiency", q:"Çaban çoğunlukla net sonuçlara ulaşıyor mu?" },
      { v:"efficiency", q:"Gereksiz döngüler, tekrarlar veya kaotik sorumluluklar var mı?" },
      { v:"efficiency", q:"Sürekli ‘yangın söndürme’ işleri olmadan odaklanabiliyor musun?" },

      { v:"agency", q:"Bir şey uymadığında değiştirmek için gerçekçi seçeneklerin var mı?" },
      { v:"agency", q:"Gerçek dezavantaj korkusu olmadan ‘hayır’ diyebiliyor musun?" },
      { v:"agency", q:"Aktif kullanabileceğin destek/kaynaklar var mı?" },

      { v:"means", q:"Mevcut kaynakların (zaman, para, enerji) beklentiler için yeterli mi?" },
      { v:"means", q:"Düzenli stres veya çatışma yaratan darboğazlar var mı?" },
      { v:"means", q:"Sistem ‘kan kaybetmesin’ diye kaynaklar sürdürülebilir dağıtılıyor mu?" },

      { v:"balance", q:"Vermek ve almak arasındaki denge genel olarak yerinde mi?" },
      { v:"balance", q:"Aşırı uçlar var mı (fazla kontrol / fazla kaos)?" },
      { v:"balance", q:"Genel olarak ‘dengede’ hissediyor musun, her şey mükemmel olmasa bile?" }
    ]
  }
};

const VAR_IDS = ["freedom","justice","truth","harmony","efficiency","agency","means","balance"];

let CURRENT_LANG = "de";
let LAST_SCORES = null;

const el = (id) => document.getElementById(id);

function t() {
  return I18N[CURRENT_LANG] || I18N.de;
}
function vlabel(varId) {
  return (t().vars && t().vars[varId]) ? t().vars[varId] : varId;
}

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
    if (file.includes("script.js")) showErrorBox(t().ui.errorReload);
  } catch {}
});
window.addEventListener("unhandledrejection", () => {
  showErrorBox(t().ui.errorReload);
});

// --- Build Questions UI ---
function buildQuestions() {
  const host = el("questions");
  if (!host) return;
  host.innerHTML = "";

  const Q = t().questions;
  const SCALE = t().scale;

  Q.forEach((item, idx) => {
    const qWrap = document.createElement("div");
    qWrap.className = "q";

    const top = document.createElement("div");
    top.className = "qTop";

    const left = document.createElement("div");
    left.className = "qIdx";
    left.textContent = `${idx+1}/${Q.length} · ${vlabel(item.v)}`;

    const right = document.createElement("div");
    right.className = "qVar";
    right.textContent = vlabel(item.v);

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
  VAR_IDS.forEach(v => byVar[v] = []);

  const missing = [];
  const Q = t().questions;

  for (let i = 0; i < Q.length; i++) {
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
  VAR_IDS.forEach(v => scores[v] = avg(byVar[v]));
  return scores;
}

function weakestVar(scores) {
  let w = null;
  for (const v of VAR_IDS) {
    const val = scores[v];
    if (w === null || val < w.val) w = { key: v, val };
  }
  return w;
}

function timeWindowFor(value) {
  if (value <= 0.3) return CURRENT_LANG === "de" ? "jetzt (akut) · 24–72h Fokus" : value <= 0.3 ? "now (acute) · focus 24–72h" : "";
  if (value <= 0.55) return CURRENT_LANG === "de" ? "bald · 1–2 Wochen Fokus" : "soon · focus 1–2 weeks";
  return CURRENT_LANG === "de" ? "stabil · nur Feintuning nötig" : "stable · only fine-tuning";
}

// --- Render helpers ---
function renderBars(scores) {
  const host = el("bars");
  if (!host) return;
  host.innerHTML = "";

  for (const v of VAR_IDS) {
    const val = scores[v];
    const row = document.createElement("div");
    row.className = "barRow";

    const name = document.createElement("div");
    name.className = "barName";
    name.textContent = vlabel(v);

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
  host.innerHTML = `<span class="badge">${vlabel(weak.key)}</span> <span class="muted">Score:</span> <strong>${weak.val.toFixed(2)}</strong>`;
}

function renderTimewin(weak) {
  const host = el("timewin");
  if (!host) return;
  host.innerHTML = `<span class="badge">${timeWindowFor(weak.val)}</span>`;
}

// (Dein aktuelles Radar/Koordinatensystem bleibt: wir zeigen nur Labels i18n)
function render3D(scores) {
  const host = el("plot3d");
  if (!host) return;
  host.innerHTML = "";

  const rect = host.getBoundingClientRect();
  const cx = rect.width * 0.5;
  const cy = rect.height * 0.62;
  const R  = Math.min(rect.width, rect.height) * 0.33;

  VAR_IDS.forEach((v, i) => {
    const a = (Math.PI * 2 * i) / VAR_IDS.length;
    const val = scores[v];
    const x = cx + Math.cos(a) * R * (0.72 + val*0.5);
    const y = cy + Math.sin(a) * R * (0.38 + (1-val)*0.35);

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.left = `${x}px`;
    dot.style.top  = `${y}px`;

    const lab = document.createElement("div");
    lab.className = "dotLabel";
    lab.textContent = vlabel(v);

    dot.appendChild(lab);
    host.appendChild(dot);
  });
}

function renderDeepDiveLocal(scores, maxN = 3) {
  const host = el("deepDive") || el("deepDiveOut");
  if (!host) return;
  host.innerHTML = "";

  const list = Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0, maxN);
  list.forEach(([v,val]) => {
    const div = document.createElement("div");
    div.className = "ddItem";
    div.innerHTML = `<span class="badge">${vlabel(v)}</span> <span class="muted">Score:</span> <strong>${val.toFixed(2)}</strong>`;
    host.appendChild(div);
  });
}

// -------------- Deep Dive --------------
function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a,b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k);
}

async function runDeepDive() {
  const deepDiveBtn = el("deepDiveBtn");
  const deepDiveOut = el("deepDiveOut") || el("deepDive");
  const timeframeSel = el("timeframe");

  if (!deepDiveBtn || !deepDiveOut) return;

  if (!LAST_SCORES) {
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = t().ui.ddNeedScan;
    return;
  }

  const timeframe = timeframeSel?.value || "heute";
  const weakest = weakestVars(LAST_SCORES, 2);

  const payload = {
    language: CURRENT_LANG,         // ✅ wichtig
    timeframe,
    scores: LAST_SCORES,
    weakest,
    labels: t().vars                // optional: Worker kann Labels nutzen
  };

  try {
    deepDiveBtn.disabled = true;
    deepDiveBtn.textContent = t().ui.thinking;

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) throw new Error(data?.error || `Worker HTTP ${resp.status}`);

    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = data.text || t().ui.ddNoOutput;
  } catch (e) {
    deepDiveOut.style.display = "block";
    deepDiveOut.textContent = `Fehler: ${String(e.message || e)}`;
  } finally {
    deepDiveBtn.disabled = false;
    deepDiveBtn.textContent = t().ui.deepDiveBtn;
  }
}

// --- Main evaluate ---
async function onEvaluate() {
  hideErrorBox();

  const collected = collectAnswersByVar();
  if (!collected.ok) {
    showErrorBox(`${t().ui.missing} ${collected.missing.slice(0,5).join(", ")}${collected.missing.length>5?"…":""}`);
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
  document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);
  el("results")?.classList.add("hidden");
  el("plot3d") && (el("plot3d").innerHTML = "");
  el("bars") && (el("bars").innerHTML = "");
  el("weakest") && (el("weakest").innerHTML = "");
  el("timewin") && (el("timewin").innerHTML = "");
  const dd = el("deepDive") || el("deepDiveOut");
  if (dd) dd.innerHTML = "";
  LAST_SCORES = null;
}

function applyLanguage(lang) {
  if (!I18N[lang]) lang = "de";
  CURRENT_LANG = lang;

  // Buttontexte direkt setzen, falls vorhanden:
  const deepDiveBtn = el("deepDiveBtn");
  if (deepDiveBtn) deepDiveBtn.textContent = t().ui.deepDiveBtn;

  // Fragen neu bauen
  buildQuestions();

  // Falls Result sichtbar war: zurücksetzen (sauber, sonst mismatch)
  onReset();
}

document.addEventListener("DOMContentLoaded", () => {
  // Sprache aus Selector lesen
  const uiLang = el("uiLang");
  if (uiLang) {
    applyLanguage(uiLang.value || "de");
    uiLang.addEventListener("change", () => applyLanguage(uiLang.value));
  } else {
    applyLanguage("de");
  }

  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);
});
