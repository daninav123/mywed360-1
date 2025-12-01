# 🔍 DIAGNÓSTICO DEL SISTEMA - 18 Noviembre 2025

## ✅ Estado Actual

### **Entorno:**

- **Node:** v18.20.8 ✅
- **NPM:** 10.8.2 ✅
- **Firebase CLI:** Instalado ✅
- **Estructura:** 4 apps funcionando (main, suppliers, planners, admin) ✅

### **Aplicaciones:**

```
✅ apps/main-app       - Puerto 5173
✅ apps/suppliers-app  - Puerto 5175
✅ apps/planners-app   - Puerto 5174
✅ apps/admin-app      - Puerto 5176
✅ backend             - Puerto 4004
```

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### **1. Tests Unitarios se Cuelgan**

**Estado:** 🔧 SOLUCIONADO PARCIALMENTE

**Problema:**

- Tests de Firestore Rules requieren emulador Firebase
- Se ejecutaban en `npm run test:unit` causando bloqueos
- 5 archivos de tests de rules detectados:
  - `firestore.rules.seating.test.js`
  - `firestore.rules.exhaustive.test.js`
  - `firestore.rules.extended.test.js`
  - `firestore.rules.collections.test.js`
  - `firestore.rules.test.js`

**Solución Aplicada:**

- ✅ Modificado `vitest.config.js` para excluir `**/firestore.rules*.test.js`
- ✅ Tests de rules ahora solo se ejecutan con `npm run test:rules:emulator`
- ⚠️ Tests unitarios regulares aún tardan mucho o se cuelgan

**Siguiente Paso:**

- Identificar qué tests específicos causan el bloqueo
- Revisar configuración de vitest (threads, timeout)

---

### **2. Tests E2E Eliminados**

**Estado:** ✅ COMPLETADO

- 7 archivos de tests E2E eliminados de `cypress/e2e/`
- 107 tareas E2E eliminadas de `roadmap.json`
- Documentación actualizada (TODO.md, ROADMAP, PLAN-CONSOLIDACION)
- **Nuevo enfoque:** QA manual en lugar de tests E2E

---

### **3. Tests de Firestore Rules (CRÍTICO)**

**Estado:** ⚠️ PENDIENTE

Según `roadmap.json`, estos 3 tests están FALLANDO:

1. `unit_rules` - firestore.rules.seating.test.js (53 intentos)
2. `unit_rules_exhaustive` - firestore.rules.exhaustive.test.js (45 intentos)
3. `unit_rules_extended` - firestore.rules.extended.test.js (45 intentos)

**Para ejecutarlos:**

```bash
npm run test:rules:emulator
```

**Requiere:**

- Emulador Firebase corriendo
- Variable `FIRESTORE_EMULATOR_HOST=localhost:8288`
- O `FIRESTORE_RULES_TESTS=true`

---

## 📋 TESTS UNITARIOS DISPONIBLES

### **Frontend (src/):**

```
✅ AutomationRulesService.test.js
✅ budgetEmailService.test.js
✅ DigitalSignatureService.test.js
✅ EmailTrackingService.test.js
✅ GamificationService.test.js
✅ guestSchema.test.js
✅ i18nFinance.test.js
✅ i18nNoMojibake.test.js
✅ LegalDocsService.test.js
✅ SignatureService.test.js
✅ statusCycle.test.js
✅ transactionSchema.test.js
✅ validationUtils.test.js
✅ providerRecommendation.test.js
✅ seatingPlanUtils.test.js
✅ taskTemplateService.test.js
✅ TemplateCacheService.test.js
```

### **Backend (backend/):**

```
✅ ai.test.js
✅ commission.test.js
✅ contracts.test.js
✅ emails.test.js
✅ guests.test.js
✅ health.test.js
✅ mail-send.test.js
✅ mailgun-webhook.test.js
✅ metrics.test.js
✅ notifications.test.js
✅ payments.test.js
✅ payments-webhook.test.js
✅ providers.test.js
✅ providers.status.test.js
✅ rsvp.generate-link.test.js
✅ whatsapp-provider.test.js
✅ emailClassificationService.test.js
```

**Total:** ~45 archivos de tests (excluyendo Firestore rules)

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Prioridad CRÍTICA (Hoy):**

1. **Identificar tests que se cuelgan:**

   ```bash
   # Ejecutar tests uno por uno para identificar el problema
   npm run test:unit -- src/__tests__/i18nFinance.test.js
   npm run test:unit -- src/__tests__/guestSchema.test.js
   # etc...
   ```

2. **Revisar configuración de seguridad API:**
   - [ ] Endpoint `/api/ai/debug-env` requiere protección
   - [ ] Mover llamadas OpenAI a backend
   - [ ] Auditar logs para eliminar PII

3. **Estabilizar seeds y fixtures:**
   - [ ] Revisar archivos en `/tests/fixtures/`
   - [ ] Verificar consistencia de datos de prueba

### **Prioridad ALTA (Esta Semana):**

4. **Ejecutar tests de Firestore rules con emulador:**

   ```bash
   npm run test:rules:emulator
   ```

5. **Seating Plan móvil:**
   - FAB radial
   - Panel inferior
   - Gestos táctiles

6. **Migrar UnifiedInbox:**
   - Carpetas personalizadas
   - Papelera refinada
   - Eliminar buzón legacy

### **Prioridad MEDIA:**

7. **Documentar procedimientos QA manual**
8. **Motor IA de Tasks**
9. **Sincronización Invitados ↔ Seating**

---

## 📊 RESUMEN EJECUTIVO

| Categoría           | Estado         | Acción Inmediata      |
| ------------------- | -------------- | --------------------- |
| **Entorno**         | ✅ OK          | Ninguna               |
| **Aplicaciones**    | ✅ Funcionando | Ninguna               |
| **Tests E2E**       | ✅ Eliminados  | Ninguna               |
| **Tests Unitarios** | ⚠️ Se cuelgan  | Identificar causa     |
| **Tests Firestore** | ❌ Fallando    | Ejecutar con emulador |
| **API Seguridad**   | ⚠️ Pendiente   | Auditoría             |
| **Seating Móvil**   | 📋 Planificado | Implementar           |

---

## 🔗 COMANDOS ÚTILES

```bash
# Levantar todo el proyecto
npm run dev:all

# Tests unitarios (sin Firestore rules)
npm run test:unit

# Tests de Firestore rules (con emulador)
npm run test:rules:emulator

# Tests individuales
npm run test:unit -- <ruta-archivo>

# Lint y formato
npm run lint
npm run lint:fix

# Build
npm run build:all
```

---

**Última actualización:** 18 de noviembre de 2025, 18:30
**Responsable:** Cascade AI
**Estado general:** 🟡 ESTABLE CON ISSUES CONOCIDOS
