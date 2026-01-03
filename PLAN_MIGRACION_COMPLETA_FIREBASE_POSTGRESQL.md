# 🚀 PLAN DE MIGRACIÓN COMPLETA: FIREBASE → POSTGRESQL

**Estado:** 10% completado  
**Objetivo:** Migrar 100% de funcionalidades para eliminar Firebase (excepto Auth)

---

## ✅ COMPLETADO (4 de ~30 funcionalidades)

### **FASE 1: Funcionalidades Core** ✅
1. ✅ **Checklist/Tasks** - PostgreSQL
2. ✅ **Timeline** - PostgreSQL  
3. ✅ **Special Moments** - PostgreSQL
4. ✅ **Finance/Budget** - PostgreSQL

**Datos migrados:**
- 13 Tasks
- 5 Special Moments
- 2 Presupuestos ($46,300)
- 250 Invitados (datos listos, falta hook)

---

## 🔄 FASES PENDIENTES

### **FASE 2: INVITADOS** 🔨 (En progreso)

**Estado:** Datos migrados, falta activar hook

**Archivos creados:**
- ✅ `backend/routes/guests-postgres.js` - API REST completa
- ✅ `backend/migrate-guests-firebase.js` - Script ejecutado (250 invitados)
- ✅ `apiService.js` actualizado con `guestsAPI`

**Pendiente:**
```bash
# 1. Renombrar hook actual
mv apps/main-app/src/hooks/useGuests.js apps/main-app/src/hooks/useGuests.firebase.js

# 2. Crear nuevo useGuests.js usando guestsAPI (PostgreSQL)
# Similar a como se hizo con useChecklist.js, useTimeline.js, etc.

# 3. Reiniciar backend para cargar nueva ruta
cd backend && npm start
```

**Hook useGuests.js nuevo debe tener:**
- `loadGuests()` - Cargar desde `/api/guests-pg/wedding/:id`
- `addGuest()` - Crear con POST
- `updateGuest()` - Actualizar con PUT
- `deleteGuest()` - Eliminar con DELETE
- `bulkUpdateGuests()` - Actualización masiva
- Mantener todas las funciones auxiliares (WhatsApp, Email, etc.)

---

### **FASE 3: INFO GENERAL DE BODA** ⏳

**Objetivo:** Migrar `useWeddingData.js` y `useWeddingInfoSync.js`

**Modelo existente:** `Wedding` (Prisma)

**Campos en Firebase que migrar:**
```javascript
weddings/{id}:
- coupleName
- weddingDate  
- location
- description
- status
- ...otros campos del documento raíz

weddings/{id}/info/weddingInfo:
- numGuests
- venue
- dresscode
- ...detalles adicionales
```

**Plan:**
1. Crear campos adicionales en modelo `Wedding` si faltan
2. Migrar datos de Firebase a PostgreSQL
3. Crear/actualizar API `/api/weddings/:id`
4. Reescribir `useWeddingData.js` para usar API
5. Consolidar `useWeddingInfoSync.js` en `useWeddingData.js`

**Script de migración:**
```javascript
// backend/migrate-wedding-info-firebase.js
// Similar a migrate-budget-from-firebase.js
// Leer weddings/{id} y weddings/{id}/info/weddingInfo
// Guardar en Wedding model (campos existentes + nuevos)
```

---

### **FASE 4: MESAS (SEATING PLAN)** ⏳

**Objetivo:** Migrar `useSeatingPlan.js`

**Modelo necesario:** Agregar a Prisma schema
```prisma
model SeatingPlan {
  id        String   @id @default(uuid())
  weddingId String   @unique
  tables    Json     // Array de mesas con configuración
  layout    Json?    // Layout visual opcional
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  wedding   Wedding  @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  
  @@map("seating_plans")
}
```

**Alternativamente:** Usar `seatingData Json?` en modelo `Wedding` existente

**Datos en Firebase:**
```
weddings/{id}/seatingPlan/main:
- tables: [{ id, name, capacity, shape, x, y, guests: [...] }]
- layout: { width, height, ... }
```

**Plan:**
1. Decidir: ¿tabla separada o JSON en Wedding?
2. Agregar campo/modelo a Prisma
3. Migrar datos con script
4. Crear API `/api/seating-plan/wedding/:id`
5. Reescribir `useSeatingPlan.js`

---

### **FASE 5: CEREMONIA** ⏳

**Hooks a migrar:**
- `useCeremonyChecklist.js`
- `useCeremonyTimeline.js`  
- `useCeremonyTexts.js`

**Modelo necesario:**
```prisma
// Opción 1: Campo JSON en Wedding
model Wedding {
  ...
  ceremonyData Json? // { checklist: [], timeline: [], texts: {} }
}

// Opción 2: Tabla separada
model CeremonyData {
  id         String   @id @default(uuid())
  weddingId  String   @unique
  checklist  Json?
  timeline   Json?
  texts      Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  wedding    Wedding  @relation(fields: [weddingId], references: [id])
  
  @@map("ceremony_data")
}
```

**Datos en Firebase:**
```
weddings/{id}/ceremony/checklist
weddings/{id}/ceremony/timeline
weddings/{id}/ceremony/texts
```

**Plan:**
1. Agregar `ceremonyData Json?` a modelo Wedding
2. Script de migración `migrate-ceremony-firebase.js`
3. API `/api/ceremony/wedding/:id` con sub-rutas
4. Reescribir 3 hooks para usar API

---

### **FASE 6: PROVEEDORES** ⏳

**Hooks a migrar:**
- `useSupplierShortlist.js`
- `useSupplierGroups.js`
- `useSupplierBudgets.js`
- `useProveedores.jsx`

**Modelos existentes:**
- ✅ `Supplier` - Proveedores globales
- ✅ `WeddingSupplier` - Relación boda-proveedor

**Datos en Firebase:**
```
weddings/{id}/supplierShortlist - Lista de favoritos
weddings/{id}/supplierGroups - Agrupaciones manuales
weddings/{id}/providers - Proveedores custom
```

**Plan:**
1. **useProveedores:** Ya hay modelo, migrar datos custom
2. **Shortlist:** Agregar campo `shortlist Json?` a Wedding
3. **Groups:** Agregar campo `supplierGroups Json?` a Wedding
4. Scripts de migración
5. APIs correspondientes
6. Reescribir hooks

**Prioridad:** Media (funcionalidad menos crítica)

---

### **FASE 7: HOOKS AUXILIARES** ⏳

Hooks genéricos que probablemente pueden depreciarse o simplificarse:

- ❌ `useWeddingCollection.js` - Helper Firebase genérico
- ❌ `useWeddingCollectionGroup.js` - Helper Firebase genérico
- ❌ `useUserCollection.js` - Helper Firebase genérico
- ❌ `useFirestoreCollection.js` - Helper Firebase genérico

**Plan:** Reemplazar usos por llamadas directas a APIs específicas

---

### **FASE 8: OTROS HOOKS ESPECÍFICOS** ⏳

- `useActiveWeddingInfo.js` - Consolidar con useWeddingData
- `useBudgetBenchmarks.js` - Migrar a API o eliminar si no se usa
- `useEmailUsername.jsx` - Depende de perfil usuario
- `useWeddingCategories.js` - Migrar categorías de proveedores
- `useWeddingTasksHierarchy.js` - Ya está migrado con useChecklist
- `useWeddingServices.js` - Revisar si ya usa API

---

## 🔐 MANTENER EN FIREBASE

### **Firebase Authentication**
- ✅ **useAuth.jsx** - Mantener para login/registro
- Razón: Firebase Auth es robusto y gratuito
- No migrar a custom auth a menos que sea necesario

### **Archivos/Storage** (si se usan)
- Firebase Storage para imágenes/documentos
- Revisar si existen uploads y migrar a S3/local si es necesario

---

## 📋 CHECKLIST DE MIGRACIÓN

### Por cada funcionalidad:

- [ ] 1. **Verificar modelo** - Existe en Prisma schema
- [ ] 2. **Migrar datos** - Script `migrate-X-firebase.js`
- [ ] 3. **Crear API** - `backend/routes/X.js`
- [ ] 4. **Montar ruta** - En `backend/index.js`
- [ ] 5. **Actualizar apiService** - Agregar `XAPI`
- [ ] 6. **Renombrar hook** - `useX.js` → `useX.firebase.js`
- [ ] 7. **Crear hook nuevo** - `useX.js` usando API
- [ ] 8. **Probar** - Verificar que funciona
- [ ] 9. **Commit** - Guardar cambios

---

## 🛠️ SCRIPTS DISPONIBLES

### Migración de datos (ya ejecutados):
```bash
node backend/migrate-firebase-to-postgres-complete.js  # Tasks, Timeline, Special Moments
node backend/migrate-budget-from-firebase.js            # Presupuesto
node backend/migrate-guests-firebase.js                 # Invitados
```

### Pendientes de crear:
```bash
node backend/migrate-wedding-info-firebase.js    # Info general boda
node backend/migrate-seating-firebase.js         # Mesas
node backend/migrate-ceremony-firebase.js        # Ceremonia
node backend/migrate-suppliers-firebase.js       # Proveedores
```

---

## 📊 PROGRESO ESTIMADO

```
✅ Completado:   10% (4 funcionalidades)
🔨 En progreso:   5% (Invitados)
⏳ Pendiente:    85% (~25 funcionalidades)
```

### Tiempo estimado por fase:
- **Fase 2 (Invitados):** 30 min - Solo falta hook
- **Fase 3 (Info Boda):** 1-2 horas
- **Fase 4 (Mesas):** 1-2 horas
- **Fase 5 (Ceremonia):** 2-3 horas
- **Fase 6 (Proveedores):** 2-3 horas
- **Fase 7-8 (Auxiliares):** 1-2 horas

**Total estimado:** 8-13 horas de desarrollo

---

## 🎯 SIGUIENTE PASO INMEDIATO

### **Completar Fase 2: Invitados**

1. Crear `apps/main-app/src/hooks/useGuests-postgres.js`:
```javascript
import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { guestsAPI } from '../services/apiService';

export default function useGuests() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGuests = useCallback(async () => {
    if (!activeWedding) return;
    setLoading(true);
    try {
      const data = await guestsAPI.getAll(activeWedding);
      setGuests(data);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const addGuest = useCallback(async (guestData) => {
    if (!activeWedding) return;
    try {
      const created = await guestsAPI.create(activeWedding, guestData);
      setGuests(prev => [...prev, created]);
      return created;
    } catch (error) {
      console.error('Error adding guest:', error);
      throw error;
    }
  }, [activeWedding]);

  const updateGuest = useCallback(async (guestId, updates) => {
    try {
      const updated = await guestsAPI.update(guestId, updates);
      setGuests(prev => prev.map(g => g.id === guestId ? updated : g));
      return updated;
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  }, []);

  const deleteGuest = useCallback(async (guestId) => {
    try {
      await guestsAPI.delete(guestId);
      setGuests(prev => prev.filter(g => g.id !== guestId));
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  }, []);

  // ...mantener funciones auxiliares de WhatsApp, Email, etc.
  // del hook original pero usando los nuevos guests de PostgreSQL

  return {
    guests,
    loading,
    loadGuests,
    addGuest,
    updateGuest,
    deleteGuest,
    // ...otras funciones
  };
}
```

2. Renombrar hook viejo:
```bash
mv apps/main-app/src/hooks/useGuests.js apps/main-app/src/hooks/useGuests.firebase.js
mv apps/main-app/src/hooks/useGuests-postgres.js apps/main-app/src/hooks/useGuests.js
```

3. Reiniciar backend:
```bash
cd backend && npm start
```

4. Probar página de invitados en `/guests`

---

## ✅ CRITERIO DE ÉXITO

**Podrás eliminar Firebase cuando:**

1. ✅ Todos los hooks usen APIs de PostgreSQL
2. ✅ Solo `useAuth.jsx` importe de `firebaseConfig`  
3. ✅ Ningún otro archivo importe `firebase/firestore`
4. ✅ Todas las páginas funcionen correctamente
5. ✅ Los datos estén completos en PostgreSQL

**Entonces podrás:**
- Eliminar dependencias de Firebase Firestore
- Mantener solo Firebase Auth
- Simplificar la aplicación
- Reducir costos de Firebase

---

## 🚀 COMANDOS RÁPIDOS

```bash
# Verificar qué usa Firebase
grep -r "from 'firebase/firestore'" apps/main-app/src/hooks/

# Verificar qué usa apiService (PostgreSQL)
grep -r "from '../services/apiService'" apps/main-app/src/hooks/

# Ver progreso de migración
cat AUDITORIA_MIGRACION_FIREBASE_A_POSTGRESQL.md
```

---

**Documento vivo - Actualizar conforme avanza la migración**
