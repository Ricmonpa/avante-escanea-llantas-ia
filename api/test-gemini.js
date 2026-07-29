export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "MISSING_API_KEY" });
    }

    console.log(`Testing Gemini API with key: ${apiKey.substring(0, 10)}...`);

    // Mismos modelos que usa el diagnóstico real: 3.x flash-lite primero (baratos y
    // disponibles para proyectos nuevos; los 2.x tienen cuota gratuita 0 en cuentas nuevas).
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ];

    let available = [];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (listRes.ok) {
        const data = await listRes.json();
        available = (data.models || [])
          .map((m) => m.name.replace("models/", ""))
          .filter((m) => !m.includes("embedding"));
      }
    } catch {
      // seguir con lista fija
    }

    const candidates =
      available.length > 0
        ? modelsToTry.filter((m) => available.includes(m))
        : modelsToTry;

    if (candidates.length === 0) {
      return res.status(500).json({
        ok: false,
        error: "NO_MODELS",
        message: "No hay modelos compatibles disponibles en este proyecto.",
        availableModels: available,
      });
    }

    let lastError;
    for (const model of candidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const apiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Responde solo con: OK" }] }],
          }),
        });

        if (!apiRes.ok) {
          const err = await apiRes.json().catch(() => ({}));
          lastError = err.error?.message || apiRes.statusText;
          continue;
        }

        const data = await apiRes.json();
        const text =
          data.candidates?.[0]?.content?.parts
            ?.map((p) => p.text)
            .join("")
            .trim() || "";

        return res.status(200).json({
          ok: true,
          message: "API funcionando correctamente",
          model,
          response: text,
          availableModels: available.length ? available : undefined,
        });
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(500).json({
      ok: false,
      error: "TEST_ERROR",
      message: lastError || "Todos los modelos fallaron",
      triedModels: candidates,
      availableModels: available,
      hint: "Verifica que Gemini API esté habilitada en el proyecto SCANNER LLANTAS AVANTE NUEVO.",
    });
  } catch (err) {
    console.error("Test error:", err);
    return res.status(500).json({
      ok: false,
      error: "TEST_ERROR",
      message: err.message,
    });
  }
}
