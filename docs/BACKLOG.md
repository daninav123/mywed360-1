# Backlog Priorizado — MyWed360 (Q4)

Fuente: docs/roadmap-2025-v2.md, FLUJOS-INDICE.md, TESTING.md y guías relacionadas.

## Alta Prioridad (1–3 meses)

- [ ] Proveedores con IA: integrar pagos y contratos end‑to‑end.
- [ ] Timeline/Tareas: cronograma automático con IA + calendario + vínculo a proveedores.
- [ ] Emails con IA: análisis y extracción de datos, inserción en módulos.
- [ ] Diseño Web IA: generador via OpenAI API (backend) con prompts y preview.
- [ ] Contratos/Pagos: CRUD, pasarela de pago y seguimiento.
- [ ] i18n: traducir interfaz completa (es/en/fr) y validar llaves huérfanas.
- [ ] Notificaciones push reales: push + preferencias granulares.
- [ ] E2E estables: seating + email + budget en CI.

## Media Prioridad (3–6 meses)

- [ ] Invitaciones digitales: diseñador, envío masivo y RSVP.
- [ ] Asistente Virtual (flujo‑16): prototipo con prompts y guardrails.
- [ ] Gamificación (flujo‑17): eventos e hitos con puntos.
- [ ] Multi‑bodas: endurecer UX y permisos.

## Deuda Técnica / Plataforma

- [ ] Firestore Rules: consolidar duplicidad `match /users/{...}` y normalizar invitaciones como subcolección.
- [ ] WhatsApp provider: endpoint `/api/whatsapp/provider-status` con health real/fallback y healthcheck.
- [ ] CI/CD gates: lint + unit + seating smoke + `roadmapOrder --check` en PR; añadir E2E email/budget en develop.
- [ ] Performance: Lighthouse CI + budget de bundle < 2MB; error monitoring activo.
- [ ] Codificación: asegurar UTF‑8 en .md y eliminar mojibake.

## Testing

- [ ] Unit/Integration: hooks/servicios (`useSeatingPlan`, `useGuests`, `EmailService`, `SyncService`).
- [ ] Componentes críticos: Tasks/Timeline, RSVP views.
- [ ] E2E adicionales: email send/read/folders; budget flujo básico.

## Documentación

- [ ] OpenAPI: añadir proveedores, contratos/pagos, emails, notificaciones, whatsapp health.
- [ ] Sincronizar estados en `FLUJOS-INDICE.md` y completar #1 y #2.
- [ ] Añadir guías de uso y aceptación para nuevas features.

---

Notas de ejecución

- Asignar cada ítem a un Sprint según `docs/SPRINTS_PLAN.md`.
- Para issues en GitHub, usar plantillas de `.github/ISSUE_TEMPLATE/*`.
