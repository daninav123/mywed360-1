# =' GU�A COMPLETA: CONFIGURACI�N DEL SISTEMA DE MAILS

**Fecha:** 23 de Octubre de 2025  
**Versi�n:** 1.0  
**Tiempo estimado:** 2-3 horas

---

## =� �NDICE

1. [Pre-requisitos](#pre-requisitos)
2. [Configuraci�n de Mailgun](#configuraci�n-de-mailgun)
3. [Configuraci�n DNS](#configuraci�n-dns)
4. [Configuraci�n de Webhooks](#configuraci�n-de-webhooks)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificaci�n](#verificaci�n)
7. [Troubleshooting](#troubleshooting)

---

##  PRE-REQUISITOS

### Cuentas Necesarias

- [ ] Cuenta de Mailgun (https://mailgun.com)
- [ ] Dominio propio verificado (ej: `malove.app`)
- [ ] Acceso al panel DNS del dominio
- [ ] Backend desplegado y accesible

### Informaci�n Requerida

Antes de empezar, ten a mano:
- **Dominio principal:** ej. `malove.app`
- **Dominio de env�o:** ej. `mg.malove.app`
- **URL del backend:** ej. `https://maloveapp-backend.onrender.com`
- **Email de prueba:** Tu email personal para verificaciones

### =� Formato de Emails de Usuario

Los usuarios finales recibir�n emails personalizados con el formato:

```
[alias]@malove.app
```

**Ejemplos:**
- `maria.garcia@malove.app`
- `juan-perez@malove.app`
- `boda2025@malove.app`

**Notas importantes:**
- El alias debe tener entre 3-30 caracteres
- Solo se permiten: letras min�sculas, n�meros, puntos (.), guiones (-) y guiones bajos (_)
- El sistema reserva autom�ticamente el alias en Firestore (`emailUsernames/{alias}`)
- Cada usuario solo puede tener un alias activo

---

## =� PASO 1: CONFIGURACI�N DE MAILGUN

### 1.1 Crear/Acceder a Cuenta

1. Ve a https://mailgun.com
2. Si no tienes cuenta:
   - Sign Up � Plan Free (5,000 emails/mes)
   - Verifica tu email
3. Accede al Dashboard

### 1.2 A�adir Dominio

1. En el dashboard, ve a **Sending � Domains**
2. Click en **Add New Domain**

3. **Configuraci�n del dominio:**
   ```
   Domain Name: mg.malove.app
   Region: EU (para GDPR compliance)
   DKIM Key Length: 2048 bits (recomendado)
   ```

4. Click **Add Domain**

### 1.3 Obtener Credenciales

Mailgun te mostrar� una pantalla con:

**API Key (Private):**
```
Ejemplo: your-mailgun-api-key-here
```

� **IMPORTANTE:** 
- **NO incluyas** el prefijo `key-`
- Gu�rdala en lugar seguro (la necesitar�s para .env)

**Domain Sending Key (opcional):**
```
Ejemplo: 61bd6accc23c4d961a4b280662aa4e6a
```

---

## < PASO 2: CONFIGURACI�N DNS

Mailgun te proporcionar� registros DNS que debes a�adir a tu dominio.

### 2.1 Acceder al Panel DNS

Depende de tu proveedor:
- **Cloudflare:** Dashboard � DNS � Add Record
- **GoDaddy:** My Products � DNS � Manage DNS
- **Namecheap:** Domain List � Manage � Advanced DNS

### 2.2 Registros a A�adir

Mailgun requiere estos registros DNS:

#### =� Registro SPF (TXT)

```
Type: TXT
Name: mg.malove.app
Value: v=spf1 include:mailgun.org ~all
TTL: 3600
```

**Prop�sito:** Autoriza a Mailgun a enviar emails desde tu dominio.

---

#### = Registro DKIM (TXT)

```
Type: TXT
Name: krs._domainkey.mg.malove.app
Value: k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
TTL: 3600
```

**Prop�sito:** Firma digital para prevenir spoofing.

� **Nota:** El `Value` es MUY largo (~400 caracteres). C�pialo completo.

---

#### =� Registro DMARC (TXT)

```
Type: TXT
Name: _dmarc.malove.app
Value: v=DMARC1; p=none; rua=mailto:dmarc@malove.app
TTL: 3600
```

**Prop�sito:** Pol�tica de autenticaci�n y reportes.

**Pol�ticas disponibles:**
- `p=none` - Solo monitoreo (recomendado inicialmente)
- `p=quarantine` - Emails no autenticados van a spam
- `p=reject` - Rechazar emails no autenticados

---

#### =� Registros MX (para recepci�n)

```
Type: MX
Name: mg.malove.app
Priority: 10
Value: mxa.eu.mailgun.org
TTL: 3600

Type: MX
Name: mg.malove.app
Priority: 10
Value: mxb.eu.mailgun.org
TTL: 3600
```

**Prop�sito:** Recibir emails entrantes (webhooks inbound).

---

#### = Registro CNAME (Tracking)

```
Type: CNAME
Name: email.mg.malove.app
Value: eu.mailgun.org
TTL: 3600
```

**Prop�sito:** Tracking de clicks y opens (opcional).

---

### 2.3 Verificar Propagaci�n DNS

Despu�s de a�adir los registros:

**Espera:** 15-60 minutos para propagaci�n.

**Verificar online:**
```bash
# SPF
nslookup -type=TXT mg.malove.app

# DKIM
nslookup -type=TXT krs._domainkey.mg.malove.app

# DMARC
nslookup -type=TXT _dmarc.malove.app

# MX
nslookup -type=MX mg.malove.app
```

**O usar herramientas online:**
- https://mxtoolbox.com/SuperTool.aspx
- https://dnschecker.org/

---

### 2.4 Verificar en Mailgun

1. Ve a **Mailgun Dashboard � Domains**
2. Click en tu dominio `mg.malove.app`
3. Ver�s el estado de cada registro:

```
 SPF       Valid
 DKIM      Valid
 DMARC     Valid
 MX        Valid
```

Si alguno est� L **Pending** o **Invalid**:
- Espera m�s tiempo (hasta 24h en algunos casos)
- Verifica que copiaste los valores correctamente
- Revisa que el nombre del registro sea exacto

---

## = PASO 3: CONFIGURACI�N DE WEBHOOKS

Los webhooks permiten recibir eventos de Mailgun (delivered, failed, opened, etc.)

### 3.1 Crear Webhooks en Mailgun

1. En Mailgun Dashboard, ve a **Sending � Webhooks**
2. Selecciona tu dominio `mg.malove.app`
3. Click **Add Webhook**

### 3.2 Webhooks Requeridos

#### Webhook 1: Deliverability (Entregabilidad)

```
Event Type: Permanent Failure
URL: https://maloveapp-backend.onrender.com/api/mailgun/webhooks/deliverability
```

A�ade tambi�n para estos eventos:
- `delivered`
- `failed` (temporary)
- `complained`
- `unsubscribed`

**URL siempre la misma**, Mailgun enviar� el `event` en el payload.

---

#### Webhook 2: Engagement (Interacci�n)

```
Event Type: Opened
URL: https://maloveapp-backend.onrender.com/api/mailgun/webhooks/deliverability

Event Type: Clicked
URL: https://maloveapp-backend.onrender.com/api/mailgun/webhooks/deliverability
```

---

#### Webhook 3: Inbound (Correos Entrantes)

```
Event Type: (no aplica, configuraci�n diferente)
URL: https://maloveapp-backend.onrender.com/api/mailgun/inbound
```

**Configuraci�n especial:**

1. Ve a **Receiving � Routes**
2. Click **Create Route**
3. Configuraci�n:
   ```
   Priority: 0
   Expression: match_recipient(".*@mg.malove.app")
   Action: forward("https://maloveapp-backend.onrender.com/api/mailgun/inbound")
   Description: Forward all incoming emails to backend
   ```

---

### 3.3 Securing Webhooks (Firma)

Para verificar que los webhooks vienen de Mailgun:

1. En **Settings � API Security**
2. Copia el **Webhook Signing Key**:
   ```
   Ejemplo: 61bd6accc23c4d961a4b280662aa4e6a
   ```

3. A�ade a tu `.env`:
   ```env
   MAILGUN_SIGNING_KEY=61bd6accc23c4d961a4b280662aa4e6a
   ```

---

## = PASO 4: VARIABLES DE ENTORNO

### 4.1 Variables del Backend

Edita `backend/.env` o configura en tu plataforma de hosting:

```env
# Mailgun - Backend (sin prefijo VITE_)
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
MAILGUN_EU_REGION=true
MAILGUN_SIGNING_KEY=your-mailgun-signing-key-here
```

**En Render.com:**
1. Dashboard � tu servicio
2. Environment � Add Environment Variable
3. A�ade cada variable individualmente

**En Heroku:**
```bash
heroku config:set MAILGUN_API_KEY=your-mailgun-api-key-here
heroku config:set MAILGUN_DOMAIN=malove.app
# ... etc
```

---

### 4.2 Variables del Frontend

Edita `.env` en la ra�z del proyecto:

```env
# Mailgun - Frontend (con prefijo VITE_)
VITE_MAILGUN_API_KEY=your-mailgun-api-key-here
VITE_MAILGUN_DOMAIN=malove.app
VITE_MAILGUN_SENDING_DOMAIN=mg.malove.app
VITE_MAILGUN_EU_REGION=true

# Backend URL
VITE_BACKEND_BASE_URL=https://maloveapp-backend.onrender.com

# Features
VITE_USE_MAILGUN=true
VITE_USE_EMAIL_BACKEND=true
```

� **Importante:**
- Backend usa variables SIN prefijo `VITE_`
- Frontend usa variables CON prefijo `VITE_`
- **Ambas deben tener los mismos valores**

---

### 4.3 Actualizar .env.example

Para documentaci�n del equipo:

```env
# .env.example

# Mailgun Configuration (Backend)
MAILGUN_API_KEY=tu_api_key_sin_prefijo_key
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
MAILGUN_EU_REGION=true
MAILGUN_SIGNING_KEY=tu_signing_key

# Mailgun Configuration (Frontend)
VITE_MAILGUN_API_KEY=tu_api_key_sin_prefijo_key
VITE_MAILGUN_DOMAIN=malove.app
VITE_MAILGUN_SENDING_DOMAIN=mg.malove.app
VITE_MAILGUN_EU_REGION=true
```

---

##  PASO 5: VERIFICACI�N

### 5.1 Verificar Configuraci�n Backend

**Script autom�tico:**

```bash
node backend/scripts/verify-mailgun.js
```

**Salida esperada:**
```
 MAILGUN_API_KEY configurada
 MAILGUN_DOMAIN configurada: malove.app
 Regi�n EU configurada (api.eu.mailgun.net)
 Cliente Mailgun creado correctamente
 Dominio v�lido y accesible en Mailgun

<� RESUMEN FINAL:
 �Configuraci�n PERFECTA! El sistema de emails est� listo.
```

---

### 5.2 Test de Env�o desde Backend

**Usando curl:**

```bash
curl -X POST https://maloveapp-backend.onrender.com/api/mailgun/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "tu-email@ejemplo.com",
    "subject": "Test desde MaLoveApp",
    "text": "Este es un email de prueba para verificar la configuraci�n."
  }'
```

**Respuesta esperada:**
```json
{
  "success": true
}
```

**Verifica tu email:**
- Inbox: Deber�a llegar en ~30 segundos
- Spam: Revisa si no aparece en inbox
- Remitente: `verificacion@mg.malove.app`

---

### 5.3 Test desde Frontend

1. Abre la aplicaci�n: `http://localhost:5173/email`
2. Click en "Nuevo email" o "Compose"
3. Completa el formulario:
   ```
   Para: tu-email@ejemplo.com
   Asunto: Test desde UI
   Mensaje: Probando env�o desde interfaz
   ```
4. Click en "Enviar"
5. Verifica:
   -  Mensaje de �xito en UI
   -  Email en carpeta "Enviados"
   -  Email recibido en tu inbox

---

### 5.4 Test de Webhooks

**Verificar en logs del backend:**

```bash
# Si usas Render
# Dashboard � Logs � buscar "mailgun"

# Si usas local
tail -f backend/logs/mailgun.log
```

**Env�a un email y busca:**
```
[mailgun] webhook received: delivered
[mailgun] messageId: <abc123@mg.malove.app>
[mailgun] recipient: tu-email@ejemplo.com
```

**En Mailgun Dashboard:**
1. Ve a **Sending � Logs**
2. Busca tu email reciente
3. Verifica eventos:
   -  `accepted`
   -  `delivered`
   -  `opened` (si habilitaste tracking)

---

### 5.5 Test de Recepci�n (Inbound)

**Env�a un email desde tu cliente (Gmail, Outlook):**

```
Para: test@mg.malove.app
Asunto: Test inbound
Cuerpo: Verificando recepci�n
```

**Verifica en el backend:**
- Logs deben mostrar: `[mailgun] inbound email received`
- Email debe aparecer en Firestore: `users/{uid}/mails`
- Email debe aparecer en UI: carpeta "Bandeja de entrada"

---

## =� PASO 6: TROUBLESHOOTING

### Problema 1: "Mailgun not configured"

**S�ntomas:**
```
Error: Mailgun no est� configurado en el servidor
```

**Causas:**
1. Variables de entorno no cargadas
2. Backend no reiniciado despu�s de cambios
3. Typo en nombres de variables

**Soluci�n:**
```bash
# Verificar que existen
echo $MAILGUN_API_KEY
echo $MAILGUN_DOMAIN

# Si est�n vac�as, revisar .env
cat .env | grep MAILGUN

# Reiniciar backend
# (depende de tu plataforma)
```

---

### Problema 2: Emails no llegan

**S�ntomas:**
- `success: true` pero email no recibido
- No aparece en spam

**Diagn�stico:**

1. **Verificar en Mailgun Logs:**
   - Dashboard � Logs
   - Buscar tu email
   - Ver status: `delivered` vs `failed`

2. **Si status es `failed`:**
   ```
   Reason: "Invalid mailbox"
   � El email destino no existe o rechaza
   
   Reason: "Domain not found"
   � Problema DNS del destinatario
   ```

3. **Si status es `delivered` pero no ves el email:**
   - Revisar spam/junk
   - Agregar `verificacion@mg.malove.app` a contactos
   - Revisar filtros del cliente de email

---

### Problema 3: DNS Records "Pending"

**S�ntomas:**
- Registros en Mailgun aparecen � Pending
- Despu�s de 24h siguen pendientes

**Soluci�n:**

1. **Verificar propagaci�n:**
   ```bash
   nslookup -type=TXT mg.malove.app 8.8.8.8
   ```

2. **Verificar valores exactos:**
   - Copiar/pegar desde Mailgun (no escribir manualmente)
   - No a�adir espacios extra
   - Respetar may�sculas/min�sculas

3. **Common mistakes:**
   ```
   L Name: mg.malove.app.malove.app (duplicado)
    Name: mg.malove.app

   L Value: "v=spf1 include:mailgun.org ~all" (comillas)
    Value: v=spf1 include:mailgun.org ~all

   L TTL: 86400 (muy alto)
    TTL: 3600
   ```

---

### Problema 4: Webhooks no funcionan

**S�ntomas:**
- Emails se env�an pero no hay eventos en backend
- Logs no muestran `webhook received`

**Diagn�stico:**

1. **Verificar URL del webhook:**
   ```
    https://maloveapp-backend.onrender.com/api/mailgun/webhooks/deliverability
   L http://... (debe ser HTTPS)
   L /webhooks/... (falta /api/mailgun/)
   ```

2. **Test manual del webhook:**
   ```bash
   curl -X POST https://maloveapp-backend.onrender.com/api/mailgun/webhooks/deliverability \
     -H "Content-Type: application/json" \
     -d '{
       "event": "delivered",
       "recipient": "test@example.com",
       "timestamp": 1234567890
     }'
   ```

3. **Verificar firma (si configurada):**
   - Variable `MAILGUN_SIGNING_KEY` correcta
   - Backend valida firma correctamente

---

### Problema 5: "Invalid API Key"

**S�ntomas:**
```
Error 401: Unauthorized
Forbidden
```

**Causas:**
1. API Key incorrecta
2. API Key con prefijo `key-` (incorrecto)
3. API Key de regi�n incorrecta (US vs EU)

**Soluci�n:**
```env
# L INCORRECTO
MAILGUN_API_KEY=key-your-mailgun-api-key-here

#  CORRECTO (sin "key-")
MAILGUN_API_KEY=your-mailgun-api-key-here
```

---

### Problema 6: Regi�n EU vs US

**S�ntomas:**
- Timeouts
- `Domain not found` en dominio v�lido

**Causa:**
- API Key de regi�n EU usada con host US (o viceversa)

**Soluci�n:**
```env
# Si tu cuenta es EU
MAILGUN_EU_REGION=true  # � Esto configura api.eu.mailgun.net

# Si tu cuenta es US
MAILGUN_EU_REGION=false # � Esto usa api.mailgun.net (default)
```

**Verificar tu regi�n:**
- Mailgun Dashboard � Settings � API Keys
- Mira la URL: `api.eu.mailgun.net` o `api.mailgun.net`

---

## =� RECURSOS ADICIONALES

### Documentaci�n Oficial
- [Mailgun Docs](https://documentation.mailgun.com/)
- [Mailgun API Reference](https://documentation.mailgun.com/en/latest/api_reference.html)
- [DNS Verification Guide](https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain)

### Herramientas �tiles
- [MXToolbox](https://mxtoolbox.com/) - Verificar DNS
- [Mail Tester](https://www.mail-tester.com/) - Test spam score
- [DMARC Analyzer](https://dmarcian.com/dmarc-inspector/) - Validar DMARC

### Documentos del Proyecto
- `docs/DIAGNOSTICO-MAILS.md` - Diagn�stico completo
- `docs/ARQUITECTURA-DATOS-MAILS.md` - Arquitectura de datos
- `docs/flujos-especificos/flujo-7-comunicacion-emails.md` - Flujo funcional
- `backend/scripts/verify-mailgun.js` - Script de verificaci�n

---

##  CHECKLIST FINAL

### Configuraci�n Mailgun
- [ ] Cuenta creada y verificada
- [ ] Dominio `mg.malove.app` a�adido
- [ ] API Key copiada (sin prefijo `key-`)
- [ ] Signing Key copiada

### Configuraci�n DNS
- [ ] Registro SPF a�adido
- [ ] Registro DKIM a�adido
- [ ] Registro DMARC a�adido
- [ ] Registros MX a�adidos (si recibes emails)
- [ ] DNS propagados (verificado online)
- [ ] Todos los registros  Valid en Mailgun

### Configuraci�n Webhooks
- [ ] Webhook de deliverability configurado
- [ ] Webhook de engagement configurado
- [ ] Route de inbound configurado
- [ ] Signing key a�adida a .env

### Variables de Entorno
- [ ] Backend: Variables sin `VITE_` configuradas
- [ ] Frontend: Variables con `VITE_` configuradas
- [ ] Backend reiniciado
- [ ] Frontend rebuildeado

### Verificaci�n
- [ ] Script `verify-mailgun.js` ejecutado 
- [ ] Test de env�o desde backend exitoso
- [ ] Test de env�o desde UI exitoso
- [ ] Email recibido correctamente
- [ ] Webhooks funcionando (logs del backend)
- [ ] Email inbound funcionando (si aplica)

### Documentaci�n
- [ ] .env.example actualizado
- [ ] Equipo informado de nueva configuraci�n
- [ ] Runbook operacional actualizado

---

## <� �CONFIGURACI�N COMPLETADA!

Si todos los checkboxes est�n marcados, tu sistema de emails est� **100% operativo**.

**Pr�ximos pasos:**
1. Monitorear logs durante 24-48h
2. Configurar alertas para bounces/complaints
3. Ajustar pol�tica DMARC de `none` a `quarantine` (tras validar)
4. Documentar procedimientos espec�ficos del equipo

---

**�ltima actualizaci�n:** 23 de Octubre de 2025, 5:26am  
**Tiempo estimado de configuraci�n:** 2-3 horas  
**Soporte:** Ver documentos en `docs/` o contactar al equipo backend
