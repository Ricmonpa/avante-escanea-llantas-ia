import nodemailer from "nodemailer";

// Envía el diagnóstico del escáner por correo desde el buzón oficial de Avante
// vía SMTP de Microsoft 365 (Outlook). Requiere estas variables de entorno en Vercel:
//   SMTP_HOST=smtp.office365.com
//   SMTP_PORT=587
//   SMTP_USER=atencionenlinea@avanteeste.com.mx
//   SMTP_PASS=<app password del buzón>
//   MAIL_FROM=Avante <atencionenlinea@avanteeste.com.mx>
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { email, diagnosis } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ ok: false, error: "INVALID_EMAIL" });
  }
  if (!diagnosis || !Array.isArray(diagnosis) || diagnosis.length === 0) {
    return res.status(400).json({ ok: false, error: "MISSING_DIAGNOSIS" });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP env vars");
    return res.status(500).json({ ok: false, error: "MISSING_SMTP_CONFIG" });
  }

  // ── Resumen del diagnóstico ─────────────────────────────────────────────────
  const overallHealth = Math.round(
    diagnosis.reduce((acc, t) => acc + (Number(t.health) || 0), 0) / diagnosis.length
  );
  const worstTire = [...diagnosis].sort((a, b) => a.health - b.health)[0];

  const rows = diagnosis
    .map((t) => {
      const alerts = (t.alerts || []).map((a) => `${a.risk}: ${a.text}`).join(" · ") || "Sin alertas";
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:600;color:#003087;">${t.position}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${t.health}%</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">${alerts}</td>
        </tr>`;
    })
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111;">
    <div style="background:#003087;color:#fff;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;font-size:22px;">Tu Diagnóstico AVANTE</h1>
      <p style="margin:8px 0 0;opacity:.85;">Salud general de tus llantas: <strong>${overallHealth}%</strong></p>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f7f8fa;">
            <th style="padding:10px 12px;text-align:left;">Llanta</th>
            <th style="padding:10px 12px;text-align:center;">Salud</th>
            <th style="padding:10px 12px;text-align:left;">Observaciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:20px 0 0;font-size:14px;">
        <strong>${worstTire.position}</strong> es la que más requiere atención (${worstTire.health}% de vida útil).
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#888;">
        *Estimación orientativa basada en IA. No sustituye una inspección técnica.
        Para una evaluación definitiva, agenda una revisión gratuita en tu sucursal AVANTE.
      </p>
    </div>
  </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false, // 587 usa STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: email,
      subject: `Tu diagnóstico AVANTE — salud general ${overallHealth}%`,
      html,
    });

    console.log(`LEAD AVANTE | email:${email} | salud:${overallHealth}% | msgId:${info.messageId}`);
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("send-diagnosis error:", err);
    return res.status(502).json({ ok: false, error: "SEND_ERROR", message: err.message });
  }
}
