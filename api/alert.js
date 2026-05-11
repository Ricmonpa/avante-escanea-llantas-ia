export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { phone, diagnosis } = req.body || {};

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

  // Normalizar número: asegurar formato internacional con whatsapp: prefix
  const rawPhone = String(phone).replace(/\D/g, "");
  const toNumber = `whatsapp:+${rawPhone}`;

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

    console.log(`WhatsApp alert sent to ${toNumber}, SID: ${twilioData.sid}`);
    return res.status(200).json({ ok: true, messageSid: twilioData.sid });
  } catch (err) {
    console.error("Alert endpoint error:", err);
    return res.status(500).json({ ok: false, error: "SEND_ERROR", message: err.message });
  }
}
