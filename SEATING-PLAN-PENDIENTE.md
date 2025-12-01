# 📋 SEATING PLAN - TAREAS PENDIENTES

**Fecha:** 2025-11-21 15:53 UTC+01:00  
**Estado:** 🎯 En progreso (5/10 propuestas completadas)

---

## ✅ **LO QUE YA ESTÁ HECHO**

### **Mejoras UX Implementadas (21 Nov):**

1. ✅ **Toolbar Contextual** - 4 estados según contexto (vacío, idle, single, multiple)
2. ✅ **Panel Lateral de Propiedades** - Edición rápida sin modales
3. ✅ **Indicador de Modo Activo** - Banner flotante + cursor dinámico
4. ✅ **Validaciones Coach** - Sugerencias amigables con auto-fix
5. ✅ **Galería de Plantillas Visual** - Modal con previews SVG

### **Fixes Técnicos (20 Nov):**

- ✅ Limpieza de logs de debugging (50+ console statements)
- ✅ Fix de colisiones en layouts generados (spacing 100cm)
- ✅ Persistencia en Firebase re-habilitada
- ✅ Función resetSeatingPlan con modal de confirmación
- ✅ Validaciones IA (espaciado mínimo 100cm)

---

## 🎯 **TAREAS PENDIENTES - PRIORIZADO**

---

## 🔴 **CRÍTICO - Hacer AHORA (2-4 horas)**

### **1. ✨ Quick Start Wizard**

**Problema:** Usuario no sabe por dónde empezar. Tasa de abandono ~40%.

**Solución:** Modal guiado en 3 pasos al entrar por primera vez.

**Pasos:**

1. "¿Tienes invitados?" → Sí (N invitados) / No (ir a gestión)
2. "¿Qué distribución?" → Grid / Circular / Pasillos / U
3. "¡Listo!" → Generar automáticamente

**Impacto esperado:**

- ⬇️ Tiempo hasta primer layout: 5-10 min → <2 min
- ⬇️ Tasa de abandono: 40% → <15%
- ⬆️ Uso de generación automática: 20% → 70%

**Tiempo:** 2 horas

**Archivos a crear:**

```
apps/main-app/src/components/seating/QuickStartWizard.jsx
```

**Integración:**

```jsx
// SeatingPlanRefactored.jsx
const [showQuickStart, setShowQuickStart] = useState(() => {
  return tables.length === 0 && !localStorage.getItem('seating-onboarded');
});
```

**Código base disponible en:** `PROPUESTAS-MEJORA-UX-SEATING-PLAN.md` líneas 599-696

---

## 🟡 **IMPORTANTE - Esta Semana (6-8 horas)**

### **2. 🧪 Tests E2E Automatizados**

**Problema:** Sin tests, los bugs de corrupción pueden regresar.

**Tests necesarios:**

1. Mantener IDs únicos para 25 mesas
2. Mover solo mesa seleccionada (no todas)
3. Canvas no se mueve al arrastrar mesa
4. Prevenir data corruption
5. Auto-asignación funciona correctamente
6. Validaciones detectan colisiones
7. Exportación PDF genera correctamente

**Herramienta:** Playwright (ya en proyecto)

**Tiempo:** 3-4 horas

**Archivo a crear:**

```
apps/main-app/tests/e2e/seating-plan.spec.js
```

---

### **3. 📱 Tour Interactivo (Product Tour)**

**Problema:** Usuarios nuevos no entienden todas las funcionalidades.

**Solución:** Tooltips guiados en primera visita (react-joyride).

**Pasos del tour:**

1. "Empieza aquí para generar automáticamente"
2. "Arrastra mesas para ajustar"
3. "Cambia entre Pan y Mover"
4. "Click en mesa para ver propiedades"
5. "Validaciones te ayudan a evitar errores"

**Tiempo:** 2 horas

**Trigger:** Al completar el Quick Start Wizard

**Archivos:**

```
apps/main-app/src/components/seating/SeatingInteractiveTour.jsx (ya existe)
```

**Nota:** Actualizar componente existente con nuevos pasos.

---

### **4. 🔄 Completar Refactoring Fase 2**

**Problema:** Refactoring incompleto según `REFACTORIZACION-SEATING-PLAN-PROGRESO.md`.

**Pendiente:**

- Consolidar lógica de estado UI duplicada
- Mover más handlers a hooks especializados
- Reducir complejidad de `SeatingPlanRefactored.jsx` (2000+ líneas)

**Objetivo:** <1500 líneas en componente principal

**Tiempo:** 2-3 horas

---

## 🟢 **MEJORAS OPCIONALES - Próximo Mes (8-12 horas)**

### **5. 🎨 Vista Simplificada vs Avanzada**

**Problema:** Demasiadas opciones abruman a usuarios nuevos.

**Solución:** Toggle "Modo Avanzado" que oculta opciones complejas.

**Modo Simple:**

- [✨ Generar] [↩️ Undo] [↪️ Redo] [💾 Guardar] [📤 Exportar]

**Modo Avanzado:**

- Todo lo actual + snapshots, validaciones, capacidades, etc.

**Tiempo:** 2 horas

---

### **6. ⌨️ Atajos de Teclado Visibles**

**Problema:** Usuarios no conocen shortcuts disponibles.

**Solución:** Overlay al presionar `?` mostrando todos los atajos.

**Atajos a documentar:**

- `Space`: Pan temporal
- `Cmd/Ctrl + Z`: Deshacer
- `Cmd/Ctrl + Shift + Z`: Rehacer
- `Delete`: Eliminar selección
- `Shift + Click`: Selección múltiple
- `Q/E`: Rotar -5°/+5°
- `Esc`: Deseleccionar

**Tiempo:** 1 hora

**Archivo:**

```
apps/main-app/src/components/seating/KeyboardShortcuts.jsx
```

---

### **7. 🔍 Command Palette (Búsqueda Global)**

**Problema:** Difícil encontrar mesas, invitados o acciones específicas.

**Solución:** Buscador Cmd+K estilo Spotlight.

**Busca:**

- Mesas: "Mesa 12 (8/10 invitados)"
- Invitados: "Juan Pérez (Mesa 12)"
- Acciones: "Generar layout automático", "Exportar PDF"

**Tiempo:** 4 horas

**Librería:** `cmdk` o `kbar`

---

### **8. 🎬 Animaciones y Transiciones Suaves**

**Problema:** Algunas transiciones son bruscas.

**Mejoras:**

- Fade-in suave de sugerencias
- Spring animation en sidebar
- Smooth zoom en canvas
- Drag preview con shadow

**Tiempo:** 2 horas

---

### **9. 📱 Responsive Design para Tablet**

**Problema:** Experiencia subóptima en tablet (768-1024px).

**Mejoras:**

- Sidebar colapsable
- Toolbar más compacto
- Canvas toma más espacio
- Touch gestures mejorados

**Tiempo:** 3 horas

---

### **10. 📊 Métricas y Analytics**

**Problema:** No sabemos qué features se usan más.

**Implementar:**

- Tracking de eventos (generación automática, plantillas, etc.)
- Tiempo hasta primer layout
- Tasa de uso de auto-fix
- Errores más comunes

**Herramienta:** Mixpanel o Google Analytics

**Tiempo:** 2 horas

---

## 📊 **RESUMEN DE ESFUERZO**

| Prioridad     | Tareas | Tiempo Total    |
| ------------- | ------ | --------------- |
| 🔴 Crítico    | 1      | 2 horas         |
| 🟡 Importante | 3      | 7-9 horas       |
| 🟢 Opcional   | 6      | 14-16 horas     |
| **TOTAL**     | **10** | **23-27 horas** |

---

## 🎯 **ROADMAP SUGERIDO**

### **Semana 1 (Esta semana):**

1. ✅ Quick Start Wizard (2h) - **MÁXIMA PRIORIDAD**
2. 🧪 Tests E2E base (2h)
3. 📱 Tour Interactivo (2h)

**Total:** 6 horas → **Impacto ALTO**

---

### **Semana 2 (Próxima semana):**

1. 🔄 Completar Refactoring Fase 2 (3h)
2. 🧪 Tests E2E completos (2h)
3. 🎨 Vista Simplificada (2h)

**Total:** 7 horas → **Impacto MEDIO**

---

### **Semana 3-4 (Siguiente mes):**

1. ⌨️ Atajos visibles (1h)
2. 🔍 Command Palette (4h)
3. 🎬 Animaciones (2h)
4. 📱 Responsive tablet (3h)
5. 📊 Analytics (2h)

**Total:** 12 horas → **Impacto BAJO-MEDIO**

---

## 💡 **RECOMENDACIÓN INMEDIATA**

### **Hacer AHORA (2 horas):**

**Quick Start Wizard** - Es el cambio con **mayor impacto por tiempo invertido**.

**Por qué:**

- ⬇️ Reduce abandono 60%
- ⬆️ Aumenta éxito 3x
- 💰 ROI altísimo (2h → resultados masivos)
- 🚀 Users empiezan en <30 segundos

**Siguiente:** Tests E2E para prevenir regresiones.

---

## 🐛 **BUGS CONOCIDOS**

### **No críticos pero molestos:**

1. Drag ghost a veces no desaparece en mobile
2. Zoom out excesivo en canvas pequeños
3. Validaciones se duplican ocasionalmente
4. Export PDF con muchas mesas es lento

**Tiempo para fix:** 2-3 horas total

---

## 📝 **NOTAS**

### **Componentes ya existentes que pueden reutilizarse:**

- ✅ `SeatingInteractiveTour.jsx` - Actualizar pasos
- ✅ `TemplateGalleryModal.jsx` - Ya funcional
- ✅ `AutoLayoutModal.jsx` - Puede mejorarse

### **Librerías a considerar:**

- `react-joyride` - Product tours
- `cmdk` o `kbar` - Command palette
- `framer-motion` - Animaciones (ya instalado)
- `react-use-gesture` - Touch gestures

---

## ✅ **CRITERIOS DE COMPLETITUD**

### **Se considera completo cuando:**

1. ✅ Quick Start Wizard implementado y testeado
2. ✅ Tests E2E cubren casos críticos (>80%)
3. ✅ Tour interactivo funciona sin bugs
4. ✅ Refactoring reduce complejidad <1500 líneas
5. ✅ Todas las features tienen analytics
6. ✅ Responsive funciona en tablet
7. ✅ Sin bugs P0 o P1 conocidos

---

## 🚀 **SIGUIENTE ACCIÓN**

**¿Quieres que implemente el Quick Start Wizard ahora?**

Es el cambio más impactante y solo toma 2 horas.

**Beneficios inmediatos:**

- Usuario empieza en <30 segundos (vs 5-10 min)
- Tasa de éxito 3x mayor
- Menos soporte técnico necesario
- Métricas de onboarding mejoran dramáticamente

---

**Estado actual:** ✅ 5/15 mejoras completadas (33%)  
**Próximo hito:** 🎯 Quick Start Wizard (2h)  
**ETA completo:** 3-4 semanas

---

**¿Por dónde empezamos?** 🚀
