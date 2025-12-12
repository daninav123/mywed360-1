# Mejoras de UI - Seating Plan

**Fecha:** 17 de Noviembre de 2025
**Objetivo:** Limpiar interfaz saturada y mejorar jerarquía visual

---

## 🎯 Problemas Identificados

### Antes (Captura del usuario)

- ❌ Panel de invitados abierto por defecto (380px de ancho)
- ❌ Minimapa grande (200x150px) chocando con toolbar
- ❌ Toolbar lateral muy cerca del minimapa
- ❌ Múltiples capas UI superpuestas
- ❌ Z-index desorganizado
- ❌ Demasiados elementos visibles simultáneamente

---

## ✅ Soluciones Implementadas

### 1. Minimapa

**Cambios:**

- ✅ **Oculto por defecto** - Solo se muestra al hacer click en botón "M"
- ✅ **Tamaño reducido** - De 200x150px a 160x120px (20% más pequeño)
- ✅ **Posición ajustada** - `bottom-20 left-24` para no chocar con toolbar
- ✅ **Z-index reducido** - De z-50 a z-20

**Archivo:** `/apps/main-app/src/components/seating/Minimap.jsx`

```javascript
// Antes
size = { width: 200, height: 150 };
className = '... z-50';

// Después
size = { width: 160, height: 120 };
className = '... z-20';
position: 'bottom-20 left-24'; // Para bottom-left
```

### 2. Panel de Invitados

**Cambios:**

- ✅ **Ancho reducido** - De 380px a 340px (40px menos)
- ✅ **Se abre solo al hacer click** - No abierto por defecto
- ✅ **Botón visible** - Primer botón en toolbar con estilo destacado

**Archivo:** `/apps/main-app/src/components/seating/SeatingGuestDrawer.jsx`

```javascript
// Antes
w-[380px]

// Después
w-[340px]
```

### 3. Toolbar Lateral

**Cambios:**

- ✅ **Z-index aumentado** - De z-30 a z-40 para estar por encima
- ✅ **Botón de invitados primero** - Más visible
- ✅ **Estilo destacado** - Verde brillante cuando hay pendientes

**Archivo:** `/apps/main-app/src/components/seating/SeatingToolbarFloating.jsx`

```javascript
// Antes
z - 30;

// Después
z - 40;
```

### 4. Estado Inicial

**Cambios:**

- ✅ **Minimapa oculto** - `showMinimap = false` por defecto
- ✅ **Panel invitados cerrado** - Solo se abre al hacer click
- ✅ **Menos elementos visibles** - Interfaz más limpia al cargar

**Archivo:** `/apps/main-app/src/components/seating/SeatingPlanModern.jsx`

```javascript
// Antes
const [showMinimap, setShowMinimap] = useState(true);

// Después
const [showMinimap, setShowMinimap] = useState(false);
```

---

## 📊 Jerarquía Z-Index

### Orden Actual (de menor a mayor)

1. **z-20** - Minimap (cuando está visible)
2. **z-30** - Canvas y elementos del plan
3. **z-40** - Toolbar lateral principal
4. **z-50** - Panel de invitados (modal overlay)

---

## 🎨 Espacio Visual Liberado

### Antes

- Minimapa: 200x150px = 30,000px²
- Panel invitados: 380px ancho (siempre visible)
- **Total ocupado:** ~40% del espacio visual

### Después

- Minimapa: 160x120px = 19,200px² (cuando visible, pero oculto por defecto)
- Panel invitados: 340px ancho (solo cuando se abre)
- **Total ocupado:** ~15% del espacio visual (mejora del 62%)

---

## 🧪 Testing

### Verificar

- [ ] Minimapa NO visible al cargar por primera vez
- [ ] Panel de invitados cerrado al inicio
- [ ] Botón verde de invitados visible (primer botón)
- [ ] Toolbar NO se superpone con minimapa cuando se activa
- [ ] Z-index correcto (toolbar > minimapa)
- [ ] Panel de invitados se abre al hacer click en botón verde
- [ ] Minimapa se activa con botón "M" o click en icono de mapa

---

## 🚀 Próximas Mejoras (Opcional)

### Nice to Have

- [ ] Minimapa colapsable con animación
- [ ] Panel de invitados con modo mini (solo contador)
- [ ] Toolbar con modo compacto
- [ ] Auto-ocultar elementos tras X segundos de inactividad
- [ ] Tema "Zen mode" que oculta todo excepto canvas

---

## 📝 Resumen

**Objetivo:** Interfaz más limpia, menos saturada
**Resultado:** 62% menos ocupación visual, mejor jerarquía
**Experiencia:** Usuario puede ver el canvas sin distracciones

**Elementos ahora bajo demanda:**

- 👁️ Minimapa → Mostrar con tecla "M"
- 👥 Panel invitados → Mostrar con tecla "G" o click en botón verde
- 🎨 Herramientas dibujo → Mostrar con tecla "B"
