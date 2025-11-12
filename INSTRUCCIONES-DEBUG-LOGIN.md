# 🔍 DEBUG LOGIN - Instrucciones

## 🎯 Problema Actual

El login desde `http://localhost:5175/login` está dando **401 Unauthorized**, pero el curl directo al backend funciona perfectamente.

---

## ✅ Verificaciones Hechas

1. ✅ **Backend funcionando** - Puerto 4004
2. ✅ **CORS configurado** - localhost:5175 permitido
3. ✅ **Contraseña correcta** - `test123` verificada con bcrypt
4. ✅ **Curl directo funciona** - Devuelve token correctamente

---

## 🔧 Herramienta de Debug

He creado un archivo HTML simple para debuggear el login:

### **Abrir en el navegador:**
```
file:///Users/dani/MaLoveApp%202/mywed360_windows/DEBUGGER-LOGIN.html
```

O desde terminal:
```bash
open /Users/dani/MaLoveApp\ 2/mywed360_windows/DEBUGGER-LOGIN.html
```

### **¿Qué hace?**
1. Pre-carga las credenciales correctas
2. Hace la petición directa al backend
3. Muestra el resultado detallado
4. Auto-submit después de 2 segundos

---

## 🔍 Posibles Causas del 401

### **1. Credenciales Incorrectas en el Frontend**
- ¿Estás escribiendo bien el email? `resona@icloud.com` (NO `resona@test.com`)
- ¿Estás escribiendo bien la password? `test123`

### **2. Email con Espacios o Caracteres Invisibles**
- Copia/pega las credenciales desde aquí:
  ```
  Email: resona@icloud.com
  Password: test123
  ```

### **3. Campo de Email Transformando el Texto**
- Algunos navegadores autocompletan mal
- Prueba en modo incógnito

### **4. Password con Autocomplete**
- El navegador podría estar auto-rellenando una contraseña anterior
- Borra el campo y escribe manualmente

---

## 📊 Comparación: Curl vs Frontend

### **Curl (FUNCIONA) ✅:**
```bash
curl -X POST http://localhost:4004/api/supplier-dashboard/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"resona@icloud.com","password":"test123"}'

# Respuesta:
{"success":true,"token":"ey...","supplier":{...}}
```

### **Frontend (DA 401) ❌:**
```javascript
POST http://localhost:5175/api/supplier-dashboard/auth/login
Status: 401 Unauthorized
```

**Diferencia:** El curl funciona, lo que significa que:
- ✅ Backend está bien
- ✅ Contraseña es correcta
- ❌ El frontend está enviando datos diferentes

---

## 🎯 Pasos para Resolver

### **Paso 1: Usa la herramienta de debug**
```bash
open /Users/dani/MaLoveApp\ 2/mywed360_windows/DEBUGGER-LOGIN.html
```

Si esto funciona ✅ → El problema está en el código del frontend  
Si esto falla ❌ → Hay un problema de red/CORS

### **Paso 2: Abre la consola del navegador (F12)**
Mira en la pestaña **Network**:
1. Busca la petición POST a `/api/supplier-dashboard/auth/login`
2. Ve a la pestaña **Payload** o **Request**
3. Verifica qué email y password está enviando realmente

### **Paso 3: Compara con lo esperado**
```json
// Lo que DEBE enviar:
{
  "email": "resona@icloud.com",
  "password": "test123"
}

// Verifica que NO esté enviando:
{
  "email": "resona@test.com",      // ❌ INCORRECTO
  "email": "resona@icloud.com ",   // ❌ Espacio al final
  "password": "Test123"            // ❌ Mayúscula incorrecta
}
```

---

## 💡 Respuesta del Backend en Caso de Error

Si el backend da 401, significa una de estas opciones:

### **Código del backend (supplier-dashboard.js):**
```javascript
if (!email || !password) {
  return res.status(400).json({ error: 'email_password_required' });
}

if (suppliersQuery.empty) {
  return res.status(401).json({ error: 'invalid_credentials' });  // ← Este error
}

if (!supplierData.auth?.passwordHash) {
  return res.status(401).json({ error: 'password_not_set' });
}

const passwordValid = await bcrypt.compare(password, supplierData.auth.passwordHash);
if (!passwordValid) {
  return res.status(401).json({ error: 'invalid_credentials' });  // ← O este
}
```

**Posibles errores 401:**
1. `invalid_credentials` - Email no encontrado O password incorrecta
2. `password_not_set` - El proveedor no tiene password configurada

---

## 🔐 Verificar Contraseña Actual

Para estar 100% seguro de que la contraseña es correcta:

```bash
node backend/reset-resona-password.js
```

Esto:
1. Verifica la contraseña actual
2. La resetea a `test123` si es diferente
3. Confirma que funciona

---

## ✅ Siguiente Acción

**Abre el debugger y dime qué resultado obtienes:**
```bash
open /Users/dani/MaLoveApp\ 2/mywed360_windows/DEBUGGER-LOGIN.html
```

Si funciona ✅ → Hay un problema con el código del frontend  
Si falla ❌ → Necesitamos investigar más el backend
