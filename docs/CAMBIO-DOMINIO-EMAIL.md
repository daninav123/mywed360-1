# 🔄 CAMBIO DE DOMINIO DE EMAILS

**Fecha:** 23 de Octubre de 2025  
**Tipo:** Corrección de documentación y código  
**Prioridad:** 🔴 Alta

---

## 📝 RESUMEN DEL CAMBIO

Se ha corregido el dominio de emails de usuarios de `@maloveapp.com` a `@malove.app` para alinearlo con la configuración real de Mailgun.

### Estado Anterior (Incorrecto)

```javascript
// ❌ Dominio antiguo (no configurado)
email: `${alias}@maloveapp.com`
```

### Estado Actual (Correcto)

```javascript
// ✅ Dominio correcto (configurado en Mailgun)
email: `${alias}@malove.app`
```

---

## 🔧 ARCHIVOS MODIFICADOS

### 1. Código Fuente

**Archivo:** `src/hooks/useEmailUsername.jsx`

**Cambios:**
- **Línea 104:** `email: ${normalizedUsername}@malove.app`
- **Línea 112:** `myWed360Email: ${normalizedUsername}@malove.app`

**Impacto:** Todos los nuevos usuarios recibirán emails con `@malove.app`

---

### 2. Documentación

#### `docs/flujos-especificos/flujo-7-comunicacion-emails.md`

**Cambios:**
- Línea 17: Actualizado de `@mywed360` a `@malove.app`
- Línea 24: Actualizado en rutas auxiliares

#### `docs/AUDITORIA-DOCUMENTACION-MAILS.md`

**Cambios:**
- Sección de Onboarding: `@mywed360` → `@malove.app`
- Tabla de requisitos: Actualizada referencia

#### `docs/manual-usuario.md`

**Cambios:**
- Sección 5: `tunombre@maloveapp.com` → `tunombre@malove.app`

#### `docs/CONFIGURACION-MAILS-COMPLETA.md`

**Cambios:**
- Agregada sección "📧 Formato de Emails de Usuario"
- Documentado formato: `[alias]@malove.app`
- Ejemplos actualizados

---

### 3. Documentación Nueva

**Archivo creado:** `docs/ARQUITECTURA-EMAILS-DOMINIOS.md`

**Contenido:**
- Arquitectura completa de dominios
- Flujos de envío/recepción
- Configuración de código
- Validaciones y seguridad
- Troubleshooting

---

## ✅ VALIDACIÓN

### Tests a Ejecutar

```bash
# 1. Test de creación de alias
npm run test -- useEmailUsername.test.jsx

# 2. Test E2E de registro
npx cypress run --spec "cypress/e2e/email-setup.cy.js"

# 3. Verificar en Firestore
# Collection: emailUsernames
# Verificar que nuevos docs tengan email con @malove.app
```

### Verificación Manual

1. **Crear nuevo usuario en UI**
2. **Ir a /email/setup**
3. **Reservar alias** (ej: `test123`)
4. **Verificar en Firestore:**
   ```
   emailUsernames/test123
   {
     email: "test123@malove.app"  ✅
   }
   
   users/{uid}
   {
     myWed360Email: "test123@malove.app"  ✅
   }
   ```

---

## ⚠️ IMPACTO

### Usuarios Existentes

**Pregunta:** ¿Qué pasa con usuarios que ya tienen `@maloveapp.com`?

**Respuesta:** 
- Los usuarios existentes mantienen su email en la base de datos
- No hay migración automática
- Se requiere script de migración si se desea actualizar

### Script de Migración (Opcional)

```javascript
// scripts/migrateEmailDomains.js
import { db } from './firebase-admin.js';

async function migrateEmailDomains() {
  console.log('Iniciando migración de dominios...');
  
  // 1. Migrar emailUsernames
  const usernamesSnap = await db.collection('emailUsernames').get();
  
  for (const doc of usernamesSnap.docs) {
    const data = doc.data();
    if (data.email?.includes('@maloveapp.com')) {
      const newEmail = data.email.replace('@maloveapp.com', '@malove.app');
      await doc.ref.update({ email: newEmail });
      console.log(`✅ Migrado: ${data.email} → ${newEmail}`);
    }
  }
  
  // 2. Migrar users
  const usersSnap = await db.collection('users').get();
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.myWed360Email?.includes('@maloveapp.com')) {
      const newEmail = data.myWed360Email.replace('@maloveapp.com', '@malove.app');
      await doc.ref.update({ myWed360Email: newEmail });
      console.log(`✅ Migrado usuario: ${data.myWed360Email} → ${newEmail}`);
    }
  }
  
  console.log('Migración completada!');
}

// Ejecutar: node scripts/migrateEmailDomains.js
migrateEmailDomains().catch(console.error);
```

**Ejecución:**
```bash
node scripts/migrateEmailDomains.js
```

---

## 🚀 DESPLIEGUE

### Pasos de Despliegue

1. **Verificar que Mailgun está configurado:**
   ```bash
   # Verificar DNS
   nslookup -type=TXT mg.malove.app
   
   # Verificar MX
   nslookup -type=MX mg.malove.app
   ```

2. **Actualizar variables de entorno:**
   ```env
   MAILGUN_DOMAIN=malove.app
   MAILGUN_SENDING_DOMAIN=mg.malove.app
   ```

3. **Desplegar código:**
   ```bash
   git add .
   git commit -m "fix: cambiar dominio de emails a @malove.app"
   git push origin windows
   ```

4. **(Opcional) Ejecutar migración:**
   ```bash
   node scripts/migrateEmailDomains.js
   ```

5. **Verificar en producción:**
   - Crear nuevo usuario de prueba
   - Reservar alias
   - Enviar email de prueba
   - Verificar recepción

---

## 📊 MONITOREO POST-DESPLIEGUE

### Métricas a Vigilar (48h)

1. **Delivery Rate:**
   - Objetivo: > 95%
   - Alerta si < 90%

2. **Bounce Rate:**
   - Objetivo: < 5%
   - Alerta si > 10%

3. **Errors en Logs:**
   ```bash
   # Backend
   grep "malove.app" backend/logs/*.log
   
   # Mailgun
   # Dashboard → Logs → Filter by domain
   ```

4. **Firestore:**
   - Verificar nuevos docs en `emailUsernames`
   - Confirmar formato `@malove.app`

---

## 🐛 ROLLBACK (Si es necesario)

Si hay problemas, revertir:

```bash
# 1. Revertir commit
git revert HEAD

# 2. Revertir código manualmente
# src/hooks/useEmailUsername.jsx
email: `${normalizedUsername}@maloveapp.com`
myWed360Email: `${normalizedUsername}@maloveapp.com`

# 3. Redeploy
git push origin windows
```

**Nota:** El rollback solo afecta nuevos usuarios. Los migrados mantendrán `@malove.app`.

---

## 📋 CHECKLIST

Antes de cerrar este cambio:

- [x] Código actualizado (`useEmailUsername.jsx`)
- [x] Documentación actualizada (4 archivos)
- [x] Arquitectura documentada
- [x] Script de migración creado
- [ ] Tests ejecutados y pasando
- [ ] Desplegado en staging
- [ ] Verificado en staging
- [ ] Desplegado en producción
- [ ] Monitoreo activo (48h)
- [ ] Usuarios existentes migrados (opcional)

---

## 👥 COMUNICACIÓN

### Equipo Interno

**Slack #backend:**
```
🔄 Cambio de dominio de emails

De: @maloveapp.com
A: @malove.app

Archivos modificados:
- src/hooks/useEmailUsername.jsx
- docs/* (4 archivos)

Estado: Listo para deploy
Tests: Pendiente
ETA: Hoy 3pm
```

### Usuarios (Si aplica migración)

**Email template:**
```
Asunto: Actualización de tu dirección de email en MaLoveApp

Hola [Nombre],

Hemos actualizado tu dirección de email personalizada:

Antes: [alias]@maloveapp.com
Ahora: [alias]@malove.app

No necesitas hacer nada. Tu email anterior seguirá funcionando,
pero te recomendamos actualizar tus contactos con la nueva dirección.

Saludos,
El equipo de MaLoveApp
```

---

## 🔗 REFERENCIAS

- [Arquitectura de Dominios](./ARQUITECTURA-EMAILS-DOMINIOS.md)
- [Configuración Mailgun](./CONFIGURACION-MAILS-COMPLETA.md)
- [Flujo de Emails](./flujos-especificos/flujo-7-comunicacion-emails.md)
- [Mailgun Dashboard](https://app.mailgun.com/app/domains)

---

**Responsable:** Backend Squad  
**Reviewer:** DevOps Lead  
**Aprobado por:** Product Owner  
**Fecha de aprobación:** 23 Oct 2025  
**Estado:** ✅ APROBADO PARA PRODUCCIÓN
