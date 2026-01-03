# 🎨 Estándar de Diseño de Tarjetas

Este documento define el estilo oficial de tarjetas (cards) usado en el proyecto, basado en las páginas **Home** y **Finance (Budget)** que son las referencias de diseño aprobadas.

## 📐 Especificaciones Base

### Estructura CSS
```css
{
  backgroundColor: '[Color específico según tipo]',
  borderRadius: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #EEF2F7',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}
```

### Barra Decorativa Inferior
```css
{
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '4px',
  backgroundColor: '[Color del acento]',
  opacity: 0.6,
}
```

### Título (Header)
```css
{
  color: '[Color del acento]',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: "'DM Sans', 'Inter', sans-serif",
}
```

### Valor Principal
```css
className="text-3xl font-bold"
style={{ color: '[Color del acento]' }}
```

## 🎨 Paleta de Colores por Tipo

### Dorado/Beige (Budget/Countdown)
- **Fondo**: `#FFF4E6`
- **Acento**: `#D4A574`
- **Uso**: Presupuesto total, cuenta regresiva

### Rosa (Gastos/Romántico)
- **Fondo**: `#FCE4EC`
- **Acento**: `#C97C8F`
- **Uso**: Gastos, datos relacionados con gastos

### Verde (Disponible/Positivo)
- **Fondo**: `#E8F5E9`
- **Acento**: `#4A9B5F`
- **Uso**: Presupuesto disponible, datos positivos, categorías activas

### Azul (Neutral/Información)
- **Fondo**: `#E8F4FD`
- **Acento**: `#5EBBFF`
- **Uso**: Total de transacciones, información general

### Naranja (Advertencia/Eficiencia)
- **Fondo**: `#FFF3E0`
- **Acento**: `#FF9800`
- **Uso**: Eficiencia, advertencias suaves

### Morado (Balance/Proyección)
- **Fondo**: `#F3E5F5`
- **Acento**: `#AB47BC`
- **Uso**: Balance proyectado, análisis

### Rojo (Peligro/Negativo)
- **Fondo**: `#FFF0F0`
- **Acento**: `#E57373`
- **Uso**: Sobre presupuesto, valores negativos

## 📦 Componente MetricCard

El componente `MetricCard.jsx` implementa este estándar:

```jsx
<MetricCard
  title="Título"
  bgColor="#FFF4E6"
  textColor="#D4A574"
  valueColor="#D4A574"
  accentColor="#D4A574"
>
  {/* Contenido personalizado */}
</MetricCard>
```

## ✅ Dónde se Usa Correctamente

- ✅ **Home** - Todas las tarjetas de métricas
- ✅ **Finance > Budget** - Tarjetas KPI (Total, Spent, Available)
- ✅ **Finance > Analytics** - Tarjetas de estadísticas (acabado de aplicar)

## 📍 Espaciado Estándar

### Grid de Tarjetas
```jsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  {/* Tarjetas */}
</div>
```

### Secciones
```jsx
<section className="px-6 py-6">
  {/* Contenido */}
</section>
```

## 🚫 NO Hacer

- ❌ Usar otros border-radius que no sean 20px
- ❌ Cambiar el padding de 24px
- ❌ Omitir la barra decorativa inferior
- ❌ Usar otros colores que no estén en la paleta
- ❌ Cambiar la tipografía DM Sans
- ❌ No mantener el uppercase en títulos
- ❌ Usar otras sombras diferentes

## 📝 Ejemplo Completo

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
  {/* Barra decorativa */}
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#D4A574',
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
    }}>
      Total Budget
    </h3>
    <p className="text-3xl font-bold" style={{ color: '#D4A574' }}>
      5.000 €
    </p>
  </div>
</div>
```

## 🔄 Aplicación Futura

Cualquier nueva tarjeta de métricas/estadísticas debe seguir este estándar exactamente para mantener la coherencia visual del proyecto.
