# 🚀 Sprint 1: Sistema de Notificaciones por Email

**Duración**: 1-2 semanas  
**Objetivo**: Toda solicitud llega al proveedor por email automáticamente

---

## 📋 TAREAS

### 1. Schema de Base de Datos

```javascript
// Firestore: supplier_requests
{
  (supplierId, client, wedding, message, status, emailSent, createdAt);
}
```

### 2. Backend Service

- `backend/services/SupplierNotificationService.js`
- Envío de emails con Nodemailer
- Template HTML responsive

### 3. API Endpoint

- `POST /api/supplier-requests` - Crear solicitud
- `GET /api/supplier-requests/:supplierId` - Listar
- `PATCH /api/supplier-requests/:id` - Actualizar

### 4. Frontend Modal

- `ContactSupplierModal.jsx`
- Formulario con datos precargados
- Confirmación de envío

### 5. Testing

- Test unitario de emails
- Test E2E de flujo completo

---

## 🎯 IMPLEMENTAR AHORA

¿Empezamos con el **SupplierNotificationService.js**?
