# 📋 Tareas Pendientes - Análisis Consolidado
**Fecha**: 27 Diciembre 2025  
**Estado**: Análisis basado en TODO.md, ROADMAP.md, roadmap.json y ANALYSIS_GAPS_CONSOLIDATED.md

---

## 🔴 CRÍTICO - Sprint 1 (Acción Inmediata)

### 1. Tests Unitarios Firestore Rules - BLOQUEADOR
**Estado**: 4/4 tests fallando en `roadmap.json`
- ❌ `unit_rules` - Firestore rules (seating) - 53 intentos
- ❌ `unit_rules_exhaustive` - Firestore rules (exhaustive) - 45 intentos
- ❌ `unit_rules_extended` - Firestore rules (extended) - 45 intentos
- ❌ `unit_rules_collections` - Firestore rules (collections) - 20 intentos

**Impacto**: Bloquea 13+ tests E2E de Seating Plan  
**Acción**: Debugear reglas Firestore o configurar emulador correctamente

### 2. Seeds y Fixtures para Tests
**Problema**: Tests E2E fallan por datos de prueba inconsistentes  
**Impacto**: ~50 tests E2E inestables  
**Acción**: Estabilizar seeds y crear fixtures reproducibles

### 3. API Response Format - Seguridad y Consistencia
- [ ] Crear helper de respuesta estándar: `{ success, data/error, requestId }`
- [ ] Refactorizar `backend/routes/ai.js` 
- [ ] Refactorizar `backend/routes/guests.js`
- [ ] Incluir `requestId` en todos los errores manuales
- [ ] **SEGURIDAD**: Proteger `/api/ai/debug-env` con requireAdmin
- [ ] **SEGURIDAD**: Mover llamadas OpenAI de cliente a backend (DisenoWeb)
- [ ] **GDPR**: Auditar PII en `/api/guests/:weddingId/:token`
- [ ] **GDPR**: Auditar logs para eliminar exposición de PII

---

## 🟠 ALTA PRIORIDAD - Sprint 2

### 4. Seating Plan (Flujo 4, 13)
**Estado**: Core funcional, modo móvil incompleto, tests fallando

**Pendiente**:
- [ ] Modo móvil completo (FAB radial, panel inferior, viewport <=1024px)
- [ ] GuestSidebar móvil con tabs (Alertas/Recomendaciones/Staff)
- [ ] Gestos táctiles (pinch zoom, double tap, swipe)
- [ ] Badges "En edición" para colaboración en tiempo real
- [ ] Toasts de conflicto y modo enfoque colaborativo
- [ ] Triggers automáticos Tasks desde eventos seating
- [ ] Eventos gamificación (`layout_ceremony_ready`, `layout_banquet_ready`, etc.)
- [ ] Métricas analytics (`seating_export_generated`, `guest_sidebar_*`, etc.)
- [ ] QA manual en tablet/iPad
- [ ] **Fix 13 tests E2E** (bloqueados por unit_rules)

### 5. Email y Comunicaciones (Flujo 7, 20)
**Estado**: UnifiedInbox implementado, buzón legacy coexistiendo, 7 tests fallando

**Pendiente**:
- [ ] Resolver búsqueda/sort duplicado en `EmailList.jsx`
- [ ] Onboarding con validaciones DKIM/SPF y envío prueba
- [ ] Persistencia server-side auto-respuestas (no solo localStorage)
- [ ] Migración definitiva del buzón legacy a UnifiedInbox
- [ ] Toggle/ruta para acceder buzón legacy en modo soporte
- [ ] Completar carpetas personalizadas (drag & drop, etiquetas)
- [ ] Refinar papelera (restaurar a origen, métricas, vaciado backend)
- [ ] Webhooks Mailgun para eventos entrega/aperturas en EmailInsights
- [ ] **Fix 7 tests E2E** (send, read, folders, tags, ai, smart-composer)

### 6. Presupuesto y Finanzas (Flujo 6)
**Estado**: UI básica implementada, integraciones avanzadas pendientes

**Pendiente**:
- [ ] UI autenticación Open Banking con refresh tokens
- [ ] Importación CSV/Excel con preview y mapeo columnas
- [ ] Reportes descargables (PDF/Excel) proveedores y contabilidad
- [ ] Gestión aportaciones (recordatorios, agradecimientos, panel)
- [ ] Predicción gasto con IA y recomendaciones automáticas
- [ ] Automatización pagos programados
- [ ] Entrenar consejero conversacional (dataset, feedback)
- [ ] **Fix 7 tests E2E** (budget, transactions, contributions, analytics)

### 7. Invitados y RSVP (Flujos 3, 9)
**Estado**: CRUD básico, sincronización Seating pendiente

**Pendiente**:
- [ ] Sincronización bidireccional con Seating Plan (persistencia backend)
- [ ] Automatizaciones IA reactivas a cambios invitados
- [ ] Exportaciones día B (check-in, etiquetas, QR individuales)
- [ ] Flujo integral con fixtures estables (alta, CSV, filtros, bulk)
- [ ] Sincronizar estadísticas RSVP `weddings/{id}/rsvp/stats`
- [ ] **Fix 1 test E2E crítico** (rsvp_confirm_by_token)

### 8. Protocolo y Ceremonias (Flujos 11, 11A-E)
**Estado**: Páginas base creadas, funcionalidad avanzada pendiente

#### 11A - Momentos Especiales
- [ ] Campos avanzados (responsables, requisitos técnicos, suppliers)
- [ ] Drag&drop con límites (200 momentos) y validaciones
- [ ] Alertas guiadas por campos faltantes
- [ ] Destinatarios vinculados a invitados/roles

#### 11B - Timeline Día B
- [ ] Migrar `timing` a subcolección `weddings/{id}/timing`
- [ ] Edición estado bloque (on-time/delayed) en UI
- [ ] Drag&drop con validaciones horarias (30 hitos máx)
- [ ] Alertas automáticas según retrasos

#### 11C - Checklist Última Hora
- [ ] Alertas sonoras/push para requisitos críticos
- [ ] Sync con centro notificaciones y tracking tareas

#### 11D - Documentación Legal
- [ ] Catálogo internacional (tipos, países)
- [ ] Variaciones por tipo × país con bloques contextuales
- [ ] Guardar overrides `legalSettings/{uid}`
- [ ] Instrumentar eventos y automatizar checklist 11C
- [ ] Versionado catálogo global con dependencias

#### 11E - Textos Ceremonia
- [ ] Tabs adicionales (votos, discursos) por rol
- [ ] Notas privadas, enlaces momentos 11A
- [ ] Control versiones (historial, duplicado, favoritos)
- [ ] Validaciones (título, duplicados, longitud)
- [ ] Integración IA (reescritura, tono)
- [ ] Permisos backend con auditoría
- [ ] Métricas operativas

**Tests E2E**: Múltiples specs fallando

---

## 🟡 MEDIA PRIORIDAD - Sprint 3

### 9. Proveedores con IA (Flujo 5)
**Estado**: Scaffold básico, scoring IA pendiente

- [ ] Scoring IA consolidado con métricas históricas
- [ ] Portal proveedor con autenticación y feedback
- [ ] Automatización multi-proveedor (RFQ masivo, recordatorios)
- [ ] Reportes comparativos y analítica mercado
- [ ] Integración marketplaces externos

### 10. Tasks y Timeline (Flujo 5b, 14)
**Estado**: Sistema básico, motor IA pendiente

- [ ] Motor IA que personaliza plan desde plantilla maestra
  - Plantilla maestra curada
  - Ingestar datos boda (tipo, tamaño, presupuesto, estilo)
  - Motor híbrido plantillas + LLM
  - Proponer dependencias, responsables, ventanas
  - Resultado borrador con explicación
- [ ] Matriz RACI y asignaciones múltiples
- [ ] Auto-priorización según criticidad
- [ ] Panel riesgos con predicción retrasos
- [ ] Gamificación (streaks, objetivos, recompensas)
- [ ] Sync bidireccional calendarios (Google/Microsoft)

### 11. Creación Boda/Evento (Flujos 2, 2B)
**Estado**: Wizard básico y asistente IA implementados

- [ ] Telemetría dedicada (wizard vs asistente)
- [ ] Capa IA: sugerencias estilos/notas contextuales
- [ ] Mensaje agradecimiento automático
- [ ] Respuestas contextualizadas según fecha
- [ ] Documentar copy guía con tono
- [ ] Integrar CTA desde dashboard/onboarding
- [ ] Múltiples rondas IA (editar sin reiniciar)
- [ ] Evaluar merge con flujo clásico

### 12. Descubrimiento Personalizado (Flujo 2, 2C)
- [ ] Migrar wizard legacy a `DiscoveryWizard`
- [ ] Completar telemetría (`discovery_*`, `recommendation_*`)
- [ ] Recalculo en caliente `weddingInsights` + cola recomendaciones
- [ ] Dashboard funnel completo
- [ ] Seeds/fixtures perfiles representativos

### 13. Asistente Virtual e IA (Flujo 16)
- [ ] Kickoff cross-funcional con responsables
- [ ] Backend multicanal con `AutomationOrchestrator`
- [ ] Reglas configurables (if/then) con panel admin
- [ ] Workers dedicados y colas (`automationLogs`, `automationRules`)
- [ ] Integración con flujos existentes

---

## 🟢 MEDIA-BAJA PRIORIDAD - Sprint 4

### 14. Diseño Web y Personalización (Flujo 8)
- [ ] Editor prompts avanzado (CRUD, versionado, biblioteca)
- [ ] Refactor generación IA a backend con streaming seguro
- [ ] Historial enriquecido (diffs, etiquetas, undo/redo)
- [ ] Analítica integrada (dashboard, alertas)
- [ ] Dominio personalizado y SEO avanzado
- [ ] Colaboración multirol (comentarios, aprobaciones)

### 15. Diseño de Invitaciones (Flujo 19)
- [ ] Editor colaborativo con comentarios
- [ ] Generación IA desde perfil boda
- [ ] Conexión proveedores (impresión/envío)
- [ ] Biblioteca tutoriales y guías
- [ ] Marketplace plantillas premium
- [ ] Prototipo UI "Configuración pieza" en Figma

### 16. Personalización Continua (Flujo 2C)
- [ ] Prototipar mapa preferencias + StyleMeter
- [ ] Panel IA/cards ideas con micro-feedback
- [ ] Mockear widget "Salud del perfil"
- [ ] Storyboard conversaciones asistente
- [ ] Validar seeds personalization

### 17. Estilo Global (Flujo 31)
- [ ] Consumir `branding/main.palette` en generators
- [ ] UI declarativa paleta/tipografías en `/perfil`
- [ ] Eventos monitoreo (`style_updated`, `palette_saved`)
- [ ] Estilos personalizados con normalización IA
- [ ] Consolidar tokens CSS (`src/styles/tokens.css`)

---

## ⚪ BAJA PRIORIDAD - Sprint 5+

### 18. Sitio Público (Flujo 21)
- [ ] Editor dedicado con preview
- [ ] Dominios personalizados y SSL automático
- [ ] Analytics tiempo real
- [ ] Comentarios/libro visitas
- [ ] Experiencia bodas múltiples

### 19. Gamificación y Dashboard (Flujo 17)
- [ ] Conectar GamificationPanel con milestones
- [ ] Overlay historial y eventos en UI
- [ ] Data-testids widgets críticos
- [ ] Integraciones discretas (badges, indicadores)
- [ ] Programa recompensas intercambiables

### 20. Notificaciones (Flujo 12)
- [ ] Centro completo (agrupaciones, búsqueda)
- [ ] Automation rules UI (if-this-then-that)
- [ ] Multi-canal completo (SMS/push avanzado)
- [ ] Panel auditoría y métricas (CTR, efectividad)

### 21. Contratos y Documentos (Flujo 15)
- [ ] Firma digital completa (DocuSign/HelloSign)
- [ ] Workflows aprobación
- [ ] Analítica cláusulas con IA
- [ ] Workflows dinámicos por tipo/jurisdicción
- [ ] Portal colaborativo proveedores
- [ ] Archivado inteligente

### 22. Multi-Boda (Flujo 10)
- [ ] Worker CRM procesar `crmSyncQueue`
- [ ] Métricas sincronización y panel

### 23. Blog de Tendencias (Flujo 26)
- [ ] Página dedicada con archivo histórico
- [ ] Favoritos y lectura posterior
- [ ] Personalización según ubicación/etapa
- [ ] Notificaciones tendencias relevantes
- [ ] Integración proveedores patrocinados

### 24. Momentos/Álbum (Flujo 27)
- [ ] Moderación automática avanzada
- [ ] Slideshow público controlado
- [ ] Gamificación (badges, leaderboard)
- [ ] Métricas completas
- [ ] Gestión tokens/QR (rotación, expiración)

### 25. Planes y Suscripciones (Flujo 25)
- [ ] Validar propuesta valor con stakeholders
- [ ] Mapear journey completo (Miro/Lucidchart)
- [ ] Dashboard métricas (upgrades, ticket medio)
- [ ] Journeys automáticos (alta, upgrade, rescate)
- [ ] Estrategia retención post-boda
- [ ] Automatizaciones rescate

### 26. Admin y Seguridad (Flujo 0)
- [ ] MFA obligatorio (TOTP) para admins
- [ ] Impersonación segura solo lectura
- [ ] SSO corporativo (SAML/OAuth Enterprise)
- [ ] Alertas push/Slack tiempo real
- [ ] Reportes semanales automatizados
- [ ] KPI NPS planners

---

## ⚡ Performance y Observabilidad

### Performance
- [ ] Lighthouse CI con presupuesto bundle (<2MB)
- [ ] Monitorización errores
- [ ] Optimizar queries Firestore costosos
- [ ] CDN para assets públicos
- [ ] Lazy loading módulos

### Observabilidad
- [ ] Dashboards Grafana/BigQuery
- [ ] Alertas errores críticos
- [ ] Logging centralizado
- [ ] APM (Application Performance Monitoring)
- [ ] Runbook respuesta incidentes

---

## ♿ Accesibilidad e Internacionalización

- [ ] Auditar contraste vistas core
- [ ] Focus management formularios/modales
- [ ] Navegación completa teclado
- [ ] Announcements ARIA acciones dinámicas
- [ ] Completar traducciones ES/EN/FR
- [ ] Soporte RTL

---

## 📊 Resumen por Prioridad

| Prioridad | Módulos | Tareas Estimadas |
|-----------|---------|------------------|
| 🔴 Crítico | Tests, API, Seguridad | ~15 tareas |
| 🟠 Alta | Seating, Email, Finance, RSVP, Protocolo | ~80 tareas |
| 🟡 Media | Proveedores IA, Tasks, Creación, Asistente | ~45 tareas |
| 🟢 Media-Baja | Diseño Web, Invitaciones, Estilo | ~30 tareas |
| ⚪ Baja | Público, Gamificación, Contratos, etc. | ~60 tareas |

**Total estimado**: ~230 tareas pendientes documentadas

---

## 🎯 Top 10 Tareas Más Críticas (Próximas 2 Semanas)

1. **Fix 4 tests Firestore Rules** - Desbloqueador crítico
2. **Estabilizar seeds/fixtures** - Base para tests E2E
3. **Proteger endpoint `/api/ai/debug-env`** - Seguridad
4. **Auditar PII en logs y endpoints** - GDPR compliance
5. **Crear helper respuesta API estándar** - Consistencia
6. **Refactorizar `ai.js` y `guests.js`** - API format
7. **Fix 13 tests E2E Seating** - Alta prioridad
8. **Modo móvil Seating Plan** - UX crítica
9. **Fix 7 tests E2E Email** - Core funcional
10. **Migración buzón legacy** - Deuda técnica

---

## 📚 Referencias

- **TODO.md**: Lista operativa detallada por sprint
- **ROADMAP.md**: Estado canónico por flujo
- **roadmap.json**: Tareas técnicas en ejecución
- **ANALYSIS_GAPS_CONSOLIDATED.md**: Análisis gaps detallado
- **docs/flujos-especificos/**: Documentación funcional

---

**Última actualización**: 27 Diciembre 2025  
**Estado**: Proyecto operativo con ~230 tareas pendientes documentadas  
**Bloqueo crítico**: 4 tests Firestore Rules fallando  
**Próxima acción recomendada**: Resolver tests Firestore para desbloquear 13+ tests E2E Seating
