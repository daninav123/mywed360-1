# 🔄 MIGRACIÓN FRONTEND: Firebase → PostgreSQL

**Fecha:** 1 Enero 2026  
**Estado:** ✅ Backend listo, ⚠️ Frontend requiere cambios manuales

---

## ✅ **LO QUE YA ESTÁ HECHO**

### **1. Backend - API REST Completa**

```
✅ backend/routes/tasks.js           → CRUD de tareas
✅ backend/routes/timeline.js        → CRUD de timeline
✅ backend/routes/special-moments.js → CRUD de música
✅ backend/routes/transactions.js    → CRUD de finanzas

Montadas en index.js:
✅ /api/tasks
✅ /api/timeline  
✅ /api/special-moments
✅ /api/transactions
```

### **2. Frontend - Servicios y Hooks Nuevos**

```
✅ src/services/apiService.js             → Helper para llamar API
✅ src/hooks/useChecklistPostgres.js      → Versión PostgreSQL
✅ src/hooks/useTimelinePostgres.js       → Versión PostgreSQL
```

---

## ⚠️ **LO QUE FALTA (Requiere cambio manual)**

### **Problema:**
Los componentes del frontend **todavía importan los hooks viejos** de Firebase:

```javascript
// ❌ ACTUAL (usa Firebase)
import useChecklist from '../hooks/useChecklist';
import useTimeline from '../hooks/useTimeline';

// ✅ DEBE SER (usa PostgreSQL)
import useChecklist from '../hooks/useChecklistPostgres';
import useTimeline from '../hooks/useTimelinePostgres';
```

---

## 📋 **PASOS PARA COMPLETAR LA MIGRACIÓN**

### **Opción A: Renombrar archivos (Recomendado)**

1. **Hacer backup de los hooks viejos:**
```bash
cd apps/main-app/src/hooks
mv useChecklist.js useChecklist.firebase.js
mv useTimeline.js useTimeline.firebase.js
```

2. **Renombrar los nuevos como principales:**
```bash
mv useChecklistPostgres.js useChecklist.js
mv useTimelinePostgres.js useTimeline.js
```

3. **Reiniciar frontend:**
```bash
npm run dev
```

---

### **Opción B: Buscar y reemplazar en componentes**

Buscar en todos los componentes:
```
useChecklist      → useChecklistPostgres
useTimeline       → useTimelinePostgres
useSpecialMoments → (crear versión PostgreSQL)
useFinance        → (crear versión PostgreSQL)
```

**Archivos que probablemente usan estos hooks:**
```
apps/main-app/src/components/
  ├── Checklist/
  ├── Timeline/
  ├── SpecialMoments/
  └── Finance/
```

---

## 🔍 **HOOKS QUE TODAVÍA FALTAN**

### **1. useSpecialMoments → PostgreSQL**
```javascript
// Cambiar de:
Firebase: weddings/{id}/specialMoments/{doc}

// A:
PostgreSQL: /api/special-moments/wedding/{id}
```

### **2. useFinance → PostgreSQL**
```javascript
// Cambiar de:
Firebase: weddings/{id}/transactions/{doc}

// A:
PostgreSQL: /api/transactions/wedding/{id}
```

---

## 📊 **COMPARACIÓN: Antes vs Después**

### **ANTES (Firebase)**
```javascript
import { doc, onSnapshot } from 'firebase/firestore';

const ref = doc(db, 'weddings', id, 'timeline', 'main');
onSnapshot(ref, (snap) => {
  if (snap.exists()) {
    setData(snap.data());
  }
});
```

### **DESPUÉS (PostgreSQL)**
```javascript
import { timelineAPI } from '../services/apiService';

useEffect(() => {
  const loadData = async () => {
    const events = await timelineAPI.getAll(weddingId);
    setData(events);
  };
  loadData();
}, [weddingId]);
```

---

## ⚡ **VENTAJAS DE LA MIGRACIÓN**

### **1. Rendimiento**
- ✅ Queries más rápidas (índices optimizados)
- ✅ Menos llamadas de red
- ✅ Carga más eficiente

### **2. Escalabilidad**
- ✅ Maneja millones de registros
- ✅ Queries complejas eficientes
- ✅ Paginación nativa

### **3. Desarrollo**
- ✅ Prisma Studio para ver datos
- ✅ SQL directo cuando se necesite
- ✅ TypeScript types automáticos

### **4. Consistencia**
- ✅ TODO en un solo lugar
- ✅ Integridad referencial
- ✅ Transacciones ACID

---

## 🚨 **IMPORTANTE - VERIFICAR ANTES DE USAR**

### **1. Backend corriendo:**
```bash
# Verificar que el backend esté activo
curl http://localhost:4004/api/tasks/wedding/test-id
```

### **2. Base de datos tiene datos:**
```sql
SELECT COUNT(*) FROM tasks;
SELECT COUNT(*) FROM timeline_events;
SELECT COUNT(*) FROM special_moments;
SELECT COUNT(*) FROM transactions;
```

### **3. Frontend configurado:**
```javascript
// Verificar en src/services/apiService.js
const API_BASE_URL = 'http://localhost:4004'; // Correcto
```

---

## 📝 **ENDPOINTS DISPONIBLES**

### **Tasks (Checklist)**
```
GET    /api/tasks/wedding/:weddingId
POST   /api/tasks/wedding/:weddingId
PUT    /api/tasks/:taskId
DELETE /api/tasks/:taskId
PUT    /api/tasks/wedding/:weddingId/bulk
```

### **Timeline**
```
GET    /api/timeline/wedding/:weddingId
POST   /api/timeline/wedding/:weddingId
PUT    /api/timeline/:eventId
DELETE /api/timeline/:eventId
PUT    /api/timeline/wedding/:weddingId/bulk
```

### **Special Moments**
```
GET    /api/special-moments/wedding/:weddingId
POST   /api/special-moments/wedding/:weddingId
PUT    /api/special-moments/:momentId
DELETE /api/special-moments/:momentId
DELETE /api/special-moments/wedding/:weddingId/block/:blockId
```

### **Transactions**
```
GET    /api/transactions/wedding/:weddingId
POST   /api/transactions/wedding/:weddingId
PUT    /api/transactions/:transactionId
DELETE /api/transactions/:transactionId
GET    /api/transactions/wedding/:weddingId/summary
```

---

## ✅ **CHECKLIST DE MIGRACIÓN**

```
Backend:
✅ Tablas creadas en PostgreSQL
✅ Datos migrados desde Firebase
✅ Endpoints REST creados
✅ Rutas montadas en index.js

Frontend:
✅ apiService.js creado
✅ useChecklistPostgres.js creado
✅ useTimelinePostgres.js creado
⚠️  Hooks especiales (special moments, finance) - pendiente
⚠️  Componentes actualizados para usar nuevos hooks - pendiente
⚠️  Testing de toda la funcionalidad - pendiente
```

---

## 🎯 **PRÓXIMOS PASOS RECOMENDADOS**

1. **Renombrar hooks** (Opción A arriba)
2. **Reiniciar frontend** y probar
3. **Verificar que funciona** el CRUD de tareas y timeline
4. **Crear hooks PostgreSQL** para special moments y finance
5. **Testing completo** de todas las funcionalidades
6. **Una vez verificado**, eliminar hooks Firebase antiguos

---

## 🔧 **COMANDOS ÚTILES**

### **Ver logs del backend:**
```bash
# El backend muestra las peticiones
[tasks] GET /api/tasks/wedding/123
[timeline] POST /api/timeline/wedding/123
```

### **Verificar datos en PostgreSQL:**
```bash
docker exec -it malove-postgres psql -U malove -d malove_db
\dt                     # Ver tablas
SELECT * FROM tasks;    # Ver tareas
SELECT * FROM timeline_events;
```

### **Reiniciar servicios:**
```bash
# Backend
cd backend
npm start

# Frontend
cd apps/main-app
npm run dev
```

---

## 📞 **SI ALGO NO FUNCIONA**

1. **Verificar backend activo:** http://localhost:4004
2. **Verificar PostgreSQL activo:** puerto 5433
3. **Ver console del navegador:** errores de red
4. **Ver logs del backend:** errores en la API

---

**La migración está casi lista. Solo falta que los componentes usen los hooks nuevos.**

¿Quieres que complete los hooks que faltan (special moments y finance) o prefieres probar primero con tasks y timeline?
