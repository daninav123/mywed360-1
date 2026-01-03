# Modo Pre-Lanzamiento - Configuración para Deploy

## 📋 Descripción

El modo pre-lanzamiento permite desplegar la aplicación en producción mientras se bloquea el acceso a login/signup, permitiendo solo la visualización de páginas públicas (landing, pricing, etc.).

## 🎯 Funcionalidad

### Cuando está activado (`VITE_PRE_LAUNCH_MODE=true`):

✅ **Páginas públicas accesibles:**
- Landing page (`/`)
- Funcionalidades (`/app`)
- Precios (`/precios`)
- Para Proveedores (`/para-proveedores`)
- Para Planners (`/para-planners`)
- Partners (`/partners`)
- Todas las páginas de marketing

⛔ **Acciones bloqueadas:**
- Login (muestra mensaje de pre-lanzamiento)
- Signup/Registro (muestra mensaje de pre-lanzamiento)
- Acceso a áreas privadas

🎨 **Banner informativo:**
- Aparece en todas las páginas públicas
- Muestra fecha de lanzamiento
- Diseño amarillo/dorado llamativo

## ⚙️ Configuración

### Variables de entorno requeridas:

```bash
# En tu archivo .env de producción
VITE_PRE_LAUNCH_MODE=true
VITE_LAUNCH_DATE=31 de enero de 2026
```

### Para desarrollo local (desactivado):

```bash
# En tu archivo .env local
VITE_PRE_LAUNCH_MODE=false
VITE_LAUNCH_DATE=31 de enero de 2026
```

## 🚀 Pasos para Deploy

### 1. Configurar variables en tu plataforma de hosting

**Netlify:**
```
Site settings > Build & deploy > Environment variables
VITE_PRE_LAUNCH_MODE = true
VITE_LAUNCH_DATE = 31 de enero de 2026
```

**Vercel:**
```
Project Settings > Environment Variables
VITE_PRE_LAUNCH_MODE = true
VITE_LAUNCH_DATE = 31 de enero de 2026
```

**Render/Railway:**
```
Environment > Add Environment Variable
VITE_PRE_LAUNCH_MODE = true
VITE_LAUNCH_DATE = 31 de enero de 2026
```

### 2. Rebuild y Deploy

Después de configurar las variables:
```bash
npm run build
# o deja que tu plataforma haga el build automático
```

### 3. Verificación

Visita tu sitio en producción y verifica:
- ✅ Banner de pre-lanzamiento visible en páginas públicas
- ✅ Login bloqueado con mensaje informativo
- ✅ Signup bloqueado con mensaje informativo
- ✅ Páginas públicas funcionando normalmente

## 🎉 Activar el lanzamiento

Cuando llegue el **31 de enero de 2026**:

1. Cambiar variable de entorno:
   ```
   VITE_PRE_LAUNCH_MODE = false
   ```

2. Rebuild y redeploy

3. La aplicación funcionará normalmente sin restricciones

## 📝 Archivos modificados

- `apps/main-app/.env.example` - Variables de ejemplo
- `apps/main-app/src/pages/Login.jsx` - Bloqueo de login
- `apps/main-app/src/pages/Signup.jsx` - Bloqueo de signup
- `apps/main-app/src/components/PreLaunchBanner.jsx` - Banner informativo
- `apps/main-app/src/components/theme/WeddingTheme.jsx` - Integración del banner

## 🧪 Testing Local

Para probar el modo pre-lanzamiento en local:

```bash
# En tu .env
VITE_PRE_LAUNCH_MODE=true

# Reinicia el servidor de desarrollo
npm run dev
```

Deberías ver:
- Banner amarillo en la parte superior
- Login/Signup bloqueados con mensaje
- Páginas públicas funcionando

## ⚠️ Importante

- Las variables `VITE_*` solo se cargan en build time
- Cambiar variables requiere rebuild de la aplicación
- En local, cambiar `.env` requiere reiniciar `npm run dev`
- El backend NO se ve afectado por estas variables (solo frontend)

## 🎨 Personalización

### Cambiar fecha de lanzamiento:
```bash
VITE_LAUNCH_DATE=15 de febrero de 2026
```

### Cambiar mensaje (editar archivos):
- `Login.jsx` línea ~107
- `Signup.jsx` línea ~89
- `PreLaunchBanner.jsx` líneas ~42-48

---

**Última actualización:** 3 de enero de 2026
