# 🎨 Rediseño Visual Completo - Seating Plan

**Fecha:** 23 de Octubre 2025  
**Estado:** 🔄 En implementación  
**Objetivo:** Transformar el Seating Plan en una experiencia de diseño moderna tipo Figma/Canva

---

## 📊 Análisis del Estado Actual

### ✅ Fortalezas (Mantener)
- Arquitectura modular con `useSeatingPlan` hook
- Funcionalidades completas: drag & drop, undo/redo, auto-IA
- 13 tests E2E funcionando
- Separación de componentes clara

### ❌ Problemas Visuales
1. **Layout tradicional** - Toolbar arriba muy denso
2. **Jerarquía poco clara** - Botones compitiendo por atención
3. **Canvas pequeño** - Solo 60% de la pantalla
4. **Estética genérica** - No transmite "herramienta profesional"

---

## 🎯 Concepto: "Studio de Diseño Espacial"

### Inspiración
- **Figma** - Canvas infinito, toolbar flotante, minimalismo
- **Canva** - Accesibilidad, jerarquía clara, micro-interacciones
- **Notion** - Organización, modo oscuro elegante
- **Miro** - Colaboración visual, zoom infinito

### Principios
1. ✨ **Canvas como protagonista** - 75-80% de la pantalla
2. 🎨 **Minimalismo funcional** - Ocultar complejidad
3. 🔍 **Contexto progresivo** - Revelar opciones cuando importan
4. 🌊 **Flujo natural** - Guiar sin fricción

---

## 🏗️ Nueva Arquitectura Visual

### Layout: "Floating Studio"

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 MyWed360    Banquete · Ceremonia    120 invitados    María & Juan │ ← Header 50px
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────┐                   CANVAS INFINITO                        │
│  │ 🎨 │              (75% de la pantalla)                        │
│  │    │                                                           │
│  │ ➕ │        Grid sutil · Mesas draggables                    │
│  │    │                                                           │
│  │ ✏️ │              [Física de movimiento]                      │
│  │    │                                                           │
│  │ 🪄 │                                                   ┌─────┐│
│  │    │                                                   │Mini-││
│  │ ↩️ │                                                   │mapa ││
│  │    │                                                   └─────┘│
│  │ ↪️ │                                                           │
│  │    │                                          ┌──────────────┐│
│  │ ⚙️ │                                          │ Inspector    ││
│  └────┘                                          │ (flotante)   ││
│  60px                                            └──────────────┘│
│  toolbar                                                          │
├─────────────────────────────────────────────────────────────────┤
│  98% asignados · 12 mesas · 8 conflictos    [Auto-IA] [Exportar]│ ← Footer 45px
└─────────────────────────────────────────────────────────────────┘
```

### Jerarquía de Elementos

1. **Nivel 1: Canvas** (z-index: 1)
2. **Nivel 2: Floating Panels** (z-index: 10)
   - Toolbar vertical izquierda
   - Inspector derecha (condicional)
   - Mini-mapa superior derecha
3. **Nivel 3: Modals** (z-index: 50)
4. **Nivel 4: Toasts** (z-index: 100)

---

## 🎨 Sistema de Diseño

### Paleta de Colores

```javascript
export const SEATING_THEME = {
  // Base (Dark Mode por defecto)
  bg: {
    primary: '#0F0F10',      // Negro suave
    secondary: '#1A1A1D',    // Gris oscuro
    tertiary: '#25262B',     // Gris medio
  },
  
  // Light Mode
  bgLight: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Acentos funcionales
  accent: {
    primary: '#6366F1',      // Indigo - acciones principales
    success: '#10B981',      // Verde - confirmaciones
    warning: '#F59E0B',      // Amber - advertencias
    danger: '#EF4444',       // Rojo - eliminaciones
    info: '#3B82F6',         // Azul - información
  },
  
  // Texto
  text: {
    primary: '#F9FAFB',      // Blanco suave
    secondary: '#9CA3AF',    // Gris claro
    tertiary: '#6B7280',     // Gris medio
    muted: '#4B5563',        // Gris oscuro
  },
  
  // Elementos de canvas
  canvas: {
    grid: '#25262B',         // Grid sutil
    gridMajor: '#374151',    // Líneas principales
    selection: '#6366F1',    // Selección
    mesa: {
      default: '#3B82F6',
      selected: '#8B5CF6',
      locked: '#64748B',
      full: '#10B981',
      partial: '#F59E0B',
      empty: '#6B7280',
      conflict: '#EF4444',
    }
  }
}
```

### Tipografía

```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Jerarquía */
.text-display-lg { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
.text-display-md { font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
.text-title { font-size: 18px; font-weight: 600; }
.text-body { font-size: 14px; font-weight: 400; }
.text-label { font-size: 13px; font-weight: 500; letter-spacing: 0.01em; }
.text-caption { font-size: 12px; font-weight: 400; color: var(--text-secondary); }
```

### Espaciado

```javascript
const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
}
```

### Sombras

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-floating: 0 20px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## 🧩 Componentes Rediseñados

### 1. SeatingToolbarFloating (NUEVO)

**Ubicación:** Izquierda flotante, 60px ancho

```jsx
const TOOLBAR_ITEMS = [
  { id: 'move', icon: Move, label: 'Mover', shortcut: '1' },
  { id: 'add', icon: Plus, label: 'Añadir mesa', shortcut: 'A' },
  { id: 'draw', icon: Pencil, label: 'Dibujar áreas', shortcut: 'D' },
  { id: 'magic', icon: Sparkles, label: 'Auto-IA', badge: 'BETA' },
  { type: 'divider' },
  { id: 'undo', icon: Undo, label: 'Deshacer', shortcut: 'Ctrl+Z', disabled: !canUndo },
  { id: 'redo', icon: Redo, label: 'Rehacer', shortcut: 'Ctrl+Y', disabled: !canRedo },
  { type: 'divider' },
  { id: 'settings', icon: Settings, label: 'Configuración', shortcut: ',' },
]
```

**Estados visuales:**
- Default: bg-transparent, text-gray-400
- Hover: bg-white/10, text-white, scale-105
- Active: bg-indigo-600, text-white, shadow-lg
- Disabled: opacity-40, cursor-not-allowed

### 2. SeatingCanvasInfinite (MEJORADO)

**Features nuevas:**
- Grid adaptativo con fade en zoom
- Selección múltiple con marquee glassmorphism
- Dimensiones en vivo al mover
- Snap to grid visual con líneas guía
- Mini-mapa en esquina superior derecha

```jsx
// Grid adaptativo
const gridOpacity = useMemo(() => {
  if (zoom < 0.5) return 0.1;
  if (zoom < 1) return 0.3;
  return 0.5;
}, [zoom]);

// Líneas guía de alineación
const [snapGuides, setSnapGuides] = useState([]);
```

### 3. SeatingInspectorFloating (NUEVO)

**Aparece solo cuando:** `selectedTable !== null`

**Ubicación:** Esquina inferior derecha, glassmorphism

```jsx
<div className="fixed bottom-6 right-6 w-80 
                backdrop-blur-xl bg-white/10 dark:bg-black/20
                border border-white/20 rounded-2xl shadow-floating
                p-6">
  {/* Inspector content */}
</div>
```

**Contenido:**
- Header con nombre mesa y botón cerrar
- Slider capacidad visual
- Lista de invitados asignados
- Acciones rápidas (duplicar, rotar, bloquear)
- Alertas contextuales

### 4. SeatingHeaderCompact (NUEVO)

**Altura:** 50px  
**Contenido:**
- Logo/breadcrumb izquierda
- Tabs centro (Banquete/Ceremonia)
- Stats rápidos
- Avatar usuario derecha

```jsx
<header className="h-12 border-b border-white/10 
                   flex items-center justify-between px-4">
  <div className="flex items-center gap-4">
    <HomeIcon /> MyWed360 / Seating
  </div>
  
  <Tabs value={tab} onChange={setTab} />
  
  <div className="flex items-center gap-6">
    <span className="text-sm text-gray-400">
      120 invitados
    </span>
    <Avatar />
  </div>
</header>
```

### 5. SeatingFooterStats (NUEVO)

**Altura:** 45px  
**Contenido:** Stats + CTAs principales

```jsx
<footer className="h-11 border-t border-white/10 
                   flex items-center justify-between px-4">
  <div className="flex items-center gap-6 text-sm">
    <Stat icon={CheckCircle} value="98%" label="asignados" color="green" />
    <Stat icon={Table} value="12" label="mesas" />
    <Stat icon={AlertTriangle} value="8" label="conflictos" color="amber" />
  </div>
  
  <div className="flex items-center gap-3">
    <Button variant="secondary">Exportar</Button>
    <Button variant="primary" icon={Sparkles}>
      Auto-IA
    </Button>
  </div>
</footer>
```

---

## ⚡ Interacciones y Animaciones

### Micro-animaciones con Framer Motion

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Toolbar buttons
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>

// Inspector panel
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
  transition={{ duration: 0.2 }}
>

// Mesas al añadir
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
>

// Toast de éxito
<motion.div
  initial={{ x: 400 }}
  animate={{ x: 0 }}
  exit={{ x: 400, opacity: 0 }}
>
```

### Estados Visuales de Mesas

```jsx
const getMesaStyle = (mesa) => {
  const assigned = mesa.assignedGuests?.length || 0;
  const capacity = mesa.capacity || 8;
  const percentage = (assigned / capacity) * 100;
  
  if (mesa.locked) {
    return 'opacity-60 cursor-not-allowed grayscale';
  }
  
  if (percentage === 0) {
    return 'border-dashed border-gray-500 opacity-60';
  }
  
  if (percentage < 100) {
    return 'border-amber-500 border-2';
  }
  
  if (percentage === 100) {
    return 'border-green-500 border-2 shadow-green-500/50';
  }
  
  return 'border-blue-500';
};
```

---

## 📱 Responsividad

### Breakpoints

```javascript
const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1439px)',
  desktop: '(min-width: 1440px)',
}
```

### Adaptaciones

**Desktop (1440px+):**
- Layout completo
- Toolbar vertical flotante
- Inspector flotante
- Mini-mapa visible

**Tablet (768-1439px):**
- Toolbar compacto top
- Inspector en bottom sheet
- Canvas 85% pantalla

**Mobile (<768px):**
- Modo simplificado
- Toolbar horizontal bottom
- Vista lista alternativa
- Gestos táctiles optimizados

---

## 🎯 Plan de Implementación

### Fase 1: Layout Base (Hoy - 2 horas)
- [x] Crear documento de diseño
- [ ] Implementar `SeatingLayoutFloating` (wrapper principal)
- [ ] Implementar `SeatingToolbarFloating`
- [ ] Implementar `SeatingHeaderCompact`
- [ ] Implementar `SeatingFooterStats`

### Fase 2: Canvas Mejorado (Mañana - 3 horas)
- [ ] Grid adaptativo con fade
- [ ] Selección múltiple visual
- [ ] Snap to grid con guías
- [ ] Mini-mapa flotante

### Fase 3: Inspector Contextual (1 día)
- [ ] Panel flotante glassmorphism
- [ ] Slider capacidad visual
- [ ] Acciones rápidas
- [ ] Animaciones entrada/salida

### Fase 4: Micro-interacciones (1 día)
- [ ] Animaciones Framer Motion
- [ ] Estados hover/active
- [ ] Feedback visual de acciones
- [ ] Toasts mejorados

### Fase 5: Polish Final (1 día)
- [ ] Modo oscuro/claro toggle
- [ ] Atajos de teclado overlay
- [ ] Onboarding visual
- [ ] Performance optimization

---

## 📚 Referencias de Código

**Archivos a modificar:**
- `src/components/seating/SeatingPlanRefactored.jsx` - Wrapper principal
- `src/components/seating/SeatingPlanCanvas.jsx` - Canvas mejorado
- `src/components/seating/SeatingPlanToolbar.jsx` - Convertir a flotante

**Archivos a crear:**
- `src/components/seating/SeatingLayoutFloating.jsx` - Nuevo layout
- `src/components/seating/SeatingToolbarFloating.jsx` - Toolbar vertical
- `src/components/seating/SeatingInspectorFloating.jsx` - Inspector
- `src/components/seating/SeatingHeaderCompact.jsx` - Header
- `src/components/seating/SeatingFooterStats.jsx` - Footer

**Dependencias nuevas:**
```json
{
  "framer-motion": "^10.16.4",
  "react-use-gesture": "^9.1.3"
}
```

---

**Última actualización:** 23 Oct 2025 00:22  
**Responsable:** Sistema de rediseño visual
