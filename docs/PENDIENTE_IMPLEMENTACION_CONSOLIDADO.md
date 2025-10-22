# 📋 Análisis Consolidado: Pendiente de Implementación

**Fecha:** 22 de Enero, 2025  
**Estado Actual:** 56% implementado funcional, 86 tests E2E pasando (100%)  
**Objetivo:** Documento ejecutable de TODO lo pendiente

---

## 🚨 CRÍTICO - Bloqueantes Inmediatos

### 1. Tests Unitarios Firestore (BLOQUEADOR)
**Estado:** ❌ 3/3 tests fallando  
**Impacto:** Bloquea 13+ tests E2E de Seating Plan

```
❌ cypress/support/unit_rules.cy.js
❌ cypress/support/unit_rules_exhaustive.cy.js  
❌ cypress/support/unit_rules_extended.cy.js
```

**Acción requerida:**
- [ ] Debugear reglas Firestore de seating
- [ ] Actualizar emulador de Firestore si necesario
- [ ] Sincronizar reglas con `firestore.rules`
- [ ] Verificar permisos de colecciones `seatingPlans`, `tables`, `seats`

### 2. Formato API Inconsistente
**Estado:** ⚠️ Múltiples endpoints no siguen convenciones

**Archivos afectados:**
- [ ] `backend/routes/ai.js` - Devuelve `{ extracted, reply }` en vez de `{ success, data }`
- [ ] `backend/routes/guests.js` - Formato inconsistente
- [ ] Falta `requestId` en respuestas manuales de error

**Acción requerida:**
```javascript
// Crear helper estándar
export const apiResponse = {
  success: (data, meta = {}) => ({ success: true, data, ...meta }),
  error: (code, message, requestId) => ({ 
    success: false, 
    error: { code, message }, 
    requestId 
  })
};
```

### 3. Exposición de PII
**Estado:** ⚠️ Datos sensibles sin filtrar

- [ ] Auditar endpoint `/api/guests/:weddingId/:token` (expone email/teléfono)
- [ ] Filtrar PII en logs de error
- [ ] Proteger `/api/ai/debug-env` con requireAdmin
- [ ] Implementar data masking en respuestas públicas

---

## 🔥 ALTA PRIORIDAD - Sprint Actual

### Seating Plan (Flujo 4, 13)
**Funcionalidad:** 80% implementado  
**Tests:** ❌ 13 tests E2E bloqueados

#### Pendiente:
- [ ] **Modo Móvil Completo**
  - [ ] FAB radial (botones flotantes)
  - [ ] Panel inferior colapsable
  - [ ] Detección viewport <=1024px
  - [ ] Ajustar `GuestSidebar` móvil con tabs (Alertas/Recomendaciones/Staff)
  
- [ ] **Gestos Táctiles**
  - [ ] Pinch to zoom
  - [ ] Double tap para centrar
  - [ ] Swipe entre vistas
  
- [ ] **Colaboración en Tiempo Real**
  - [ ] Badges "En edición" para usuarios activos
  - [ ] Toasts de conflicto
  - [ ] Modo enfoque colaborativo

- [ ] **Integración con Otros Módulos**
  - [ ] Triggers automáticos de Tasks desde seating
  - [ ] Eventos de gamificación (`layout_ceremony_ready`, `layout_banquet_ready`)
  - [ ] Métricas analytics (`seating_export_generated`, `seating_collab_lock_acquired`)

- [ ] **Testing y QA**
  - [ ] ✅ Reparar 13 tests E2E (depende de fix unit_rules)
  - [ ] QA manual en tablet/iPad
  - [ ] QA en navegadores (Chrome, Firefox, Safari, Edge)

---

### Email y Comunicaciones (Flujo 7, 20)
**Funcionalidad:** 90% implementado  
**Tests:** ❌ 7 tests E2E fallando

#### Pendiente:
- [ ] **Optimizaciones UI**
  - [ ] Resolver búsqueda/sort duplicado en `UnifiedInbox/EmailList.jsx`
  - [ ] Completar onboarding con validaciones DKIM/SPF
  - [ ] Envío de correo de prueba en setup

- [ ] **Persistencia y Backend**
  - [ ] Auto-respuestas server-side (no solo localStorage)
  - [ ] Migrar definitivamente de buzón legacy (`Buzon_fixed_complete.jsx`)
  - [ ] Toggle o ruta para buzón legacy (solo modo soporte)

- [ ] **Features Avanzadas**
  - [ ] Carpetas personalizadas con drag & drop completo
  - [ ] Papelera con restauración a carpeta origen
  - [ ] Métricas de retención en papelera
  - [ ] Vaciado backend de papelera

- [ ] **Testing**
  - [ ] Actualizar suites Cypress/Vitest al nuevo inbox
  - [ ] ✅ Reparar 7 tests E2E: send, read, folders, tags, ai, smart-composer
  - [ ] Registrar eventos Mailgun (entregas, aperturas) en `EmailInsights`

---

### Presupuesto y Finanzas (Flujo 6)
**Funcionalidad:** 85% implementado  
**Tests:** ❌ 7 tests E2E fallando

#### Pendiente:
- [ ] **Open Banking**
  - [ ] UI de autenticación con refresh tokens
  - [ ] Sincronización automática de transacciones
  - [ ] Manejo de errores y reconexión

- [ ] **Importación/Exportación**
  - [ ] CSV/Excel con preview y mapeo de columnas
  - [ ] Reportes descargables (PDF/Excel) para proveedores
  - [ ] Reportes contables

- [ ] **Features Avanzadas**
  - [ ] Gestión de aportaciones (recordatorios, agradecimientos)
  - [ ] Panel compartido de aportaciones
  - [ ] Predicción de gasto con IA
  - [ ] Recomendaciones automáticas de ahorro
  - [ ] Automatización de pagos programados

- [ ] **Consejero IA**
  - [ ] Entrenar con dataset anonimizado
  - [ ] Calibrar respuestas con feedback
  - [ ] UI conversacional

- [ ] **Testing**
  - [ ] ✅ Reparar 7 tests E2E: budget, transactions, contributions, analytics, flow

---

### Invitados y RSVP (Flujos 3, 9)
**Funcionalidad:** 95% implementado  
**Tests:** ❌ 1 test E2E crítico

#### Pendiente:
- [ ] **Sincronización**
  - [ ] Sync bidireccional completo con Seating Plan (persistencia backend)
  - [ ] Automatizaciones IA reactivas a cambios de invitados

- [ ] **Exportaciones Día B**
  - [ ] Listado check-in con QR
  - [ ] Etiquetas personalizadas para impresión
  - [ ] QR individuales por invitado

- [ ] **Datos y Fixtures**
  - [ ] Completar flujo integral con fixtures estables
  - [ ] Alta manual, CSV, filtros, etiquetas, bulk operations
  - [ ] Sincronizar estadísticas RSVP `weddings/{id}/rsvp/stats`
  - [ ] Panel resumen con métricas

- [ ] **Testing**
  - [ ] ✅ Reparar test crítico: `rsvp_confirm_by_token`
  - [ ] Consolidar suites E2E `guests_*.cy.js` con datos deterministas

---

## ⚡ MEDIA PRIORIDAD - Próximos Sprints

### Protocolo y Ceremonias (Flujos 11, 11A-E)
**Funcionalidad:** 40% implementado  
**Complejidad:** 5 sub-módulos interdependientes

#### Flujo 11 - Protocolo Global
- [ ] Integración con registros civiles (APIs públicas)
- [ ] Generador de programas/QR desde momentos + timeline
- [ ] Alertas en tiempo real (retrasos, clima, tareas críticas)
- [ ] Dashboard operativo para día del evento

#### Flujo 11A - Momentos Especiales
- [ ] Campos avanzados (responsables, requisitos técnicos, suppliers, estado)
- [ ] Drag&drop con límites (200 momentos max)
- [ ] Validaciones de orden y coherencia
- [ ] Alertas guiadas por campos faltantes
- [ ] Destinatarios vinculados a invitados/roles (seating VIP, mensajería)
- [ ] UI asistida para duplicar/mover momentos

#### Flujo 11B - Timeline Día B
- [ ] Migrar `timing` a subcolección `weddings/{id}/timing`
- [ ] Edición de estado de bloque (on-time/slightly-delayed/delayed) en UI
- [ ] Drag&drop con validaciones de coherencia horaria
- [ ] Límites de 30 hitos
- [ ] Alertas automáticas según retrasos detectados

#### Flujo 11C - Checklist Última Hora
- [ ] Alertas sonoras/notificaciones push para requisitos críticos
- [ ] Sincronización con centro de notificaciones
- [ ] Tracking de tareas en tiempo real

#### Flujo 11D - Guía Documentación Legal
- [ ] Catálogo internacional (tipos simbólica/destino, nuevos países)
- [ ] Variaciones por combinación tipo × país
- [ ] Bloques, plazos y alertas contextuales
- [ ] Guardar overrides en `legalSettings/{uid}`
- [ ] Sync progreso en Firestore
- [ ] Eventos (`ceremony_document_guide_opened`)
- [ ] Automatizar estados de checklist 11C
- [ ] Notas por requisito + soporte multiusuario

#### Flujo 11E - Ayuda Textos Ceremonia
- [ ] Tabs adicionales (votos, discursos) por rol/persona
- [ ] Notas privadas por sección
- [ ] Enlaces a momentos 11A
- [ ] Responsables y tags de inspiración
- [ ] Control de versiones (historial, duplicado, favoritos)
- [ ] Export PDF/proyección
- [ ] Validaciones (título, duplicados, longitud mínima)
- [ ] Integración IA (reescritura, cambio de tono)
- [ ] Publicar hacia flujo 21 (sitio público)
- [ ] Permisos backend con auditoría
- [ ] Métricas operativas (duración, ratio finalizados)
- [ ] E2E para roles ayudantes y pareja

**Reglas Firestore pendientes:**
```javascript
// Verificar en firestore.rules
match /weddings/{weddingId}/specialMoments/{momentId}
match /weddings/{weddingId}/timing/{timingId}
match /weddings/{weddingId}/ceremonyChecklist/{checklistId}
match /legalSettings/{uid}
match /weddings/{weddingId}/ceremonyTexts/{textId}
```

---

### Proveedores con IA (Flujo 5)
**Funcionalidad:** 85% implementado

#### Pendiente:
- [ ] **Scoring IA Consolidado**
  - [ ] Integrar métricas históricas por servicio
  - [ ] Ponderación dinámica según preferencias de boda
  - [ ] Dashboard de comparativas

- [ ] **Portal Proveedor**
  - [ ] Autenticación dedicada
  - [ ] Feedback bidireccional
  - [ ] Vista del estado de solicitudes
  - [ ] Notificaciones en tiempo real

- [ ] **Automatización Multi-Proveedor**
  - [ ] RFQ masivo (Request for Quote)
  - [ ] Recordatorios automáticos
  - [ ] Líneas de servicio combinadas

- [ ] **Analítica y Reportes**
  - [ ] Reportes comparativos detallados
  - [ ] Analítica de mercado
  - [ ] Tendencias de precios

- [ ] **Integraciones**
  - [ ] Marketplaces externos
  - [ ] Recomendaciones en sitio público

- [ ] **Testing**
  - [ ] ✅ Reparar tests E2E: flow, compare, smoke

---

### Tasks y Timeline (Flujo 5b, 14)
**Funcionalidad:** 75% implementado

#### Pendiente:
- [ ] **Motor IA de Personalización**
  - [ ] Mantener plantilla maestra curada manualmente
  - [ ] Ingestar datos de boda (tipo, tamaño, presupuesto, estilo, lead time)
  - [ ] Motor híbrido: plantillas + LLM para adaptar nodos
  - [ ] Proponer dependencias automáticas
  - [ ] Asignar responsables sugeridos
  - [ ] Calcular ventanas temporales óptimas
  - [ ] Resultado en modo borrador con explicación

- [ ] **Colaboración Avanzada**
  - [ ] Matriz RACI (Responsible, Accountable, Consulted, Informed)
  - [ ] Asignaciones múltiples con permisos granulares
  - [ ] Auto-priorización según proximidad y criticidad

- [ ] **Panel de Riesgos**
  - [ ] Predicción de retrasos con IA
  - [ ] Alertas proactivas
  - [ ] Sugerencias de mitigación

- [ ] **Gamificación**
  - [ ] Streaks (rachas de cumplimiento)
  - [ ] Objetivos semanales
  - [ ] Sistema de recompensas

- [ ] **Integraciones**
  - [ ] Sync bidireccional Google Calendar
  - [ ] Sync bidireccional Microsoft Outlook
  - [ ] Webhooks para notificaciones

---

### Creación Boda/Evento (Flujos 2, 2B)
**Funcionalidad:** 80% implementado

#### Pendiente:
- [ ] **Telemetría y Analítica**
  - [ ] Instrumentar eventos para comparar funnels (wizard vs asistente)
  - [ ] Dashboard de conversión
  - [ ] A/B testing entre modos

- [ ] **Capa IA**
  - [ ] Sugerencias de estilos basadas en respuestas
  - [ ] Notas contextuales automáticas
  - [ ] Mensaje de agradecimiento/introducción personalizado

- [ ] **Respuestas Contextualizadas**
  - [ ] Si fecha cercana: ofrecer recomendaciones de próximos pasos
  - [ ] Detectar urgencia y priorizar acciones
  - [ ] Integrar con timeline de tareas

- [ ] **UX Writing**
  - [ ] Documentar copy guía con propuesta de tono
  - [ ] Coordinar con equipo UX
  - [ ] Pruebas de usabilidad

- [ ] **Experiencia Usuario**
  - [ ] Integrar CTA desde dashboard/onboarding
  - [ ] Ofrecer elección clara entre modos
  - [ ] Soporte múltiples rondas IA (editar sin reiniciar)
  - [ ] Evaluar merge si asistente demuestra mejor conversión

- [ ] **Testing**
  - [ ] ✅ Reparar tests E2E onboarding

---

### Descubrimiento Personalizado (Flujo 2C)
**Funcionalidad:** 60% implementado

#### Pendiente:
- [ ] **Migración UI**
  - [ ] Migrar wizard legacy a `DiscoveryWizard`
  - [ ] Bloques condicionales documentados
  - [ ] Validaciones por bloque

- [ ] **Telemetría Completa**
  - [ ] Eventos `discovery_*`
  - [ ] Eventos `recommendation_*`
  - [ ] Eventos `wedding_profile_updated`

- [ ] **Motor de Recomendaciones**
  - [ ] Recalculo en caliente de `weddingInsights`
  - [ ] Cola de recomendaciones priorizadas
  - [ ] Algoritmo de matching con proveedores

- [ ] **Dashboard Analytics**
  - [ ] Funnel completo: view → completed → recomendaciones aplicadas
  - [ ] Métricas de conversión
  - [ ] Segmentación de usuarios

- [ ] **Testing**
  - [ ] Suites Cypress del flujo completo
  - [ ] Seeds/fixtures de perfiles representativos
  - [ ] Documentación de casos de uso

---

### Asistente Virtual e IA (Flujo 16)
**Funcionalidad:** 50% implementado (estructura básica)

#### Pendiente:
- [ ] **Kickoff y Organización**
  - [ ] Calendarizar kickoff cross-funcional
  - [ ] Asignar responsables
  - [ ] Acta y seguimiento

- [ ] **Backend Multicanal**
  - [ ] Desplegar orquestador (`AutomationOrchestrator`)
  - [ ] Soporte email/chat/WhatsApp
  - [ ] Cola de mensajes

- [ ] **Reglas Configurables**
  - [ ] Sistema if/then con UI de administración
  - [ ] Auditoría de reglas ejecutadas
  - [ ] Versionado de reglas

- [ ] **Workers y Procesamiento Async**
  - [ ] Workers dedicados para acciones
  - [ ] Colas `automationLogs` y `automationRules`
  - [ ] Reintentos con backoff exponencial

- [ ] **Testing e Integración**
  - [ ] Suite E2E específica
  - [ ] Eventos de telemetría
  - [ ] Integración con tasks, proveedores, notificaciones

---

## 📊 MEDIA-BAJA PRIORIDAD

### Diseño Web y Personalización (Flujo 8)
- [ ] Editor de prompts avanzado (CRUD, versionado, biblioteca compartida)
- [ ] Refactor generación IA a backend (`AIWebGenerator`)
- [ ] Streaming seguro con quotas y manejo de errores
- [ ] Historial enriquecido (diffs, etiquetas, undo/redo)
- [ ] Analítica integrada sobre `analytics/websiteEvents`
- [ ] Dominio personalizado y SSL automático
- [ ] SEO avanzado (metatags dinámicos, sitemap, OG images)
- [ ] Fallback offline con service worker
- [ ] Colaboración multirol (comentarios, aprobaciones)
- [ ] ✅ Reparar test E2E

### Diseño de Invitaciones (Flujo 19)
- [ ] Editor colaborativo con comentarios
- [ ] Control de versiones
- [ ] Generación IA de propuestas desde perfil de boda
- [ ] Integración con proveedores (impresión/envío)
- [ ] Tracking de envíos
- [ ] Biblioteca de tutoriales y guías interactivas
- [ ] Marketplace de plantillas premium
- [ ] Prototipo UI "Configuración de pieza" en Figma

### Personalización Continua (Flujo 2C)
- [ ] Prototipar mapa de preferencias + StyleMeter en Figma
- [ ] Panel IA/cards de ideas con micro-feedback
- [ ] Wizard "Algo distinto"
- [ ] Widget "Salud del perfil" con alertas
- [ ] Storyboard de conversaciones del asistente
- [ ] Packs sorpresa y revisiones automáticas
- [ ] Validar seeds (`npm run seed:personalization`)

### Estilo Global (Flujo 31)
- [ ] Consumir `branding/main.palette` en `websitePromptBuilder`
- [ ] Usar en generador de invitaciones
- [ ] UI declarativa de paleta/tipografías en `/perfil`
- [ ] Preview en tiempo real
- [ ] Emitir eventos (`style_updated`, `palette_saved`)
- [ ] Panel en dashboard admin
- [ ] Estilos personalizados con normalización IA
- [ ] Tokens CSS consolidados (`src/styles/tokens.css`)
- [ ] Tests E2E para vector editor

---

## 🔧 BAJA PRIORIDAD (Backlog)

### Sitio Público (Flujo 21)
- [ ] Editor dedicado con vista previa
- [ ] Control de secciones
- [ ] Dominios personalizados con SSL
- [ ] Analytics en tiempo real
- [ ] Panel de conversión
- [ ] Comentarios/libro de visitas
- [ ] Bodas múltiples (selector en header)

### Gamificación (Flujo 17)
- [ ] `GamificationPanel` con milestones en Home/Dashboard
- [ ] Overlay de historial y eventos
- [ ] data-testids para widgets críticos
- [ ] Badges en lista de tareas
- [ ] Indicadores en timeline
- [ ] Programa de recompensas intercambiables

### Notificaciones (Flujo 12)
- [ ] Centro completo (agrupaciones, búsqueda)
- [ ] Automation rules UI (if-this-then-that)
- [ ] Multi-canal SMS/push con configuración
- [ ] Panel de auditoría
- [ ] Métricas (CTR, efectividad por canal)

### Contratos y Documentos (Flujo 15)
- [ ] Firma digital completa (DocuSign/HelloSign)
- [ ] Workflows de aprobación
- [ ] Analítica de cláusulas (riesgos, montos) con IA
- [ ] Workflows dinámicos por jurisdicción
- [ ] Portal colaborativo para proveedores
- [ ] Archivado inteligente con retención automática

### Generador Documentos Legales (Flujo 18)
- [ ] Repositorio completo de plantillas
- [ ] Firma electrónica completa
- [ ] Almacenamiento backend seguro
- [ ] Automatización IA para generación

### Multi-Boda (Flujo 10)
- [ ] Worker CRM para `crmSyncQueue`
- [ ] Reintentos y actualización de `crm.lastSyncStatus`
- [ ] Métricas de sincronización
- [ ] Panel en `MultiWeddingSummary`
- [ ] Suites E2E para permisos y CRM sync

### Blog de Tendencias (Flujo 26)
- [ ] Página dedicada con archivo histórico
- [ ] Categorías filtrables
- [ ] Favoritos sincronizados
- [ ] Personalización según ubicación/etapa
- [ ] Notificaciones de nuevas tendencias
- [ ] Integración con proveedores asociados

### Álbum Momentos (Flujo 27)
- [ ] Moderación automática (Vision API)
- [ ] Umbrales configurables
- [ ] Override manual
- [ ] Slideshow público con token
- [ ] Autoplay configurable
- [ ] Compatibilidad `prefers-reduced-motion`
- [ ] Gamificación (badges, leaderboard)
- [ ] Mensajes de agradecimiento
- [ ] Gestión de tokens/QR (rotación, expiración)

### Planes y Suscripciones (Flujo 25)
- [ ] Validar propuesta de valor con stakeholders
- [ ] Mapear journey completo
- [ ] Dashboard de métricas (upgrades, ticket medio)
- [ ] Journeys automáticos (alta, upgrade, rescate)
- [ ] Estrategia de retención post-boda
- [ ] Cross-sell
- [ ] Automatizaciones de rescate

### Admin y Seguridad (Flujo 0)
- [ ] MFA obligatorio (TOTP) para admins
- [ ] Impersonación segura de solo lectura
- [ ] SSO corporativo (SAML/OAuth)
- [ ] Alertas push/Slack en tiempo real
- [ ] Dashboard "Estado integraciones"
- [ ] Reportes semanales automáticos
- [ ] KPI NPS planners

---

## 🔬 Performance y Observabilidad

### Performance
- [ ] Lighthouse CI con presupuesto (<2MB bundle)
- [ ] Monitorización de errores (Sentry/Bugsnag)
- [ ] Optimizar queries Firestore costosos
- [ ] CDN para assets públicos
- [ ] Lazy loading de módulos

### Observabilidad
- [ ] Dashboards Grafana/BigQuery
- [ ] Alertas para errores críticos
- [ ] Logging centralizado
- [ ] APM (Application Performance Monitoring)
- [ ] Runbook para respuesta a incidentes

---

## ♿ Accesibilidad e Internacionalización

### Accesibilidad
- [ ] Auditar contraste en vistas core
- [ ] Focus management en formularios/modales
- [ ] Navegación completa por teclado
- [ ] Announcements ARIA para acciones dinámicas
- [ ] Compliance WCAG 2.1 AA

### Internacionalización
- [ ] Completar traducciones ES/EN/FR para nuevas features
- [ ] Soporte RTL (Right-to-Left)
- [ ] Detección automática de idioma
- [ ] Fallbacks robustos
- [ ] Contexto cultural en contenidos

---

## 📊 Métricas de Progreso

### Estado Actual (22 Enero 2025)
```
✅ Completado:        56% (23/41 módulos)
⚠️  Parcial:          49% (20/41 módulos)  
❌ No iniciado:       37% (15/41 módulos)
🧪 Tests E2E:         86/86 pasando (100%)
🔥 Bloqueadores:      3 tests unitarios
```

### KPIs Objetivo Q1 2025
```
- Retención planners: +10%
- Exportaciones calidad: <2% rechazadas
- NPS planners: 45
- Cobertura E2E crítica: 90% en CI
```

---

## 📚 Referencias Documentación

- `docs/ROADMAP.md` - Visión estratégica
- `docs/TODO.md` - Lista de tareas operativas
- `docs/ANALYSIS_GAPS_CONSOLIDATED.md` - Análisis detallado
- `docs/IMPLEMENTATION_GAPS_REPORT.md` - Gaps técnicos
- `docs/flujos-especificos/` - Especificaciones funcionales
- `docs/E2E-TEST-SUCCESS-REPORT.md` - Estado de tests
- `roadmap.json` - Tareas en ejecución

---

**Última actualización:** 22 de Enero, 2025  
**Mantenido por:** Daniel Navarro Campos  
**Repositorio:** https://github.com/Daniel-Navarro-Campos/mywed360
