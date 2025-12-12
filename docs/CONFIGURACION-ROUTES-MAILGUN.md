# 🔧 CONFIGURACIÓN DE ROUTES EN MAILGUN

## 📋 **TU CONFIGURACIÓN ACTUAL**

✅ **Variables de Entorno Configuradas:**
- `MAILGUN_API_KEY`: `4886ef...52183` ✅
- `MAILGUN_DOMAIN`: `malove.app` ✅
- `MAILGUN_SIGNING_KEY`: `61bd6a...2aa4e6a` ✅
- `MAILGUN_EU_REGION`: `true` ✅

---

## ⚠️ **LO QUE FALTA: Routes en Mailgun Dashboard**

Para que los emails recibidos en `@malove.app` lleguen a tu aplicación, necesitas configurar **Routes** en Mailgun.

---

## 🚀 **CONFIGURACIÓN PASO A PASO (5 minutos)**

### **Paso 1: Accede a Mailgun Dashboard**

1. Ve a: https://app.mailgun.com/
2. Login con tus credenciales
3. Ve a **Receiving** → **Routes**

---

### **Paso 2: Crear Route Principal**

Click en **Create Route** y configura:

#### **Route 1: Todos los emails de malove.app**

```
Priority: 0
Description: Forward all emails to backend

Expression Type: Match Recipient
Match Recipient: match_recipient(".*@malove.app")

Actions:
✓ forward("https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
✓ store(notify="https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
✓ stop()
```

**Copiar y pegar en "Actions":**
```
forward("https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
store(notify="https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
stop()
```

Click **Create Route**

---

### **Paso 3: Crear Route para tu Usuario Específico (Opcional)**

Si quieres una ruta específica para `dani@malove.app`:

#### **Route 2: Email específico para dani**

```
Priority: 1 (más alta = se evalúa primero)
Description: Forward dani@malove.app emails

Expression Type: Match Recipient
Match Recipient: match_recipient("dani@malove.app")

Actions:
✓ forward("https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
✓ store(notify="https://MaLove.App-backend.onrender.com/api/inbound/mailgun")
✓ stop()
```

Click **Create Route**

---

### **Paso 4: Verificar Configuración DNS**

Para que Mailgun pueda recibir emails, necesitas tener configurados los **MX Records**:

1. Ve a **Sending** → **Domains** → `malove.app`
2. Verifica que estén configurados:

```dns
# MX Records (necesarios para RECIBIR emails)
MX @ mxa.mailgun.org (Priority: 10)
MX @ mxb.mailgun.org (Priority: 10)

# SPF Record (necesario para ENVIAR emails)
TXT @ "v=spf1 include:mailgun.org ~all"

# DKIM Record (necesario para ENVIAR emails)
TXT k1._domainkey "k=rsa; p=..."
```

Si no están configurados, cópialos y agrégalos en tu proveedor DNS (GoDaddy, Cloudflare, etc.)

---

## ✅ **VERIFICACIÓN**

### **Test 1: Verificar que la Route se creó**

1. Ve a **Receiving** → **Routes**
2. Deberías ver algo como:

```
Priority 0: match_recipient(".*@malove.app")
Actions: forward, store, stop
Status: Active ✓
```

### **Test 2: Enviar email de prueba**

Desde tu email personal (`danielnavarrocampos@icloud.com`):

```
Para: dani@malove.app
Asunto: Test de recepción
Cuerpo: Probando el sistema de emails
```

**Resultado esperado:**
- Email aparece en la app en "Recibidos"
- Backend log: `Email recibido de Mailgun: dani@malove.app`

### **Test 3: Ver logs en Mailgun**

1. Ve a **Sending** → **Logs**
2. Filtra por: `recipient:dani@malove.app`
3. Deberías ver:
   - Status: `delivered`
   - Event: `accepted`, `delivered`
   - Route: `match_recipient(".*@malove.app")`

---

## 🐛 **TROUBLESHOOTING**

### **Email no llega a la app**

**Causa 1: Route no configurada**
- Solución: Verifica en Mailgun → Receiving → Routes

**Causa 2: MX Records no configurados**
- Solución: Configura MX records en tu DNS

**Causa 3: Backend no recibe webhook**
- Solución: Verifica logs del backend:
  ```bash
  cd backend
  npm run dev
  # Busca: "Email recibido de Mailgun"
  ```

**Causa 4: Firma del webhook inválida**
- Solución: Verifica que `MAILGUN_SIGNING_KEY` sea correcta

### **Email llega a Mailgun pero no se ejecuta la Route**

1. Ve a Mailgun Logs
2. Busca el email por MessageID
3. Verifica que la Route se haya ejecutado
4. Si no se ejecutó, verifica la expresión de match

---

## 📊 **BACKEND URL SEGÚN ENTORNO**

### **Producción (Render)**
```
https://MaLove.App-backend.onrender.com/api/inbound/mailgun
```

### **Desarrollo Local (para testing)**
```
# Necesitas exponer tu localhost con ngrok:
ngrok http 4004

# Usa la URL generada:
https://xxxx-xx-xxx-xxx-xxx.ngrok.io/api/inbound/mailgun
```

---

## 🎯 **ARQUITECTURA DEL FLUJO**

```
Email externo (Gmail, etc.)
    ↓
Mailgun recibe el email (MX records)
    ↓
Evalúa Routes configuradas
    ↓
Match: match_recipient(".*@malove.app")
    ↓
Ejecuta Actions:
  1. forward() → POST https://MaLove.App-backend.onrender.com/api/inbound/mailgun
  2. store() → Guarda en Mailgun (backup)
  3. stop() → No evalúa más routes
    ↓
Backend recibe webhook
    ↓
Verifica firma HMAC-SHA256
    ↓
Guarda en Firestore:
  - collection('mails')
  - users/{uid}/mails
    ↓
Frontend (realtime listener)
    ↓
Email aparece en "Recibidos"
```

---

## 📝 **CHECKLIST FINAL**

- [ ] Route creada en Mailgun Dashboard
- [ ] Expresión: `match_recipient(".*@malove.app")`
- [ ] Actions: `forward`, `store`, `stop`
- [ ] MX Records configurados en DNS
- [ ] SPF Record configurado en DNS
- [ ] DKIM Record configurado en DNS
- [ ] Backend corriendo: `cd backend && npm run dev`
- [ ] Test de recepción exitoso

---

## 🆘 **NECESITAS AYUDA?**

Si tienes problemas:

1. **Ver logs del backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Ver logs de Mailgun:**
   - Dashboard → Logs
   - Busca por MessageID o destinatario

3. **Test manual del webhook:**
   ```bash
   curl -X POST https://MaLove.App-backend.onrender.com/api/inbound/mailgun \
     -F sender="test@example.com" \
     -F recipient="dani@malove.app" \
     -F subject="Test" \
     -F "body-plain=Test body" \
     -F timestamp="$(date +%s)" \
     -F token="test-token" \
     -F signature="test-signature"
   ```

---

**Última actualización:** 2025-10-23  
**Tu configuración:** ✅ API Keys OK | ⚙️ Routes pendientes
