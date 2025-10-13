# Roadmap - Lovenda/MyWed360

> Documento canonico que integra backlog, plan de sprints y estado por flujo. Actualiza esta fuente unica cuando haya cambios para evitar divergencias.

## Resumen ejecutivo
### Objetivos trimestrales
- Estabilizar el core operativo (Seating Plan, RSVP, reglas de negocio).
- Completar modulos prioritarios (Tasks/Checklist, Emails, Notificaciones) con calidad de produccion.
- Habilitar primeras capacidades de IA aplicadas a Diseno Web y Proveedores.

### KPIs y metas
- Retencion de planners +10%.
- Exportaciones listas para imprenta con <2% de incidencias rechazadas.
- NPS planners = 45.
- Cobertura E2E critica = 90% en CI.

### Estado actual por flujo
- Implementado/parcial: flujos 3, 5, 7, 9, 10, 11 (sub-secciones), 12 y 19.
- Pendiente/por definir: integraciones IA avanzadas, marketplace de plantillas, automatizaciones push/SMS completas.
- Ejecucion priorizada: ver docs/TODO.md (Seating plan, protocolo 11A-11E, asistente IA y modulo Momentos).

> El detalle historico que antes vivia en docs/roadmap-unificado.md y docs/ROADMAP_DIFF.md se consolido aqui para mantener una unica referencia.

## Detalle por flujo

## 0. Administración Global (estado 2025-10-08)

- **[archivo]** docs\flujos-especificos\flujo-0-administracion-global.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - documentación funcional cerrada; implementación técnica pendiente.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/admin/admin-flow.cy.js
- **[roadmap/pending (doc)]**
  - - MFA obligatorio (TOTP) para admin.
  - - Impersonación segura (solo lectura) con trail completo.
  - - SSO corporativo (SAML/OAuth Enterprise).
  - - Alertas push/Slack en tiempo real.
  - - Dashboard dedicado Estado integraciones.
  - - Reportes automáticos semanales al comité directivo.
  - - KPI NPS automatizado (encuestas periódicas planners).
- **[checklist despliegue]**
  - - Crear usuario admin único (`role: admin`, `claims.admin: true`) y habilitar MFA (si disponible) o restringir IP mediante Cloud Armor.
  - - Variables entorno necesarias: `VITE_ADMIN_ALLOWED_DOMAINS`, `ADMIN_METRICS_REFRESH_MS`, `ADMIN_SUPPORT_EMAIL`, `ADMIN_SUPPORT_PHONE`, `ADMIN_BROADCAST_DRYRUN_LIMIT`, `ADMIN_SESSION_TTL`, `ADMIN_SLACK_WEBHOOK`.
  - - Desplegar funciones cron `calculateAdminMetrics` (cada hora) y `syncExternalKPIs` (cada 5 min) antes de activar rutas protegidas.
  - - Crear índices Firestore (`adminMetrics` por `date` desc; `adminAlerts` por `status`+`createdAt`; `adminAuditLogs` por `resourceType`+`createdAt`; `adminBroadcasts` por `status`+`scheduledAt`; `featureFlags` por `domain`+`environment`).
  - - Configurar bucket `gs://lovenda-admin-snapshots` con retención 90 días y acceso restringido al servicio `admin-reporter`.
  - - Verificar API keys y scopes de integraciones (Mailgun, Twilio/WhatsApp, OpenAI, pasarela pagos, Zendesk/Intercom) y documentar responsables.
  - - Actualizar reglas Firestore (`allow read/write: if request.auth.token.admin == true`) y asegurar colecciones particionadas por mes.
  - - Documentar plan de rotación de claves, runbook de incidentes admin y procedimiento de escalado (N1 soporte, N2 SRE, N3 Dirección).
  - - Configurar notificaciones Slack/email en `notifyServiceOutage` antes de pasar a producción.

## 11. Protocolo y Ceremonias (visión global)

- **[archivo]** docs\flujos-especificos\flujo-11-protocolo-ceremonias.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - integracion con registros civiles, generador de programas/QR, alertas en tiempo real y dashboard operativo para el dia B.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/protocolo/ceremony-tabs-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Integración con registros civiles y APIs públicas para validar documentación automáticamente.  
  - - Generador de programas/QR a partir de momentos y timeline.  
  - - Alertas inteligentes en tiempo real (retrasos, clima adverso, tareas críticas).  
  - - Dashboard operativo para planners el día del evento.
  - > Consulta los enlaces 11A–11E para reglas de negocio, UX y pruebas específicas de cada módulo.

## 11A. Momentos Especiales de la Boda

- **[archivo]** docs\flujos-especificos\flujo-11a-momentos-especiales.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - campos avanzados (responsables, suppliers), drag&drop, alertas guiadas y destinatarios por momento.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Campos adicionales (responsables, requisitos técnicos, suppliers, estado) descritos originalmente.  
  - - Reordenamiento drag&drop y límite de 200 momentos.  
  - - Alertas por campos faltantes y duplicado/movimiento con UI guiada.  
  - - Destinatario opcional por momento (selector colapsable que permite asociar invitados/roles concretos para integraciones como seating VIP).
- **[checklist despliegue]**
  - - Verificar reglas Firestore de `specialMoments`.  
  - - Asegurar traducciones (labels de bloques y placeholders).  
  - - Mantener catálogo `MUSIC_INSPIRATION` actualizado y sin enlaces caídos.

## 11B. Timeline Global del Día B

- **[archivo]** docs\flujos-especificos\flujo-11b-timeline-dia-b.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - migrar la persistencia a subcoleccion propia, exponer estado editable, habilitar drag&drop y alertas automaticas.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Mover la persistencia de `timing` a una subcolección separada (`weddings/{id}/timing`).  
  - - Editar el estado del bloque (on-time/slightly-delayed/delayed) desde la UI.  
  - - Reordenamiento drag&drop, límites de 30 hitos y validaciones de coherencia horaria.  
  - - Alertas automáticas según retraso.
- **[checklist despliegue]**
  - - Asegurar reglas Firestore para `timing` y `ceremonyTimeline`.  
  - - Revisar traducciones de estados y mensajes en UI.  
  - - Validar que seeds carguen timeline demo (`scripts/seedTestDataForPlanner.js:266`).

## 11C. Checklist de Última Hora

- **[archivo]** docs\flujos-especificos\flujo-11c-checklist-ultima-hora.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - alertas sonoras/push para requisitos criticos y sincronizacion con el centro de notificaciones.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Alertas sonoras/notificaciones push para requisitos críticos.  
  - - Sincronización con centro de notificaciones.
- **[checklist despliegue]**
  - - Reglas Firestore para `ceremonyChecklist`.  
  - - Traducciones y etiquetas de categorías (ES/EN/FR).  
  - - Seeds actualizados (`scripts/seedTestDataForPlanner.js:352`) para mostrar ejemplo funcional.

## 11D. Guía de Documentación Legal

- **[archivo]** docs\flujos-especificos\flujo-11d-guia-documentacion-legal.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - ampliar el catalogo internacional, sincronizacion multiusuario y automatismos con la checklist legal.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Tipos adicionales (simbólica, destino) y más países.  
  - - Desplegar variaciones completas por país: para cada combinación `tipo de ceremonia × país` se definen bloques (preparación, obtención, legalización), responsables, plazos sugeridos y alertas contextuales (ej. apostillas). El layout reordena pestañas y copy según la jurisdicción seleccionada.
  - - Selector de país con memoria multiusuario: el país asignado automáticamente se almacena en `weddings/{id}/ceremony/legal.countryOrigin`, mientras que los overrides manuales se registran por usuario para evitar conflictos (`legalSettings/{uid}` con `preferredCountry` y timestamp).
  - - Sincronización multiusuario (guardar progreso en Firestore) y notas por requisito.  
  - - Instrumentación (`ceremony_document_guide_opened`) y automatismos en checklist (marcar estado).
  - - Catálogo global de requisitos mantenido en Firestore/Storage para cubrir certificados civiles, religiosos y especiales (ver sección de Datos y modelo).
- **[checklist despliegue]**
  - - Revisar contenidos por país y mantener enlaces actualizados.  
  - - Verificar traducciones y formato de fechas.  
  - - Confirmar que las plantillas existen en `docs/protocolo` y se exponen correctamente desde la UI.

## 11E. Ayuda a Lecturas y Votos

- **[archivo]** docs\flujos-especificos\flujo-11e-ayuda-textos-ceremonia.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - ampliar tabs dedicadas, control de versiones, integracion IA y cobertura E2E para usuarios ayudantes.
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/email/smart-composer.cy.js
  - [ok] cypress/e2e/email/ai-provider-email.cy.js
- **[roadmap/pending (doc)]**
  - - Tabs adicionales (votos, discursos) y plantillas específicas por tipo.  
  - - Tabs deben soportar experiencias segmentadas para cada miembro de la pareja (votos ella/él/elle) y para ayudantes.  
  - - Campos extra: notas privadas, enlace directo a momentos de 11A, responsables asignados y tags de inspiración.  
  - - Control de versiones con historial consultable, duplicado, favoritos y exportación (PDF/proyección).  
  - - Validaciones en cliente (título requerido, evitar duplicados, longitud mínima) con surfaced feedback y recuperación ante errores de red.  
  - - Integración IA (reescritura, tono) y publicación automática en flujo 21.  
  - - Validación de permisos en backend y auditoría detallada, incluyendo trazabilidad de quién vio o editó cada texto.  
  - - Métricas operativas en UI (duración total de ceremonia, ratio de textos finalizados) y eventos adicionales para checklist 11C.  
  - - Pruebas E2E dedicadas para usuarios ayudantes y miembros de la pareja cubriendo visibilidad, estados y vistas previas.
- **[checklist despliegue]**
  - - Verificar reglas Firestore para `ceremonyTexts`.  
  - - Revisar textos de muestra y traducciones.  
  - - Validar permisos según rol y auditoría (`updatedBy`).

## 14. Checklist Avanzado (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-14-checklist-avanzado.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Checklist.jsx`, `Tasks.jsx`, `TaskSidePanel.jsx`, `SmartChecklist.jsx`, hooks `useWeddingTasksHierarchy`, `useTaskTemplates`, servicios `automationService.js` (basico).
- **[pendiente (doc)]**
  - generacion inteligente de checklists, dependencias avanzadas, gamificacion completa y plantillas compartidas por comunidad.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificacion de archivos implementados]**
  - `Checklist.jsx` -> src\pages\Checklist.jsx, src\pages\protocolo\Checklist.jsx
  - `Tasks.jsx` -> src\pages\Tasks.jsx
  - `TaskSidePanel.jsx` -> src\components\tasks\TaskSidePanel.jsx
  - `SmartChecklist.jsx` -> (no encontrado)
  - `useWeddingTasksHierarchy` -> (no encontrado)
  - `useTaskTemplates` -> (no encontrado)
  - `automationService.js` -> backend\services\automationService.js
- **[roadmap/pending (doc)]**
  - - Motor de recomendaciones IA que genere checklist dinamico segun perfil de boda.
  - - Editor de plantillas colaborativas y marketplace de workflows.
  - - Dependencias visuales (gantt, grafo) y pronostico de riesgo.
  - - Gamificacion completa (streaks, objetivos semanales, recompensas).
  - - Sync bidireccional con calendarios externos (Google/Microsoft).
- **[checklist despliegue]**
  - - Reglas Firestore para `tasks`, `checklist`, `taskTemplates`, `taskAutomations`, `checklistStats`.
  - - Revisar limites de escritura masiva (batch) en seeds y automatizaciones.
  - - Configurar notificaciones (`MAILGUN_*`, `PUSH_PROVIDER`) para recordatorios.
  - - Actualizar traducciones y onboarding segun nuevas plantillas.

## 15. Contratos y Documentos (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-15-contratos-documentos.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `ContractTemplates.jsx`, `ContractEditor.jsx`, `DocumentManager.jsx`, `DigitalSignatureModal.jsx`, servicios `documentService.js`, `signatureService.js` (stub), OCR basico en backend.
- **[pendiente (doc)]**
  - firma digital integrada (DocuSign/HelloSign), workflows de aprobacion, analitica legal y compliance automatizado.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/contracts/contracts-flow.cy.js
- **[verificacion de archivos implementados]**
  - `ContractTemplates.jsx` -> (no encontrado)
  - `ContractEditor.jsx` -> (no encontrado)
  - `DocumentManager.jsx` -> (no encontrado)
  - `DigitalSignatureModal.jsx` -> (no encontrado)
  - `documentService.js` -> (no encontrado)
  - `signatureService.js` -> backend\services\signatureService.js
- **[roadmap/pending (doc)]**
  - - Integracion completa con proveedores de firma digital y verificacion de identidad.
  - - Analitica de clausulas (riesgos, montos, vencimientos) con IA.
  - - Workflows dinamicos segun tipo de contrato y jurisdiccion.
  - - Portal colaborativo para proveedores con comentarios y adjuntos.
  - - Archivado inteligente y retencion automatica segun politicas legales.
- **[checklist despliegue]**
  - - Reglas Firestore para `documents`, `documentWorkflows`, `documentTemplates`, `signatureLogs`.
  - - Configurar almacenamiento seguro (Cloud Storage) con buckets separados y KMS.
  - - Variables de firma (`DOCUSIGN_*`, `HELLOSIGN_*`) y webhooks configuradas antes de activar.
  - - Revisar plantillas por region y mantener repositorio de versiones legales.

## 17. Gamificacion y Progreso (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-17-gamificacion-progreso.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `GamificationPanel.jsx` en Home (`Dashboard.jsx`) se incrusta en la tarjeta existente de progreso para reutilizar la barra actual, y servicio `GamificationService` con endpoints `award`, `stats`, `achievements` (stub).
- **[pendiente (doc)]**
  - niveles, logros, retos semanales, recompensas y panel de analytics completo.
- **[verificacion de archivos implementados]**
  - `GamificationPanel.jsx` -> src\components\GamificationPanel.jsx
  - `Dashboard.jsx` -> src\pages\Dashboard.jsx, src\components\dashboard\Dashboard.jsx
  - `GamificationService` -> (no encontrado)
  - `award` -> (no encontrado)
  - `stats` -> (no encontrado)
  - `achievements` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Desafios cooperativos (pareja vs planners) y recompensas canjeables.
  - - Tienda de recompensas virtuales (plantillas, upgrades) ligada a puntos.
  - - Comparativas opcionales (leaderboards privados) con controles de privacidad.
  - - Analitica avanzada de engagement y segmentacion.
  - - Integracion con programa de referidos y planes premium.
- **[checklist despliegue]**
  - - Reglas Firestore para `gamification`, `achievements`, `gamificationEvents`.
  - - Configurar limites de escritura y deduplicacion en Cloud Functions.
  - - Revisar copy motivacional y traducciones.
  - - Preparar comunicacion a usuarios sobre nuevo sistema y opciones de privacidad.

## 18. Generador de Documentos Legales (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-18-generador-documentos-legales.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - formulario `DocumentosLegales.jsx` (consentimiento de uso de imagen) que genera un PDF local con jsPDF.
- **[pendiente (doc)]**
  - repositorio completo de plantillas, firma electrónica, almacenamiento backend y automatización IA.
- **[verificacion de archivos implementados]**
  - `DocumentosLegales.jsx` -> src\pages\DocumentosLegales.jsx, src\pages\protocolo\DocumentosLegales.jsx
- **[checklist despliegue]**
  - - Verificar compatibilidad jsPDF en navegadores soportados.
  - - Proveer plantillas actualizadas en cuanto haya repositorio legal.
  - - Revisar textos y traducciones.

## 19. Diseno de Invitaciones (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-19-diseno-invitaciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `InvitationDesigner.jsx`, `MisDisenos.jsx`, `VectorEditor.jsx`, `MenuCatering.jsx`, `PapelesNombres.jsx`, utils `pdfExport.js` y biblioteca de plantillas.
- **[pendiente (doc)]**
  - tutoriales guiados, colaboracion/feedback, integracion con proveedores de impresion y generacion IA.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/invitaciones_rsvp.cy.js
- **[verificacion de archivos implementados]**
  - `InvitationDesigner.jsx` -> src\pages\InvitationDesigner.jsx
  - `MisDisenos.jsx` -> src\pages\disenos\MisDisenos.jsx
  - `VectorEditor.jsx` -> src\pages\disenos\VectorEditor.jsx, src\components\VectorEditor.jsx
  - `MenuCatering.jsx` -> src\pages\disenos\MenuCatering.jsx
  - `PapelesNombres.jsx` -> src\pages\disenos\PapelesNombres.jsx
  - `pdfExport.js` -> src\utils\pdfExport.js
- **[roadmap/pending (doc)]**
  - - Editor colaborativo con comentarios y versionado.
  - - Generacion IA de propuestas a partir del perfil de la boda.
  - - Integracion con proveedores (impresion/envio) y tracking.
  - - Biblioteca de tutoriales y guias de estilo interactivas.
  - - Marketplace de plantillas premium.
- **[checklist despliegue]**
  - - Reglas Firestore para `designs`, `designActivity`, `designTemplates`, `designErrors`.
  - - Configurar limites de upload y validaciones en Cloud Storage.
  - - Revisar fuentes licenciadas y paquetes de iconos.
  - - Actualizar portada/template default por temporada.
  - - Preparar prototipo de la UI “Configuración de pieza” en Figma siguiendo `docs/diseno/flujo-19-panel-configuracion-figma.md` y dejar enlace para revisión.

## 2. Creación de Evento con IA (bodas y eventos afines) · estado 2025-10-08

- **[archivo]** docs\flujos-especificos\flujo-2-creacion-boda-ia.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAI.jsx` (wizard dos pasos), `src/pages/AyudaCeremonia.jsx` (copy dinámico), `src/pages/BodaDetalle.jsx` (perfil de evento), `src/context/WeddingContext.jsx`, servicios `createWedding` y `seedDefaultTasksForWedding`, catálogo `src/config/eventStyles.js`.
- **[pendiente (doc)]**
  - habilitar opt-in a planner desde Perfil, telemetría completa del funnel, refactor de rutas `/bodas`→`/eventos`, integración IA contextual y despliegue del flujo multi-evento para planners.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/onboarding/create-event-flow.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/CreateWeddingAI.jsx` -> src\pages\CreateWeddingAI.jsx
  - `src/pages/AyudaCeremonia.jsx` -> src\pages\AyudaCeremonia.jsx, src\pages\protocolo\AyudaCeremonia.jsx
  - `src/pages/BodaDetalle.jsx` -> src\pages\BodaDetalle.jsx
  - `src/context/WeddingContext.jsx` -> src\context\WeddingContext.jsx
  - `createWedding` -> (no encontrado)
  - `seedDefaultTasksForWedding` -> (no encontrado)
  - `src/config/eventStyles.js` -> src\config\eventStyles.js
- **[roadmap/pending (doc)]**
  - - Implementar opt-in a planner/assistant desde Perfil con flujo dedicado.
  - - Refactorizar rutas y componentes (`/bodas` → `/eventos`) cuando exista soporte multi-evento en toda la app.
  - - Instrumentar telemetría y dashboards de adopción segmentados por `eventType`.
  - - Integrar asistencia IA contextual con prompts específicos por tipo de evento y fallback offline.
  - - Habilitar CTA «Crear nuevo evento» tras validar multi-evento en producción.
  - - ✅ 2025-10-08: Wizard multi-evento, servicios y pantallas asociados actualizados para `eventType/eventProfile`.
  - - ✅ 2025-10-08: Catálogo de estilos centralizado y copy adaptable (`Boda`/`Evento`).
- **[checklist despliegue]**
  - - Reglas Firestore: permitir escritura de `eventType`, `eventProfile`, `eventProfileSummary` y nuevos campos en `_seed_meta`.
  - - Script `scripts/migrate-event-profile.js` para etiquetar eventos legacy con `eventType: 'boda'` y generar `eventProfileSummary` básico antes del switch.
  - - Revisión de copy/traducciones (`Crear boda`, `Crear evento`) y estilos centralizados (`config/eventStyles.js`).
  - - Telemetría: preparar dashboard funnel + ratio adopción Paso 2.
  - - QA: actualizar suites Cypress/E2E con los casos anteriores.

## 20. Buzon Interno y Estadisticas (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-20-email-inbox.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Buzon_fixed_complete.jsx` (legacy), `EmailInbox.jsx`, `EmailStatistics.jsx`, componentes `UnifiedInbox/InboxContainer.jsx`, `EmailComposer.jsx`, `EmailSetupForm.jsx`.
- **[pendiente (doc)]**
  - consolidar experiencia unica, documentar APIs backend, onboarding centralizado y telemetry completa.
- **[E2E specs]** 6/7 presentes
  - [ok] cypress/e2e/email_inbox_smoke.cy.js
  - [faltante] cypress/e2e/email/read-email.cy.js
  - [ok] cypress/e2e/email/send-email.cy.js
  - [ok] cypress/e2e/email/folders-management.cy.js
  - [ok] cypress/e2e/email/tags-filters.cy.js
  - [ok] cypress/e2e/compose_quick_replies.cy.js
  - [ok] cypress/e2e/email/smart-composer.cy.js
- **[verificacion de archivos implementados]**
  - `Buzon_fixed_complete.jsx` -> src\pages\Buzon_fixed_complete.jsx
  - `EmailInbox.jsx` -> src\pages\user\EmailInbox.jsx, src\components\email\EmailInbox.jsx
  - `EmailStatistics.jsx` -> src\pages\user\EmailStatistics.jsx
  - `UnifiedInbox/InboxContainer.jsx` -> src\components\email\UnifiedInbox\InboxContainer.jsx
  - `EmailComposer.jsx` -> src\components\email\EmailComposer.jsx
  - `EmailSetupForm.jsx` -> src\components\email\EmailSetupForm.jsx
- **[roadmap/pending (doc)]**
  - - Unificar experiencia (retirar `Buzon_fixed_complete` una vez completado).
  - - Automatizaciones (drip campaigns, journeys multicanal) y IA de respuesta.
  - - Estadisticas avanzadas con comparativas por segmento.
  - - Plantillas compartidas y biblioteca colaborativa.
  - - Integracion con WhatsApp/Push para comunicaciones omnicanal.
- **[checklist despliegue]**
  - - Reglas Firestore para `emails`, `emailSettings`, `emailTemplates`.
  - - Configurar webhooks en Mailgun/SMTP y credenciales seguras.
  - - Revisar limites y politicas anti-spam (DKIM, SPF, DMARC).
  - - Plan de migracion desde buzón legacy con backups.

## 21. Sitio Publico (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-21-sitio-publico.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `WeddingSite.jsx` (ruta `/w/:uid`), `PublicWedding.jsx`, articulos auxiliares (`SeatingPlanPost.jsx`, `MomentosEspeciales.jsx`), integracion con `websiteService` y contenido Firestore.
- **[pendiente (doc)]**
  - personalizacion avanzada desde panel, dominios personalizados, SEO/analytics y medicion de conversion.
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/inspiration/inspiration-flow.cy.js
  - [ok] cypress/e2e/inspiration_smoke.cy.js
  - [ok] cypress/e2e/news/news-flow.cy.js
- **[verificacion de archivos implementados]**
  - `WeddingSite.jsx` -> src\pages\WeddingSite.jsx
  - `/w/:uid` -> (no encontrado)
  - `PublicWedding.jsx` -> src\pages\PublicWedding.jsx
  - `SeatingPlanPost.jsx` -> src\pages\disenos\SeatingPlanPost.jsx
  - `MomentosEspeciales.jsx` -> src\pages\protocolo\MomentosEspeciales.jsx
  - `websiteService` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Editor dedicado en panel con vista previa y control de secciones.
  - - Dominios personalizados y configuracion automatica de SSL.
  - - Analytics en tiempo real y panel de conversion.
  - - Integracion con comentarios/libro de visitas.
  - - Experiencia para bodas multiples (selector en header publico).
- **[checklist despliegue]**
  - - Reglas Firestore para `publicSites`, `publicSiteAnalytics`.
  - - Configurar CDN/hosting estatico y invalidacion tras cada publicacion.
  - - Revisar cumplimiento legal (cookies, privacidad) y agregar banner si aplica.
  - - Preparar redireccion 404/410 para bodas archivadas.

## 22. Navegacion y Panel General (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-22-dashboard-navegacion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Home.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnostico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
- **[pendiente (doc)]**
  - unificar dashboard con metricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronizacion.
- **[verificacion de archivos implementados]**
  - `Home.jsx` -> src\pages\Home.jsx
  - `Dashboard.jsx` -> src\pages\Dashboard.jsx, src\components\dashboard\Dashboard.jsx
  - `More.jsx` -> src\pages\More.jsx
  - `Perfil.jsx` -> src\pages\Perfil.jsx
  - `WidgetContent.jsx` -> src\components\dashboard\WidgetContent.jsx
  - `DevEnsureFinance.jsx` -> src\pages\DevEnsureFinance.jsx
  - `DevSeedGuests.jsx` -> src\pages\DevSeedGuests.jsx
- **[roadmap/pending (doc)]**
  - - Dashboard modular con edicion drag-and-drop y biblioteca de widgets.
  - - Activity feed en tiempo real con filtros.
  - - Buscador global y comandos rapidos.
  - - Integracion con analytics para recomendaciones personalizadas.
  - - Panel de salud del sistema (sincronizacion, errores recientes).
- **[checklist despliegue]**
  - - Reglas Firestore para `dashboardConfig`, `activityFeed` (cuando se publique).
  - - Asegurar que herramientas dev esten desactivadas en produccion (`VITE_ENV` check).
  - - Revisar copy, links de soporte y recursos externos.
  - - Probar skeleton/loading states con datos grandes.

## 23. Métricas del Sistema (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-23-metricas-proyecto.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - dashboard unificado multi-módulo, workers de agregación (`metricAggregatorWorker`/`insightsBackfillTask`) y rutas `/analytics/*`.
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/performance/email-performance.cy.js
  - [ok] cypress/e2e/finance/finance-analytics.cy.js
- **[checklist despliegue]**
  - - Definir APIs reales (`/api/email-metrics`, `/api/project-metrics`) antes de exposición en UI.
  - - Proteger la ruta futura con permisos (owner/planner/admin).
  - - Validar visualizaciones con datos reales y asegurar privacidad.

## 24. Inspiracion Visual Unificada (estado 2025-10-12)

- **[archivo]** docs\flujos-especificos\flujo-24-galeria-inspiracion.md
- **[conclusion]** pendiente
- **[roadmap/pending (doc)]**
  - - Motor de recomendaciones con IA (clustering por preferencias, estacionalidad y etapa de boda).
  - - Colecciones tematicas automatizadas y moodboard descargable/PDF.
  - - Modo offline con cache en IndexedDB/service workers.
  - - Favoritos colaborativos entre miembros del equipo y notificaciones proactivas.
  - - Mejora de accesibilidad: focus trap completo, soporte de teclado en lightbox, announcements ARIA.
- **[checklist despliegue]**
  - - Verificar llaves/API keys para `wallService` y cuotas de peticiones.
  - - Ajustar reglas Firestore para `favorites` e `inspirationInteractions`.
  - - Migrar colecciones legacy (`ideasPhotos` en `users/{uid}`) al nuevo esquema `weddings/{id}/inspiration/favorites` asegurando que planners/assistants vean la misma lista.
  - - Asegurar headers de imagenes externas (`referrerPolicy`, `Cache-Control`).
  - - Revisar traducciones en `i18n/locales/*/common.json` para etiquetas dinamicas.
  - - Configurar dashboards de latencia/errores tanto del feed como del guardado de favoritos.

## 26. Blog de Tendencias (estado 2025-10-12)

- **[archivo]** docs\flujos-especificos\flujo-26-blog.md
- **[conclusion]** pendiente
- **[roadmap/pending (doc)]**
  - - Pagina dedicada con archivo historico y categorias filtrables.
  - - Favoritos o lectura posterior sincronizados con el usuario.
  - - Personalizacion segun ubicacion o etapa de la boda.
  - - Notificaciones cuando haya nuevas tendencias relevantes.
  - - Integracion con proveedores asociados para destacar articulos patrocinados (pendiente definir criterios).
- **[checklist despliegue]**
  - - Verificar disponibilidad del agregador RSS (`/api/wedding-news`) y claves NewsAPI (opcional).
  - - Configurar cuotas de traduccion (`translateText`) y monitorear tiempo de respuesta.
  - - Revisar copy/traducciones en `i18n` para el encabezado `Blog`.
  - - Validar politica de CORS/Referrer de imagenes externas para evitar bloqueos.

## 27. Momentos (Álbum Compartido) — estado 2025-10-13

- **[archivo]** docs\flujos-especificos\flujo-27-momentos.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - implementar el modulo completo (frontend, backend y storage), cerrar pipelines de moderacion automatica y lanzar la experiencia publica (QR, slideshow, descargas).
- **[roadmap/pending (doc)]**
  - 1. **MVP interno (Sprint 1-2)**:
  -    - Crear álbum único `momentos` por boda.
  -    - Flujo invitado con token + subida foto + moderación manual + aprobación.
  -    - Feed anfitrión básico + download simple (lista enlaces).
  - 2. **Release público (Sprint 3-4)**:
  -    - QR dinamico, slideshow, export ZIP, reacciones, analytics básicos.
  -    - Vision API para flag + email diarios.
  -    - Escenas configurables + selector en flujo invitado + filtros host.
  -    - Gamificación base (badges, leaderboard diario, mensajes de agradecimiento).
  - 3. **Optimización (Sprint 5+)**:
  -    - App nativa offline, subida video corto, stories automáticas.
  -    - Auto-highlights con heurística avanzada + experimentos IA ligera (detección emociones, nitidez).
  -    - Álbumes múltiples (Preboda, Postboda), integraciones fotógrafo.
  -    - Automatizaciones marketing (`compartir con invitados` + plantillas email).

## 28. Dashboard Wedding Planner (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-28-dashboard-planner.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `HomePage.jsx` (deriva a `PlannerDashboard.jsx` para planners), `PlannerDashboard.jsx`, `WeddingContext.jsx`, `useFirestoreCollection.js`, `useWeddingCollection.js`, navegación planner en `Nav.jsx`, portfolio multi-boda en `Bodas.jsx`.
- **[pendiente (doc)]**
  - poblar métricas de alertas/inspiración/blog, sincronizar recuentos con Firestore en tiempo real y reforzar UX cuando no exista boda activa.
- **[verificacion de archivos implementados]**
  - `HomePage.jsx` -> src\components\HomePage.jsx
  - `PlannerDashboard.jsx` -> src\components\PlannerDashboard.jsx
  - `PlannerDashboard.jsx` -> src\components\PlannerDashboard.jsx
  - `WeddingContext.jsx` -> src\context\WeddingContext.jsx
  - `useFirestoreCollection.js` -> src\hooks\useFirestoreCollection.js
  - `useWeddingCollection.js` -> src\hooks\useWeddingCollection.js
  - `Nav.jsx` -> src\components\Nav.jsx
  - `Bodas.jsx` -> src\pages\Bodas.jsx

## 29. Upgrade de Rol (Owner → Assistant → Planner) (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-29-upgrade-roles.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - selector de rol en registro (`src/components/auth/RegisterForm.jsx:56`), persistencia local del rol en `useAuth` (`src/hooks/useAuth.jsx:180`, `src/hooks/useAuth.jsx:593`), navegación y dashboard condicionados por rol (`src/components/Nav.jsx:29`, `src/components/HomePage.jsx:77`), vínculos de bodas por rol en `WeddingService` (`src/services/WeddingService.js:144`, `src/services/WeddingService.js:487`, `src/services/WeddingService.js:510`), invitaciones desde `WeddingAccountLink.jsx:59` y aceptación `WeddingAccountLink.jsx:79`.
- **[pendiente (doc)]**
  - flujo unificado de upgrade con checkout de plan, sincronización Firestore/localStorage del nuevo rol, límites de bodas por plan, degradación automática al expirar el plan y panel de gestión para revertir cambios.
- **[verificacion de archivos implementados]**
  - `src/components/auth/RegisterForm.jsx:56` -> (no encontrado)
  - `useAuth` -> (no encontrado)
  - `src/hooks/useAuth.jsx:180` -> (no encontrado)
  - `src/hooks/useAuth.jsx:593` -> (no encontrado)
  - `src/components/Nav.jsx:29` -> (no encontrado)
  - `src/components/HomePage.jsx:77` -> (no encontrado)
  - `WeddingService` -> (no encontrado)
  - `src/services/WeddingService.js:144` -> (no encontrado)
  - `src/services/WeddingService.js:487` -> (no encontrado)
  - `src/services/WeddingService.js:510` -> (no encontrado)
  - `WeddingAccountLink.jsx:59` -> (no encontrado)
  - `WeddingAccountLink.jsx:79` -> (no encontrado)

## 2B. Asistente Conversacional para Crear Bodas/Eventos · estado 2025-10-11

- **[archivo]** docs\flujos-especificos\flujo-2b-creacion-boda-asistente.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAssistant.jsx`, rutas `/crear-evento-asistente`, servicios `createWedding`, `seedDefaultTasksForWedding`, contexto `WeddingContext`, catálogos `config/eventStyles.js`.
- **[pendiente (doc)]**
  - telemetría dedicada, iterar prompts/UX, habilitar múltiples rondas IA y consolidar con flujo clásico.
- **[verificacion de archivos implementados]**
  - `src/pages/CreateWeddingAssistant.jsx` -> src\pages\CreateWeddingAssistant.jsx
  - `/crear-evento-asistente` -> (no encontrado)
  - `createWedding` -> (no encontrado)
  - `seedDefaultTasksForWedding` -> (no encontrado)
  - `WeddingContext` -> (no encontrado)
  - `config/eventStyles.js` -> src\config\eventStyles.js
- **[roadmap/pending (doc)]**
  - - Instrumentar eventos para comparar funnels (wizard vs. asistente).
  - - Añadir capa IA:
  -   - Sugiere estilos/notas basadas en respuestas anteriores o perfil del usuario.
  -   - Generar mensaje de agradecimiento/introducción automático listo para enviar a invitados.
  -   - Respuestas contextualizadas (ej. si fecha está cerca, ofrecer recomendaciones de próximos pasos).
  - - Documentar copy guía con propuesta de tono (cercano, propositivo, sin tecnicismos); coordinar con equipo de UX writing.
  - - Integrar CTA desde dashboard/onboarding y ofrecer elección entre modos.
  - - Soporte para múltiples rondas (editar una respuesta concreta sin reiniciar).
  - - Posible merge con flujo clásico si el asistente demuestra mejor conversión.
- **[checklist despliegue]**
  - - Rutas protegidas (`/crear-evento` y `/crear-evento-asistente`) deben convivir hasta decidir unificar.
  - - QA: añadir suites Cypress simulando conversación (incl. branch de errores).
  - - Revisar copy/traducciones de preguntas y botones (ES/EN en la próxima iteración).
  - - Telemetría pendiente (cuando se integre en analytics).

## 4. Invitados – Plan de Asientos (estado 2025-10-12)

- **[archivo]** docs\flujos-especificos\flujo-4-invitados-operativa.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - 
- **[roadmap/pending (doc)]**
  - - Panel lateral inteligente con recomendaciones autónomas y resolución de conflictos por IA.  
  - - Versionado colaborativo en tiempo real (multi-editor) con presencia visual.  
  - - Integración con proveedores/venues (ingesta automática de planos y configuraciones).  
  - - Exportaciones con presets guardados y envío directo a stakeholders.
  - - Reestructurar el PDF avanzado en secciones dedicadas (mapa de ceremonia, plano de banquete, lista global, invitados por mesa, dietas especiales, VIP de Momentos Especiales).
- **[checklist despliegue]**
  - - Reglas Firestore: colecciones `seating` y `seatingHistory` (roles y límites).  
  - - Seeds y límites (mesas, invitados) validados para rendimiento.  
  - - Validar compresión y consistencia de exportaciones.  
  - - Automatizar backups periódicos de `seating` para auditoría.

## 5. Proveedores con IA (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-5-proveedores-ia.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `GestionProveedores.jsx`, `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `SupplierKanban.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, `AI` modals (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
- **[pendiente (doc)]**
  - scoring inteligente consolidado, portal proveedor completamente funcional, automatización de RFQ multi-proveedor y reportes comparativos.
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/proveedores_flow.cy.js
  - [ok] cypress/e2e/proveedores_compare.cy.js
  - [ok] cypress/e2e/proveedores_smoke.cy.js
- **[verificacion de archivos implementados]**
  - `GestionProveedores.jsx` -> src\pages\GestionProveedores.jsx
  - `ProveedorList.jsx` -> src\components\proveedores\ProveedorList.jsx
  - `ProveedorCard.jsx` -> src\components\proveedores\ProveedorCard.jsx
  - `ProveedorDetail.jsx` -> src\components\proveedores\ProveedorDetail.jsx
  - `SupplierKanban.jsx` -> src\components\proveedores\SupplierKanban.jsx
  - `GroupAllocationModal.jsx` -> src\components\proveedores\GroupAllocationModal.jsx
  - `GroupCreateModal.jsx` -> src\components\proveedores\GroupCreateModal.jsx
  - `GroupSuggestions.jsx` -> src\components\proveedores\GroupSuggestions.jsx
  - `DuplicateDetectorModal.jsx` -> src\components\proveedores\DuplicateDetectorModal.jsx
  - `CompareSelectedModal.jsx` -> src\components\proveedores\CompareSelectedModal.jsx
  - `ProviderSearchDrawer.jsx` -> src\components\proveedores\ProviderSearchDrawer.jsx
  - `AI` -> (no encontrado)
  - `AIBusquedaModal.jsx` -> src\components\proveedores\AIBusquedaModal.jsx
  - `AISearchModal.jsx` -> src\components\proveedores\ai\AISearchModal.jsx
  - `AIEmailModal.jsx` -> src\components\proveedores\ai\AIEmailModal.jsx
  - `aiSuppliersService.js` -> src\services\aiSuppliersService.js
  - `supplierEventBridge` -> (no encontrado)
  - `EmailTrackingList.jsx` -> src\components\proveedores\tracking\EmailTrackingList.jsx
  - `ProviderEmailModal.jsx` -> src\components\proveedores\ProviderEmailModal.jsx
  - `RFQModal.jsx` -> src\components\proveedores\RFQModal.jsx
  - `ReservationModal.jsx` -> src\components\proveedores\ReservationModal.jsx
- **[roadmap/pending (doc)]**
  - - Scoring IA consolidado con métricas históricas por servicio.
  - - Portal proveedor completo con autenticación, feedback bidireccional y vista del estado por servicio contratado.
  - - Automatización multi-proveedor (RFQ masivo, recordatorios automáticos) extendida a líneas de servicio combinadas.
  - - Reportes comparativos y analítica de mercado (incluyendo cobertura de servicios pendientes).
  - - Integración con marketplaces externos y recomendaciones en sitio público.
- **[checklist despliegue]**
  - - Credenciales `OPENAI_*` / `VITE_OPENAI_*`, `MAILGUN_*`, `SUPPLIER_TRACKING_ENDPOINT` configuradas.
  - - Reglas Firestore para `suppliers`, subcolección `serviceLines`, `supplierGroups`, `supplierEmails`, `supplierShortlist`.
  - - Validar límites de documentos y seguridad para narrativas IA y almacenamiento de shortlist.
  - - QA del tablero y filtros (performance > 500 proveedores).

## 5b. Timeline y Tareas (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-5-timeline-tareas.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Tasks.jsx`, `TaskSidePanel.jsx`, `Checklist.jsx`, `SmartChecklist.jsx`, `TaskList.jsx`, `EventsCalendar.jsx`, `LongTermTasksGantt.jsx`, `CalendarSync.jsx`, `TaskEventBridge.jsx`, `TaskNotificationWatcher.jsx`, hook `useWeddingTasksHierarchy.js`, utilidades `taskAutomations`, `CalendarComponents.jsx`, plantilla `src/data/tasks/masterTimelineTemplate.json`, indicadores de riesgo en el Gantt y comentarios colaborativos con menciones y notificaciones en `TaskSidePanel.jsx`.
- **[pendiente (doc)]**
  - Motor IA que personaliza un plan de tareas padre/subtareas a partir de una plantilla maestra y matriz de responsabilidades.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificacion de archivos implementados]**
  - `Tasks.jsx` -> src\pages\Tasks.jsx
  - `TaskSidePanel.jsx` -> src\components\tasks\TaskSidePanel.jsx
  - `Checklist.jsx` -> src\pages\Checklist.jsx, src\pages\protocolo\Checklist.jsx
  - `SmartChecklist.jsx` -> (no encontrado)
  - `TaskList.jsx` -> src\components\tasks\TaskList.jsx
  - `EventsCalendar.jsx` -> src\components\tasks\EventsCalendar.jsx
  - `LongTermTasksGantt.jsx` -> src\components\tasks\LongTermTasksGantt.jsx
  - `CalendarSync.jsx` -> src\components\tasks\CalendarSync.jsx
  - `TaskEventBridge.jsx` -> src\components\tasks\TaskEventBridge.jsx
  - `TaskNotificationWatcher.jsx` -> src\components\tasks\TaskNotificationWatcher.jsx
  - `useWeddingTasksHierarchy.js` -> src\hooks\useWeddingTasksHierarchy.js
  - `taskAutomations` -> (no encontrado)
  - `CalendarComponents.jsx` -> src\components\tasks\CalendarComponents.jsx
  - `src/data/tasks/masterTimelineTemplate.json` -> src\data\tasks\masterTimelineTemplate.json
  - `TaskSidePanel.jsx` -> src\components\tasks\TaskSidePanel.jsx
- **[roadmap/pending (doc)]**
  - - IA que genere plan de tareas padre/subtareas personalizado: mantener una plantilla maestra (`src/data/tasks/masterTimelineTemplate.json`) con todas las tareas padre y subtareas posibles (curada manualmente y alimentada de forma orgánica cuando otras bodas añaden bloques útiles), ingestar datos de la boda (tipo, tamaño, presupuesto, estilo, lead time) y usar un motor híbrido plantillas versionadas + LLM para descartar/adaptar nodos irrelevantes, proponer dependencias, responsables sugeridos y ventanas temporales; entregar el resultado en modo borrador con explicación por bloque y capturar feedback para mejorar los prompts, pesos y la plantilla base.
  - - Matriz RACI y asignaciones múltiples con permisos.
  - - Auto-priorización según proximidad y criticidad.
  - - Panel de riesgos con predicción de retrasos.
  - - Gamificación completa (streaks, objetivos semanales, recompensas).
  - - Sync bidireccional con calendarios externos (Google/Microsoft).
- **[checklist despliegue]**
  - - Reglas Firestore actualizadas (`tasks`, `checklist`, `taskAutomations`).
  - - Tokens de calendario protegidos (Cloud Functions) y rotación periódica.
  - - Configurar servicios de notificación (`MAILGUN_*`, `PUSH_PROVIDER`).
  - - Validar performance con >500 tareas y modo Gantt.

## 7. Comunicaciones y Email (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-7-comunicacion-emails.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - cableado de búsqueda/ordenación secundario en `UnifiedInbox/EmailList.jsx`, sincronización de contadores/unread de carpetas personalizadas con backend, implementación real del `callClassificationAPI` y del procesador de envíos programados (`processScheduledEmails`), onboarding con validaciones DKIM/SPF, persistencia server-side de auto-respuestas y migración definitiva del buzón legacy + actualización de pruebas E2E/VTU a la nueva UI.
- **[E2E specs]** 7/8 presentes
  - [ok] cypress/e2e/email/send-email.cy.js
  - [faltante] cypress/e2e/email/read-email.cy.js
  - [ok] cypress/e2e/email/folders-management.cy.js
  - [ok] cypress/e2e/email/tags-filters.cy.js
  - [ok] cypress/e2e/email/smart-composer.cy.js
  - [ok] cypress/e2e/email/ai-provider-email.cy.js
  - [ok] cypress/e2e/compose_quick_replies.cy.js
  - [ok] cypress/e2e/email_inbox_smoke.cy.js
- **[roadmap/pending (doc)]**
  - 1. **Automatización y backend**
  -    - Implementar `callClassificationAPI` (o sustituirlo) y gestionar gracefully la ausencia del endpoint.
  -    - Mover la cola de envíos programados a backend + job recurrente; exponer estado/errores al usuario.
  -    - Persistir auto-respuestas y clasificación en Firestore/REST (no sólo localStorage).
  - 2. **UX / funcionalidad**
  -    - Completar integración de carpetas personalizadas (drag & drop, recuentos unread persistentes) y alinear etiquetas con la nueva UI.
  -    - Refinar papelera (`trash`): restaurar a la carpeta de origen, exponer métricas/retención y consolidar vaciado backend.
  -    - Resolver buscador/sort duplicado en `UnifiedInbox/EmailList.jsx` y alinear data-testids con Cypress.
  -    - Añadir toggle o ruta para acceder al buzón legacy sólo en modo soporte, o removerlo tras migración.
  -    - Completar experiencia de onboarding: validación DKIM/SPF, envío de correo de prueba, integración con `MailgunTester`.
  - 3. **Analítica y monitoreo**
  -    - Registrar eventos de entrega/aperturas reales (Mailgun webhooks) y mostrar alertas en `EmailInsights`/`EmailStats`.
  -    - Integrar métricas con dashboards oficiales (Grafana/BigQuery) y alertas para rebotes.
  - 4. **Integraciones cruzadas**
  -    - Sincronizar preferencias con módulo de notificaciones (Flujo 12) y con workflows IA globales (Flujo 16).
  -    - Implementar journeys multicanal (email + push + WhatsApp) y timeline conversacional centralizado.
  - 5. **Testing**
  -    - Actualizar suites Cypress/Vitest al nuevo inbox, añadir cobertura para comentarios, calendar, feedback y envíos programados.
  -    - Automatizar pruebas de alias / onboarding (`EmailSetup`) y Mailgun fallback.
  - Mantener esta lista viva antes de iniciar nuevas implementaciones en Flujo 7.
- **[checklist despliegue]**
  - - **Variables de entorno front/back:**
  -   - `VITE_BACKEND_BASE_URL` (si hay API Gateway), `VITE_ENABLE_EMAIL_ANALYZE` (`1` para permitir `/api/email-insights/analyze`), `VITE_ENABLE_DIRECT_OPENAI`, `VITE_OPENAI_API_KEY`, `VITE_OPENAI_PROJECT_ID` para funciones IA.
  -   - `VITE_MAILGUN_DOMAIN` y `VITE_FIREBASE_FUNCTIONS_URL` (`mailgunService` / `MailgunTester`).
  -   - `VITE_ENABLE_AI_SUPPLIERS` para búsqueda IA de proveedores.
  - - **Firestore/Cloud Functions:**
  -   - Colecciones: `emailUsernames`, `users`, `emailMetrics` (+ subcolección `daily`), `users/{uid}/mails` (si se usa fallback), `mails` (global).
  -   - Reglas de seguridad que permitan leer/escribir `emailUsernames`, `emailMetrics`, `users/{uid}/mails` y evitar filtraciones cross-user.
  -   - Función (cron) o job que invoque `processScheduledEmails(sendMail)` periódicamente en el backend para habilitar programaciones.
  -   - Webhooks Mailgun (inbound/outbound) si se habilita backend.
  - - **Frontend:** exponer data-testids alineados con Cypress, asegurar que `UnifiedInbox` reemplaza completamente al legacy y limpiar scripts/estilos duplicados antes de release.

## 8. Diseno Web y Personalizacion (estado 2025-10-08)

- **[archivo]** docs\flujos-especificos\flujo-8-diseno-web-personalizacion.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - mover la llamada a OpenAI al backend (evitar exponer `VITE_OPENAI_API_KEY`), corregir el guard de publicacion (`ProfileSummary`/`publishDisabled`), habilitar biblioteca de prompts editable, exponer configuracion de dominio personalizado y superficie de analitica consumible.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/web/diseno-web-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Editor de prompts avanzado (CRUD, versionado, biblioteca compartida por rol).  
  - - Refactor de generacion IA: mover a backend/`AIWebGenerator` con streaming seguro, quotas y manejo centralizado de errores.  
  - - Historial enriquecido: diffs, etiquetas, undo/redo y soporte de borradores previos a publicar.  
  - - Analitica integrada (dashboard, alertas) sobre `analytics/websiteEvents` + tracking de visitas publicas.  
  - - Dominio personalizado y SEO avanzado (metatags dinamicos, sitemap, OG images, fallback offline).  
  - - Colaboracion multirol (comentarios, sugerencias, aprobaciones con permisos granulares).
- **[checklist despliegue]**
  - - Definir `OPENAI_API_KEY`, `VITE_ENABLE_DIRECT_OPENAI`, `VITE_OPENAI_PROJECT_ID` y modelo antes de habilitar IA directa.  
  - - Configurar hosting/CDN para publicar `weddings/{id}/publicSite/site` y limpiar cache tras cada publish.  
  - - Revisar consentimiento de datos publicos y clausulas de privacidad.  
  - - Validar peso total del HTML + assets (< 2 MB recomendado).  
  - - Preparar rollbacks en caso de fallo del backend `/api/public/weddings/:id/publish`.

## 9. RSVP y Confirmaciones (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-9-rsvp-confirmaciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `RSVPConfirm.jsx`, `AcceptInvitation.jsx`, `RSVPDashboard.jsx`, hooks `useGuests`, servicios `rsvpService.js` y `emailAutomationService.js`.
- **[pendiente (doc)]**
  - confirmaciones grupales avanzadas, recordatorios automaticos multi-canal, analytics detallados y integracion directa con catering.
- **[E2E specs]** 5/5 presentes
  - [ok] cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_invalid_token.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_reminders.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_confirm.cy.js
  - [ok] cypress/e2e/invitaciones_rsvp.cy.js
- **[verificacion de archivos implementados]**
  - `RSVPConfirm.jsx` -> src\pages\RSVPConfirm.jsx
  - `AcceptInvitation.jsx` -> src\pages\AcceptInvitation.jsx
  - `RSVPDashboard.jsx` -> src\pages\RSVPDashboard.jsx
  - `useGuests` -> (no encontrado)
  - `rsvpService.js` -> src\services\rsvpService.js
  - `emailAutomationService.js` -> src\services\emailAutomationService.js
- **[roadmap/pending (doc)]**
  - - Confirmaciones grupales mas flexibles (familias, corporate) con panel dedicado.
  - - Recordatorios multi-canal automáticos y programacion inteligente por segmentos.
  - - Tablero de analytics con conversion por canal y motivos de declinacion.
  - - Integracion directa con proveedores de catering para menus y alergias.
  - - Automatizar mensajes de follow-up tras la boda (agradecimientos).
- **[checklist despliegue]**
  - - Reglas Firestore para colecciones `rsvp`, `rsvpLogs`, `invitations` con seguridad por rol.
  - - Configurar `MAILGUN_*`, `WHATSAPP_PROVIDER` (si aplica) y plantillas de email con enlaces tracking.
  - - Revisar copy y traducciones para formulario y estados.
  - - Validar expiraciones de token y reintentos en ambientes de staging.

## Flujo 13: E2E del Seating Plan

- **[archivo]** docs\flujos-especificos\flujo-13-seating-plan-e2e.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - integrar la suite en CI, ampliar escenarios edge y automatizar reportes de ejecucion.
- **[E2E specs]** 14/14 presentes
  - [ok] cypress/e2e/seating/seating_smoke.cy.js
  - [ok] cypress/e2e/seating/seating_assign_unassign.cy.js
  - [ok] cypress/e2e/seating/seating_capacity_limit.cy.js
  - [ok] cypress/e2e/seating/seating_no_overlap.cy.js
  - [ok] cypress/e2e/seating/seating_obstacles_no_overlap.cy.js
  - [ok] cypress/e2e/seating/seating_template_circular.cy.js
  - [ok] cypress/e2e/seating/seating_template_u_l_imperial.cy.js
  - [ok] cypress/e2e/seating/seating_ceremony.cy.js
  - [ok] cypress/e2e/seating/seating_fit.cy.js
  - [ok] cypress/e2e/seating/seating_aisle_min.cy.js
  - [ok] cypress/e2e/seating/seating_toasts.cy.js
  - [ok] cypress/e2e/seating/seating_auto_ai.cy.js
  - [ok] cypress/e2e/seating/seating_area_type.cy.js
  - [ok] cypress/e2e/seating/seating_delete_duplicate.cy.js
- **[roadmap/pending (doc)]**
  - - Integración en pipeline de CI y reporte automático
  - ### 3) seating_toasts.cy.js (Toasts)
  - Valida que:
  - - Guardar “Configurar Espacio” muestra toast “Dimensiones guardadas”.
  - - Ejecutar “Auto IA” muestra un toast de éxito o de error (ambos caminos válidos según disponibilidad del backend).
  - Los toasts se gestionan en `src/components/seating/SeatingPlanRefactored.jsx` con `react-toastify`.

## flujo-1-registro-autenticacion.md

- **[archivo]** docs\flujos-especificos\flujo-1-registro-autenticacion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Signup.jsx`, `Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, `useAuth.jsx`, `SessionManager.jsx`, `src/context/UserContext.jsx`, componentes `SocialLoginButtons.jsx`, `RegisterForm.jsx`, `PasswordStrengthMeter.jsx`.
- **[pendiente (doc)]**
  - instrumentación de métricas (signup/login/reset), refactor de formularios legacy fuera de uso y auditoría de accesibilidad final.
- **[E2E specs]** 5/5 presentes
  - [ok] cypress/e2e/auth/flow1-signup.cy.js
  - [ok] cypress/e2e/auth/flow1-social-login.cy.js
  - [ok] cypress/e2e/auth/flow1-password-reset.cy.js
  - [ok] cypress/e2e/auth/flow1-verify-email.cy.js
  - [ok] cypress/e2e/auth/auth-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Signup.jsx` -> src\pages\Signup.jsx
  - `Login.jsx` -> src\pages\Login.jsx
  - `ResetPassword.jsx` -> src\pages\ResetPassword.jsx
  - `VerifyEmail.jsx` -> src\pages\VerifyEmail.jsx
  - `useAuth.jsx` -> src\hooks\useAuth.jsx
  - `SessionManager.jsx` -> src\components\auth\SessionManager.jsx
  - `src/context/UserContext.jsx` -> src\contexts\UserContext.jsx, src\context\UserContext.jsx
  - `SocialLoginButtons.jsx` -> src\components\auth\SocialLoginButtons.jsx
  - `RegisterForm.jsx` -> src\components\auth\RegisterForm.jsx
  - `PasswordStrengthMeter.jsx` -> src\components\auth\PasswordStrengthMeter.jsx
- **[roadmap/pending (doc)]**
  - - Instrumentar m?tricas (`signup_submit`, `social_signup`, `login_failed`, etc.) y revisar dashboards.
  - - Completar auditor?a de accesibilidad y focus management en formularios y botones sociales.
  - - Retirar formularios legacy (`RegisterForm`/`SocialLogin` antiguos) y limpiar dependencias en rutas no utilizadas.
  - - ? 2025-10-08: `VerifyEmail`, `ResetPassword`, `CreateWeddingAI` y `GamificationPanel` usan el hook unificado (`useAuth`) y este expone `sendPasswordReset`.
  - - Homogeneizar manejo de errores Firebase ? UI (mapa centralizado en `authErrorMapper`).
- **[checklist despliegue]**
  - - Variables Firebase (`VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY`).
  - - Configurar correo transactional (Mailgun) para reset/verify.
  - - Alta de credenciales OAuth (Google, Facebook, etc.) en Firebase Console y `.env`.

## flujo-10-gestion-bodas-multiples.md

- **[archivo]** docs\flujos-especificos\flujo-10-gestion-bodas-multiples.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Bodas.jsx`, `BodaDetalle.jsx`, `WeddingSelector.jsx`, `WeddingFormModal.jsx`, `useWedding` context, seeding inicial (finanzas/tareas) al crear boda desde planner, componentes `MultiWeddingSummary.jsx` y `WeddingPortfolioTable.jsx`, y permisos granulares por boda.
- **[pendiente (doc)]**
  - dashboards multi-boda avanzados, permisos granulares por mÃ³dulo y vistas cruzadas consolidadas.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/weddings/multi-weddings-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Bodas.jsx` -> src\pages\Bodas.jsx
  - `BodaDetalle.jsx` -> src\pages\BodaDetalle.jsx
  - `WeddingSelector.jsx` -> src\components\WeddingSelector.jsx
  - `WeddingFormModal.jsx` -> src\components\WeddingFormModal.jsx
  - `useWedding` -> (no encontrado)
  - `MultiWeddingSummary.jsx` -> src\components\weddings\MultiWeddingSummary.jsx
  - `WeddingPortfolioTable.jsx` -> src\components\weddings\WeddingPortfolioTable.jsx
- **[roadmap/pending (doc)]**
  - - Dashboard multi-boda (resÃºmenes cruzados, comparativas).
  - - Permisos granulares por mÃ³dulo/colecciÃ³n.
  - - Filtro de bodas por estado/fecha/owner.
  - - SincronizaciÃ³n con planner CRM externo.
  - - Activity feed y alertas multi-boda.
- **[checklist despliegue]**
  - - Reglas Firestore para `weddings`, `users/{uid}` (permisos por rol).
  - - Seeds y Cloud Functions idempotentes para nuevas bodas.
  - - Validar UI con >10 bodas (scroll, selector).
  - - QA de traducciones y copy en wizard.

## flujo-12-notificaciones-configuracion.md

- **[archivo]** docs\flujos-especificos\flujo-12-notificaciones-configuracion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Notificaciones.jsx`, `NotificationPreferences.jsx`, `NotificationWatcher.jsx`, `NotificationCenter.jsx` (scaffold), servicios `notificationService.js`, `notificationPreferencesService.js`, rutas backend `/api/notification-preferences`.
- **[pendiente (doc)]**
  - automatizaciones avanzadas (AutomationRules UI), notificaciones push/SMS completas y centro de notificaciones final.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/notifications/preferences-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Notificaciones.jsx` -> src\pages\Notificaciones.jsx
  - `NotificationPreferences.jsx` -> src\pages\NotificationPreferences.jsx
  - `NotificationWatcher.jsx` -> src\components\notifications\NotificationWatcher.jsx
  - `NotificationCenter.jsx` -> src\components\NotificationCenter.jsx, src\components\notifications\NotificationCenter.jsx
  - `notificationService.js` -> src\services\notificationService.js, backend\services\notificationService.js
  - `notificationPreferencesService.js` -> src\services\notificationPreferencesService.js
  - `/api/notification-preferences` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Centro de notificaciones completo (agrupaciones, búsqueda).
  - - Automation rules UI (if-this-then-that).
  - - Integración multi-canal (SMS/push con configuración avanzada).
  - - Panel de auditoría y métricas ( CTR, canal favorito/efectividad ).
- **[checklist despliegue]**
  - - Reglas Firestore `notifications` y `notificationPreferences`.
  - - Configurar Mailgun/Twilio/FCM; validar push en navegadores.
  - - Revisar traducciones (todas las opciones en `NotificationSettings` y `NotificationPreferences`).

## flujo-16-asistente-virtual-ia.md

- **[archivo]** docs\flujos-especificos\flujo-16-asistente-virtual-ia.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - habilitar backend multicanal, reglas configurables, workers dedicados y cobertura E2E especifica.
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/email/ai-provider-email.cy.js
  - [ok] cypress/e2e/email/smart-composer.cy.js
- **[roadmap/pending (doc)]**
  - - **Orquestador multicanal** (`AutomationOrchestrator`): ingerir emails, chats, WhatsApp y decidir acciones.
  - - **Reglas configurables**: panel para if/then (ej. “si proveedor responde con presupuesto > X → crear tarea”).
  - - **Workers**: procesar colas (`automationLogs`, `automationRules`) sin depender del cliente.
  - - **Auditoría**: panel `/automation` con historiales, posibilidad de revertir acciones y métricas (ratio automatización, reversión, latencias).
  - - **Integración con flujos**: generación automática de tareas (flujo 14), actualizaciones de proveedores (flujo 5), avisos en notificaciones (flujo 12).
  - Cuando estas piezas estén listas, se documentarán de nuevo (ver antiguo flujo 24 como referencia de visión).
- **[checklist despliegue]**
  - - Clave `OPENAI_API_KEY` solo si el backend `/api/chat-widget` está habilitado.
  - - Revisar políticas de almacenamiento local (GDPR) y permitir al usuario limpiar historial.
  - - En entornos productivos, habilitar tracking de eventos antes de lanzar automatizaciones reales.

## flujo-3-gestion-invitados.md

- **[archivo]** docs\flujos-especificos\flujo-3-gestion-invitados.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes de invitados (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`.
- **[pendiente (doc)]**
  - dashboard analítico de RSVP, check-in en día del evento y sincronización automática con Seating Plan.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/guests/guests_flow.cy.js
- **[verificacion de archivos implementados]**
  - `Invitados.jsx` -> src\pages\Invitados.jsx
  - `RSVPDashboard.jsx` -> src\pages\RSVPDashboard.jsx
  - `AcceptInvitation.jsx` -> src\pages\AcceptInvitation.jsx
  - `GuestEventBridge.jsx` -> src\components\guests\GuestEventBridge.jsx
  - `GuestList` -> (no encontrado)
  - `GuestFilters` -> (no encontrado)
  - `GuestForm` -> (no encontrado)
  - `GuestBulkGrid` -> (no encontrado)
  - `ContactsImporter` -> (no encontrado)
  - `GroupManager` -> (no encontrado)
  - `WhatsAppModal` -> (no encontrado)
  - `WhatsAppSender` -> (no encontrado)
  - `SaveTheDateModal` -> (no encontrado)
  - `InviteTemplateModal` -> (no encontrado)
  - `useGuests` -> (no encontrado)
  - `SyncService` -> (no encontrado)
  - `MessageTemplateService` -> (no encontrado)
  - `whatsappService` -> (no encontrado)
  - `WhatsAppBatchService` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Dashboard avanzado (métricas, embudos RSVP, historial de comunicaciones).
  - - Check-in en el día del evento (lectura QR, actualización en tiempo real).
  - - Sincronización automática con Seating Plan y con el asistente IA (respuesta/acciones).
- **[checklist despliegue]**
  - - Configurar proveedor WhatsApp y variables (`VITE_BACKEND_BASE_URL`, `VITE_DEFAULT_COUNTRY_CODE`, credenciales).
  - - Reglas Firestore actualizadas (CRUD de `guests` y `rsvp`).
  - - Endpoints habilitados: `/api/whatsapp/send`, `/send-batch`, `/batch`, `/schedule`, `/api/whatsapp/provider-status`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`.
  - - Revisar traducciones/mensajes de toasts y compatibilidad con modo offline.

## flujo-6-presupuesto.md

- **[archivo]** docs\flujos-especificos\flujo-6-presupuesto.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
- **[pendiente (doc)]**
  - importaciÃ³n CSV/Excel con mapeo, analÃ­tica predictiva con IA, ampliaciÃ³n de aportaciones colaborativas, reportes exportables y automatizaciÃ³n de alertas avanzadas.
- **[E2E specs]** 7/7 presentes
  - [ok] cypress/e2e/finance/finance-flow.cy.js
  - [ok] cypress/e2e/finance/finance-flow-full.cy.js
  - [ok] cypress/e2e/finance/finance-budget.cy.js
  - [ok] cypress/e2e/finance/finance-transactions.cy.js
  - [ok] cypress/e2e/finance/finance-contributions.cy.js
  - [ok] cypress/e2e/finance/finance-analytics.cy.js
  - [ok] cypress/e2e/budget_flow.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/Finance.jsx` -> src\pages\Finance.jsx
  - `src/components/finance/BudgetManager.jsx` -> src\components\finance\BudgetManager.jsx
  - `FinanceOverview.jsx` -> src\components\finance\FinanceOverview.jsx
  - `FinanceCharts.jsx` -> src\components\finance\FinanceCharts.jsx
  - `PaymentSuggestions.jsx` -> src\components\finance\PaymentSuggestions.jsx
  - `TransactionManager.jsx` -> src\components\finance\TransactionManager.jsx
  - `useFinance` -> (no encontrado)
  - `useSupplierBudgets` -> (no encontrado)
  - `EmailInsightsService` -> (no encontrado)
  - `bankService` -> (no encontrado)
  - `SyncService` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Integracion Open Banking: UI de autenticaciÃ³n, refresco de tokens, categorizaciÃ³n inteligente, reconciliaciÃ³n automÃ¡tica.
  - - ImportaciÃ³n CSV/Excel con preview y mapeo de columnas (validaciones server-side).
  - - Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
  - - Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
  - - Prediccion de gasto y recomendaciones automaticas basadas en proyecciÃ³n.
  - - Automatizacion de pagos programados y conciliacion con contratos.
  - - Adjuntos en `TransactionForm` aceptan `image/*, application/pdf, .doc, .docx, .xls, .xlsx`. Otros tipos se bloquean en la carga de archivos.
  - - Entrenamiento y calibraciÃ³n continua del estimador de costos (dataset anonimizado, feedback con `overridden`/`dismissedAt`, segmentaciÃ³n regional) para mantener precisiÃ³n y reducir sesgos.
- **[checklist despliegue]**
  - - Reglas Firestore actualizadas para `finance/main`, subcolecciÃ³n `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
  - - Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
  - - Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
  - - Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
  - - Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

Generado automaticamente por scripts/aggregateRoadmap.js. Ejecuta el script cuando cambie la documentacion o los tests.
