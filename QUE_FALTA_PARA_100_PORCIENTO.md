# ❓ QUÉ FALTA PARA 100% SIN FIREBASE FIRESTORE

**Estado actual:** 90% completado  
**Objetivo:** Eliminar Firebase Firestore completamente, mantener solo Firebase Auth

---

## ✅ LO QUE YA ESTÁ (90%)

### **12 Hooks migrados a PostgreSQL:**
1. useChecklist.js
2. useTimeline.js
3. useSpecialMoments.js
4. useFinance.js
5. useGuests.js
6. useWeddingData.js
7. useSeatingPlan.js
8. useCeremonyChecklist.js
9. useCeremonyTimeline.js
10. useCeremonyTexts.js
11. useSupplierShortlist.js
12. useSupplierGroups.js

### **10 APIs Backend funcionando:**
- /api/tasks, /api/timeline, /api/special-moments
- /api/budget, /api/transactions
- /api/guests-pg, /api/wedding-info
- /api/seating-plan, /api/ceremony
- /api/supplier-groups

---

## ⚠️ LO QUE FALTA (10%)

### **HOOKS QUE AÚN USAN FIREBASE FIRESTORE:**

#### **1. useWeddingCollection.js** - MUY USADO ⚠️
**Estado:** Deprecated pero usado en 10+ componentes
**Usos principales:**
- `useWeddingCollection('guests')` → Ya existe useGuests PostgreSQL ✅
- `useWeddingCollection('tasks')` → Ya existe useChecklist PostgreSQL ✅
- `useWeddingCollection('suppliers')` → useProveedores (Firebase)

**Solución:** 
- Opción A: Reemplazar cada uso por el hook específico ya migrado
- Opción B: Crear `usePostgresCollection` genérico que use APIs

**Tiempo estimado:** 2-3 horas

---

#### **2. useActiveWeddingInfo.js** - USADO EN 10+ COMPONENTES ⚠️
**Estado:** Deprecated, duplicado de useWeddingData (ya migrado)

**Componentes que lo usan:**
- pages/ProveedoresNuevo.jsx (2 archivos)
- pages/Invitados.jsx
- pages/Invitaciones.jsx
- pages/AyudaCeremonia.jsx
- pages/protocolo/DocumentosLegales.jsx
- hooks/useAISearch.jsx
- hooks/useAIProviderEmail.js
- hooks/useProviderEmail.jsx
- components/proveedores/RFQModal.jsx
- Y otros más...

**Solución:** Reemplazar por useWeddingData (ya migrado a PostgreSQL)

**Acción:**
```javascript
// ANTES (Firebase):
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
const { info: weddingInfo } = useActiveWeddingInfo();

// DESPUÉS (PostgreSQL):
import useWeddingData from '../hooks/useWeddingData';
const { weddingData: weddingInfo } = useWeddingData();
```

**Tiempo estimado:** 1-2 horas (buscar y reemplazar en ~15 archivos)

---

#### **3. useWeddingInfoSync.js** - USADO EN 1 COMPONENTE
**Estado:** Deprecated, duplicado de useWeddingData

**Componente:** pages/InfoBoda.jsx

**Solución:** Reemplazar por useWeddingData

**Tiempo estimado:** 15 minutos

---

#### **4. Hooks auxiliares poco usados:**
- **useWeddingCollectionGroup.js** - Helper genérico
- **useUserCollection.js** - Helper genérico
- **useFirestoreCollection.js** - Wrapper de useWeddingCollection

**Estado:** Deprecated, probablemente poco usados

**Solución:** Verificar usos reales y:
- Si se usan → migrar
- Si no se usan → eliminar

**Tiempo estimado:** 1 hora

---

#### **5. useAuth.jsx** - MANTENER CON FIREBASE ✅
**Estado:** Usa Firebase Auth + Firestore para perfiles

**Razón para mantener Firebase:**
- Firebase Auth es gratuito hasta 50K usuarios
- Muy robusto y seguro
- No vale la pena migrar

**Firestore en useAuth:**
- Solo lee/escribe perfiles de usuario (mínimo)
- Esto es aceptable mantenerlo

**Decisión:** ✅ MANTENER así

---

## 🎯 PLAN PARA LLEGAR AL 100%

### **Fase 1: Reemplazar useActiveWeddingInfo (1-2h)**
**Impacto:** Alto - usado en 10+ componentes

```bash
# 1. Buscar todos los usos
grep -r "useActiveWeddingInfo" apps/main-app/src --exclude-dir=hooks

# 2. Reemplazar en cada archivo:
# import useActiveWeddingInfo → import useWeddingData
# const { info: ... } = useActiveWeddingInfo() 
# → const { weddingData: ... } = useWeddingData()

# 3. Probar cada página afectada
```

**Archivos a modificar:** ~15 archivos

---

### **Fase 2: Reemplazar useWeddingInfoSync (15min)**
**Impacto:** Bajo - 1 solo archivo

```javascript
// pages/InfoBoda.jsx
// ANTES:
const { syncedData, stats, isLoading } = useWeddingInfoSync();

// DESPUÉS:
const { weddingData, loading } = useWeddingData();
```

---

### **Fase 3: Reemplazar usos de useWeddingCollection (2-3h)**
**Impacto:** Alto - helper muy usado

**Estrategia:**
1. Identificar todos los usos
2. Reemplazar por hooks específicos:
   - `useWeddingCollection('guests')` → `useGuests()`
   - `useWeddingCollection('tasks')` → `useChecklist()`
   - `useWeddingCollection('suppliers')` → Migrar useProveedores

---

### **Fase 4: Verificar y limpiar (1h)**
1. Buscar todos los imports de Firebase Firestore
2. Verificar que solo useAuth los usa
3. Eliminar hooks deprecated sin usar
4. Actualizar documentación

---

## 📊 RESUMEN DE TRABAJO RESTANTE

| Tarea | Tiempo | Complejidad | Impacto |
|-------|--------|-------------|---------|
| Reemplazar useActiveWeddingInfo | 1-2h | Media | Alto |
| Reemplazar useWeddingInfoSync | 15min | Baja | Bajo |
| Reemplazar useWeddingCollection | 2-3h | Alta | Alto |
| Verificar y limpiar | 1h | Baja | Medio |
| **TOTAL** | **5-7h** | **Media** | **Alto** |

---

## ✅ RESULTADO FINAL

### **Después de completar (100%):**

**Firebase solo para:**
- ✅ Firebase Auth (login, registro, sesiones)
- ✅ Perfiles de usuario en Firestore (mínimo)

**PostgreSQL para:**
- ✅ Todas las funcionalidades de la app
- ✅ Todos los datos de negocio
- ✅ Sin helpers de Firestore

### **Imports de Firebase permitidos:**
```javascript
// ✅ PERMITIDO (solo en useAuth.jsx):
import { auth functions } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Solo para perfiles

// ❌ NO PERMITIDO (en ningún otro archivo):
import { collection, onSnapshot, addDoc, etc. } from 'firebase/firestore';
```

---

## 🚀 DECISIÓN

**¿Quieres que continúe con las Fases 1-4?**

**Opción A (RECOMENDADO):** 
- Completar Fase 1 y 2 (2-3h)
- Resultado: 95% sin Firestore
- useAuth + perfiles mínimos en Firebase

**Opción B (COMPLETO):**
- Completar Fases 1-4 (5-7h)
- Resultado: 100% sin Firestore excepto Auth
- useAuth solo con Firebase Auth + perfiles

**Opción C (DEJAR ASÍ):**
- Mantener 90% actual
- Hooks deprecated funcionales
- Migración gradual cuando sea necesario

---

## 💡 RECOMENDACIÓN

**Opción A es la mejor relación esfuerzo/beneficio:**
- 2-3 horas de trabajo
- Elimina usos principales de Firestore
- useAuth mantiene Firebase (aceptable)
- Resultado: 95-98% sin Firestore

**Firebase Auth debe quedarse** porque:
- Gratis hasta 50K usuarios
- Muy seguro y confiable
- No vale la pena migrar a custom

---

**¿Procedo con Opción A, B o C?**
