# 🔒 Auditoría PII y GDPR - 28 Diciembre 2025

## ✅ Punto 4 Completado: Protección de Datos Personales en Logs

**Estado:** Sistema de sanitización implementado y aplicado en servicios críticos

---

## 🎯 Problema Identificado

### Exposición de PII (Personally Identifiable Information) en Logs

**Antes de la auditoría:**
- Emails completos en logs: `logger.info('Email enviado a user@example.com')`
- Nombres de usuarios visibles en consola
- Teléfonos sin sanitizar en logs de debug
- UserIDs completos expuestos
- Direcciones y datos sensibles en traces

**Riesgo:** Violación de GDPR, exposición de datos personales en logs de producción, trazas de debugging, y sistemas de monitoreo.

---

## 🛡️ Solución Implementada

### 1. Utilidad de Sanitización (`backend/utils/logSanitizer.js`)

**Características:**
- ✅ Sanitización automática de emails (muestra solo inicio + dominio)
- ✅ Sanitización de teléfonos (reemplaza con `***-***-****`)
- ✅ Sanitización de nombres (muestra solo iniciales)
- ✅ Sanitización de IDs de usuario (primeros 8 chars)
- ✅ Detección automática de campos sensibles en objetos
- ✅ Patrones regex para detectar PII en strings
- ✅ Protección contra loops infinitos (max depth 10)

**Campos Sensibles Detectados:**
```javascript
email, phone, phoneNumber, telephone, mobile, address, street,
postalCode, zipCode, dni, nif, passport, password, token, apiKey,
secret, creditCard, cardNumber, cvv, iban, accountNumber, ssn,
taxId, birthDate, dateOfBirth, lastName, surname, familyName,
ip, ipAddress, location, coordinates, lat, lng
```

**Ejemplo de Uso:**
```javascript
import { sanitizers } from '../utils/logSanitizer.js';

// Antes
logger.info(`Email enviado a user@example.com`);

// Después
logger.info(`Email enviado a ${sanitizers.email('user@example.com')}`);
// Output: "Email enviado a us***@example.com"
```

### 2. Archivos Modificados

#### `backend/services/mailgunService.js` ✅
```javascript
// Antes
logger.info(`[mailgunService] Enviando email a ${to}: ${subject}`);

// Después
logger.info(`[mailgunService] Enviando email a ${sanitizers.email(to)}: ${subject}`);
```

#### `backend/services/quoteRequestEmailService.js` ✅
```javascript
// Antes
logger.info(`💾 Email guardado en subcolección usuario ${userId} - bandeja: sent`);
logger.info(`✅ Notificación enviada a ${userEmail} - Mailgun ID: ${result.id}`);

// Después
logger.info(`💾 Email guardado en subcolección usuario ${sanitizers.userId(userId)} - bandeja: sent`);
logger.info(`✅ Notificación enviada a ${sanitizers.email(userEmail)} - Mailgun ID: ${result.id}`);
```

#### `backend/routes/supplier-requests.js` ✅
```javascript
// Antes
logger.info(`Email enviado a ${supplierEmail} para solicitud ${requestId}`);
logger.info(`Email de confirmación enviado a ${contactEmail}`);

// Después
logger.info(`Email enviado a ${sanitizers.email(supplierEmail)} para solicitud ${requestId}`);
logger.info(`Email de confirmación enviado a ${sanitizers.email(contactEmail)}`);
```

---

## 📊 Vulnerabilidades Encontradas

### 🔴 Críticas (Resueltas)

1. **Emails en texto plano en logs de producción**
   - **Archivos:** mailgunService.js, quoteRequestEmailService.js, supplier-requests.js
   - **Solución:** Sanitización con `sanitizers.email()`
   - **Estado:** ✅ Corregido

2. **UserIDs completos en logs**
   - **Archivos:** quoteRequestEmailService.js
   - **Solución:** Sanitización con `sanitizers.userId()`
   - **Estado:** ✅ Corregido

### 🟡 Medias (Identificadas para futura corrección)

3. **Nombres de usuarios en logs de debug**
   - **Archivos:** test-supplier-requests-debug.js, test-quote-request-flow.js
   - **Ubicación:** Scripts de testing (no producción)
   - **Recomendación:** Aplicar `sanitizers.name()` en scripts de prod

4. **Teléfonos en logs de debug**
   - **Archivos:** Varios scripts de testing
   - **Estado:** ⚠️ Solo en scripts de desarrollo

5. **Direcciones en logs de matching**
   - **Archivos:** utils/locationMatcher.js
   - **Estado:** ⚠️ Para revisar en próxima iteración

### 🟢 Bajas (Aceptables)

6. **Logs de console.log en scripts de testing**
   - **Archivos:** scripts/*.js (múltiples)
   - **Justificación:** Solo se ejecutan en desarrollo local
   - **Recomendación:** Añadir flag `NODE_ENV` check

---

## 🎯 Sanitizadores Disponibles

### `sanitizers.email(email)`
```javascript
sanitizers.email('john.doe@example.com')
// → 'jo***@example.com'
```

### `sanitizers.name(name)`
```javascript
sanitizers.name('John Doe')
// → 'J*** D***'
```

### `sanitizers.userId(id)`
```javascript
sanitizers.userId('a1b2c3d4e5f6g7h8i9j0')
// → 'a1b2c3d4***'
```

### `sanitizers.string(str)`
```javascript
sanitizers.string('Contact: user@example.com or +34 123 456 789')
// → 'Contact: us***@example.com or ***-***-****'
```

### `sanitizers.object(obj)`
```javascript
sanitizers.object({
  email: 'user@example.com',
  phone: '+34123456789',
  name: 'John Doe',
  publicData: 'visible'
})
// → {
//   email: 'us***@example.com',
//   phone: '***-***-****',
//   name: 'J*** D***',
//   publicData: 'visible'
// }
```

---

## 📝 Guía de Uso para Desarrolladores

### Cuándo Usar Sanitización

✅ **SIEMPRE sanitizar:**
- Emails de usuarios/proveedores
- Teléfonos
- Nombres completos
- Direcciones físicas
- IDs de usuarios (excepto en debugging específico)
- Cualquier dato personal que vaya a logs de producción

❌ **NO sanitizar:**
- IDs de documentos Firestore (si no contienen PII)
- Nombres de categorías/servicios
- Datos públicos (ratings, categorías)
- Timestamps
- Contadores

### Ejemplos de Implementación

#### En Servicios de Email
```javascript
import { sanitizers } from '../utils/logSanitizer.js';

async function sendWelcomeEmail(userEmail, userName) {
  logger.info(`Enviando email de bienvenida a ${sanitizers.email(userEmail)}`);
  // ... lógica de envío
  logger.info(`Email enviado exitosamente a ${sanitizers.email(userEmail)}`);
}
```

#### En Rutas de API
```javascript
import { sanitizers } from '../utils/logSanitizer.js';

router.post('/api/register', async (req, res) => {
  const { email, name, phone } = req.body;
  
  logger.info(`Nueva registro: ${sanitizers.email(email)}, ${sanitizers.name(name)}`);
  // ... lógica de registro
});
```

#### En Middleware de Autenticación
```javascript
import { sanitizers } from '../utils/logSanitizer.js';

export function authMiddleware(req, res, next) {
  const user = req.user;
  logger.info(`Usuario autenticado: ${sanitizers.userId(user.uid)}`);
  next();
}
```

---

## 🔍 Logs a Revisar Manualmente

### Scripts de Testing que Exponen PII
Los siguientes scripts tienen `console.log()` con datos sensibles pero solo se ejecutan en desarrollo:

1. `scripts/test-real-quote-request.js` - Muestra emails completos
2. `scripts/test-sent-mail.js` - Muestra myWed360Email
3. `scripts/updateMyEmail.js` - Muestra email de login
4. `scripts/test-mail-auth.js` - Muestra emails de usuario
5. `scripts/test-full-quote-request.js` - Muestra maLoveEmail
6. `scripts/debugInboxEmails.js` - Muestra emails y UIDs
7. `scripts/checkFirebaseAdmin.js` - Lista usuarios con emails
8. `scripts/check-user-permissions.js` - Muestra email de usuario

**Recomendación:** Añadir check de NODE_ENV:
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log(`Email: ${userData.email}`);
} else {
  console.log(`Email: ${sanitizers.email(userData.email)}`);
}
```

---

## 🚨 Áreas que Requieren Atención Futura

### 1. Rutas de Proveedor (Prioridad Media)
**Archivos:** `routes/supplier-*.js`

Múltiples logs con `req.supplier.id`:
```javascript
logger.info(`Supplier ${req.supplier.id} sent message`);
```

**Recomendación:** Evaluar si el supplier.id contiene PII. Si es solo un ID técnico, puede dejarse. Si es identificable, sanitizar.

### 2. Servicios de Notificación (Prioridad Media)
**Archivo:** `services/supplierNotifications.js`

Logs con IDs de proveedor:
```javascript
logger.info(`Notification sent to supplier ${supplier.id}: new quote request`);
```

**Recomendación:** Similar al punto 1.

### 3. Logs de Error con Stack Traces (Prioridad Alta)
**Global:** Múltiples archivos

Los `logger.error()` pueden incluir objetos completos con PII en stack traces.

**Recomendación:** Usar `sanitizers.object()` antes de loguear:
```javascript
catch (error) {
  logger.error('Error en operación:', sanitizers.object({ error, userData }));
}
```

---

## ✅ Cumplimiento GDPR

### Artículos Aplicables

**Art. 5 - Principios de tratamiento de datos:**
- ✅ Minimización de datos: Solo logueamos lo necesario
- ✅ Integridad y confidencialidad: Datos sanitizados en logs

**Art. 25 - Protección de datos desde el diseño:**
- ✅ Sistema de sanitización automática
- ✅ Herramientas para developers

**Art. 32 - Seguridad del tratamiento:**
- ✅ Medidas técnicas para proteger datos en logs
- ✅ Pseudonimización mediante sanitización

---

## 📈 Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)
- [ ] Aplicar sanitización en rutas de supplier (supplier-dashboard.js, etc.)
- [ ] Revisar logs de error para sanitizar objetos completos
- [ ] Añadir tests unitarios para logSanitizer.js

### Medio Plazo (1 mes)
- [ ] Crear wrapper global de logger con sanitización automática
- [ ] Auditar frontend para evitar console.log con PII
- [ ] Implementar log rotation y retención limitada (30 días)

### Largo Plazo (3 meses)
- [ ] Sistema de auditoría de logs (quién accedió a qué)
- [ ] Encriptación de logs en reposo
- [ ] Compliance automático con reportes mensuales

---

## 🎓 Buenas Prácticas Establecidas

1. **Siempre importar sanitizadores en servicios de email**
2. **Sanitizar emails antes de loguear**
3. **Sanitizar IDs de usuario en operaciones de usuarios**
4. **No loguear passwords ni tokens (usar `[REDACTED]`)**
5. **Revisar PRs para detectar logs con PII**

---

## 📚 Referencias

- **GDPR:** Reglamento (UE) 2016/679
- **Guía AEPD:** Tratamiento de datos en logs
- **OWASP:** Logging Cheat Sheet

---

**Fecha:** 28 Diciembre 2025  
**Auditor:** Sistema de Seguridad  
**Estado:** ✅ Implementación Fase 1 Completada  
**Próxima revisión:** 28 Enero 2026
