# Guía de Deploy en Vercel - Planivia

## 🚀 Pasos para Deploy

### 1. Instalar Vercel CLI (opcional pero recomendado)

```bash
npm install -g vercel
```

### 2. Deploy desde GitHub (Recomendado)

#### Opción A: Deploy desde la Web de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Click en **"Add New Project"**
4. Selecciona el repositorio **"Planivia"**
5. Configura el proyecto:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/main-app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Añade las variables de entorno (ver sección abajo)
7. Click en **"Deploy"**

#### Opción B: Deploy desde CLI

```bash
# En la raíz del proyecto
cd /home/dani/mywed360-1

# Login en Vercel
vercel login

# Deploy (primera vez)
vercel

# Seguir las instrucciones:
# - Set up and deploy? Yes
# - Which scope? [Tu cuenta]
# - Link to existing project? No
# - Project name: planivia
# - Directory: apps/main-app
# - Override settings? No

# Deploy a producción
vercel --prod
```

### 3. Configurar Variables de Entorno en Vercel

Ve a: **Project Settings > Environment Variables**

#### Variables OBLIGATORIAS para Pre-Lanzamiento:

```env
# Modo Pre-Lanzamiento (IMPORTANTE para el banner)
VITE_PRE_LAUNCH_MODE=true
VITE_LAUNCH_DATE=31 de enero de 2026

# App
VITE_APP_NAME=Planivia

# Backend
VITE_BACKEND_BASE_URL=https://tu-backend.render.com
VITE_DOMAIN=planivia.net
VITE_ROLE=owner
```

#### Variables de Firebase (Auth):

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

#### Variables Opcionales (para funciones avanzadas):

```env
# AI Features
VITE_ENABLE_AI_SUPPLIERS=true
VITE_OPENAI_API_KEY=tu_openai_key
VITE_OPENAI_PROJECT_ID=tu_project_id

# Mailgun
VITE_MAILGUN_API_KEY=tu_mailgun_key
VITE_MAILGUN_DOMAIN=mg.planivia.net
VITE_MAILGUN_SENDING_DOMAIN=planivia.net
VITE_MAILGUN_EU_REGION=true

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Search APIs
VITE_SEARCH_PROVIDER=tavily
VITE_GOOGLE_PLACES_API_KEY=tu_google_key
VITE_PINTEREST_API_KEY=tu_pinterest_key
VITE_UNSPLASH_ACCESS_KEY=tu_unsplash_key
VITE_YELP_API_KEY=tu_yelp_key
```

### 4. Configurar Dominio Personalizado (Opcional)

1. Ve a **Project Settings > Domains**
2. Click en **"Add"**
3. Ingresa tu dominio: `planivia.net`
4. Sigue las instrucciones para configurar DNS:
   - Tipo: `A`
   - Nombre: `@`
   - Valor: `76.76.21.21`

   O para CNAME:
   - Tipo: `CNAME`
   - Nombre: `www`
   - Valor: `cname.vercel-dns.com`

### 5. Verificar Deploy

Una vez completado el deploy:

1. Vercel te dará una URL: `https://planivia.vercel.app`
2. Visita la URL y verifica:
   - ✅ Banner de pre-lanzamiento visible
   - ✅ Páginas públicas funcionando (landing, pricing, etc.)
   - ✅ Login/Signup bloqueados con mensaje
   - ✅ Logo correcto mostrándose

### 6. Configurar Backend (si no está en Vercel)

Si tu backend está en Render u otra plataforma:

1. Asegúrate que el backend esté corriendo
2. Actualiza `VITE_BACKEND_BASE_URL` con la URL correcta
3. Configura CORS en el backend para permitir tu dominio de Vercel

**Backend CORS:**

```javascript
// En tu backend
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://planivia.vercel.app',
      'https://planivia.net',
      'https://www.planivia.net',
    ],
    credentials: true,
  })
);
```

## 📋 Checklist Post-Deploy

- [ ] Banner de pre-lanzamiento visible en páginas públicas
- [ ] Login bloqueado con mensaje "Disponible el 31 de enero de 2026"
- [ ] Signup bloqueado con mensaje
- [ ] Páginas públicas funcionando:
  - [ ] Landing (/)
  - [ ] Funcionalidades (/app)
  - [ ] Precios (/precios)
  - [ ] Para Proveedores (/para-proveedores)
  - [ ] Para Planners (/para-planners)
  - [ ] Partners (/partners)
- [ ] Logo correcto mostrándose (323x104px, sin espacios)
- [ ] Imágenes cargando correctamente
- [ ] Favicon visible

## 🔄 Redeploy y Actualizaciones

### Deploy automático:

- Cada push a `main` en GitHub dispara un deploy automático

### Deploy manual desde CLI:

```bash
vercel --prod
```

### Rollback a versión anterior:

1. Ve a **Deployments** en Vercel
2. Encuentra el deployment anterior
3. Click en **"..."** > **"Promote to Production"**

## 🎉 Activar Lanzamiento (31 de enero)

Cuando llegue la fecha de lanzamiento:

1. Ve a **Project Settings > Environment Variables**
2. Cambia `VITE_PRE_LAUNCH_MODE` de `true` a `false`
3. Vercel hará redeploy automáticamente
4. El banner desaparecerá y login/signup funcionarán normalmente

## ⚠️ Troubleshooting

### Build falla:

- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en la pestaña **Deployments**
- Asegúrate que `apps/main-app/dist` no esté en `.gitignore`

### Páginas no cargan:

- Verifica que el `vercel.json` esté en la raíz del proyecto
- Revisa las reglas de rewrite

### Variables de entorno no funcionan:

- Las variables `VITE_*` se cargan en build time
- Después de cambiar variables, Vercel hace redeploy automático
- Si no, fuerza redeploy: **Deployments > ... > Redeploy**

### Backend no responde:

- Verifica `VITE_BACKEND_BASE_URL`
- Asegúrate que el backend tenga CORS configurado para tu dominio Vercel

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Última actualización:** 3 de enero de 2026
