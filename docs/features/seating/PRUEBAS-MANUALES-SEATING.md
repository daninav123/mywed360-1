# 🧪 PRUEBAS MANUALES - SEATING PLAN

**Fecha:** 17 de noviembre de 2025  
**Estado:** ✅ 6/6 verificaciones automáticas completadas  
**Objetivo:** Verificar funcionalidad de auto-asignación y ausencia de errores

---

## ✅ VERIFICACIONES AUTOMÁTICAS COMPLETADAS

| Check | Estado | Descripción                                          |
| ----- | ------ | ---------------------------------------------------- |
| 1     | ✅     | Servidor frontend accesible en http://localhost:5173 |
| 2     | ✅     | SeatingPlanModern.jsx corregido (import motion)      |
| 3     | ✅     | Minimap.jsx corregido (keys únicas)                  |
| 4     | ✅     | SeatingCanvas.jsx corregido (keys únicas en guías)   |
| 5     | ✅     | Traducciones añadidas (8 traducciones)               |
| 6     | ✅     | Logs de debugging activados (18+ logs)               |

**Resultado:** 100% de checks automáticos pasados ✨

---

## 📋 INSTRUCCIONES DE PRUEBA MANUAL

### Preparación

1. **Abrir navegador** en: http://localhost:5173
2. **Abrir DevTools:**
   - Mac: `Cmd + Option + I`
   - Windows: `F12`
3. **Ir a pestaña Console** en DevTools
4. **Activar "Preserve log"** (click derecho en consola)

### Pasos de Prueba

#### Paso 1: Navegar al Seating Plan

- Ir a: `/invitados/seating`
- Cambiar a la pestaña: **"Banquete"**

#### Paso 2: Limpiar Layout (si existe)

- Si hay mesas en el canvas:
  - Click en el menú (⋮) en la esquina superior derecha
  - Seleccionar "Limpiar Layout"
  - Confirmar

#### Paso 3: Generar Plan Automáticamente

- Click en botón: **"Generar Plan Automáticamente"**
- Esperar a que termine el proceso (5-10 segundos)

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cada item después de observarlo:

### A. ¿Se generan las mesas en el canvas?

- [ ] **Esperado:** Múltiples mesas aparecen visualmente
- [ ] **Buscar:** Círculos o rectángulos con números
- [ ] **Cantidad esperada:** ~15-30 mesas (según número de invitados)

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

### B. ¿Aparecen logs con emojis en la consola?

- [ ] **Esperado:** Logs con emojis 🚀, ✅, 📊, 🎯
- [ ] **Buscar:** `[setupSeatingPlanAutomatically] 🚀 Iniciando...`
- [ ] **Logs clave:**
  ```
  🚀 Iniciando generación automática...
  📊 Análisis de invitados: X invitados, Y mesas necesarias
  ✅ Mesa creada: Mesa Z
  ```

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

### C. ¿Se asignan los invitados a las mesas?

- [ ] **Esperado:** Logs de asignación de invitados
- [ ] **Buscar:** `[autoAssignGuests] ✅ Asignando...`
- [ ] **Ejemplo:**
  ```
  ✅ Asignando invitado 'Juan Pérez' a mesa 1
  ✅ Asignando invitado 'María García' a mesa 1
  ```

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

### D. ¿Aparece toast de éxito en español?

- [ ] **Esperado:** Mensaje toast en español con estadísticas
- [ ] **Buscar:** Toast con "Plan generado exitosamente"
- [ ] **Contenido esperado:**
  - Mesas creadas: X
  - Invitados asignados: Y (Z%)

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

### E. ¿Hay errores en rojo en la consola?

- [ ] **Esperado:** NO hay errores
- [ ] **Buscar:** Líneas rojas con "Error"
- [ ] **Especialmente buscar:**
  - ❌ "motion is not defined"
  - ❌ "updateTable is not a function"
  - ❌ "Cannot read property of undefined"

**✅ PASA (sin errores)** | **❌ FALLA (hay errores)**

---

### F. ¿Hay warnings de React (amarillo)?

- [ ] **Esperado:** NO hay warnings de keys duplicadas
- [ ] **Buscar:** `Warning: Encountered two children with the same key`
- [ ] **Otros warnings a evitar:**
  - Keys duplicadas en Minimap
  - Keys duplicadas en SeatingCanvas
  - Keys duplicadas en cualquier componente

**✅ PASA (sin warnings)** | **❌ FALLA (hay warnings)**

---

### G. ¿Las estadísticas del footer se actualizan?

- [ ] **Esperado:** Footer muestra "X mesas, Y% asignados"
- [ ] **Buscar:** Números en la parte inferior del canvas
- [ ] **Verificar:**
  - Contador de mesas aumenta
  - Porcentaje de asignación sube a ~100%
  - Colores cambian según ocupación

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

### H. ¿El minimap se actualiza con las mesas?

- [ ] **Esperado:** Minimap muestra mesas en miniatura
- [ ] **Buscar:** Mini-vista en esquina superior derecha
- [ ] **Verificar:**
  - Puntos de colores aparecen
  - Colores indican ocupación (verde/amarillo/rojo)
  - Layout refleja el canvas principal

**✅ PASA** | **❌ FALLA** | **⚠️ PARCIAL**

---

## 💡 TIPS DE DEBUGGING

### Si no ves logs:

1. Recarga la página: `Cmd+R` o `F5`
2. Limpia la consola: Click en 🚫
3. Verifica "Preserve log" esté activado

### Si los logs pasan muy rápido:

1. Click derecho en consola → "Preserve log"
2. Usa el filtro de búsqueda (🔍) y busca:
   - `setupSeatingPlanAutomatically`
   - `autoAssignGuests`

### Para ver mejor los logs:

1. Filtra por nivel: Solo "Info" o "Log"
2. Busca por emoji: `🚀` o `✅`
3. Agrupa por componente

### Si hay errores:

1. **Copia el mensaje completo** (click derecho → Copy)
2. **Anota la línea y archivo** donde ocurre
3. **Captura screenshot** si es posible

---

## 📊 RESULTADOS ESPERADOS

### ✅ PRUEBA EXITOSA

Si todos los checks pasan:

- ✅ A-H: Todos marcados como PASA
- Consola limpia (sin errores ni warnings)
- Mesas generadas y visibles
- Invitados asignados correctamente
- Minimap y estadísticas actualizadas

### ⚠️ PRUEBA PARCIAL

Si algunos checks fallan:

- A-D pasan pero E-F tienen warnings menores
- Auto-asignación funciona pero hay warnings visuales
- Mesas se generan pero algunos invitados no se asignan

### ❌ PRUEBA FALLIDA

Si checks críticos fallan:

- ❌ Errores rojos en consola
- ❌ No se generan mesas
- ❌ No se asignan invitados
- ❌ Crash de la aplicación

---

## 📝 FORMULARIO DE REPORTE

Una vez completadas las pruebas, reporta:

```
RESULTADO GENERAL: [EXITOSA / PARCIAL / FALLIDA]

CHECKS:
A. Generación de mesas: [✅ / ❌ / ⚠️]
B. Logs con emojis: [✅ / ❌ / ⚠️]
C. Asignación de invitados: [✅ / ❌ / ⚠️]
D. Toast de éxito: [✅ / ❌ / ⚠️]
E. Sin errores: [✅ / ❌]
F. Sin warnings: [✅ / ❌]
G. Estadísticas actualizadas: [✅ / ❌ / ⚠️]
H. Minimap actualizado: [✅ / ❌ / ⚠️]

OBSERVACIONES:
[Describe cualquier comportamiento inesperado]

ERRORES ENCONTRADOS:
[Copia mensajes de error si los hay]

SCREENSHOTS:
[Adjunta si es necesario]
```

---

## 🔗 ENLACES RÁPIDOS

- **Frontend:** http://localhost:5173
- **Seating Plan:** http://localhost:5173/invitados/seating
- **Consola DevTools:** `Cmd+Option+I` (Mac) / `F12` (Windows)

---

## ✨ PRÓXIMOS PASOS

Dependiendo de los resultados:

### Si todo pasa ✅

1. Marcar todas las tareas como completadas
2. Documentar funcionalidad verificada
3. Continuar con Opción B (Re-habilitar auto-layout)

### Si hay warnings menores ⚠️

1. Identificar warnings específicos
2. Crear issues para resolverlos
3. Decidir si bloquean o no siguiente fase

### Si hay errores críticos ❌

1. Analizar logs y errores
2. Debuggear componentes específicos
3. Corregir antes de continuar

---

**¡Buena suerte con las pruebas!** 🚀
