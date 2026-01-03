# 🗺️ Rutas de Proveedores - Guía Rápida

## 📋 **3 Portales Diferentes**

Tu app tiene **3 rutas distintas** para proveedores. Aquí está la diferencia:

---

## 1️⃣ **Portal de REGISTRO** (Público - Sin Token)

### **Ruta:** `/supplier/register`

**¿Para qué?**
- Cualquier proveedor puede registrarse en la plataforma
- **NO requiere token ni invitación**
- Completamente público y abierto

**¿Quién lo usa?**
- Nuevos proveedores que quieren unirse
- Proveedores existentes en caché que quieren reclamar su perfil

**Ejemplo:**
```
https://tuapp.com/supplier/register
```

**Flujo:**
```
Proveedor → Formulario → Registro → Dashboard
```

---

## 2️⃣ **Portal de DASHBOARD** (Protegido - Requiere Login)

### **Ruta:** `/supplier/dashboard/:id`

**¿Para qué?**
- Dashboard personal del proveedor
- Gestionar su perfil
- Ver estadísticas (vistas, clics, contactos)

**¿Quién lo usa?**
- Proveedores ya registrados
- Después de hacer login

**Ejemplo:**
```
https://tuapp.com/supplier/dashboard/fotografia-maria-lopez-valencia
```

**Flujo:**
```
Proveedor registrado → Login → Dashboard → Editar perfil
```

---

## 3️⃣ **Portal de RESPUESTA** (Requiere Token Único)

### **Ruta:** `/supplier/:token`

**¿Para qué?**
- Responder a solicitudes específicas de bodas
- Token único por cada solicitud

**¿Quién lo usa?**
- Proveedores contactados por parejas
- Token generado por la pareja desde su dashboard

**Ejemplo:**
```
https://tuapp.com/supplier/abc123xyz456
```

**Flujo:**
```
Pareja genera token → Envía link a proveedor → Proveedor responde
```

---

## 📊 **Comparación Visual**

| Aspecto | Registro | Dashboard | Respuesta |
|---------|----------|-----------|-----------|
| **Ruta** | `/supplier/register` | `/supplier/dashboard/:id` | `/supplier/:token` |
| **Requiere Token** | ❌ NO | ❌ NO | ✅ SÍ |
| **Requiere Login** | ❌ NO | ✅ SÍ | ❌ NO |
| **Público** | ✅ SÍ | ❌ NO | ⚠️ Con token |
| **Propósito** | Registrarse | Gestionar perfil | Responder solicitud |

---

## 🔐 **Seguridad**

### **Portal de Registro (Público):**
```javascript
// Sin protección - Cualquiera puede acceder
<Route path="supplier/register" element={<SupplierRegister />} />
```

### **Portal de Dashboard (Protegido):**
```javascript
// Verifica Firebase Auth en el componente
useEffect(() => {
  const user = auth.currentUser;
  if (!user) {
    navigate('/supplier/login');
  }
}, []);
```

### **Portal de Respuesta (Token):**
```javascript
// Verifica token en backend
const token = await resolveToken(tokenFromUrl);
if (!token) return res.status(404).json({ error: 'invalid_token' });
```

---

## 🚀 **Casos de Uso**

### **Caso 1: Proveedor nuevo quiere unirse**
```
1. Va a /supplier/register
2. Completa formulario
3. Se registra (Firebase Auth)
4. Automático → Dashboard
```

### **Caso 2: Proveedor registrado quiere editar perfil**
```
1. Va a /supplier/login (o usa saved login)
2. Login con Firebase
3. Redirección → /supplier/dashboard/{id}
4. Edita su información
```

### **Caso 3: Pareja quiere pedir presupuesto a proveedor**
```
1. Pareja genera token desde su dashboard
2. Sistema crea link: /supplier/abc123xyz
3. Pareja envía link por email/WhatsApp
4. Proveedor click → Formulario específico
5. Proveedor responde con disponibilidad y presupuesto
```

---

## 🛠️ **Para Desarrolladores**

### **Agregar enlace de registro en la UI:**

```jsx
// En cualquier página pública
<a href="/supplier/register">
  ¿Eres proveedor? Regístrate gratis
</a>
```

### **Redirigir después de login:**

```jsx
// En SupplierRegister.jsx
await signInWithCustomToken(auth, data.customToken);
navigate(`/supplier/dashboard/${data.supplierId}`);
```

### **Generar token de respuesta:**

```javascript
// Desde el dashboard de la pareja
const response = await fetch(
  `/api/supplier-portal/weddings/${weddingId}/suppliers/${supplierId}/portal-token`,
  { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
);
const { url } = await response.json();
// Enviar `url` al proveedor
```

---

## 📝 **Orden de Implementación (Fases)**

### **Fase 1:** ✅ Cache Silencioso
- Sistema guarda proveedores automáticamente

### **Fase 2:** ✅ Búsqueda Híbrida
- Prioriza BD propia → bodas.net → internet

### **Fase 3:** ✅ Portal de Registro ← **AQUÍ ESTAMOS**
- `/supplier/register` - Público
- `/supplier/dashboard/:id` - Dashboard

### **Portal de Respuesta:** ✅ Ya existía
- `/supplier/:token` - Era del proyecto original

---

## 🎯 **¿Cuál usar?**

**Quiero que proveedores se registren:**
→ `/supplier/register` (Público, sin token)

**Quiero que proveedores editen su perfil:**
→ `/supplier/dashboard/:id` (Requiere login)

**Quiero que un proveedor responda mi solicitud:**
→ `/supplier/:token` (Token generado por ti)

---

## ✅ **URLs de Prueba**

### **Local:**
- Registro: http://localhost:5173/supplier/register
- Dashboard: http://localhost:5173/supplier/dashboard/mi-proveedor-id
- Respuesta: http://localhost:5173/supplier/abc123xyz

### **Producción:**
- Registro: https://tuapp.com/supplier/register
- Dashboard: https://tuapp.com/supplier/dashboard/mi-proveedor-id
- Respuesta: https://tuapp.com/supplier/abc123xyz

---

## 🎉 **Resumen**

**3 portales, 3 propósitos diferentes:**

1. 🆕 **Registro** → Cualquiera puede registrarse (sin token)
2. 📊 **Dashboard** → Proveedores gestionan su perfil (con login)
3. 📧 **Respuesta** → Proveedores responden solicitudes (con token único)

**¡Todos funcionando y listos para usar!** 🚀
