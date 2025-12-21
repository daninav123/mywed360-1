# 🖥️ Setup en Nuevo Ordenador

Esta guía te ayudará a configurar el proyecto en un ordenador nuevo.

---

## 📋 **REQUISITOS PREVIOS**

- Node.js v20.x o superior
- Git
- Acceso al proyecto Firebase (lovenda-98c77)

---

## 🚀 **PASOS DE INSTALACIÓN**

### **1. Clonar el repositorio**

```bash
git clone <URL_DEL_REPO>
cd mywed360_windows
```

### **2. Instalar dependencias**

```bash
# Dependencias raíz
npm install

# Dependencias de cada app
cd apps/main-app && npm install && cd ../..
cd apps/admin-app && npm install && cd ../..
cd backend && npm install && cd ..
```

### **3. Configurar variables de entorno**

#### **a) Firebase - Main App**

Crear `apps/main-app/.env`:

```bash
VITE_FIREBASE_API_KEY=<tu-api-key>
VITE_FIREBASE_AUTH_DOMAIN=lovenda-98c77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lovenda-98c77
VITE_FIREBASE_STORAGE_BUCKET=lovenda-98c77.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>
VITE_FIREBASE_MEASUREMENT_ID=<measurement-id>
```

**¿Dónde encontrar estos valores?**
- Firebase Console → Project Settings → Your apps → Config

#### **b) Firebase - Admin App**

Crear `apps/admin-app/.env` (mismos valores que main-app):

```bash
VITE_FIREBASE_API_KEY=<tu-api-key>
VITE_FIREBASE_AUTH_DOMAIN=lovenda-98c77.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lovenda-98c77
VITE_FIREBASE_STORAGE_BUCKET=lovenda-98c77.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>
```

#### **c) Backend - Service Account**

1. Ir a Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Guardar el archivo como `backend/serviceAccount.json`

**⚠️ IMPORTANTE:** Este archivo contiene credenciales sensibles. NUNCA lo subas a git.

#### **d) Backend - Variables de entorno**

Crear `backend/.env`:

```bash
# Firebase
FIREBASE_PROJECT_ID=lovenda-98c77

# OpenAI
OPENAI_API_KEY=<tu-openai-api-key>
OPENAI_PROJECT_ID=proj_7IWFKysvJciPmnkpqop9rrpT

# Mailgun
MAILGUN_API_KEY=<tu-mailgun-api-key>
MAILGUN_DOMAIN=<tu-dominio>

# Stripe
STRIPE_SECRET_KEY=<tu-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<tu-webhook-secret>

# Otros
PORT=3001
NODE_ENV=development
```

---

## 🔥 **CONFIGURACIÓN FIREBASE**

### **Firestore Rules**

Las reglas ya están en `firestore.rules`. Para desplegarlas:

**Opción 1: Firebase Console**
1. Ir a Firebase Console → Firestore → Rules
2. Copiar contenido de `firestore.rules`
3. Pegar y Publicar

**Opción 2: Firebase CLI** (si está instalado)
```bash
firebase deploy --only firestore:rules
```

### **Añadirte como Admin**

1. Loguéate en `http://localhost:5176` (admin panel)
2. Abre consola del navegador (F12)
3. Ejecuta: `firebase.auth().currentUser.uid`
4. Copia el UID
5. En Firebase Console → Firestore → Añadir documento:
   - Colección: `admins`
   - ID documento: `<tu-uid>`
   - Campos:
     ```json
     {
       "email": "tu@email.com",
       "role": "admin",
       "createdAt": "2025-12-21T00:00:00Z",
       "permissions": {
         "manageSpecs": true,
         "manageUsers": true,
         "viewAnalytics": true,
         "manageContent": true
       }
     }
     ```

---

## ▶️ **EJECUTAR EL PROYECTO**

### **Main App** (puerto 5173)
```bash
cd apps/main-app
npm run dev
```

### **Admin App** (puerto 5176)
```bash
cd apps/admin-app
npm run dev
```

### **Backend** (puerto 3001)
```bash
cd backend
npm run dev
```

---

## 🧪 **VERIFICAR QUE TODO FUNCIONA**

1. **Main app:** http://localhost:5173
2. **Admin panel:** http://localhost:5176
3. **Backend:** http://localhost:3001/health (debería responder OK)

---

## ❓ **PROBLEMAS COMUNES**

### **Error: Firebase credentials not found**
- Verifica que existan los archivos .env en cada app
- Verifica que serviceAccount.json existe en backend/

### **Error: Missing or insufficient permissions**
- Asegúrate de haberte añadido como admin en Firestore
- Verifica que las reglas de Firestore estén desplegadas

### **Error: Cannot find module**
- Ejecuta `npm install` en la carpeta correspondiente

---

## 📝 **NOTAS ADICIONALES**

- **NO subas nunca** archivos .env o serviceAccount.json a git
- Estos archivos están protegidos por .gitignore
- Si necesitas las credenciales, pídelas al admin del proyecto o descárgalas de Firebase Console

---

**¿Listo?** Ahora puedes empezar a desarrollar 🎉
