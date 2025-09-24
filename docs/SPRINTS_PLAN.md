# Plan de Sprints (8 semanas) — MyWed360

Objetivo: estabilizar el core (Seating/RSVP/Rules), completar piezas clave (Tasks/Email), e implementar primeras capacidades de IA (Diseño Web) y Contratos, con gates de calidad en CI.

## Definición de Done (DoD) transversal

- PR con descripción clara, checklist y links a documentación/diagramas.
- Lint y unit tests verdes (`npm run lint`, `npm run test:unit`).
- E2E aplicables verdes en local/CI.
- Docs actualizadas (README/roadmap/flujo afectado).
- Observabilidad: errores trazables y sin PII según `docs/SECURITY_PRIVACY.md`.

---

## Sprint 1 (Semanas 1–2) — Estabilización Core

- Objetivo: Core Seating/RSVP sólido + reglas y métrica base.

Entregables

- Seating Plan: smoke + flujos básicos verdes (assign/unassign, fit, capacity, aisle, templates mínimas).
- Firestore Rules: pruebas extendidas verdes; consolidación de `match /users/{...}` o plan de migración.
- RSVP by-token: GET/PUT funcional con validaciones (OpenAPI alineado).
- Métricas backend disponibles y consultables (GET /metrics y dashboards básicos importables).

Criterios de aceptación

- Cypress seating specs verdes: `seating_smoke`, `seating_fit`, `seating_toasts`, `seating_assign_unassign`, `seating_capacity_limit`, `seating_aisle_min`, `seating_template_*`.
- Unit tests reglas Firestore verdes (ver `src/__tests__/firestore.rules.extended.test.js`).
- `GET /api/rsvp/by-token/{token}` y `PUT /api/rsvp/by-token/{token}` operativos, con 200/400/404 documentados.
- Prometheus scrap-able y panel `http-overview.json` importado.

Comandos de verificación

```
set FIRESTORE_EMULATOR_HOST=localhost:8080
npm run test:unit -- src/__tests__/firestore.rules.extended.test.js
npm run cypress:run:seating
```

---

## Sprint 2 (Semanas 3–4) — Tasks/Notificaciones/Email

- Objetivo: operativizar Tareas/Checklist, CRUD de notificaciones y E2E básicos de Email.

Entregables

- Tasks/Checklist avanzado: dependencias, recordatorios, export ICS estable.
- Notificaciones: CRUD con auth y preferencias por usuario.
- Email: E2E enviar/leer/carpetas con plantillas base.

Criterios de aceptación

- E2E email verdes: `send-email`, `read-email`, `folders-management` (nomenclatura acordada).
- Hooks UI consolidados y sin warnings a11y básicos (inputs etiquetados y focus visible).
- Gates de CI: lint + unit + seating smoke + build.

Comandos de verificación

```
npm run e2e  # contra preview; usar CYPRESS_BASE_URL
npm run ci:check
```

---

## Sprint 3 (Semanas 5–6) — Diseño Web IA + Multi‑bodas

- Objetivo: pipeline básico de generación (prompts → preview), historial simple y navegación multi‑boda estable.

Entregables

- Generador IA mínimo: backend consume OpenAI; 4 prompts con variables dinámicas; preview funcional en dev.
- Multi‑bodas: UX final y `BodaDetalle` real desde Firestore (sin mocks).

Criterios de aceptación

- Endpoint backend para generación con control de coste y rate limit (ver `docs/SECURITY_PRIVACY.md`).
- Logs sin PII y trazabilidad por `X-Request-ID`.
- Docs: guía de prompts y ejemplo de flujo de trabajo.

---

## Sprint 4 (Semanas 7–8) — Contratos/Docs + Gamificación + IA Asistente (proto)

- Objetivo: CRUD de contratos/documentos con plantillas; eventos básicos de gamificación; chat IA mínimo contextual.

Entregables

- Contratos/Docs: templates y gestión documental; firma externa opcional (post‑MVP).
- Gamificación: puntos e hitos vinculados a eventos (Tasks/Timeline).
- IA Asistente: prototipo con prompts mínimos y guardrails.

Criterios de aceptación

- CRUD contratos operativos con estados (borrador, enviado, firmado) y seguimiento mínimo.
- Eventos de gamificación visibles y testeados.
- Chat IA funcional en entorno dev (feature flag) y con límites de uso.

---

Riesgos y mitigaciones

- Dependencias externas (OpenAI/Mailgun/Twilio): aislar tras un `apiClient` y añadir fallbacks.
- Fluctuaciones CI: estabilizar flakey E2E con retries y datos seed deterministas.
- Reglas Firestore: bloquear cambios intrusivos tras Sprint 1 y versionar reglas.
