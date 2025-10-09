# 11. Protocolo y Ceremonias (visión global)

> Estado: 2025-10-07  
> Implementado en producción. Ver subflujos 11A–11E para la especificación detallada.

El flujo 11 funciona como paraguas de todo lo relacionado con la ceremonia y los momentos especiales del día B. Para facilitar el mantenimiento, el alcance se divide en subflujos especializados:

- **[11A – Momentos Especiales de la Boda](./flujo-11a-momentos-especiales.md):** orquesta lecturas, música y rituales a lo largo del evento.  
- **[11B – Timeline Global del Día B](./flujo-11b-timeline-dia-b.md):** construye y monitoriza el cronograma minuto a minuto.  
- **[11C – Checklist de Última Hora](./flujo-11c-checklist-ultima-hora.md):** confirma, el día previo, que todo está listo antes de abrir puertas.  
- **[11D – Guía de Documentación Legal](./flujo-11d-guia-documentacion-legal.md):** ayuda a la pareja a reunir cada papel oficial.  
- **[11E – Ayuda a Lecturas y Votos](./flujo-11e-ayuda-textos-ceremonia.md):** acompaña a familiares y amigos a preparar discursos inolvidables.

## Arquitectura compartida

- **Navegación:** `Más → Protocolo`. El layout `src/pages/protocolo/ProtocoloLayout.jsx` expone pestañas para cada subflujo, más accesos independientes como “Documentos”.  
- **Persistencia (Firestore):**
  - `weddings/{id}/specialMoments/main`: bloques y momentos (subflujo 11A).  
  - `weddings/{id}/timing`: timeline maestro (11B).  
  - `weddings/{id}/ceremonyTimeline/main`: hitos concretos de la ceremonia (11B).  
  - `weddings/{id}/ceremonyChecklist/main`: pendientes críticos (11C).  
  - `weddings/{id}/documents` con `relatedCeremonyId`: archivos asociados (11C/11D).  
  - `weddings/{id}/ceremony/config`: datos generales, roles, tradiciones, contingencias (soporte común).  
- **Seeds demo:** `scripts/seedTestDataForPlanner.js` crea boda de ejemplo con configuración, timeline, checklist y tareas categoría `CEREMONIA`.

## Integraciones con otros flujos

- **Flujo 2 (Datos del evento):** provee fecha y localización inicial.  
- **Flujos 3 y 4 (Invitados y Seating):** consumen roles especiales y layout de ceremonia.  
- **Flujo 6 (Presupuesto):** enlaza pagos de celebrante y permisos.  
- **Flujo 9 (RSVP):** sincroniza confirmaciones con aforo de ceremonia.  
- **Flujos 14/15 (Checklist avanzada y Documentos):** amplían tareas y gestión documental del planner.  
- **Flujo 21 (Sitio público):** publica extractos del protocolo y horarios.

## Eventos y métricas transversales

- Eventos activos: `special_moment_added`, `special_moment_removed`, `special_moment_state_changed`, `ceremony_timeline_updated`, `ceremony_checklist_checked`, `ceremony_document_uploaded`, `ceremony_text_created`, `ceremony_text_finalized`, `ceremony_surprise_added`. Pendientes: `ceremony_configured`, `ceremony_document_guide_opened`.  
- Indicadores: % de momentos con música asignada, % checklist completada, desviación horaria acumulada, documentación legal completada, número de textos finalizados.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/ceremony-tabs-flow.cy.js`: verifica la navegación general del módulo de protocolo, conmutando entre los subflujos 11A–11E y confirmando que cada vista se renderiza con una boda simulada.

## Roadmap compartido

- Integración con registros civiles y APIs públicas para validar documentación automáticamente.  
- Generador de programas/QR a partir de momentos y timeline.  
- Alertas inteligentes en tiempo real (retrasos, clima adverso, tareas críticas).  
- Dashboard operativo para planners el día del evento.

> Consulta los enlaces 11A–11E para reglas de negocio, UX y pruebas específicas de cada módulo.
