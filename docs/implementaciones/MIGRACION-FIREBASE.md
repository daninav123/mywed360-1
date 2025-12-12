# 🚀 Guía de Migración de Firebase a Infraestructura Propia

## 📋 Resumen

Esta guía te ayudará a migrar de Firebase a una infraestructura propia usando:

- **PostgreSQL** (reemplaza Firestore)
- **MinIO** (reemplaza Firebase Storage, S3-compatible)
- **Redis** (cache y sesiones)
- **JWT** (reemplaza Firebase Auth)

## 💰 Ahorro Estimado

| Usuarios/año | Firebase/año | Infraestructura Propia/año | Ahorro  |
| ------------ | ------------ | -------------------------- | ------- |
| 10M          | €2,568,000   | €91,800                    | **96%** |

---

## 🎯 Paso 1: Levantar Infraestructura (5 min)

### 1.1 Copiar variables de entorno

```bash
cp .env.migration .env.local
```

### 1.2 Editar `.env.local` y configurar:

- `DATABASE_URL` (si usas DB externa)
- `MINIO_*` (si usas MinIO externo)
- JWT secrets (cambiar en producción)
- Copiar variables de tu `.env` actual (OpenAI, email, etc.)

### 1.3 Levantar servicios con Docker

```bash
# Levantar todo (PostgreSQL + MinIO + Redis)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar que están corriendo
docker-compose ps
```

### 1.4 Configurar MinIO (crear buckets)

```bash
cd /Users/dani/MaLoveApp\ 2/MaLove.App_windows
node scripts/setup-minio.js
```

---

## 🗄️ Paso 2: Configurar Base de Datos (10 min)

### 2.1 Instalar dependencias de Prisma

```bash
cd backend
npm install @prisma/client @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D prisma
```

### 2.2 Generar cliente Prisma

```bash
npx prisma generate
```

### 2.3 Crear base de datos

```bash
npx prisma db push
```

### 2.4 Ver base de datos (opcional)

```bash
npx prisma studio
```

Abre en: http://localhost:5555

---

## 📦 Paso 3: Migrar Datos (30-60 min)

### 3.1 Backup de Firebase (IMPORTANTE)

Antes de migrar, haz backup de Firebase:

```bash
# Exportar Firestore
firebase firestore:export gs://lovenda-98c77.appspot.com/backups/$(date +%Y%m%d)

# Exportar Storage (manual desde Firebase Console)
```

### 3.2 Ejecutar migración

```bash
node scripts/migrate-firebase-to-postgres.js
```

Esto migrará:

- ✅ Usuarios
- ✅ Bodas
- ✅ Invitados
- ✅ Proveedores
- ✅ Webs Craft

### 3.3 Verificar migración

```bash
# Conectar a PostgreSQL
docker exec -it malove-postgres psql -U malove -d malove_db

# Ver tablas
\dt

# Contar registros
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM weddings;
SELECT COUNT(*) FROM guests;

# Salir
\q
```

---

## 🔄 Paso 4: Migrar Storage (Manual)

### Opción A: Migración Manual (Recomendado para pocas imágenes)

1. Descargar imágenes de Firebase Storage
2. Subir a MinIO usando consola web: http://localhost:9001

### Opción B: Migración Programática (Para muchas imágenes)

```bash
# TODO: Crear script de migración de Storage
node scripts/migrate-firebase-storage.js
```

---

## ⚙️ Paso 5: Actualizar Backend (15 min)

### 5.1 Cambiar a nueva infraestructura

Edita `backend/.env`:

```bash
# Deshabilitar Firebase
USE_FIREBASE=false
USE_FIREBASE_STORAGE=false

# Habilitar PostgreSQL y MinIO
DATABASE_URL="postgresql://malove:malove_dev_password@localhost:5432/malove_db?schema=public"
```

### 5.2 Actualizar imports en backend

Los archivos ya están preparados para usar ambos sistemas:

- `backend/config/database.js` - Capa de abstracción DB
- `backend/config/storage.js` - Capa de abstracción Storage

No necesitas cambiar código, solo variables de entorno.

### 5.3 Reiniciar backend

```bash
npm run backend
```

---

## 🎨 Paso 6: Actualizar Frontend (15 min)

### 6.1 Crear servicio de API

El frontend ya no se conectará directamente a Firebase, sino a tu backend.

```javascript
// apps/main-app/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function getWeddings() {
  const response = await fetch(`${API_URL}/api/weddings`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.json();
}
```

### 6.2 Actualizar componentes

Cambiar de:

```javascript
import { db } from '../firebaseConfig';
const snapshot = await db.collection('weddings').get();
```

A:

```javascript
import { getWeddings } from '../services/api';
const weddings = await getWeddings();
```

---

## 🔐 Paso 7: Autenticación JWT (30 min)

### 7.1 Crear endpoints de auth

```javascript
// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

const router = express.Router();
const db = getDatabase();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.json({ token, user });
});

export default router;
```

### 7.2 Middleware de autenticación

```javascript
// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
}
```

---

## ✅ Paso 8: Testing (30 min)

### 8.1 Tests de backend

```bash
# Probar conexión a PostgreSQL
curl http://localhost:4004/health

# Probar endpoint de usuarios
curl http://localhost:4004/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8.2 Tests de MinIO

```bash
# Subir archivo de prueba
curl -X POST http://localhost:4004/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

### 8.3 Tests E2E

```bash
npm run cypress:run
```

---

## 🚀 Paso 9: Despliegue (Variable)

### Opción A: Todo en VPS (Hetzner/DigitalOcean)

1. Alquilar VPS (€25-50/mes)
2. Subir `docker-compose.yml`
3. `docker-compose up -d`
4. Configurar dominio y SSL

### Opción B: Híbrido

1. PostgreSQL: Supabase (€25/mes)
2. Storage: NaranjaTec + CloudFlare CDN (€100-300/mes)
3. Backend: VPS (€25/mes)
4. Frontend: Vercel/Netlify (€0)

---

## 📊 Monitoreo

### Consolas de administración disponibles:

1. **PostgreSQL**: http://localhost:5050 (PgAdmin)
2. **MinIO**: http://localhost:9001
3. **Prisma Studio**: `npx prisma studio`

---

## 🔄 Rollback (Si algo falla)

### Volver a Firebase:

1. Editar `.env`:

```bash
USE_FIREBASE=true
USE_FIREBASE_STORAGE=true
```

2. Reiniciar backend:

```bash
npm run backend
```

Los datos originales de Firebase no se han tocado.

---

## 💡 Soporte

¿Problemas durante la migración?

1. Ver logs de Docker: `docker-compose logs -f`
2. Ver logs de backend: `npm run backend`
3. Verificar conexiones: `docker-compose ps`

---

## 📈 Siguientes Pasos

1. ✅ Migración completada
2. ⏳ Testing en producción
3. ⏳ Optimización de performance
4. ⏳ Configurar CDN (CloudFlare)
5. ⏳ Monitoreo y alertas
6. ⏳ Backups automáticos

---

## 🎉 ¡Listo!

Has migrado exitosamente de Firebase a infraestructura propia.

**Ahorro anual estimado**: €2.4M 💰
