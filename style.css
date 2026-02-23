// script.js — MDG V4 (Drop 4B)
// Shared: burger/drawer, i18n, mode routing, business token modal.
// Keep this file used by index.html + diagnose.html + verlauf.html.

(() => {
  "use strict";

  // If you already use api.mdg-indikation.de, keep it consistent:
  const API_BASE = "https://api.mdg-indikation.de";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // -------- Storage keys --------
  const K_LANG = "mdg_lang";
  const K_MODE = "mdg_mode";       // "private" | "business"
  const K_TOKEN = "mdg_token";     // business token

  // -------- i18n dictionary (Landing keys) --------
  // Diagnose page has its own dict in diagnose.html later (Drop 5).
  const I18N = {
    de: {
      "nav.how":"Wie es funktioniert",
      "nav.why":"Warum MDG",
      "nav.faq":"FAQ",

      "hero.pill1":"In wenigen Minuten zur Entscheidungssicherheit",
      "hero.pill2":"IDG · ADG · MDG",
      "hero.h1":"Instabilität früh erkennen. Ursache präzise diagnostizieren. Architektur bauen – bevor es bricht.",
      "hero.lead":"MDG, IDG und ADG geben dir ein strukturelles Instrumentarium, um Spannungen sichtbar zu machen und tragfähige Entscheidungen zu treffen – privat oder im Unternehmen.",
      "hero.note":"Privat: sofort starten. Business: Token erforderlich (eigene Fragen & Output für Entscheider).",

      "cta.private":"Jetzt ermitteln (privat)",
      "cta.business":"Für Unternehmen (Token)",

      "hero.panelTitle":"So läuft es ab",
      "hero.step1k":"1 Satz Kontext",
      "hero.step1t":"Worum geht es?",
      "hero.step2k":"Ziel wählen",
      "hero.step2t":"Stabilisieren oder Umbauen?",
      "hero.step3k":"Quick Scan",
      "hero.step3t":"Ebenenanalyse + Frühindikatoren",
      "hero.step4k":"Ergebnis",
      "hero.step4t":"Radar, Spannungen, klare Schritte",
      "hero.step5k":"Deep Dive",
      "hero.step5t":"Executive Report (Premium)",
      "hero.m1k":"Dauer",
      "hero.m1v":"3–10 Min",
      "hero.m2k":"Output",
      "hero.m2v":"Entscheidungspfad + Maßnahmen",

      "how.h2":"Wie es funktioniert",
      "how.sub":"Du beschreibst dein Thema in einem Satz – wir führen dich dann streng und präzise zur Diagnose.",
      "how.c1t":"1) Kontext",
      "how.c1p":"Ein Satz, keine Story. Wir brauchen die Struktur, nicht die Details.",
      "how.c1ex":"Beispiel: „Wir liefern zu spät und streiten ständig über Prioritäten.“",
      "how.c2t":"2) Ziel",
      "how.c2p":"Stabilisieren = Belastung reduzieren & Kontrolle zurückholen. Umbauen = Architektur neu bauen.",
      "how.c2ex":"Beispiel: Stabilisieren zuerst, dann Umbau planen.",
      "how.c3t":"3) Ergebnis",
      "how.c3p":"Radar & Spannungen zeigen Primärinstabilität – plus konkrete nächste Schritte.",
      "how.c3ex":"Beispiel: „Entscheidungsmonopol“ + „Lastasymmetrie“ → IDG → ADG.",

      "why.h2":"Warum MDG",
      "why.sub":"Die meisten Systeme brechen nicht an „zu wenig Stärke“, sondern an falscher Lastverteilung und schlechter Entscheidungsarchitektur.",
      "why.a1t":"Struktur statt Bauchgefühl",
      "why.a1p":"Du bekommst ein klares Modell, das Spannung, Engpässe und Verstärkung sichtbar macht.",
      "why.a2t":"Entscheidungssicherheit",
      "why.a2p":"Nicht nur Diagnose – sondern ein Pfad: Stabilisieren (IDG) oder Umbauen (ADG) mit konkreten Moves.",

      "faq.h2":"FAQ",
      "faq.sub":"Kurz & klar.",
      "faq.q1":"Was ist der Unterschied zwischen Privat und Business?",
      "faq.a1":"Business nutzt eigene Fragen (Führung, Verantwortung, Risiko, Skalierung) und liefert Executive Output.",
      "faq.q2":"Muss ich viele Fragen beantworten?",
      "faq.a2":"So viele wie nötig für Präzision. Du kannst jederzeit abbrechen und später fortsetzen.",
      "faq.q3":"Wird etwas gespeichert?",
      "faq.a3":"Standard: lokal im Browser. Business kann optional anonym Server-Saves nutzen (wenn aktiviert).",

      "footer.tag":"Strukturdiagnose für Stabilisierung und Umbau.",
      "footer.gotoDx":"Zur Diagnose",

      "token.pill":"Business Zugang",
      "token.h3":"Token eingeben",
      "token.p":"Unternehmen erhalten ein eigenes Fragen-Set und Executive Output. Bitte Token eingeben.",
      "token.label":"Token",
      "token.submit":"Weiter",
      "token.cancel":"Abbrechen",
      "token.ok":"Token akzeptiert. Starte …",
      "token.bad":"Token ungültig. Bitte prüfen.",
      "token.err":"Fehler beim Prüfen. Bitte erneut versuchen.",
      "token.need":"Bitte Token eingeben."
    },

    tr: {
      "nav.how":"Nasıl çalışır",
      "nav.why":"Neden MDG",
      "nav.faq":"SSS",

      "hero.pill1":"Dakikalar içinde karar netliği",
      "hero.pill2":"IDG · ADG · MDG",
      "hero.h1":"İstikrarsızlığı erken gör. Nedeni kesin teşhis et. Kırılmadan önce mimari kur.",
      "hero.lead":"MDG, IDG ve ADG; gerilimleri görünür kılan ve sağlam kararlar almanı sağlayan yapısal bir araç setidir — özel hayat veya iş için.",
      "hero.note":"Özel: hemen başla. Kurumsal: Token gerekir (yöneticiler için ayrı sorular ve çıktı).",

      "cta.private":"Şimdi analiz et (özel)",
      "cta.business":"Şirketler için (Token)",

      "hero.panelTitle":"Akış",
      "hero.step1k":"1 cümle bağlam",
      "hero.step1t":"Konu nedir?",
      "hero.step2k":"Hedef",
      "hero.step2t":"Stabilize mi, yeniden kurulum mu?",
      "hero.step3k":"Hızlı tarama",
      "hero.step3t":"Katman analizi + erken göstergeler",
      "hero.step4k":"Sonuç",
      "hero.step4t":"Radar, gerilimler, net adımlar",
      "hero.step5k":"Derin analiz",
      "hero.step5t":"Executive Report (Premium)",
      "hero.m1k":"Süre",
      "hero.m1v":"3–10 dk",
      "hero.m2k":"Çıktı",
      "hero.m2v":"Karar yolu + aksiyonlar",

      "how.h2":"Nasıl çalışır",
      "how.sub":"Konuyu bir cümleyle yaz — sonra seni sıkı ve net bir teşhise götürüyoruz.",
      "how.c1t":"1) Bağlam",
      "how.c1p":"Bir cümle, hikâye değil. Detay değil yapı gerekir.",
      "how.c1ex":"Örnek: “Geç teslim ediyoruz ve önceliklerde sürekli tartışıyoruz.”",
      "how.c2t":"2) Hedef",
      "how.c2p":"Stabilize = yükü azalt & kontrolü geri al. Yeniden kurulum = mimariyi yeniden tasarla.",
      "how.c2ex":"Örnek: önce stabilize, sonra yeniden kurulum planı.",
      "how.c3t":"3) Sonuç",
      "how.c3p":"Radar ve gerilimler birincil instabiliteyi gösterir — ayrıca net sonraki adımlar verir.",
      "how.c3ex":"Örnek: “Karar tekeli” + “Yük asimetrisi” → IDG → ADG.",

      "why.h2":"Neden MDG",
      "why.sub":"Çoğu sistem “güç eksikliği” yüzünden değil, yanlış yük dağılımı ve zayıf karar mimarisi yüzünden kırılır.",
      "why.a1t":"İçgüdü değil yapı",
      "why.a1p":"Gerilimleri, darboğazları ve büyüme etkisini görünür kılan net bir model.",
      "why.a2t":"Karar netliği",
      "why.a2p":"Sadece teşhis değil — yol: Stabilize (IDG) veya Yeniden Kur (ADG) + net aksiyonlar.",

      "faq.h2":"SSS",
      "faq.sub":"Kısa ve net.",
      "faq.q1":"Özel ve Kurumsal arasındaki fark nedir?",
      "faq.a1":"Kurumsal sürüm; liderlik, sorumluluk, risk, ölçekleme gibi ayrı sorular ve executive çıktı verir.",
      "faq.q2":"Çok soru yanıtlamam gerekir mi?",
      "faq.a2":"Kesinlik için gerektiği kadar. İstediğinde durdurup sonra devam edebilirsin.",
      "faq.q3":"Veri kaydediliyor mu?",
      "faq.a3":"Varsayılan: tarayıcıda yerel. Kurumsal sürüm opsiyonel anonim sunucu kaydı kullanabilir.",

      "footer.tag":"Stabilizasyon ve yeniden kurulum için yapı teşhisi.",
      "footer.gotoDx":"Teşhise git",

      "token.pill":"Kurumsal erişim",
      "token.h3":"Token gir",
      "token.p":"Şirketler için ayrı soru seti ve executive çıktı. Lütfen token girin.",
      "token.label":"Token",
      "token.submit":"Devam",
      "token.cancel":"İptal",
      "token.ok":"Token kabul edildi. Başlatılıyor …",
      "token.bad":"Token geçersiz. Lütfen kontrol edin.",
      "token.err":"Kontrol hatası. Lütfen tekrar deneyin.",
      "token.need":"Lütfen token girin."
    },

    en: {
      "nav.how":"How it works",
      "nav.why":"Why MDG",
      "nav.faq":"FAQ",

      "hero.pill1":"Decision confidence in minutes",
      "hero.pill2":"IDG · ADG · MDG",
      "hero.h1":"Detect instability early. Diagnose the cause precisely. Build architecture — before it breaks.",
      "hero.lead":"MDG, IDG and ADG provide a structural toolkit to make tensions visible and enable durable decisions — for personal life or business.",
      "hero.note":"Private: start instantly. Business: token required (separate questions & executive output).",

      "cta.private":"Assess now (private)",
      "cta.business":"For business (token)",

      "hero.panelTitle":"The flow",
      "hero.step1k":"One-sentence context",
      "hero.step1t":"What is this about?",
      "hero.step2k":"Choose intent",
      "hero.step2t":"Stabilize or redesign?",
      "hero.step3k":"Quick scan",
      "hero.step3t":"Layer analysis + early indicators",
      "hero.step4k":"Result",
      "hero.step4t":"Radar, tensions, clear steps",
      "hero.step5k":"Deep dive",
      "hero.step5t":"Executive Report (Premium)",
      "hero.m1k":"Time",
      "hero.m1v":"3–10 min",
      "hero.m2k":"Output",
      "hero.m2v":"Decision path + actions",

      "how.h2":"How it works",
      "how.sub":"Describe your case in one sentence — we then guide you strictly to a precise diagnosis.",
      "how.c1t":"1) Context",
      "how.c1p":"One sentence, no story. We need structure, not details.",
      "how.c1ex":"Example: “We deliver late and keep fighting about priorities.”",
      "how.c2t":"2) Intent",
      "how.c2p":"Stabilize = reduce load & regain control. Redesign = rebuild the architecture.",
      "how.c2ex":"Example: stabilize first, then plan redesign.",
      "how.c3t":"3) Result",
      "how.c3p":"Radar & tensions reveal the primary instability — plus concrete next steps.",
      "how.c3ex":"Example: “Decision monopoly” + “load asymmetry” → IDG → ADG.",

      "why.h2":"Why MDG",
      "why.sub":"Most systems don’t break from “lack of strength”, but from wrong load distribution and weak decision architecture.",
      "why.a1t":"Structure over gut-feel",
      "why.a1p":"A clear model that makes tensions, bottlenecks and amplification visible.",
      "why.a2t":"Decision confidence",
      "why.a2p":"Not only diagnosis — a path: stabilize (IDG) or redesign (ADG) with concrete moves.",

      "faq.h2":"FAQ",
      "faq.sub":"Short & clear.",
      "faq.q1":"What’s the difference between private and business?",
      "faq.a1":"Business uses a dedicated question set (leadership, responsibility, risk, scaling) and produces executive-grade output.",
      "faq.q2":"Do I have to answer many questions?",
      "faq.a2":"As many as needed for precision. You can stop anytime and continue later.",
      "faq.q3":"Is anything stored?",
      "faq.a3":"Default: locally in your browser. Business can optionally enable anonymous server saves.",

      "footer.tag":"Structural diagnosis for stabilization and redesign.",
      "footer.gotoDx":"Go to diagnosis",

      "token.pill":"Business access",
      "token.h3":"Enter token",
      "token.p":"Business gets a dedicated question set and executive output. Please enter your token.",
      "token.label":"Token",
      "token.submit":"Continue",
      "token.cancel":"Cancel",
      "token.ok":"Token accepted. Starting …",
      "token.bad":"Invalid token. Please check.",
      "token.err":"Verification error. Please try again.",
      "token.need":"Please enter a token."
    }
  };

  // -------- Basic UI helpers --------
  function currentLang() {
    return localStorage.getItem(K_LANG) || "de";
  }

  function applyLang(lang) {
    if (!I18N[lang]) lang = "de";
    localStorage.setItem(K_LANG, lang);
    document.documentElement.lang = lang;

    $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const val = I18N[lang]?.[key];
      if (!val) return;
      // Keep elements with nested children safe (don’t overwrite complex nodes)
      if (el.children && el.children.length) return;
      el.textContent = val;
    });
  }

  function wireLangButtons() {
    $$("[data-lang]").forEach(btn => btn.addEventListener("click", () => applyLang(btn.dataset.lang)));
    applyLang(currentLang());
  }

  // -------- Burger / Drawer --------
  function wireBurger() {
    const burger = $(".burger");
    const drawer = $(".drawer");
    if (!burger || !drawer) return;

    const open = () => {
      drawer.hidden = false;
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
    };
    const close = () => {
      drawer.hidden = true;
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    };

    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });

    // close on click outside drawer content (if backdrop exists in your CSS). If not, ignore.
    drawer.addEventListener("click", (e) => {
      const content = drawer.querySelector(".drawer__content");
      if (!content) return;
      if (!content.contains(e.target)) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // -------- Modal (Token) --------
  function modalOpen(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    document.body.classList.add("no-scroll");
  }
  function modalClose(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  function wireModal() {
    const m = $("#token_modal");
    if (!m) return;

    m.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.hasAttribute("data-modal-close") || t.closest("[data-modal-close]"))) {
        modalClose("token_modal");
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modalClose("token_modal");
    });
  }

  // -------- Token verify (calls worker) --------
  async function verifyToken(token) {
    // endpoint will be implemented in worker (Drop 5/6). For now: will fail gracefully.
    const res = await fetch(`${API_BASE}/api/token/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || "verify_failed" };
    return { ok: true, data };
  }

  function langT(key) {
    const l = currentLang();
    return I18N[l]?.[key] || I18N.de[key] || key;
  }

  function setModeAndGo(mode) {
    localStorage.setItem(K_MODE, mode);
    // pass mode via query too (helps diagnose.html bootstrap)
    location.href = `./diagnose.html?mode=${encodeURIComponent(mode)}`;
  }

  function wireCTAs() {
    const btnsPrivate = ["#cta_private","#cta_private_panel","#cta_private_drawer","#cta_private_bottom"]
      .map(s => $(s)).filter(Boolean);

    const btnsBusiness = ["#cta_business","#cta_business_drawer","#cta_business_bottom"]
      .map(s => $(s)).filter(Boolean);

    btnsPrivate.forEach(b => b.addEventListener("click", () => {
      localStorage.removeItem(K_TOKEN);
      setModeAndGo("private");
    }));

    btnsBusiness.forEach(b => b.addEventListener("click", () => {
      modalOpen("token_modal");
      setTimeout(() => $("#token_input")?.focus(), 50);
    }));

    // modal submit
    const submit = $("#token_submit");
    const input = $("#token_input");
    const status = $("#token_status");

    if (submit && input) {
      submit.addEventListener("click", async () => {
        const token = (input.value || "").trim();
        if (!token) {
          if (status) status.textContent = langT("token.need");
          return;
        }
        if (status) status.textContent = "…";

        try {
          const out = await verifyToken(token);
          if (!out.ok) {
            if (status) status.textContent = langT("token.bad");
            return;
          }
          localStorage.setItem(K_TOKEN, token);
          if (status) status.textContent = langT("token.ok");
          setTimeout(() => {
            modalClose("token_modal");
            setModeAndGo("business");
          }, 350);
        } catch {
          if (status) status.textContent = langT("token.err");
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit.click();
      });
    }
  }

  // -------- Init --------
  function init() {
    wireLangButtons();
    wireBurger();
    wireModal();
    wireCTAs();
  }

  document.addEventListener("DOMContentLoaded", init);

  // Expose minimal shared constants for other pages (diagnose/verlauf)
  window.MDG = window.MDG || {};
  window.MDG.API_BASE = API_BASE;
  window.MDG.storage = { K_LANG, K_MODE, K_TOKEN };
  window.MDG.i18n = { applyLang, currentLang };
})();
