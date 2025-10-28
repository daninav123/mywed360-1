# 🗄️ Schema Firebase - Colección Suppliers

**Actualización:** 2025-01-28

---

## 📦 COLLECTION: `suppliers`

Cada documento representa un proveedor de servicios de boda.

### **Document ID:** `slug` único
Formato: `{nombre}-{ciudad}` (ej: `alfonso-calza-valencia`)

---

## 📋 ESTRUCTURA COMPLETA

```javascript
{
  // ===== IDENTIFICACIÓN =====
  id: "alfonso-calza-valencia",          // String (único)
  slug: "alfonso-calza-valencia",        // String (único, usado como doc ID)
  name: "Alfonso Calza",                 // String (REQUERIDO)
  
  // ===== CATEGORIZACIÓN =====
  category: "fotografia",                // String (REQUERIDO)
  // Valores: fotografia | catering | dj | flores | video | decoracion | vestidos | peluqueria | maquillaje | invitaciones | pasteleria | animacion | transporte | otros
  
  subcategory: "bodas-arquitectura",     // String (opcional)
  tags: [                                // Array<String> (opcional)
    "bodas",
    "arquitectura",
    "creativo",
    "valencia"
  ],
  
  // ===== UBICACIÓN =====
  location: {
    city: "Valencia",                    // String (REQUERIDO)
    province: "Valencia",                // String (REQUERIDO)
    region: "Comunidad Valenciana",      // String (opcional)
    country: "España",                   // String (default: "España")
    coordinates: {                       // Object (opcional, para búsqueda geográfica futura)
      lat: 39.4699,                      // Number
      lng: -0.3763                       // Number
    },
    serviceArea: [                       // Array<String> (zonas donde trabaja)
      "Valencia",
      "Alicante",
      "Castellón"
    ]
  },
  
  // ===== CONTACTO =====
  contact: {
    email: "alfonso@alfonsocalza.com",   // String (REQUERIDO para validación)
    emailVerified: true,                 // Boolean (verificado por sistema)
    phone: "+34 XXX XXX XXX",            // String (opcional)
    phoneVerified: false,                // Boolean
    website: "https://alfonsocalza.com", // String (URL completa)
    instagram: "@alfonsocalza",          // String (opcional)
    facebook: "alfonsocalzafotografia",  // String (opcional)
    whatsapp: "+34XXXXXXXXX"            // String (opcional)
  },
  
  // ===== INFORMACIÓN COMERCIAL =====
  business: {
    description: "Fotógrafo de bodas especializado en arquitectura y momentos únicos", // String
    priceRange: "€€€",                   // String: € | €€ | €€€ | €€€€
    minBudget: 1500,                     // Number (€)
    maxBudget: 4000,                     // Number (€)
    services: [                          // Array<String>
      "Fotografía de boda completa",
      "Preboda",
      "Postboda",
      "Álbum premium"
    ],
    availability: "available",           // String: available | busy | unavailable
    responseTime: "2h"                   // String (tiempo medio de respuesta)
  },
  
  // ===== MÉTRICAS (AUTO-GENERADAS) =====
  metrics: {
    matchScore: 95,                      // Number 0-100 (relevancia calculada)
    views: 1250,                         // Number (veces que apareció en búsquedas)
    clicks: 320,                         // Number (clics a "Ver detalles")
    conversions: 45,                     // Number (formularios contacto enviados)
    rating: 4.8,                         // Number 0-5 (valoración promedio)
    reviewCount: 127,                    // Number (nº de reseñas)
    lastContactDate: Timestamp           // Timestamp (última vez contactado)
  },
  
  // ===== FUENTES DE DATOS =====
  sources: [                             // Array<Object>
    {
      platform: "bodas.net",             // String
      url: "https://...",                // String
      profileId: "e123",                 // String (ID en esa plataforma)
      rating: 4.9,                       // Number (rating en esa plataforma)
      reviews: 87,                       // Number (reseñas en esa plataforma)
      lastChecked: Timestamp,            // Timestamp (última verificación)
      verified: true                     // Boolean (fuente verificada)
    },
    {
      platform: "website",
      url: "https://alfonsocalza.com",
      lastChecked: Timestamp,
      status: "active"                   // String: active | down | error
    },
    {
      platform: "instagram",
      url: "https://instagram.com/alfonsocalza",
      followers: 15000,                  // Number
      lastChecked: Timestamp
    }
  ],
  
  // ===== IMÁGENES =====
  media: {
    logo: "https://storage.googleapis.com/.../logo.jpg",        // String (URL)
    cover: "https://storage.googleapis.com/.../cover.jpg",      // String (URL)
    portfolio: [                                                 // Array<String>
      "https://storage.googleapis.com/.../img1.jpg",
      "https://storage.googleapis.com/.../img2.jpg",
      "https://storage.googleapis.com/.../img3.jpg"
    ]
  },
  
  // ===== ESTADO =====
  status: "active",                      // String: active | inactive | pending | claimed
  // - active: Verificado y visible en búsquedas
  // - inactive: URL caída o sin respuesta
  // - pending: Recién descubierto, requiere validación manual
  // - claimed: Proveedor reclamó su perfil
  
  inactiveReason: null,                  // String: website_down | no_response | duplicate | null
  
  // ===== PERFIL RECLAMADO (FUTURO) =====
  claimed: false,                        // Boolean (¿proveedor reclamó su perfil?)
  claimedBy: null,                       // String (UID Firebase Auth del proveedor)
  claimedAt: null,                       // Timestamp (fecha de reclamación)
  
  // ===== METADATOS =====
  createdAt: Timestamp,                  // Timestamp (fecha creación)
  createdBy: "auto-scraper",             // String: auto-scraper | admin | tavily-realtime | cron-weekly
  lastUpdated: Timestamp,                // Timestamp (última actualización)
  updatedBy: "cron-daily"               // String (quién actualizó)
}
```

---

## 🔑 CAMPOS OBLIGATORIOS (Mínimo viable)

```javascript
{
  name: "Nombre Proveedor",              // ✅ REQUERIDO
  category: "fotografia",                // ✅ REQUERIDO
  location: {
    city: "Valencia",                    // ✅ REQUERIDO
    province: "Valencia"                 // ✅ REQUERIDO
  },
  contact: {
    email: "email@ejemplo.com"           // ✅ REQUERIDO
  },
  status: "pending",                     // ✅ REQUERIDO (default)
  createdAt: Timestamp,                  // ✅ AUTO
  lastUpdated: Timestamp                 // ✅ AUTO
}
```

---

## 📊 ÍNDICES NECESARIOS

Crear en Firebase Console → Firestore → Indexes:

### **Índice 1: Búsqueda por categoría y ubicación**
```
Collection: suppliers
Fields:
  - status (Ascending)
  - category (Ascending)
  - location.city (Ascending)
  - metrics.matchScore (Descending)
```

### **Índice 2: Top proveedores**
```
Collection: suppliers
Fields:
  - status (Ascending)
  - metrics.conversions (Descending)
```

### **Índice 3: Proveedores inactivos (limpieza)**
```
Collection: suppliers
Fields:
  - status (Ascending)
  - lastUpdated (Ascending)
```

---

## 💾 EJEMPLO REAL

```javascript
// Document ID: alfonso-calza-valencia
{
  id: "alfonso-calza-valencia",
  slug: "alfonso-calza-valencia",
  name: "Alfonso Calza",
  category: "fotografia",
  subcategory: "bodas-arquitectura",
  tags: ["bodas", "arquitectura", "creativo", "alta-sociedad", "valencia"],
  
  location: {
    city: "Valencia",
    province: "Valencia",
    region: "Comunidad Valenciana",
    country: "España",
    serviceArea: ["Valencia", "Alicante", "Castellón", "Murcia"]
  },
  
  contact: {
    email: "alfonso@alfonsocalza.com",
    emailVerified: true,
    phone: "+34 123 456 789",
    phoneVerified: false,
    website: "https://alfonsocalza.com",
    instagram: "@alfonsocalza",
    whatsapp: "+34123456789"
  },
  
  business: {
    description: "Fotógrafo de bodas con más de 10 años de experiencia, especializado en capturar la esencia arquitectónica y los momentos únicos de tu día especial.",
    priceRange: "€€€",
    minBudget: 1500,
    maxBudget: 4000,
    services: [
      "Fotografía de boda completa (ceremonia + celebración)",
      "Preboda en localizaciones únicas",
      "Postboda",
      "Álbum premium de diseño",
      "Derechos digitales completos"
    ],
    availability: "available",
    responseTime: "2h"
  },
  
  metrics: {
    matchScore: 95,
    views: 1250,
    clicks: 320,
    conversions: 45,
    rating: 4.9,
    reviewCount: 127,
    lastContactDate: "2025-01-27T10:00:00Z"
  },
  
  sources: [
    {
      platform: "bodas.net",
      url: "https://www.bodas.net/fotografos/alfonso-calza--e123",
      profileId: "e123",
      rating: 4.9,
      reviews: 87,
      lastChecked: "2025-01-27T12:00:00Z",
      verified: true
    },
    {
      platform: "website",
      url: "https://alfonsocalza.com",
      lastChecked: "2025-01-27T12:00:00Z",
      status: "active"
    },
    {
      platform: "instagram",
      url: "https://instagram.com/alfonsocalza",
      followers: 15420,
      lastChecked: "2025-01-27T12:00:00Z"
    }
  ],
  
  media: {
    logo: "https://storage.googleapis.com/mywed360/suppliers/alfonso-calza/logo.jpg",
    cover: "https://storage.googleapis.com/mywed360/suppliers/alfonso-calza/cover.jpg",
    portfolio: [
      "https://storage.googleapis.com/mywed360/suppliers/alfonso-calza/img1.jpg",
      "https://storage.googleapis.com/mywed360/suppliers/alfonso-calza/img2.jpg",
      "https://storage.googleapis.com/mywed360/suppliers/alfonso-calza/img3.jpg"
    ]
  },
  
  status: "active",
  inactiveReason: null,
  claimed: false,
  claimedBy: null,
  claimedAt: null,
  
  createdAt: "2024-06-15T10:30:00Z",
  createdBy: "auto-scraper",
  lastUpdated: "2025-01-27T12:00:00Z",
  updatedBy: "cron-daily"
}
```

---

## 🔄 CICLO DE VIDA DE UN PROVEEDOR

```
┌─────────────┐
│  DESCUBIERTO │ (por Tavily o scraper)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PENDING   │ → Requiere validación (email, URL activa)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ → Visible en búsquedas
└──────┬──────┘
       │
       ├──→ URL caída ──→ INACTIVE
       │
       └──→ Proveedor reclama ──→ CLAIMED
```

---

## 🛠️ UTILIDADES

### **Crear slug desde nombre y ciudad**
```javascript
function createSlug(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s-]/g, '')         // Solo letras, números, espacios, guiones
    .replace(/\s+/g, '-')             // Espacios → guiones
    .replace(/-+/g, '-')              // Múltiples guiones → uno
    .trim();
}

// Ejemplo:
createSlug("Alfonso Calza", "Valencia") 
// → "alfonso-calza-valencia"
```

### **Calcular matchScore**
```javascript
function calculateMatchScore(supplier, searchQuery) {
  let score = 50; // Base
  
  // +10 si tiene rating alto
  if (supplier.metrics.rating >= 4.5) score += 10;
  
  // +10 si tiene muchas conversiones
  if (supplier.metrics.conversions > 20) score += 10;
  
  // +10 si email verificado
  if (supplier.contact.emailVerified) score += 10;
  
  // +5 si tiene portfolio
  if (supplier.media?.portfolio?.length > 0) score += 5;
  
  // +15 si coincide con keywords de búsqueda
  const keywords = searchQuery.toLowerCase().split(' ');
  const text = `${supplier.name} ${supplier.business?.description} ${supplier.tags?.join(' ')}`.toLowerCase();
  const matches = keywords.filter(k => text.includes(k)).length;
  score += Math.min(matches * 5, 15);
  
  return Math.min(score, 100);
}
```

---

## 📚 SIGUIENTE PASO

Lee: **[Cron Jobs](./CRON-JOBS.md)** para entender cómo se actualizan automáticamente los proveedores.
