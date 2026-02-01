// v10 — stable i18n + polished radar + worker deepdive
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

const SCALE_VALUES = [
  { key: "low", value: 0.2 },
  { key: "mid", value: 0.5 },
  { key: "high", value: 0.8 },
];

let LAST_SCORES = null;

const el = (id) => document.getElementById(id);

// ---------------- i18n ----------------
const I18N = {
  de: {
    subtitle: "nach der Moral des Gleichgewichts",
    pathline: "Quick Scan (24) → Deep Dive (optional) → stabilisierende Indikation",
    langLabel: "Sprache",
    quickScanTitle: "Quick Scan",
    quickScanHint: "Beantworte jede Frage. Danach erhältst du: Koordinatensystem + Balken + schwächste Variable + Zeitfenster.",
    btnEval: "Auswerten",
    btnReset: "Zurücksetzen",
    resultTitle: "Ergebnis",
    resultHint: "Koordinatensystem (Radar), Balken, schwächste Variable, Zeitfenster.",
    radarTitle: "Koordinatensystem",
    radarLegend: "Radar-Profil: niedrig = innen, hoch = außen · Pfeil = schwächste Variable",
    barsTitle: "Balken",
    weakestTitle: "Schwächste Variable",
    timewinTitle: "Zeitfenster",
    deepDiveTitle: "Deep Dive",
    deepDiveHint: "Optional: Wenn du willst, erzeugt der Worker eine stabilisierende Indikation.",
    timeframeLabel: "Zeitfenster",
    ddBtn: "Stabilisierende Indikation erzeugen",
    ddThinking: "…denke nach",
    ddFirstScan: "Bitte zuerst Quick Scan auswerten.",
    errMissing: (list) => `Bitte beantworte alle Fragen. Fehlend: ${list}`,
    low: "unklar / schwach",
    mid: "teils / gemischt",
    high: "klar / stark",
    timeframe: { heute:"heute", "7tage":"7 Tage", "30tage":"30 Tage" },
    timewin: (v) => (v <= 0.3 ? "jetzt (akut) · 24–72h Fokus" : v <= 0.55 ? "bald · 1–2 Wochen Fokus" : "stabil · nur Feintuning nötig"),
    weakestLabel: "Schwach",
    scoreLabel: "Score",
    ddNoOutput: "(keine Ausgabe)",
    footer: "v2 · Vanilla · Dark UI · 3 Antwortstufen",
  },

  en: {
    subtitle: "after the moral logic of balance",
    pathline: "Quick Scan (24) → Deep Dive (optional) → stabilizing indication",
    langLabel: "Language",
    quickScanTitle: "Quick Scan",
    quickScanHint: "Answer each question. Then you get: radar chart + bars + weakest variable + time window.",
    btnEval: "Evaluate",
    btnReset: "Reset",
    resultTitle: "Result",
    resultHint: "Radar chart, bars, weakest variable, time window.",
    radarTitle: "Radar",
    radarLegend: "Radar profile: low = center, high = outside · Arrow = weakest variable",
    barsTitle: "Bars",
    weakestTitle: "Weakest variable",
    timewinTitle: "Time window",
    deepDiveTitle: "Deep Dive",
    deepDiveHint: "Optional: If you want, the worker generates a stabilizing indication.",
    timeframeLabel: "Timeframe",
    ddBtn: "Generate stabilizing indication",
    ddThinking: "…thinking",
    ddFirstScan: "Please evaluate the Quick Scan first.",
    errMissing: (list) => `Please answer all questions. Missing: ${list}`,
    low: "unclear / weak",
    mid: "mixed / partial",
    high: "clear / strong",
    timeframe: { heute:"today", "7tage":"7 days", "30tage":"30 days" },
    timewin: (v) => (v <= 0.3 ? "now (acute) · 24–72h focus" : v <= 0.55 ? "soon · 1–2 weeks focus" : "stable · only fine-tuning"),
    weakestLabel: "Weak",
    scoreLabel: "Score",
    ddNoOutput: "(no output)",
    footer: "v2 · Vanilla · Dark UI · 3 answer levels",
  },

  fr: {
    subtitle: "selon la morale de l’équilibre",
    pathline: "Quick Scan (24) → Deep Dive (optionnel) → indication stabilisante",
    langLabel: "Langue",
    quickScanTitle: "Quick Scan",
    quickScanHint: "Réponds à chaque question. Ensuite : radar + barres + variable la plus faible + fenêtre de temps.",
    btnEval: "Évaluer",
    btnReset: "Réinitialiser",
    resultTitle: "Résultat",
    resultHint: "Radar, barres, variable la plus faible, fenêtre de temps.",
    radarTitle: "Radar",
    radarLegend: "Profil radar : faible = centre, fort = extérieur · Flèche = variable la plus faible",
    barsTitle: "Barres",
    weakestTitle: "Variable la plus faible",
    timewinTitle: "Fenêtre de temps",
    deepDiveTitle: "Deep Dive",
    deepDiveHint: "Optionnel : le worker génère une indication stabilisante.",
    timeframeLabel: "Fenêtre",
    ddBtn: "Générer une indication stabilisante",
    ddThinking: "…réflexion",
    ddFirstScan: "Évalue d’abord le Quick Scan.",
    errMissing: (list) => `Merci de répondre à toutes les questions. Manquantes : ${list}`,
    low: "flou / faible",
    mid: "mixte / partiel",
    high: "clair / fort",
    timeframe: { heute:"aujourd’hui", "7tage":"7 jours", "30tage":"30 jours" },
    timewin: (v) => (v <= 0.3 ? "maintenant (aigu) · 24–72h" : v <= 0.55 ? "bientôt · 1–2 semaines" : "stable · ajustements"),
    weakestLabel: "Faible",
    scoreLabel: "Score",
    ddNoOutput: "(pas de sortie)",
    footer: "v2 · Vanilla · Dark UI · 3 niveaux",
  },

  es: {
    subtitle: "según la moral del equilibrio",
    pathline: "Quick Scan (24) → Deep Dive (opcional) → indicación estabilizadora",
    langLabel: "Idioma",
    quickScanTitle: "Quick Scan",
    quickScanHint: "Responde cada pregunta. Luego: radar + barras + variable más débil + ventana de tiempo.",
    btnEval: "Evaluar",
    btnReset: "Restablecer",
    resultTitle: "Resultado",
    resultHint: "Radar, barras, variable más débil, ventana de tiempo.",
    radarTitle: "Radar",
    radarLegend: "Perfil: bajo = centro, alto = exterior · Flecha = variable más débil",
    barsTitle: "Barras",
    weakestTitle: "Variable más débil",
    timewinTitle: "Ventana de tiempo",
    deepDiveTitle: "Deep Dive",
    deepDiveHint: "Opcional: el worker genera una indicación estabilizadora.",
    timeframeLabel: "Horizonte",
    ddBtn: "Generar indicación estabilizadora",
    ddThinking: "…pensando",
    ddFirstScan: "Primero evalúa el Quick Scan.",
    errMissing: (list) => `Responde todas las preguntas. Faltan: ${list}`,
    low: "incierto / débil",
    mid: "mixto / parcial",
    high: "claro / fuerte",
    timeframe: { heute:"hoy", "7tage":"7 días", "30tage":"30 días" },
    timewin: (v) => (v <= 0.3 ? "ahora (agudo) · 24–72h" : v <= 0.55 ? "pronto · 1–2 semanas" : "estable · ajustes"),
    weakestLabel: "Débil",
    scoreLabel: "Puntuación",
    ddNoOutput: "(sin salida)",
    footer: "v2 · Vanilla · Dark UI · 3 niveles",
  },

  tr: {
    subtitle: "denge ahlakına göre",
    pathline: "Quick Scan (24) → Deep Dive (opsiyonel) → dengeleyici öneri",
    langLabel: "Dil",
    quickScanTitle: "Quick Scan",
    quickScanHint: "Her soruyu cevapla. Sonra: radar + çubuklar + en zayıf değişken + zaman penceresi.",
    btnEval: "Değerlendir",
    btnReset: "Sıfırla",
    resultTitle: "Sonuç",
    resultHint: "Radar, çubuklar, en zayıf değişken, zaman penceresi.",
    radarTitle: "Radar",
    radarLegend: "Profil: düşük = iç, yüksek = dış · Ok = en zayıf değişken",
    barsTitle: "Çubuklar",
    weakestTitle: "En zayıf değişken",
    timewinTitle: "Zaman penceresi",
    deepDiveTitle: "Deep Dive",
    deepDiveHint: "Opsiyonel: Worker dengeleyici bir çıktı üretir.",
    timeframeLabel: "Zaman",
    ddBtn: "Dengeleyici çıktı üret",
    ddThinking: "…düşünüyor",
    ddFirstScan: "Önce Quick Scan’i değerlendir.",
    errMissing: (list) => `Lütfen tüm soruları cevapla. Eksik: ${list}`,
    low: "belirsiz / zayıf",
    mid: "karışık / kısmi",
    high: "net / güçlü",
    timeframe: { heute:"bugün", "7tage":"7 gün", "30tage":"30 gün" },
    timewin: (v) => (v <= 0.3 ? "şimdi (akut) · 24–72s" : v <= 0.55 ? "yakında · 1–2 hafta" : "stabil · ince ayar"),
    weakestLabel: "Zayıf",
    scoreLabel: "Skor",
    ddNoOutput: "(çıktı yok)",
    footer: "v2 · Vanilla · Dark UI · 3 seviye",
  },
};

// Questions per language (same variable keys)
const QUESTIONS_BY_LANG = {
  de: [
    // Freiheit
    { v:"Freiheit", q:"Wie frei kannst du in deinem Alltag Entscheidungen treffen, ohne Angst vor Konsequenzen?" },
    { v:"Freiheit", q:"Wie oft fühlst du dich in Rollen oder Erwartungen gefangen, die du nicht gewählt hast?" },
    { v:"Freiheit", q:"Kannst du Grenzen setzen, ohne danach Schuldgefühle oder Druck zu spüren?" },
    // Gerechtigkeit
    { v:"Gerechtigkeit", q:"Werden in deinem Umfeld Belastungen und Vorteile grundsätzlich fair verteilt?" },
    { v:"Gerechtigkeit", q:"Gibt es Regeln, die für manche gelten und für andere nicht?" },
    { v:"Gerechtigkeit", q:"Fühlst du dich in Entscheidungen, die dich betreffen, ausreichend berücksichtigt?" },
    // Wahrheit
    { v:"Wahrheit", q:"Werden Probleme offen benannt, auch wenn es unangenehm ist?" },
    { v:"Wahrheit", q:"Kannst du Kritik ansprechen, ohne dass sofort Abwehr oder Schuldzuweisung entsteht?" },
    { v:"Wahrheit", q:"Gibt es Themen, die „nicht gesagt werden dürfen“, obwohl alle sie spüren?" },
    // Harmonie
    { v:"Harmonie", q:"Gibt es in deinem Alltag Phasen von Ruhe, in denen du innerlich „runterkommst“?" },
    { v:"Harmonie", q:"Werden Konflikte so gelöst, dass danach wieder Nähe/Respekt möglich ist?" },
    { v:"Harmonie", q:"Fühlst du dich mit anderen grundsätzlich verbunden statt dauerhaft im Wettkampf?" },
    // Effizienz
    { v:"Effizienz", q:"Führt dein Aufwand meistens zu klaren Ergebnissen?" },
    { v:"Effizienz", q:"Gibt es unnötige Schleifen, Wiederholungen oder chaotische Zuständigkeiten?" },
    { v:"Effizienz", q:"Kannst du dich gut fokussieren, ohne ständig von „Feuerwehr-Themen“ abgelenkt zu werden?" },
    // Handlungsspielraum
    { v:"Handlungsspielraum", q:"Hast du realistische Optionen, Dinge zu verändern, wenn etwas nicht passt?" },
    { v:"Handlungsspielraum", q:"Kannst du „Nein“ sagen, ohne echte Nachteile befürchten zu müssen?" },
    { v:"Handlungsspielraum", q:"Gibt es Ressourcen/Unterstützung, die du aktiv nutzen kannst?" },
    // Mittel
    { v:"Mittel", q:"Reichen deine verfügbaren Mittel (Zeit, Geld, Energie) für das, was erwartet wird?" },
    { v:"Mittel", q:"Gibt es Engpässe, die regelmäßig Stress oder Konflikte auslösen?" },
    { v:"Mittel", q:"Sind Mittel so verteilt, dass das System nicht „ausblutet“ (z.B. dauerhaftes Überziehen)?" },
    // Balance
    { v:"Balance", q:"Ist die Balance zwischen Geben und Nehmen in deinem Umfeld stimmig?" },
    { v:"Balance", q:"Gibt es Extrem-Ausschläge (zu viel Kontrolle / zu viel Chaos)?" },
    { v:"Balance", q:"Fühlst du dich insgesamt „im Gleichgewicht“, auch wenn nicht alles perfekt ist?" },
  ],
};

// Derived translations for other languages (careful, natural)
QUESTIONS_BY_LANG.en = [
  { v:"Freiheit", q:"How free are you in daily life to make decisions without fear of consequences?" },
  { v:"Freiheit", q:"How often do you feel trapped in roles or expectations you didn’t choose?" },
  { v:"Freiheit", q:"Can you set boundaries without guilt or pressure afterwards?" },

  { v:"Gerechtigkeit", q:"Are burdens and benefits in your environment generally distributed fairly?" },
  { v:"Gerechtigkeit", q:"Are there rules that apply to some people but not to others?" },
  { v:"Gerechtigkeit", q:"Do you feel sufficiently considered in decisions that affect you?" },

  { v:"Wahrheit", q:"Are problems named openly, even when it’s uncomfortable?" },
  { v:"Wahrheit", q:"Can you voice criticism without immediate defensiveness or blame?" },
  { v:"Wahrheit", q:"Are there topics that ‘cannot be said’ even though everyone feels them?" },

  { v:"Harmonie", q:"Do you have phases of calm in your day where you can truly unwind?" },
  { v:"Harmonie", q:"Are conflicts resolved in a way that restores closeness/respect afterwards?" },
  { v:"Harmonie", q:"Do you feel generally connected with others rather than constantly competing?" },

  { v:"Effizienz", q:"Does your effort usually lead to clear results?" },
  { v:"Effizienz", q:"Are there unnecessary loops, repetitions, or chaotic responsibilities?" },
  { v:"Effizienz", q:"Can you focus well without being constantly pulled into ‘firefighting’?" },

  { v:"Handlungsspielraum", q:"Do you have realistic options to change things when something doesn’t fit?" },
  { v:"Handlungsspielraum", q:"Can you say ‘no’ without fearing real disadvantages?" },
  { v:"Handlungsspielraum", q:"Are there resources/support you can actively use?" },

  { v:"Mittel", q:"Do your available resources (time, money, energy) match what’s expected?" },
  { v:"Mittel", q:"Are there bottlenecks that regularly trigger stress or conflict?" },
  { v:"Mittel", q:"Are resources distributed so the system doesn’t ‘bleed out’ (e.g., constant overuse)?" },

  { v:"Balance", q:"Is the balance between giving and taking in your environment right?" },
  { v:"Balance", q:"Are there extreme swings (too much control / too much chaos)?" },
  { v:"Balance", q:"Do you feel overall ‘in balance’, even if not everything is perfect?" },
];

QUESTIONS_BY_LANG.fr = [
  { v:"Freiheit", q:"À quel point peux-tu prendre des décisions au quotidien sans craindre des conséquences ?" },
  { v:"Freiheit", q:"À quelle fréquence te sens-tu coincé·e dans des rôles ou attentes que tu n’as pas choisis ?" },
  { v:"Freiheit", q:"Peux-tu poser des limites sans culpabilité ni pression après coup ?" },

  { v:"Gerechtigkeit", q:"Dans ton environnement, charges et avantages sont-ils globalement répartis équitablement ?" },
  { v:"Gerechtigkeit", q:"Y a-t-il des règles qui s’appliquent à certains et pas à d’autres ?" },
  { v:"Gerechtigkeit", q:"Te sens-tu suffisamment pris·e en compte dans les décisions qui te concernent ?" },

  { v:"Wahrheit", q:"Les problèmes sont-ils nommés ouvertement, même si c’est inconfortable ?" },
  { v:"Wahrheit", q:"Peux-tu exprimer une critique sans défense immédiate ni accusation ?" },
  { v:"Wahrheit", q:"Existe-t-il des sujets ‘qu’on ne peut pas dire’ alors que tout le monde les ressent ?" },

  { v:"Harmonie", q:"As-tu des moments de calme où tu peux vraiment redescendre ?" },
  { v:"Harmonie", q:"Les conflits sont-ils résolus de manière à retrouver proximité/respect ensuite ?" },
  { v:"Harmonie", q:"Te sens-tu plutôt relié·e aux autres que constamment en compétition ?" },

  { v:"Effizienz", q:"Ton effort mène-t-il le plus souvent à des résultats clairs ?" },
  { v:"Effizienz", q:"Y a-t-il des boucles inutiles, répétitions, ou responsabilités chaotiques ?" },
  { v:"Effizienz", q:"Peux-tu te concentrer sans être sans cesse happé·e par des urgences ?" },

  { v:"Handlungsspielraum", q:"As-tu des options réalistes pour changer les choses quand ça ne va pas ?" },
  { v:"Handlungsspielraum", q:"Peux-tu dire ‘non’ sans craindre de vraies conséquences ?" },
  { v:"Handlungsspielraum", q:"Y a-t-il des ressources/soutiens que tu peux utiliser activement ?" },

  { v:"Mittel", q:"Tes moyens (temps, argent, énergie) suffisent-ils à ce qui est attendu ?" },
  { v:"Mittel", q:"Y a-t-il des goulots d’étranglement qui déclenchent régulièrement stress ou conflits ?" },
  { v:"Mittel", q:"Les moyens sont-ils répartis pour que le système ne ‘s’épuise’ pas ?" },

  { v:"Balance", q:"L’équilibre entre donner et recevoir te paraît-il juste ?" },
  { v:"Balance", q:"Y a-t-il des extrêmes (trop de contrôle / trop de chaos) ?" },
  { v:"Balance", q:"Te sens-tu globalement ‘en équilibre’, même si tout n’est pas parfait ?" },
];

QUESTIONS_BY_LANG.es = [
  { v:"Freiheit", q:"¿Qué tan libre eres en tu día a día para decidir sin miedo a consecuencias?" },
  { v:"Freiheit", q:"¿Con qué frecuencia te sientes atrapado/a en roles o expectativas que no elegiste?" },
  { v:"Freiheit", q:"¿Puedes poner límites sin culpa ni presión después?" },

  { v:"Gerechtigkeit", q:"¿En tu entorno se reparten cargas y beneficios de forma justa?" },
  { v:"Gerechtigkeit", q:"¿Hay reglas que valen para unos y no para otros?" },
  { v:"Gerechtigkeit", q:"¿Te sientes suficientemente tenido/a en cuenta en decisiones que te afectan?" },

  { v:"Wahrheit", q:"¿Se nombran los problemas abiertamente, aunque incomode?" },
  { v:"Wahrheit", q:"¿Puedes expresar crítica sin defensiva inmediata o culpas?" },
  { v:"Wahrheit", q:"¿Hay temas que ‘no se pueden decir’ aunque todos los sientan?" },

  { v:"Harmonie", q:"¿Tienes momentos de calma en los que realmente bajas revoluciones?" },
  { v:"Harmonie", q:"¿Los conflictos se resuelven de forma que vuelva el respeto/cercanía?" },
  { v:"Harmonie", q:"¿Te sientes conectado/a con otros en vez de competir todo el tiempo?" },

  { v:"Effizienz", q:"¿Tu esfuerzo suele llevar a resultados claros?" },
  { v:"Effizienz", q:"¿Hay bucles innecesarios, repeticiones o responsabilidades caóticas?" },
  { v:"Effizienz", q:"¿Puedes enfocarte sin estar siempre apagando incendios?" },

  { v:"Handlungsspielraum", q:"¿Tienes opciones reales para cambiar cosas cuando algo no encaja?" },
  { v:"Handlungsspielraum", q:"¿Puedes decir ‘no’ sin temer desventajas reales?" },
  { v:"Handlungsspielraum", q:"¿Hay recursos/apoyo que puedas usar activamente?" },

  { v:"Mittel", q:"¿Tus recursos (tiempo, dinero, energía) alcanzan para lo esperado?" },
  { v:"Mittel", q:"¿Hay cuellos de botella que causan estrés o conflicto con frecuencia?" },
  { v:"Mittel", q:"¿Los recursos están repartidos para que el sistema no se agote?" },

  { v:"Balance", q:"¿La relación entre dar y recibir está equilibrada?" },
  { v:"Balance", q:"¿Hay extremos (demasiado control / demasiado caos)?" },
  { v:"Balance", q:"¿Te sientes en equilibrio aunque no todo sea perfecto?" },
];

QUESTIONS_BY_LANG.tr = [
  { v:"Freiheit", q:"Günlük hayatta karar alırken sonuçlardan korkmadan ne kadar özgürsün?" },
  { v:"Freiheit", q:"Seçmediğin rol ve beklentilerde ne sıklıkla sıkışmış hissediyorsun?" },
  { v:"Freiheit", q:"Suçluluk ya da baskı hissetmeden sınır koyabiliyor musun?" },

  { v:"Gerechtigkeit", q:"Çevrende yükler ve avantajlar genel olarak adil dağıtılıyor mu?" },
  { v:"Gerechtigkeit", q:"Bazıları için geçerli olan ama diğerleri için geçerli olmayan kurallar var mı?" },
  { v:"Gerechtigkeit", q:"Seni etkileyen kararlarda yeterince dikkate alındığını hissediyor musun?" },

  { v:"Wahrheit", q:"Sorunlar rahatsız edici olsa bile açıkça dile getiriliyor mu?" },
  { v:"Wahrheit", q:"Savunma ya da suçlama olmadan eleştiri dile getirebiliyor musun?" },
  { v:"Wahrheit", q:"Herkesin hissettiği ama ‘konuşulmayan’ konular var mı?" },

  { v:"Harmonie", q:"Gün içinde gerçekten sakinleşebildiğin anlar oluyor mu?" },
  { v:"Harmonie", q:"Çatışmalar, sonrasında saygı/yakınlık dönecek şekilde çözülüyor mu?" },
  { v:"Harmonie", q:"Sürekli rekabet yerine genel olarak bağlı/bağlı hissediyor musun?" },

  { v:"Effizienz", q:"Çaban genelde net sonuçlara dönüşüyor mu?" },
  { v:"Effizienz", q:"Gereksiz döngüler, tekrarlar veya kaotik sorumluluklar var mı?" },
  { v:"Effizienz", q:"Sürekli ‘yangın söndürmeden’ odaklanabiliyor musun?" },

  { v:"Handlungsspielraum", q:"Bir şey uymadığında değiştirmek için gerçekçi seçeneklerin var mı?" },
  { v:"Handlungsspielraum", q:"Gerçek bir dezavantaj korkusu olmadan ‘hayır’ diyebiliyor musun?" },
  { v:"Handlungsspielraum", q:"Aktif kullanabileceğin kaynak/destek var mı?" },

  { v:"Mittel", q:"Kaynakların (zaman, para, enerji) beklenenler için yeterli mi?" },
  { v:"Mittel", q:"Düzenli stres/çatışma yaratan darboğazlar var mı?" },
  { v:"Mittel", q:"Sistem ‘kan kaybetmeyecek’ şekilde kaynaklar dağıtılmış mı?" },

  { v:"Balance", q:"Verme-alma dengesi sence yerinde mi?" },
  { v:"Balance", q:"Aşırı uçlar var mı (fazla kontrol / fazla kaos)?" },
  { v:"Balance", q:"Her şey mükemmel olmasa da genel olarak dengede misin?" },
];

// ---------------- Error UI ----------------
function showErrorBox(msg) {
  const box = el("errorBox");
  if (!box) return;
  box.classList.remove("hidden");
  box.textContent = msg || "";
}
function hideErrorBox() {
  const box = el("errorBox");
  if (!box) return;
  box.classList.add("hidden");
  box.textContent = "";
}

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

// ---------------- Language helpers ----------------
function getLang() {
  const v = el("language")?.value || "de";
  return I18N[v] ? v : "de";
}
function t() {
  return I18N[getLang()];
}
function setText(id, text) {
  const node = el(id);
  if (node) node.textContent = text;
}

// ---------------- Build UI ----------------
function applyStaticUI() {
  const L = t();

  document.documentElement.lang = getLang();

  setText("subtitle", L.subtitle);
  setText("pathline", L.pathline);
  setText("langLabel", L.langLabel);

  setText("quickScanTitle", L.quickScanTitle);
  setText("quickScanHint", L.quickScanHint);
  setText("btnEval", L.btnEval);
  setText("btnReset", L.btnReset);

  setText("resultTitle", L.resultTitle);
  setText("resultHint", L.resultHint);
  setText("radarTitle", L.radarTitle);
  setText("radarLegend", L.radarLegend);
  setText("barsTitle", L.barsTitle);
  setText("weakestTitle", L.weakestTitle);
  setText("timewinTitle", L.timewinTitle);

  setText("deepDiveTitle", L.deepDiveTitle);
  setText("deepDiveHint", L.deepDiveHint);
  setText("timeframeLabel", L.timeframeLabel);
  setText("deepDiveBtn", L.ddBtn);

  setText("footerLine", L.footer);

  // Localize timeframe option labels (keeping values stable)
  const tf = el("timeframe");
  if (tf) {
    [...tf.options].forEach(opt => {
      const label = L.timeframe?.[opt.value];
      if (label) opt.textContent = label;
    });
  }
}

function buildQuestions() {
  const host = el("questions");
  if (!host) return;
  host.innerHTML = "";

  const L = t();
  const Q = QUESTIONS_BY_LANG[getLang()] || QUESTIONS_BY_LANG.de;

  Q.forEach((item, idx) => {
    const qWrap = document.createElement("div");
    qWrap.className = "q";

    const top = document.createElement("div");
    top.className = "qTop";

    const left = document.createElement("div");
    left.className = "qIdx";
    left.textContent = `${idx + 1}/${Q.length} · ${item.v}`;

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

    SCALE_VALUES.forEach((o) => {
      const label = document.createElement("label");
      label.className = "opt";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q_${idx}`;
      input.value = String(o.value);
      input.setAttribute("data-var", item.v);

      const span = document.createElement("span");
      span.textContent = L[o.key];

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

// ---------------- Collect & score ----------------
function collectAnswersByVar() {
  const byVar = {};
  VARS.forEach(v => (byVar[v] = []));

  const Q = QUESTIONS_BY_LANG[getLang()] || QUESTIONS_BY_LANG.de;

  const missing = [];
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

function weakestVars(scores, n = 2) {
  return Object.entries(scores)
    .sort((a,b)=>a[1]-b[1])
    .slice(0, n)
    .map(([k]) => k);
}

// ---------------- Render: Bars / labels ----------------
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
  const L = t();
  host.innerHTML = `<span class="badge">${weak.key}</span> <span class="muted">${L.scoreLabel}:</span> <strong>${weak.val.toFixed(2)}</strong>`;
}

function renderTimewin(weak) {
  const host = el("timewin");
  if (!host) return;
  const L = t();
  host.innerHTML = `<span class="badge">${L.timewin(weak.val)}</span>`;
}

// ---------------- Radar Canvas (polished + arrow + label box) ----------------
function drawRadar(scores, weak) {
  const canvas = el("radarCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Handle high-DPI crispness
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW, H = cssH;

  // Background
  ctx.clearRect(0, 0, W, H);

  const cx = W * 0.50;
  const cy = H * 0.54;
  const R = Math.min(W, H) * 0.34;

  const levels = 5;
  const angleStep = (Math.PI * 2) / VARS.length;

  // Colors
  const gridCol = "rgba(255,255,255,.10)";
  const gridCol2 = "rgba(255,255,255,.06)";
  const textCol = "rgba(255,255,255,.82)";
  const polyFill = "rgba(159,231,210,.16)";
  const polyStroke = "rgba(159,231,210,.85)";
  const pointCol = "rgba(255,255,255,.85)";
  const arrowCol = "rgba(255,208,138,.95)";
  const glowCol = "rgba(255,208,138,.15)";

  // Subtle vignette glow
  const grad = ctx.createRadialGradient(cx, cy, R*0.2, cx, cy, R*1.7);
  grad.addColorStop(0, "rgba(255,255,255,.08)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // Grid rings
  for (let l = 1; l <= levels; l++) {
    const rr = (R * l) / levels;
    ctx.beginPath();
    for (let i = 0; i < VARS.length; i++) {
      const a = -Math.PI/2 + i * angleStep;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = l === levels ? gridCol : gridCol2;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axes + labels
  ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = textCol;
  ctx.textBaseline = "middle";

  for (let i = 0; i < VARS.length; i++) {
    const a = -Math.PI/2 + i * angleStep;
    const x2 = cx + Math.cos(a) * R;
    const y2 = cy + Math.sin(a) * R;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gridCol2;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label positioning
    const lx = cx + Math.cos(a) * (R + 22);
    const ly = cy + Math.sin(a) * (R + 22);

    const name = VARS[i];
    const align = Math.cos(a) > 0.2 ? "left" : Math.cos(a) < -0.2 ? "right" : "center";
    ctx.textAlign = align;
    ctx.fillText(name, lx, ly);
  }

  // Polygon points
  const pts = VARS.map((v, i) => {
    const val = clamp01(scores[v] ?? 0);
    const a = -Math.PI/2 + i * angleStep;
    const rr = R * (0.20 + 0.80 * val); // keep a bit away from center for readability
    return { v, val, a, x: cx + Math.cos(a)*rr, y: cy + Math.sin(a)*rr };
  });

  // Profile polygon
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = polyFill;
  ctx.fill();

  ctx.strokeStyle = polyStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Points
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.2, 0, Math.PI*2);
    ctx.fillStyle = pointCol;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Arrow to weakest
  const weakIdx = Math.max(0, VARS.indexOf(weak.key));
  const wp = pts[weakIdx];

  // 10–15% longer: we use 12% longer
  const arrowLen = R * 1.12;
  const ax = cx + Math.cos(wp.a) * arrowLen;
  const ay = cy + Math.sin(wp.a) * arrowLen;

  // glow behind arrow
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ax, ay);
  ctx.strokeStyle = glowCol;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.stroke();

  // main arrow line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ax, ay);
  ctx.strokeStyle = arrowCol;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.stroke();

  // arrow head
  const headSize = 12;
  const hx = ax, hy = ay;
  const leftA = wp.a + Math.PI - 0.35;
  const rightA = wp.a + Math.PI + 0.35;

  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + Math.cos(leftA)*headSize, hy + Math.sin(leftA)*headSize);
  ctx.lineTo(hx + Math.cos(rightA)*headSize, hy + Math.sin(rightA)*headSize);
  ctx.closePath();
  ctx.fillStyle = arrowCol;
  ctx.fill();

  // Label box near arrow end
  const L = t();
  const label = `${L.weakestLabel}: ${weak.key} · ${weak.val.toFixed(2)}`;

  ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const padding = 10;
  const tw = ctx.measureText(label).width;
  const bw = tw + padding*2;
  const bh = 34;

  // place box offset from arrow end, avoid outside canvas
  let bx = hx + (Math.cos(wp.a) * 16);
  let by = hy + (Math.sin(wp.a) * 16);

  // normalize anchor to keep inside bounds
  bx = clamp(bx, 10, W - bw - 10);
  by = clamp(by, 10, H - bh - 10);

  // box background
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,208,138,.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // text
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + padding, by + bh/2);

  // subtle connector line from box to arrow head
  const cx2 = clamp(hx, bx + 10, bx + bw - 10);
  const cy2 = clamp(hy, by + 8, by + bh - 8);
  ctx.beginPath();
  ctx.moveTo(cx2, cy2);
  ctx.lineTo(hx, hy);
  ctx.strokeStyle = "rgba(255,208,138,.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
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

function clamp01(v){ return Math.max(0, Math.min(1, Number(v) || 0)); }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// ---------------- Worker call ----------------
async function runDeepDive() {
  const btn = el("deepDiveBtn");
  const out = el("deepDiveOut");
  const tf = el("timeframe");

  if (!btn || !out) return;

  const L = t();

  if (!LAST_SCORES) {
    out.style.display = "block";
    out.textContent = L.ddFirstScan;
    return;
  }

  const payload = {
    language: getLang(),
    timeframe: tf?.value || "heute",
    scores: LAST_SCORES,
    weakest: weakestVars(LAST_SCORES, 2),
  };

  try {
    btn.disabled = true;
    btn.textContent = L.ddThinking;

    const resp = await fetch(`${WORKER_BASE}/deepdive`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) {
      throw new Error(data?.error || `Worker HTTP ${resp.status}`);
    }

    out.style.display = "block";
    out.textContent = data.text || L.ddNoOutput;
  } catch (e) {
    out.style.display = "block";
    out.textContent = `Fehler: ${String(e?.message || e)}`;
  } finally {
    btn.disabled = false;
    btn.textContent = L.ddBtn;
  }
}

// ---------------- Main evaluate/reset ----------------
async function onEvaluate() {
  hideErrorBox();

  const collected = collectAnswersByVar();
  if (!collected.ok) {
    const L = t();
    const list = collected.missing.slice(0,5).join(", ") + (collected.missing.length > 5 ? "…" : "");
    showErrorBox(L.errMissing(list));
    return;
  }

  const scores = scoreAll(collected.byVar);
  LAST_SCORES = scores;

  const weak = weakestVar(scores);

  el("results")?.classList.remove("hidden");
  renderBars(scores);
  renderWeakest(weak);
  renderTimewin(weak);
  drawRadar(scores, weak);
}

function onReset() {
  hideErrorBox();
  document.querySelectorAll('input[type="radio"]').forEach(i => (i.checked = false));

  el("results")?.classList.add("hidden");
  el("bars") && (el("bars").innerHTML = "");
  el("weakest") && (el("weakest").innerHTML = "");
  el("timewin") && (el("timewin").innerHTML = "");

  const out = el("deepDiveOut");
  if (out) { out.innerHTML = ""; out.style.display = "none"; }

  LAST_SCORES = null;

  // clear canvas
  const c = el("radarCanvas");
  const ctx = c?.getContext("2d");
  if (ctx && c) ctx.clearRect(0,0,c.width,c.height);
}

// ---------------- Boot ----------------
function boot() {
  applyStaticUI();
  buildQuestions();

  el("btnEval")?.addEventListener("click", onEvaluate);
  el("btnReset")?.addEventListener("click", onReset);
  el("deepDiveBtn")?.addEventListener("click", runDeepDive);

  // language change: rebuild everything & reset results (avoid mixed-language state)
  el("language")?.addEventListener("change", () => {
    onReset();
    applyStaticUI();
    buildQuestions();
  });

  // redraw radar on resize if results visible
  window.addEventListener("resize", () => {
    if (!LAST_SCORES) return;
    const weak = weakestVar(LAST_SCORES);
    drawRadar(LAST_SCORES, weak);
  });
}

document.addEventListener("DOMContentLoaded", boot);
