# Bitácora — Escáner de Llantas AVANTE

Registro de decisiones, configuración y atención al cliente.
Última actualización: 4 de agosto de 2026.

---

## 1. Qué es el proyecto

App web (React + Vite + Tailwind, desplegada en Vercel) que:

1. Escanea 4 llantas con la cámara del celular.
2. Las analiza con IA (Google Gemini) y genera un diagnóstico.
3. Pide el correo del usuario para enviarle el resultado (captura de lead).
4. Recomienda llantas reales del catálogo VTEX de Avante.
5. Conecta al asesor humano por WhatsApp.

**Repositorio:** `Ricmonpa/avante-escanea-llantas-ia` (rama `main`)
**Producción actual:** https://avante.ia.potenttial.site
**Dominio destino:** `scanner.grupoavante.org` (pendiente de DNS)

---

## 2. Flujo del usuario

```
Landing → Escáner (4 fotos) → Cuestionario (ciudad + tipo de uso)
   → Diagnóstico IA → Gate de correo → Diagnóstico completo
   → Recomendaciones (catálogo VTEX) / WhatsApp asesor
```

---

## 3. Configuración (variables de entorno en Vercel)

| Variable | Uso |
|---|---|
| `GEMINI_API_KEY` | Análisis de fotos con IA |
| `SMTP_HOST` | `mailc75.carrierzone.com` |
| `SMTP_PORT` | `465` (SSL/TLS directo) |
| `SMTP_USER` | `atencionenlinea@avanteeste.com.mx` |
| `SMTP_PASS` | Contraseña del buzón |
| `MAIL_FROM` | `Avante <atencionenlinea@avanteeste.com.mx>` |
| `SHEETS_WEBHOOK_URL` | Webhook de Google Apps Script (leads) |

### Endpoints de prueba rápida
- `/api/test-gemini` → valida que la IA responda (sin escanear fotos).
- `/api/test-email?to=correo@ejemplo.com` → manda un correo de prueba.

---

## 4. Decisiones importantes

### 4.1 WhatsApp descartado, se usa correo
Inicialmente el diagnóstico se enviaba por WhatsApp (Twilio). **Avante lo descartó**
porque los mensajes iniciados por la empresa tienen costo por plantilla (Meta) y ya
cuentan con un omnicanal propio. Se sustituyó por **envío por correo** desde su buzón
oficial vía SMTP. El WhatsApp permanece solo como **enlace al asesor humano**
(las conversaciones que inicia el cliente no tienen costo).

### 4.2 Modelo de IA y costos
- El proyecto de Google es **nuevo** (el anterior fue suspendido por filtración de
  llave). Google **bloquea los modelos 2.x para proyectos nuevos** → devuelven 404
  "no longer available to new users".
- El código **consulta dinámicamente** los modelos disponibles y elige el
  `flash-lite` más económico vigente (hoy `gemini-3.5-flash-lite`).
- Avante optó por **nivel gratuito** (proyecto sin facturación).
  Límites actuales: **15 solicitudes/min**, **250K tokens/min**, **500 escaneos/día**.
  Un escaneo de 4 llantas consume ~4,600 tokens.

### 4.3 Simplificación del cuestionario
A petición de Avante se eliminaron kilometraje, marca/modelo del vehículo y medida
de llanta para reducir fricción. Quedaron: **ciudad/estado**, **tipo de uso** y
**consentimiento**. El análisis de IA no depende de esos campos; la medida se
captura después, en la pantalla de Recomendaciones.

### 4.4 Leads
Cada diagnóstico enviado registra el lead en:
- **Logs de Vercel** (línea `LEAD AVANTE | email | salud | msgId`).
- **Google Sheets** vía Apps Script (best-effort: si falla, no interrumpe el flujo).

---

## 5. Historial de incidentes

| Fecha | Incidente | Causa | Solución |
|---|---|---|---|
| — | Llave de Gemini suspendida | Proyecto de Google suspendido: la llave se filtró públicamente y un tercero la usó ("actividad de pirateo"). El repo **no** fue la fuente de la fuga; la llave estaba sin restricciones. | Llave nueva en proyecto nuevo. Recomendación: restringir la llave a *Generative Language API*. |
| — | Vercel no desplegaba | La conexión Vercel↔GitHub dejó de disparar builds; los "Redeploy" reconstruían un commit viejo. | Se reconectó el Git en Vercel. |
| — | Diagnóstico 500 (`AI_ERROR`) | Modelos 1.5/2.0 descontinuados por Google. | Selector dinámico de modelo. |
| — | Diagnóstico 500 tras optimizar costo | Se forzó `gemini-2.5-flash-lite`, bloqueado para proyectos nuevos. Le falló a Gaby en su prueba. | Priorizar `flash-lite` **3.x**. |
| — | Correo no llegaba (formato MX) | Se armaba el número sin lada de país. | Obsoleto (WhatsApp descartado). |
| 4 ago | Porcentaje invisible en el resumen | El score usaba tonos claros (`text-yellow-300`) pensados para la tarjeta azul; sobre fondo blanco era ilegible y el apartado se veía vacío. | Paleta de contraste para fondo blanco (`healthScoreColorOnWhite`). |

---

## 6. Solicitudes de Avante atendidas

**Ronda 1**
- Colores de marca (azul `#003087`, rojo `#ba0c2f`) y logo.
- Eliminar botón y menú de "Flotillas"; banner informativo en el inicio.
- Banner explicativo de cómo fotografiar la banda de rodadura.
- Cámara a pantalla completa al capturar.
- Tipo de uso con las 6 opciones definidas por Avante; se eliminó "estilo de manejo".
- Manejo de errores claro en el diagnóstico, con reintento.

**Ronda 2**
- Recuadro de correo subido, visible de inmediato.
- Botón "Cotiza tus llantas con el tío Avante" (WhatsApp) en el gate.
- Botón principal más grande: "VER PRECIOS DE LLANTAS SEGÚN TU MEDIDA".
- Enlace "APROVECHA LAS PROMOS EN NUESTRA PÁGINA WEB" → grupoavante.org.
- Correo con botones de WhatsApp y tienda web.
- Footer solo con enlaces: Instagram, Facebook, TikTok, web, WhatsApp, términos.

**Ronda 3**
- Porcentaje de salud visible en el resumen, con encabezado dinámico según cuántas
  llantas requieren cambio.

---

## 7. Enlaces oficiales de Avante

- Instagram: https://www.instagram.com/avantellantasyrines
- Facebook: https://www.facebook.com/avantellantasyrines
- TikTok: https://www.tiktok.com/@avantellantasyrines
- Página web: https://www.grupoavante.org/
- WhatsApp: https://wa.me/528183963593 *(requiere la clave de país 52)*
- Términos: https://www.grupoavante.org/terminos-y-condiciones

---

## 8. Pendientes

| Pendiente | Responsable | Estado |
|---|---|---|
| Registro DNS del subdominio `scanner` | Equipo técnico de Avante (Cloudflare) | Solicitado el 4 ago. CNAME `scanner` → `a026957a401c8b21.vercel-dns-017.com`, proxy **DNS only**. En Vercel figura como *Invalid Configuration* hasta que se cree. |
| Verificar que los leads lleguen a Google Sheets | Ricardo | Webhook configurado; falta confirmar la primera fila. |
| Integración profunda con VTEX (App Key/Token) | Avante | Hoy se usa la API pública de catálogo; funciona para mostrar productos. |
| Logo oficial en alta y datos definitivos | Avante | Se usa el logo proporcionado. |

---

## 9. Notas de seguridad

- Las credenciales viven **solo** en variables de entorno de Vercel; nunca en el repo.
- La contraseña del buzón `atencionenlinea@` es la del correo real (no una app
  password). Conviene solicitar a sistemas una cuenta o clave dedicada al envío.
- Restringir la llave de Gemini a *Generative Language API* para evitar que, si se
  filtra, pueda usarse para otros servicios de Google.
