# 📊 Análisis de Funciones Pendientes - MaLove.App
**Fecha:** 28 Diciembre 2025  
**Basado en:** Documentación consolidada (ROADMAP.md, TODO.md, análisis de gaps)

---

## 🎯 Resumen Ejecutivo

**Estado actual del proyecto:**
- ✅ **56% implementado funcional** (23/41 módulos)
- ⚠️ **49% parcial** (20/41 módulos)
- ❌ **37% no iniciado** (15/41 módulos)
- 🧪 **86/86 tests E2E pasando** (100%)
- 🔥 **Bloqueador crítico:** 4 tests unitarios Firestore Rules

**Total estimado de tareas pendientes:** ~230 tareas documentadas

---

## 🔴 CRÍTICO - Bloquea Funcionalidad Core (Sprint 1)

### 1. Tests Unitarios Firestore Rules - **BLOQUEADOR**
**Impacto:** Bloquea 13+ tests E2E de Seating Plan

❌ **4 tests fallando:**
- `unit_rules` - Firestore rules (seating) - 53 intentos
- `unit_rules_exhaustive` - Exhaustive - 45 intentos
- `unit_rules_extended` - Extended - 45 intentos
- `unit_rules_collections` - Collections - 20 intentos

**Acción requerida:**
- Debugear reglas Firestore de seating
- Actualizar emulador si necesario
- Sincronizar con `firestore.rules`

### 2. Seguridad y API Inconsistente

**Exposición de datos sensibles:**
- ❌ Proteger `/api/ai/debug-env` con requireAdmin
- ❌ Auditar PII en `/api/guests/:weddingId/:token`
- ❌ Filtrar PII en logs de error
- ❌ Mover llamadas OpenAI de cliente a backend (DisenoWeb)

**Formato API inconsistente:**
- ❌ Crear helper estándar: `{ success, data/error, requestId }`
- ❌ Refactorizar `backend/routes/ai.js`
- ❌ Refactorizar `backend/routes/guests.js`
- ❌ Incluir `requestId` en errores manuales

### 3. Seeds y Fixtures para Tests
- ❌ Estabilizar seeds para ~50 tests E2E inestables
- ❌ Crear fixtures reproducibles

---

## 🟠 ALTA PRIORIDAD - Funcionalidad Principal (Sprint 2)

### Seating Plan (Flujo 4, 13) - 80% implementado
**Tests:** ❌ 13 tests E2E bloqueados por unit_rules

**Pendiente:**
- [ ] **Modo móvil completo**
  - FAB radial (botones flotantes)
  - Panel inferior colapsable
  - Detección viewport ≤1024px
  - GuestSidebar móvil con tabs (Alertas/Recomendaciones/Staff)
- [ ] **Gestos táctiles:** Pinch zoom, double tap, swipe
- [ ] **Colaboración tiempo real:** Badges "En edición", toasts de conflicto
- [ ] **Integraciones:**
  - Triggers automáticos Tasks desde seating
  - Eventos gamificación
  - Métricas analytics
- [ ] **QA:** Manual en tablet/iPad

### Email y Comunicaciones (Flujo 7, 20) - 90% implementado
**Tests:** ❌ 7 tests E2E fallando

**Pendiente:**
- [ ] Resolver búsqueda/sort duplicado en `EmailList.jsx`
- [ ] Onboarding con validaciones DKIM/SPF
- [ ] Persistencia server-side auto-respuestas
- [ ] Migración definitiva buzón legacy
- [ ] Carpetas personalizadas (drag & drop completo)
- [ ] Papelera con restauración a origen
- [ ] Webhooks Mailgun para eventos entrega/aperturas

### Presupuesto y Finanzas (Flujo 6) - 85% implementado
**Tests:** ❌ 7 tests E2E fallando

**Pendiente:**
- [ ] **Open Banking:** UI autenticación con refresh tokens
- [ ] **Importación:** CSV/Excel con preview y mapeo columnas
- [ ] **Reportes:** Descargables PDF/Excel para proveedores
- [ ] **Aportaciones:** Gestión completa (recordatorios, agradecimientos)
- [ ] **IA:** Predicción gasto y recomendaciones automáticas
- [ ] **Automatización:** Pagos programados
- [ ] **Consejero IA:** Entrenar dataset, calibrar feedback

### Invitados y RSVP (Flujos 3, 9) - 95% implementado
**Tests:** ❌ 1 test E2E crítico (`rsvp_confirm_by_token`)

**Pendiente:**
- [ ] Sync bidireccional con Seating Plan (backend)
- [ ] Automatizaciones IA reactivas
- [ ] Exportaciones día B (check-in, etiquetas QR)
- [ ] Flujo integral con fixtures estables
- [ ] Sincronizar stats RSVP `weddings/{id}/rsvp/stats`

### Protocolo y Ceremonias (Flujos 11, 11A-E) - 40% implementado
**Tests:** Múltiples specs fallando

**Pendiente por submódulo:**

**11A - Momentos Especiales:**
- [ ] Campos avanzados (responsables, requisitos técnicos, suppliers)
- [ ] Drag&drop con límites (200 momentos)
- [ ] Alertas guiadas por campos faltantes
- [ ] Destinatarios vinculados a invitados/roles

**11B - Timeline Día B:**
- [ ] Migrar `timing` a subcolección `weddings/{id}/timing`
- [ ] Edición estado bloque (on-time/delayed) en UI
- [ ] Drag&drop con validaciones horarias
- [ ] Alertas automáticas según retrasos

**11C - Checklist Última Hora:**
- [ ] Alertas sonoras/push para requisitos críticos
- [ ] Sync con centro notificaciones

**11D - Documentación Legal:**
- [ ] Catálogo internacional (tipos, países)
- [ ] Variaciones por tipo × país
- [ ] Guardar overrides `legalSettings/{uid}`
- [ ] Automatizar checklist 11C

**11E - Textos Ceremonia:**
- [ ] Tabs adicionales (votos, discursos) por rol
- [ ] Control versiones (historial, duplicado, favoritos)
- [ ] Integración IA (reescritura, tono)
- [ ] Permisos backend con auditoría

---

## 🟡 MEDIA PRIORIDAD - Mejoras Avanzadas (Sprint 3)

### Proveedores con IA (Flujo 5) - 85% implementado
- [ ] Scoring IA consolidado con métricas históricas
- [ ] Portal proveedor (autenticación, feedback)
- [ ] Automatización multi-proveedor (RFQ masivo)
- [ ] Reportes comparativos y analítica mercado
- [ ] Integración marketplaces externos

### Tasks y Timeline (Flujo 5b, 14) - 75% implementado
- [ ] **Motor IA:** Personaliza plan desde plantilla maestra
  - Plantilla curada manualmente
  - Ingestar datos boda
  - Motor híbrido plantillas + LLM
  - Proponer dependencias automáticas
- [ ] Matriz RACI y asignaciones múltiples
- [ ] Auto-priorización según criticidad
- [ ] Panel riesgos con predicción retrasos
- [ ] Gamificación (streaks, objetivos, recompensas)
- [ ] Sync bidireccional calendarios (Google/Microsoft)

### Creación Boda/Evento (Flujos 2, 2B) - 80% implementado
- [ ] Telemetría dedicada (wizard vs asistente)
- [ ] Capa IA: sugerencias estilos/notas contextuales
- [ ] Mensaje agradecimiento automático
- [ ] Respuestas contextualizadas según fecha
- [ ] Documentar copy guía con tono
- [ ] Integrar CTA desde dashboard/onboarding
- [ ] Múltiples rondas IA (editar sin reiniciar)

### Descubrimiento Personalizado (Flujo 2, 2C) - 60% implementado
- [ ] Migrar wizard legacy a `DiscoveryWizard`
- [ ] Completar telemetría (`discovery_*`, `recommendation_*`)
- [ ] Recalculo en caliente `weddingInsights`
- [ ] Dashboard funnel completo
- [ ] Seeds/fixtures perfiles representativos

### Asistente Virtual e IA (Flujo 16) - 50% implementado
**Estado:** Frontend básico, backend pendiente

**Pendiente:**
- [ ] Kickoff cross-funcional
- [ ] Backend multicanal (`AutomationOrchestrator`)
- [ ] Reglas configurables (if/then) con panel admin
- [ ] Workers dedicados y colas
- [ ] Integración con flujos existentes

---

## 🟢 MEDIA-BAJA PRIORIDAD (Sprint 4)

### Diseño Web y Personalización (Flujo 8)
- [ ] Editor prompts avanzado (CRUD, versionado)
- [ ] Refactor generación IA a backend con streaming
- [ ] Historial enriquecido (diffs, etiquetas, undo/redo)
- [ ] Analítica integrada (dashboard, alertas)
- [ ] Dominio personalizado y SEO avanzado
- [ ] Colaboración multirol (comentarios, aprobaciones)

### Diseño de Invitaciones (Flujo 19)
- [ ] Editor colaborativo con comentarios
- [ ] Generación IA desde perfil boda
- [ ] Conexión proveedores (impresión/envío)
- [ ] Biblioteca tutoriales y guías
- [ ] Marketplace plantillas premium
- [ ] Prototipo UI "Configuración pieza" en Figma

### Personalización Continua (Flujo 2C)
- [ ] Prototipar mapa preferencias + StyleMeter
- [ ] Panel IA/cards ideas con micro-feedback
- [ ] Mockear widget "Salud del perfil"
- [ ] Storyboard conversaciones asistente
- [ ] Validar seeds personalization

### Estilo Global (Flujo 31)
- [ ] Consumir `branding/main.palette` en generators
- [ ] UI declarativa paleta/tipografías en `/perfil`
- [ ] Eventos monitoreo (`style_updated`, `palette_saved`)
- [ ] Estilos personalizados con normalización IA
- [ ] Consolidar tokens CSS (`src/styles/tokens.css`)

---

## ⚪ BAJA PRIORIDAD (Sprint 5+)

### Sitio Público (Flujo 21)
- [ ] Editor dedicado con preview
- [ ] Dominios personalizados y SSL automático
- [ ] Analytics tiempo real
- [ ] Comentarios/libro visitas
- [ ] Experiencia bodas múltiples

### Gamificación y Dashboard (Flujo 17)
- [ ] Conectar GamificationPanel con milestones
- [ ] Overlay historial y eventos en UI
- [ ] Data-testids widgets críticos
- [ ] Integraciones discretas (badges, indicadores)
- [ ] Programa recompensas intercambiables

### Notificaciones (Flujo 12)
- [ ] Centro completo (agrupaciones, búsqueda)
- [ ] Automation rules UI (if-this-then-that)
- [ ] Multi-canal completo (SMS/push avanzado)
- [ ] Panel auditoría y métricas (CTR, efectividad)

### Contratos y Documentos (Flujo 15)
- [ ] Firma digital completa (DocuSign/HelloSign)
- [ ] Workflows aprobación
- [ ] Analítica cláusulas con IA
- [ ] Workflows dinámicos por tipo/jurisdicción
- [ ] Portal colaborativo proveedores
- [ ] Archivado inteligente

### Multi-Boda (Flujo 10)
- [ ] Worker CRM procesar `crmSyncQueue`
- [ ] Métricas sincronización y panel

### Blog de Tendencias (Flujo 26)
- [ ] Página dedicada con archivo histórico
- [ ] Favoritos y lectura posterior
- [ ] Personalización según ubicación/etapa
- [ ] Notificaciones tendencias relevantes
- [ ] Integración proveedores patrocinados

### Momentos/Álbum (Flujo 27)
- [ ] Moderación automática avanzada
- [ ] Slideshow público controlado
- [ ] Gamificación (badges, leaderboard)
- [ ] Métricas completas
- [ ] Gestión tokens/QR (rotación, expiración)

### Planes y Suscripciones (Flujo 25) - **BLOQUEA MONETIZACIÓN**
**Estado:** Solo documentación estratégica

**Pendiente:**
- [ ] Sistema completo de cobro único por boda
- [ ] Integración pasarela pago (Stripe/Braintree)
- [ ] Catálogo funcional límites por plan
- [ ] Automatizaciones upgrade/downgrade
- [ ] Panel gestión suscripciones
- [ ] Degradación automática al expirar
- [ ] Telemetría operativa conversión
- [ ] Dashboards rentabilidad

### Admin y Seguridad (Flujo 0)
- [ ] MFA obligatorio (TOTP) para admins
- [ ] Impersonación segura solo lectura
- [ ] SSO corporativo (SAML/OAuth Enterprise)
- [ ] Alertas push/Slack tiempo real
- [ ] Reportes semanales automatizados
- [ ] KPI NPS planners

---

## 🔧 CASOS ESPECIALES

### Web de Bodas (Página Pública)
**Estado:** UI implementada, funcionalidad básica pendiente

**Pendiente (ALTA prioridad):**
1. **Settings panels** → Falta para 8 componentes
2. **Upload de imágenes** → Hero + Galería básica
3. **Sistema de publicación** → Slug único + URL pública
4. **RSVP funcional** → Guardar confirmaciones reales
5. **Coordenadas GPS** → Mapa real con Google Places API
6. **SEO básico** → Meta tags dinámicos

### Portfolio Proveedores
**Estado:** 100% backend listo, frontend 80%

**Pendiente (MEDIA prioridad):**
1. Completar PhotoLightbox.jsx
2. Completar SupplierPortfolio.jsx
3. Sistema de Reseñas completo
4. Sistema Solicitud Presupuesto
5. Cloud Function para thumbnails
6. Reglas Firestore y traducciones

### App Store Integration
**Estado:** Código 100% listo, configuración pendiente

**Pendiente (cuando suba la app iOS):**
- Configurar productos en App Store Connect
- Obtener Shared Secret
- Configurar Webhook
- Variables .env backend
- Testing Sandbox

---

## ⚡ PERFORMANCE Y OBSERVABILIDAD

### Performance
- [ ] Lighthouse CI con presupuesto bundle (<2MB)
- [ ] Monitorización errores (Sentry/Bugsnag)
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

## ♿ ACCESIBILIDAD E INTERNACIONALIZACIÓN

### Accesibilidad
- [ ] Auditar contraste vistas core
- [ ] Focus management formularios/modales
- [ ] Navegación completa teclado
- [ ] Announcements ARIA acciones dinámicas
- [ ] Compliance WCAG 2.1 AA

### Internacionalización
- [ ] Completar traducciones ES/EN/FR
- [ ] Soporte RTL
- [ ] Detección automática idioma
- [ ] Fallbacks robustos
- [ ] Contexto cultural contenidos

---

## 📋 TODOs Y FIXMES EN CÓDIGO

**Encontrados:** 14,344 coincidencias en 5,027 archivos

**Principales categorías:**
1. **Integraciones pendientes:** OpenAI, Stripe, Spotify, Apple Pay
2. **Notificaciones:** Email, Slack, push pendientes de implementar
3. **Autenticación:** Tokens y verificaciones por completar
4. **Uploads:** Thumbnails automáticos, compresión de imágenes
5. **Testing:** Muchos helpers mock/deshabilitados
6. **Validaciones:** Verificaciones de permisos comentadas

**Ejemplos críticos:**
```javascript
// apps/main-app/src/services/stripeService.js:16
const token = localStorage.getItem('authToken'); // TODO: Ajustar según tu sistema de auth

// backend/services/applePaymentService.js:125
// TODO: Implementar verificación real con claves públicas de Apple

// apps/main-app/src/pages/suppliers/SupplierPlans.jsx:133
// TODO: Integrar con Stripe

// backend/routes/supplier-dashboard.js:489
// TODO: Enviar email a la pareja
```

---

## 🎯 TOP 10 TAREAS MÁS CRÍTICAS (Próximas 2 Semanas)

1. **Fix 4 tests Firestore Rules** → Desbloqueador crítico
2. **Estabilizar seeds/fixtures** → Base para tests E2E
3. **Proteger endpoint `/api/ai/debug-env`** → Seguridad
4. **Auditar PII en logs y endpoints** → GDPR compliance
5. **Crear helper respuesta API estándar** → Consistencia
6. **Refactorizar `ai.js` y `guests.js`** → API format
7. **Fix 13 tests E2E Seating** → Alta prioridad
8. **Modo móvil Seating Plan** → UX crítica
9. **Fix 7 tests E2E Email** → Core funcional
10. **Migración buzón legacy** → Deuda técnica

---

## 📊 DISTRIBUCIÓN POR PRIORIDAD

| Prioridad | Módulos | Tareas Estimadas | % Total |
|-----------|---------|------------------|---------|
| 🔴 Crítico | Tests, API, Seguridad | ~15 tareas | 7% |
| 🟠 Alta | Seating, Email, Finance, RSVP, Protocolo | ~80 tareas | 35% |
| 🟡 Media | Proveedores IA, Tasks, Creación, Asistente | ~45 tareas | 20% |
| 🟢 Media-Baja | Diseño Web, Invitaciones, Estilo | ~30 tareas | 13% |
| ⚪ Baja | Público, Gamificación, Contratos, etc. | ~60 tareas | 26% |

**Total:** ~230 tareas pendientes documentadas

---

## 🚀 FLUJOS SIN IMPLEMENTAR COMPLETAMENTE

### Bloqueadores de Monetización:
1. **Flujo 25:** Sistema suscripciones y pagos → ❌ 0%
2. **Flujo 29:** Upgrade de rol con checkout → ⚠️ 20%
3. **Flujo 2C:** Personalización IA continua → ❌ 0%

### Impacto UX Alto:
4. **Flujo 16:** Asistente IA backend multicanal → ⚠️ 50%
5. **Flujo 30:** Página inicio con datos reales → ⚠️ 55%

### Features Avanzadas:
6. **Flujo 14:** Checklist con IA → ⚠️ 75%
7. **Flujo 18:** Generador documentos legales → ⚠️ 40%
8. **Flujo 19:** Diseño invitaciones con IA → ⚠️ 85%

---

## 📈 MÉTRICAS DE COMPLETITUD POR ÁREA

| Área | Flujos | Implementado | Pendiente | % Completitud |
|------|--------|--------------|-----------|---------------|
| **Monetización** | 2 | 20% | 80% | 🔴 20% |
| **IA & Personalización** | 3 | 35% | 65% | 🟡 35% |
| **Gestión Core** | 12 | 65% | 35% | 🟢 65% |
| **Features Avanzadas** | 10 | 45% | 55% | 🟡 45% |
| **Experiencia Usuario** | 4 | 55% | 45% | 🟡 55% |
| **TOTAL** | 31 | 50% | 50% | 🟡 50% |

---

## 🎯 RECOMENDACIONES INMEDIATAS

### Fase 1: Desbloquear (1-2 semanas)
1. Resolver 4 tests Firestore Rules
2. Estabilizar seeds y fixtures
3. Proteger endpoints críticos (seguridad)
4. Auditar y filtrar PII (GDPR)

### Fase 2: Core Funcional (3-4 semanas)
1. Completar modo móvil Seating Plan
2. Migrar buzón legacy a UnifiedInbox
3. Implementar Open Banking básico
4. Completar RSVP con sync Seating

### Fase 3: Monetización (4-6 semanas)
1. Implementar sistema suscripciones (Flujo 25)
2. Completar upgrade roles con pago (Flujo 29)
3. Integrar Stripe/Braintree
4. Dashboard administración planes

### Fase 4: IA Avanzada (6-8 semanas)
1. Motor IA para Tasks personalizado
2. Asistente backend multicanal (Flujo 16)
3. Personalización continua (Flujo 2C)
4. Predicción gasto con IA

---

## 📚 REFERENCIAS

- `TAREAS_PENDIENTES_CONSOLIDADO.md` - Lista consolidada priorizada
- `docs/ROADMAP.md` - Estado canónico por flujo
- `docs/TODO.md` - Lista operativa por sprint
- `docs/REPORTE-FEATURES-PENDIENTES.md` - Features sin implementar
- `docs/PENDIENTE_IMPLEMENTACION_CONSOLIDADO.md` - Análisis gaps
- `roadmap.json` - Tareas técnicas en ejecución

---

**Última actualización:** 28 Diciembre 2025  
**Estado:** Proyecto operativo con ~230 tareas pendientes  
**Bloqueador crítico:** 4 tests Firestore Rules  
**Próxima acción:** Resolver tests para desbloquear 13+ tests E2E Seating
