# 📧 ARQUITECTURA DE DOMINIOS Y EMAILS

**Fecha:** 23 de Octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ DEFINITIVO

---

## 🎯 RESUMEN EJECUTIVO

MaLoveApp utiliza **dos dominios** para su sistema de emails:

1. **Dominio de Usuario (visible):** `@malove.app`
2. **Dominio Técnico (Mailgun):** `@mg.malove.app`

---

## 📋 DOMINIOS CONFIGURADOS

### 1. Dominio Principal: `malove.app`

**Propósito:** Emails visibles para los usuarios finales

**Formato de email:**
```
[alias]@malove.app
```

**Ejemplos:**
- `maria.garcia@malove.app`
- `juan-perez@malove.app`
- `boda2025@malove.app`

**Características:**
- Alias personalizado por usuario
- Entre 3-30 caracteres
- Solo minúsculas, números, `.`, `-`, `_`
- Único por usuario (registrado en Firestore)

**Colecciones Firestore:**
- `emailUsernames/{alias}` - Reserva del alias
- `users/{uid}.myWed360Email` - Email asignado al usuario
- `users/{uid}.emailUsername` - Alias del usuario

---

### 2. Dominio de Envío: `mg.malove.app`

**Propósito:** Dominio técnico configurado en Mailgun para enviar/recibir emails

**Región:** EU (Europa) para cumplimiento GDPR

**Configuración DNS:**
- SPF: `v=spf1 include:mailgun.org ~all`
- DKIM: `krs._domainkey.mg.malove.app`
- DMARC: `_dmarc.malove.app`
- MX: `mxa.eu.mailgun.org` (prioridad 10)
- MX: `mxb.eu.mailgun.org` (prioridad 10)
- CNAME: `email.mg.malove.app` → `eu.mailgun.org`

**Webhooks configurados:**
- Delivered: `POST /api/mailgun/webhooks/deliverability`
- Failed: `POST /api/mailgun/webhooks/deliverability`
- Opened: `POST /api/mailgun/webhooks/deliverability`
- Clicked: `POST /api/mailgun/webhooks/deliverability`
- Complained: `POST /api/mailgun/webhooks/deliverability`

**Routes configuradas:**
- Incoming: `forward("https://backend.com/api/mailgun/inbound")`
- Match: `match_recipient(".*@mg.malove.app")`

---

## 🔄 FLUJO DE ENVÍO/RECEPCIÓN

### Envío de Email (Outbound)

```
Usuario crea email en UI
    ↓
Frontend llama: POST /api/mail
    ↓
Backend envía via Mailgun API
    ↓
Mailgun envía desde: mg.malove.app
    ↓
Destinatario ve remitente: [alias]@malove.app
```

**Configuración en Backend:**
```env
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
MAILGUN_API_KEY=tu_api_key_sin_prefijo
MAILGUN_EU_REGION=true
```

### Recepción de Email (Inbound)

```
Email enviado a: [alias]@malove.app
    ↓
DNS redirige a: mg.malove.app
    ↓
Mailgun recibe en: mg.malove.app
    ↓
Route de Mailgun: forward a backend
    ↓
Backend: POST /api/mailgun/inbound
    ↓
Backend guarda en: users/{uid}/mails
```

---

## 🔧 CONFIGURACIÓN DE CÓDIGO

### Hook: `useEmailUsername.jsx`

**Línea 104:** Genera email con dominio correcto
```javascript
email: `${normalizedUsername}@malove.app`
```

**Línea 112:** Guarda en perfil de usuario
```javascript
myWed360Email: `${normalizedUsername}@malove.app`
```

### Servicio: `emailService.js`

**Remitente por defecto:**
```javascript
from: `${userAlias}@malove.app`
```

### Backend: Variables de Entorno

**Archivo `.env`:**
```env
# Dominio principal (visible)
MAILGUN_DOMAIN=malove.app

# Dominio de envío (técnico)
MAILGUN_SENDING_DOMAIN=mg.malove.app

# Región
MAILGUN_EU_REGION=true

# API Key (sin prefijo "key-")
MAILGUN_API_KEY=your-mailgun-api-key-here

# Signing Key para webhooks
MAILGUN_SIGNING_KEY=your-mailgun-signing-key-here
```

---

## ✅ VALIDACIONES

### Formato de Alias

**Regex:** `^[a-z0-9][a-z0-9._-]{2,29}$`

**Válidos:**
- ✅ `maria.garcia`
- ✅ `juan-perez`
- ✅ `boda_2025`
- ✅ `abc123`

**Inválidos:**
- ❌ `Ma` (muy corto, < 3 chars)
- ❌ `MARIA` (mayúsculas no permitidas)
- ❌ `maría` (acentos no permitidos)
- ❌ `maria@garcia` (@ no permitido)
- ❌ `.maria` (no puede empezar con punto)

### Nombres Reservados

Estos alias **NO** pueden ser usados:
- `admin`
- `soporte`
- `noreply`
- `contacto`
- `info`
- `ayuda`
- `sistema`
- `MaLove.App`
- `staff`
- `test`
- `prueba`

---

## 🔒 SEGURIDAD

### Autenticación de Emails

**SPF (Sender Policy Framework):**
- Valida que los emails provengan de servidores autorizados
- Configurado en: `malove.app` TXT record

**DKIM (DomainKeys Identified Mail):**
- Firma criptográfica de emails
- Clave pública en: `krs._domainkey.mg.malove.app`

**DMARC (Domain-based Message Authentication):**
- Política de autenticación y reportes
- Configurado en: `_dmarc.malove.app`

### Webhooks

**Verificación de Firma:**
```javascript
const hmac = crypto
  .createHmac('sha256', MAILGUN_SIGNING_KEY)
  .update(timestamp + token)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(hmac),
  Buffer.from(signature)
);
```

**Protección contra Replay:**
- Validar que timestamp esté dentro de ventana de 15 minutos
- Rechazar webhooks con timestamp antiguo

---

## 📊 MONITOREO

### Métricas Clave

**Colecciones Firestore:**
- `emailMetrics/{userId}` - Métricas agregadas
- `emailDeliverability/{messageId}` - Eventos por email
- `emailAlerts` - Alertas automáticas

**KPIs a trackear:**
- Delivery Rate: > 95%
- Bounce Rate: < 5%
- Complaint Rate: < 0.5%
- Open Rate: Variable (depende del contenido)
- Click Rate: Variable

### Alertas Automáticas

**Bounce Rate > 5%:**
```javascript
{
  type: 'high_bounce_rate',
  severity: 'warning',
  message: 'Tasa de rebotes excede 5%'
}
```

**Complaint Rate > 0.5%:**
```javascript
{
  type: 'high_complaint_rate',
  severity: 'critical',
  message: 'URGENTE: Tasa de quejas excede 0.5%'
}
```

---

## 🚨 TROUBLESHOOTING

### Problema: Emails no llegan

**Diagnóstico:**
1. Verificar DNS records: `nslookup -type=TXT mg.malove.app`
2. Verificar en Mailgun Dashboard: Domain Status = "Active"
3. Revisar logs: Collection `mailgunEvents`

**Solución:**
- Asegurar que todos los DNS están verificados ✅
- Esperar propagación DNS (hasta 48h, típicamente 1-2h)

### Problema: Webhooks no funcionan

**Diagnóstico:**
1. Verificar firma: `MAILGUN_SIGNING_KEY` correcto en .env
2. Revisar logs del backend: `grep "mailgun" backend/logs/*.log`
3. Test manual: `curl -X POST backend.com/api/mailgun/webhooks/deliverability`

**Solución:**
- Regenerar Signing Key en Mailgun Dashboard
- Actualizar .env con nuevo key
- Reiniciar backend

### Problema: Alias duplicado

**Síntoma:** Error al reservar alias "ya existe"

**Diagnóstico:**
```javascript
const doc = await getDoc(doc(db, 'emailUsernames', alias));
console.log('Existe:', doc.exists());
```

**Solución:**
- Usuario debe elegir otro alias
- O contactar soporte si el alias está abandonado

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `docs/CONFIGURACION-MAILS-COMPLETA.md` - Guía completa de configuración
- `docs/flujos-especificos/flujo-7-comunicacion-emails.md` - Flujo de usuario
- `docs/IMPLEMENTACION-FEATURES-MAILS-COMPLETA.md` - Features implementadas
- `backend/services/mailgunWebhookService.js` - Código de webhooks
- `src/hooks/useEmailUsername.jsx` - Hook de generación de alias

---

## 🔄 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Responsable |
|-------|--------|-------------|
| 2025-10-23 | Cambio de `@maloveapp.com` a `@malove.app` | Backend Squad |
| 2025-10-23 | Documentación de arquitectura definitiva | DevOps |
| 2025-10-23 | Actualización de código en `useEmailUsername.jsx` | Frontend Squad |

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de desplegar en producción:

- [ ] DNS records configurados y verificados
- [ ] Mailgun domain status = "Active"
- [ ] Webhooks configurados (5 eventos)
- [ ] Routes configuradas para inbound
- [ ] Variables de entorno actualizadas
- [ ] Código actualizado (`useEmailUsername.jsx`)
- [ ] Tests E2E pasando
- [ ] Documentación actualizada
- [ ] Monitoreo configurado (alertas)
- [ ] Backup de configuración actual

---

**Última actualización:** 23 de Octubre de 2025, 3:05pm  
**Próxima revisión:** Tras despliegue en producción  
**Estado:** ✅ LISTO PARA PRODUCCIÓN
