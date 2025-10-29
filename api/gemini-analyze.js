import { GoogleGenerativeAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  try {
    const { photos = [], metadata = {} } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "MISSING_API_KEY" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build input parts: short system prompt + instructions + images
    const instructions = `Eres un experto en diagnóstico de llantas. Analiza las fotos y entrega un JSON puro (sin texto extra) con este esquema por cada llanta:
[
  {
    "position": "Delantera Izquierda | Delantera Derecha | Trasera Izquierda | Trasera Derecha",
    "health": 0-100,
    "wearPatterns": ["desgaste en borde externo" | "desgaste en centro" | "cupping" | "irregular" | "desgaste regular"],
    "alerts": [{"text": string, "risk": "Alto"|"Medio"|"Bajo"}],
    "lifeRemainingKm": {"min": number, "max": number},
    "lifeRemainingMonths": {"min": number, "max": number},
    "recommendations": [string]
  }
]
Reglas: devuelve solo JSON válido, en español, sin explicaciones. Si una foto no es útil, marca health=50 y alerta de recaptura.`;

    const imageParts = photos
      .slice(0, 4)
      .filter(Boolean)
      .map((dataUrl) => {
        if (typeof dataUrl !== "string") return null;
        const [, meta, base64] = dataUrl.match(/^data:(.*?);base64,(.*)$/) || [];
        if (!base64) return null;
        return { inlineData: { data: base64, mimeType: meta || "image/jpeg" } };
      })
      .filter(Boolean);

    const input = [{ text: instructions }];
    if (metadata && Object.keys(metadata).length > 0) {
      input.push({ text: `Contexto del vehículo/uso: ${JSON.stringify(metadata)}` });
    }
    input.push(...imageParts);

    const result = await model.generateContent(input);
    const text = result.response.text();

    // Attempt to parse JSON. Strip code fences if present.
    const jsonString = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const diagnosis = JSON.parse(jsonString);

    return res.status(200).json({ ok: true, diagnosis });
  } catch (err) {
    console.error("gemini-analyze error", err);
    return res.status(500).json({ ok: false, error: "AI_ERROR" });
  }
}


