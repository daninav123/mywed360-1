---
# WhatsApp Messaging – Envío desde móvil personal y número de la app (API)
---

## Resumen

Este módulo permite enviar invitaciones y recordatorios por WhatsApp desde Gestión de Invitados de dos formas:

- Modo Móvil personal (deeplink): abre WhatsApp del dispositivo con el mensaje preparado.
- Modo Número de la app (API): envía automáticamente usando proveedor WhatsApp Business (Twilio por defecto).

## UI / Flujo

- En `Gestión de Invitados`, acción “Invitar por WhatsApp” en cada fila abre un modal con dos pestañas.
- Pestaña “Móvil personal”: genera deeplink `https://wa.me/<E164>→text=...` (opción de abrir en WhatsApp Business).
- Pestaña “Número de la app”: envía vía backend (`POST /api/whatsapp/send`). Incluye botón masivo a pendientes.

## Endpoints Backend

- `POST /api/whatsapp/send` (autenticado): body `{ to, message, weddingId, guestId, templateId→, scheduleAt→, metadata→ }`
- `POST /api/whatsapp/webhook/twilio` (público): webhook para estados de Twilio (statusCallback) y también para mensajes entrantes ( – A message comes in – ).
- `GET /api/whatsapp/provider-status` (público): devuelve `{ success, configured, provider }`

Estados procesados (Twilio): `queued`, `sent`, `delivered`, `read`, `failed`, `undelivered`.

Persistencia:
- Log de mensajes en `mensajeria_log` (Firestore, Admin SDK) con clave `proveedor_message_id` (SID de Twilio) y tipo `inbound`/`outbound`.
- Sesiones conversacionales en `whatsapp_sessions/{phoneE164SinMas}` para orquestar el flujo RSVP (estado, último prompt, vínculos a `weddingId`/`guestId`).

### Flujo conversacional RSVP (sin enlaces)

1. El frontend envía el primer mensaje por API con `metadata.rsvpFlow=true`.
2. El backend crea/actualiza una sesión en `whatsapp_sessions` con estado `awaiting_accept`.
3. Cuando el invitado responde (Twilio → webhook), el backend interpreta:
   - Aceptación (`sí`, `1`, etc.) → actualiza invitado: `status=confirmed`/`status_rsvp=accepted` y pregunta acompañantes.
   - Rechazo (`no`, `2`, etc.) → `status=declined`/`status_rsvp=rejected` y cierra sesión.
   - Acompañantes → guarda `companions`/`companion` y pregunta alergias.
   - Alergias → guarda `allergens` y cierra con mensaje de resumen.

Nota: si el número escribe sin sesión previa, se responde con ayuda básica para iniciar el flujo.

## Variables de Entorno

En `.env` (se documentan en `.env.example`):

- WHATSAPP_PROVIDER=twilio
- TWILIO_ACCOUNT_SID=ACxxxxxxxx
- TWILIO_AUTH_TOKEN=xxxxxxxx
- TWILIO_WHATSAPP_FROM=+14155238886   # No anteponer whatsapp:
- WHATSAPP_STATUS_CALLBACK_URL=https://<tu-backend>/api/whatsapp/webhook/twilio (opcional; fallback a BACKEND_BASE_URL)
  - Configura en Twilio tanto el `Status Callback` (mensajes salientes) como el webhook de  – A message comes in –  (mensajes entrantes) apuntando a este endpoint.
- DEFAULT_COUNTRY_CODE=+34
- VITE_DEFAULT_COUNTRY_CODE=+34

Además, configurar `VITE_BACKEND_BASE_URL` para llamadas desde el frontend o usar el proxy de Vite (`/api`).

## Requisitos del Proveedor

- Número WhatsApp Business verificado y plantilla(s) aprobadas (para notificaciones HSM).
- Twilio: activar el sandbox o un número habilitado para WhatsApp, configurar status callback.

## Seguridad / RGPD

- El envío por API requiere autenticación (Bearer token Firebase / mock de dev). El webhook acepta `urlencoded`.
- Registro de consentimientos y opt-out es responsabilidad del flujo de datos de invitados (pendiente de integración UI).

## Uso en Frontend

- Servicio: `src/services/whatsappService.js`
- Modal: `src/components/whatsapp/WhatsAppModal.jsx`
- Integración en página: `src/pages/Invitados.jsx`
- Lógica de invitados y deeplinks: `src/hooks/useGuests.js`

## Roadmap

- Plantillas HSM con variables por idioma.
- Programación de envíos (queue externa / cron) y throttling.
- Checklist de avance para envíos manuales (deeplink) por lotes.
- Panel de métricas (entregado, leído, respuesta) por invitado/evento.
