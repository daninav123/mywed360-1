# Roadmap - MaLove.App

> **Documento Oficial:** Integra backlog, plan de sprints y estado por flujo. 
> 
> **Última actualización:** Diciembre 2024
>
> **Documento maestro de referencia:** [`docs/WORKFLOW-USUARIO.md`](./WORKFLOW-USUARIO.md) - Define el flujo completo del usuario
>
> Snapshots históricos: `docs/archive/roadmap-2025-v2.md`, `docs/archive/NUEVO-ROADMAP-PRIORIZADO-2025.md`

---

## 🎯 Resumen Ejecutivo Q1 2025

### Estrategia: User-Centric Development
Todas las features se priorizan según su impacto en el **WORKFLOW-USUARIO.md** (9 fases, desde pre-planificación hasta post-boda).

### Objetivos Trimestrales (Q1 2025)

**🔴 Alta Prioridad - Quick Wins**
1. **FASE 0: Pre-Planificación** ⭐ NUEVO
   - Cuestionario inicial de visión
   - Generador de timeline personalizado
   - Impacto: Define toda la experiencia posterior

2. **FASE 1.3: Wizard de Diseño Completo**
   - Quiz de estilo interactivo
   - Generador de paletas de colores
   - Impacto: Reduce tasa de abandono en onboarding

3. **FASE 2.6: Pruebas y Ensayos** ⭐ NUEVO
   - Calendario de pruebas y citas
   - Impacto: Mejora organización, reduce olvidos

4. **FASE 3.1.5: Shot List Fotográfico** ⭐ NUEVO
   - Generador de lista de fotos deseadas
   - Impacto: Alto valor percibido, esfuerzo bajo

5. **FASE 5.3: Regalos y Lista de Deseos** ⭐ NUEVO
   - Lista digital multi-tienda
   - Impacto: Feature esperada, potencial ingresos

6. **FASE 6.2: Transporte y Logística** ⭐ NUEVO
   - Gestión completa de transporte/alojamiento
   - Impacto: Crítico para invitados

7. **FASE 7.3: Álbum Colaborativo en Vivo**
   - Upload desde móvil + slideshow tiempo real
   - Impacto: Diferenciador competitivo

### KPIs y Metas 2025

**Retención y Engagement:**
- Retención de planners: +15% (actual +10%)
- NPS usuarios: 50+ (actual 45)
- Completitud de workflow: 75% (actual 45%)

**Calidad:**
- Cobertura E2E crítica: 90% en CI
- Exportaciones listas: <2% rechazos
- Bugs críticos en producción: 0

**Nuevas Features:**
- Q1: 7 features alta prioridad
- Q2: 5 features media prioridad
- Q3-Q4: 6 features baja prioridad

### Estado Actual por Workflow (Diciembre 2024)

| Fase Workflow | % Completado | Nuevas Subfases | Estado |
|---------------|--------------|-----------------|--------|
| 0. Pre-Planificación | 0% | 2 nuevas | 🔴 No iniciado |
| 1. Planificación Inicial | 70% | Mejorar diseño | 🟢 Producción |
| 2. Búsqueda y Contratación | 75% | Pruebas/Ensayos | 🟢 Producción |
| 3. Diseño Experiencia | 60% | Team + Shot List | 🟡 Desarrollo |
| 4. Trámites Legales | 0% | - | 🔴 Pendiente |
| 5. Confirmaciones | 70% | Regalos + Accesibilidad | 🟢 Producción |
| 6. Pre-Boda | 5% | Transporte + Eventos | 🔴 Pendiente |
| 7. Día de la Boda | 50% | Álbum Colaborativo | 🟡 Desarrollo |
| 8. Post-Boda | 0% | Contenido + Luna Miel | 🔴 Pendiente |

**Implementado/parcial:** Flujos 1, 2, 3 (parcial), 5, 7 (parcial)  
**Alta prioridad Q1:** Fases 0, 1.3, 2.6, 3.1.5, 5.3, 6.2, 7.3  
**Ejecución priorizada:** Ver [`docs/WORKFLOW-USUARIO.md`](./WORKFLOW-USUARIO.md) para roadmap completo

---

## 📋 Plan de Desarrollo Q1-Q4 2025

### Q1 2025 (Enero-Marzo) - Foundation & Quick Wins
**Objetivo:** Implementar 7 features de alta prioridad del workflow

**Sprint 1-2 (Enero):**
- FASE 0: Cuestionario inicial + Timeline personalizado
- FASE 1.3: Wizard de diseño (quiz + paletas)

**Sprint 3-4 (Febrero):**
- FASE 3.1.5: Shot List fotográfico
- FASE 2.6: Calendario de pruebas y ensayos

**Sprint 5-6 (Marzo):**
- FASE 5.3: Lista de regalos digital
- FASE 6.2: Transporte y logística básico
- FASE 7.3: Álbum colaborativo MVP

### Q2 2025 (Abril-Junio) - Depth & Collaboration
**Objetivo:** Implementar 5 features de media prioridad

- FASE 3.0: Wedding Team y colaboración
- FASE 4: Trámites legales (checklist por país)
- FASE 5.4: Invitados especiales/accesibilidad
- FASE 6.3: Eventos múltiples (pre y post boda)
- FASE 6.4: Gestión de niños

### Q3-Q4 2025 (Julio-Diciembre) - Polish & Scale
**Objetivo:** Completar ciclo post-boda y features adicionales

- FASE 6.1: Logística final completa
- FASE 8: Post-boda (contenido, agradecimientos, archivo)
- Luna de miel y features diferenciadores
- Optimizaciones y mejoras basadas en feedback

---

## 🔗 Referencias Cruzadas

- **Workflow del Usuario:** [`docs/WORKFLOW-USUARIO.md`](./WORKFLOW-USUARIO.md) - Documento maestro
- **Análisis de Gaps:** [`docs/ANALISIS-GAPS-WORKFLOW.md`](./ANALISIS-GAPS-WORKFLOW.md) - Detalle de 18 elementos nuevos
- **Auditoría de Documentación:** [`docs/AUDITORIA-DOCUMENTACION.md`](./AUDITORIA-DOCUMENTACION.md)
- **Guía de Estilo:** [`../STYLE_GUIDE.md`](../STYLE_GUIDE.md)

---

## 📊 Detalle por Flujo Técnico

> Los siguientes flujos técnicos se mantienen por compatibilidad. 
> Consultar WORKFLOW-USUARIO.md para la visión orientada al usuario.

## Detalle por flujo

## 0. Administracion Global (estado 2025-10-14)

- **[archivo]** docs\flujos-especificos\flujo-0-administracion-global.md
- **[conclusion]** implementado
- **[implementado (doc)]**
  - autenticación reforzada, panel operativo con métricas en tiempo real, alertas de integraciones y gestión de tareas administrativas. La documentación de detalle se encuentra en [docs/panel-admin/panel-admin.md](../panel-admin/panel-admin.md).
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/admin/admin-flow.cy.js

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

## 15. Contratos y Documentos (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-15-contratos-documentos.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Contratos.jsx` (CRUD y modales integrados), dataset `contractTemplates.js`, servicios `SignatureService.js` (stub), `storageUploadService.js` para adjuntos y hooks `useFirestoreCollection` + `useProveedores` para wiring con proveedores.
- **[pendiente (doc)]**
  - firma digital integrada (DocuSign/HelloSign), workflows de aprobacion, analitica legal y compliance automatizado.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/contracts/contracts-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Contratos.jsx` -> src\pages\Contratos.jsx
  - `contractTemplates.js` -> src\data\templates\contractTemplates.js
  - `SignatureService.js` -> src\services\SignatureService.js, backend\services\signatureService.js
  - `storageUploadService.js` -> src\services\storageUploadService.js
  - `useFirestoreCollection` -> src\hooks\useFirestoreCollection.js
  - `useProveedores` -> src\hooks\useProveedores.jsx
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

## 17. Gamificacion y Progreso (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-17-gamificacion-progreso.md
- **[conclusion]** pendiente
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/gamification/gamification-progress-happy.cy.js
  - [ok] cypress/e2e/gamification/gamification-milestone-unlock.cy.js
  - [ok] cypress/e2e/gamification/gamification-history.cy.js
- **[roadmap/pending (doc)]**
  - - Disenar integraciones discretas (badges en lista de tareas, indicadores en timeline) sin recurrir a paneles grandes.
  - - Definir programa de recompensas intercambiables consumiendo los datos existentes.
  - - Preparar comunicacion a usuarios cuando exista alguna visualizacion ligera o beneficio tangible.
  - - Analitica avanzada y segmentacion para marketing se mantiene como trabajo futuro.
- **[checklist despliegue]**
  - - Reglas de seguridad para colecciones `gamification`, `achievements`, `gamificationEvents`.
  - - Limites de escritura y throttling en funciones Cloud/Firestore.
  - - Documentar contratos de API para consumidores internos.
  - - Configurar alertas y monitoreo de logs.

## 18. Generador de Documentos Legales (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-18-generador-documentos-legales.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - formulario `DocumentosLegales.jsx` (consentimiento de uso de imagen) que genera un PDF local con jsPDF.
- **[pendiente (doc)]**
  - repositorio completo de plantillas, firma electrónica, almacenamiento backend y automatización IA.
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/protocolo/legal-docs-generator.cy.js
  - [ok] cypress/e2e/protocolo/legal-docs-validation.cy.js
  - [ok] cypress/e2e/protocolo/legal-docs-versioning.cy.js
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

## 20. Buzon Interno y Estadisticas (estado 2025-10-07)

- **[archivo]** docs\flujos-especificos\flujo-20-email-inbox.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Buzon_fixed_complete.jsx` (legacy), `EmailInbox.jsx`, `EmailStatistics.jsx`, componentes `UnifiedInbox/InboxContainer.jsx`, `EmailComposer.jsx`, `EmailSetupForm.jsx`.
- **[pendiente (doc)]**
  - consolidar experiencia unica, documentar APIs backend, onboarding centralizado y telemetry completa.
- **[E2E specs]** 7/7 presentes
  - [ok] cypress/e2e/email_inbox_smoke.cy.js
  - [ok] cypress/e2e/email/read-email.cy.js
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
  - `websiteService` -> src\services\websiteService.js
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

## 23. Metricas del Proyecto (estado 2025-10-14)

- **[archivo]** docs\flujos-especificos\flujo-23-metricas-proyecto.md
- **[conclusion]** desconocido
- **[E2E specs]** 5/5 presentes
  - [ok] cypress/e2e/performance/email-performance.cy.js
  - [ok] cypress/e2e/finance/finance-analytics.cy.js
  - [ok] cypress/e2e/gamification/gamification-history.cy.js
  - [ok] cypress/e2e/budget_flow.cy.js
  - [ok] cypress/e2e/finance/finance-flow-full.cy.js
- **[checklist despliegue]**
  - - Backend: exponer `/api/project-metrics` (GET agregados, POST ingest) protegido por roles (owner, planner, admin, soporte) y habilitar `metricAggregatorWorker` en cron. Ver plan detallado en `docs/panel-admin/metricAggregatorWorker-plan.md`.
  - - Configurar `VITE_METRICS_ENDPOINT` y variables adicionales (`VITE_ENABLE_EMAIL_ANALYZE`, `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_*`) para garantizar fuentes completas.
  - - Verificar reglas de seguridad para colecciones citadas (emailMetrics, finance, gamification, analytics/websiteEvents, publicSites, tasks, contracts, inspirationWall, blogCache).
  - - Asegurar que `performanceMonitor.setUserContext` se invoca desde `useAuth` y `WeddingContext` antes de habilitar reportes multiusuario.
  - - Documentar en runbook la respuesta a fallos de ingest (reintentos, colas pendientes, mute de alertas).

## 25. Planes y Suscripciones (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-25-suscripciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - documentación estratégica inicial y catálogo de planes en `docs/planes-suscripcion.md`.
- **[pendiente (doc)]**
  - implementación técnica del cobro único por boda, automatizaciones de upgrade/downgrade, telemetría operativa y paneles de rentabilidad.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/subscriptions/subscription-flow.cy.js
- **[verificacion de archivos implementados]**
  - `docs/planes-suscripcion.md` -> docs\planes-suscripcion.md
- **[roadmap/pending (doc)]**
  - - Validar con stakeholders la propuesta de valor y límites concretos por plan.
  - - Mapear el journey completo en herramientas (Miro/Lucidchart) con responsables y SLA por boda.
  - - Construir dashboard de métricas (upgrades, ticket medio, ratio Premium Plus) integrado con CRM y pasarela.
  - - Diseñar y testear journeys automáticos (alta, upgrade, rescate post-abandono) antes del lanzamiento.
  - - Definir estrategia de retención post-boda y cross-sell hacia nuevas bodas o planners.
  - - Consolidar automatizaciones de rescate (downgrade, reintentos, ofertas personalizadas).
- **[checklist despliegue]**
  - - Configurar claves de pasarela (`STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`) y variables `VITE_DEFAULT_PLAN`.
  - - Asegurar reglas Firestore para `weddings/{id}/subscription`, `users/{uid}/weddingPlans` y `subscriptionInvoices`.
  - - Registrar dominios y webhooks en pasarela de pago (staging/producción).
  - - Sembrar seeds para QA (`scripts/seedSubscriptions.js`) con bodas en cada plan.
  - - Documentar FAQ y material de soporte para cada nivel.
  - - Ejecutar `scripts/aggregateRoadmap.js` tras cambios de flujo para sincronizar ROADMAP/TODO.

## 26. Blog de Tendencias (estado 2025-10-12)

- **[archivo]** docs\flujos-especificos\flujo-26-blog.md
- **[conclusion]** pendiente
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/blog/blog-article.cy.js
  - [ok] cypress/e2e/blog/blog-listing.cy.js
  - [ok] cypress/e2e/blog/blog-subscription.cy.js
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

## 27. Momentos (Álbum Compartido) — estado 2025-10-15

- **[archivo]** docs\flujos-especificos\flujo-27-momentos.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - robustecer pipelines de moderación automática, gamificación y métricas, además de endurecer observabilidad y experiencia QR pública.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/moments/moments-empty-state.cy.js
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
- **[E2E specs]** 4/4 presentes
  - [ok] cypress/e2e/dashboard/diagnostic-panel.cy.js
  - [ok] cypress/e2e/dashboard/global-search-shortcuts.cy.js
  - [ok] cypress/e2e/dashboard/main-navigation.cy.js
  - [ok] cypress/e2e/dashboard/planner-dashboard.cy.js
- **[verificacion de archivos implementados]**
  - `HomePage.jsx` -> src\components\HomePage.jsx
  - `PlannerDashboard.jsx` -> src\components\PlannerDashboard.jsx
  - `PlannerDashboard.jsx` -> src\components\PlannerDashboard.jsx
  - `WeddingContext.jsx` -> src\context\WeddingContext.jsx
  - `useFirestoreCollection.js` -> src\hooks\useFirestoreCollection.js
  - `useWeddingCollection.js` -> src\hooks\useWeddingCollection.js
  - `Nav.jsx` -> src\components\Nav.jsx
  - `Bodas.jsx` -> src\pages\Bodas.jsx

## 29. Upgrade de Rol (Owner ? Assistant ? Planner) (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-29-upgrade-roles.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - selector de rol en registro (`src/components/auth/RegisterForm.jsx:56`), persistencia local del rol en `useAuth` (`src/hooks/useAuth.jsx:180`, `src/hooks/useAuth.jsx:593`), navegacion y dashboard condicionados por rol (`src/components/Nav.jsx:29`, `src/components/HomePage.jsx:77`), vinculos de bodas por rol en `WeddingService` (`src/services/WeddingService.js:144`, `src/services/WeddingService.js:487`, `src/services/WeddingService.js:510`), invitaciones desde `WeddingAccountLink.jsx:59` y aceptacion `WeddingAccountLink.jsx:79`.
- **[pendiente (doc)]**
  - flujo unificado de upgrade con checkout de plan, sincronizacion Firestore/localStorage del nuevo rol, limites de bodas por plan, degradacion automatica al expirar el plan y panel de gestion para revertir cambios.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/account/role-upgrade-flow.cy.js
- **[verificacion de archivos implementados]**
  - `src/components/auth/RegisterForm.jsx:56` -> src\components\auth\RegisterForm.jsx
  - `useAuth` -> src\hooks\useAuth.jsx
  - `src/hooks/useAuth.jsx:180` -> src\hooks\useAuth.jsx
  - `src/hooks/useAuth.jsx:593` -> src\hooks\useAuth.jsx
  - `src/components/Nav.jsx:29` -> src\components\Nav.jsx
  - `src/components/HomePage.jsx:77` -> src\components\HomePage.jsx
  - `WeddingService` -> src\services\WeddingService.js
  - `src/services/WeddingService.js:144` -> src\services\WeddingService.js
  - `src/services/WeddingService.js:487` -> src\services\WeddingService.js
  - `src/services/WeddingService.js:510` -> src\services\WeddingService.js
  - `WeddingAccountLink.jsx:59` -> src\components\settings\WeddingAccountLink.jsx
  - `WeddingAccountLink.jsx:79` -> src\components\settings\WeddingAccountLink.jsx

## 2B. Asistente Conversacional para Crear Bodas/Eventos · estado 2025-10-11

- **[archivo]** docs\flujos-especificos\flujo-2b-creacion-boda-asistente.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAssistant.jsx`, rutas `/crear-evento-asistente`, servicios `createWedding`, `seedDefaultTasksForWedding`, contexto `WeddingContext`, catálogos `config/eventStyles.js`.
- **[pendiente (doc)]**
  - telemetría dedicada, iterar prompts/UX, habilitar múltiples rondas IA y consolidar con flujo clásico.
- **[E2E specs]** 4/4 presentes
  - [ok] cypress/e2e/onboarding/assistant-conversation-happy.cy.js
  - [ok] cypress/e2e/onboarding/assistant-context-switch.cy.js
  - [ok] cypress/e2e/onboarding/assistant-followups.cy.js
  - [ok] cypress/e2e/onboarding/create-event-assistant.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/CreateWeddingAssistant.jsx` -> src\pages\CreateWeddingAssistant.jsx
  - `/crear-evento-asistente` -> (no encontrado)
  - `createWedding` -> (no encontrado)
  - `seedDefaultTasksForWedding` -> (no encontrado)
  - `WeddingContext` -> src\context\WeddingContext.jsx
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

## 2C. Personalización IA Continua (estado 2025-10-14)

- **[archivo]** docs\flujos-especificos\flujo-2c-personalizacion-continua.md
- **[conclusion]** desconocido
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/personalization/personalization-preferences.cy.js

## 30. Pagina de inicio (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-30-pagina-inicio.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/HomeUser.jsx`, `src/components/HomePage.jsx`, `Nav.jsx`, `ProviderSearchModal.jsx`, `useFinance`, servicios `fetchWeddingNews` y `fetchWall`.
- **[pendiente (doc)]**
  - reemplazar datos mock/localStorage por origenes reales, unificar con `Dashboard.jsx`, instrumentar telemetria de interaccion y ocultar helpers de desarrollo en produccion.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/home/home-greeting-names.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/HomeUser.jsx` -> src\pages\HomeUser.jsx
  - `src/components/HomePage.jsx` -> src\components\HomePage.jsx
  - `Nav.jsx` -> src\components\Nav.jsx
  - `ProviderSearchModal.jsx` -> src\components\ProviderSearchModal.jsx
  - `useFinance` -> src\hooks\useFinance.js
  - `fetchWeddingNews` -> (no encontrado)
  - `fetchWall` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Reemplazar fuentes `localStorage` por datos sincronizados (Firestore/REST) y estados compartidos via contextos.
  - - Unificar Home con `Dashboard.jsx` (Flujo 22) y permitir configuracion de widgets.
  - - Anadir resumen de actividad reciente y proximos hitos (tareas, pagos, invitados).
  - - Implementar buscador global accesible (atajo Cmd/Ctrl+K) y recomendaciones IA.
- **[checklist despliegue]**
  - - Envolver boton "Rehacer tutorial" tras feature flag (`VITE_ENABLE_DEV_TOOLS` o similar).
  - - Confirmar traducciones `i18n` para textos nuevos (progress, acciones, cards).
  - - Asegurar que `fetchWeddingNews` y `fetchWall` cuenten con mocks en ambientes de prueba.
  - - Verificar estilos CSS variables (`--color-*`) en temas claro/oscuro.

## 31. Estilo Global (estado 2025-10-13)

- **[archivo]** docs\flujos-especificos\flujo-31-estilo-global.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - reutilizar `weddings/{id}/branding/main.palette` en los generadores (web, invitaciones, assets), sincronizar cambios de `MaLove.AppProfile` con Firestore sin depender de eventos locales y exponer UI dedicada para editar estilo global dentro de `/perfil`.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/style/style-global.cy.js
- **[roadmap/pending (doc)]**
  - - Consumir `branding/main.palette` en `websitePromptBuilder` y en generadores de invitaciones (`ImageGeneratorAI`).  
  - - Anadir UI declarativa de paleta/tipografias en `/perfil` con preview y guardado directo en Firestore (sin depender de localStorage).  
  - - Emitir eventos de monitoreo (p.ej. `style_updated`, `palette_saved`) y panel en dashboard admin.  
  - - Soportar estilos personalizados (valores libres) con normalizacion y mapeo IA.  
  - - Consolidar tokens CSS (crear `src/styles/tokens.css` referenciado en docs) y documentar proceso de override.  
  - - Tests e2e para vector editor y para cambios via comandos IA.
- **[checklist despliegue]**
  - - Confirmar que `EVENT_STYLE_OPTIONS` coincide con copy publico y traducciones.  
  - - Verificar reglas de seguridad Firestore para `weddings/{id}/branding`.  
  - - Asegurar que el bundle incluye `ThemeToggle` y variables CSS sin colisiones.  
  - - Revisar que asistentes IA reciban contexto (`style`, `guestCount`, `formality`) en `ChatWidget` antes de habilitar nuevas plantillas.

## 4. Invitados – Plan de Asientos (estado 2025-10-12)

- **[archivo]** docs\flujos-especificos\flujo-4-invitados-operativa.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - 
- **[roadmap/pending (doc)]**
  - - Panel lateral inteligente con recomendaciones autónomas y resolución de conflictos por IA.  
  - - Colaboración en tiempo real: evolucionar hacia versionado avanzado (locks y merge multi-editor) sobre la presencia y sincronización actuales.  
  - - Integración con proveedores/venues (ingesta automática de planos y configuraciones).  
  - - Exportaciones con presets guardados y envío directo a stakeholders.
  - - Reestructurar el PDF avanzado en secciones dedicadas (mapa de ceremonia, plano de banquete, lista global, invitados por mesa, dietas especiales, VIP de Momentos Especiales).
- **[checklist despliegue]**
  - - Reglas Firestore: colecciones `seating` y `seatingHistory` (roles y límites).  
  - - Seeds y límites (mesas, invitados) validados para rendimiento.  
  - - Validar compresión y consistencia de exportaciones.  
  - - Automatizar backups periódicos de `seating` para auditoría.

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
  - `Tasks.jsx` -> src\pages\Tasks.css, src\pages\Tasks.jsx, backend\node_modules\firebase-tools\lib\deploy\extensions\tasks.js, functions\node_modules\firebase-functions\lib\v2\providers\tasks.js, functions\node_modules\firebase-functions\lib\v1\providers\tasks.js, functions\node_modules\firebase-functions\lib\common\providers\tasks.js
  - `TaskSidePanel.jsx` -> src\components\tasks\TaskSidePanel.jsx
  - `Checklist.jsx` -> src\pages\Checklist.jsx, src\pages\protocolo\Checklist.jsx
  - `SmartChecklist.jsx` -> (no encontrado)
  - `TaskList.jsx` -> src\components\tasks\TaskList.jsx
  - `EventsCalendar.jsx` -> src\components\tasks\EventsCalendar.jsx
  - `LongTermTasksGantt.jsx` -> src\components\tasks\LongTermTasksGantt.jsx
  - `CalendarSync.jsx` -> src\components\tasks\CalendarSync.jsx
  - `TaskEventBridge.jsx` -> src\components\tasks\TaskEventBridge.js, src\components\tasks\TaskEventBridge.jsx
  - `TaskNotificationWatcher.jsx` -> src\components\tasks\TaskNotificationWatcher.js, src\components\tasks\TaskNotificationWatcher.jsx
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
  - cableado de busqueda/ordenacion secundario en `UnifiedInbox/EmailList.jsx`, onboarding con validaciones DKIM/SPF, persistencia server-side de auto-respuestas y migracion definitiva del buzon legacy + actualizacion de pruebas E2E/VTU a la nueva UI.
- **[E2E specs]** 14/14 presentes
  - [ok] cypress/e2e/email/send-email.cy.js
  - [ok] cypress/e2e/email/read-email.cy.js
  - [ok] cypress/e2e/email/folders-management.cy.js
  - [ok] cypress/e2e/email/tags-filters.cy.js
  - [ok] cypress/e2e/email/smart-composer.cy.js
  - [ok] cypress/e2e/email/ai-provider-email.cy.js
  - [ok] cypress/e2e/compose_quick_replies.cy.js
  - [ok] cypress/e2e/email_inbox_smoke.cy.js
  - [ok] cypress/e2e/email/read-email-attachments.cy.js
  - [ok] cypress/e2e/email/read-email-list.cy.js
  - [ok] cypress/e2e/email/read-email-open.cy.js
  - [ok] cypress/e2e/email/read-email-unread-status.cy.js
  - [ok] cypress/e2e/email/send-email-attachment.cy.js
  - [ok] cypress/e2e/email/send-email-validation.cy.js
- **[roadmap/pending (doc)]**
  - 1. **Automatización y backend**
  -    - Vigilar latencia y fallbacks de ``callClassificationAPI`` (ya cableado via ``processIncomingEmails``) y mantener heuristicas de respaldo cuando el endpoint no responda.
  -    - Completar migracion de la cola de envios programados a backend/job recurrente; el scheduler cliente (``startEmailScheduler``) ya corre, pero falta exponer estado/errores al usuario.
  -    - Persistir auto-respuestas y clasificación en Firestore/REST (no sólo localStorage).
  - 2. **UX / funcionalidad**
  -    - Completar integracion de carpetas personalizadas (drag & drop, alinear etiquetas); los contadores ``unread`` ya se sincronizan automaticamente.
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
- **[E2E specs]** 6/6 presentes
  - [ok] cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_invalid_token.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_reminders.cy.js
  - [ok] cypress/e2e/rsvp/rsvp_confirm.cy.js
  - [ok] cypress/e2e/invitaciones_rsvp.cy.js
  - [ok] cypress/e2e/rsvp_confirm.cy.js
- **[verificacion de archivos implementados]**
  - `RSVPConfirm.jsx` -> src\pages\RSVPConfirm.jsx
  - `AcceptInvitation.jsx` -> src\pages\AcceptInvitation.jsx
  - `RSVPDashboard.jsx` -> src\pages\RSVPDashboard.jsx
  - `useGuests` -> src\hooks\useGuests.js
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
- **[E2E specs]** 19/19 presentes
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
  - [ok] cypress/e2e/seating/seating-content-flow.cy.js
  - [ok] cypress/e2e/seating/seating-basic.cy.js
  - [ok] cypress/e2e/seating/seating-conflicts.cy.js
  - [ok] cypress/e2e/seating/seating_ui_panels.cy.js
  - [ok] cypress/e2e/seating/seating-export.cy.js
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
  - refactor de formularios legacy fuera de uso y auditoría de accesibilidad manual sobre flows secundarios.
- **[E2E specs]** 5/5 presentes
  - [ok] cypress/e2e/auth/flow1-signup.cy.js
  - [ok] cypress/e2e/auth/flow1-social-login.cy.js
  - [ok] cypress/e2e/auth/flow1-password-reset.cy.js
  - [ok] cypress/e2e/auth/flow1-verify-email.cy.js
  - [ok] cypress/e2e/auth/auth-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Signup.jsx` -> src\pages\Signup.jsx
  - `Login.jsx` -> src\pages\Login.jsx, backend\node_modules\firebase-tools\lib\commands\login.js
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
  - Bodas.jsx, BodaDetalle.jsx, WeddingSelector.jsx, WeddingFormModal.jsx, useWedding context, seeding inicial (finanzas/tareas) al crear boda desde planner, componentes MultiWeddingSummary.jsx y WeddingPortfolioTable.jsx, tablero multi-boda con KPIs/filtros y encolado CRM (crmSyncQueue), y editor de permisos por módulo en BodaDetalle.jsx (modulePermissions).
- **[pendiente (doc)]**
  - worker CRM (procesar crmSyncQueue), activity feed/alertas multi-boda y suites E2E específicas para permisos/CRM.
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/weddings/multi-weddings-flow.cy.js
  - [ok] cypress/e2e/weddings/wedding-team-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Worker CRM (procesamiento y reintentos), métricas de sincronización y alertas multi-boda.
  - - Activity feed con timeline consolidado y avisos en vivo.
  - - Suites E2E específicas para permisos por módulo y flujos CRM.
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
  - `/api/notification-preferences` -> backend\routes\notification-preferences.js
- **[roadmap/pending (doc)]**
  - - Centro de notificaciones completo (agrupaciones, búsqueda).
  - - Automation rules UI (if-this-then-that).
  - - Integración multi-canal (SMS/push con configuración avanzada).
  - - Panel de auditoría y métricas ( CTR, canal favorito/efectividad ).
- **[checklist despliegue]**
  - - Reglas Firestore `notifications` y `notificationPreferences`.
  - - Configurar Mailgun/Twilio/FCM; validar push en navegadores.
  - - Revisar traducciones (todas las opciones en `NotificationSettings` y `NotificationPreferences`).

## flujo-14-checklist-avanzado.md

- **[archivo]** docs\flujos-especificos\flujo-14-checklist-avanzado.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Checklist.jsx`, `Tasks.jsx`, `TaskSidePanel.jsx`, hook `useWeddingTasksHierarchy`, servicios `automationService.js` (basico).
- **[pendiente (doc)]**
  - generacion inteligente de checklists, dependencias avanzadas, gamificacion completa y plantillas compartidas por comunidad.
- **[E2E specs]** 1/1 presentes
  - [ok] cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificacion de archivos implementados]**
  - `Checklist.jsx` -> src\pages\Checklist.jsx, src\pages\protocolo\Checklist.jsx
  - `Tasks.jsx` -> src\pages\Tasks.css, src\pages\Tasks.jsx, backend\node_modules\firebase-tools\lib\deploy\extensions\tasks.js, functions\node_modules\firebase-functions\lib\v2\providers\tasks.js, functions\node_modules\firebase-functions\lib\v1\providers\tasks.js, functions\node_modules\firebase-functions\lib\common\providers\tasks.js
  - `TaskSidePanel.jsx` -> src\components\tasks\TaskSidePanel.jsx
  - `useWeddingTasksHierarchy` -> src\hooks\useWeddingTasksHierarchy.js
  - `automationService.js` -> backend\services\automationService.js
- **[roadmap/pending (doc)]**
  - - Motor de recomendaciones IA que genere checklist dinamico segun perfil de boda.
  - - Editor de plantillas colaborativas y marketplace de workflows.
  - - Dependencias visuales (gantt, grafo) y pronostico de riesgo.
  - - Gamificacion completa (streaks, objetivos semanales, recompensas).
  - - Sync bidireccional con calendarios externos (Google/Microsoft).
- **[checklist despliegue]**
  - - Reglas Firestore para `tasks`, `checklist`, `taskTemplates`, `checklistStats` y preparación para `taskAutomations`.
  - - Revisar limites de escritura masiva (batch) en seeds y automatizaciones.
  - - Configurar notificaciones (`MAILGUN_*`, `PUSH_PROVIDER`) para recordatorios.
  - - Actualizar traducciones y onboarding segun nuevas plantillas.

## flujo-16-asistente-virtual-ia.md

- **[archivo]** docs\flujos-especificos\flujo-16-asistente-virtual-ia.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - habilitar backend multicanal, reglas configurables, workers dedicados y cobertura E2E especifica.
- **[E2E specs]** 3/3 presentes
  - [ok] cypress/e2e/email/ai-provider-email.cy.js
  - [ok] cypress/e2e/email/smart-composer.cy.js
  - [ok] cypress/e2e/assistant/chat-fallback-context.cy.js
- **[roadmap/pending (doc)]**
  - - **Orquestador multicanal** (`AutomationOrchestrator`): ingerir emails, chats, WhatsApp y decidir acciones.
  - - **Reglas configurables**: panel para if/then (ej. “si proveedor responde con presupuesto > X → crear tarea”).
  - - **Workers**: procesar colas (`automationLogs`, `automationRules`) sin depender del cliente.
  - - **Auditoría**: panel `/automation` con historiales, posibilidad de revertir acciones y métricas (ratio automatización, reversión, latencias).
  - - **Integración con flujos**: generación automática de tareas (flujo 14), actualizaciones de proveedores (flujo 5), avisos en notificaciones (flujo 12).
  - Cuando estas piezas estén listas, se documentarán de nuevo (ver antiguo flujo 24 como referencia de visión).
- **[checklist despliegue]**
  - - Clave `OPENAI_API_KEY` solo si el backend `/api/ai/parse-dialog` (con fallback local contextual) está habilitado.
  - - Revisar políticas de almacenamiento local (GDPR) y permitir al usuario limpiar historial.
  - - En entornos productivos, habilitar tracking de eventos antes de lanzar automatizaciones reales.

## flujo-2-creacion-boda-ia.md

- **[archivo]** docs\flujos-especificos\flujo-2-creacion-boda-ia.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAI.jsx` (wizard dos pasos), `src/pages/AyudaCeremonia.jsx` (copy dinámico), `src/pages/BodaDetalle.jsx` (perfil de evento), `src/context/WeddingContext.jsx`, servicios `createWedding` y `seedDefaultTasksForWedding`, catálogo `src/config/eventStyles.js`.
- **[pendiente (doc)]**
  - habilitar opt-in a planner desde Perfil, paneles/alertas para la telemetría del funnel, refactor de rutas `/bodas`→`/eventos`, integración IA contextual y despliegue del flujo multi-evento para planners.
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/onboarding/create-event-flow.cy.js
  - [ok] cypress/e2e/onboarding/create-event-cta.cy.js
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
  - - Conectar telemetría con dashboards de adopción segmentados por `eventType` y alertas de funnel.
  - - ✅ 2025-10-13: Asistencia IA contextual con prompts por tipo de evento y fallback offline en ChatWidget.
  - - ✅ 2025-10-08: Wizard multi-evento, servicios y pantallas asociados actualizados para `eventType/eventProfile`.
  - - ✅ 2025-10-08: Catálogo de estilos centralizado y copy adaptable (`Boda`/`Evento`).
  - - 🚫 2025-10-13: CTA «Crear nuevo evento» retirado del header y del menú contextual; ambos deben permanecer sin botón y mantenerse el selector multi-evento habilitado para owners.
- **[checklist despliegue]**
  - - Reglas Firestore: permitir escritura de `eventType`, `eventProfile`, `eventProfileSummary` y nuevos campos en `_seed_meta`.
  - - Script `scripts/migrate-event-profile.js` para etiquetar eventos legacy con `eventType: 'boda'` y generar `eventProfileSummary` básico antes del switch.
  -   1. Obtener credenciales (`serviceAccount.json`) y ejecutar: `node scripts/migrate-event-profile.js --credentials path/to/serviceAccount.json`.
  -   2. Verificar en staging que `weddings/{id}` contiene `eventType/eventProfile` normalizados y que cada `users/{uid}/weddings/{id}` refleja `eventProfileSummary`.
  -   3. Revisar logs de consola (totales migrados) y auditar uno o dos documentos en la consola de Firestore antes de seguir a producción.
  - - Revisión de copy/traducciones (`Crear boda`, `Crear evento`) y estilos centralizados (`config/eventStyles.js`).
  - - Telemetría: preparar dashboard funnel + ratio adopción Paso 2.
  - - QA: actualizar suites Cypress/E2E con los casos anteriores.

## flujo-2-descubrimiento-personalizado.md

- **[archivo]** docs\flujos-especificos\flujo-2-descubrimiento-personalizado.md
- **[conclusion]** desconocido
- **[E2E specs]** 2/2 presentes
  - [ok] cypress/e2e/onboarding/discovery-personalized.cy.js
  - [ok] cypress/e2e/onboarding/onboarding-mode-selector.cy.js

## flujo-22-dashboard-navegacion.md

- **[archivo]** docs\flujos-especificos\flujo-22-dashboard-navegacion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `HomeUser.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnostico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
- **[pendiente (doc)]**
  - unificar dashboard con metricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronizacion.
- **[verificacion de archivos implementados]**
  - `HomeUser.jsx` -> src\pages\HomeUser.jsx
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

## flujo-24-galeria-inspiracion.md

- **[archivo]** docs\flujos-especificos\flujo-24-galeria-inspiracion.md
- **[conclusion]** pendiente
- **[E2E specs]** 4/4 presentes
  - [ok] cypress/e2e/inspiration/inspiration-gallery.cy.js
  - [ok] cypress/e2e/inspiration/inspiration-home-gallery.cy.js
  - [ok] cypress/e2e/inspiration/inspiration-save-board.cy.js
  - [ok] cypress/e2e/inspiration/inspiration-share.cy.js
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

## flujo-3-gestion-invitados.md

- **[archivo]** docs\flujos-especificos\flujo-3-gestion-invitados.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes de invitados (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, dataset demo (`loadSampleGuests`), modal de check-in con QR/códigos manuales y panel analítico de RSVP.
- **[pendiente (doc)]**
  - sincronización completa con Seating Plan (persistencia bidireccional en backend) y automatizaciones IA reactivas a cambios de invitados.
- **[E2E specs]** 4/4 presentes
  - [ok] cypress/e2e/guests/guests_flow.cy.js
  - [ok] cypress/e2e/guests/guests_crud.cy.js
  - [ok] cypress/e2e/guests/guests_import_rsvp.cy.js
  - [ok] cypress/e2e/guests/guests_messaging.cy.js
- **[verificacion de archivos implementados]**
  - `Invitados.jsx` -> src\pages\Invitados.jsx
  - `RSVPDashboard.jsx` -> src\pages\RSVPDashboard.jsx
  - `AcceptInvitation.jsx` -> src\pages\AcceptInvitation.jsx
  - `GuestEventBridge.jsx` -> src\components\guests\GuestEventBridge.js, src\components\guests\GuestEventBridge.jsx
  - `GuestList` -> src\components\guests\GuestList.jsx
  - `GuestFilters` -> src\components\guests\GuestFilters.jsx
  - `GuestForm` -> src\components\guests\GuestForm.jsx
  - `GuestBulkGrid` -> src\components\guests\GuestBulkGrid.jsx
  - `ContactsImporter` -> src\components\guests\ContactsImporter.jsx
  - `GroupManager` -> src\components\guests\GroupManager.jsx
  - `WhatsAppModal` -> src\components\whatsapp\WhatsAppModal.jsx
  - `WhatsAppSender` -> src\components\whatsapp\WhatsAppSender.jsx
  - `SaveTheDateModal` -> src\components\whatsapp\SaveTheDateModal.jsx
  - `InviteTemplateModal` -> src\components\whatsapp\InviteTemplateModal.jsx
  - `useGuests` -> src\hooks\useGuests.js
  - `SyncService` -> src\services\SyncService.js
  - `MessageTemplateService` -> src\services\MessageTemplateService.js
  - `whatsappService` -> src\services\whatsappService.js, backend\services\whatsappService.js
  - `WhatsAppBatchService` -> src\services\WhatsAppBatchService.js
  - `loadSampleGuests` -> (no encontrado)
- **[roadmap/pending (doc)]**
  - - Sincronización completa con Seating Plan (lectura/escritura Firestore y resolución de conflictos entre dispositivos).
  - - Automatizaciones IA sobre invitados (sugerencias proactivas, mensajes y tareas derivadas de cambios RSVP/check-in).
  - - Exportaciones y reporting día B (listado de check-in, etiquetas personalizadas y QR individuales).
- **[checklist despliegue]**
  - - Configurar proveedor WhatsApp y variables (`VITE_BACKEND_BASE_URL`, `VITE_DEFAULT_COUNTRY_CODE`, credenciales).
  - - Reglas Firestore actualizadas (CRUD de `guests` y `rsvp`).
  - - Endpoints habilitados: `/api/whatsapp/send`, `/send-batch`, `/batch`, `/schedule`, `/api/whatsapp/provider-status`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`.
  - - Revisar traducciones/mensajes de toasts y compatibilidad con modo offline.

## flujo-5-proveedores-ia.md

- **[archivo]** docs\flujos-especificos\flujo-5-proveedores-ia.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `GestionProveedores.jsx` (panel superior plegable con zona de confirmados), `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, modales IA (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
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
  - `GroupAllocationModal.jsx` -> src\components\proveedores\GroupAllocationModal.jsx
  - `GroupCreateModal.jsx` -> src\components\proveedores\GroupCreateModal.jsx
  - `GroupSuggestions.jsx` -> src\components\proveedores\GroupSuggestions.jsx
  - `DuplicateDetectorModal.jsx` -> src\components\proveedores\DuplicateDetectorModal.jsx
  - `CompareSelectedModal.jsx` -> src\components\proveedores\CompareSelectedModal.jsx
  - `ProviderSearchDrawer.jsx` -> src\components\proveedores\ProviderSearchDrawer.jsx
  - `AIBusquedaModal.jsx` -> src\components\proveedores\AIBusquedaModal.jsx
  - `AISearchModal.jsx` -> src\components\proveedores\ai\AISearchModal.jsx
  - `AIEmailModal.jsx` -> src\components\proveedores\ai\AIEmailModal.jsx
  - `aiSuppliersService.js` -> src\services\aiSuppliersService.js
  - `supplierEventBridge` -> src\components\proveedores\SupplierEventBridge.js, src\components\proveedores\SupplierEventBridge.jsx
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

## flujo-6-presupuesto.md

- **[archivo]** docs\flujos-especificos\flujo-6-presupuesto.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
- **[pendiente (doc)]**
  - importación CSV/Excel con mapeo, analítica predictiva con IA, ampliación de aportaciones colaborativas, reportes exportables y automatización de alertas avanzadas.
- **[E2E specs]** 8/8 presentes
  - [ok] cypress/e2e/finance/finance-flow.cy.js
  - [ok] cypress/e2e/finance/finance-flow-full.cy.js
  - [ok] cypress/e2e/finance/finance-budget.cy.js
  - [ok] cypress/e2e/finance/finance-transactions.cy.js
  - [ok] cypress/e2e/finance/finance-contributions.cy.js
  - [ok] cypress/e2e/finance/finance-analytics.cy.js
  - [ok] cypress/e2e/budget_flow.cy.js
  - [ok] cypress/e2e/finance/finance-advisor-chat.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/Finance.jsx` -> src\pages\Finance.jsx, src\i18n\locales\es\finance.json
  - `src/components/finance/BudgetManager.jsx` -> src\components\finance\BudgetManager.jsx
  - `FinanceOverview.jsx` -> src\components\finance\FinanceOverview.jsx
  - `FinanceCharts.jsx` -> src\components\finance\FinanceCharts.jsx
  - `PaymentSuggestions.jsx` -> src\components\finance\PaymentSuggestions.jsx
  - `TransactionManager.jsx` -> src\components\finance\TransactionManager.jsx
  - `useFinance` -> src\hooks\useFinance.js
  - `useSupplierBudgets` -> src\hooks\useSupplierBudgets.js
  - `EmailInsightsService` -> src\services\EmailInsightsService.js
  - `bankService` -> src\services\bankService.js
  - `SyncService` -> src\services\SyncService.js
- **[roadmap/pending (doc)]**
  - - Integracion Open Banking: UI de autenticacion, refresco de tokens, categorizacion inteligente, reconciliacion automatica.
  - - Importacion CSV/Excel con preview y mapeo de columnas (validaciones server-side).
  - - Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
  - - Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
  - - Prediccion de gasto y recomendaciones automaticas basadas en proyeccion.
  - - Automatizacion de pagos programados y conciliacion con contratos.
  - - Adjuntos en `TransactionForm` aceptan `image/*`, `application/pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`. Otros tipos se bloquean en la carga de archivos.
  - - Entrenamiento y calibracion continua del consejero conversacional (dataset anonimizado, feedback `advisor_feedback_submitted`, segmentacion regional) para mantener precision y reducir sesgos.
- **[checklist despliegue]**
  - - Reglas Firestore actualizadas para `finance/main`, subcolección `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
  - - Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
  - - Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
  - - Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
  - - Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

Generado automaticamente por scripts/aggregateRoadmap.js. Ejecuta el script cuando cambie la documentacion o los tests.
