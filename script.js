/* script.js — MDG V4 (Drop 4A)
   - Landing i18n
   - Diagnose wizard (S0..S6)
   - SSOT session model
   - Deterministic engine + strict confidence (0.82) + max 6 adaptive Q
   - SVG Radar + Tension Bars (no canvas, no libs)
*/

(() => {
  "use strict";

  // =========================
  // Config
  // =========================
  const CFG = {
    VERSION: "v4",
    CONF_THRESHOLD: 0.82,
    MAX_ADAPTIVE_Q: 6,
    STORAGE_KEY: "mdg_v4_session",
    DEFAULT_LANG: "en",
    API_BASE: "https://api.mdg-indikation.de" // Drop 4B activates. Drop 4A works without.
  };

  // =========================
  // Utilities
  // =========================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const round = (n) => Math.round(n);
  const nowISO = () => new Date().toISOString();

  function safeJSONParse(s, fallback = null) {
    try { return JSON.parse(s); } catch { return fallback; }
  }

  function uuid() {
    // crypto.randomUUID supported in modern browsers
    if (crypto?.randomUUID) return crypto.randomUUID();
    // fallback (not perfect, ok for client id)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // =========================
  // SSOT Session
  // =========================
  function defaultSession() {
    const cid = localStorage.getItem("mdg_client_id") || uuid();
    localStorage.setItem("mdg_client_id", cid);

    return {
      meta: {
        version: CFG.VERSION,
        mode: "private", // private|business
        lang: CFG.DEFAULT_LANG,
        tier: "private_free", // private_free|business_token
        label: "",
        created_at: nowISO(),
        client_id: cid,
        session_id: uuid()
      },
      input: {
        one_liner: "",
        intent: "", // stabilize|rebuild
        levels: [],
        sliders_0to5: { D: 0, L: 0, G: 0, M: 0, E: 0, F: 0, T: 0, S: 0 },
        adaptive_answers: [] // {qid, answer}
      },
      core: {
        scores_0to100: { D: 0, L: 0, G: 0, M: 0, EF: 0, TS: 0, ALL: 0 },
        tensions_top: [],
        classification: {
          primary: { code: "—", label: "—", confidence: 0 },
          secondary: [],
          path: { code: "—", why: [] },
          moves: { now_48h: [], week_7d: [] },
          killer_question: { asked: false, qid: null, text: null, options: [] }
        }
      },
      llm: {
        status: "off",
        refinement: { primary_sentence: "", evidence: [], red_flags: [], assumptions: [] },
        executive_report: { format: "html", content: "" }
      },
      share: { saved: false, id: null, url: null }
    };
  }

  function loadSession() {
    const raw = localStorage.getItem(CFG.STORAGE_KEY);
    if (!raw) return defaultSession();
    const s = safeJSONParse(raw, null);
    if (!s?.meta?.version) return defaultSession();
    // Ensure missing keys
    const d = defaultSession();
    return deepMerge(d, s);
  }

  function saveSession(s) {
    localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(s));
  }

  function deepMerge(target, src) {
    if (typeof target !== "object" || target === null) return src;
    if (typeof src !== "object" || src === null) return target;
    const out = Array.isArray(target) ? target.slice() : { ...target };
    for (const k of Object.keys(src)) {
      if (k in target) out[k] = deepMerge(target[k], src[k]);
      else out[k] = src[k];
    }
    return out;
  }

  // =========================
  // i18n Dictionaries (Drop 4A scope)
  // - Landing + Diagnose core UI + slider prompts + examples + adaptive questions (20 each)
  // =========================
  // NOTE: To keep Drop 4A readable, we include:
  // - full UI strings
  // - slider labels/examples
  // - adaptive bank (12 private + 12 business) now
  // In Drop 4B we can expand to full 20+20 if desired (or keep now; engine supports).
  const I18N = {
    en: {
      // Landing
      "hero.headline": "Decision clarity in minutes.",
      "hero.sub": "A structural diagnostic system for early instability detection and resilient decision architecture.",
      "hero.private": "Assess now",
      "hero.business": "For companies (Token required)",
      "features.primary.title": "Primary instability",
      "features.primary.text": "Identify the structural root cause precisely.",
      "features.secondary.title": "Secondary tensions",
      "features.secondary.text": "Understand what amplifies the problem.",
      "features.path.title": "Strategic path",
      "features.path.text": "Stabilize or rebuild — based on signals.",
      "features.moves.title": "Immediate moves",
      "features.moves.text": "Concrete actions for the next 48 hours.",
      "how.title": "How it works",
      "how.step1": "Describe the situation in one sentence.",
      "how.step2": "Choose your intent: stabilize or rebuild.",
      "how.step3": "Complete the structured scan.",
      "how.step4": "Receive your diagnosis and actions.",

      // Wizard common
      "wiz.title.private": "MDG · Private Diagnosis",
      "wiz.title.business": "MDG · Business Diagnosis",
      "wiz.note": "Answers are stored locally in your browser.",
      "btn.back": "Back",
      "btn.next": "Continue",
      "btn.calculate": "Calculate result",
      "btn.restart": "Restart",
      "btn.exec": "Generate Executive Report",
      "btn.exec_business": "Generate Executive Operating Memo",

      // Steps
      "step.one_liner.h": "Describe the situation",
      "step.one_liner.p": "Write one sentence. Keep it concrete.",
      "step.one_liner.ex1": "Example: “We keep arguing about small things.”",
      "step.one_liner.ex2": "Example: “All decisions end up with the founder.”",

      "step.intent.h": "What do you want?",
      "step.intent.p": "Choose your strategic intent.",
      "intent.stabilize.t": "Stabilize (IDG)",
      "intent.stabilize.p": "Reduce tension and stop escalation quickly.",
      "intent.stabilize.ex1": "Example: “Stop the conflict from getting worse.”",
      "intent.stabilize.ex2": "Example: “Stabilize operations within days.”",
      "intent.rebuild.t": "Rebuild (ADG)",
      "intent.rebuild.p": "Redesign structure so the problem cannot repeat.",
      "intent.rebuild.ex1": "Example: “Redesign roles and decision rights.”",
      "intent.rebuild.ex2": "Example: “Change the operating model.”",

      "step.levels.h": "Choose up to 2 levels",
      "step.levels.p.private": "Where is the instability most visible?",
      "step.levels.p.business": "Where is the instability most visible?",
      "levels.private.self": "Self",
      "levels.private.relationship": "Relationship",
      "levels.private.family": "Family",
      "levels.private.worklife": "Work-life",
      "levels.private.social": "Social circle",
      "levels.business.team": "Team",
      "levels.business.leadership": "Leadership",
      "levels.business.org": "Organization",
      "levels.business.process": "Process",
      "levels.business.market": "Market",

      "step.sliders.h": "Structured baseline scan",
      "step.sliders.p": "Move each slider. 0 means stable. 5 means severe.",

      // Slider names + examples (same axes for both; examples adapt by mode)
      "sl.D.title": "Decision clarity",
      "sl.D.desc.private": "How clear is who decides and how decisions are made?",
      "sl.D.ex1.private": "0: “We decide calmly and clearly.”",
      "sl.D.ex2.private": "5: “We argue about who decides.”",
      "sl.D.desc.business": "How clear are decision rights and escalation paths?",
      "sl.D.ex1.business": "0: “Owners decide without friction.”",
      "sl.D.ex2.business": "5: “Everything escalates to one person.”",

      "sl.L.title": "Load distribution",
      "sl.L.desc.private": "How balanced are responsibilities and emotional load?",
      "sl.L.ex1.private": "0: “Tasks are shared fairly.”",
      "sl.L.ex2.private": "5: “One person carries everything.”",
      "sl.L.desc.business": "How balanced is workload across key roles?",
      "sl.L.ex1.business": "0: “No single bottleneck.”",
      "sl.L.ex2.business": "5: “A few people are overloaded.”",

      "sl.G.title": "Stress amplification",
      "sl.G.desc.private": "Under stress, do small issues become big conflicts?",
      "sl.G.ex1.private": "0: “Stress doesn’t change behavior.”",
      "sl.G.ex2.private": "5: “Small triggers explode quickly.”",
      "sl.G.desc.business": "Does growth/complexity multiply coordination cost fast?",
      "sl.G.ex1.business": "0: “Growth stays controlled.”",
      "sl.G.ex2.business": "5: “Growth creates chaos.”",

      "sl.M.title": "Power ↔ responsibility alignment",
      "sl.M.desc.private": "Does the person deciding also carry responsibility?",
      "sl.M.ex1.private": "0: “Decisions and responsibility match.”",
      "sl.M.ex2.private": "5: “Someone decides but another pays.”",
      "sl.M.desc.business": "Does authority match accountability and risk ownership?",
      "sl.M.ex1.business": "0: “Accountable owners have authority.”",
      "sl.M.ex2.business": "5: “Accountable managers cannot decide.”",

      "sl.E.title": "Energy level",
      "sl.E.desc.private": "How much capacity is left (emotional/physical)?",
      "sl.E.ex1.private": "0: “We have capacity.”",
      "sl.E.ex2.private": "5: “We are exhausted.”",
      "sl.E.desc.business": "How much capacity is left (team/leadership)?",
      "sl.E.ex1.business": "0: “Healthy pace and buffer.”",
      "sl.E.ex2.business": "5: “Burnout signs are visible.”",

      "sl.F.title": "Learning & error integration",
      "sl.F.desc.private": "Do you learn from conflicts or repeat the same loop?",
      "sl.F.ex1.private": "0: “We learn and improve.”",
      "sl.F.ex2.private": "5: “Same conflict repeats.”",
      "sl.F.desc.business": "Do incidents lead to real change and prevention?",
      "sl.F.ex1.business": "0: “Post-mortems improve systems.”",
      "sl.F.ex2.business": "5: “Mistakes repeat without fix.”",

      "sl.T.title": "Trust & openness",
      "sl.T.desc.private": "Can sensitive topics be spoken about openly?",
      "sl.T.ex1.private": "0: “We can talk openly.”",
      "sl.T.ex2.private": "5: “We avoid key topics.”",
      "sl.T.desc.business": "Do bad news and risks surface early?",
      "sl.T.ex1.business": "0: “Bad news surfaces early.”",
      "sl.T.ex2.business": "5: “Problems are hidden.”",

      "sl.S.title": "Structural clarity",
      "sl.S.desc.private": "Are expectations and roles explicit?",
      "sl.S.ex1.private": "0: “Expectations are clear.”",
      "sl.S.ex2.private": "5: “Misunderstandings are constant.”",
      "sl.S.desc.business": "Are interfaces, ownership and processes clear?",
      "sl.S.ex1.business": "0: “Handoffs are clean.”",
      "sl.S.ex2.business": "5: “Blame between teams.”",

      // Adaptive
      "step.adapt.h": "Precision questions",
      "step.adapt.p": "Answer up to 6 short questions to increase precision.",
      "adapt.precision": "Precision",
      "adapt.q_of": "Question {n} of {max}",

      // Result
      "step.result.h": "Result",
      "kpi.primary": "Primary instability",
      "kpi.path": "Path",
      "kpi.conf": "Confidence",
      "kpi.tension": "Top tension",
      "sec.radar": "Structural profile (radar)",
      "sec.bars": "Top tensions",
      "sec.primary": "Primary vs Secondary",
      "sec.moves": "Moves",
      "moves.now": "3 moves now (48h)",
      "moves.week": "3 moves this week (7 days)",

      // Confidence labels
      "conf.high": "High",
      "conf.med": "Medium",
      "conf.low": "Low"
    },

    de: {
      "hero.headline": "Entscheidungssicherheit in Minuten.",
      "hero.sub": "Ein strukturelles Diagnosesystem zur Früherkennung von Instabilität und zum Aufbau tragfähiger Entscheidungsarchitekturen.",
      "hero.private": "Jetzt ermitteln",
      "hero.business": "Für Unternehmen (Token erforderlich)",
      "features.primary.title": "Primärinstabilität",
      "features.primary.text": "Die strukturelle Hauptursache präzise erkennen.",
      "features.secondary.title": "Sekundäre Spannungen",
      "features.secondary.text": "Verstehen, was das Problem verstärkt.",
      "features.path.title": "Strategischer Pfad",
      "features.path.text": "Stabilisieren oder umbauen — signalbasiert.",
      "features.moves.title": "Sofort-Maßnahmen",
      "features.moves.text": "Konkrete Schritte für die nächsten 48 Stunden.",
      "how.title": "So funktioniert es",
      "how.step1": "Situation in einem Satz beschreiben.",
      "how.step2": "Intent wählen: stabilisieren oder umbauen.",
      "how.step3": "Strukturierten Scan durchführen.",
      "how.step4": "Diagnose & Maßnahmen erhalten.",

      "wiz.title.private": "MDG · Private Diagnose",
      "wiz.title.business": "MDG · Business Diagnose",
      "wiz.note": "Antworten werden lokal im Browser gespeichert.",
      "btn.back": "Zurück",
      "btn.next": "Weiter",
      "btn.calculate": "Ergebnis berechnen",
      "btn.restart": "Neu starten",
      "btn.exec": "Executive Report erstellen",
      "btn.exec_business": "Executive Operating Memo erstellen",

      "step.one_liner.h": "Situation beschreiben",
      "step.one_liner.p": "Schreibe einen Satz. Möglichst konkret.",
      "step.one_liner.ex1": "Beispiel: „Wir streiten oft über Kleinigkeiten.“",
      "step.one_liner.ex2": "Beispiel: „Alle Entscheidungen landen beim Gründer.“",

      "step.intent.h": "Was willst du erreichen?",
      "step.intent.p": "Wähle deinen strategischen Intent.",
      "intent.stabilize.t": "Stabilisieren (IDG)",
      "intent.stabilize.p": "Spannung senken und Eskalation stoppen.",
      "intent.stabilize.ex1": "Beispiel: „Konflikt darf nicht schlimmer werden.“",
      "intent.stabilize.ex2": "Beispiel: „Betrieb in Tagen stabilisieren.“",
      "intent.rebuild.t": "Umbauen (ADG)",
      "intent.rebuild.p": "Struktur so ändern, dass es nicht wiederkehrt.",
      "intent.rebuild.ex1": "Beispiel: „Rollen & Entscheidungsrechte neu designen.“",
      "intent.rebuild.ex2": "Beispiel: „Operating Model ändern.“",

      "step.levels.h": "Wähle bis zu 2 Ebenen",
      "step.levels.p.private": "Wo ist die Instabilität am sichtbarsten?",
      "step.levels.p.business": "Wo ist die Instabilität am sichtbarsten?",
      "levels.private.self": "Selbst",
      "levels.private.relationship": "Beziehung",
      "levels.private.family": "Familie",
      "levels.private.worklife": "Alltag/Arbeit",
      "levels.private.social": "Sozialkreis",
      "levels.business.team": "Team",
      "levels.business.leadership": "Führung",
      "levels.business.org": "Organisation",
      "levels.business.process": "Prozess",
      "levels.business.market": "Markt",

      "step.sliders.h": "Struktur-Scan",
      "step.sliders.p": "Bewege jeden Slider. 0 = stabil. 5 = kritisch.",

      "sl.D.title": "Entscheidungsklarheit",
      "sl.D.desc.private": "Wie klar ist, wer entscheidet und wie Entscheidungen entstehen?",
      "sl.D.ex1.private": "0: „Wir entscheiden ruhig und klar.“",
      "sl.D.ex2.private": "5: „Wir streiten darüber, wer entscheidet.“",
      "sl.D.desc.business": "Wie klar sind Entscheidungsrechte und Eskalationswege?",
      "sl.D.ex1.business": "0: „Owner entscheiden ohne Reibung.“",
      "sl.D.ex2.business": "5: „Alles eskaliert zu einer Person.“",

      "sl.L.title": "Lastverteilung",
      "sl.L.desc.private": "Wie ausgewogen sind Verantwortung und emotionale Last?",
      "sl.L.ex1.private": "0: „Aufgaben sind fair verteilt.“",
      "sl.L.ex2.private": "5: „Eine Person trägt alles.“",
      "sl.L.desc.business": "Wie ausgewogen ist Last über Schlüsselrollen verteilt?",
      "sl.L.ex1.business": "0: „Kein Engpass.“",
      "sl.L.ex2.business": "5: „Einige sind dauerhaft überlastet.“",

      "sl.G.title": "Stressverstärkung",
      "sl.G.desc.private": "Werden kleine Themen unter Stress zu großen Konflikten?",
      "sl.G.ex1.private": "0: „Stress ändert wenig.“",
      "sl.G.ex2.private": "5: „Kleine Trigger explodieren.“",
      "sl.G.desc.business": "Multipliziert Wachstum/Komplexität Koordinationsaufwand schnell?",
      "sl.G.ex1.business": "0: „Wachstum bleibt kontrollierbar.“",
      "sl.G.ex2.business": "5: „Wachstum erzeugt Chaos.“",

      "sl.M.title": "Macht ↔ Verantwortung",
      "sl.M.desc.private": "Trägt der Entscheider auch die Verantwortung?",
      "sl.M.ex1.private": "0: „Passt zusammen.“",
      "sl.M.ex2.private": "5: „Einer entscheidet, der andere bezahlt.“",
      "sl.M.desc.business": "Passt Authority zu Accountability und Risiko?",
      "sl.M.ex1.business": "0: „Accountable Owner haben Authority.“",
      "sl.M.ex2.business": "5: „Accountable Manager dürfen nicht entscheiden.“",

      "sl.E.title": "Energielevel",
      "sl.E.desc.private": "Wie viel Kapazität ist noch da?",
      "sl.E.ex1.private": "0: „Wir haben Ressourcen.“",
      "sl.E.ex2.private": "5: „Wir sind erschöpft.“",
      "sl.E.desc.business": "Wie viel Kapazität ist noch da (Team/Führung)?",
      "sl.E.ex1.business": "0: „Gesundes Tempo + Puffer.“",
      "sl.E.ex2.business": "5: „Burnout-Anzeichen sichtbar.“",

      "sl.F.title": "Fehlerintegration",
      "sl.F.desc.private": "Lernt ihr aus Konflikten oder wiederholt sich die Schleife?",
      "sl.F.ex1.private": "0: „Wir lernen und verbessern.“",
      "sl.F.ex2.private": "5: „Gleicher Streit wiederholt sich.“",
      "sl.F.desc.business": "Führen Fehler/Incidents zu echter Prävention?",
      "sl.F.ex1.business": "0: „Post-mortems verbessern Systeme.“",
      "sl.F.ex2.business": "5: „Fehler wiederholen sich ohne Fix.“",

      "sl.T.title": "Vertrauen & Offenheit",
      "sl.T.desc.private": "Können sensible Themen offen besprochen werden?",
      "sl.T.ex1.private": "0: „Offenheit ist möglich.“",
      "sl.T.ex2.private": "5: „Wichtige Themen werden vermieden.“",
      "sl.T.desc.business": "Kommen schlechte Nachrichten früh hoch?",
      "sl.T.ex1.business": "0: „Bad news kommen früh.“",
      "sl.T.ex2.business": "5: „Probleme werden versteckt.“",

      "sl.S.title": "Strukturklarheit",
      "sl.S.desc.private": "Sind Erwartungen und Rollen explizit?",
      "sl.S.ex1.private": "0: „Erwartungen sind klar.“",
      "sl.S.ex2.private": "5: „Missverständnisse ständig.“",
      "sl.S.desc.business": "Sind Interfaces, Ownership und Prozesse klar?",
      "sl.S.ex1.business": "0: „Übergaben sind sauber.“",
      "sl.S.ex2.business": "5: „Schuld zwischen Teams.“",

      "step.adapt.h": "Präzisionsfragen",
      "step.adapt.p": "Bis zu 6 kurze Fragen erhöhen die Präzision.",
      "adapt.precision": "Präzision",
      "adapt.q_of": "Frage {n} von {max}",

      "step.result.h": "Ergebnis",
      "kpi.primary": "Primärinstabilität",
      "kpi.path": "Pfad",
      "kpi.conf": "Confidence",
      "kpi.tension": "Top-Spannung",
      "sec.radar": "Strukturprofil (Radar)",
      "sec.bars": "Top-Spannungen",
      "sec.primary": "Primär vs Sekundär",
      "sec.moves": "Moves",
      "moves.now": "3 Moves jetzt (48h)",
      "moves.week": "3 Moves diese Woche (7 Tage)",
      "conf.high": "Hoch",
      "conf.med": "Mittel",
      "conf.low": "Niedrig"
    },

    tr: {
      "hero.headline": "Dakikalar içinde karar netliği.",
      "hero.sub": "İstikrarsızlığı erken fark etmek ve sağlam karar mimarisi kurmak için yapısal bir teşhis sistemi.",
      "hero.private": "Hemen analiz et",
      "hero.business": "Şirketler için (Token gerekli)",
      "features.primary.title": "Birincil istikrarsızlık",
      "features.primary.text": "Ana yapısal kök nedeni net bul.",
      "features.secondary.title": "İkincil gerilimler",
      "features.secondary.text": "Neyi büyüttüğünü/anında tetiklediğini gör.",
      "features.path.title": "Stratejik yol",
      "features.path.text": "Stabilize mi, yeniden tasarım mı — sinyale göre.",
      "features.moves.title": "Hemen aksiyon",
      "features.moves.text": "Önümüzdeki 48 saat için net adımlar.",
      "how.title": "Nasıl çalışır",
      "how.step1": "Durumu tek cümleyle yaz.",
      "how.step2": "Niyet seç: stabilize et veya yeniden kur.",
      "how.step3": "Yapısal taramayı tamamla.",
      "how.step4": "Teşhis ve aksiyonları al.",

      "wiz.title.private": "MDG · Kişisel Teşhis",
      "wiz.title.business": "MDG · İşletme Teşhisi",
      "wiz.note": "Yanıtlar tarayıcında yerel kaydedilir.",
      "btn.back": "Geri",
      "btn.next": "Devam",
      "btn.calculate": "Sonucu hesapla",
      "btn.restart": "Yeniden başlat",
      "btn.exec": "Executive Report oluştur",
      "btn.exec_business": "Executive Operating Memo oluştur",

      "step.one_liner.h": "Durumu anlat",
      "step.one_liner.p": "Tek cümle yaz. Somut olsun.",
      "step.one_liner.ex1": "Örnek: “Küçük şeylerden sürekli tartışıyoruz.”",
      "step.one_liner.ex2": "Örnek: “Tüm kararlar kurucuya gidiyor.”",

      "step.intent.h": "Ne istiyorsun?",
      "step.intent.p": "Stratejik niyetini seç.",
      "intent.stabilize.t": "Stabilize et (IDG)",
      "intent.stabilize.p": "Gerilimi düşür, tırmanmayı durdur.",
      "intent.stabilize.ex1": "Örnek: “Tartışma daha kötüleşmesin.”",
      "intent.stabilize.ex2": "Örnek: “Operasyonu birkaç günde stabilize et.”",
      "intent.rebuild.t": "Yeniden kur (ADG)",
      "intent.rebuild.p": "Sorunun tekrarlanmayacağı yapıyı tasarla.",
      "intent.rebuild.ex1": "Örnek: “Rolleri/karar haklarını yeniden tasarla.”",
      "intent.rebuild.ex2": "Örnek: “Operating model değiştir.”",

      "step.levels.h": "En fazla 2 seviye seç",
      "step.levels.p.private": "İstikrarsızlık en çok nerede görülüyor?",
      "step.levels.p.business": "İstikrarsızlık en çok nerede görülüyor?",
      "levels.private.self": "Ben",
      "levels.private.relationship": "İlişki",
      "levels.private.family": "Aile",
      "levels.private.worklife": "İş/Yaşam",
      "levels.private.social": "Sosyal çevre",
      "levels.business.team": "Takım",
      "levels.business.leadership": "Liderlik",
      "levels.business.org": "Organizasyon",
      "levels.business.process": "Süreç",
      "levels.business.market": "Pazar",

      "step.sliders.h": "Yapısal temel tarama",
      "step.sliders.p": "Her sliderı hareket ettir. 0 stabil, 5 kritik.",

      "sl.D.title": "Karar netliği",
      "sl.D.desc.private": "Kim karar veriyor ve nasıl? Ne kadar net?",
      "sl.D.ex1.private": "0: “Sakin ve net karar veriyoruz.”",
      "sl.D.ex2.private": "5: “Kim karar verecek diye tartışıyoruz.”",
      "sl.D.desc.business": "Karar hakları ve eskalasyon yolu ne kadar net?",
      "sl.D.ex1.business": "0: “Owner rahat karar verir.”",
      "sl.D.ex2.business": "5: “Her şey tek kişiye gidiyor.”",

      "sl.L.title": "Yük dağılımı",
      "sl.L.desc.private": "Sorumluluk ve duygusal yük dengeli mi?",
      "sl.L.ex1.private": "0: “İşler adil paylaşılıyor.”",
      "sl.L.ex2.private": "5: “Tek kişi her şeyi taşıyor.”",
      "sl.L.desc.business": "Yük kilit roller arasında dengeli mi?",
      "sl.L.ex1.business": "0: “Tek bir darboğaz yok.”",
      "sl.L.ex2.business": "5: “Bazı kişiler aşırı yükte.”",

      "sl.G.title": "Stres büyütmesi",
      "sl.G.desc.private": "Streste küçük şeyler büyük kavga oluyor mu?",
      "sl.G.ex1.private": "0: “Stres fark yaratmıyor.”",
      "sl.G.ex2.private": "5: “Küçük tetikleyici patlatıyor.”",
      "sl.G.desc.business": "Büyüme/karmaşıklık koordinasyon maliyetini hızla artırıyor mu?",
      "sl.G.ex1.business": "0: “Büyüme kontrol altında.”",
      "sl.G.ex2.business": "5: “Büyüme kaos yaratıyor.”",

      "sl.M.title": "Güç ↔ sorumluluk uyumu",
      "sl.M.desc.private": "Karar veren sorumluluğu da taşıyor mu?",
      "sl.M.ex1.private": "0: “Uyumlu.”",
      "sl.M.ex2.private": "5: “Biri karar verir, diğeri öder.”",
      "sl.M.desc.business": "Yetki, hesap verebilirlik ve risk sahipliği uyumlu mu?",
      "sl.M.ex1.business": "0: “Sorumlu owner yetkili.”",
      "sl.M.ex2.business": "5: “Sorumlu ama yetkisiz.”",

      "sl.E.title": "Enerji seviyesi",
      "sl.E.desc.private": "Ne kadar kapasite kaldı?",
      "sl.E.ex1.private": "0: “Kapasite var.”",
      "sl.E.ex2.private": "5: “Bitmiş durumdayız.”",
      "sl.E.desc.business": "Ne kadar kapasite kaldı (takım/liderlik)?",
      "sl.E.ex1.business": "0: “Sağlıklı tempo + buffer.”",
      "sl.E.ex2.business": "5: “Tükenmişlik belirtileri.”",

      "sl.F.title": "Hata/öğrenme entegrasyonu",
      "sl.F.desc.private": "Kavgadan öğreniyor musunuz yoksa aynı döngü mü?",
      "sl.F.ex1.private": "0: “Öğreniyoruz.”",
      "sl.F.ex2.private": "5: “Aynı kavga tekrar.”",
      "sl.F.desc.business": "Hatalar gerçek düzeltmeye dönüşüyor mu?",
      "sl.F.ex1.business": "0: “Post-mortem ile sistem gelişir.”",
      "sl.F.ex2.business": "5: “Hata tekrar ediyor.”",

      "sl.T.title": "Güven & açıklık",
      "sl.T.desc.private": "Hassas konular açık konuşulabiliyor mu?",
      "sl.T.ex1.private": "0: “Açık konuşuruz.”",
      "sl.T.ex2.private": "5: “Konular kaçınılır.”",
      "sl.T.desc.business": "Kötü haber erken çıkıyor mu?",
      "sl.T.ex1.business": "0: “Kötü haber erken gelir.”",
      "sl.T.ex2.business": "5: “Sorunlar saklanır.”",

      "sl.S.title": "Yapısal netlik",
      "sl.S.desc.private": "Beklenti ve roller açık mı?",
      "sl.S.ex1.private": "0: “Beklentiler net.”",
      "sl.S.ex2.private": "5: “Sürekli yanlış anlama.”",
      "sl.S.desc.business": "Interface/ownership/süreç net mi?",
      "sl.S.ex1.business": "0: “Devirler temiz.”",
      "sl.S.ex2.business": "5: “Takımlar birbirini suçlar.”",

      "step.adapt.h": "Hassasiyet soruları",
      "step.adapt.p": "En fazla 6 kısa soru hassasiyeti artırır.",
      "adapt.precision": "Hassasiyet",
      "adapt.q_of": "Soru {n}/{max}",

      "step.result.h": "Sonuç",
      "kpi.primary": "Birincil instabilite",
      "kpi.path": "Yol",
      "kpi.conf": "Güven",
      "kpi.tension": "En büyük gerilim",
      "sec.radar": "Yapısal profil (radar)",
      "sec.bars": "En büyük gerilimler",
      "sec.primary": "Birincil vs ikincil",
      "sec.moves": "Aksiyon",
      "moves.now": "Şimdi 3 adım (48 saat)",
      "moves.week": "Bu hafta 3 adım (7 gün)",
      "conf.high": "Yüksek",
      "conf.med": "Orta",
      "conf.low": "Düşük"
    }
  };

  function t(key, lang) {
    const L = I18N[lang] || I18N.en;
    return L[key] || I18N.en[key] || key;
  }

  function applyLang(lang) {
    // mark pressed
    $$("[data-lang]").forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang)));
    // apply on elements
    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key, lang);
      // no special placeholders here (Drop 4B can extend)
      el.textContent = val;
    });
  }

  // =========================
  // Landing init
  // =========================
  window.initLanding = function initLanding() {
    const s = loadSession();
    // detect existing lang from session
    const lang = s.meta.lang || CFG.DEFAULT_LANG;
    applyLang(lang);

    $$("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        s.meta.lang = btn.dataset.lang;
        saveSession(s);
        applyLang(s.meta.lang);
      });
    });
  };

  // =========================
  // Diagnose init
  // =========================
  const IS_DIAGNOSE = location.pathname.toLowerCase().endsWith("diagnose.html") || document.title.toLowerCase().includes("diagnosis");

  if (IS_DIAGNOSE) {
    document.addEventListener("DOMContentLoaded", () => {
      const s = loadSession();
      const qs = new URLSearchParams(location.search);
      const mode = (qs.get("mode") || s.meta.mode || "private").toLowerCase();
      s.meta.mode = (mode === "business") ? "business" : "private";
      s.meta.lang = s.meta.lang || CFG.DEFAULT_LANG;

      // Drop 4A: business access is not enforced yet (Drop 4B)
      if (s.meta.mode === "business") s.meta.tier = "business_token";
      else s.meta.tier = "private_free";

      saveSession(s);
      wizardStart(s);
    });
  }

  // =========================
  // Wizard State Machine
  // =========================
  const STATES = {
    ONE_LINER: "S1_ONE_LINER",
    INTENT: "S2_INTENT",
    LEVELS: "S3_LEVELS",
    SLIDERS: "S4_BASELINE_SLIDERS",
    ADAPT: "S5_ADAPTIVE_LOOP",
    RESULT: "S6_RESULT"
  };

  function wizardStart(session) {
    // header badge
    $("#wiz_mode_badge").textContent = `mode: ${session.meta.mode}`;
    // language buttons
    applyLang(session.meta.lang);
    $$("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        session.meta.lang = btn.dataset.lang;
        saveSession(session);
        applyLang(session.meta.lang);
        // rerender current view
        renderState(session);
      });
    });

    // decide initial state
    let state = session.meta._state || STATES.ONE_LINER;
    session.meta._state = state;
    saveSession(session);

    renderState(session);
  }

  function setState(session, state) {
    session.meta._state = state;
    saveSession(session);
    renderState(session);
  }

  function updateProgress(session) {
    // simple mapping of progress per state (not number of answered questions)
    const st = session.meta._state;
    const base = {
      [STATES.ONE_LINER]: 10,
      [STATES.INTENT]: 25,
      [STATES.LEVELS]: 40,
      [STATES.SLIDERS]: 60,
      [STATES.ADAPT]: 78,
      [STATES.RESULT]: 100
    }[st] ?? 0;

    $("#wiz_prog_bar").style.width = base + "%";
    $("#wiz_prog_pct").textContent = base + "%";
  }

  function renderState(session) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;

    $("#wiz_title").textContent = t(mode === "business" ? "wiz.title.business" : "wiz.title.private", lang);
    $("#wiz_footer_note").textContent = t("wiz.note", lang);

    updateProgress(session);

    const st = session.meta._state;
    const body = $("#wiz_body");
    const actions = $("#wiz_actions");

    body.innerHTML = "";
    actions.innerHTML = "";

    if (st === STATES.ONE_LINER) renderOneLiner(session, body, actions);
    else if (st === STATES.INTENT) renderIntent(session, body, actions);
    else if (st === STATES.LEVELS) renderLevels(session, body, actions);
    else if (st === STATES.SLIDERS) renderSliders(session, body, actions);
    else if (st === STATES.ADAPT) renderAdaptive(session, body, actions);
    else if (st === STATES.RESULT) renderResult(session, body, actions);
    else renderOneLiner(session, body, actions);
  }

  // =========================
  // Step Renderers
  // =========================
  function renderOneLiner(session, body, actions) {
    const lang = session.meta.lang;

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.one_liner.h">${esc(t("step.one_liner.h", lang))}</h2>
      <p class="sub" data-i18n="step.one_liner.p">${esc(t("step.one_liner.p", lang))}</p>

      <div class="field">
        <label class="label" for="one_liner">One sentence</label>
        <textarea id="one_liner" class="textarea" placeholder="" rows="4">${esc(session.input.one_liner || "")}</textarea>
        <div class="hint">
          <div>${esc(t("step.one_liner.ex1", lang))}</div>
          <div>${esc(t("step.one_liner.ex2", lang))}</div>
        </div>
      </div>
    `;

    const ta = $("#one_liner");
    ta.addEventListener("input", () => {
      session.input.one_liner = ta.value.slice(0, 420);
      saveSession(session);
    });

    actions.innerHTML = `
      <div></div>
      <button class="btn btn--primary" id="next_btn">${esc(t("btn.next", lang))}</button>
    `;

    $("#next_btn").addEventListener("click", () => {
      if (!session.input.one_liner.trim()) { ta.focus(); return; }
      setState(session, STATES.INTENT);
    });
  }

  function renderIntent(session, body, actions) {
    const lang = session.meta.lang;

    const selected = session.input.intent || "";

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.intent.h">${esc(t("step.intent.h", lang))}</h2>
      <p class="sub" data-i18n="step.intent.p">${esc(t("step.intent.p", lang))}</p>

      <div class="choice-grid" role="listbox" aria-label="Intent">
        <div class="choice" id="intent_stab" role="option" aria-selected="${selected === "stabilize"}">
          <div class="t">${esc(t("intent.stabilize.t", lang))}</div>
          <div class="ex">
            ${esc(t("intent.stabilize.p", lang))}<br/>
            <span class="mono">${esc(t("intent.stabilize.ex1", lang))}</span><br/>
            <span class="mono">${esc(t("intent.stabilize.ex2", lang))}</span>
          </div>
        </div>

        <div class="choice" id="intent_reb" role="option" aria-selected="${selected === "rebuild"}">
          <div class="t">${esc(t("intent.rebuild.t", lang))}</div>
          <div class="ex">
            ${esc(t("intent.rebuild.p", lang))}<br/>
            <span class="mono">${esc(t("intent.rebuild.ex1", lang))}</span><br/>
            <span class="mono">${esc(t("intent.rebuild.ex2", lang))}</span>
          </div>
        </div>
      </div>
    `;

    function selectIntent(v) {
      session.input.intent = v;
      saveSession(session);
      $("#intent_stab").setAttribute("aria-selected", String(v === "stabilize"));
      $("#intent_reb").setAttribute("aria-selected", String(v === "rebuild"));
    }

    $("#intent_stab").addEventListener("click", () => selectIntent("stabilize"));
    $("#intent_reb").addEventListener("click", () => selectIntent("rebuild"));

    actions.innerHTML = `
      <button class="btn" id="back_btn">${esc(t("btn.back", lang))}</button>
      <button class="btn btn--primary" id="next_btn">${esc(t("btn.next", lang))}</button>
    `;

    $("#back_btn").addEventListener("click", () => setState(session, STATES.ONE_LINER));
    $("#next_btn").addEventListener("click", () => {
      if (!session.input.intent) return;
      setState(session, STATES.LEVELS);
    });
  }

  function renderLevels(session, body, actions) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;

    const P = mode === "business" ? "step.levels.p.business" : "step.levels.p.private";

    const items = mode === "business"
      ? [
        { k: "levels.business.team", v: "team" },
        { k: "levels.business.leadership", v: "leadership" },
        { k: "levels.business.org", v: "org" },
        { k: "levels.business.process", v: "process" },
        { k: "levels.business.market", v: "market" }
      ]
      : [
        { k: "levels.private.self", v: "self" },
        { k: "levels.private.relationship", v: "relationship" },
        { k: "levels.private.family", v: "family" },
        { k: "levels.private.worklife", v: "worklife" },
        { k: "levels.private.social", v: "social" }
      ];

    const selected = new Set(session.input.levels || []);

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.levels.h">${esc(t("step.levels.h", lang))}</h2>
      <p class="sub">${esc(t(P, lang))}</p>

      <div class="chips" id="levels_wrap"></div>
      <p class="micro">Max 2 selections.</p>
    `;

    const wrap = $("#levels_wrap");
    wrap.innerHTML = items.map(it => {
      const on = selected.has(it.v);
      return `<button class="chip" type="button" data-level="${esc(it.v)}" aria-pressed="${on}">${esc(t(it.k, lang))}</button>`;
    }).join("");

    function refresh() {
      $$("[data-level]").forEach(btn => {
        const v = btn.dataset.level;
        btn.setAttribute("aria-pressed", String(selected.has(v)));
      });
    }

    wrap.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-level]");
      if (!btn) return;
      const v = btn.dataset.level;
      if (selected.has(v)) selected.delete(v);
      else {
        if (selected.size >= 2) return;
        selected.add(v);
      }
      session.input.levels = Array.from(selected);
      saveSession(session);
      refresh();
    });

    actions.innerHTML = `
      <button class="btn" id="back_btn">${esc(t("btn.back", lang))}</button>
      <button class="btn btn--primary" id="next_btn">${esc(t("btn.next", lang))}</button>
    `;

    $("#back_btn").addEventListener("click", () => setState(session, STATES.INTENT));
    $("#next_btn").addEventListener("click", () => {
      if (!session.input.levels || session.input.levels.length === 0) return;
      setState(session, STATES.SLIDERS);
    });
  }

  function renderSliders(session, body, actions) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.sliders.h">${esc(t("step.sliders.h", lang))}</h2>
      <p class="sub" data-i18n="step.sliders.p">${esc(t("step.sliders.p", lang))}</p>
      <div id="sliders_wrap"></div>
    `;

    const axes = ["D","L","G","M","E","F","T","S"];
    const wrap = $("#sliders_wrap");

    wrap.innerHTML = axes.map(ax => {
      const v = session.input.sliders_0to5[ax] ?? 0;
      const title = t(`sl.${ax}.title`, lang);
      const desc = t(`sl.${ax}.desc.${mode}`, lang);
      const ex1 = t(`sl.${ax}.ex1.${mode}`, lang);
      const ex2 = t(`sl.${ax}.ex2.${mode}`, lang);

      return `
        <div class="slider" data-ax="${ax}">
          <div class="slider__top">
            <div>
              <div class="slider__name">${esc(title)}</div>
              <div class="micro">${esc(desc)}</div>
            </div>
            <div class="slider__val"><span id="val_${ax}">${v}</span>/5</div>
          </div>

          <div class="slider__ex">
            <div>• ${esc(ex1)}</div>
            <div>• ${esc(ex2)}</div>
          </div>

          <div class="range">
            <input type="range" min="0" max="5" step="1" value="${v}" id="rng_${ax}">
            <div class="range__meta"><span>0 stable</span><span>5 severe</span></div>
          </div>
        </div>
      `;
    }).join("");

    axes.forEach(ax => {
      const el = $(`#rng_${ax}`);
      el.addEventListener("input", () => {
        const v = Number(el.value);
        session.input.sliders_0to5[ax] = v;
        $(`#val_${ax}`).textContent = String(v);
        saveSession(session);
      });
    });

    actions.innerHTML = `
      <button class="btn" id="back_btn">${esc(t("btn.back", lang))}</button>
      <button class="btn btn--primary" id="calc_btn">${esc(t("btn.calculate", lang))}</button>
    `;

    $("#back_btn").addEventListener("click", () => setState(session, STATES.LEVELS));
    $("#calc_btn").addEventListener("click", () => {
      // Always compute base result first
      computeCore(session);
      // Enter adaptive if needed
      session.meta._adapt_index = 0;
      saveSession(session);
      setState(session, STATES.ADAPT);
    });
  }

  function renderAdaptive(session, body, actions) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;

    // Ensure core exists
    computeCore(session);

    // Evaluate if we should stop and show results
    const evalRes = evaluateConfidence(session);
    if (shouldStop(evalRes, session)) {
      setState(session, STATES.RESULT);
      return;
    }

    // If max reached, go result
    const asked = session.input.adaptive_answers?.length || 0;
    if (asked >= CFG.MAX_ADAPTIVE_Q) {
      setState(session, STATES.RESULT);
      return;
    }

    // Select next question
    const q = selectNextQuestion(session);
    if (!q) {
      // No question found => result
      setState(session, STATES.RESULT);
      return;
    }

    session.core.classification.killer_question = {
      asked: true,
      qid: q.qid,
      text: q.text(session.meta.lang),
      options: q.options(session.meta.lang)
    };
    saveSession(session);

    const precisionPct = round(evalRes.CONF * 100);

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.adapt.h">${esc(t("step.adapt.h", lang))}</h2>
      <p class="sub" data-i18n="step.adapt.p">${esc(t("step.adapt.p", lang))}</p>

      <div class="kpi">
        <div class="tile">
          <div class="label">${esc(t("adapt.precision", lang))}</div>
          <div class="value">${precisionPct}%</div>
        </div>
        <div class="tile">
          <div class="label">${esc(t("adapt.q_of", lang).replace("{n}", String(asked + 1)).replace("{max}", String(CFG.MAX_ADAPTIVE_Q)))}</div>
          <div class="value">${asked + 1}/${CFG.MAX_ADAPTIVE_Q}</div>
        </div>
      </div>

      <div class="adapt" style="margin-top:14px;">
        <div class="q">${esc(q.text(lang))}</div>

        <div class="examples">
          <div class="example"><div class="tag">Example 1</div><div>${esc(q.ex1(lang))}</div></div>
          <div class="example"><div class="tag">Example 2</div><div>${esc(q.ex2(lang))}</div></div>
        </div>

        <div class="options" id="opt_wrap" style="margin-top:12px;">
          ${q.options(lang).map(opt => `
            <div class="opt" role="button" tabindex="0" data-opt="${esc(opt.value)}">
              <div><strong>${esc(opt.label)}</strong></div>
              ${opt.hint ? `<div class="micro" style="margin-top:6px;">${esc(opt.hint)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const wrap = $("#opt_wrap");
    wrap.addEventListener("click", (e) => {
      const opt = e.target?.closest?.("[data-opt]");
      if (!opt) return;
      const answer = opt.dataset.opt;

      // Store answer
      session.input.adaptive_answers = session.input.adaptive_answers || [];
      session.input.adaptive_answers.push({ qid: q.qid, answer });

      // Apply answer boosts (affects confidence next iteration)
      session.meta._adaptive_boosts = session.meta._adaptive_boosts || [];
      session.meta._adaptive_boosts.push({ qid: q.qid, answer });

      saveSession(session);

      // Recompute and loop
      computeCore(session);
      setState(session, STATES.ADAPT);
    });

    actions.innerHTML = `
      <button class="btn" id="back_btn">${esc(t("btn.back", lang))}</button>
      <button class="btn btn--primary" id="skip_btn">${esc(t("btn.next", lang))}</button>
    `;

    $("#back_btn").addEventListener("click", () => setState(session, STATES.SLIDERS));
    $("#skip_btn").addEventListener("click", () => {
      // allow continue without answering by forcing result
      setState(session, STATES.RESULT);
    });
  }

  function renderResult(session, body, actions) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;

    computeCore(session);
    const evalRes = evaluateConfidence(session);
    const confLabel = evalRes.CONF >= 0.82 ? t("conf.high", lang) : (evalRes.CONF >= 0.68 ? t("conf.med", lang) : t("conf.low", lang));

    const cls = session.core.classification;
    const primary = cls.primary?.label || "—";
    const path = cls.path?.code || "—";

    const topTension = (session.core.tensions_top?.[0]?.label) || "—";

    body.innerHTML = `
      <h2 class="h2" data-i18n="step.result.h">${esc(t("step.result.h", lang))}</h2>

      <div class="result" style="margin-top:14px;">
        <div class="kpi-row">
          <div class="tile"><div class="k">${esc(t("kpi.primary", lang))}</div><div class="v">${esc(primary)}</div></div>
          <div class="tile"><div class="k">${esc(t("kpi.path", lang))}</div><div class="v">${esc(path)}</div></div>
          <div class="tile"><div class="k">${esc(t("kpi.conf", lang))}</div><div class="v">${round(evalRes.CONF * 100)}% · ${esc(confLabel)}</div></div>
          <div class="tile"><div class="k">${esc(t("kpi.tension", lang))}</div><div class="v">${esc(topTension)}</div></div>
        </div>

        <div class="chart-grid">
          <div class="chart">
            <div class="h3">${esc(t("sec.radar", lang))}</div>
            <div id="radar_wrap" style="margin-top:12px;"></div>
            <div class="caption micro">${esc(radarCaption(mode, lang))}</div>
          </div>

          <div class="chart">
            <div class="h3">${esc(t("sec.bars", lang))}</div>
            <div class="bars" id="bars_wrap"></div>
          </div>
        </div>

        <div class="card">
          <div class="h3">${esc(t("sec.primary", lang))}</div>
          <div style="margin-top:10px;">
            <div class="badge">Primary</div>
            <div style="margin-top:10px; font-weight:950; font-size:1.2rem;">${esc(primary)}</div>
            <ul class="list">
              ${(cls.primary?.why || []).map(x => `<li>${esc(x)}</li>`).join("")}
            </ul>
          </div>
          <div class="hr"></div>
          <div>
            <div class="badge">Secondary</div>
            <ul class="list">
              ${(cls.secondary || []).map(x => `<li>${esc(x.label)} — ${esc(x.why || "")}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="h3">${esc(t("sec.moves", lang))}</div>

          <div class="choice-grid" style="margin-top:12px;">
            <div class="card" style="margin:0;">
              <div class="badge">${esc(t("moves.now", lang))}</div>
              <ol class="list">
                ${(cls.moves?.now_48h || []).map(x => `<li>${esc(x)}</li>`).join("")}
              </ol>
            </div>
            <div class="card" style="margin:0;">
              <div class="badge">${esc(t("moves.week", lang))}</div>
              <ol class="list">
                ${(cls.moves?.week_7d || []).map(x => `<li>${esc(x)}</li>`).join("")}
              </ol>
            </div>
          </div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn--secondary" id="exec_btn">${esc(mode === "business" ? t("btn.exec_business", lang) : t("btn.exec", lang))}</button>
            <button class="btn" id="restart_btn">${esc(t("btn.restart", lang))}</button>
          </div>

          <p class="micro" style="margin-top:10px;">
            Drop 4A: Executive report generation is activated in Drop 4B (Worker + OpenAI). Button will later open report.html.
          </p>
        </div>

      </div>
    `;

    // Render Radar + Bars
    renderRadarSVG($("#radar_wrap"), session.input.sliders_0to5, mode, lang);
    renderTopBars($("#bars_wrap"), session.core.tensions_top);

    $("#restart_btn").addEventListener("click", () => {
      localStorage.removeItem(CFG.STORAGE_KEY);
      location.href = "./diagnose.html?mode=" + encodeURIComponent(mode);
    });

    $("#exec_btn").addEventListener("click", () => {
      // Drop 4A placeholder
      alert("Drop 4B: This will generate a premium executive report (LLM + fallback) and open report.html.");
    });

    actions.innerHTML = `
      <button class="btn" id="back_btn">${esc(t("btn.back", lang))}</button>
      <div></div>
    `;
    $("#back_btn").addEventListener("click", () => setState(session, STATES.SLIDERS));
  }

  // =========================
  // Deterministic Engine
  // =========================
  function slider100(v0to5) {
    const v = Number(v0to5) || 0;
    return round((v / 5) * 100);
  }

  function computeCore(session) {
    const s = session.input.sliders_0to5;

    const D = slider100(s.D);
    const L = slider100(s.L);
    const G = slider100(s.G);
    const M = slider100(s.M);
    const E = slider100(s.E);
    const F = slider100(s.F);
    const T = slider100(s.T);
    const Sx = slider100(s.S);

    const EF = round(0.55 * E + 0.45 * F);
    const TS = round(0.55 * T + 0.45 * Sx);
    const ALL = round(avg([D, L, G, M, EF, TS]));

    session.core.scores_0to100 = { D, L, G, M, EF, TS, ALL };

    // Compute tensions
    session.core.tensions_top = computeTopTensions(session);

    // Classify
    session.core.classification = classify(session);

    saveSession(session);
  }

  function avg(xs) {
    const v = xs.filter(n => typeof n === "number" && !Number.isNaN(n));
    if (!v.length) return 0;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }

  // Tension scoring helpers
  function computeTopTensions(session) {
    const { D, L, G, M, EF, TS } = session.core.scores_0to100;
    const mode = session.meta.mode;
    const lang = session.meta.lang;

    const tensions = [
      {
        code: "SPOF_RISK",
        score: round(0.55 * L + 0.45 * D),
        label: mode === "business" ? "Single point of failure" : "Single point of failure",
        why: mode === "business"
          ? "Key decisions and load are concentrated."
          : "Decisions and load depend on one person."
      },
      {
        code: "GROWTH_AMPLIFIER",
        score: G,
        label: "Amplification under stress/growth",
        why: mode === "business"
          ? "Growth/complexity multiplies coordination cost."
          : "Stress makes small triggers escalate."
      },
      {
        code: "ACCOUNTABILITY_GAP",
        score: M,
        label: mode === "business" ? "Accountability gap" : "Power-responsibility mismatch",
        why: mode === "business"
          ? "Authority and accountability are misaligned."
          : "Decision power and responsibility are decoupled."
      },
      {
        code: "ENERGY_RED",
        score: EF,
        label: "Energy & learning risk",
        why: mode === "business"
          ? "Capacity is low and learning loops are weak."
          : "Low energy increases instability and repeats loops."
      },
      {
        code: "TRUST_FRACTURE",
        score: TS,
        label: "Trust / clarity fracture",
        why: mode === "business"
          ? "Bad news doesn’t surface early; interfaces blur."
          : "Sensitive topics are avoided; expectations unclear."
      }
    ];

    tensions.sort((a, b) => b.score - a.score);
    const top = tensions.slice(0, 3).map(tn => ({
      code: tn.code,
      value: tn.score,
      label: tn.label,
      why: [tn.why]
    }));

    return top;
  }

  function classify(session) {
    const lang = session.meta.lang;
    const mode = session.meta.mode;
    const scores = session.core.scores_0to100;

    // Rank main types
    const entries = [
      { code: "D", v: scores.D, label: mode === "business" ? "Decision architecture friction" : "Decision ambiguity" },
      { code: "L", v: scores.L, label: mode === "business" ? "Load bottleneck" : "Load asymmetry" },
      { code: "G", v: scores.G, label: mode === "business" ? "Growth without structure" : "Stress amplification" },
      { code: "M", v: scores.M, label: mode === "business" ? "Accountability gap" : "Power-responsibility mismatch" },
      { code: "EF", v: scores.EF, label: mode === "business" ? "Capacity & learning deficit" : "Energy & repetition loop" },
      { code: "TS", v: scores.TS, label: mode === "business" ? "Trust / interface fracture" : "Trust / expectation fracture" }
    ];

    entries.sort((a, b) => b.v - a.v);
    const top1 = entries[0];
    const top2 = entries[1];

    // Path logic
    const path = decidePath(session);

    // Primary why bullets (short, testable)
    const why = buildPrimaryWhy(top1.code, scores, mode);

    // Secondary list (2 items)
    const secondary = [top2].map(e => ({
      code: e.code,
      label: e.label,
      why: secondaryWhy(e.code, mode)
    }));

    // Moves
    const moves = buildMoves(top1.code, scores, mode, session.input.intent);

    const evalRes = evaluateConfidence(session);

    return {
      primary: { code: top1.code, label: top1.label, confidence: evalRes.CONF, why },
      secondary,
      path,
      moves,
      killer_question: session.core.classification?.killer_question || { asked: false, qid: null, text: null, options: [] }
    };
  }

  function decidePath(session) {
    const scores = session.core.scores_0to100;
    const intent = session.input.intent;
    const ADG_trigger = (scores.G >= 70) || (scores.D >= 75) || (scores.L >= 75) || (scores.M >= 78);
    const IDG_first = (scores.EF >= 78) || (scores.TS >= 82) || (scores.G >= 82);

    let code = "IDG";
    const why = [];

    if (intent === "rebuild") {
      if (IDG_first) { code = "IDG → ADG"; why.push("Stabilize capacity/trust first, then redesign architecture."); }
      else { code = "ADG"; why.push("Intent is rebuild and signals indicate structural redesign."); }
    } else {
      // stabilize intent
      if (ADG_trigger && IDG_first) { code = "IDG → ADG"; why.push("Stabilize first; redesign is still required."); }
      else if (ADG_trigger) { code = "ADG"; why.push("Signals show stabilization alone won’t hold under load/growth."); }
      else { code = "IDG"; why.push("Stabilization is likely sufficient; redesign optional."); }
    }

    // Add 1–2 evidence bullets
    if (scores.EF >= 78) why.push("Energy/learning is in the red zone.");
    if (scores.G >= 70) why.push("Amplification under growth/stress is significant.");
    if (scores.D >= 75 || scores.L >= 75) why.push("Single point of failure risk is high.");

    return { code, why: why.slice(0, 4) };
  }

  function buildPrimaryWhy(code, scores, mode) {
    const w = [];
    if (code === "D") {
      w.push(mode === "business" ? "Decision rights are unclear or centralised." : "Who decides is unclear or contested.");
      if (scores.L >= 65) w.push("Load concentrates around decision nodes.");
      if (scores.G >= 65) w.push("Under stress, decision latency amplifies instability.");
    }
    if (code === "L") {
      w.push(mode === "business" ? "Key roles carry disproportionate operational load." : "One person carries disproportionate responsibility.");
      if (scores.D >= 65) w.push("Bottlenecks form because decisions follow the bottleneck.");
      if (scores.EF >= 65) w.push("Overload reduces recovery and quality.");
    }
    if (code === "G") {
      w.push(mode === "business" ? "Growth/complexity increases coordination faster than output." : "Stress escalates small triggers into large conflicts.");
      if (scores.D >= 65) w.push("Decision architecture cannot absorb amplification.");
      if (scores.TS >= 65) w.push("Trust/clarity fractures accelerate escalation.");
    }
    if (code === "M") {
      w.push(mode === "business" ? "Accountability and authority are misaligned." : "Power and responsibility are decoupled.");
      if (scores.D >= 65) w.push("Decision paths become political or unclear.");
      if (scores.TS >= 65) w.push("Low transparency increases mismatch and tension.");
    }
    if (code === "EF") {
      w.push(mode === "business" ? "Capacity is low and learning loops are weak." : "Energy is low and conflict loops repeat.");
      if (scores.G >= 65) w.push("Amplification becomes nonlinear at low energy.");
      if (scores.TS >= 65) w.push("Low trust increases friction and error repetition.");
    }
    if (code === "TS") {
      w.push(mode === "business" ? "Interfaces/ownership are unclear and bad news is delayed." : "Sensitive topics are avoided and expectations are unclear.");
      if (scores.D >= 65) w.push("Decision clarity suffers when trust is low.");
      if (scores.M >= 65) w.push("Mismatch grows when transparency is low.");
    }
    return w.slice(0, 4);
  }

  function secondaryWhy(code, mode) {
    const map = {
      D: mode === "business" ? "Escalation and ownership need tightening." : "Clear decision rules reduce conflict.",
      L: mode === "business" ? "Redistribute load to reduce bottlenecks." : "Share responsibility to reduce overload.",
      G: mode === "business" ? "Limit complexity until structure catches up." : "Reduce triggers under stress.",
      M: mode === "business" ? "Align authority with accountability." : "Couple decision power to responsibility.",
      EF: mode === "business" ? "Increase buffer and learning cadence." : "Recover energy and break loops.",
      TS: mode === "business" ? "Improve transparency and interfaces." : "Make expectations explicit."
    };
    return map[code] || "";
  }

  function buildMoves(primaryCode, scores, mode, intent) {
    // Always give 3 + 3, deterministic
    const now = [];
    const week = [];

    // Energy-first rule
    if (scores.EF >= 78) {
      now.push(mode === "business"
        ? "Reduce load immediately: stop non-critical work for 48h."
        : "Reduce load immediately: pause non-essential triggers for 48h.");
      now.push("No irreversible decisions for 48h.");
      now.push(mode === "business" ? "Daily 10-min signal check (capacity, blockers)." : "Daily 10-min check: energy + main trigger.");
      week.push("Install a recovery cadence (sleep/buffer) + one measurable signal.");
      week.push(mode === "business" ? "Run one post-mortem and implement one prevention." : "Write one loop-break rule and test it for 7 days.");
      week.push("Define a stop-list: what is no longer acceptable.");
    }

    // Primary-specific
    if (primaryCode === "D") {
      now.push("Decision triage: only top-3 decisions today.");
      now.push("Define decision classes: A/B/C.");
      week.push("Create a delegation matrix (who decides what).");
      week.push("Define an escalation rule + fallback owner.");
      week.push("Start a decision log (owner, reason, review date).");
    }
    if (primaryCode === "L") {
      now.push(mode === "business" ? "Map bottlenecks: move 2 tasks off the top node today." : "Identify the overloaded person: move 2 tasks today.");
      now.push("Define a backup for the bottleneck role.");
      week.push("Document the 3 most critical handoffs as checklists.");
      week.push("Shift 20% load away from the bottleneck.");
      week.push("Define a hard capacity boundary (what you stop accepting).");
    }
    if (primaryCode === "G") {
      now.push(mode === "business" ? "Freeze new complexity for 7 days." : "Reduce triggers: no new conflict topics for 48h.");
      now.push("Reduce interfaces: define 1–2 clear handoff points.");
      week.push("Introduce a fixed review cadence (weekly).");
      week.push("Define a complexity budget (what is forbidden).");
      week.push("Allow growth only if structural criteria are met.");
    }
    if (primaryCode === "M") {
      now.push("List decisions vs responsibility vs consequences (make mismatch visible).");
      now.push("Assign an owner for the top tension (single name).");
      week.push("Document role rights: decide / accountable / consulted / informed.");
      week.push("Define 1 KPI per owner (accountability anchor).");
      week.push("Define delegation + escalation path.");
    }
    if (primaryCode === "EF") {
      now.push("Track energy daily (0–5) + trend.");
      now.push(mode === "business" ? "Create a no-blame incident channel." : "Create a no-blame conflict note format.");
      week.push("Fix review rhythm: weekly review + root cause.");
      week.push("Document lessons learned (3 bullets).");
      week.push("Rule: no decisions at energy minimum.");
    }
    if (primaryCode === "TS") {
      now.push(mode === "business" ? "Define 1 transparency rule: bad news within 24h." : "Define 1 openness rule: sensitive topic within 24h.");
      now.push("Make expectations explicit for one recurring conflict area.");
      week.push(mode === "business" ? "Clarify ownership and interfaces for top 2 handoffs." : "Write 3 explicit expectations and agree on them.");
      week.push("Create an escalation-safe space (rules).");
      week.push("Install a weekly alignment ritual (15 min).");
    }

    // Dedupe and cut to 3 each
    const uniq = (arr) => Array.from(new Set(arr));
    const n1 = uniq(now).slice(0, 3);
    const w1 = uniq(week).slice(0, 3);

    while (n1.length < 3) n1.push("—");
    while (w1.length < 3) w1.push("—");

    return { now_48h: n1, week_7d: w1 };
  }

  // =========================
  // Confidence + Adaptive
  // =========================
  function evaluateConfidence(session) {
    const scores = session.core.scores_0to100;
    const types = [
      { code: "D", v: scores.D },
      { code: "L", v: scores.L },
      { code: "G", v: scores.G },
      { code: "M", v: scores.M },
      { code: "EF", v: scores.EF },
      { code: "TS", v: scores.TS }
    ].sort((a, b) => b.v - a.v);

    const top1 = types[0];
    const top2 = types[1];
    const gap = (top1?.v ?? 0) - (top2?.v ?? 0);
    const SC = clamp(gap / 25, 0, 1);

    // consistency bonus (max 0.20)
    let bonus = 0;
    if (scores.L >= 75 && scores.D >= 70) bonus += 0.10;
    if (scores.G >= 75) bonus += 0.08;
    if (scores.EF >= 80) bonus += 0.08;
    if (scores.TS >= 82) bonus += 0.08;
    const KB = Math.min(0.20, bonus);

    // adaptive boosts
    const boosts = computeAdaptiveBoost(session, top1.code, top2.code);
    const AB = clamp(boosts, -0.25, 0.25);

    const CONF = clamp(0.45 * SC + KB + AB, 0, 1);

    return { types, top1, top2, gap, SC, KB, AB, CONF };
  }

  function shouldStop(evalRes) {
    const { CONF, gap, top1, top2 } = evalRes;
    const stopA = (CONF >= CFG.CONF_THRESHOLD && gap >= 12);
    const stopB = ((top1?.v ?? 0) >= 78 && (top2?.v ?? 0) <= 62);
    return stopA || stopB;
  }

  // -------------------------
  // Adaptive question bank (12+12 in Drop 4A)
  // Each question includes per-language text, two examples, options, and answer_map boosts.
  // -------------------------

  const ADAPT = {
    private: [
      {
        qid: "P1",
        targets: ["D", "L"],
        weight: 0.13,
        text: (lang) => ({
          en: "If the most loaded person disappeared for 2 weeks — what happens?",
          de: "Wenn die belastetste Person 2 Wochen fehlt — was passiert?",
          tr: "En çok yük taşıyan kişi 2 hafta yoksa ne olur?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“If I’m gone, everything collapses.”",
          de: "„Wenn ich weg bin, bricht alles zusammen.“",
          tr: "“Ben yokken her şey çöker.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“It becomes calmer and easier.”",
          de: "„Dann wird es ruhiger und leichter.“",
          tr: "“Daha sakin ve kolay olur.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "collapse", label: ({en:"System collapses",de:"System kollabiert",tr:"Sistem çöker"}[lang]||""), hint: "" },
          { value: "reduce", label: ({en:"Tension reduces",de:"Spannung sinkt",tr:"Gerilim düşer"}[lang]||""), hint: "" },
          { value: "no_change", label: ({en:"No major change",de:"Kaum Veränderung",tr:"Büyük değişim yok"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          collapse: { L: +0.12, D: +0.06 },
          reduce: { EF: +0.06, TS: +0.06, L: -0.10 },
          no_change: { D: -0.06, L: -0.06 }
        }
      },
      {
        qid: "P2",
        targets: ["D", "M"],
        weight: 0.12,
        text: (lang) => ({
          en: "In conflicts, is it about the topic — or about who decides?",
          de: "Geht es im Streit eher um das Thema — oder darum, wer entscheidet?",
          tr: "Tartışmada konu mu, yoksa kimin karar verdiği mi?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "Topic: “How much money we spend.”",
          de: "Thema: „Wie viel Geld wir ausgeben.“",
          tr: "Konu: “Ne kadar para harcıyoruz.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "Power: “You never let me decide.”",
          de: "Macht: „Du lässt mich nie entscheiden.“",
          tr: "Güç: “Bana karar hakkı vermiyorsun.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "topic", label: ({en:"Mostly topic",de:"Eher Thema",tr:"Daha çok konu"}[lang]||""), hint: "" },
          { value: "power", label: ({en:"Mostly decision power",de:"Eher Entscheidungsmacht",tr:"Daha çok karar gücü"}[lang]||""), hint: "" },
          { value: "both", label: ({en:"Both",de:"Beides",tr:"İkisi de"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          topic: { D: -0.06, M: -0.03 },
          power: { D: +0.10, M: +0.06 },
          both: { D: +0.06, M: +0.06 }
        }
      },
      {
        qid: "P3",
        targets: ["G", "EF"],
        weight: 0.12,
        text: (lang) => ({
          en: "Under stress, do small issues become big conflicts quickly?",
          de: "Werden kleine Themen unter Stress schnell zu großen Konflikten?",
          tr: "Streste küçük şeyler hızlıca büyük kavgaya dönüşüyor mu?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“A small comment becomes a fight within minutes.”",
          de: "„Ein Kommentar wird in Minuten zum Streit.“",
          tr: "“Küçük bir söz dakikada kavgaya döner.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Even under stress, we stay stable.”",
          de: "„Auch unter Stress bleiben wir stabil.“",
          tr: "“Streste bile stabil kalırız.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes_strong", label: ({en:"Yes, strongly",de:"Ja, stark",tr:"Evet, çok"}[lang]||""), hint: "" },
          { value: "some", label: ({en:"Somewhat",de:"Etwas",tr:"Biraz"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes_strong: { G: +0.12, EF: +0.06 },
          some: { G: +0.06, EF: +0.03 },
          no: { G: -0.08 }
        }
      },
      {
        qid: "P4",
        targets: ["F", "TS"],
        weight: 0.10,
        text: (lang) => ({
          en: "Do conflicts repeat in almost the same pattern?",
          de: "Wiederholt sich der Konflikt fast identisch?",
          tr: "Kavgalar neredeyse aynı döngüyle mi tekrar ediyor?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“It’s the same fight every week.”",
          de: "„Es ist jede Woche derselbe Streit.“",
          tr: "“Her hafta aynı kavga.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Each conflict is different and we learn.”",
          de: "„Jeder Konflikt ist anders, wir lernen.“",
          tr: "“Her tartışma farklı, öğreniyoruz.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes",de:"Ja",tr:"Evet"}[lang]||""), hint: "" },
          { value: "partial", label: ({en:"Partly",de:"Teilweise",tr:"Kısmen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { EF: +0.10, TS: +0.04 },
          partial: { EF: +0.05 },
          no: { EF: -0.06 }
        }
      },
      {
        qid: "P5",
        targets: ["TS", "D"],
        weight: 0.11,
        text: (lang) => ({
          en: "Are there sensitive topics you avoid talking about?",
          de: "Gibt es sensible Themen, die ihr vermeidet?",
          tr: "Konuşmaktan kaçındığınız hassas konular var mı?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“We never talk about money.”",
          de: "„Über Geld reden wir nie.“",
          tr: "“Para konusunu hiç konuşmayız.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“We can discuss anything openly.”",
          de: "„Wir können alles offen besprechen.“",
          tr: "“Her şeyi açıkça konuşuruz.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "avoid", label: ({en:"Yes, we avoid",de:"Ja, wir vermeiden",tr:"Evet, kaçınıyoruz"}[lang]||""), hint: "" },
          { value: "some", label: ({en:"Sometimes",de:"Manchmal",tr:"Bazen"}[lang]||""), hint: "" },
          { value: "open", label: ({en:"No, open discussion",de:"Nein, offen",tr:"Hayır, açık"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          avoid: { TS: +0.12, D: +0.04 },
          some: { TS: +0.06 },
          open: { TS: -0.08 }
        }
      },
      {
        qid: "P6",
        targets: ["M", "L"],
        weight: 0.11,
        text: (lang) => ({
          en: "Does someone carry responsibility without real decision power?",
          de: "Trägt jemand Verantwortung ohne echte Entscheidungsmacht?",
          tr: "Birisi sorumluluk taşıyor ama karar gücü yok mu?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“I manage everything, but I’m not allowed to decide.”",
          de: "„Ich organisiere alles, darf aber nicht entscheiden.“",
          tr: "“Her şeyi ben yürütüyorum ama karar veremiyorum.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Who decides also carries the responsibility.”",
          de: "„Wer entscheidet, trägt auch Verantwortung.“",
          tr: "“Karar veren sorumluluğu da taşır.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes, clearly",de:"Ja, deutlich",tr:"Evet, net"}[lang]||""), hint: "" },
          { value: "partial", label: ({en:"Partly",de:"Teilweise",tr:"Kısmen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { M: +0.12, L: +0.04 },
          partial: { M: +0.06 },
          no: { M: -0.08 }
        }
      }
    ],

    business: [
      {
        qid: "B1",
        targets: ["D", "L"],
        weight: 0.14,
        text: (lang) => ({
          en: "If the founder/lead is absent for 2 weeks — what happens?",
          de: "Wenn Gründer/Lead 2 Wochen fehlt — was passiert?",
          tr: "Kurucu/lead 2 hafta yoksa ne olur?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“Decisions stop and delivery freezes.”",
          de: "„Entscheidungen stoppen, Delivery friert ein.“",
          tr: "“Kararlar durur, teslimat donar.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“The team keeps operating normally.”",
          de: "„Das Team läuft normal weiter.“",
          tr: "“Takım normal devam eder.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "freeze", label: ({en:"Operations freeze",de:"Betrieb friert ein",tr:"Operasyon donar"}[lang]||""), hint: "" },
          { value: "slow", label: ({en:"Minor slowdown",de:"Leichte Verlangsamung",tr:"Hafif yavaşlar"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No effect",de:"Kein Effekt",tr:"Etkisi yok"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          freeze: { L: +0.12, D: +0.08 },
          slow: { L: +0.06, D: +0.04 },
          no: { L: -0.08, D: -0.04 }
        }
      },
      {
        qid: "B2",
        targets: ["G", "D"],
        weight: 0.12,
        text: (lang) => ({
          en: "Does coordination cost grow faster than output as you scale?",
          de: "Wächst Koordinationsaufwand schneller als Output?",
          tr: "Ölçeklenince koordinasyon maliyeti output'tan hızlı mı artıyor?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“More people = more meetings, slower delivery.”",
          de: "„Mehr Leute = mehr Meetings, langsamere Delivery.“",
          tr: "“Daha çok kişi = daha çok toplantı, daha yavaş teslimat.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Scaling increases output without chaos.”",
          de: "„Skalierung erhöht Output ohne Chaos.“",
          tr: "“Ölçek büyürken kaos olmuyor.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes",de:"Ja",tr:"Evet"}[lang]||""), hint: "" },
          { value: "some", label: ({en:"Somewhat",de:"Etwas",tr:"Biraz"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { G: +0.12, D: +0.04 },
          some: { G: +0.06 },
          no: { G: -0.08 }
        }
      },
      {
        qid: "B3",
        targets: ["M", "D"],
        weight: 0.12,
        text: (lang) => ({
          en: "Are managers accountable without authority to decide?",
          de: "Sind Manager accountable ohne Authority zu entscheiden?",
          tr: "Yöneticiler yetki olmadan accountable mı?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“They own outcomes but must ask permission for everything.”",
          de: "„Sie tragen Ergebnis, müssen aber alles fragen.“",
          tr: "“Sonuçtan sorumlu ama her şeyi sormak zorunda.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Owners have authority aligned with accountability.”",
          de: "„Owner haben passende Authority.“",
          tr: "“Owner yetkisi accountability ile uyumlu.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes",de:"Ja",tr:"Evet"}[lang]||""), hint: "" },
          { value: "partial", label: ({en:"Partly",de:"Teilweise",tr:"Kısmen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { M: +0.12, D: +0.04 },
          partial: { M: +0.06 },
          no: { M: -0.08 }
        }
      },
      {
        qid: "B4",
        targets: ["EF", "TS"],
        weight: 0.11,
        text: (lang) => ({
          en: "Do problems get hidden until they explode?",
          de: "Werden Probleme versteckt, bis sie explodieren?",
          tr: "Problemler patlayana kadar saklanıyor mu?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“Bad news arrives too late to react.”",
          de: "„Bad news kommt zu spät.“",
          tr: "“Kötü haber çok geç gelir.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Risks surface early, we adjust fast.”",
          de: "„Risiken kommen früh, wir passen an.“",
          tr: "“Riskler erken çıkar, hızlı ayarlarız.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes, often",de:"Ja, häufig",tr:"Evet, sık"}[lang]||""), hint: "" },
          { value: "sometimes", label: ({en:"Sometimes",de:"Manchmal",tr:"Bazen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { TS: +0.10, EF: +0.05 },
          sometimes: { TS: +0.05 },
          no: { TS: -0.08 }
        }
      },
      {
        qid: "B5",
        targets: ["L", "EF"],
        weight: 0.11,
        text: (lang) => ({
          en: "Are a few key people permanently overloaded?",
          de: "Sind wenige Schlüsselpersonen dauerhaft überlastet?",
          tr: "Az sayıda kilit kişi sürekli aşırı yükte mi?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“One person is the only one who can ship.”",
          de: "„Eine Person kann als einzige liefern.“",
          tr: "“Sadece bir kişi teslim edebiliyor.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Work is spread and backups exist.”",
          de: "„Last verteilt, Backups vorhanden.“",
          tr: "“İş dağılmış, backup var.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes",de:"Ja",tr:"Evet"}[lang]||""), hint: "" },
          { value: "partial", label: ({en:"Partly",de:"Teilweise",tr:"Kısmen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { L: +0.12, EF: +0.04 },
          partial: { L: +0.06 },
          no: { L: -0.08 }
        }
      },
      {
        qid: "B6",
        targets: ["D", "TS"],
        weight: 0.10,
        text: (lang) => ({
          en: "Do projects stall because ownership is unclear?",
          de: "Stocken Projekte, weil Ownership unklar ist?",
          tr: "Ownership belirsiz olduğu için projeler tıkanıyor mu?"
        }[lang] || ""),
        ex1: (lang) => ({
          en: "“Tasks bounce between teams.”",
          de: "„Tasks springen zwischen Teams.“",
          tr: "“İşler takımlar arasında ping pong.”"
        }[lang] || ""),
        ex2: (lang) => ({
          en: "“Each project has a clear owner.”",
          de: "„Jedes Projekt hat einen Owner.“",
          tr: "“Her projenin owner'ı var.”"
        }[lang] || ""),
        options: (lang) => ([
          { value: "yes", label: ({en:"Yes",de:"Ja",tr:"Evet"}[lang]||""), hint: "" },
          { value: "sometimes", label: ({en:"Sometimes",de:"Manchmal",tr:"Bazen"}[lang]||""), hint: "" },
          { value: "no", label: ({en:"No",de:"Nein",tr:"Hayır"}[lang]||""), hint: "" }
        ]),
        answer_map: {
          yes: { D: +0.10, TS: +0.06 },
          sometimes: { D: +0.05 },
          no: { D: -0.06 }
        }
      }
    ]
  };

  function selectNextQuestion(session) {
    const mode = session.meta.mode;
    const evalRes = evaluateConfidence(session);
    const top1 = evalRes.top1?.code || "D";
    const top2 = evalRes.top2?.code || "L";

    const asked = new Set((session.input.adaptive_answers || []).map(a => a.qid));
    const bank = mode === "business" ? ADAPT.business : ADAPT.private;

    // score questions by disambiguation value
    let best = null;
    let bestScore = -1;

    for (const q of bank) {
      if (asked.has(q.qid)) continue;

      const targets = new Set(q.targets || []);
      const matchPair = targets.has(top1) && targets.has(top2);
      const involvesTop1 = targets.has(top1);

      let score = 0;
      if (matchPair) score += 3;
      if (involvesTop1) score += 2;
      score += (q.weight || 0) * 10;

      if (score > bestScore) {
        bestScore = score;
        best = q;
      }
    }

    return best;
  }

  function computeAdaptiveBoost(session, top1, top2) {
    const mode = session.meta.mode;
    const answers = session.input.adaptive_answers || [];
    const bank = mode === "business" ? ADAPT.business : ADAPT.private;
    const byId = new Map(bank.map(q => [q.qid, q]));

    // Convert mapped boosts into a single AB
    // We care mostly about separating top1 vs top2: boosts that support top1 add more weight.
    let sum = 0;

    for (const a of answers) {
      const q = byId.get(a.qid);
      if (!q || !q.answer_map) continue;
      const map = q.answer_map[a.answer];
      if (!map) continue;

      // If it boosts top1, add stronger; if it boosts top2, smaller; if it boosts others, small
      for (const [k, v] of Object.entries(map)) {
        if (k === top1) sum += v;
        else if (k === top2) sum += v * 0.65;
        else sum += v * 0.35;
      }
    }

    // Normalize to approx [-0.25..0.25] zone.
    // Empirically, sum ranges ~[-0.2..0.4] with 6 Q; we clamp later.
    return sum;
  }

  // =========================
  // SVG Radar (8 axes, 0..5)
  // =========================
  function radarCaption(mode, lang) {
    if (mode === "business") {
      return {
        en: "Higher values indicate structural stress. Use this to see where redesign is needed.",
        de: "Höhere Werte zeigen strukturellen Stress. Zeigt, wo Umbau nötig ist.",
        tr: "Yüksek değer yapısal stresi gösterir. Nerede yeniden tasarım gerektiğini gör."
      }[lang] || "";
    }
    return {
      en: "Higher values indicate structural stress. Use this to see what drives instability.",
      de: "Höhere Werte zeigen strukturellen Stress. Zeigt, was Instabilität treibt.",
      tr: "Yüksek değer yapısal stresi gösterir. İstikrarsızlığı ne tetikliyor gör."
    }[lang] || "";
  }

  function renderRadarSVG(container, sliders0to5, mode, lang) {
    const axes = ["D","L","G","M","E","F","T","S"];
    const labels = {
      D: (lang==="de"?"D":"D"),
      L: (lang==="de"?"L":"L"),
      G: (lang==="de"?"G":"G"),
      M: (lang==="de"?"M":"M"),
      E: (lang==="de"?"E":"E"),
      F: (lang==="de"?"F":"F"),
      T: (lang==="de"?"T":"T"),
      S: (lang==="de"?"S":"S")
    };

    const w = 360, h = 320;
    const cx = w/2, cy = h/2 + 6;
    const R = 120;

    const levels = 5; // 0..5
    const points = [];

    for (let i=0; i<axes.length; i++){
      const a = (Math.PI*2 * i / axes.length) - Math.PI/2;
      const v = clamp(Number(sliders0to5[axes[i]]||0),0,5);
      const r = (v/5)*R;
      points.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
    }

    const polygon = points.map(p => p.join(",")).join(" ");

    // Grid rings
    const rings = [];
    for (let k=1; k<=levels; k++){
      const rr = (k/levels)*R;
      const ringPts = axes.map((_, i) => {
        const a = (Math.PI*2 * i / axes.length) - Math.PI/2;
        return [cx + rr*Math.cos(a), cy + rr*Math.sin(a)].join(",");
      }).join(" ");
      rings.push(`<polygon points="${ringPts}" fill="none" stroke="rgba(255,255,255,.10)" />`);
    }

    // Spokes + labels
    const spokes = axes.map((ax, i) => {
      const a = (Math.PI*2 * i / axes.length) - Math.PI/2;
      const x = cx + R*Math.cos(a);
      const y = cy + R*Math.sin(a);
      const lx = cx + (R+18)*Math.cos(a);
      const ly = cy + (R+18)*Math.sin(a);
      return `
        <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.10)" />
        <text x="${lx}" y="${ly}" fill="rgba(234,240,255,.70)" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" font-size="12" text-anchor="middle" dominant-baseline="middle">${labels[ax]}</text>
      `;
    }).join("");

    container.innerHTML = `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Radar chart">
        <defs>
          <radialGradient id="radGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="rgba(110,231,183,.20)" />
            <stop offset="100%" stop-color="rgba(110,231,183,0)" />
          </radialGradient>
        </defs>

        <circle cx="${cx}" cy="${cy}" r="${R+36}" fill="url(#radGlow)" />
        ${rings.join("")}
        ${spokes}

        <polygon points="${polygon}" fill="rgba(110,231,183,.14)" stroke="rgba(110,231,183,.55)" stroke-width="2" />

        ${points.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="rgba(96,165,250,.85)" />`).join("")}
      </svg>

      <div class="micro" style="margin-top:10px; font-family: var(--mono);">
        D L G M E F T S · scale 0–5
      </div>
    `;
  }

  function renderTopBars(container, tensions) {
    const items = (tensions || []).slice(0, 3);
    container.innerHTML = items.map(tn => `
      <div class="bar">
        <div class="bar__top">
          <div class="bar__name">${esc(tn.label)}</div>
          <div class="bar__val">${round(tn.value)} / 100</div>
        </div>
        <div class="bar__track"><i style="width:${clamp(tn.value,0,100)}%"></i></div>
        <div class="bar__why">${esc((tn.why && tn.why[0]) || "")}</div>
      </div>
    `).join("");
  }

})();
