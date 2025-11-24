import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "MISSING_API_KEY" });
    }

    console.log(`Testing Gemini API with key: ${apiKey.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Test simple sin imágenes
    const result = await model.generateContent("Responde solo con: OK");
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      ok: true, 
      message: "API funcionando correctamente",
      response: text.trim()
    });
  } catch (err) {
    console.error("Test error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: "TEST_ERROR",
      message: err.message,
      details: err.stack,
      hint: "Verifica que la API de Gemini esté habilitada en: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
    });
  }
}

