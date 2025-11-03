# 💰 Sistema de Planes y Monetización - Proveedores

**Fecha**: 2025-01-03  
**Prioridad**: 🔴 **CRÍTICA** (Monetización)  
**Estado**: ✅ **COMPLETADO**

---

## 🎯 OBJETIVO

Implementar un sistema de suscripción de 3 niveles (FREE, BASIC, PRO) para monetizar el panel de proveedores mientras se entrega valor incremental.

---

## ✅ LO QUE SE HA IMPLEMENTADO

### **1. Componente de Comparación de Planes** ⭐

**Archivo**: `src/pages/suppliers/SupplierPlans.jsx`

**Funcionalidades**:

- ✅ **3 planes definidos**: FREE, BASIC, PRO
- ✅ **Comparación visual** side-by-side
- ✅ **Toggle mensual/anual** (15% descuento anual)
- ✅ **Badge "MÁS POPULAR"** en BASIC
- ✅ **Indicador de plan actual**
- ✅ **Botones CTA** contextuales
- ✅ **Sección de FAQ**
- ✅ **Banner de beneficios**
- ✅ **Diseño responsive**

---

### **2. Indicador de Plan en Dashboard** ⭐

**Archivo modificado**: `src/pages/suppliers/SupplierDashboard.jsx`

**Implementación**:

- ✅ **Banner condicional** según plan actual
- ✅ **3 variantes de banner**:
  - FREE: Amarillo con CTA "Ver Planes"
  - BASIC: Morado con sugerencia de PRO
  - PRO: Verde celebrando acceso completo
- ✅ **Carga automática** del plan desde API
- ✅ **Iconos contextuales** (Zap, Crown)

---

### **3. Routing** ✅

**Archivo modificado**: `src/App.jsx`

**Ruta añadida**:

```
/supplier/dashboard/:id/plans → SupplierPlans
```

---

## 💵 ESTRUCTURA DE PLANES

### **Plan FREE** 🆓

**Precio**: Gratis para siempre

**Límites**:

- ✅ Perfil público básico
- ✅ Hasta 10 fotos en portfolio
- ✅ Hasta 5 solicitudes/mes
- ✅ Notificaciones por email
- ✅ Búsqueda orgánica

**Funcionalidades Premium** ❌:

- ❌ Badge verificado
- ❌ Solicitudes ilimitadas
- ❌ Portfolio ilimitado
- ❌ Destacado en búsquedas
- ❌ Analíticas avanzadas

**Objetivo**: Atraer proveedores para probar la plataforma

---

### **Plan BASIC** ⭐ (Más Popular)

**Precio**:

- 💶 19€/mes (mensual)
- 💶 16€/mes (193€/año - ahorro 15%)

**Lo que incluye**:

- ✅ **Todo de FREE, más:**
- ✅ Badge verificado ✓
- ✅ Solicitudes ilimitadas
- ✅ Portfolio ilimitado
- ✅ Destacado en búsquedas
- ✅ Sin marca de agua
- ✅ Estadísticas básicas
- ✅ Respuestas automáticas

**Funcionalidades Premium** ❌:

- ❌ Analíticas avanzadas
- ❌ API + Webhooks
- ❌ Soporte prioritario

**Objetivo**: Monetización principal - profesionales activos

**Valor agregado**:

- 3x más solicitudes que FREE
- Mayor visibilidad en búsquedas
- Badge de confianza

---

### **Plan PRO** 👑

**Precio**:

- 💶 49€/mes (mensual)
- 💶 42€/mes (500€/año - ahorro 15%)

**Lo que incluye**:

- ✅ **Todo de BASIC, más:**
- ✅ Analíticas avanzadas 📊
- ✅ API + Webhooks
- ✅ Soporte prioritario 24/7
- ✅ Gestor de equipo
- ✅ Integración con CRM
- ✅ White label
- ✅ Dominio personalizado
- ✅ Consultoría mensual
- ✅ Acceso beta a features
- ✅ Sin comisiones en pagos
- ✅ Prioridad en SEO

**Objetivo**: Empresas grandes / Wedding planners

**Valor agregado**:

- Herramientas profesionales
- Control total
- ROI maximizado

---

## 🎨 DISEÑO VISUAL

### **Página de Planes**

```
┌────────────────────────────────────────────────────────────┐
│  [← Volver]                                                │
│                                                            │
│         Elige el plan perfecto para ti                    │
│    Crece tu negocio con las herramientas...              │
│                                                            │
│     [ Mensual ]  [ Anual -15% ]                          │
│                                                            │
├───────────┬──────────────┬──────────────┐                │
│   FREE    │   BASIC ⭐   │     PRO 👑   │                │
│           │              │              │                │
│   Gratis  │    19€/mes   │   49€/mes    │                │
│           │              │              │                │
│ ✓ Feature │ ✓ Todo FREE+ │ ✓ Todo BASIC+│                │
│ ✓ Feature │ ✓ Ilimitado  │ ✓ Analytics  │                │
│ ✗ Premium │ ✓ Badge      │ ✓ API        │                │
│ ✗ Premium │ ✗ Analytics  │ ✓ Soporte    │                │
│           │              │              │                │
│ [Actual]  │ [Mejorar]    │ [Mejorar]    │                │
└───────────┴──────────────┴──────────────┘                │
│                                                            │
│  ❓ Preguntas Frecuentes                                   │
│  ¿Puedo cambiar de plan? Sí, en cualquier momento        │
│  ¿Qué métodos de pago? Tarjetas (Visa, Mastercard)       │
│                                                            │
│  🚀 ¿Por qué mejorar?                                      │
│  [📈 Más Visibilidad] [⚡ Sin Límites] [🎧 Soporte]       │
└────────────────────────────────────────────────────────────┘
```

### **Banner en Dashboard**

**Si es FREE**:

```
┌────────────────────────────────────────────────┐
│ ⚡ Plan FREE - Funcionalidad Limitada         │
│   Mejora a BASIC para solicitudes...   [Ver]  │
└────────────────────────────────────────────────┘
```

**Si es BASIC**:

```
┌────────────────────────────────────────────────┐
│ 👑 Plan BASIC Activo ✓                        │
│   ¿Quieres analytics? Descubre PRO    [Ver]   │
└────────────────────────────────────────────────┘
```

**Si es PRO**:

```
┌────────────────────────────────────────────────┐
│ 👑 Plan PRO Activo 🎉                         │
│   Tienes acceso completo a todo               │
└────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE USUARIO

### **Caso 1: Proveedor FREE quiere mejorar**

```
1. Ve banner "Plan FREE - Funcionalidad Limitada"
2. Click "Ver Planes"
3. Página de comparación
4. Elige BASIC → Click "Mejorar a BASIC"
5. [TODO] Redirige a Stripe Checkout
6. Paga → Plan actualizado
7. Vuelve al dashboard → Banner "Plan BASIC Activo"
```

### **Caso 2: Proveedor explora planes desde menú**

```
1. En dashboard, busca sección de planes
2. Click directo a /plans (TODO: añadir en menú)
3. Compara planes
4. Decide y hace upgrade
```

### **Caso 3: Proveedor alcanza límite FREE**

```
1. Intenta ver solicitud #6 del mes
2. Modal: "Has alcanzado el límite de 5 solicitudes/mes"
3. Botón "Mejorar a BASIC" → /plans
4. Upgrade para desbloquear
```

---

## 💳 INTEGRACIÓN CON STRIPE (Pendiente)

### **Lo que falta implementar**:

#### **1. Productos en Stripe**

```javascript
// Crear en Stripe Dashboard:
Product: MaLove Proveedor BASIC
  - Price: 19€/month (recurring)
  - Price: 193€/year (recurring)

Product: MaLove Proveedor PRO
  - Price: 49€/month (recurring)
  - Price: 500€/year (recurring)
```

#### **2. Checkout Session**

```javascript
// En handleUpgrade()
const response = await fetch('/api/supplier-subscription/create-checkout', {
  method: 'POST',
  body: JSON.stringify({
    planId: 'basic',
    billingPeriod: 'monthly',
  }),
});

const { sessionUrl } = await response.json();
window.location.href = sessionUrl; // Redirige a Stripe
```

#### **3. Webhook para confirmación**

```javascript
// backend/routes/stripe-webhook.js
router.post('/webhook', async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, secret);

  if (event.type === 'checkout.session.completed') {
    // Actualizar plan del proveedor en Firestore
    await updateSupplierPlan(supplierId, planId);
  }
});
```

#### **4. Backend endpoints necesarios**

```
POST /api/supplier-subscription/create-checkout
POST /api/stripe/webhook
GET  /api/supplier-subscription/portal (para gestión)
```

---

## 🛡️ LÍMITES Y VALIDACIÓN

### **Implementación de Límites** (TODO):

#### **1. Límite de solicitudes (FREE)**

```javascript
// En SupplierRequests.jsx
if (currentPlan === 'free' && requestsThisMonth >= 5) {
  return (
    <UpgradeModal
      title="Límite de solicitudes alcanzado"
      message="Mejora a BASIC para solicitudes ilimitadas"
      ctaLink="/supplier/dashboard/:id/plans"
    />
  );
}
```

#### **2. Límite de fotos (FREE)**

```javascript
// En SupplierPortfolio.jsx
if (currentPlan === 'free' && photos.length >= 10) {
  toast.warning('Límite de 10 fotos. Mejora a BASIC para ilimitadas');
  setShowUploadModal(false);
}
```

#### **3. Badge verificado (BASIC+)**

```javascript
// En perfil público
{
  supplier.subscription?.plan !== 'free' && <span className="badge-verified">Verificado ✓</span>;
}
```

---

## 📊 MÉTRICAS A TRACKEAR

### **Métricas de Conversión**:

```
1. Conversion rate FREE → BASIC
   Medida: (Upgrades a BASIC / Total FREE) * 100
   Meta: > 15%

2. Conversion rate BASIC → PRO
   Medida: (Upgrades a PRO / Total BASIC) * 100
   Meta: > 5%

3. Churn rate
   Medida: (Cancelaciones / Total activos) * 100
   Meta: < 5%

4. Lifetime Value (LTV)
   Medida: Promedio de duración * precio plan
   Meta: BASIC > 200€, PRO > 500€
```

### **Métricas de Engagement**:

```
1. Click-through rate de banners
   Medida: (Clics "Ver Planes" / Impresiones banner) * 100
   Meta: > 20%

2. Tiempo en página de planes
   Medida: Promedio de segundos en /plans
   Meta: > 60 segundos

3. Reach de límites (FREE)
   Medida: % que alcanza límite 5 solicitudes o 10 fotos
   Meta: Maximizar para impulsar upgrades
```

---

## 💰 PROYECCIÓN DE INGRESOS

### **Escenario Conservador** (Año 1):

```
100 proveedores FREE   → 0€
 20 proveedores BASIC  → 19€ * 12 * 20 = 4,560€/año
  5 proveedores PRO    → 49€ * 12 *  5 = 2,940€/año
─────────────────────────────────────────
Total:                   7,500€/año
```

### **Escenario Optimista** (Año 2):

```
200 proveedores FREE   → 0€
 60 proveedores BASIC  → 19€ * 12 * 60 = 13,680€/año
 15 proveedores PRO    → 49€ * 12 * 15 =  8,820€/año
─────────────────────────────────────────
Total:                   22,500€/año
```

### **Escenario Objetivo** (Año 3):

```
500 proveedores FREE   → 0€
150 proveedores BASIC  → 19€ * 12 * 150 = 34,200€/año
 30 proveedores PRO    → 49€ * 12 *  30 = 17,640€/año
─────────────────────────────────────────
Total:                   51,840€/año
```

---

## 🚀 VENTAJAS DEL SISTEMA

### **Para el Negocio**:

1. ✅ **Monetización directa** del valor entregado
2. ✅ **Escalable** (automatizado, no depende de ventas manual)
3. ✅ **Predecible** (MRR - Monthly Recurring Revenue)
4. ✅ **Justifica desarrollo** de más features
5. ✅ **Alinea incentivos** (más valor = más pago)

### **Para el Proveedor**:

1. ✅ **Prueba gratis** (FREE sin riesgo)
2. ✅ **Precio accesible** (19€/mes razonable)
3. ✅ **Valor claro** (más solicitudes = más clientes = ROI)
4. ✅ **Sin compromiso** (cancela cuando quieras)
5. ✅ **Crece con ellos** (de FREE a PRO según negocio)

---

## 🔮 PRÓXIMOS PASOS

### **Inmediato** (Esta semana):

1. ⚠️ **Integración Stripe completa**
   - Crear productos en Stripe
   - Implementar checkout
   - Webhook para confirmación
   - Testing end-to-end

2. ⚠️ **Enforcement de límites**
   - Límite solicitudes FREE
   - Límite fotos FREE
   - Modales de upgrade

3. ⚠️ **Portal de gestión**
   - Cancelar suscripción
   - Cambiar método de pago
   - Ver historial de pagos

### **Corto plazo** (2 semanas):

4. 📊 **Dashboard de métricas**
   - Tracking de conversiones
   - Funnel de upgrades
   - Churn analysis

5. 💌 **Email marketing**
   - Email cuando alcanza límite FREE
   - Email recordatorio de valor (BASIC)
   - Email ofertas especiales

6. 🎯 **A/B Testing**
   - Precios
   - Copy de CTAs
   - Diseño de planes

### **Medio plazo** (1 mes):

7. 🎁 **Promociones**
   - Primer mes 50% OFF
   - Trial de 7 días PRO
   - Referral program (descuentos)

8. 📈 **Analíticas para PRO**
   - Dashboard de métricas avanzadas
   - Comparación con competencia
   - Reportes mensuales

---

## 🧪 TESTING

### **Tests funcionales**:

```
✅ Visualización correcta de planes
✅ Toggle mensual/anual funciona
✅ Banner condicional según plan
✅ Navegación a /plans desde dashboard
✅ Plan actual se carga correctamente
✅ CTAs llevan a página correcta
```

### **Tests pendientes** (Stripe):

```
⚠️ Checkout session se crea correctamente
⚠️ Payment success actualiza plan
⚠️ Webhook procesa correctamente
⚠️ Plan se actualiza en tiempo real
⚠️ Límites se aplican correctamente
⚠️ Downgrades funcionan
```

---

## 📝 DOCUMENTACIÓN TÉCNICA

### **Estructura de datos** (Firestore):

```javascript
suppliers/{supplierId}
{
  // ... otros campos
  subscription: {
    plan: 'free' | 'basic' | 'pro',
    status: 'active' | 'cancelled' | 'past_due',
    stripeCustomerId: 'cus_xxx',
    stripeSubscriptionId: 'sub_xxx',
    currentPeriodEnd: Timestamp,
    createdAt: Timestamp,
    updatedAt: Timestamp
  },
  usage: {
    requestsThisMonth: 3,
    photosCount: 8,
    lastResetDate: Timestamp
  }
}
```

### **Código del componente**:

```jsx
// Definición de planes
const PLANS = {
  free: { id: 'free', name: 'FREE', price: 0, ... },
  basic: { id: 'basic', name: 'BASIC', price: 19, ... },
  pro: { id: 'pro', name: 'PRO', price: 49, ... }
};

// Upgrade
const handleUpgrade = async (planId) => {
  // TODO: Integrar Stripe
  toast.info('Redirigiendo a pago...');
};
```

---

## ✅ CONCLUSIÓN

**Estado**: ✅ **Frontend 100% Completado**

El sistema de planes está implementado visualmente y listo para uso. Falta:

1. ⚠️ Integración backend con Stripe
2. ⚠️ Enforcement de límites
3. ⚠️ Portal de gestión de suscripción

**Valor entregado**:

- 💰 Base de monetización lista
- 🎨 UX profesional y clara
- 📊 Estructura escalable
- 🚀 Listo para conectar Stripe

**Próximo paso crítico**:
🔗 **Integración completa con Stripe** para empezar a monetizar

---

**Desarrollador**: Cascade AI  
**Revisión**: Pendiente  
**Deployment**: Pendiente commit
