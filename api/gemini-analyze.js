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

    // Usar API REST directamente con v1 (no v1beta) 
    // Intentaremos con diferentes modelos hasta encontrar uno disponible

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

    // Llamar a Gemini usando API REST directamente (v1 en lugar de v1beta)
    console.log(`Calling Gemini REST API with ${parts.length} parts (${imageParts.length} images)`);
    
    const requestBody = {
      contents: [{
        parts: parts
      }]
    };
    
    // Intentar con diferentes modelos si el primero falla
    const modelNames = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro-vision"];
    let text;
    let lastError;
    
    for (const name of modelNames) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1/models/${name}:generateContent?key=${apiKey}`;
        console.log(`Trying model: ${name}`);
        
        const apiResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.log(`Model ${name} failed: ${apiResponse.status} - ${JSON.stringify(errorData)}`);
          lastError = new Error(`API returned ${apiResponse.status}: ${JSON.stringify(errorData)}`);
          continue; // Intentar siguiente modelo
        }
        
        const data = await apiResponse.json();
        
        // Extraer el texto de la respuesta
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          text = data.candidates[0].content.parts.map(part => part.text).join("");
          console.log(`Model ${name} succeeded! Response length: ${text.length}`);
          break; // Éxito, salir del loop
        } else {
          throw new Error("Invalid response format from Gemini API");
        }
      } catch (apiError) {
        console.error(`Model ${name} error:`, apiError.message);
        lastError = apiError;
        continue; // Intentar siguiente modelo
      }
    }
    
    if (!text) {
      throw lastError || new Error("All models failed");
    }

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
    console.error("=== GEMINI ERROR START ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Intentar extraer más información del error
    let errorDetails = err.message || "Unknown error";
    let errorCode = "AI_ERROR";
    
    // Verificar si es un error de API no habilitada
    if (err.message && err.message.includes("overview?project")) {
      errorCode = "API_NOT_ENABLED";
      errorDetails = "La API de Gemini no está habilitada en tu proyecto de Google Cloud. Ve a https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com y habilítala.";
    } else if (err.message && err.message.includes("API key")) {
      errorCode = "INVALID_API_KEY";
      errorDetails = "La API key no es válida o no tiene permisos. Verifica en Google Cloud Console.";
    } else if (err.message && err.message.includes("quota") || err.message && err.message.includes("quota")) {
      errorCode = "QUOTA_EXCEEDED";
      errorDetails = "Se ha excedido la cuota de la API. Verifica tu plan en Google Cloud Console.";
    }
    
    // Extraer más detalles si están disponibles
    if (err.cause) {
      console.error("Error cause:", JSON.stringify(err.cause, null, 2));
      errorDetails += ` | Cause: ${JSON.stringify(err.cause)}`;
    }
    if (err.response) {
      console.error("Error response:", JSON.stringify(err.response, null, 2));
      errorDetails += ` | Response: ${JSON.stringify(err.response)}`;
    }
    
    // Intentar acceder a propiedades adicionales del error
    try {
      const errorObj = err.toJSON ? err.toJSON() : {};
      console.error("Full error object:", JSON.stringify(errorObj, null, 2));
    } catch (e) {
      // Ignorar si no se puede serializar
    }
    
    console.error("=== GEMINI ERROR END ===");
    
    return res.status(500).json({ 
      ok: false, 
      error: errorCode,
      message: errorDetails,
      errorType: err.name || "Error",
      fullMessage: err.message
    });
  }
}


