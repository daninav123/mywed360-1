# Auditoría Completa de Migración PostgreSQL

**Fecha:** 4 de enero de 2026  
**Estado:** En progreso - ~60% migrado

---

## ✅ Páginas 100% Migradas a PostgreSQL

### Core (ya funcionando con PostgreSQL)
1. **Finance.jsx** - Usa `useFinance` hook PostgreSQL ✅
2. **Tasks.jsx** - Usa API PostgreSQL para tareas ✅
3. **Ideas.jsx** - Usa hooks PostgreSQL ✅
4. **InfoBoda.jsx** - Mayormente migrado, algunas imágenes pendientes ⚠️
5. **Invitados.jsx** - Usa `useGuests` hook PostgreSQL ✅
6. **Login.jsx** - Sistema auth PostgreSQL/JWT ✅
7. **Signup.jsx** - Sistema auth PostgreSQL/JWT ✅

---

## ⚠️ Páginas PARCIALMENTE Migradas

### Necesitan ajustes menores
1. **InfoBoda.jsx**
   - ✅ Datos principales migrados
   - ❌ Aún usa `updateDoc` para imágenes heroImage
   - **Fix:** Crear endpoint `/api/weddings/:id/images`

2. **UnifiedEmail.jsx**
   - ✅ Usa `useWeddingCollection` 
   - ✅ Sistema de email PostgreSQL
   - ⚠️ Firebase Auth eliminado recientemente

---

## 🔴 Páginas que AÚN Usan Firebase (CRÍTICAS)

### Funcionalidad Core - Prioridad ALTA

#### 1. **RSVPDashboard.jsx**
```javascript
// PROBLEMA: Usa onSnapshot directamente
const ref = doc(db, 'weddings', activeWedding, 'rsvp', 'stats');
const unsub = onSnapshot(ref, (snap) => {...});
```
**Solución:** Crear hook `useRSVPStats` PostgreSQL + endpoint `/api/rsvp/:weddingId/stats`

#### 2. **Contratos.jsx**
```javascript
// PROBLEMA: Usa useFirestoreCollection
const { items, addItem, updateItem, deleteItem } = useFirestoreCollection('contracts', ...);
```
**Solución:** Crear hook `useContracts` PostgreSQL + endpoints CRUD `/api/contracts`

#### 3. **DocumentosLegales.jsx**
```javascript
// PROBLEMA: Usa Firestore para guardar documentos
await setDoc(doc(db, 'weddings', weddingId, 'documents', documentId), {...});
```
**Solución:** Endpoint `/api/weddings/:id/legal-documents`

---

### Funcionalidad Workflow - Prioridad MEDIA

#### 4. **GestionNinos.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'kids', 'management');
await setDoc(docRef, { activities, caregivers, menu });
```
**Solución:** Endpoint `/api/weddings/:id/kids-management`

#### 5. **TransporteLogistica.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'logistics', 'transport');
await setDoc(docRef, { vehicles, routes });
```
**Solución:** Endpoint `/api/weddings/:id/transport`

#### 6. **WeddingTeam.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'team', 'members');
await setDoc(docRef, { members });
```
**Solución:** Endpoint `/api/weddings/:id/team`

#### 7. **PostBoda.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'post-wedding', 'data');
await setDoc(docRef, { agradecimientos, recuerdos, valoraciones });
```
**Solución:** Endpoint `/api/weddings/:id/post-wedding`

#### 8. **PruebasEnsayos.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'planning', 'appointments');
await setDoc(docRef, { items: appointments });
```
**Solución:** Endpoint `/api/weddings/:id/appointments`

#### 9. **TramitesLegales.jsx**
```javascript
const docRef = doc(db, 'weddings', activeWedding, 'legal', 'tramites');
await setDoc(docRef, { tramites });
```
**Solución:** Endpoint `/api/weddings/:id/legal-procedures`

---

### Páginas Públicas - Prioridad BAJA

#### 10. **WeddingSite.jsx** (Página pública de boda)
```javascript
const userDoc = await getDoc(doc(db, 'users', uid));
const galSnap = await getDocs(collection(db, 'users', uid, 'gallery'));
await addDoc(collection(db, 'users', uid, 'rsvp'), {...});
```
**Solución:** Endpoints públicos `/api/public/wedding/:slug`

#### 11. **MomentosPublic.jsx / MomentosGuest.jsx**
```javascript
await validateGuestToken(weddingId, tokenParam);
await listenAlbum(weddingId, ALBUM_ID, ...);
```
**Solución:** Ya existe `momentosService` - verificar si usa PostgreSQL

---

### Páginas de Diseño - Prioridad BAJA

#### 12. **disenos/Logo.jsx**
```javascript
import { db } from '../../firebaseConfig';
import { saveData, loadData } from '../../services/SyncService';
```
**Solución:** Migrar `SyncService` a PostgreSQL

#### 13. **BankConnect.jsx**
```javascript
import { db } from '../firebaseConfig';
```
**Solución:** Verificar si realmente usa Firestore o solo importación legacy

---

## 📊 Servicios/Hooks PostgreSQL Disponibles

### ✅ Servicios ya creados:
- `UserService.postgres.js`
- `WeddingService.postgres.js`
- `commentService.postgres.js`
- `financeService.postgres.js`
- `globalSearchService.postgres.js`
- `notificationService.postgres.js`
- `rsvpService.postgres.js`
- `supplierService.postgres.js`
- `taskTemplateClient.postgres.js`

### ✅ Hooks ya creados:
- `useSeatingSync.postgres.js`
- `useGuests` (migrado)
- `useFinance` (migrado)
- `useAuth` (migrado a JWT)

### ❌ Servicios/Hooks FALTANTES (necesarios):
1. `useContracts` - Para Contratos.jsx
2. `useRSVPStats` - Para RSVPDashboard.jsx
3. `useLegalDocuments` - Para DocumentosLegales.jsx
4. `useWeddingModules` - Para datos de subcolecciones (kids, transport, team, etc.)
5. `SyncService.postgres.js` - Para Logo.jsx y otros

---

## 🎯 Plan de Acción Recomendado

### Sprint 1 - Funcionalidad Core (2-3 días)
1. **RSVPDashboard** - Crear hook `useRSVPStats` + endpoints
2. **Contratos** - Crear hook `useContracts` + endpoints CRUD
3. **DocumentosLegales** - Endpoint para documentos legales

### Sprint 2 - Workflow Medio (3-4 días)
4. **GestionNinos** - Endpoint kids-management
5. **TransporteLogistica** - Endpoint transport
6. **WeddingTeam** - Endpoint team
7. **PruebasEnsayos** - Endpoint appointments

### Sprint 3 - Workflow Adicional (2-3 días)
8. **PostBoda** - Endpoint post-wedding
9. **TramitesLegales** - Endpoint legal-procedures
10. **SyncService** - Migrar a PostgreSQL

### Sprint 4 - Páginas Públicas (2 días)
11. **WeddingSite** - Endpoints públicos
12. **Momentos** - Verificar y completar migración

---

## 📈 Progreso Estimado

- **Migrado:** ~35 páginas/componentes (60%)
- **Pendiente:** ~23 páginas (40%)
- **Tiempo estimado:** 10-12 días de desarrollo

---

## 🔧 Estrategia Técnica

### Para subcolecciones de Wedding:
Agregar campo JSON en tabla `weddings`:
```sql
ALTER TABLE weddings 
ADD COLUMN kids_management JSON,
ADD COLUMN transport_logistics JSON,
ADD COLUMN team_members JSON,
ADD COLUMN post_wedding JSON,
ADD COLUMN appointments JSON,
ADD COLUMN legal_procedures JSON;
```

O crear tabla genérica:
```sql
CREATE TABLE wedding_modules (
  id UUID PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id),
  module_type VARCHAR(50), -- 'kids', 'transport', 'team', etc.
  data JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Para contratos:
Crear tabla dedicada:
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id),
  supplier_id UUID REFERENCES suppliers(id),
  title VARCHAR(255),
  status VARCHAR(50),
  amount DECIMAL(10,2),
  file_url TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚡ Acciones Inmediatas

1. **Decidir estrategia de schema:** ¿Campos JSON en weddings o tabla wedding_modules?
2. **Priorizar páginas críticas:** RSVPDashboard y Contratos primero
3. **Crear endpoints faltantes** uno por uno
4. **Migrar hooks** siguiendo patrón establecido
5. **Testing incremental** después de cada migración

---

## 🚨 Páginas que NO Requieren Migración

- `Login.jsx`, `Signup.jsx` - Ya usan PostgreSQL/JWT ✅
- `Perfil.jsx` - Solo usa auth, no Firestore ✅
- `ResetPassword.jsx` - Ya migrado a PostgreSQL ✅
- `VerifyEmail.jsx` - Funcionalidad de Firebase Auth (mantener temporalmente)
- Páginas `/admin/*` - Verificar una por una
- Páginas `/marketing/*` - Sin datos de usuario
- `DevEnsureFinance.jsx`, `DevSeedGuests.jsx` - Páginas de desarrollo

---

## 📝 Notas Adicionales

- **Firebase Storage:** Mantener para imágenes/archivos (independiente de Firestore)
- **Firebase Auth:** **ELIMINADO** - ahora 100% JWT PostgreSQL ✅
- **Firestore:** Eliminación progresiva en curso
- **Real-time:** Considerar WebSockets para funcionalidad en tiempo real (RSVPDashboard, etc.)
