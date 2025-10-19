# Flujo 13: E2E del Seating Plan

Este documento describe cómo ejecutar y qué validan los tests E2E del Seating Plan. Cubre generación de layouts, dibujo de áreas, undo/redo, asignación automática (Auto-IA), toasts y flujo de ceremonia.
> Pendiente: integrar la suite en CI, ampliar escenarios edge y automatizar reportes de ejecucion.

## Prerrequisitos

- Frontend en ejecución (el usuario ya lo levanta; no iniciar servidores desde este flujo).
- Backend en ejecución si se desea probar `Auto-IA` real (ruta `POST /api/ai-assign`). Si el backend no está disponible, el test de toasts contempla el toast de error.
- Cypress instalado a través de dependencias del proyecto.

## Configuración de Cypress

Archivo: `cypress/config.js`

- Base URL: se determina así
  1. `CYPRESS_BASE_URL` (si está definida)
  2. `FRONTEND_PORT` del `.env` (si existe)
  3. Fallback: `http://localhost:5173`

```js
baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`
```

Bypass de autenticación para E2E:
- En `src/App.jsx`, `ProtectedRoute` permite pasar directamente si detecta `window.Cypress`.
- Esto evita necesidad de login durante E2E.

## Rutas relevantes

- Vista del Seating Plan: `/invitados/seating`

## Especificaciones de test

Ubicación de los specs:
- `cypress/e2e/seating/seating_smoke.cy.js`
- `cypress/e2e/seating/seating_ceremony.cy.js`
- `cypress/e2e/seating/seating_toasts.cy.js`
- `cypress/e2e/seating/seating_fit.cy.js`
- `cypress/e2e/seating/seating_area_type.cy.js`
- `cypress/e2e/seating/seating_assign_unassign.cy.js`
- `cypress/e2e/seating/seating_auto_ai.cy.js`
- `cypress/e2e/seating/seating-content-flow.cy.js`

### 1) seating_smoke.cy.js (Smoke general)
Valida que:
- La ruta de seating renderiza correctamente.
- Se puede:
  - Cambiar a la pestaña Banquete.
  - Abrir “Configurar Banquete” y generar un layout (2x2, 4 asientos).
  - Dibujar un perímetro (herramienta Perímetro) y volver a Navegar.
  - Usar Undo y Redo sin romper la vista.
  - Ejecutar Auto-IA y mantener la UI de la Toolbar disponible.

Selectores y UI usados:
- Botones de Toolbar con `title`: “Configurar banquete”, “Plantillas”, etc. (`src/components/seating/SeatingPlanToolbar.jsx`)
- El lienzo de dibujo usa un `<svg>` (de `FreeDrawCanvas`)

### 2) seating_ceremony.cy.js (Ceremonia)
Valida que:
- Se puede abrir “Configurar Ceremonia” y generar sillas.
- Aparecen elementos de silla (`div[aria-label^= – Silla – ]`).
- Al hacer click en una silla, cambia el estilo (borde dashed), validando el toggle de habilitado.

## Estado de Implementación

### Completado
- Documentación de ejecución y especificaciones de pruebas E2E

### En Desarrollo
- Ampliación de cobertura de casos y escenarios edge

## Roadmap / pendientes
- Integración en pipeline de CI y reporte automático

### 3) seating_toasts.cy.js (Toasts)
Valida que:
- Guardar “Configurar Espacio” muestra toast “Dimensiones guardadas”.
- Ejecutar “Auto IA” muestra un toast de éxito o de error (ambos caminos válidos según disponibilidad del backend).

Los toasts se gestionan en `src/components/seating/SeatingPlanRefactored.jsx` con `react-toastify`.

## Ejecución de E2E

- Headless:
```
npm run cy:run
```
- Con interfaz (seleccionar specs manualmente):
```
npx cypress open
```

Notas:
- El proyecto tiene `screenshotOnRunFailure: true` por defecto en `cypress.config.js`.
- Los tests asumen que la UI del Seating Plan está disponible y que `ProtectedRoute` detecta Cypress para bypass de login.

## Implementación técnica relevante

- Componente principal del flujo: `src/components/seating/SeatingPlanRefactored.jsx`
- Toolbar: `src/components/seating/SeatingPlanToolbar.jsx`
- Canvas contenedor: `src/components/seating/SeatingPlanCanvas.jsx` (zoom, pan, props hacia el lienzo base)
- Lienzo base: `src/features/seating/SeatingCanvas.jsx`
- Dibujo libre: `src/components/FreeDrawCanvas.jsx`
- Hook de estado y lógica: `src/hooks/useSeatingPlan.js`
  - Generación `generateSeatGrid`, `generateBanquetLayout`
  - Undo/Redo por snapshots (`createSnapshot`/`applySnapshot`)
  - Gestión de áreas: `addArea`, `deleteArea`, `updateArea`
  - Asignación: `moveGuest`, y handlers de asignación en el componente principal
  - Persistencia dimensiones: `saveHallDimensions` (doc `.../seatingPlan/banquet` con `config: {width,height}`)
  - Autosave incluye `mode` (herramienta activa)
  - Persistencia de áreas con semántica: objeto `{ type, points }`
  - Normalización de invitado: se escribe `tableId` (y `table` legacy)

## Atajos y Acciones rápidas

- Atajos de teclado:
  - 1: Navegar (pan)
  - 2: Mover mesas
  - 3: Perímetro
  - 4: Puertas
  - 5: Obstáculos
  - 6: Pasillos
  - Backspace: eliminar mesa seleccionada (con confirmación)
- Acciones de mesa en Sidebar:
  - Duplicar mesa
  - Eliminar mesa (confirmación)

## Troubleshooting

- Si el test de Auto-IA falla por 5xx/timeout: se aceptan ambos resultados (éxito o error) porque el spec valida la aparición de un toast tras la acción, no el contenido específico de la asignación.
- Si no se dibuja el perímetro:
  - Asegura que la herramienta “Perímetro” esté activa y que luego vuelves a “Navegar” para finalizar.
- Si no aparecen sillas:
  - Revisa que el modal de “Configurar Ceremonia” haya sido enviado con “Generar”.

## Cobertura y próximos pasos

- Cobertura actual (UI): generación, dibujo, undo/redo, Auto-IA (feedback), ceremonia toggle y toasts clave.
- Próximos pasos recomendados:
  - Añadir un test para asignación/ desasignación de invitados con drag & drop y botón ×.
  - Validar guardado/recuperación de dimensiones al recargar página (requiere mocks o backend real y datos de usuario).

## Cobertura E2E implementada
- `cypress/e2e/seating/seating_smoke.cy.js` y `cypress/e2e/seating/seating_assign_unassign.cy.js`: validan creaci�n de salones, asignaci�n y desasignaci�n de invitados.
- `cypress/e2e/seating/seating_capacity_limit.cy.js`, `cypress/e2e/seating/seating_no_overlap.cy.js` y `cypress/e2e/seating/seating_obstacles_no_overlap.cy.js`: cubren reglas de capacidad, colisiones y obst�culos.
- `cypress/e2e/seating/seating_template_circular.cy.js`, `cypress/e2e/seating/seating_template_u_l_imperial.cy.js` y `cypress/e2e/seating/seating_ceremony.cy.js`: ejercitan plantillas y configuraciones especiales.
- `cypress/e2e/seating/seating_fit.cy.js`, `cypress/e2e/seating/seating_aisle_min.cy.js` y `cypress/e2e/seating/seating_toasts.cy.js`: prueban distribuci�n autom�tica, pasillos m�nimos y flujos de brindis.
- `cypress/e2e/seating/seating_auto_ai.cy.js`, `cypress/e2e/seating/seating_area_type.cy.js` y `cypress/e2e/seating/seating_delete_duplicate.cy.js`: cubren auto-IA, tipos de �reas y deduplicaci�n.
- `cypress/e2e/seating/seating-content-flow.cy.js`: confirma disponibilidad de contenidos auxiliares vinculados con Momentos.
- `cypress/e2e/seating/seating-basic.cy.js`, `cypress/e2e/seating/seating-conflicts.cy.js` y `cypress/e2e/seating/seating_ui_panels.cy.js`: smoke b�sico, resoluci�n de conflictos y paneles secundarios.
- `cypress/e2e/seating/seating-export.cy.js`: valida exportaciones PDF/Excel.

## Cobertura y próximos pasos

- Cobertura actual (UI): generación, dibujo, undo/redo, Auto-IA (feedback), ceremonia toggle y toasts clave.
- Próximos pasos recomendados:
  - Añadir un test para asignación/ desasignación de invitados con drag & drop y botón ×.
  - Validar guardado/recuperación de dimensiones al recargar página (requiere mocks o backend real y datos de usuario).

