# 📧 CONFIGURACIÓN DNS MAILGUN - NECESARIA

**Estado:** ⚠️ REQUIERE ACCIÓN

---

## ⚠️ **SÍ, NECESITAS CONFIGURAR DNS**

Para que Mailgun pueda enviar emails desde tu dominio, **debes configurar registros DNS en Namecheap**.

Sin esto, los emails:
- ❌ No se enviarán
- ❌ Irán a spam
- ❌ Serán rechazados por los servidores

---

## 🔍 **TU CONFIGURACIÓN ACTUAL**

Según tu `.env`:
```
MAILGUN_DOMAIN=planivia.net
MAILGUN_SENDING_DOMAIN=mg.planivia.net
```

**Dominio principal:** `planivia.net`  
**Subdominio Mailgun:** `mg.planivia.net`

---

## 📝 **REGISTROS DNS REQUERIDOS**

### **Opción A: Usar subdominio `mg.planivia.net` (RECOMENDADO)**

Mailgun te proporciona 4 registros DNS que debes añadir:

**1. TXT - SPF (para autenticación)**
```
Tipo: TXT
Host: mg.planivia.net (o solo "mg")
Valor: v=spf1 include:mailgun.org ~all
TTL: 3600
```

**2. TXT - DKIM (para firma digital)**
```
Tipo: TXT
Host: k1._domainkey.mg.planivia.net
Valor: [Mailgun te lo proporciona - cadena larga]
TTL: 3600
```

**3. CNAME - Tracking (para seguimiento de clicks)**
```
Tipo: CNAME
Host: email.mg.planivia.net
Valor: mailgun.org
TTL: 3600
```

**4. MX - Recepción (para emails entrantes)**
```
Tipo: MX
Host: mg.planivia.net (o solo "mg")
Valor: mxa.mailgun.org
Prioridad: 10
TTL: 3600

Tipo: MX
Host: mg.planivia.net (o solo "mg")
Valor: mxb.mailgun.org
Prioridad: 10
TTL: 3600
```

---

## 🔧 **CÓMO OBTENER LOS VALORES EXACTOS**

### **Paso 1: Login en Mailgun**
```
https://app.mailgun.com/
```

### **Paso 2: Ir a Sending → Domains**
```
Buscar: mg.planivia.net (o planivia.net)
```

### **Paso 3: Click en "DNS Records"**
```
Mailgun te mostrará los valores exactos para copiar
```

**Ejemplo de lo que verás:**

```
┌─────────────────────────────────────────┐
│ DNS Records for mg.planivia.net         │
├─────────────────────────────────────────┤
│ ✓ SPF Record                            │
│   TXT  mg  v=spf1 include:mailgun.org   │
├─────────────────────────────────────────┤
│ ✓ DKIM Record                           │
│   TXT  k1._domainkey.mg                 │
│   k=rsa; p=MIGfMA0GCSqGSI...           │
├─────────────────────────────────────────┤
│ ✓ Tracking (CNAME)                      │
│   CNAME  email.mg  mailgun.org          │
├─────────────────────────────────────────┤
│ ✓ MX Records (Receiving)                │
│   MX  mg  mxa.mailgun.org  10           │
│   MX  mg  mxb.mailgun.org  10           │
└─────────────────────────────────────────┘
```

---

## 🌐 **AÑADIR REGISTROS EN NAMECHEAP**

### **Paso 1: Login en Namecheap**
```
https://www.namecheap.com/
Account → Domain List
```

### **Paso 2: Gestión DNS**
```
Click en "Manage" junto a planivia.net
Tab "Advanced DNS"
```

### **Paso 3: Añadir cada registro**

**Para SPF:**
```
Tipo: TXT Record
Host: mg
Value: v=spf1 include:mailgun.org ~all
TTL: Automatic
```

**Para DKIM:**
```
Tipo: TXT Record
Host: k1._domainkey.mg
Value: [copiar de Mailgun]
TTL: Automatic
```

**Para Tracking:**
```
Tipo: CNAME Record
Host: email.mg
Target: mailgun.org
TTL: Automatic
```

**Para MX (primero):**
```
Tipo: MX Record
Host: mg
Value: mxa.mailgun.org
Priority: 10
TTL: Automatic
```

**Para MX (segundo):**
```
Tipo: MX Record
Host: mg
Value: mxb.mailgun.org
Priority: 10
TTL: Automatic
```

---

## ⏱️ **TIEMPO DE PROPAGACIÓN**

**DNS tarda en propagarse:**
- Mínimo: 15 minutos
- Normal: 1-2 horas
- Máximo: 24-48 horas

**Durante este tiempo los emails NO funcionarán.**

---

## ✅ **VERIFICAR CONFIGURACIÓN**

### **Opción 1: En Mailgun**
```
Sending → Domains → mg.planivia.net
Debería mostrar: "Domain is verified"
```

### **Opción 2: Con herramientas DNS**
```bash
# Verificar SPF
nslookup -type=TXT mg.planivia.net

# Verificar MX
nslookup -type=MX mg.planivia.net

# Verificar DKIM
nslookup -type=TXT k1._domainkey.mg.planivia.net
```

### **Opción 3: Online**
```
https://mxtoolbox.com/SuperTool.aspx
Buscar: mg.planivia.net
```

---

## 🧪 **PROBAR ENVÍO DE EMAIL**

**Después de configurar DNS y esperar propagación:**

```bash
# Desde tu backend
cd backend
node -e "
const emailService = require('./services/emailResetService.js');
emailService.sendPasswordResetEmail(
  'tu-email@gmail.com', 
  'test-token-123'
).then(console.log);
"
```

**O usar la app:**
```
http://localhost:5173/reset-password
Ingresar tu email
Revisar si llega
```

---

## 📊 **CHECKLIST**

- [ ] Login en Mailgun
- [ ] Ir a Sending → Domains
- [ ] Copiar registros DNS exactos
- [ ] Login en Namecheap
- [ ] Añadir registro SPF (TXT)
- [ ] Añadir registro DKIM (TXT)
- [ ] Añadir registro Tracking (CNAME)
- [ ] Añadir registros MX (2)
- [ ] Esperar 1-2 horas (propagación)
- [ ] Verificar en Mailgun ("Domain verified")
- [ ] Probar envío de email

---

## ⚡ **OPCIÓN RÁPIDA: USAR SANDBOX**

**Si quieres probar YA sin esperar DNS:**

Mailgun te da un dominio sandbox:
```
sandboxXXXXXXXX.mailgun.org
```

**En tu .env:**
```env
# Cambiar temporalmente a:
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
```

**Limitaciones del sandbox:**
- ✅ Funciona inmediatamente
- ❌ Solo envía a emails autorizados (max 5)
- ❌ Incluye "via mailgun.org" en el email

**Para autorizar emails en sandbox:**
```
Mailgun → Sending → [tu sandbox]
→ Authorized Recipients
→ Add Recipient
```

---

## 🎯 **RECOMENDACIÓN**

### **Opción 1: Producción (DNS completo)**
**Tiempo:** 1-2 horas (esperar propagación)  
**Ventaja:** Emails profesionales desde planivia.net  
**Desventaja:** Requiere configurar DNS

### **Opción 2: Testing rápido (Sandbox)**
**Tiempo:** 5 minutos  
**Ventaja:** Funciona YA  
**Desventaja:** Solo para testing, emails limitados

---

## 📧 **RESULTADO ESPERADO**

**Con DNS configurado correctamente:**

**Email recibido desde:**
```
De: MaLoveApp <noreply@mg.planivia.net>
```

**Sin "via mailgun.org"**  
**No va a spam**  
**Pasa validaciones SPF/DKIM**

---

## 🆘 **SI TIENES PROBLEMAS**

**Email no llega:**
1. Verificar DNS propagado (mxtoolbox.com)
2. Revisar logs del backend
3. Verificar dominio verificado en Mailgun
4. Revisar spam/junk

**Email va a spam:**
1. Configurar DKIM correctamente
2. Configurar SPF correctamente
3. No usar palabras spam ("gratis", "urgente", etc.)

**Error en Mailgun:**
1. Verificar MAILGUN_API_KEY correcto
2. Verificar dominio existe en Mailgun
3. Revisar región (EU vs US)

---

## 💡 **RESUMEN**

**SÍ, necesitas configurar DNS** en Namecheap para que los emails funcionen.

**Pasos:**
1. Login Mailgun → Copiar registros DNS
2. Login Namecheap → Añadir registros
3. Esperar 1-2 horas
4. Verificar y probar

**O usa sandbox para testing inmediato** (limitado a 5 emails)

---

**¿Quieres que te ayude con alguno de estos pasos?**
