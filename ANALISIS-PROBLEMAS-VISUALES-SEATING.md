# 🔍 ANÁLISIS DE PROBLEMAS VISUALES - SEATING PLAN BANQUETE

**Fecha:** 13 Noviembre 2025, 00:30  
**Estado:** Investigación en curso

---

## 🎯 PROBLEMA REPORTADO

El usuario indica que **"no se ve como se vería un seating plan como debería ser"** en la pestaña de Banquete.

---

## 🔬 DIAGNÓSTICO PRELIMINAR

### 1. Problemas Potenciales Identificados

#### A. CANVAS VACÍO O NO VISIBLE

**Síntomas:**

- Canvas SVG no muestra contenido
- Mesas no se renderizan visualmente
- Área de dibujo aparece en blanco

**Causas Posibles:**

```javascript
// SeatingPlanCanvas.jsx
- Falta inicialización del viewBox SVG
- Dimensiones no calculadas correctamente
- Z-index incorrecto (elementos ocultos bajo otros)
- Transform/translate mal aplicado
```

**Archivos Afectados:**

- `/src/components/seating/SeatingPlanCanvas.jsx`
- `/src/components/seating/SeatingPlanRefactored.jsx`

---

#### B. MESAS NO SE VISUALIZAN

**Síntomas:**

- Datos de mesas existen en estado pero no se renderizan
- console.log muestra mesas pero no aparecen en pantalla

**Causas Posibles:**

```javascript
// Problema 1: Posiciones fuera del viewport
const table = {
  x: -1000,  // ❌ Fuera de vista
  y: -1000,  // ❌ Fuera de vista
  width: 100,
  height: 100
}

// Problema 2: Tamaños incorrectos
const table = {
  width: 0,   // ❌ Invisible
  height: 0,  // ❌ Invisible
  radius: NaN // ❌ Error
}

// Problema 3: Opacidad/visibilidad
<g opacity={0}>  // ❌ Invisible
<g display="none">  // ❌ Oculto
```

**Archivos Afectados:**

- `/src/hooks/useSeatingPlan.js` - Lógica de generación de mesas
- `/src/components/seating/SeatingPlanCanvas.jsx` - Renderizado

---

#### C. ESTILOS CSS NO APLICADOS

**Síntomas:**

- Elementos existen en DOM pero no tienen estilos visuales
- Colores, bordes, fills no se muestran

**Causas Posibles:**

```css
/* Problema: Clases Tailwind no compiladas */
.mesa-circular {
  /* Sin estilos si Tailwind no las reconoce */
}

/* Problema: CSS-in-JS no carga */
<circle style={{fill: undefined}} />  /* ❌ */

/* Problema: Dark mode conflicto */
.dark .mesa { fill: white; }  /* Invisible en fondo blanco */
```

---

#### D. DATOS NO LLEGAN AL CANVAS

**Síntomas:**

- Hook devuelve arrays vacíos
- Estado no se sincroniza con Firebase

**Verificación:**

```javascript
// En SeatingPlanRefactored.jsx
const { tables, seats, areas } = useSeatingPlan();

console.log('Tables:', tables); // ¿Array vacío?
console.log('Seats:', seats); // ¿Array vacío?
console.log('Areas:', areas); // ¿Array vacío?
```

**Causas Posibles:**

- Firebase no sincroniza
- Hook no retorna datos correctamente
- Condiciones de renderizado incorrectas

---

#### E. PROBLEMAS DE TRANSFORM/SCALE

**Síntomas:**

- Elementos microscópicos (demasiado pequeños)
- Elementos gigantes (fuera de pantalla)
- Zoom inicial incorrecto

**Causas Posibles:**

```javascript
// Escala incorrecta
<g transform="scale(0.001)">  // ❌ Microscópico
<g transform="scale(1000)">   // ❌ Gigante

// ViewBox mal configurado
<svg viewBox="0 0 10000 10000">  // ❌ Demasiado grande
<svg viewBox="0 0 10 10">         // ❌ Demasiado pequeño
```

---

## 🧪 TESTS DE DIAGNÓSTICO

### Test 1: Verificar Renderizado Básico

```javascript
// Abrir consola en navegador
// Pegar este código

// 1. Verificar SVG existe
const svg = document.querySelector('svg');
console.log('SVG encontrado:', !!svg);
console.log('Dimensiones SVG:', svg?.getBoundingClientRect());

// 2. Verificar mesas en DOM
const tables = document.querySelectorAll('circle, rect[data-table], g[data-table]');
console.log('Mesas en DOM:', tables.length);

// 3. Verificar posiciones
tables.forEach((table, i) => {
  const bounds = table.getBoundingClientRect();
  console.log(`Mesa ${i}:`, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    visible: bounds.width > 0 && bounds.height > 0,
  });
});

// 4. Verificar estilos computados
const firstTable = tables[0];
if (firstTable) {
  const styles = window.getComputedStyle(firstTable);
  console.log('Estilos primera mesa:', {
    fill: styles.fill,
    stroke: styles.stroke,
    opacity: styles.opacity,
    display: styles.display,
  });
}
```

### Test 2: Verificar Datos del Hook

```javascript
// En SeatingPlanRefactored.jsx, añadir después de useSeatingPlan():

useEffect(() => {
  console.log('🔍 DIAGNÓSTICO SEATING PLAN');
  console.log('='.repeat(50));
  console.log('Tab actual:', tab);
  console.log('Mesas:', tables?.length || 0);
  console.log('Primera mesa:', tables?.[0]);
  console.log('Asientos:', seats?.length || 0);
  console.log('Áreas:', areas?.length || 0);
  console.log('Hall size:', hallSize);
  console.log('='.repeat(50));
}, [tab, tables, seats, areas, hallSize]);
```

### Test 3: Verificar Generación de Mesas

```javascript
// Probar generación manual
const testGeneration = async () => {
  console.log('🧪 Test: Generar mesas de prueba');

  const testTables = [
    {
      id: 'test-1',
      name: 'Mesa Test 1',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      shape: 'rectangular',
      capacity: 8,
      seats: 8,
      guests: [],
    },
    {
      id: 'test-2',
      name: 'Mesa Test 2',
      x: 250,
      y: 100,
      radius: 50,
      shape: 'circular',
      capacity: 6,
      seats: 6,
      guests: [],
    },
  ];

  console.log('Mesas de prueba creadas:', testTables);
  // Aplicar con: await applyBanquetTables(testTables);
};
```

---

## 🛠️ SOLUCIONES PROPUESTAS

### Solución 1: Verificar y Corregir Canvas

```javascript
// SeatingPlanCanvas.jsx
const SeatingPlanCanvas = ({ tables, hallSize, scale, offset }) => {
  // AÑADIR: Validación de dimensiones
  const validHallSize = {
    width: hallSize?.width || 1000,
    height: hallSize?.height || 800,
  };

  const validScale = scale || 1;
  const validOffset = offset || { x: 0, y: 0 };

  // AÑADIR: Log de debugging
  useEffect(() => {
    console.log('Canvas render:', {
      tables: tables?.length,
      hallSize: validHallSize,
      scale: validScale,
      offset: validOffset,
    });
  }, [tables, validHallSize, validScale, validOffset]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${validHallSize.width} ${validHallSize.height}`}
      style={{ border: '2px solid red' }} // DEBUG: Ver límites
    >
      {/* Añadir rectángulo de fondo para debug */}
      <rect
        x="0"
        y="0"
        width={validHallSize.width}
        height={validHallSize.height}
        fill="#f0f0f0"
        stroke="#000"
        strokeWidth="2"
      />

      {/* Renderizar mesas */}
      {tables?.map((table) => (
        <g key={table.id}>
          {table.shape === 'circular' ? (
            <circle
              cx={table.x}
              cy={table.y}
              r={table.radius || 50}
              fill="blue"
              stroke="black"
              strokeWidth="2"
            />
          ) : (
            <rect
              x={table.x}
              y={table.y}
              width={table.width || 100}
              height={table.height || 100}
              fill="green"
              stroke="black"
              strokeWidth="2"
            />
          )}

          {/* Texto de nombre */}
          <text x={table.x} y={table.y} textAnchor="middle" fill="white" fontSize="14">
            {table.name || table.id}
          </text>
        </g>
      ))}
    </svg>
  );
};
```

### Solución 2: Forzar Generación Inicial

```javascript
// SeatingPlanRefactored.jsx
useEffect(() => {
  // Si estamos en tab Banquete y no hay mesas, generar algunas
  if (tab === 'banquet' && (!tables || tables.length === 0)) {
    console.log('⚠️ No hay mesas en Banquete. Generando mesas de ejemplo...');

    const exampleTables = generateExampleTables(hallSize);
    applyBanquetTables(exampleTables);
  }
}, [tab, tables, hallSize]);

const generateExampleTables = (hallSize) => {
  const width = hallSize?.width || 1000;
  const height = hallSize?.height || 800;
  const margin = 100;

  return [
    {
      id: 'example-1',
      name: 'Mesa 1',
      x: margin,
      y: margin,
      radius: 60,
      shape: 'circular',
      capacity: 8,
      seats: 8,
      guests: [],
    },
    {
      id: 'example-2',
      name: 'Mesa 2',
      x: width / 2,
      y: margin,
      radius: 60,
      shape: 'circular',
      capacity: 8,
      seats: 8,
      guests: [],
    },
    {
      id: 'example-3',
      name: 'Mesa 3',
      x: width - margin - 120,
      y: margin,
      radius: 60,
      shape: 'circular',
      capacity: 8,
      seats: 8,
      guests: [],
    },
  ];
};
```

### Solución 3: Añadir Indicadores Visuales

```javascript
// Añadir al canvas para debug
<g id="debug-markers">
  {/* Marker en 0,0 */}
  <circle cx="0" cy="0" r="10" fill="red" />
  <text x="10" y="10" fill="red">
    Origen (0,0)
  </text>

  {/* Marker en centro */}
  <circle cx={hallSize.width / 2} cy={hallSize.height / 2} r="10" fill="blue" />
  <text x={hallSize.width / 2 + 15} y={hallSize.height / 2} fill="blue">
    Centro
  </text>

  {/* Grid de referencia */}
  {[...Array(10)].map((_, i) => (
    <g key={`grid-${i}`}>
      <line x1={i * 100} y1="0" x2={i * 100} y2={hallSize.height} stroke="#ccc" strokeWidth="1" />
      <line x1="0" y1={i * 100} x2={hallSize.width} y2={i * 100} stroke="#ccc" strokeWidth="1" />
    </g>
  ))}
</g>
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### Visual Básico

- [ ] Canvas SVG existe en DOM
- [ ] Canvas tiene dimensiones (width/height > 0)
- [ ] ViewBox configurado correctamente
- [ ] Elementos SVG visibles (opacity > 0, display !== 'none')
- [ ] Colores aplicados (fill, stroke no son undefined)

### Datos y Estado

- [ ] Hook useSeatingPlan retorna datos
- [ ] Array de tables no está vacío
- [ ] Mesas tienen propiedades válidas (x, y, radius/width/height)
- [ ] hallSize definido y > 0
- [ ] Firebase sync activo

### Interacción

- [ ] Click en tab Banquete funciona
- [ ] Botones de configuración responden
- [ ] Plantillas se pueden abrir
- [ ] Drag & drop funciona

### Performance

- [ ] No hay errores en consola
- [ ] No hay warnings de React
- [ ] Renderizado < 1 segundo
- [ ] Smooth animations

---

## 🔧 ACCIONES INMEDIATAS RECOMENDADAS

### 1. **Añadir Logs de Debug** (5 min)

```javascript
// En todos los componentes clave
console.log('[SeatingPlan] Estado:', { tables, seats, tab });
```

### 2. **Verificar Canvas Básico** (10 min)

- Añadir rectángulo de fondo visible
- Añadir markers de posición
- Verificar viewBox

### 3. **Generar Mesas de Prueba** (10 min)

- Crear función de mesas de ejemplo
- Forzar renderizado en tab Banquete

### 4. **Screenshot y Comparación** (5 min)

- Tomar screenshot del estado actual
- Comparar con diseño esperado
- Identificar diferencias específicas

---

## 📝 PRÓXIMOS PASOS

1. **Ejecutar tests de diagnóstico** en navegador
2. **Revisar logs** de consola
3. **Tomar screenshots** del estado actual
4. **Implementar soluciones** propuestas
5. **Verificar funcionamiento** con tests E2E

---

## 🎯 RESULTADO ESPERADO

### Visualización Correcta de Banquete:

```
┌─────────────────────────────────────────────┐
│  🍽️ BANQUETE                               │
├─────────────────────────────────────────────┤
│                                             │
│     ○        ○        ○                    │
│   Mesa 1   Mesa 2   Mesa 3                │
│   (8/8)    (6/8)    (0/8)                 │
│                                             │
│     ○        ○        ○                    │
│   Mesa 4   Mesa 5   Mesa 6                │
│   (8/8)    (8/8)    (4/8)                 │
│                                             │
│   [Grid visible]                            │
│   [Reglas visible]                          │
│   [Zoom controls]                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Elementos que DEBEN verse:**

- ✅ Mesas circulares u rectangulares con borde
- ✅ Nombres de mesa legibles
- ✅ Indicador de capacidad (X/Y invitados)
- ✅ Colores según estado (vacía/parcial/llena)
- ✅ Grid de fondo (opcional)
- ✅ Controles de zoom
- ✅ Toolbar con herramientas

---

**Estado:** 🔴 EN INVESTIGACIÓN  
**Prioridad:** 🔥 ALTA  
**Tiempo estimado solución:** 30-60 minutos
