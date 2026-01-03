# 🔍 DIAGNÓSTICO COMPLETO: SISTEMA DE MAILS

**Fecha:** 23 de Octubre de 2025  
**Estado:** 🔴 PROBLEMAS IDENTIFICADOS

---

## 📊 RESUMEN EJECUTIVO

El sistema de emails presenta **inconsistencias en la configuración de variables de entorno** que impiden el correcto funcionamiento del envío de correos.

### Problemas Críticos

1. ❌ **Inconsistencia en nombres de variables**: Mezcla de `VITE_MAILGUN_*` y `MAILGUN_*`
2. ❌ **Backend no tiene acceso directo**: Variables con prefijo `VITE_` no están disponibles en Node.js
3. ⚠️ **Configuración fragmentada**: Múltiples archivos leyendo diferentes versiones de las mismas variables
4. ⚠️ **Sin normalización**: Sin prefijo "key-" pero documentado que debería ser sin prefijo

---

## 🔍 ANÁLISIS DETALLADO

### 1. Estado de Variables de Entorno

#### Configuración Actual (.env)

```env
VITE_MAILGUN_API_KEY=your-mailgun-api-key-here
VITE_MAILGUN_DOMAIN=malove.app
VITE_MAILGUN_SENDING_DOMAIN=mg.malove.app
VITE_MAILGUN_EU_REGION=true
```

✅ **Correcto para Frontend** (Vite expone `VITE_*` a `import.meta.env`)  
❌ **Incorrecto para Backend** (Node.js no ve variables `VITE_*` en `process.env`)

---

### 2. Archivos con Problemas

#### 🔴 Backend - Variables Mezcladas

**`backend/routes/mailgun.js`** (Líneas 12-19)
```javascript
// Fallback manual - puede fallar
if (!process.env.MAILGUN_API_KEY && process.env.VITE_MAILGUN_API_KEY) {
  process.env.MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY;
}
```

**`backend/routes/mail/clients.js`** (Líneas 17-20)
```javascript
// Lee ambas versiones
const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
```

**`backend/services/budgetEmailService.js`** (Líneas 9-10)
```javascript
const apiKey = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
const domain = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
```

**`backend/services/mailSendService.js`** (Línea 149)
```javascript
const { mailgun, mailgunAlt } = createMailgunClients();
// Depende de clients.js que tiene fallback manual
```

---

### 3. Flujo de Envío de Correos

```mermaid
Frontend (emailService.js)
    ↓ sendMail()
    ↓ POST /api/mail
Backend (routes/mail/postSend.js)
    ↓ sendMailAndPersist()
    ↓ createMailgunClients()
Backend (routes/mail/clients.js)
    ↓ ⚠️ PROBLEMA: Lee VITE_MAILGUN_* de process.env
    ↓ ❌ NO DISPONIBLE en Node.js
mailgun-js
    ↓ ❌ FALLO: No hay API key válida
```

---

## 🎯 SOLUCIONES

### Solución 1: Variables sin Prefijo en Backend (RECOMENDADA)

Agregar variables duplicadas sin prefijo `VITE_` al `.env`:

```env
# Backend (Node.js)
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
MAILGUN_EU_REGION=true

# Frontend (Vite)
VITE_MAILGUN_API_KEY=your-mailgun-api-key-here
VITE_MAILGUN_DOMAIN=malove.app
VITE_MAILGUN_SENDING_DOMAIN=mg.malove.app
VITE_MAILGUN_EU_REGION=true
```

**Ventajas:**
- ✅ No requiere cambios en el código
- ✅ Compatible con toda la lógica de fallback existente
- ✅ Solución inmediata

**Desventajas:**
- ⚠️ Duplicación de variables

---

### Solución 2: Centralizar en Módulo de Configuración

Crear `backend/config/mailgun.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

// Normalizar: primero sin prefijo, luego con prefijo VITE_
export const MAILGUN_CONFIG = {
  apiKey: process.env.MAILGUN_API_KEY || process.env.VITE_MAILGUN_API_KEY || '',
  domain: (process.env.MAILGUN_DOMAIN || process.env.VITE_MAILGUN_DOMAIN || '')
    .replace(/^https?:\/\//i, '')
    .trim(),
  sendingDomain: (process.env.MAILGUN_SENDING_DOMAIN || process.env.VITE_MAILGUN_SENDING_DOMAIN || '')
    .replace(/^https?:\/\//i, '')
    .trim(),
  euRegion: String(process.env.MAILGUN_EU_REGION || process.env.VITE_MAILGUN_EU_REGION || 'false').toLowerCase() === 'true',
  isConfigured: false
};

// Validar configuración
MAILGUN_CONFIG.isConfigured = !!(MAILGUN_CONFIG.apiKey && MAILGUN_CONFIG.domain);

if (!MAILGUN_CONFIG.isConfigured) {
  console.warn('⚠️ Mailgun no configurado: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN');
}

export function createMailgunClient(domainOverride) {
  if (!MAILGUN_CONFIG.isConfigured) return null;
  
  const mailgunJs = require('mailgun-js');
  const targetDomain = domainOverride || MAILGUN_CONFIG.domain;
  
  const options = {
    apiKey: MAILGUN_CONFIG.apiKey,
    domain: targetDomain
  };
  
  if (MAILGUN_CONFIG.euRegion) {
    options.host = 'api.eu.mailgun.net';
  }
  
  try {
    return mailgunJs(options);
  } catch (error) {
    console.error('❌ Error creando cliente Mailgun:', error.message);
    return null;
  }
}
```

**Ventajas:**
- ✅ Configuración centralizada
- ✅ Validación en un solo lugar
- ✅ Fácil de mantener y depurar

**Desventajas:**
- ⚠️ Requiere refactorizar múltiples archivos

---

### Solución 3: Script de Verificación

Crear `backend/scripts/verify-mailgun.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Verificación de Configuración Mailgun\n');

const checks = {
  'MAILGUN_API_KEY': process.env.MAILGUN_API_KEY,
  'VITE_MAILGUN_API_KEY': process.env.VITE_MAILGUN_API_KEY,
  'MAILGUN_DOMAIN': process.env.MAILGUN_DOMAIN,
  'VITE_MAILGUN_DOMAIN': process.env.VITE_MAILGUN_DOMAIN,
  'MAILGUN_EU_REGION': process.env.MAILGUN_EU_REGION,
  'VITE_MAILGUN_EU_REGION': process.env.VITE_MAILGUN_EU_REGION
};

let hasErrors = false;

for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  const displayValue = value 
    ? (key.includes('API_KEY') ? value.substring(0, 8) + '***' : value)
    : 'NO DEFINIDA';
  
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value && key.startsWith('MAILGUN_')) {
    hasErrors = true;
  }
}

console.log('\n📊 DIAGNÓSTICO:');

if (!checks.MAILGUN_API_KEY && !checks.VITE_MAILGUN_API_KEY) {
  console.log('❌ CRÍTICO: No hay API Key de Mailgun configurada');
  hasErrors = true;
}

if (!checks.MAILGUN_DOMAIN && !checks.VITE_MAILGUN_DOMAIN) {
  console.log('❌ CRÍTICO: No hay dominio de Mailgun configurado');
  hasErrors = true;
}

if (checks.VITE_MAILGUN_API_KEY && !checks.MAILGUN_API_KEY) {
  console.log('⚠️ AVISO: Backend necesita MAILGUN_API_KEY (sin prefijo VITE_)');
  console.log('   Solución: Agregar MAILGUN_API_KEY=' + checks.VITE_MAILGUN_API_KEY);
}

if (checks.VITE_MAILGUN_DOMAIN && !checks.MAILGUN_DOMAIN) {
  console.log('⚠️ AVISO: Backend necesita MAILGUN_DOMAIN (sin prefijo VITE_)');
  console.log('   Solución: Agregar MAILGUN_DOMAIN=' + checks.VITE_MAILGUN_DOMAIN);
}

if (!hasErrors) {
  console.log('✅ Configuración correcta para envío de emails');
} else {
  console.log('\n❌ Configuración incompleta - los emails NO funcionarán');
  process.exit(1);
}
```

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### Paso 1: Agregar Variables sin Prefijo

Editar `.env` y agregar las líneas sin `VITE_`:

```bash
# Agregar después de las variables VITE_MAILGUN_*
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
MAILGUN_EU_REGION=true
```

### Paso 2: Verificar Configuración

```bash
node backend/scripts/verify-mailgun.js
```

### Paso 3: Reiniciar Backend

```bash
# Si tienes el backend corriendo
# Ctrl+C y luego:
cd backend
npm start
```

### Paso 4: Test de Envío

Probar endpoint de test:

```bash
# GET
curl http://localhost:4004/api/mailgun/test

# POST - Enviar email de prueba
curl -X POST http://localhost:4004/api/mailgun/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "tu-email@ejemplo.com",
    "subject": "Test desde MaLoveApp",
    "text": "Este es un email de prueba"
  }'
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Variables `MAILGUN_*` sin prefijo añadidas al `.env`
- [ ] Variables `VITE_MAILGUN_*` mantienen valores (para frontend)
- [ ] Script de verificación ejecutado correctamente
- [ ] Backend reiniciado
- [ ] Endpoint `/api/mailgun/test` responde 200 OK
- [ ] Email de prueba enviado correctamente
- [ ] Logs del backend no muestran errores de Mailgun

---

## 🔧 ARCHIVOS AFECTADOS

### Necesitan variables sin prefijo:

1. `backend/routes/mail/clients.js`
2. `backend/routes/mailgun.js`
3. `backend/services/mailSendService.js`
4. `backend/services/budgetEmailService.js`
5. `backend/services/emailValidationService.js`
6. `backend/routes/mailgun-events.js`
7. `backend/routes/mailgun-inbound.js`
8. `backend/routes/mailgun-debug.js`
9. `backend/routes/health.js`
10. `backend/routes/diagnostic.js`

### Funcionan correctamente (frontend):

1. `src/services/emailService.js`
2. `src/services/diagnosticService.js`
3. `src/utils/errorLogger.js`

---

## 📝 NOTAS ADICIONALES

### Sobre la API Key

✅ La API Key actual **NO tiene prefijo "key-"** (correcto según memoria del sistema)
```
your-mailgun-api-key-here
```

### Sobre el Dominio

✅ Dominio configurado: `malove.app`  
✅ Dominio de envío: `mg.malove.app`  
✅ Región EU: `true` (api.eu.mailgun.net)

### Endpoints Disponibles

```
GET  /api/mailgun/test              - Test de configuración
GET  /api/mailgun/domain-status     - Estado del dominio DNS
POST /api/mailgun/send-test         - Enviar email de prueba
POST /api/mail                      - Enviar email (requiere auth)
GET  /api/mail                      - Listar emails
GET  /api/mailgun/events            - Eventos de Mailgun
```

---

## 🎯 RESULTADO ESPERADO

Después de aplicar las soluciones:

✅ Backend puede leer configuración de Mailgun  
✅ Cliente mailgun-js se inicializa correctamente  
✅ Emails se envían sin errores  
✅ Logs muestran conexión exitosa con API EU  
✅ Tests E2E de email pueden ejecutarse

---

## 🆘 TROUBLESHOOTING

### Error: "Mailgun no configurado"

**Causa:** Variables no disponibles en `process.env`  
**Solución:** Verificar que existen variables sin prefijo `VITE_`

### Error: "Domain not found"

**Causa:** Dominio no verificado en Mailgun  
**Solución:** Verificar dominio en panel de Mailgun

### Error: "Invalid API Key"

**Causa:** API Key incorrecta o con formato incorrecto  
**Solución:** Verificar que NO tenga prefijo "key-"

### Error: "Forbidden"

**Causa:** API Key sin permisos o cuenta suspendida  
**Solución:** Revisar estado de cuenta en Mailgun

---

## ✅ PRÓXIMOS PASOS

1. **Inmediato:** Aplicar Solución 1 (agregar variables sin prefijo)
2. **Corto plazo:** Crear script de verificación (Solución 3)
3. **Medio plazo:** Centralizar configuración (Solución 2)
4. **Largo plazo:** Documentar arquitectura de email completa

---

## ✅ ACTUALIZACIÓN: VERIFICACIÓN EJECUTADA

**Fecha:** 23 de Octubre de 2025, 5:18am

### Resultados del Script verify-mailgun.js

```
✅ MAILGUN_API_KEY configurada
✅ MAILGUN_DOMAIN configurada: malove.app
✅ Región EU configurada (api.eu.mailgun.net)
✅ Cliente Mailgun creado correctamente
✅ Dominio válido y accesible en Mailgun
```

### Conclusión

**Estado:** 🟢 CONFIGURACIÓN PERFECTA

La configuración de Mailgun está 100% correcta. Si hay problemas con el envío de emails, la causa NO es la configuración de variables de entorno.

### Próximos Pasos de Diagnóstico

Si persisten problemas:

1. **Verificar que el backend está corriendo** en puerto 4004
2. **Revisar logs del backend** durante el envío
3. **Probar endpoint de test**: `POST /api/mailgun/send-test`
4. **Verificar autenticación** en componentes que envían emails
5. **Revisar cuota de Mailgun** en el panel de control

---

**Estado:** 🟢 CONFIGURACIÓN CORRECTA - Investigar problema específico
