# Guía de Testing - Dashboard de Suscripciones

Instrucciones para probar el dashboard de suscripciones integrado.

---

## 📋 COMPONENTES IMPLEMENTADOS

### **1. SubscriptionDashboard** (`src/pages/SubscriptionDashboard.jsx`)

Dashboard completo que muestra:
- ✅ Información de la suscripción activa
- ✅ Estado (activa, en prueba, cancelada, etc.)
- ✅ Precio y período de facturación
- ✅ Próxima fecha de renovación
- ✅ Características incluidas en el plan
- ✅ Botón para abrir Stripe Customer Portal
- ✅ Alertas para suscripciones canceladas o en prueba
- ✅ Link para cambiar de plan
- ✅ Información de ayuda

### **2. SubscriptionWidget** (`src/components/subscription/SubscriptionWidget.jsx`)

Widget para dashboard principal:
- ✅ Resumen compacto de suscripción
- ✅ Precio y próxima renovación
- ✅ Estado visual con badges
- ✅ CTA para activar plan (si no tiene suscripción)
- ✅ Link a dashboard completo

---

## 🚀 CÓMO PROBAR

### **Setup Inicial**

1. **Asegúrate de tener el backend corriendo:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Asegúrate de tener el frontend corriendo:**
   ```bash
   npm run dev
   ```

3. **Verifica que tengas las variables de entorno:**
   ```bash
   # En .env
   VITE_API_URL=http://localhost:4004
   ```

---

### **Escenario 1: Usuario SIN Suscripción**

**Pasos:**

1. Inicia sesión en la app
2. Navega a `/subscription` (o click en widget si está en dashboard)

**Resultado esperado:**

- 🎯 Ves pantalla "No tienes una suscripción activa"
- 🎯 Icono de corona morado
- 🎯 Botón "Ver Planes" que lleva a `/pricing`
- 🎯 Botón "Volver al Dashboard"

**Widget (si lo añades):**

- 🎯 Card con gradiente morado-azul
- 🎯 Texto "Activa tu cuenta Premium"
- 🎯 Botón "Ver Planes"

---

### **Escenario 2: Usuario CON Suscripción Activa**

**Pasos para obtener suscripción:**

1. Ve a `/pricing`
2. Click en "Comprar Wedding Pass" (o cualquier plan)
3. Completa pago en Stripe (usa tarjeta de prueba: `4242 4242 4242 4242`)
4. Serás redirigido a `/payment/success`
5. Espera 5 seg o click "Ir al Dashboard"
6. Navega a `/subscription`

**Resultado esperado:**

- 🎯 Header con gradiente morado-azul
- 🎯 Nombre del plan (ej: "Wedding Pass")
- 🎯 Badge verde "Activa"
- 🎯 Precio mostrado correctamente (ej: "50,00 EUR pago único")
- 🎯 Próxima renovación (para suscripciones)
- 🎯 Lista de características (si están configuradas)
- 🎯 Botón "Gestionar Suscripción" (abre Stripe Portal)
- 🎯 Botón "Cambiar Plan" (lleva a `/pricing`)
- 🎯 Sección "Portal del Cliente" con info
- 🎯 Sección de ayuda con link a soporte

---

### **Escenario 3: Suscripción en Período de Prueba**

**Solo para suscripciones con trial (planners mensuales):**

1. Compra "Pack 5 - Mensual" (tiene trial de 30 días)
2. Navega a `/subscription`

**Resultado esperado:**

- 🎯 Badge azul "En prueba"
- 🎯 Alert box azul con mensaje: "Período de prueba activo"
- 🎯 Fecha de fin del trial
- 🎯 Mensaje: "Después se te cobrará automáticamente"

---

### **Escenario 4: Suscripción Programada para Cancelar**

**Pasos:**

1. Tener suscripción activa
2. Click "Gestionar Suscripción"
3. En Stripe Portal, click "Cancelar suscripción"
4. Seleccionar "Cancelar al final del período"
5. Volver a `/subscription`

**Resultado esperado:**

- 🎯 Alert box amarillo con mensaje: "Suscripción programada para cancelar"
- 🎯 Fecha de finalización mostrada
- 🎯 Mensaje: "Aún tienes acceso hasta esa fecha"

---

### **Escenario 5: Stripe Customer Portal**

**Pasos:**

1. En `/subscription`, click "Gestionar Suscripción"

**Resultado esperado:**

- 🎯 Botón muestra spinner + "Cargando..."
- 🎯 Redirige a Stripe Customer Portal
- 🎯 En el portal puedes:
  - Ver facturas
  - Actualizar método de pago
  - Cancelar suscripción
  - Ver historial de pagos

---

## 🎨 INTEGRACIÓN EN DASHBOARD PRINCIPAL

### **Opción A: Añadir en HomeUser.jsx**

```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

// Dentro del render:
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Otros widgets */}
  <SubscriptionWidget />
</div>
```

### **Opción B: Añadir en More.jsx**

```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

// En la sección de cuenta/ajustes:
<SubscriptionWidget />
```

### **Opción C: Añadir en MainLayout (sidebar)**

```jsx
// Link en el menú:
<Link to="/subscription">
  <Crown className="h-5 w-5" />
  Mi Suscripción
</Link>
```

---

## 🔍 TESTING CON TARJETAS DE PRUEBA STRIPE

### **Tarjetas que funcionan:**

```
Éxito:
4242 4242 4242 4242 - Pago exitoso
4000 0025 0000 3155 - Requiere 3D Secure

Falla:
4000 0000 0000 0002 - Card declined
4000 0000 0000 9995 - Fondos insuficientes
```

**Datos adicionales (cualquiera funciona):**
- **Fecha:** Cualquier fecha futura (ej: 12/25)
- **CVC:** Cualquier 3 dígitos (ej: 123)
- **ZIP:** Cualquier código postal

---

## 🐛 DEBUGGING

### **Problema: "No tienes una suscripción activa" después de pagar**

**Posibles causas:**

1. **Webhook no procesado:**
   - Verifica logs del backend
   - Busca: `[stripe-webhook]`
   - Debe ver: "Payment successful" o "Subscription created"

2. **Usuario no autenticado correctamente:**
   - Verifica localStorage: `authToken`
   - Verifica header Authorization en Network tab

3. **Firestore no actualizado:**
   - Verifica en Firebase Console
   - Path: `users/{uid}/subscriptions/{id}`

**Solución temporal:**
```bash
# Forzar sync
curl -X GET http://localhost:4004/api/stripe/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Problema: "Error al obtener suscripción"**

**Verificar:**

1. **Backend corriendo:**
   ```bash
   curl http://localhost:4004/health
   ```

2. **Ruta existe:**
   ```bash
   curl -X GET http://localhost:4004/api/stripe/subscription \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Token válido:**
   - Inspecciona Network tab
   - Verifica que header Authorization se envía

---

### **Problema: Portal del cliente no abre**

**Causas comunes:**

1. **No tiene customerId en Firestore:**
   - Debe crearse automáticamente al hacer primera compra
   - Verificar en `users/{uid}/subscriptions/{id}`

2. **Error 404 en endpoint:**
   - Verifica que ruta `/api/stripe/create-portal-session` existe
   - Logs del backend

---

## 📊 DATOS MOSTRADOS

### **Información que se extrae de Stripe:**

```javascript
{
  productName: "Wedding Pass",        // Del product
  status: "active",                   // active, trialing, past_due, canceled
  amount: 5000,                       // En centavos (50.00 EUR)
  currency: "eur",
  interval: null,                     // Para one-time es null
  currentPeriodEnd: 1234567890,      // Timestamp
  cancelAtPeriodEnd: false,
  trialEnd: null,                     // Si está en trial
  customerId: "cus_xxx",
  subscriptionId: "sub_xxx"           // Solo para subscriptions
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de dar por terminado, verifica:

**Dashboard:**
- [ ] Carga correctamente con suscripción
- [ ] Muestra "No hay suscripción" cuando corresponde
- [ ] Badge de estado correcto
- [ ] Precio formateado correctamente
- [ ] Fecha de renovación correcta
- [ ] Botón "Gestionar" abre Stripe Portal
- [ ] Botón "Cambiar Plan" lleva a `/pricing`
- [ ] Alerts de trial/cancelación funcionan

**Widget:**
- [ ] Muestra CTA si no hay suscripción
- [ ] Muestra resumen si hay suscripción
- [ ] Link a dashboard funciona
- [ ] Formato de precio correcto

**Integración:**
- [ ] Ruta `/subscription` funciona
- [ ] Protegida por auth
- [ ] Endpoint backend responde
- [ ] Manejo de errores

---

## 🎯 PRÓXIMOS PASOS

Una vez verificado:

1. **Añadir widget al dashboard principal**
2. **Probar flujo completo de compra → dashboard**
3. **Testing con diferentes estados de suscripción**
4. **Documentar comportamientos edge case**

---

**Última actualización:** 23 de octubre de 2025  
**Tiempo de testing:** ~30 minutos  
**Estado:** Listo para probar
