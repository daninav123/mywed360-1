# Editor de Diseños Tipo Canva - Especificación Técnica

## 🎯 Objetivo
Crear un editor visual unificado donde los usuarios puedan diseñar todo su material imprimible (invitaciones, menús, señalética, etc.) con una experiencia fluida y asistencia de IA.

## 🏗️ Arquitectura

### Componentes Principales

```
/apps/main-app/src/pages/disenos-editor/
├── DesignEditor.jsx              # Componente principal
├── components/
│   ├── Canvas/
│   │   ├── FabricCanvas.jsx      # Wrapper de Fabric.js
│   │   ├── CanvasToolbar.jsx     # Zoom, undo, redo, grid
│   │   └── CanvasRulers.jsx      # Reglas y guías
│   ├── Sidebar/
│   │   ├── TemplatesPanel.jsx    # Plantillas predefinidas
│   │   ├── ElementsPanel.jsx     # Biblioteca de elementos
│   │   ├── TextPanel.jsx         # Herramientas de texto
│   │   ├── ShapesPanel.jsx       # Formas básicas
│   │   ├── IllustrationsPanel.jsx # SVGs decorativos
│   │   ├── PhotosPanel.jsx       # Subir/gestionar fotos
│   │   └── UploadsPanel.jsx      # Assets del usuario
│   ├── PropertiesPanel/
│   │   ├── ElementProperties.jsx # Props del elemento seleccionado
│   │   ├── LayersPanel.jsx       # Gestión de capas
│   │   ├── ColorPicker.jsx       # Selector de colores
│   │   └── ExportPanel.jsx       # Opciones de exportación
│   └── AIAssistant/
│       ├── AIFloatingButton.jsx  # Botón flotante de IA
│       ├── AIPromptModal.jsx     # Interface para prompts
│       ├── AISuggestions.jsx     # Sugerencias contextuales
│       └── AIVariations.jsx      # Generador de variaciones
├── hooks/
│   ├── useCanvas.js              # Estado del canvas
│   ├── useDesignAssets.js        # Carga de assets
│   ├── useAIComposition.js       # Integración IA
│   └── useExport.js              # Exportación PDF/SVG
└── utils/
    ├── fabricHelpers.js          # Utilidades Fabric.js
    ├── svgProcessor.js           # Procesamiento SVG
    ├── exportEngine.js           # Motor de exportación
    └── aiComposer.js             # Lógica de composición IA
```

## 📦 Dependencias Nuevas

```json
{
  "fabric": "^5.3.0",
  "jspdf": "^2.5.1",
  "svg2pdf.js": "^2.2.3",
  "pdfkit": "^0.14.0",
  "svgo": "^3.0.2",
  "html2canvas": "^1.4.1",
  "file-saver": "^2.0.5"
}
```

## 🗄️ Estructura de Datos

### Design Document (Firestore)

```javascript
weddings/{weddingId}/designs/{designId}
{
  id: string,
  name: string,
  type: 'invitation' | 'menu' | 'signage' | 'program' | 'tag' | 'other',
  
  // Canvas state
  canvas: {
    width: 1050,  // A5 @ 300 DPI = 1050x1485px
    height: 1485,
    backgroundColor: '#ffffff',
    objects: [
      {
        type: 'text' | 'image' | 'path' | 'group',
        id: string,
        ...fabricJSONObject
      }
    ]
  },
  
  // Metadata
  style: {
    theme: 'minimal' | 'rustic' | 'elegant' | 'modern' | 'vintage',
    colorPalette: ['#xxx', '#yyy', '#zzz'],
    fonts: ['font-family-1', 'font-family-2']
  },
  
  // Assets usados
  assets: [
    {
      id: string,
      type: 'svg' | 'image',
      sourceUrl: string,
      position: { x, y, width, height, angle, scaleX, scaleY }
    }
  ],
  
  // Exportación
  exports: {
    pdf: 'gs://...',
    svg: 'gs://...',
    png: 'gs://...',
    printReady: boolean
  },
  
  // Estado
  status: 'draft' | 'final' | 'ordered',
  version: number,
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: userId
}
```

### Asset Library (Firestore)

```javascript
designAssets/{assetId}
{
  id: string,
  name: string,
  type: 'icon' | 'illustration' | 'shape' | 'pattern' | 'frame' | 'divider',
  
  category: string[],  // ['floral', 'wedding', 'decorative']
  tags: string[],      // ['flower', 'rose', 'romantic', 'corner']
  
  // SVG data
  svgUrl: string,      // Firebase Storage URL
  svgData: string,     // Raw SVG para inserción rápida
  thumbnail: string,   // Preview URL
  
  // Características para IA
  aiMetadata: {
    style: 'outlined' | 'filled' | 'sketch' | 'watercolor',
    complexity: 'simple' | 'medium' | 'complex',
    dominantColors: ['#xxx', '#yyy'],
    mood: ['romantic', 'elegant', 'playful'],
    usageContext: ['invitation', 'menu', 'signage'],
    aiCompatible: true
  },
  
  // Metadatos técnicos
  dimensions: { width, height },
  fileSize: number,
  printQuality: 300,  // DPI
  
  // Control
  premium: boolean,
  featured: boolean,
  downloads: number,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🤖 Sistema de IA

### Endpoints del Backend

```javascript
// POST /api/ai/compose-design
{
  type: 'invitation',
  style: 'minimal',
  content: {
    names: 'Ana & Carlos',
    date: '2025-06-15',
    location: 'Finca El Olivo',
    time: '18:00'
  },
  preferences: {
    colorScheme: ['#8B7355', '#E8DCC4'],
    includeElements: ['floral', 'frame'],
    layout: 'balanced'
  }
}

// Response: Canvas JSON con elementos posicionados

// POST /api/ai/suggest-improvements
{
  canvasJSON: {...},
  context: 'user editing invitation'
}

// Response: Array de sugerencias

// POST /api/ai/generate-variations
{
  baseDesign: {...},
  variationType: 'colorScheme' | 'layout' | 'typography'
}

// Response: Array de variaciones
```

### Lógica de Composición IA

```javascript
// Reglas de composición
const compositionRules = {
  invitation: {
    structure: [
      { zone: 'header', height: 0.25, elements: ['decoration', 'logo'] },
      { zone: 'main', height: 0.50, elements: ['names', 'date', 'location'] },
      { zone: 'footer', height: 0.25, elements: ['decoration', 'rsvp'] }
    ],
    typography: {
      hierarchy: ['names', 'date', 'location', 'details'],
      sizes: [48, 32, 24, 16],
      spacing: 1.5
    },
    balance: {
      margins: 60,  // px at 300 DPI
      symmetry: true,
      whitespace: 'generous'
    }
  },
  menu: {
    // ...
  },
  signage: {
    // ...
  }
};

// IA selecciona assets según:
function selectAssets(prompt, style, assets) {
  // 1. Filtrar por tags relevantes
  // 2. Scoring por mood/style match
  // 3. Balance de complejidad
  // 4. Coherencia de color
  // 5. Retornar top N assets
}

// Posicionamiento inteligente
function intelligentLayout(elements, canvas, rules) {
  // 1. Calcular zonas según rules
  // 2. Aplicar grid invisible
  // 3. Balance visual (peso visual de elementos)
  // 4. Alineación y espaciado
  // 5. Validar legibilidad
  return positionedElements;
}
```

## 🎨 Funcionalidades del Editor

### Básicas
- ✅ Arrastrar y soltar elementos desde sidebar
- ✅ Redimensionar, rotar, mover elementos
- ✅ Capas (reordenar z-index)
- ✅ Undo/Redo (hasta 50 pasos)
- ✅ Zoom (25% - 400%)
- ✅ Grid y guías magnéticas
- ✅ Alineación inteligente
- ✅ Duplicar elementos
- ✅ Agrupar/Desagrupar
- ✅ Bloquear elementos

### Texto
- ✅ Fuentes de Google Fonts
- ✅ Tamaño, color, alineación
- ✅ Tracking (espaciado entre letras)
- ✅ Leading (espaciado entre líneas)
- ✅ Efectos: outline, shadow
- ✅ Texto en curva/path

### Elementos Vectoriales
- ✅ Cambiar colores de SVG
- ✅ Escalar sin pérdida de calidad
- ✅ Aplicar filtros
- ✅ Combinar formas

### Fotos
- ✅ Upload desde dispositivo
- ✅ Crop y ajustes básicos
- ✅ Máscaras (circular, formas)
- ✅ Filtros y efectos

### Exportación
- ✅ PDF alta resolución (300 DPI)
- ✅ SVG editable
- ✅ PNG transparente
- ✅ Especificaciones de imprenta (sangrado, marcas de corte)

## 🚀 Roadmap de Implementación

### Fase 1: Core Editor (Semana 1-2)
- [ ] Setup Fabric.js canvas
- [ ] Sidebar con tabs básicas
- [ ] Panel de propiedades
- [ ] Herramientas básicas (select, move, resize, delete)
- [ ] Undo/Redo
- [ ] Save/Load de diseños

### Fase 2: Biblioteca de Assets (Semana 3)
- [ ] Colección Firestore de assets
- [ ] Seed inicial con 100+ elementos SVG
- [ ] Sistema de búsqueda y filtrado
- [ ] Drag & drop desde biblioteca
- [ ] Categorización (florals, frames, icons)

### Fase 3: Herramientas Avanzadas (Semana 4)
- [ ] Editor de texto avanzado
- [ ] Gestión de capas
- [ ] Grid y guías
- [ ] Alineación inteligente
- [ ] Grupos y bloqueo

### Fase 4: IA Assistant (Semana 5-6)
- [ ] Composición automática básica
- [ ] Selección inteligente de assets
- [ ] Sugerencias contextuales
- [ ] Generador de variaciones

### Fase 5: Exportación (Semana 7)
- [ ] Export a PDF (jsPDF + svg2pdf.js)
- [ ] Export a SVG optimizado
- [ ] Export a PNG alta calidad
- [ ] Specs de imprenta

### Fase 6: Templates & Polish (Semana 8)
- [ ] 20+ plantillas prediseñadas
- [ ] Onboarding tutorial
- [ ] Atajos de teclado
- [ ] Performance optimizations

## 📊 Métricas de Éxito

- **Performance**: Canvas fluido a 60 FPS
- **Carga inicial**: < 3 segundos
- **Biblioteca assets**: 500+ elementos al lanzamiento
- **Calidad export**: 300 DPI mínimo
- **UX**: Usuario puede crear invitación básica en < 5 minutos

## 🔐 Consideraciones

### Seguridad
- Assets solo accesibles por usuarios autenticados
- Rate limiting en endpoints IA
- Validación de uploads (SVG sanitization)

### Escalabilidad
- Assets servidos desde CDN
- Canvas state en IndexedDB (backup local)
- Lazy loading de assets
- Pagination de biblioteca

### Costes
- OpenAI: ~$0.01 por composición
- Storage: ~$0.02/GB/mes
- CDN: ~$0.08/GB transferred

## 🎓 Fuentes de Assets SVG

### Gratuitas
- [Heroicons](https://heroicons.com/)
- [Lucide Icons](https://lucide.dev/)
- [Noun Project](https://thenounproject.com/) (algunos free)
- [Undraw](https://undraw.co/) (ilustraciones)
- [FreePik](https://www.freepik.com/) (con atribución)

### Premium (considerar)
- [Creative Market](https://creativemarket.com/)
- [Design Cuts](https://www.designcuts.com/)
- [Envato Elements](https://elements.envato.com/)

## 🔄 Migración desde Sistema Actual

1. Mantener páginas actuales como "Legacy"
2. Nuevo editor en `/disenos-nuevo` durante beta
3. Migración automática de diseños guardados
4. Switch completo cuando estable

---

**Próximo paso**: Implementar FabricCanvas base + estructura de componentes
