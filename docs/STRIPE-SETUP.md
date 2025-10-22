# Configuración de Stripe para MyWed360

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

1. Registrate en [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
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

### 3.1. Planes para Parejas

#### Plan Anual (35 EUR/año)
```
1. Ve a https://dashboard.stripe.com/test/products/create
2. Product name: Anual - MyWed360
3. Description: Plan anual para parejas con funcionalidades completas
4. Pricing model: Recurring
5. Price: 35 EUR
6. Billing period: Yearly
7. Click "Save product"
8. COPIA el Price ID (empieza con price_) → STRIPE_PRICE_COUPLE_ANNUAL
```

#### Plan Plus (55 EUR/año)
```
1. Product name: Plus - MyWed360
2. Description: Plan premium sin marca y con ayudante
3. Pricing model: Recurring
4. Price: 55 EUR
5. Billing period: Yearly
6. Click "Save product"
7. COPIA el Price ID → STRIPE_PRICE_COUPLE_PLUS
```

#### Boda Plus (20 EUR pago único)
```
1. Product name: Boda Plus - MyWed360
2. Description: Elimina marca MyWed360 de un evento específico
3. Pricing model: One-time
4. Price: 20 EUR
5. Click "Save product"
6. COPIA el Price ID → STRIPE_PRICE_EVENT_PLUS
```

### 3.2. Planes para Wedding Planners

#### Wedding Planner 1 (120 EUR/año)
```
1. Product name: Wedding Planner 1 - MyWed360
2. Description: Hasta 5 bodas simultáneas
3. Pricing model: Recurring
4. Price: 120 EUR
5. Billing period: Yearly
6. Click "Save product"
7. COPIA el Price ID → STRIPE_PRICE_PLANNER_1
```

#### Wedding Planner 2 (200 EUR/año)
```
1. Product name: Wedding Planner 2 - MyWed360
2. Description: Hasta 10 bodas simultáneas
3. Pricing model: Recurring
4. Price: 200 EUR
5. Billing period: Yearly
6. Click "Save product"
7. COPIA el Price ID → STRIPE_PRICE_PLANNER_2
```

#### Teams Wedding Planner (800 EUR/año)
```
1. Product name: Teams Wedding Planner - MyWed360
2. Description: Hasta 40 bodas anuales con equipo
3. Pricing model: Recurring
4. Price: 800 EUR
5. Billing period: Yearly
6. Click "Save product"
7. COPIA el Price ID → STRIPE_PRICE_PLANNER_TEAMS
```

#### Teams Wedding Planner Ilimitado (1500 EUR/año)
```
1. Product name: Teams Wedding Planner Ilimitado - MyWed360
2. Description: Bodas ilimitadas, perfiles ilimitados, white-label completo
3. Pricing model: Recurring
4. Price: 1500 EUR
5. Billing period: Yearly
6. Click "Save product"
7. COPIA el Price ID → STRIPE_PRICE_PLANNER_UNLIMITED
```

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

# Price IDs (copia desde el dashboard)
STRIPE_PRICE_COUPLE_ANNUAL=price_1...
STRIPE_PRICE_COUPLE_PLUS=price_1...
STRIPE_PRICE_EVENT_PLUS=price_1...
STRIPE_PRICE_PLANNER_1=price_1...
STRIPE_PRICE_PLANNER_2=price_1...
STRIPE_PRICE_PLANNER_TEAMS=price_1...
STRIPE_PRICE_PLANNER_UNLIMITED=price_1...
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
- Fecha de expiración: Cualquier fecha futura (ej: 12/25)
- CVC: Cualquier 3 dígitos (ej: 123)
- ZIP: Cualquier código postal válido

### 6.3. Flujo de Prueba Completo

1. **Crear checkout:**
   ```bash
   curl -X POST http://localhost:4004/api/stripe/create-checkout-session \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "productId": "couple_annual",
       "successUrl": "http://localhost:5173/success",
       "cancelUrl": "http://localhost:5173/cancel"
     }'
   ```

2. **Completar pago:**
   - Abre la URL devuelta en `session.url`
   - Usa la tarjeta de prueba `4242 4242 4242 4242`
   - Completa el pago

3. **Verificar webhook:**
   - El webhook debería recibir `checkout.session.completed`
   - El pago se guarda en Firestore → `payments/`
   - El usuario se actualiza con la suscripción

4. **Verificar en la base de datos:**
   ```javascript
   // En Firebase Console → Firestore
   users/{userId}/subscription → Debe tener productId, subscriptionId, status
   payments/ → Debe haber un documento con el pago
   ```

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
4. Actualiza las variables de entorno en tu servidor:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # (el de producción)
STRIPE_PRICE_COUPLE_ANNUAL=price_... # (price IDs de producción)
# ... todos los demás price IDs
```

### 7.3. Variables de Entorno en Render

Si usas Render para el backend:

1. Ve a tu servicio → Environment
2. Añade las variables una por una:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   # ... price IDs
   ```
3. Click "Save Changes"
4. El servicio se redesplegará automáticamente

### 7.4. Monitoreo

- Dashboard de pagos: [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- Webhooks logs: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- Métricas: [https://dashboard.stripe.com/dashboard](https://dashboard.stripe.com/dashboard)

---

## 8. Endpoints Disponibles

### Backend API

```
POST   /api/stripe/create-checkout-session    # Crear sesión de pago
POST   /api/stripe/create-portal-session      # Portal de cliente
GET    /api/stripe/subscription                # Obtener suscripción del usuario
POST   /api/stripe/cancel-subscription         # Cancelar suscripción
GET    /api/stripe/products/:type              # Listar productos (couples/planners)
POST   /api/stripe/webhook                     # Webhook de Stripe (interno)
GET    /api/stripe/test                        # Verificar configuración
```

### Frontend (a implementar)

```
/pricing                  # Página de planes
/checkout/:productId      # Proceso de checkout
/subscription/success     # Pago exitoso
/subscription/cancel      # Pago cancelado
/account/subscription     # Gestión de suscripción
```

---

## 9. Troubleshooting

### Error: "No such price"

**Causa:** El Price ID en el .env no existe o es de otro modo (test/live).

**Solución:**
1. Verifica que estás en el modo correcto (test/live)
2. Ve al dashboard de productos y copia el Price ID correcto
3. Actualiza el .env y reinicia el backend

### Error: "No signatures found matching the expected signature"

**Causa:** El webhook secret es incorrecto o el request no viene de Stripe.

**Solución:**
1. Verifica que `STRIPE_WEBHOOK_SECRET` esté correctamente configurado
2. Si usas Stripe CLI, usa el secret que te da el comando `stripe listen`
3. Si usas ngrok, asegúrate de que la URL del webhook apunte a tu ngrok URL

### Webhook no recibe eventos

**Causa:** El webhook no está configurado o la URL es incorrecta.

**Solución:**
1. Verifica que el webhook esté activo en el dashboard
2. Comprueba los logs del webhook en Stripe Dashboard
3. Si usas localhost, usa Stripe CLI o ngrok
4. Verifica que el endpoint esté accesible:
   ```bash
   curl -X POST https://tu-url/api/stripe/webhook
   ```

### Pagos no aparecen en Firestore

**Causa:** El webhook no procesa correctamente o hay un error en el código.

**Solución:**
1. Revisa los logs del backend:
   ```bash
   # Busca errores de stripe-webhook
   tail -f logs/app.log | grep stripe
   ```
2. Verifica que el metadata del checkout incluya `userId` y `productId`
3. Comprueba los permisos de Firestore

---

## 10. Recursos

- **Documentación de Stripe:** [https://stripe.com/docs](https://stripe.com/docs)
- **API Reference:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Webhooks Guide:** [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Testing Guide:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Dashboard:** [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
- **Stripe CLI:** [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

---

## 11. Checklist de Implementación

### Desarrollo

- [ ] Cuenta de Stripe creada
- [ ] Claves de test copiadas
- [ ] 7 productos creados en modo test
- [ ] Price IDs copiados al .env
- [ ] Webhook configurado (Stripe CLI o ngrok)
- [ ] Webhook secret copiado al .env
- [ ] Backend reiniciado
- [ ] Test de checkout completado exitosamente
- [ ] Pago visible en Firestore
- [ ] Usuario actualizado con suscripción

### Producción

- [ ] Cuenta de Stripe activada
- [ ] Datos fiscales completados
- [ ] Cuenta bancaria vinculada
- [ ] 7 productos recreados en modo live
- [ ] Price IDs live copiados
- [ ] Webhook de producción configurado
- [ ] Variables de entorno actualizadas en servidor
- [ ] Test de pago real completado
- [ ] Monitoreo configurado
- [ ] Emails de confirmación funcionando

---

**🎉 ¡Listo! Tu integración de Stripe está completa.**

Para cualquier duda, revisa la [documentación oficial de Stripe](https://stripe.com/docs) o abre un issue en el repositorio.
