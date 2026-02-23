const API_BASE = "https://api.mdg-indikation.de";

function getClientId(){
  const k="mdg_client_id";
  let id = localStorage.getItem(k);
  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem(k,id);
  }
  return id;
}

function getDepth(){
  return localStorage.getItem("mdg_depth") || "quick";
}

/* -------------------------
   I18N for Diagnose UI
-------------------------- */
const I18N = {
  de: {
    "dx.title":"Diagnose",
    "dx.subtitle":"Einfache Slider. Hochauflösende Analyse. Executive Memo auf Englisch.",
    "dx.labelName":"Bezeichnung (optional)",
    "dx.labelSector":"Kontext (optional)",
    "dx.note":"Tipp: Nutze Extreme. „0“ = kein relevanter Engpass. „5“ = dominanter Engpass.",
    "sliders.title":"Kern-Dimensionen (0–5)",
    "dx.analyze":"Analysieren",
    "fu.title":"Gezielte Klärungen",
    "fu.back":"Zurück",
    "fu.finalize":"Finalisieren",
    "res.title":"Ergebnis",
    "res.report":"Executive Report öffnen",
    "D.title":"Entscheidungskonzentration",
    "D.ex":"Beispiel: „Nichts passiert, ohne dass eine Person zustimmt.“",
    "L.title":"Last-Ungleichgewicht",
    "L.ex":"Beispiel: „Eine Rolle trägt alles Kritische; andere warten.“",
    "G.title":"Wachstumssensitivität",
    "G.ex":"Beispiel: „+20% führt zu Chaos, Rework oder Qualitätsbruch.“",
    "M.title":"Macht–Verantwortung Mismatch",
    "M.ex":"Beispiel: „Verantwortung ohne Entscheidungsrechte (oder umgekehrt).“",
    "EF.title":"Energie & Fehlerintegration",
    "EF.ex":"Beispiel: „Müdigkeit steigt, Fehler wiederholen sich, Lernen schließt nicht.“",
  },
  tr: {
    "dx.title":"Analiz",
    "dx.subtitle":"Basit sliderlar. Yüksek çözünürlüklü analiz. Executive memo İngilizce.",
    "dx.labelName":"Etiket (opsiyonel)",
    "dx.labelSector":"Bağlam (opsiyonel)",
    "dx.note":"İpucu: Uç değerleri kullan. “0” = sorun yok. “5” = baskın engel.",
    "sliders.title":"Çekirdek boyutlar (0–5)",
    "dx.analyze":"Analiz Et",
    "fu.title":"Hedefli netleştirme",
    "fu.back":"Geri",
    "fu.finalize":"Sonuçlandır",
    "res.title":"Sonuç",
    "res.report":"Executive Report aç",
    "D.title":"Karar yoğunlaşması",
    "D.ex":"Örnek: “Bir kişi onaylamadan hiçbir şey ilerlemiyor.”",
    "L.title":"Yük dengesizliği",
    "L.ex":"Örnek: “Kritik yük tek rolde; diğerleri bekliyor.”",
    "G.title":"Büyüme hassasiyeti",
    "G.ex":"Örnek: “%20 artış kaos / rework / kalite çöküşü getiriyor.”",
    "M.title":"Güç–sorumluluk uyumsuzluğu",
    "M.ex":"Örnek: “Sorumluluk var ama karar yetkisi yok (ya da tersi).”",
    "EF.title":"Enerji & hata entegrasyonu",
    "EF.ex":"Örnek: “Yorgunluk artıyor, hatalar tekrarlanıyor, öğrenme kapanmıyor.”",
  },
  en: {
    "dx.title":"Diagnosis",
    "dx.subtitle":"Simple sliders. High-resolution analysis. Executive memo in English.",
    "dx.labelName":"Label (optional)",
    "dx.labelSector":"Context (optional)",
    "dx.note":"Tip: Use extremes. “0” = no meaningful issue. “5” = dominant constraint.",
    "sliders.title":"Core dimensions (0–5)",
    "dx.analyze":"Analyze",
    "fu.title":"Targeted clarifications",
    "fu.back":"Back",
    "fu.finalize":"Finalize",
    "res.title":"Outcome",
    "res.report":"Open Executive Report",
    "D.title":"Decision concentration",
    "D.ex":"Example: “Nothing moves unless one person approves.”",
    "L.title":"Load imbalance",
    "L.ex":"Example: “One role carries critical load; others wait.”",
    "G.title":"Growth sensitivity",
    "G.ex":"Example: “+20% triggers chaos, rework, or quality collapse.”",
    "M.title":"Power–responsibility mismatch",
    "M.ex":"Example: “Accountability without decision rights (or vice versa).”",
    "EF.title":"Energy & error integration",
    "EF.ex":"Example: “Fatigue rises, errors repeat, learning loops don’t close.”",
  }
};

function applyLang(lang){
  const dict = I18N[lang] || I18N.de;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-lang]").forEach(b=>{
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  });

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.dataset.i18n;
    const v = dict[k];
    if (v) el.textContent = v;
  });
}

/* -------------------------
   Severity Engine (Math)
-------------------------- */
/**
 * Inputs: 0..5 each
 * Returns: SSI 0..100, AF, NLF, CS (confidence), flags
 */
function computeSeverity(scores, depth){
  const D=scores.D, L=scores.L, G=scores.G, M=scores.M, EF=scores.EF;

  // Core stress (weighted)
  const core =
    (0.22*D + 0.22*L + 0.20*G + 0.18*M + 0.18*EF) / 5 * 100; // 0..100

  // Amplification factor (AF): growth + SPOF interaction
  const spof = Math.max(D, L);
  const AF = clamp(1 + (G/5)*0.9 + (spof/5)*0.5, 1, 2.6);

  // Nonlinearity factor (NLF): when G high + EF high + decision high
  const NLF = clamp(0.6 + (G/5)*0.8 + (EF/5)*0.5 + (D/5)*0.35, 0.6, 2.2);

  // Confidence score: more decisive distribution & higher depth improves confidence
  const spread = std([D,L,G,M,EF]); // 0..~2
  const depthBoost = depth === "precise" ? 0.16 : 0.08;
  const CS = clamp01(0.55 + depthBoost + (spread*0.06)); // 0..1

  const SSI = clamp(core * (0.55 + 0.30*(AF-1) + 0.15*(NLF-0.6)), 0, 100);

  return { SSI, AF, NLF, CS, spof: spof>=4, nonlin: G>=4 };
}

function clamp(x,a,b){return Math.max(a, Math.min(b, x));}
function clamp01(x){return clamp(x,0,1);}
function std(xs){
  const m = xs.reduce((a,b)=>a+b,0)/xs.length;
  const v = xs.reduce((a,b)=>a+(b-m)*(b-m),0)/xs.length;
  return Math.sqrt(v);
}

/* -------------------------
   SVG Charts (monochrome)
-------------------------- */
function svgEl(tag, attrs={}){
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function clearSVG(svg){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

function renderRadar(svg, scores){ // scores 0..5
  clearSVG(svg);
  const w=320,h=260,cx=160,cy=130,r=90;
  const labels=[["D","Decision"],["L","Load"],["G","Growth"],["M","Power"],["E","Energy"]];
  const vals=[scores.D,scores.L,scores.G,scores.M,scores.EF].map(v=>v/5);

  // frame
  svg.appendChild(svgEl("rect",{x:10,y:10,width:w-20,height:h-20,rx:14,fill:"transparent",stroke:"rgba(255,255,255,.10)"}));

  // concentric polygons
  for(let k=1;k<=4;k++){
    const rr = r*(k/4);
    svg.appendChild(svgEl("path",{d:polyPath(cx,cy,rr,5, -Math.PI/2),fill:"none",stroke:"rgba(255,255,255,.10)"}));
  }

  // axes + label dots
  for(let i=0;i<5;i++){
    const a = -Math.PI/2 + i*(2*Math.PI/5);
    const x = cx + r*Math.cos(a);
    const y = cy + r*Math.sin(a);
    svg.appendChild(svgEl("line",{x1:cx,y1:cy,x2:x,y2:y,stroke:"rgba(255,255,255,.12)"}));

    // label
    const lx = cx + (r+22)*Math.cos(a);
    const ly = cy + (r+22)*Math.sin(a);
    const t = svgEl("text",{x:lx,y:ly,"text-anchor":"middle",fill:"rgba(233,236,245,.75)","font-size":"11","font-family":"ui-monospace"});
    t.textContent = labels[i][0];
    svg.appendChild(t);
  }

  // value polygon
  const pts=[];
  for(let i=0;i<5;i++){
    const a = -Math.PI/2 + i*(2*Math.PI/5);
    const rr = r*vals[i];
    pts.push([cx + rr*Math.cos(a), cy + rr*Math.sin(a)]);
  }
  svg.appendChild(svgEl("path",{
    d: "M "+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L ")+" Z",
    fill:"rgba(110,231,183,.14)",
    stroke:"rgba(110,231,183,.75)",
    "stroke-width":"2"
  }));
}

function polyPath(cx,cy,r,n,phase){
  const pts=[];
  for(let i=0;i<n;i++){
    const a = phase + i*(2*Math.PI/n);
    pts.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
  }
  return "M "+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L ")+" Z";
}

function renderCurve(svg, severity){ // severity object
  clearSVG(svg);
  const w=320,h=260, pad=26;
  const x0=pad, y0=h-pad, x1=w-pad, y1=pad;

  svg.appendChild(svgEl("rect",{x:10,y:10,width:w-20,height:h-20,rx:14,fill:"transparent",stroke:"rgba(255,255,255,.10)"}));
  svg.appendChild(svgEl("line",{x1:x0,y1:y0,x2:x1,y2:y0,stroke:"rgba(255,255,255,.14)"}));
  svg.appendChild(svgEl("line",{x1:x0,y1:y0,x2:x0,y2:y1,stroke:"rgba(255,255,255,.14)"}));

  // curve based on AF+NLF, SSI
  const AF=severity.AF, NLF=severity.NLF;
  const k = 0.9 + (AF-1)*0.7 + (NLF-0.6)*0.35; // curvature factor
  const pts=[];
  for(let i=0;i<=30;i++){
    const t=i/30; // load growth from 0..1
    const y = Math.pow(t, 1/(k))*1; // convex when k high
    pts.push([ lerp(x0,x1,t), lerp(y0,y1,y) ]);
  }
  svg.appendChild(svgEl("path",{
    d:"M "+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L "),
    fill:"none",
    stroke:"rgba(110,231,183,.75)",
    "stroke-width":"2"
  }));

  // marker at SSI
  const t = clamp01(severity.SSI/100);
  const xm = lerp(x0,x1,t);
  const ym = lerp(y0,y1, Math.pow(t, 1/(k)));
  svg.appendChild(svgEl("circle",{cx:xm,cy:ym,r:5,fill:"rgba(110,231,183,.85)"}));

  const label = svgEl("text",{x:x0,y:y1+2,fill:"rgba(233,236,245,.70)","font-size":"11","font-family":"ui-monospace"});
  label.textContent = "amplification";
  svg.appendChild(label);
}
function lerp(a,b,t){return a+(b-a)*t;}

/* -------------------------
   Boutique Decision Tree UI
-------------------------- */
function buildDecisionTreeHTML(final){
  // final: from GPT followup endpoint
  const triggers = Array.isArray(final?.decision_triggers) ? final.decision_triggers : [];
  const path = final?.strategic_path || "—";
  const primary = final?.final_primary_instability || "—";

  const nodes = [];
  nodes.push(`<div class="node"><b>Primary</b>: ${escapeHtml(primary)}</div>`);
  nodes.push(`<div class="node"><b>Path</b>: ${escapeHtml(path)} <span class="edge">→ decision triggers</span></div>`);
  triggers.slice(0,5).forEach((t,i)=>{
    nodes.push(`<div class="node"><b>T${i+1}</b>: ${escapeHtml(t)}</div>`);
  });
  if (!triggers.length) nodes.push(`<div class="node"><b>Triggers</b>: —</div>`);
  return nodes.join("");
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* -------------------------
   Diagnose page boot
-------------------------- */
document.addEventListener("DOMContentLoaded", async ()=>{
  // Report page boot?
  if (window.__MDG_REPORT_PAGE__) {
    await bootReportPage();
    return;
  }

  // Verlauf page boot?
  if (document.getElementById("historyList")) {
    await bootHistoryPage();
    return;
  }

  // Diagnose page?
  if (document.getElementById("btn_analyze")) {
    bootDiagnosePage();
  }
});

function bootDiagnosePage(){
  const depth = getDepth();
  const clientId = getClientId();

  // language buttons
  document.querySelectorAll("[data-lang]").forEach(btn=>{
    btn.addEventListener("click", ()=> applyLang(btn.dataset.lang));
  });
  applyLang("de");

  // pills
  const pillDepth = document.getElementById("pill_depth");
  pillDepth.textContent = `Depth: ${depth}`;

  // slider live labels
  const ids = ["D","L","G","M","EF"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    const val = document.getElementById("val_"+id);
    const update = ()=>{
      val.textContent = el.value;
      const scores = readScores();
      const sev = computeSeverity(scores, depth);
      document.getElementById("pill_ssi").textContent = `SSI: ${Math.round(sev.SSI)}`;
      document.getElementById("pill_conf").textContent = `Confidence: ${Math.round(sev.CS*100)}%`;
    };
    el.addEventListener("input", update);
    update();
  });

  const status = document.getElementById("dx_status");
  const btnAnalyze = document.getElementById("btn_analyze");
  const followups = document.getElementById("followups");
  const results = document.getElementById("results");

  let initial = null;
  let final = null;
  let diagnosisId = null;

  btnAnalyze.addEventListener("click", async ()=>{
    status.textContent = "Status: analyzing…";
    btnAnalyze.disabled = true;

    const scores = readScores();
    const meta = {
      client_id: clientId,
      depth,
      label: document.getElementById("dx_name").value.trim() || null,
      context: document.getElementById("dx_sector").value.trim() || null,
      ts: new Date().toISOString()
    };

    const sev = computeSeverity(scores, depth);

    // call AI analyze (adaptive followup will be generated in worker)
    const res = await fetch(`${API_BASE}/api/ai/analyze`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ scores, meta, severity: sev })
    });

    const data = await res.json().catch(()=> ({}));
    if (!res.ok) {
      status.textContent = "Status: error: " + (data?.error || "analyze failed");
      btnAnalyze.disabled = false;
      return;
    }

    initial = data;

    // show followups
    followups.hidden = false;
    results.hidden = true;
    document.getElementById("fu_intro").textContent = data.preliminary_assessment || "";

    const qWrap = document.getElementById("fu_questions");
    qWrap.innerHTML = "";
    (data.followup_questions || []).slice(0,3).forEach((q, idx)=>{
      const box = document.createElement("div");
      box.className = "miniCard";
      box.innerHTML = `
        <div class="kicker">Q${idx+1}</div>
        <div class="h3">${escapeHtml(q)}</div>
        <div class="hr"></div>
        <textarea class="input" id="fu_${idx}" rows="3" placeholder="Answer in your own words (can be brief)"></textarea>
      `;
      qWrap.appendChild(box);
    });

    status.textContent = "Status: clarifications required.";
    btnAnalyze.disabled = false;
    window.scrollTo({top: document.body.scrollHeight, behavior:"smooth"});
  });

  document.getElementById("btn_back").addEventListener("click", ()=>{
    followups.hidden = true;
    status.textContent = "Status: adjust sliders if needed.";
  });

  document.getElementById("btn_finalize").addEventListener("click", async ()=>{
    status.textContent = "Status: finalizing…";

    const scores = readScores();
    const sev = computeSeverity(scores, depth);

    const answers = {};
    document.querySelectorAll('[id^="fu_"]').forEach((ta, i)=>{
      answers["q"+(i+1)] = ta.value.trim();
    });

    const res = await fetch(`${API_BASE}/api/ai/followup`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        initial_assessment: initial,
        scores,
        severity: sev,
        answers,
        meta: {
          client_id: clientId,
          depth,
          label: document.getElementById("dx_name").value.trim() || null,
          context: document.getElementById("dx_sector").value.trim() || null,
          ts: new Date().toISOString()
        }
      })
    });

    const data = await res.json().catch(()=> ({}));
    if (!res.ok) {
      status.textContent = "Status: error: " + (data?.error || "followup failed");
      return;
    }

    final = data;

    // save full diagnosis
    status.textContent = "Status: saving…";
    const payload = {
      client_id: clientId,
      meta: {
        depth,
        label: document.getElementById("dx_name").value.trim() || null,
        context: document.getElementById("dx_sector").value.trim() || null,
        created_at: new Date().toISOString()
      },
      scores,
      severity: sev,
      initial,
      final
    };

    const saveRes = await fetch(`${API_BASE}/api/diagnoses`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    const saved = await saveRes.json().catch(()=> ({}));
    if (!saveRes.ok) {
      status.textContent = "Status: save error: " + (saved?.error || "save failed");
      return;
    }
    diagnosisId = saved.id;

    // render on-page summary + charts
    followups.hidden = true;
    results.hidden = false;

    document.getElementById("res_primary").textContent = `Primary: ${final.final_primary_instability || "—"}`;
    document.getElementById("res_path").textContent = `Path: ${final.strategic_path || "—"}`;

    document.getElementById("res_ssi").textContent = `${Math.round(sev.SSI)} / 100`;
    document.getElementById("res_conf").textContent = `Confidence: ${Math.round(sev.CS*100)}%`;
    document.getElementById("res_note").textContent =
      sev.nonlin ? "Nonlinear amplification detected." : "Amplification is present but controllable.";

    const triggerUl = document.getElementById("res_triggers");
    triggerUl.innerHTML = "";
    (final.decision_triggers || []).slice(0,5).forEach(t=>{
      const li = document.createElement("li");
      li.textContent = t;
      triggerUl.appendChild(li);
    });
    if (!triggerUl.children.length){
      const li = document.createElement("li");
      li.textContent = "—";
      triggerUl.appendChild(li);
    }

    renderRadar(document.getElementById("svg_radar"), scores);
    renderCurve(document.getElementById("svg_curve"), sev);

    document.getElementById("save_status").textContent = `Saved: ${diagnosisId}`;
    status.textContent = "Status: ready.";
    document.getElementById("btn_to_report").onclick = ()=> {
      location.href = `./report.html?id=${encodeURIComponent(diagnosisId)}`;
    };

    window.scrollTo({top: document.body.scrollHeight, behavior:"smooth"});
  });

  function readScores(){
    return {
      D: Number(document.getElementById("D").value),
      L: Number(document.getElementById("L").value),
      G: Number(document.getElementById("G").value),
      M: Number(document.getElementById("M").value),
      EF: Number(document.getElementById("EF").value),
    };
  }
}

/* -------------------------
   History page
-------------------------- */
async function bootHistoryPage(){
  const clientId = getClientId();
  const status = document.getElementById("historyStatus");
  const list = document.getElementById("historyList");

  status.textContent = "Loading…";
  const res = await fetch(`${API_BASE}/api/diagnoses?client_id=${encodeURIComponent(clientId)}&limit=30`);
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) {
    status.textContent = "Error: " + (data?.error || "failed");
    return;
  }

  list.innerHTML = "";
  (data.items || []).forEach(item=>{
    const card = document.createElement("div");
    card.className = "miniCard";
    const title = item.label || item.name || "(untitled)";
    card.innerHTML = `
      <div class="row row--between row--wrap">
        <div>
          <div class="kicker">${escapeHtml(item.created_at || "")}</div>
          <div class="h3">${escapeHtml(title)}</div>
          <div class="muted">SSI ${item.ssi ?? "—"} • ${escapeHtml(item.primary || "—")} • ${escapeHtml(item.path || "—")}</div>
        </div>
        <div class="row row--gap">
          <a class="btn btn--ghost" href="./report.html?id=${encodeURIComponent(item.id)}">Report</a>
          <a class="btn btn--ghost" href="./diagnose.html?id=${encodeURIComponent(item.id)}" aria-disabled="true" style="display:none">Open</a>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  status.textContent = (data.items?.length ? "Loaded." : "No items yet.");
}

/* -------------------------
   Report page
-------------------------- */
async function bootReportPage(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) return;

  // load saved diagnosis
  const res = await fetch(`${API_BASE}/api/diagnoses/${encodeURIComponent(id)}`);
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) {
    alert("Failed to load report source: " + (data?.error || "unknown"));
    return;
  }

  // if report missing, generate now and persist
  let report = data.report;
  if (!report) {
    report = await generateReport(data);
    if (report) {
      // persist update
      await fetch(`${API_BASE}/api/diagnoses/${encodeURIComponent(id)}`,{
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ client_id: data.client_id, patch: { report } })
      }).catch(()=>{});
    }
  }

  // render meta
  document.getElementById("r_label").textContent = data?.meta?.label || "—";
  document.getElementById("r_context").textContent = data?.meta?.context || "—";
  document.getElementById("r_created").textContent = data?.meta?.created_at || data?.meta?.ts || "—";
  document.getElementById("r_ssi").textContent = Math.round(data?.severity?.SSI ?? 0);
  document.getElementById("r_conf").textContent = Math.round((data?.severity?.CS ?? 0)*100) + "%";

  // render report
  if (report) {
    document.getElementById("m_exec").textContent = report.executive_summary || "—";
    document.getElementById("m_primary").textContent = report.primary_instability || "—";
    document.getElementById("m_root").textContent = report.root_cause_chain || "—";
    document.getElementById("m_amp").textContent = report.amplification_dynamics || "—";
    document.getElementById("m_nonlin").textContent = report.nonlinearity_note || "—";
    document.getElementById("m_30").textContent = report.plan?.d30 || "—";
    document.getElementById("m_60").textContent = report.plan?.d60 || "—";
    document.getElementById("m_90").textContent = report.plan?.d90 || "—";
    document.getElementById("m_ceo").textContent = report.ceo_memo || "—";
    document.getElementById("m_tree").innerHTML = buildDecisionTreeHTML({ decision_triggers: report.decision_triggers || [], strategic_path: report.path, final_primary_instability: report.primary_instability });
  }

  // charts on report (light)
  renderRadar(document.getElementById("r_svg_radar"), data.scores);
  renderCurve(document.getElementById("r_svg_curve"), data.severity);

  document.getElementById("btn_pdf").addEventListener("click", ()=> window.print());
}

async function generateReport(saved){
  const res = await fetch(`${API_BASE}/api/ai/report`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      scores: saved.scores,
      severity: saved.severity,
      meta: saved.meta,
      initial: saved.initial,
      final: saved.final
    })
  });

  const data = await res.json().catch(()=> ({}));
  if (!res.ok) {
    alert("Report generation failed: " + (data?.error || "unknown"));
    return null;
  }
  return data;
}
