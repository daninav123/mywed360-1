# 🔥 Guía: Eliminación Completa de Firebase Auth

## ✅ Completado

### Backend
1. **✅ authMiddleware.js** - Migrado de Firebase a JWT propio
   - Usa tokens JWT con PostgreSQL
   - Backup guardado: `authMiddleware.firebase.js.backup`

2. **✅ /api/auth/verify** - Nueva ruta para validar tokens
   - Verifica tokens JWT actuales
   - Reemplaza Firebase Auth verification

### Frontend
3. **✅ useAuth.js** - Nuevo hook sin Firebase
   - Login/Register con JWT
   - Reset password
   - Profile management
   - Backup guardado: `useAuth.firebase.jsx.backup`

---

## 📋 Pasos Pendientes (Manuales)

### 1. Actualizar Componentes de Autenticación

#### a) Login.jsx
Reemplazar llamadas Firebase con el nuevo hook:

```jsx
// ANTES (Firebase):
import { signInWithEmailAndPassword } from 'firebase/auth';
const result = await signInWithEmailAndPassword(auth, email, password);

// DESPUÉS (JWT propio):
import { useAuth } from '../hooks/useAuth';
const { loginWithEmail } = useAuth();
const result = await loginWithEmail(email, password);
```

**Archivos a actualizar:**
- `/apps/main-app/src/pages/Login.jsx`
- `/apps/main-app/src/components/LoginForm.jsx` (si existe)

#### b) Register.jsx
```jsx
// ANTES (Firebase):
import { createUserWithEmailAndPassword } from 'firebase/auth';
const result = await createUserWithEmailAndPassword(auth, email, password);

// DESPUÉS (JWT propio):
import { useAuth } from '../hooks/useAuth';
const { registerWithEmail } = useAuth();
const result = await registerWithEmail(email, password, additionalData);
```

**Archivos a actualizar:**
- `/apps/main-app/src/pages/Register.jsx`
- `/apps/main-app/src/components/RegisterForm.jsx` (si existe)

#### c) ResetPassword.jsx
```jsx
// ANTES (Firebase):
import { sendPasswordResetEmail } from 'firebase/auth';
await sendPasswordResetEmail(auth, email);

// DESPUÉS (JWT propio):
import { useAuth } from '../hooks/useAuth';
const { resetPassword } = useAuth();
await resetPassword(email);
```

**Archivos a actualizar:**
- `/apps/main-app/src/pages/ResetPassword.jsx`
- `/apps/main-app/src/pages/ResetPassword.firebase.jsx`

### 2. Actualizar Context/Provider

Reemplazar `AuthProvider` de Firebase con el nuevo:

```jsx
// En App.jsx o main.jsx:
// ANTES:
import { AuthProvider } from './hooks/useAuth.firebase';

// DESPUÉS:
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* ... */}
    </AuthProvider>
  );
}
```

### 3. Actualizar Referencias a Firebase Auth

Buscar y reemplazar en el proyecto:

```bash
# Buscar archivos que usan Firebase Auth
grep -r "firebase/auth" apps/main-app/src --exclude-dir=node_modules

# Buscar authState
grep -r "onAuthStateChanged" apps/main-app/src --exclude-dir=node_modules

# Buscar signInWith
grep -r "signInWith" apps/main-app/src --exclude-dir=node_modules
```

**Archivos encontrados que necesitan actualización:**
- `pages/UnifiedEmail.jsx` - onAuthStateChanged
- `pages/suppliers/SupplierRegister.jsx` - signInWithCustomToken
- `components/notifications/NotificationWatcher.jsx` - onAuthStateChanged
- `components/UsernameWizard.jsx` - onAuthStateChanged
- `pages/VerifyEmail.jsx` - sendEmailVerification

### 4. Eliminar Firebase SDK

Una vez todo migrado:

```bash
# Eliminar Firebase del package.json
npm uninstall firebase

# Eliminar configuración
rm apps/main-app/src/firebaseConfig.jsx
rm apps/main-app/src/firebaseConfig.js

# Eliminar backups si todo funciona
rm backend/middleware/authMiddleware.firebase.js.backup
rm apps/main-app/src/hooks/useAuth.firebase.jsx.backup
```

### 5. Limpiar Backend

Eliminar Firebase Admin SDK del backend:

```bash
cd backend
npm uninstall firebase-admin

# Actualizar archivos que usan Firebase Admin:
# - routes/supplier-payments.js
# - routes/email-tags.js
# - routes/contracts.js
# - routes/mailgun-inbound.js
# Y ~30 archivos más en /backend/routes/*
```

---

## 🔐 Variables de Entorno

Asegúrate de tener en `.env`:

```bash
# JWT Secret (IMPORTANTE: cambiar en producción)
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura-para-jwt

# PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/tu_base_de_datos

# Email (para reset password)
MAILGUN_API_KEY=tu-clave-mailgun
MAILGUN_DOMAIN=tu-dominio.com
```

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test # O el comando de test que uses

# Probar endpoints manualmente
curl -X POST http://localhost:4004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'

curl -X POST http://localhost:4004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

### Frontend
1. Iniciar sesión con usuario existente
2. Cerrar sesión
3. Registrar nuevo usuario
4. Reset password
5. Verificar persistencia (recargar página)

---

## ⚠️ Notas Importantes

1. **Migración de Usuarios Existentes:**
   - Los usuarios de Firebase Auth necesitan crear nueva cuenta
   - O migrar usando script de importación

2. **Tokens Existentes:**
   - Los tokens de Firebase Auth dejarán de funcionar
   - Los usuarios deben hacer login nuevamente

3. **Social Login:**
   - Si usabas Google/Facebook login con Firebase, necesitarás implementar OAuth propio
   - O usar librerías como Passport.js

4. **Email Verification:**
   - Implementar sistema propio de verificación de email
   - Ya existe en `/backend/routes/auth.js`

---

## 📚 Recursos

- **JWT.io**: https://jwt.io - Para debuggear tokens
- **Prisma Docs**: https://www.prisma.io/docs - ORM usado
- **bcrypt**: Para hashear passwords de forma segura

---

## 🎯 Checklist Final

- [ ] Actualizar Login.jsx
- [ ] Actualizar Register.jsx  
- [ ] Actualizar ResetPassword.jsx
- [ ] Actualizar App.jsx/main.jsx (AuthProvider)
- [ ] Migrar onAuthStateChanged en componentes
- [ ] Probar login/logout/registro
- [ ] Probar reset password
- [ ] Eliminar firebase package
- [ ] Eliminar firebaseConfig.jsx
- [ ] Eliminar backups
- [ ] Actualizar documentación del proyecto

---

**Estado Actual:** Backend 100% listo, Frontend pendiente actualización de componentes
