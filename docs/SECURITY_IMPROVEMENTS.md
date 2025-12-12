# 🔒 Mejoras de Seguridad - MaLoveApp

**Fecha:** 12 de Diciembre de 2025  
**Versión:** 1.0  
**Estado:** Plan de implementación

---

## 📋 Implementaciones Pendientes de Seguridad

### 1. Verificación de Firma Apple Pay (CRÍTICO)

**Ubicación:** `backend/services/applePaymentService.js:125`

**Problema Actual:**
```javascript
// ⚠️ SIMPLIFICADO - Sin verificación real
console.log('⚠️ ADVERTENCIA: Verificación de firma Apple simplificada');
// En producción, deberías verificar la firma con las claves públicas de Apple
```

**Solución Recomendada:**
```javascript
import jwt from 'jsonwebtoken';
import axios from 'axios';

const APPLE_ROOT_CERT_URL = 'https://www.apple.com/appleca/AppleRootCA-G3.cer';
const APPLE_INTERMEDIATE_CERT_URL = 'https://www.apple.com/certificateauthority/AppleWWDRCAG6.cer';

export async function verifyAppleNotificationSignature(signedPayload) {
  try {
    // 1. Decodificar JWT sin verificar primero
    const decoded = jwt.decode(signedPayload, { complete: true });
    if (!decoded) throw new Error('Invalid JWT format');

    // 2. Obtener certificados de Apple
    const rootCert = await fetchAppleCertificate(APPLE_ROOT_CERT_URL);
    const intermediateCert = await fetchAppleCertificate(APPLE_INTERMEDIATE_CERT_URL);

    // 3. Construir cadena de certificados
    const certificateChain = [
      decoded.header.x5c[0], // Certificado del servidor
      intermediateCert,
      rootCert,
    ];

    // 4. Verificar cadena de certificados
    await verifyCertificateChain(certificateChain);

    // 5. Verificar firma JWT
    const publicKey = extractPublicKeyFromCertificate(decoded.header.x5c[0]);
    const verified = jwt.verify(signedPayload, publicKey, {
      algorithms: ['ES256'],
    });

    return verified;
  } catch (error) {
    logger.error('❌ Error verificando notificación Apple:', error);
    throw new Error('Invalid Apple notification signature');
  }
}

async function fetchAppleCertificate(url) {
  const response = await axios.get(url);
  return response.data;
}

function verifyCertificateChain(chain) {
  // Implementar verificación de cadena de certificados
  // Usar librería como 'pkijs' o 'asn1js'
}

function extractPublicKeyFromCertificate(cert) {
  // Extraer clave pública del certificado
}
```

**Tareas:**
- [ ] Instalar dependencias: `npm install pkijs asn1js`
- [ ] Implementar verificación de certificados
- [ ] Crear tests unitarios
- [ ] Documentar proceso

---

### 2. Middleware de Autenticación de Proveedores (CRÍTICO)

**Ubicación:** `backend/routes/supplier-quote-requests.js:237`

**Problema Actual:**
```javascript
// TODO: Implementar middleware de auth
const supplierId = req.headers['x-supplier-id'];
if (!supplierId || supplierId !== id) {
  return res.status(403).json({ error: 'forbidden' });
}
```

**Solución Recomendada:**
```javascript
// middleware/supplierAuth.js
import jwt from 'jsonwebtoken';
import { db } from '../firebase-admin.js';

export async function requireSupplierAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'missing_token' });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { supplierId } = decoded;

    // Verificar que el proveedor existe y está activo
    const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      return res.status(403).json({ error: 'supplier_not_found' });
    }

    const supplier = supplierDoc.data();
    if (supplier.status !== 'active') {
      return res.status(403).json({ error: 'supplier_inactive' });
    }

    // Adjuntar información del proveedor al request
    req.supplier = {
      id: supplierId,
      ...supplier,
    };

    next();
  } catch (error) {
    logger.error('Auth error:', error);
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// Usar en rutas
router.get('/:id/quote-requests', requireSupplierAuth, async (req, res) => {
  // El middleware ya verificó que req.supplier es válido
  const { id } = req.params;
  
  // Verificar que el proveedor accede solo sus propios datos
  if (req.supplier.id !== id) {
    return res.status(403).json({ error: 'forbidden' });
  }

  // ... resto de la lógica
});
```

**Tareas:**
- [ ] Crear middleware `middleware/supplierAuth.js`
- [ ] Aplicar a todas las rutas de proveedores
- [ ] Crear tests de autenticación
- [ ] Documentar en API docs

---

### 3. Validación de Tokens en Endpoints Sensibles

**Ubicación:** `backend/routes/supplier-requests.js:292`

**Problema Actual:**
```javascript
// TODO: Verificar autenticación del proveedor con middleware
```

**Solución:**
```javascript
// Aplicar middleware a todas las rutas sensibles
router.get('/:supplierId', requireSupplierAuth, async (req, res) => {
  // Verificar que el proveedor accede solo sus propios datos
  if (req.supplier.id !== req.params.supplierId) {
    return res.status(403).json({ error: 'forbidden' });
  }
  // ... lógica
});

router.patch('/:supplierId/:requestId', requireSupplierAuth, async (req, res) => {
  // Verificar que el proveedor accede solo sus propios datos
  if (req.supplier.id !== req.params.supplierId) {
    return res.status(403).json({ error: 'forbidden' });
  }
  // ... lógica
});
```

---

### 4. Auditoría de Permisos y Roles

**Ubicación:** Múltiples archivos

**Problema:** Falta verificación consistente de permisos

**Solución:**
```javascript
// middleware/roleAuth.js
export const ROLES = {
  OWNER: 'owner',
  PLANNER: 'planner',
  ASSISTANT: 'assistant',
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
};

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'insufficient_permissions',
        required: allowedRoles,
        current: userRole,
      });
    }
    
    next();
  };
}

// Uso
router.delete('/admin/users/:userId', 
  requireAuth, 
  requireRole(ROLES.ADMIN), 
  async (req, res) => {
    // Solo admins pueden acceder
  }
);
```

---

## 🔐 Checklist de Seguridad

### Autenticación
- [ ] JWT tokens con expiración
- [ ] Refresh tokens implementados
- [ ] Logout borra tokens
- [ ] Password hashing con bcrypt
- [ ] Rate limiting en login

### Autorización
- [ ] Middleware de roles
- [ ] Verificación de permisos en cada endpoint
- [ ] Validación de ownership de recursos
- [ ] Auditoría de accesos

### Datos Sensibles
- [ ] API keys en variables de entorno
- [ ] Contraseñas hasheadas
- [ ] PII encriptado en tránsito (HTTPS)
- [ ] Logs sin datos sensibles
- [ ] GDPR compliance

### Validación
- [ ] Input validation en todos los endpoints
- [ ] Output encoding
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention (Firestore)

### Infraestructura
- [ ] HTTPS en producción
- [ ] CORS configurado correctamente
- [ ] Helmet.js para headers de seguridad
- [ ] Rate limiting global
- [ ] DDoS protection

---

## 📊 Matriz de Riesgos

| Riesgo | Severidad | Probabilidad | Mitigación |
|--------|-----------|--------------|-----------|
| API Keys expiradas | 🔴 Alta | 🔴 Alta | Rotación automática |
| Firma Apple no verificada | 🔴 Alta | 🟡 Media | Implementar verificación |
| Auth de proveedores débil | 🔴 Alta | 🟡 Media | Middleware robusto |
| Acceso no autorizado | 🔴 Alta | 🟡 Media | Verificación de permisos |
| Inyección de datos | 🟠 Media | 🟡 Media | Validación de input |
| XSS en frontend | 🟠 Media | 🟡 Media | DOMPurify + CSP |

---

## 🚀 Plan de Implementación

### Fase 1 (Semana 1) - CRÍTICO
- [ ] Renovar API keys
- [ ] Implementar verificación Apple
- [ ] Crear middleware de auth de proveedores

### Fase 2 (Semana 2) - ALTO
- [ ] Aplicar middleware a todas las rutas
- [ ] Auditoría de permisos
- [ ] Tests de seguridad

### Fase 3 (Semana 3) - MEDIO
- [ ] Implementar rotación automática de keys
- [ ] Crear dashboard de auditoría
- [ ] Documentar políticas de seguridad

---

## 📝 Documentos Relacionados

- `docs/API_KEYS_MANAGEMENT.md` - Gestión de API keys
- `docs/SECURITY_PRIVACY.md` - Políticas de seguridad
- `backend/middleware/` - Middlewares de seguridad
- `backend/routes/` - Rutas protegidas

---

**Generado:** 2025-12-12 18:25 UTC+01:00  
**Rama:** dev-improvements-dec-2025  
**Estado:** Plan de implementación activo
