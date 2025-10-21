# Flujo 13: E2E del Seating Plan

Este documento describe cÃ³mo ejecutar y quÃ© validan los tests E2E del Seating Plan. Cubre generaciÃ³n de layouts, dibujo de Ã¡reas, undo/redo, asignaciÃ³n automÃ¡tica (Auto-IA), toasts y flujo de ceremonia.
> Pendiente: integrar la suite en CI, ampliar escenarios edge y automatizar reportes de ejecucion.

## Prerrequisitos

- Frontend en ejecuciÃ³n (el usuario ya lo levanta; no iniciar servidores desde este flujo).
- Backend en ejecuciÃ³n si se desea probar `Auto-IA` real (ruta `POST /api/ai-assign`). Si el backend no estÃ¡ disponible, el test de toasts contempla el toast de error.
- Cypress instalado a travÃ©s de dependencias del proyecto.

## ConfiguraciÃ³n de Cypress

Archivo: `cypress/config.js`

- Base URL: se determina asÃ­
  1. `CYPRESS_BASE_URL` (si estÃ¡ definida)
  2. `FRONTEND_PORT` del `.env` (si existe)
  3. Fallback: `http://localhost:5173`

```js
baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`
```

Bypass de autenticaciÃ³n para E2E:
- En `src/App.jsx`, `ProtectedRoute` permite pasar directamente si detecta `window.Cypress`.
- Esto evita necesidad de login durante E2E.

## Rutas relevantes

- Vista del Seating Plan: `/invitados/seating`

## Especificaciones de test

UbicaciÃ³n de los specs:
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
  - Cambiar a la pestaÃ±a Banquete.
  - Abrir âConfigurar Banqueteâ y generar un layout (2x2, 4 asientos).
  - Dibujar un perÃ­metro (herramienta PerÃ­metro) y volver a Navegar.
  - Usar Undo y Redo sin romper la vista.
  - Ejecutar Auto-IA y mantener la UI de la Toolbar disponible.

Selectores y UI usados:
- Botones de Toolbar con `title`: âConfigurar banqueteâ, âPlantillasâ, etc. (`src/components/seating/SeatingPlanToolbar.jsx`)
- El lienzo de dibujo usa un `<svg>` (de `FreeDrawCanvas`)

### 2) seating_ceremony.cy.js (Ceremonia)
Valida que:
- Se puede abrir âConfigurar Ceremoniaâ y generar sillas.
- Aparecen elementos de silla (`div[aria-label^= â Silla â ]`).
- Al hacer click en una silla, cambia el estilo (borde dashed), validando el toggle de habilitado.

## Estado de ImplementaciÃ³n

### Completado
- DocumentaciÃ³n de ejecuciÃ³n y especificaciones de pruebas E2E

### En Desarrollo
- AmpliaciÃ³n de cobertura de casos y escenarios edge

## Roadmap / pendientes
- IntegraciÃ³n en pipeline de CI y reporte automÃ¡tico

### 3) seating_toasts.cy.js (Toasts)
Valida que:
- Guardar âConfigurar Espacioâ muestra toast âDimensiones guardadasâ.
- Ejecutar âAuto IAâ muestra un toast de Ã©xito o de error (ambos caminos vÃ¡lidos segÃºn disponibilidad del backend).

Los toasts se gestionan en `src/components/seating/SeatingPlanRefactored.jsx` con `react-toastify`.

## EjecuciÃ³n de E2E

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
- Los tests asumen que la UI del Seating Plan estÃ¡ disponible y que `ProtectedRoute` detecta Cypress para bypass de login.

## ImplementaciÃ³n tÃ©cnica relevante

- Componente principal del flujo: `src/components/seating/SeatingPlanRefactored.jsx`
- Toolbar: `src/components/seating/SeatingPlanToolbar.jsx`
- Canvas contenedor: `src/components/seating/SeatingPlanCanvas.jsx` (zoom, pan, props hacia el lienzo base)
- Lienzo base: `src/features/seating/SeatingCanvas.jsx`
- Dibujo libre: `src/components/FreeDrawCanvas.jsx`
- Hook de estado y lÃ³gica: `src/hooks/useSeatingPlan.js`
  - GeneraciÃ³n `generateSeatGrid`, `generateBanquetLayout`
  - Undo/Redo por snapshots (`createSnapshot`/`applySnapshot`)
  - GestiÃ³n de Ã¡reas: `addArea`, `deleteArea`, `updateArea`
  - AsignaciÃ³n: `moveGuest`, y handlers de asignaciÃ³n en el componente principal
  - Persistencia dimensiones: `saveHallDimensions` (doc `.../seatingPlan/banquet` con `config: {width,height}`)
  - Autosave incluye `mode` (herramienta activa)
  - Persistencia de Ã¡reas con semÃ¡ntica: objeto `{ type, points }`
  - NormalizaciÃ³n de invitado: se escribe `tableId` (y `table` legacy)

## Atajos y Acciones rÃ¡pidas

- Atajos de teclado:
  - 1: Navegar (pan)
  - 2: Mover mesas
  - 3: PerÃ­metro
  - 4: Puertas
  - 5: ObstÃ¡culos
  - 6: Pasillos
  - Backspace: eliminar mesa seleccionada (con confirmaciÃ³n)
- Acciones de mesa en Sidebar:
  - Duplicar mesa
  - Eliminar mesa (confirmaciÃ³n)

## Troubleshooting

- Si el test de Auto-IA falla por 5xx/timeout: se aceptan ambos resultados (Ã©xito o error) porque el spec valida la apariciÃ³n de un toast tras la acciÃ³n, no el contenido especÃ­fico de la asignaciÃ³n.
- Si no se dibuja el perÃ­metro:
  - Asegura que la herramienta âPerÃ­metroâ estÃ© activa y que luego vuelves a âNavegarâ para finalizar.
- Si no aparecen sillas:
  - Revisa que el modal de âConfigurar Ceremoniaâ haya sido enviado con âGenerarâ.

## Cobertura y prÃ³ximos pasos

- Cobertura actual (UI): generaciÃ³n, dibujo, undo/redo, Auto-IA (feedback), ceremonia toggle y toasts clave.
- PrÃ³ximos pasos recomendados:
  - AÃ±adir un test para asignaciÃ³n/ desasignaciÃ³n de invitados con drag & drop y botÃ³n Ã.
  - Validar guardado/recuperaciÃ³n de dimensiones al recargar pÃ¡gina (requiere mocks o backend real y datos de usuario).

## Cobertura E2E implementada
- `cypress/e2e/seating/seating_smoke.cy.js` y `cypress/e2e/seating/seating_assign_unassign.cy.js`: validan creación de salones, asignación y desasignación de invitados.
- `cypress/e2e/seating/seating_capacity_limit.cy.js`, `cypress/e2e/seating/seating_no_overlap.cy.js` y `cypress/e2e/seating/seating_obstacles_no_overlap.cy.js`: cubren reglas de capacidad, colisiones y obstáculos.
- `cypress/e2e/seating/seating_template_circular.cy.js`, `cypress/e2e/seating/seating_template_u_l_imperial.cy.js` y `cypress/e2e/seating/seating_ceremony.cy.js`: ejercitan plantillas y configuraciones especiales.
- `cypress/e2e/seating/seating_fit.cy.js`, `cypress/e2e/seating/seating_aisle_min.cy.js` y `cypress/e2e/seating/seating_toasts.cy.js`: prueban distribución automática, pasillos mínimos y flujos de brindis.
- `cypress/e2e/seating/seating_auto_ai.cy.js`, `cypress/e2e/seating/seating_area_type.cy.js` y `cypress/e2e/seating/seating_delete_duplicate.cy.js`: cubren auto-IA, tipos de áreas y deduplicación.
- `cypress/e2e/seating/seating-content-flow.cy.js`: confirma disponibilidad de contenidos auxiliares vinculados con Momentos.
- `cypress/e2e/seating/seating-basic.cy.js`, `cypress/e2e/seating/seating-conflicts.cy.js` y `cypress/e2e/seating/seating_ui_panels.cy.js`: smoke básico, resolución de conflictos y paneles secundarios.
- `cypress/e2e/seating/seating-export.cy.js`: valida exportaciones PDF/Excel.

## Cobertura y prÃ³ximos pasos

- Cobertura actual (UI): generaciÃ³n, dibujo, undo/redo, Auto-IA (feedback), ceremonia toggle y toasts clave.
- PrÃ³ximos pasos recomendados:
  - AÃ±adir un test para asignaciÃ³n/ desasignaciÃ³n de invitados con drag & drop y botÃ³n Ã.
  - Validar guardado/recuperaciÃ³n de dimensiones al recargar pÃ¡gina (requiere mocks o backend real y datos de usuario).

