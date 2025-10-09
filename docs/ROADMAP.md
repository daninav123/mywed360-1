# Roadmap Unificado

Documento generado automáticamente a partir de `docs/flujos-especificos/`.

> Estado: implementado/parcial/pendiente se infiere de lo declarado en cada flujo y de la existencia de evidencias (specs/archivos).

## 10. Gestión de Bodas Múltiples (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-10-gestion-bodas-multiples.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Bodas.jsx`, `BodaDetalle.jsx`, `WeddingSelector.jsx`, `WeddingFormModal.jsx`, `useWedding` context, seeding inicial (finanzas/tareas) al crear boda desde planner.
- **[pendiente (doc)]**
  - dashboards multi-boda avanzados, permisos granulares por módulo y vistas cruzadas consolidadas.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/weddings/multi-weddings-flow.cy.js
- **[verificación de archivos implementados]**
  - `Bodas.jsx` -> src\pages\Bodas.jsx
  - `BodaDetalle.jsx` -> src\pages\BodaDetalle.jsx
  - `WeddingSelector.jsx` -> src\components\WeddingSelector.jsx
  - `WeddingFormModal.jsx` -> src\components\WeddingFormModal.jsx
  - `useWedding` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Dashboard multi-boda (resúmenes cruzados, comparativas).
  - - Permisos granulares por módulo/colección.
  - - Filtro de bodas por estado/fecha/owner.
  - - Sincronización con planner CRM externo.
  - - Activity feed y alertas multi-boda.
- **[checklist despliegue]**
  - - Reglas Firestore para `weddings`, `users/{uid}` (permisos por rol).
  - - Seeds y Cloud Functions idempotentes para nuevas bodas.
  - - Validar UI con >10 bodas (scroll, selector).
  - - QA de traducciones y copy en wizard.

## 11. Protocolo y Ceremonias (visión global)

- **[archivo]** docs\flujos-especificos\flujo-11-protocolo-ceremonias.md
- **[conclusión]** desconocido
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/protocolo/ceremony-tabs-flow.cy.js

## 11A. Momentos Especiales de la Boda

- **[archivo]** docs\flujos-especificos\flujo-11a-momentos-especiales.md
- **[conclusión]** desconocido
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/protocolo/protocolo-flows.cy.js
- **[checklist despliegue]**
  - - Verificar reglas Firestore de `specialMoments`.  
  - - Asegurar traducciones (labels de bloques y placeholders).  
  - - Mantener catálogo `MUSIC_INSPIRATION` actualizado y sin enlaces caídos.

## 11B. Timeline Global del Día B

- **[archivo]** docs\flujos-especificos\flujo-11b-timeline-dia-b.md
- **[conclusión]** desconocido
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/protocolo/protocolo-flows.cy.js
- **[checklist despliegue]**
  - - Asegurar reglas Firestore para `timing` y `ceremonyTimeline`.  
  - - Revisar traducciones de estados y mensajes en UI.  
  - - Validar que seeds carguen timeline demo (`scripts/seedTestDataForPlanner.js:266`).

## 11C. Checklist de Última Hora

- **[archivo]** docs\flujos-especificos\flujo-11c-checklist-ultima-hora.md
- **[conclusión]** desconocido
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/protocolo/protocolo-flows.cy.js
- **[checklist despliegue]**
  - - Reglas Firestore para `ceremonyChecklist`.  
  - - Traducciones y etiquetas de categorías (ES/EN/FR).  
  - - Seeds actualizados (`scripts/seedTestDataForPlanner.js:352`) para mostrar ejemplo funcional.

## 11D. Guía de Documentación Legal

- **[archivo]** docs\flujos-especificos\flujo-11d-guia-documentacion-legal.md
- **[conclusión]** desconocido
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/protocolo/protocolo-flows.cy.js
- **[checklist despliegue]**
  - - Revisar contenidos por país y mantener enlaces actualizados.  
  - - Verificar traducciones y formato de fechas.  
  - - Confirmar que las plantillas existen en `docs/protocolo` y se exponen correctamente desde la UI.

## 11E. Ayuda a Lecturas y Votos

- **[archivo]** docs\flujos-especificos\flujo-11e-ayuda-textos-ceremonia.md
- **[conclusión]** desconocido
- **[E2E specs]** 2/2 presentes
  - ✅ cypress/e2e/email/smart-composer.cy.js
  - ✅ cypress/e2e/email/ai-provider-email.cy.js
- **[checklist despliegue]**
  - - Verificar reglas Firestore para `ceremonyTexts`.  
  - - Revisar textos de muestra y traducciones.  
  - - Validar permisos según rol y auditoría (`updatedBy`).

## 14. Checklist Avanzado (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-14-checklist-avanzado.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Checklist.jsx`, `Tasks.jsx`, `TaskSidePanel.jsx`, `SmartChecklist.jsx`, hooks `useWeddingTasksHierarchy`, `useTaskTemplates`, servicios `automationService.js` (basico).
- **[pendiente (doc)]**
  - generacion inteligente de checklists, dependencias avanzadas, gamificacion completa y plantillas compartidas por comunidad.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `ContractTemplates.jsx`, `ContractEditor.jsx`, `DocumentManager.jsx`, `DigitalSignatureModal.jsx`, servicios `documentService.js`, `signatureService.js` (stub), OCR basico en backend.
- **[pendiente (doc)]**
  - firma digital integrada (DocuSign/HelloSign), workflows de aprobacion, analitica legal y compliance automatizado.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/contracts/contracts-flow.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - tarjeta `GamificationPanel.jsx` en Home (`Dashboard.jsx`) y servicio `GamificationService` con endpoints `award`, `stats`, `achievements` (stub).
- **[pendiente (doc)]**
  - niveles, logros, retos semanales, recompensas y panel de analytics completo.
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - formulario `DocumentosLegales.jsx` (consentimiento de uso de imagen) que genera un PDF local con jsPDF.
- **[pendiente (doc)]**
  - repositorio completo de plantillas, firma electrónica, almacenamiento backend y automatización IA.
- **[verificación de archivos implementados]**
  - `DocumentosLegales.jsx` -> src\pages\DocumentosLegales.jsx, src\pages\protocolo\DocumentosLegales.jsx
- **[checklist despliegue]**
  - - Verificar compatibilidad jsPDF en navegadores soportados.
  - - Proveer plantillas actualizadas en cuanto haya repositorio legal.
  - - Revisar textos y traducciones.

## 19. Diseno de Invitaciones (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-19-diseno-invitaciones.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `InvitationDesigner.jsx`, `MisDisenos.jsx`, `VectorEditor.jsx`, `MenuCatering.jsx`, `PapelesNombres.jsx`, utils `pdfExport.js` y biblioteca de plantillas.
- **[pendiente (doc)]**
  - tutoriales guiados, colaboracion/feedback, integracion con proveedores de impresion y generacion IA.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/invitaciones_rsvp.cy.js
- **[verificación de archivos implementados]**
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

## 2. Creación de Evento con IA (bodas y eventos afines) · estado 2025-10-08

- **[archivo]** docs\flujos-especificos\flujo-2-creacion-boda-ia.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAI.jsx` (wizard dos pasos), `src/pages/AyudaCeremonia.jsx` (copy dinámico), `src/pages/BodaDetalle.jsx` (perfil de evento), `src/context/WeddingContext.jsx`, servicios `createWedding` y `seedDefaultTasksForWedding`, catálogo `src/config/eventStyles.js`.
- **[pendiente (doc)]**
  - habilitar opt-in a planner desde Perfil, telemetría completa del funnel, refactor de rutas `/bodas`→`/eventos`, integración IA contextual y despliegue del flujo multi-evento para planners.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/onboarding/create-event-flow.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Buzon_fixed_complete.jsx` (legacy), `EmailInbox.jsx`, `EmailStatistics.jsx`, componentes `UnifiedInbox/InboxContainer.jsx`, `EmailComposer.jsx`, `EmailSetupForm.jsx`.
- **[pendiente (doc)]**
  - consolidar experiencia unica, documentar APIs backend, onboarding centralizado y telemetry completa.
- **[E2E specs]** 7/7 presentes
  - ✅ cypress/e2e/email_inbox_smoke.cy.js
  - ✅ cypress/e2e/email/read-email.cy.js
  - ✅ cypress/e2e/email/send-email.cy.js
  - ✅ cypress/e2e/email/folders-management.cy.js
  - ✅ cypress/e2e/email/tags-filters.cy.js
  - ✅ cypress/e2e/compose_quick_replies.cy.js
  - ✅ cypress/e2e/email/smart-composer.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `WeddingSite.jsx` (ruta `/w/:uid`), `PublicWedding.jsx`, articulos auxiliares (`SeatingPlanPost.jsx`, `MomentosEspeciales.jsx`), integracion con `websiteService` y contenido Firestore.
- **[pendiente (doc)]**
  - personalizacion avanzada desde panel, dominios personalizados, SEO/analytics y medicion de conversion.
- **[E2E specs]** 3/3 presentes
  - ✅ cypress/e2e/inspiration/inspiration-flow.cy.js
  - ✅ cypress/e2e/inspiration_smoke.cy.js
  - ✅ cypress/e2e/news/news-flow.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Home.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnostico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
- **[pendiente (doc)]**
  - unificar dashboard con metricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronizacion.
- **[verificación de archivos implementados]**
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
- **[conclusión]** pendiente
- **[pendiente (doc)]**
  - dashboard unificado multi-módulo, workers de agregación (`metricAggregatorWorker`/`insightsBackfillTask`) y rutas `/analytics/*`.
- **[E2E specs]** 2/2 presentes
  - ✅ cypress/e2e/performance/email-performance.cy.js
  - ✅ cypress/e2e/finance/finance-analytics.cy.js
- **[checklist despliegue]**
  - - Definir APIs reales (`/api/email-metrics`, `/api/project-metrics`) antes de exposición en UI.
  - - Proteger la ruta futura con permisos (owner/planner/admin).
  - - Validar visualizaciones con datos reales y asegurar privacidad.

## 4. Invitados – Plan de Asientos y Biblioteca de Contenido (estado 2025-10-08)

- **[archivo]** docs\flujos-especificos\flujo-4-invitados-operativa.md
- **[conclusión]** pendiente
- **[pendiente (doc)]**
  - 
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/seating/seating-content-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Panel lateral inteligente con recomendaciones autónomas de seating (IA) y asistentes de conflictos.
  - - Automatización de contenidos (Ideas/Blog) con analítica avanzada y workflows colaborativos.
  - - Sincronización documental backend (almacenamiento seguro, versiones, firmas).
  - - Integración con proveedores/venues (ingesta automática de planos y configuraciones).
- **[checklist despliegue]**
  - - Reglas Firestore: `seating`, `ideas`, `blog` (roles y límites).
  - - Seeds y límites (mesas, invitados) validados para rendimiento.
  - - Clave API externa para inspiración (si se usa proveedor third-party).
  - - Validar compresión de exportaciones y legalidad de documentos.

## 5. Proveedores con IA (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-5-proveedores-ia.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `GestionProveedores.jsx`, `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `SupplierKanban.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, `AI` modals (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
- **[pendiente (doc)]**
  - scoring inteligente consolidado, portal proveedor completamente funcional, automatizacin de RFQ multi-proveedor y reportes comparativos.
- **[E2E specs]** 3/3 presentes
  - ✅ cypress/e2e/proveedores_flow.cy.js
  - ✅ cypress/e2e/proveedores_compare.cy.js
  - ✅ cypress/e2e/proveedores_smoke.cy.js
- **[verificación de archivos implementados]**
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
  - - Scoring IA consolidado con mtricas histricas por servicio.
  - - Portal proveedor completo con autenticacin, feedback bidireccional y vista del estado por servicio contratado.
  - - Automatizacin multi-proveedor (RFQ masivo, recordatorios automticos) extendida a lneas de servicio combinadas.
  - - Reportes comparativos y analtica de mercado (incluyendo cobertura de servicios pendientes).
  - - Integracin con marketplaces externos y recomendaciones en sitio pblico.
- **[checklist despliegue]**
  - - Credenciales `OPENAI_*` / `VITE_OPENAI_*`, `MAILGUN_*`, `SUPPLIER_TRACKING_ENDPOINT` configuradas.
  - - Reglas Firestore para `suppliers`, subcoleccin `serviceLines`, `supplierGroups`, `supplierEmails`, `supplierShortlist`.
  - - Validar lmites de documentos y seguridad para narrativas IA y almacenamiento de shortlist.
  - - QA del tablero y filtros (performance > 500 proveedores).

## 5b. Timeline y Tareas (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-5-timeline-tareas.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Tasks.jsx`, `TaskSidePanel.jsx`, `Checklist.jsx`, `SmartChecklist.jsx`, `TaskList.jsx`, `EventsCalendar.jsx`, `LongTermTasksGantt.jsx`, `CalendarSync.jsx`, `TaskEventBridge.jsx`, `TaskNotificationWatcher.jsx`, hook `useWeddingTasksHierarchy.js`, utilidades `taskAutomations`, `CalendarComponents.jsx`, plantilla `src/data/tasks/masterTimelineTemplate.json`.
- **[pendiente (doc)]**
  - Motor IA que personaliza un plan de tareas padre/subtareas a partir de una plantilla maestra y matriz de responsabilidades.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificación de archivos implementados]**
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
- **[roadmap/pending (doc)]**
  - - IA que genere plan de tareas padre/subtareas personalizado: mantener una plantilla maestra (`src/data/tasks/masterTimelineTemplate.json`) con todas las tareas padre y subtareas posibles (curada manualmente y alimentada de forma orgánica cuando otras bodas añaden bloques útiles), ingestar datos de la boda (tipo, tamaño, presupuesto, estilo, lead time) y usar un motor híbrido plantillas versionadas + LLM para descartar/adaptar nodos irrelevantes, proponer dependencias, responsables sugeridos y ventanas temporales; entregar el resultado en modo borrador con explicación por bloque y capturar feedback para mejorar los prompts, pesos y la plantilla base.
  - - Matriz RACI y asignaciones múltiples con permisos.
  - - Auto-priorización según proximidad y criticidad.
  - - Panel de riesgos con predicción de retrasos.
- **[checklist despliegue]**
  - - Reglas Firestore actualizadas (`tasks`, `checklist`, `taskAutomations`).
  - - Tokens de calendario protegidos (Cloud Functions) y rotación periódica.
  - - Configurar servicios de notificación (`MAILGUN_*`, `PUSH_PROVIDER`).
  - - Validar performance con >500 tareas y modo Gantt.

## 6. Gestion de Presupuesto (estado 2025-10-08)

- **[archivo]** docs\flujos-especificos\flujo-6-presupuesto.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
- **[pendiente (doc)]**
  - importación CSV/Excel con mapeo, analítica predictiva con IA, ampliación de aportaciones colaborativas, reportes exportables y automatización de alertas avanzadas.
- **[E2E specs]** 7/7 presentes
  - ✅ cypress/e2e/finance/finance-flow.cy.js
  - ✅ cypress/e2e/finance/finance-flow-full.cy.js
  - ✅ cypress/e2e/finance/finance-budget.cy.js
  - ✅ cypress/e2e/finance/finance-transactions.cy.js
  - ✅ cypress/e2e/finance/finance-contributions.cy.js
  - ✅ cypress/e2e/finance/finance-analytics.cy.js
  - ✅ cypress/e2e/budget_flow.cy.js
- **[verificación de archivos implementados]**
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
  - - Integracion Open Banking: UI de autenticación, refresco de tokens, categorización inteligente, reconciliación automática.
  - - Importación CSV/Excel con preview y mapeo de columnas (validaciones server-side).
  - - Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
  - - Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
  - - Prediccion de gasto y recomendaciones automaticas basadas en proyección.
  - - Automatizacion de pagos programados y conciliacion con contratos.
  - - Adjuntos en `TransactionForm` aceptan `image/*, application/pdf, .doc, .docx, .xls, .xlsx`. Otros tipos se bloquean en la carga de archivos.
- **[checklist despliegue]**
  - - Reglas Firestore actualizadas para `finance/main`, subcolección `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
  - - Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
  - - Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
  - - Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
  - - Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

## 7. Comunicaciones y Email (estado 2025-10-08)

- **[archivo]** docs\flujos-especificos\flujo-7-comunicacion-emails.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `components/email/UnifiedInbox/InboxContainer.jsx`, `components/email/UnifiedInbox/EmailDetail.jsx`, `components/email/UnifiedInbox/EmailList.jsx`, `components/email/EmailComposer.jsx`, `components/email/SmartEmailComposer.jsx`, `pages/EmailSetup.jsx`, `components/email/EmailSettings.jsx`, `pages/EmailTemplates.jsx`, `pages/user/EmailStatistics.jsx`, `components/email/EmailComments.jsx`, `components/email/EmailFeedbackCollector.jsx`, `components/email/CalendarIntegration.jsx`, `components/email/MailgunTester.jsx`, servicios `services/emailService.js`, `services/emailAutomationService.js`, `services/EmailRecommendationService.js`, `services/emailTemplatesService.js`, `services/tagService.js`, `services/folderService.js`, hooks `hooks/useEmailMonitoring.js`, `hooks/useEmailUsername.jsx`. El buzón legacy (`pages/Buzon_fixed_complete.jsx`) sigue en el repositorio pero ya no está ruteado.
- **[pendiente (doc)]**
  - cableado de búsqueda/ordenación en `UnifiedInbox/EmailList.jsx`, integración de carpetas/etiquetas personalizadas en la nueva bandeja, implementación real del `callClassificationAPI` y del procesador de envíos programados (`processScheduledEmails`), onboarding con validaciones DKIM/SPF reales, persistencia en backend de la configuración de auto-respuestas, y migración definitiva del buzón legacy + actualización de pruebas E2E/VTU a la nueva UI.
- **[E2E specs]** 8/8 presentes
  - ✅ cypress/e2e/email/send-email.cy.js
  - ✅ cypress/e2e/email/read-email.cy.js
  - ✅ cypress/e2e/email/folders-management.cy.js
  - ✅ cypress/e2e/email/tags-filters.cy.js
  - ✅ cypress/e2e/email/smart-composer.cy.js
  - ✅ cypress/e2e/email/ai-provider-email.cy.js
  - ✅ cypress/e2e/compose_quick_replies.cy.js
  - ✅ cypress/e2e/email_inbox_smoke.cy.js
- **[verificación de archivos implementados]**
  - `components/email/UnifiedInbox/InboxContainer.jsx` -> src\components\email\UnifiedInbox\InboxContainer.jsx
  - `components/email/UnifiedInbox/EmailDetail.jsx` -> src\components\email\EmailDetail.jsx, src\components\email\UnifiedInbox\EmailDetail.jsx
  - `components/email/UnifiedInbox/EmailList.jsx` -> src\components\email\EmailList.jsx, src\components\email\UnifiedInbox\EmailList.jsx
  - `components/email/EmailComposer.jsx` -> src\components\email\EmailComposer.jsx
  - `components/email/SmartEmailComposer.jsx` -> src\components\email\SmartEmailComposer.jsx
  - `pages/EmailSetup.jsx` -> src\pages\EmailSetup.jsx
  - `components/email/EmailSettings.jsx` -> src\components\email\EmailSettings.jsx
  - `pages/EmailTemplates.jsx` -> src\pages\EmailTemplates.jsx
  - `pages/user/EmailStatistics.jsx` -> src\pages\user\EmailStatistics.jsx
  - `components/email/EmailComments.jsx` -> src\components\email\EmailComments.jsx
  - `components/email/EmailFeedbackCollector.jsx` -> src\components\email\EmailFeedbackCollector.jsx
  - `components/email/CalendarIntegration.jsx` -> src\components\email\CalendarIntegration.jsx
  - `components/email/MailgunTester.jsx` -> src\components\email\MailgunTester.jsx
  - `services/emailService.js` -> src\services\emailService.js
  - `services/emailAutomationService.js` -> src\services\emailAutomationService.js
  - `services/EmailRecommendationService.js` -> src\services\EmailRecommendationService.js
  - `services/emailTemplatesService.js` -> src\services\emailTemplatesService.js
  - `services/tagService.js` -> src\services\tagService.js
  - `services/folderService.js` -> src\services\folderService.js
  - `hooks/useEmailMonitoring.js` -> src\hooks\useEmailMonitoring.js
  - `hooks/useEmailUsername.jsx` -> src\hooks\useEmailUsername.jsx
  - `pages/Buzon_fixed_complete.jsx` -> src\pages\Buzon_fixed_complete.jsx
- **[roadmap/pending (doc)]**
  - 1. **Automatización y backend**
  -    - Implementar `callClassificationAPI` (o sustituirlo) y gestionar gracefully la ausencia del endpoint.
  -    - Mover la cola de envíos programados a backend + job recurrente; exponer estado/errores al usuario.
  -    - Persistir auto-respuestas y clasificación en Firestore/REST (no sólo localStorage).
  - 2. **UX / funcionalidad**
  -    - Integrar carpetas y etiquetas personalizadas en la nueva bandeja (sidebar, filtros, drag & drop).
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
- **[conclusión]** pendiente
- **[pendiente (doc)]**
  - mover la llamada a OpenAI al backend (evitar exponer `VITE_OPENAI_API_KEY`), corregir el guard de publicacion (`ProfileSummary`/`publishDisabled`), habilitar biblioteca de prompts editable, exponer configuracion de dominio personalizado y superficie de analitica consumible.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/web/diseno-web-flow.cy.js
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
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `RSVPConfirm.jsx`, `AcceptInvitation.jsx`, `RSVPDashboard.jsx`, hooks `useGuests`, servicios `rsvpService.js` y `emailAutomationService.js`.
- **[pendiente (doc)]**
  - confirmaciones grupales avanzadas, recordatorios automaticos multi-canal, analytics detallados y integracion directa con catering.
- **[E2E specs]** 5/5 presentes
  - ✅ cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js
  - ✅ cypress/e2e/rsvp/rsvp_invalid_token.cy.js
  - ✅ cypress/e2e/rsvp/rsvp_reminders.cy.js
  - ✅ cypress/e2e/rsvp/rsvp_confirm.cy.js
  - ✅ cypress/e2e/invitaciones_rsvp.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** desconocido
- **[E2E specs]** 14/14 presentes
  - ✅ cypress/e2e/seating/seating_smoke.cy.js
  - ✅ cypress/e2e/seating/seating_assign_unassign.cy.js
  - ✅ cypress/e2e/seating/seating_capacity_limit.cy.js
  - ✅ cypress/e2e/seating/seating_no_overlap.cy.js
  - ✅ cypress/e2e/seating/seating_obstacles_no_overlap.cy.js
  - ✅ cypress/e2e/seating/seating_template_circular.cy.js
  - ✅ cypress/e2e/seating/seating_template_u_l_imperial.cy.js
  - ✅ cypress/e2e/seating/seating_ceremony.cy.js
  - ✅ cypress/e2e/seating/seating_fit.cy.js
  - ✅ cypress/e2e/seating/seating_aisle_min.cy.js
  - ✅ cypress/e2e/seating/seating_toasts.cy.js
  - ✅ cypress/e2e/seating/seating_auto_ai.cy.js
  - ✅ cypress/e2e/seating/seating_area_type.cy.js
  - ✅ cypress/e2e/seating/seating_delete_duplicate.cy.js

## flujo-0-administracion-global.md

- **[archivo]** docs\flujos-especificos\flujo-0-administracion-global.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - *pendiente de definiciÃ³n tÃ©cnica*.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/admin/admin-flow.cy.js
- **[roadmap/pending (doc)]**
  - - MFA obligatorio (TOTP) para admin.
  - - ImpersonaciÃ³n segura (solo lectura) con trail completo.
  - - SSO corporativo (SAML/OAuth Enterprise).
  - - Alertas push/Slack en tiempo real.
  - - Dashboard dedicado Â“Estado integracionesÂ”.
  - - Reportes automÃ¡ticos semanales al comitÃ© directivo.
  - - KPI NPS automatizado (encuestas periÃ³dicas planners).
- **[checklist despliegue]**
  - - Crear usuario admin Ãºnico (`role: admin` en Firestore) y habilitar MFA (si disponible) o restringir IP.
  - - Variables entorno: `VITE_ADMIN_ALLOWED_DOMAINS`, `ADMIN_METRICS_REFRESH_MS`, `ADMIN_SUPPORT_EMAIL`, `ADMIN_SUPPORT_PHONE`.
  - - Desplegar funciones cron `calculateAdminMetrics` (cada hora) y `syncExternalKPIs` (cada 5 min).
  - - Crear Ã­ndices Firestore definidos.
  - - Configurar bucket para exportes PDF.
  - - Verificar API keys y permisos de integraciones.
  - - Actualizar reglas Firestore para colecciones admin.
  - - Documentar rotaciÃ³n de claves y plan contingencia.

## flujo-1-registro-autenticacion.md

- **[archivo]** docs\flujos-especificos\flujo-1-registro-autenticacion.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Signup.jsx`, `Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, `useAuth.jsx`, `SessionManager.jsx`, `src/context/UserContext.jsx`, componentes `SocialLoginButtons.jsx`, `RegisterForm.jsx`, `PasswordStrengthMeter.jsx`.
- **[pendiente (doc)]**
  - instrumentaci?n de m?tricas (signup/login/reset), refactor de formularios legacy fuera de uso y auditor?a de accesibilidad final.
- **[E2E specs]** 5/5 presentes
  - ✅ cypress/e2e/auth/flow1-signup.cy.js
  - ✅ cypress/e2e/auth/flow1-social-login.cy.js
  - ✅ cypress/e2e/auth/flow1-password-reset.cy.js
  - ✅ cypress/e2e/auth/flow1-verify-email.cy.js
  - ✅ cypress/e2e/auth/auth-flow.cy.js
- **[verificación de archivos implementados]**
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

## flujo-12-notificaciones-configuracion.md

- **[archivo]** docs\flujos-especificos\flujo-12-notificaciones-configuracion.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Notificaciones.jsx`, `NotificationPreferences.jsx`, `NotificationWatcher.jsx`, `NotificationCenter.jsx` (scaffold), servicios `notificationService.js`, `notificationPreferencesService.js`, rutas backend `/api/notification-preferences`.
- **[pendiente (doc)]**
  - automatizaciones avanzadas (AutomationRules UI), notificaciones push/SMS completas y centro de notificaciones final.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/notifications/preferences-flow.cy.js
- **[verificación de archivos implementados]**
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
- **[conclusión]** desconocido
- **[E2E specs]** 2/2 presentes
  - ✅ cypress/e2e/email/ai-provider-email.cy.js
  - ✅ cypress/e2e/email/smart-composer.cy.js
- **[checklist despliegue]**
  - - Clave `OPENAI_API_KEY` solo si el backend `/api/chat-widget` está habilitado.
  - - Revisar políticas de almacenamiento local (GDPR) y permitir al usuario limpiar historial.
  - - En entornos productivos, habilitar tracking de eventos antes de lanzar automatizaciones reales.

## flujo-3-gestion-invitados.md

- **[archivo]** docs\flujos-especificos\flujo-3-gestion-invitados.md
- **[conclusión]** parcial
- **[implementado (doc)]**
  - `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes de invitados (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`.
- **[pendiente (doc)]**
  - dashboard analítico de RSVP, check-in en día del evento y sincronización automática con Seating Plan.
- **[E2E specs]** 1/1 presentes
  - ✅ cypress/e2e/guests/guests_flow.cy.js
- **[verificación de archivos implementados]**
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
