# Guía de Implementación de Estilos - Planivia

**Para:** Desarrolladores y AI Assistants  
**Propósito:** Aplicar el sistema de diseño de forma consistente en cualquier página

---

## 🚀 Inicio Rápido

### Opción 1: Usar Componentes de Layout (RECOMENDADO)

```jsx
import { PageLayout, PageSection } from '../components/layouts';

function MiPagina() {
  return (
    <PageLayout 
      title="Mi Página" 
      subtitle="Descripción de la página"
      icon="🎯"
    >
      <PageSection>
        {/* Tu contenido aquí */}
      </PageSection>
    </PageLayout>
  );
}
```

### Opción 2: Implementación Manual

```jsx
function MiPagina() {
  return (
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
          }}>🎯 Mi Página</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: '#6B7280',
            opacity: 0.9,
          }}>Descripción</p>
        </div>

        <div className="px-6 py-6">
          {/* Tu contenido */}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Ejemplos Prácticos

### Ejemplo 1: Página Simple con Cards

```jsx
import { PageLayout, PageSection } from '../components/layouts';

function GestionTareas() {
  return (
    <PageLayout 
      title="Gestión de Tareas" 
      subtitle="Organiza todas las actividades de tu boda"
      icon="✅"
    >
      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#1F2937',
              marginBottom: '12px' 
            }}>
              Tareas Pendientes
            </h3>
            {/* Contenido del card */}
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
}
```

### Ejemplo 2: Página con Header Visual

```jsx
import { PageLayout, PageSection } from '../components/layouts';

function Inspiracion() {
  return (
    <PageLayout 
      title="Inspiración" 
      subtitle="Ideas y tendencias para tu boda"
      icon="✨"
      headerImage="/hero-inspiration.png"
      headerImageAlt="Wedding inspiration"
    >
      <PageSection>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Galería de imágenes */}
        </div>
      </PageSection>

      <PageSection>
        {/* Más contenido */}
      </PageSection>
    </PageLayout>
  );
}
```

### Ejemplo 3: Página con Múltiples Secciones

```jsx
import { PageLayout, PageSection } from '../components/layouts';

function Proveedores() {
  return (
    <PageLayout 
      title="Proveedores" 
      subtitle="Encuentra los mejores profesionales"
      icon="🎪"
    >
      {/* KPIs */}
      <PageSection>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* KPI Cards */}
        </div>
      </PageSection>

      {/* Búsqueda */}
      <PageSection>
        <input 
          type="text" 
          placeholder="Buscar proveedores..."
          className="w-full px-4 py-3 rounded-xl border"
          style={{ 
            borderColor: 'rgba(0,0,0,0.1)',
            backgroundColor: '#FFFFFF'
          }}
        />
      </PageSection>

      {/* Resultados */}
      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cards de proveedores */}
        </div>
      </PageSection>
    </PageLayout>
  );
}
```

---

## 🎨 Patrones de Componentes Comunes

### Card Interior

```jsx
<div style={{
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)'
}}>
  {/* Contenido */}
</div>
```

### Botón Primario

```jsx
<button style={{
  backgroundColor: '#60A5FA',
  color: '#FFFFFF',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '15px',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)',
  transition: 'all 0.2s ease'
}}>
  Acción Principal
</button>
```

### Botón Secundario

```jsx
<button style={{
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '15px',
  border: '1px solid rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}}>
  Acción Secundaria
</button>
```

### Input de Formulario

```jsx
<input 
  type="text"
  placeholder="Escribe aquí..."
  style={{
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: '15px',
    color: '#1F2937'
  }}
/>
```

### Badge/Tag

```jsx
<span style={{
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '8px',
  backgroundColor: 'rgba(96, 165, 250, 0.15)',
  color: '#60A5FA',
  fontSize: '13px',
  fontWeight: 600
}}>
  Etiqueta
</span>
```

---

## 🔄 Migrando Páginas Existentes

### Paso 1: Identificar el Layout Actual

```jsx
// ❌ Layout antiguo
<div className="container mx-auto py-6">
  <h1 className="text-3xl font-bold mb-4">Título</h1>
  <div>{/* contenido */}</div>
</div>
```

### Paso 2: Envolver con PageLayout

```jsx
// ✅ Nuevo layout
import { PageLayout, PageSection } from '../components/layouts';

<PageLayout title="Título" subtitle="Descripción">
  <PageSection>
    {/* contenido */}
  </PageSection>
</PageLayout>
```

### Paso 3: Actualizar Componentes Internos

```jsx
// ❌ Antes
<div className="bg-white rounded-lg shadow p-4">
  {/* contenido */}
</div>

// ✅ Después
<div style={{
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)'
}}>
  {/* contenido */}
</div>
```

---

## ⚠️ Errores Comunes y Soluciones

### Error 1: Usar variables CSS en el container

```jsx
// ❌ MAL
<div style={{ backgroundColor: 'var(--color-surface)' }}>

// ✅ BIEN
<div style={{ backgroundColor: '#FFFBF7' }}>
```

**Por qué:** El color beige `#FFFBF7` es específico del container card y no debe usar variables CSS.

### Error 2: Mezclar Tailwind con estilos inline

```jsx
// ❌ MAL
<h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>

// ✅ BIEN - Todo en estilos inline para títulos custom
<h1 style={{
  fontFamily: "'Playfair Display', serif",
  fontSize: '36px',
  fontWeight: 400,
  color: '#1F2937'
}}>
```

**Por qué:** La tipografía custom requiere estilos inline completos.

### Error 3: Olvidar el fondo exterior

```jsx
// ❌ MAL - Solo el container beige
<div style={{ backgroundColor: '#FFFBF7' }}>

// ✅ BIEN - Fondo beige suave + container beige cálido
<div style={{ backgroundColor: '#EDE8E0' }}>
  <div style={{ backgroundColor: '#FFFBF7' }}>
```

**Por qué:** El contraste sutil entre el fondo beige suave y el container beige cálido es esencial para el diseño.

### Error 4: Border-radius incorrecto

```jsx
// ❌ MAL
<div style={{ borderRadius: '8px' }}>

// ✅ BIEN
<div style={{ borderRadius: '32px' }}>
```

**Por qué:** El container principal usa 32px para un look más suave y premium.

---

## 📐 Referencia de Medidas

| Elemento | Medida | Uso |
|----------|--------|-----|
| Container max-width | `1024px` | Ancho máximo del contenedor principal |
| Container border-radius | `32px` | Bordes redondeados del container |
| Header padding | `px-8 py-8` | Padding del header |
| Section padding | `px-6 py-6` | Padding de secciones de contenido |
| Card interior border-radius | `16px` | Cards dentro del container |
| Button border-radius | `12px` | Botones |
| Input border-radius | `12px` | Campos de formulario |
| Badge border-radius | `8px` | Etiquetas pequeñas |

---

## 🎯 Checklist de Migración

Al migrar una página existente:

- [ ] Importar `PageLayout` y `PageSection`
- [ ] Envolver contenido con `<PageLayout>`
- [ ] Mover header a props de `PageLayout`
- [ ] Envolver cada sección con `<PageSection>`
- [ ] Actualizar cards interiores con estilos correctos
- [ ] Actualizar botones con estilos nuevos
- [ ] Verificar spacing y padding
- [ ] Probar en desktop y móvil
- [ ] Eliminar clases Tailwind obsoletas

---

## 📚 Referencias

- **Sistema de diseño completo:** `docs/SISTEMA_DISENO_COMPLETO.md`
- **Componentes de layout:** `apps/main-app/src/components/layouts/`
- **Páginas de ejemplo:** `HomePage2.jsx`, `Finance.jsx`, `Landing2.jsx`

---

## 🤖 Para AI Assistants

Cuando te pidan aplicar el estilo del proyecto:

1. **Lee esta guía y** `docs/SISTEMA_DISENO_COMPLETO.md`
2. **Usa el componente `PageLayout`** siempre que sea posible
3. **No uses variables CSS** para `#FFFBF7` ni `#F5F5F5`
4. **Copia los estilos exactos** de esta guía, no inventes valores
5. **Mantén la estructura** de layout completa (fondo gris + container beige)
6. **Verifica** que todos los elementos tengan los estilos correctos

**Template rápido:**
```jsx
import { PageLayout, PageSection } from '../components/layouts';

export default function MiPagina() {
  return (
    <PageLayout title="Título" subtitle="Descripción" icon="🎯">
      <PageSection>
        {/* Contenido */}
      </PageSection>
    </PageLayout>
  );
}
```

---

**Última actualización:** 30 de diciembre de 2024  
**Versión:** 1.0
