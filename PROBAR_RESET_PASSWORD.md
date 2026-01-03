# 🧪 PROBAR SISTEMA DE RESET PASSWORD

**DNS verificado ✅**  
**Backend con planivia.net configurado ✅**  
**Frontend con rutas añadidas ✅**

---

## ✅ **CAMBIOS COMPLETADOS:**

1. ✅ Dominio cambiado a `planivia.net` en `.env`
2. ✅ DNS configurados en Namecheap (5 registros)
3. ✅ DNS verificados en Mailgun (todo en verde)
4. ✅ Ruta `/reset-password-confirm` añadida en App.jsx
5. ✅ Backend reiniciando con nueva configuración

---

## 🧪 **FLUJO COMPLETO DE TESTING:**

### **PASO 1: Solicitar reset password**

**1.1 Ir a la página:**
```
http://localhost:5173/reset-password
```

**1.2 Ingresar email:**
- Usa un email real tuyo (para recibirlo)
- Ejemplo: `tu-email@gmail.com`

**1.3 Click "Enviar"**

**1.4 Verificar mensaje:**
```
"Si el email existe, recibirás instrucciones"
```

---

### **PASO 2: Revisar email recibido**

**2.1 Abrir tu bandeja de entrada**

**2.2 Buscar email de:**
```
De: MaLoveApp <noreply@mg.planivia.net>
Asunto: Resetear tu password - MaLoveApp
```

**2.3 Verificar contenido:**
- ✅ Diseño profesional HTML
- ✅ Link para resetear password
- ✅ Aviso de expiración (1 hora)
- ✅ Advertencia de seguridad

**⚠️ Si no llega:**
- Revisar spam/junk
- Esperar 1-2 minutos
- Verificar logs del backend

---

### **PASO 3: Click en el link del email**

**3.1 Click en "Resetear mi password"**

Abrirá:
```
http://localhost:5173/reset-password-confirm?token=XXXXXXXX
```

**3.2 Verificar página carga correctamente**
- Debería mostrar formulario
- 2 campos: "Nueva contraseña" y "Confirmar contraseña"

---

### **PASO 4: Ingresar nueva password**

**4.1 Completar formulario:**
```
Nueva contraseña: ********
Confirmar: ********
```

**4.2 Click "Cambiar contraseña"**

**4.3 Verificar mensaje de éxito:**
```
"Contraseña actualizada correctamente"
```

**4.4 Redirección automática a:**
```
/login
```

---

### **PASO 5: Login con nueva password**

**5.1 Ir a:**
```
http://localhost:5173/login
```

**5.2 Ingresar:**
```
Email: tu-email@gmail.com
Password: [la nueva que creaste]
```

**5.3 Click "Iniciar sesión"**

**5.4 Verificar login exitoso:**
```
Debería entrar a la app
```

---

## 📊 **CHECKLIST DE VERIFICACIÓN:**

- [ ] Página /reset-password carga
- [ ] Formulario permite ingresar email
- [ ] Mensaje de confirmación aparece
- [ ] Email llega a bandeja de entrada (o spam)
- [ ] Email tiene diseño profesional
- [ ] Link del email funciona
- [ ] Página /reset-password-confirm carga con token
- [ ] Formulario de nueva password funciona
- [ ] Mensaje de éxito aparece
- [ ] Redirección a /login funciona
- [ ] Login con nueva password exitoso

---

## 🔍 **VERIFICAR LOGS DEL BACKEND:**

**Abrir terminal del backend y buscar:**

```
[Auth] Solicitud de reset password para: tu-email@gmail.com
[Email] Enviando email de reset a: tu-email@gmail.com
[Email] Email enviado exitosamente
```

**Si hay errores:**
```
[Auth] Error al enviar email: ...
```

---

## ⚠️ **POSIBLES PROBLEMAS Y SOLUCIONES:**

### **Email no llega:**

**Problema:** DNS aún propagándose  
**Solución:** Esperar 5-10 minutos más

**Problema:** Email en spam  
**Solución:** Revisar carpeta spam/junk

**Problema:** Error en backend  
**Solución:** Verificar logs, revisar MAILGUN_API_KEY

---

### **Link no funciona:**

**Problema:** Token expiró (1 hora)  
**Solución:** Solicitar nuevo reset

**Problema:** Token inválido  
**Solución:** Verificar que copiaste el link completo

---

### **Password no se actualiza:**

**Problema:** Passwords no coinciden  
**Solución:** Verificar que escribiste igual en ambos campos

**Problema:** Password muy corta  
**Solución:** Usar mínimo 6 caracteres

---

## 📧 **EJEMPLO DE EMAIL RECIBIDO:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Resetear tu contraseña
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hola,

Recibimos una solicitud para resetear tu 
contraseña en MaLoveApp.

┌─────────────────────────────────────┐
│   [ Resetear mi contraseña ]        │
└─────────────────────────────────────┘

⏰ Este link expira en 1 hora

⚠️ Si no solicitaste este cambio, 
   ignora este email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2026 MaLoveApp - Planivia
```

---

## 🚀 **PRÓXIMOS PASOS DESPUÉS DE TESTING:**

**Si todo funciona:**
- ✅ Sistema 100% operativo
- ✅ Firebase eliminado completamente
- ✅ PostgreSQL auth completo
- ✅ Emails funcionando con planivia.net

**Opcional:**
- Actualizar templates de email (personalizar más)
- Añadir rate limiting (prevenir spam)
- Logs adicionales para auditoría

---

## 💡 **RESUMEN:**

**El sistema completo incluye:**

1. **Backend API:**
   - POST `/api/auth/forgot-password` → Genera token y envía email
   - POST `/api/auth/reset-password` → Valida token y actualiza password

2. **Frontend:**
   - `/reset-password` → Solicitar reset
   - `/reset-password-confirm` → Confirmar nueva password

3. **Email:**
   - Servicio Mailgun con `emailResetService.js`
   - Templates HTML profesionales
   - Dominio verificado: `mg.planivia.net`

4. **Seguridad:**
   - Token único de 32 bytes (hex)
   - Expiración 1 hora
   - bcrypt para hash de password
   - No revela si email existe

---

**¡Ahora prueba el flujo completo!**

**Ve a:** `http://localhost:5173/reset-password`
