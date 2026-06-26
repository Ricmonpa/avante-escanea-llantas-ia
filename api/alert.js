export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { phone, diagnosis, email } = req.body || {};

  if (!phone) {
    return res.status(400).json({ ok: false, error: "MISSING_PHONE" });
  }
  if (!diagnosis || !Array.isArray(diagnosis)) {
    return res.status(400).json({ ok: false, error: "MISSING_DIAGNOSIS" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Missing Twilio env vars");
    return res.status(500).json({ ok: false, error: "MISSING_TWILIO_CONFIG" });
  }

  // ── Normalización de número a formato internacional mexicano (E.164) ─────────
  // WhatsApp registra los celulares mexicanos con el dígito "1" entre el código de
  // país (52) y el área. Ej: el número 477-404-6609 se registra como +5214774046609.
  // Sin embargo, líneas fijas no llevan ese "1" (+52XXXXXXXXXX, 12 dígitos).
  //
  // Regla práctica para México en WhatsApp:
  //   10 dígitos (ej. 4774046609)   → celular → +521 + 10d = +5214774046609  (13 d)
  //   12 dígitos empezando con 521  → ya normalizado con "1" → se deja tal cual
  //   12 dígitos empezando con 52   → ya tiene código país, puede ser fijo → se deja
  //   13 dígitos empezando con 521  → ya completo con "1" → se deja
  //
  // Casos de entrada soportados:
  //   4774046609        → +5214774046609  (10d nacional)
  //   524774046609      → +5214774046609  (12d sin "1" → se agrega)
  //   5214774046609     → +5214774046609  (13d ya correcto)
  //   +52 1 477 404 6609 → +5214774046609
  let digits = String(phone).replace(/\D/g, "");
  digits = digits.replace(/^0+/, ""); // quita ceros iniciales (00 internacional o 0 troncal)

  if (digits.length === 10) {
    // Número nacional de celular → agrega código país + dígito "1"
    digits = "521" + digits;
  } else if (digits.length === 12 && digits.startsWith("52")) {
    // Tiene código de país pero le falta el "1" de celular → lo agrega
    digits = "521" + digits.slice(2);
  }
  // Si ya tiene 13 dígitos empezando con 521, o es fijo (12d con 52), se deja intacto

  if (!/^52\d{10,11}$/.test(digits)) {
    console.error(`Invalid MX phone after normalize: ${digits}`);
    return res.status(400).json({ ok: false, error: "INVALID_PHONE" });
  }

  const toNumber = `whatsapp:+${digits}`;

  // Construir resumen del diagnóstico
  const criticalTires = diagnosis.filter(
    (t) => t.health < 40 || (t.alerts || []).some((a) => a.risk === "Alto")
  );

  const worstTire = [...diagnosis].sort((a, b) => a.health - b.health)[0];
  const overallHealth = Math.round(
    diagnosis.reduce((acc, t) => acc + t.health, 0) / diagnosis.length
  );

  const tiresDetail = criticalTires
    .map((t) => `• ${t.position}: ${t.health}% de vida útil`)
    .join("\n");

  const message =
    `🚗 *Diagnóstico AVANTE de tus llantas*\n\n` +
    `Salud general: *${overallHealth}%*\n\n` +
    `⚠️ *Llantas en estado crítico:*\n${tiresDetail}\n\n` +
    `*${worstTire.position}* requiere atención inmediata: ${worstTire.health}% de vida útil restante.\n\n` +
    `📅 Agenda tu cambio ahora y maneja seguro.\n` +
    `👉 https://avante.com.mx/agendar\n\n` +
    `_AVANTE — Expertos en llantas_`;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("Twilio error:", twilioData);
      return res.status(502).json({
        ok: false,
        error: "TWILIO_ERROR",
        message: twilioData.message || "Error enviando WhatsApp",
      });
    }

    // Lead capturado (sin storage todavía): queda registrado en los logs de Vercel.
    console.log(
      `LEAD AVANTE | tel:+${digits} | email:${email || "-"} | salud:${overallHealth}% | SID:${twilioData.sid}`
    );
    return res.status(200).json({ ok: true, messageSid: twilioData.sid });
  } catch (err) {
    console.error("Alert endpoint error:", err);
    return res.status(500).json({ ok: false, error: "SEND_ERROR", message: err.message });
  }
}
