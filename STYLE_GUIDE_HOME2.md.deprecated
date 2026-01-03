# 🎨 Guía de Estilo Visual - MaLove.App (Home2)

**Versión:** 2.0  
**Última actualización:** Diciembre 2025  
**Basado en:** HomePage2 - Diseño aprobado por el usuario

Esta guía define el estilo visual EXACTO basado en la página **Home2** (`HomePage2.jsx`).

---

## 🏗️ Arquitectura de Layout

### Estructura de Contenedor Principal

```jsx
<div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
     style={{ backgroundColor: '#EDE8E0' }}>
  
  <div className="mx-auto my-8" style={{ 
    maxWidth: '1024px',
    width: '100%',
    backgroundColor: '#FFFBF7',
    borderRadius: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden'
  }}>
    {/* Contenido aquí */}
  </div>
</div>
```

**Especificaciones exactas:**
- **Fondo exterior**: `#EDE8E0` (beige grisáceo)
- **Card central**: 
  - Max-width: `1024px`
  - Background: `#FFFBF7` (beige muy claro)
  - Border-radius: `32px` (esquinas muy redondeadas)
  - Box-shadow: `0 8px 32px rgba(0,0,0,0.12)` (sombra media-alta)
  - Margin vertical: `my-8`
- **Padding bottom**: `pb-20` (espacio para Nav)

---

## 🖼️ Hero Section (Header con Imagen)

```jsx
<header className="relative overflow-hidden" style={{
  height: '240px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}}>
  {/* Imagen de fondo */}
  <div className="absolute inset-0">
    <img 
      src={heroImage}
      className="w-full h-full object-cover"
      style={{ objectPosition: 'center 30%', transition: 'opacity 1s ease-in-out' }}
    />
    {/* Overlay para legibilidad */}
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(to right, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
      zIndex: 2,
    }} />
  </div>
  
  {/* Texto */}
  <div className="relative z-10 h-full flex items-center px-8">
    <div className="max-w-lg">
      <h1 style={{
        fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
        fontSize: '36px',
        fontWeight: 400,
        color: '#FFFFFF',
        marginBottom: '8px',
        letterSpacing: '-0.01em',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}>Título</h1>
      <p style={{
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        fontSize: '17px',
        color: '#FFFFFF',
        opacity: 0.95,
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}>Subtítulo</p>
    </div>
  </div>
</header>
```

**Especificaciones:**
- Altura: `240px`
- Imagen: full cover con `objectPosition: 'center 30%'`
- Overlay: gradiente blanco de izquierda (75%) a derecha (20%)
- Título: Playfair Display, 36px, blanco con sombra
- Subtítulo: DM Sans, 17px, blanco con sombra

---

## 🎨 Hero Section (Variante: Degradado sin Imagen)

Para páginas que no requieren imagen de fondo, se puede usar un degradado elegante:

```jsx
<header className="relative overflow-hidden" style={{
  background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
  padding: '48px 32px 32px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}}>
  <div className="max-w-4xl" style={{ textAlign: 'center' }}>
    {/* Título con líneas decorativas */}
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '12px'
    }}>
      <div style={{
        width: '60px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #D4A574)',
      }} />
      <h1 style={{
        fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
        fontSize: '40px',
        fontWeight: 400,
        color: '#1F2937',
        letterSpacing: '-0.01em',
        margin: 0,
      }}>Título</h1>
      <div style={{
        width: '60px',
        height: '1px',
        background: 'linear-gradient(to left, transparent, #D4A574)',
      }} />
    </div>
    
    {/* Subtítulo como tag uppercase */}
    <p style={{
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      fontSize: '11px',
      fontWeight: 600,
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '32px',
    }}>Subtítulo Discreto</p>
    
    {/* Tabs pills sin borde (opcional) */}
    <div style={{ 
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button style={{
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: 600,
        padding: '10px 24px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>Tab Activo</button>
      <button style={{
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: 500,
        padding: '10px 24px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: 'rgba(255,255,255,0.5)',
        color: '#6B7280',
        cursor: 'pointer',
      }}>Tab Inactivo</button>
    </div>
  </div>
</header>
```

**Especificaciones:**
- **Degradado**: `linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)` (beige-dorado)
- **Padding**: `48px 32px 32px` (más compacto que el hero con imagen)
- **Título**: 
  - Playfair Display, 40px (ligeramente más grande)
  - Color oscuro `#1F2937` (no blanco)
  - Centrado con líneas decorativas doradas
  - Líneas: gradientes `transparent → #D4A574` (60px ancho)
- **Subtítulo**:
  - DM Sans, 11px, weight 600
  - Uppercase con `letterSpacing: '0.1em'`
  - Color gris suave `#9CA3AF`
  - Muy discreto y profesional
- **Tabs Pills** (opcional):
  - Border-radius: `20px` (completamente redondeados)
  - Sin bordes
  - Activo: fondo blanco `#FFFFFF` con sombra `0 2px 8px rgba(0,0,0,0.1)`
  - Inactivo: semi-transparente `rgba(255,255,255,0.5)`
  - Centrados con flexbox

**Cuándo usar:**
- ✅ Páginas funcionales (Finanzas, Configuración, etc.)
- ✅ Cuando no hay imagen hero apropiada
- ✅ Para mantener elegancia sin imagen de fondo
- ❌ NO usar en landing pages o home

**Ejemplo implementado en:** `apps/main-app/src/pages/Finance.jsx`

---

## 📦 Secciones de Contenido

```jsx
<section className="px-6 py-6">
  {/* Grid de cards o contenido */}
</section>
```

**Padding estándar:** `px-6 py-6` en todas las secciones

---

## 💳 Metric Cards (CountdownCard, BudgetCard, GuestListCard)

```jsx
// Ejemplo de MetricCard
<div style={{
  backgroundColor: '#FFF4E6',  // Color pastel de fondo
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #EEF2F7',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Barra de acento inferior */}
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#D4A574',  // Color de acento
    opacity: 0.6,
  }} />
  
  {/* Contenido */}
  <div className="space-y-1">
    <h3 style={{
      color: '#D4A574',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>TÍTULO</h3>
    <p className="text-3xl font-bold" style={{ color: '#D4A574' }}>Valor</p>
    <p style={{ 
      fontSize: '12px', 
      color: '#D4A574',
      opacity: 0.7 
    }}>Subtítulo</p>
  </div>
</div>
```

**Paleta de colores para Metric Cards:**
- **Countdown**: `bgColor: '#FFF4E6'`, `accentColor: '#D4A574'` (beige/dorado)
- **Budget**: `bgColor: '#F0F9FF'`, `accentColor: '#60A5FA'` (azul claro)
- **Guests**: `bgColor: '#F0FDF4'`, `accentColor: '#4ADE80'` (verde claro)

**Especificaciones:**
- Border-radius: `20px`
- Box-shadow: `0 2px 8px rgba(0,0,0,0.04)` (muy sutil)
- Border: `1px solid #EEF2F7`
- Padding: `24px`
- Barra de acento: 4px de altura, opacity 0.6, en la parte inferior
- Título: uppercase, tracking ancho, 12px
- Valor: 3xl, bold

---

## 🎨 Paleta de Colores Oficial

### Fondos
```css
--bg-exterior: #EDE8E0           /* Fondo exterior gris-beige */
--bg-container: #FFFBF7          /* Fondo del card principal beige claro */
--bg-surface: #FFFFFF            /* Fondo de elementos internos (opcional) */
```

### Metric Cards
```css
--metric-countdown-bg: #FFF4E6   /* Beige claro */
--metric-countdown-accent: #D4A574  /* Dorado/beige */

--metric-budget-bg: #F0F9FF      /* Azul muy claro */
--metric-budget-accent: #60A5FA  /* Azul */

--metric-guests-bg: #F0FDF4      /* Verde muy claro */
--metric-guests-accent: #4ADE80  /* Verde */
```

### Tipografía
```css
--font-serif: 'Playfair Display', 'Cormorant Garamond', serif
--font-sans: 'DM Sans', 'Inter', sans-serif
```

---

## 📐 Grid Layouts

### Grid de 3 columnas (Metric Cards)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>
```

### Grid de 2 columnas (Tareas + Gráfico)
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <TasksList />
  <BudgetChart />
</div>
```

**Gap estándar:** `gap-6` (24px)

---

## 🚫 Lo que NO se debe usar

### ❌ Clases de Tailwind genéricas
```jsx
// NO USAR
<div className="bg-white shadow-md rounded-xl">
```

### ❌ Variables CSS del STYLE_GUIDE.md antiguo
```jsx
// NO USAR
<div className="bg-surface text-body border border-soft">
```

### ✅ USAR: Inline styles con colores exactos
```jsx
// SÍ USAR
<div style={{
  backgroundColor: '#FFFBF7',
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}}>
```

---

## 📋 Checklist para Nuevas Páginas

Para adaptar cualquier página al estilo Home2:

- [ ] Fondo exterior: `backgroundColor: '#EDE8E0'`
- [ ] Card central con `maxWidth: '1024px'`, `backgroundColor: '#FFFBF7'`, `borderRadius: '32px'`
- [ ] Sombra del card: `boxShadow: '0 8px 32px rgba(0,0,0,0.12)'`
- [ ] Hero section con imagen + overlay gradiente (si aplica)
- [ ] Secciones con `px-6 py-6`
- [ ] Metric cards con:
  - `borderRadius: '20px'`
  - `boxShadow: '0 2px 8px rgba(0,0,0,0.04)'`
  - Colores pastel de fondo (#FFF4E6, #F0F9FF, #F0FDF4)
  - Barra de acento inferior (4px, opacity 0.6)
- [ ] Grid layouts con `gap-6`
- [ ] Tipografía: Playfair Display para títulos principales, DM Sans para el resto
- [ ] Bottom navigation con `Nav` component

---

## 📦 Plantilla de Página Completa

```jsx
export default function MyPage() {
  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
           style={{ backgroundColor: '#EDE8E0' }}>
        <div className="mx-auto my-8" style={{ 
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          
          {/* Hero Section (opcional) */}
          <header className="relative overflow-hidden" style={{
            height: '240px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            {/* Imagen + overlay + texto */}
          </header>

          {/* Sección 1 */}
          <section className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Metric cards */}
            </div>
          </section>

          {/* Sección 2 */}
          <section className="px-6 py-6">
            {/* Contenido */}
          </section>

        </div>
      </div>
      
      <Nav />
    </>
  );
}
```

---

## 🎯 Páginas de Referencia

**✅ ESTILO CORRECTO (usar como base):**
- `apps/main-app/src/components/HomePage2.jsx`
- `apps/main-app/src/components/dashboard/MetricCard.jsx`
- `apps/main-app/src/components/dashboard/CountdownCard.jsx`
- `apps/main-app/src/components/dashboard/BudgetCard.jsx`

**❌ NO seguir estos estilos:**
- STYLE_GUIDE.md antiguo (basado en Tasks/Dashboard viejo)
- Páginas con `layout-container-wide` y clases utility antiguas

---

## 💡 Notas Importantes

1. **Todos los colores son inline styles** - no usar variables CSS del antiguo STYLE_GUIDE
2. **Border-radius grande** - 32px para el contenedor principal, 20px para cards
3. **Sombras sutiles** - `0 2px 8px rgba(0,0,0,0.04)` para cards, `0 8px 32px rgba(0,0,0,0.12)` para contenedor
4. **Colores pastel** - fondos suaves (#FFF4E6, #F0F9FF, #F0FDF4)
5. **Barra de acento** - 4px en la parte inferior de metric cards con opacity 0.6
6. **Tipografía serif** - Playfair Display solo para títulos hero
7. **DM Sans everywhere** - para todo el resto del texto

---

## 📞 Regla de Oro

**Si no está en HomePage2.jsx, no lo uses.**

Esta guía es la fuente de verdad absoluta para el diseño visual de la aplicación.
