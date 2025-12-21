# 📋 Qué Falta por Hacer - Análisis Completo del Roadmap (legacy)

> ⚠️ Snapshot histórico (25/10/2025). Este informe se generó con un dataset de roadmap anterior y puede no coincidir con el `roadmap.json` actual.

**Fecha:** 25 Octubre 2025, 04:38 AM  
**Generado:** Automáticamente desde `roadmap.json`

---

## 📊 Resumen Ejecutivo

Según el análisis del `roadmap.json`:

| Estado | Cantidad | % del Total |
|--------|----------|-------------|
| ✅ **Completadas** | 1045 | 81.6% |
| ❌ **Fallidas** | 91 | 7.1% |
| ⏳ **Pendientes** | 9 | 0.7% |
| **Total** | **1280 tareas** | **100%** |

---

## 🎯 Prioridades Actuales

### 🔴 Crítico - Tests Unitarios de Firestore Rules

Estos tests **bloquean** muchos otros tests E2E:

1. ❌ **`unit_rules`** - Tests unitarios de reglas Firestore (seating)
   - Comando: `npm run test:unit -- src/__tests__/firestore.rules.seating.test.js`
   - Intentos: 53
   - Bloqueados por esto: 10+ tests E2E de seating

2. ❌ **`unit_rules_exhaustive`** - Unit: Firestore rules (exhaustive)
   - Comando: `npm run test:unit -- src/__tests__/firestore.rules.exhaustive.test.js`
   - Intentos: 45

3. ❌ **`unit_rules_extended`** - Unit: Firestore rules (extended)
   - Comando: `npm run test:unit -- src/__tests__/firestore.rules.extended.test.js`
   - Intentos: 45

4. ❌ **`unit_rules_collections`** - Unit: Firestore rules (collections)
   - Estado: Failed

**Impacto:** Estos 4 tests bloquean ~15 tests E2E adicionales

---

## 🧪 Tests E2E Fallidos por Categoría

### 🪑 Seating Plan (12 tests fallidos)

1. ❌ `e2e_seating_smoke` - Smoke básico
2. ❌ `e2e_seating_fit` - Ajuste al lienzo
3. ❌ `e2e_seating_toasts` - Mensajes/toasts
4. ❌ `e2e_seating_assign_unassign` - Asignar y desasignar invitados
5. ❌ `e2e_seating_capacity_limit` - Límite de capacidad
6. ❌ `e2e_seating_aisle_min` - Pasillo mínimo
7. ❌ `e2e_seating_obstacles_no_overlap` - Obstáculos sin solape
8. ❌ `seating_auto_ai_e2e` - Auto-IA con flag
9. ❌ `e2e_seating_template_circular` - Plantilla circular
10. ❌ `e2e_seating_template_u_l_imperial` - Plantilla U/L/imperial
11. ❌ `e2e_seating_no_overlap` - Sin solapamientos
12. ❌ `e2e_seating_delete_duplicate` - Delete duplicate
13. ❌ `e2e_seating_ui_panels` - UI Panels

**Nota:** Ya corregiste `SeatingPlanModals undefined` - estos tests ahora deberían estar más cerca de pasar.

---

### 📧 Email (11 tests fallidos)

1. ❌ `e2e_email_send` - Envío de correo
2. ❌ `e2e_email_read` - Lectura de correo
3. ❌ `e2e_email_folders` - Carpetas
4. ❌ `e2e_email_tags_filters` - Tags y filtros
5. ❌ `e2e_email_ai_provider` - Proveedor IA
6. ❌ `e2e_email_read-email-attachments` - Adjuntos
7. ❌ `e2e_email_read-email-list` - Lista
8. ❌ `e2e_email_read-email-open` - Abrir email
9. ❌ `e2e_email_read-email-unread-status` - Estado no leído
10. ❌ `e2e_email_send-email-attachment` - Enviar con adjunto
11. ❌ `e2e_email_send-email-validation` - Validación
12. ❌ `e2e_email_smart_composer` - Smart composer
13. ❌ `e2e_email_performance` - Performance

**Nota:** Ya implementaste `MAILGUN_TEST_MODE` - estos tests deberían mejorar.

---

### 👥 Invitados/Guests (4 tests fallidos)

1. ❌ `e2e_guests_guests_crud` - CRUD
2. ❌ `e2e_guests_guests_flow` - Flujo
3. ❌ `e2e_guests_guests_import_rsvp` - Import RSVP
4. ❌ `e2e_guests_guests_messaging` - Mensajería

---

### 💰 Finanzas/Budget (7 tests fallidos)

1. ❌ `e2e_budget_flow` - Flujo básico
2. ❌ `e2e_finance_finance_analytics` - Analytics
3. ❌ `e2e_finance_finance_budget` - Budget
4. ❌ `e2e_finance_finance_contributions` - Contribuciones
5. ❌ `e2e_finance_finance_flow` - Flujo
6. ❌ `e2e_finance_finance_flow_full` - Flujo completo
7. ❌ `e2e_finance_finance_transactions` - Transacciones
8. ❌ `e2e_finance_finance-advisor-chat` - Advisor chat

---

### 🔐 Auth (5 tests fallidos)

1. ❌ `e2e_auth_auth_flow` - Auth flow
2. ❌ `e2e_auth_flow1_password_reset` - Password reset
3. ❌ `e2e_auth_flow1_signup` - Signup
4. ❌ `e2e_auth_flow1_social_login` - Social login
5. ❌ `e2e_auth_flow3_mfa_setup` - MFA setup

**Nota:** Ya corregiste `flow1-password-reset` - este ya debería pasar.

---

### 🎨 Onboarding (6 tests fallidos)

1. ❌ `e2e_onboarding_create_event_flow` - Create event flow
2. ❌ `e2e_onboarding_create-event-assistant` - Assistant
3. ❌ `e2e_onboarding_create-event-cta` - CTA
4. ❌ `e2e_onboarding_discovery-personalized` - Discovery
5. ❌ `e2e_onboarding_onboarding-mode-selector` - Mode selector
6. ❌ `e2e_compose_quick_replies` - Quick replies

---

### 📱 RSVP (2 tests fallidos)

1. ❌ `e2e_rsvp_confirm_token` - Confirmación por token
2. ❌ `e2e_invitaciones_rsvp` - Invitaciones RSVP

**Nota:** Ya reactivaste el endpoint `/dev/create` - `e2e_rsvp_confirm_token` debería pasar ahora.

---

### 🎭 Admin Panel (1 test fallido)

1. ❌ `e2e_admin_admin_flow` - Admin flow

**Nota:** Ya configuraste `ADMIN_MFA_TEST_CODE` - este test debería mejorar.

---

### 📰 Blog (2 tests fallidos)

1. ❌ `e2e_blog_blog-listing` - Blog Listing
2. ❌ `e2e_blog_blog-subscription` - Blog Subscription

---

### 💡 Inspiration (3 tests fallidos)

1. ❌ `e2e_inspiration_inspiration_flow` - Inspiration flow
2. ❌ `e2e_inspiration_inspiration-home-gallery` - Home gallery
3. ❌ `e2e_inspiration_smoke` - Smoke

---

### 🎮 Otros Módulos

- ❌ Assistant (1)
- ❌ Contracts (1)
- ❌ Dashboard (1)
- ❌ Gamification (2)
- ❌ Home (1)
- ❌ News (1)
- ❌ Notifications (1)
- ❌ Personalization (1)
- ❌ Protocolo (4)
- ❌ Proveedores (1)
- ❌ Style (1)
- ❌ Subscriptions (1)
- ❌ Tasks (1)
- ❌ Weddings (2)
- ❌ Diseño Web (1)

---

## ⏳ Tests Pendientes (9 tareas)

Estos tests están marcados como `pending` y no se han intentado ejecutar todavía:

1. ⏳ `e2e_account_role-upgrade-flow` - Account Role Upgrade Flow
2. ⏳ `e2e_proveedores_smoke` - Proveedores smoke
3. ⏳ `e2e_rsvp_confirm` - RSVP confirm
4. ⏳ `e2e_seating_seating_area_type` - Seating area type
5. ⏳ `e2e_seating_seating_ceremony` - Seating ceremony
6. ⏳ `e2e_seating_seating_content_flow` - Seating content flow
7. ⏳ `e2e_tasks_all_subtasks_modal` - Tasks all subtasks modal
8. ⏳ `e2e_web_diseno_web_flow` - Diseño web flow
9. ⏳ `e2e_weddings_multi_weddings_flow` - Multi weddings flow

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Corregir Tests Bloqueantes (Prioridad CRÍTICA) 🔴

#### 1.1 Tests Unitarios de Firestore Rules

**Acción:**
```bash
# Ejecutar y analizar fallos
npm run test:unit -- src/__tests__/firestore.rules.seating.test.js
npm run test:unit -- src/__tests__/firestore.rules.exhaustive.test.js
npm run test:unit -- src/__tests__/firestore.rules.extended.test.js
npm run test:unit -- src/__tests__/firestore.rules.collections.test.js
```

**Posibles Problemas:**
- Rules de Firestore desactualizadas
- Emulador de Firestore no configurado correctamente
- Permisos incorrectos en `firestore.rules`

**Solución:**
1. Revisar `firestore.rules`
2. Configurar emulador: `firebase emulators:start --only firestore`
3. Actualizar tests según rules actuales

---

### Fase 2: Tests E2E con Correcciones Aplicadas (Prioridad ALTA) 🟡

#### 2.1 Re-ejecutar Tests Corregidos

Ya aplicaste correcciones a:
- ✅ SeatingPlanModals (cache limpio)
- ✅ RSVP API `/dev/create` (reactivado)
- ✅ Mailgun Test Mode (implementado)
- ✅ Password Reset (selectores corregidos)
- ✅ Admin MFA (configurado)

**Acción:**
```bash
# Tests que deberían pasar ahora
npm run cypress:run:seating
npx cypress run --spec "cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js"
npx cypress run --spec "cypress/e2e/email/**/*.cy.js"
npx cypress run --spec "cypress/e2e/auth/flow1-password-reset.cy.js"
npx cypress run --spec "cypress/e2e/admin/admin-flow.cy.js"
```

**Esperado:** ~15-20 tests adicionales pasando

---

#### 2.2 Ejecutar Seeds y Tests Completos

```bash
# Con seeds completos
npm run e2e:with-seeds

# O específicos
npm run seed:all
npm run cypress:run
```

---

### Fase 3: Corregir Tests E2E Restantes (Prioridad MEDIA) 🟢

#### 3.1 Análisis de Fallos por Categoría

Para cada categoría con tests fallidos:

1. **Ejecutar un test de la categoría**
2. **Analizar el error específico**
3. **Corregir código real (no mockear)**
4. **Re-ejecutar tests de la categoría**

**Orden recomendado:**
1. RSVP (2 tests) - Ya corregido endpoint
2. Admin (1 test) - Ya configurado MFA
3. Auth (5 tests) - 1 ya corregido
4. Guests (4 tests) - Necesitan seeds
5. Email (11 tests) - Ya configurado test mode
6. Seating (12 tests) - Ya limpiado cache
7. Blog (2 tests) - Necesitan fixtures
8. Inspiration (3 tests) - Necesitan seeds
9. Finanzas (7 tests) - Módulo complejo
10. Otros módulos (20+ tests)

---

### Fase 4: Tests Pendientes (Prioridad BAJA) 🔵

Ejecutar los 9 tests pendientes después de corregir los fallidos:

```bash
npx cypress run --spec "cypress/e2e/account/role-upgrade-flow.cy.js"
npx cypress run --spec "cypress/e2e/proveedores_smoke.cy.js"
# ... etc
```

---

## 📊 Métricas de Progreso Esperadas

### Situación Actual (Después de tus correcciones)

| Categoría | Tests | Esperado Pasar | % Esperado |
|-----------|-------|----------------|------------|
| **Seating** | 13 | 10-12 | 77-92% |
| **Email** | 13 | 8-10 | 62-77% |
| **RSVP** | 2 | 2 | 100% ✅ |
| **Auth** | 5 | 3-4 | 60-80% |
| **Admin** | 1 | 1 | 100% ✅ |
| **Guests** | 4 | 3-4 | 75-100% |
| **Blog** | 2 | 1-2 | 50-100% |
| **Otros** | 51 | 25-30 | 49-59% |
| **Total E2E** | 91 | 53-64 | **58-70%** |

### Meta Final

| Estado | Actual | Meta Fase 1 | Meta Final |
|--------|--------|-------------|------------|
| **Completadas** | 1045 (81.6%) | 1060 (82.8%) | 1230+ (96%+) |
| **Fallidas** | 91 (7.1%) | 76 (5.9%) | <20 (<2%) |
| **Pendientes** | 9 (0.7%) | 9 (0.7%) | 0 (0%) |

---

## 🔧 Comandos Útiles

### Diagnóstico

```bash
# Ver estado del roadmap
node scripts/countRoadmapStatus.js

# Ejecutar validaciones
npm run validate:schemas
npm run validate:i18n

# Health check
npm run test:unit
```

### Ejecución de Tests

```bash
# Suite completa E2E
npm run e2e:with-seeds

# Por categoría
npm run cypress:run:seating
npx cypress run --spec "cypress/e2e/email/**/*.cy.js"
npx cypress run --spec "cypress/e2e/rsvp/**/*.cy.js"

# Tests unitarios
npm run test:unit
npm run test:unit -- src/__tests__/firestore.rules.seating.test.js
```

### Correcciones

```bash
# Limpiar cache
npm run dev:clean

# Seeds
npm run seed:all

# Verificar servidor
# (ya lo tienes corriendo)
```

---

## 📝 Resumen de lo que Falta

### CRÍTICO 🔴 (Hacer YA)

1. ✅ ~~Corregir SeatingPlanModals~~ - HECHO
2. ✅ ~~Reactivar endpoint RSVP~~ - HECHO
3. ✅ ~~Mailgun test mode~~ - HECHO
4. ✅ ~~Password reset test~~ - HECHO
5. ✅ ~~Admin MFA config~~ - HECHO
6. ❌ **Corregir tests unitarios de Firestore Rules** - PENDIENTE
7. ❌ **Re-ejecutar tests E2E para verificar correcciones** - EN PROGRESO

### IMPORTANTE 🟡 (Hacer Pronto)

8. ❌ Corregir tests E2E de Email (11 tests)
9. ❌ Corregir tests E2E de Seating (12 tests)
10. ❌ Corregir tests E2E de Auth (4 tests restantes)
11. ❌ Ejecutar tests pendientes (9 tests)

### NORMAL 🟢 (Hacer Después)

12. ❌ Corregir tests E2E de otros módulos (~50 tests)
13. ❌ Optimizar tests lentos
14. ❌ Mejorar cobertura de tests
15. ❌ Documentar casos edge

---

## 🎯 Siguiente Paso Inmediato

**ACCIÓN RECOMENDADA:**

```bash
# 1. Corregir tests unitarios de Firestore Rules
npm run test:unit -- src/__tests__/firestore.rules.seating.test.js

# 2. Analizar el error y corregir
# (Probablemente necesites actualizar firestore.rules o configurar emulador)

# 3. Re-ejecutar tests E2E de seating
npm run cypress:run:seating

# 4. Verificar mejora
node scripts/countRoadmapStatus.js
```

---

**✅ Has completado 5 correcciones críticas**  
**📊 Faltan ~91 tests E2E por corregir**  
**🎯 Prioridad: Tests unitarios de Firestore Rules**

**¿Quieres que empiece a corregir los tests unitarios de Firestore Rules?** 🚀
