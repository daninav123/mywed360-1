# Configuración de Stripe para MaLoveApp

> **Modelo vigente:** Licencias por boda (octubre 2025). Cada boda se activa con un pago único. Los planners compran paquetes de licencias con modalidad mensual (12 cuotas) o anual (15% descuento).

## 📋 Índice

1. [Crear cuenta de Stripe](#1-crear-cuenta-de-stripe)
2. [Obtener claves de API](#2-obtener-claves-de-api)
3. [Crear productos y precios](#3-crear-productos-y-precios)
4. [Configurar webhook](#4-configurar-webhook)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Pruebas](#6-pruebas)
7. [Producción](#7-producción)

---

## 1. Crear Cuenta de Stripe

1. Regístrate en [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Completa la verificación de cuenta
3. Activa tu cuenta (necesitarás datos fiscales para producción)

---

## 2. Obtener Claves de API

### Modo Test (Desarrollo)

1. Ve a [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copia:
   - **Publishable key** (comienza con `pk_test_`)
   - **Secret key** (haz click en "Reveal" y copia, comienza con `sk_test_`)

### Modo Live (Producción)

1. Ve a [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copia las mismas claves pero en modo live (`pk_live_` y `sk_live_`)

---

## 3. Crear Productos y Precios

### 3.1. Planes para Parejas (Pago Único)

#### Wedding Pass (50 EUR)
```
1. Ve a https://dashboard.stripe.com/test/products/create
2. Product name: Wedding Pass - MaLoveApp
3. Description: Pago único por boda con funcionalidades completas
4. Pricing model: One-time
5. Price: 50 EUR
6. Click "Save product"
7. COPIA el Price ID (empieza con price_) → STRIPE_PRICE_WEDDING_PASS
```

#### Wedding Pass Plus (85 EUR)
```
1. Product name: Wedding Pass Plus - MaLoveApp
2. Description: Pago único premium sin marca y con ayudante
3. Pricing model: One-time
4. Price: 85 EUR
5. Click "Save product"
6. COPIA el Price ID → STRIPE_PRICE_WEDDING_PASS_PLUS
```

---

### 3.2. Paquetes para Wedding Planners

> **Importante:** Cada pack necesita DOS precios: uno mensual (con trial) y uno anual (con descuento).

#### Planner Pack 5

**Versión Mensual (41,67 EUR/mes)**
```
1. Product name: Planner Pack 5 - MaLoveApp
2. Description: Hasta 5 bodas activas - Pago mensual
3. Pricing model: Recurring
4. Price: 41.67 EUR
5. Billing period: Monthly
6. Add a free trial: YES → Trial period: 30 days
7. Click "Save product"
8. COPIA el Price ID → STRIPE_PRICE_PLANNER_PACK5_MONTHLY
```

**Versión Anual (425 EUR - 15% descuento)**
```
1. En el mismo producto "Planner Pack 5", click "Add another price"
2. Pricing model: One-time
3. Price: 425 EUR
4. Description: Pago anual (15% descuento vs mensual)
5. Click "Save price"
6. COPIA el Price ID → STRIPE_PRICE_PLANNER_PACK5_ANNUAL
```

#### Planner Pack 15

**Versión Mensual (112,50 EUR/mes)**
```
1. Product name: Planner Pack 15 - MaLoveApp
2. Description: Hasta 15 bodas activas - Pago mensual
3. Pricing model: Recurring
4. Price: 112.50 EUR
5. Billing period: Monthly
6. Add a free trial: YES → Trial period: 30 days
7. Click "Save product"
8. COPIA el Price ID → STRIPE_PRICE_PLANNER_PACK15_MONTHLY
```

**Versión Anual (1.147,50 EUR)**
```
1. Add another price al producto "Planner Pack 15"
2. Pricing model: One-time
3. Price: 1147.50 EUR
4. Description: Pago anual (15% descuento)
5. Click "Save price"
6. COPIA el Price ID → STRIPE_PRICE_PLANNER_PACK15_ANNUAL
```

#### Teams 40

**Versión Mensual (266,67 EUR/mes)**
```
1. Product name: Teams 40 - MaLoveApp
2. Description: 40 bodas activas por año + equipo
3. Pricing model: Recurring
4. Price: 266.67 EUR
5. Billing period: Monthly
6. Add a free trial: YES → Trial period: 30 days
7. Click "Save product"
8. COPIA el Price ID → STRIPE_PRICE_TEAMS40_MONTHLY
```

**Versión Anual (2.720 EUR)**
```
1. Add another price al producto "Teams 40"
2. Pricing model: One-time
3. Price: 2720 EUR
4. Description: Pago anual (15% descuento)
5. Click "Save price"
6. COPIA el Price ID → STRIPE_PRICE_TEAMS40_ANNUAL
```

#### Teams Ilimitado

**Versión Mensual (416,67 EUR/mes)**
```
1. Product name: Teams Ilimitado - MaLoveApp
2. Description: Bodas y perfiles ilimitados con white-label
3. Pricing model: Recurring
4. Price: 416.67 EUR
5. Billing period: Monthly
6. Add a free trial: YES → Trial period: 30 days
7. Click "Save product"
8. COPIA el Price ID → STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY
```

**Versión Anual (4.250 EUR)**
```
1. Add another price al producto "Teams Ilimitado"
2. Pricing model: One-time
3. Price: 4250 EUR
4. Description: Pago anual (15% descuento)
5. Click "Save price"
6. COPIA el Price ID → STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL
```

---

### 3.3. Resumen de Productos a Crear

| Producto | Tipo | Precio | Price ID a copiar |
|----------|------|--------|-------------------|
| **Wedding Pass** | One-time | 50 EUR | `STRIPE_PRICE_WEDDING_PASS` |
| **Wedding Pass Plus** | One-time | 85 EUR | `STRIPE_PRICE_WEDDING_PASS_PLUS` |
| **Planner Pack 5 (Mensual)** | Recurring | 41,67 EUR/mes + trial 30d | `STRIPE_PRICE_PLANNER_PACK5_MONTHLY` |
| **Planner Pack 5 (Anual)** | One-time | 425 EUR | `STRIPE_PRICE_PLANNER_PACK5_ANNUAL` |
| **Planner Pack 15 (Mensual)** | Recurring | 112,50 EUR/mes + trial 30d | `STRIPE_PRICE_PLANNER_PACK15_MONTHLY` |
| **Planner Pack 15 (Anual)** | One-time | 1.147,50 EUR | `STRIPE_PRICE_PLANNER_PACK15_ANNUAL` |
| **Teams 40 (Mensual)** | Recurring | 266,67 EUR/mes + trial 30d | `STRIPE_PRICE_TEAMS40_MONTHLY` |
| **Teams 40 (Anual)** | One-time | 2.720 EUR | `STRIPE_PRICE_TEAMS40_ANNUAL` |
| **Teams Ilimitado (Mensual)** | Recurring | 416,67 EUR/mes + trial 30d | `STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY` |
| **Teams Ilimitado (Anual)** | One-time | 4.250 EUR | `STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL` |

**Total:** 10 Price IDs a configurar (2 para parejas + 8 para planners)

---

## 4. Configurar Webhook

### 4.1. Crear Endpoint

1. Ve a [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click en "Add endpoint"
3. Endpoint URL:
   - **Desarrollo local:** `https://tu-ngrok-url.ngrok.io/api/stripe/webhook`
   - **Producción:** `https://tu-dominio.com/api/stripe/webhook`

### 4.2. Eventos a Escuchar

Selecciona estos eventos:

```
✓ checkout.session.completed
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ customer.subscription.trial_will_end
✓ invoice.payment_succeeded
✓ invoice.payment_failed
```

### 4.3. Obtener Signing Secret

1. Después de crear el webhook, haz click en él
2. Ve a la sección "Signing secret"
3. Click en "Reveal"
4. COPIA el secret (comienza con `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### 4.4. Testing Local con Stripe CLI

```bash
# Instalar Stripe CLI
# Windows (con Scoop): scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a tu localhost
stripe listen --forward-to localhost:4004/api/stripe/webhook

# El CLI te dará un webhook secret temporal: whsec_...
# Úsalo en tu .env para pruebas locales
```

---

## 5. Variables de Entorno

### backend/.env

```bash
# Claves de API
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs - Parejas (pago único)
STRIPE_PRICE_WEDDING_PASS=price_1...
STRIPE_PRICE_WEDDING_PASS_PLUS=price_1...
STRIPE_PRICE_POST_WEDDING_EXTENSION=price_1...

# Price IDs - Planners (mensual con trial)
STRIPE_PRICE_PLANNER_PACK5_MONTHLY=price_1...
STRIPE_PRICE_PLANNER_PACK15_MONTHLY=price_1...
STRIPE_PRICE_TEAMS40_MONTHLY=price_1...
STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY=price_1...

# Price IDs - Planners (anual con descuento)
STRIPE_PRICE_PLANNER_PACK5_ANNUAL=price_1...
STRIPE_PRICE_PLANNER_PACK15_ANNUAL=price_1...
STRIPE_PRICE_TEAMS40_ANNUAL=price_1...
STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL=price_1...
```

### .env (frontend)

```bash
# Clave pública para Stripe.js (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

---

## 6. Pruebas

### 6.1. Verificar Configuración

```bash
# Verificar que las claves están configuradas
curl http://localhost:4004/api/stripe/test
```

Respuesta esperada:
```json
{
  "status": "configured",
  "configured": {
    "webhookSecret": true,
    "secretKey": true,
    "publishableKey": true
  }
}
```

### 6.2. Tarjetas de Prueba

Usa estas tarjetas en modo test:

| Tipo | Número | Resultado |
|------|--------|-----------|
| Éxito | `4242 4242 4242 4242` | Pago exitoso |
| Rechazado | `4000 0000 0000 0002` | Pago rechazado |
| SCA requerido | `4000 0025 0000 3155` | Requiere autenticación 3D Secure |
| Insuficientes fondos | `4000 0000 0000 9995` | Fondos insuficientes |

**Datos adicionales:**
- Fecha de expiración: Cualquier fecha futura (ej: 12/30)
- CVC: Cualquier 3 dígitos (ej: 123)
- ZIP: Cualquier código postal válido

---

## 7. Producción

### 7.1. Activar Cuenta

1. Completa el formulario de activación en Stripe
2. Proporciona:
   - Información de la empresa
   - Datos fiscales
   - Cuenta bancaria para recibir pagos

### 7.2. Cambiar a Claves Live

1. Obtén las claves live de [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. **Recrea todos los productos** en modo live (los de test no se transfieren)
3. Actualiza el webhook con la URL de producción
4. Actualiza las variables de entorno en tu servidor

---

## 8. Checklist de Implementación

### Desarrollo

- [ ] Cuenta de Stripe creada
- [ ] Claves de test copiadas al .env
- [ ] 2 productos de parejas creados (Wedding Pass, Plus)
- [ ] 4 packs de planners creados (Pack 5, Pack 15, Teams 40, Unlimited)
- [ ] 8 Price IDs de planners copiados (4 monthly + 4 annual)
- [ ] Webhook configurado (Stripe CLI o ngrok)
- [ ] Webhook secret copiado al .env
- [ ] Backend reiniciado
- [ ] Endpoint `/api/stripe/test` devuelve "configured"
- [ ] Test de checkout completado con tarjeta 4242...
- [ ] Pago visible en Firestore (`weddingLicenses` o `plannerPacks`)

### Producción

- [ ] Cuenta de Stripe activada
- [ ] Datos fiscales completados
- [ ] Cuenta bancaria vinculada
- [ ] 11 productos recreados en modo live
- [ ] Price IDs live copiados
- [ ] Webhook de producción configurado
- [ ] Variables de entorno actualizadas en servidor
- [ ] Test de pago real completado
- [ ] Monitoreo configurado

---

## 9. Recursos

- **Documentación de Stripe:** [https://stripe.com/docs](https://stripe.com/docs)
- **API Reference:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Webhooks Guide:** [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Testing Guide:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Dashboard:** [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
- **Stripe CLI:** [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Documento de referencia:** `docs/planes-suscripcion.md`

---

**🎉 ¡Listo! Tu integración de Stripe con el modelo de licencias por boda está completa.**
