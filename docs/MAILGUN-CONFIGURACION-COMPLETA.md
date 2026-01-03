# 📧 CONFIGURACIÓN COMPLETA DE MAILGUN

## 🎯 **ESTADO ACTUAL**

✅ **Backend configurado y funcionando**
- Webhook de recepción: `/api/inbound/mailgun`
- Envío de emails: Implementado con Mailgun API
- Soporte para `maLoveEmail`, `myWed360Email` y `email`
- Guardado en subcolecciones de usuarios

---

## 🔧 **CONFIGURACIÓN REQUERIDA EN MAILGUN**

### **1. Obtener Credenciales**

Mailgun dashboard: https://app.mailgun.com/

#### **Credenciales necesarias:**
```bash
MAILGUN_API_KEY=tu-api-key-aqui
MAILGUN_DOMAIN=malove.app
MAILGUN_SIGNING_KEY=tu-signing-key-aqui
```

---

### **2. Configurar Dominio en Mailgun**

#### **2.1 Agregar Dominio**
1. Ve a **Sending** → **Domains**
2. Click **Add New Domain**
3. Ingresa: `malove.app`
4. Tipo: **Sending Domain**

#### **2.2 Verificar Registros DNS**

Debes agregar estos registros en tu proveedor DNS:

```dns
# SPF Record
TXT @ "v=spf1 include:mailgun.org ~all"

# DKIM Record  
TXT k1._domainkey.[tu-subdomain].mailgun.org
Valor: (proporcionado por Mailgun)

# Tracking Record (opcional)
CNAME email.malove.app [tracking-subdomain].mailgun.org

# MX Records (para recepción)
MX @ mxa.mailgun.org (Priority: 10)
MX @ mxb.mailgun.org (Priority: 10)
```

---

### **3. Configurar Webhooks**

#### **3.1 URL del Webhook**
```
https://MaLove.App-backend.onrender.com/api/inbound/mailgun
```

#### **3.2 Eventos a Suscribir**

En Mailgun dashboard → **Sending** → **Webhooks**:

1. **Delivered** (Opcional - para tracking)
2. **Opened** (Opcional - para tracking)
3. **Clicked** (Opcional - para tracking)
4. **Permanent Failure** (Recomendado)
5. **Temporary Failure** (Recomendado)

---

### **4. Configurar Rutas de Entrada (Routes)**

Para que los emails recibidos lleguen a tu aplicación:

#### **4.1 Crear Ruta en Mailgun**

Dashboard → **Receiving** → **Routes** → **Create Route**

```javascript
// Match Expression
match_recipient(".*@malove.app")

// Actions
forward("https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
store(notify="https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
```

#### **4.2 Ruta Específica para Usuario**

Para `dani@malove.app`:

```javascript
// Match Expression
match_recipient("dani@malove.app")

// Actions
forward("https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
```

---

## 🚀 **VARIABLES DE ENTORNO**

### **Backend (.env)**

```bash
# Mailgun Configuration
MAILGUN_API_KEY=tu-api-key-aqui
MAILGUN_DOMAIN=malove.app
MAILGUN_EU_REGION=true
MAILGUN_SIGNING_KEY=tu-signing-key-aqui
MAILGUN_WEBHOOK_SIGNING_KEY=tu-signing-key-aqui

# Optional: Mailgun webhook IP allowlist (comma separated)
MAILGUN_WEBHOOK_IP_ALLOWLIST=

# Optional: Rate limit for webhooks
MAILGUN_WEBHOOK_RATE_LIMIT_MAX=100
```

### **Frontend (.env)**

```bash
VITE_MAILGUN_DOMAIN=malove.app
VITE_USE_MAILGUN=true
VITE_USE_EMAIL_BACKEND=true
VITE_MAX_ATTACHMENT_SIZE_MB=15
```

---

## 📊 **FLUJO COMPLETO DE EMAIL**

### **Envío de Email**

```
1. Usuario → Composer (Frontend)
2. EmailService.sendEmail() → POST /api/mail (Backend)
3. mailSendService.sendMailAndPersist()
   ├─ Envía vía Mailgun API
   ├─ Guarda en collection('mails')
   ├─ Guarda en users/{uid}/mails (remitente)
   └─ Guarda en users/{recipientUid}/mails (destinatario)
4. Respuesta 201 Created → Frontend
5. Email aparece en "Enviados"
```

### **Recepción de Email**

```
1. Email llega a Mailgun
2. Mailgun ejecuta Route → POST /api/inbound/mailgun
3. Backend verifica firma HMAC
4. Guarda email en:
   ├─ collection('mails') folder='inbox'
   ├─ users/{recipientUid}/mails folder='inbox'
   └─ Análisis IA (opcional)
5. Frontend (realtime listener) → Email aparece en "Recibidos"
```

---

## 🧪 **TESTING**

### **1. Test de Envío**

```bash
# Desde la app, enviar email a tu correo personal
Para: danielnavarrocampos@icloud.com
Asunto: Test de envío
Cuerpo: Esto es una prueba
```

**Verificación:**
- ✅ Email aparece en "Enviados" de la app
- ✅ Email llega a tu buzón de iCloud
- ✅ Backend log: `[mailSendService] Email sent successfully`

### **2. Test de Recepción**

```bash
# Enviar email desde tu correo personal
Para: dani@malove.app
Asunto: Test de recepción
Cuerpo: Email entrante de prueba
```

**Verificación:**
- ✅ Mailgun recibe el email
- ✅ Webhook se ejecuta en `/api/inbound/mailgun`
- ✅ Email aparece en "Recibidos" de la app
- ✅ Backend log: `Correo entrante guardado en Firestore`

### **3. Test Completo (Email a ti mismo)**

```bash
# Desde la app, enviar email a tu propia dirección MaLoveApp
Para: dani@malove.app
Asunto: Test completo
Cuerpo: Email a mí mismo
```

**Verificación:**
- ✅ Email aparece en "Enviados"
- ✅ Mailgun procesa el envío
- ✅ Mailgun ejecuta route de recepción
- ✅ Email aparece en "Recibidos"

---

## 🐛 **TROUBLESHOOTING**

### **Error: Email no llega**

**Causas posibles:**
1. Registros DNS no verificados
2. Dominio no activado en Mailgun
3. API Key incorrecta
4. Región incorrecta (EU vs US)

**Solución:**
```bash
# Verificar logs del backend
tail -f logs/backend.log | grep mailSendService

# Verificar en Mailgun Dashboard → Logs
```

### **Error: Email enviado pero no recibido en app**

**Causas posibles:**
1. Routes no configuradas en Mailgun
2. Webhook URL incorrecta
3. Firma de webhook inválida

**Solución:**
```bash
# Verificar webhook en backend
tail -f logs/backend.log | grep mailgun-inbound

# Test manual del webhook
curl -X POST https://MaLove.App-backend.onrender.com/api/inbound/mailgun \
  -F sender="test@example.com" \
  -F recipient="dani@malove.app" \
  -F subject="Test" \
  -F body-plain="Test body"
```

### **Error 401: Unauthorized**

**Causa:** Token de Firebase no enviado o inválido

**Solución:**
1. Verificar que `emailService.js` usa `auth: true`
2. Refrescar el token: `firebase.auth().currentUser.getIdToken(true)`
3. Verificar en consola: `localStorage.getItem('mw360_auth_token')`

### **Error 500: Templates**

**Causa:** Índice compuesto faltante en Firestore

**Solución:** ✅ Ya corregido - ahora filtra en memoria

---

## 📝 **CHECKLIST DE CONFIGURACIÓN**

- [ ] **Mailgun Account**
  - [ ] Cuenta creada
  - [ ] Dominio `malove.app` agregado
  - [ ] API Key obtenida
  - [ ] Signing Key obtenida

- [ ] **DNS Records**
  - [ ] SPF record agregado
  - [ ] DKIM record agregado
  - [ ] MX records agregados
  - [ ] Dominio verificado en Mailgun

- [ ] **Webhooks**
  - [ ] Webhook creado para `/api/inbound/mailgun`
  - [ ] Eventos suscritos
  - [ ] Signing key configurada

- [ ] **Routes**
  - [ ] Ruta creada para `*@malove.app`
  - [ ] Forward action configurada
  - [ ] Ruta activada

- [ ] **Variables de Entorno**
  - [ ] Backend `.env` actualizado
  - [ ] Frontend `.env` actualizado
  - [ ] Backend reiniciado
  - [ ] Frontend reconstruido

- [ ] **Testing**
  - [ ] Test de envío exitoso
  - [ ] Test de recepción exitoso
  - [ ] Test completo (email a ti mismo) exitoso

---

## 🎓 **RECURSOS ADICIONALES**

- **Mailgun Docs:** https://documentation.mailgun.com/
- **Mailgun Routes:** https://documentation.mailgun.com/en/latest/user_manual.html#routes
- **Mailgun Webhooks:** https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
- **DNS Configuration:** https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain

---

## 🆘 **SOPORTE**

Si encuentras problemas:

1. **Logs del Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Logs de Mailgun:**
   - Dashboard → Logs
   - Busca el email por destinatario o MessageID

3. **Test de Conectividad:**
   ```bash
   curl -v https://MaLove.App-backend.onrender.com/api/inbound/mailgun
   ```

---

**Última actualización:** 2025-10-23  
**Versión:** 1.0.0  
**Estado:** ✅ Configuración Completa
