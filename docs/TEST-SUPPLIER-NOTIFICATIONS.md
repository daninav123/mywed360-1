# 🧪 Guía de Testing - Sistema de Notificaciones para Proveedores

**Objetivo**: Probar el sistema completo de notificaciones por email

---

## ✅ PRE-REQUISITOS

1. **Backend corriendo**: `cd backend && npm run dev`
2. **Mailgun configurado**: ✅ Ya está en tu `.env`
3. **Proveedor de prueba**: Vamos a crear uno

---

## 🚀 PASO 1: Crear Proveedor de Prueba

### Opción A: Desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Abre Firestore Database
3. Crea un nuevo documento en la colección `suppliers`:

```javascript
// suppliers/test_supplier_flores
{
  id: "test_supplier_flores",
  name: "Flores y Sueños Test",
  email: "TU_EMAIL_REAL@gmail.com",  // ⚠️ USA TU EMAIL PARA VER EL RESULTADO
  category: "flowers",
  businessName: "Flores y Sueños",
  description: "Proveedor de flores para bodas",
  location: {
    city: "Madrid",
    province: "Madrid",
    country: "España"
  },
  contact: {
    email: "TU_EMAIL_REAL@gmail.com",
    phone: "+34612345678"
  },
  verified: true,
  createdAt: <Timestamp>
}
```

### Opción B: Con curl (si tienes endpoint de creación)

```bash
curl -X POST http://localhost:4004/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flores Test",
    "email": "tu_email@gmail.com",
    "category": "flowers"
  }'
```

---

## 🧪 PASO 2: Probar Envío de Solicitud

### Opción A: Con curl

```bash
curl -X POST http://localhost:4004/api/suppliers/test_supplier_flores/request-quote \
  -H "Content-Type: application/json" \
  -d '{
    "coupleName": "Ana y Luis TEST",
    "contactEmail": "ana.test@example.com",
    "contactPhone": "+34612345678",
    "weddingDate": "2026-07-15",
    "location": "Madrid",
    "guestCount": 120,
    "budget": "2000-3000€",
    "services": ["flowers", "decoration"],
    "message": "Hola, estamos buscando flores para nuestra boda. Nos gustaría un estilo rústico con rosas y peonías. ¿Podrían enviarnos un presupuesto?",
    "preferredContactMethod": "email",
    "urgency": "normal"
  }'
```

### Opción B: Desde el frontend (con el modal)

1. Navega a: `http://localhost:5173/suppliers/test_supplier_flores` (o donde esté el perfil)
2. Click en "Solicitar Presupuesto"
3. Llena el formulario
4. Envía

---

## ✅ PASO 3: Verificar Resultados

### 1. Verificar en la consola del backend

Deberías ver logs como:

```
[SupplierNotificationService] Creando solicitud: { supplierId: 'test_supplier_flores', client: 'Ana y Luis TEST' }
[SupplierNotificationService] Solicitud guardada: req_abc123...
[SupplierNotificationService] Enviando email a: tu_email@gmail.com
[Email] Enviado exitosamente: <message-id@mailgun.net>
[SupplierNotificationService] Email enviado correctamente
```

### 2. Verificar en Firestore

Ve a Firestore Console:

```
suppliers/test_supplier_flores/requests/req_abc123
{
  coupleName: "Ana y Luis TEST",
  status: "new",
  receivedAt: Timestamp,
  ...
}
```

### 3. Verificar en tu Email

Revisa tu inbox (el email del proveedor). Deberías recibir un email con:

- ✅ Subject: "🎉 Nueva solicitud de Ana y Luis TEST"
- ✅ Header con gradiente morado
- ✅ Info completa de la pareja
- ✅ Botón "Responder por Email"
- ✅ Mensaje completo

**Tiempo esperado**: ~5-10 segundos

### 4. Verificar en Mailgun Dashboard

Si quieres ver métricas:

1. Ve a [Mailgun Dashboard](https://app.mailgun.com/)
2. Logs → Envíos recientes
3. Deberías ver el email enviado

---

## 🐛 TROUBLESHOOTING

### Error: "Proveedor no encontrado"

**Causa**: El ID del proveedor no existe en Firestore  
**Solución**: Verifica que creaste el documento en `suppliers/{id}` correctamente

### Error: "Cannot find module 'nodemailer'"

**Causa**: Dependencias no instaladas  
**Solución**:

```bash
cd backend
npm install nodemailer nodemailer-mailgun-transport
```

### No llega el email

**Causa**: Posibles razones:

1. Mailgun API Key incorrecta
2. Dominio no verificado en Mailgun
3. Email en sandbox mode

**Solución**:

1. Verifica `.env`:

```bash
MAILGUN_API_KEY=your_key_here
MAILGUN_DOMAIN=malove.app
EMAIL_PROVIDER=mailgun
```

2. Verifica en Mailgun que `malove.app` está verificado

3. Si estás en sandbox, añade el email receptor a "Authorized Recipients" en Mailgun

### Email va a spam

**Causa**: Dominio no tiene SPF/DKIM configurado  
**Solución**: En Mailgun Dashboard → Sending → Domains → malove.app → DNS Records

---

## 📊 TESTS ADICIONALES

### Test 1: Email sin datos opcionales

```bash
curl -X POST http://localhost:4004/api/suppliers/test_supplier_flores/request-quote \
  -H "Content-Type: application/json" \
  -d '{
    "coupleName": "María y Pedro",
    "contactEmail": "maria@example.com",
    "message": "Hola, nos gustaría información",
    "weddingDate": "2026-08-20"
  }'
```

### Test 2: Listar solicitudes del proveedor

```bash
curl http://localhost:4004/api/supplier-requests/test_supplier_flores
```

### Test 3: Actualizar estado de solicitud

```bash
curl -X PATCH http://localhost:4004/api/supplier-requests/test_supplier_flores/req_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "viewed"
  }'
```

### Test 4: Marcar como respondida

```bash
curl -X PATCH http://localhost:4004/api/supplier-requests/test_supplier_flores/req_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "responded",
    "response": "Hola Ana y Luis, gracias por contactarnos. Les envío presupuesto por email."
  }'
```

---

## 🎨 PREVIEW DEL EMAIL

El email que recibirá el proveedor se verá así:

```
┌─────────────────────────────────────────┐
│  🎉 Nueva Solicitud                     │  (Gradiente morado)
│  Una pareja está interesada...         │
├─────────────────────────────────────────┤
│                                         │
│  [BOX AZUL]                            │
│  👰🤵 Información de la Pareja          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Nombres:    Ana y Luis TEST           │
│  Email:      ana.test@example.com      │
│  Teléfono:   +34612345678              │
│  Fecha:      15 julio 2026             │
│  Lugar:      Madrid                    │
│  Invitados:  120                       │
│  Presupuesto: 2000-3000€               │
│                                         │
│  [BOX BLANCO]                          │
│  💬 Mensaje de la pareja:              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Hola, estamos buscando flores...     │
│                                         │
│  [BOTÓN GRANDE MORADO]                 │
│  📧 Responder por Email                │
│                                         │
│  [BOX GRIS]                            │
│  💡 También puedes gestionar esta      │
│     solicitud en tu panel:             │
│     Ver en Dashboard →                 │
│                                         │
│  [BOX AMARILLO]                        │
│  💡 Consejo: Las parejas valoran      │
│     las respuestas rápidas...         │
│                                         │
├─────────────────────────────────────────┤
│  Configuración | Dashboard | API       │
│  © 2025 MaLove.App                     │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE PRUEBA

- [ ] Backend corriendo sin errores
- [ ] Proveedor de prueba creado en Firestore
- [ ] Email del proveedor es tu email real
- [ ] Solicitud enviada con curl (status 200)
- [ ] Logs en backend muestran "Email enviado exitosamente"
- [ ] Solicitud guardada en Firestore
- [ ] Email recibido en inbox
- [ ] Email tiene diseño correcto
- [ ] Botón "Responder por Email" funciona
- [ ] Solicitud listada con GET
- [ ] Estado actualizado con PATCH

---

## 🎯 RESULTADO ESPERADO

Si todo funciona correctamente:

1. ✅ **Backend**: Logs sin errores
2. ✅ **Firestore**: Solicitud guardada con `status: "new"`
3. ✅ **Email proveedor**: Recibe email profesional en <10s
4. ✅ **Email cliente**: Recibe confirmación
5. ✅ **Mailgun**: Email aparece en logs como "delivered"

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa logs del backend
2. Verifica variables en `.env`
3. Comprueba Mailgun Dashboard
4. Verifica Firestore

**El sistema está listo para probar!** 🚀
