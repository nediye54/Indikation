/* mdg-Indikation – Quick Scan + Deep Dive (v1)
   - 8 Variablen
   - 3 Antwortstufen (0.2 / 0.5 / 0.8)
   - 3 Fragen pro Variable (24)
   - Deep Dive: standard max 2 Variablen, optional mehr wenn kritisch
   - 3D Plot: Wahrheit (X), Freiheit (Y), Gerechtigkeit (Z)
*/

(() => {
  "use strict";

  // ---------- Config ----------
  const ANSWERS = [
    { label: "unklar / schwach", value: 0.2 },
    { label: "gemischt / mittel", value: 0.5 },
    { label: "klar / stark", value: 0.8 },
  ];

  const VARS = [
    { key:"freiheit", name:"Freiheit" },
    { key:"gerechtigkeit", name:"Gerechtigkeit" },
    { key:"wahrheit", name:"Wahrheit" },
    { key:"harmonie", name:"Harmonie" },
    { key:"handlungsspielraum", name:"Handlungsspielraum" },
    { key:"effizienz", name:"Effizienz" },
    { key:"mittel", name:"Mittel" },
    { key:"balance", name:"Balance" },
  ];

  // Quick Scan Questions (3 pro Variable)
  const QS = {
    freiheit: [
      "Wie frei fühlst du dich in deinen Entscheidungen im Alltag?",
      "Kannst du ‚Nein‘ sagen, ohne Angst vor Folgen?",
      "Hast du das Gefühl, Optionen zu haben – nicht nur Pflichten?"
    ],
    gerechtigkeit: [
      "Trägst du Lasten fair verteilt – oder fühlst du dich dauerhaft überlastet?",
      "Werden Regeln/Absprachen in deinem Umfeld konsistent angewandt?",
      "Haben Leistung, Verantwortung und Konsequenzen eine faire Beziehung?"
    ],
    wahrheit: [
      "Ist dir in wichtigen Themen klar, was wirklich ist – und was nur Eindruck?",
      "Wird in deinem Umfeld offen gesprochen, ohne dass Wahrheit bestraft wird?",
      "Gibt es Widersprüche, die du ständig ‚wegdrücken‘ musst?"
    ],
    harmonie: [
      "Ist dein Umgangston mit anderen überwiegend ruhig und respektvoll?",
      "Werden Konflikte eher gelöst als gesammelt?",
      "Fühlst du dich in Nähe zu anderen eher sicher als angespannt?"
    ],
    handlungsspielraum: [
      "Kannst du praktisch handeln, wenn etwas schiefläuft (Zeit/Einfluss/Plan)?",
      "Gibt es Wege, Dinge zu verbessern – oder nur Frust ohne Wirkung?",
      "Hast du Zugriff auf Menschen/Orte/Ressourcen, die etwas bewegen?"
    ],
    effizienz: [
      "Erreichst du wichtige Ziele ohne dauerhaft Chaos und Nacharbeit?",
      "Sind deine Routinen tragfähig – oder verbrauchen sie zu viel Energie?",
      "Wird in deinem Umfeld eher gelöst als geredet?"
    ],
    mittel: [
      "Hast du genug Ressourcen (Geld/Unterstützung/Struktur), um stabil zu bleiben?",
      "Kannst du unerwartete Belastungen abfangen, ohne zu kippen?",
      "Hast du Zugriff auf Hilfe, wenn du sie wirklich brauchst?"
    ],
    balance: [
      "Fühlt sich dein Leben insgesamt ausgeglichen an (nicht perfekt – aber stabil)?",
      "Kompensieren sich Spannungen, statt sich zu stapeln?",
      "Kannst du nach Konflikten wieder in Ruhe zurückfinden?"
    ],
  };

  // Deep Dive Questions (Start: 6 pro Variable)
  const DD = {
    freiheit: [
      "Welche Entscheidung vermeidest du gerade – obwohl du sie eigentlich treffen willst?",
      "Wo ist deine Freiheit real begrenzt: durch Menschen, Regeln oder eigene Angst?",
      "Wodurch wird ‚Nein‘ für dich teuer (Konsequenzen, Schuld, Verlust)?",
      "Wenn du heute 10% freier wärst: was würdest du konkret anders machen?",
      "Welche Freiheit schadet dir (zu viel Offenheit ohne Struktur)?",
      "Welche Grenze würdest du setzen, damit Freiheit stabil bleibt?"
    ],
    gerechtigkeit: [
      "Welche Last trägst du, die eigentlich nicht deine sein sollte?",
      "Welche Regel/Abmachung wird gebrochen – und bleibt ohne Konsequenz?",
      "Wo fehlt Transparenz: Leistung, Beitrag, Verantwortung oder Nutzen?",
      "Was wäre eine faire Minimalregel, die sofort Spannung senkt?",
      "Welche Konsequenz wäre fair – aber wird vermieden?",
      "Welche Rolle kannst du übernehmen, ohne dich zu opfern?"
    ],
    wahrheit: [
      "Welche Wahrheit drückst du weg, weil sie Konflikt auslösen würde?",
      "Wer profitiert davon, wenn es unklar bleibt?",
      "Welche Information fehlt dir, um orientiert zu sein?",
      "Was wäre die kleinste Wahrheit, die du sagen/sehen kannst, ohne zu zerstören?",
      "Wie würdest du Wahrheit dosieren (Form/Zeit/Ort), damit Harmonie hält?",
      "Woran würdest du erkennen, dass es wieder klar ist?"
    ],
    harmonie: [
      "Wo ist der Ton das Problem: Inhalt, Timing oder Respekt?",
      "Welche Spannung bleibt unausgesprochen und sammelt sich?",
      "Welche Person/Situation triggert dich wiederholt – warum?",
      "Was wäre ein harmonischer Minimalstandard (Regel) für euren Umgang?",
      "Welche Wahrheit braucht eine ‚Sonnenbrille‘ (Form), damit sie tragbar bleibt?",
      "Welche gemeinsame Routine senkt Konfliktwahrscheinlichkeit sofort?"
    ],
    handlungsspielraum: [
      "Wo willst du handeln, aber dir fehlen Hebel (Zeit, Einfluss, Mittel, Wissen)?",
      "Welche Person/Instanz blockiert – und warum?",
      "Welcher Hebel wäre klein, aber wirksam (10% Schritt)?",
      "Was könntest du delegieren oder vereinfachen, um wieder handeln zu können?",
      "Welche Entscheidung erhöht Handlungsspielraum kurzfristig am meisten?",
      "Welche Abhängigkeit musst du reduzieren, um wieder Spielraum zu haben?"
    ],
    effizienz: [
      "Welche Wiederholung kostet dich am meisten (Fehler, Streit, Umwege)?",
      "Was ist dein größter Energie adds: Chaos oder Perfektionismus?",
      "Welche Routine ist zu lang/zu schwer – und sollte verkürzt werden?",
      "Was wäre eine 80/20 Lösung, die sofort stabilisiert?",
      "Welche klare Regel spart dir jeden Tag Energie?",
      "Was musst du lassen, um effizienter zu werden (ohne härter zu werden)?"
    ],
    mittel: [
      "Welche Ressource fehlt dir gerade am stärksten (Geld, Zeit, Hilfe, Struktur)?",
      "Was wäre die kleinste Mittel-Erhöhung, die große Entlastung bringt?",
      "Wodurch versickern Mittel (Lecks: Konsum, Konflikt, Unklarheit, Abhängigkeit)?",
      "Welche Unterstützung könntest du realistisch aktivieren (1 Person, 1 Schritt)?",
      "Welche Ausgabe/Last ist nicht tragfähig – und muss begrenzt werden?",
      "Wie würdest du Mittel gerechter in deinem Umfeld verteilen?"
    ],
    balance: [
      "Welche Variable zieht alles runter (der Engpass)?",
      "Wo kompensierst du dauerhaft statt zu lösen?",
      "Welche Pause/Regel bringt dich zuverlässig zurück in Stabilität?",
      "Welche kleine Struktur verhindert Kippen in Zukunft?",
      "Was ist dein frühestes Warnsignal fürs Ungleichgewicht?",
      "Welche Handlung bringt dich am schnellsten zurück in die Mitte?"
    ]
  };

  // Thresholds: “kritisch” vs “schwach”
  const THRESH_WEAK = 0.42;     // unterhalb: Deep Dive Kandidat
  const THRESH_CRIT = 0.34;     // unterhalb: kritisch -> optional mehr als 2

  // ---------- DOM ----------
  const qsContainer = document.getElementById("qsContainer");
  const btnEvaluate = document.getElementById("btnEvaluate");
  const btnReset = document.getElementById("btnReset");
  const qsError = document.getElementById("qsError");

  const results = document.getElementById("results");
  const barsEl = document.getElementById("bars");
  const weakestEl = document.getElementById("weakest");
  const timeEl = document.getElementById("timeWindow");
  const btnDeepDive = document.getElementById("btnDeepDive");
  const toggleMoreDeepDive = document.getElementById("toggleMoreDeepDive");

  const plot = document.getElementById("plot3d");
  const ctx = plot.getContext("2d");

  const deepDive = document.getElementById("deepDive");
  const ddContainer = document.getElementById("ddContainer");
  const btnDeepDiveEvaluate = document.getElementById("btnDeepDiveEvaluate");
  const btnDeepDiveBack = document.getElementById("btnDeepDiveBack");
  const ddError = document.getElementById("ddError");
  const ddResult = document.getElementById("ddResult");
  const ddIndication = document.getElementById("ddIndication");

  // ---------- Render Quick Scan ----------
  function renderQuickScan(){
    qsContainer.innerHTML = "";

    for(const v of VARS){
      const block = document.createElement("div");
      block.className = "block";

      const header = document.createElement("div");
      header.className = "title";
      header.innerHTML = `<div class="name">${escapeHtml(v.name)}</div><div class="key">${escapeHtml(v.key)}</div>`;
      block.appendChild(header);

      const qs = QS[v.key];
      if(!qs || qs.length !== 3){
        const warn = document.createElement("div");
        warn.className = "error";
        warn.textContent = `Konfigurationsfehler: ${v.key} braucht 3 Quick-Scan Fragen.`;
        block.appendChild(warn);
        qsContainer.appendChild(block);
        continue;
      }

      qs.forEach((qText, idx) => {
        const q = document.createElement("div");
        q.className = "q";

        const qid = `qs_${v.key}_${idx+1}`;
        const qt = document.createElement("div");
        qt.className = "qt";
        qt.textContent = qText;
        q.appendChild(qt);

        const choices = document.createElement("div");
        choices.className = "choices";

        ANSWERS.forEach((a, aidx) => {
          const label = document.createElement("label");
          label.className = "choice";
          label.innerHTML = `
            <input type="radio" name="${qid}" value="${a.value}" ${aidx===1 ? "checked" : ""}>
            <span>${escapeHtml(a.label)}</span>
          `;
          choices.appendChild(label);
        });

        q.appendChild(choices);
        block.appendChild(q);
      });

      qsContainer.appendChild(block);
    }
  }

  // ---------- Calculate Quick Scan ----------
  function readQuickScan(){
    const scores = {};
    const missing = [];

    for(const v of VARS){
      const key = v.key;
      const vals = [];
      for(let i=1;i<=3;i++){
        const name = `qs_${key}_${i}`;
        const el = document.querySelector(`input[name="${name}"]:checked`);
        if(!el){
          missing.push(`${v.name} (Frage ${i})`);
          continue;
        }
        vals.push(parseFloat(el.value));
      }
      if(vals.length === 3){
        scores[key] = avg(vals);
      }
    }

    return { scores, missing };
  }

  function weakestVariables(scores){
    // Return sorted array of {key, value}
    const arr = VARS.map(v => ({ key:v.key, name:v.name, value: scores[v.key] ?? 0 }))
      .sort((a,b) => a.value - b.value);
    return arr;
  }

  function timeWindowFor(value){
    // Heuristic: direction for intervention timing
    if(value < 0.35) return "kurz (heute–3 Tage)";
    if(value < 0.55) return "mittel (1–2 Wochen)";
    return "lang (1–3 Monate)";
  }

  // ---------- Render Results ----------
  function renderBars(scores){
    barsEl.innerHTML = "";
    for(const v of VARS){
      const val = scores[v.key];
      const row = document.createElement("div");
      row.className = "barRow";

      const label = document.createElement("div");
      label.className = "barLabel";
      label.textContent = v.name;

      const track = document.createElement("div");
      track.className = "barTrack";
      const fill = document.createElement("div");
      fill.className = "barFill";
      // normalize 0.2..0.8 => 0..1
      const pct = clamp((val - 0.2) / 0.6, 0, 1);
      fill.style.width = `${Math.round(pct*100)}%`;
      track.appendChild(fill);

      const vtxt = document.createElement("div");
      vtxt.className = "barVal";
      vtxt.textContent = format(val);

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(vtxt);
      barsEl.appendChild(row);
    }
  }

  function renderFocus(scores){
    const sorted = weakestVariables(scores);
    const weakest = sorted[0];
    weakestEl.textContent = `${weakest.name} (${format(weakest.value)})`;
    timeEl.textContent = timeWindowFor(weakest.value);
  }

  // ---------- 3D Plot (simple projection) ----------
  function draw3D(scores){
    // Axes: Wahrheit (x), Freiheit (y), Gerechtigkeit (z)
    const x = scores["wahrheit"] ?? 0.5;
    const y = scores["freiheit"] ?? 0.5;
    const z = scores["gerechtigkeit"] ?? 0.5;

    // Normalize to 0..1 using 0.2..0.8 range
    const nx = clamp((x - 0.2)/0.6, 0, 1);
    const ny = clamp((y - 0.2)/0.6, 0, 1);
    const nz = clamp((z - 0.2)/0.6, 0, 1);

    const W = plot.width, H = plot.height;
    ctx.clearRect(0,0,W,H);

    // Background
    ctx.fillStyle = "#0f0f12";
    ctx.fillRect(0,0,W,H);

    // 3D cube parameters
    const origin = { x: 120, y: 260 };
    const ax = { x: 260, y: -60 };   // X direction (right-ish)
    const ay = { x: 40,  y: -180 };  // Y direction (up-ish)
    const az = { x: -90, y: -60 };   // Z direction (left-ish)

    // Helper to project 3D point (u,v,w) in 0..1
    const proj = (u,v,w) => ({
      x: origin.x + ax.x*u + ay.x*v + az.x*w,
      y: origin.y + ax.y*u + ay.y*v + az.y*w
    });

    // Draw cube edges
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 1;

    const p000 = proj(0,0,0);
    const p100 = proj(1,0,0);
    const p010 = proj(0,1,0);
    const p001 = proj(0,0,1);
    const p110 = proj(1,1,0);
    const p101 = proj(1,0,1);
    const p011 = proj(0,1,1);
    const p111 = proj(1,1,1);

    // 12 edges
    line(p000,p100); line(p000,p010); line(p000,p001);
    line(p100,p110); line(p100,p101);
    line(p010,p110); line(p010,p011);
    line(p001,p101); line(p001,p011);
    line(p110,p111); line(p101,p111); line(p011,p111);

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    labelAt("Wahrheit", p100, 8, -4);
    labelAt("Freiheit", p010, 6, -6);
    labelAt("Gerechtigkeit", p001, -62, -6);

    // Ticks (0.2 / 0.5 / 0.8) visually as 0 / 0.5 / 1
    drawTicks(origin, ax);
    drawTicks(origin, ay);
    drawTicks(origin, az);

    // Point
    const p = proj(nx, ny, nz);

    // point glow
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,.20)";
    ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(p.x, p.y, 4.6, 0, Math.PI*2);
    ctx.fill();

    // helper text (minimal)
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`Punkt: W=${format(x)}  F=${format(y)}  G=${format(z)}`, 16, 22);

    function line(a,b){
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }
    function labelAt(text, pt, dx, dy){
      ctx.fillText(text, pt.x + dx, pt.y + dy);
    }
    function drawTicks(o, dir){
      const t1 = { x: o.x + dir.x*0.5, y: o.y + dir.y*0.5 };
      const t2 = { x: o.x + dir.x*1.0, y: o.y + dir.y*1.0 };
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.beginPath(); ctx.arc(t1.x, t1.y, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(t2.x, t2.y, 2, 0, Math.PI*2); ctx.fill();
    }
  }

  // ---------- Deep Dive ----------
  function pickDeepDiveVars(scores){
    const sorted = weakestVariables(scores); // ascending
    const weak = sorted.filter(v => v.value < THRESH_WEAK);
    const crit = sorted.filter(v => v.value < THRESH_CRIT);

    const allowMore = !!toggleMoreDeepDive.checked;

    if(allowMore){
      // If many are weak, include all weak; else include up to 2
      if(weak.length >= 1) return weak.map(v => v.key);
      return sorted.slice(0,2).map(v=>v.key);
    }

    // default: max 2, but prefer critical/weak
    if(crit.length >= 2) return crit.slice(0,2).map(v=>v.key);
    if(weak.length >= 2) return weak.slice(0,2).map(v=>v.key);
    if(weak.length === 1) return [weak[0].key, sorted[1].key].map(k=>k).slice(0,2);

    // nothing weak: still offer top-1 or top-2 (optional)
    return sorted.slice(0,2).map(v=>v.key);
  }

  function renderDeepDive(keys){
    ddContainer.innerHTML = "";
    ddResult.hidden = true;
    ddIndication.innerHTML = "";

    keys.forEach(key => {
      const v = VARS.find(x=>x.key===key);
      const qs = DD[key];
      if(!v || !qs) return;

      const block = document.createElement("div");
      block.className = "block";

      const title = document.createElement("div");
      title.className = "ddVarTitle";
      title.textContent = `${v.name} – Deep Dive`;
      block.appendChild(title);

      qs.forEach((text, i) => {
        const q = document.createElement("div");
        q.className = "q";
        const qid = `dd_${key}_${i+1}`;

        const qt = document.createElement("div");
        qt.className = "qt";
        qt.textContent = text;
        q.appendChild(qt);

        const choices = document.createElement("div");
        choices.className = "choices";
        ANSWERS.forEach((a, aidx) => {
          const label = document.createElement("label");
          label.className = "choice";
          label.innerHTML = `
            <input type="radio" name="${qid}" value="${a.value}" ${aidx===1 ? "checked" : ""}>
            <span>${escapeHtml(a.label)}</span>
          `;
          choices.appendChild(label);
        });

        q.appendChild(choices);
        block.appendChild(q);
      });

      ddContainer.appendChild(block);
    });
  }

  function readDeepDive(keys){
    const ddScores = {};
    const missing = [];

    for(const key of keys){
      const questions = DD[key] || [];
      const vals = [];
      for(let i=1;i<=questions.length;i++){
        const name = `dd_${key}_${i}`;
        const el = document.querySelector(`input[name="${name}"]:checked`);
        if(!el){
          missing.push(`${key} (Frage ${i})`);
          continue;
        }
        vals.push(parseFloat(el.value));
      }
      if(vals.length === questions.length && questions.length > 0){
        ddScores[key] = avg(vals);
      }
    }
    return { ddScores, missing };
  }

  function buildIndication(quickScores, ddScores, keys){
    // This is a “static” first version. Worker will replace it later.
    // We generate a short, strong action sequence per variable with harmony-aware language.

    const lines = [];
    const byKey = {};

    for(const key of keys){
      const qv = quickScores[key];
      const dv = ddScores[key] ?? qv;

      byKey[key] = { quick:qv, deep:dv };

      const v = VARS.find(x=>x.key===key);
      const name = v ? v.name : key;

      const urgency = (dv < 0.35) ? "sofort" : (dv < 0.55 ? "bald" : "ruhig");

      // Per-variable minimal “stabilisierende” indication
      const steps = indicationSteps(key);

      lines.push(`<div class="stepBlock">
        <div class="stepTitle">${escapeHtml(name)} – Fokus (${urgency})</div>
        <ol class="olist">
          ${steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </div>`);
    }

    // Add one “Integration” line: make it mdg-clean
    const weakest = weakestVariables({...quickScores, ...ddScores})[0];
    const final = `
      <div class="muted small" style="margin-top:10px">
        Integrationsregel: Stabilisiere zuerst <b>${escapeHtml(weakest.name)}</b>, dann erst optimieren. Zu viele gleichzeitige Verschiebungen erhöhen Bewegung.
      </div>
    `;

    return lines.join("") + final;
  }

  function indicationSteps(key){
    switch(key){
      case "gerechtigkeit":
        return [
          "Definiere eine faire Minimalregel (wer trägt was – und warum).",
          "Schaffe Transparenz: Beitrag, Nutzen, Konsequenz (kurz, sachlich).",
          "Setze eine kleine, faire Konsequenz durch – ohne Eskalation."
        ];
      case "freiheit":
        return [
          "Benenn eine konkrete Grenze: Was ist nicht verhandelbar?",
          "Wähle 1 Entscheidung, die du heute wirklich triffst (10%-Schritt).",
          "Koppel Freiheit an Struktur: klare Abmachung statt Gefühl."
        ];
      case "wahrheit":
        return [
          "Suche die kleinste tragbare Wahrheit (nicht alles, nur das Nötige).",
          "Wähle Form/Zeit/Ort so, dass Harmonie halten kann.",
          "Schaffe Orientierung: 1 Satz, 1 Fakt, 1 nächste Handlung."
        ];
      case "harmonie":
        return [
          "Senke den Ton: erst Respekt stabilisieren, dann Inhalt klären.",
          "Etabliere eine Gesprächsregel (Dauer, Pause, keine Abwertung).",
          "Baue eine Routine ein, die Konfliktwahrscheinlichkeit reduziert."
        ];
      case "handlungsspielraum":
        return [
          "Identifiziere einen Hebel, den du wirklich bewegen kannst (klein, real).",
          "Reduziere Abhängigkeiten: 1 Blockade auflösen oder umgehen.",
          "Sichere Zeit/Struktur: ohne Raum keine Intervention."
        ];
      case "effizienz":
        return [
          "Entferne Wiederholung: 1 Regel, die Nacharbeit verhindert.",
          "Nutze 80/20: Lösung statt Perfektion, aber sauber dokumentiert.",
          "Kürze Prozesse: weniger Schritte, weniger Streitpunkte."
        ];
      case "mittel":
        return [
          "Stoppe Lecks: 1 Sache, die Mittel dauerhaft frisst, begrenzen.",
          "Aktiviere Unterstützung: 1 Person/Quelle gezielt ansprechen.",
          "Baue Reserve: klein anfangen (Puffer), dann stabilisieren."
        ];
      case "balance":
        return [
          "Nenne deinen Engpass (die Variable, die alles kippt).",
          "Stabilisiere zuerst, optimiere später (kein Multitasking).",
          "Baue ein Warnsignal + Rückkehr-Routine (immer gleich)."
        ];
      default:
        return [
          "Stabilisiere zuerst das, was kippt.",
          "Verändere klein und überprüfbar.",
          "Vermeide gleichzeitige Verschiebungen."
        ];
    }
  }

  // ---------- Events ----------
  function showError(el, msg){
    el.textContent = msg;
    el.hidden = false;
  }
  function clearError(el){
    el.textContent = "";
    el.hidden = true;
  }

  btnEvaluate.addEventListener("click", () => {
    try{
      clearError(qsError);

      const {scores, missing} = readQuickScan();
      if(missing.length){
        showError(qsError, `Bitte vervollständigen: ${missing.slice(0,6).join(", ")}${missing.length>6?" …":""}`);
        return;
      }

      // Render results
      renderBars(scores);
      renderFocus(scores);
      draw3D(scores);

      results.hidden = false;
      results.scrollIntoView({behavior:"smooth", block:"start"});

      // store for deep dive
      window.__mdg_quick = scores;
    }catch(e){
      showError(qsError, `Fehler bei Auswertung: ${e && e.message ? e.message : String(e)}`);
    }
  });

  btnReset.addEventListener("click", () => {
    try{
      clearError(qsError);
      clearError(ddError);
      results.hidden = true;
      deepDive.hidden = true;
      ddResult.hidden = true;
      ddIndication.innerHTML = "";
      renderQuickScan();
      window.__mdg_quick = null;
      window.__mdg_dd_keys = null;
      window.__mdg_dd = null;
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(e){}
  });

  btnDeepDive.addEventListener("click", () => {
    try{
      clearError(ddError);
      ddResult.hidden = true;
      ddIndication.innerHTML = "";

      const scores = window.__mdg_quick;
      if(!scores){
        showError(ddError, "Bitte erst Quick Scan auswerten.");
        return;
      }

      const keys = pickDeepDiveVars(scores);
      window.__mdg_dd_keys = keys;

      renderDeepDive(keys);
      deepDive.hidden = false;
      deepDive.scrollIntoView({behavior:"smooth", block:"start"});
    }catch(e){
      showError(ddError, `Fehler beim Start: ${e && e.message ? e.message : String(e)}`);
    }
  });

  btnDeepDiveBack.addEventListener("click", () => {
    ddResult.hidden = true;
    ddIndication.innerHTML = "";
    deepDive.hidden = true;
    results.scrollIntoView({behavior:"smooth", block:"start"});
  });

  btnDeepDiveEvaluate.addEventListener("click", () => {
    try{
      clearError(ddError);
      const scores = window.__mdg_quick;
      const keys = window.__mdg_dd_keys || [];
      if(!scores || !keys.length){
        showError(ddError, "Kein Deep Dive aktiv.");
        return;
      }

      const {ddScores, missing} = readDeepDive(keys);
      if(missing.length){
        showError(ddError, "Bitte alle Deep-Dive Fragen beantworten (oder zurück).");
        return;
      }

      window.__mdg_dd = ddScores;

      const html = buildIndication(scores, ddScores, keys);
      ddIndication.innerHTML = html;
      ddResult.hidden = false;
      ddResult.scrollIntoView({behavior:"smooth", block:"start"});
    }catch(e){
      showError(ddError, `Fehler bei Deep Dive: ${e && e.message ? e.message : String(e)}`);
    }
  });

  // ---------- Helpers ----------
  function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
  function clamp(x,min,max){ return Math.max(min, Math.min(max,x)); }
  function format(x){ return (Math.round(x*100)/100).toFixed(2); }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // Safety: avoid “Script error” on some mobile by delaying init
  function init(){
    renderQuickScan();
    // Default hidden
    results.hidden = true;
    deepDive.hidden = true;
    ddResult.hidden = true;

    // Improve canvas scaling on mobile (keep internal pixels for crispness)
    try{
      const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const cssW = plot.clientWidth || 520;
      const cssH = 360;
      plot.width = cssW * ratio;
      plot.height = cssH * ratio;
      plot.style.height = cssH + "px";
      plot.style.width = "100%";
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }catch(e){}
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, { once:true });
  }else{
    init();
  }

})();
