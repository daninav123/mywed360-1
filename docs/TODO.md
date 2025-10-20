# TODO - Lovenda/MyWed360

> Lista unica de pendientes operativos. Usa `docs/ROADMAP.md` para la perspectiva estrategica y el detalle por flujo.

## En curso (Q4 2025)

### Seating plan
#### Diseno y UX
- [ ] Crear espacio Figma "Lovenda - Diseno / Plan de Asientos".
- [ ] Dibujar wireframes y prototipo clickable del wizard de exportacion.
- [ ] Dibujar wireframes y prototipo para vista movil/tablet (FAB radial, panel inferior).
- [ ] Adjuntar enlaces Figma en los tickets correspondientes.

#### Frontend y experiencia
- [x] Implementar wizard 3 pasos (formatos -> contenido -> configuracion) en UI inicial.
- [x] Anadir preview en miniatura y guardado de presets.
- [x] Conectar con Firestore `exports/{exportId}` y generar archivos (PDF/SVG/CSV).
- [x] Detectar viewport <=1024 px y activar modo compacto (`isMobile`).
- [x] Crear minimapa, lista de mesas con barras de capacidad y FAB radial (placeholder).
- [ ] Ajustar `GuestSidebar` movil (tabs Alertas/Recomendaciones/Staff).
- [ ] Implementar gestos (pinch, double tap, swipe) y accesos alternativos.

#### Capacidad, colaboracion y datos
- [x] Crear biblioteca de plantillas de venue (`VenueTemplates`) y overlays basicos.
- [x] Permitir tipos de mesa: redonda, cuadrada, imperial, coctel, auxiliar/staff.
- [x] Calcular capacidad sugerida segun dimensiones y bloquear sobrecupo.
- [x] Actualizar sidebar para editar ancho/alto/diametro y mostrar alertas.
- [x] Implementar locks optimistas `seatingLocks/{resourceId}` y presencia de usuarios.
- [ ] Mostrar badges "En edicion", toasts de conflicto y modo enfoque colaborativo.
- [ ] Registrar eventos de actividad (`lock_acquired`, `conflict_resolved`).
- [ ] Actualizar servicios para guardar `venueTemplateId`, `poiConfig`, `tableDefaults`, overlays y exportes.
- [ ] Crear triggers para refrescar `guestInsights` tras cambios RSVP/asignaciones.
- [ ] Actualizar metricas/analytics (`seating_export_generated`, `guest_sidebar_*`, `seating_mobile_mode_enabled`, `seating_collab_lock_acquired`).

#### GuestSidebar y gamificacion
- [x] Implementar `GuestSidebar` con secciones (Resumen, Recomendaciones, Conflictos, Staff, Historial).
- [ ] Integrar triggers de Tasks automaticas (completar seating, resolver conflictos, compartir plano).
- [ ] Registrar eventos de gamificacion (`layout_ceremony_ready`, `layout_banquet_ready`, `export_generated`, `conflicts_resolved`).

#### QA y despliegue
- [ ] Anadir unit tests para nuevas funciones (capacidad, bloqueo de mesas, locks colaboradores).
- [ ] Escribir E2E Cypress para cada escenario del flujo 4 (ceremony, banquet, overlays, movil, export, colaboracion, `GuestSidebar`).
- [ ] QA manual en tablet/iPad y navegadores principales.
- [ ] Checklist de lanzamiento (comunicacion, soporte, metricas).
- [ ] Integrar la suite Seating (flujo 13) en CI con reportes automatizados y escenarios edge ampliados.
- [ ] Despliegue staging -> produccion y monitorizacion de `guest_sidebar_*`, `seating_export_generated`, `seating_mobile_mode_enabled`, `seating_collab_lock_acquired`.

### Admin y seguridad
- [ ] Habilitar MFA obligatorio (TOTP) para cuentas admin.
- [ ] Implementar impersonacion segura de solo lectura con auditoria completa.
- [ ] Conectar SSO corporativo (SAML/OAuth Enterprise) para planners enterprise.
- [ ] Configurar alertas push/Slack en tiempo real y dashboard "Estado integraciones".
- [ ] Automatizar reportes semanales al comite directivo y KPI NPS planners.

### Multi-boda
- [ ] Desplegar worker CRM que procese `crmSyncQueue`, con reintentos y actualización de `crm.lastSyncStatus`.
- [ ] Instrumentar métricas de sincronización y panel en `MultiWeddingSummary` (sincronizadas vs en cola/error).
- [ ] Añadir suites E2E dedicadas para permisos por módulo y flujos de sincronización CRM.

### Invitados y RSVP
- [ ] Completar flujo integral con fixtures estables (alta manual, CSV, filtros, etiquetas, bulk).
- [ ] Sincronizar estadisticas RSVP `weddings/{id}/rsvp/stats` y panel resumen.
- [ ] Consolidar suites de E2E `guests_*.cy.js` con datos deterministas y comandos reutilizables.

### Gamificacion y dashboard
- [ ] Conectar `GamificationPanel` con milestones visibles en Home/Dashboard.
- [ ] Publicar overlay de historial y eventos en UI cuando `GamificationService` devuelva datos.
- [ ] Definir data-testids para widgets criticos del dashboard y completar assertions de navegacion.

### Protocolo y ceremonia
#### Flujo 11 - Protocolo global
- [ ] Integrar validaciones con registros civiles y APIs publicas para documentacion.
- [ ] Generar programas/QR a partir de momentos y timeline.
- [ ] Emitir alertas en tiempo real (retrasos, clima adverso, tareas criticas) conectadas con notificaciones.
- [ ] Construir dashboard operativo para planners el dia del evento.

#### Flujo 11A - Momentos especiales
- [ ] Anadir campos avanzados (responsables, requisitos tecnicos, suppliers, estado) en UI y persistencia.
- [ ] Implementar drag&drop con limites y validaciones de orden.
- [ ] Mostrar alertas guiadas por campos faltantes y mejorar el flujo de duplicar/mover con UI asistida.
- [ ] Permitir destinatarios vinculados a invitados/roles para integraciones (seating VIP, mensajeria).

#### Flujo 11B - Timeline dia B
- [ ] Migrar `timing` a la subcoleccion dedicada `weddings/{id}/timing`.
- [ ] Exponer edicion de estado de bloque (on-time/slightly-delayed/delayed) en la UI.
- [ ] Anadir drag&drop y validaciones de coherencia horaria con limites de hitos.
- [ ] Activar alertas automaticas segun retrasos detectados.

#### Flujo 11C - Checklist ultima hora
- [ ] Habilitar alertas sonoras/push para requisitos criticos.
- [ ] Sincronizar checklist con el centro de notificaciones y tracking de tareas.

#### Flujo 11D - Guia documentacion legal
- [ ] Ampliar catalogo internacional (tipos simbolica/destino y nuevos paises).
- [ ] Personalizar variaciones por combinacion tipo x pais con bloques, plazos y alertas contextuales.
- [ ] Guardar overrides por usuario (`legalSettings/{uid}`) y sincronizar progreso en Firestore.
- [ ] Instrumentar eventos (`ceremony_document_guide_opened`) y automatizar estados de checklist 11C.
- [ ] Mantener catalogo global (Firestore + snapshot docs) con versionado y dependencias.
- [ ] Anadir notas por requisito y soporte multiusuario en UI.

#### Flujo 11E - Ayuda textos ceremonia
- [ ] Crear tabs adicionales (votos, discursos) con experiencias segmentadas por rol/persona.
- [ ] Incorporar notas privadas, enlaces a momentos 11A, responsables y tags de inspiracion.
- [ ] Implementar control de versiones (historial, duplicado, favoritos, export PDF/proyeccion).
- [ ] Agregar validaciones (titulo requerido, duplicados, longitud minima) con mensajes claros.
- [ ] Integrar capacidades IA (reescritura, tono) y publicar contenidos hacia flujo 21.
- [ ] Fortalecer permisos backend con auditoria detallada de edicion/lectura.
- [ ] Mostrar metricas operativas (duracion total, ratio textos finalizados) y eventos para checklist 11C.
- [ ] Redactar E2E dedicados para roles ayudantes y miembros de la pareja.

### Asistente virtual e IA
- [ ] Calendarizar kickoff cross-funcional (ver `docs/automation/automation-orchestrator-kickoff.md`) y asignar responsables para acta/seguimiento.
- [ ] Desplegar backend multicanal con orquestador (`AutomationOrchestrator`) para email/chat/WhatsApp.
- [ ] Disenar reglas configurables (if/then) con panel de administracion y auditoria.
- [ ] Implementar workers dedicados y colas (`automationLogs`, `automationRules`) para acciones async.
- [ ] Cubrir el asistente con suite E2E especifica y eventos de telemetria.

### Descubrimiento personalizado (Flujo 2)
- [ ] Migrar wizard legacy al nuevo `DiscoveryWizard` con bloques condicionales documentados.
- [ ] Completar telemetría `discovery_*`, `recommendation_*`, `wedding_profile_updated`.
- [ ] Implementar recalculo en caliente de `weddingInsights` + cola de recomendaciones.
- [ ] Construir dashboard funnel (view → completed → recomendaciones aplicadas).
- [ ] Añadir suites Cypress del flujo completo (creación → confirmación → recomendaciones).
- [ ] Preparar seeds/fixtures de perfiles representativos y documentarlos en `docs/personalizacion/README.md`.

### Personalización continua (Flujo 2C)
- [ ] Prototipar mapa de preferencias + StyleMeter en Figma siguiendo `docs/diseno/personalizacion-continua.md`.
- [ ] Diseñar panel IA/c cards de ideas con micro-feedback y wizard “Algo distinto”.
- [ ] Mockear widget “Salud del perfil” y flows de alertas.
- [ ] Storyboard de conversaciones del asistente (packs sorpresa, revisiones).
- [ ] Validar seeds sembrados (`npm run seed:personalization`) y capturas QA.

### Momentos (album compartido)
- [ ] Endurecer moderación automática (clasificación Vision, umbrales configurables, override manual rápido).
- [ ] Publicar slideshow público controlado (token host, autoplay configurable, compatibilidad con `prefers-reduced-motion`).
- [ ] Completar gamificación (badges invitados, leaderboard planner) y mensajes de agradecimiento automáticos.
- [ ] Instrumentar métricas (`momentos_upload`, `momentos_moderated`, `momentos_slideshow_opened`) y dashboards de participación.
- [ ] Fortalecer gestión de tokens/QR (rotación, expiración, revoke) y auditoría de subidas para legal/compliance.

## Proximos focos (pre-planificacion)
- [ ] Marketplace de plantillas y assets premium para Seating/Diseno Web.
- [ ] Automatizaciones push/SMS para notificaciones operativas.
- [ ] Integraciones IA avanzadas (proveedores y diseno web) con validaciones de seguridad.
- [ ] Roadmap de Admin: actividad multi-boda, filtros por estado y sincronizacion con CRM externo.

## Referencias
- `docs/ROADMAP.md`: vision completa y estado por flujo.
- `docs/flujos-especificos/`: documentacion funcional detallada.
- `docs/diseno/`: prototipos y guias para UX/UI.
