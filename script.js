// app.js
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Mobile menu ----------
  const burger = $(".burger");
  const drawer = $(".drawer");

  if (burger && drawer) {
    const toggleDrawer = () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!expanded));
      drawer.hidden = expanded; // if it was expanded, hide it
    };

    burger.addEventListener("click", toggleDrawer);
    $$(".drawer a").forEach(a => a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      drawer.hidden = true;
    }));
  }

  // ---------- Segmented toggles (context/depth) ----------
  const state = {
    lang: "de",
    context: "private",
    depth: "quick",
  };

  function setSegment(group, value) {
    state[group] = value;
    const buttons = $$(`[data-toggle="${group}"]`);
    buttons.forEach(btn => {
      const isActive = btn.dataset.value === value;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
  }

  $$("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.toggle;
      const value = btn.dataset.value;
      setSegment(group, value);
    });
  });

  // ---------- Tabs ----------
  $$(".tabs").forEach(tabs => {
    const tabButtons = $$("[data-tab]", tabs);
    const panels = $$("[data-panel]", tabs);

    const activate = (name) => {
      tabButtons.forEach(b => {
        const on = b.dataset.tab === name;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      panels.forEach(p => p.classList.toggle("is-active", p.dataset.panel === name));
    };

    tabButtons.forEach(btn => btn.addEventListener("click", () => activate(btn.dataset.tab)));
  });

  // ---------- Modals ----------
  function openModal(id) {
    const el = $(`#modal-${id}`);
    if (!el) return;
    if (typeof el.showModal === "function") el.showModal();
    else el.removeAttribute("hidden");
  }
  function closeModal(modalEl) {
    if (!modalEl) return;
    if (typeof modalEl.close === "function") modalEl.close();
    else modalEl.setAttribute("hidden", "hidden");
  }

  $$("[data-open-modal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(btn.dataset.openModal);
    });
  });

  $$("dialog.modal").forEach(dlg => {
    dlg.addEventListener("click", (e) => {
      // click outside content closes
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inDialog) closeModal(dlg);
    });

    $$("[data-close-modal]", dlg).forEach(btn =>
      btn.addEventListener("click", () => closeModal(dlg))
    );

    dlg.addEventListener("cancel", () => closeModal(dlg));
  });

  // ---------- i18n ----------
  const dict = {
    de: {
      "nav.model": "Modell",
      "nav.diagnosis": "Diagnose",
      "nav.results": "Ergebnisse",
      "nav.actions": "Maßnahmen",
      "nav.export": "Export",
      "cta.start": "Diagnose starten",
      "cta.startNow": "Jetzt starten",
      "cta.how": "Wie funktioniert das?",
      "cta.preview": "Outputs ansehen",
      "cta.backTop": "Zurück nach oben",
      "cta.pdf": "Beispiel-PDF ansehen",
      "cta.close": "Schließen",

      "hero.h1": "Primärinstabilität erkennen. Stabilisieren oder umbauen.",
      "hero.lead": "MDG v2 identifiziert den ersten strukturellen Kipppunkt unter realer oder zukünftiger Last – und zeigt klar: IDG (Stabilisierung) oder ADG (Architektur-Umbau).",
      "hero.micro": "Keine Psychologie. Keine Stimmung. Struktur. Verstärkung. Entscheidung.",

      "toggle.context": "Kontext",
      "toggle.private": "Privat",
      "toggle.business": "Business",
      "toggle.depth": "Tiefe",
      "toggle.quick": "Schnell (3–5 Min)",
      "toggle.precise": "Präzise (10–15 Min)",

      "demo.label": "Beispiel-Ergebnis",
      "demo.type": "Dominanter Typ: Entscheidungsmonopol",
      "demo.growth": "Wachstumssensitivität",
      "demo.growthValue": "Nichtlinear",
      "demo.reco": "Empfehlung",
      "demo.recoValue": "ADG erforderlich",
      "demo.next": "3 Moves jetzt",
      "demo.m1": "Entscheidungs-Freeze für irreversibles (48h)",
      "demo.m2": "Decision Triage: nur Top-3 Hebel entscheiden",
      "demo.m3": "Delegations-Notfall: B/C-Entscheidungen freigeben",
      "demo.link": "Zu Maßnahmen →",

      "flow.h2": "Strukturelle Diagnose in 7 Schritten",
      "flow.sub": "Schnell im Einstieg. Präzise in der Tiefe. Klar im Ergebnis.",
      "flow.s1": "Kontext definieren",
      "flow.s2": "Quick-Scan",
      "flow.s3": "5 Diagnose-Module",
      "flow.s4": "Belastungssimulation",
      "flow.s5": "Primärinstabilität bestimmen",
      "flow.s6": "IDG oder ADG ableiten",
      "flow.s7": "Export & Verlauf",
      "flow.tagline": "Keine Psychologie. Keine Stimmung. Struktur. Verstärkung. Entscheidung.",

      "modules.h2": "Tiefendiagnose in 5 Modulen",
      "modules.sub": "Module sind getrennt, aber integriert: Dichte, Verteilung, Verstärkung, Kopplung, Institutionalisierung.",
      "modules.example": "Beispiel ansehen →",
      "modules.m1.t": "Entscheidungsarchitektur",
      "modules.m1.d": "Dichte · Irreversibilität · Delegation · Redundanz",
      "modules.m2.t": "Lastverteilung",
      "modules.m2.d": "Asymmetrie · Engpass · Single Point of Failure",
      "modules.m3.t": "Wachstumsverstärkungstest",
      "modules.m3.d": "+20% Last · +50% Komplexität · Ausfall Schlüsselrolle",
      "modules.m4.t": "Macht–Verantwortung",
      "modules.m4.d": "Entscheidung · Risiko · Information · Konsequenz",
      "modules.m5.t": "Energie & Fehlerintegration",
      "modules.m5.d": "Belastung · Regeneration · Feedback · Lernsystem",

      "types.h2": "Ergebnis ist kein Wert – Ergebnis ist ein Typ.",
      "types.sub": "MDG zeigt dominant + sekundär + Wachstumssensitivität + Handlungspfad.",
      "types.t1": "Entscheidungsmonopol",
      "types.t2": "Lastasymmetrie",
      "types.t3": "Wachstum ohne Struktur",
      "types.t4": "Macht–Verantwortungs-Mismatch",
      "types.t5": "Energieentkopplung",
      "types.t6": "Fehlerintegrationsdefizit",
      "types.t7": "Nicht-Institutionalisierung",

      "preview.tab1": "Primärinstabilität",
      "preview.tab2": "Strukturkarte",
      "preview.dom": "Dominanter Typ",
      "preview.domValue": "Entscheidungsmonopol",
      "preview.why": "Warum: hohe Zentralisierung, hohe Irreversibilität, fehlende Stellvertretung.",
      "preview.sequence": "Sequenz: Entscheidungsstau → Fehlerquote → Energieabfall",
      "preview.growth": "Wachstumstest",
      "preview.growthValue": "Bruch bei +20% Last. Empfehlung: ADG.",
      "preview.moves": "3 Moves jetzt",
      "preview.pm1": "Entscheidungs-Freeze (48h)",
      "preview.pm2": "Triage: Top-3 Hebel",
      "preview.pm3": "Delegation B/C freigeben",

      "map.radar": "Radar (Demo)",
      "map.note": "Demo-Ansicht: Radar + Modulbalken + Mismatch Top-3.",
      "map.d": "Entscheidungsarchitektur",
      "map.l": "Lastverteilung",
      "map.g": "Wachstumsverstärkung",
      "map.m": "Macht–Verantwortung",
      "map.e": "Energie/Fehler",
      "map.spof": "Single Point of Failure: möglich",
      "map.mis": "Mismatch Top-3: Info / Risiko / Entscheidung",

      "actions.h2": "Zwei Wege. Eine Entscheidung.",
      "actions.sub": "IDG stabilisiert. ADG baut um. Beides folgt aus derselben Diagnose.",
      "actions.idg.t": "IDG – Stabilisierung",
      "actions.idg.d": "Kurzfristige Entlastung. Schutzmechanismen. Frühindikatoren kontrollieren.",
      "actions.idg.b1": "3 Moves jetzt",
      "actions.idg.b2": "3 Moves diese Woche",
      "actions.idg.b3": "Stop-Liste",
      "actions.idg.b4": "Messpunkte",
      "actions.adg.t": "ADG – Architektur",
      "actions.adg.d": "Struktureller Umbau. Rollen klären. Last verteilen. Institutionalisieren.",
      "actions.adg.b1": "Architekturentscheidungen",
      "actions.adg.b2": "3-Phasen-Roadmap",
      "actions.adg.b3": "Institutionalisierung",
      "actions.adg.b4": "Wachstumskriterien",

      "export.h2": "Export & Verlauf",
      "export.sub": "Ergebnis speichern, vergleichen, als PDF exportieren – optional in Pro.",
      "export.c1.t": "PDF-Export",
      "export.c1.d": "Ergebnis + Maßnahmen in einem klaren Report.",
      "export.c2.t": "Verlauf",
      "export.c2.d": "Diagnosen vergleichen und Trend erkennen.",
      "export.c3.t": "Sharing",
      "export.c3.d": "Optional: Link teilen (Demo / anonymisiert).",

      "legal.h3": "Was es ist – und was nicht",
      "legal.p1": "MDG ist ein strukturelles Analysemodell.",
      "legal.p2": "Es ersetzt keine medizinische, therapeutische, rechtliche oder finanzielle Beratung. Die Ergebnisse dienen der Entscheidungsunterstützung.",
      "legal.p3": "Datenschutz und Haftungshinweise findest du im Footer.",

      "footer.tag": "Strukturdiagnose für Stabilisierung und Umbau.",

      "modal.explainer.t": "Wie MDG v2 funktioniert",
      "modal.explainer.p1": "Primärinstabilität ist der erste strukturelle Bruch unter Verstärkung – nicht der niedrigste Wert im Radar.",
      "modal.explainer.l1": "Quick-Scan: Eingangssignal, kein Urteil.",
      "modal.explainer.l2": "5 Module: Entscheidungen, Last, Wachstum, Kopplung, Institutionalisierung.",
      "modal.explainer.l3": "Simulation: Wo bricht es zuerst bei +Last / +Komplexität / Ausfall?",
      "modal.explainer.l4": "Ergebnis: Typ (dominant + sekundär) + Wachstumssensitivität.",
      "modal.explainer.l5": "Pfad: IDG (Stabilisierung) oder ADG (Umbau).",

      "modal.pdf.t": "Beispiel-PDF (Demo)",
      "modal.pdf.p": "Hier würdest du ein Demo-PDF verlinken oder ein Bild der ersten Seite zeigen.",

      "modal.m1.t": "Modul: Entscheidungsarchitektur",
      "modal.m1.p": "Misst Dichte, Irreversibilität, Delegation und Redundanz. Ergebnis: Entscheidungsstress und Engpasshinweise.",
      "modal.m2.t": "Modul: Lastverteilung",
      "modal.m2.p": "Erkennt Asymmetrien, Single Points of Failure und Engpassfrequenzen – unabhängig von Stimmung.",
      "modal.m3.t": "Modul: Wachstumsverstärkungstest",
      "modal.m3.p": "Simuliert Verstärkung: +20% Last, +50% Komplexität, Ausfall Schlüsselrolle. Identifiziert den ersten Bruch.",
      "modal.m4.t": "Modul: Macht–Verantwortung",
      "modal.m4.p": "Misst Kopplung zwischen Entscheidung, Risiko, Information und Konsequenz. Ergebnis: Mismatch-Heatmap.",
      "modal.m5.t": "Modul: Energie & Fehlerintegration",
      "modal.m5.p": "Erkennt Energieentkopplung sowie fehlende Lern- und Feedbackzyklen. Ergebnis: Frühindikatoren + Strukturtrigger."
    },

    tr: {
      "nav.model": "Model",
      "nav.diagnosis": "Analiz",
      "nav.results": "Sonuçlar",
      "nav.actions": "Aksiyonlar",
      "nav.export": "Rapor",
      "cta.start": "Analizi Başlat",
      "cta.startNow": "Şimdi başlat",
      "cta.how": "Nasıl çalışır?",
      "cta.preview": "Çıktıları gör",
      "cta.backTop": "Yukarı dön",
      "cta.pdf": "Örnek PDF",
      "cta.close": "Kapat",

      "hero.h1": "Birincil istikrarsızlığı belirleyin. Dengeleyin veya yeniden yapılandırın.",
      "hero.lead": "MDG v2, mevcut veya gelecekteki yük altında ilk yapısal kırılma noktasını tespit eder ve net bir yol sunar: IDG (Stabilizasyon) veya ADG (Yapısal Yeniden Tasarım).",
      "hero.micro": "Psikoloji değil. Algı değil. Yapı. Güçlenme. Karar.",

      "toggle.context": "Bağlam",
      "toggle.private": "Bireysel",
      "toggle.business": "İş",
      "toggle.depth": "Derinlik",
      "toggle.quick": "Hızlı (3–5 dk)",
      "toggle.precise": "Derin (10–15 dk)",

      "demo.label": "Örnek Sonuç",
      "demo.type": "Baskın Tip: Karar tekelleşmesi",
      "demo.growth": "Büyüme hassasiyeti",
      "demo.growthValue": "Doğrusal olmayan",
      "demo.reco": "Öneri",
      "demo.recoValue": "ADG gerekli",
      "demo.next": "Şimdi 3 hamle",
      "demo.m1": "Geri döndürülemez kararları 48 saat dondur",
      "demo.m2": "Triage: sadece en kritik 3 kaldıraç",
      "demo.m3": "Acil delegasyon: B/C kararlarını serbest bırak",
      "demo.link": "Aksiyonlara →",

      "flow.h2": "7 Adımda Yapısal Analiz",
      "flow.sub": "Hızlı giriş. Derin teşhis. Net sonuç.",
      "flow.s1": "Bağlamı tanımla",
      "flow.s2": "Hızlı tarama",
      "flow.s3": "5 analiz modülü",
      "flow.s4": "Yük simülasyonu",
      "flow.s5": "Birincil istikrarsızlığı belirle",
      "flow.s6": "IDG veya ADG önerisi",
      "flow.s7": "Rapor & geçmiş",
      "flow.tagline": "Psikoloji değil. Algı değil. Yapı. Güçlenme. Karar.",

      "modules.h2": "5 Modülde Derin Analiz",
      "modules.sub": "Modüller ayrı ama entegre: yoğunluk, dağılım, güçlenme, eşleşme, kurumsallaşma.",
      "modules.example": "Örnek →",
      "modules.m1.t": "Karar Mimarisi",
      "modules.m1.d": "Yoğunluk · Geri döndürülemezlik · Delegasyon · Yedeklilik",
      "modules.m2.t": "Yük Dağılımı",
      "modules.m2.d": "Asimetri · Darboğaz · Tek hata noktası",
      "modules.m3.t": "Büyüme Güçlenme Testi",
      "modules.m3.d": "+%20 yük · +%50 karmaşıklık · Kritik rol kaybı",
      "modules.m4.t": "Güç–Sorumluluk",
      "modules.m4.d": "Karar · Risk · Bilgi · Sonuç",
      "modules.m5.t": "Enerji & Hata Entegrasyonu",
      "modules.m5.d": "Yük · Yenilenme · Geri bildirim · Öğrenme sistemi",

      "types.h2": "Sonuç bir puan değil – bir tiptir.",
      "types.sub": "MDG: baskın + ikincil + büyüme hassasiyeti + eylem yolu.",
      "types.t1": "Karar tekelleşmesi",
      "types.t2": "Yük asimetrisi",
      "types.t3": "Yapısız büyüme",
      "types.t4": "Güç–sorumluluk uyumsuzluğu",
      "types.t5": "Enerji kopuşu",
      "types.t6": "Hata entegrasyon eksikliği",
      "types.t7": "Kurumsallaşmamış yapı",

      "preview.tab1": "Birincil istikrarsızlık",
      "preview.tab2": "Yapı haritası",
      "preview.dom": "Baskın tip",
      "preview.domValue": "Karar tekelleşmesi",
      "preview.why": "Neden: yüksek merkezileşme, yüksek maliyetli kararlar, yedek rol yok.",
      "preview.sequence": "Sıra: karar tıkanması → hata artışı → enerji düşüşü",
      "preview.growth": "Büyüme testi",
      "preview.growthValue": "+%20 yükte kırılma. Öneri: ADG.",
      "preview.moves": "Şimdi 3 hamle",
      "preview.pm1": "48 saat karar dondurma",
      "preview.pm2": "Triage: en kritik 3",
      "preview.pm3": "B/C delegasyon",

      "map.radar": "Radar (Demo)",
      "map.note": "Demo: radar + modül çubukları + en büyük 3 uyumsuzluk.",
      "map.d": "Karar mimarisi",
      "map.l": "Yük dağılımı",
      "map.g": "Büyüme güçlenmesi",
      "map.m": "Güç–sorumluluk",
      "map.e": "Enerji/Hata",
      "map.spof": "Tek hata noktası: olası",
      "map.mis": "En büyük 3 uyumsuzluk: bilgi / risk / karar",

      "actions.h2": "İki yol. Tek karar.",
      "actions.sub": "IDG dengeler. ADG yeniden kurar. İkisi de aynı teşhisten çıkar.",
      "actions.idg.t": "IDG – Stabilizasyon",
      "actions.idg.d": "Kısa vadeli rahatlama. Koruma mekanizmaları. Erken göstergeleri kontrol.",
      "actions.idg.b1": "Şimdi 3 hamle",
      "actions.idg.b2": "Bu hafta 3 hamle",
      "actions.idg.b3": "Durdur listesi",
      "actions.idg.b4": "Ölçüm noktaları",
      "actions.adg.t": "ADG – Mimari",
      "actions.adg.d": "Yapısal dönüşüm. Rolleri netleştir. Yükü dağıt. Kurumsallaştır.",
      "actions.adg.b1": "Mimari kararlar",
      "actions.adg.b2": "3 faz yol haritası",
      "actions.adg.b3": "Kurumsallaşma",
      "actions.adg.b4": "Büyüme kriterleri",

      "export.h2": "Rapor & geçmiş",
      "export.sub": "Sonuçları kaydet, karşılaştır, PDF olarak indir – Pro opsiyonel.",
      "export.c1.t": "PDF rapor",
      "export.c1.d": "Sonuç + aksiyonlar tek raporda.",
      "export.c2.t": "Geçmiş",
      "export.c2.d": "Analizleri karşılaştır ve trend gör.",
      "export.c3.t": "Paylaşım",
      "export.c3.d": "Opsiyonel: link paylaş (demo / anonim).",

      "legal.h3": "Ne – ve ne değil",
      "legal.p1": "MDG yapısal bir analiz modelidir.",
      "legal.p2": "Tıbbi, terapötik, hukuki veya finansal danışmanlığın yerini tutmaz. Sonuçlar karar desteği sağlar.",
      "legal.p3": "Gizlilik ve sorumluluk notları footer’da.",

      "footer.tag": "Dengeleme ve yeniden yapılandırma için yapısal teşhis.",

      "modal.explainer.t": "MDG v2 nasıl çalışır",
      "modal.explainer.p1": "Birincil istikrarsızlık, güçlenme altında ilk yapısal kırılmadır – radardaki en düşük değer değildir.",
      "modal.explainer.l1": "Hızlı tarama: giriş sinyali, hüküm değil.",
      "modal.explainer.l2": "5 modül: karar, yük, büyüme, eşleşme, kurumsallaşma.",
      "modal.explainer.l3": "Simülasyon: +yük / +karmaşıklık / rol kaybında ilk kırılma nerede?",
      "modal.explainer.l4": "Sonuç: tip (baskın + ikincil) + büyüme hassasiyeti.",
      "modal.explainer.l5": "Yol: IDG (stabilizasyon) veya ADG (yeniden tasarım).",

      "modal.pdf.t": "Örnek PDF (Demo)",
      "modal.pdf.p": "Buraya demo PDF linki veya ilk sayfa görseli ekleyebilirsin.",

      "modal.m1.t": "Modül: Karar Mimarisi",
      "modal.m1.p": "Yoğunluk, geri döndürülemezlik, delegasyon ve yedekliliği ölçer. Çıktı: karar stresi ve darboğaz.",
      "modal.m2.t": "Modül: Yük Dağılımı",
      "modal.m2.p": "Asimetriyi, tek hata noktalarını ve darboğaz sıklığını yakalar.",
      "modal.m3.t": "Modül: Büyüme Güçlenme Testi",
      "modal.m3.p": "+%20 yük, +%50 karmaşıklık ve kritik rol kaybında ilk kırılmayı tespit eder.",
      "modal.m4.t": "Modül: Güç–Sorumluluk",
      "modal.m4.p": "Karar, risk, bilgi ve sonuç arasındaki uyumu ölçer. Çıktı: uyumsuzluk haritası.",
      "modal.m5.t": "Modül: Enerji & Hata Entegrasyonu",
      "modal.m5.p": "Enerji kopuşunu ve öğrenme/geri bildirim döngülerinin eksikliğini yakalar."
    },

    en: {
      "nav.model": "Model",
      "nav.diagnosis": "Diagnosis",
      "nav.results": "Results",
      "nav.actions": "Actions",
      "nav.export": "Export",
      "cta.start": "Start Diagnosis",
      "cta.startNow": "Start now",
      "cta.how": "How does it work?",
      "cta.preview": "View outputs",
      "cta.backTop": "Back to top",
      "cta.pdf": "View sample PDF",
      "cta.close": "Close",

      "hero.h1": "Identify the primary instability. Stabilize or redesign.",
      "hero.lead": "MDG v2 detects the first structural breaking point under current or future load—and clearly indicates: IDG (Stabilization) or ADG (Architectural Redesign).",
      "hero.micro": "Not psychology. Not mood. Structure. Amplification. Decision.",

      "toggle.context": "Context",
      "toggle.private": "Private",
      "toggle.business": "Business",
      "toggle.depth": "Depth",
      "toggle.quick": "Quick (3–5 min)",
      "toggle.precise": "Precise (10–15 min)",

      "demo.label": "Sample result",
      "demo.type": "Dominant type: Decision monopoly",
      "demo.growth": "Growth sensitivity",
      "demo.growthValue": "Nonlinear",
      "demo.reco": "Recommendation",
      "demo.recoValue": "ADG required",
      "demo.next": "3 moves now",
      "demo.m1": "Decision freeze for irreversible items (48h)",
      "demo.m2": "Decision triage: decide only top-3 levers",
      "demo.m3": "Delegation emergency: enable B/C decisions",
      "demo.link": "Go to actions →",

      "flow.h2": "Structural diagnosis in 7 steps",
      "flow.sub": "Fast entry. Deep precision. Clear outcome.",
      "flow.s1": "Define context",
      "flow.s2": "Quick scan",
      "flow.s3": "5 diagnostic modules",
      "flow.s4": "Load simulation",
      "flow.s5": "Identify primary instability",
      "flow.s6": "Derive IDG or ADG",
      "flow.s7": "Export & history",
      "flow.tagline": "Not psychology. Not mood. Structure. Amplification. Decision.",

      "modules.h2": "Deep diagnosis across 5 modules",
      "modules.sub": "Modules are separate yet integrated: density, distribution, amplification, coupling, institutionalization.",
      "modules.example": "View example →",
      "modules.m1.t": "Decision Architecture",
      "modules.m1.d": "Density · Irreversibility · Delegation · Redundancy",
      "modules.m2.t": "Load Distribution",
      "modules.m2.d": "Asymmetry · Bottlenecks · Single point of failure",
      "modules.m3.t": "Growth Amplification Test",
      "modules.m3.d": "+20% load · +50% complexity · Loss of key role",
      "modules.m4.t": "Power–Responsibility",
      "modules.m4.d": "Decision · Risk · Information · Consequence",
      "modules.m5.t": "Energy & Error Integration",
      "modules.m5.d": "Load · Regeneration · Feedback · Learning system",

      "types.h2": "The result is not a score—it is a type.",
      "types.sub": "MDG shows dominant + secondary + growth sensitivity + action path.",
      "types.t1": "Decision monopoly",
      "types.t2": "Load asymmetry",
      "types.t3": "Growth without structure",
      "types.t4": "Power–responsibility mismatch",
      "types.t5": "Energy decoupling",
      "types.t6": "Error integration deficit",
      "types.t7": "Non-institutionalized structure",

      "preview.tab1": "Primary instability",
      "preview.tab2": "Structure map",
      "preview.dom": "Dominant type",
      "preview.domValue": "Decision monopoly",
      "preview.why": "Why: high centralization, high irreversibility, missing redundancy.",
      "preview.sequence": "Sequence: decision backlog → error rate → energy drop",
      "preview.growth": "Growth test",
      "preview.growthValue": "Breaks at +20% load. Recommendation: ADG.",
      "preview.moves": "3 moves now",
      "preview.pm1": "Decision freeze (48h)",
      "preview.pm2": "Triage: top-3 levers",
      "preview.pm3": "Enable B/C delegation",

      "map.radar": "Radar (Demo)",
      "map.note": "Demo view: radar + module bars + top-3 mismatches.",
      "map.d": "Decision architecture",
      "map.l": "Load distribution",
      "map.g": "Growth amplification",
      "map.m": "Power–responsibility",
      "map.e": "Energy/Error",
      "map.spof": "Single point of failure: possible",
      "map.mis": "Top-3 mismatches: info / risk / decision",

      "actions.h2": "Two paths. One decision.",
      "actions.sub": "IDG stabilizes. ADG redesigns. Both follow from the same diagnosis.",
      "actions.idg.t": "IDG – Stabilization",
      "actions.idg.d": "Short-term relief. Protective mechanisms. Control early indicators.",
      "actions.idg.b1": "3 moves now",
      "actions.idg.b2": "3 moves this week",
      "actions.idg.b3": "Stop list",
      "actions.idg.b4": "Measurement points",
      "actions.adg.t": "ADG – Architecture",
      "actions.adg.d": "Structural redesign. Clarify roles. Redistribute load. Institutionalize.",
      "actions.adg.b1": "Architecture decisions",
      "actions.adg.b2": "3-phase roadmap",
      "actions.adg.b3": "Institutionalization",
      "actions.adg.b4": "Growth criteria",

      "export.h2": "Export & history",
      "export.sub": "Save results, compare, export as PDF—optional in Pro.",
      "export.c1.t": "PDF export",
      "export.c1.d": "Result + actions in a clear report.",
      "export.c2.t": "History",
      "export.c2.d": "Compare diagnoses and detect trend.",
      "export.c3.t": "Sharing",
      "export.c3.d": "Optional: share link (demo / anonymized).",

      "legal.h3": "What it is—and what it is not",
      "legal.p1": "MDG is a structural analysis model.",
      "legal.p2": "It does not replace medical, therapeutic, legal, or financial advice. Results provide decision support.",
      "legal.p3": "Privacy and liability notes are in the footer.",

      "footer.tag": "Structural diagnosis for stabilization and redesign.",

      "modal.explainer.t": "How MDG v2 works",
      "modal.explainer.p1": "Primary instability is the first structural break under amplification—not the lowest radar value.",
      "modal.explainer.l1": "Quick scan: an entry signal, not a verdict.",
      "modal.explainer.l2": "5 modules: decisions, load, growth, coupling, institutionalization.",
      "modal.explainer.l3": "Simulation: where does it break first under +load / +complexity / role loss?",
      "modal.explainer.l4": "Result: type (dominant + secondary) + growth sensitivity.",
      "modal.explainer.l5": "Path: IDG (stabilization) or ADG (redesign).",

      "modal.pdf.t": "Sample PDF (Demo)",
      "modal.pdf.p": "Link a demo PDF here or show an image of the first page.",

      "modal.m1.t": "Module: Decision Architecture",
      "modal.m1.p": "Measures density, irreversibility, delegation, and redundancy. Output: decision stress and bottleneck cues.",
      "modal.m2.t": "Module: Load Distribution",
      "modal.m2.p": "Detects asymmetry, single points of failure, and bottleneck frequency—independent of mood.",
      "modal.m3.t": "Module: Growth Amplification Test",
      "modal.m3.p": "Simulates amplification: +20% load, +50% complexity, loss of key role. Identifies the first break.",
      "modal.m4.t": "Module: Power–Responsibility",
      "modal.m4.p": "Measures coupling between decision, risk, information, and consequence. Output: mismatch heatmap.",
      "modal.m5.t": "Module: Energy & Error Integration",
      "modal.m5.p": "Detects energy decoupling and missing learning/feedback cycles. Output: early indicators + structural triggers."
    }
  };

  function applyLang(lang) {
    if (!dict[lang]) return;
    state.lang = lang;

    document.documentElement.lang = lang === "tr" ? "tr" : (lang === "en" ? "en" : "de");

    // Update aria-pressed on language buttons
    $$("[data-lang]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });

    // Apply translations
    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const value = dict[lang][key];
      if (!value) return;

      // If element contains no child elements (safe), replace textContent.
      // Otherwise keep markup and only replace text where it's plain content.
      if (el.children.length === 0) el.textContent = value;
      else {
        // For rich nodes (e.g., hero.lead has <strong>), we preserve HTML by rebuilding only for that known key.
        if (key === "hero.lead") {
          // Keep strong tags in the sentence in all languages by hardcoding here.
          const htmlMap = {
            de: `MDG v2 identifiziert den ersten strukturellen Kipppunkt unter realer oder zukünftiger Last – und zeigt klar: <strong>IDG (Stabilisierung)</strong> oder <strong>ADG (Architektur-Umbau)</strong>.`,
            tr: `MDG v2, mevcut veya gelecekteki yük altında ilk yapısal kırılma noktasını tespit eder ve net bir yol sunar: <strong>IDG (Stabilizasyon)</strong> veya <strong>ADG (Yapısal Yeniden Tasarım)</strong>.`,
            en: `MDG v2 detects the first structural breaking point under current or future load—and clearly indicates: <strong>IDG (Stabilization)</strong> or <strong>ADG (Architectural Redesign)</strong>.`
          };
          el.innerHTML = htmlMap[lang] || value;
        } else {
          // Fallback: only update first text node
          const tn = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
          if (tn) tn.textContent = value;
        }
      }
    });
  }

  // Language buttons
  $$("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  // Default language: keep DE, but respect browser preference if you want
  applyLang("de");

  // ---------- Optional: persist language ----------
  // Uncomment if you want persistence
  // const saved = localStorage.getItem("mdg_lang");
  // if (saved) applyLang(saved);
  // function applyLang(lang){ ...; localStorage.setItem("mdg_lang", lang); }

  // ---------- Optional: reflect toggles to CTA href (for later app) ----------
  // You can later route these values into your diagnosis app path.
  function updateStartLinks() {
    // Example: /diagnose?context=private&depth=quick
    const qs = new URLSearchParams({ context: state.context, depth: state.depth }).toString();
    $$('a[href="#diagnose"][data-i18n="cta.start"], a[href="#diagnose"][data-i18n="cta.startNow"]').forEach(a => {
      // keep anchor for now; when ready, replace with:
      // a.href = `/diagnose?${qs}`;
      a.dataset.qs = qs;
    });
  }
  updateStartLinks();

  // When segments change, update
  const observeSegments = () => {
    $$("[data-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        updateStartLinks();
      });
    });
  };
  observeSegments();
})();
