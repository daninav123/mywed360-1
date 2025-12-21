# Roadmap - MaLove.App

> Documento canónico que integra backlog, plan de sprints y estado por flujo. Actualiza esta fuente única cuando haya cambios para evitar divergencias.
>
> Snapshot histórico: `docs/archive/roadmap-2025-v2.md` (09/10/2025). Úsalo solo como referencia histórica.

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

## 0. Administración Global (estado 2025-10-14)

- **[archivo]** docs/flujos-especificos/flujo-0-administracion-global.md
- **[conclusion]** desconocido
- **[implementado (doc)]**
  - autenticación reforzada, panel operativo con métricas en tiempo real, alertas de integraciones y gestión de tareas administrativas. La documentación de detalle se encuentra en [docs/panel-admin/panel-admin.md](../panel-admin/panel-admin.md).
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/admin/admin-flow.cy.js

## 1. Registro y Autenticación (estado 2025-10-08)

- **[archivo]** docs/flujos-especificos/flujo-1-registro-autenticacion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Signup.jsx`, `Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, `useAuth.jsx`, `SessionManager.jsx`, `src/context/UserContext.jsx`, componentes `SocialLoginButtons.jsx`, `RegisterForm.jsx`, `PasswordStrengthMeter.jsx`.
- **[pendiente (doc)]**
  - refactor de formularios legacy fuera de uso y auditoría de accesibilidad manual sobre flows secundarios.
- **[E2E specs]** 0/5 presentes
  - [faltante] cypress/e2e/auth/flow1-signup.cy.js
  - [faltante] cypress/e2e/auth/flow1-social-login.cy.js
  - [faltante] cypress/e2e/auth/flow1-password-reset.cy.js
  - [faltante] cypress/e2e/auth/flow1-verify-email.cy.js
  - [faltante] cypress/e2e/auth/auth-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Signup.jsx` -> apps/main-app/src/pages/Signup.jsx
  - `Login.jsx` -> apps/main-app/src/pages/Login.jsx
  - `ResetPassword.jsx` -> apps/main-app/src/pages/ResetPassword.jsx
  - `VerifyEmail.jsx` -> apps/main-app/src/pages/VerifyEmail.jsx
  - `useAuth.jsx` -> apps/main-app/src/hooks/useAuth.jsx
  - `SessionManager.jsx` -> apps/main-app/src/components/auth/SessionManager.jsx
  - `src/context/UserContext.jsx` -> apps/main-app/src/contexts/UserContext.jsx, apps/main-app/src/context/UserContext.jsx
  - `SocialLoginButtons.jsx` -> apps/main-app/src/components/auth/SocialLoginButtons.jsx
  - `RegisterForm.jsx` -> apps/main-app/src/components/auth/RegisterForm.jsx
  - `PasswordStrengthMeter.jsx` -> apps/main-app/src/components/auth/PasswordStrengthMeter.jsx
- **[roadmap/pending (doc)]**
  - - Instrumentar métricas (`signup_submit`, `social_signup`, `login_failed`, etc.) y revisar dashboards.
  - - Completar auditoría de accesibilidad y focus management en formularios y botones sociales.
  - - Retirar formularios legacy (`RegisterForm`/`SocialLogin` antiguos) y limpiar dependencias en rutas no utilizadas.
  - - 2025-10-08: `VerifyEmail`, `ResetPassword`, `CreateWeddingAI` y `GamificationPanel` usan el hook unificado (`useAuth`) y este expone `sendPasswordReset`.
  - - Homogeneizar manejo de errores Firebase → UI (mapa centralizado en `authErrorMapper`).
- **[checklist despliegue]**
  - - Variables Firebase (`VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY`).
  - - Configurar correo transactional (Mailgun) para reset/verify.
  - - Alta de credenciales OAuth (Google, Facebook, etc.) en Firebase Console y `.env`.

## 10. Gestión de Bodas Múltiples (estado 2025-10-16)

- **[archivo]** docs/flujos-especificos/flujo-10-gestion-bodas-multiples.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - Bodas.jsx, BodaDetalle.jsx, WeddingSelector.jsx, WeddingFormModal.jsx, useWedding context, seeding inicial (finanzas/tareas) al crear boda desde planner, componentes MultiWeddingSummary.jsx y WeddingPortfolioTable.jsx, tablero multi-boda con KPIs/filtros y encolado CRM (crmSyncQueue), y editor de permisos por módulo en BodaDetalle.jsx (modulePermissions).
- **[pendiente (doc)]**
  - worker CRM (procesar crmSyncQueue), activity feed/alertas multi-boda y suites E2E específicas para permisos/CRM.
- **[E2E specs]** 0/2 presentes
  - [faltante] cypress/e2e/weddings/multi-weddings-flow.cy.js
  - [faltante] cypress/e2e/weddings/wedding-team-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Worker CRM (procesamiento y reintentos), métricas de sincronización y alertas multi-boda.
  - - Activity feed con timeline consolidado y avisos en vivo.
  - - Suites E2E específicas para permisos por módulo y flujos CRM.
- **[checklist despliegue]**
  - - Reglas Firestore para `weddings`, `users/{uid}` (permisos por rol).
  - - Seeds y Cloud Functions idempotentes para nuevas bodas.
  - - Validar UI con >10 bodas (scroll, selector).
  - - QA de traducciones y copy en wizard.

## 11. Protocolo y Ceremonias (visión global)

- **[archivo]** docs/flujos-especificos/flujo-11-protocolo-ceremonias.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - integracion con registros civiles, generador de programas/QR, alertas en tiempo real y dashboard operativo para el dia B.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/protocolo/ceremony-tabs-flow.cy.js
- **[roadmap/pending (doc)]**
  - - Integración con registros civiles y APIs públicas para validar documentación automáticamente.  
  - - Generador de programas/QR a partir de momentos y timeline.  
  - - Alertas inteligentes en tiempo real (retrasos, clima adverso, tareas críticas).  
  - - Dashboard operativo para planners el día del evento.
  - > Consulta los enlaces 11A–11E para reglas de negocio, UX y pruebas específicas de cada módulo.

## 11A. Momentos Especiales de la Boda

- **[archivo]** docs/flujos-especificos/flujo-11a-momentos-especiales.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - campos avanzados (responsables, suppliers), drag&drop, alertas guiadas y destinatarios por momento.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/protocolo/protocolo-flows.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-11b-timeline-dia-b.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - migrar la persistencia a subcolección propia, exponer estado editable, habilitar drag&drop y alertas automáticas.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/protocolo/protocolo-flows.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-11c-checklist-ultima-hora.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - alertas sonoras/push para requisitos criticos y sincronizacion con el centro de notificaciones.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Alertas sonoras/notificaciones push para requisitos críticos.  
  - - Sincronización con centro de notificaciones.
- **[checklist despliegue]**
  - - Reglas Firestore para `ceremonyChecklist`.  
  - - Traducciones y etiquetas de categorías (ES/EN/FR).  
  - - Seeds actualizados (`scripts/seedTestDataForPlanner.js:352`) para mostrar ejemplo funcional.

## 11D. Guía de Documentación Legal

- **[archivo]** docs/flujos-especificos/flujo-11d-guia-documentacion-legal.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - ampliar el catalogo internacional, sincronizacion multiusuario y automatismos con la checklist legal.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/protocolo/protocolo-flows.cy.js
- **[roadmap/pending (doc)]**
  - - Tipos adicionales (simbólica, destino) y más países.  
  - - Desplegar variaciones completas por país: para cada combinación `tipo de ceremonia × país` se definen bloques (preparación, obtención, legalización), responsables, plazos sugeridos y alertas contextuales (ej. apostillas). La disposición se ajusta por jurisdicción sin depender de pestañas compartidas.
  - - Selector de país con memoria multiusuario: el país asignado automáticamente se almacena en `weddings/{id}/ceremony/legal.countryOrigin`, mientras que los overrides manuales se registran por usuario para evitar conflictos (`legalSettings/{uid}` con `preferredCountry` y timestamp).
  - - Sincronización multiusuario (guardar progreso en Firestore) y notas por requisito.  
  - - Instrumentación (`ceremony_document_guide_opened`) y automatismos en checklist (marcar estado).
  - - Catálogo global de requisitos mantenido en Firestore/Storage para cubrir certificados civiles, religiosos y especiales (ver sección de Datos y modelo).
- **[checklist despliegue]**
  - - Revisar contenidos por país y mantener enlaces actualizados.  
  - - Verificar traducciones y formato de fechas.  
  - - Confirmar que las plantillas existen en `docs/protocolo` y se exponen correctamente desde la UI.

## 11E. Ayuda a Lecturas y Votos

- **[archivo]** docs/flujos-especificos/flujo-11e-ayuda-textos-ceremonia.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - ampliar tabs dedicadas, control de versiones, integración IA y cobertura E2E para usuarios ayudantes.
- **[E2E specs]** 0/2 presentes
  - [faltante] cypress/e2e/email/smart-composer.cy.js
  - [faltante] cypress/e2e/email/ai-provider-email.cy.js
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

## 12. Notificaciones y Configuración (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-12-notificaciones-configuracion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Notificaciones.jsx`, `NotificationPreferences.jsx`, `NotificationWatcher.jsx`, `NotificationCenter.jsx` (scaffold), servicios `notificationService.js`, `notificationPreferencesService.js`, rutas backend `/api/notification-preferences`.
- **[pendiente (doc)]**
  - automatizaciones avanzadas (AutomationRules UI), notificaciones push/SMS completas y centro de notificaciones final.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/notifications/preferences-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Notificaciones.jsx` -> apps/main-app/src/pages/Notificaciones.jsx
  - `NotificationPreferences.jsx` -> apps/main-app/src/pages/NotificationPreferences.jsx
  - `NotificationWatcher.jsx` -> apps/main-app/src/components/notifications/NotificationWatcher.jsx
  - `NotificationCenter.jsx` -> apps/main-app/src/components/NotificationCenter.jsx, apps/main-app/src/components/notifications/NotificationCenter.jsx
  - `notificationService.js` -> backend/services/notificationService.js, apps/main-app/src/services/notificationService.js
  - `notificationPreferencesService.js` -> apps/main-app/src/services/notificationPreferencesService.js
  - `/api/notification-preferences` -> backend/routes/notification-preferences.js
- **[roadmap/pending (doc)]**
  - - Centro de notificaciones completo (agrupaciones, búsqueda).
  - - Automation rules UI (if-this-then-that).
  - - Integración multi-canal (SMS/push con configuración avanzada).
  - - Panel de auditoría y métricas ( CTR, canal favorito/efectividad ).
- **[checklist despliegue]**
  - - Reglas Firestore `notifications` y `notificationPreferences`.
  - - Configurar Mailgun/Twilio/FCM; validar push en navegadores.
  - - Revisar traducciones (todas las opciones en `NotificationSettings` y `NotificationPreferences`).

## 14. Checklist Avanzado (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-14-checklist-avanzado.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Checklist.jsx`, `Tasks.jsx`, `TaskSidePanel.jsx`, hook `useWeddingTasksHierarchy`, servicios `automationService.js` (basico).
- **[pendiente (doc)]**
  - generacion inteligente de checklists, dependencias avanzadas, gamificacion completa y plantillas compartidas por comunidad.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificacion de archivos implementados]**
  - `Checklist.jsx` -> apps/main-app/src/pages/Checklist.jsx, apps/main-app/src/pages/protocolo/Checklist.jsx
  - `Tasks.jsx` -> apps/main-app/src/pages/Tasks.css, apps/main-app/src/pages/Tasks.jsx, apps/main-app/src/i18n/locales/tr/tasks.json, apps/main-app/src/i18n/locales/sv/tasks.json, apps/main-app/src/i18n/locales/sl/tasks.json, apps/main-app/src/i18n/locales/sk/tasks.json, apps/main-app/src/i18n/locales/ru/tasks.json, apps/main-app/src/i18n/locales/ro/tasks.json, apps/main-app/src/i18n/locales/pt/tasks.json, apps/main-app/src/i18n/locales/pl/tasks.json, apps/main-app/src/i18n/locales/no/tasks.json, apps/main-app/src/i18n/locales/nl/tasks.json, apps/main-app/src/i18n/locales/mt/tasks.json, apps/main-app/src/i18n/locales/lv/tasks.json, apps/main-app/src/i18n/locales/lt/tasks.json, apps/main-app/src/i18n/locales/it/tasks.json, apps/main-app/src/i18n/locales/is/tasks.json, apps/main-app/src/i18n/locales/hu/tasks.json, apps/main-app/src/i18n/locales/hr/tasks.json, apps/main-app/src/i18n/locales/fr-CA/tasks.json, apps/main-app/src/i18n/locales/fr/tasks.json, apps/main-app/src/i18n/locales/fi/tasks.json, apps/main-app/src/i18n/locales/eu/tasks.json, apps/main-app/src/i18n/locales/et/tasks.json, apps/main-app/src/i18n/locales/es-MX/tasks.json, apps/main-app/src/i18n/locales/es-AR/tasks.json, apps/main-app/src/i18n/locales/es/tasks.json, apps/main-app/src/i18n/locales/en/tasks.json, apps/main-app/src/i18n/locales/el/tasks.json, apps/main-app/src/i18n/locales/de/tasks.json, apps/main-app/src/i18n/locales/da/tasks.json, apps/main-app/src/i18n/locales/cs/tasks.json, apps/main-app/src/i18n/locales/ca/tasks.json, apps/main-app/src/i18n/locales/bg/tasks.json, apps/main-app/src/i18n/locales/ar/tasks.json
  - `TaskSidePanel.jsx` -> apps/main-app/src/components/tasks/TaskSidePanel.jsx
  - `useWeddingTasksHierarchy` -> apps/main-app/src/hooks/useWeddingTasksHierarchy.js
  - `automationService.js` -> backend/services/automationService.js
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

## 15. Contratos y Documentos (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-15-contratos-documentos.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Contratos.jsx` (CRUD y modales integrados), dataset `contractTemplates.js`, servicios `SignatureService.js` (stub), `storageUploadService.js` para adjuntos y hooks `useFirestoreCollection` + `useProveedores` para wiring con proveedores.
- **[pendiente (doc)]**
  - firma digital integrada (DocuSign/HelloSign), workflows de aprobacion, analitica legal y compliance automatizado.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/contracts/contracts-flow.cy.js
- **[verificacion de archivos implementados]**
  - `Contratos.jsx` -> apps/main-app/src/pages/Contratos.jsx
  - `contractTemplates.js` -> apps/main-app/src/data/templates/contractTemplates.js
  - `SignatureService.js` -> backend/services/signatureService.js, apps/main-app/src/services/SignatureService.js
  - `storageUploadService.js` -> apps/main-app/src/services/storageUploadService.js
  - `useFirestoreCollection` -> apps/main-app/src/hooks/useFirestoreCollection.js
  - `useProveedores` -> apps/main-app/src/hooks/useProveedores.jsx
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

## 16. Asistente Virtual y Automatizaciones IA (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-16-asistente-virtual-ia.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - habilitar backend multicanal, reglas configurables, workers dedicados y cobertura E2E especifica.
- **[E2E specs]** 0/3 presentes
  - [faltante] cypress/e2e/email/ai-provider-email.cy.js
  - [faltante] cypress/e2e/email/smart-composer.cy.js
  - [faltante] cypress/e2e/assistant/chat-fallback-context.cy.js
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

## 17. Gamificacion y Progreso (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-17-gamificacion-progreso.md
- **[conclusion]** pendiente
- **[E2E specs]** 0/3 presentes
  - [faltante] cypress/e2e/gamification/gamification-progress-happy.cy.js
  - [faltante] cypress/e2e/gamification/gamification-milestone-unlock.cy.js
  - [faltante] cypress/e2e/gamification/gamification-history.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-18-generador-documentos-legales.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - formulario `DocumentosLegales.jsx` (consentimiento de uso de imagen) que genera un PDF local con jsPDF.
- **[pendiente (doc)]**
  - repositorio completo de plantillas, firma electrónica, almacenamiento backend y automatización IA.
- **[E2E specs]** 0/3 presentes
  - [faltante] cypress/e2e/protocolo/legal-docs-generator.cy.js
  - [faltante] cypress/e2e/protocolo/legal-docs-validation.cy.js
  - [faltante] cypress/e2e/protocolo/legal-docs-versioning.cy.js
- **[verificacion de archivos implementados]**
  - `DocumentosLegales.jsx` -> apps/main-app/src/pages/DocumentosLegales.jsx, apps/main-app/src/pages/protocolo/DocumentosLegales.jsx
- **[checklist despliegue]**
  - - Verificar compatibilidad jsPDF en navegadores soportados.
  - - Proveer plantillas actualizadas en cuanto haya repositorio legal.
  - - Revisar textos y traducciones.

## 19. Diseno de Invitaciones (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-19-diseno-invitaciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `InvitationDesigner.jsx`, `MisDisenos.jsx`, `VectorEditor.jsx`, `MenuCatering.jsx`, `PapelesNombres.jsx`, utils `pdfExport.js` y biblioteca de plantillas.
- **[pendiente (doc)]**
  - tutoriales guiados, colaboracion/feedback, integracion con proveedores de impresion y generacion IA.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/invitaciones_rsvp.cy.js
- **[verificacion de archivos implementados]**
  - `InvitationDesigner.jsx` -> apps/main-app/src/pages/InvitationDesigner.jsx
  - `MisDisenos.jsx` -> apps/main-app/src/pages/disenos/MisDisenos.jsx
  - `VectorEditor.jsx` -> apps/main-app/src/pages/disenos/VectorEditor.jsx, apps/main-app/src/components/VectorEditor.jsx
  - `MenuCatering.jsx` -> apps/main-app/src/pages/disenos/MenuCatering.jsx
  - `PapelesNombres.jsx` -> apps/main-app/src/pages/disenos/PapelesNombres.jsx
  - `pdfExport.js` -> apps/main-app/src/utils/pdfExport.js
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

- **[archivo]** docs/flujos-especificos/flujo-2-creacion-boda-ia.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAI.jsx` (wizard dos pasos), `src/pages/AyudaCeremonia.jsx` (copy dinámico), `src/pages/BodaDetalle.jsx` (perfil de evento), `src/context/WeddingContext.jsx`, servicios en `src/services/WeddingService.js` (createWedding, seedDefaultTasksForWedding), catálogo `src/config/eventStyles.js`.
- **[pendiente (doc)]**
  - habilitar opt-in a planner desde Perfil, paneles/alertas para la telemetría del funnel, refactor de rutas `/bodas`→`/eventos`, integración IA contextual y despliegue del flujo multi-evento para planners.
- **[E2E specs]** 0/2 presentes
  - [faltante] cypress/e2e/onboarding/create-event-flow.cy.js
  - [faltante] cypress/e2e/onboarding/create-event-cta.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/CreateWeddingAI.jsx` -> apps/main-app/src/pages/CreateWeddingAI.jsx
  - `src/pages/AyudaCeremonia.jsx` -> apps/main-app/src/pages/AyudaCeremonia.jsx, apps/main-app/src/pages/protocolo/AyudaCeremonia.jsx
  - `src/pages/BodaDetalle.jsx` -> apps/main-app/src/pages/BodaDetalle.jsx
  - `src/context/WeddingContext.jsx` -> apps/main-app/src/context/WeddingContext.jsx
  - `src/services/WeddingService.js` -> apps/main-app/src/services/WeddingService.js
  - `src/config/eventStyles.js` -> apps/main-app/src/config/eventStyles.js
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

## 2. Descubrimiento Personalizado de la Boda

- **[archivo]** docs/flujos-especificos/flujo-2-descubrimiento-personalizado.md
- **[conclusion]** desconocido
- **[E2E specs]** 0/2 presentes
  - [faltante] cypress/e2e/onboarding/discovery-personalized.cy.js
  - [faltante] cypress/e2e/onboarding/onboarding-mode-selector.cy.js

## 20. Buzon Interno y Estadisticas (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-20-email-inbox.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Buzon_fixed_complete.jsx` (legacy), `EmailInbox.jsx`, `EmailStatistics.jsx`, componentes `UnifiedInbox/InboxContainer.jsx`, `EmailComposer.jsx`, `EmailSetupForm.jsx`.
- **[pendiente (doc)]**
  - consolidar experiencia unica, documentar APIs backend, onboarding centralizado y telemetry completa.
- **[E2E specs]** 0/7 presentes
  - [faltante] cypress/e2e/email_inbox_smoke.cy.js
  - [faltante] cypress/e2e/email/read-email.cy.js
  - [faltante] cypress/e2e/email/send-email.cy.js
  - [faltante] cypress/e2e/email/folders-management.cy.js
  - [faltante] cypress/e2e/email/tags-filters.cy.js
  - [faltante] cypress/e2e/compose_quick_replies.cy.js
  - [faltante] cypress/e2e/email/smart-composer.cy.js
- **[verificacion de archivos implementados]**
  - `Buzon_fixed_complete.jsx` -> apps/main-app/src/pages/Buzon_fixed_complete.jsx
  - `EmailInbox.jsx` -> apps/main-app/src/pages/user/EmailInbox.jsx, apps/main-app/src/components/email/EmailInbox.jsx
  - `EmailStatistics.jsx` -> apps/main-app/src/pages/user/EmailStatistics.jsx
  - `UnifiedInbox/InboxContainer.jsx` -> apps/main-app/src/components/email/UnifiedInbox/InboxContainer.jsx
  - `EmailComposer.jsx` -> apps/main-app/src/components/email/EmailComposer.jsx
  - `EmailSetupForm.jsx` -> apps/main-app/src/components/email/EmailSetupForm.jsx
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

## 21. Sitio Público (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-21-sitio-publico.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `WeddingSite.jsx`, `PublicWedding.jsx`, artículos auxiliares (`SeatingPlanPost.jsx`, `MomentosEspecialesSimple.jsx`), integración con `websiteService` y contenido Firestore.
- **[pendiente (doc)]**
  - personalización avanzada desde panel, dominios personalizados, SEO/analytics y medición de conversión.
- **[E2E specs]** 0/3 presentes
  - [faltante] cypress/e2e/inspiration/inspiration-flow.cy.js
  - [faltante] cypress/e2e/inspiration_smoke.cy.js
  - [faltante] cypress/e2e/news/news-flow.cy.js
- **[verificacion de archivos implementados]**
  - `WeddingSite.jsx` -> apps/main-app/src/pages/WeddingSite.jsx
  - `PublicWedding.jsx` -> apps/main-app/src/pages/PublicWedding.jsx
  - `SeatingPlanPost.jsx` -> apps/main-app/src/pages/disenos/SeatingPlanPost.jsx
  - `MomentosEspecialesSimple.jsx` -> apps/main-app/src/pages/protocolo/MomentosEspecialesSimple.jsx
  - `websiteService` -> apps/main-app/src/services/websiteService.js
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

## 22. Navegación y Panel General (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-22-dashboard-navegacion.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `HomeUser.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnóstico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
- **[pendiente (doc)]**
  - unificar dashboard con métricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronización.
- **[verificacion de archivos implementados]**
  - `HomeUser.jsx` -> apps/main-app/src/pages/HomeUser.jsx
  - `Dashboard.jsx` -> apps/main-app/src/pages/Dashboard.jsx, apps/main-app/src/components/dashboard/Dashboard.jsx
  - `More.jsx` -> apps/main-app/src/pages/More.jsx
  - `Perfil.jsx` -> apps/main-app/src/pages/Perfil.jsx
  - `WidgetContent.jsx` -> apps/main-app/src/components/dashboard/WidgetContent.jsx
  - `DevEnsureFinance.jsx` -> apps/main-app/src/pages/DevEnsureFinance.jsx
  - `DevSeedGuests.jsx` -> apps/main-app/src/pages/DevSeedGuests.jsx
- **[roadmap/pending (doc)]**
  - - Dashboard modular con edicion drag-and-drop y biblioteca de widgets.
  - - Activity feed en tiempo real con filtros.
  - - Buscador global y comandos rápidos.
  - - Integracion con analytics para recomendaciones personalizadas.
  - - Panel de salud del sistema (sincronización, errores recientes).
- **[checklist despliegue]**
  - - Reglas Firestore para `dashboardConfig`, `activityFeed` (cuando se publique).
  - - Asegurar que herramientas dev esten desactivadas en produccion (`VITE_ENV` check).
  - - Revisar copy, links de soporte y recursos externos.
  - - Probar skeleton/loading states con datos grandes.

## 23. Metricas del Proyecto (estado 2025-10-14)

- **[archivo]** docs/flujos-especificos/flujo-23-metricas-proyecto.md
- **[conclusion]** desconocido
- **[E2E specs]** 0/5 presentes
  - [faltante] cypress/e2e/performance/email-performance.cy.js
  - [faltante] cypress/e2e/finance/finance-analytics.cy.js
  - [faltante] cypress/e2e/gamification/gamification-history.cy.js
  - [faltante] cypress/e2e/budget_flow.cy.js
  - [faltante] cypress/e2e/finance/finance-flow-full.cy.js
- **[checklist despliegue]**
  - - Backend: exponer `/api/project-metrics` (GET agregados, POST ingest) protegido por roles (owner, planner, admin, soporte) y habilitar `metricAggregatorWorker` en cron. Ver plan detallado en `docs/panel-admin/metricAggregatorWorker-plan.md`.
  - - Configurar `VITE_METRICS_ENDPOINT` y variables adicionales (`VITE_ENABLE_EMAIL_ANALYZE`, `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_*`) para garantizar fuentes completas.
  - - Verificar reglas de seguridad para colecciones citadas (emailMetrics, finance, gamification, analytics/websiteEvents, publicSites, tasks, contracts, inspirationWall, blogCache).
  - - Asegurar que `performanceMonitor.setUserContext` se invoca desde `useAuth` y `WeddingContext` antes de habilitar reportes multiusuario.
  - - Documentar en runbook la respuesta a fallos de ingest (reintentos, colas pendientes, mute de alertas).

## 24. Inspiracion Visual Unificada (estado 2025-10-12)

- **[archivo]** docs/flujos-especificos/flujo-24-galeria-inspiracion.md
- **[conclusion]** pendiente
- **[E2E specs]** 0/4 presentes
  - [faltante] cypress/e2e/inspiration/inspiration-gallery.cy.js
  - [faltante] cypress/e2e/inspiration/inspiration-home-gallery.cy.js
  - [faltante] cypress/e2e/inspiration/inspiration-save-board.cy.js
  - [faltante] cypress/e2e/inspiration/inspiration-share.cy.js
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

## 25. Planes y Suscripciones (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-25-suscripciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - documentación estratégica inicial y catálogo de planes en `docs/planes-suscripcion.md`.
- **[pendiente (doc)]**
  - implementación técnica del cobro único por boda, automatizaciones de upgrade/downgrade, telemetría operativa y paneles de rentabilidad.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/subscriptions/subscription-flow.cy.js
- **[verificacion de archivos implementados]**
  - `docs/planes-suscripcion.md` -> docs/planes-suscripcion.md
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

## 26. Blog IA MaLove.App (estado 2025-10-29)

- **[archivo]** docs/flujos-especificos/flujo-26-blog.md
- **[conclusion]** desconocido
- **[checklist despliegue]**
  - 1. Variables de entorno: `OPENAI_API_KEY`, `TAVILY_API_KEY`, `BLOG_AUTOMATION_*`, `BLOG_COVER_STORAGE_BUCKET` (opcional), `BLOG_SUPPORTED_LANGUAGES` (lista CSV, por defecto `es,en,fr`). Verificar bucket existe.
  - 2. Reglas Firestore/Storage: permitir escritura controlada en `blogPosts`, `blogEditorialPlan`, `blog/covers/*` solo al backend admin. Lectura pública solo `status=published`.
  - 3. Índices: `blogPosts status+generatedAt`, `blogPosts status+publishedAt`, `blogPosts availableLanguages+publishedAt`, `blogEditorialPlan status+date`.
  - 4. Logs/monitoring: habilitar alertas de worker, revisar volumen de Tavily/OpenAI.
  - 5. i18n: confirmar traducciones en `src/i18n/locales/*/common.json` (`blog`, `adminBlog` keys).
  - 6. Limpieza: eliminar agregador RSS legacy (`fetchWeddingNews`), o mantener redirección temporal para Home si se desea fallback.

## 27. Momentos (Álbum Compartido) — estado 2025-10-24

- **[archivo]** docs/flujos-especificos/flujo-27-momentos.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - reforzar métricas y observabilidad, además de endurecer la experiencia QR pública.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/moments/moments-empty-state.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-28-dashboard-planner.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `HomePage.jsx` (deriva a `PlannerDashboard.jsx` para planners), `PlannerDashboard.jsx`, `WeddingContext.jsx`, `useFirestoreCollection.js`, `useWeddingCollection.js`, navegación planner en `Nav.jsx`, portfolio multi-boda en `Bodas.jsx`.
- **[pendiente (doc)]**
  - poblar métricas de alertas/inspiración/blog, sincronizar recuentos con Firestore en tiempo real y reforzar UX cuando no exista boda activa.
- **[E2E specs]** 0/4 presentes
  - [faltante] cypress/e2e/dashboard/diagnostic-panel.cy.js
  - [faltante] cypress/e2e/dashboard/global-search-shortcuts.cy.js
  - [faltante] cypress/e2e/dashboard/main-navigation.cy.js
  - [faltante] cypress/e2e/dashboard/planner-dashboard.cy.js
- **[verificacion de archivos implementados]**
  - `HomePage.jsx` -> apps/main-app/src/components/HomePage.jsx
  - `PlannerDashboard.jsx` -> apps/main-app/src/components/PlannerDashboard.jsx
  - `PlannerDashboard.jsx` -> apps/main-app/src/components/PlannerDashboard.jsx
  - `WeddingContext.jsx` -> apps/main-app/src/context/WeddingContext.jsx
  - `useFirestoreCollection.js` -> apps/main-app/src/hooks/useFirestoreCollection.js
  - `useWeddingCollection.js` -> apps/main-app/src/hooks/useWeddingCollection.js
  - `Nav.jsx` -> apps/main-app/src/components/Nav.jsx
  - `Bodas.jsx` -> apps/main-app/src/pages/Bodas.jsx

## 29. Upgrade de Rol (Owner → Assistant → Planner) (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-29-upgrade-roles.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - selector de rol en registro (`src/components/auth/RegisterForm.jsx:56`), persistencia local del rol en `useAuth` (`src/hooks/useAuth.jsx:180`, `src/hooks/useAuth.jsx:593`), navegación y dashboard condicionados por rol (`src/components/Nav.jsx:29`, `src/components/HomePage.jsx:77`), vínculos de bodas por rol en `WeddingService` (`src/services/WeddingService.js:144`, `src/services/WeddingService.js:487`, `src/services/WeddingService.js:510`), invitaciones desde `WeddingAccountLink.jsx:59` y aceptación `WeddingAccountLink.jsx:79`.
- **[pendiente (doc)]**
  - flujo unificado de upgrade con checkout de plan, sincronización Firestore/localStorage del nuevo rol, límites de bodas por plan, degradación automática al expirar el plan y panel de gestión para revertir cambios.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/account/role-upgrade-flow.cy.js
- **[verificacion de archivos implementados]**
  - `src/components/auth/RegisterForm.jsx:56` -> apps/main-app/src/components/auth/RegisterForm.jsx
  - `useAuth` -> apps/main-app/src/hooks/useAuth.jsx
  - `src/hooks/useAuth.jsx:180` -> apps/main-app/src/hooks/useAuth.jsx
  - `src/hooks/useAuth.jsx:593` -> apps/main-app/src/hooks/useAuth.jsx
  - `src/components/Nav.jsx:29` -> apps/main-app/src/components/Nav.jsx
  - `src/components/HomePage.jsx:77` -> apps/main-app/src/components/HomePage.jsx
  - `WeddingService` -> apps/main-app/src/services/WeddingService.js
  - `src/services/WeddingService.js:144` -> apps/main-app/src/services/WeddingService.js
  - `src/services/WeddingService.js:487` -> apps/main-app/src/services/WeddingService.js
  - `src/services/WeddingService.js:510` -> apps/main-app/src/services/WeddingService.js
  - `WeddingAccountLink.jsx:59` -> apps/main-app/src/components/settings/WeddingAccountLink.jsx
  - `WeddingAccountLink.jsx:79` -> apps/main-app/src/components/settings/WeddingAccountLink.jsx

## 2B. Asistente Conversacional para Crear Bodas/Eventos · estado 2025-10-11

- **[archivo]** docs/flujos-especificos/flujo-2b-creacion-boda-asistente.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/CreateWeddingAssistant.jsx`, `src/context/WeddingContext.jsx`, `src/config/eventStyles.js`, servicios en `src/services/WeddingService.js` (createWedding, seedDefaultTasksForWedding).
- **[pendiente (doc)]**
  - telemetría dedicada, iterar prompts/UX, habilitar múltiples rondas IA y consolidar con flujo clásico.
- **[E2E specs]** 0/4 presentes
  - [faltante] cypress/e2e/onboarding/assistant-conversation-happy.cy.js
  - [faltante] cypress/e2e/onboarding/assistant-context-switch.cy.js
  - [faltante] cypress/e2e/onboarding/assistant-followups.cy.js
  - [faltante] cypress/e2e/onboarding/create-event-assistant.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/CreateWeddingAssistant.jsx` -> apps/main-app/src/pages/CreateWeddingAssistant.jsx
  - `src/context/WeddingContext.jsx` -> apps/main-app/src/context/WeddingContext.jsx
  - `src/config/eventStyles.js` -> apps/main-app/src/config/eventStyles.js
  - `src/services/WeddingService.js` -> apps/main-app/src/services/WeddingService.js
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

- **[archivo]** docs/flujos-especificos/flujo-2c-personalizacion-continua.md
- **[conclusion]** desconocido
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/personalization/personalization-preferences.cy.js

## 3. Gestión de Invitados (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-3-gestion-invitados.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, dataset demo (carga de ejemplos en `useGuests.js`) y panel analítico RSVP.
- **[pendiente (doc)]**
  - sincronización completa con Seating Plan (persistencia bidireccional) y automatizaciones IA reactivas a cambios de invitados.
- **[E2E specs]** 0/3 presentes
  - [faltante] cypress/e2e/guests/guest-segment-sync.cy.js
  - [faltante] cypress/e2e/guests/guest-whatsapp-flow.cy.js
  - [faltante] cypress/e2e/guests/guest-import.cy.js
- **[verificacion de archivos implementados]**
  - `Invitados.jsx` -> apps/main-app/src/pages/Invitados.jsx
  - `RSVPDashboard.jsx` -> apps/main-app/src/pages/RSVPDashboard.jsx
  - `AcceptInvitation.jsx` -> apps/main-app/src/pages/AcceptInvitation.jsx
  - `GuestEventBridge.jsx` -> apps/main-app/src/components/guests/GuestEventBridge.js, apps/main-app/src/components/guests/GuestEventBridge.jsx
  - `GuestList` -> apps/main-app/src/components/guests/GuestList.jsx
  - `GuestFilters` -> apps/main-app/src/components/guests/GuestFilters.jsx
  - `GuestForm` -> apps/main-app/src/components/guests/GuestForm.jsx
  - `GuestBulkGrid` -> apps/main-app/src/components/guests/GuestBulkGrid.jsx
  - `ContactsImporter` -> apps/main-app/src/components/guests/ContactsImporter.jsx
  - `GroupManager` -> apps/main-app/src/components/guests/GroupManager.jsx
  - `WhatsAppModal` -> apps/main-app/src/components/whatsapp/WhatsAppModal.jsx
  - `WhatsAppSender` -> apps/main-app/src/components/whatsapp/WhatsAppSender.jsx
  - `SaveTheDateModal` -> apps/main-app/src/components/whatsapp/SaveTheDateModal.jsx
  - `InviteTemplateModal` -> apps/main-app/src/components/whatsapp/InviteTemplateModal.jsx
  - `useGuests` -> apps/main-app/src/hooks/useGuests.js
  - `SyncService` -> apps/main-app/src/services/SyncService.js
  - `MessageTemplateService` -> apps/main-app/src/services/MessageTemplateService.js
  - `whatsappService` -> backend/services/whatsappService.js, apps/main-app/src/services/whatsappService.js
  - `WhatsAppBatchService` -> apps/main-app/src/services/WhatsAppBatchService.js
  - `useGuests.js` -> apps/main-app/src/hooks/useGuests.js
- **[roadmap/pending (doc)]**
  - ### 🔍 ESTADO REAL VERIFICADO (2025-10-24)
  - **Implementación: ✅ 95%** | **Cobertura E2E: 🟡 65%**
  - **✅ IMPLEMENTADO Y FUNCIONAL:**
  - 1. **CRUD Completo de Invitados** ✅
  -    - `src/pages/Invitados.jsx` ✅
  -    - `src/components/guests/GuestList.jsx` ✅
  -    - `src/components/guests/GuestForm.jsx` ✅
  -    - `src/hooks/useGuests.js` ✅
  - 2. **Importación Masiva** ✅
  -    - `src/components/guests/ContactsImporter.jsx` ✅
  -    - `src/components/guests/GuestBulkGrid.jsx` ✅
  -    - Soporta CSV/Excel, Contact Picker API
  -    - Deduplicación por email/teléfono
  - 3. **WhatsApp Batch Messaging** ✅
  -    - `src/services/whatsappService.js` ✅
  -    - `src/components/guests/WhatsAppModal.jsx` ✅
  -    - `src/services/WhatsAppBatchService.js` ✅
  -    - Programación de envíos
  -    - Límite 250 mensajes por lote
  - 4. **RSVP Tracking** ✅
  -    - `src/pages/RSVPDashboard.jsx` ✅
  -    - Dashboard con métricas
  -    - Estados: pending/confirmed/declined
  - 5. **Grupos y Asignación** ✅
  -    - `src/components/guests/GroupManager.jsx` ✅
  -    - Gestión de grupos
  -    - Asignación de mesa básica
  - 6. **Offline-First** ✅
  -    - Sincronización con localStorage
  -    - `src/services/SyncService.js` ✅
  -    - Eventos `MaLove.App-guests-updated`
  - 7. **Tests E2E** 🟡
  -    - `cypress/e2e/guests/` (4 archivos)
  -    - `cypress/e2e/critical/guests.cy.js` ✅
  -    - `cypress/e2e/critical/guests-real.cy.js` ✅
  -    - Cobertura: ~65% (tests básicos)
  - **🟡 PARCIALMENTE IMPLEMENTADO:**
  - 1. **Integración Seating Bidireccional** 🟡
  -    - Asignación a mesa: ✅ Funciona
  -    - Sincronización bidireccional: ❌ Pendiente
  -    - Campo `seatAssignment` existe pero no se sincroniza automáticamente
  -    - Estimación: 8-12 horas
  - 2. **Manejo Defensivo de Hooks** 🟡
  -    - Página usa valores mock para estabilidad (decisión temporal)
  -    - Try-catch implementado pero hooks deshabilitados
  -    - Reintegración gradual pendiente
  - **❌ NO IMPLEMENTADO:**
  - 1. **IA para Agrupar Invitados** ❌
  -    - Sugerencias automáticas de grupos ❌
  -    - Mensajes personalizados con IA ❌
  -    - Estimación: 15-20 horas
  - 2. **Mensajería Omnicanal** ❌
  -    - SMS/push orquestada ❌
  -    - Automatizaciones avanzadas ❌
  -    - Estimación: 20-30 horas
  - 3. **Portal Colaborador** ❌
  -    - Permisos restringidos ❌
  -    - Vista externa ❌
  -    - Estimación: 30-40 horas
  - 4. **Sincronización CRM Externo** ❌
  -    - Integración CRM ❌
  -    - Estimación: 25-35 horas
  - **⚠️ TESTS FALTANTES:**
  - 1. **WhatsApp Service** ❌
  -    - `whatsappService.js` sin tests E2E
  -    - `WhatsAppBatchService.js` sin tests
  -    - Estimación tests: 4 horas
  - 2. **Importación Masiva** 🟡
  -    - Tests parciales en `guests-import.cy.js`
  -    - Falta cobertura completa
  -    - Estimación: 3 horas
  - 3. **Grupos** ❌
  -    - `GroupManager.jsx` sin tests
  -    - Estimación: 3 horas
  - ### Pendientes Priorizados:
  - **Corto Plazo (1-2 semanas):**
  - - ⏳ Sincronización bidireccional Seating (8-12h)
  - - ⏳ Tests WhatsApp service (4h)
  - - ⏳ Tests importación completa (3h)
  - **Medio Plazo (1-2 meses):**
  - - ⏳ IA para agrupar invitados (15-20h)
  - - ⏳ Mensajería omnicanal (20-30h)
  - **Largo Plazo (3-6 meses):**
  - - ⏳ Portal colaborador (30-40h)
  - - ⏳ Sincronización CRM (25-35h)
- **[checklist despliegue]**
  - - Revisar reglas Firestore (`guests`, `guestMessages`, `guestImports`, `guestSegments`).
  - - Configurar proveedores (WhatsApp API, Mailgun) y plantillas (`MessageTemplateService`).
  - - Validar cuotas/métricas (`guestMetrics`, `rsvpStats`) y endpoints (`/api/whatsapp/*`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`).
  - - Ejecutar seeds QA (`window.__GUESTS_TEST_API__` → `loadFixture`).

## 30. Página de inicio (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-30-pagina-inicio.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/HomeUser.jsx`, `src/components/HomePage.jsx`, `Nav.jsx`, `ProviderSearchModal.jsx`, `useFinance`, servicios en `src/services/blogService.js` y `src/services/wallService.js`.
- **[pendiente (doc)]**
  - reemplazar datos mock/localStorage por orígenes reales, unificar con `Dashboard.jsx`, instrumentar telemetría de interacción y ocultar helpers de desarrollo en producción.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/home/home-greeting-names.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/HomeUser.jsx` -> apps/main-app/src/pages/HomeUser.jsx
  - `src/components/HomePage.jsx` -> apps/main-app/src/components/HomePage.jsx
  - `Nav.jsx` -> apps/main-app/src/components/Nav.jsx
  - `ProviderSearchModal.jsx` -> apps/main-app/src/components/ProviderSearchModal.jsx
  - `useFinance` -> apps/main-app/src/hooks/useFinance.js
  - `src/services/blogService.js` -> apps/main-app/src/services/blogService.js
  - `src/services/wallService.js` -> apps/main-app/src/services/wallService.js
- **[roadmap/pending (doc)]**
  - - Reemplazar fuentes `localStorage` por datos sincronizados (Firestore/REST) y estados compartidos vía contextos.
  - - Unificar Home con `Dashboard.jsx` (Flujo 22) y permitir configuración de widgets.
  - - Añadir resumen de actividad reciente y próximos hitos (tareas, pagos, invitados).
  - - Implementar buscador global accesible (atajo Cmd/Ctrl+K) y recomendaciones IA.
- **[checklist despliegue]**
  - - Envolver botón "Rehacer tutorial" tras feature flag (`VITE_ENABLE_DEV_TOOLS` o similar).
  - - Confirmar traducciones `i18n` para textos nuevos (progress, acciones, cards).
  - - Asegurar que `fetchWeddingNews` y `fetchWall` cuenten con mocks en ambientes de prueba.
  - - Verificar estilos CSS variables (`--color-*`) en temas claro/oscuro.

## 31. Estilo Global (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-31-estilo-global.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - reutilizar `weddings/{id}/branding/main.palette` en los generadores (web, invitaciones, assets), sincronizar cambios de `MaLove.AppProfile` con Firestore sin depender de eventos locales y exponer UI dedicada para editar estilo global dentro de `/perfil`.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/style/style-global.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-4-invitados-operativa.md
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
  - - Revisar reglas Firestore (`seating`, `seatingHistory`, `seatingLocks`, `seatingPresence`).
  - - Validar seeds y límites (mesas, invitados) para rendimiento y uso de auto-assign.
  - - Testear exportes (PDF/SVG/CSV/PNG) con presets y tamaño de archivos.
  - - Verificar experiencia móvil/desktop: márgenes, paneles, persistencia de toggles, contraste.
  - - Automatizar backups periódicos de `seating` + `seatingHistory` para auditoría.

## 5b. Timeline y Tareas (estado 2025-10-07)

- **[archivo]** docs/flujos-especificos/flujo-5-timeline-tareas.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `Tasks.jsx`, `TaskSidePanel.jsx`, `Checklist.jsx`, `TaskList.jsx`, `EventsCalendar.jsx`, `LongTermTasksGantt.jsx`, `CalendarSync.jsx`, `TaskEventBridge.jsx`, `TaskNotificationWatcher.jsx`, `TasksRefactored.jsx`, hook `useWeddingTasksHierarchy.js`, `CalendarComponents.jsx`, plantilla `apps/main-app/src/data/tasks/masterTimelineTemplate.json`, indicadores de riesgo en el Gantt y comentarios colaborativos con menciones y notificaciones en `TaskSidePanel.jsx`.
- **[pendiente (doc)]**
  - Motor IA que personaliza un plan de tareas padre/subtareas a partir de una plantilla maestra y matriz de responsabilidades.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/tasks/all_subtasks_modal.cy.js
- **[verificacion de archivos implementados]**
  - `Tasks.jsx` -> apps/main-app/src/pages/Tasks.css, apps/main-app/src/pages/Tasks.jsx, apps/main-app/src/i18n/locales/tr/tasks.json, apps/main-app/src/i18n/locales/sv/tasks.json, apps/main-app/src/i18n/locales/sl/tasks.json, apps/main-app/src/i18n/locales/sk/tasks.json, apps/main-app/src/i18n/locales/ru/tasks.json, apps/main-app/src/i18n/locales/ro/tasks.json, apps/main-app/src/i18n/locales/pt/tasks.json, apps/main-app/src/i18n/locales/pl/tasks.json, apps/main-app/src/i18n/locales/no/tasks.json, apps/main-app/src/i18n/locales/nl/tasks.json, apps/main-app/src/i18n/locales/mt/tasks.json, apps/main-app/src/i18n/locales/lv/tasks.json, apps/main-app/src/i18n/locales/lt/tasks.json, apps/main-app/src/i18n/locales/it/tasks.json, apps/main-app/src/i18n/locales/is/tasks.json, apps/main-app/src/i18n/locales/hu/tasks.json, apps/main-app/src/i18n/locales/hr/tasks.json, apps/main-app/src/i18n/locales/fr-CA/tasks.json, apps/main-app/src/i18n/locales/fr/tasks.json, apps/main-app/src/i18n/locales/fi/tasks.json, apps/main-app/src/i18n/locales/eu/tasks.json, apps/main-app/src/i18n/locales/et/tasks.json, apps/main-app/src/i18n/locales/es-MX/tasks.json, apps/main-app/src/i18n/locales/es-AR/tasks.json, apps/main-app/src/i18n/locales/es/tasks.json, apps/main-app/src/i18n/locales/en/tasks.json, apps/main-app/src/i18n/locales/el/tasks.json, apps/main-app/src/i18n/locales/de/tasks.json, apps/main-app/src/i18n/locales/da/tasks.json, apps/main-app/src/i18n/locales/cs/tasks.json, apps/main-app/src/i18n/locales/ca/tasks.json, apps/main-app/src/i18n/locales/bg/tasks.json, apps/main-app/src/i18n/locales/ar/tasks.json
  - `TaskSidePanel.jsx` -> apps/main-app/src/components/tasks/TaskSidePanel.jsx
  - `Checklist.jsx` -> apps/main-app/src/pages/Checklist.jsx, apps/main-app/src/pages/protocolo/Checklist.jsx
  - `TaskList.jsx` -> apps/main-app/src/components/tasks/TaskList.jsx
  - `EventsCalendar.jsx` -> apps/main-app/src/components/tasks/EventsCalendar.jsx
  - `LongTermTasksGantt.jsx` -> apps/main-app/src/components/tasks/LongTermTasksGantt.jsx
  - `CalendarSync.jsx` -> apps/main-app/src/components/tasks/CalendarSync.jsx
  - `TaskEventBridge.jsx` -> apps/main-app/src/components/tasks/TaskEventBridge.js, apps/main-app/src/components/tasks/TaskEventBridge.jsx
  - `TaskNotificationWatcher.jsx` -> apps/main-app/src/components/tasks/TaskNotificationWatcher.js, apps/main-app/src/components/tasks/TaskNotificationWatcher.jsx
  - `TasksRefactored.jsx` -> apps/main-app/src/components/tasks/TasksRefactored.jsx
  - `useWeddingTasksHierarchy.js` -> apps/main-app/src/hooks/useWeddingTasksHierarchy.js
  - `CalendarComponents.jsx` -> apps/main-app/src/components/tasks/CalendarComponents.jsx
  - `apps/main-app/src/data/tasks/masterTimelineTemplate.json` -> apps/main-app/src/data/tasks/masterTimelineTemplate.json
  - `TaskSidePanel.jsx` -> apps/main-app/src/components/tasks/TaskSidePanel.jsx
- **[roadmap/pending (doc)]**
  - - IA que genere plan de tareas padre/subtareas personalizado (plantilla maestra + reglas LLM).
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

## 6. Gestion de Presupuesto (estado 2025-10-08)

- **[archivo]** docs/flujos-especificos/flujo-6-presupuesto.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
- **[pendiente (doc)]**
  - importación CSV/Excel con mapeo, analítica predictiva con IA, ampliación de aportaciones colaborativas, reportes exportables y automatización de alertas avanzadas.
- **[E2E specs]** 0/8 presentes
  - [faltante] cypress/e2e/finance/finance-flow.cy.js
  - [faltante] cypress/e2e/finance/finance-flow-full.cy.js
  - [faltante] cypress/e2e/finance/finance-budget.cy.js
  - [faltante] cypress/e2e/finance/finance-transactions.cy.js
  - [faltante] cypress/e2e/finance/finance-contributions.cy.js
  - [faltante] cypress/e2e/finance/finance-analytics.cy.js
  - [faltante] cypress/e2e/budget_flow.cy.js
  - [faltante] cypress/e2e/finance/finance-advisor-chat.cy.js
- **[verificacion de archivos implementados]**
  - `src/pages/Finance.jsx` -> backend/routes/finance.js, apps/main-app/src/pages/Finance.jsx, apps/main-app/src/i18n/locales/tr/finance.json, apps/main-app/src/i18n/locales/sv/finance.json, apps/main-app/src/i18n/locales/sl/finance.json, apps/main-app/src/i18n/locales/sk/finance.json, apps/main-app/src/i18n/locales/ru/finance.json, apps/main-app/src/i18n/locales/ro/finance.json, apps/main-app/src/i18n/locales/pt/finance.json, apps/main-app/src/i18n/locales/pl/finance.json, apps/main-app/src/i18n/locales/no/finance.json, apps/main-app/src/i18n/locales/nl/finance.json, apps/main-app/src/i18n/locales/mt/finance.json, apps/main-app/src/i18n/locales/lv/finance.json, apps/main-app/src/i18n/locales/lt/finance.json, apps/main-app/src/i18n/locales/it/finance.json, apps/main-app/src/i18n/locales/is/finance.json, apps/main-app/src/i18n/locales/hu/finance.json, apps/main-app/src/i18n/locales/hr/finance.json, apps/main-app/src/i18n/locales/fr-CA/finance.json, apps/main-app/src/i18n/locales/fr/finance.json, apps/main-app/src/i18n/locales/fi/finance.json, apps/main-app/src/i18n/locales/eu/finance.json, apps/main-app/src/i18n/locales/et/finance.json, apps/main-app/src/i18n/locales/es-MX/finance.json, apps/main-app/src/i18n/locales/es-AR/finance.json, apps/main-app/src/i18n/locales/es/finance.json, apps/main-app/src/i18n/locales/en/finance.json, apps/main-app/src/i18n/locales/el/finance.json, apps/main-app/src/i18n/locales/de/finance.json, apps/main-app/src/i18n/locales/da/finance.json, apps/main-app/src/i18n/locales/cs/finance.json, apps/main-app/src/i18n/locales/ca/finance.json, apps/main-app/src/i18n/locales/bg/finance.json, apps/main-app/src/i18n/locales/ar/finance.json
  - `src/components/finance/BudgetManager.jsx` -> apps/main-app/src/components/finance/BudgetManager.jsx
  - `FinanceOverview.jsx` -> apps/main-app/src/components/finance/FinanceOverview.jsx
  - `FinanceCharts.jsx` -> apps/main-app/src/components/finance/FinanceCharts.jsx
  - `PaymentSuggestions.jsx` -> apps/main-app/src/components/finance/PaymentSuggestions.jsx
  - `TransactionManager.jsx` -> apps/main-app/src/components/finance/TransactionManager.jsx
  - `useFinance` -> apps/main-app/src/hooks/useFinance.js
  - `useSupplierBudgets` -> apps/main-app/src/hooks/useSupplierBudgets.js
  - `EmailInsightsService` -> apps/main-app/src/services/EmailInsightsService.js
  - `bankService` -> apps/main-app/src/services/bankService.js
  - `SyncService` -> apps/main-app/src/services/SyncService.js
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

## 7. Comunicaciones y Email (estado 2025-10-13)

- **[archivo]** docs/flujos-especificos/flujo-7-comunicacion-emails.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - cableado de busqueda/ordenacion secundario en `UnifiedInbox/EmailList.jsx`, onboarding con validaciones DKIM/SPF, persistencia server-side de auto-respuestas y migracion definitiva del buzon legacy + actualizacion de pruebas E2E/VTU a la nueva UI.
- **[E2E specs]** 0/14 presentes
  - [faltante] cypress/e2e/email/send-email.cy.js
  - [faltante] cypress/e2e/email/read-email.cy.js
  - [faltante] cypress/e2e/email/folders-management.cy.js
  - [faltante] cypress/e2e/email/tags-filters.cy.js
  - [faltante] cypress/e2e/email/smart-composer.cy.js
  - [faltante] cypress/e2e/email/ai-provider-email.cy.js
  - [faltante] cypress/e2e/compose_quick_replies.cy.js
  - [faltante] cypress/e2e/email_inbox_smoke.cy.js
  - [faltante] cypress/e2e/email/read-email-attachments.cy.js
  - [faltante] cypress/e2e/email/read-email-list.cy.js
  - [faltante] cypress/e2e/email/read-email-open.cy.js
  - [faltante] cypress/e2e/email/read-email-unread-status.cy.js
  - [faltante] cypress/e2e/email/send-email-attachment.cy.js
  - [faltante] cypress/e2e/email/send-email-validation.cy.js
- **[roadmap/pending (doc)]**
  - ### 🔍 ESTADO REAL VERIFICADO (2025-10-24)
  - **✅ IMPLEMENTADO Y FUNCIONAL:**
  - 1. **emailSchedulerCron** - `backend/jobs/emailSchedulerCron.js` ✅
  -    - Código completo con `runEmailSchedulerJob()`
  -    - Exporta función ejecutable manualmente o vía cron
  -    - Integrado con `processScheduledEmailQueue`
  -    - ⚠️ FALTA: Configurar en Cloud Scheduler/Render Cron para ejecución automática
  - 2. **emailTrashRetention** - `backend/jobs/emailTrashRetention.js` ✅
  -    - Job de limpieza automática implementado
  -    - Elimina emails con más de 30 días en papelera
  -    - Auditoría en colección `emailRetentionAudit`
  -    - ⚠️ FALTA: Configurar cron diario (0 2 * * *)
  - 3. **onMailUpdated Cloud Function** - `functions/index.js:23-97` ✅
  -    - Actualiza contadores de carpetas automáticamente
  -    - Maneja cambios en folder y estado read
  -    - Colección `emailFolderStats` con totalCount y unreadCount
  -    - Función auxiliar `updateFolderCount()` completa
  - 4. **Webhooks Mailgun** - `backend/routes/mailgun-webhook.js` ✅
  -    - Endpoint `/webhooks/deliverability` funcional
  -    - Verificación de firma Mailgun implementada
  -    - Registro de eventos básicos
  - **✅ IMPLEMENTADO (CORRECCIÓN):**
  - 1. **callClassificationAPI** ✅ - `backend/services/emailClassificationService.js`
  -    - **Estado:** EXISTE Y FUNCIONAL (351 líneas)
  -    - Clasificación con OpenAI GPT-4o-mini
  -    - Fallback heurístico local
  -    - 8 categorías: Proveedor, Invitado, Finanzas, Contratos, Facturas, Reuniones, RSVP, General
  -    - Métricas y auditoría completa
  -    - **Nota:** Error en análisis anterior - esta funcionalidad SÍ está implementada con OpenAI para clasificación
  -    - La documentación marcaba esto como "✅ 2025-10-20" INCORRECTAMENTE
  -    - Impacto: Clasificación solo usa heurísticas locales básicas
  - **🟡 PARCIALMENTE IMPLEMENTADO:**
  - 1. **Auto-respuestas sincronización**
  -    - Backend endpoints: `GET/PUT /api/email-automation/config` ✅
  -    - Persistencia en Firestore ✅
  -    - Frontend aún usa localStorage como primario 🟡
  - ### Roadmap Actualizado:
  - 1. **Automatización y backend (Owner: Backend Squad)**
  -    - ⏳ PENDIENTE: callClassificationAPI con OpenAI (estimado: 8-12h)
  -    - ✅ CÓDIGO LISTO: emailSchedulerCron (solo falta configurar cron externo)
  -    - ✅ CÓDIGO LISTO: emailTrashRetention (solo falta configurar cron diario)
  -    - ✅ IMPLEMENTADO: onMailUpdated Cloud Function
  -    - 🟡 MEJORAR: Webhooks Mailgun (completar procesamiento de deliverability)
  - 2. **UX / funcionalidad (Owner: Frontend Squad, ETA Q1 2026)**
  -    - Drag & drop y reorder de carpetas personalizadas con sincronización emailFolderStats.
  -    - Papelera avanzada: restaurar carpeta original, métricas de retención y vaciado masivo.
  -    - Búsqueda/orden integrados en estado global y backend (GET /api/mail).
  -    - Toggle de buzón legacy solo soporte y plan de retirada.
  -    - Onboarding completo con validación DKIM/SPF y correo de prueba automatizado.
  - 3. **Analítica y monitoreo (Owner: Data/Analytics, ETA Q1 2026)**
  -    - Dashboard Grafana/BigQuery con KPIs (deliverySuccess, openRate, 
  - eplyTimeMedian, utoReplyCoverage, iaAdoption, cleanupRate).
  -    - Alertas automáticas: rebotes >5% diario, complained >0.5%, SLA respuesta >24h.
  - 4. **Integraciones cruzadas (Owner: Orquestador/IA, ETA Q2 2026)**
  -    - Consolidar workflows IA (Flujo 16) con etiquetado y borradores state=draft.
  -    - Journeys multicanal (email + push + WhatsApp) y timeline conversacional.
  -    - Sincronizar preferencias de notificaciones (Flujo 12) con auto-respuestas.
  - 5. **Testing y QA (Owner: QA Guild, continuo)**
  -    - Actualizar suites Cypress/Vitest para Inbox, comentarios, agenda, feedback y programados.
  -    - Automatizar pruebas de alias/onboarding y fallback Mailgun.
  -    - Añadir cobertura para emailTrashRetention, webhooks de rebote y métricas.
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

- **[archivo]** docs/flujos-especificos/flujo-8-diseno-web-personalizacion.md
- **[conclusion]** pendiente
- **[pendiente (doc)]**
  - mover la llamada a OpenAI al backend (evitar exponer `VITE_OPENAI_API_KEY`), corregir el guard de publicacion (`ProfileSummary`/`publishDisabled`), habilitar biblioteca de prompts editable, exponer configuracion de dominio personalizado y superficie de analitica consumible.
- **[E2E specs]** 0/1 presentes
  - [faltante] cypress/e2e/web/diseno-web-flow.cy.js
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

- **[archivo]** docs/flujos-especificos/flujo-9-rsvp-confirmaciones.md
- **[conclusion]** parcial
- **[implementado (doc)]**
  - `RSVPConfirm.jsx`, `AcceptInvitation.jsx`, `RSVPDashboard.jsx`, hooks `useGuests`, servicios `rsvpService.js` y `emailAutomationService.js`.
- **[pendiente (doc)]**
  - confirmaciones grupales avanzadas, recordatorios automaticos multi-canal, analytics detallados y integracion directa con catering.
- **[E2E specs]** 0/6 presentes
  - [faltante] cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js
  - [faltante] cypress/e2e/rsvp/rsvp_invalid_token.cy.js
  - [faltante] cypress/e2e/rsvp/rsvp_reminders.cy.js
  - [faltante] cypress/e2e/rsvp/rsvp_confirm.cy.js
  - [faltante] cypress/e2e/invitaciones_rsvp.cy.js
  - [faltante] cypress/e2e/rsvp_confirm.cy.js
- **[verificacion de archivos implementados]**
  - `RSVPConfirm.jsx` -> apps/main-app/src/pages/RSVPConfirm.jsx
  - `AcceptInvitation.jsx` -> apps/main-app/src/pages/AcceptInvitation.jsx
  - `RSVPDashboard.jsx` -> apps/main-app/src/pages/RSVPDashboard.jsx
  - `useGuests` -> apps/main-app/src/hooks/useGuests.js
  - `rsvpService.js` -> apps/main-app/src/services/rsvpService.js
  - `emailAutomationService.js` -> apps/main-app/src/services/emailAutomationService.js
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

- **[archivo]** docs/flujos-especificos/flujo-13-seating-plan-e2e.md
- **[conclusion]** pendiente
- **[E2E specs]** 0/19 presentes
  - [faltante] cypress/e2e/seating/seating_smoke.cy.js
  - [faltante] cypress/e2e/seating/seating_assign_unassign.cy.js
  - [faltante] cypress/e2e/seating/seating_capacity_limit.cy.js
  - [faltante] cypress/e2e/seating/seating_no_overlap.cy.js
  - [faltante] cypress/e2e/seating/seating_obstacles_no_overlap.cy.js
  - [faltante] cypress/e2e/seating/seating_template_circular.cy.js
  - [faltante] cypress/e2e/seating/seating_template_u_l_imperial.cy.js
  - [faltante] cypress/e2e/seating/seating_ceremony.cy.js
  - [faltante] cypress/e2e/seating/seating_fit.cy.js
  - [faltante] cypress/e2e/seating/seating_aisle_min.cy.js
  - [faltante] cypress/e2e/seating/seating_toasts.cy.js
  - [faltante] cypress/e2e/seating/seating_auto_ai.cy.js
  - [faltante] cypress/e2e/seating/seating_area_type.cy.js
  - [faltante] cypress/e2e/seating/seating_delete_duplicate.cy.js
  - [faltante] cypress/e2e/seating/seating-content-flow.cy.js
  - [faltante] cypress/e2e/seating/seating-basic.cy.js
  - [faltante] cypress/e2e/seating/seating-conflicts.cy.js
  - [faltante] cypress/e2e/seating/seating_ui_panels.cy.js
  - [faltante] cypress/e2e/seating/seating-export.cy.js
- **[roadmap/pending (doc)]**
  - - Integración en pipeline de CI y reporte automático
  - ### 3) seating_toasts.cy.js (Toasts)
  - Valida que:
  - - Guardar “Configurar Espacio” muestra toast “Dimensiones guardadas”.
  - - Ejecutar “Auto IA” muestra un toast de éxito o de error (ambos caminos válidos según disponibilidad del backend).
  - Los toasts se gestionan en `src/components/seating/SeatingPlanRefactored.jsx` con `react-toastify`.

Generado automaticamente por scripts/aggregateRoadmap.js. Ejecuta el script cuando cambie la documentacion o los tests.
