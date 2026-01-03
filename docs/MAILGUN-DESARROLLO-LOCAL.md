# 🔧 CONFIGURACIÓN DE MAILGUN PARA DESARROLLO LOCAL

## ⚠️ **PROBLEMA**

Las Routes de Mailgun apuntan a:
```
https://MaLove.App-backend.onrender.com/api/inbound/mailgun
```

Pero estás trabajando en:
```
http://localhost:4004
```

Mailgun **NO puede llegar a localhost** directamente porque es tu máquina local.

---

## ✅ **SOLUCIÓN: Usar ngrok**

### **Paso 1: Instalar ngrok** (si no lo tienes)

```bash
# Opción A: Descargar desde web
https://ngrok.com/download

# Opción B: Con Chocolatey (Windows)
choco install ngrok

# Opción C: Con scoop (Windows)
scoop install ngrok
```

### **Paso 2: Registrarte en ngrok** (gratis)

1. Ve a: https://dashboard.ngrok.com/signup
2. Copia tu authtoken
3. Ejecuta:
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

### **Paso 3: Exponer tu backend**

En una terminal separada:

```bash
ngrok http 4004
```

Verás algo como:
```
Forwarding: https://abc123-xx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:4004
```

**Copia esa URL**: `https://abc123-xx-xxx-xxx-xxx.ngrok-free.app`

### **Paso 4: Actualizar Route en Mailgun**

1. Ve a: https://app.mailgun.com/app/receiving/routes
2. Edita tu Route existente
3. Cambia las Actions a:

```
forward("https://abc123-xx-xxx-xxx-xxx.ngrok-free.app/api/inbound/mailgun")
store(notify="https://abc123-xx-xxx-xxx-xxx.ngrok-free.app/api/inbound/mailgun")
stop()
```

4. Guarda

### **Paso 5: Probar**

Envía un email desde Gmail a: `dani@malove.app`

**Resultado esperado:**
- ✅ Email aparece en la app en "Recibidos"
- ✅ Ves en los logs del backend: `Email recibido de Mailgun`
- ✅ Ves en la terminal de ngrok el POST request

---

## 🔄 **Opción 2: Desplegar en Render** (15-30 minutos)

Si prefieres trabajar con el backend desplegado:

### **Verificar que Render esté corriendo**

```bash
curl https://MaLove.App-backend.onrender.com/health
```

Si responde 200 OK, entonces la Route ya está bien configurada.

### **Si Render no responde:**

1. Ve a: https://dashboard.render.com/
2. Selecciona tu servicio `MaLove.App-backend`
3. Ve a **Logs** para ver errores
4. Si está en "Sleeping", espera a que despierte (puede tardar ~1 min)
5. Re-despliega si es necesario: Click **Manual Deploy** → **Deploy latest commit**

### **Variables de Entorno en Render**

Asegúrate de que Render tenga las mismas variables que en `.env`:

```
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=malove.app
MAILGUN_SIGNING_KEY=your-mailgun-signing-key-here
MAILGUN_EU_REGION=true
GOOGLE_APPLICATION_CREDENTIALS=[path-to-serviceAccount.json]
```

---

## 📊 **COMPARACIÓN**

| Opción | Tiempo | Ventajas | Desventajas |
|--------|--------|----------|-------------|
| **ngrok** | 2 min | Muy rápido, desarrollo local | URL cambia cada vez que lo reinicias |
| **Render** | 15-30 min | URL permanente, producción-ready | Más lento, cold starts |

---

## 🎯 **RECOMENDACIÓN**

Para **desarrollo y testing rápido**: Usa **ngrok**

Para **producción**: Usa **Render**

---

## 🧪 **DEBUGGING**

### **Ver requests en tiempo real con ngrok**

En la terminal de ngrok verás:
```
POST /api/inbound/mailgun  200 OK
```

### **Ver logs del backend**

```bash
cd backend
npm run dev

# Busca:
# "Email recibido de Mailgun: dani@malove.app"
```

### **Ver logs de Mailgun**

1. https://app.mailgun.com/app/logs
2. Filtra por: `recipient:dani@malove.app`
3. Verás el status de entrega y si la Route se ejecutó

---

## 💡 **TIP: Mantener ngrok corriendo**

Si usas ngrok frecuentemente, usa un dominio fijo (plan de pago):

```bash
ngrok http --domain=tu-dominio-fijo.ngrok-free.app 4004
```

Así no tendrás que cambiar la Route cada vez.

---

## ✅ **CHECKLIST**

- [ ] ngrok instalado
- [ ] ngrok authtoken configurado
- [ ] ngrok corriendo: `ngrok http 4004`
- [ ] URL de ngrok copiada
- [ ] Route de Mailgun actualizada con URL de ngrok
- [ ] Backend corriendo: `cd backend && npm run dev`
- [ ] Test de email enviado
- [ ] Email aparece en "Recibidos" ✅

---

**Última actualización:** 2025-10-23  
**Recomendado para:** Desarrollo local
