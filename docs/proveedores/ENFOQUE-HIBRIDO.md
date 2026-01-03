# 🔄 Enfoque Híbrido - Sistema Inteligente de Búsqueda

**Actualización:** 2025-10-28  
**Estado:** ✅ Implementado  
**Estrategia:** Búsqueda flexible por nombre + Lógica de 5 proveedores

---

## 🎯 VISIÓN GENERAL

Sistema híbrido que combina **base de datos propia (Firestore)** con **búsqueda en internet (Tavily)** de forma inteligente, priorizando proveedores registrados y optimizando costes.

### **¿Por qué híbrido?**
- ✅ **Lanzamiento inmediato** - Funciona desde día 1 aunque no tengas proveedores
- ✅ **Catálogo completo** - Muestra proveedores reales y de internet
- ✅ **Incentivo natural** - Proveedores registrados aparecen primero
- ✅ **Optimización de costes** - Reduce llamadas a Tavily automáticamente
- ✅ **Búsqueda flexible** - Por nombre, no categorías rígidas

---

## 📊 EVOLUCIÓN DEL SISTEMA

```
┌──────────────────────────────────────────────────────────┐
│ FASE 1: 100% Internet (MES 1-2)                          │
├──────────────────────────────────────────────────────────┤
│ Tavily → Resultados de internet → Cache en Firestore    │
│ Usuario ve: bodas.net, Instagram, webs propias          │
│ Registrados: 0% | Internet: 100%                        │
└──────────────────────────────────────────────────────────┘

                         ⬇️

┌──────────────────────────────────────────────────────────┐
│ FASE 2: Híbrido 20/80 (MES 3-6)                         │
├──────────────────────────────────────────────────────────┤
│ Firestore (registrados) → Tavily (resto)                │
│ Usuario ve: [VERIFICADOS] arriba + [Internet] abajo     │
│ Registrados: 20% | Internet: 80%                        │
└──────────────────────────────────────────────────────────┘

                         ⬇️

┌──────────────────────────────────────────────────────────┐
│ FASE 3: Híbrido 50/50 (MES 6-12)                        │
├──────────────────────────────────────────────────────────┤
│ Más proveedores registrados, menos de internet          │
│ Usuario ve: [VERIFICADOS] (mayoría) + [Internet] (pocos)│
│ Registrados: 50% | Internet: 50%                        │
└──────────────────────────────────────────────────────────┘

                         ⬇️

┌──────────────────────────────────────────────────────────┐
│ FASE 4: Plataforma Propia 90/10 (AÑO 2+)                │
├──────────────────────────────────────────────────────────┤
│ Base de datos robusta, Tavily solo fallback             │
│ Usuario ve: Casi todo verificado, muy pocos de internet │
│ Registrados: 90% | Internet: 10%                        │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE BÚSQUEDA ACTUAL (IMPLEMENTADO)

### **Sistema Inteligente con Lógica de 5 Proveedores**

```javascript
Usuario busca "ReSona valencia"
         ↓
    1️⃣ BUSCAR EN FIRESTORE POR NOMBRE
       - NO filtra por category
       - Busca en: name, description, tags
       - Trae hasta 100 resultados
         ↓
    2️⃣ FILTRAR EN MEMORIA
       searchTerm = "resona"
       Match: name, description o tags
         ↓
    3️⃣ SEPARAR REGISTRADOS DE CACHÉ
       registered = true  → trueRegistered[]
       registered = false → cachedResults[]
         ↓
    4️⃣ DECIDIR SEGÚN CANTIDAD
       
       ┌─────────────────────────────────────┐
       │ ≥5 registrados?                     │
       ├─────────────────────────────────────┤
       │ SÍ → Solo mostrar registrados       │
       │      NO buscar en Tavily            │
       └─────────────────────────────────────┘
                    ↓
       ┌─────────────────────────────────────┐
       │ 1-4 registrados?                    │
       ├─────────────────────────────────────┤
       │ SÍ → Mostrar registrados            │
       │      + Buscar en Tavily (complemento)│
       └─────────────────────────────────────┘
                    ↓
       ┌─────────────────────────────────────┐
       │ 0 registrados?                      │
       ├─────────────────────────────────────┤
       │ SÍ → Mostrar caché                  │
       │      + Buscar en Tavily             │
       └─────────────────────────────────────┘
         ↓
    5️⃣ DEVOLVER AL USUARIO
       [Registrados] primero
       [Internet] después
```

**Ventajas:**
- ✅ Búsqueda flexible por nombre
- ✅ Optimización automática de costes
- ✅ Siempre muestra resultados relevantes
- ✅ Prioriza proveedores registrados

---

## 🗄️ SCHEMA FIREBASE - CAMPOS HÍBRIDOS

```javascript
{
  // Campos básicos (igual que antes)
  id: "alfonso-calza-valencia",
  name: "Alfonso Calza",
  category: "fotografia",
  location: { city: "Valencia" },
  contact: { email: "..." },
  
  // 🆕 CAMPOS PARA HÍBRIDO
  registered: false,              // ¿Registrado en plataforma?
  // false = encontrado en internet (cache)
  // true = registrado oficialmente
  
  source: "tavily",               // tavily | registration | claim
  // tavily = descubierto automáticamente
  // registration = registrado por proveedor
  // claim = perfil reclamado
  
  lastSeen: Timestamp,            // Última vez visto en búsqueda
  // Para saber qué proveedores siguen activos
  
  status: "discovered",           // discovered | active | inactive
  // discovered = en cache, no registrado
  // active = registrado y verificado
  // inactive = URL caída o sin respuesta
  
  // Resto de campos igual
}
```

---

## 🎨 UI - DIFERENCIACIÓN VISUAL

### **Proveedor REGISTRADO (Verde, destacado)**
```
┌─────────────────────────────────────────────┐
│ Alfonso Calza                [Verificado ✓] │ ← Badge verde
│ ⭐⭐⭐⭐⭐ 4.9 (127 reseñas)                   │
│                                             │
│ Fotógrafo de bodas especializado en...     │
│                                             │
│ 📍 Valencia • 💰 €€€                        │
│                                             │
│ [💬 Contactar]  [👁️ Ver perfil completo]     │ ← Botones destacados
└─────────────────────────────────────────────┘
```

### **Proveedor de INTERNET (Gris, normal)**
```
┌─────────────────────────────────────────────┐
│ Fotógrafo XYZ              [bodas.net] 🌐   │ ← Badge gris
│ Sin valoraciones                            │
│                                             │
│ Fotógrafo profesional de bodas              │
│                                             │
│ 📍 Valencia                                 │
│ 🔗 Fuente: bodas.net                        │
│                                             │
│ [🌐 Ver web]  [✉️ Sugerir registro]          │ ← Botones normales
└─────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTACIÓN FASE 1 (INMEDIATA)

### **Modificar endpoint actual para guardar en Firestore**

```javascript
// backend/routes/ai-suppliers-tavily.js

router.post('/api/ai-suppliers/tavily', async (req, res) => {
  try {
    const { service, location, query, budget } = req.body;
    
    // 1. BUSCAR EN TAVILY (como siempre)
    const results = await searchTavily(query, location, budget, service);
    
    // 2. 🆕 GUARDAR EN FIRESTORE (background, no bloquear respuesta)
    saveToFirestoreBackground(results, service, location);
    
    // 3. RESPONDER INMEDIATAMENTE
    res.json(results);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Nueva función: guardar en background
async function saveToFirestoreBackground(results, service, location) {
  // No usar await, dejar que se ejecute en paralelo
  Promise.all(results.map(async (provider) => {
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      const slug = createSlug(provider.name, location);
      
      // Verificar si ya existe
      const doc = await db.collection('suppliers').doc(slug).get();
      
      if (!doc.exists) {
        // Crear nuevo
        await db.collection('suppliers').doc(slug).set({
          ...provider,
          slug,
          category: service,
          registered: false,        // 🆕 No registrado
          source: 'tavily',         // 🆕 De Tavily
          status: 'discovered',     // 🆕 Descubierto
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`💾 [CACHE] ${provider.name} → Firestore`);
      } else {
        // Actualizar lastSeen
        await db.collection('suppliers').doc(slug).update({
          lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      // No propagar error, es background
      console.error('Error caching to Firestore:', error);
    }
  })).catch(console.error);
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
```

**Resultado:** 
- Usuario NO nota cambios
- Sistema empieza a construir base de datos automáticamente
- Preparado para Fase 2

---

## 🔧 IMPLEMENTACIÓN FASE 2 (1-2 semanas después)

### **Crear nuevo endpoint híbrido**

```javascript
// backend/routes/suppliers-hybrid.js

router.post('/api/suppliers/search', async (req, res) => {
  try {
    const { service, location, query, budget } = req.body;
    
    const db = admin.firestore();
    
    // 1. BUSCAR REGISTRADOS en Firestore
    const registeredSnapshot = await db.collection('suppliers')
      .where('category', '==', service)
      .where('location.city', '==', location)
      .where('registered', '==', true)      // Solo registrados
      .where('status', '==', 'active')
      .orderBy('metrics.matchScore', 'desc')
      .limit(20)
      .get();
    
    const registeredResults = registeredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      priority: 'registered',
      badge: 'Verificado ✓'
    }));
    
    console.log(`✅ [REGISTERED] ${registeredResults.length} verificados`);
    
    // 2. SI HAY POCOS, BUSCAR EN INTERNET
    let internetResults = [];
    
    if (registeredResults.length < 10) {
      console.log('🌐 [TAVILY] Buscando en internet...');
      
      const tavilyResults = await searchTavily(query || service, location, budget, service);
      
      // Filtrar duplicados
      const registeredEmails = new Set(registeredResults.map(r => r.contact?.email));
      
      internetResults = tavilyResults
        .filter(r => !registeredEmails.has(r.contact?.email))
        .map(r => ({
          ...r,
          priority: 'internet',
          badge: 'De internet',
          source: r.sources?.[0]?.platform || 'web'
        }))
        .slice(0, 8); // Máximo 8 de internet
      
      // Guardar en Firestore (background)
      saveToFirestoreBackground(tavilyResults, service, location);
    }
    
    // 3. MEZCLAR: Registrados primero, luego internet
    const allResults = [
      ...registeredResults,
      ...internetResults
    ];
    
    console.log(`📊 Total: ${allResults.length} (${registeredResults.length} verificados + ${internetResults.length} internet)`);
    
    res.json({
      success: true,
      count: allResults.length,
      breakdown: {
        registered: registeredResults.length,
        internet: internetResults.length
      },
      suppliers: allResults
    });
    
  } catch (error) {
    console.error('Error en búsqueda híbrida:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📈 MÉTRICAS DE ÉXITO POR FASE

### **Fase 1:**
- ✅ 0 proveedores registrados (normal)
- ✅ +500 proveedores en cache Firestore
- ✅ 100% búsquedas funcionan

### **Fase 2:**
- ✅ +50 proveedores registrados
- ✅ +2000 proveedores en cache
- ✅ 20% registrados / 80% internet

### **Fase 3:**
- ✅ +200 proveedores registrados
- ✅ 50% registrados / 50% internet
- ✅ Reducción 50% costes Tavily

### **Fase 4:**
- ✅ +500 proveedores registrados
- ✅ 90% registrados / 10% internet
- ✅ Reducción 80% costes Tavily

---

## 💰 COSTES POR FASE

| Fase | Tavily API | Firestore | Total/mes | Ahorro |
|------|-----------|-----------|-----------|--------|
| **Fase 1** | $150 | Gratis | $150 | 0% |
| **Fase 2** | $120 | Gratis | $120 | 20% |
| **Fase 3** | $75 | $5 | $80 | 47% |
| **Fase 4** | $30 | $10 | $40 | 73% |

---

## 🎯 INCENTIVOS PARA REGISTRO

### **Para proveedores:**
1. ✅ Aparecer PRIMERO en resultados
2. ✅ Badge "Verificado ✓"
3. ✅ Perfil completo con portfolio
4. ✅ Métricas y estadísticas
5. ✅ Contacto directo desde plataforma
6. ✅ Dashboard de gestión

### **Para usuarios:**
1. ✅ Proveedores verificados y confiables
2. ✅ Información completa y actualizada
3. ✅ Contacto directo y rápido
4. ✅ Reviews y valoraciones reales
5. ✅ Gestión centralizada

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [Plan de Implementación](./PLAN-IMPLEMENTACION.md) - Pasos detallados
- [API Endpoints](./API-ENDPOINTS.md) - Endpoints híbridos
- [Firebase Schema](./FIREBASE-SCHEMA.md) - Estructura de datos

---

## 🚀 PRÓXIMOS PASOS

1. **Ahora:** Implementar Fase 1 (guardar en Firestore)
2. **1-2 semanas:** Implementar Fase 2 (búsqueda híbrida)
3. **Continuo:** Captar proveedores para registro
4. **Futuro:** Fases 3 y 4 (priorización creciente)

**El sistema evoluciona naturalmente con el crecimiento de la plataforma.** 🚀
