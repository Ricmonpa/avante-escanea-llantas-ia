# Configuración de WhatsApp (Twilio)

El escáner envía el diagnóstico de las llantas por WhatsApp usando **Twilio**.
El código ya está listo en `api/alert.js`; solo falta configurar las credenciales.

## Flujo completo

1. El usuario escanea sus 4 llantas y llena el cuestionario.
2. La IA genera el diagnóstico.
3. Antes de ver el detalle completo, se le pide su número de WhatsApp ("gate").
4. Al enviarlo, se dispara `/api/alert` → Twilio manda el diagnóstico por WhatsApp.
5. El usuario ve el diagnóstico completo en pantalla (se desbloquea aunque el envío falle).

El número se normaliza automáticamente al formato correcto para WhatsApp México:

| Entrada del usuario | Resultado enviado a Twilio | Notas |
|---|---|---|
| `4774046609` (10 d) | `+5214774046609` | Celular nacional → agrega `521` |
| `524774046609` (12 d) | `+5214774046609` | Tiene `52` pero sin `1` → se agrega |
| `5214774046609` (13 d) | `+5214774046609` | Ya correcto, sin cambio |

> ⚠️ **Por qué el `1`**: WhatsApp registra los celulares mexicanos con un dígito `1`
> entre el código de país `52` y el número de área. Sin ese `1` Twilio acepta el mensaje
> (devuelve SID y status 200) pero WhatsApp lo rechaza silenciosamente y no lo entrega.

---

## Variables de entorno (Vercel)

En **Vercel → Project → Settings → Environment Variables**, agrega:

| Variable | Ejemplo | De dónde sale |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxx...` | Twilio Console (Account Info) |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxx...` | Twilio Console (Account Info) |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Número de envío (ver abajo) |

Después de guardar, haz **Redeploy** para que tomen efecto.

---

## Opción A — Probar YA con el Sandbox (gratis, sin trámite)

Ideal para validar con tu celular antes de tener número propio.

1. Crea cuenta gratis en https://www.twilio.com
2. Ve a **Messaging → Try it out → Send a WhatsApp message**.
3. Twilio te da un número sandbox (normalmente `+1 415 523 8886`) y un código
   tipo `join algo-algo`.
4. **Desde el WhatsApp del celular con el que vas a probar** (tu Motorola),
   envía ese mensaje `join algo-algo` al número sandbox. Esto autoriza tu número
   por 72 horas.
5. Pon en Vercel:
   - `TWILIO_WHATSAPP_FROM = whatsapp:+14155238886`
   - `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` de tu cuenta.
6. Redeploy y prueba el escáner desde el celular. El diagnóstico debe llegarte
   por WhatsApp.

> ⚠️ Limitación del sandbox: **solo** llegan mensajes a números que hayan hecho
> `join`. Sirve para pruebas, NO para clientes reales.

---

## Opción B — Producción (número propio, para clientes reales)

Para que cualquier cliente reciba el mensaje sin hacer `join`:

1. En Twilio: **Messaging → Senders → WhatsApp senders → Create**.
2. Conecta un número (puede ser uno comprado en Twilio o el de la empresa) y
   verifica el **WhatsApp Business Profile** de AVANTE (logo, nombre, descripción).
3. Para mensajes que inicia la empresa (como este diagnóstico) WhatsApp exige
   **plantillas aprobadas** (Message Templates). Hay que registrar la plantilla
   del diagnóstico y esperar aprobación de Meta (suele ser rápido).
4. Cuando esté aprobado, cambia en Vercel:
   - `TWILIO_WHATSAPP_FROM = whatsapp:+52XXXXXXXXXX` (el número AVANTE).
5. Redeploy.

> Nota: si en producción das error `63016` o similar, casi siempre es por enviar
> texto libre fuera de plantilla. Ahí se ajusta el mensaje a la plantilla aprobada.

---

## Probar el endpoint sin la app (opcional)

```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "4774046609",
    "email": "prueba@avante.mx",
    "diagnosis": [
      {"position":"Delantera Izquierda","health":35,"alerts":[{"text":"Desgaste severo","risk":"Alto"}]},
      {"position":"Delantera Derecha","health":80,"alerts":[]},
      {"position":"Trasera Izquierda","health":75,"alerts":[]},
      {"position":"Trasera Derecha","health":60,"alerts":[]}
    ]
  }'
```

> El campo `phone` acepta 10 dígitos (celular nacional), el código agrega `+521` automáticamente.

Respuestas posibles:
- `{"ok":true,"messageSid":"..."}` → enviado correctamente.
- `{"ok":false,"error":"MISSING_TWILIO_CONFIG"}` → faltan variables en Vercel.
- `{"ok":false,"error":"INVALID_PHONE"}` → número mal formado.
- `{"ok":false,"error":"TWILIO_ERROR",...}` → revisa el `message` (sandbox sin join, plantilla, etc.).

---

## Leads

Mientras no haya base de datos, cada envío deja una línea en los **logs de Vercel**:

```
LEAD AVANTE | tel:+523312345678 | email:prueba@avante.mx | salud:62% | SID:SMxxxx
```

Así se pueden recuperar los contactos. Cuando quieras, montamos storage para
guardarlos automáticamente.
