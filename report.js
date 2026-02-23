(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ----- Drawer (same as other pages)
  const burger = $(".burger");
  const drawer = $(".drawer");
  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const open = !drawer.hasAttribute("hidden");
      if (open) { drawer.setAttribute("hidden",""); burger.setAttribute("aria-expanded","false"); }
      else { drawer.removeAttribute("hidden"); burger.setAttribute("aria-expanded","true"); }
    });
  }

  // ----- i18n
  const dict = {
    de: {
      "nav.how":"Wie es funktioniert","nav.why":"Warum MDG","nav.faq":"FAQ","cta.backDx":"Zur Diagnose",
      "rp.title":"Executive Report",
      "rp.sub":"Premium Report (print-ready) – in wenigen Sekunden als PDF speicherbar.",
      "rp.print":"Drucken / Als PDF speichern",
      "rp.copy":"Report kopieren",
      "rp.caseTitle":"Case Header",
      "rp.scanTitle":"Quick Scan",
      "rp.treeTitle":"Architecture Tree",
      "rp.treeHint":"Entscheidung → Struktur → Last → Fehlermodi → Interventionen.",
      "rp.execTitle":"Executive Report",
      "rp.footerNote":"Hinweis: Generiert aus Inputs + MDG-Logik. Kein Rechts-/Medizinrat.",
      "footer.tag":"Strukturdiagnose für Stabilisierung und Umbau."
    },
    tr: {
      "nav.how":"Nasıl çalışır","nav.why":"Neden MDG","nav.faq":"SSS","cta.backDx":"Analize dön",
      "rp.title":"Yönetici Raporu",
      "rp.sub":"Premium rapor (print-ready) – saniyeler içinde PDF’ye kaydedilebilir.",
      "rp.print":"Yazdır / PDF olarak kaydet",
      "rp.copy":"Raporu kopyala",
      "rp.caseTitle":"Vaka başlığı",
      "rp.scanTitle":"Hızlı tarama",
      "rp.treeTitle":"Mimari ağacı",
      "rp.treeHint":"Karar → Yapı → Yük → Hata modları → Müdahaleler.",
      "rp.execTitle":"Yönetici Raporu",
      "rp.footerNote":"Not: Girdiler + MDG mantığıyla üretilir. Hukuki/tıbbi tavsiye değildir.",
      "footer.tag":"Stabilizasyon ve yeniden kurulum için yapı teşhisi."
    },
    en: {
      "nav.how":"How it works","nav.why":"Why MDG","nav.faq":"FAQ","cta.backDx":"Back to diagnosis",
      "rp.title":"Executive Report",
      "rp.sub":"Premium report (print-ready) – save as PDF in seconds.",
      "rp.print":"Print / Save as PDF",
      "rp.copy":"Copy report",
      "rp.caseTitle":"Case header",
      "rp.scanTitle":"Quick Scan",
      "rp.treeTitle":"Architecture Tree",
      "rp.treeHint":"Decision → Structure → Load → Failure modes → Interventions.",
      "rp.execTitle":"Executive Report",
      "rp.footerNote":"Note: Generated from inputs + MDG logic. Not legal/medical advice.",
      "footer.tag":"Structure diagnosis for stabilization and rebuild."
    }
  };

  function applyLang(lang){
    if(!dict[lang]) lang="de";
    document.documentElement.lang = lang;
    $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang===lang)));
    $$("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      if (dict[lang][k]) el.textContent = dict[lang][k];
    });
    // also refresh dynamic subtitle if needed
    $("#rpSubtitle").textContent = dict[lang]["rp.sub"] || $("#rpSubtitle").textContent;
  }

  $$("[data-lang]").forEach(btn => btn.addEventListener("click", () => {
    const lang = btn.dataset.lang;
    sessionStorage.setItem("mdg_lang", lang);
    applyLang(lang);
  }));

  // ----- Data bridge from diagnose.html
  // diagnose.html sets sessionStorage key "mdg_report_payload"
  function readPayload(){
    const raw = sessionStorage.getItem("mdg_report_payload");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function esc(s){
    return String(s ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // ----- SVG Tree (premium looking but deterministic)
  function buildTreeSVG({ mode, primary, path, risk, intent, tensions }) {
    // Simple tree: Root -> 4 branches -> interventions
    const w = 920, h = 520;
    const cx = 150, cy = 70;

    const title = mode === "business" ? "BUSINESS ARCHITECTURE TREE" : "PRIVATE ARCHITECTURE TREE";
    const p = primary || "—";
    const pa = path || "—";
    const r = risk || "—";

    const nodes = [
      { id:"root", x:cx, y:cy, label:title },
      { id:"n1", x:240, y:170, label:`Primary instability:\n${p}` },
      { id:"n2", x:240, y:300, label:`Path:\n${pa}` },
      { id:"n3", x:500, y:170, label:`Risk:\n${r}` },
      { id:"n4", x:500, y:300, label:`Goal:\n${intent || "—"}` },
    ];

    const tList = (tensions || []).slice(0, 6);
    const tStartX = 680, tStartY = 120;
    tList.forEach((t, i) => {
      nodes.push({
        id:`t${i+1}`,
        x:tStartX,
        y:tStartY + i*60,
        label:`Tension ${i+1}:\n${String(t).slice(0, 72)}`
      });
    });

    const edges = [];
    for (const n of nodes) {
      if (n.id === "root") continue;
      edges.push(["root", n.id]);
    }

    const defs = `
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(110,231,183,0.20)"/>
          <stop offset="100%" stop-color="rgba(59,130,246,0.18)"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
    `;

    function edgeLine(a, b){
      const A = nodes.find(n => n.id===a);
      const B = nodes.find(n => n.id===b);
      if (!A || !B) return "";
      const x1 = A.x + 110, y1 = A.y + 28;
      const x2 = B.x - 10, y2 = B.y + 28;
      const mx = (x1+x2)/2;
      return `<path d="M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}"
        stroke="rgba(255,255,255,0.16)" stroke-width="2" fill="none"/>`;
    }

    function nodeBox(n){
      const lines = String(n.label).split("\n");
      const head = lines[0] || "";
      const body = lines.slice(1).join(" ");
      return `
        <g filter="url(#shadow)">
          <rect x="${n.x}" y="${n.y}" rx="16" ry="16" width="240" height="68"
            fill="url(#g1)" stroke="rgba(255,255,255,0.18)"/>
        </g>
        <text x="${n.x+16}" y="${n.y+26}" fill="rgba(255,255,255,0.95)" font-size="14" font-weight="800"
          font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">
          ${esc(head)}
        </text>
        <text x="${n.x+16}" y="${n.y+48}" fill="rgba(255,255,255,0.85)" font-size="12" font-weight="600"
          font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial">
          ${esc(body)}
        </text>
      `;
    }

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect x="0" y="0" width="${w}" height="${h}" rx="20" ry="20" fill="rgba(255,255,255,0.02)" />
        ${defs}
        ${edges.map(([a,b]) => edgeLine(a,b)).join("")}
        ${nodes.map(nodeBox).join("")}
      </svg>`;

    return svg;
  }

  function formatScan(scan){
    if (!scan) return "—";
    const s = scan;
    const parts = [
      `Load: ${s.load ?? "—"}`,
      `Decisions: ${s.decisions ?? "—"}`,
      `Energy: ${s.energy ?? "—"}`,
      `Growth: ${s.growth ?? "—"}`,
      `Power: ${s.power ?? "—"}`
    ];
    return parts.join(" · ");
  }

  function mount(payload){
    if (!payload) {
      $("#rpReport").textContent = "No report data found. Please generate the report from diagnose.html first.";
      return;
    }

    // language: keep user choice
    const lang = payload.lang || sessionStorage.getItem("mdg_lang") || "de";
    applyLang(lang);

    const mode = payload.mode || "private";
    $("#rpMode").textContent = mode === "business" ? "Business" : "Private";

    $("#rpPrimary").textContent = "Primary: " + (payload.primary || payload.assessment?.primary || "—");
    $("#rpPath").textContent    = "Path: " + (payload.path || payload.assessment?.path || "—");
    $("#rpRisk").textContent    = "Risk: " + (payload.risk || payload.assessment?.risk || "—");

    $("#rpCase").textContent = payload.problem || payload.one_liner || "—";
    $("#rpScan").textContent = formatScan(payload.quick_scan || payload.answers?.quick_scan);

    const tensions = payload.tensions || payload.assessment?.tensions || [];
    const svg = buildTreeSVG({
      mode,
      primary: payload.primary || payload.assessment?.primary,
      path: payload.path || payload.assessment?.path,
      risk: payload.risk || payload.assessment?.risk,
      intent: payload.intent || payload.goal,
      tensions
    });
    $("#treeMount").innerHTML = svg;

    // report markdown/text
    const text = payload.report_markdown || payload.report || payload.executive_report || "—";
    $("#rpReport").textContent = text;
  }

  // ----- Buttons
  $("#printBtn")?.addEventListener("click", () => window.print());
  $("#copyBtn")?.addEventListener("click", async () => {
    const txt = $("#rpReport")?.textContent || "";
    if (!txt || txt === "—") return;
    try { await navigator.clipboard.writeText(txt); } catch {}
  });

  // ----- init
  mount(readPayload());
})();
