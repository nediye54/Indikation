export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // === CORS ===
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://mdg-indikation.de",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj, null, 2), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    // === Helpers ===
    const safeJson = async (req) => {
      try { return await req.json(); } catch { return null; }
    };

    const avg = (arr) => {
      if (!arr || !arr.length) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };

    const pickWeakest = (scores) => {
      let wKey = null;
      let wVal = Infinity;
      for (const [k, v] of Object.entries(scores || {})) {
        if (typeof v === "number" && v < wVal) {
          wKey = k;
          wVal = v;
        }
      }
      return wKey;
    };

    const localDeepDive = ({ weakest, timeframe }) => {
      const list = (weakest || []).join(", ");
      const tf = timeframe || "heute";
      return `Deep Dive (ohne KI): Fokus auf ${list}. Zeitfenster: ${tf}. (OpenAI-Key fehlt im Worker: env.OPENAI_API_KEY)`;
    };

    // === Routes ===
    if (request.method === "GET" && path === "/health") {
      return json({ ok: true, service: "mdg-worker", routes: ["/health", "/analyze", "/deepdive"] });
    }

    // ---- Analyze (Quick Scan) ----
    // Expect: { answers: { "Freiheit": [0.2,0.5,0.8], ... } }
    if (request.method === "POST" && path === "/analyze") {
      const body = await safeJson(request);
      const answers = body?.answers;

      if (!answers || typeof answers !== "object") {
        return json({ ok: false, error: "Missing 'answers' object." }, 400);
      }

      const perVar = {};
      for (const [k, arr] of Object.entries(answers)) {
        perVar[k] = avg(arr);
      }

      const weakest = pickWeakest(perVar);

      return json({
        ok: true,
        perVar,
        weakest,
      });
    }

    // ---- Deep Dive (Worker + OpenAI) ----
    // Expect: { language, timeframe, scores, weakest }
    if (request.method === "POST" && path === "/deepdive") {
      const body = await safeJson(request);

      const language = (body?.language || "de").toLowerCase();
      const timeframe = body?.timeframe || "heute";
      const scores = body?.scores || {};
      const weakest = body?.weakest || [];

      if (!scores || typeof scores !== "object") {
        return json({ ok: false, error: "Missing 'scores' object." }, 400);
      }
      if (!Array.isArray(weakest) || weakest.length === 0) {
        return json({ ok: false, error: "Missing 'weakest' array." }, 400);
      }

      // PROMPTS per language
      const PROMPTS = {
        de: (ctx) => `
Du bist ein analytischer, philosophischer Coach. Schreibe auf Deutsch.

Kontext:
Scores: ${JSON.stringify(ctx.scores)}
Schwächste Variablen: ${ctx.weakest.join(", ")}
Zeitfenster: ${ctx.timeframe}

Aufgabe:
Erstelle eine stabilisierende Indikation mit:
1) Kernproblem (klar benennen, 2–3 Sätze)
2) Dynamik (Zusammenhänge erklären, 4–6 Sätze)
3) Konkrete Hebel (genau 5 umsetzbare Schritte, nummeriert)
4) Warnsignal (1–2 Sätze: woran merkt man, dass man abdriftet?)
5) Mini-Mantra (1 Satz, merkbar, nicht kitschig)

Ton: ruhig, klar, intelligent, nicht esoterisch.
Länge: ca. 220–320 Wörter.
        `.trim(),

        en: (ctx) => `
You are an analytical philosophical coach. Write in English.

Context:
Scores: ${JSON.stringify(ctx.scores)}
Weakest variables: ${ctx.weakest.join(", ")}
Timeframe: ${ctx.timeframe}

Task:
Create a stabilizing indication with:
1) Core issue (2–3 sentences)
2) Dynamics (4–6 sentences explaining how things interact)
3) Practical levers (exactly 5 actionable steps, numbered)
4) Warning signal (1–2 sentences)
5) Mini mantra (1 memorable sentence, not cheesy)

Tone: calm, clear, intelligent, not mystical.
Length: ~220–320 words.
        `.trim(),

        fr: (ctx) => `
Tu es un coach philosophique et analytique. Écris en français.

Contexte :
Scores : ${JSON.stringify(ctx.scores)}
Variables les plus faibles : ${ctx.weakest.join(", ")}
Fenêtre de temps : ${ctx.timeframe}

Tâche :
Produis une indication stabilisante avec :
1) Problème central (2–3 phrases)
2) Dynamique (4–6 phrases sur les interactions)
3) Leviers concrets (exactement 5 actions, numérotées)
4) Signal d’alerte (1–2 phrases)
5) Mini-mantra (1 phrase mémorisable, sans kitsch)

Ton : calme, clair, intelligent, non ésotérique.
Longueur : ~220–320 mots.
        `.trim(),

        es: (ctx) => `
Eres un coach filosófico y analítico. Escribe en español.

Contexto:
Puntuaciones: ${JSON.stringify(ctx.scores)}
Variables más débiles: ${ctx.weakest.join(", ")}
Ventana de tiempo: ${ctx.timeframe}

Tarea:
Crea una indicación estabilizadora con:
1) Problema central (2–3 frases)
2) Dinámica (4–6 frases explicando relaciones)
3) Palancas concretas (exactamente 5 pasos accionables, numerados)
4) Señal de alerta (1–2 frases)
5) Mini-mantra (1 frase memorable, sin cursilería)

Tono: calmado, claro, inteligente, no místico.
Longitud: ~220–320 palabras.
        `.trim(),

        tr: (ctx) => `
Sen analitik ve felsefi bir koçsun. Türkçe yaz.

Bağlam:
Skorlar: ${JSON.stringify(ctx.scores)}
En zayıf değişkenler: ${ctx.weakest.join(", ")}
Zaman penceresi: ${ctx.timeframe}

Görev:
Aşağıdaki yapıyla “dengeleyici bir endikasyon” yaz:
1) Ana sorun (2–3 cümle)
2) Dinamik (4–6 cümle, ilişkileri açıkla)
3) Somut kaldıraçlar (tam 5 uygulanabilir adım, numaralı)
4) Uyarı sinyali (1–2 cümle)
5) Mini-mantra (1 akılda kalır cümle, kitsch değil)

Ton: sakin, net, zeki; mistik/ezoterik değil.
Uzunluk: ~220–320 kelime.
        `.trim(),
      };

      const promptBuilder = PROMPTS[language] || PROMPTS["en"];
      const prompt = promptBuilder({ scores, weakest, timeframe });

      // If no key: fallback, still ok:true
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return json({ ok: true, text: localDeepDive({ weakest, timeframe }), used_ai: false });
      }

      // Call OpenAI
      try {
        const model = env.OPENAI_MODEL || "gpt-4o-mini";

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.6,
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: prompt },
            ],
          }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          const msg = data?.error?.message || `OpenAI HTTP ${resp.status}`;
          // still return ok:true with fallback text (UX > hard fail)
          return json({ ok: true, text: localDeepDive({ weakest, timeframe }) + ` (OpenAI Fehler: ${msg})`, used_ai: false });
        }

        const text =
          data?.choices?.[0]?.message?.content?.trim() ||
          localDeepDive({ weakest, timeframe });

        return json({ ok: true, text, used_ai: true });
      } catch (e) {
        // Network / fetch error -> fallback
        return json({ ok: true, text: localDeepDive({ weakest, timeframe }) + ` (Fetch Fehler: ${String(e?.message || e)})`, used_ai: false });
      }
    }

    // default
    return json({ ok: false, error: "Not found" }, 404);
  },
};
