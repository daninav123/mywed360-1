# 🔧 Fix: Bucle Infinito en Supplier Portfolio

**Fecha**: 2025-01-03  
**Problema**: La página `/supplier/dashboard/:id/portfolio` se recargaba continuamente  
**Causa**: Bucle infinito de re-renders por dependencias inestables en hooks

---

## 🔴 PROBLEMA

### Síntoma

La página del portfolio del proveedor se recargaba continuamente, imposibilitando su uso.

### Causa Raíz

Similar al problema resuelto en `SupplierDashboard`, el componente `SupplierPortfolio` tenía un bucle infinito causado por:

1. **`loadPhotos` dependía de `t`** (función de traducción)
2. **`t` se recrea en cada render** de `useTranslations()`
3. **`useEffect` ejecuta `loadPhotos`** cuando cambia
4. **Esto causa un nuevo render** → vuelve a paso 1

```javascript
// ❌ ANTES - Causa bucle infinito
const loadPhotos = useCallback(async () => {
  // ...código...
  toast.error(t('suppliers.portfolio.toasts.loadError'));
}, [navigate, selectedCategory, t]); // ❌ t cambia en cada render

useEffect(() => {
  loadPhotos();
}, [loadPhotos]); // ❌ loadPhotos se recrea constantemente
```

---

## ✅ SOLUCIÓN

### Cambios Realizados en `SupplierPortfolio.jsx`

#### 1. Añadir `useRef` al import

```javascript
// Antes:
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Después:
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
```

#### 2. Crear ref para `t`

```javascript
export default function SupplierPortfolio() {
  const { t, tPlural, format } = useTranslations();

  // ✅ NUEVO: Usar ref para t
  const tRef = useRef(t);
  tRef.current = t;

  // ...resto del código
}
```

#### 3. Usar `tRef.current` en `loadPhotos`

```javascript
// ✅ DESPUÉS - Solución
const loadPhotos = useCallback(async () => {
  try {
    // ...código...
  } catch (error) {
    console.error('[SupplierPortfolio] load error', error);
    toast.error(tRef.current('suppliers.portfolio.toasts.loadError')); // ✅ Usa tRef
  }
}, [navigate, selectedCategory]); // ✅ Sin 't' en dependencias
```

#### 4. Simplificar el useEffect

```javascript
// ✅ DESPUÉS - Solo depende de selectedCategory
useEffect(() => {
  loadPhotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedCategory]); // ✅ Solo recarga cuando cambia la categoría
```

---

## 📊 COMPARACIÓN

### Antes (Bucle Infinito)

```
1. Componente renderiza
2. useTranslations() devuelve nuevo 't'
3. loadPhotos se recrea (depende de 't')
4. useEffect detecta cambio en loadPhotos
5. Ejecuta loadPhotos
6. loadPhotos actualiza estado
7. Volver a paso 1 → BUCLE INFINITO
```

### Después (Estable)

```
1. Componente renderiza
2. useTranslations() devuelve nuevo 't'
3. tRef.current = t (actualiza ref sin causar re-render)
4. loadPhotos NO se recrea (no depende de 't')
5. useEffect NO se ejecuta (loadPhotos no cambió)
6. ✅ NO HAY BUCLE
```

---

## 🧪 VERIFICACIÓN

### Cómo Probar

1. Navega a: `http://localhost:5173/supplier/dashboard/:id/portfolio`
2. Verifica que la página carga **una sola vez**
3. Cambia la categoría en el filtro
4. Verifica que **solo recarga** cuando cambias la categoría
5. **NO debe recargar continuamente**

### Comportamiento Esperado

- ✅ Carga inicial: **1 request** a la API
- ✅ Cambio de categoría: **1 request** adicional
- ✅ Sin cambios: **0 requests** (no recarga)

---

## 📝 ARCHIVOS MODIFICADOS

### `src/pages/suppliers/SupplierPortfolio.jsx`

**Líneas modificadas**:

- Línea 1: Añadido `useRef` al import
- Líneas 29-31: Creado `tRef` y asignación
- Línea 94: Cambiado `t()` por `tRef.current()`
- Línea 98: Removido `t` de dependencias de `loadPhotos`
- Líneas 100-103: Simplificado useEffect

---

## 🎯 PATRÓN DE SOLUCIÓN

Este es el **mismo patrón** usado en otros componentes:

### Componentes Corregidos con este Patrón

1. ✅ **SupplierDashboard.jsx** (sesión anterior)
2. ✅ **SupplierPortfolio.jsx** (esta sesión)

### Cuándo Usar Esta Solución

Usa este patrón cuando:

- ✅ Un `useCallback` depende de funciones de hooks inestables (`t`, `format`, etc.)
- ✅ Un `useEffect` ejecuta la función del `useCallback`
- ✅ Observas que la página se recarga continuamente

### Patrón de Implementación

```javascript
// 1. Importar useRef
import React, { useRef, useCallback, useEffect } from 'react';

// 2. Crear ref para función inestable
const { t } = useTranslations();
const tRef = useRef(t);
tRef.current = t;

// 3. Usar ref en lugar de la función directa
const myFunction = useCallback(async () => {
  // Usar tRef.current en lugar de t
  console.log(tRef.current('my.key'));
}, []); // Sin 't' en dependencias

// 4. useEffect sin la función en dependencias
useEffect(() => {
  myFunction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // O solo las dependencias realmente necesarias
```

---

## 🚀 IMPACTO

### Antes

- ❌ Página inutilizable (recarga continua)
- ❌ Múltiples requests innecesarios a la API
- ❌ Mal rendimiento
- ❌ Experiencia de usuario pésima

### Después

- ✅ Página funcional y estable
- ✅ Solo recarga cuando es necesario
- ✅ Buen rendimiento
- ✅ Experiencia de usuario correcta

---

## 📚 REFERENCIAS

- Solución similar: `FIX-SUPPLIER-DASHBOARD-INFINITE-LOOP.md`
- React Docs: [useRef](https://react.dev/reference/react/useRef)
- React Docs: [useCallback](https://react.dev/reference/react/useCallback)

---

## ✅ ESTADO

**Fix Implementado**: ✅ Completado  
**Testing**: ✅ Verificado  
**Documentación**: ✅ Completa  
**Commit**: ⏳ Pendiente (git lock)

---

**Autor**: Cascade AI  
**Revisión**: Pendiente
