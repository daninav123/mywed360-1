# ✅ Testing Checklist - Quick Wins del Seating Plan

**Fecha:** 17 Noviembre 2025
**URL de Testing:** http://localhost:5173
**Estado:** 🔄 EN PROGRESO

---

## 📋 PLAN DE TESTING

### Pre-requisitos:

- [ ] Proyecto corriendo (npm run dev:all)
- [ ] Backend: http://localhost:4004 ✅
- [ ] Main App: http://localhost:5173 ✅
- [ ] Usuario autenticado
- [ ] Boda activa seleccionada
- [ ] Navegación a Seating Plan

---

## 🤖 QUICK WIN 1: Chat Asistente IA

### Acceso y Visibilidad

- [ ] **Botón visible en toolbar** - Buscar icono 🤖
- [ ] **Badge correcto** - Debe mostrar emoji de robot
- [ ] **Tooltip funcional** - Hover muestra "Chat Asistente IA"
- [ ] **Shortcut Ctrl+K** - Presionar y verificar que abre

### Funcionalidad del Chat

- [ ] **Chat se abre** - Modal flotante en esquina inferior derecha
- [ ] **Mensaje de bienvenida** - IA saluda automáticamente
- [ ] **Estadísticas visibles** - Muestra X/Y invitados y mesas
- [ ] **Sugerencias rápidas** - 4 botones de preguntas frecuentes

### Interacción con IA

- [ ] **Enviar mensaje simple** - "Hola"
- [ ] **Respuesta de IA** - Recibe respuesta coherente
- [ ] **Pregunta contextual** - "¿Cómo distribuyo 150 invitados?"
- [ ] **Respuesta específica** - IA responde con contexto del plan
- [ ] **Indicador de carga** - Muestra "Pensando..." mientras procesa
- [ ] **Timestamps** - Cada mensaje tiene hora

### UI/UX

- [ ] **Scroll automático** - Baja al último mensaje
- [ ] **Cerrar con X** - Botón X cierra el chat
- [ ] **Cerrar con Escape** - Tecla ESC cierra
- [ ] **Dark mode** - Funciona en modo oscuro
- [ ] **Responsive** - Se adapta a pantalla pequeña

### Casos de Error

- [ ] **Sin API key** - Maneja error gracefully
- [ ] **Timeout** - No se cuelga si tarda mucho
- [ ] **Error de red** - Muestra mensaje de error

**Resultado Quick Win 1:** ⏳ PENDIENTE

---

## 🔥 QUICK WIN 2: Heatmap de Ocupación

### Acceso y Visibilidad

- [ ] **Botón visible en toolbar** - Buscar icono BarChart3
- [ ] **Badge correcto** - Debe mostrar emoji 🔥
- [ ] **Tooltip funcional** - Hover muestra "Ver Mapa de Ocupación"
- [ ] **Shortcut H** - Presionar H y verificar que abre

### Funcionalidad del Modal

- [ ] **Modal se abre** - Modal centrado con backdrop
- [ ] **Header con gradiente** - Degradado indigo-purple
- [ ] **Leyenda visible** - Muestra estados con contadores

### Visualización de Mesas

- [ ] **Grid responsive** - Mesas en grid adaptativo
- [ ] **Colores correctos** - Verifica cada estado:
  - [ ] Gris = Vacía (0%)
  - [ ] Azul = Baja (<50%)
  - [ ] Amarillo = Media (50-79%)
  - [ ] Naranja = Alta (80-99%)
  - [ ] Verde = Completa (100%)
  - [ ] Rojo = Sobrecargada (>100%)
- [ ] **Badge de alerta** - Mesas sobrecargadas tienen "!"
- [ ] **Barras de progreso** - Mini barra en cada mesa

### Interactividad

- [ ] **Hover en mesa** - Muestra información completa
- [ ] **Click en mesa** - Cierra modal y enfoca mesa
- [ ] **Resumen estadístico** - Muestra totales correctos
- [ ] **Cerrar modal** - Botón X y botón Cerrar funcionan

### Estados Edge Case

- [ ] **Sin mesas** - Muestra mensaje vacío
- [ ] **Todas vacías** - Todas grises
- [ ] **Todas llenas** - Todas verdes
- [ ] **Dark mode** - Funciona correctamente

**Resultado Quick Win 2:** ⏳ PENDIENTE

---

## 📱 QUICK WIN 3: Vista Lista Móvil

### Acceso y Visibilidad

- [ ] **Botón visible en toolbar** - Buscar icono List
- [ ] **Badge correcto** - Debe mostrar emoji 📱
- [ ] **Tooltip funcional** - Hover muestra "Vista de Lista"
- [ ] **Shortcut V** - Presionar V y verificar que abre

### Funcionalidad del Modal

- [ ] **Modal se abre** - Slide-up desde abajo (móvil) o centro (desktop)
- [ ] **Header con degradado** - Degradado indigo-purple
- [ ] **Filtros visibles** - 4 botones de filtro

### Filtros

- [ ] **Filtro "Todas"** - Muestra todas las mesas
- [ ] **Filtro "Vacías"** - Solo mesas con 0%
- [ ] **Filtro "Parciales"** - Solo 1-99%
- [ ] **Filtro "Completas"** - Solo 100%
- [ ] **Contadores dinámicos** - Números actualizados

### Lista de Mesas

- [ ] **Mesas visibles** - Lista vertical de mesas
- [ ] **Estado visual correcto** - Color según ocupación
- [ ] **Información básica** - Nombre, ocupación, porcentaje

### Expansión de Mesa

- [ ] **Click para expandir** - Mesa se expande
- [ ] **Invitados visibles** - Lista de invitados asignados
- [ ] **Acompañantes mostrados** - +X acompañantes
- [ ] **Botón desasignar** - Botón [-] funciona
- [ ] **Acciones visibles** - Editar, Duplicar, Eliminar

### Interactividad

- [ ] **Editar mesa** - Click en Editar cierra y enfoca
- [ ] **Duplicar mesa** - Crea copia
- [ ] **Eliminar mesa** - Borra mesa
- [ ] **Desasignar invitado** - Libera asiento
- [ ] **Sin resultados** - Mensaje cuando filtro no tiene resultados

### Responsive

- [ ] **Desktop** - Modal centrado
- [ ] **Móvil** - Slide-up desde abajo
- [ ] **Tablet** - Funcionamiento correcto

**Resultado Quick Win 3:** ⏳ PENDIENTE

---

## 🏆 QUICK WIN 4: Sistema de Logros

### Acceso y Visibilidad

- [ ] **Botón visible en toolbar** - Buscar icono Trophy
- [ ] **Badge dinámico** - Muestra porcentaje de progreso
- [ ] **Tooltip funcional** - Hover muestra "Ver Logros"
- [ ] **Shortcut G** - Presionar G y verificar que abre

### Modal de Logros

- [ ] **Modal se abre** - Modal centrado con backdrop
- [ ] **Header con gradiente** - Degradado indigo-purple
- [ ] **Progreso global** - Barra de % y contador
- [ ] **Puntos totales** - Muestra puntos acumulados

### Próximo Logro

- [ ] **Card visible** - Tarjeta destacada azul
- [ ] **Logro sugerido** - Muestra siguiente logro
- [ ] **Información completa** - Título, descripción, puntos

### Filtros de Categorías

- [ ] **Botón "Todos"** - Muestra todos los logros
- [ ] **Botón "Beginner"** - Solo principiante
- [ ] **Botón "Intermediate"** - Solo intermedios
- [ ] **Botón "Advanced"** - Solo avanzados
- [ ] **Botón "Expert"** - Solo expertos

### Lista de Logros

- [ ] **8 logros visibles** - Todos los logros definidos
- [ ] **Logros desbloqueados** - Badge verde "✓ Desbloqueado"
- [ ] **Logros bloqueados** - Icono de candado
- [ ] **Categorías correctas** - Badge de color por categoría
- [ ] **Puntos mostrados** - Puntos de cada logro

### Notificación de Desbloqueo

- [ ] **Generar layout** - Verificar notificación "Primer Layout"
- [ ] **Animación correcta** - Slide-in desde derecha
- [ ] **Partículas flotantes** - Animación de fondo
- [ ] **Icono grande** - Emoji del logro
- [ ] **Puntos destacados** - +X puntos visible
- [ ] **Auto-cierre** - Se cierra después de 5s
- [ ] **Cierre manual** - Botón X funciona
- [ ] **Barra de countdown** - Progreso visual

### Tracking de Eventos

- [ ] **Generar layout** - Desbloquea "Primer Layout" (🎨)
- [ ] **5 layouts** - Desbloquea "Arquitecto" (🏗️)
- [ ] **Usar plantilla** - Cuenta hacia "Explorador" (🎭)
- [ ] **100% asignados** - Desbloquea "Perfeccionista" (💯)
- [ ] **20 mesas** - Desbloquea "Maestro de Mesas" (🎯)
- [ ] **0 conflictos** - Desbloquea "Organizador Maestro" (🏆)

### Persistencia

- [ ] **Reload página** - Logros se mantienen
- [ ] **Clear localStorage** - Se resetea correctamente
- [ ] **Múltiples bodas** - Scope por weddingId

**Resultado Quick Win 4:** ⏳ PENDIENTE

---

## 🔄 TESTS DE INTEGRACIÓN

### Todos los Shortcuts Juntos

- [ ] **Ctrl+K** → Chat IA
- [ ] **H** → Heatmap
- [ ] **V** → Lista
- [ ] **G** → Logros
- [ ] **ESC** → Cierra cualquier modal

### Flujo Completo de Usuario

1. [ ] Abrir Seating Plan
2. [ ] Generar layout automático → Logro "Primer Layout"
3. [ ] Abrir Chat IA (Ctrl+K)
4. [ ] Preguntar "¿Cómo está mi ocupación?"
5. [ ] Abrir Heatmap (H) para ver
6. [ ] Click en mesa roja (sobrecargada)
7. [ ] Abrir Lista Móvil (V)
8. [ ] Filtrar por "Completas"
9. [ ] Expandir mesa
10. [ ] Desasignar un invitado
11. [ ] Abrir Logros (G)
12. [ ] Verificar progreso actualizado
13. [ ] Usar 3 plantillas diferentes → Logro "Explorador"
14. [ ] Asignar 100% invitados → Logro "Perfeccionista"

### Performance

- [ ] **Tiempo de carga** - <2s para abrir cada modal
- [ ] **Animaciones fluidas** - 60fps sin lag
- [ ] **Sin memory leaks** - Cerrar/abrir 10 veces
- [ ] **100+ invitados** - Funciona sin ralentizar

### Responsive Multi-Dispositivo

- [ ] **Desktop 1920x1080** - Todo visible
- [ ] **Laptop 1366x768** - Sin scroll horizontal
- [ ] **Tablet 768x1024** - Modales adaptados
- [ ] **Mobile 375x667** - Touch optimizado

### Dark Mode

- [ ] **Toggle tema** - Cambiar a oscuro
- [ ] **Chat IA dark** - Colores correctos
- [ ] **Heatmap dark** - Contraste adecuado
- [ ] **Lista dark** - Legible
- [ ] **Logros dark** - Todo visible

---

## 🐛 BUGS ENCONTRADOS

### Bug 1:

- **Descripción:**
- **Severidad:**
- **Pasos para reproducir:**
- **Estado:**

### Bug 2:

- **Descripción:**
- **Severidad:**
- **Pasos para reproducir:**
- **Estado:**

---

## 📊 RESUMEN DE RESULTADOS

| Quick Win   | Tests Pasados | Tests Totales | %      | Estado |
| ----------- | ------------- | ------------- | ------ | ------ |
| Chat IA     | 0             | 20            | 0%     | ⏳     |
| Heatmap     | 0             | 18            | 0%     | ⏳     |
| Lista Móvil | 0             | 24            | 0%     | ⏳     |
| Logros      | 0             | 28            | 0%     | ⏳     |
| **TOTAL**   | **0**         | **90**        | **0%** | ⏳     |

---

## ✅ CRITERIOS DE ACEPTACIÓN

Para considerar COMPLETADO:

- [ ] Al menos 85% de tests pasados
- [ ] 0 bugs críticos
- [ ] Performance aceptable (<2s)
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Responsive en 3 tamaños
- [ ] Dark mode 100% funcional

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DEL TESTING

### Si todo pasa (>85%):

1. ✅ Commit de todos los cambios
2. ✅ Push a repositorio
3. ✅ Deploy a staging
4. ✅ Testing con usuarios reales
5. ✅ Deploy a producción

### Si hay bugs (<85%):

1. 🐛 Listar todos los bugs
2. 🐛 Priorizar por severidad
3. 🐛 Fix de bugs críticos
4. 🐛 Re-testing
5. 🐛 Repetir hasta >85%

---

**Fecha de inicio:** 17 Nov 2025, 15:46  
**Fecha de fin:** **\*\***\_\_\_**\*\***  
**Tester:** Cascade AI  
**Navegador:** Chrome  
**Sistema:** macOS
