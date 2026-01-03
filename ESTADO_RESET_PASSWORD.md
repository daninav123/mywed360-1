# ✅ SISTEMA RESET PASSWORD - OPERATIVO (CON LIMITACIÓN)

**Estado:** ✅ Funcional en desarrollo  
**Fecha:** 1 enero 2026, 16:35

---

## ✅ **LO QUE FUNCIONA**

### **1. Backend PostgreSQL (100% listo):**

```
✅ POST /api/auth/forgot-password
   - Genera token de reset (32 bytes hex)
   - Expira en 1 hora
   - Guarda en BD: resetToken + resetTokenExpiry

✅ POST /api/auth/reset-password
   - Valida token no expirado
   - Cambia password (bcrypt)
   - Invalida todas las sesiones del usuario
```

### **2. Frontend migrado a PostgreSQL:**

**Archivo:** `apps/main-app/src/pages/ResetPassword.jsx`

```javascript
// ANTES (Firebase):
import { sendPasswordResetEmail } from 'firebase/auth';
const { sendPasswordReset } = useAuth();
await sendPasswordReset(email);

// DESPUÉS (PostgreSQL):
import { useAuth } from '../hooks/useAuth';
const { resetPassword } = useAuth();
await resetPassword(email);
```

**Backup creado:** `ResetPassword.firebase.jsx`

---

## ⚠️ **LIMITACIÓN ACTUAL: EMAILS**

### **Problema:**
El backend **NO envía emails** todavía. Solo genera el token.

**En desarrollo**, el token se devuelve en la respuesta:
```json
{
  "message": "Si el email existe, recibirás instrucciones",
  "resetToken": "a1b2c3d4..." // Solo en NODE_ENV=development
}
```

**En producción**, el email NO se enviará hasta configurar servicio de email.

---

## 🔧 **CÓMO FUNCIONA AHORA (DESARROLLO)**

### **Paso 1: Usuario solicita reset**
```
URL: http://localhost:5173/reset-password
Ingresa: test@test.com
```

### **Paso 2: Backend responde (en consola del navegador)**
```javascript
// Respuesta de /api/auth/forgot-password
{
  "message": "Si el email existe, recibirás instrucciones",
  "resetToken": "abc123def456..." // Solo en dev
}
```

### **Paso 3: Usar token manualmente**
```bash
# Llamar API directamente con el token
curl -X POST http://localhost:4004/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "abc123def456...",
    "newPassword": "nuevaPassword123"
  }'
```

**O con Postman / Thunder Client**

---

## 🚀 **PARA HACERLO 100% OPERATIVO**

### **Opción A: Integrar servicio de email existente**

Ya tienes configurado Mailgun en el backend:

**1. Actualizar backend/routes/auth.js:**

```javascript
// Línea 297 - reemplazar TODO
import * as EmailService from '../services/emailService.js';

// En forgot-password endpoint:
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

await EmailService.sendEmail({
  to: user.email,
  subject: 'Resetear tu password - MaLoveApp',
  html: `
    <h2>Resetear password</h2>
    <p>Click en el link para crear una nueva password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>Este link expira en 1 hora.</p>
  `
});
```

**2. Crear página de confirmación:**

`apps/main-app/src/pages/ResetPasswordConfirm.jsx`

```javascript
// Recibe token por URL: /reset-password?token=abc123
// Formulario para ingresar nueva password
// Llama a /api/auth/reset-password con el token
```

---

### **Opción B: Sistema de email simple (NodeMailer)**

**1. Instalar:**
```bash
cd backend
npm install nodemailer
```

**2. Configurar en .env:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
FRONTEND_URL=http://localhost:5173
```

**3. Crear servicio:**
```javascript
// backend/services/emailReset.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(email, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password-confirm?token=${resetToken}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Resetear password - MaLoveApp',
    html: `
      <h2>Resetear tu password</h2>
      <p>Recibimos una solicitud para resetear tu password.</p>
      <p>Click aquí para crear una nueva password:</p>
      <a href="${resetLink}">Resetear password</a>
      <p>Este link expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este email.</p>
    `,
  });
}
```

---

## 📋 **CHECKLIST PARA 100% FUNCIONAL**

- [x] Backend API /api/auth/forgot-password
- [x] Backend API /api/auth/reset-password
- [x] Frontend ResetPassword.jsx migrado
- [x] Tokens en BD con expiración
- [ ] **Servicio de email configurado**
- [ ] **Página ResetPasswordConfirm.jsx**
- [ ] **Templates de email profesionales**
- [ ] **Testing completo del flujo**

---

## 🧪 **TESTING ACTUAL (DESARROLLO)**

**Puedes probar todo excepto el envío de emails:**

### **1. Solicitar reset:**
```
http://localhost:5173/reset-password
Email: test@test.com
```

### **2. Ver token en consola del navegador (Network tab)**

### **3. Usar token con curl:**
```bash
curl -X POST http://localhost:4004/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken":"TOKEN_AQUI","newPassword":"nuevaPass123"}'
```

### **4. Verificar password cambiada:**
```
http://localhost:5173/login
Email: test@test.com
Password: nuevaPass123
```

---

## 📊 **COMPARACIÓN**

### **ANTES (Firebase):**
```
✅ sendPasswordResetEmail() automático
✅ Email enviado por Firebase
✅ Link de reset automático
❌ Dependencia de Firebase
```

### **AHORA (PostgreSQL):**
```
✅ Control total del proceso
✅ Tokens en nuestra BD
✅ Personalización completa
⚠️ Requiere configurar email (1 vez)
```

---

## ✅ **RESUMEN**

**Estado actual:**
- Backend: ✅ 100% funcional
- Frontend: ✅ 100% migrado
- Emails: ⚠️ Pendiente configurar

**Para producción:**
- Agregar envío de emails (30-60 min)
- Crear página de confirmación (15 min)
- Testing completo (30 min)

**Total tiempo:** 1.5-2 horas adicionales

---

**¿Quieres que configure el sistema de emails ahora?**
