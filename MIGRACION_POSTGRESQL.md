# 🔄 Guía de Migración a PostgreSQL

## 📋 Resumen

Esta guía te ayudará a migrar completamente de **Firebase/Firestore** a **PostgreSQL** usando Docker y Prisma ORM.

**Estado actual del proyecto:**
- ✅ Prisma ORM configurado
- ✅ Docker Compose listo
- ✅ Schema completo (12 modelos)
- ✅ Capa de abstracción database.js
- ✅ Scripts de migración

---

## 🚀 Pasos de Migración

### **1. Configurar Variables de Entorno**

Crea/actualiza el archivo `.env` en la raíz del proyecto:

```env
# ====================================
# MIGRACIÓN A POSTGRESQL
# ====================================

# IMPORTANTE: Cambia de Firebase a PostgreSQL
USE_FIREBASE=false

# URL de conexión PostgreSQL (Docker local)
DATABASE_URL=postgresql://malove:malove_dev_password@localhost:5432/malove_db

# Contraseñas Docker
POSTGRES_PASSWORD=malove_dev_password
MINIO_ROOT_USER=malove_admin
MINIO_ROOT_PASSWORD=malove_admin_password
REDIS_PASSWORD=malove_redis_password
PGADMIN_EMAIL=admin@malove.app
PGADMIN_PASSWORD=admin

# Backend
PORT=4004
NODE_ENV=development

# Mantén tus configuraciones actuales:
# - OPENAI_API_KEY
# - MAILGUN_API_KEY
# - MAILGUN_DOMAIN
# etc.
```

### **2. Levantar Servicios Docker**

```powershell
# En la raíz del proyecto
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f postgres
```

**Servicios disponibles:**
- PostgreSQL: `localhost:5432`
- MinIO (S3): `localhost:9000` (consola: `localhost:9001`)
- Redis: `localhost:6379`
- PgAdmin: `localhost:5050` (opcional, con `--profile dev`)

### **3. Inicializar Base de Datos**

```powershell
# Navegar a backend
cd backend

# Instalar Prisma si no está
npm install @prisma/client prisma -D

# Generar cliente Prisma
npx prisma generate

# Crear tablas en PostgreSQL (migración inicial)
npx prisma db push

# Verificar que las tablas se crearon
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver tus tablas.

### **4. Migrar Datos de Firebase (Opcional)**

Si tienes datos en Firebase que quieres migrar:

```powershell
# En la raíz del proyecto

# Prueba sin cambios (dry-run)
node scripts/migrate-firebase-to-postgres.js --dry-run

# Migrar solo usuarios
node scripts/migrate-firebase-to-postgres.js --collection=users

# Migración completa
node scripts/migrate-firebase-to-postgres.js
```

El script migra:
- ✅ Usuarios
- ✅ Bodas
- ✅ Invitados
- ✅ Proveedores
- ✅ Relaciones entre entidades

### **5. Iniciar Backend con PostgreSQL**

```powershell
# Volver a raíz
cd ..

# Iniciar backend (usará PostgreSQL automáticamente)
npm run backend

# O todo el sistema
npm run start:ci
```

El backend detectará automáticamente `USE_FIREBASE=false` y usará PostgreSQL.

---

## 🔧 Comandos Útiles

### **Docker**

```powershell
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Ver logs
docker-compose logs -f [servicio]

# Reiniciar servicio específico
docker-compose restart postgres
```

### **Prisma**

```powershell
cd backend

# Ver BD en navegador
npx prisma studio

# Generar cliente después de cambios en schema
npx prisma generate

# Aplicar cambios de schema a BD
npx prisma db push

# Crear migración formal
npx prisma migrate dev --name nombre_migracion

# Resetear BD (⚠️ borra todos los datos)
npx prisma migrate reset
```

### **PostgreSQL Directo**

```powershell
# Conectar con psql
docker exec -it malove-postgres psql -U malove -d malove_db

# Comandos útiles en psql:
# \dt          - Listar tablas
# \d+ users    - Describir tabla users
# \q           - Salir
```

---

## 📊 Modelos Disponibles

El schema de Prisma incluye:

1. **User** - Usuarios autenticados
2. **RefreshToken** - Tokens de sesión
3. **Wedding** - Bodas/eventos
4. **Guest** - Invitados
5. **Supplier** - Proveedores
6. **SupplierPortfolio** - Portfolio de proveedores
7. **WeddingSupplier** - Relación bodas-proveedores
8. **SeatingPlan** - Planes de asientos
9. **Budget** - Presupuestos
10. **CraftWeb** - Webs personalizadas
11. **RsvpResponse** - Respuestas RSVP
12. **Planner** - Planificadores profesionales

Todos con:
- IDs UUID
- Timestamps automáticos (createdAt, updatedAt)
- Índices optimizados
- Cascada de eliminación donde corresponde

---

## 🔄 Capa de Abstracción

El código ya usa `backend/config/database.js` que:

```javascript
// Cambia automáticamente según USE_FIREBASE
export const useFirebase = process.env.USE_FIREBASE !== 'false';

// Métodos disponibles:
const db = getDatabase();
await db.getUserByEmail(email);
await db.createUser(data);
await db.getWeddingById(id);
// etc.
```

**No necesitas cambiar código**, solo la variable de entorno.

---

## 🎯 Migración Storage (Firebase → MinIO)

MinIO es compatible con S3. Para migrar archivos:

1. **MinIO Console**: `http://localhost:9001`
   - Usuario: `malove_admin`
   - Contraseña: `malove_admin_password`

2. **Crear bucket**: `wedding-photos`, `documents`, etc.

3. **Configurar en código**:
```javascript
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true, // Importante para MinIO
});
```

---

## ⚙️ Ajustes Opcionales

### **Agregar Prisma Scripts a package.json**

Añade en `backend/package.json`:

```json
{
  "scripts": {
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "node prisma/seed.js"
  }
}
```

### **Crear Seed de Datos de Prueba**

Crea `backend/prisma/seed.js`:

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Usuario de prueba
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      displayName: 'Usuario de Prueba',
      emailVerified: true,
    },
  });

  // Boda de prueba
  await prisma.wedding.create({
    data: {
      userId: user.id,
      coupleName: 'María & Juan',
      weddingDate: new Date('2025-06-15'),
      numGuests: 100,
    },
  });

  console.log('✅ Seed completado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Ejecutar: `npm run db:seed`

---

## ✅ Verificación Post-Migración

1. **Backend arranca sin errores**
```powershell
npm run backend
# Debe mostrar: "✅ Conectado a PostgreSQL"
```

2. **Consultas funcionan**
```powershell
npx prisma studio
# Abre navegador, crea/edita registros
```

3. **Tests pasan**
```powershell
npm run test:unit
```

4. **Frontend conecta**
```powershell
npm run start:ci
# Frontend + Backend
```

---

## 🆘 Solución de Problemas

### **Error: "Can't reach database server"**

```powershell
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar contenedor
docker-compose restart postgres
```

### **Error: "Environment variable not found: DATABASE_URL"**

Verifica que `.env` existe y tiene:
```env
DATABASE_URL=postgresql://malove:malove_dev_password@localhost:5432/malove_db
```

### **Tablas no se crean**

```powershell
cd backend
npx prisma db push --force-reset
```

### **Revertir a Firebase temporalmente**

En `.env`:
```env
USE_FIREBASE=true
# DATABASE_URL=... (comentar)
```

---

## 📈 Próximos Pasos

1. ✅ Migrar datos de Firebase
2. ✅ Configurar backups automáticos
3. ✅ Configurar Prometheus/Grafana (métricas)
4. ✅ Configurar CI/CD con PostgreSQL
5. ✅ Migrar Storage a MinIO
6. ✅ Configurar Redis para cache

---

## 📚 Referencias

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **MinIO**: https://min.io/docs
- **Schema Prisma**: `backend/prisma/schema.prisma`
- **Database Adapter**: `backend/config/database.js`
- **Docker Compose**: `docker-compose.yml`

---

**¿Necesitas ayuda?** Revisa los logs:
```powershell
# Docker
docker-compose logs -f

# Backend
npm run backend

# Prisma
npx prisma studio
```
