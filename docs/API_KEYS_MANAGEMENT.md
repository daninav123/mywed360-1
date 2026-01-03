# 🔐 Gestión de API Keys - MaLoveApp

**Fecha:** 12 de Diciembre de 2025  
**Versión:** 1.0  
**Estado:** Documentación de mejores prácticas

---

## 📋 Tabla de API Keys en Uso

| Servicio      | Variable                 | Estado            | Renovación | Contacto                                           |
| ------------- | ------------------------ | ----------------- | ---------- | -------------------------------------------------- |
| OpenAI        | `OPENAI_API_KEY`         | ❌ EXPIRADA       | Urgente    | [platform.openai.com](https://platform.openai.com) |
| Tavily        | `TAVILY_API_KEY`         | ⚠️ NO CONFIGURADA | Urgente    | [tavily.com](https://tavily.com)                   |
| Stripe        | `STRIPE_SECRET_KEY`      | ✅ Activa         | Revisar    | [stripe.com](https://stripe.com)                   |
| Stripe        | `STRIPE_PUBLISHABLE_KEY` | ✅ Activa         | Revisar    | [stripe.com](https://stripe.com)                   |
| Mailgun       | `MAILGUN_API_KEY`        | ✅ Activa         | Revisar    | [mailgun.com](https://mailgun.com)                 |
| Firebase      | `FIREBASE_API_KEY`       | ✅ Activa         | Revisar    | Firebase Console                                   |
| Twilio        | `TWILIO_AUTH_TOKEN`      | ✅ Activa         | Revisar    | [twilio.com](https://twilio.com)                   |
| Google Places | `GOOGLE_PLACES_API_KEY`  | ✅ Activa         | Revisar    | Google Cloud Console                               |

---

## 🚨 Errores Actuales

### OpenAI API Key - CRÍTICO

```
Error: 401 Incorrect API key provided: sk-proj-****...
Timestamp: 2025-12-12 00:21:53
Impact: Funcionalidades de IA no operativas
```

**Solución:**

1. Ir a [platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
2. Crear nueva API key
3. Reemplazar en `.env` y variables de entorno
4. Reiniciar servicios

### Tavily API Key - CRÍTICO

```
Warning: Tavily API key missing, returning empty research payload
Timestamp: 2025-12-12 00:21:53
Impact: Búsqueda de investigación no disponible
```

**Solución:**

1. Registrarse en [tavily.com](https://tavily.com)
2. Crear API key
3. Agregar a `.env` como `TAVILY_API_KEY`
4. Reiniciar servicios

---

## 📝 Archivos de Configuración

### `.env` (Local)

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Tavily
TAVILY_API_KEY=your_tavily_key_here

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Mailgun
MAILGUN_API_KEY=your_mailgun_key_here
MAILGUN_DOMAIN=your_domain.mailgun.org

# Firebase
FIREBASE_API_KEY=your_firebase_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Places
GOOGLE_PLACES_API_KEY=your_google_places_key
```

### `.env.example` (Plantilla)

```bash
# OpenAI - https://platform.openai.com/account/api-keys
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Tavily - https://tavily.com
TAVILY_API_KEY=your_tavily_key_here

# Stripe - https://stripe.com
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Mailgun - https://mailgun.com
MAILGUN_API_KEY=your_mailgun_key_here
MAILGUN_DOMAIN=your_domain.mailgun.org

# Firebase - https://console.firebase.google.com
FIREBASE_API_KEY=your_firebase_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Twilio - https://www.twilio.com/console
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Places - https://console.cloud.google.com
GOOGLE_PLACES_API_KEY=your_google_places_key
```

---

## 🔄 Proceso de Renovación

### Paso 1: Verificar Expiración

```bash
# Script para verificar estado de keys
node scripts/check-api-keys-status.js
```

### Paso 2: Generar Nueva Key

- Ir al panel de administración del servicio
- Crear nueva API key
- Copiar la key completa

### Paso 3: Actualizar Configuración

```bash
# Actualizar .env local
echo "OPENAI_API_KEY=sk-proj-NEW_KEY" >> .env

# Actualizar variables de entorno en producción
# (Depende del hosting: Vercel, Render, Firebase, etc.)
```

### Paso 4: Reiniciar Servicios

```bash
# Backend
npm run backend

# Frontend
npm run dev:main

# Todos
npm run dev:all
```

### Paso 5: Verificar Funcionamiento

```bash
# Tests de integración
npm run test:ai-suppliers
npm run test:webhook

# Logs
tail -f logs/combined-*.log
```

---

## 🛡️ Mejores Prácticas de Seguridad

### 1. **Nunca Commitear Keys**

```bash
# ✅ Correcto - .gitignore
.env
.env.local
.env.*.local

# ❌ Incorrecto - Nunca hacer esto
git add .env
git commit -m "Add API keys"
```

### 2. **Usar Variables de Entorno**

```javascript
// ✅ Correcto
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Incorrecto
const apiKey = 'sk-proj-hardcoded-key';
```

### 3. **Rotar Keys Regularmente**

- OpenAI: Cada 90 días
- Stripe: Cada 180 días
- Otros: Cada 180 días
- En caso de leak: Inmediatamente

### 4. **Usar Secrets Manager**

```javascript
// Ejemplo con Google Secret Manager
const secretManager = require('@google-cloud/secret-manager');

async function getSecret(secretId) {
  const [version] = await secretManager.secretManagerServiceClient().accessSecretVersion({
    name: `projects/PROJECT_ID/secrets/${secretId}/versions/latest`,
  });

  return version.payload.data.toString('utf8');
}
```

### 5. **Monitorizar Uso**

```bash
# Verificar uso de OpenAI
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Verificar uso de Stripe
curl https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

---

## 📊 Dashboard de Monitorización

### Crear alertas para:

- ❌ Keys expiradas
- ⚠️ Uso anómalo
- 🔴 Errores de autenticación
- 📈 Límites de cuota alcanzados

### Implementar en `backend/services/KeyMonitorService.js`:

```javascript
class KeyMonitorService {
  async checkKeyStatus() {
    // Verificar cada key
    // Alertar si está próxima a expirar
    // Registrar en logs
  }

  async monitorUsage() {
    // Monitorizar uso de cada servicio
    // Alertar si se alcanza límite
  }

  async validateKeys() {
    // Hacer request de prueba a cada servicio
    // Verificar que la key es válida
  }
}
```

---

## 🔔 Alertas Automáticas

### Configurar en `backend/middleware/keyAlerts.js`:

```javascript
// Alertar si key está próxima a expirar
if (daysUntilExpiry < 30) {
  logger.warn(`API Key ${service} expira en ${daysUntilExpiry} días`);
  // Enviar email de alerta
}

// Alertar si hay errores de autenticación
if (error.code === 401) {
  logger.error(`API Key ${service} inválida o expirada`);
  // Enviar alerta crítica
}
```

---

## 📋 Checklist de Renovación

- [ ] Verificar estado actual de todas las keys
- [ ] Renovar OpenAI API key
- [ ] Configurar Tavily API key
- [ ] Actualizar `.env` local
- [ ] Actualizar variables en producción
- [ ] Reiniciar servicios
- [ ] Ejecutar tests de integración
- [ ] Verificar logs
- [ ] Documentar cambios
- [ ] Crear reminder para próxima renovación

---

## 📞 Contactos de Soporte

| Servicio | Soporte                                                            | Documentación                                                |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| OpenAI   | [support.openai.com](https://support.openai.com)                   | [platform.openai.com/docs](https://platform.openai.com/docs) |
| Tavily   | [tavily.com/contact](https://tavily.com/contact)                   | [docs.tavily.com](https://docs.tavily.com)                   |
| Stripe   | [stripe.com/support](https://stripe.com/support)                   | [stripe.com/docs](https://stripe.com/docs)                   |
| Firebase | [firebase.google.com/support](https://firebase.google.com/support) | [firebase.google.com/docs](https://firebase.google.com/docs) |
| Twilio   | [twilio.com/help](https://twilio.com/help)                         | [twilio.com/docs](https://twilio.com/docs)                   |

---

**Generado:** 2025-12-12 18:20 UTC+01:00  
**Rama:** dev-improvements-dec-2025  
**Estado:** Documentación activa
