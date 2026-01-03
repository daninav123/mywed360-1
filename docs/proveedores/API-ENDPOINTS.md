# 🔌 API Endpoints - Búsqueda y Métricas

**Actualización:** 2025-01-28

---

## 📋 ENDPOINTS DISPONIBLES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/suppliers/search` | Búsqueda híbrida (Firestore + Tavily fallback) |
| POST | `/api/suppliers/:id/track` | Registrar métrica (view/click/contact) |
| GET | `/api/suppliers/:id` | Obtener detalles de un proveedor |
| GET | `/api/admin/suppliers/stats` | Dashboard de estadísticas (admin) |
| GET | `/api/admin/suppliers/pending` | Proveedores pendientes de validar (admin) |

---

## 1️⃣ POST /api/suppliers/search - Búsqueda Híbrida

### **Descripción:**
Busca proveedores primero en Firestore (cache local). Si hay < 3 resultados, busca en Tavily y guarda nuevos proveedores.

### **Request:**

```javascript
POST /api/suppliers/search
Content-Type: application/json

{
  "service": "fotografia",           // Requerido: categoria del proveedor
  "location": "Valencia",            // Requerido: ciudad de la boda
  "query": "alfonso calza",          // Opcional: búsqueda por nombre
  "budget": 2000,                    // Opcional: presupuesto en €
  "filters": {                       // Opcional: filtros adicionales
    "priceRange": "€€€",
    "rating": 4.5,
    "availability": "available"
  }
}
```

### **Response:**

```javascript
{
  "success": true,
  "count": 5,
  "source": "firestore", // o "firestore+tavily" si usó fallback
  "suppliers": [
    {
      "id": "alfonso-calza-valencia",
      "name": "Alfonso Calza",
      "category": "fotografia",
      "location": {
        "city": "Valencia",
        "province": "Valencia"
      },
      "contact": {
        "email": "alfonso@alfonsocalza.com",
        "phone": "+34 XXX XXX XXX",
        "website": "https://alfonsocalza.com"
      },
      "business": {
        "description": "Fotógrafo de bodas especializado...",
        "priceRange": "€€€",
        "minBudget": 1500,
        "maxBudget": 4000
      },
      "metrics": {
        "matchScore": 95,
        "rating": 4.9,
        "reviewCount": 127
      },
      "media": {
        "logo": "https://...",
        "cover": "https://..."
      }
    }
    // ... más proveedores
  ]
}
```

### **Implementación:**

```javascript
// backend/routes/suppliers-search.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { searchTavily } = require('../services/tavilyService');

router.post('/api/suppliers/search', async (req, res) => {
  try {
    const { service, location, query, budget, filters } = req.body;
    
    // Validaciones
    if (!service || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'service y location son requeridos' 
      });
    }
    
    console.log(`\n🔍 [SEARCH] service="${service}" location="${location}" query="${query}"`);
    
    const db = admin.firestore();
    
    // ===== 1. BÚSQUEDA EN FIRESTORE (CACHE LOCAL) =====
    let firestoreQuery = db.collection('suppliers')
      .where('status', '==', 'active')
      .where('category', '==', service);
    
    // Filtro por ubicación (ciudad exacta o service area)
    // TODO: Mejorar con búsqueda en serviceArea array
    firestoreQuery = firestoreQuery.where('location.city', '==', location);
    
    // Ordenar por matchScore
    firestoreQuery = firestoreQuery
      .orderBy('metrics.matchScore', 'desc')
      .limit(12);
    
    const snapshot = await firestoreQuery.get();
    let results = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Filtro adicional por keywords si hay query
    if (query && query.trim()) {
      const keywords = query.toLowerCase().split(' ');
      results = results.filter(supplier => {
        const searchText = [
          supplier.name,
          supplier.business?.description || '',
          ...(supplier.tags || [])
        ].join(' ').toLowerCase();
        
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }
    
    // Filtro por presupuesto
    if (budget) {
      results = results.filter(supplier => 
        supplier.business?.minBudget <= budget && 
        supplier.business?.maxBudget >= budget
      );
    }
    
    // Filtros adicionales
    if (filters) {
      if (filters.priceRange) {
        results = results.filter(s => s.business?.priceRange === filters.priceRange);
      }
      if (filters.rating) {
        results = results.filter(s => (s.metrics?.rating || 0) >= filters.rating);
      }
      if (filters.availability) {
        results = results.filter(s => s.business?.availability === filters.availability);
      }
    }
    
    console.log(`✅ [FIRESTORE] ${results.length} proveedores encontrados en cache`);
    
    // ===== 2. FALLBACK A TAVILY SI HAY POCOS RESULTADOS =====
    let usedFallback = false;
    
    if (results.length < 3) {
      console.log('⚠️ [FALLBACK] Menos de 3 resultados. Buscando en Tavily...');
      
      try {
        const tavilyResults = await searchTavily(
          query || service, 
          location, 
          budget, 
          service
        );
        
        // Guardar nuevos proveedores en Firestore
        for (const provider of tavilyResults) {
          // Verificar si ya existe
          const existingSnapshot = await db.collection('suppliers')
            .where('contact.email', '==', provider.email)
            .limit(1)
            .get();
          
          if (existingSnapshot.empty) {
            // Crear slug
            const slug = createSlug(provider.name, location);
            
            // Crear nuevo proveedor
            await db.collection('suppliers').doc(slug).set({
              ...provider,
              slug,
              status: 'pending',
              createdBy: 'tavily-realtime',
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
            
            results.push({ id: slug, ...provider });
            console.log(`✅ [NUEVO] ${provider.name} guardado en Firestore`);
          }
        }
        
        usedFallback = true;
        
      } catch (error) {
        console.error('❌ [TAVILY ERROR]:', error.message);
        // Continuar con resultados de Firestore (aunque sean pocos)
      }
    }
    
    // ===== 3. REGISTRAR MÉTRICAS DE VISTAS =====
    if (results.length > 0) {
      const batch = db.batch();
      
      results.forEach(supplier => {
        const docRef = db.collection('suppliers').doc(supplier.id);
        batch.update(docRef, {
          'metrics.views': admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
    }
    
    // ===== 4. RESPONDER =====
    console.log(`\n📊 [RESULTADO] Devolviendo ${results.length} proveedores\n`);
    
    res.json({
      success: true,
      count: results.length,
      suppliers: results,
      source: usedFallback ? 'firestore+tavily' : 'firestore'
    });
    
  } catch (error) {
    console.error('❌ [ERROR] Error en búsqueda:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

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

module.exports = router;
```

---

## 2️⃣ POST /api/suppliers/:id/track - Registrar Métricas

### **Descripción:**
Registra métricas de uso (view, click, contact) sin necesidad de que el usuario esté autenticado.

### **Request:**

```javascript
POST /api/suppliers/alfonso-calza-valencia/track
Content-Type: application/json

{
  "action": "click",              // "view" | "click" | "contact"
  "userId": "user123",            // Opcional: ID del usuario
  "weddingId": "wedding456"       // Opcional: ID de la boda
}
```

### **Response:**

```javascript
{
  "success": true
}
```

### **Implementación:**

```javascript
// backend/routes/suppliers-metrics.js

router.post('/api/suppliers/:id/track', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, userId, weddingId } = req.body;
    
    // Validar action
    const validActions = ['view', 'click', 'contact'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'action debe ser view, click o contact' 
      });
    }
    
    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);
    
    // Verificar que el proveedor existe
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    // Actualizar métrica correspondiente
    const updateData = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (action === 'click') {
      updateData['metrics.clicks'] = admin.firestore.FieldValue.increment(1);
    } else if (action === 'contact') {
      updateData['metrics.conversions'] = admin.firestore.FieldValue.increment(1);
      updateData['metrics.lastContactDate'] = admin.firestore.FieldValue.serverTimestamp();
    }
    // view ya se registra en /search
    
    await docRef.update(updateData);
    
    // Registrar evento detallado (opcional, para analytics)
    await db.collection('supplier_events').add({
      supplierId: id,
      action,
      userId: userId || 'anonymous',
      weddingId: weddingId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: req.headers['user-agent'] || null
    });
    
    console.log(`📊 [METRIC] ${action} registrado para ${id}`);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error tracking metric:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

---

## 3️⃣ GET /api/suppliers/:id - Detalles de Proveedor

### **Request:**

```javascript
GET /api/suppliers/alfonso-calza-valencia
```

### **Response:**

```javascript
{
  "success": true,
  "supplier": {
    "id": "alfonso-calza-valencia",
    "name": "Alfonso Calza",
    // ... todos los campos del schema
  }
}
```

### **Implementación:**

```javascript
router.get('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = admin.firestore();
    const doc = await db.collection('suppliers').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    res.json({
      success: true,
      supplier: { id: doc.id, ...doc.data() }
    });
    
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 4️⃣ GET /api/admin/suppliers/stats - Dashboard Admin

### **Descripción:**
Estadísticas generales para el panel de administración.

### **Request:**

```javascript
GET /api/admin/suppliers/stats
Authorization: Bearer <admin-token>
```

### **Response:**

```javascript
{
  "success": true,
  "stats": {
    "total": 1250,
    "active": 980,
    "pending": 45,
    "inactive": 225,
    "claimed": 32
  },
  "topByConversions": [
    {
      "id": "alfonso-calza-valencia",
      "name": "Alfonso Calza",
      "conversions": 87,
      "rating": 4.9
    }
    // ...top 20
  ],
  "topByRating": [
    {
      "id": "bodas-palacio-alicante",
      "name": "Bodas Palacio",
      "rating": 5.0,
      "reviews": 234
    }
    // ...top 20
  ],
  "recentlyAdded": [
    // ...últimos 10
  ]
}
```

### **Implementación:**

```javascript
router.get('/api/admin/suppliers/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Contadores
    const total = (await db.collection('suppliers').count().get()).data().count;
    const active = (await db.collection('suppliers').where('status', '==', 'active').count().get()).data().count;
    const pending = (await db.collection('suppliers').where('status', '==', 'pending').count().get()).data().count;
    const inactive = (await db.collection('suppliers').where('status', '==', 'inactive').count().get()).data().count;
    const claimed = (await db.collection('suppliers').where('claimed', '==', true).count().get()).data().count;
    
    // Top por conversiones
    const topConversions = await db.collection('suppliers')
      .where('status', '==', 'active')
      .orderBy('metrics.conversions', 'desc')
      .limit(20)
      .get();
    
    // Top por rating
    const topRating = await db.collection('suppliers')
      .where('status', '==', 'active')
      .orderBy('metrics.rating', 'desc')
      .limit(20)
      .get();
    
    // Recién agregados
    const recent = await db.collection('suppliers')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    res.json({
      success: true,
      stats: { total, active, pending, inactive, claimed },
      topByConversions: topConversions.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        conversions: doc.data().metrics.conversions,
        rating: doc.data().metrics.rating
      })),
      topByRating: topRating.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        rating: doc.data().metrics.rating,
        reviews: doc.data().metrics.reviewCount
      })),
      recentlyAdded: recent.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        createdAt: doc.data().createdAt,
        status: doc.data().status
      }))
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 5️⃣ GET /api/admin/suppliers/pending - Proveedores Pendientes

### **Request:**

```javascript
GET /api/admin/suppliers/pending?limit=50
Authorization: Bearer <admin-token>
```

### **Response:**

```javascript
{
  "success": true,
  "count": 45,
  "suppliers": [
    {
      "id": "nuevo-catering-madrid",
      "name": "Nuevo Catering",
      "category": "catering",
      "location": { "city": "Madrid" },
      "createdAt": "2025-01-27T10:00:00Z",
      "createdBy": "cron-weekly"
    }
    // ...
  ]
}
```

---

## 🔐 AUTENTICACIÓN

### **Middleware para rutas admin:**

```javascript
// backend/middleware/authenticateAdmin.js

async function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Verificar que es admin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    req.user = decodedToken;
    next();
    
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authenticateAdmin;
```

---

## 📚 SIGUIENTE PASO

Lee: **[Sistema Claim](./CLAIM-SYSTEM.md)** para entender cómo los proveedores pueden reclamar su perfil.
