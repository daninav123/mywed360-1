# Gestión de Pagos desde el Frontend - Guía Completa

Explicación de cómo funciona la gestión de pagos desde el punto de vista del usuario.

---

## 🎯 ARQUITECTURA DE LA EXPERIENCIA DE USUARIO

### **3 Puntos de Entrada Principales:**

```
1. /pricing          → COMPRAR (Primera vez)
2. /perfil           → GESTIONAR (Ver/Cambiar plan)
3. /subscription     → DASHBOARD COMPLETO (Detalles)
```

---

## 📍 **1. PÁGINA DE PRICING** (`/pricing`)

### **Propósito:** Venta inicial

**Ubicación:** `src/pages/marketing/Pricing.jsx`

**Cuándo se usa:**
- ✅ Usuario nuevo sin suscripción
- ✅ Usuario quiere cambiar de plan
- ✅ Marketing y landing pages

**Qué hace:**
```jsx
// Usuario hace click en "Comprar Wedding Pass"
handlePurchase(PRODUCT_IDS.weddingPass, 'weddingPass')
  ↓
createCheckoutSession({ productId: 'wedding_pass' })
  ↓
Backend crea sesión de Stripe
  ↓
Frontend redirige a Stripe Checkout (session.url)
  ↓
Usuario paga en Stripe
  ↓
Stripe redirige a /payment/success
```

**Características:**
- Botones individuales por plan
- Loading states
- Manejo de errores
- 2 tipos de productos:
  - **Parejas:** Botón directo
  - **Planners:** 2 botones (Mensual + Anual)

---

## 👤 **2. PÁGINA DE PERFIL** (`/perfil`)

### **Propósito:** Vista rápida y gestión básica

**Ubicación:** `src/pages/Perfil.jsx`

**Integración actual (COMPLETADA):**
```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

// Reemplaza los botones mock anteriores
<div className="space-y-4">
  <h2 className="text-lg font-medium">
    Tipo de suscripción
  </h2>
  <SubscriptionWidget />
</div>
```

**Qué muestra:**

### **Si NO tiene suscripción:**
```
┌─────────────────────────────────────┐
│ 🎨 Activa tu cuenta Premium         │
│ Desbloquea funcionalidades...       │
│ [Ver Planes →]                      │
└─────────────────────────────────────┘
```

### **Si SÍ tiene suscripción:**
```
┌─────────────────────────────────────┐
│ 👑 Wedding Pass         ✅ Activa   │
│ Precio: 50,00 EUR (pago único)      │
│ Renueva: 23 nov                     │
│ [Gestionar Suscripción]             │
└─────────────────────────────────────┘
```

**Ventajas:**
- ✅ Sin modificar lógica existente
- ✅ Reemplaza botones mock por widget real
- ✅ Conectado a Stripe real
- ✅ Auto-fetch de datos
- ✅ UX consistente

---

## 📊 **3. DASHBOARD DE SUSCRIPCIÓN** (`/subscription`)

### **Propósito:** Gestión completa

**Ubicación:** `src/pages/SubscriptionDashboard.jsx`

**Cuándo se usa:**
- ✅ Usuario quiere ver detalles completos
- ✅ Usuario quiere cambiar método de pago
- ✅ Usuario quiere cancelar suscripción
- ✅ Usuario quiere ver facturas

**Información Completa:**
```
┌──────────────────────────────────────────────┐
│ 👑 Wedding Pass                ✅ Activa     │
│ Tu plan activo                               │
├──────────────────────────────────────────────┤
│ Precio: 50,00 EUR (pago único)              │
│ Próxima renovación: 23 nov 2025             │
│                                              │
│ Características incluidas:                   │
│ ✓ Invitados ilimitados                      │
│ ✓ Plantillas premium                         │
│ ✓ ...                                        │
│                                              │
│ [⚙️ Gestionar Suscripción] [🔄 Cambiar Plan]│
└──────────────────────────────────────────────┘
```

**Botón "Gestionar Suscripción":**
- Abre Stripe Customer Portal
- Usuario puede actualizar tarjeta
- Usuario puede ver facturas
- Usuario puede cancelar

---

## 🔄 **FLUJO COMPLETO DE USUARIO**

### **Escenario A: Usuario Nuevo Compra Plan**

```
1. Usuario ve landing page
   ↓
2. Click "Ver Planes" → /pricing
   ↓
3. Ve todos los planes disponibles
   ↓
4. Click "Comprar Wedding Pass"
   ↓
5. Redirige a Stripe Checkout
   ↓
6. Ingresa datos de tarjeta
   ↓
7. Confirma pago
   ↓
8. Stripe procesa (2-3 segundos)
   ↓
9. Redirige a /payment/success
   ↓
10. Muestra confirmación + auto-redirect
   ↓
11. Llega a /dashboard
   ↓
12. Ve su plan activo
```

### **Escenario B: Usuario Existente en Perfil**

```
1. Usuario logueado va a /perfil
   ↓
2. Ve widget de suscripción
   ↓
3. Opciones:
   
   SI NO TIENE PLAN:
   → Click "Ver Planes" → /pricing
   
   SI TIENE PLAN:
   → Click "Gestionar Suscripción" → /subscription
   → Desde ahí puede abrir Stripe Portal
```

### **Escenario C: Usuario Cambia de Plan**

```
1. Usuario en /subscription
   ↓
2. Click "Cambiar Plan"
   ↓
3. Redirige a /pricing
   ↓
4. Selecciona nuevo plan
   ↓
5. (Mismo flujo de compra)
```

---

## 🗺️ **DÓNDE AÑADIR ENLACES AL SISTEMA DE PAGOS**

### **1. En Sidebar/Menú Principal (MainLayout.jsx):**

```jsx
import { Crown, CreditCard } from 'lucide-react';

// Añadir en el menú de navegación:
<Link to="/subscription" className="nav-link">
  <Crown className="h-5 w-5" />
  <span>Mi Suscripción</span>
</Link>

<Link to="/pricing" className="nav-link">
  <CreditCard className="h-5 w-5" />
  <span>Ver Planes</span>
</Link>
```

### **2. En Dashboard Principal (HomeUser.jsx):**

```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

// En el grid de widgets:
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Otros widgets existentes */}
  
  <SubscriptionWidget />
  
  {/* Más widgets */}
</div>
```

### **3. En Página de Ajustes (More.jsx):**

```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

// En la sección de cuenta:
<section className="space-y-6">
  <h2>Cuenta y Facturación</h2>
  
  <SubscriptionWidget />
  
  {/* Otros ajustes */}
</section>
```

---

## 📦 **COMPONENTES REUTILIZABLES**

### **1. SubscriptionWidget**

**Ubicación:** `src/components/subscription/SubscriptionWidget.jsx`

**Props:** Ninguna (auto-fetch)

**Uso:**
```jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

<SubscriptionWidget />
```

**Ventajas:**
- Auto-fetch de suscripción
- Loading state automático
- CTA si no hay suscripción
- Resumen compacto
- Link a dashboard completo

### **2. useStripeCheckout Hook**

**Ubicación:** `src/hooks/useStripeCheckout.js`

**Uso:**
```jsx
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { PRODUCT_IDS } from '../services/stripeService';

const { startCheckout, isLoading, error } = useStripeCheckout();

const handleBuy = async () => {
  await startCheckout(PRODUCT_IDS.weddingPass);
};
```

### **3. Stripe Service**

**Ubicación:** `src/services/stripeService.js`

**Funciones:**
```javascript
// Crear checkout
createCheckoutSession({ productId, weddingId })

// Verificar sesión
getCheckoutSession(sessionId)

// Portal del cliente
createCustomerPortalSession()
```

---

## 🎨 **CAMBIOS REALIZADOS EN PERFIL.JSX**

### **Antes (Mock):**

```jsx
// Botones locales sin funcionalidad real
<Button onClick={() => setSubscription('free')}>
  Gratis
</Button>
<Button onClick={() => setSubscription('premium')}>
  Premium
</Button>
<Button onClick={() => setSubscription('premium_plus')}>
  Premium Plus
</Button>
```

### **Después (Real):**

```jsx
// Widget conectado a Stripe
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

<div className="space-y-4">
  <h2 className="text-lg font-medium">
    Tipo de suscripción
  </h2>
  <SubscriptionWidget />
</div>
```

**Mejoras:**
- ✅ Datos reales de Stripe
- ✅ Estado actual de suscripción
- ✅ Botón para gestionar
- ✅ CTA si no tiene plan
- ✅ Loading y error states

---

## 💡 **MEJORES PRÁCTICAS IMPLEMENTADAS**

### **1. Separación de Responsabilidades:**

```
/pricing          → Venta (Marketing)
/perfil           → Vista rápida (Usuario)
/subscription     → Gestión completa (Usuario)
Stripe Portal     → Operaciones sensibles (Externo)
```

### **2. Progressive Disclosure:**

```
Widget compacto (perfil)
  ↓
Dashboard completo (/subscription)
  ↓
Stripe Portal (gestión avanzada)
```

### **3. Feedback Visual:**

```jsx
// Estados con colores
{status === 'active' && <Badge color="green">Activa</Badge>}
{status === 'trialing' && <Badge color="blue">En prueba</Badge>}
{status === 'past_due' && <Badge color="yellow">Pago pendiente</Badge>}
{status === 'canceled' && <Badge color="gray">Cancelada</Badge>}
```

### **4. Navegación Intuitiva:**

```
Usuario siempre sabe:
- ✅ Qué plan tiene
- ✅ Cuánto paga
- ✅ Cuándo renueva
- ✅ Cómo cambiar/cancelar
```

---

## 🧪 **CÓMO PROBAR**

### **1. Probar en Perfil:**

```bash
1. npm run dev
2. Iniciar sesión
3. Ir a /perfil
4. Scroll a "Tipo de suscripción"
5. Ver widget:
   - Si no tiene plan → CTA "Ver Planes"
   - Si tiene plan → Resumen + "Gestionar"
```

### **2. Probar Compra Completa:**

```bash
1. Click "Ver Planes" (desde perfil)
2. Ir a /pricing
3. Click "Comprar Wedding Pass"
4. Tarjeta: 4242 4242 4242 4242
5. Completar pago
6. Verificar redirect a /payment/success
7. Volver a /perfil
8. Ver widget actualizado con plan activo
```

### **3. Probar Gestión:**

```bash
1. Con plan activo, ir a /perfil
2. Click "Gestionar Suscripción"
3. Redirige a /subscription
4. Click "Gestionar Suscripción" (botón grande)
5. Abre Stripe Portal
6. Probar cambiar tarjeta, ver facturas
7. Volver
8. Verificar datos actualizados
```

---

## 📊 **RESUMEN: DÓNDE ESTÁ CADA COSA**

| Función | Ubicación | Ruta | Estado |
|---------|-----------|------|--------|
| **Comprar plan** | Pricing.jsx | `/pricing` | ✅ Listo |
| **Ver mi plan** | Perfil.jsx | `/perfil` | ✅ Integrado |
| **Gestionar todo** | SubscriptionDashboard.jsx | `/subscription` | ✅ Listo |
| **Cambiar tarjeta** | Stripe Portal | Externa | ✅ Funciona |
| **Ver facturas** | Stripe Portal | Externa | ✅ Funciona |

---

## 🎯 **LO QUE SE LOGRÓ**

### **Antes:**
- ❌ Botones mock en perfil sin funcionalidad
- ❌ Sin gestión real de pagos
- ❌ Sin integración con Stripe

### **Ahora:**
- ✅ Widget real conectado a Stripe en perfil
- ✅ Dashboard completo de suscripciones
- ✅ Stripe Customer Portal integrado
- ✅ Flujo completo de compra funcionando
- ✅ Estados visuales claros
- ✅ Error handling robusto

---

## 🚀 **PRÓXIMOS PASOS OPCIONALES**

### **1. Añadir en Dashboard Principal:**

```jsx
// En src/pages/HomeUser.jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

<div className="grid gap-6 md:grid-cols-3">
  {/* Otros widgets */}
  <SubscriptionWidget />
</div>
```

### **2. Añadir Link en Sidebar:**

```jsx
// En src/components/MainLayout.jsx
<Link to="/subscription">
  <Crown className="h-5 w-5" />
  Mi Suscripción
</Link>
```

### **3. Añadir en More.jsx:**

```jsx
// En src/pages/More.jsx
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';

<section>
  <h3>Facturación</h3>
  <SubscriptionWidget />
</section>
```

---

## 🔐 **SEGURIDAD**

✅ **Todas las rutas están protegidas:**
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/subscription" element={<SubscriptionDashboard />} />
  <Route path="/perfil" element={<Perfil />} />
</Route>
```

✅ **Token de autenticación en todas las peticiones:**
```javascript
const token = localStorage.getItem('authToken');
headers: {
  'Authorization': `Bearer ${token}`
}
```

✅ **Validación en backend:**
```javascript
// Backend verifica usuario y permisos
const userId = req.user?.uid;
if (!userId) return res.status(401);
```

---

## 📝 **DOCUMENTOS RELACIONADOS**

1. **`PAYMENT-IMPLEMENTATION-COMPLETE.md`** - Resumen general
2. **`SUBSCRIPTION-DASHBOARD-TESTING.md`** - Testing detallado
3. **`STRIPE-SETUP.md`** - Configuración Stripe
4. **`FRONTEND-PAYMENT-FLOW.md`** - Este documento

---

**Última actualización:** 23 de octubre de 2025  
**Estado:** ✅ Integración en Perfil.jsx completada  
**Listo para:** Producción
