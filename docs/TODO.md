# TODO - MaLove.App

> Lista única de pendientes operativos consolidada con análisis de gaps de implementación.
> Usa `docs/ROADMAP.md` para la perspectiva estratégica y `docs/ANALYSIS_GAPS_CONSOLIDATED.md` para análisis detallado.

## CRÍTICO - Sprint 1 (Infraestructura)

### Tests y Calidad

- [ ] **FIX BLOQUEADOR:** Corregir 4 tests unitarios de reglas Firestore (unit_rules, unit_rules_exhaustive, unit_rules_extended, unit_rules_collections)
- [ ] Estabilizar seeds y fixtures para tests

### API y Seguridad

- [ ] Crear helper de respuesta estándar API: `{ success, data/error, requestId }`
- [ ] Refactorizar `backend/routes/ai.js` para formato API consistente
- [ ] Refactorizar `backend/routes/guests.js` para formato API consistente
- [ ] Incluir `requestId` en todas las respuestas de error manuales
- [ ] Proteger endpoint `/api/ai/debug-env` con requireAdmin o desactivar en producción
- [ ] Mover llamadas OpenAI desde cliente a backend (DisenoWeb)
- [ ] Auditar y filtrar PII en endpoints públicos (`/api/guests/:weddingId/:token`)
- [ ] Auditar logs del sistema para eliminar exposición de PII

## ALTA PRIORIDAD - Sprint 2 (Módulos Core)

### Seating Plan (Flujo 4, 13)

- [ ] Implementar modo móvil completo (FAB radial, panel inferior, detección viewport <=1024px)
- [ ] Ajustar `GuestSidebar` móvil con tabs (Alertas/Recomendaciones/Staff)
- [ ] Implementar gestos táctiles (pinch zoom, double tap, swipe)
- [ ] Mostrar badges "En edición" para usuarios activos
- [ ] Mostrar toasts de conflicto y modo enfoque colaborativo
- [ ] Integrar triggers automáticos de Tasks desde eventos de seating
- [ ] Registrar eventos de gamificación (`layout_ceremony_ready`, `layout_banquet_ready`, `export_generated`, `conflicts_resolved`)
- [ ] Actualizar métricas/analytics (`seating_export_generated`, `guest_sidebar_*`, `seating_mobile_mode_enabled`, `seating_collab_lock_acquired`)
- [ ] QA manual en tablet/iPad y navegadores principales

### Email y Comunicaciones (Flujo 7, 20)

- [ ] Resolver búsqueda/sort duplicado en `apps/main-app/src/components/email/UnifiedInbox/EmailList.jsx`
- [ ] Completar onboarding con validaciones DKIM/SPF y envío correo de prueba
- [ ] Implementar persistencia server-side de auto-respuestas (no solo localStorage)
- [ ] Migrar definitivamente del buzón legacy (`Buzon_fixed_complete.jsx`) a UnifiedInbox
- [ ] Añadir toggle o ruta para acceder al buzón legacy solo en modo soporte
- [ ] Completar integración de carpetas personalizadas (drag & drop, alinear etiquetas)
- [ ] Refinar papelera: restaurar a carpeta origen, métricas/retención, vaciado backend
- [ ] Registrar eventos de entrega/aperturas reales (Mailgun webhooks) en `EmailInsights`

### Presupuesto y Finanzas (Flujo 6)

- [ ] Implementar UI de autenticación Open Banking con refresh tokens
- [ ] Crear importación CSV/Excel con preview y mapeo de columnas
- [ ] Implementar reportes descargables (PDF/Excel) para proveedores y contabilidad
- [ ] Completar gestión de aportaciones (recordatorios, agradecimientos, panel compartido)
- [ ] Implementar predicción de gasto con IA y recomendaciones automáticas
- [ ] Configurar automatización de pagos programados
- [ ] Entrenar y calibrar consejero conversacional (dataset anonimizado, feedback)

### Invitados y RSVP (Flujos 3, 9)

- [ ] Implementar sincronización bidireccional completa con Seating Plan (persistencia backend)
- [ ] Implementar automatizaciones IA reactivas a cambios de invitados
- [ ] Crear exportaciones día B (listado check-in, etiquetas personalizadas, QR individuales)
- [ ] Completar flujo integral con fixtures estables (alta manual, CSV, filtros, etiquetas, bulk)
- [ ] Sincronizar estadísticas RSVP `weddings/{id}/rsvp/stats` y panel resumen

## MEDIA PRIORIDAD - Sprint 3 (Módulos Secundarios)

### Protocolo y Ceremonia (Flujos 11, 11A-E)

#### Flujo 11 - Protocolo global

- [ ] Integrar validaciones con registros civiles y APIs públicas para documentación
- [ ] Crear generador de programas/QR a partir de momentos y timeline
- [ ] Implementar alertas en tiempo real (retrasos, clima adverso, tareas críticas) conectadas con notificaciones
- [ ] Construir dashboard operativo para planners el día del evento

#### Flujo 11A - Momentos especiales

- [ ] Añadir campos avanzados (responsables, requisitos técnicos, suppliers, estado) en UI y persistencia
- [ ] Implementar drag&drop con límites (200 momentos) y validaciones de orden
- [ ] Mostrar alertas guiadas por campos faltantes y mejorar flujo duplicar/mover con UI asistida
- [ ] Permitir destinatarios vinculados a invitados/roles para integraciones (seating VIP, mensajería)

#### Flujo 11B - Timeline día B

- [ ] Migrar `timing` a subcolección dedicada `weddings/{id}/timing`
- [ ] Exponer edición de estado de bloque (on-time/slightly-delayed/delayed) en UI
- [ ] Añadir drag&drop y validaciones de coherencia horaria con límites de 30 hitos
- [ ] Activar alertas automáticas según retrasos detectados

#### Flujo 11C - Checklist última hora

- [ ] Habilitar alertas sonoras/push para requisitos críticos
- [ ] Sincronizar checklist con el centro de notificaciones y tracking de tareas

#### Flujo 11D - Guía documentación legal

- [ ] Ampliar catálogo internacional (tipos simbólica/destino y nuevos países)
- [ ] Personalizar variaciones por combinación tipo × país con bloques, plazos y alertas contextuales
- [ ] Guardar overrides por usuario (`legalSettings/{uid}`) y sincronizar progreso en Firestore
- [ ] Instrumentar eventos (`ceremony_document_guide_opened`) y automatizar estados de checklist 11C
- [ ] Mantener catálogo global (Firestore + snapshot docs) con versionado y dependencias
- [ ] Añadir notas por requisito y soporte multiusuario en UI

#### Flujo 11E - Ayuda textos ceremonia

- [ ] Crear tabs adicionales (votos, discursos) con experiencias segmentadas por rol/persona
- [ ] Incorporar notas privadas, enlaces a momentos 11A, responsables y tags de inspiración
- [ ] Implementar control de versiones (historial, duplicado, favoritos, export PDF/proyección)
- [ ] Agregar validaciones (título requerido, duplicados, longitud mínima) con mensajes claros
- [ ] Integrar capacidades IA (reescritura, tono) y publicar contenidos hacia flujo 21
- [ ] Fortalecer permisos backend con auditoría detallada de edición/lectura
- [ ] Mostrar métricas operativas (duración total, ratio textos finalizados) y eventos para checklist 11C

### Proveedores con IA (Flujo 5)

- [ ] Implementar scoring IA consolidado con métricas históricas por servicio
- [ ] Completar portal proveedor con autenticación, feedback bidireccional y vista del estado
- [ ] Extender automatización multi-proveedor (RFQ masivo, recordatorios automáticos) a líneas de servicio combinadas
- [ ] Crear reportes comparativos y analítica de mercado
- [ ] Implementar integración con marketplaces externos y recomendaciones en sitio público

### Tasks y Timeline (Flujo 5b, 14)

- [ ] Implementar motor IA que personaliza plan de tareas desde plantilla maestra
  - Mantener plantilla maestra curada manualmente
  - Ingestar datos de la boda (tipo, tamaño, presupuesto, estilo, lead time)
  - Usar motor híbrido plantillas + LLM para adaptar nodos
  - Proponer dependencias, responsables y ventanas temporales
  - Entregar resultado en modo borrador con explicación
- [ ] Implementar matriz RACI y asignaciones múltiples con permisos
- [ ] Añadir auto-priorización según proximidad y criticidad
- [ ] Crear panel de riesgos con predicción de retrasos
- [ ] Completar gamificación (streaks, objetivos semanales, recompensas)
- [ ] Implementar sync bidireccional con calendarios externos (Google/Microsoft)

### Creación Boda/Evento (Flujos 2, 2B)

- [ ] Instrumentar telemetría dedicada para comparar funnels (wizard vs. asistente)
- [ ] Añadir capa IA: sugerencias de estilos/notas basadas en respuestas anteriores
- [ ] Generar mensaje de agradecimiento/introducción automático para enviar a invitados
- [ ] Implementar respuestas contextualizadas (si fecha cerca, ofrecer recomendaciones próximos pasos)
- [ ] Documentar copy guía con propuesta de tono y coordinar con UX writing
- [ ] Integrar CTA desde dashboard/onboarding y ofrecer elección entre modos
- [ ] Soportar múltiples rondas IA (editar respuesta sin reiniciar)
- [ ] Evaluar merge con flujo clásico si el asistente demuestra mejor conversión

### Descubrimiento Personalizado (Flujo 2, 2C)

- [ ] Migrar wizard legacy al nuevo `DiscoveryWizard` con bloques condicionales documentados
- [ ] Completar telemetría `discovery_*`, `recommendation_*`, `wedding_profile_updated`
- [ ] Implementar recalculo en caliente de `weddingInsights` + cola de recomendaciones
- [ ] Construir dashboard funnel (view → completed → recomendaciones aplicadas)
- [ ] Preparar seeds/fixtures de perfiles representativos y documentarlos

### Asistente Virtual e IA (Flujo 16)

- [ ] Calendarizar kickoff cross-funcional y asignar responsables para acta/seguimiento
- [ ] Desplegar backend multicanal con orquestador (`AutomationOrchestrator`) para email/chat/WhatsApp
- [ ] Diseñar reglas configurables (if/then) con panel de administración y auditoría
- [ ] Implementar workers dedicados y colas (`automationLogs`, `automationRules`) para acciones async
- [ ] Integrar con flujos existentes (tasks, proveedores, notificaciones)

## MEDIA-BAJA PRIORIDAD - Sprint 4

### Diseño Web y Personalización (Flujo 8)

- [ ] Crear editor de prompts avanzado (CRUD, versionado, biblioteca compartida por rol)
- [ ] Refactor generación IA: mover a backend/`AIWebGenerator` con streaming seguro, quotas y manejo de errores
- [ ] Implementar historial enriquecido: diffs, etiquetas, undo/redo y soporte de borradores previos
- [ ] Crear analítica integrada (dashboard, alertas) sobre `analytics/websiteEvents` + tracking visitas
- [ ] Implementar dominio personalizado y SEO avanzado (metatags dinámicos, sitemap, OG images, fallback offline)
- [ ] Añadir colaboración multirol (comentarios, sugerencias, aprobaciones con permisos granulares)

### Diseño de Invitaciones (Flujo 19)

- [ ] Implementar editor colaborativo con comentarios y versionado
- [ ] Integrar generación IA de propuestas a partir del perfil de la boda
- [ ] Conectar con proveedores (impresión/envío) y tracking
- [ ] Crear biblioteca de tutoriales y guías de estilo interactivas
- [ ] Implementar marketplace de plantillas premium
- [ ] Preparar prototipo UI "Configuración de pieza" en Figma

### Personalización Continua (Flujo 2C)

- [ ] Prototipar mapa de preferencias + StyleMeter en Figma
- [ ] Diseñar panel IA/cards de ideas con micro-feedback y wizard "Algo distinto"
- [ ] Mockear widget "Salud del perfil" y flows de alertas
- [ ] Storyboard de conversaciones del asistente (packs sorpresa, revisiones)
- [ ] Validar seeds sembrados (`npm run seed:personalization`) y capturas QA

### Estilo Global (Flujo 31)

- [ ] Consumir `branding/main.palette` en `websitePromptBuilder` y en generadores de invitaciones
- [ ] Añadir UI declarativa de paleta/tipografías en `/perfil` con preview y guardado directo
- [ ] Emitir eventos de monitoreo (`style_updated`, `palette_saved`) y panel en dashboard admin
- [ ] Soportar estilos personalizados (valores libres) con normalización y mapeo IA
- [ ] Consolidar tokens CSS (crear `src/styles/tokens.css`) y documentar proceso de override

## BAJA PRIORIDAD - Sprint 5+

### Sitio Público (Flujo 21)

- [ ] Crear editor dedicado en panel con vista previa y control de secciones
- [ ] Configurar dominios personalizados y SSL automático
- [ ] Implementar analytics en tiempo real y panel de conversión
- [ ] Integrar comentarios/libro de visitas
- [ ] Añadir experiencia para bodas múltiples (selector en header público)

### Gamificación y Dashboard (Flujo 17)

- [ ] Conectar `GamificationPanel` con milestones visibles en Home/Dashboard
- [ ] Publicar overlay de historial y eventos en UI cuando `GamificationService` devuelva datos
- [ ] Definir data-testids para widgets críticos del dashboard y completar assertions de navegación
- [ ] Diseñar integraciones discretas (badges en lista de tareas, indicadores en timeline)
- [ ] Definir programa de recompensas intercambiables

### Notificaciones (Flujo 12)

- [ ] Completar centro de notificaciones (agrupaciones, búsqueda)
- [ ] Implementar automation rules UI (if-this-then-that)
- [ ] Integración multi-canal completa (SMS/push con configuración avanzada)
- [ ] Crear panel de auditoría y métricas (CTR, canal favorito/efectividad)

### Contratos y Documentos (Flujo 15)

- [ ] Integrar firma digital completa (DocuSign/HelloSign)
- [ ] Implementar workflows de aprobación
- [ ] Añadir analítica de cláusulas (riesgos, montos, vencimientos) con IA
- [ ] Crear workflows dinámicos según tipo de contrato y jurisdicción
- [ ] Implementar portal colaborativo para proveedores con comentarios y adjuntos
- [ ] Configurar archivado inteligente y retención automática según políticas legales

### Generador Documentos Legales (Flujo 18)

- [ ] Crear repositorio completo de plantillas
- [ ] Integrar firma electrónica completa
- [ ] Implementar almacenamiento backend seguro
- [ ] Añadir automatización IA para generación

### Multi-Boda (Flujo 10)

- [ ] Desplegar worker CRM que procese `crmSyncQueue`, con reintentos y actualización de `crm.lastSyncStatus`
- [ ] Instrumentar métricas de sincronización y panel en `MultiWeddingSummary` (sincronizadas vs en cola/error)

### Blog de Tendencias (Flujo 26)

- [ ] Crear página dedicada con archivo histórico y categorías filtrables
- [ ] Implementar favoritos o lectura posterior sincronizados con el usuario
- [ ] Añadir personalización según ubicación o etapa de la boda
- [ ] Implementar notificaciones cuando haya nuevas tendencias relevantes
- [ ] Integrar con proveedores asociados para destacar artículos patrocinados

### Momentos (Álbum Compartido) - Flujo 27

- [ ] Endurecer moderación automática (clasificación Vision, umbrales configurables, override manual)
- [ ] Publicar slideshow público controlado (token host, autoplay configurable, compatibilidad `prefers-reduced-motion`)
- [ ] Completar gamificación (badges invitados, leaderboard planner) y mensajes de agradecimiento
- [ ] Instrumentar métricas (`momentos_upload`, `momentos_moderated`, `momentos_slideshow_opened`) y dashboards
- [ ] Fortalecer gestión de tokens/QR (rotación, expiración, revoke) y auditoría de subidas

### Planes y Suscripciones (Flujo 25)

- [ ] Validar con stakeholders la propuesta de valor y límites concretos por plan
- [ ] Mapear el journey completo en herramientas (Miro/Lucidchart) con responsables y SLA
- [ ] Construir dashboard de métricas (upgrades, ticket medio, ratio Premium Plus)
- [ ] Diseñar y testear journeys automáticos (alta, upgrade, rescate post-abandono)
- [ ] Definir estrategia de retención post-boda y cross-sell
- [ ] Consolidar automatizaciones de rescate (downgrade, reintentos, ofertas personalizadas)

### Admin y Seguridad (Flujo 0)

- [ ] Habilitar MFA obligatorio (TOTP) para cuentas admin
- [ ] Implementar impersonación segura de solo lectura con auditoría completa
- [ ] Conectar SSO corporativo (SAML/OAuth Enterprise) para planners enterprise
- [ ] Configurar alertas push/Slack en tiempo real y dashboard "Estado integraciones"
- [ ] Automatizar reportes semanales al comité directivo y KPI NPS planners

## Performance y Observabilidad

### Performance

- [ ] Configurar Lighthouse CI con presupuesto de bundle (<2MB inicial)
- [ ] Implementar monitorización de errores
- [ ] Optimizar queries Firestore más costosos
- [ ] Configurar CDN para assets públicos
- [ ] Implementar lazy loading de módulos

### Observabilidad

- [ ] Crear dashboards de métricas completos (Grafana/BigQuery)
- [ ] Configurar alertas para errores críticos
- [ ] Implementar logging centralizado
- [ ] Configurar APM (Application Performance Monitoring)
- [ ] Crear runbook para respuesta a incidentes

## Accesibilidad e Internacionalización

- [ ] Auditar contraste en vistas core (Seating, Invitados, Tasks, Email)
- [ ] Completar focus management en formularios y modales
- [ ] Implementar navegación completa por teclado
- [ ] Añadir announcements ARIA para acciones dinámicas
- [ ] Revisar y completar traducciones (ES/EN/FR) para nuevas features
- [ ] Implementar soporte RTL para idiomas que lo requieran

## Referencias

- `docs/ROADMAP.md`: visión completa y estado por flujo
- `docs/ANALYSIS_GAPS_CONSOLIDATED.md`: análisis detallado de gaps y priorización
- `docs/flujos-especificos/`: documentación funcional detallada
- `docs/diseno/`: prototipos y guías para UX/UI
- `roadmap.json`: tareas técnicas en ejecución

---

**Última actualización:** 18 de noviembre de 2025  
**Estado general:**

- ⚠️ CRÍTICO: 3 tests unitarios de Firestore requieren corrección
- ✅ Core funcional: Seating, Email, Finance, Invitados implementados
- 🚧 En progreso: Protocolo, Proveedores, Tasks, Asistente IA
- 📋 Planificado: Resto de módulos según priorización de sprints
- 🗑️ Tests E2E eliminados - enfoque en QA manual
