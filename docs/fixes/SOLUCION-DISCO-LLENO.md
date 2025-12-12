# 🔴 PROBLEMA CRÍTICO: Disco Lleno - IndexedDB

## ❌ Error Detectado

```
QuotaExceededError: Encountered full disk while opening backing store for indexedDB.open.
```

**Significado:** El navegador no puede guardar datos en IndexedDB porque el disco está lleno o la cuota del navegador se agotó.

---

## ✅ Buenas Noticias

**El login SÍ funciona** - Ya no hay error 401. El problema ahora es que **Firebase Auth no puede guardar la sesión** porque IndexedDB está lleno.

---

## 🔧 SOLUCIONES (en orden de facilidad)

### **Solución 1: Limpiar Datos del Navegador (RÁPIDO) ⚡**

1. Abre **DevTools** (F12 o Cmd+Option+I)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú izquierdo, busca **Storage** → **Clear site data**
4. Marca todas las opciones:
   - ✅ Local storage
   - ✅ Session storage
   - ✅ IndexedDB
   - ✅ Cookies
5. Click en **"Clear site data"**
6. Recarga la página (F5)
7. Intenta el login de nuevo

---

### **Solución 2: Limpiar IndexedDB Manualmente**

1. Abre **DevTools** (F12)
2. Ve a **Application** → **IndexedDB**
3. Busca todas las bases de datos de `localhost:5175`
4. Click derecho en cada una → **Delete database**
5. Repite para todas las bases de datos
6. Recarga la página
7. Intenta el login de nuevo

---

### **Solución 3: Modo Incógnito (TEMPORAL)**

1. Abre una **ventana de incógnito** (Cmd+Shift+N)
2. Ve a: http://localhost:5175/login
3. Introduce las credenciales:
   - Email: `resona@icloud.com`
   - Password: `test123`
4. El modo incógnito no tiene datos previos, debería funcionar

⚠️ **Nota:** Esto es temporal, al cerrar la ventana perderás la sesión.

---

### **Solución 4: Liberar Espacio en Disco**

Si el disco realmente está lleno:

#### **En Mac:**

1. **Vaciar papelera:**
   ```bash
   rm -rf ~/.Trash/*
   ```

2. **Limpiar cache del navegador:**
   ```bash
   # Chrome
   rm -rf ~/Library/Caches/Google/Chrome/*
   
   # Safari
   rm -rf ~/Library/Caches/com.apple.Safari/*
   ```

3. **Limpiar logs del sistema:**
   ```bash
   sudo rm -rf /var/log/*.log
   ```

4. **Ver espacio disponible:**
   ```bash
   df -h /
   ```

---

### **Solución 5: Aumentar Cuota de IndexedDB**

Si el disco tiene espacio pero el navegador limita IndexedDB:

1. Abre **chrome://settings/content/all**
2. Busca `localhost:5175`
3. Borra todos los datos del sitio
4. Vuelve a intentar

---

## 🎯 SOLUCIÓN RECOMENDADA (La Más Rápida)

### **Pasos exactos:**

1. En la página de login, presiona **F12** (abre DevTools)

2. Click en la pestaña **Application**

3. En el menú izquierdo, click en **Storage**

4. Click en **"Clear site data"**

5. Marca TODO:
   ```
   ✅ Unregister service workers
   ✅ Local and session storage
   ✅ IndexedDB
   ✅ Web SQL
   ✅ Cookies
   ✅ Cache storage
   ```

6. Click en el botón **"Clear site data"**

7. Verás un mensaje: "Site data cleared"

8. **Cierra DevTools** (F12)

9. **Recarga la página** (Cmd+R)

10. **Intenta el login** con:
    - Email: `resona@icloud.com`
    - Password: `test123`

---

## 🔍 Verificar Si Funcionó

Después de limpiar los datos, deberías ver:

✅ **Sin errores** de `QuotaExceededError`  
✅ **Login exitoso**  
✅ **Redirección** a `/supplier/dashboard/z0BAVOrrub8xQvUtHIOw`

---

## 💡 Alternativa: Deshabilitar Persistencia de Firebase

Si nada funciona, puedo modificar el código para usar persistencia en memoria (no en IndexedDB):

```javascript
// En firebaseConfig.js
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';

const auth = getAuth(app);
await setPersistence(auth, inMemoryPersistence);
```

⚠️ **Desventaja:** Perderás la sesión al recargar la página.

---

## 📊 Diagnóstico

| Componente | Estado |
|------------|--------|
| Backend | ✅ Funcionando |
| CORS | ✅ Configurado |
| Credenciales | ✅ Correctas |
| Login API | ✅ Devuelve token |
| **IndexedDB** | ❌ **LLENO/BLOQUEADO** |
| Firebase Auth | ❌ No puede guardar sesión |

---

## 🚀 Próximo Paso

**Limpia los datos del navegador** usando la Solución 1 (la más rápida).

Después de limpiar, el login debería funcionar perfectamente.

**¿Probaste limpiar los datos del sitio?** 🧹
