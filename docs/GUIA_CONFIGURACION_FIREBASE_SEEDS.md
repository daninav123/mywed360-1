# 🔧 Guía de Configuración de Firebase para Seeds

**Fecha:** 29 Diciembre 2025  
**Propósito:** Configurar credenciales de Firebase para ejecutar scripts de seed localmente

---

## 📋 Prerequisitos

1. **Cuenta Firebase activa** con permisos de administrador
2. **Node.js** versión 20.0.0 o superior instalado
3. **Proyecto Firebase** creado (si no existe)

---

## 🔐 Opción 1: Service Account Key (Recomendado)

### Paso 1: Obtener el archivo de credenciales

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar tu proyecto
3. Ir a **⚙️ Project Settings** → **Service accounts**
4. Click en **Generate new private key**
5. Descargar el archivo JSON

### Paso 2: Configurar localmente

**Opción A: Colocar en la raíz del proyecto**

```bash
# Mover el archivo descargado a la raíz del proyecto
mv ~/Downloads/firebase-adminsdk-xxxxx.json ./serviceAccount.json

# Verificar que existe
ls -la serviceAccount.json
```

**Opción B: Variable de entorno**

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/completa/a/serviceAccount.json"

# Windows (CMD)
set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\completa\a\serviceAccount.json

# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\completa\a\serviceAccount.json"
```

### Paso 3: Agregar al .gitignore

**⚠️ IMPORTANTE: NUNCA commitear las credenciales**

Verificar que `.gitignore` contiene:

```gitignore
# Firebase credentials
serviceAccount.json
*-firebase-adminsdk-*.json
firebase-adminsdk-*.json
.env.local
```

---

## 🌐 Opción 2: Application Default Credentials (ADC)

### Para desarrollo local

```bash
# Instalar Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Autenticarse
gcloud auth application-default login

# Esto crea credenciales en:
# - Linux/Mac: ~/.config/gcloud/application_default_credentials.json
# - Windows: %APPDATA%\gcloud\application_default_credentials.json
```

Los scripts detectarán automáticamente estas credenciales.

---

## ✅ Verificar Configuración

### Test rápido

```bash
# Ejecutar script de verificación
node scripts/testFirebaseConnection.js
```

Si no existe este script, crear:

```javascript
// scripts/testFirebaseConnection.js
import admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  
  const db = admin.firestore();
  console.log('✅ Firebase conectado correctamente');
  console.log('📊 Proyecto:', admin.app().options.projectId);
  
  // Test básico
  await db.collection('_test').doc('_connection').set({
    tested: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('✅ Escritura exitosa en Firestore');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
```

---

## 🚀 Ejecutar Seeds

Una vez configurado:

```bash
# Limpiar y seed completo
npm run test:reset

# Solo seed (sin limpiar)
npm run seed:fixtures

# Solo limpiar
npm run test:cleanup
```

---

## 🛠️ Solución de Problemas

### Error: "No se encontró archivo de service account"

**Solución:**
```bash
# Verificar que el archivo existe
ls -la serviceAccount.json

# O configurar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/serviceAccount.json"
```

### Error: "auth/insufficient-permissions"

**Solución:**
1. Verificar que el service account tiene rol **Editor** o **Owner**
2. En Firebase Console → IAM & Admin → añadir permisos

### Error: "EACCES: permission denied"

**Solución:**
```bash
# Linux/Mac: dar permisos de lectura
chmod 600 serviceAccount.json

# Verificar permisos
ls -la serviceAccount.json
```

### Seeds fallan en CI/CD

**Solución para GitHub Actions:**

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - name: Setup Firebase credentials
        run: |
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > serviceAccount.json
      
      - name: Run seeds
        run: npm run seed:fixtures
```

Agregar el contenido del JSON como secret en GitHub:
- Settings → Secrets → New repository secret
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Pegar todo el contenido del JSON

---

## 🔒 Mejores Prácticas de Seguridad

### ✅ Hacer

1. **Usar diferentes proyectos** para dev/staging/production
2. **Rotar keys** regularmente (cada 90 días)
3. **Limitar permisos** del service account al mínimo necesario
4. **Usar secrets** en CI/CD, nunca hardcodear
5. **Verificar .gitignore** antes de cada commit

### ❌ Evitar

1. ❌ Commitear credenciales al repositorio
2. ❌ Compartir keys por email/chat
3. ❌ Usar credenciales de producción en desarrollo
4. ❌ Dejar keys expuestas en logs
5. ❌ Reutilizar la misma key en múltiples proyectos

---

## 📦 Estructura de Archivos

```
mywed360_windows/
├── serviceAccount.json          # ← Credenciales (NUNCA commitear)
├── .env.local                   # ← Variables locales (NUNCA commitear)
├── .gitignore                   # ← Debe incluir archivos de arriba
├── scripts/
│   ├── seedFromFixtures.js      # ← Usa credenciales
│   ├── cleanupTestData.js       # ← Usa credenciales
│   └── fixtureLoader.js         # ← No necesita credenciales
└── cypress/
    └── fixtures/                # ← Datos deterministas (SÍ commitear)
        ├── users.json
        ├── weddings.json
        └── guests.json
```

---

## 🔗 Referencias

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Permissions](https://cloud.google.com/iam/docs/service-accounts)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)

---

## 🆘 Soporte

Si sigues teniendo problemas:

1. Verificar versión de Node.js: `node --version` (debe ser ≥20)
2. Verificar Firebase CLI: `firebase --version`
3. Revisar logs en Firebase Console → Functions → Logs
4. Contactar al equipo de desarrollo

---

**Última actualización:** 29 Diciembre 2025  
**Autor:** Sistema de Seeds E2E
