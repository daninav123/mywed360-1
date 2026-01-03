# Sistema de Diseño Completo - Planivia

**Versión:** 2.1  
**Última actualización:** 30 de diciembre de 2024  
**Estado:** ✅ ESTÁNDAR OFICIAL - Todas las páginas deben seguir este diseño  
**Página de Referencia:** `HomePage2.jsx` - ESTE ES EL ESTILO PERFECTO

---

## 📐 Arquitectura Visual

### 1. Layout Principal (Patrón Container Card)

**Usado en:** Home2, Finance, Landing2

```jsx
// ✅ ESTRUCTURA CORRECTA
<div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
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

**Tokens del Container Card:**
- **Fondo exterior:** `#EDE8E0` (beige grisáceo suave)
- **Fondo interior:** `#FFFBF7` (beige cálido)
- **Max-width:** `1024px`
- **Border-radius:** `32px`
- **Box-shadow:** `0 8px 32px rgba(0,0,0,0.12)` (sombra grande y suave)
- **Overflow:** `hidden` (para bordes redondeados perfectos)

---

## 🎨 Sistema de Color

### Colores Base (Variables CSS)

```css
/* Fondos */
--color-bg: #FAF7F2;           /* Fondo principal aplicación */
--color-surface: #FFFFFF;       /* Cards, modales */

/* Textos */
--color-text: #1F2937;          /* Texto principal */
--color-text-secondary: #6B7280; /* Texto secundario */
--color-text-muted: #9CA3AF;    /* Texto muy suave */

/* Semánticos */
--color-primary: #60A5FA;       /* Azul suave */
--color-success: #34C759;       /* Verde */
--color-danger: #FF3737;        /* Rojo */
--color-warning: #F7DC6F;       /* Ámbar */
--color-info: #66B2FF;          /* Azul info */

/* Bordes y divisores */
--color-border: #E5E7EB;        /* Borde estándar */
--color-divider: rgba(31, 41, 55, 0.08); /* Divisor sutil */
```

### Colores Especiales del Container Card

**NO usar variables CSS para estos:**

| Elemento | Color | Uso |
|----------|-------|-----|
| Fondo exterior | `#F5F5F5` | Fondo de página |
| Container beige | `#FFFBF7` | Contenedor principal |
| Separadores internos | `rgba(0,0,0,0.06)` | Bordes sutiles dentro del container |

---

## ✍️ Tipografía

### Fuentes del Sistema

```css
/* Títulos principales (H1) */
font-family: 'Playfair Display', 'Cormorant Garamond', serif;
font-size: 36px;
font-weight: 400;
letter-spacing: -0.01em;
color: #1F2937;

/* Subtítulos y cuerpo */
font-family: 'DM Sans', 'Inter', sans-serif;
font-size: 17px;
color: #6B7280;
opacity: 0.9;
```

### Headers de Página (Estilo estándar)

```jsx
{/* Header dentro del Container Card */}
<div className="px-8 py-8" style={{
  borderBottom: '1px solid rgba(0,0,0,0.06)'
}}>
  <h1 style={{
    fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
    fontSize: '36px',
    fontWeight: 400,
    color: '#1F2937',
    marginBottom: '8px',
    letterSpacing: '-0.01em',
  }}>🎯 Título Página</h1>
  <p style={{
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    fontSize: '17px',
    color: '#6B7280',
    opacity: 0.9,
  }}>Descripción de la página</p>
</div>
```

---

## 📏 Espaciado y Layout

### Padding del Container Card

```jsx
{/* Secciones dentro del container */}
<div className="px-6 py-6">
  {/* Contenido de la sección */}
</div>

{/* Header con más padding */}
<div className="px-8 py-8">
  {/* Header content */}
</div>
```

### Grid Layouts Comunes

```jsx
{/* 3 columnas en desktop, 1 en móvil */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  {/* Cards */}
</div>

{/* 2 columnas en desktop, 1 en móvil */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Contenido */}
</div>
```

---

## 🌊 Sombras

### Sistema de Sombras

```css
/* Variables CSS disponibles */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-card: 0 2px 8px rgba(31, 41, 55, 0.04);
--shadow-hover: 0 4px 12px rgba(31, 41, 55, 0.08);
```

**Sombra del Container Card:**
```css
boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
```

---

## 🎯 Componentes Específicos

### Card Interior (dentro del Container)

```jsx
<div style={{
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)'
}}>
  {/* Contenido del card */}
</div>
```

### Botones Primarios

```jsx
<button style={{
  backgroundColor: 'var(--color-primary)',
  color: '#FFFFFF',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '15px',
  boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)',
  transition: 'all 0.2s ease'
}}>
  Acción Principal
</button>
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Tablets pequeñas */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
```

### Container Card Responsive

```jsx
<div className="mx-auto my-8" style={{ 
  maxWidth: '1024px',      // Desktop
  width: '100%',           // Mobile: ocupa todo
  backgroundColor: '#FFFBF7',
  borderRadius: '32px',    // Desktop: muy redondeado
  // Mobile: considera reducir a 16px si es necesario
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  overflow: 'hidden'
}}>
```

---

## 🔄 Patrones de Implementación

### Patrón 1: Página Simple

```jsx
function MiPagina() {
  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
         style={{ backgroundColor: '#F5F5F5' }}>
      <div className="mx-auto my-8" style={{ 
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="px-8 py-8" style={{
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '36px',
            fontWeight: 400,
            color: '#1F2937',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>Título</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: '#6B7280',
            opacity: 0.9,
          }}>Descripción</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Tu contenido aquí */}
        </div>
      </div>
    </div>
  );
}
```

### Patrón 2: Página con Header Visual

```jsx
function MiPaginaConImagen() {
  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
         style={{ backgroundColor: '#F5F5F5' }}>
      <div className="mx-auto my-8" style={{ 
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        {/* Header con imagen */}
        <header className="relative overflow-hidden" style={{
          height: '240px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div className="absolute inset-0">
            <img 
              src="/hero-image.png"
              alt="Hero" 
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
              zIndex: 2,
            }} />
          </div>
          
          <div className="relative z-10 h-full flex items-center px-8">
            <div className="max-w-lg">
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '36px',
                fontWeight: 400,
                color: '#FFFFFF',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>Título sobre imagen</h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '17px',
                color: '#FFFFFF',
                opacity: 0.95,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}>Subtítulo</p>
            </div>
          </div>
        </header>

        {/* Sections */}
        <section className="px-6 py-6">
          {/* Contenido */}
        </section>
      </div>
    </div>
  );
}
```

---

## ⚠️ Errores Comunes a Evitar

### ❌ NO HACER

```jsx
// ❌ Usar variables CSS para el container beige
<div style={{ backgroundColor: 'var(--color-surface)' }}>

// ❌ Usar clases Tailwind para el container principal
<div className="bg-white rounded-lg shadow-lg">

// ❌ No seguir la estructura de layout
<div className="container mx-auto">

// ❌ Estilos inline mezclados con clases
<h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>
```

### ✅ HACER

```jsx
// ✅ Colores específicos hardcodeados para el container
<div style={{ backgroundColor: '#FFFBF7' }}>

// ✅ Estructura completa del layout
<div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
     style={{ backgroundColor: '#F5F5F5' }}>

// ✅ Estilos inline para tipografía custom
<h1 style={{
  fontFamily: "'Playfair Display', serif",
  fontSize: '36px',
  fontWeight: 400,
  color: '#1F2937'
}}>
```

---

## 🎯 Checklist de Implementación

Al crear/actualizar una página, verifica:

- [ ] Fondo exterior gris `#F5F5F5`
- [ ] Container beige `#FFFBF7` centrado con max-width 1024px
- [ ] Border-radius 32px en el container
- [ ] Box-shadow grande y suave
- [ ] Header con fuente Playfair Display 36px
- [ ] Subtítulo con fuente DM Sans 17px
- [ ] Padding correcto: `px-8 py-8` en header, `px-6 py-6` en secciones
- [ ] Separador del header con `borderBottom: '1px solid rgba(0,0,0,0.06)'`
- [ ] Estructura responsive con grids
- [ ] Sin mezcla de clases CSS y estilos inline en elementos de diseño

---

## 📚 Referencias

- **Páginas de referencia perfectas:** `HomePage2.jsx`, `Landing2.jsx`
- **Variables CSS globales:** `apps/main-app/src/index.css`
- **Componentes de ejemplo:** `apps/main-app/src/components/dashboard/`

---

## 🔧 Herramientas de Desarrollo

### Snippet VSCode para nuevo layout

```json
{
  "Planivia Page Layout": {
    "prefix": "planivia-layout",
    "body": [
      "<div className=\"relative flex flex-col min-h-screen pb-20 overflow-y-auto\" style={{ backgroundColor: '#F5F5F5' }}>",
      "  <div className=\"mx-auto my-8\" style={{ ",
      "    maxWidth: '1024px',",
      "    width: '100%',",
      "    backgroundColor: '#FFFBF7',",
      "    borderRadius: '32px',",
      "    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',",
      "    overflow: 'hidden'",
      "  }}>",
      "    {/* Header */}",
      "    <div className=\"px-8 py-8\" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>",
      "      <h1 style={{ fontFamily: \"'Playfair Display', serif\", fontSize: '36px', fontWeight: 400, color: '#1F2937', marginBottom: '8px', letterSpacing: '-0.01em' }}>$1</h1>",
      "      <p style={{ fontFamily: \"'DM Sans', sans-serif\", fontSize: '17px', color: '#6B7280', opacity: 0.9 }}>$2</p>",
      "    </div>",
      "    ",
      "    {/* Content */}",
      "    <div className=\"px-6 py-6\">",
      "      $0",
      "    </div>",
      "  </div>",
      "</div>"
    ]
  }
}
```

---

**Última revisión:** 30 de diciembre de 2024  
**Mantenido por:** Equipo de Desarrollo Planivia
