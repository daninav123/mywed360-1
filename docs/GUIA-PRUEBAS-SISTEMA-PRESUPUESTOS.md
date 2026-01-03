# 🧪 GUÍA DE PRUEBAS - SISTEMA DE PRESUPUESTOS

## ✅ VERIFICACIÓN RÁPIDA (5 minutos)

### **1. Verificar Archivos Creados**

```bash
# Backend
✓ backend/templates/emails/supplier-quote-request.html
✓ backend/services/quoteRequestEmailService.js
✓ backend/routes/supplier-quote-requests.js (modificado)

# Frontend
✓ src/components/suppliers/QuoteSelectionConfirmModal.jsx
✓ src/components/suppliers/QuoteComparator.jsx (modificado)
✓ src/components/wedding/WeddingServiceCard.jsx (modificado)
```

### **2. Verificar Variables de Entorno**

En `.env`:

```
MAILGUN_API_KEY=key-... ✓
MAILGUN_DOMAIN=mg.MaLove.App.com ✓
FRONTEND_URL=http://localhost:5173 ✓
```

### **3. Probar Flujo Completo**

#### **PASO 1: Solicitar Presupuesto (2 min)**

1. Ve a `/proveedores`
2. Busca un fotógrafo
3. Click `[💰 Solicitar Presupuesto]`
4. Completa formulario
5. Click `[Enviar]`

**Verificar:**

- ✓ Toast de confirmación
- ✓ En logs backend: `📧 Email enviado a...`
- ✓ En Mailgun dashboard: Email enviado

#### **PASO 2: Simular Respuesta (2 min)**

1. Ve a Firestore: `suppliers/{id}/quote-requests/{id}`
2. Copia el `responseToken`
3. Ve a `/responder-presupuesto/{token}`
4. Completa presupuesto:
   - Precio: 2320€
   - Servicios incluidos
   - Condiciones
5. Click `[Enviar]`

**Verificar:**

- ✓ Success message
- ✓ En logs: `📧 Notificación enviada a...`
- ✓ Quote guardado en `quotes[]`

#### **PASO 3: Comparar (30 seg)**

1. Ve a tracker de solicitudes
2. Badge muestra "2 presupuestos"
3. Click `[📊 Comparar]`

**Verificar:**

- ✓ Comparador se abre
- ✓ Scoring automático funciona
- ✓ Ve precio, servicios, términos

#### **PASO 4: Seleccionar (10 seg)**

1. Click `[Seleccionar]` en mejor
2. Click `[✅ Continuar]`
3. Modal de confirmación
4. Click `[Confirmar]`

**Verificar:**

- ✓ Toast: "Contratado ✓"
- ✓ Comparador cierra
- ✓ Guardado en Firestore

#### **PASO 5: Ver Transformación**

1. Ve a `/proveedores`
2. Mira tarjeta de Fotografía

**Verificar:**

- ✓ Muestra proveedor contratado
- ✓ Precio visible: 2.320€
- ✓ Adelanto: 30%
- ✓ Botones WhatsApp/Email activos

---

## 🔍 VERIFICACIÓN BACKEND

### **Logs a buscar:**

```bash
# Solicitud creada
✅ Nueva solicitud presupuesto V2: {id}

# Email enviado
📧 Email enviado a proveedor@email.com

# Respuesta guardada
✅ Quote response saved

# Notificación enviada
📧 Notificación enviada a usuario@email.com
```

### **Mailgun Dashboard:**

```
https://app.mailgun.com/app/dashboard

Verificar:
- Emails enviados hoy
- Delivery rate >95%
- No bounces
```

---

## 📊 CHECKLIST COMPLETO

**Sistema:**

- [ ] Template HTML existe
- [ ] Servicio de email funciona
- [ ] Variables env configuradas
- [ ] Handlebars instalado

**Flujo Usuario:**

- [ ] Puede solicitar presupuesto
- [ ] Email se envía al proveedor
- [ ] Proveedor puede responder
- [ ] Notificación llega al usuario
- [ ] Puede comparar presupuestos
- [ ] Puede seleccionar mejor
- [ ] Tarjeta se transforma

**Firestore:**

- [ ] Solicitud guardada en suppliers/{id}/quote-requests
- [ ] responseToken generado
- [ ] Quote guardado en quotes[]
- [ ] assignedSupplier en wedding/services

---

## ⚡ PRUEBA RÁPIDA (Sin email real)

Si no quieres enviar emails reales, verifica solo la estructura:

```javascript
// En backend/routes/supplier-quote-requests.js
// Las funciones ya tienen try/catch
// Los emails no fallan el request principal

// Verificar que los datos se preparan correctamente:
console.log('Email data:', emailData); // Antes del envío
```

---

## 🎯 RESULTADO ESPERADO

✅ Todo funciona end-to-end
✅ Emails se envían automáticamente
✅ Notificaciones instantáneas
✅ Transformación automática
✅ 100% funcional

---

**Tiempo total de prueba: 6 minutos**
