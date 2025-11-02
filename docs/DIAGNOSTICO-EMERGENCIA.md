# 🚨 DIAGNÓSTICO DE EMERGENCIA - NAVEGADOR COLGADO

## ⚡ PROBLEMA REPORTADO

El navegador se cuelga y ralentiza todo el ordenador.

---

## 🔍 HERRAMIENTA DE DIAGNÓSTICO AUTOMÁTICA

Se ha implementado una herramienta que detecta en tiempo real:

- ✅ Intervals no limpiados (causa principal de colgamientos)
- ✅ Timeouts acumulados
- ✅ Re-renders excesivos
- ✅ Uso de memoria
- ✅ Listeners de Firebase activos

---

## 📋 CÓMO USAR

### 1️⃣ **Abrir consola del navegador**

```
Presiona F12 o Ctrl+Shift+I
```

### 2️⃣ **Ver reporte automático**

El diagnóstico se inicia automáticamente 5 segundos después de cargar la app.

Cada 10 segundos verás en consola:

```
📊 REPORTE DE RENDIMIENTO
🔄 INTERVALS: { total: X, activos: X }
⏰ TIMEOUTS: { total: X, activos: X }
🎨 RENDERS: { total: X }
💾 MEMORIA: { usedJSHeapSize: 'X MB' }
```

### 3️⃣ **Generar reporte manual**

En cualquier momento, escribe en consola:

```javascript
window.__performanceDiagnostic__.report();
```

### 4️⃣ **Ver detalles de intervals activos**

Para ver qué intervals están ejecutándose y de dónde vienen:

```javascript
window.__performanceDiagnostic__.getActiveIntervals();
```

Esto mostrará:

```javascript
[
  [
    id,
    {
      edad: '15.3s',
      delay: '1000ms',
      origen: 'at HomePage.jsx:123',
    },
  ],
];
```

---

## 🚨 LIMPIEZA DE EMERGENCIA

Si el navegador está MUY lento o colgado, ejecuta:

```javascript
window.__performanceDiagnostic__.emergency();
```

**⚠️ ADVERTENCIA:** Esto detendrá TODOS los intervals activos.
Puede romper funcionalidad temporal pero liberará recursos.

---

## 🎯 IDENTIFICAR EL PROBLEMA

### ✅ **Intervals normales (OK):**

```
Total activos: 0-3
```

### ⚠️ **Intervals sospechosos:**

```
Total activos: 5-10
```

### 🚨 **CRÍTICO - Problema confirmado:**

```
Total activos: 15+
```

---

## 🔧 POSIBLES CAUSAS Y SOLUCIONES

### **Problema 1: Muchos intervals activos**

**Síntoma:**

```
🔄 INTERVALS: { total: 20, activos: 20 }
```

**Causa probable:**

- Componentes que crean intervals pero no los limpian
- Navegación entre páginas sin cleanup

**Solución temporal:**

```javascript
// En consola
window.__performanceDiagnostic__.emergency();
```

---

### **Problema 2: Re-renders excesivos**

**Síntoma:**

```
🔥 Re-render rápido detectado: HomePage (45ms)
🔥 Re-render rápido detectado: HomePage (32ms)
🎨 RENDERS: { total: 500 }
```

**Causa probable:**

- Loops infinitos en useEffect
- Dependencias mal configuradas
- Estados que se actualizan continuamente

**Solución:**
Ver en consola qué componente se re-renderiza y revisar sus `useEffect`.

---

### **Problema 3: Memoria creciente**

**Síntoma:**

```
💾 MEMORIA: { usedJSHeapSize: '450 MB', jsHeapSizeLimit: '512 MB' }
```

**Causa probable:**

- Listeners de Firebase no limpiados
- Objetos grandes acumulados en memoria

**Solución:**
Refrescar la página o ejecutar:

```javascript
window.location.reload();
```

---

### **Problema 4: Listeners de Firebase acumulados**

**Síntoma:**

```
🔥 FIRESTORE LISTENERS: 15+ activos
```

**Causa probable:**

- `onSnapshot()` sin cleanup en `useEffect`
- Múltiples suscripciones a la misma colección

**Solución:**
Asegurarse de que cada `onSnapshot` tenga su correspondiente:

```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe(); // ← CRÍTICO
}, [deps]);
```

---

## 📊 ARCHIVOS MONITOREADOS

La herramienta detecta problemas en:

- ✅ `src/components/HomePage.jsx` (2 onSnapshot)
- ✅ `src/context/WeddingContext.jsx` (múltiples listeners)
- ✅ `src/hooks/_useSeatingPlanDisabled.js` (heartbeats)
- ✅ `src/services/componentCacheService.js` (interval de cache)
- ✅ `src/services/TemplateCacheService.js` (saveStats interval)
- ✅ Todos los componentes con `setInterval` o `setTimeout`

---

## 🎬 PASOS A SEGUIR

### **Paso 1: Cargar la app**

```
http://localhost:5173
```

### **Paso 2: Esperar 5 segundos**

El diagnóstico se iniciará automáticamente.

### **Paso 3: Observar consola**

Verás mensajes como:

```
⚠️ [Diagnostic] Interval creado. Total activos: 1
⚠️ [Diagnostic] Interval creado. Total activos: 2
```

### **Paso 4: Navegar por la app**

```
Ir a /proveedores
Ir a /invitados
Ir a /finance
Volver a /
```

### **Paso 5: Ver reporte después de 30 segundos**

```javascript
window.__performanceDiagnostic__.report();
```

### **Paso 6: Analizar resultados**

**SI `intervals: 15+`:**

```javascript
// Ver detalles
window.__performanceDiagnostic__.getActiveIntervals();

// Limpieza de emergencia
window.__performanceDiagnostic__.emergency();
```

**SI `renders: 500+`:**

- Hay un loop infinito de re-renders
- Revisar componentes con muchos logs en consola

**SI `memoria: >400MB`:**

- Memory leak confirmado
- Refrescar página

---

## 📸 CAPTURAS PARA REPORTE

Por favor captura y envía:

1. **Consola completa** después de 30 segundos de uso
2. **Reporte de intervals:**
   ```javascript
   window.__performanceDiagnostic__.getActiveIntervals();
   ```
3. **Reporte general:**
   ```javascript
   window.__performanceDiagnostic__.report();
   ```

---

## 🔄 DETENER EL DIAGNÓSTICO

Si los logs son molestos:

```javascript
window.__performanceDiagnostic__.stop();
```

---

## ✅ FIXES YA APLICADOS

- ✅ **autoFixAuth deshabilitado** (commit `9211ac78`)
- ✅ **useCacheMonitor 1s → 10s** (commit `a3805347`)
- ✅ **Seating heartbeat 15s → 30s** (commit `33ce0fd1`)
- ✅ **TemplateCacheService optimizado** (commit `33ce0fd1`)

---

## 📞 SIGUIENTE PASO

**EJECUTA EL DIAGNÓSTICO Y ENVÍA LOS RESULTADOS**

Con esa información podré identificar exactamente qué está causando el colgamiento.

---

**Estado:** ✅ Herramienta implementada y lista  
**Commit:** Pendiente  
**Archivo:** `src/utils/performanceDiagnostic.js`
