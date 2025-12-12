# 🎨 Guía de Estilo Visual - MaLoveApp

**Versión:** 1.0  
**Última actualización:** Diciembre 2025

Esta guía define el estilo visual oficial del proyecto basado en las páginas **Home** y **Tasks** como referencia.

---

## 📐 Principios de Diseño

### ✅ USAR SIEMPRE
- **Cards blancos** con sombra suave
- **Colores de variables CSS** (nunca hardcodeados)
- **Tipografía consistente** (text-2xl md:text-3xl para títulos principales)
- **Espaciado estándar** (p-4 md:p-6 para padding principal)
- **Sombras sutiles** (shadow-md)

### ❌ NUNCA USAR
- Degradados (`bg-gradient-to-*`)
- Efectos blur (`blur-3xl`)
- Colores hardcodeados (#fff, #000, etc.)
- Efectos hover excesivos (scale, translate grandes)
- Fondos de colores vivos en cards principales

---

## 🎨 Variables CSS Oficiales

### Colores Base
```css
--color-bg: #f7f1e7           /* Fondo beige de la app */
--color-surface: #ffffff       /* Fondo de cards */
--color-text: #1f2937          /* Texto principal */
--color-primary: #5ebbff       /* Color primario (azul) */
--color-accent: #5ebbff        /* Color de acento */
```

### Colores de Estado
```css
--color-success: #22c55e       /* Verde - estado positivo */
--color-warning: #f59e0b       /* Naranja - alertas */
--color-danger: #ef4444        /* Rojo - errores/crítico */
--color-info: #0ea5e9          /* Azul info */
```

### Colores Derivados
```css
--color-border: rgba(31, 41, 55, 0.14)
--color-muted: rgba(31, 41, 55, 0.72)
```

### Layout
```css
--layout-max-width: 1120px
--layout-wide-width: 1280px
--layout-padding: clamp(16px, 4vw, 32px)
```

---

## 📦 Componentes Estándar

### 1. **Card Blanco Estándar**
```jsx
<div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[color:var(--color-text)]/10 p-6">
  {/* Contenido */}
</div>
```

**Cuándo usar:** Para cualquier sección o contenido agrupado.

---

### 2. **Layout de Página**
```jsx
// Patrón estándar (como Dashboard y Tasks)
<div className="p-4 md:p-6 max-w-7xl mx-auto">
  {/* Header */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Título</h1>
      <p className="text-gray-500 mt-1">Subtítulo descriptivo</p>
    </div>
  </div>
  
  {/* Contenido */}
  <div className="space-y-6">
    {/* Cards y componentes */}
  </div>
</div>
```

**Características:**
- ✅ `p-4 md:p-6` - Padding responsivo
- ✅ `max-w-7xl mx-auto` - Ancho máximo centrado
- ✅ `space-y-6` - Espaciado vertical entre elementos

---

### 3. **Título de Página**
```jsx
<h1 className="text-2xl md:text-3xl font-bold text-gray-800">
  Título de la Página
</h1>
<p className="text-gray-500 mt-1">
  Descripción breve
</p>
```

**Tipografía:**
- Título: `text-2xl md:text-3xl font-bold text-gray-800`
- Subtítulo: `text-gray-500 mt-1`

---

### 4. **Cards con Color de Estado**
Solo para indicadores, NO para cards principales:

```jsx
{/* Correcto - Fondo sutil al 10% */}
<div className="p-4 rounded-xl bg-[var(--color-success)]/10 border border-[color:var(--color-success)]/30">
  <p className="text-[color:var(--color-success)]">Estado OK</p>
</div>

{/* INCORRECTO - Degradados y blur */}
<div className="bg-gradient-to-br from-green-500/20 via-green-500/5 to-transparent blur-3xl">
  ❌ NO USAR
</div>
```

---

### 5. **Botones Estándar**
```jsx
{/* Botón primario */}
<button className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors">
  Acción Principal
</button>

{/* Botón secundario */}
<button className="border border-pink-500 text-pink-600 px-4 py-2 rounded-md hover:bg-pink-50 transition-colors">
  Acción Secundaria
</button>
```

---

## 🚫 Anti-Patrones (NO USAR)

### ❌ Degradados Complejos
```jsx
// NO USAR
<div className="bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent backdrop-blur-xl">
  ❌ Demasiado complejo
</div>
```

### ❌ Efectos Blur
```jsx
// NO USAR
<div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20" />
```

### ❌ Colores Hardcodeados
```jsx
// NO USAR
<div className="bg-white text-black border-gray-200">
  ❌ Usar variables CSS
</div>

// USAR
<div className="bg-[var(--color-surface)] text-[color:var(--color-text)] border-[color:var(--color-text)]/10">
  ✅ Correcto
</div>
```

### ❌ Efectos Hover Excesivos
```jsx
// NO USAR
<div className="hover:scale-110 hover:-translate-y-2 hover:shadow-2xl">
  ❌ Demasiado movimiento
</div>

// USAR
<div className="hover:shadow-lg transition-shadow">
  ✅ Sutil
</div>
```

---

## 📋 Checklist de Componente

Antes de crear o modificar un componente, verifica:

- [ ] ¿Usa `bg-[var(--color-surface)]` para fondos blancos?
- [ ] ¿Usa `shadow-md` en lugar de `shadow-2xl`?
- [ ] ¿Usa `rounded-xl` consistentemente?
- [ ] ¿Los colores usan variables CSS o clases utility?
- [ ] ¿El padding es `p-6` o `p-4 md:p-6`?
- [ ] ¿Evita degradados (`bg-gradient-*`)?
- [ ] ¿Evita efectos blur (`blur-*`)?
- [ ] ¿Los títulos usan `text-2xl md:text-3xl font-bold text-gray-800`?
- [ ] ¿El espaciado vertical usa `space-y-6`?
- [ ] ¿Los bordes usan `border border-[color:var(--color-text)]/10`?

---

## 🎯 Páginas de Referencia

### ✅ ESTILO CORRECTO
- **Dashboard (Home)** - `apps/main-app/src/pages/Dashboard.jsx`
- **Tasks** - `apps/main-app/src/pages/Tasks.jsx`

### 🔧 Necesitan Actualización
- Finance (tiene degradados y blur)
- Proveedores (verificar consistencia)
- Invitados (verificar consistencia)
- Otras páginas secundarias

---

## 📐 Clases Utility Personalizadas

```css
/* Ya disponibles en index.css */
.bg-surface         /* bg-[var(--color-surface)] */
.text-body          /* color: var(--color-text) */
.text-muted         /* color: var(--color-muted) */
.border-soft        /* border-color: var(--color-border) */
.bg-primary         /* background: var(--color-primary) */
```

---

## 🔄 Proceso de Estandarización

1. **Auditar página**
   - Revisar si usa degradados o blur
   - Verificar colores hardcodeados
   - Comprobar estructura de layout

2. **Aplicar plantilla estándar**
   ```jsx
   <div className="p-4 md:p-6 max-w-7xl mx-auto">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
       <div>
         <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
         <p className="text-gray-500 mt-1">{subtitle}</p>
       </div>
     </div>
     <div className="space-y-6">
       {/* Cards blancos con shadow-md */}
     </div>
   </div>
   ```

3. **Convertir cards**
   - Eliminar `bg-gradient-*`
   - Eliminar efectos `blur-*`
   - Aplicar `bg-[var(--color-surface)] rounded-xl shadow-md border border-[color:var(--color-text)]/10`

4. **Revisar colores**
   - Reemplazar hardcoded por variables
   - Mantener colores de estado solo en indicadores (al 10% de opacidad)

---

## 💡 Ejemplos Prácticos

### Antes ❌
```jsx
<Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-transparent backdrop-blur-xl border-2 shadow-2xl">
  <div className="absolute -top-32 w-96 h-96 rounded-full blur-3xl opacity-20" style={{backgroundColor: '#0ea5e9'}} />
  <h2 style={{color: '#1f2937'}}>Título</h2>
</Card>
```

### Después ✅
```jsx
<Card className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[color:var(--color-text)]/10 p-6">
  <h2 className="text-xl font-bold text-gray-800">Título</h2>
</Card>
```

---

## 📞 Contacto

Si tienes dudas sobre el estilo, consulta:
1. Esta guía
2. Los componentes de Dashboard y Tasks
3. El archivo `index.css` para variables disponibles

**Última regla:** Si algo no está en Home o Tasks, probablemente no deberías usarlo.
