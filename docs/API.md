# API — Contratos y Endpoints

Este documento lista los endpoints REST usados por el frontend y los contratos esperados (ajustar según el backend real).

Base URL backend: `VITE_BACKEND_BASE_URL` (Render).

## RSVP

**GET** `/api/rsvp/by-token/:token`
- Respuesta 200: `{ id, name, status, companions, allergens, ... }`
- Errores: `404` (invitado no encontrado)

**PUT** `/api/rsvp/by-token/:token`
- Body JSON: `{ status: 'accepted'|'rejected', companions: number, allergens: string }`
- Respuestas: `200` OK, `400/500` error de validación o del servidor

## WhatsApp Provider

**GET** `/api/whatsapp/provider-status`
- `200` OK si el proveedor está disponible
- `404` si la ruta no está habilitada en el entorno (observado en dev)

## Invitaciones de Colaboradores (App)

Función `acceptInvitation(code, uid)` (Firebase/Firestore)
- Busca el código en la collectionGroup `weddingInvitations`
- Actualiza el acceso del usuario `uid` a la boda correspondiente
- Redirige a `/bodas/:weddingId`

## Enlaces RSVP (Invitados)

**POST** `/api/guests/:weddingId/id/:guestId/rsvp-link`
- Genera o regenera un enlace RSVP único para el invitado
- Respuesta 200: `{ link }`

**GET** `/api/guests/:weddingId/id/:guestId/rsvp-link`
- Devuelve el enlace existente (fallback del frontend: lanzar POST si falta)

## Proveedores — Presupuestos

**POST** `/api/weddings/:weddingId/suppliers/:supplierId/budget`
- Crea/actualiza presupuesto para proveedor
- Body: `{ amount, notes, ... }` (ver implementación backend)

## Email y Bandeja de Entrada

Base: `/api/mail` y `/api/email*` (requiere `Authorization` cuando aplica)
- `GET /api/mail?folder=...&user=...`
- `POST /api/mail`
- `DELETE /api/mail/:id`
- `GET /api/mail/:id`
- `POST /api/mail/:id/read`
- `GET /api/email-templates`
- `POST /api/email-templates`
- `PUT /api/email-templates/:templateId`
- `GET /api/email/:folder`
- `GET /api/email/all`
- `POST /api/email/:emailId/tag`
- `DELETE /api/email/:emailId/tag/:tagId`

## Notificaciones

- `GET /api/notifications`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`
- `DELETE /api/notifications/:id`

## IA / Búsqueda / Recursos

- `GET /api/ai/search-suppliers?q=...`
- `POST /api/ai-suppliers`
- `POST /api/ai-image`
- `POST /api/ai-image/vector-pdf`
- `GET /api/ai/test`

## Métricas

- `POST /api/metrics/seating` — registra eventos (assign/unassign, errores, etc.)

## Mailgun — Salud y Webhooks

- `POST /api/mailgun/test`
- `POST /api/test/mailgun`
- `POST /api/mailgun/webhook`

## Otros

- Generación de PDF/print: se delega en servicio externo (no definido aquí)
- AI Assign (Seating): endpoint opcional `POST /api/ai-assign`

## Códigos de Error (guía)
- `200`: OK
- `400`: Body inválido
- `401 / 403`: No autorizado / prohibido
- `404`: Recurso no encontrado o feature deshabilitada
- `500`: Error interno (log + toast en cliente)
