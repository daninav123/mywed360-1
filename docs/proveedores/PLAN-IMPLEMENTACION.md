# 🚀 Plan de Implementación - Sistema de Proveedores Automatizado

**Actualización:** 2025-01-28

---

## 📋 RESUMEN

Este plan divide la implementación en **4 fases** progresivas:

| Fase | Duración | Prioridad | Descripción |
|------|----------|-----------|-------------|
| **Fase 1** | 3-5 días | 🔴 Alta | Schema Firebase + API básica |
| **Fase 2** | 2-3 días | 🟡 Media | Cron jobs de actualización |
| **Fase 3** | 3-4 días | 🟢 Baja | Sistema de claim (futuro) |
| **Fase 4** | 2 días | 🟢 Baja | Dashboard admin |

**Total estimado:** 10-14 días de desarrollo

---

## 🎯 FASE 1: Schema Firebase + API Básica (3-5 días)

**Objetivo:** Crear la infraestructura básica y empezar a alimentar la base de datos.

### **Día 1: Setup Firebase**

**1.1. Crear índices en Firestore**
```bash
# Firebase Console → Firestore → Indexes

# Índice 1: Búsqueda por categoría y ubicación
Collection: suppliers
Fields:
  - status (Ascending)
  - category (Ascending)  
  - location.city (Ascending)
  - metrics.matchScore (Descending)

# Índice 2: Top proveedores
Collection: suppliers
Fields:
  - status (Ascending)
  - metrics.conversions (Descending)

# Índice 3: Proveedores inactivos
Collection: suppliers  
Fields:
  - status (Ascending)
  - lastUpdated (Ascending)
```

**1.2. Migrar proveedores actuales de Tavily a Firestore**
```javascript
// backend/scripts/migrate-suppliers.js

const admin = require('firebase-admin');
const { searchTavily } = require('../services/tavilyService');

async function migrateSuppliers() {
  console.log('🔄 Migrando proveedores a Firestore...\n');
  
  const db = admin.firestore();
  
  // Categorías y ubicaciones principales
  const categories = ['fotografia', 'catering', 'dj', 'flores'];
  const locations = ['Valencia', 'Madrid', 'Barcelona', 'Sevilla'];
  
  let migrated = 0;
  
  for (const category of categories) {
    for (const location of locations) {
      console.log(`📍 Buscando ${category} en ${location}...`);
      
      const results = await searchTavily(
        `${category} bodas ${location}`, 
        location, 
        null, 
        category
      );
      
      for (const provider of results) {
        // Verificar si ya existe
        const exists = await db.collection('suppliers')
          .where('contact.email', '==', provider.email)
          .limit(1)
          .get();
        
        if (exists.empty) {
          const slug = createSlug(provider.name, location);
          
          await db.collection('suppliers').doc(slug).set({
            ...provider,
            slug,
            status: 'active',
            createdBy: 'migration-script',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            claimed: false,
            metrics: {
              matchScore: 70,
              views: 0,
              clicks: 0,
              conversions: 0,
              rating: 0,
              reviewCount: 0
            }
          });
          
          migrated++;
          console.log(`  ✅ ${provider.name}`);
        }
      }
      
      await sleep(2000); // Pausa entre búsquedas
    }
  }
  
  console.log(`\n✅ Migración completada: ${migrated} proveedores`);
}

function createSlug(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar
migrateSuppliers().catch(console.error);
```

**Ejecutar migración:**
```bash
node backend/scripts/migrate-suppliers.js
```

---

### **Día 2-3: API de Búsqueda Híbrida**

**2.1. Crear archivo de rutas**
```bash
touch backend/routes/suppliers-search.js
touch backend/routes/suppliers-metrics.js
```

**2.2. Implementar endpoints**
- `POST /api/suppliers/search` (ver [API-ENDPOINTS.md](./API-ENDPOINTS.md))
- `POST /api/suppliers/:id/track` (métricas)
- `GET /api/suppliers/:id` (detalles)

**2.3. Integrar en backend**
```javascript
// backend/index.js

const suppliersSearchRouter = require('./routes/suppliers-search');
const suppliersMetricsRouter = require('./routes/suppliers-metrics');

app.use(suppliersSearchRouter);
app.use(suppliersMetricsRouter);
```

---

### **Día 4: Frontend - Integrar nueva API**

**4.1. Actualizar servicio de búsqueda**
```javascript
// src/services/suppliersService.js

export async function searchSuppliers(service, location, query, budget) {
  const response = await fetch('/api/suppliers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, location, query, budget })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.suppliers;
}

export async function trackSupplierAction(supplierId, action, userId) {
  await fetch(`/api/suppliers/${supplierId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId })
  });
}
```

**4.2. Actualizar componentes**
```jsx
// src/pages/Proveedores.jsx

function Proveedores() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchSuppliers(service, location, query, budget);
      setSuppliers(results);
    } catch (error) {
      toast.error('Error al buscar proveedores');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = (supplierId) => {
    trackSupplierAction(supplierId, 'click', currentUser?.uid);
    navigate(`/proveedores/${supplierId}`);
  };
  
  // ...resto del componente
}
```

---

### **Día 5: Testing y Ajustes**

**5.1. Tests de integración**
```javascript
// backend/tests/suppliers-search.test.js

describe('POST /api/suppliers/search', () => {
  it('debe buscar en Firestore primero', async () => {
    const response = await request(app)
      .post('/api/suppliers/search')
      .send({ service: 'fotografia', location: 'Valencia' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.source).toBe('firestore');
  });
  
  it('debe usar fallback a Tavily si < 3 resultados', async () => {
    const response = await request(app)
      .post('/api/suppliers/search')
      .send({ service: 'helicoptero', location: 'Cuenca' });
    
    expect(response.status).toBe(200);
    if (response.body.count < 3) {
      expect(response.body.source).toBe('firestore+tavily');
    }
  });
});
```

**5.2. Verificar métricas**
```bash
# Firebase Console → Firestore → suppliers
# Verificar que metrics.views incrementa
```

---

## ⏰ FASE 2: Cron Jobs de Actualización (2-3 días)

**Objetivo:** Automatizar la actualización y mantenimiento de la base de datos.

### **Día 6: Setup Cron Jobs**

**Opción A: Local con node-cron**
```bash
npm install node-cron
```

```javascript
// backend/jobs/index.js

require('./daily-supplier-check');
require('./weekly-new-suppliers');
require('./monthly-cleanup');

console.log('✅ Cron jobs iniciados');
```

**Integrar con backend:**
```javascript
// backend/index.js

// Iniciar cron jobs
require('./jobs');
```

**Opción B: Firebase Cloud Functions (Recomendado)**
```bash
cd functions
npm install
```

```javascript
// functions/index.js

exports.dailySupplierCheck = functions
  .pubsub.schedule('0 2 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    // Código aquí
  });
```

---

### **Día 7: Implementar Jobs**

**7.1. Daily Check**
- Implementar según [CRON-JOBS.md](./CRON-JOBS.md) sección 1
- Verificar URLs activas
- Actualizar fuentes

**7.2. Weekly Discover**
- Implementar según [CRON-JOBS.md](./CRON-JOBS.md) sección 2
- Configurar categorías y ubicaciones
- Ajustar pausas entre búsquedas

**7.3. Monthly Cleanup**
- Implementar según [CRON-JOBS.md](./CRON-JOBS.md) sección 3
- Configurar límites de tiempo
- Generar reportes

---

### **Día 8: Testing y Monitoreo**

**8.1. Ejecutar manualmente**
```bash
node backend/jobs/test.js
```

**8.2. Verificar logs**
```bash
# Si usas Cloud Functions
firebase functions:log

# Si usas local
tail -f logs/cron-jobs.log
```

**8.3. Configurar alertas**
- Email si > 10 proveedores desactivados
- Slack si cron job falla

---

## 👤 FASE 3: Sistema de Claim (3-4 días) - FUTURO

**Objetivo:** Permitir que proveedores reclamen su perfil.

### **Día 9: API de Claim**

**9.1. Crear rutas**
```bash
touch backend/routes/suppliers-claim.js
```

**9.2. Implementar endpoints**
- `POST /api/suppliers/:id/claim`
- `POST /api/suppliers/claim/:claimId/verify`
- `PUT /api/suppliers/:id`

Ver [CLAIM-SYSTEM.md](./CLAIM-SYSTEM.md) para implementación completa.

---

### **Día 10-11: Frontend - UI de Claim**

**10.1. Componentes**
- `ClaimButton.jsx`
- `ClaimModal.jsx`
- `SupplierDashboard.jsx`

**10.2. Integración con Firebase Auth**
```javascript
// Login con custom token
await signInWithCustomToken(auth, customToken);
```

---

### **Día 12: Testing**

**12.1. Flujo completo**
1. Proveedor inicia claim
2. Recibe email con código
3. Verifica código
4. Se crea usuario
5. Puede editar perfil

**12.2. Seguridad**
- Solo el dueño puede editar
- Rate limiting en endpoints
- Validación de campos

---

## 📊 FASE 4: Dashboard Admin (2 días) - FUTURO

**Objetivo:** Panel de control para administradores.

### **Día 13: API Admin**

**13.1. Endpoints**
- `GET /api/admin/suppliers/stats`
- `GET /api/admin/suppliers/pending`
- `PUT /api/admin/suppliers/:id/approve`
- `DELETE /api/admin/suppliers/:id`

---

### **Día 14: Frontend Dashboard**

**14.1. Componentes**
- `SupplierStats.jsx` (estadísticas)
- `PendingSuppliers.jsx` (aprobar/rechazar)
- `SuppliersList.jsx` (gestión)

**14.2. Gráficas**
```bash
npm install recharts
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Básico** (Prioridad Alta)
- [ ] Crear índices en Firestore
- [ ] Script de migración ejecutado
- [ ] API de búsqueda implementada
- [ ] Frontend integrado
- [ ] Métricas funcionando
- [ ] Tests básicos

### **Fase 2: Cron Jobs** (Prioridad Media)
- [ ] Daily check implementado
- [ ] Weekly discover implementado
- [ ] Monthly cleanup implementado
- [ ] Logs configurados
- [ ] Alertas configuradas

### **Fase 3: Claim** (Prioridad Baja - Futuro)
- [ ] API de claim
- [ ] Verificación por email
- [ ] Frontend UI
- [ ] Edición de perfiles
- [ ] Tests de seguridad

### **Fase 4: Dashboard** (Prioridad Baja - Futuro)
- [ ] Estadísticas generales
- [ ] Gestión de proveedores pending
- [ ] Gráficas y reportes
- [ ] Exportación de datos

---

## 🔧 COMANDOS ÚTILES

### **Desarrollo:**
```bash
# Migrar proveedores
node backend/scripts/migrate-suppliers.js

# Ejecutar cron jobs manualmente
node backend/jobs/test.js

# Ver logs de Firestore
firebase firestore:indexes

# Deploy functions
firebase deploy --only functions
```

### **Testing:**
```bash
# Tests de integración
npm test backend/tests/suppliers-search.test.js

# Ver métricas en tiempo real
firebase firestore:watch suppliers
```

### **Monitoreo:**
```bash
# Logs de Cloud Functions
firebase functions:log

# Estadísticas de uso
firebase firestore:stats
```

---

## 📊 MÉTRICAS DE ÉXITO

### **Fase 1:**
- ✅ > 500 proveedores en Firestore
- ✅ Búsquedas < 200ms
- ✅ 0 errores en producción

### **Fase 2:**
- ✅ Cron jobs ejecutándose sin errores
- ✅ < 5% proveedores inactivos
- ✅ +50 nuevos proveedores/semana

### **Fase 3:**
- ✅ > 10 proveedores reclamados
- ✅ 0 brechas de seguridad

### **Fase 4:**
- ✅ Dashboard admin funcional
- ✅ Reportes mensuales generados

---

## 🚨 PROBLEMAS COMUNES

### **Error: "Missing index"**
**Solución:** Crear índice en Firebase Console (el error incluye el link directo)

### **Error: "Tavily API quota exceeded"**
**Solución:** Reducir frecuencia de búsquedas o aumentar plan

### **Error: "Email verification not sent"**
**Solución:** Verificar configuración de Mailgun/SendGrid

### **Proveedores duplicados**
**Solución:** Ejecutar script de deduplicación:
```javascript
// backend/scripts/deduplicate.js
// Ver documentación completa
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [Schema Firebase](./FIREBASE-SCHEMA.md)
- [Cron Jobs](./CRON-JOBS.md)
- [API Endpoints](./API-ENDPOINTS.md)
- [Sistema Claim](./CLAIM-SYSTEM.md)
- [Índice Principal](../SISTEMA-PROVEEDORES-AUTOMATIZADO.md)

---

## 🎯 SIGUIENTES PASOS

1. **Ahora:** Implementar Fase 1 (Schema + API básica)
2. **Próxima semana:** Implementar Fase 2 (Cron jobs)
3. **Futuro:** Fase 3 y 4 cuando haya demanda

**¿Listo para comenzar?** Empieza con la Fase 1, Día 1. 🚀
