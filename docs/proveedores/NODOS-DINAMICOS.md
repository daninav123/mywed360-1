# 🧠 Sistema de Nodos Dinámicos Auto-Evolutivo

**Fecha:** 2025-10-28  
**Estado:** 🚧 En implementación - Fase 1  
**Objetivo:** Sistema que aprende automáticamente qué características buscan los usuarios

---

## 🎯 CONCEPTO

Un sistema que **aprende de cada búsqueda** y **crea automáticamente nuevas dimensiones** de matching cuando detecta patrones recurrentes.

### **Ejemplo:**

```
Semana 1: 5 usuarios buscan "fotógrafo con drone"
Semana 2: 10 usuarios buscan "fotos aéreas boda"
Semana 3: 15 usuarios buscan "fotografía aérea"
         ↓
Sistema detecta: "aerial_photography" es una necesidad real
         ↓
Crea automáticamente:
  - Nuevo nodo: "Fotografía aérea"
  - Keywords: ["drone", "aerial", "aérea", "vuelo"]
  - Puede aplicarse a proveedores con "drone" en descripción
```

---

## 📊 ARQUITECTURA DE DATOS

### **1. Colección: `searchAnalytics`**

Captura **cada búsqueda** para análisis:

```javascript
{
  "id": "search_abc123",
  "timestamp": "2025-10-28T03:30:00Z",
  "user_id": "user_456",
  "wedding_id": "wedding_789",
  
  // INPUT ORIGINAL
  "query": "fotógrafo vintage con drone para boda en jardín",
  "service": "photography",
  "location": "Valencia",
  "filters": {
    "budget": 2000,
    "guestCount": 120,
    "date": "2025-06-15"
  },
  
  // ANÁLISIS AUTOMÁTICO
  "extracted_keywords": [
    {
      "word": "vintage",
      "confidence": 0.95,
      "category": "style",
      "position": 1
    },
    {
      "word": "drone",
      "confidence": 0.92,
      "category": "equipment",
      "position": 3
    },
    {
      "word": "jardin",
      "confidence": 0.88,
      "category": "venue",
      "position": 6
    }
  ],
  
  // RESULTADOS
  "results_count": 5,
  "clicked_suppliers": ["supplier_1", "supplier_3"],
  "hired_supplier": "supplier_1",
  "hired_at": "2025-11-05T10:00:00Z",
  
  // ENGAGEMENT
  "time_on_results": 45,  // segundos
  "scroll_depth": 0.8     // % de scroll
}
```

**Propósito:** Base de datos de inteligencia para aprendizaje.

---

### **2. Colección: `nodeCandidates`**

Nodos **en evaluación** (aún no activos):

```javascript
{
  "id": "photography_drone",
  "keywords": ["drone", "dron", "aerial", "aerea"],
  "category": "photography",
  
  // CONTADORES
  "mention_count": 28,              // Apariciones totales
  "unique_users": 18,               // Usuarios diferentes
  "unique_weddings": 15,            // Bodas diferentes
  "unique_searches": 22,            // Búsquedas únicas
  
  // TEMPORAL
  "first_seen": "2025-09-15T12:00:00Z",
  "last_seen": "2025-10-28T03:15:00Z",
  "days_active": 43,
  
  // CONTEXTO
  "common_phrases": [
    {
      "phrase": "fotografía con drone",
      "count": 12
    },
    {
      "phrase": "fotos aéreas",
      "count": 8
    },
    {
      "phrase": "drone boda",
      "count": 5
    }
  ],
  
  // GEOGRAFÍA
  "top_locations": {
    "Valencia": 8,
    "Barcelona": 6,
    "Madrid": 4
  },
  
  // PRESUPUESTO
  "avg_budget": 2150,
  "budget_range": {
    "min": 1500,
    "max": 3500
  },
  
  // CONVERSIÓN
  "conversions": 6,                 // Contrataciones con este keyword
  "conversion_rate": 0.27,          // 6/22 = 27%
  
  // ESTADO
  "status": "pending",              // pending | approved | rejected | expired
  "threshold_progress": 0.93,       // 28/30 = 93% hacia activación
  
  // SUGERENCIAS DEL SISTEMA
  "ai_suggestions": {
    "type": "specialization",
    "display_name": {
      "es": "Fotografía aérea",
      "en": "Aerial photography"
    },
    "estimated_price_impact": 300,  // € extra que suelen pagar
    "confidence": 0.89
  }
}
```

**Propósito:** Nodos que están a punto de activarse automáticamente.

---

### **3. Colección: `dynamicNodes`**

Nodos **activos** (ya creados y en uso):

```javascript
{
  "id": "aerial_photography",
  "type": "specialization",        // specialization | style | requirement | equipment
  "category": "photography",        // Servicio al que pertenece
  
  "display_name": {
    "es": "Fotografía aérea",
    "en": "Aerial photography",
    "fr": "Photographie aérienne"
  },
  
  "description": {
    "es": "Fotografía desde drone o altura elevada",
    "en": "Photography from drone or elevated height"
  },
  
  "keywords": ["drone", "aerial", "aerea", "vuelo", "altura"],
  "synonyms": ["dron", "uav", "bird eye"],
  
  // ORIGEN
  "creation": {
    "created_at": "2025-10-20T10:00:00Z",
    "method": "auto_frequency",     // auto_frequency | manual | ai_cluster
    "trigger_count": 45,
    "created_by": "system",         // system | admin_user_id
    "confidence": 0.89
  },
  
  // MÉTRICAS DE USO
  "metrics": {
    "total_mentions": 187,
    "last_7_days": 12,
    "last_30_days": 45,
    "last_90_days": 120,
    
    "growth_rate": 0.23,            // +23% mensual
    "trend": "rising",              // rising | stable | declining
    
    "conversion_rate": 0.41,        // % de búsquedas que contratan
    "avg_budget_impact": 350,       // € extra promedio
    
    "total_hires": 78,              // Contrataciones con este nodo
    "total_revenue": 27300          // Revenue atribuible
  },
  
  // RELACIONES CON OTROS NODOS
  "relationships": [
    {
      "node_id": "outdoor_wedding",
      "type": "correlates_with",
      "strength": 0.78,             // 0-1
      "co_occurrences": 89
    },
    {
      "node_id": "luxury_wedding",
      "type": "often_paired",
      "strength": 0.65,
      "co_occurrences": 52
    },
    {
      "node_id": "vintage_style",
      "type": "rarely_paired",
      "strength": 0.12,
      "co_occurrences": 3
    }
  ],
  
  // ESTADO
  "status": "active",               // active | deprecated | archived
  "validation": {
    "validated_by_expert": true,
    "validated_at": "2025-10-21T09:00:00Z",
    "validator_id": "admin_123",
    "notes": "Popular en bodas al aire libre"
  },
  
  // APLICABILIDAD A PROVEEDORES
  "auto_apply_rules": {
    "enabled": true,
    "conditions": [
      {
        "field": "business.description",
        "contains": ["drone", "aerial", "aérea"]
      },
      {
        "field": "tags",
        "includes_any": ["drone", "aerial_photography"]
      }
    ],
    "applied_to": 23                // Proveedores que tienen este nodo
  }
}
```

**Propósito:** Nodos activos que se usan para matching y scoring.

---

### **4. Colección: `nodeEvolution`**

Historial de cambios (auditoría):

```javascript
{
  "id": "evolution_001",
  "node_id": "aerial_photography",
  "event_type": "created",          // created | updated | deprecated
  "timestamp": "2025-10-20T10:00:00Z",
  
  "before": null,
  "after": {
    "status": "active",
    "metrics": { "total_mentions": 45 }
  },
  
  "trigger": {
    "type": "auto_threshold",
    "threshold_reached": "MIN_MENTIONS",
    "value": 45
  },
  
  "metadata": {
    "admin_notified": true,
    "auto_approved": false
  }
}
```

---

## 🔄 FLUJO COMPLETO

### **1. Captura de Búsqueda**

```javascript
Usuario busca: "fotógrafo con drone valencia"
         ↓
Backend captura en searchAnalytics:
  - query: "fotógrafo con drone valencia"
  - service: "photography"
  - location: "Valencia"
         ↓
Análisis NLP extrae keywords:
  - "drone" (confidence: 0.92)
  - "valencia" (confidence: 0.95)
         ↓
Búsqueda continúa normalmente...
```

---

### **2. Análisis Asíncrono**

```javascript
(Background job, no bloquea búsqueda)
         ↓
Para cada keyword extraído:
  1. ¿Existe en dynamicNodes? → Incrementar métricas
  2. ¿Existe en nodeCandidates? → Incrementar contador
  3. ¿No existe? → Crear nuevo candidato
         ↓
Ejemplo: "drone" no existe
         ↓
Crear nodeCandidates/photography_drone:
  - mention_count: 1
  - unique_users: 1
  - first_seen: NOW
```

---

### **3. Evaluación Periódica (Cron diario)**

```javascript
Cron job: 02:00 AM diario
         ↓
Revisar nodeCandidates
         ↓
¿Cumple umbrales?
  - mention_count >= 30
  - unique_users >= 10
  - days_active <= 90
         ↓
SÍ → Crear dynamicNode automáticamente
NO → Seguir acumulando
         ↓
Si se crea:
  - Mover de candidate a active
  - Notificar admin
  - Aplicar a proveedores existentes
```

---

### **4. Aplicación a Proveedores**

```javascript
Nuevo nodo creado: "aerial_photography"
         ↓
Buscar proveedores con:
  - description CONTAINS "drone"
  - tags INCLUDES "drone"
         ↓
Agregar a matchingProfile.nodes:
  supplier_123.matchingProfile.nodes.push("aerial_photography")
         ↓
Ahora aparecerá en búsquedas relevantes
```

---

## 🎚️ CONFIGURACIÓN DE UMBRALES

```javascript
// backend/config/nodeThresholds.js

module.exports = {
  // CREACIÓN AUTOMÁTICA
  MIN_MENTIONS: 30,           // Mínimo de menciones
  MIN_UNIQUE_USERS: 10,       // Usuarios diferentes
  MIN_UNIQUE_WEDDINGS: 8,     // Bodas diferentes
  MAX_DAYS_TO_ACTIVATE: 90,   // Máximo tiempo en evaluación
  
  // CONFIANZA
  MIN_CONFIDENCE: 0.75,       // Score NLP mínimo
  MIN_CONVERSION_RATE: 0.15,  // % mínimo de contratación
  
  // APROBACIÓN
  AUTO_APPROVE_THRESHOLD: 50, // Auto-aprobar si >50 menciones
  REQUIRE_VALIDATION: true,   // Requiere validación manual
  
  // GEOGRAFÍA
  MIN_LOCATIONS: 3,           // Mínimo ciudades diferentes
  
  // DEPRECIACIÓN
  INACTIVE_DAYS: 180,         // Marcar inactivo si no uso en 6 meses
  MIN_RECENT_MENTIONS: 5      // Mínimo en últimos 30 días
};
```

---

## 🧪 EJEMPLOS DE NODOS AUTO-CREADOS

### **Nodo 1: Fotografía aérea**
```javascript
{
  "id": "aerial_photography",
  "keywords": ["drone", "aerial", "aerea", "vuelo"],
  "trigger_count": 45,
  "avg_budget_impact": +300€
}
```

### **Nodo 2: Boda pet-friendly**
```javascript
{
  "id": "pet_friendly",
  "keywords": ["mascota", "perro", "gato", "pet"],
  "trigger_count": 32,
  "correlates_with": ["outdoor_wedding", "casual"]
}
```

### **Nodo 3: Ceremonia laica**
```javascript
{
  "id": "secular_ceremony",
  "keywords": ["laica", "civil", "no religiosa"],
  "trigger_count": 67,
  "strong_in": ["Barcelona", "Madrid"]
}
```

---

## 📈 MÉTRICAS DEL SISTEMA

### **Dashboard de Admin**

```javascript
GET /api/admin/nodes/stats

{
  "active_nodes": 87,
  "pending_candidates": 12,
  "this_month": {
    "new_nodes_created": 5,
    "auto_approved": 2,
    "manually_approved": 3
  },
  "trending_candidates": [
    {
      "id": "micro_wedding",
      "progress": 0.97,
      "mentions": 29,
      "trend": "🔥 +40% this week"
    }
  ]
}
```

---

## 🚀 FASES DE IMPLEMENTACIÓN

### **✅ Fase 1: Fundamentos (Actual)**
- [x] Documentación del sistema
- [ ] Schema en Firestore
- [ ] Captura básica de búsquedas
- [ ] Análisis simple de keywords

### **⏳ Fase 2: Análisis**
- [ ] Servicio NLP para extracción
- [ ] Sistema de candidatos
- [ ] Cron de evaluación
- [ ] Dashboard de admin

### **⏳ Fase 3: Automatización**
- [ ] Creación automática de nodos
- [ ] Aplicación a proveedores existentes
- [ ] Matching inteligente
- [ ] Sistema de relaciones entre nodos

### **⏳ Fase 4: ML Avanzado**
- [ ] Clustering automático
- [ ] Predicción de tendencias
- [ ] Recomendaciones proactivas
- [ ] A/B testing de nodos

---

## 🔗 DOCUMENTACIÓN RELACIONADA

- [BUSQUEDA-HIBRIDA-ACTUAL.md](./BUSQUEDA-HIBRIDA-ACTUAL.md) - Sistema actual
- [FIREBASE-SCHEMA.md](./FIREBASE-SCHEMA.md) - Estructura de datos
- [API-ENDPOINTS.md](./API-ENDPOINTS.md) - Endpoints disponibles

---

**Sistema diseñado para evolucionar con el uso real** 🧠✨
