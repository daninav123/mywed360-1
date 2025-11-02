# Tests E2E - Seating Plan

## 📋 Suite Completa de Tests

Esta carpeta contiene la suite completa de tests E2E para el Seating Plan de MyWed360.

### Tests Implementados (11 total)

1. **seating_smoke.cy.js** - Smoke test básico
   - Carga de página
   - Tabs ceremonia/banquete
   - Modales de configuración
   - Herramientas de dibujo
   - Undo/Redo
   - Validaciones básicas

2. **seating_assign_unassign.cy.js** - Asignación de invitados
   - Panel de invitados pendientes
   - Drawer/modal de invitados
   - Selección de mesas
   - Asignación a mesa
   - Desasignación
   - Validación de capacidad

3. **seating_fit.cy.js** - Ajuste al lienzo
   - Botón de ajustar a pantalla
   - Zoom in/out
   - Pan (desplazar vista)
   - Indicadores de zoom
   - Ajuste automático

4. **seating_toasts.cy.js** - Mensajes y feedback
   - Sistema de toasts
   - Feedback al guardar
   - Feedback al ejecutar Auto-IA
   - Feedback al generar layouts

5. **seating_capacity_limit.cy.js** - Límites de capacidad
   - Validación de capacidad máxima
   - Advertencias al exceder
   - Actualización de capacidad

6. **seating_aisle_min.cy.js** - Pasillos mínimos
   - Dibujar pasillos
   - Validación de ancho mínimo
   - Visualización en canvas

7. **seating_obstacles_no_overlap.cy.js** - Obstáculos
   - Dibujar obstáculos
   - Validación sin solape
   - Detección de colisiones

8. **seating_auto_ai.cy.js** - Auto-IA
   - Botón de Auto-IA
   - Ejecución sin errores
   - Feedback tras ejecución

9. **seating_template_circular.cy.js** - Plantilla circular
   - Selector de plantillas
   - Distribución circular
   - Generación de layout

10. **seating_template_u_l_imperial.cy.js** - Plantillas U/L/Imperial
    - Plantilla en U
    - Otras plantillas (espiga, columnas)
    - Generación de múltiples layouts

11. **seating_no_overlap.cy.js** - Sin solapamientos
    - Validación de solapamiento
    - Detección de colisiones
    - Validaciones en vivo

## 🚀 Ejecutar Tests

### Todos los tests de seating

```bash
npm run cypress:run -- --spec "cypress/e2e/seating/*.cy.js"
```

### Test específico

```bash
npm run cypress:run -- --spec "cypress/e2e/seating/seating_smoke.cy.js"
```

### Modo interactivo

```bash
npx cypress open
# Seleccionar: E2E Testing > seating/
```

## ✅ Criterios de Éxito

Cada test debe:

- ✅ Cargar la página sin errores
- ✅ Encontrar los elementos esperados (o manejar su ausencia)
- ✅ Ejecutar acciones sin errores críticos
- ✅ Validar comportamiento esperado

## 📝 Notas Importantes

1. **Bypass de Autenticación**: Los tests detectan `window.Cypress` para bypass automático en `ProtectedRoute`

2. **Selectores Flexibles**: Los tests usan selectores múltiples para adaptarse a cambios de UI:
   - `data-testid` (preferido)
   - Texto de botones
   - Títulos y aria-labels
   - Clases CSS

3. **Timeouts y Waits**: Se usan `cy.wait()` estratégicos para permitir:
   - Carga de componentes
   - Animaciones
   - Respuestas de API

4. **Validaciones Defensivas**: Los tests verifican existencia antes de interactuar:
   ```js
   cy.get('body').then(($body) => {
     if ($body.find('button:contains("Acción")').length > 0) {
       cy.get('button:contains("Acción")').click();
     }
   });
   ```

## 🐛 Troubleshooting

### Test falla con "element not found"

- Verificar que el servidor está corriendo en `localhost:5173`
- Revisar que el componente se renderiza correctamente
- Ajustar selectores si cambió la UI

### Test pasa localmente pero falla en CI

- Verificar timeouts (CI puede ser más lento)
- Comprobar variables de entorno
- Revisar viewport y resolución

### Errores de Firestore

- Asegurarse que tests de reglas Firestore pasan primero
- Verificar configuración de Firebase en test

## 📊 Cobertura Esperada

- **Funcionalidad Base**: 90%
- **Casos Edge**: 60%
- **Integración**: 80%
- **UI/UX**: 85%

## 🔄 Mantenimiento

Actualizar tests cuando:

- Se modifique UI del seating plan
- Se añadan nuevas funcionalidades
- Se cambien selectores o data-testids
- Se modifique flujo de usuario

## 📚 Referencias

- Documentación Cypress: https://docs.cypress.io
- Flujo 13 (Seating E2E): `docs/flujos-especificos/flujo-13-seating-plan-e2e.md`
- Roadmap Seating: `docs/diseno/ROADMAP-10-MEJORAS-SEATING.md`
