# API ‚Äî Contratos y Endpoints

Este documento lista endpoints REST usados por el frontend y contratos esperados. Ajustar seg√∫n backend real.

Base URL backend: `VITE_BACKEND_BASE_URL` (Render)

## RSVP

GET `/api/rsvp/by-token/:token`
- Respuesta 200:
  - `{ id, name, status, companions, allergens, ... }`
- Errores:
  - 404 Invitado no encontrado

PUT `/api/rsvp/by-token/:token`
- Body JSON: `{ status: 'accepted'|'rejected', companions: number, allergens: string }`
- Respuestas: 200 OK, 400/500 error de validaci√≥n o servidor

## WhatsApp Provider

GET `/api/whatsapp/provider-status`
- 200 OK si el proveedor est√° disponible
- 404 si ruta no habilitada en entorno (observado en dev)

## Invitaciones de Colaboradores (App)

Funci√≥n `acceptInvitation(code, uid)` (Firebase/Firestore)
- Busca c√≥digo en subcolecciones `weddingInvitations` (collectionGroup)
- Actualiza acceso del usuario `uid` a la boda correspondiente
- Redirige a `/bodas/:weddingId`

## Otros (referenciados en flujos)

## GestiÛn de Invitados ó RSVP link

POST `/api/guests/:weddingId/id/:guestId/rsvp-link`
- Genera o regenera un enlace RSVP ˙nico para el invitado.
- Respuesta 200: `{ link }`

GET `/api/guests/:weddingId/id/:guestId/rsvp-link` (si existe en backend)
- Devuelve el enlace existente; fallback a POST en el cliente si no existe.

## Proveedores ó Presupuestos

POST `/api/weddings/:weddingId/suppliers/:supplierId/budget`
- Crea/actualiza presupuesto para proveedor.
- Body: `{ amount, notes, ... }` (ver implementaciÛn backend)

## Email y Bandeja de Entrada

Base: `/api/mail` y `/api/email*` (requiere `Authorization` cuando aplica)

- GET `/api/mail?folder=...&user=...`
- POST `/api/mail` (enviar)
- DELETE `/api/mail/:id`
- GET `/api/mail/:id`
- POST `/api/mail/:id/read`
- GET `/api/email-templates`
- POST `/api/email-templates`
- PUT `/api/email-templates/:templateId`
- GET `/api/email/:folder`
- GET `/api/email/all`
- POST `/api/email/:emailId/tag`
- DELETE `/api/email/:emailId/tag/:tagId`

## Notificaciones

- GET `/api/notifications`
- POST `/api/notifications`
- PATCH `/api/notifications/:id/read`
- DELETE `/api/notifications/:id`

## AI / B˙squeda / Recursos

- GET `/api/ai/search-suppliers?q=...`
- POST `/api/ai-suppliers`
- POST `/api/ai-image`
- POST `/api/ai-image/vector-pdf`
- GET `/api/ai/test`

## MÈtricas

- POST `/api/metrics/seating` ó registra eventos (assign/unassign, errores, etc.)

## Mailgun ó Salud y Webhooks

- POST `/api/mailgun/test`
- POST `/api/test/mailgun`
- POST `/api/mailgun/webhook`

- Generaci√≥n de PDF/print: v√≠a servicio externo (no definido aqu√≠)
- AI Assign (Seating): endpoint opcional `POST /api/ai-assign` (si est√° implementado)

## C√≥digos de Error (gu√≠a)
- 200: OK
- 400: Body inv√°lido
- 401/403: No autorizado / Prohibido
- 404: No encontrado o feature no disponible
- 500: Error interno (log + toast en cliente)

