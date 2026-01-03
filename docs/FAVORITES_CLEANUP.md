# 🧹 Limpieza Automática de Favoritos

Los favoritos tienen un **TTL (Time To Live) de 30 días** para garantizar que los datos estén actualizados y evitar acumulación de información obsoleta.

---

## 📋 **Tabla de Contenidos**

1. [¿Por qué TTL de 30 días?](#por-qué-ttl-de-30-días)
2. [Estructura de Datos](#estructura-de-datos)
3. [Métodos de Limpieza](#métodos-de-limpieza)
4. [Configuración Automática](#configuración-automática)
5. [Monitorización](#monitorización)

---

## 🎯 **¿Por qué TTL de 30 días?**

### **Problemas que resuelve:**

1. **Datos obsoletos de proveedores**
   - Precios pueden cambiar
   - Servicios pueden descontinuarse
   - Contacto puede actualizarse

2. **Proveedores pueden desaparecer**
   - Negocios cierran
   - Cambian de ubicación
   - Modifican su oferta

3. **Acumulación innecesaria**
   - Los favoritos antiguos pierden relevancia
   - Ocupan espacio en Firestore
   - Aumentan costos de lectura

### **Beneficios:**

- ✅ Datos siempre frescos (máx 30 días)
- ✅ Los usuarios revisan favoritos activamente
- ✅ Fuerza actualización de información
- ✅ Reduce costos de almacenamiento

---

## 📂 **Estructura de Datos**

### **Ruta en Firestore:**

```
weddings/{weddingId}/favorites/{favoriteId}
```

### **Documento de favorito:**

```javascript
{
  userId: "9EstYa0T8WRBm9j0XwnE8zU1iFo1",
  weddingId: "61ffb907-7fcb-4361-b764-0300b317fe06",
  supplierId: "inet_a4f3e7d9c2b1a0f8",
  supplier: {
    id: "inet_a4f3e7d9c2b1a0f8",
    name: "Audioprobe",
    category: "musica",
    // ... snapshot del proveedor
  },
  notes: "Me gusta su estilo",
  addedAt: "2025-10-28T00:00:00.000Z",
  expiresAt: "2025-11-27T00:00:00.000Z" // ⭐ TTL 30 días
}
```

---

## 🔧 **Métodos de Limpieza**

### **1. Limpieza Automática en Operaciones** ⚡

Cada vez que se consultan favoritos, se eliminan los expirados:

```javascript
// GET /api/favorites
// Filtra automáticamente favoritos con expiresAt < now

// GET /api/favorites/check/:id
// Si está expirado, lo elimina antes de responder
```

**Ventajas:**

- Sin configuración adicional
- Se ejecuta en cada consulta
- Impacto mínimo en performance

**Desventajas:**

- Solo limpia cuando el usuario consulta
- No limpia favoritos de bodas inactivas

---

### **2. Limpieza Manual desde CLI** 🖥️

Ejecutar manualmente cuando sea necesario:

```bash
# Desde la raíz del backend
cd backend
npm run cleanup:favorites
```

**O directamente:**

```bash
node tasks/cleanupExpiredFavorites.js
```

**Output esperado:**

```
[cleanup] 🧹 Iniciando limpieza de favoritos expirados...
[cleanup] Analizando 150 bodas...
[cleanup] Boda 61ffb907...: Eliminando 3 favoritos expirados
[cleanup] Boda 82aac118...: Eliminando 1 favoritos expirados
[cleanup] ✅ Limpieza completada en 2341ms: 12 eliminados, 0 errores
✅ Limpieza completada: { deleted: 12, errors: 0 }
```

**Cuándo ejecutar manualmente:**

- Después de migraciones
- Mantenimiento programado
- Testing/debugging
- Antes de backups importantes

---

### **3. Limpieza vía API (Admin)** 🔐

Endpoint HTTP para automatización externa:

```bash
POST http://localhost:4004/api/admin/tasks/cleanup-favorites
Headers:
  Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Limpieza de favoritos completada",
  "deleted": 12,
  "errors": 0
}
```

**Autenticación:**

- Requiere token de admin (`requireAdmin`)
- Solo administradores pueden ejecutar

**Uso recomendado:**

- Cloud Scheduler (GCP)
- GitHub Actions
- Cron jobs externos
- Heroku Scheduler

---

## ⏰ **Configuración Automática**

### **Opción A: Cloud Scheduler (Google Cloud Platform)** ⭐ RECOMENDADO

**1. Crear job en GCP Console:**

```bash
gcloud scheduler jobs create http cleanup-favorites-daily \
  --schedule="0 3 * * *" \
  --uri="https://api.myapp.com/api/admin/tasks/cleanup-favorites" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_ADMIN_TOKEN" \
  --time-zone="Europe/Madrid"
```

**Configuración:**

- **Frecuencia:** Diaria a las 3 AM
- **Zona horaria:** Europe/Madrid
- **Retry:** 3 intentos con backoff exponencial
- **Timeout:** 60 segundos

**2. Crear token de admin:**

```javascript
// En Firestore
users/{adminUid}
{
  email: "admin@myapp.com",
  role: "admin",
  apiToken: "generated-secure-token"
}
```

---

### **Opción B: Cron Job (Servidor Linux)**

**1. Editar crontab:**

```bash
crontab -e
```

**2. Añadir línea:**

```bash
# Limpiar favoritos diariamente a las 3 AM
0 3 * * * cd /path/to/backend && npm run cleanup:favorites >> /var/log/cleanup-favorites.log 2>&1
```

**Con rotación de logs:**

```bash
0 3 * * * cd /path/to/backend && npm run cleanup:favorites >> /var/log/cleanup-favorites-$(date +\%Y\%m\%d).log 2>&1
```

---

### **Opción C: GitHub Actions** (Si backend en GitHub)

**`.github/workflows/cleanup-favorites.yml`:**

```yaml
name: Cleanup Expired Favorites

on:
  schedule:
    - cron: '0 3 * * *' # Diario 3 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            https://api.myapp.com/api/admin/tasks/cleanup-favorites
```

---

### **Opción D: Node Schedule (Dentro del backend)**

**Si quieres que corra automáticamente cuando el backend está activo:**

```javascript
// backend/schedulers/favoritesCleanup.js
import schedule from 'node-schedule';
import { cleanupExpiredFavorites } from '../tasks/cleanupExpiredFavorites.js';
import logger from '../logger.js';

export function startFavoritesCleanupScheduler() {
  // Ejecutar diariamente a las 3 AM
  schedule.scheduleJob('0 3 * * *', async () => {
    logger.info('[scheduler] Iniciando limpieza automática de favoritos');
    try {
      const result = await cleanupExpiredFavorites();
      logger.info(`[scheduler] Limpieza completada: ${result.deleted} eliminados`);
    } catch (error) {
      logger.error('[scheduler] Error en limpieza automática:', error);
    }
  });

  logger.info('[scheduler] Scheduler de limpieza de favoritos iniciado (3 AM diario)');
}
```

**Añadir a `backend/index.js`:**

```javascript
import { startFavoritesCleanupScheduler } from './schedulers/favoritesCleanup.js';

// Al final, después de iniciar el servidor
startFavoritesCleanupScheduler();
```

**Instalar dependencia:**

```bash
npm install node-schedule
```

---

## 📊 **Monitorización**

### **Logs a revisar:**

```javascript
// Logs de limpieza exitosa
[cleanup] ✅ Limpieza completada en 2341ms: 12 eliminados, 0 errores

// Logs de error
[cleanup] Error procesando boda abc123: FirebaseError: ...
[cleanup] ❌ Error fatal en limpieza: ...
```

### **Métricas recomendadas:**

1. **Número de favoritos eliminados** (por ejecución)
2. **Tiempo de ejecución** (ms)
3. **Errores** (por boda)
4. **Total de bodas procesadas**

### **Alertas sugeridas:**

```javascript
// Si más de 100 favoritos eliminados en una ejecución
if (deleted > 100) {
  notifyAdmin('Alta cantidad de favoritos expirados eliminados');
}

// Si errores > 0
if (errors > 0) {
  notifyAdmin(`Errores en limpieza de favoritos: ${errors}`);
}

// Si tiempo > 10 segundos
if (duration > 10000) {
  notifyAdmin('Limpieza de favoritos tardó más de 10s');
}
```

---

## 🧪 **Testing**

### **Probar manualmente:**

```bash
# 1. Crear un favorito con expiración antigua
# En Firestore Console:
weddings/test-wedding/favorites/test-fav
{
  expiresAt: "2025-01-01T00:00:00.000Z" // Fecha pasada
}

# 2. Ejecutar limpieza
npm run cleanup:favorites

# 3. Verificar que se eliminó
# El documento ya no debería existir
```

### **Test de carga:**

```javascript
// Crear 1000 favoritos expirados en 100 bodas
// Medir tiempo de limpieza
// Debería completar en < 30 segundos
```

---

## ⚠️ **Consideraciones Importantes**

### **Performance:**

- La tarea procesa TODAS las bodas
- Con 10,000 bodas puede tardar 1-2 minutos
- Ejecutar en horarios de bajo tráfico (3-5 AM)

### **Costos Firestore:**

- Cada favorito eliminado = 1 DELETE operation
- Con 1000 favoritos/día = ~30,000 DELETEs/mes
- Dentro del free tier (50K writes/día)

### **Recuperación:**

- Los favoritos eliminados NO son recuperables
- Considerar backup antes de migraciones
- Los usuarios pueden volver a añadir favoritos

---

## 📝 **Checklist de Implementación**

- [x] Script añadido a `package.json`
- [x] Endpoint admin creado en `index.js`
- [x] Tarea de limpieza implementada
- [x] Logging configurado
- [ ] Cloud Scheduler configurado (si aplica)
- [ ] Alertas configuradas
- [ ] Monitorización en dashboard
- [ ] Documentación actualizada

---

## 🆘 **Troubleshooting**

### **Error: "Missing or insufficient permissions"**

```bash
# Verificar credenciales de Firebase Admin
echo $GOOGLE_APPLICATION_CREDENTIALS
# Debe apuntar a archivo de service account
```

### **Limpieza tarda mucho tiempo**

```javascript
// Reducir frecuencia o filtrar por fecha de última actividad
const recentWeddings = await db
  .collection('weddings')
  .where('lastActivity', '>', thirtyDaysAgo)
  .get();
```

### **Muchos errores**

```bash
# Revisar permisos de Firestore
# Revisar reglas de seguridad
# Verificar estructura de datos
```

---

## 📚 **Referencias**

- [Firestore TTL](https://firebase.google.com/docs/firestore/ttl)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)
- [Node Schedule](https://github.com/node-schedule/node-schedule)
- [Cron Syntax](https://crontab.guru/)

---

**Última actualización:** 2025-10-29  
**Versión:** 1.0.0
