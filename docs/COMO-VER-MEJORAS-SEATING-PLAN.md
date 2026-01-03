# Cómo ver las mejoras del Seating Plan

Este documento explica cómo validar las nuevas funciones de generación automática del Seating Plan: qué elementos deberían aparecer, cómo probarlos paso a paso y dónde revisar en caso de que no veas los cambios.

## 🎯 Qué deberías ver

### 1. En la página de Seating Plan

Cuando entres a `/seating` o `/invitados/seating` deberías notar dos novedades principales:

#### A) Botón «Generar Layout Automático»

- **Ubicación:** panel superior (`SeatingPlanSummary`), justo debajo de las estadísticas.
- **Aspecto:** botón azul con gradiente y el icono `Sparkles`.
- **Texto:** «Generar Layout Automático» la primera vez, «Regenerar Layout» si ya hay mesas generadas.
- **Visibilidad:** aparece cuando `assignedPersons > 0` o `hasAssignedTables = true`.

#### B) Modal de selección de distribución

- **Apertura:** al pulsar el botón anterior.
- **Contenido esperado:**
  - Título «Generar Layout Automático».
  - Estadísticas de mesas detectadas, invitados asignados y personas sin mesa.
  - Seis tarjetas con distribuciones: Columnas, Circular, Pasillos, En U, Espiga y Aleatorio (cada una con su icono).
  - Botones «Generar Layout» (primario) y «Cancelar» (secundario).

## 🧪 Cómo probar

### Paso 1 · Preparar datos

1. Ve a **Invitados**.
2. Crea o localiza al menos cinco invitados.
3. Asigna mesas de prueba:
   ```text
   Invitado 1 → Mesa 1
   Invitado 2 → Mesa 1
   Invitado 3 → Mesa 2
   Invitado 4 → Mesa 2
   Invitado 5 → Mesa 3
   ```

### Paso 2 · Abrir Seating Plan

1. En el menú lateral selecciona **Seating Plan**.
2. Asegúrate de estar en la pestaña **Banquete** (no en Ceremonia).

### Paso 3 · Confirmar el botón

Deberías ver el panel con las métricas y, debajo, el botón azul:

```
┌────────────────────────────────────────┐
│ Resumen general                        │
│ X personas ubicadas                    │
│                                        │
│ Pendientes: X    Mesas activas: X      │
│                                        │
│ [✨ Generar Layout Automático]          │
└────────────────────────────────────────┘
```

### Paso 4 · Generar el layout

1. Pulsa **Generar Layout Automático**.
2. Selecciona una distribución (por ejemplo «Circular»).
3. Haz clic en **Generar Layout**.
4. El modal se cierra y el canvas muestra las mesas colocadas con su capacidad y los invitados asignados.

## 🚫 Si no ves el botón

1. **No hay invitados asignados:** vuelve a Invitados y asigna al menos un invitado a alguna mesa.
2. **Estás en Ceremonia:** cambia a la pestaña **Banquete**.
3. **El componente no cargó:** recarga la página (`F5`).
4. **Hay errores en la consola:** abre DevTools (`F12`), revisa la pestaña Console y toma nota de cualquier error rojo.

## 🛠️ Depuración

### Verificar archivos

```bash
# Utilidades
ls src/utils/seatingLayoutGenerator.js

# Modal
ls src/components/seating/AutoLayoutModal.jsx

# Documentación
ls docs/MEJORAS-SEATING-PLAN.md
```

### Revisar código clave

1. `src/components/seating/SeatingPlanSummary.jsx`
   - Debe contener el botón con `<Sparkles className="h-4 w-4" />`.
2. `src/components/seating/SeatingPlanRefactored.jsx`
   - Debe importar `AutoLayoutModal` y renderizarlo.
   - Comprueba que existen `handleOpenAutoLayout` y `handleCloseAutoLayout`.
3. En el navegador, abre la consola y ejecuta:
   ```javascript
   console.log('Auto layout ready', window?.autoLayout?.generateAutoLayoutFromGuests);
   ```
   Debería devolver una función.

## 📦 Archivos implementados

### Nuevos

1. `src/utils/seatingLayoutGenerator.js`
2. `src/components/seating/AutoLayoutModal.jsx`
3. `docs/MEJORAS-SEATING-PLAN.md`

### Modificados

1. `src/hooks/_useSeatingPlanDisabled.js`
2. `src/components/seating/SeatingPlanRefactored.jsx`
3. `src/components/seating/SeatingPlanSummary.jsx`

## ⚡ Inicio rápido

1. Ejecuta `npm run dev`.
2. Abre `http://localhost:5173`.
3. Inicia sesión.
4. Asigna mesas desde **Invitados**.
5. Entra en **Seating Plan** y verifica el botón azul con el icono `Sparkles`.

**Condición para mostrar el botón**

- `hasAssignedTables === true`, o
- `assignedPersons > 0`.

Para ver los valores en directo, en la consola del navegador:

```javascript
window.__SEATING_DEBUG__ = true;
```

Recarga y revisa los logs.

## 🖼️ Capturas esperadas

### 1. Panel superior con CTA

```
┌────────────────────────────────────────────────────┐
│ Resumen general                                    │
│ 24 personas ubicadas                               │
│ 24 de 50 invitados y acompañantes                  │
│                                                    │
│ Pendientes: 26    Mesas activas: 0                 │
│                                                    │
│ [✨ Generar Layout Automático]                      │
└────────────────────────────────────────────────────┘
```

### 2. Modal de selección

```
┌───────────────────────────────────────────────┐
│ Generar Layout Automático                     │
├───────────────────────────────────────────────┤
│ 🎯 Datos detectados                           │
│ 8 mesas detectadas                            │
│ 24 invitados asignados                        │
│ 26 sin mesa                                   │
├───────────────────────────────────────────────┤
│ Selecciona una distribución                   │
│ [Grid] [Circular] [Pasillos] [En U] [Espiga]… │
└───────────────────────────────────────────────┘
```

### 3. Resultado final

Un canvas con las mesas posicionadas automáticamente según la distribución elegida.

## ❗ Problemas comunes

| Situación           | Causa probable                                   | Solución                                                                   |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| El botón no aparece | No hay invitados asignados                       | Asigna al menos un invitado a una mesa.                                    |
| El modal no abre    | Error JavaScript                                 | Revisa DevTools → Console para encontrar el mensaje.                       |
| No se genera nada   | El hook no expone `generateAutoLayoutFromGuests` | Verifica la exportación en `useWeddingServices` y su uso en el componente. |

## 🆘 Soporte

Si tras seguir estos pasos aún no ves las mejoras:

1. Toma una captura de la página de Seating Plan.
2. Copia cualquier error de la consola del navegador.
3. Confirma que en **Invitados** hay personas asignadas a mesas.
4. Comparte la información con el equipo para continuar la investigación.
