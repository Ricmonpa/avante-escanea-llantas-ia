import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { photos = [], metadata = {} } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return res.status(500).json({ ok: false, error: "MISSING_API_KEY" });
    }
    
    // Validar formato de API key (debe empezar con AIza)
    if (!apiKey.startsWith("AIza")) {
      console.error("Invalid API key format");
      return res.status(500).json({ ok: false, error: "INVALID_API_KEY_FORMAT" });
    }
    
    console.log(`API Key present: ${apiKey.substring(0, 10)}... (${apiKey.length} chars)`);
    console.log(`Processing ${photos.length} photo(s)`);

    if (!photos || photos.length === 0) {
      return res.status(400).json({ ok: false, error: "NO_PHOTOS" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construir el prompt con instrucciones claras
    const instructions = `Eres un experto en diagnóstico de llantas. Analiza las ${photos.length} foto(s) de llantas y devuelve un JSON válido con este formato exacto (una entrada por cada foto):

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

    // Procesar imágenes: convertir dataURL a formato que Gemini entiende
    const imageParts = photos
      .slice(0, 4)
      .filter(Boolean)
      .map((dataUrl, idx) => {
        if (typeof dataUrl !== "string") return null;
        
        // Extraer base64 y mimeType del dataURL
        const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!match) {
          console.error(`Photo ${idx + 1}: Invalid dataURL format`);
          return null;
        }
        
        const [, mimeType, base64Data] = match;
        
        // Validar tamaño (Gemini tiene límite de ~20MB por imagen)
        const sizeInBytes = (base64Data.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 20) {
          console.error(`Photo ${idx + 1}: Too large (${sizeInMB.toFixed(2)}MB), skipping`);
          return null;
        }
        
        console.log(`Photo ${idx + 1}: ${sizeInMB.toFixed(2)}MB, type: ${mimeType}`);
        
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/jpeg"
          }
        };
      })
      .filter(Boolean);

    if (imageParts.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_IMAGES" });
    }

    // Construir el contenido para Gemini
    const parts = [
      { text: instructions }
    ];

    // Agregar contexto si existe
    if (metadata && Object.keys(metadata).length > 0) {
      parts.push({ text: `\nContexto adicional: ${JSON.stringify(metadata)}` });
    }

    // Agregar imágenes
    parts.push(...imageParts);

    // Llamar a Gemini - formato correcto según documentación
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Limpiar y parsear JSON
    let jsonString = text.trim();
    
    // Remover markdown code blocks si existen
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    
    // Intentar extraer JSON si hay texto alrededor
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    let diagnosis;
    try {
      diagnosis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      // Fallback: crear diagnóstico genérico
      diagnosis = photos.map((_, idx) => ({
        position: idx === 0 ? "Delantera Izquierda" : idx === 1 ? "Delantera Derecha" : idx === 2 ? "Trasera Izquierda" : "Trasera Derecha",
        health: 70,
        wearPatterns: ["desgaste regular"],
        alerts: [{ text: "Análisis automático completado. Para diagnóstico preciso, visita una sucursal AVANTE.", risk: "Bajo" }],
        lifeRemainingKm: { min: 10000, max: 20000 },
        lifeRemainingMonths: { min: 6, max: 12 },
        recommendations: ["Revisión recomendada en sucursal AVANTE"]
      }));
    }

    // Asegurar que diagnosis sea un array
    if (!Array.isArray(diagnosis)) {
      diagnosis = [diagnosis];
    }

    return res.status(200).json({ ok: true, diagnosis });
  } catch (err) {
    console.error("gemini-analyze error:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Extraer más detalles del error si está disponible
    let errorDetails = err.message || "Unknown error";
    if (err.cause) {
      errorDetails += ` | Cause: ${JSON.stringify(err.cause)}`;
    }
    if (err.response) {
      errorDetails += ` | Response: ${JSON.stringify(err.response)}`;
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: "AI_ERROR",
      message: errorDetails,
      errorType: err.name || "Error"
    });
  }
}


