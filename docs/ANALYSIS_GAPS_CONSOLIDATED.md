# Análisis Consolidado de Gaps - MaLoveApp/Lovenda

**Fecha:** 20 de octubre de 2025  
**Objetivo:** Consolidar todos los gaps entre documentación e implementación para crear un roadmap ejecutable

## Resumen Ejecutivo

Análisis completo comparando:
- Documentación técnica (TODO.md, ROADMAP.md, flujos específicos)
- Implementación actual (código fuente, tests E2E, servicios)
- roadmap.json (tareas técnicas en ejecución)
- IMPLEMENTATION_GAPS_REPORT.md (gaps técnicos identificados)

## 1. Gaps Críticos de Infraestructura

### 1.1 Tests Unitarios Bloqueados (CRÍTICO)
**Estado:** 3/3 tests de reglas Firestore fallando consistentemente
- `unit_rules` - Tests unitarios de reglas Firestore (seating)
- `unit_rules_exhaustive` - Tests exhaustivos de reglas
- `unit_rules_extended` - Tests extendidos de reglas

**Impacto:** Bloquea 13+ tests E2E de seating (prioridad alta)
**Acción requerida:** Debugear y corregir reglas Firestore o actualizar tests

### 1.2 Tests E2E Fallando
**Estado:** 50+ tests E2E con fallas
- Seating: 13 tests bloqueados por unit_rules
- Email: 7 tests (send, read, folders, tags, ai, smart-composer)
- Finance: 7 tests (budget, transactions, contributions, analytics)
- Auth: 5 tests (signup, login, social, reset, verify)
- RSVP: 1 test crítico (rsvp_confirm_by_token)
- Otros: guests, proveedores, protocolo, onboarding, inspiration, etc.

**Patrón identificado:** Muchos tests fallan por problemas de setup/seeds

### 1.3 API Response Format Inconsistency
**Estado:** Múltiples endpoints no siguen convenciones documentadas

**Endpoints afectados:**
- `backend/routes/ai.js` - No usa formato `{ success, data/error, requestId }`
- `backend/routes/guests.js` - Formato inconsistente en respuestas
- Falta `requestId` en respuestas manuales de error

**Acción requerida:** Implementar helper de respuesta estándar y refactorizar

## 2. Gaps por Módulo/Flujo

### 2.1 Seating Plan (Flujo 4, 13) - ALTA PRIORIDAD
**Documentado:** Plan completo con wizard export, mobile, colaboración, gamificación
**Implementado:** 
- ✅ Core básico funcional
- ✅ Wizard 3 pasos
- ✅ Templates de venue
- ✅ Locks optimistas
- ⚠️ Tests E2E fallando (bloqueados por unit_rules)

**Pendiente:**
- [ ] Modo móvil completo (FAB radial, panel inferior)
- [ ] GuestSidebar mobile (tabs Alertas/Recomendaciones/Staff)
- [ ] Gestos (pinch, double tap, swipe)
- [ ] Badges colaboración "En edición"
- [ ] Integración triggers gamificación
- [ ] Métricas analytics completas
- [ ] QA manual tablet/iPad
- [ ] Fix tests E2E (13 specs fallando)

### 2.2 Protocolo y Ceremonias (Flujos 11, 11A-E) - ALTA PRIORIDAD
**Documentado:** Sistema completo de protocolo con 5 sub-módulos
**Implementado:**
- ✅ Páginas base (AyudaCeremonia, Protocolo, Checklist)
- ✅ Estructura básica
- ⚠️ Tests E2E fallando

**Pendiente:**
- [ ] **11A - Momentos Especiales:** Campos avanzados (responsables, suppliers), drag&drop, destinatarios
- [ ] **11B - Timeline Día B:** Migrar a subcolección, estado editable, drag&drop
- [ ] **11C - Checklist Última Hora:** Alertas sonoras/push, sync con notificaciones
- [ ] **11D - Documentación Legal:** Catálogo internacional, variaciones por país, sync multiusuario
- [ ] **11E - Textos Ceremonia:** Tabs adicionales, control versiones, integración IA, E2E ayudantes

### 2.3 Email y Comunicaciones (Flujo 7, 20) - ALTA PRIORIDAD
**Documentado:** Sistema unificado de email con IA
**Implementado:**
- ✅ UnifiedInbox (nueva UI)
- ✅ EmailComposer con IA
- ✅ EmailStatistics
- ⚠️ Buzón legacy aún presente
- ⚠️ 7 tests E2E fallando

**Pendiente:**
- [ ] Resolver búsqueda/sort duplicado en `UnifiedInbox/EmailList`
- [ ] Onboarding con validaciones DKIM/SPF
- [ ] Persistencia server-side de auto-respuestas
- [ ] Migración definitiva del buzón legacy
- [ ] Actualizar tests E2E/VTU a nueva UI
- [ ] Fix 7 tests E2E (send, read, folders, tags, ai)

### 2.4 Presupuesto y Finanzas (Flujo 6) - ALTA PRIORIDAD
**Documentado:** Sistema completo con Open Banking y IA
**Implementado:**
- ✅ Finance.jsx con BudgetManager
- ✅ TransactionManager
- ✅ PaymentSuggestions
- ✅ Hooks useFinance, useSupplierBudgets
- ⚠️ 7 tests E2E fallando

**Pendiente:**
- [ ] Integración Open Banking completa
- [ ] Importación CSV/Excel con mapeo
- [ ] Reportes descargables (PDF/Excel)
- [ ] Gestión completa aportaciones
- [ ] Predicción gasto con IA
- [ ] Automatización pagos programados
- [ ] Fix 7 tests E2E (budget, transactions, contributions, analytics)

### 2.5 Invitados y RSVP (Flujos 3, 9) - ALTA PRIORIDAD
**Documentado:** Gestión completa con WhatsApp, check-in QR
**Implementado:**
- ✅ Invitados.jsx con CRUD
- ✅ RSVPDashboard
- ✅ AcceptInvitation
- ✅ WhatsApp modales
- ⚠️ Tests E2E con problemas

**Pendiente:**
- [ ] Sincronización completa con Seating Plan (bidireccional backend)
- [ ] Automatizaciones IA reactivas
- [ ] Exportaciones día B (check-in, QR individuales)
- [ ] Fix test E2E crítico (rsvp_confirm_by_token)
- [ ] Consolidar fixtures estables

### 2.6 Proveedores con IA (Flujo 5) - MEDIA PRIORIDAD
**Documentado:** Sistema inteligente con scoring IA
**Implementado:**
- ✅ GestionProveedores con AI modals
- ✅ Servicios aiSuppliersService
- ✅ Tracking de emails
- ⚠️ Tests E2E fallando

**Pendiente:**
- [ ] Scoring IA consolidado con métricas históricas
- [ ] Portal proveedor completo funcional
- [ ] Automatización RFQ multi-proveedor
- [ ] Reportes comparativos
- [ ] Fix tests E2E (flow, compare, smoke)

### 2.7 Tasks y Timeline (Flujo 5b, 14) - MEDIA PRIORIDAD
**Documentado:** Sistema con IA que personaliza plan maestro
**Implementado:**
- ✅ Tasks.jsx, TaskSidePanel
- ✅ EventsCalendar, Gantt
- ✅ Hook useWeddingTasksHierarchy
- ✅ Plantilla masterTimelineTemplate.json

**Pendiente:**
- [ ] Motor IA que genera plan personalizado desde plantilla maestra
- [ ] Matriz RACI y asignaciones múltiples
- [ ] Auto-priorización según proximidad
- [ ] Panel de riesgos con predicción
- [ ] Gamificación completa
- [ ] Sync bidireccional calendarios

### 2.8 Asistente Virtual e IA (Flujo 16) - MEDIA PRIORIDAD
**Documentado:** Orquestador multicanal con reglas configurables
**Implementado:**
- ⚠️ Componentes base ChatWidget
- ⚠️ Tests E2E básicos

**Pendiente:**
- [ ] Backend multicanal (AutomationOrchestrator)
- [ ] Reglas configurables (panel if/then)
- [ ] Workers dedicados para colas
- [ ] Auditoría completa con reversión
- [ ] Integración con flujos (tasks, proveedores, notificaciones)

### 2.9 Creación Boda/Evento (Flujos 2, 2B) - MEDIA PRIORIDAD
**Documentado:** Wizards múltiples con IA contextual
**Implementado:**
- ✅ CreateWeddingAI.jsx (wizard 2 pasos)
- ✅ CreateWeddingAssistant.jsx (conversacional)
- ✅ Catálogo eventStyles.js
- ⚠️ Tests E2E con problemas

**Pendiente:**
- [ ] Telemetría dedicada y dashboards funnel
- [ ] Iterar prompts/UX basado en feedback
- [ ] Múltiples rondas IA conversacional
- [ ] Consolidar con flujo clásico
- [ ] Fix tests E2E onboarding

### 2.10 Descubrimiento Personalizado (Flujo 2, 2C) - MEDIA PRIORIDAD
**Documentado:** Wizard con bloques condicionales y recomendaciones IA
**Implementado:**
- ⚠️ Parcial

**Pendiente:**
- [ ] Migrar wizard legacy al nuevo DiscoveryWizard
- [ ] Telemetría completa (`discovery_*`, `recommendation_*`)
- [ ] Recalculo en caliente de weddingInsights
- [ ] Dashboard funnel completo
- [ ] Suites Cypress flujo completo
- [ ] Seeds/fixtures perfiles representativos

### 2.11 Diseño Web y Personalización (Flujo 8) - MEDIA PRIORIDAD
**Documentado:** Editor con IA y dominio personalizado
**Implementado:**
- ✅ DisenoWeb.jsx, WebEditor.jsx
- ✅ Servicios websiteService
- ⚠️ Exposición de API keys en cliente

**Pendiente:**
- [ ] Mover llamadas OpenAI a backend
- [ ] Corregir guard de publicación
- [ ] Biblioteca prompts editable
- [ ] Dominio personalizado
- [ ] Analítica integrada
- [ ] Fix test E2E

### 2.12 Diseño Invitaciones (Flujo 19) - MEDIA PRIORIDAD
**Documentado:** Editor completo con IA
**Implementado:**
- ✅ InvitationDesigner.jsx
- ✅ VectorEditor.jsx
- ✅ Biblioteca plantillas

**Pendiente:**
- [ ] Editor colaborativo con comentarios
- [ ] Generación IA de propuestas
- [ ] Integración con proveedores impresión
- [ ] Biblioteca tutoriales
- [ ] Marketplace plantillas premium

### 2.13 Sitio Público (Flujo 21) - MEDIA PRIORIDAD
**Documentado:** Sitio público con personalización
**Implementado:**
- ✅ WeddingSite.jsx
- ✅ PublicWedding.jsx

**Pendiente:**
- [ ] Editor dedicado en panel con preview
- [ ] Dominios personalizados y SSL
- [ ] Analytics en tiempo real
- [ ] Integración comentarios/libro visitas
- [ ] Experiencia bodas múltiples

### 2.14 Gamificación (Flujo 17) - MEDIA PRIORIDAD
**Documentado:** Sistema completo de logros
**Implementado:**
- ✅ GamificationService
- ✅ Tests E2E completos

**Pendiente:**
- [ ] Conectar GamificationPanel con milestones visibles
- [ ] Publicar overlay de historial en UI
- [ ] Definir data-testids para widgets
- [ ] Programa recompensas intercambiables

### 2.15 Notificaciones (Flujo 12) - BAJA PRIORIDAD
**Documentado:** Centro completo con automatizaciones
**Implementado:**
- ✅ Notificaciones.jsx
- ✅ NotificationPreferences.jsx
- ✅ Backend routes

**Pendiente:**
- [ ] Centro de notificaciones completo
- [ ] Automation rules UI (if-then)
- [ ] Multi-canal SMS/push completo
- [ ] Panel auditoría y métricas

### 2.16 Contratos y Documentos (Flujo 15) - BAJA PRIORIDAD
**Documentado:** Sistema con firma digital
**Implementado:**
- ✅ Contratos.jsx
- ✅ SignatureService (stub)

**Pendiente:**
- [ ] Integración DocuSign/HelloSign completa
- [ ] Workflows de aprobación
- [ ] Analítica legal con IA
- [ ] Portal colaborativo proveedores

### 2.17 Generador Documentos Legales (Flujo 18) - BAJA PRIORIDAD
**Documentado:** Repositorio completo plantillas
**Implementado:**
- ✅ DocumentosLegales.jsx (básico)

**Pendiente:**
- [ ] Repositorio completo plantillas
- [ ] Firma electrónica integrada
- [ ] Almacenamiento backend
- [ ] Automatización IA

### 2.18 Multi-Boda (Flujo 10) - BAJA PRIORIDAD
**Documentado:** Gestión portfolio completo
**Implementado:**
- ✅ Bodas.jsx
- ✅ MultiWeddingSummary
- ✅ Permisos por módulo

**Pendiente:**
- [ ] Worker CRM procesamiento
- [ ] Métricas sincronización
- [ ] Panel MultiWeddingSummary
- [ ] Suites E2E permisos/CRM

### 2.19 Blog y Tendencias (Flujo 26) - BAJA PRIORIDAD
**Documentado:** Blog dedicado con RSS
**Implementado:**
- ⚠️ Básico

**Pendiente:**
- [ ] Página dedicada con archivo histórico
- [ ] Favoritos sincronizados
- [ ] Personalización según ubicación/etapa
- [ ] Notificaciones tendencias relevantes
- [ ] Artículos patrocinados

### 2.20 Momentos (Álbum Compartido) - Flujo 27 - BAJA PRIORIDAD
**Documentado:** Sistema completo con moderación IA
**Implementado:**
- ⚠️ Minimal

**Pendiente:**
- [ ] Moderación automática robusta (Vision API)
- [ ] Slideshow público controlado
- [ ] Gamificación (badges, leaderboard)
- [ ] Métricas completas
- [ ] Gestión tokens/QR avanzada

### 2.21 Planes y Suscripciones (Flujo 25) - BAJA PRIORIDAD
**Documentado:** Sistema cobro único por boda
**Implementado:**
- ✅ Documentación estratégica

**Pendiente:**
- [ ] Implementación técnica cobro
- [ ] Automatizaciones upgrade/downgrade
- [ ] Telemetría operativa
- [ ] Paneles rentabilidad

### 2.22 Admin Global (Flujo 0) - BAJA PRIORIDAD
**Documentado:** Panel completo con métricas
**Implementado:**
- ✅ Backend routes admin
- ✅ Test E2E admin-flow

**Pendiente:**
- [ ] MFA obligatorio TOTP
- [ ] Impersonación segura
- [ ] SSO corporativo
- [ ] Alertas push/Slack tiempo real
- [ ] Reportes semanales automáticos

## 3. Gaps Técnicos Críticos

### 3.1 Convenciones API
- [ ] Crear helper de respuesta estándar
- [ ] Refactorizar ai.js para formato consistente
- [ ] Refactorizar guests.js para formato consistente
- [ ] Incluir requestId en todos los errores
- [ ] Consolidar validación Zod

### 3.2 Seguridad
- [ ] Proteger endpoint `/api/ai/debug-env` (requireAdmin o desactivar)
- [ ] Filtrar PII en endpoints públicos
- [ ] Auditar logs para eliminar PII
- [ ] Mover API keys a backend (DisenoWeb)

### 3.3 Testing
- [ ] Fix tests unitarios reglas Firestore (CRÍTICO)
- [ ] Reparar 50+ tests E2E fallando
- [ ] Añadir tests unitarios rutas backend críticas
- [ ] Estabilizar seeds y fixtures

### 3.4 Performance
- [ ] Lighthouse CI configurado
- [ ] Bundle budget < 2MB
- [ ] Optimizar queries Firestore
- [ ] CDN para assets públicos

### 3.5 Observabilidad
- [ ] Dashboards métricas completos
- [ ] Alertas para errores críticos
- [ ] Logging centralizado
- [ ] APM configurado

## 4. Priorización de Implementación

### Sprint 1 (Semana 1-2) - CRÍTICO
**Objetivo:** Estabilizar infraestructura básica

1. **Fix tests unitarios reglas Firestore** (BLOQUEADOR)
   - Debugear y corregir 3 tests fallando
   - Desbloquea 13+ tests E2E seating

2. **Estandarizar API responses**
   - Crear helper respuesta estándar
   - Refactorizar ai.js y guests.js
   - Incluir requestId en errores

3. **Fix tests E2E críticos** (top 10)
   - rsvp_confirm_by_token
   - email send/read/folders
   - budget_flow
   - guests_flow
   - seating_smoke

4. **Seguridad básica**
   - Proteger debug endpoints
   - Mover API keys a backend
   - Auditar PII en endpoints públicos

### Sprint 2 (Semana 3-4) - ALTA PRIORIDAD
**Objetivo:** Completar módulos core

5. **Seating Plan - Completar**
   - Modo móvil completo
   - GuestSidebar mobile
   - Badges colaboración
   - Fix 13 tests E2E

6. **Email - Unificar**
   - Migrar de buzón legacy
   - Fix búsqueda duplicada
   - Onboarding DKIM/SPF
   - Fix 7 tests E2E

7. **Finance - Completar**
   - Importación CSV/Excel
   - Open Banking UI
   - Reportes descargables
   - Fix 7 tests E2E

8. **RSVP - Sincronización**
   - Sincronización bidireccional con Seating
   - Automatizaciones IA
   - Fix tests E2E

### Sprint 3 (Semana 5-6) - MEDIA PRIORIDAD
**Objetivo:** Módulos secundarios clave

9. **Protocolo - Implementar subsistemas**
   - 11A: Momentos especiales avanzado
   - 11B: Timeline día B editable
   - 11C: Checklist alertas
   - 11D: Legal internacional
   - 11E: Textos ceremonia versiones

10. **Proveedores - Scoring IA**
    - Portal proveedor funcional
    - Automatización RFQ
    - Reportes comparativos

11. **Tasks - Motor IA**
    - Generación plan personalizado
    - Matriz RACI
    - Panel riesgos

12. **Creación Boda - Telemetría**
    - Dashboards funnel
    - Iteración prompts IA
    - Consolidación flows

### Sprint 4 (Semana 7-8) - MEDIA-BAJA PRIORIDAD
**Objetivo:** Funcionalidades avanzadas

13. **Asistente Virtual**
    - Backend multicanal
    - Reglas configurables
    - Workers dedicados

14. **Descubrimiento Personalizado**
    - Migrar wizard legacy
    - Recalculo insights
    - Dashboard funnel

15. **Diseño Web**
    - Editor prompts
    - Dominio personalizado
    - Analítica integrada

16. **Invitaciones**
    - Editor colaborativo
    - Generación IA
    - Marketplace premium

### Sprint 5+ (Semana 9+) - BAJA PRIORIDAD
**Objetivo:** Features adicionales

17. Sitio Público avanzado
18. Gamificación UI
19. Notificaciones centro completo
20. Contratos firma digital
21. Multi-boda worker CRM
22. Blog dedicado
23. Momentos álbum completo
24. Suscripciones implementación
25. Admin MFA y SSO

## 5. Métricas de Éxito

### Infraestructura
- [ ] 100% tests unitarios pasando
- [ ] 90%+ tests E2E críticos pasando
- [ ] Bundle < 2MB
- [ ] Lighthouse score > 90

### Funcionalidad
- [ ] Seating Plan mobile funcional
- [ ] Email unificado en producción
- [ ] Finance con Open Banking
- [ ] RSVP sincronizado con Seating
- [ ] Protocolo 5 subsistemas funcionales

### Calidad Código
- [ ] API responses estandarizadas
- [ ] Sin API keys en cliente
- [ ] PII protegida
- [ ] Logs sin información sensible

### Documentación
- [ ] TODO actualizado con progreso
- [ ] ROADMAP sincronizado con implementación
- [ ] roadmap.json con tareas ejecutables
- [ ] Docs técnicos actualizados

## 6. Riesgos Identificados

### Alto Riesgo
1. **Tests bloqueados:** Sin resolver unit_rules, 13+ tests E2E bloqueados
2. **Deuda técnica API:** Formato inconsistente dificulta mantenimiento
3. **Seguridad:** API keys expuestas, PII sin protección adecuada

### Medio Riesgo
4. **Complejidad integración:** Seating-RSVP sincronización bidireccional compleja
5. **IA prompts:** Calidad respuestas depende de iteración continua
6. **Performance:** Sin optimización queries puede degradar con escala

### Bajo Riesgo
7. **Features opcionales:** Módulos como Blog, Momentos no bloquean core
8. **UI polish:** Mejoras UX pueden iterarse post-lanzamiento

## 7. Recomendaciones

### Inmediatas
1. Asignar developer senior a fix tests unitarios (prioridad #1)
2. Crear task force para estandarización API
3. Auditoría seguridad antes de cualquier feature nueva
4. Freeze features, focus en estabilización

### Corto Plazo
5. Implementar CI/CD gates (tests + security + performance)
6. Code reviews obligatorios para cambios críticos
7. Documentación técnica actualizada con cada PR
8. Weekly status reviews con stakeholders

### Largo Plazo
9. Refactoring progresivo deuda técnica
10. Automatización completa testing
11. Monitoreo proactivo producción
12. Plan capacitación equipo en mejores prácticas

---

**Próximos pasos:**
1. Actualizar TODO.md con gaps consolidados
2. Crear roadmap detallado en tareas pequeñas
3. Comenzar implementación Sprint 1
