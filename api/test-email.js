import nodemailer from "nodemailer";

// Endpoint de diagnóstico rápido para verificar la configuración SMTP.
// Uso: GET /api/test-email?to=tucorreo@ejemplo.com
// Manda un correo de prueba usando las variables SMTP_* de Vercel y reporta
// el resultado (o el error exacto del servidor) para depurar sin hacer el
// flujo completo de escaneo.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const to = req.query.to;
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
    return res.status(400).json({
      ok: false,
      error: "MISSING_TO",
      hint: "Agrega ?to=tucorreo@ejemplo.com a la URL",
    });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  // Reporta qué variables faltan (sin exponer valores).
  const missing = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    return res.status(500).json({ ok: false, error: "MISSING_SMTP_CONFIG", missing });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // 465 → SSL/TLS directo
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // Verifica credenciales/conexión antes de enviar (da error claro si falla el login).
    await transporter.verify();

    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to,
      subject: "Prueba de correo — Escáner AVANTE",
      text: "✅ Si recibes este correo, la configuración SMTP de Avante funciona correctamente.",
      html: "<p>✅ Si recibes este correo, la configuración SMTP de Avante funciona correctamente.</p>",
    });

    return res.status(200).json({
      ok: true,
      message: `Correo de prueba enviado a ${to}`,
      messageId: info.messageId,
      config: { host: SMTP_HOST, port: Number(SMTP_PORT), user: SMTP_USER },
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: "SMTP_ERROR",
      message: err.message,
      code: err.code,
      command: err.command,
      hint: "Revisa host/puerto/usuario/contraseña. Puerto 465 = SSL/TLS.",
    });
  }
}
