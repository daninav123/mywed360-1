# 🌟 Sistema de Crowdsourcing Inteligente de Opciones Especiales

## 📋 Descripción

Sistema que permite a los usuarios sugerir nuevas opciones especiales para proveedores. La IA valida automáticamente las sugerencias y, si son relevantes, las añade al catálogo global para todos los usuarios.

## 🏗️ Arquitectura

### 1. Estructura de Datos en Firestore

#### Colección: `supplier_option_suggestions`
```javascript
{
  id: "auto-generated",
  category: "fotografia",
  categoryName: "Fotografía",
  optionKey: "slowMotion", // generado por IA o sugerido
  optionLabel: "Vídeo en cámara lenta",
  description: "Captura momentos especiales en slow motion",
  type: "boolean", // boolean, number, select, etc.
  suggestedBy: {
    userId: "uid123",
    userName: "María García",
    email: "maria@example.com"
  },
  status: "pending", // pending, validating, approved, rejected, duplicate
  aiValidation: {
    score: 85, // 0-100
    relevance: "high", // high, medium, low
    duplicate: false,
    duplicateOf: null, // referencia a opción existente si aplica
    reasoning: "Es una característica común y valorada en fotografía...",
    suggestedKey: "slowMotion",
    suggestedLabel: "Vídeo en cámara lenta",
    validatedAt: timestamp
  },
  votes: {
    upvotes: 5,
    downvotes: 1,
    voters: ["uid1", "uid2", ...]
  },
  metadata: {
    createdAt: timestamp,
    updatedAt: timestamp,
    approvedAt: timestamp,
    approvedBy: "system" // o userId del admin
  }
}
```

#### Colección: `supplier_dynamic_specs`
Almacena las opciones aprobadas que se fusionan con el template estático.

```javascript
{
  category: "fotografia",
  dynamicOptions: {
    slowMotion: {
      label: "Vídeo en cámara lenta",
      type: "boolean",
      default: false,
      addedAt: timestamp,
      addedBy: "system",
      usageCount: 145, // cuántos usuarios lo han usado
      originSuggestionId: "suggestion_id"
    }
  },
  lastUpdated: timestamp
}
```

### 2. API Endpoints

#### POST `/api/supplier-options/suggest`
Crear nueva sugerencia
```javascript
{
  category: "fotografia",
  optionLabel: "Vídeo en cámara lenta",
  description: "Para capturar momentos especiales",
  type: "boolean" // opcional, lo infiere IA
}
```

#### POST `/api/supplier-options/vote/:suggestionId`
Votar por una sugerencia
```javascript
{
  vote: "up" | "down"
}
```

#### GET `/api/supplier-options/pending`
Obtener sugerencias pendientes (para admin panel)

#### GET `/api/supplier-options/dynamic/:category`
Obtener opciones dinámicas para una categoría

### 3. Sistema de Validación IA (OpenAI)

**Prompt Template:**
```
Analiza esta sugerencia de opción especial para la categoría {category}:

Opción sugerida: "{optionLabel}"
Descripción: "{description}"
Categoría: {categoryName}

Opciones existentes en esta categoría:
{existingOptions}

Evalúa:
1. Relevancia (0-100): ¿Es útil y relevante para esta categoría?
2. Claridad (0-100): ¿Es clara y fácil de entender?
3. Duplicado: ¿Ya existe una opción similar? Si sí, indica cuál.
4. Tipo de dato: ¿boolean, number, select, text?
5. Sugerencia de key técnica (camelCase)
6. Sugerencia de label mejorada (si aplica)

Responde en JSON:
{
  "score": 85,
  "relevance": "high",
  "clarity": "high",
  "duplicate": false,
  "duplicateOf": null,
  "suggestedType": "boolean",
  "suggestedKey": "slowMotion",
  "suggestedLabel": "Vídeo en cámara lenta",
  "reasoning": "Explicación..."
}
```

### 4. Flujo de Aprobación

```
Usuario sugiere opción
    ↓
Se almacena en Firestore (status: pending)
    ↓
Job automático ejecuta validación IA
    ↓
┌─────────────────┬──────────────────┬─────────────────┐
│   Score > 80    │  Score 60-80     │   Score < 60    │
│   Aprobar auto  │  Review manual   │   Rechazar      │
└─────────────────┴──────────────────┴─────────────────┘
    ↓                   ↓                   ↓
Actualizar           Admin panel        Notificar
dynamic_specs        decisión           rechazo
    ↓
Notificar aprobación
Cache se actualiza
Opción disponible para todos
```

### 5. Integración con Frontend

**SupplierCategorySpecs.jsx:**
- Botón "➕ Sugerir nueva opción"
- Modal de sugerencia
- Muestra opciones dinámicas mezcladas con estáticas

**Hook personalizado:**
```javascript
const { 
  staticOptions, 
  dynamicOptions, 
  allOptions,
  suggestOption,
  isLoading 
} = useSupplierOptions(category);
```

### 6. Jobs Automatizados

#### Job: `processOptionSuggestions`
- Frecuencia: Cada 15 minutos
- Busca sugerencias con status "pending"
- Ejecuta validación IA
- Actualiza status según score
- Notifica a usuarios

#### Job: `cleanupRejectedSuggestions`
- Frecuencia: Diaria
- Elimina sugerencias rechazadas > 30 días

## 🔒 Seguridad

- Rate limiting: Max 3 sugerencias por usuario/día
- Verificación de autenticación
- Validación de categorías existentes
- Sanitización de inputs

## 📊 Métricas

- Total sugerencias recibidas
- Tasa de aprobación automática
- Opciones más populares (por usageCount)
- Usuarios más activos sugiriendo

## 🎯 Beneficios

1. **Escalabilidad**: El catálogo crece con las necesidades reales
2. **Calidad**: IA filtra sugerencias irrelevantes
3. **Comunidad**: Usuarios se sienten escuchados
4. **Eficiencia**: Reduce trabajo manual de product management
5. **Datos**: Insights sobre qué opciones valoran los usuarios

## 🚀 Fases de Implementación

### Fase 1: MVP (Actual)
- ✅ Estructura Firestore
- ✅ API endpoints básicos
- ✅ Validación IA
- ✅ Auto-aprobación
- ✅ UI básica de sugerencias

### Fase 2: Mejoras
- Sistema de votación
- Estadísticas en admin panel
- Notificaciones push
- Gamificación (badges para usuarios activos)

### Fase 3: Avanzado
- Machine learning para mejorar precisión
- A/B testing de nuevas opciones
- Sugerencias contextuales basadas en comportamiento
- Internacionalización de opciones
