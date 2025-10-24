# Automatización: WhatsApp de primer aniversario

## Objetivo
Felicitamos a cada pareja en el primer aniversario de su boda y recordamos recursos relevantes (galería Momentos, beneficios Premium, etc.). La automatización debe poderse activar, pausar y configurar desde el panel de administración sin desplegar código.

## Arquitectura
- **Config global** (`admin/automation_first_anniversary` en Firestore):
  ```json
  {
    "enabled": true,
    "sendHourUtc": 9,
    "sendMinuteUtc": 15,
    "daysOffset": 0,
    "includePlanners": false,
    "defaultCountryCode": "+34",
    "template": "¡Feliz aniversario {{couple_names}}! Esperamos que la celebración haya sido inolvidable. Aquí tienes vuestro álbum: {{album_link}}",
    "updatedBy": "admin@lovenda.com",
    "updatedAt": "2025-10-24T08:31:00.000Z",
    "lastRun": {
      "attempted": "2025-10-24T09:02:00.000Z",
      "processed": 3,
      "sent": 2,
      "skipped": 1,
      "errors": 0
    }
  }
  ```
  - `daysOffset`: Permite enviar días antes/después del aniversario (0 = mismo día, -1 = día anterior).
  - `includePlanners`: añade al planner principal como destinatario CC.
  - `template`: admite placeholders `{{couple_names}}`, `{{wedding_name}}`, `{{wedding_date}}`, `{{album_link}}`, `{{year}}`.

- **Ejecución diaria**
  1. Job programado (Render cron o Cloud Scheduler) llama `POST /api/automation/anniversary/run`.
  2. Se cargan bodas activas cuya `weddingDate` ∈ `[targetStart, targetEnd]` (primer aniversario).
  3. Se agrupan datos de contacto:
     - `wedding.contactPhone`, `primaryContactPhone`, `eventProfile.contactPhone`.
     - Usuarios owner (`ownerIds[]`): `phoneNumber`, `profile.phone`, `profile.whatsapp`.
     - Planner principal si `includePlanners`.
  4. Se genera mensaje interpolando plantilla.
  5. Envío vía `whatsappService.sendWhatsAppText`.
  6. Registro en `automationLogs` (`type: anniversary_first_whatsapp`).

- **Panel Admin (`/admin/automations`)**
  - Tarjeta con estado (ON/OFF) y hora programada.
  - Formulario editable: plantilla, hora, país por defecto, incluir planner.
  - Botón “Probar ahora” (dry run, no envía) → muestra previsualización por boda encontrada.
  - Botón “Ejecutar ahora” forzado (envía realmente).
  - Historial compacto (`lastRun`).

## Manejo de errores
- Falta de teléfono → se registra como `skipped` con motivo `missing_phone`.
- `sendWhatsAppText` fallido → intenta una vez; si falla, log `errors += 1` con detalle de Twilio.
- Si la colección `weddings` no devuelve resultados (falta índice) se hace fallback a lectura limitada (`limit 500`) y filtrado en memoria.

## Seguridad y privacidad
- Solo admins autenticados pueden leer/editar configuración y disparar el job.
- Se respeta `marketingOptIn` (`data.preferences?.marketingOptIn === true`) para propietarios.
- No se guarda contenido completo del mensaje en logs, solo preview (<= 160 chars) y placeholders usados.

## Próximos pasos
- Multi-idioma: soportar plantillas por `locale`.
- Segmentaciones adicionales: aniversarios 2º y 5º.
- Métricas Prometheus (`automation_anniversary_sent_total`, `automation_anniversary_error_total`).
