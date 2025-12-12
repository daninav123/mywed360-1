# 🔑 Credenciales Proveedor ReSona

## ✅ Contraseña Reseteada Exitosamente

**Fecha:** 11 Nov 2025, 14:35

---

## 🔐 Credenciales de Login

### **Email:** `resona@icloud.com`  
### **Password:** `test123`

⚠️ **IMPORTANTE:** El email es `resona@icloud.com`, NO `resona@test.com`

---

## 🚀 Cómo Iniciar Sesión

### **1. Accede a la página de login:**
```
http://localhost:5175/login
```

### **2. Introduce las credenciales:**
- Email: `resona@icloud.com`
- Contraseña: `test123`

### **3. Haz clic en "Iniciar Sesión"**

---

## ℹ️ Información del Proveedor

| Campo | Valor |
|-------|-------|
| **ID** | z0BAVOrrub8xQvUtHIOw |
| **Nombre** | ReSona |
| **Email** | resona@icloud.com |
| **Estado** | active ✅ |

---

## 🔧 Script de Reset

Se creó el script `backend/reset-resona-password.js` que:

1. ✅ Busca el proveedor ReSona en Firestore
2. ✅ Verifica la contraseña actual
3. ✅ Genera un nuevo hash de "test123"
4. ✅ Actualiza la contraseña en Firestore
5. ✅ Verifica que funciona correctamente

### Para volver a ejecutarlo:
```bash
node backend/reset-resona-password.js
```

---

## 🎯 Sistema de Login

El sistema de login de proveedores:

1. Busca el proveedor por email en `suppliers` collection
2. Verifica que tenga `auth.passwordHash`
3. Compara la contraseña con `bcrypt.compare()`
4. Genera un token JWT si es correcto
5. Redirige al dashboard del proveedor

---

## ✅ Verificación Realizada

El script confirmó que:
- ✅ Proveedor existe en Firestore
- ✅ Email es `resona@icloud.com`
- ✅ Contraseña anterior NO era "test123"
- ✅ Nueva contraseña "test123" generada
- ✅ Hash actualizado en Firestore
- ✅ Verificación exitosa con bcrypt

---

## 🔐 Seguridad

**Hashing con bcrypt:**
- Salt rounds: 10
- Hash almacenado en `auth.passwordHash`
- Comparación segura con `bcrypt.compare()`

---

**¡Listo para usar!** 🎉
