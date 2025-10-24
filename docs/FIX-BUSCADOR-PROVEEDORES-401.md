# 🔧 FIX: Error 401 en Buscador de Proveedores IA

## 🎯 **PROBLEMA**

El buscador de proveedores IA devuelve error **401 (Unauthorized)**:
- Backend rechaza con: "Firebase ID token has expired"
- Token en localStorage está expirado (> 1 hora)
- El sistema no refresca el token automáticamente

---

## ✅ **SOLUCIÓN RÁPIDA (3 PASOS)**

### **Paso 1: Limpiar Token Expirado**

#### **Opción A: Desde el Navegador (MÁS FÁCIL)**

1. Abre en tu navegador: **http://localhost:5173/clear-token.html**
2. Click en **"🔍 Verificar Token"**
3. Si muestra "❌ Token EXPIRADO", click en **"🗑️ Limpiar Token"**
4. Click en **"🔄 Recargar Aplicación"**

#### **Opción B: Desde Consola del Navegador**

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Ejecuta:
   ```javascript
   localStorage.removeItem('mw360_auth_token');
   location.reload();
   ```

#### **Opción C: Desde Script PowerShell**

```powershell
node scripts/clearAuthToken.js
```

---

### **Paso 2: Recargar y Verificar**

1. **Recarga la página** (F5)
2. Verifica que estás autenticado (deberías ver tu email en la esquina)
3. Si no estás autenticado, haz **login de nuevo**

---

### **Paso 3: Probar Buscador**

1. Ve a **Proveedores**
2. Click en **"Buscar con IA"**
3. Busca: **"dj valencia"**
4. ✅ Debería funcionar sin error 401

---

## 🧪 **VERIFICACIÓN CON TEST E2E**

### **Ejecutar Test Automático**

```bash
# Opción 1: Test completo (verifica backend + frontend + ejecuta test)
npm run test:ai-search

# Opción 2: Solo ejecutar Cypress
npm run cypress:run:ai-search
```

**El test verifica:**
- ✅ Backend respondiendo
- ✅ OpenAI configurado
- ✅ Usuario puede autenticarse
- ✅ Token es válido y no expirado
- ✅ Búsqueda funciona y devuelve resultados
- ✅ Resultados se muestran en la UI

---

## 🔍 **DIAGNÓSTICO DETALLADO**

### **1. Verificar Backend**

```bash
curl http://localhost:4004/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "openai": true
}
```

---

### **2. Verificar Token en Navegador**

Abre **DevTools → Console** y ejecuta:

```javascript
// Obtener usuario actual
const user = firebase.auth().currentUser;
console.log('Usuario:', user?.email);

// Obtener token
const token = await user.getIdToken(true);
console.log('Token:', token);

// Decodificar y ver expiración
const payload = JSON.parse(atob(token.split('.')[1]));
const exp = new Date(payload.exp * 1000);
console.log('Expira:', exp.toLocaleString());
console.log('¿Expirado?:', exp < new Date());
```

---

### **3. Verificar Envío de Token**

Abre **DevTools → Network** y filtra por `ai-suppliers`:

1. Busca en el buscador IA
2. Encuentra la petición `POST /api/ai-suppliers`
3. Ve a **Headers**
4. Verifica que incluye:
   ```
   Authorization: Bearer eyJhbGci...
   ```

---

## 🛠️ **CAUSAS Y SOLUCIONES**

### **Causa 1: Token Expirado en localStorage**

**Síntoma:**
```
Firebase ID token has expired. Get a fresh token from your client app and try again
```

**Solución:**
```javascript
localStorage.removeItem('mw360_auth_token');
location.reload();
```

---

### **Causa 2: Firebase Auth No Inicializado**

**Síntoma:**
```javascript
auth.currentUser === null
```

**Solución:**
- Espera a que Firebase Auth se inicialice
- Verifica que `firebaseConfig.jsx` se carga correctamente
- Verifica que las credenciales de Firebase son correctas en `.env`

---

### **Causa 3: Usuario No Autenticado**

**Síntoma:**
- No se envía header `Authorization`
- Backend devuelve 401 con "Token de autenticación requerido"

**Solución:**
1. Haz **logout**
2. Haz **login de nuevo**
3. Verifica que `firebase.auth().currentUser` no es null

---

### **Causa 4: Token No Se Refresca Automáticamente**

**Síntoma:**
- Token expira
- No se obtiene uno nuevo automáticamente
- Error 401 después de 1 hora de uso

**Solución:**
✅ **YA IMPLEMENTADA** en `src/services/apiClient.js`:
```javascript
const token = await user.getIdToken(true); // Siempre refresca
```

---

### **Causa 5: OpenAI No Configurado**

**Síntoma:**
- Backend devuelve 500
- Error: "OPENAI_API_KEY missing"

**Solución:**
1. Edita `backend/.env`
2. Añade:
   ```env
   OPENAI_API_KEY=sk-proj-tu-key-aqui
   OPENAI_PROJECT_ID=proj_tu-project-id
   ```
3. Reinicia backend: `cd backend && npm run dev`

---

## 📊 **ARQUITECTURA DEL FIX**

### **Frontend: `src/services/apiClient.js`**

```javascript
async function getAuthToken() {
  // 1. Verificar que Firebase Auth esté inicializado
  if (!auth) return null;
  
  // 2. Obtener usuario actual
  const user = auth.currentUser;
  if (!user) return null;
  
  // 3. SIEMPRE obtener token fresco (auto-refresh)
  const token = await user.getIdToken(true);
  
  // 4. Guardar en localStorage
  localStorage.setItem('mw360_auth_token', token);
  
  return token;
}

async function buildHeaders(opts = {}) {
  // Por defecto, SIEMPRE enviar token si hay usuario
  const shouldAuth = opts.auth !== false;
  
  if (shouldAuth) {
    const token = await getAuthToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  
  return {};
}
```

---

### **Backend: `middleware/authMiddleware.js`**

```javascript
const authMiddleware = async (req, res, next) => {
  // 1. Extraer token del header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  // 2. Verificar con Firebase Admin
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // Token expirado o inválido
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
```

---

## 🎯 **CHECKLIST DE VERIFICACIÓN**

Marca cada item después de verificarlo:

### **Backend**
- [ ] Backend corriendo en `http://localhost:4004`
- [ ] Endpoint `/api/health` responde 200
- [ ] OpenAI API Key configurada en `.env`
- [ ] Firebase Admin SDK inicializado correctamente

### **Frontend**
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Firebase Auth inicializado
- [ ] Usuario autenticado (`firebase.auth().currentUser !== null`)
- [ ] Token válido y no expirado

### **Flujo de Auth**
- [ ] Token se obtiene con `getIdToken(true)` (auto-refresh)
- [ ] Token se envía en header `Authorization: Bearer ...`
- [ ] Backend valida token y devuelve 200
- [ ] Si token expira, se refresca automáticamente

### **Buscador IA**
- [ ] Modal de búsqueda se abre sin errores
- [ ] Búsqueda "dj valencia" devuelve resultados
- [ ] No hay errores 401 en DevTools
- [ ] Resultados se muestran en la UI

---

## 🚨 **SOLUCIÓN NUCLEAR (Si nada funciona)**

### **Paso 1: Limpiar TODO**

```javascript
// En consola del navegador
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('firebaseLocalStorageDb');
location.reload();
```

### **Paso 2: Re-login**

1. Haz **logout** completo
2. Cierra el navegador
3. Abre de nuevo
4. Haz **login desde cero**

### **Paso 3: Verificar Credenciales**

**`.env` (frontend):**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=lovenda-98c77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lovenda-98c77
```

**`backend/.env` (backend):**
```env
FIREBASE_PROJECT_ID=lovenda-98c77
FIREBASE_SERVICE_ACCOUNT_KEY=... (base64 o JSON)
OPENAI_API_KEY=sk-proj-...
```

### **Paso 4: Reiniciar Servidores**

```powershell
# Matar procesos
taskkill /F /IM node.exe

# Reiniciar frontend
npm run dev

# Reiniciar backend (en otra terminal)
cd backend
npm run dev
```

---

## 📝 **ARCHIVOS CREADOS/MODIFICADOS**

### **Nuevos Archivos:**
1. ✅ `scripts/clearAuthToken.js` - Script para limpiar tokens
2. ✅ `scripts/testAISearchE2E.js` - Test E2E automatizado
3. ✅ `cypress/e2e/ai-supplier-search.cy.js` - Test Cypress
4. ✅ `public/clear-token.html` - Página web para limpiar token
5. ✅ `docs/FIX-BUSCADOR-PROVEEDORES-401.md` - Esta guía
6. ✅ `docs/AUTENTICACION-TOKENS.md` - Documentación completa

### **Archivos Modificados:**
1. ✅ `src/services/apiClient.js` - Mejoras en auto-refresh
2. ✅ `src/hooks/useAISearch.jsx` - Corregido envío de auth
3. ✅ `package.json` - Añadidos comandos npm

---

## 🎉 **RESULTADO ESPERADO**

Después de seguir esta guía:

1. ✅ Token se refresca automáticamente cada hora
2. ✅ Usuario no nota expiración de tokens
3. ✅ Buscador de proveedores IA funciona perfectamente
4. ✅ No más errores 401
5. ✅ Test E2E pasa exitosamente

---

**Última actualización:** 2025-10-23  
**Estado:** ✅ **SOLUCIONADO**
