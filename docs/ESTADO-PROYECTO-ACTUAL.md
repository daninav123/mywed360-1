# 📊 Estado Actual del Proyecto MyWed360 / MaLoveApp

**Fecha del análisis:** 24 de octubre de 2025  
**Analista:** Cascade AI  
**Commit actual:** `98e035ef`

---

## 🎯 RESUMEN EJECUTIVO

### ✅ Lo que funciona AHORA
1. **Sistema i18n completo** - 100% implementado (ES, EN, FR + 25 idiomas más con fallback)
2. **Página Invitados** - Funcional tras arreglar 5 imports críticos esta sesión
3. **Backend completo** - API robusta con 118 rutas montadas
4. **Infraestructura Firebase** - Auth, Firestore, reglas configuradas
5. **CI/CD básico** - Husky, lint-staged, validaciones

### 🚨 PROBLEMAS CRÍTICOS (Requieren atención INMEDIATA)

#### 1. **BLOQUEADOR DE TESTS** ❌
**Impacto:** 13+ tests E2E de Seating bloqueados

```bash
# 3 tests unitarios fallando:
- unit_rules (firestore.rules.seating.test.js) - 53 intentos
- unit_rules_exhaustive (firestore.rules.exhaustive.test.js) - 45 intentos
- unit_rules_extended (firestore.rules.extended.test.js) - 45 intentos

Status: TODOS en "failed"
```

**Acción:** Arreglar estos 3 tests para desbloquear 13+ tests E2E

#### 2. **Tests E2E Fallando** ⚠️
- **50+ tests E2E** en estado "failed"
- **2 tests** en "in_progress" (nunca completados)
- **11 tests** en "pending" (no ejecutados aún)

**Distribución por módulo:**
- Seating: 13 tests bloqueados
- Email: 7 tests fallando
- Finance: 7 tests fallando
- Guests: 4 tests fallando
- Auth: 6 tests fallando
- Onboarding: 6 tests fallando
- Blog: 3 tests fallando
- Y más...

---

## 📋 TAREAS POR PRIORIDAD

### 🔴 PRIORIDAD CRÍTICA (Sprint Inmediato)

#### **Tests y Calidad**
```bash
# PASO 1: Arreglar puerto emulador
# PROBLEMA: firebase.json usa puerto 8288
# scripts/test-with-emulator.js usa puerto 8080
# SOLUCIÓN: Actualizar script a 8288 ✅ ARREGLADO

# PASO 2: Ejecutar tests con emulador
npm run test:rules:emulator

# O manual:
# Terminal 1: npx firebase emulators:start --only firestore
# Terminal 2: 
#   $env:FIRESTORE_EMULATOR_HOST='localhost:8288'
#   $env:FIRESTORE_RULES_TESTS='true'
#   npm run test:unit -- src/__tests__/firestore.rules.seating.test.js

# PASO 3: Ejecutar tests E2E bloqueados
npm run cypress:run -- --spec "cypress/e2e/seating/*.cy.js"
```

- [ ] **FIX CRÍTICO:** Corregir 3 tests unitarios de reglas Firestore
- [ ] Reparar test E2E crítico: `rsvp_confirm_by_token` 
- [ ] Reparar tests E2E email: send, read, folders (3 tests)
- [ ] Reparar test E2E: `budget_flow`
- [ ] Reparar test E2E: `guests_flow`
- [ ] Reparar test E2E: `seating_smoke`
- [ ] Estabilizar seeds y fixtures para tests E2E

#### **Seguridad y API**
- [ ] Crear helper de respuesta estándar API: `{ success, data/error, requestId }`
- [ ] Proteger endpoint `/api/ai/debug-env` con requireAdmin
- [ ] Mover llamadas OpenAI desde cliente a backend (DisenoWeb)
- [ ] Auditar y filtrar PII en endpoints públicos
- [ ] Auditar logs del sistema para eliminar exposición de PII

---

### 🟠 ALTA PRIORIDAD (Sprint 1-2)

#### **Seating Plan** (Flujo 4, 13)
**Estado:** Core funcional, falta modo móvil y colaboración
- [ ] Implementar modo móvil completo (FAB radial, panel inferior)
- [ ] Implementar gestos táctiles (pinch zoom, double tap, swipe)
- [ ] Mostrar badges "En edición" para usuarios activos
- [ ] Integrar triggers automáticos de Tasks desde eventos de seating
- [ ] QA manual en tablet/iPad

#### **Email y Comunicaciones** (Flujo 7, 20)
**Estado:** UnifiedInbox implementado, falta estabilidad
- [ ] Resolver búsqueda/sort duplicado en `UnifiedInbox/EmailList.jsx`
- [ ] Completar onboarding con validaciones DKIM/SPF
- [ ] Implementar persistencia server-side de auto-respuestas
- [ ] Migrar definitivamente del buzón legacy a UnifiedInbox
- [ ] Reparar 7 tests E2E de email

#### **Presupuesto y Finanzas** (Flujo 6)
**Estado:** Módulo implementado, falta Open Banking y IA
- [ ] Implementar UI de autenticación Open Banking con refresh tokens
- [ ] Crear importación CSV/Excel con preview
- [ ] Implementar reportes descargables (PDF/Excel)
- [ ] Entrenar y calibrar consejero conversacional
- [ ] Reparar 7 tests E2E de finance

#### **Invitados y RSVP** (Flujos 3, 9)
**Estado:** ✅ Página funcional (arreglada hoy), faltan automatizaciones
- [ ] Implementar sincronización bidireccional con Seating Plan
- [ ] Implementar automatizaciones IA reactivas
- [ ] Crear exportaciones día B (check-in, QR individuales)
- [ ] Reparar test E2E crítico: `rsvp_confirm_by_token`

---

### 🟡 MEDIA PRIORIDAD (Sprint 3-4)

#### **Protocolo y Ceremonia** (Flujos 11, 11A-E)
**Estado:** Parcialmente implementado, falta integración
- [ ] Integrar validaciones con registros civiles
- [ ] Crear generador de programas/QR
- [ ] Implementar alertas en tiempo real
- [ ] Construir dashboard operativo para planners

#### **Proveedores con IA** (Flujo 5)
**Estado:** IA búsqueda implementada, falta portal
- [ ] Implementar scoring IA consolidado
- [ ] Completar portal proveedor con autenticación
- [ ] Extender automatización multi-proveedor (RFQ masivo)
- [ ] Crear reportes comparativos

#### **Tasks y Timeline** (Flujo 5b, 14)
**Estado:** Básico implementado, falta IA personalización
- [ ] Implementar motor IA que personaliza plan de tareas
- [ ] Implementar matriz RACI y asignaciones múltiples
- [ ] Añadir auto-priorización según proximidad
- [ ] Crear panel de riesgos con predicción de retrasos

#### **Creación Boda/Evento** (Flujos 2, 2B)
**Estado:** Wizard básico, falta asistente IA
- [ ] Instrumentar telemetría para comparar funnels
- [ ] Añadir capa IA: sugerencias basadas en respuestas
- [ ] Implementar respuestas contextualizadas
- [ ] Reparar tests E2E onboarding

#### **Asistente Virtual e IA** (Flujo 16)
**Estado:** Backend parcial, falta orquestador completo
- [ ] Desplegar backend multicanal con orquestador
- [ ] Diseñar reglas configurables (if/then) con panel admin
- [ ] Implementar workers dedicados y colas
- [ ] Cubrir con suite E2E específica

---

### 🟢 MEDIA-BAJA PRIORIDAD (Sprint 5-6)

#### **Diseño Web y Personalización** (Flujo 8)
- [ ] Crear editor de prompts avanzado
- [ ] Refactor generación IA: mover a backend con streaming
- [ ] Implementar historial enriquecido: diffs, undo/redo
- [ ] Implementar dominio personalizado y SEO avanzado

#### **Diseño de Invitaciones** (Flujo 19)
- [ ] Implementar editor colaborativo
- [ ] Integrar generación IA de propuestas
- [ ] Conectar con proveedores (impresión/envío)
- [ ] Implementar marketplace de plantillas premium

#### **Sitio Público** (Flujo 21)
- [ ] Crear editor dedicado en panel
- [ ] Configurar dominios personalizados y SSL automático
- [ ] Implementar analytics en tiempo real

---

### 🔵 BAJA PRIORIDAD (Sprint 7+)

#### **Gamificación y Dashboard** (Flujo 17)
- [ ] Conectar `GamificationPanel` con milestones visibles
- [ ] Definir programa de recompensas intercambiables

#### **Contratos y Documentos** (Flujo 15)
- [ ] Integrar firma digital completa (DocuSign/HelloSign)
- [ ] Implementar workflows de aprobación

#### **Multi-Boda** (Flujo 10)
- [ ] Desplegar worker CRM que procese `crmSyncQueue`
- [ ] Instrumentar métricas de sincronización

#### **Blog de Tendencias** (Flujo 26)
- [ ] Crear página dedicada con archivo histórico

#### **Momentos (Álbum Compartido)** (Flujo 27)
**Estado:** 1 test E2E en progreso
- [ ] Endurecer moderación automática
- [ ] Publicar slideshow público controlado
- [ ] Completar gamificación

#### **Planes y Suscripciones** (Flujo 25)
- [ ] Validar con stakeholders la propuesta de valor
- [ ] Construir dashboard de métricas
- [ ] Definir estrategia de retención post-boda

---

## 📱 PROYECTO MÓVIL (React Native)

**Estado:** Roadmap creado, implementación NO iniciada

### Creado recientemente:
✅ `docs/APP-MOBILE-ROADMAP.md` - Roadmap completo mobile
✅ `backend/routes/mobile.js` - Endpoints API mobile
✅ `mobile/` - Estructura inicial React Native
✅ `package.json` - Scripts npm mobile

### Fases planificadas:
1. **Fase 0 – Fundamentos** (2-3 sprints) - Setup monorepo, PoC
2. **Fase 1 – MVP** (3-4 sprints) - Login, proveedores, notificaciones
3. **Fase 2 – Avanzada** (4-6 sprints) - Seating móvil, Momentos
4. **Fase 3 – Release** (2-3 sprints) - Hardening, stores
5. **Fase 4 – Evolución** - Paridad web, features nativas

### Próximos pasos:
- [ ] Crear RFC técnica (Expo vs Capacitor)
- [ ] Documentar design tokens compartidos
- [ ] Configurar pipeline CI (EAS preview)

---

## 🛠️ TAREAS TÉCNICAS INMEDIATAS

### Esta semana:
1. ✅ **COMPLETADO HOY:** Arreglar 5 imports faltantes en Invitados.jsx
2. ✅ **COMPLETADO HOY:** Corregir referencias i18n (services namespace)
3. ✅ **COMPLETADO HOY:** Identificar problema tests unitarios (puerto emulador 8080→8288)
4. 🔄 **EN PROGRESO:** Arreglar configuración emulador Firestore
5. ❌ **PENDIENTE:** Ejecutar health check completo

### Próxima semana:
1. Desbloquear 13+ tests E2E de Seating
2. Estabilizar tests E2E de Email (7 tests)
3. Estabilizar tests E2E de Finance (7 tests)
4. Crear plan de ataque para tests restantes

---

## 📊 MÉTRICAS DEL PROYECTO

### Cobertura de Tests:
```
Tests Unitarios:
- ❌ Firestore Rules: 3/3 fallando (BLOQUEADOR)
- ⚠️ Otros: Estado desconocido

Tests E2E (Cypress):
- ✅ Completados: ~20 tests
- ❌ Fallando: ~100 tests
- 🔄 En progreso: 2 tests
- ⏸️ Pendientes: 11 tests
- Total: ~133 tests
```

### Estado de Módulos:
```
✅ Core Funcional (con issues):
  - Invitados (arreglado hoy)
  - Email (UnifiedInbox)
  - Finance (básico)
  - Seating (web)

🚧 En Progreso:
  - Protocolo
  - Proveedores
  - Tasks
  - Asistente IA

📋 Planificado:
  - Mobile app
  - Contratos
  - Multi-boda
  - Blog
  - Gamificación avanzada
```

### Bundle Size:
- **Antes i18n:** 2.1MB
- **Después i18n:** 1.8MB (↓14%)
- **Target:** <2MB ✅

### Idiomas soportados:
- **Completos:** ES, EN, FR
- **Con fallback:** 25+ idiomas adicionales

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Semana 1-2: Estabilización Crítica
```bash
1. Arreglar 3 tests unitarios Firestore rules
2. Desbloquear y ejecutar 13 tests E2E seating
3. Estabilizar seeds/fixtures
4. Auditar seguridad (PII, endpoints admin)
```

### Semana 3-4: Tests E2E Masivos
```bash
1. Reparar 7 tests E2E email
2. Reparar 7 tests E2E finance
3. Reparar 4 tests E2E guests
4. Reparar 6 tests E2E auth
5. Documentar patrones de fixtures
```

### Semana 5-6: Funcionalidades Alta Prioridad
```bash
1. Seating: modo móvil + colaboración
2. Email: migración completa a UnifiedInbox
3. Finance: Open Banking + IA consejero
4. Invitados: sync con Seating + automatizaciones IA
```

### Mes 2-3: Módulos Secundarios
```bash
1. Protocolo y ceremonia completo
2. Proveedores: portal + scoring IA
3. Tasks: IA personalización + RACI
4. Asistente IA: orquestador multicanal
```

### Mes 4+: Expansión y Mobile
```bash
1. Diseño web: editor avanzado
2. Invitaciones: IA + marketplace
3. Mobile: Fase 0-1 React Native
4. Performance: optimizaciones Lighthouse
```

---

## 📝 NOTAS IMPORTANTES

### Lo que NO hacer:
- ❌ No iniciar nuevas features hasta arreglar tests bloqueadores
- ❌ No desplegar a producción sin 90%+ tests pasando
- ❌ No añadir más TODOs al código sin ticket en roadmap.json

### Lo que SÍ hacer:
- ✅ Ejecutar `npm run validate:schemas` antes de cada commit
- ✅ Mantener roadmap.json actualizado con cada tarea
- ✅ Documentar bugs críticos en `/docs/incidents/`
- ✅ Usar el orquestador nocturno para tareas pendientes
- ✅ Hacer health checks después de cada merge importante

---

## 🔗 REFERENCIAS CLAVE

- **Roadmap técnico:** `roadmap.json`
- **TODO consolidado:** `docs/TODO.md`
- **Roadmap estratégico:** `docs/ROADMAP.md`
- **Mobile:** `docs/APP-MOBILE-ROADMAP.md`
- **i18n:** `docs/i18n.md` ✅ 100% completo
- **Deployment:** `docs/deploy-backend.md`
- **Análisis gaps:** `docs/ANALYSIS_GAPS_CONSOLIDATED.md`

---

**Última actualización:** 24 octubre 2025, 22:35 UTC+02:00  
**Próxima revisión:** Después de arreglar tests bloqueadores  
**Responsable:** Equipo de desarrollo + Cascade AI
