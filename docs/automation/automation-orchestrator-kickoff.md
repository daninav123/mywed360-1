# Kickoff Automatizaciones IA - AutomationOrchestrator

**Fecha objetivo**: 20/10/2025  
**Duración estimada**: 60 minutos  
**Modo**: Reunión síncrona (videollamada) con acta compartida en este documento.

## Participantes propuestos
- **Frontend**: Lead frontend, responsable de `NotificationPreferences`, centro de notificaciones y UI de reglas.
- **Backend**: Tech lead backend, responsable de colas (`automationLogs`, `automationRules`) y workers.
- **Infra/DevOps**: Persona encargada de credenciales Mailgun/Twilio/FCM y despliegues escalonados.
- **Producto**: PM de experiencia IA para priorizar escenarios y métricas de éxito.
- **QA**: Responsable de suites E2E y escenarios de regresión multi-canal.

## Objetivos de la sesión
1. Alinear alcance del MVP del `AutomationOrchestrator` multicanal (email/chat/WhatsApp/SMS).
2. Definir dependencias técnicas y de credenciales para cada canal.
3. Asignar responsables por componente (backend, frontend, QA, documentación).
4. Establecer entregables inmediatos y fecha de revisión del plan.

## Agenda sugerida (60')
1. **5'** – Contexto y drivers de negocio (PM).
2. **15'** – Arquitectura propuesta del orquestador y colas (Backend).
3. **15'** – Requisitos de UI/UX: Automation Rules UI + nuevo centro de notificaciones (Frontend).
4. **10'** – Seguridad, permisos y gestión de credenciales (Infra).
5. **10'** – Plan de QA y telemetría (QA + Backend/Frontend).
6. **5'** – Próximos pasos, owners y checkpoints.

## Prework requerido
- Revisar la documentación vigente (`docs/flujos-especificos/flujo-16-asistente-virtual-ia.md`, `docs/flujos-especificos/flujo-12-notificaciones-configuracion.md`, `docs/TODO.md` secciones “Asistente virtual e IA” y “Notificaciones”).
- Inventariar credenciales actuales (Mailgun, Twilio, FCM, WhatsApp Business) y su estado.
- Identificar endpoints y servicios existentes que se verían afectados.

## Entregables post-reunión
- Acta con decisiones, responsables y fechas.
- Tickets creados/actualizados en backlog (epics e historias por iteración).
- Actualización de `docs/ROADMAP.md` y `docs/TODO.md` con hitos y métricas acordadas.
- Lista de riesgos + plan de mitigación inicial.

## Checklist de seguimiento
- [ ] Reunión calendarizada y enviada a participantes.
- [ ] Responsable asignado para acta y actualización de documentación.
- [ ] Tickets creados en herramienta de gestión (link pendiente).
- [ ] Próximo checkpoint definido (ej. revisión semanal).

