# 📊 Sistema de Comparación y Análisis de Presupuestos

## 🎯 Objetivo

Permitir que los usuarios:

1. **Reciban** respuestas de presupuesto de múltiples proveedores
2. **Comparen** presupuestos lado a lado
3. **Analicen** automáticamente cuál es mejor según criterios objetivos
4. **Seleccionen** y contraten el proveedor ideal

---

## 🗂️ Estructura de Datos

### **1. Quote Request (Existente - Ampliado)**

```javascript
// Firestore: suppliers/{supplierId}/quote-requests/{requestId}
{
  // ... datos existentes de solicitud ...

  // NUEVO: Respuestas del proveedor
  quotes: [
    {
      quoteId: "quote_001",
      version: 1,
      status: "active", // active, superseded, rejected

      // Precio
      pricing: {
        subtotal: 2500,
        taxes: 525,
        discount: 100,
        total: 2925,
        currency: "EUR",
        validUntil: "2025-02-15T00:00:00.000Z"
      },

      // Detalles del servicio ofrecido
      serviceOffered: {
        // Campos dinámicos según categoría
        horasCobertura: "10",
        album: true,
        tipoAlbum: "premium",
        fotosDigitales: "todas",
        segundoFotografo: true,
        sesionCompromiso: true,
        estilo: "natural",

        // Extras incluidos
        extras: [
          "Pendrive USB personalizado",
          "Galería online privada 2 años",
          "Impresión 20x30cm regalo"
        ]
      },

      // Condiciones
      terms: {
        deposit: 30, // % adelanto
        paymentTerms: "30% adelanto, 40% día boda, 30% entrega",
        cancellationPolicy: "Reembolso 100% hasta 60 días antes",
        deliveryTime: "45 días laborables",
        warranty: "Garantía de satisfacción 100%"
      },

      // Archivos adjuntos
      attachments: [
        {
          name: "Portafolio_2024.pdf",
          url: "https://...",
          type: "pdf",
          size: 2048576
        }
      ],

      // Nota del proveedor
      message: "Encantado de ser parte de tu día especial...",

      // Metadata
      createdAt: Timestamp,
      updatedAt: Timestamp,
      createdBy: "supplier_user_id"
    }
  ],

  // NUEVO: Análisis del usuario
  userAnalysis: {
    favorites: ["quote_001", "quote_003"],
    notes: {
      "quote_001": "Me gusta el estilo, buen precio",
      "quote_002": "Muy caro para lo que ofrece"
    },
    selectedQuote: "quote_001",
    selectedAt: Timestamp
  }
}
```

### **2. Quote Comparisons (Nueva colección)**

```javascript
// Firestore: users/{userId}/weddings/{weddingId}/quote-comparisons/{comparisonId}
{
  category: "fotografia",
  categoryName: "Fotografía",

  // IDs de las solicitudes a comparar
  quoteRequests: [
    {
      requestId: "req_001",
      supplierId: "sup_abc",
      supplierName: "Studio Foto Pro",
      quoteId: "quote_001" // El presupuesto específico a comparar
    },
    {
      requestId: "req_002",
      supplierId: "sup_xyz",
      supplierName: "Foto Arte",
      quoteId: "quote_001"
    }
  ],

  // Análisis automático
  autoAnalysis: {
    bestPrice: "req_001",
    bestValue: "req_002",
    mostComplete: "req_002",
    recommended: "req_002",
    scores: {
      "req_001": { total: 85, price: 90, service: 80, terms: 85 },
      "req_002": { total: 92, price: 85, service: 95, terms: 95 }
    }
  },

  // Criterios de comparación del usuario
  userPreferences: {
    priceWeight: 40, // %
    serviceWeight: 40,
    termsWeight: 20
  },

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🎨 Componentes a Implementar

### **1. SupplierQuoteResponseForm.jsx**

Formulario para que el proveedor responda con su presupuesto.

```jsx
<SupplierQuoteResponseForm quoteRequest={request} onSubmit={handleSubmit} />
```

**Features:**

- ✅ Campos según template de la categoría
- ✅ Editor de precio con breakdown (subtotal, IVA, descuento)
- ✅ Editor de condiciones
- ✅ Upload de archivos adjuntos
- ✅ Vista previa antes de enviar
- ✅ Opción de guardar borrador

### **2. QuoteComparator.jsx**

Comparador visual de múltiples presupuestos lado a lado.

```jsx
<QuoteComparator quotes={receivedQuotes} onSelect={handleSelect} onAnalyze={handleAnalyze} />
```

**Features:**

- ✅ Vista tabla comparativa
- ✅ Resaltado de diferencias
- ✅ Scoring visual con estrellas/barras
- ✅ Filtros y ordenación
- ✅ Modo compacto/expandido
- ✅ Export a PDF

### **3. QuoteAnalyzer.jsx**

Análisis inteligente automático de presupuestos.

```jsx
<QuoteAnalyzer quotes={quotes} userPreferences={preferences} />
```

**Features:**

- ✅ Scoring automático por criterios
- ✅ Recomendación basada en IA
- ✅ Pros y contras de cada opción
- ✅ Alertas de banderas rojas
- ✅ Insights personalizados

### **4. QuoteDetailModal.jsx**

Vista detallada de un presupuesto individual.

```jsx
<QuoteDetailModal quote={selectedQuote} onClose={handleClose} onAccept={handleAccept} />
```

**Features:**

- ✅ Desglose completo de precio
- ✅ Listado de servicios incluidos/excluidos
- ✅ Condiciones destacadas
- ✅ Adjuntos descargables
- ✅ Botones de acción (Aceptar, Rechazar, Negociar)

### **5. QuoteSelectionPanel.jsx**

Panel de selección y contratación final.

```jsx
<QuoteSelectionPanel selectedQuote={quote} onConfirm={handleConfirm} />
```

**Features:**

- ✅ Resumen del proveedor seleccionado
- ✅ Confirmación de términos
- ✅ Firma digital (opcional)
- ✅ Pago de adelanto
- ✅ Generación de contrato

---

## 🤖 Sistema de Scoring Automático

### **Criterios de Evaluación:**

```javascript
function calculateQuoteScore(quote, request, userPreferences) {
  const scores = {
    price: calculatePriceScore(quote, request),
    service: calculateServiceScore(quote, request),
    terms: calculateTermsScore(quote),
    reputation: calculateReputationScore(quote.supplier),
  };

  // Weighted average según preferencias del usuario
  const weights = userPreferences || {
    price: 30,
    service: 40,
    terms: 20,
    reputation: 10,
  };

  const totalScore =
    (scores.price * weights.price +
      scores.service * weights.service +
      scores.terms * weights.terms +
      scores.reputation * weights.reputation) /
    100;

  return {
    total: Math.round(totalScore),
    breakdown: scores,
    rating: scoreToRating(totalScore),
  };
}

// 1. Score de Precio (0-100)
function calculatePriceScore(quote, request) {
  const userBudget = request.weddingInfo.presupuestoTotal;
  const categoryBudget = userBudget * getCategoryPercentage(quote.category);
  const quotePrice = quote.pricing.total;

  // Fórmula: Mejor score si está dentro del presupuesto y es competitivo
  if (quotePrice <= categoryBudget * 0.8) return 100; // Excelente precio
  if (quotePrice <= categoryBudget) return 85; // Dentro de presupuesto
  if (quotePrice <= categoryBudget * 1.2) return 60; // 20% sobre presupuesto
  return 30; // Muy por encima
}

// 2. Score de Servicio (0-100)
function calculateServiceScore(quote, request) {
  let score = 50; // Base

  // Comparar lo solicitado vs lo ofrecido
  const requestedFields = request.serviceDetails;
  const offeredFields = quote.serviceOffered;

  Object.keys(requestedFields).forEach((key) => {
    if (offeredFields[key] === requestedFields[key]) {
      score += 5; // Match exacto
    }
  });

  // Extras añaden puntos
  const extrasCount = quote.serviceOffered.extras?.length || 0;
  score += Math.min(extrasCount * 3, 20);

  return Math.min(score, 100);
}

// 3. Score de Condiciones (0-100)
function calculateTermsScore(quote) {
  let score = 50;

  // Adelanto bajo es mejor
  if (quote.terms.deposit <= 20) score += 15;
  else if (quote.terms.deposit <= 30) score += 10;
  else if (quote.terms.deposit <= 50) score += 5;

  // Política de cancelación flexible es mejor
  if (quote.terms.cancellationPolicy.includes('Reembolso 100%')) score += 15;
  else if (quote.terms.cancellationPolicy.includes('Reembolso')) score += 10;

  // Tiempo de entrega rápido es mejor
  const deliveryDays = parseInt(quote.terms.deliveryTime);
  if (deliveryDays <= 30) score += 10;
  else if (deliveryDays <= 60) score += 5;

  // Garantía es un plus
  if (quote.terms.warranty) score += 10;

  return Math.min(score, 100);
}

// 4. Score de Reputación (0-100)
function calculateReputationScore(supplier) {
  const rating = supplier.rating || 0;
  const reviewCount = supplier.reviewCount || 0;

  let score = (rating / 5) * 80; // Rating base

  // Bonus por cantidad de reseñas
  if (reviewCount >= 50) score += 20;
  else if (reviewCount >= 20) score += 15;
  else if (reviewCount >= 10) score += 10;
  else if (reviewCount >= 5) score += 5;

  return Math.round(Math.min(score, 100));
}

function scoreToRating(score) {
  if (score >= 90) return { stars: 5, label: 'Excelente' };
  if (score >= 80) return { stars: 4.5, label: 'Muy bueno' };
  if (score >= 70) return { stars: 4, label: 'Bueno' };
  if (score >= 60) return { stars: 3.5, label: 'Aceptable' };
  return { stars: 3, label: 'Regular' };
}
```

---

## 🎯 Flujo Completo

```
1. Usuario solicita presupuesto
   └─> RequestQuoteModal ✅ (Ya implementado)

2. Proveedor recibe notificación
   └─> Email + Dashboard de proveedor

3. Proveedor responde con presupuesto
   └─> SupplierQuoteResponseForm (NUEVO)
   └─> Guarda en quotes[] del request

4. Usuario recibe notificación
   └─> Email + Notificación en app

5. Usuario ve presupuestos recibidos
   └─> QuoteRequestsTracker ✅ (Ya implementado)
   └─> Muestra badge "X presupuestos recibidos"

6. Usuario compara presupuestos
   └─> Click en "Comparar presupuestos"
   └─> QuoteComparator (NUEVO)
   └─> Vista lado a lado

7. Sistema analiza automáticamente
   └─> QuoteAnalyzer (NUEVO)
   └─> Muestra scoring y recomendación

8. Usuario selecciona presupuesto
   └─> QuoteSelectionPanel (NUEVO)
   └─> Confirma selección

9. Contratación y pago
   └─> Generación de contrato
   └─> Pago de adelanto (Stripe)
   └─> Notificación a proveedor
```

---

## 📊 UI del Comparador

### **Vista Desktop:**

```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Comparador de Presupuestos - Fotografía                    │
│                                                                 │
│ Comparando 3 presupuestos                    [⚙️ Preferencias] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│         Studio Foto Pro    Foto Arte     Visual Dreams         │
│         ⭐⭐⭐⭐⭐ (92)      ⭐⭐⭐⭐½ (87)    ⭐⭐⭐⭐ (82)        │
│         ✅ RECOMENDADO                                          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💰 PRECIO                                                   │ │
│ │  2.500€              2.800€             2.200€              │ │
│ │  [██████████] 90     [████████] 80      [███████████] 95   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 📸 SERVICIO                                                 │ │
│ │  • 10 horas          • 8 horas           • 8 horas         │ │
│ │  • Álbum premium     • Álbum básico      • Álbum premium   │ │
│ │  • 2 fotógrafos      • 1 fotógrafo       • 1 fotógrafo     │ │
│ │  • Sesión pareja ✅  • Sesión pareja ❌   • Sesión pareja ✅│ │
│ │  [███████████] 95    [████████] 78       [█████████] 85    │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 📋 CONDICIONES                                              │ │
│ │  Adelanto: 30%       Adelanto: 50%       Adelanto: 40%     │ │
│ │  Entrega: 30 días    Entrega: 45 días    Entrega: 60 días │ │
│ │  Cancel: Flex ✅     Cancel: Estricta ❌  Cancel: Media ⚠️ │ │
│ │  [██████████] 88     [██████] 62         [████████] 75     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Ver detalles]     [Ver detalles]      [Ver detalles]        │
│  [✅ Seleccionar]   [ Descartar ]       [ Negociar ]           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🤖 Análisis Automático                                         │
├────────────────────────────────────────────────────────────────┤
│ Basándome en tu presupuesto de 25.000€ y tus preferencias:    │
│                                                                 │
│ ✅ RECOMENDACIÓN: Studio Foto Pro                              │
│                                                                 │
│ ✨ Mejor relación calidad-precio                               │
│ ✅ Incluye todo lo que solicitaste                             │
│ ✅ Excelentes condiciones de pago                              │
│ ✅ Entrega más rápida (30 días)                                │
│ ⚠️ 200€ por encima del promedio (justificado por 2º fotógrafo)│
│                                                                 │
│ 💡 Consejo: Si tu prioridad es ahorrar, Visual Dreams es      │
│    300€ más barato, pero tendrás solo 1 fotógrafo.            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### **Paso 1: Backend - Responder Presupuesto**

```javascript
// backend/routes/supplier-quote-requests.js

router.post(
  '/:supplierId/quote-requests/:requestId/quotes',
  requireSupplierAuth,
  async (req, res) => {
    const { supplierId, requestId } = req.params;
    const { pricing, serviceOffered, terms, message, attachments } = req.body;

    // Validar que el proveedor puede responder a este request
    // Crear nuevo quote
    // Notificar al usuario

    const quoteId = `quote_${Date.now()}`;

    const quote = {
      quoteId,
      version: 1,
      status: 'active',
      pricing,
      serviceOffered,
      terms,
      message,
      attachments: attachments || [],
      createdAt: FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    await requestRef.update({
      quotes: FieldValue.arrayUnion(quote),
      status: 'quoted',
      respondedAt: FieldValue.serverTimestamp(),
    });

    // Enviar notificación al usuario
    await sendQuoteReceivedNotification(request.userId, quote);

    return res.json({ success: true, quoteId });
  }
);
```

### **Paso 2: Frontend - Comparador**

```javascript
// src/components/suppliers/QuoteComparator.jsx

export default function QuoteComparator({ quotes, onSelect }) {
  const [sortBy, setSortBy] = useState('score'); // score, price, rating
  const [showAnalysis, setShowAnalysis] = useState(true);

  // Calcular scores
  const quotesWithScores = quotes.map((quote) => ({
    ...quote,
    scores: calculateQuoteScore(quote, request, userPreferences),
  }));

  // Ordenar
  const sortedQuotes = sortQuotes(quotesWithScores, sortBy);

  // Identificar mejor opción
  const recommended = sortedQuotes[0];

  return (
    <div className="quote-comparator">
      {/* Header con filtros */}
      <ComparisonHeader count={quotes.length} sortBy={sortBy} onSortChange={setSortBy} />

      {/* Tabla comparativa */}
      <ComparisonTable quotes={sortedQuotes} recommended={recommended} onSelect={onSelect} />

      {/* Análisis automático */}
      {showAnalysis && <AutoAnalysisPanel quotes={sortedQuotes} recommended={recommended} />}
    </div>
  );
}
```

---

## 📈 Próximos Pasos

1. ✅ **Implementar formulario de respuesta del proveedor**
2. ✅ **Crear comparador visual**
3. ✅ **Sistema de scoring automático**
4. ✅ **Panel de análisis con IA**
5. ✅ **Integración con sistema de pagos**
6. ✅ **Generación de contratos**

---

**Tiempo estimado:** 8-10 horas de desarrollo  
**Complejidad:** Media-Alta  
**Valor para el usuario:** ⭐⭐⭐⭐⭐ (Muy alto)
