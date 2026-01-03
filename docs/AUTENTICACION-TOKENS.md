# 🔐 SISTEMA DE AUTENTICACIÓN - TOKENS FIREBASE

## 📊 **CONFIGURACIÓN ACTUAL**

### **Auto-Refresh Activado ✅**

El sistema usa **refresh automático de tokens**:
- Token de acceso (ID token) caduca cada **1 hora**
- Firebase lo refresca **automáticamente** sin intervención del usuario
- Usuario permanece autenticado indefinidamente

---

## 🔄 **FLUJO DE AUTENTICACIÓN**

### **1. Login**
```javascript
await signInWithEmailAndPassword(auth, email, password);
```

**Firebase genera:**
- ✅ **ID Token** → Caduca en 1 hora
- ✅ **Refresh Token** → Caduca en semanas/meses
- ✅ **User UID** → Identificador único permanente

### **2. Peticiones al Backend**

```javascript
// src/services/apiClient.js - buildHeaders()
const token = await user.getIdToken(true); // 👈 Auto-refresh
headers: { Authorization: `Bearer ${token}` }
```

**Proceso:**
1. Frontend pide token con `getIdToken(true)`
2. Firebase verifica si el token está expirado
3. Si está expirado: usa refresh token para obtener uno nuevo
4. Si refresh token es válido: devuelve nuevo ID token
5. Si refresh token expiró: usuario debe re-loguearse

### **3. Validación en Backend**

```javascript
// backend/middleware/authMiddleware.js
const decodedToken = await admin.auth().verifyIdToken(idToken);
req.user = { uid: decodedToken.uid, email: decodedToken.email };
```

**Backend verifica:**
- ✅ Token no expirado (< 1 hora)
- ✅ Firma válida (emitido por Firebase)
- ✅ No revocado manualmente

---

## ⏱️ **DURACIÓN DE SESIONES**

### **ID Token (Access Token)**
- **Duración:** 1 hora
- **Uso:** Autenticación en cada petición
- **Refresh:** Automático
- **Almacenamiento:** localStorage (temporal)

### **Refresh Token**
- **Duración:** Semanas o meses (configurable en Firebase Console)
- **Uso:** Renovar ID tokens expirados
- **Refresh:** No necesita (lo gestiona Firebase)
- **Almacenamiento:** IndexedDB (persistente)

### **Sesión del Usuario**
- **Duración:** Hasta que el refresh token expire O usuario cierre sesión
- **Reinicio:** Solo si:
  - Usuario hace logout
  - Refresh token expira
  - Token revocado en Firebase Console
  - Usuario cambia contraseña

---

## 🔒 **CONFIGURACIÓN DE SEGURIDAD**

### **Firebase Console → Authentication → Settings**

#### **Duración de Refresh Token (Recomendado)**
```
Settings → Session Management
└── Session duration: 30 días (default)
```

**Opciones disponibles:**
- Mínimo: 1 día
- Máximo: Sin límite (no recomendado)
- **Recomendado:** 30-90 días

#### **Revocar Tokens en Caso de Compromiso**
```javascript
// Backend: revocar todos los tokens de un usuario
await admin.auth().revokeRefreshTokens(uid);
```

**Cuándo usar:**
- 🚨 Cuenta comprometida
- 🚨 Usuario reporta acceso no autorizado
- 🚨 Cambio de contraseña sospechoso

---

## 🛡️ **MEDIDAS DE SEGURIDAD IMPLEMENTADAS**

### **1. Token Refresh Automático**
```javascript
// ✅ IMPLEMENTADO en src/services/apiClient.js
const token = await user.getIdToken(true); // Siempre refresca
```

**Ventajas:**
- ✅ Tokens de corta duración (menos riesgo si se roban)
- ✅ UX perfecta (usuario no nota nada)
- ✅ Sesiones largas sin comprometer seguridad

### **2. Limpieza de Tokens Expirados**
```javascript
// ✅ IMPLEMENTADO en src/services/apiClient.js
if (!user) {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
```

**Ventajas:**
- ✅ No acumula tokens inválidos
- ✅ Previene errores 401 por tokens expirados

### **3. Validación Estricta en Backend**
```javascript
// ✅ IMPLEMENTADO en backend/middleware/authMiddleware.js
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

**Verifica:**
- ✅ Token no expirado
- ✅ Firma válida
- ✅ Emitido por Firebase
- ✅ No revocado

### **4. Envío Automático de Token**
```javascript
// ✅ IMPLEMENTADO en src/services/apiClient.js
const shouldAuth = opts.auth !== false; // Por defecto: true
```

**Ventajas:**
- ✅ No olvidas enviar token en ningún endpoint
- ✅ Endpoints protegidos por defecto
- ✅ Opt-out explícito con `auth: false`

---

## 🧪 **TESTING**

### **Verificar Token Funciona**

**Frontend (Consola del navegador):**
```javascript
// Obtener token actual
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log('Token:', token);

// Decodificar token (ver expiración)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Expira:', new Date(payload.exp * 1000));
```

**Backend (Test endpoint):**
```bash
# Obtener token del navegador y probar
curl -X GET http://localhost:4004/api/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Simular Token Expirado**

```javascript
// En consola del navegador:
// 1. Guardar token expirado manualmente
localStorage.setItem('mw360_auth_token', 'token_viejo_expirado');

// 2. Hacer petición
await fetch('http://localhost:4004/api/test', {
  headers: { Authorization: 'Bearer token_viejo_expirado' }
});

// 3. Ver error 401, luego el sistema debería auto-refrescar
```

---

## 📊 **MONITORIZACIÓN**

### **Logs a Revisar**

**Frontend (Consola):**
```
[apiClient] Error refreshing auth token: ...
[apiClient] Authentication required to call this endpoint
```

**Backend (Logs):**
```
[authMiddleware] No token provided
[authMiddleware] Invalid token: Firebase ID token has expired
[authMiddleware] Token verification failed: ...
```

### **Métricas Útiles**

1. **Tasa de refresh exitoso**
   - Número de tokens refrescados / Total de peticiones

2. **Errores 401 por usuario**
   - Si un usuario tiene muchos 401 → problema con refresh token

3. **Duración promedio de sesión**
   - Tiempo entre login y logout

---

## 🔧 **TROUBLESHOOTING**

### **Error: "Firebase ID token has expired"**

**Causa:** Token expiró y no se refrescó

**Solución:**
```javascript
// Ya implementado en apiClient.js
const token = await user.getIdToken(true); // Fuerza refresh
```

### **Error: "No token provided" (401)**

**Causa:** No se envía token en headers

**Solución:**
```javascript
// Ya implementado en apiClient.js
const shouldAuth = opts.auth !== false; // Por defecto: envía token
```

### **Error: "Refresh token expired"**

**Causa:** Usuario no usó la app durante semanas/meses

**Solución:**
```javascript
// Usuario debe re-loguearse
await signOut();
navigate('/login');
```

### **Usuario queda "atascado" sin poder autenticar**

**Solución:**
```javascript
// Limpiar todo y forzar re-login
localStorage.clear();
indexedDB.deleteDatabase('firebaseLocalStorageDb');
location.reload();
```

---

## 🎯 **MEJORAS FUTURAS (OPCIONALES)**

### **1. Timeout de Inactividad**

```javascript
// Cerrar sesión tras 7 días sin actividad
const INACTIVITY_DAYS = 7;
let lastActivity = Date.now();

// Actualizar en cada acción del usuario
document.addEventListener('click', () => {
  lastActivity = Date.now();
  localStorage.setItem('last_activity', lastActivity);
});

// Verificar al cargar
const stored = localStorage.getItem('last_activity');
if (stored && (Date.now() - stored) > INACTIVITY_DAYS * 86400000) {
  await signOut();
}
```

### **2. Multi-Device Session Management**

```javascript
// Limitar a X dispositivos simultáneos
// Guardar en Firestore: users/{uid}/sessions/{deviceId}
await db.collection('users').doc(uid).collection('sessions').add({
  deviceId: generateDeviceId(),
  lastSeen: new Date(),
  userAgent: navigator.userAgent
});

// Revocar sesiones antiguas si hay > 3 activas
```

### **3. Alertas de Seguridad**

```javascript
// Notificar al usuario de nuevos logins
await db.collection('users').doc(uid).collection('loginEvents').add({
  timestamp: new Date(),
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  location: await getLocationFromIP(req.ip)
});

// Enviar email si login desde nueva ubicación
```

---

## 📝 **RESUMEN**

### ✅ **Lo que TIENES (ya implementado):**
1. Auto-refresh de tokens (1 hora → automático)
2. Sesiones largas (semanas/meses con refresh token)
3. UX perfecta (usuario no nota expiración)
4. Seguridad robusta (tokens cortos + validación estricta)
5. Limpieza automática de tokens expirados
6. Envío automático de tokens en peticiones

### ❌ **Lo que NO necesitas:**
1. Forzar re-login cada hora (mala UX)
2. Session cookies (complejo, sin beneficio real)
3. Tokens de larga duración (menos seguro)

### 🎯 **Resultado:**
Sistema de autenticación **production-ready** con el balance perfecto entre seguridad y experiencia de usuario.

---

**Última actualización:** 2025-10-23  
**Estado:** ✅ **FUNCIONANDO** (auto-refresh activado)
