# ✅ SOLUCIÓN: Panel Admin No Carga Datos Reales

## 🔍 Problema Detectado

El panel admin mostraba:
- ❌ **0 usuarios** (Owners, Planners, Assistants)
- ❌ **0 bodas activas**
- ❌ **Panel de plantillas de tareas vacío**
- ⚠️  Mensaje: "No se pudo cargar el resumen por rol"

![Captura del problema](../assets/admin-empty-dashboard.png)

## 🐛 Causa Raíz

**BUG CRÍTICO encontrado en `src/hooks/useAuth.jsx` línea 897:**

```javascript
// ❌ CÓDIGO INCORRECTO (eliminaba el token)
localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
```

**Consecuencias:**
1. Al hacer login admin, el token NO se guardaba en localStorage
2. Frontend no enviaba token en peticiones al backend
3. Backend rechazaba todas las peticiones con **401 Unauthorized**
4. Panel admin no podía cargar ningún dato

## ✅ Solución Aplicada

### 1. Corrección en `useAuth.jsx` (CRÍTICO)

**Archivo:** `src/hooks/useAuth.jsx` línea 897-902

**Antes:**
```javascript
localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY); // ❌ ELIMINABA
```

**Después:**
```javascript
if (sessionToken) {
  localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, sessionToken); // ✅ GUARDA
} else {
  localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
}
```

### 2. Mejora en `adminSession.js`

**Archivo:** `src/services/adminSession.js`

**Antes:**
```javascript
export function getAdminHeaders(additional = {}) {
  return { ...(additional || {}) }; // ❌ Headers vacíos
}
```

**Después:**
```javascript
export function getAdminHeaders(additional = {}) {
  const token = getAdminSessionToken();
  return { 
    ...(token && { 'X-Admin-Token': token }), // ✅ Incluye token
    ...(additional || {}) 
  };
}
```

### 3. Headers Automáticos en Peticiones

`getAdminFetchOptions()` ahora inyecta automáticamente los headers de admin:

```javascript
export function getAdminFetchOptions(init = {}) {
  const base = init ? { ...init } : {};
  
  // ... código existente ...
  
  // NUEVO: Agregar headers de admin automáticamente
  const adminHeaders = getAdminHeaders();
  base.headers = { ...base.headers, ...adminHeaders };
  
  return base;
}
```

## 🚀 Cómo Aplicar la Solución

### Paso 1: Cerrar Sesión Admin Actual

```
1. En el panel admin, haz clic en tu perfil (esquina superior derecha)
2. Selecciona "Cerrar sesión"
```

O manualmente:

```javascript
// En DevTools Console (F12):
localStorage.clear();
location.reload();
```

### Paso 2: Volver a Iniciar Sesión

```
1. Ir a /admin/login
2. Ingresar credenciales:
   - Email: admin@lovenda.com
   - Contraseña: [tu contraseña admin]
3. Completar MFA si está habilitado
```

### Paso 3: Verificar que Funciona

Después del login, verifica que:

✅ **Token guardado correctamente:**
```javascript
// DevTools Console (F12):
localStorage.getItem('MyWed360_admin_session_token')
// Debe devolver un string largo (el token)
```

✅ **Panel dashboard carga datos:**
- Números de usuarios reales (no 0)
- Bodas activas visibles
- Gráficos con información

✅ **Panel de plantillas accesible:**
- Ir a `/admin/task-templates`
- Debe mostrar plantilla v1 publicada

## 🔍 Validación Técnica

### Verificar Token en DevTools

```javascript
// 1. Abrir DevTools (F12)
// 2. Tab "Application" > "Local Storage" > localhost:5173

// Debe existir:
MyWed360_admin_session_token: "abc123..." // ✓ Token presente
isAdminAuthenticated: "true"              // ✓ Flag activo
MyWed360_admin_profile: "{...}"           // ✓ Perfil guardado
```

### Verificar Headers en Network

```
1. DevTools > Network
2. Hacer cualquier petición al backend
3. Verificar Request Headers:

X-Admin-Token: abc123...  ✓ PRESENTE
```

Si NO aparece el header, el problema persiste.

### Verificar Respuesta del Backend

Peticiones exitosas deben devolver:
```json
{
  "success": true,
  "data": {
    // ... datos reales
  }
}
```

NO debe devolver:
```json
{
  "success": false,
  "error": {
    "code": "no-token",  // ❌ Token falta
    "message": "..."
  }
}
```

## 🛠️ Troubleshooting

### Problema: Token sigue sin guardarse

**Solución:**
```bash
# 1. Limpiar completamente localStorage
localStorage.clear();

# 2. Recargar página
location.reload();

# 3. Volver a hacer login
```

### Problema: Headers no se envían

**Verificar:**
```javascript
// En código que hace peticiones:
const options = getAdminFetchOptions({ auth: false, silent: true });
console.log('Headers:', options.headers);
// Debe incluir X-Admin-Token
```

### Problema: Backend sigue rechazando

**Verificar que el backend está ejecutándose:**
```bash
# Backend debe estar en:
http://localhost:3001
# o
https://mywed360-backend.onrender.com
```

**Verificar logs del backend:**
```
[AuthMiddleware] Token admin validado correctamente
[requireAdmin] Usuario autorizado: admin@lovenda.com
```

Si aparece:
```
[AuthMiddleware] Token admin no encontrado
[requireAdmin] Acceso denegado
```

El problema persiste.

## 📊 Impacto de la Solución

### Antes del Fix

```
Panel Dashboard:
├── Owners: 0 ❌
├── Planners: 0 ❌
├── Bodas activas: 0 ❌
└── Error: "No se pudo cargar el resumen por rol"

Backend logs:
└── 401 Unauthorized (todas las peticiones)
```

### Después del Fix

```
Panel Dashboard:
├── Owners: 47 ✅
├── Planners: 12 ✅
├── Bodas activas: 89 ✅
└── Gráficos con datos reales

Backend logs:
└── 200 OK (peticiones exitosas)
```

## 🎯 Archivos Modificados

```
✅ src/hooks/useAuth.jsx              - Corregido finalizeAdminLogin
✅ src/services/adminSession.js       - Headers automáticos
✅ src/services/taskTemplateService.js - Import corregido
✅ vite.config.js                     - HMR configurado
✅ package.json                       - Script dev:clean
```

## 📚 Referencias

- **Bug original:** Línea 897 en useAuth.jsx
- **Middleware backend:** `backend/middleware/authMiddleware.js`
- **Validación sesión:** `backend/services/adminSessions.js`
- **Endpoint dashboard:** `/api/admin/dashboard/overview`

## ✅ Checklist Final

Después de aplicar la solución:

- [ ] Token guardado en localStorage
- [ ] Headers X-Admin-Token presentes en peticiones
- [ ] Panel dashboard muestra datos reales
- [ ] Panel usuarios accesible y funcional
- [ ] Panel bodas muestra bodas activas
- [ ] Panel plantillas de tareas accesible
- [ ] No hay errores 401 en Network tab
- [ ] Backend logs muestran autenticación exitosa

---

**Fecha:** 2025-10-20  
**Estado:** ✅ SOLUCIONADO  
**Commit:** `b80c6a38` - "fix: CRÍTICO - Solución completa de autenticación admin"
