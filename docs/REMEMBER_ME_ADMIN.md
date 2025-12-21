# Sistema "Recordar Dispositivo" - Panel de Administración

## Descripción

El sistema de "Recordar Dispositivo" permite que el panel de administración recuerde tu sesión durante **30 días**, eliminando la necesidad de introducir contraseña y MFA en cada recarga.

---

## Características

### ** Lo Que Ya NO Necesitas Hacer**

- Introducir contraseña cada vez que recargas
- Introducir código MFA cada vez que recargas  
- Volver a autenticarte si se reinicia el backend
- Perder la sesión al cerrar el navegador

### ** Lo Que Sí Funciona Ahora**

- **Sesión persistente de 30 días**
- **Skip automático de MFA** en dispositivos confiables
- **Auto-login** al recargar la página
- **Independiente** de reinicios del frontend/backend
- **Múltiples dispositivos** (hasta 5 simultáneos)
- **Revocación individual** de dispositivos

---

## Cómo Usar

### **1 Primer Login (Dispositivo Nuevo)**

1. Ve al login de administración: `/admin/login`
2. **Marca el checkbox** "Recordar este dispositivo (30 días)"
3. Introduce tu **email** y **contraseña**
4. Introduce el **código MFA** de 6 dígitos
5. ¡Listo! Ya no tendrás que volver a poner MFA en este dispositivo

```

  Email: admin@maloveapp.com          
  Contraseña:               
   Recordar este dispositivo (30d)   → MARCAR AQUÍ
         [ Acceder ]                 

```

### **2 Recargas Posteriores**

Simplemente **recarga la página** o **abre el navegador** y:
- Entrarás automáticamente (sin pedir nada)
- Tu sesión sigue activa por 30 días
- Puedes cerrar el navegador y volver sin problema

### **3 Nuevo Login en el Mismo Dispositivo**

Si haces logout o la sesión expira:
- Solo te pedirá **contraseña**
- **NO pedirá MFA** (porque el dispositivo ya es confiable)
- Puedes volver a marcar "recordar" para extender 30 días más

### **4 Dispositivo Completamente Nuevo**

Si accedes desde otro ordenador/navegador:
- Te pedirá **contraseña + MFA** (seguridad completa)
- Marca "recordar" si quieres que ese dispositivo también sea confiable
- Puedes tener hasta **5 dispositivos confiables** al mismo tiempo

---

## Seguridad

### **¿Es Seguro?**

**Sí, completamente seguro:**

| Medida de Seguridad | Descripción |
|---------------------|-------------|
| = **Cookies HttpOnly** | No accesibles desde JavaScript (protección XSS) |
| = **Cookies Secure** | Solo se envían por HTTPS en producción |
| = **SameSite Strict** | Protección contra CSRF |
| < **Device Fingerprint** | ID único basado en User Agent + IP |
| → **Expiración 30 días** | Revocación automática después de 1 mes |
| ≤ **Máx 5 dispositivos** | Limita dispositivos simultáneos |
| = **Tracking de uso** | Registra última vez usado y contador |
| = **Limpieza automática** | Elimina dispositivos expirados |
| L **Revocación manual** | Puedes eliminar dispositivos en cualquier momento |

### **Cookies Utilizadas**

```javascript
// 1. Sesión de admin (30 días)
admin_session = "adm_abc123..." 
   httpOnly: true
   secure: true (producción)
   maxAge: 30 días

// 2. ID del dispositivo (30 días)
admin_device_id = "dev_xyz789..."
   httpOnly: true
   secure: true (producción)
   maxAge: 30 días

// 3. Flag para UI (30 días)
admin_remember = "1"
   httpOnly: false (visible para React)
   secure: true (producción)
   maxAge: 30 días
```

---

## Casos de Uso

### **Caso 1: Trabajo Diario**

**Situación:** Trabajas todos los días en el panel de admin desde tu ordenador del trabajo.

**Solución:**
1. Marca "recordar" en el primer login
2. Durante 30 días: simplemente abre `/admin` y entras directamente
3. Sin fricciones, sin MFA cada vez

---

### **Caso 2: Múltiples Dispositivos**

**Situación:** Usas el panel desde tu ordenador del trabajo y tu portátil personal.

**Solución:**
1. Marca "recordar" en ambos dispositivos
2. Ambos quedan registrados como confiables
3. En cualquiera de los dos: acceso directo sin MFA

---

### **Caso 3: Dispositivo Compartido**

**Situación:** Usas un ordenador compartido o público.

**Solución:**
1. **NO marques** "recordar dispositivo"
2. Al hacer logout, no se guarda como confiable
3. Próxima persona que lo use: pedirá MFA completo

---

### **Caso 4: Dispositivo Robado**

**Situación:** Se te pierde el portátil o te lo roban.

**Solución:**
1. Ve a `/admin/settings` (desde otro dispositivo)
2. Sección "Dispositivos Confiables"
3. Identifica el dispositivo y revócalo
4. Inmediatamente deja de tener acceso

---

## Gestión de Dispositivos

### **Ver Dispositivos Confiables**

```http
GET /api/admin/trusted-devices
```

**Respuesta:**
```json
{
  "devices": [
    {
      "deviceId": "dev_abc123...",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-10-22T12:00:00Z",
      "lastUsedAt": "2025-10-22T18:00:00Z",
      "usageCount": 45
    },
    {
      "deviceId": "dev_xyz789...",
      "browser": "Safari",
      "os": "macOS",
      "ipAddress": "192.168.1.101",
      "createdAt": "2025-10-20T09:00:00Z",
      "lastUsedAt": "2025-10-21T17:30:00Z",
      "usageCount": 12
    }
  ]
}
```

### **Revocar un Dispositivo**

```http
DELETE /api/admin/trusted-devices/dev_abc123...
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dispositivo revocado correctamente"
}
```

### **Logout y Olvidar Dispositivo**

```http
POST /api/admin/logout
{
  "forgetDevice": true
}
```

Esto:
- Cierra la sesión actual
- Revoca el dispositivo confiable
- Limpia todas las cookies
- Próximo login: pedirá MFA de nuevo

---

## UI en el Panel

### **Login Form**

```

   =  Acceso Administrador                  
“$
                                             
   Email corporativo                         
     
    admin@maloveapp.com                     
     
                                             
   Contraseña                                
     
                             
     
                                             
    Recordar este dispositivo (30 días)      → CHECKBOX FUNCIONAL
                                             
          [ Acceder ]                        
                                             
     
    Problemas para entrar?               
     

```

### **Settings - Dispositivos (Próximamente)**

```

   →  Configuración > Dispositivos          
“$
                                             
   = Chrome en Windows                      
   IP: 192.168.1.100                         
   ltimo uso: Hace 2 horas                  
   Registrado: 22 Oct 2025                   
   [ Revocar ]                               
                                             
   = Safari en macOS                        
   IP: 192.168.1.101                         
   ltimo uso: Ayer a las 17:30             
   Registrado: 20 Oct 2025                   
   [ Revocar ]                               
                                             
   + Has usado 2 de 5 dispositivos mximos   

```

---

## Testing

### **Probar el Sistema**

```bash
# 1. Login con remember me
curl -X POST http://localhost:4004/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maloveapp.com",
    "password": "AdminPass123!",
    "rememberMe": true
  }'

# 2. MFA (código de prueba: 123456)
curl -X POST http://localhost:4004/api/admin/login/mfa \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "mfa_abc123...",
    "resumeToken": "res_xyz789...",
    "code": "123456",
    "rememberMe": true
  }'

# 3. Listar dispositivos
curl -X GET http://localhost:4004/api/admin/trusted-devices \
  -H "Cookie: admin_session=adm_..."

# 4. Revocar dispositivo
curl -X DELETE http://localhost:4004/api/admin/trusted-devices/dev_abc123... \
  -H "Cookie: admin_session=adm_..."

# 5. Logout + olvidar
curl -X POST http://localhost:4004/api/admin/logout \
  -H "Content-Type: application/json" \
  -d '{"forgetDevice": true}'
```

---

## → Configuración

### **Variables de Entorno**

```env
# Backend .env
ADMIN_REQUIRE_MFA=true                    # Requiere MFA (default: true)
ADMIN_SESSION_TTL_MINUTES=43200           # 30 días (default: 720 = 12h)
ADMIN_MFA_WINDOW_SECONDS=90               # Ventana MFA (default: 90s)
ADMIN_EMAIL=admin@maloveapp.com             # Email del admin
ADMIN_PASSWORD=AdminPass123!              # Contraseña (o usa ADMIN_PASSWORD_HASH)
ADMIN_MFA_TEST_CODE=123456                # Código MFA de prueba (dev only)
```

### **Firestore Collection**

```
adminTrustedDevices/
  dev_abc123456.../
    deviceId: "dev_abc123456..."
    email: "admin@maloveapp.com"
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
    ipAddress: "192.168.1.100"
    browser: "Chrome"
    os: "Windows"
    fingerprint: "a1b2c3d4e5f6g7h8"
    trusted: true
    createdAt: Timestamp
    lastUsedAt: Timestamp
    expiresAt: Timestamp (+30 días)
    usageCount: 45
```

---

## Troubleshooting

### **Problema: No recuerda mi dispositivo**

**Soluciones:**
1.  Verifica que marcaste el checkbox "Recordar dispositivo"
2.  Asegúrate de completar el flujo MFA
3.  Revisa que las cookies no están bloqueadas
4.  Abre DevTools → Application → Cookies → Busca `admin_device_id`

### **Problema: Pide MFA aunque marqué recordar**

**Soluciones:**
1.  Verifica en DevTools que existe la cookie `admin_device_id`
2.  Comprueba que no han pasado más de 30 días
3.  Revisa logs del backend: `[trustedDevices] Error checking trust`

### **Problema: No puedo revocar un dispositivo**

**Soluciones:**
1.  Endpoint: `DELETE /api/admin/trusted-devices/:deviceId`
2.  Necesitas estar autenticado con sesión admin válida
3.  El deviceId debe existir en Firestore

---

## Referencias

- **Código Backend:** `backend/services/trustedDevices.js`
- **Código Rutas:** `backend/routes/admin-auth.js`
- **Código Frontend:** `src/pages/admin/AdminLogin.jsx`
- **Hook Auth:** `src/hooks/useAuth.jsx`

---

## Conclusión

El sistema de "Recordar Dispositivo" está **100% funcional** y listo para usar. Simplemente marca el checkbox en tu próximo login y disfruta de 30 días sin tener que introducir contraseña ni MFA cada vez que recargas.

**¡Adiós a la fricción del login repetitivo!**
