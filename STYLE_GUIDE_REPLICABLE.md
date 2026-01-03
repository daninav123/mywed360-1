# 🎨 Guía de Estilo Replicable - MyWed360

**⭐ REFERENCIA OFICIAL:** Finance.jsx  
**Última actualización:** Enero 2026

---

## ⚠️ REGLA #1: NO botones flotantes

**❌ NUNCA hacer esto:**
```jsx
{/* MAL - botones flotantes sobre el header */}
<div className="absolute top-4 right-4">
  <LanguageSelector />
  <UserMenu />
</div>
```

**✅ Correcto:** El selector de idioma y menú de usuario van dentro del `<Nav />` component en la parte inferior, NO flotantes.

---

## 🎯 Patrón Estándar: Full-Screen Layout

### Estructura Base (Finance.jsx)

**COPIAR EXACTAMENTE esta estructura:**

```jsx
export default function MiPagina() {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('tab1');
  
  return (
    <>
      {/* 1. Contenedor exterior beige */}
      <div 
        className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
        style={{ backgroundColor: '#EDE8E0' }}
      >
        
        {/* 2. Contenedor blanco centrado - ESPECIFICACIONES EXACTAS */}
        <div 
          className="mx-auto my-8" 
          style={{
            maxWidth: '1024px',        // EXACTO - no cambiar
            width: '100%',
            backgroundColor: '#FFFBF7', // EXACTO - beige muy claro
            borderRadius: '32px',       // EXACTO - esquinas muy redondeadas
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', // EXACTO
            overflow: 'hidden'
          }}
        >
          
          {/* 3. Header con degradado beige-dorado - ESPECIFICACIONES EXACTAS */}
          <header 
            className="relative overflow-hidden" 
            style={{
              background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)', // EXACTO
              padding: '48px 32px 32px', // EXACTO - más top que bottom
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', // EXACTO - sombra muy sutil
            }}
          >
            <div className="max-w-4xl" style={{ textAlign: 'center' }}>
              
              {/* Título con líneas decorativas - EXACTO como Finance */}
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
                  fontSize: '40px',    // EXACTO
                  fontWeight: 400,     // EXACTO - light
                  color: '#1F2937',    // EXACTO - gris oscuro
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>
                  Mi Página
                </h1>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to left, transparent, #D4A574)',
                }} />
              </div>
              
              {/* Subtítulo uppercase - EXACTO como Finance */}
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '11px',     // EXACTO - muy pequeño
                fontWeight: 600,      // EXACTO - semi-bold
                color: '#9CA3AF',     // EXACTO - gris medio
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '32px', // EXACTO - espacio para tabs si existen
              }}>
                GESTIÓN DE BODA
              </p>
              
              {/* Tabs Pills (opcional si hay navegación) */}
              <div style={{ 
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {['Tab 1', 'Tab 2'].map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(`tab${i+1}`)}
                    style={{
                      fontFamily: "'DM Sans', 'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: activeTab === `tab${i+1}` ? 600 : 500,
                      padding: '10px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: activeTab === `tab${i+1}` ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      color: activeTab === `tab${i+1}` ? '#1F2937' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: activeTab === `tab${i+1}` ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== `tab${i+1}`) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.75)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== `tab${i+1}`) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                      }
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
            </div>
          </header>

          {/* 4. Contenido principal - ESPECIFICACIONES EXACTAS */}
          <section className="px-6 py-6">
            
            {/* Grid de 3 columnas para metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Ver sección "Cards con Color Temático" más abajo */}
            </div>
            
            {/* Contenido adicional */}
            <Card className="space-y-4">
              <h2 className="text-xl font-bold text-body mb-4">Sección</h2>
              <p className="text-sm text-secondary">Contenido...</p>
            </Card>
            
          </section>

        </div>
        {/* Fin contenedor blanco */}
      </div>
      {/* Fin contenedor beige */}
      
      {/* 5. Bottom Navigation - SIEMPRE al final */}
      <Nav />
    </>
  );
}
```

---

## 📦 Componentes de Contenido

### Cards Blancos (contenido general)
```jsx
<Card className="space-y-4">
  <h2 className="text-xl font-bold text-body">Título</h2>
  <p className="text-sm text-secondary">Descripción</p>
</Card>
```

### Metric Cards (KPIs) - EXACTO como Finance

**ESPECIFICACIONES EXACTAS:**
- Border-radius: `20px` (NO 16px, NO 24px)
- Box-shadow: `0 2px 8px rgba(0,0,0,0.04)` (muy sutil)
- Border: `1px solid #EEF2F7` (casi invisible)
- Padding: `24px` (generoso)
- Barra inferior: 4px de altura, opacity 0.6

**Beige-dorado (Total Budget, Countdown):**
```jsx
<div style={{
  backgroundColor: '#FFF4E6',
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #EEF2F7',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#D4A574',
    opacity: 0.6,
  }} />
  <div className="space-y-1">
    <h3 style={{
      color: '#D4A574',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>LABEL</h3>
    <p className="text-3xl font-bold" style={{ color: '#D4A574' }}>
      Valor
    </p>
  </div>
</div>
```

**Rosa-mauve (para métricas secundarias):**
```jsx
<div style={{
  backgroundColor: '#FFF5F7',
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #EEF2F7',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#D4A5B4',
    opacity: 0.6,
  }} />
  <div className="space-y-1">
    <h3 style={{
      color: '#D4A5B4',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>LABEL</h3>
    <p className="text-3xl font-bold" style={{ color: '#D4A5B4' }}>
      Valor
    </p>
  </div>
</div>
```

**Verde-sage (para positivos):**
```jsx
<div style={{
  backgroundColor: '#F0F7F4',
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #EEF2F7',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#7AB88F',
    opacity: 0.6,
  }} />
  <div className="space-y-1">
    <h3 style={{
      color: '#7AB88F',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>LABEL</h3>
    <p className="text-3xl font-bold" style={{ color: '#7AB88F' }}>
      Valor
    </p>
  </div>
</div>
```

### Tabs en Header (Estilo Pills)
```jsx
{/* Dentro del <header> */}
<div style={{ 
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  flexWrap: 'wrap'
}}>
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      style={{
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: activeTab === tab.id ? 600 : 500,
        padding: '10px 24px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
        color: activeTab === tab.id ? '#1F2937' : '#6B7280',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab.id) {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.75)';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab.id) {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
        }
      }}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

## 🎨 Clases CSS para Contenido Interior

Dentro del `<section className="px-6 py-6">`:

### Textos
```jsx
<h2 className="text-xl font-bold text-body">Título sección</h2>
<p className="text-sm text-secondary">Descripción</p>
<p className="text-xs text-muted">Nota pequeña</p>
```

### Formularios
```jsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
      Campo
    </label>
    <input 
      type="text"
      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{ borderColor: 'var(--color-border)' }}
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
      Textarea
    </label>
    <textarea 
      className="w-full min-h-[80px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{ borderColor: 'var(--color-border)' }}
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
      Select
    </label>
    <select 
      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <option value="">Selecciona...</option>
    </select>
  </div>
</div>
```

### Botones
```jsx
{/* Primario */}
<button 
  className="px-4 py-2 rounded-lg transition-colors"
  style={{
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
>
  Acción Principal
</button>

{/* Secundario */}
<button 
  className="px-4 py-2 rounded-lg border transition-colors"
  style={{
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
>
  Acción Secundaria
</button>

{/* Success */}
<button 
  className="px-4 py-2 rounded-lg transition-colors"
  style={{
    backgroundColor: 'var(--color-success)',
    color: 'var(--color-on-primary)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
>
  Guardar
</button>

{/* Danger */}
<button 
  className="px-4 py-2 rounded-lg transition-colors"
  style={{
    backgroundColor: 'var(--color-danger)',
    color: 'var(--color-on-primary)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
>
  Eliminar
</button>
```

### Grids y Layout
```jsx
{/* Grid 2 columnas responsive */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>Columna 1</div>
  <div>Columna 2</div>
</div>

{/* Grid 3 columnas para KPIs */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  <div>{/* Card KPI 1 */}</div>
  <div>{/* Card KPI 2 */}</div>
  <div>{/* Card KPI 3 */}</div>
</div>

{/* Stack vertical con espaciado */}
<div className="space-y-6">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

## 🚫 NO HACER

### ❌ No usar layout-container en páginas principales
```jsx
// ❌ MAL
<div className="layout-container-wide py-6">
  <Card>...</Card>
</div>

// ✅ BIEN
<div style={{ backgroundColor: '#EDE8E0' }}>
  <div style={{ maxWidth: '1024px', ... }}>
    <section className="px-6 py-6">
      <Card>...</Card>
    </section>
  </div>
</div>
```

### ❌ No usar page-title en header decorativo
```jsx
// ❌ MAL
<h1 className="page-title">Título</h1>

// ✅ BIEN (dentro del header degradado)
<h1 style={{
  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
  fontSize: '40px',
  fontWeight: 400,
  color: '#1F2937',
  letterSpacing: '-0.01em',
  margin: 0,
}}>Título</h1>
```

### ❌ No usar clases CSS para el wrapper exterior
El wrapper y header SIEMPRE usan inline styles (beige, degradado, etc.)

---

## 📋 Checklist de Implementación

Al crear/refactorizar una página:

- [ ] ❌ **NO hay botones flotantes** (absolute top-4 right-4)
- [ ] ✅ Estructura: `<>` → contenedor beige → contenedor blanco → `<Nav />`
- [ ] ✅ Contenedor beige: `backgroundColor: '#EDE8E0'`
- [ ] ✅ Contenedor blanco: `maxWidth: '1024px'`, `backgroundColor: '#FFFBF7'`, `borderRadius: '32px'`
- [ ] ✅ Header degradado: `linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)`
- [ ] ✅ Header padding: `48px 32px 32px` (más arriba que abajo)
- [ ] ✅ Título: Playfair Display, 40px, weight 400, color `#1F2937`
- [ ] ✅ Líneas decorativas: width 60px, gradiente hacia `#D4A574`
- [ ] ✅ Subtítulo: DM Sans, 11px, weight 600, uppercase, color `#9CA3AF`
- [ ] ✅ Tabs pills (si aplica): dentro del header, blancos/semi-transparentes
- [ ] ✅ Contenido: `<section className="px-6 py-6">`
- [ ] ✅ Metric cards: border-radius 20px, shadow `0 2px 8px rgba(0,0,0,0.04)`
- [ ] ✅ Cards normales: usar `<Card>` component
- [ ] ✅ `<Nav />` al final, FUERA de los contenedores

---

## 🎯 Páginas de Referencia

**⭐ REFERENCIA OFICIAL (copiar exactamente):**
- `Finance.jsx` - **ESTA ES LA PÁGINA MODELO**
  - Header perfecto con degradado
  - Tabs pills correctos
  - Metric cards con colores exactos
  - NO tiene botones flotantes
  - Layout 100% correcto

**✅ También correctas:**
- `Tasks.jsx` - Layout simple similar
- `HomePage.jsx` - Layout con múltiples secciones

**❌ Ejemplos de errores comunes:**
- Botones flotantes sobre el header
- Título sin líneas decorativas
- Subtítulo sin uppercase o sin el color correcto
- Cards sin barra de acento inferior
- Contenedor blanco sin el borderRadius correcto

---

## 💡 Filosofía

1. **Layout estructural** = Inline styles (beige, blanco, degradados)
2. **Contenido interior** = Componentes UI + clases CSS semánticas
3. **Consistencia visual** = Mismo header en todas las páginas principales
4. **Variables CSS** = Para colores que cambian con dark mode
5. **Inline styles** = Para valores fijos (colores hex, layout específico)

---

**Última actualización:** Enero 2026  
**Mantenido por:** Equipo MyWed360
