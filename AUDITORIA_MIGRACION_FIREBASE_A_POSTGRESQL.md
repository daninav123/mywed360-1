# 📊 AUDITORÍA DE MIGRACIÓN: FIREBASE → POSTGRESQL

**Fecha:** 1 de enero de 2026  
**Estado:** En progreso

---

## ✅ HOOKS MIGRADOS A POSTGRESQL

### 1. **useChecklist.js**
- ✅ **Estado:** Migrado completamente
- ✅ **Backend API:** `/api/tasks`
- ✅ **Base de datos:** PostgreSQL (tabla `tasks`)
- ✅ **Imports:** Solo usa `tasksAPI` de `apiService.js`
- ❌ **Firebase:** NO se usa

**Funcionalidades:**
- Cargar tareas del checklist
- Crear/actualizar/eliminar tareas
- Gestionar ítems custom
- Categorización y estados

---

### 2. **useTimeline.js**
- ✅ **Estado:** Migrado completamente
- ✅ **Backend API:** `/api/timeline`
- ✅ **Base de datos:** PostgreSQL (tabla `timeline_events`)
- ✅ **Imports:** Solo usa `timelineAPI` de `apiService.js`
- ❌ **Firebase:** NO se usa

**Funcionalidades:**
- Cargar eventos del timeline
- Gestionar bloques temporales
- Estados y alertas de bloques

---

### 3. **useSpecialMoments.js**
- ✅ **Estado:** Migrado completamente
- ✅ **Backend API:** `/api/special-moments`
- ✅ **Base de datos:** PostgreSQL (tabla `special_moments`)
- ✅ **Imports:** Solo usa `specialMomentsAPI` de `apiService.js`
- ❌ **Firebase:** NO se usa

**Funcionalidades:**
- Gestionar momentos especiales
- Música por bloques (ceremonia, cóctel, banquete, disco)
- Responsables y detalles de momentos

---

### 4. **useFinance.js**
- ✅ **Estado:** Migrado completamente
- ✅ **Backend API:** `/api/budget` y `/api/transactions`
- ✅ **Base de datos:** PostgreSQL
  - Presupuesto: `weddings.budgetData` (JSON)
  - Transacciones: tabla `transactions`
- ✅ **Imports:** Solo usa `budgetAPI` y `transactionsAPI`
- ❌ **Firebase:** NO se usa

**Funcionalidades:**
- Presupuesto y categorías
- Contribuciones e invitados
- Transacciones de gastos/ingresos
- Configuraciones de alertas

---

## ⚠️ HOOKS QUE AÚN USAN FIREBASE

### **Invitados y Mesas**
- ❌ **useGuests.js** - Usa Firebase Firestore
  - Colección: `weddings/{id}/guests`
  - Funciones: CRUD de invitados, confirmaciones, mesas

- ❌ **useSeatingPlan.js** - Usa Firebase Firestore
  - Colección: `weddings/{id}/seatingPlan`
  - Funciones: Distribución de mesas, asignación de invitados

- ❌ **useWeddingInfoSync.js** - Usa Firebase Firestore
  - Documento: `weddings/{id}/info/weddingInfo`
  - Funciones: Sincronización de información general de la boda

---

### **Ceremonia**
- ❌ **useCeremonyChecklist.js** - Usa Firebase Firestore
  - Colección: `weddings/{id}/ceremony/checklist`
  
- ❌ **useCeremonyTimeline.js** - Usa Firebase Firestore
  - Documento: `weddings/{id}/ceremony/timeline`
  
- ❌ **useCeremonyTexts.js** - Usa Firebase Firestore
  - Documento: `weddings/{id}/ceremony/texts`

---

### **Proveedores**
- ❌ **useSupplierShortlist.js** - Usa Firebase Firestore
  - Colección: `weddings/{id}/supplierShortlist`
  
- ❌ **useSupplierGroups.js** - Usa Firebase Firestore
  - Colección: `weddings/{id}/supplierGroups`
  
- ❌ **useSupplierBudgets.js** - Usa Firebase Firestore
  - Colección: múltiples rutas de presupuestos de proveedores
  
- ❌ **useProveedores.jsx** - Usa Firebase Firestore
  - Colección: `weddings/{id}/providers`

---

### **Autenticación y Contexto**
- ❌ **useAuth.jsx** - Usa Firebase Auth + Firestore
  - Firebase Authentication para login/registro
  - Firestore para perfiles de usuario (`users/{uid}`)
  
- ❌ **useWeddingData.js** - Usa Firebase Firestore
  - Documento: `weddings/{id}`
  - Funciones: Cargar datos generales de la boda

---

### **Otros**
- ❌ **useWeddingCollection.js** - Usa Firebase Firestore (genérico)
- ❌ **useWeddingCollectionGroup.js** - Usa Firebase Firestore (genérico)
- ❌ **useUserCollection.js** - Usa Firebase Firestore (genérico)
- ❌ **useFirestoreCollection.js** - Usa Firebase Firestore (genérico)
- ❌ **useActiveWeddingInfo.js** - Usa Firebase Firestore
- ❌ **useBudgetBenchmarks.js** - Usa Firebase Firestore
- ❌ **useEmailUsername.jsx** - Usa Firebase Firestore
- ❌ **useWeddingCategories.js** - Usa Firebase Firestore
- ❌ **useWeddingTasksHierarchy.js** - Usa Firebase Firestore
- ❌ **useProviderMigration.js** - Usa Firebase Firestore (helper de migración)

---

## 📊 RESUMEN DE MIGRACIÓN

### ✅ Completamente Migrados (4/39 hooks)
```
✅ useChecklist.js       → PostgreSQL
✅ useTimeline.js        → PostgreSQL
✅ useSpecialMoments.js  → PostgreSQL
✅ useFinance.js         → PostgreSQL
```

### ⚠️ Pendientes de Migración (~25 hooks principales)
```
❌ useGuests.js
❌ useSeatingPlan.js
❌ useWeddingInfoSync.js
❌ useCeremonyChecklist.js
❌ useCeremonyTimeline.js
❌ useCeremonyTexts.js
❌ useSupplierShortlist.js
❌ useSupplierGroups.js
❌ useSupplierBudgets.js
❌ useProveedores.jsx
❌ useAuth.jsx (Auth permanecerá en Firebase)
❌ useWeddingData.js
❌ useWeddingCollection.js (helper genérico)
❌ useFirestoreCollection.js (helper genérico)
... y otros ~11 hooks auxiliares
```

---

## 🎯 PÁGINAS PRINCIPALES - ESTADO

### ✅ **Páginas 100% PostgreSQL**
1. **Checklist** (`/checklist`) - ✅ Usa `useChecklist.js`
2. **Timeline** (`/timeline`) - ✅ Usa `useTimeline.js`
3. **Música/Special Moments** (`/music`) - ✅ Usa `useSpecialMoments.js`
4. **Finanzas** (`/finance`) - ✅ Usa `useFinance.js`

### ⚠️ **Páginas que usan Firebase**
1. **Invitados** (`/guests`) - ❌ Usa `useGuests.js` (Firebase)
2. **Mesas** (`/seating`) - ❌ Usa `useSeatingPlan.js` (Firebase)
3. **Ceremonia** (`/ceremony`) - ❌ Usa hooks de ceremonia (Firebase)
4. **Proveedores** (`/suppliers`) - ❌ Usa hooks de proveedores (Firebase)
5. **Dashboard/Home** - ⚠️ Usa múltiples hooks (mixto Firebase/PostgreSQL)

---

## 📋 SIGUIENTE FASE DE MIGRACIÓN

### Prioridad Alta
1. **useGuests.js** → Migrar a PostgreSQL
   - Crear tabla/modelo `Guest` en Prisma (ya existe)
   - Crear API `/api/guests`
   - Migrar datos de Firebase
   - Actualizar hook

2. **useWeddingData.js** → Migrar a PostgreSQL
   - Usar modelo `Wedding` existente
   - Crear/actualizar API `/api/weddings/:id`
   - Actualizar hook

3. **useWeddingInfoSync.js** → Migrar a PostgreSQL
   - Consolidar con `Wedding` model
   - Actualizar referencias

### Prioridad Media
4. **Hooks de Ceremonia** → Migrar a PostgreSQL
   - Crear modelo `CeremonyData` (JSON en Wedding)
   - API endpoints para ceremonia
   - Migrar datos

5. **Hooks de Proveedores** → Migrar a PostgreSQL
   - Usar modelos existentes (`Supplier`, `WeddingSupplier`)
   - Actualizar APIs existentes
   - Migrar datos

### Prioridad Baja
6. **Hooks genéricos** (useWeddingCollection, etc.)
   - Mantener o deprecar según uso
   - Reemplazar por APIs específicas

---

## 🔥 CONCLUSIÓN

**Estado Actual:**
- ✅ **10% migrado** (4 de ~39 hooks principales)
- ✅ **Funcionalidades core migradas:** Tareas, Timeline, Música, Finanzas
- ⚠️ **Pendiente:** Invitados, Mesas, Ceremonia, Proveedores, Contexto general

**Recomendación:**
Continuar con migración progresiva, priorizando:
1. Invitados (useGuests)
2. Información general de boda (useWeddingData)
3. Ceremonia
4. Proveedores

La autenticación (useAuth) probablemente debe permanecer en Firebase Auth.
