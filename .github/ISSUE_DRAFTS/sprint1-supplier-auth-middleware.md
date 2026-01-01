---
title: '[Security] Implementar middleware de autenticación de proveedores'
labels: [security, backend, high-priority]
---

## Descripción

Implementar middleware `requireSupplierAuth` para proteger endpoints de proveedores que actualmente no tienen autenticación adecuada.

## Contexto

Múltiples endpoints en rutas de proveedores tienen TODOs críticos para implementar autenticación. Actualmente están leyendo `x-supplier-id` de headers sin validación, lo que representa un riesgo de seguridad.

**Referencias:**
- docs/TAREAS_PENDIENTES_CONSOLIDADO.md:119-141
- docs/TODO.md (Seguridad API)

## Alcance

### 1. Crear Middleware de Autenticación

**Archivo:** `backend/middleware/supplierAuth.js`

```javascript
/**
 * Middleware para autenticar proveedores
 * Valida token/sesión y carga datos del proveedor
 */
export const requireSupplierAuth = async (req, res, next) => {
  try {
    // 1. Obtener token de autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    const supplierId = req.headers['x-supplier-id'];
    
    if (!token || !supplierId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        code: 'SUPPLIER_AUTH_MISSING'
      });
    }
    
    // 2. Validar token (Firebase Auth o JWT)
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 3. Verificar que el usuario es el proveedor correcto
    if (decodedToken.uid !== supplierId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Supplier ID mismatch',
        code: 'SUPPLIER_ID_MISMATCH'
      });
    }
    
    // 4. Cargar datos del proveedor desde Firestore
    const supplierDoc = await admin.firestore()
      .collection('suppliers')
      .doc(supplierId)
      .get();
    
    if (!supplierDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND'
      });
    }
    
    // 5. Adjuntar datos al request
    req.supplier = {
      id: supplierId,
      ...supplierDoc.data()
    };
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('[supplierAuth] Error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }
};
```

### 2. Aplicar Middleware en Rutas

#### **supplier-quote-requests.js**
- **Línea 310:** `POST /quote-requests/:id/accept`
  ```javascript
  // TODO: Implementar middleware de auth
  // const supplierId = req.headers['x-supplier-id'];
  router.post('/:id/accept', requireSupplierAuth, async (req, res) => {
    const supplierId = req.supplier.id; // Ya validado por middleware
    // ...
  });
  ```

#### **supplier-requests.js**
- **Línea 293:** `GET /api/supplier-requests`
  ```javascript
  // TODO: Verificar autenticación del proveedor con middleware
  router.get('/', requireSupplierAuth, async (req, res) => {
    const supplierId = req.supplier.id;
    // ...
  });
  ```

- **Línea 353:** `PUT /api/supplier-requests/:id/respond`
  ```javascript
  // TODO: Verificar autenticación del proveedor
  router.put('/:id/respond', requireSupplierAuth, async (req, res) => {
    // ...
  });
  ```

#### **supplier-messages.js**
- **Línea 153:** `POST /api/supplier-messages`
  ```javascript
  // TODO: Enviar notificación push al cliente
  router.post('/', requireSupplierAuth, async (req, res) => {
    const supplierId = req.supplier.id;
    // ... enviar mensaje
    // Agregar: await notifyClient(clientId, message);
  });
  ```

#### **supplier-payments.js**
- **Línea 205:** `POST /api/supplier-payments/:id/invoice`
  ```javascript
  // TODO: Enviar email con PDF de la factura
  router.post('/:id/invoice', requireSupplierAuth, async (req, res) => {
    // ... generar factura
    // Agregar: await sendInvoiceEmail(invoice);
  });
  ```

#### **supplier-dashboard.js**
- **Línea 489:** Varios endpoints sin autenticación
  ```javascript
  // TODO: Enviar email a la pareja
  router.post('/contact-client', requireSupplierAuth, async (req, res) => {
    // ...
  });
  ```

### 3. Tests Unitarios

**Archivo:** `backend/__tests__/middleware/supplierAuth.test.js`

```javascript
describe('requireSupplierAuth middleware', () => {
  test('rechaza peticiones sin token', async () => {
    // ...
  });
  
  test('rechaza tokens inválidos', async () => {
    // ...
  });
  
  test('rechaza supplier ID que no coincide', async () => {
    // ...
  });
  
  test('carga datos del proveedor correctamente', async () => {
    // ...
  });
});
```

## Endpoints Afectados

Total: **8 endpoints** en 5 archivos

| Archivo | Endpoint | Línea | Método |
|---------|----------|-------|--------|
| supplier-quote-requests.js | `/quote-requests/:id/accept` | 310 | POST |
| supplier-requests.js | `/api/supplier-requests` | 293 | GET |
| supplier-requests.js | `/api/supplier-requests/:id/respond` | 353 | PUT |
| supplier-messages.js | `/api/supplier-messages` | 153 | POST |
| supplier-payments.js | `/api/supplier-payments/:id/invoice` | 205 | POST |
| supplier-dashboard.js | `/contact-client` | 489 | POST |
| supplier-dashboard.js | `/stats` | ~300 | GET |
| supplier-dashboard.js | `/portfolio/upload` | ~750 | POST |

## Impacto

### Seguridad
- ✅ Previene acceso no autorizado a datos de proveedores
- ✅ Valida identidad mediante Firebase Auth
- ✅ Evita suplantación de identidad (supplier ID mismatch)

### Performance
- ⚠️ Añade ~50-100ms por petición (validación token + query Firestore)
- Optimización: Cachear datos del proveedor en Redis (opcional)

## Tareas

- [ ] Crear `backend/middleware/supplierAuth.js`
- [ ] Aplicar middleware en 8 endpoints
- [ ] Actualizar tests E2E para incluir autenticación
- [ ] Documentar en `docs/api/openapi.yaml`
- [ ] Agregar ejemplos de uso en README
- [ ] Tests unitarios del middleware
- [ ] Tests de integración

## Dependencias

- Firebase Admin SDK (ya instalado)
- Ninguna dependencia nueva requerida

## Estimación

- **Implementación:** 2-3 horas
- **Tests:** 1-2 horas
- **Documentación:** 30 minutos

**Total:** ~4-6 horas de trabajo

## Prioridad

🔴 **ALTA** - Riesgo de seguridad actual en endpoints de proveedores

## Referencias

- TAREAS_DISPONIBLES_28DIC.md:119-141
- TAREAS_PENDIENTES_CONSOLIDADO.md:119-141
- backend/routes/supplier-*.js (múltiples archivos)
