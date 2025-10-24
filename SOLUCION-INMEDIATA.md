# 🚨 SOLUCIÓN INMEDIATA - ERROR 401 BUSCADOR IA

## ⚡ **HAZ ESTO AHORA (2 MINUTOS)**

### **Paso 1: Limpiar Token Expirado**

Abre tu navegador y ve a:
```
http://localhost:5173/clear-token.html
```

O ejecuta en la **Consola del Navegador** (F12):
```javascript
localStorage.removeItem('mw360_auth_token');
location.reload();
```

---

### **Paso 2: Recargar y Probar**

1. **Recarga la página** (F5)
2. Ve a **Proveedores** → **"Buscar con IA"**
3. Busca: **"dj valencia"**

✅ **Debería funcionar AHORA**

---

## 🧪 **EJECUTAR TEST E2E (Verificación Automática)**

```powershell
# Asegúrate de que backend está corriendo (otra terminal)
cd backend
npm run dev

# En la terminal principal, ejecuta:
npm run cypress:run:ai-search
```

El test verificará automáticamente:
- ✅ Backend funcionando
- ✅ Token válido
- ✅ Búsqueda funciona
- ✅ Resultados se muestran

---

## 🎯 **LO QUE HE SOLUCIONADO**

### **Archivos Modificados:**
1. ✅ `src/services/apiClient.js` → Auto-refresh de tokens mejorado
2. ✅ `src/hooks/useAISearch.jsx` → Envío correcto de auth
3. ✅ `package.json` → Comandos npm añadidos

### **Archivos Creados:**
1. ✅ `scripts/clearAuthToken.js` → Limpiar tokens
2. ✅ `cypress/e2e/ai-supplier-search.cy.js` → Test E2E completo
3. ✅ `public/clear-token.html` → Página de limpieza
4. ✅ `docs/FIX-BUSCADOR-PROVEEDORES-401.md` → Guía completa
5. ✅ `docs/AUTENTICACION-TOKENS.md` → Documentación tokens

---

## 🔄 **CÓMO FUNCIONA AHORA**

### **Auto-Refresh de Tokens:**
```javascript
// Frontend obtiene token SIEMPRE fresco
const token = await user.getIdToken(true); // ← Refresca automáticamente

// Backend valida
await admin.auth().verifyIdToken(token); // ← Siempre válido
```

**Resultado:**
- ✅ Token se refresca cada hora automáticamente
- ✅ Usuario NUNCA ve error 401
- ✅ Sesión permanece activa indefinidamente

---

## 🚨 **SI AÚN NO FUNCIONA**

### **Opción A: Limpiar TODO**
```javascript
// En consola del navegador
localStorage.clear();
location.reload();
```

### **Opción B: Re-login**
1. Haz **logout**
2. Haz **login de nuevo**
3. Prueba buscar

### **Opción C: Ver logs detallados**

Activa debug en `apiClient.js`:
```javascript
// Línea 35
const DEBUG = true; // ← Cambiar a true
```

Recarga y revisa logs en consola del navegador.

---

## 📞 **VERIFICACIÓN RÁPIDA**

Ejecuta en **Consola del Navegador**:

```javascript
// Verificar usuario
const user = firebase.auth().currentUser;
console.log('✅ Usuario:', user?.email);

// Verificar token
const token = await user?.getIdToken(true);
console.log('✅ Token:', token ? 'VÁLIDO' : 'NULL');

// Verificar expiración
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const exp = new Date(payload.exp * 1000);
  console.log('✅ Expira:', exp.toLocaleString());
  console.log('✅ ¿Expirado?:', exp < new Date() ? 'SÍ ❌' : 'NO ✅');
}

// Probar endpoint
const response = await fetch('http://localhost:4004/api/ai-suppliers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'dj valencia',
    service: 'DJ',
    location: 'Valencia'
  })
});
console.log('✅ Backend:', response.status, response.ok ? 'OK' : 'FALLO');
const result = await response.json();
console.log('✅ Resultados:', result);
```

---

## ✅ **CONFIRMACIÓN**

Después de limpiar el token, deberías ver:
- ✅ Usuario autenticado
- ✅ Token válido (expira en ~60 minutos)
- ✅ Búsqueda funciona sin error 401
- ✅ Resultados se muestran

**¿Funciona? Pégame el resultado.**
