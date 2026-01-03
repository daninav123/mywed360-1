# ⏰ Cron Jobs - Sistema de Actualización Automática

**Actualización:** 2025-01-28

---

## 📋 RESUMEN

Tres cron jobs mantienen la base de datos actualizada automáticamente:

| Job | Frecuencia | Horario | Función |
|-----|-----------|---------|---------|
| **Daily Check** | Diario | 02:00 AM | Verificar URLs activas, actualizar datos |
| **Weekly Discover** | Semanal | Domingo 03:00 AM | Buscar nuevos proveedores con Tavily |
| **Monthly Cleanup** | Mensual | Día 1, 04:00 AM | Limpiar proveedores inactivos |

---

## 1️⃣ DAILY CHECK - Verificación Diaria

### **Objetivo:**
Mantener la base de datos actualizada y detectar proveedores inactivos.

### **Frecuencia:**
Todos los días a las 02:00 AM (UTC+1)

### **Implementación:**

```javascript
// backend/jobs/daily-supplier-check.js

const admin = require('firebase-admin');
const cron = require('node-cron');
const fetch = require('node-fetch');

// Ejecutar diariamente a las 02:00
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 [CRON-DAILY] Iniciando verificación de proveedores...');
  
  const db = admin.firestore();
  const snapshot = await db.collection('suppliers')
    .where('status', '==', 'active')
    .get();
  
  let checked = 0;
  let deactivated = 0;
  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const supplier = doc.data();
    
    try {
      // 1. Verificar que la web sigue activa
      if (supplier.contact.website) {
        const isActive = await checkUrlStatus(supplier.contact.website);
        
        if (!isActive) {
          await doc.ref.update({
            status: 'inactive',
            inactiveReason: 'website_down',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'cron-daily'
          });
          deactivated++;
          console.log(`❌ [INACTIVE] ${supplier.name} - Website down`);
          continue;
        }
      }
      
      // 2. Verificar email válido (si no está verificado)
      if (supplier.contact.email && !supplier.contact.emailVerified) {
        const isValid = await verifyEmailFormat(supplier.contact.email);
        if (isValid) {
          await doc.ref.update({
            'contact.emailVerified': true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'cron-daily'
          });
          updated++;
        }
      }
      
      // 3. Actualizar datos de fuentes públicas (bodas.net, etc.)
      if (supplier.sources && supplier.sources.length > 0) {
        const updatedSources = await updateSourcesData(supplier.sources);
        
        if (JSON.stringify(updatedSources) !== JSON.stringify(supplier.sources)) {
          await doc.ref.update({
            sources: updatedSources,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'cron-daily'
          });
          updated++;
        }
      }
      
      checked++;
      
    } catch (error) {
      console.error(`❌ Error verificando ${supplier.name}:`, error.message);
    }
  }
  
  console.log(`✅ [CRON-DAILY] Finalizado:`);
  console.log(`   - Verificados: ${checked}`);
  console.log(`   - Desactivados: ${deactivated}`);
  console.log(`   - Actualizados: ${updated}\n`);
  
  // Enviar notificación al admin si hay muchos desactivados
  if (deactivated > 10) {
    await sendAdminAlert({
      type: 'daily-check-alert',
      message: `${deactivated} proveedores desactivados automáticamente`,
      timestamp: new Date().toISOString()
    });
  }
});

// === FUNCIONES AUXILIARES ===

async function checkUrlStatus(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD', 
      timeout: 5000,
      redirect: 'follow'
    });
    return response.ok; // true si status 200-299
  } catch (error) {
    console.log(`❌ URL error: ${url} - ${error.message}`);
    return false;
  }
}

async function verifyEmailFormat(email) {
  // Validación básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function updateSourcesData(sources) {
  const updatedSources = [];
  
  for (const source of sources) {
    const updated = { ...source };
    
    // Actualizar timestamp de verificación
    updated.lastChecked = admin.firestore.FieldValue.serverTimestamp();
    
    // Si es bodas.net, verificar que la URL sigue activa
    if (source.platform === 'bodas.net' && source.url) {
      const isActive = await checkUrlStatus(source.url);
      updated.status = isActive ? 'active' : 'down';
    }
    
    // Si es Instagram, podrías actualizar followers (requiere API)
    // Por ahora solo actualizamos el timestamp
    
    updatedSources.push(updated);
  }
  
  return updatedSources;
}

async function sendAdminAlert(alert) {
  // Implementar notificación (email, Slack, etc.)
  console.log('📧 Admin Alert:', alert);
  
  // Ejemplo: guardar en colección de alertas
  const db = admin.firestore();
  await db.collection('admin_alerts').add(alert);
}
```

---

## 2️⃣ WEEKLY DISCOVER - Búsqueda Semanal de Nuevos Proveedores

### **Objetivo:**
Descubrir nuevos proveedores en internet usando Tavily API.

### **Frecuencia:**
Todos los domingos a las 03:00 AM (UTC+1)

### **Implementación:**

```javascript
// backend/jobs/weekly-new-suppliers.js

const cron = require('node-cron');
const admin = require('firebase-admin');
const { searchTavily } = require('../services/tavilyService');

// Ejecutar cada domingo a las 03:00
cron.schedule('0 3 * * 0', async () => {
  console.log('🔍 [CRON-WEEKLY] Buscando nuevos proveedores...\n');
  
  const db = admin.firestore();
  
  // Categorías y ubicaciones a buscar
  const categories = [
    'fotografia',
    'catering',
    'dj',
    'flores',
    'video',
    'decoracion',
    'vestidos',
    'peluqueria',
    'maquillaje'
  ];
  
  const locations = [
    'Valencia', 'Madrid', 'Barcelona', 'Sevilla', 'Málaga',
    'Alicante', 'Bilbao', 'Granada', 'Murcia', 'Zaragoza',
    'Palma', 'Las Palmas', 'Córdoba', 'Valladolid', 'Vigo'
  ];
  
  let discovered = 0;
  let duplicates = 0;
  let errors = 0;
  
  for (const category of categories) {
    for (const location of locations) {
      console.log(`🔍 Buscando: ${category} en ${location}`);
      
      try {
        // Buscar con Tavily
        const query = `${category} bodas ${location} españa`;
        const results = await searchTavily(query, location, null, category);
        
        for (const provider of results) {
          // Verificar si ya existe (por email)
          const existingSnapshot = await db.collection('suppliers')
            .where('contact.email', '==', provider.email)
            .limit(1)
            .get();
          
          if (!existingSnapshot.empty) {
            duplicates++;
            console.log(`  ⚠️ Ya existe: ${provider.name}`);
            continue;
          }
          
          // Crear nuevo proveedor con status "pending"
          const slug = createSlug(provider.name, location);
          
          await db.collection('suppliers').doc(slug).set({
            ...provider,
            slug,
            status: 'pending',
            createdBy: 'cron-weekly',
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
          
          discovered++;
          console.log(`  ✅ Nuevo: ${provider.name}`);
        }
        
        // Pausa entre búsquedas para no saturar Tavily
        await sleep(2000);
        
      } catch (error) {
        errors++;
        console.error(`  ❌ Error buscando ${category} en ${location}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ [CRON-WEEKLY] Finalizado:`);
  console.log(`   - Nuevos proveedores: ${discovered}`);
  console.log(`   - Duplicados omitidos: ${duplicates}`);
  console.log(`   - Errores: ${errors}\n`);
  
  // Enviar notificación al admin
  await sendAdminNotification({
    type: 'weekly-suppliers-update',
    discovered,
    duplicates,
    errors,
    timestamp: new Date().toISOString()
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function sendAdminNotification(data) {
  console.log('📧 Admin Notification:', data);
  
  const db = admin.firestore();
  await db.collection('admin_notifications').add(data);
}
```

---

## 3️⃣ MONTHLY CLEANUP - Limpieza Mensual

### **Objetivo:**
Eliminar proveedores inactivos antiguos y limpiar datos obsoletos.

### **Frecuencia:**
Día 1 de cada mes a las 04:00 AM (UTC+1)

### **Implementación:**

```javascript
// backend/jobs/monthly-cleanup.js

const cron = require('node-cron');
const admin = require('firebase-admin');

// Ejecutar el día 1 de cada mes a las 04:00
cron.schedule('0 4 1 * *', async () => {
  console.log('🗑️ [CRON-MONTHLY] Limpiando proveedores...\n');
  
  const db = admin.firestore();
  
  // === 1. ELIMINAR PROVEEDORES INACTIVOS > 6 MESES ===
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const inactiveSnapshot = await db.collection('suppliers')
    .where('status', '==', 'inactive')
    .where('lastUpdated', '<', sixMonthsAgo)
    .get();
  
  let deletedInactive = 0;
  const batch1 = db.batch();
  
  inactiveSnapshot.docs.forEach(doc => {
    batch1.delete(doc.ref);
    deletedInactive++;
    console.log(`🗑️ Eliminado (inactivo): ${doc.data().name}`);
  });
  
  await batch1.commit();
  
  // === 2. LIMPIAR PROVEEDORES "PENDING" ANTIGUOS (> 30 DÍAS) ===
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const pendingSnapshot = await db.collection('suppliers')
    .where('status', '==', 'pending')
    .where('createdAt', '<', thirtyDaysAgo)
    .get();
  
  let deletedPending = 0;
  const batch2 = db.batch();
  
  pendingSnapshot.docs.forEach(doc => {
    batch2.delete(doc.ref);
    deletedPending++;
    console.log(`🗑️ Eliminado (pending): ${doc.data().name}`);
  });
  
  await batch2.commit();
  
  // === 3. LIMPIAR EVENTOS DE MÉTRICAS ANTIGUOS (> 1 AÑO) ===
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const eventsSnapshot = await db.collection('supplier_events')
    .where('timestamp', '<', oneYearAgo)
    .limit(1000)
    .get();
  
  let deletedEvents = 0;
  const batch3 = db.batch();
  
  eventsSnapshot.docs.forEach(doc => {
    batch3.delete(doc.ref);
    deletedEvents++;
  });
  
  await batch3.commit();
  
  console.log(`\n✅ [CRON-MONTHLY] Finalizado:`);
  console.log(`   - Proveedores inactivos eliminados: ${deletedInactive}`);
  console.log(`   - Proveedores pending eliminados: ${deletedPending}`);
  console.log(`   - Eventos antiguos eliminados: ${deletedEvents}\n`);
  
  // Generar reporte mensual
  await generateMonthlyReport({
    deletedInactive,
    deletedPending,
    deletedEvents,
    timestamp: new Date().toISOString()
  });
});

async function generateMonthlyReport(data) {
  console.log('📊 Generando reporte mensual...');
  
  const db = admin.firestore();
  
  // Estadísticas generales
  const totalSuppliers = (await db.collection('suppliers').count().get()).data().count;
  const activeSuppliers = (await db.collection('suppliers').where('status', '==', 'active').count().get()).data().count;
  const claimedSuppliers = (await db.collection('suppliers').where('claimed', '==', true).count().get()).data().count;
  
  const report = {
    ...data,
    stats: {
      total: totalSuppliers,
      active: activeSuppliers,
      claimed: claimedSuppliers
    },
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  };
  
  await db.collection('monthly_reports').add(report);
  
  console.log('✅ Reporte guardado:', report);
}
```

---

## 🚀 SETUP - Cómo implementar los cron jobs

### **Opción 1: Node con node-cron (Local/VPS)**

```bash
# 1. Instalar node-cron
npm install node-cron

# 2. Crear archivo principal
# backend/jobs/index.js
require('./daily-supplier-check');
require('./weekly-new-suppliers');
require('./monthly-cleanup');

console.log('✅ Cron jobs iniciados');

# 3. Ejecutar con el backend
node backend/jobs/index.js
```

**Integrar con tu backend:**
```javascript
// backend/index.js
require('./jobs'); // Iniciar cron jobs

// ... resto del código Express
```

---

### **Opción 2: Firebase Cloud Functions (Recomendado)**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Daily Check - Todos los días a las 02:00 UTC+1
exports.dailySupplierCheck = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 2 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    // Código del daily check aquí
    console.log('🔄 Daily check ejecutado');
  });

// Weekly Discover - Domingos 03:00 UTC+1
exports.weeklySupplierDiscover = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 3 * * 0')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    // Código del weekly discover aquí
    console.log('🔍 Weekly discover ejecutado');
  });

// Monthly Cleanup - Día 1, 04:00 UTC+1
exports.monthlySupplierCleanup = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 4 1 * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    // Código del monthly cleanup aquí
    console.log('🗑️ Monthly cleanup ejecutado');
  });
```

**Deploy:**
```bash
firebase deploy --only functions
```

---

## 🔧 TESTING MANUAL

```javascript
// backend/jobs/test.js

// Ejecutar manualmente cualquier job
async function testDailyCheck() {
  console.log('🧪 Testing daily check...');
  const { dailyCheck } = require('./daily-supplier-check');
  await dailyCheck();
}

async function testWeeklyDiscover() {
  console.log('🧪 Testing weekly discover...');
  const { weeklyDiscover } = require('./weekly-new-suppliers');
  await weeklyDiscover();
}

async function testMonthlyCleanup() {
  console.log('🧪 Testing monthly cleanup...');
  const { monthlyCleanup } = require('./monthly-cleanup');
  await monthlyCleanup();
}

// Ejecutar
testDailyCheck();
```

---

## 📊 MONITOREO

### **Logs en Firebase Console:**
- Ver ejecuciones en: Firebase Console → Functions → Logs
- Filtrar por función: `dailySupplierCheck`, etc.

### **Alertas:**
Configurar alertas si:
- Cron job falla
- Más de 10 proveedores desactivados en un día
- Error rate > 5%

---

## 📚 SIGUIENTE PASO

Lee: **[API Endpoints](./API-ENDPOINTS.md)** para entender cómo buscar proveedores.
