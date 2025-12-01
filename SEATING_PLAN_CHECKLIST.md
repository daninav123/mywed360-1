# Checklist de Funcionalidades del Seating Plan

**Fecha:** 17 de Noviembre de 2025
**Estado:** Testing pendiente

---

## ✅ Funcionalidades Solucionadas y Verificadas

### Core Functionality

- [x] **Arrastre de mesas** - Las mesas se pueden mover libremente
- [x] **Detección de colisiones** - Sistema activo con margen de seguridad de 20px
- [x] **Generación automática** - Crea mesas incluso sin asignaciones previas
- [x] **Layouts sin colisiones** - Todos los algoritmos (columnas, circular, U, etc.) corregidos
- [x] **Iconos de iniciales** - Muestra iniciales de invitados alrededor de las mesas
- [x] **Optimización de renders** - React.memo implementado

---

## 🧪 Funcionalidades a Verificar Manualmente

### 1. Gestión de Mesas

- [ ] **Crear mesa nueva** - Botón "+" o "Añadir mesa"
- [ ] **Editar mesa** - Doble click o botón de configuración
  - [ ] Cambiar número de asientos
  - [ ] Cambiar forma (circular/rectangular)
  - [ ] Cambiar nombre
- [ ] **Eliminar mesa** - Botón de eliminar o tecla Delete
- [ ] **Duplicar mesa** - Si existe esta funcionalidad
- [ ] **Bloquear/Desbloquear mesa** - Prevenir ediciones accidentales

### 2. Asignación de Invitados

- [ ] **Drag & drop de invitados a mesas** - Desde lista lateral
- [ ] **Asignación manual** - Click en mesa y seleccionar invitado
- [ ] **Desasignar invitado** - Quitar invitado de una mesa
- [ ] **Auto-asignar invitados** - Botón de asignación automática
- [ ] **Contador de invitados** - Muestra "X/Y" en cada mesa correctamente
- [ ] **Indicador de mesa llena** - Visual cuando mesa está al máximo

### 3. Vistas y Tabs

- [ ] **Tab Ceremonia** - Cambia a vista de ceremonia
- [ ] **Tab Banquete** - Cambia a vista de banquete
- [ ] **Persistencia entre tabs** - Los cambios se guardan al cambiar de tab
- [ ] **Sincronización** - Los cambios se sincronizan con Firebase

### 4. Herramientas de Diseño

- [ ] **Zoom in/out** - Botones + y - funcionan
- [ ] **Pan (arrastre de canvas)** - Shift + arrastre o modo pan
- [ ] **Centrar vista** - Botón para centrar el canvas
- [ ] **Grid/Guías** - Mostrar/ocultar grid de referencia
- [ ] **Snap to grid** - Las mesas se ajustan al grid si está activo

### 5. Configuración del Salón

- [ ] **Dimensiones del salón** - Modal para configurar ancho/alto
- [ ] **Fondo personalizado** - Subir imagen de fondo
- [ ] **Templates predefinidos** - Galería de plantillas
- [ ] **Áreas especiales** - Crear zonas (pista de baile, DJ, etc.)

### 6. Búsqueda y Filtros

- [ ] **Buscar invitado** - Barra de búsqueda
- [ ] **Filtrar por mesa** - Ver invitados de una mesa específica
- [ ] **Filtrar por estado** - Confirmados/pendientes
- [ ] **Resaltar mesa** - Al buscar, resalta la mesa en el canvas

### 7. Exportación

- [ ] **Exportar a PDF** - Genera PDF del plan
- [ ] **Exportar a PNG** - Genera imagen
- [ ] **Exportar a CSV** - Lista de asignaciones
- [ ] **Exportar a SVG** - Formato vectorial
- [ ] **Imprimir** - Vista de impresión optimizada

### 8. Colaboración (si está implementado)

- [ ] **Ver usuarios activos** - Badge de colaboradores
- [ ] **Locks en tiempo real** - Bloqueo al editar una mesa
- [ ] **Sincronización en vivo** - Los cambios se ven en tiempo real
- [ ] **Cursores de otros usuarios** - Si está implementado

### 9. Historial y Undo/Redo

- [ ] **Deshacer (Ctrl+Z)** - Revierte último cambio
- [ ] **Rehacer (Ctrl+Y)** - Restaura cambio deshecho
- [ ] **Historial de cambios** - Panel con lista de cambios
- [ ] **Restaurar versión anterior** - Si existe esta funcionalidad

### 10. Estadísticas y Resumen

- [ ] **Total de invitados** - Cuenta correcta
- [ ] **Invitados asignados** - Número y porcentaje
- [ ] **Invitados sin mesa** - Lista de no asignados
- [ ] **Mesas utilizadas/total** - Conteo de mesas
- [ ] **Ocupación por mesa** - % de capacidad usado
- [ ] **Confetti al 100%** - Celebración cuando todos están asignados

### 11. Validaciones y Warnings

- [ ] **Mesa sobrepasada** - Warning si hay más invitados que asientos
- [ ] **Mesa vacía** - Indicador de mesas sin invitados
- [ ] **Invitados duplicados** - Alerta si un invitado está en dos mesas
- [ ] **Conflictos de relaciones** - Si hay sistema de compatibilidad

### 12. Performance

- [ ] **Carga inicial rápida** - < 3 segundos
- [ ] **Sin lag al arrastrar** - Movimiento fluido
- [ ] **Sin re-renders excesivos** - Verificar en consola
- [ ] **Funciona con 50+ mesas** - Test de stress
- [ ] **Funciona con 200+ invitados** - Test de stress

### 13. Responsive & Mobile

- [ ] **Funciona en tablet** - Layout adaptado
- [ ] **Funciona en móvil** - Gestos táctiles
- [ ] **Zoom con pellizco** - En dispositivos táctiles
- [ ] **Menús adaptados** - No se salen de pantalla

### 14. Accesibilidad

- [ ] **Navegación por teclado** - Tab, Enter, Escape funcionan
- [ ] **Shortcuts de teclado** - Atajos documentados y funcionales
- [ ] **Contraste suficiente** - Legible en modo claro y oscuro
- [ ] **Tooltips informativos** - Ayuda contextual

---

## 🐛 Problemas Conocidos (Revisar)

### Posibles Issues a Verificar

1. **Sincronización Firebase**
   - [ ] Verificar que los cambios se guardan en Firestore
   - [ ] Comprobar tiempo de sincronización
   - [ ] Verificar manejo de errores de conexión

2. **Locks de Colaboración**
   - [ ] Verificar que los locks se liberan correctamente
   - [ ] Comprobar que no quedan locks huérfanos
   - [ ] Verificar timeout de locks

3. **Memoria y Leaks**
   - [ ] Verificar que no hay memory leaks
   - [ ] Comprobar cleanup de listeners de Firebase
   - [ ] Verificar cleanup de timers y intervals

4. **Edge Cases**
   - [ ] ¿Qué pasa con 0 invitados?
   - [ ] ¿Qué pasa con 0 mesas?
   - [ ] ¿Qué pasa si se borra una mesa con invitados?
   - [ ] ¿Qué pasa si hay invitados sin nombre?

5. **UI/UX Issues**
   - [ ] ¿Se pueden crear mesas fuera del canvas visible?
   - [ ] ¿Las mesas se pueden mover a posiciones negativas?
   - [ ] ¿Los modales se cierran correctamente?
   - [ ] ¿Los tooltips no se quedan stuck?

---

## 📋 Testing Plan

### Test de Funcionalidad Básica (5 min)

1. Abrir seating plan
2. Crear 3 mesas manualmente
3. Asignar 5 invitados a diferentes mesas
4. Mover una mesa
5. Cambiar entre tabs Ceremonia/Banquete
6. Verificar que todo se guardó

### Test de Generación Automática (3 min)

1. Borrar todas las mesas
2. Click en "Generar plan automático"
3. Seleccionar layout "Columnas"
4. Verificar que se crean mesas sin colisiones
5. Repetir con "Circular" y "En U"

### Test de Colisiones (2 min)

1. Intentar arrastrar una mesa encima de otra
2. Verificar que muestra toast de error
3. Verificar que la mesa vuelve a posición anterior

### Test de Performance (3 min)

1. Generar plan con 20+ mesas
2. Arrastrar varias mesas
3. Verificar que no hay lag
4. Comprobar consola para errores

---

## 🚀 Mejoras Sugeridas (Futuro)

### Nice to Have

- [ ] **Templates personalizados** - Guardar layouts propios
- [ ] **Temas de color** - Personalizar colores de mesas
- [ ] **Vista 3D** - Visualización tridimensional
- [ ] **Importar desde Excel** - Subir lista de invitados
- [ ] **Sugerencias AI** - IA sugiere mejor distribución
- [ ] **Mapa de calor** - Visualizar zonas más concurridas
- [ ] **Animaciones de transición** - Entre layouts
- [ ] **Modo presentación** - Vista fullscreen sin controles

### Performance Optimizations

- [ ] **Virtualización** - Para 100+ mesas
- [ ] **Lazy loading** - Cargar invitados bajo demanda
- [ ] **Debouncing mejorado** - En operaciones frecuentes
- [ ] **Worker threads** - Para cálculos pesados

---

## 📝 Notas

**Prioridad Alta (Must Fix):**

- Cualquier cosa que bloquee funcionalidad básica
- Bugs que causen pérdida de datos
- Errores de sincronización críticos

**Prioridad Media (Should Fix):**

- UX mejorable pero funcional
- Performance en casos extremos
- Validaciones faltantes

**Prioridad Baja (Nice to Fix):**

- Animaciones
- Tooltips
- Detalles estéticos

---

## ✅ Resumen del Estado Actual

**Funcionalidades Core:** ✅ Solucionadas

- Arrastre de mesas ✅
- Detección de colisiones ✅
- Generación automática ✅
- Layouts sin superposición ✅

**Siguiente paso:** Pruebas manuales sistemáticas de todas las funcionalidades listadas arriba.

**Comando para testing manual:**

```bash
# Abrir app en navegador
open http://localhost:5173/invitados/seating
```
