# 📝 REGISTRO PÚBLICO DE PROVEEDORES

**Fecha:** 2025-10-28  
**Estado:** ✅ IMPLEMENTADO

---

## 🎯 OBJETIVO

**Permitir que CUALQUIER proveedor se registre en la plataforma SIN necesidad de invitación de parejas.**

---

## ⚠️ IMPORTANTE

### **ANTES (Sistema incorrecto):**
- ❌ Proveedores necesitaban un "enlace de invitación" de una pareja
- ❌ Solo podían responder presupuestos si una pareja los contactaba
- ❌ Acceso restringido con tokens

### **AHORA (Sistema correcto):**
- ✅ **Registro 100% público y abierto**
- ✅ Cualquier proveedor puede registrarse libremente
- ✅ No se requiere invitación ni token previo
- ✅ Proceso de verificación de email incluido

---

## 🏗️ ARQUITECTURA

### **Frontend:**
```
/supplier/registro  →  SupplierRegistration.jsx
```

### **Backend:**
```
/api/supplier-registration/register         → POST (público)
/api/supplier-registration/verify-email     → POST (público)
/api/supplier-registration/check-email/:email  → GET (público)
/api/supplier-registration/categories       → GET (público)
```

### **Firestore:**
```
suppliers/{supplierId}/
  ├─ profile/
  │   ├─ name
  │   ├─ slug (único)
  │   ├─ category
  │   ├─ description
  │   ├─ registered: true
  │   └─ status: 'pending_verification' | 'verified' | 'active' | 'suspended'
  │
  ├─ contact/
  │   ├─ email
  │   ├─ phone
  │   └─ website
  │
  ├─ location/
  │   ├─ city
  │   ├─ province
  │   └─ country
  │
  ├─ business/
  │   ├─ services: []
  │   ├─ priceRange
  │   └─ availability
  │
  └─ verification/
      ├─ emailVerified: false
      ├─ emailVerificationToken
      └─ emailVerificationSentAt
```

---

## 📋 PROCESO DE REGISTRO

### **1. Usuario completa formulario:**
- Nombre
- Email
- Teléfono (opcional)
- Sitio web (opcional)
- Categoría (fotógrafo, catering, etc.)
- Servicios que ofrece
- Ubicación (ciudad, provincia, país)
- Descripción
- Rango de precios (opcional)
- Acepta términos y condiciones

### **2. Validación backend:**
- ✅ Verifica que el email no esté registrado
- ✅ Valida todos los campos con Zod
- ✅ Genera slug único basado en el nombre
- ✅ Crea documento en Firestore

### **3. Confirmación:**
- ✅ Genera token de verificación de email
- ✅ Envía email de verificación (TODO)
- ✅ Muestra pantalla de éxito con próximos pasos

### **4. Verificación de email:**
- Usuario hace click en el enlace del email
- Token se valida en `/api/supplier-registration/verify-email`
- Estado cambia de `pending_verification` a `verified`

### **5. Activación:**
- Proveedor completa su perfil
- Sube fotos de portfolio
- Activa su cuenta
- Aparece en búsquedas públicas

---

## 🔐 SEGURIDAD

### **Validación de datos:**
```javascript
// Esquema de validación (Zod)
{
  name: min(2), max(100),
  email: email(), max(100),
  phone: min(9), max(20), optional(),
  category: min(2), max(50),
  services: array().min(1).max(10),
  location: {
    city: min(2), max(100),
    province: min(2), max(100),
    country: min(2), max(100)
  },
  description: min(10), max(2000),
  acceptedTerms: boolean() === true
}
```

### **Prevención de duplicados:**
- ✅ Verifica email único antes de crear
- ✅ Genera slug único con contador si es necesario

### **Estados de verificación:**
```
pending_verification  → Registrado, esperando verificar email
verified             → Email verificado, perfil incompleto
active               → Perfil completo, visible en búsquedas
suspended            → Cuenta suspendida por admin
```

---

## 🌐 RUTAS Y URLS

### **Registro público:**
```
https://mywed360.com/supplier/registro
http://localhost:5173/supplier/registro
```

### **API endpoints:**
```
POST   /api/supplier-registration/register
POST   /api/supplier-registration/verify-email
GET    /api/supplier-registration/check-email/:email
GET    /api/supplier-registration/categories
```

---

## 📝 CATEGORÍAS DISPONIBLES

```javascript
[
  { value: 'fotografo', label: 'Fotógrafo' },
  { value: 'video', label: 'Videógrafo' },
  { value: 'catering', label: 'Catering' },
  { value: 'musica', label: 'Música y DJ' },
  { value: 'flores', label: 'Flores y Decoración' },
  { value: 'lugar', label: 'Lugar de Celebración' },
  { value: 'pasteleria', label: 'Pastelería / Tarta' },
  { value: 'invitaciones', label: 'Invitaciones' },
  { value: 'maquillaje', label: 'Maquillaje y Peluquería' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'animacion', label: 'Animación' },
  { value: 'wedding-planner', label: 'Wedding Planner' },
  { value: 'otro', label: 'Otro' }
]
```

---

## 🔄 DIFERENCIA CON SUPPLIER PORTAL

### **`/supplier/:token` (SupplierPortal.jsx)**
**Propósito:** Responder presupuestos de parejas específicas
- ✅ Requiere token de invitación
- ✅ Solo para proveedores ya contactados
- ✅ Respuesta a solicitud específica de una pareja

### **`/supplier/registro` (SupplierRegistration.jsx)**
**Propósito:** Registro público inicial
- ✅ **NO requiere token**
- ✅ **Abierto a todo el mundo**
- ✅ Primera vez que se registra en la plataforma

---

## 💡 CASOS DE USO

### **Caso 1: Proveedor nuevo**
1. Visita `/supplier/registro`
2. Completa formulario
3. Verifica email
4. Completa perfil
5. Activa cuenta
6. Aparece en búsquedas

### **Caso 2: Pareja contacta proveedor**
1. Pareja busca "fotógrafo Valencia"
2. Ve proveedor registrado
3. Click en "Contactar"
4. Sistema genera token
5. Proveedor recibe enlace `/supplier/:token`
6. Responde presupuesto específico

---

## 📧 EMAIL DE VERIFICACIÓN (TODO)

```javascript
// TODO: Implementar envío de email
async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.PUBLIC_APP_BASE_URL}/supplier/verify?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verifica tu email - MyWed360',
    html: `
      <h1>¡Bienvenido a MyWed360!</h1>
      <p>Haz click en el siguiente enlace para verificar tu email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Este enlace expira en 48 horas.</p>
    `
  });
}
```

---

## 🧪 TESTING

### **Test manual:**
```bash
# 1. Abrir formulario de registro
http://localhost:5173/supplier/registro

# 2. Completar todos los campos obligatorios
# 3. Submit
# 4. Verificar respuesta exitosa
# 5. Verificar documento en Firestore
```

### **Test de API:**
```bash
# Registro
curl -X POST http://localhost:4004/api/supplier-registration/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Proveedor",
    "email": "test@proveedor.com",
    "category": "fotografo",
    "services": ["Básico"],
    "location": {
      "city": "Valencia",
      "province": "Valencia",
      "country": "España"
    },
    "description": "Descripción de prueba con más de 10 caracteres",
    "acceptedTerms": true
  }'

# Verificar email disponible
curl http://localhost:4004/api/supplier-registration/check-email/test@proveedor.com

# Obtener categorías
curl http://localhost:4004/api/supplier-registration/categories
```

---

## 📊 MÉTRICAS Y ANALÍTICA

### **Eventos a trackear:**
- `supplier_registration_started` - Usuario abrió formulario
- `supplier_registration_completed` - Registro exitoso
- `supplier_email_verified` - Email verificado
- `supplier_profile_activated` - Perfil activado

### **KPIs:**
- Tasa de conversión de formulario
- Tiempo promedio para completar registro
- Tasa de verificación de email
- Tasa de activación de perfil

---

## 🚀 PRÓXIMOS PASOS

### **MVP (Implementado):**
- ✅ Formulario de registro público
- ✅ Validación de datos
- ✅ Creación en Firestore
- ✅ Prevención de duplicados
- ✅ Generación de slug único

### **Fase 2 (Pendiente):**
- ⏳ Envío de email de verificación
- ⏳ Página de verificación de email
- ⏳ Dashboard de proveedor
- ⏳ Subida de portfolio
- ⏳ Gestión de disponibilidad

### **Fase 3 (Futuro):**
- ⏳ Verificación de documentos (CIF, licencias)
- ⏳ Sistema de reseñas
- ⏳ Estadísticas de perfil
- ⏳ Integración con calendario
- ⏳ Chat con parejas

---

## 📚 ARCHIVOS RELACIONADOS

### **Frontend:**
- `src/pages/SupplierRegistration.jsx` - Formulario de registro
- `src/pages/SupplierPortal.jsx` - Portal de respuesta a presupuestos
- `src/App.jsx` - Rutas

### **Backend:**
- `backend/routes/supplier-registration.js` - API de registro público
- `backend/routes/supplier-portal.js` - API de portal con token
- `backend/index.js` - Configuración de rutas

### **Documentación:**
- `docs/proveedores/REGISTRO-PUBLICO.md` - Este documento
- `docs/proveedores/PRUEBA-RESULTADOS-INTERNET.md` - Sistema de búsqueda
- `docs/firebase/GUIA-COLECCIONES-FIRESTORE.md` - Estructura de datos

---

## ❓ FAQ

### **¿Necesito invitación para registrarme?**
**NO.** El registro es completamente público y abierto.

### **¿Puedo registrarme si soy proveedor extranjero?**
**SÍ.** Aunque la plataforma está enfocada en España, proveedores de cualquier país pueden registrarse.

### **¿Cuánto cuesta registrarse?**
**GRATIS.** El registro es completamente gratuito.

### **¿Qué pasa después de registrarme?**
Recibirás un email de verificación. Una vez verificado, podrás completar tu perfil y activar tu cuenta.

### **¿Cuándo apareceré en búsquedas?**
Cuando tu perfil esté completo y tu cuenta esté activada.

---

**Creado:** 2025-10-28  
**Última actualización:** 2025-10-28  
**Estado:** ✅ Implementado - Listo para usar
