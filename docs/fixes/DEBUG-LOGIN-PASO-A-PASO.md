# 🔍 DEBUG: Por qué no entra después del login

## ❓ Problema

Los logs muestran que:
- ✅ La página carga correctamente
- ✅ Sin error de QuotaExceededError
- ❌ **NO hay petición de login** en los logs

Esto significa que cuando haces click en "Iniciar Sesión", **la petición no se está enviando**.

---

## 🔍 VERIFICACIÓN PASO A PASO

### **1. Abre DevTools (F12)**

En la página de login: http://localhost:5175/login

### **2. Ve a la pestaña "Network" (Red)**

### **3. Introduce las credenciales:**
```
Email: resona@icloud.com
Password: test123
```

### **4. Click en "Iniciar Sesión"**

### **5. Observa la pestaña Network:**

**¿Qué deberías ver?**

```
POST /api/supplier-dashboard/auth/login
Status: 200 OK
```

**Si NO ves esta petición:**
- Hay un error en JavaScript que impide el submit
- El botón no está funcionando correctamente

---

## 🐛 Posibles Causas

### **Causa 1: Error de JavaScript Silencioso**

Ve a la pestaña **Console** en DevTools y busca errores en rojo.

### **Causa 2: El Formulario No Se Envía**

Puede haber un `preventDefault()` que bloquea el submit sin hacer nada.

### **Causa 3: Campo de Email/Password Vacío**

El código valida que no estén vacíos:
```javascript
if (!email || !password) {
  // No envía la petición
}
```

---

## 📊 Qué Hacer Ahora

### **Opción A: Verificar en Console**

1. Abre **Console** (F12 → Console)
2. Escribe y ejecuta:
   ```javascript
   localStorage.getItem('supplier_token')
   ```
3. Si devuelve un token → El login SÍ funcionó
4. Si devuelve `null` → El login NO se ejecutó

### **Opción B: Verificar en Network**

1. Abre **Network** (F12 → Network)
2. Intenta hacer login
3. ¿Aparece la petición POST?
   - ✅ SÍ → Mira el Status Code (200, 401, 500?)
   - ❌ NO → El formulario no se está enviando

---

## 🎯 Siguiente Paso

**Abre DevTools (F12) y dime:**

1. **En la pestaña Console:**
   - ¿Hay algún error en rojo?
   
2. **En la pestaña Network:**
   - Al hacer click en login, ¿aparece una petición POST?
   - ¿Qué Status Code tiene? (200, 401, 500?)

3. **Ejecuta en Console:**
   ```javascript
   localStorage.getItem('supplier_token')
   ```
   - ¿Qué devuelve? (token o null)

---

**Dime qué ves en DevTools para seguir debuggeando** 🔍
