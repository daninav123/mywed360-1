# Editor de Diseños Tipo Canva

## 🎨 Visión General

Editor visual profesional para crear material imprimible de bodas (invitaciones, menús, señalética, etc.) con asistencia de IA y biblioteca de elementos vectoriales de alta calidad.

## 📁 Estructura del Proyecto

```
design-editor/
├── DesignEditor.jsx              # Componente principal
├── components/
│   ├── Canvas/
│   │   ├── FabricCanvas.jsx      # Canvas basado en Fabric.js
│   │   └── CanvasToolbar.jsx     # Herramientas de zoom y visualización
│   ├── Sidebar/
│   │   ├── Sidebar.jsx           # Container de paneles laterales
│   │   ├── TemplatesPanel.jsx    # Plantillas predefinidas
│   │   ├── TextPanel.jsx         # Herramientas de texto
│   │   ├── ShapesPanel.jsx       # Formas geométricas
│   │   ├── IllustrationsPanel.jsx # Elementos vectoriales
│   │   ├── PhotosPanel.jsx       # Gestión de fotos
│   │   └── UploadsPanel.jsx      # Assets subidos por usuario
│   ├── PropertiesPanel/
│   │   ├── PropertiesPanel.jsx   # Container de propiedades
│   │   ├── ElementProperties.jsx # Propiedades del elemento
│   │   └── LayersPanel.jsx       # Gestión de capas
│   └── AIAssistant/
│       └── AIAssistant.jsx       # Asistente IA para composición
├── hooks/
│   ├── useCanvas.js              # Gestión del estado del canvas
│   └── useDesignAssets.js        # Carga de assets desde Firestore
└── README.md                     # Este archivo
```

## 🚀 Uso Básico

### Acceso
```
/editor-disenos
```

### Funcionalidades Principales

#### 1. **Canvas de Trabajo**
- Lienzo de 1050x1485px (A5 @ 300 DPI)
- Zoom 25%-400%
- Grid y reglas opcionales
- Undo/Redo (50 pasos)

#### 2. **Sidebar - Elementos**
- **Plantillas**: Diseños predefinidos
- **Texto**: Estilos de texto predefinidos
- **Formas**: Círculos, rectángulos, etc.
- **Ilustraciones**: Elementos vectoriales (flores, marcos, iconos)
- **Fotos**: Subida de imágenes
- **Uploads**: Gestión de assets propios

#### 3. **Panel de Propiedades**
- Propiedades del elemento seleccionado
- Color, fuente, tamaño, opacidad, rotación
- Gestión de capas (z-index)
- Visibilidad y bloqueo

#### 4. **Asistente IA**
- Composición automática de diseños
- Mejoras sugeridas
- Generación de variaciones
- Paletas de colores

#### 5. **Exportación**
- PDF alta resolución (300 DPI)
- SVG editable
- PNG transparente

## 🛠️ Tecnologías

### Core
- **React 18** - Framework UI
- **Fabric.js 5.3** - Manipulación canvas/SVG
- **Lucide React** - Iconos

### Exportación
- **jsPDF** - Generación PDF
- **svg2pdf.js** - Conversión SVG a PDF
- **file-saver** - Descarga de archivos

### Backend
- **Firebase Firestore** - Base de datos de diseños y assets
- **Firebase Storage** - Almacenamiento de imágenes

## 📊 Estructura de Datos

### Design Document (Firestore)
```javascript
weddings/{weddingId}/designs/{designId}
{
  canvas: {
    width: 1050,
    height: 1485,
    backgroundColor: '#ffffff',
    objects: [...] // Objetos Fabric.js
  },
  style: {
    theme: 'minimal',
    colorPalette: ['#8B7355', '#E8DCC4'],
    fonts: ['Playfair Display', 'Lato']
  },
  status: 'draft',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Asset Document (Firestore)
```javascript
designAssets/{assetId}
{
  name: 'Floral Corner',
  type: 'illustration',
  category: 'florals',
  tags: ['flower', 'corner', 'decorative'],
  svgUrl: 'gs://...',
  thumbnail: 'https://...',
  aiMetadata: {
    style: 'outlined',
    complexity: 'medium',
    dominantColors: ['#xxx'],
    aiCompatible: true
  },
  premium: false
}
```

## 🎯 Casos de Uso

### 1. Crear Invitación desde Cero
```javascript
// Usuario selecciona plantilla
// → IA compone diseño con datos de perfil
// → Usuario edita colores y texto
// → Exporta a PDF
```

### 2. Diseñar Menú Personalizado
```javascript
// Usuario añade texto manualmente
// → Añade ilustraciones florales desde biblioteca
// → Ajusta espaciado y alineación
// → Guarda para imprimir
```

### 3. Crear Set Completo
```javascript
// IA genera diseño base
// → Usuario genera variaciones
// → Aplica mismo estilo a invitación, menú, señalética
// → Exporta todo el set
```

## 🔧 API del Canvas (useImperativeHandle)

### Métodos Disponibles

```javascript
const canvasRef = useRef();

// Añadir elemento
canvasRef.current.addElement({
  type: 'text',
  text: 'Hola',
  fontSize: 32,
  fontFamily: 'Arial',
  fill: '#000000'
});

// Eliminar seleccionado
canvasRef.current.deleteSelected();

// Obtener JSON
const json = canvasRef.current.getJSON();

// Cargar JSON
canvasRef.current.loadJSON(json);

// Exportar
const png = canvasRef.current.exportToPNG();
const svg = canvasRef.current.exportToSVG();

// Zoom
canvasRef.current.setZoom(1.5); // 150%

// Acceso directo
const fabricCanvas = canvasRef.current.getCanvas();
```

## 🤖 Integración IA

### Endpoints Futuros
```javascript
POST /api/ai/compose-design
{
  type: 'invitation',
  style: 'minimal',
  content: { names, date, location }
}
→ Retorna canvas JSON

POST /api/ai/suggest-improvements
{ canvasJSON }
→ Retorna array de sugerencias

POST /api/ai/generate-variations
{ baseDesign, variationType }
→ Retorna array de variaciones
```

## 📝 TODO / Roadmap

### Pendiente - Core
- [ ] Instalar dependencia Fabric.js
- [ ] Implementar grid y snap-to-grid
- [ ] Añadir atajos de teclado
- [ ] Mejorar performance con virtualización
- [ ] Implementar texto en curva

### Pendiente - Assets
- [ ] Seed inicial de 100+ elementos SVG
- [ ] Sistema de búsqueda avanzada
- [ ] Categorización detallada
- [ ] Assets premium

### Pendiente - Exportación
- [ ] Implementar exportación PDF real
- [ ] Marcas de corte para imprenta
- [ ] Especificaciones CMYK
- [ ] Batch export de múltiples diseños

### Pendiente - IA
- [ ] Endpoint de composición automática
- [ ] Selección inteligente de assets
- [ ] Sugerencias contextuales
- [ ] Generador de variaciones

### Pendiente - UX
- [ ] Tutorial onboarding
- [ ] Plantillas predefinidas (20+)
- [ ] Guardado automático
- [ ] Colaboración en tiempo real

## 🐛 Problemas Conocidos

1. **Fabric.js no instalado**: Ejecutar `npm install fabric`
2. **Assets vacíos**: Crear colección `designAssets` en Firestore
3. **Performance**: Canvas grande puede ser lento en móviles

## 📚 Referencias

- [Fabric.js Docs](http://fabricjs.com/docs/)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)
- [Propuesta Técnica Completa](../../docs/PROPUESTA_EDITOR_DISENOS.md)

## 🔗 Enlaces Relacionados

- Página antigua: `/disenos` (mantener temporalmente)
- Acceso desde: More → Extras → Editor de Diseños
- Admin: Gestión de assets en Firestore console

---

**Versión**: 1.0.0-beta  
**Última actualización**: Diciembre 2025  
**Autor**: MaLoveApp Team
