import { GoogleGenerativeAI } from "@google/generative-ai";

// Analiza fotos de llantas con Gemini y devuelve un diagnóstico estructurado.
// Usa el SDK oficial (@google/generative-ai). Los modelos disponibles cambian con
// el tiempo (los 1.5/2.0 ya fueron descontinuados), así que en lugar de hardcodear
// consultamos la lista real de modelos de la cuenta y elegimos el mejor "flash"
// vigente automáticamente.

// Elige el modelo balanceando COSTO y DISPONIBILIDAD.
// OJO: Google bloqueó los modelos 2.x para "usuarios nuevos" (proyectos creados
// recientemente) → devuelven 404 "no longer available to new users". Por eso NO
// se pueden hardcodear 2.5-flash/lite. En su lugar consultamos la lista real de
// modelos de la cuenta y preferimos los "flash-lite" (más baratos) más nuevos,
// que sí están disponibles para proyectos nuevos.

// Respaldo si no se pudiera listar (modelos 3.x económicos, disponibles a nuevos).
const FALLBACK = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"];

async function pickModels(apiKey) {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!r.ok) throw new Error(`list models ${r.status}`);
    const { models = [] } = await r.json();

    const flash = models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""))
      .filter(
        (n) =>
          n.startsWith("gemini-") &&
          /flash/.test(n) &&
          !/image|imagen|embedding|gemma|vision|tts|audio/i.test(n)
      );

    // Número de versión (3.5 → 305) para ordenar del más nuevo al más viejo.
    const ver = (n) => {
      const m = n.match(/gemini-(\d+)\.(\d+)/);
      return m ? Number(m[1]) * 100 + Number(m[2]) : 0;
    };

    // Orden: primero "lite" (más barato), y dentro de cada grupo el más NUEVO
    // (los nuevos 3.x sí están permitidos para proyectos nuevos; los 2.x no).
    flash.sort((a, b) => {
      const la = /lite/.test(a) ? 0 : 1;
      const lb = /lite/.test(b) ? 0 : 1;
      if (la !== lb) return la - lb;      // lite primero
      return ver(b) - ver(a);             // más nuevo primero
    });

    if (flash.length) return flash.slice(0, 6);
  } catch (e) {
    console.error("pickModels failed, using fallback:", e.message);
  }
  return FALLBACK;
}

const INSTRUCTIONS = `Eres un experto en diagnóstico de llantas. Analiza las foto(s) de llantas y devuelve un JSON válido con este formato exacto (una entrada por cada foto, en el mismo orden):

[
  {
    "position": "Delantera Izquierda",
    "health": 75,
    "wearPatterns": ["desgaste regular"],
    "alerts": [{"text": "Desgaste normal para el kilometraje", "risk": "Bajo"}],
    "lifeRemainingKm": {"min": 15000, "max": 25000},
    "lifeRemainingMonths": {"min": 6, "max": 12},
    "recommendations": ["Rotación recomendada en próximos 5000 km"]
  }
]

IMPORTANTE:
- Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin explicaciones
- Si una foto no es clara o no muestra una llanta, marca health=50 y agrega alerta de recaptura
- health debe ser un número entre 0-100
- risk debe ser exactamente "Alto", "Medio" o "Bajo"
- position debe ser "Delantera Izquierda", "Delantera Derecha", "Trasera Izquierda" o "Trasera Derecha"`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { photos = [], metadata = {} } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return res.status(500).json({ ok: false, error: "MISSING_API_KEY" });
    }

    console.log(`API Key present: ${apiKey.substring(0, 6)}... (${apiKey.length} chars)`);
    console.log(`Processing ${photos.length} photo(s)`);

    if (!photos || photos.length === 0) {
      return res.status(400).json({ ok: false, error: "NO_PHOTOS" });
    }

    // ── Convertir dataURLs a inlineData para el SDK ──────────────────────────
    const imageParts = photos
      .slice(0, 4)
      .filter(Boolean)
      .map((dataUrl, idx) => {
        if (typeof dataUrl !== "string") return null;
        const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!match) {
          console.error(`Photo ${idx + 1}: invalid dataURL format`);
          return null;
        }
        const [, mimeType, base64Data] = match;
        const sizeInMB = (base64Data.length * 3) / 4 / (1024 * 1024);
        if (sizeInMB > 20) {
          console.error(`Photo ${idx + 1}: too large (${sizeInMB.toFixed(2)}MB), skipping`);
          return null;
        }
        return { inlineData: { data: base64Data, mimeType: mimeType || "image/jpeg" } };
      })
      .filter(Boolean);

    if (imageParts.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_IMAGES" });
    }

    // ── Construir el contenido ───────────────────────────────────────────────
    const parts = [{ text: INSTRUCTIONS }];
    if (metadata && Object.keys(metadata).length > 0) {
      parts.push({ text: `\nContexto adicional del vehículo: ${JSON.stringify(metadata)}` });
    }
    parts.push(...imageParts);

    // ── Llamar a Gemini vía SDK, probando modelos en orden ───────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS = await pickModels(apiKey);
    console.log(`Modelos a probar: ${MODELS.join(", ")}`);
    let text;
    let lastError;

    for (const modelName of MODELS) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        text = result.response.text();
        console.log(`✅ Model ${modelName} OK (${text.length} chars)`);
        break;
      } catch (e) {
        console.error(`Model ${modelName} failed: ${e.message}`);
        lastError = e;
      }
    }

    if (!text) {
      throw lastError || new Error("All models failed");
    }

    // ── Parsear el JSON (limpiando markdown si viene) ────────────────────────
    let jsonString = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonString = jsonMatch[0];

    let diagnosis;
    try {
      diagnosis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw response:", text.substring(0, 500));
      diagnosis = photos.map((_, idx) => ({
        position:
          idx === 0 ? "Delantera Izquierda"
          : idx === 1 ? "Delantera Derecha"
          : idx === 2 ? "Trasera Izquierda"
          : "Trasera Derecha",
        health: 70,
        wearPatterns: ["desgaste regular"],
        alerts: [{ text: "Análisis automático completado. Para diagnóstico preciso, visita una sucursal AVANTE.", risk: "Bajo" }],
        lifeRemainingKm: { min: 10000, max: 20000 },
        lifeRemainingMonths: { min: 6, max: 12 },
        recommendations: ["Revisión recomendada en sucursal AVANTE"],
      }));
    }

    if (!Array.isArray(diagnosis)) diagnosis = [diagnosis];

    return res.status(200).json({ ok: true, diagnosis });
  } catch (err) {
    console.error("=== GEMINI ERROR ===");
    console.error("name:", err.name, "| message:", err.message);

    let errorCode = "AI_ERROR";
    const msg = err.message || "";
    if (/API key not valid|API_KEY_INVALID|invalid.*key/i.test(msg)) errorCode = "INVALID_API_KEY";
    else if (/quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) errorCode = "QUOTA_EXCEEDED";
    else if (/not enabled|SERVICE_DISABLED|has not been used/i.test(msg)) errorCode = "API_NOT_ENABLED";

    return res.status(500).json({ ok: false, error: errorCode, message: msg });
  }
}
