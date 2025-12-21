# 📥 Configurar Emails Entrantes (Webhooks Mailgun)

## Estado actual

✅ **DNS configurado** (MX, SPF, DKIM)  
✅ **Envío de emails funciona** (Mailgun API)  
❌ **Recepción de emails NO funciona** - Falta configurar webhook

---

## ¿Por qué no recibes emails?

Mailgun recibe tus emails correctamente (DNS configurado), pero **no los envía al backend** porque:

1. El webhook **no está configurado** en Mailgun Dashboard
2. O apunta a una URL incorrecta

---

## Configuración paso a paso

### 1. Ve a Mailgun Dashboard

https://app.mailgun.com/

### 2. Selecciona tu dominio

- Haz click en **"Sending"** → **"Domains"**
- Selecciona: **mg.malove.app**

### 3. Ve a la sección "Webhooks"

- En el menú lateral: **Webhooks**

### 4. Configura el webhook "incoming"

- Event: **"Incoming Messages"** o **"Store"**
- URL: **`https://tu-dominio-backend.com/api/inbound/mailgun`**
  
  **Ejemplos**:
  - Producción: `https://api.malove.app/api/inbound/mailgun`
  - Desarrollo local: `https://tu-ngrok-url.ngrok.io/api/inbound/mailgun`

### 5. Guarda y prueba

- Click en **"Test Webhook"** para verificar
- Mailgun enviará un email de prueba

---

## Desarrollo local (ngrok)

Si quieres probar en local:

```bash
# Instalar ngrok
brew install ngrok

# Exponer puerto 4004
ngrok http 4004

# Usar la URL que te da (ejemplo):
# https://abc123.ngrok.io/api/inbound/mailgun
```

---

## Verificar que funciona

1. **Envía un email** desde tu correo personal a: `tuusuario@mg.malove.app`
2. **Revisa los logs** del backend (deberías ver el webhook entrante)
3. **Recarga tu buzón** en la app - el email debe aparecer en bandeja de entrada

---

## Logs esperados

Cuando funcione correctamente:

```
POST /api/inbound/mailgun
✅ Webhook Mailgun verificado
💾 Email guardado: de sender@example.com para tuusuario@mg.malove.app
```

---

## Alternativa: Route en Mailgun

También puedes crear una **Route** en Mailgun:

1. Ve a **"Sending"** → **"Routes"**
2. Click **"Create Route"**
3. Expresión: `match_recipient(".*@mg.malove.app")`
4. Acción: `forward("https://tu-backend.com/api/inbound/mailgun")`
5. Priority: 0

---

## ¿No tienes dominio público?

Para desarrollo, puedes:

1. **Usar ngrok** (exponer local temporalmente)
2. **Desplegar backend** en Render/Railway/Heroku
3. **Usar Mailgun API directamente** para consultar emails recibidos
