# 🔍 AUDITORÍA DE RENDIMIENTO

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **autoFixAuth ejecutándose cada 5 minutos** 🔴 CRÍTICO

**Archivo:** `src/main.jsx` línea 14  
**Problema:**

```javascript
import { setupAutoFix } from './services/autoFixAuth';
setupAutoFix(); // Se ejecuta al cargar la app
```

En `src/services/autoFixAuth.js`:

```javascript
export function setupAutoFix() {
  console.log('[autoFixAuth] 🔧 Configurando auto-fix periódico...');

  autoFixAuth(); // Ejecuta inmediatamente

  // Ejecutar cada 5 minutos
  const interval = setInterval(
    () => {
      autoFixAuth();
    },
    5 * 60 * 1000
  ); // 5 minutos

  return () => clearInterval(interval);
}
```

**Impacto:**

- ✅ Cada 5 minutos ejecuta autoFixAuth()
- ✅ Imprime 10+ logs en consola cada vez
- ✅ Hace llamadas a Firebase getIdToken(true)
- ❌ **NO SE LIMPIA** porque se ejecuta en main.jsx (no en componente)
- ❌ El interval sigue ejecutándose indefinidamente

**Solución:**

```javascript
// OPCIÓN 1: Deshabilitar en producción
if (import.meta.env.DEV) {
  setupAutoFix();
}

// OPCIÓN 2: Ejecutar solo una vez al login
// Mover a useAuth.jsx en lugar de main.jsx

// OPCIÓN 3: Aumentar intervalo a 30 minutos
setInterval(
  () => {
    autoFixAuth();
  },
  30 * 60 * 1000
); // 30 minutos en lugar de 5
```

---

### 2. **useCacheMonitor actualizándose cada 1 segundo** 🟠 ALTO

**Archivo:** `src/services/componentCacheService.js` línea 251-263

**Problema:**

```javascript
export const useCacheMonitor = () => {
  const [stats, setStats] = useState(getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats()); // Actualiza estado cada 1 segundo
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};
```

**Impacto:**

- ❌ Si algún componente usa este hook, se re-renderiza cada segundo
- ❌ Causa actualizaciones de estado innecesarias
- ❌ Posible causa de lentitud en la UI

**Verificar:**

```bash
# Buscar dónde se usa
grep -r "useCacheMonitor" src/
```

**Solución:**

```javascript
// OPCIÓN 1: Aumentar intervalo
setInterval(() => {
  setStats(getCacheStats());
}, 10000); // 10 segundos

// OPCIÓN 2: Solo actualizar cuando cambie
useEffect(() => {
  // Escuchar evento personalizado en lugar de polling
  const handler = () => setStats(getCacheStats());
  window.addEventListener('cache-updated', handler);
  return () => window.removeEventListener('cache-updated', handler);
}, []);

// OPCIÓN 3: Eliminar si no se usa
// Comentar export si ningún componente lo necesita
```

---

### 3. **TemplateCacheService con múltiples setInterval** 🟡 MEDIO

**Archivo:** `src/services/TemplateCacheService.js` línea 652-655

**Problema:**

```javascript
// Guardar estadísticas cada 5 minutos
if (!IS_TEST) {
  setInterval(saveStats, 5 * 60 * 1000);

  // Limpiar caché cada hora
  setInterval(cleanupCache, 60 * 60 * 1000);
}
```

**Impacto:**

- ⚠️ Ejecuta saveStats cada 5 minutos
- ⚠️ Ejecuta cleanupCache cada hora
- ✅ NO causa re-renders (no afecta componentes)
- ⚠️ Consume memoria

**Solución:**

```javascript
// OK, pero podríamos optimizar:
// Guardar solo cuando hay cambios significativos
let lastStatsHash = '';
setInterval(
  () => {
    const currentHash = JSON.stringify(getCacheStats());
    if (currentHash !== lastStatsHash) {
      saveStats();
      lastStatsHash = currentHash;
    }
  },
  5 * 60 * 1000
);
```

---

### 4. **QuoteRequestsTracker - Bucle infinito CORREGIDO** ✅

**Archivo:** `src/components/suppliers/QuoteRequestsTracker.jsx`  
**Estado:** ✅ **YA CORREGIDO** en commit `f3590da9`

Anteriormente tenía:

```javascript
// ❌ ANTES (causaba bucle):
useEffect(() => {
  loadQuoteRequests();
}, [user, activeWedding]);

const loadQuoteRequests = async () => { ... };
```

Ahora tiene:

```javascript
// ✅ AHORA (sin bucle):
const loadQuoteRequests = useCallback(async () => {
  ...
}, [user, activeWedding]);

useEffect(() => {
  loadQuoteRequests();
}, [loadQuoteRequests]);
```

---

### 5. **EmailCache limpieza periódica** 🟢 BAJO

**Archivo:** `src/utils/EmailCache.js` línea 52

```javascript
setInterval(() => this.cleanExpiredItems(), 5 * 60 * 1000); // Cada 5 minutos
```

**Impacto:** Mínimo (solo limpieza de caché)

---

### 6. **authService - Session check** 🟡 MEDIO

**Archivo:** `src/services/authService.js` línea 226

```javascript
sessionCheckTimer = setInterval(() => {
  if (isSessionExpired()) {
    console.log('[AuthService] Sesión expirada por inactividad');
    signOut(auth);
  }
}, 60000); // Cada minuto
```

**Impacto:**

- ⚠️ Ejecuta cada minuto
- ✅ Es necesario para seguridad
- ⚠️ Podría optimizarse a 5 minutos

**Solución:**

```javascript
// Aumentar intervalo
setInterval(
  () => {
    if (isSessionExpired()) {
      signOut(auth);
    }
  },
  5 * 60 * 1000
); // 5 minutos en lugar de 1
```

---

### 7. **\_useSeatingPlanDisabled - Heartbeats** 🟡 MEDIO

**Archivo:** `src/hooks/_useSeatingPlanDisabled.js` línea 196

```javascript
const interval = setInterval(() => {
  updateDoc(docRef, { updatedAt: serverTimestamp() }).catch(() => {});
}, LOCK_HEARTBEAT_MS);
```

**Impacto:**

- ⚠️ Ejecuta cada X segundos cuando hay un lock activo
- ✅ Necesario para sistema de bloqueos
- ⚠️ Hace escrituras constantes a Firestore

**Solución:**

```javascript
// Aumentar intervalo de heartbeat
const LOCK_HEARTBEAT_MS = 30000; // 30 segundos en lugar de menos
```

---

## 📊 RESUMEN DE IMPACTO

| Problema                 | Severidad  | Impacto en Rendimiento           | Solución                          |
| ------------------------ | ---------- | -------------------------------- | --------------------------------- |
| autoFixAuth cada 5 min   | 🔴 CRÍTICO | Alto - logs + Firebase calls     | Deshabilitar o aumentar intervalo |
| useCacheMonitor cada 1s  | 🟠 ALTO    | Muy Alto - re-renders constantes | Aumentar intervalo o eliminar     |
| TemplateCacheService     | 🟡 MEDIO   | Bajo - solo memoria              | Optimizar condición               |
| Session check cada 1 min | 🟡 MEDIO   | Bajo                             | Aumentar a 5 minutos              |
| Seating heartbeats       | 🟡 MEDIO   | Medio - escrituras Firestore     | Aumentar intervalo                |
| EmailCache limpieza      | 🟢 BAJO    | Muy Bajo                         | OK                                |

---

## 🔧 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: Fixes Críticos (Ahora)

1. **Deshabilitar autoFixAuth en producción**

```javascript
// main.jsx
if (import.meta.env.DEV) {
  setupAutoFix();
}
```

2. **Verificar y eliminar useCacheMonitor si no se usa**

```bash
grep -r "useCacheMonitor" src/components src/pages
```

### FASE 2: Optimizaciones (Próximo sprint)

3. **Aumentar intervalos de polling:**
   - Session check: 1 min → 5 min
   - Seating heartbeat: actual → 30 segundos
4. **Optimizar saveStats:**
   - Solo guardar si hay cambios

### FASE 3: Monitorización (Continuo)

5. **Añadir performance monitoring:**

```javascript
// Detectar setInterval no limpiados
const originalSetInterval = window.setInterval;
const intervals = new Set();

window.setInterval = function (...args) {
  const id = originalSetInterval(...args);
  intervals.add(id);
  console.log(`[Performance] Active intervals: ${intervals.size}`);
  return id;
};
```

---

## 🎯 RESULTADO ESPERADO

Después de implementar FASE 1:

- ✅ Reducción de logs en consola (90%)
- ✅ Menos llamadas a Firebase
- ✅ Sin re-renders innecesarios
- ✅ Sistema más responsive

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Deshabilitar autoFixAuth en producción
- [ ] Verificar uso de useCacheMonitor
- [ ] Aumentar intervalo session check
- [ ] Optimizar heartbeats de seating
- [ ] Añadir monitoring de intervals
- [ ] Probar rendimiento
- [ ] Commit y push

---

**Fecha auditoría:** 2025-11-02  
**Realizada por:** Sistema de Análisis Automatizado  
**Estado:** Pendiente de implementación
