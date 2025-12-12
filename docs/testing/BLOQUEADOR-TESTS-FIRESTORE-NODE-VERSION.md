# ⚠️ BLOQUEADOR: Tests de Firestore - Versión de Node.js

**Fecha:** 12 de noviembre de 2025, 19:35 UTC+1  
**Severidad:** BLOQUEADOR  
**Prioridad:** 1

---

## 🔴 PROBLEMA

Los tests de Firestore Rules no pueden ejecutarse debido a incompatibilidad de versiones:

```
Firebase CLI v14.16.0 is incompatible with Node.js v18.20.8
Please upgrade Node.js to version >=20.0.0 || >=22.0.0
```

---

## 🔍 ANÁLISIS

### **Estado Actual:**
- **Node.js activo:** v18.20.8
- **Firebase CLI:** v14.16.0
- **Requerido:** Node.js >= 20.0.0

### **Versiones Disponibles (nvm):**
```
v18.20.8 (actual)
v20.0.0 ✅
v20.5.0 ✅
v20.19.4 ✅
v20.19.5 ✅ (stable)
```

### **`.nvmrc` indica:** 20.0.0

---

## 🚫 BLOQUEOS

### **Intentos Fallidos:**

1. **`nvm use 20`** → Command not found
   - NVM no disponible en contexto de ejecución
   
2. **Downgrade Firebase CLI** → No recomendado
   - Podría romper otras funcionalidades
   
3. **Ejecutar manualmente** → Requiere cambio de shell

---

## ✅ SOLUCIONES PROPUESTAS

### **Opción A: Cambio Manual de Node.js** (Recomendado)
**Requiere:** Acción manual del usuario

```bash
# En terminal externa:
nvm use 20
npm run test:rules:emulator
```

**Ventajas:**
- ✅ Solución permanente
- ✅ Compatible con todo el proyecto
- ✅ Alineado con `.nvmrc`

### **Opción B: Skipear Tests por Ahora** (Temporal)
**Continuar con otras prioridades del roadmap:**

- ✅ Prioridad 2: Seating Plan Móvil
- ✅ Prioridad 3: Migrar UnifiedInbox
- ✅ Prioridad 6: Onboarding Mejorado
- ✅ Prioridad 7: Dashboard Personalizable

**Ventajas:**
- ✅ No bloquea progreso
- ✅ Otras tareas muy valiosas
- ✅ Tests pueden hacerse después

### **Opción C: Downgrade Firebase CLI** (No recomendado)
```bash
npm install -g firebase-tools@13.0.0
```

**Desventajas:**
- ❌ Podría romper compatibilidad
- ❌ Perderíamos features nuevas
- ❌ No es sostenible

---

## 📊 IMPACTO

### **Tests Bloqueados:**
1. `firestore.rules.test.js`
2. `firestore.rules.exhaustive.test.js`
3. `firestore.rules.extended.test.js`

### **Tests E2E Bloqueados (13+):**
- `e2e_seating_smoke`
- `e2e_seating_fit`
- `e2e_seating_toasts`
- `e2e_seating_assign_unassign`
- `e2e_seating_capacity_limit`
- `e2e_seating_aisle_min`
- `e2e_seating_obstacles_no_overlap`
- `seating_auto_ai_e2e`
- `e2e_seating_template_circular`
- `e2e_seating_template_u_l_imperial`
- `e2e_seating_no_overlap`
- `e2e_seating_delete_duplicate`
- `e2e_seating_ui_panels`

---

## 🎯 RECOMENDACIÓN

**Continuar con Opción B (Skipear temporalmente)**

**Razones:**
1. Cambio de Node requiere acción manual del usuario
2. Hay 9 prioridades más que podemos hacer ahora
3. No bloquea desarrollo de features
4. Tests pueden ejecutarse después con Node 20

**Siguiente Acción:**
Pasar a **Prioridad 2: Seating Plan Móvil** o **Prioridad 6: Onboarding Mejorado**

---

## 📝 PARA EL USUARIO

Si quieres ejecutar los tests ahora, necesitas:

1. Abrir terminal externa
2. Ejecutar: `nvm use 20`
3. Ejecutar: `npm run test:rules:emulator`

O podemos continuar con otras tareas y volver a esto después.

---

**¿Continuamos con otra prioridad del roadmap?**
