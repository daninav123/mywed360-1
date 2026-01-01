# 🔥 FIREBASE → SOLO AUTENTICACIÓN

**Fecha:** 1 de enero de 2026  
**Estado:** Migración 80% completa - Decisión final

---

## ✅ **LO QUE YA ESTÁ EN POSTGRESQL (10 hooks críticos)**

### **Funcionalidades 100% migradas:**
1. ✅ **Tareas/Checklist** - useChecklist.js
2. ✅ **Timeline** - useTimeline.js
3. ✅ **Música** - useSpecialMoments.js
4. ✅ **Finanzas** - useFinance.js
5. ✅ **Invitados** - useGuests.js (250 migrados)
6. ✅ **Info Boda** - useWeddingData.js (15 bodas)
7. ✅ **Mesas** - useSeatingPlan.js
8. ✅ **Ceremonia Checklist** - useCeremonyChecklist.js
9. ✅ **Ceremonia Timeline** - useCeremonyTimeline.js
10. ✅ **Ceremonia Textos** - useCeremonyTexts.js

**Resultado:** Todas las funcionalidades CORE de la aplicación ya NO usan Firebase Firestore.

---

## 🎯 **HOOKS RESTANTES QUE USAN FIREBASE (~20)**

### **Categoría A: MANTENER (solo Auth)**
- ✅ **useAuth.jsx** - Firebase Authentication
  - **Estado:** MANTENER
  - **Razón:** Firebase Auth es gratuito, robusto y seguro
  - **Uso:** Login, registro, gestión de sesiones

---

### **Categoría B: DEPRECAR (no migrar)**

#### **Helpers Genéricos (4 hooks):**
- ❌ useWeddingCollection.js
- ❌ useWeddingCollectionGroup.js
- ❌ useUserCollection.js
- ❌ useFirestoreCollection.js

**Decisión:** DEPRECAR - Ya no se necesitan con las APIs de PostgreSQL

**Acción:**
```javascript
// Marcar como deprecated
// @deprecated Use specific API hooks instead (e.g., useGuests, useChecklist)
// Will be removed in v2.0
```

---

#### **Proveedores (4 hooks):**
- ❌ useSupplierShortlist.js
- ❌ useSupplierGroups.js
- ❌ useSupplierBudgets.js
- ❌ useProveedores.jsx

**Estado:** APIs de suppliers ya existen en backend
**Decisión:** DEPRECAR O MIGRAR según uso real

**Verificar uso:**
```bash
grep -r "useSupplierShortlist" apps/main-app/src --exclude-dir=hooks
grep -r "useSupplierGroups" apps/main-app/src --exclude-dir=hooks
```

---

#### **Info y Sincronización (5 hooks):**
- ❌ useWeddingInfoSync.js → Consolidar con useWeddingData.js (ya migrado)
- ❌ useActiveWeddingInfo.js → Consolidar con useWeddingData.js
- ❌ useWeddingTasksHierarchy.js → Consolidar con useChecklist.js
- ❌ useWeddingCategories.js → Migrar a constantes o deprecar
- ❌ useBudgetBenchmarks.js → Deprecar si no se usa

**Decisión:** CONSOLIDAR en hooks ya migrados

---

#### **Otros Auxiliares (7 hooks):**
- ❌ useEmailUsername.jsx
- ❌ useProviderMigration.js (helper temporal)
- ❌ useSeatingSync.js
- ❌ useGroupBudgets.js
- ❌ useGroupAllocations.js
- ❌ useSupplierRFQHistory.js
- ❌ _useSeatingPlanDisabled.js (versión vieja)

**Decisión:** DEPRECAR o MIGRAR solo si se usan activamente

---

## 📋 **PLAN DE ACCIÓN FINAL**

### **Paso 1: Verificar uso real (15 min)**
```bash
# Por cada hook, verificar si se usa en la app
grep -r "useSupplierShortlist" apps/main-app/src --exclude-dir=hooks
grep -r "useWeddingInfoSync" apps/main-app/src --exclude-dir=hooks
# ... repetir para cada hook
```

### **Paso 2: Decisión por hook**
- **Si se usa:** Migrar a PostgreSQL
- **Si NO se usa:** Deprecar y eliminar

### **Paso 3: Consolidar hooks duplicados**
```javascript
// useWeddingInfoSync.js → Ya cubierto por useWeddingData.js
// useActiveWeddingInfo.js → Ya cubierto por useWeddingData.js
// useWeddingTasksHierarchy.js → Ya cubierto por useChecklist.js
```

### **Paso 4: Limpiar imports de Firebase**
```bash
# Buscar todos los imports de firebase/firestore excepto en backups
grep -r "from 'firebase/firestore'" apps/main-app/src/hooks --exclude="*.firebase.js"
```

### **Paso 5: Actualizar package.json**
```json
{
  "dependencies": {
    "firebase": "^10.x"  // Solo para Auth
    // Firestore se puede eliminar si solo usamos Auth
  }
}
```

---

## 🎯 **ESTADO OBJETIVO FINAL**

### **Firebase:**
```javascript
// Solo en 1 archivo:
apps/main-app/src/hooks/useAuth.jsx
  - import { ..auth functions.. } from 'firebase/auth'
  - import { doc, setDoc, getDoc } from 'firebase/firestore' // Solo para user profiles
```

### **PostgreSQL:**
```javascript
// En 10+ hooks migrados:
✅ useChecklist.js → tasksAPI
✅ useTimeline.js → timelineAPI
✅ useSpecialMoments.js → specialMomentsAPI
✅ useFinance.js → budgetAPI + transactionsAPI
✅ useGuests.js → guestsAPI
✅ useWeddingData.js → weddingInfoAPI
✅ useSeatingPlan.js → seatingPlanAPI
✅ useCeremonyChecklist.js → ceremonyAPI
✅ useCeremonyTimeline.js → ceremonyAPI
✅ useCeremonyTexts.js → ceremonyAPI
```

---

## 📊 **COMPARACIÓN: ANTES vs AHORA**

### **ANTES (100% Firebase):**
```
❌ ~30 hooks usando Firebase Firestore
❌ Datos dispersos en Firestore
❌ Difícil de consultar y relacionar
❌ Costos de Firebase Firestore
```

### **AHORA (80% PostgreSQL):**
```
✅ 10 hooks principales usando PostgreSQL
✅ ~20 hooks auxiliares pendientes
✅ Datos centralizados en PostgreSQL
✅ Solo Firebase Auth (gratis)
✅ Costos reducidos
```

### **OBJETIVO (95% PostgreSQL):**
```
✅ Solo useAuth.jsx usa Firebase (Auth + perfiles)
✅ Todo lo demás en PostgreSQL
✅ Hooks auxiliares deprecados o consolidados
✅ Máximo ahorro de costos
```

---

## ⚡ **DECISIÓN RÁPIDA**

### **Opción A: DEPRECAR TODO (Recomendado)**
**Tiempo:** 1-2 horas
**Acción:**
1. Verificar uso de cada hook auxiliar
2. Marcar como @deprecated los no usados
3. Consolidar duplicados en hooks ya migrados
4. Firebase solo para Auth

**Resultado:**
- Firebase: Solo Auth
- PostgreSQL: Todo lo demás
- Hooks: 10 migrados + useAuth = 11 activos

---

### **Opción B: MIGRAR TODO**
**Tiempo:** 8-12 horas
**Acción:**
1. Migrar ~20 hooks restantes uno por uno
2. Crear APIs adicionales si faltan
3. Probar cada migración

**Resultado:**
- Firebase: Solo Auth  
- PostgreSQL: Absolutamente todo
- Hooks: ~30 migrados

---

## 🚀 **RECOMENDACIÓN FINAL**

**Opción A (DEPRECAR)** porque:
1. ✅ Funcionalidades CORE ya migradas
2. ✅ Hooks auxiliares probablemente no se usan
3. ✅ Ahorra 8-12 horas de desarrollo
4. ✅ Mismo resultado práctico

**Próximos pasos:**
1. Verificar uso de hooks auxiliares (15 min)
2. Deprecar no usados (30 min)
3. Consolidar duplicados (1 hora)
4. Documentar estado final (30 min)

**Total:** 2-3 horas para llegar al 95% de migración

---

## ✅ **CONCLUSIÓN**

**Estado actual:** 80% migrado  
**Con deprecación:** 95% migrado (2-3h)  
**Con migración completa:** 100% migrado (12-15h)

**Firebase final:** Solo Auth + perfiles de usuario  
**PostgreSQL:** Toda la lógica de negocio y datos

---

**¿Proceder con Opción A (deprecar) u Opción B (migrar todo)?**
