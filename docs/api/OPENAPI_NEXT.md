# OpenAPI — Próximos Endpoints a Documentar/Ampliar

Base actual: `docs/api/openapi.yaml` (health, RSVP by‑token, webhooks WhatsApp/Mailgun).

## 1) Proveedores (providers)

- GET `/api/providers` — listar por categoría/estado
- POST `/api/providers` — crear proveedor
- GET `/api/providers/{id}` — detalle
- PATCH `/api/providers/{id}` — actualizar
- DELETE `/api/providers/{id}` — archivar/eliminar
- GET `/api/providers/search` — búsqueda con IA (parámetros `q`, `location`, `budget`)

Esquemas sugeridos

- `Provider`, `ProviderCategory`, `ProviderService`, `SearchResult`

## 2) Contratos y Pagos

- GET `/api/contracts` | `/api/contracts/{id}`
- POST `/api/contracts` | PATCH `/api/contracts/{id}`
- POST `/api/contracts/{id}/send` — envío para firma
- GET `/api/payments` | POST `/api/payments/intent` — integración pasarela

Esquemas sugeridos

- `Contract`, `ContractTemplate`, `Payment`, `PaymentIntent`

## 3) Emails

- GET `/api/emails` — listar (folder)
- GET `/api/emails/{id}` — detalle
- POST `/api/emails/send` — envío
- POST `/api/emails/analyze` — análisis IA (backend) → `EmailAnalysis`

Esquemas sugeridos

- `Email`, `EmailFolder`, `EmailAnalysis`

## 4) Notificaciones

- GET `/api/notifications` — listar del usuario
- POST `/api/notifications` — crear
- PATCH `/api/notifications/{id}` — marcar leída/cambiar preferencia

Esquemas sugeridos

- `Notification`, `NotificationPreference`

## 5) WhatsApp — Health Provider

- GET `/api/whatsapp/provider-status` — estado proveedor (provider, configured, ok, message)

Esquema sugerido

- `WhatsAppHealth` { provider: string, configured: boolean, ok: boolean, message?: string }

## 6) Métricas de dominio

- GET `/api/admin/metrics/http` — agregado por ruta (protegido)
- GET `/api/admin/metrics/seating` — counters seating
- GET `/api/admin/metrics/rsvp` — counters rsvp

## Convenciones

- Seguridad: `bearerAuth` (Firebase); añadir `requireAdmin` donde aplique.
- Paginación: `limit`, `page`, `sort`, `order`.
- Errores: objetos `{ code, message, details? }` y `4xx/5xx` coherentes.
- Versionado: prefijo `v1` cuando estable.

## Tareas

- [ ] Acordar superficie mínima por módulo y publicar PR con YAML ampliado.
- [ ] Mapear componentes frontend (campo `x-frontend-mapping`).
- [ ] Añadir ejemplos de request/response.
