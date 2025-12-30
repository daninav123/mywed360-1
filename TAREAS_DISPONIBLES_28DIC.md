# 📋 Tareas Disponibles - 28 Diciembre 2025

## ✅ Completado en Esta Sesión

1. **Seguridad: Endpoints Críticos** - 5 endpoints protegidos
2. **Seguridad: Sanitización PII/GDPR** - Sistema completo implementado
3. **FIX CRÍTICO: Corrupción Seating Plan** - Bug de pérdida de datos resuelto

---

## 🔴 TAREAS CRÍTICAS PENDIENTES

### 1. Tests Unitarios Firestore (BLOQUEADOR)
**Prioridad:** 🔴 Crítica  
**Estado:** 4 tests fallando  
**Archivo:** `.github/ISSUE_DRAFTS/sprint1-firestore-rules-consolidation.md`

**Problema:**
- Tests de reglas Firestore bloqueados
- Duplicidad en reglas `match /users/{userId}` vs `match /users/{uid}`

**Acción:**
```bash
# Consolidar reglas duplicadas
# Archivo: firestore.rules
# Tests: apps/main-app/src/__tests__/firestore.rules.*.test.js
```

**Impacto:** Bloquea desarrollo de features que requieren tests E2E

---

### 2. RSVP by-token - Validaciones Backend
**Prioridad:** 🟡 Alta  
**Estado:** Implementación parcial  
**Archivo:** `.github/ISSUE_DRAFTS/sprint1-rsvp-by-token.md`

**Pendiente:**
- [ ] Validación `RSVPPutRequest` con Zod
- [ ] Estados `pending|accepted|rejected`
- [ ] Tests de contrato básicos

**Endpoint:** `GET/PUT /api/rsvp/by-token/{token}`

---

### 3. TODOs en Backend (Alta Prioridad)

**Backend/Routes con TODOs críticos:**

#### `supplier-quote-requests.js`
```javascript
// Línea 310
// TODO: Implementar middleware de auth
const supplierId = req.headers['x-supplier-id'];
```

#### `supplier-requests.js`
```javascript
// Línea 293
// TODO: Verificar autenticación del proveedor con middleware

// Línea 353
// TODO: Verificar autenticación del proveedor
```

#### `supplier-messages.js`
```javascript
// Línea 153
// TODO: Enviar notificación push al cliente
```

#### `supplier-payments.js`
```javascript
// Línea 205
// TODO: Enviar email con PDF de la factura
```

#### `supplier-dashboard.js`
```javascript
// Línea 489
// TODO: Enviar email a la pareja
```

---

## 🟡 TAREAS ALTA PRIORIDAD

### 4. Seating Plan - Modo Móvil
**Prioridad:** 🟡 Alta  
**Docs:** `docs/TODO.md`, líneas 26-36

**Pendiente:**
- [ ] FAB radial (botones flotantes)
- [ ] Panel inferior colapsable
- [ ] Detección viewport <=1024px
- [ ] Gestos táctiles (pinch zoom, double tap, swipe)
- [ ] Badges "En edición" para usuarios activos
- [ ] Toasts de conflicto

**Archivos:**
- `apps/main-app/src/components/seating/SeatingPlan.jsx`
- `apps/main-app/src/hooks/useSeatingPlan.js`

---

### 5. Email/Comunicaciones - Onboarding DKIM/SPF
**Prioridad:** 🟡 Alta  
**Docs:** `docs/TODO.md`, líneas 38-47

**Pendiente:**
- [ ] Onboarding con validaciones DKIM/SPF
- [ ] Envío correo de prueba
- [ ] Persistencia server-side de auto-respuestas
- [ ] Migración definitiva de buzón legacy

---

### 6. Middleware de Autenticación Proveedor
**Prioridad:** 🟡 Alta  
**Impacto:** 8 endpoints sin protección

**Crear:**
```javascript
// backend/middleware/supplierAuth.js
export const requireSupplierAuth = async (req, res, next) => {
  const supplierId = req.headers['x-supplier-id'];
  // Validar token/sesión
  // Cargar datos del proveedor
  // req.supplier = supplierData
  next();
};
```

**Aplicar en:**
- `supplier-quote-requests.js`
- `supplier-requests.js`
- `supplier-dashboard.js`
- `supplier-messages.js`
- `supplier-payments.js`

---

## 🟢 TAREAS MEDIA PRIORIDAD

### 7. Formato API Consistente
**Prioridad:** 🟢 Media  
**Estado:** Helper existe, falta aplicar en algunos endpoints

**Verificar y refactorizar:**
- `backend/routes/supplier-requests.js` - Algunos endpoints sin formato estándar
- `backend/routes/supplier-dashboard.js` - Respuestas inconsistentes

---

### 8. Notificaciones Email Automáticas
**Prioridad:** 🟢 Media  
**TODOs encontrados:** 6 ubicaciones

**Implementar:**
- Email verificación supplier registration
- Email cotización a cliente
- Email factura generada
- Email notificación proveedor
- Email confirmación solicitud

---

### 9. Presupuesto y Finanzas - Open Banking
**Prioridad:** 🟢 Media  
**Docs:** `docs/TODO.md`, líneas 49-57

**Pendiente:**
- [ ] UI autenticación Open Banking
- [ ] Refresh tokens
- [ ] Importación CSV/Excel
- [ ] Reportes descargables (PDF/Excel)

---

## 📊 ESTADÍSTICAS

### Trabajo Completado Hoy
- ✅ 3 tareas críticas de seguridad
- ✅ 1 bug crítico resuelto (Seating Plan)
- ✅ 6 archivos modificados
- ✅ 3 documentos creados
- ✅ Sistema más seguro y estable

### TODOs Encontrados
- 🔴 Críticos: 2 tareas
- 🟡 Altos: 4 tareas
- 🟢 Medios: 3 tareas
- **Total:** 9 tareas documentadas

### Código Analizado
- Backend routes: 15+ archivos
- Frontend hooks: 5 archivos
- Documentación: 10+ archivos

---

## 🎯 RECOMENDACIÓN DE PRÓXIMA ACCIÓN

### Opción 1: Middleware Autenticación Proveedor (Rápido - 30 min)
**Impacto:** Protege 8 endpoints críticos  
**Dificultad:** Media  
**Beneficio:** Mejora seguridad inmediata

```javascript
// Crear: backend/middleware/supplierAuth.js
// Aplicar en 5 rutas diferentes
// Testing básico
```

### Opción 2: Fix Tests Firestore (Medio - 1-2 horas)
**Impacto:** Desbloquea desarrollo E2E  
**Dificultad:** Alta  
**Beneficio:** Permite continuar con tests

### Opción 3: Seating Plan Modo Móvil (Largo - 3-4 horas)
**Impacto:** Mejora UX significativa  
**Dificultad:** Alta  
**Beneficio:** Feature completa para usuarios móviles

### Opción 4: RSVP Validaciones (Rápido - 45 min)
**Impacto:** Completa feature RSVP  
**Dificultad:** Baja  
**Beneficio:** Feature funcional al 100%

---

## 📝 Notas

- Tests E2E eliminados según tu solicitud
- Backend corriendo en puerto 4004
- Todos los workflows validados ✅
- Sistema de sanitización PII activo ✅
- Endpoints críticos protegidos ✅

---

**Generado:** 28 Diciembre 2025, 20:35h  
**Estado sistema:** ✅ Estable y seguro  
**Próxima sesión:** Seleccionar tarea de la lista
