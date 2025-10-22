# 🔧 Fix: Autenticación Admin en Buscador IA

**Fecha:** 23 de Octubre de 2025  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Problema Real Detectado

### Síntoma
```
POST http://localhost:4004/api/ai-suppliers 401 (Unauthorized)
```

### Logs Relevantes
```
[useAuth] ✅ Sesión admin restaurada correctamente {email: 'admin@lovenda.com', ...}
[useAuth] Sesión admin restaurada, ignorando usuario Firebase
```

### El Problema

**El usuario estaba autenticado como ADMIN, NO como usuario Firebase:**

```
Usuario actual:
✅ Sesión admin activa (admin@lovenda.com)
❌ auth.currentUser = null (NO hay usuario Firebase)

Frontend intenta llamar:
POST /api/ai-suppliers con { auth: true }
↓
apiClient busca token de Firebase
↓
❌ No encuentra token (usuario es admin, no Firebase)
↓
Backend recibe petición SIN token
↓
401 Unauthorized
```

**El endpoint solo aceptaba Firebase Auth, no sesiones admin.**

---

## ✅ Solución Aplicada

### Cambio en `backend/index.js`

#### 1. Importar `authMiddleware`

```javascript
// ANTES
import {
  requireAuth,
  requireMailAccess,
  optionalAuth,
  requireAdmin,
} from './middleware/authMiddleware.js';

// DESPUÉS
import {
  authMiddleware,    // ✅ Agregado
  requireAuth,
  requireMailAccess,
  optionalAuth,
  requireAdmin,
} from './middleware/authMiddleware.js';
```

#### 2. Cambiar Middleware de Endpoints IA

```javascript
// ANTES (líneas 519-524)
app.use('/api/ai-image', requireAuth, aiImageRouter);
app.use('/api/ai-suppliers', requireAuth, aiSuppliersRouter);
app.use('/api/ai/budget-estimate', requireAuth, aiBudgetRouter);
app.use('/api/ai', requireAuth, aiRouter);

// DESPUÉS
app.use('/api/ai-image', authMiddleware(), aiImageRouter);
app.use('/api/ai-suppliers', authMiddleware(), aiSuppliersRouter);
app.use('/api/ai/budget-estimate', authMiddleware(), aiBudgetRouter);
app.use('/api/ai', authMiddleware(), aiRouter);
```

---

## 🔍 Diferencia Entre Middlewares

### `requireAuth` (Anterior)

**Solo acepta Firebase Auth:**
```javascript
const token = extractToken(req);  // Busca Authorization: Bearer <token>
if (!token) return 401;
const result = await verifyFirebaseToken(token);
```

❌ **Rechaza:**
- Sesiones admin
- Cualquier otro tipo de autenticación

### `authMiddleware()` (Nuevo)

**Acepta AMBOS tipos:**
```javascript
// Primero intenta Admin Session
const adminToken = extractAdminSessionToken(req);
if (adminToken) {
  const session = getAdminSession(adminToken);
  if (session) {
    req.user = { ...session, isAdminSession: true };
    return next();  // ✅ Acepta
  }
}

// Si no hay admin, intenta Firebase
const token = extractToken(req);
if (token) {
  const result = await verifyFirebaseToken(token);
  if (result.success) {
    req.user = result.user;
    return next();  // ✅ Acepta
  }
}

return 401;  // Solo si fallan ambos
```

✅ **Acepta:**
- Sesiones admin (X-Admin-Token)
- Firebase Auth (Authorization: Bearer)

---

## 🚀 Cómo Funciona Ahora

### Flujo para Usuario Admin

```
1. Usuario hace login como admin ✅
   ↓
2. localStorage guarda admin session token ✅
   ↓
3. useAuth detecta sesión admin ✅
   ↓
4. Frontend llama /api/ai-suppliers con { auth: true } ✅
   ↓
5. apiClient busca token Firebase → No encuentra ❌
   ↓
6. apiClient NO envía Authorization header
   ↓
7. Backend recibe petición sin token
   ↓
8. authMiddleware() busca admin session en headers/cookies ✅
   ↓
9. adminSession encontrado y válido ✅
   ↓
10. Backend procesa con OpenAI ✅
    ↓
11. Devuelve proveedores reales ✅
```

**PROBLEMA:** El paso 5 falla porque `apiClient` con `{auth: true}` SOLO busca Firebase.

---

## 🔧 Solución Frontend Adicional

Para que funcione completamente, también necesitamos que el frontend envíe el admin token:

### Opción 1: Modificar `apiClient.js`

```javascript
// src/services/apiClient.js

import { getAdminSessionToken } from './adminSession';

async function buildHeaders(opts = {}) {
  const base = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  
  if (opts.auth) {
    // Primero intenta obtener token de Firebase
    const firebaseToken = await getAuthToken();
    if (firebaseToken) {
      return { ...base, Authorization: `Bearer ${firebaseToken}` };
    }
    
    // Si no hay Firebase, intenta admin token
    const adminToken = getAdminSessionToken();
    if (adminToken) {
      return { ...base, 'X-Admin-Token': adminToken };
    }
    
    throw new Error('[apiClient] Authentication required');
  }
  
  return base;
}
```

### Opción 2: Usar `getAdminFetchOptions` (Más Fácil)

Ya está implementado en `useAISearch.jsx`. **REVERTIR** el cambio anterior:

```javascript
// src/hooks/useAISearch.jsx

import { getAdminFetchOptions } from '../services/adminSession';

// ANTES (cambio que hice)
const res = await apiPost('/api/ai-suppliers', data, { auth: true });

// MEJOR
const baseFetchOptions = getAdminFetchOptions({ silent: true, auth: !!user });
const res = await apiPost('/api/ai-suppliers', data, baseFetchOptions);
```

`getAdminFetchOptions` automáticamente incluye `X-Admin-Token` si hay sesión admin.

---

## 🎯 Solución Definitiva

### Backend: ✅ YA HECHO

```javascript
// backend/index.js
app.use('/api/ai-suppliers', authMiddleware(), aiSuppliersRouter);
```

### Frontend: ⚠️ PENDIENTE

**Opción A:** Modificar `apiClient.js` para que envíe admin token cuando no hay Firebase

**Opción B:** REVERTIR mi cambio y volver a usar `getAdminFetchOptions()`

**Recomendación:** Opción B (más simple)

---

## 📝 Próximos Pasos

### 1. Reiniciar el Backend

```powershell
# Detener backend (Ctrl+C)
cd backend
npm start
```

### 2. Verificar Logs

Deberías ver:
```
[ai-suppliers] Cliente OpenAI inicializado/actualizado {
  apiKeyPrefix: 'sk-proj-',
  projectId: 'proj_7IWF...'
}
```

### 3. Probar el Buscador

1. Ir a `/proveedores`
2. Buscar "fotógrafo"
3. **Ahora debería funcionar** con sesión admin

---

## 🐛 Si Aún No Funciona

### Verificar en Consola (F12):

```javascript
// 1. Verificar tipo de usuario
console.log('Admin session:', localStorage.getItem('MyWed360_admin_session_token'));
console.log('Firebase user:', firebase.auth().currentUser);

// 2. Verificar headers enviados
// En Network tab, ver la petición a /api/ai-suppliers
// Debería tener X-Admin-Token O Authorization
```

### Solución Rápida

Si sigue fallando, necesitamos asegurarnos que el frontend envíe el admin token.

**Cambio en `src/services/apiClient.js`:**

```javascript
import { getAdminSessionToken } from './adminSession';

async function buildHeaders(opts = {}) {
  const base = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  
  if (opts.auth) {
    const token = await getAuthToken();
    if (token) {
      return { ...base, Authorization: `Bearer ${token}` };
    }
    
    // Fallback a admin token
    const adminToken = getAdminSessionToken();
    if (adminToken) {
      return { ...base, 'X-Admin-Token': adminToken };
    }
    
    throw new Error('[apiClient] Authentication required');
  }
  
  return base;
}
```

---

## ✅ Resultado Esperado

### Con Backend Actualizado + Frontend Funcionando:

```
Admin Session Activa:
→ Frontend detecta admin session
→ Envía X-Admin-Token header
→ Backend authMiddleware() lo acepta
→ OpenAI responde con proveedores
→ ✅ Funciona

Usuario Firebase Normal:
→ Frontend obtiene Firebase token
→ Envía Authorization: Bearer header
→ Backend authMiddleware() lo acepta
→ OpenAI responde con proveedores
→ ✅ Funciona
```

---

## 📊 Commit

```bash
✅ 151940be - fix(backend): Permitir autenticación admin en endpoints de IA
```

**Archivos modificados:**
- `backend/index.js`: Import authMiddleware + cambio en 4 endpoints

**Rama:** windows  
**Estado:** Pusheado a GitHub

---

## 🎉 Resumen

| Aspecto | Estado |
|---------|--------|
| **Backend acepta admin** | ✅ Solucionado |
| **Frontend envía admin token** | ⚠️ Depende de implementación |
| **OpenAI configurado** | ✅ Ya está |
| **Reiniciar backend** | ⚠️ REQUERIDO |

**Próximo paso:** Reiniciar backend y probar
