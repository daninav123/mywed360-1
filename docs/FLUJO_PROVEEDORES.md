# 🎯 Flujo Completo de Gestión de Proveedores

## 📋 **Journey del Usuario**

```
1. BÚSQUEDA
   ↓
2. FAVORITOS ⭐
   ↓
3. CONTACTO 📧
   ↓
4. COMPARAR PRESUPUESTOS 🤖
   ↓
5. ASIGNAR A SERVICIO ✅
   ↓
6. CONFIRMADO 🎉
```

---

## 🗄️ **ESTRUCTURA DE DATOS**

### **1. Colección: `favorites`**

```javascript
// Ruta: users/{userId}/favorites/{supplierId}
{
  supplierId: "abc123",
  supplierName: "Fotógrafo Pro",
  category: "fotografia",
  addedAt: Timestamp,

  // Datos del proveedor (snapshot)
  supplier: {
    name: "Fotógrafo Pro",
    category: "fotografia",
    contact: { ... },
    location: { ... },
    rating: 4.5,
    images: [...]
  },

  // Notas del usuario
  notes: "Me gustó su portfolio",
  tags: ["portfolio-excelente", "precio-razonable"]
}
```

### **2. Colección: `contact_requests`**

```javascript
// Ruta: users/{userId}/weddings/{weddingId}/contact_requests/{requestId}
{
  supplierId: "abc123",
  supplierName: "Fotógrafo Pro",
  category: "fotografia",

  // Estado
  status: "pending", // pending, responded, ignored
  sentAt: Timestamp,
  respondedAt: Timestamp | null,

  // Mensaje enviado
  message: "Hola, me interesa...",
  weddingDate: "2025-06-15",
  location: "Valencia",
  guests: 150,

  // Respuesta del proveedor
  response: {
    message: "Gracias por contactar...",
    estimatedPrice: 1500,
    availability: true,
    respondedAt: Timestamp
  } | null
}
```

### **3. Colección: `budgets`**

```javascript
// Ruta: users/{userId}/weddings/{weddingId}/budgets/{budgetId}
{
  supplierId: "abc123",
  supplierName: "Fotógrafo Pro",
  category: "fotografia",

  // Archivo del presupuesto
  file: {
    url: "gs://...",
    name: "presupuesto-foto.pdf",
    type: "application/pdf",
    uploadedAt: Timestamp
  },

  // Análisis de IA
  aiAnalysis: {
    totalPrice: 1500,
    currency: "EUR",
    items: [
      { description: "Cobertura 8 horas", price: 1000 },
      { description: "Álbum 30x30", price: 300 },
      { description: "Edición avanzada", price: 200 }
    ],
    includes: [
      "8 horas de cobertura",
      "Álbum físico",
      "300+ fotos editadas",
      "Derechos de imagen"
    ],
    notIncludes: [
      "Segunda cámara",
      "Pre-boda"
    ],
    pricePerGuest: 10,
    competitiveness: "good", // excellent, good, average, high
    notes: "Precio competitivo para la zona",
    analyzedAt: Timestamp
  },

  // Estado
  status: "analyzing", // uploading, analyzing, analyzed, error
  uploadedAt: Timestamp,
  analyzedAt: Timestamp | null
}
```

### **4. Colección: `wedding_services` (actualizada)**

```javascript
// Ruta: users/{userId}/weddings/{weddingId}/services/{serviceId}
{
  category: "fotografia",
  name: "Fotografía",
  icon: "camera",

  // ⭐ NUEVO: Proveedor asignado
  assignedSupplier: {
    supplierId: "abc123",
    name: "Fotógrafo Pro",
    contact: {
      email: "info@fotografopro.com",
      phone: "+34 600 123 456"
    },

    // Estado del servicio
    status: "cotizando", // interested, cotizando, contratado, confirmado, pagado

    // Presupuesto seleccionado
    selectedBudgetId: "budget123",
    price: 1500,
    currency: "EUR",

    // Fechas importantes
    assignedAt: Timestamp,
    contractedAt: Timestamp | null,
    confirmedAt: Timestamp | null,
    paidAt: Timestamp | null,

    // Pagos
    payments: [
      {
        amount: 300,
        concept: "Señal",
        date: Timestamp,
        method: "transferencia"
      }
    ],
    totalPaid: 300,
    remaining: 1200,

    // Notas
    notes: "Acordado 10 horas de cobertura"
  } | null,

  // Candidatos (proveedores considerados)
  candidates: [
    {
      supplierId: "abc123",
      name: "Fotógrafo Pro",
      price: 1500,
      rating: 4.5,
      notes: "Primera opción"
    }
  ],

  // Presupuesto estimado
  estimatedBudget: 1500,

  // Prioridad
  priority: "high", // high, medium, low

  // Fechas
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔄 **FLUJO DE ESTADOS**

### **Estado del Servicio:**

```
interested (interesado)
    ↓
cotizando (solicitando presupuestos)
    ↓
contratado (proveedor seleccionado)
    ↓
confirmado (todo acordado)
    ↓
pagado (pagado completamente)
```

---

## 💻 **COMPONENTES A CREAR**

### **1. SupplierCard (mejorado)**

- Botón ⭐ Favoritos
- Botón 📧 Contactar
- Botón ➕ Añadir a servicio
- Botón 📊 Ver presupuesto

### **2. FavoritesList**

- Lista de favoritos del usuario
- Filtros por categoría
- Ordenar por fecha añadido

### **3. ContactModal**

- Formulario de contacto
- Información de la boda (fecha, lugar, invitados)
- Mensaje personalizable

### **4. BudgetComparator**

- Subir presupuestos
- Análisis con IA (OpenAI Vision/GPT-4)
- Comparación lado a lado
- Recomendaciones

### **5. AssignSupplierModal**

- Selector de servicio (ej: Fotografía)
- Confirmar asignación
- Establecer precio
- Añadir notas

### **6. ServiceCard (mejorado)**

- Mostrar proveedor asignado
- Estado visual
- Acciones rápidas (contactar, ver presupuesto)

---

## 🔌 **APIs A CREAR**

### **Backend Endpoints:**

```javascript
// Favoritos
POST   /api/favorites
DELETE /api/favorites/:supplierId
GET    /api/favorites

// Contacto
POST   /api/contact/supplier
GET    /api/contact/requests
PUT    /api/contact/requests/:id/status

// Presupuestos
POST   /api/budgets/upload
POST   /api/budgets/analyze (con IA)
GET    /api/budgets
DELETE /api/budgets/:id

// Servicios
POST   /api/weddings/:weddingId/services/:serviceId/assign
PUT    /api/weddings/:weddingId/services/:serviceId/status
GET    /api/weddings/:weddingId/services
```

---

## 🤖 **INTEGRACIÓN IA (OpenAI)**

### **Análisis de Presupuestos:**

```javascript
// Prompt para GPT-4 Vision
const prompt = `
Analiza este presupuesto de boda y extrae:

1. Precio total
2. Desglose de servicios incluidos
3. Lo que NO incluye
4. Precio por invitado (si aplica)
5. Competitividad del precio (excelente/bueno/promedio/alto)
6. Recomendaciones

Formato JSON:
{
  "totalPrice": number,
  "currency": "EUR",
  "items": [{ "description": string, "price": number }],
  "includes": string[],
  "notIncludes": string[],
  "pricePerGuest": number | null,
  "competitiveness": "excellent" | "good" | "average" | "high",
  "notes": string
}
`;

// Llamada a OpenAI
const analysis = await openai.chat.completions.create({
  model: 'gpt-4-vision-preview',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: budgetImageUrl },
      ],
    },
  ],
});
```

---

## 📱 **UI/UX FLOW**

### **1. Página de Búsqueda**

```
┌─────────────────────────────────┐
│ [Búsqueda] [Filtros]            │
├─────────────────────────────────┤
│ ┌─────────────────────────┐     │
│ │ Proveedor Card          │     │
│ │ ⭐ Favorito  📧 Contactar│     │
│ │ ➕ Añadir  📊 Presupuesto│     │
│ └─────────────────────────┘     │
└─────────────────────────────────┘
```

### **2. Página de Favoritos**

```
┌─────────────────────────────────┐
│ Mis Favoritos ⭐ (12)           │
├─────────────────────────────────┤
│ Filtros: [Fotografía▼] [Todos] │
├─────────────────────────────────┤
│ [Cards de favoritos...]         │
└─────────────────────────────────┘
```

### **3. Comparador de Presupuestos**

```
┌──────────────────────────────────────────┐
│ Comparar Presupuestos 📊                 │
├──────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐         │
│ │ Proveedor A │ │ Proveedor B │         │
│ │ 1500 EUR    │ │ 1800 EUR    │         │
│ │ ✅ Incluye  │ │ ✅ Incluye  │         │
│ │ ❌ No incl. │ │ ✅ Sí incl. │         │
│ └─────────────┘ └─────────────┘         │
│                                          │
│ 🤖 IA Recomienda: Proveedor A           │
│    Mejor precio/calidad                  │
└──────────────────────────────────────────┘
```

### **4. Tarjeta de Servicio (con proveedor)**

```
┌─────────────────────────────────┐
│ 📸 Fotografía                   │
├─────────────────────────────────┤
│ ✅ Fotógrafo Pro                │
│ Estado: Contratado              │
│ Precio: 1500 EUR                │
│                                 │
│ [📧 Contactar] [📊 Presupuesto] │
└─────────────────────────────────┘
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Fase 1: Favoritos** ⭐

- [ ] Modelo de datos Firestore
- [ ] Backend API (POST, DELETE, GET)
- [ ] Hook `useFavorites`
- [ ] Botón en SupplierCard
- [ ] Página de favoritos
- [ ] Tests

### **Fase 2: Contacto** 📧

- [ ] Modelo de datos Firestore
- [ ] Backend API
- [ ] Componente ContactModal
- [ ] Tracking de solicitudes
- [ ] Notificaciones
- [ ] Tests

### **Fase 3: Presupuestos con IA** 🤖

- [ ] Storage para PDFs
- [ ] Backend API upload
- [ ] Integración OpenAI Vision
- [ ] Componente BudgetUploader
- [ ] Componente BudgetComparator
- [ ] Tests

### **Fase 4: Asignar a Servicio** ✅

- [ ] Modelo actualizado wedding_services
- [ ] Backend API assign/unassign
- [ ] Componente AssignSupplierModal
- [ ] ServiceCard actualizado
- [ ] Estados visuales
- [ ] Tests

---

## 🚀 **ORDEN DE IMPLEMENTACIÓN**

1. **Favoritos** (más simple, fundamento)
2. **Contacto** (depende de favoritos)
3. **Asignar a Servicio** (depende de favoritos)
4. **Presupuestos con IA** (más complejo, último)

---

## 📊 **PRIORIDAD**

```
🔥 CRÍTICO:
- Favoritos
- Asignar a servicio

⚡ IMPORTANTE:
- Contacto
- Tracking de proveedores

🎯 DESEABLE:
- Comparador con IA
- Análisis automático

💎 BONUS:
- Recomendaciones personalizadas
- Predicción de precios
```

---

**¿Empezamos con los FAVORITOS (más simple)?** 🎯
