# Migración del Proyecto MyWed360 a Nuevo Ordenador

## 📥 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Daniel-Navarro-Campos/mywed360.git
cd mywed360
git checkout windows
```

## ⚙️ Paso 2: Instalar Dependencias

### Requisitos Previos

- **Node.js**: v20 o superior
- **npm**: v10 o superior
- **Git**: Última versión

### Instalar Dependencias del Proyecto

```bash
# Instalar dependencias raíz (frontend)
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..
```

## 🔐 Paso 3: Configurar Variables de Entorno

### Frontend (.env en raíz)

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Firebase
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Backend
VITE_BACKEND_URL=http://localhost:4004
VITE_BACKEND_BASE_URL=https://mywed360-backend.onrender.com

# OpenAI
VITE_OPENAI_API_KEY=tu_openai_key

# Puertos
FRONTEND_PORT=5173
BACKEND_PORT=4004

# Features
VITE_ENABLE_LEGACY_FALLBACKS=false

# Defaults
VITE_DEFAULT_COUNTRY_CODE=+34
```

### Backend (backend/.env)

Crea un archivo `.env` en la carpeta `backend/` con:

```env
# Puerto
PORT=4004

# Firebase Admin
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json

# Mailgun
MAILGUN_API_KEY=tu_mailgun_key
MAILGUN_DOMAIN=tu_dominio
MAILGUN_SIGNING_KEY=tu_signing_key
MAILGUN_EU_REGION=true

# OpenAI
OPENAI_API_KEY=tu_openai_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# CORS
ALLOWED_ORIGIN=http://localhost:5173

# GitHub
GITHUB_PAT=tu_github_token
```

## 🔑 Paso 4: Configurar Credenciales de Firebase

1. Descarga tu archivo `serviceAccount.json` desde Firebase Console
2. Colócalo en la carpeta `backend/` del proyecto
3. Asegúrate de que `.gitignore` incluye este archivo (ya está configurado)

## 🚀 Paso 5: Ejecutar el Proyecto

### Opción A: Ejecutar Todo Simultáneamente (Recomendado)

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:

- Frontend en `http://localhost:5173`
- Backend en `http://localhost:4004`

### Opción B: Ejecutar por Separado

**Terminal 1 - Frontend:**

```bash
npm run dev
```

**Terminal 2 - Backend:**

```bash
cd backend
npm start
```

## ✅ Paso 6: Verificar la Instalación

1. **Frontend**: Abre `http://localhost:5173` en tu navegador
2. **Backend Health Check**: Abre `http://localhost:4004/health`

Deberías ver:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": { ... }
}
```

## 📚 Estructura del Proyecto

```
mywed360/
├── backend/              # API Node.js + Express
│   ├── routes/          # Endpoints REST
│   ├── services/        # Lógica de negocio
│   ├── middleware/      # Autenticación, validación
│   └── .env            # Variables backend (crear)
├── src/                 # Frontend React
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   ├── services/       # Servicios frontend
│   └── i18n/           # Traducciones (es, en, fr)
├── cypress/            # Tests E2E
├── docs/               # Documentación técnica
├── scripts/            # Scripts de automatización
├── .env                # Variables frontend (crear)
└── package.json        # Dependencias raíz

```

## 🔧 Comandos Útiles

### Desarrollo

```bash
npm run dev              # Ejecutar frontend + backend
npm run lint             # Validar código
npm run test:unit        # Tests unitarios
npm run test:e2e         # Tests E2E con Cypress
```

### Build para Producción

```bash
npm run build            # Build del frontend
npm run preview          # Preview del build
```

### Utilidades

```bash
npm run validate:i18n    # Validar traducciones
npm run validate:schemas # Validar schemas
```

## 🔍 Solución de Problemas Comunes

### Error: "Cannot find module './serviceAccount.json'"

- Asegúrate de que el archivo `serviceAccount.json` está en `backend/`

### Error: "Port 5173 already in use"

- Cierra cualquier proceso en ese puerto o cambia el puerto en `.env`

### Error: "Firebase permission denied"

- Verifica que las credenciales de Firebase son correctas
- Revisa las reglas de Firestore en Firebase Console

### Error: "CORS blocked"

- Verifica que `ALLOWED_ORIGIN` en backend/.env coincide con tu URL frontend

## 📞 Soporte

- **Repositorio**: https://github.com/Daniel-Navarro-Campos/mywed360
- **Rama Principal**: `windows`
- **Documentación**: Ver carpeta `docs/`

## 🎯 Próximos Pasos

1. **Configurar Firebase Console**: Asegúrate de tener acceso al proyecto
2. **Revisar Documentación**: Lee `docs/ONBOARDING.md` para más detalles
3. **Configurar GitHub Actions**: Para CI/CD automático
4. **Configurar Render**: Para despliegue del backend

---

**Nota**: Este proyecto está en desarrollo activo. Siempre trabaja en la rama `windows` y solo fusiona a `main` cuando esté listo para producción.
