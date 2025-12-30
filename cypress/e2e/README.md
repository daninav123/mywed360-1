# Tests E2E - Cypress

**Última actualización:** 29 Diciembre 2025

## 📋 Estado Actual

Se han eliminado todos los tests E2E obsoletos debido a cambios significativos en el proyecto.

**Test activo:**
- ✅ `supplier-acceptance-propagation.cy.js` - Test de propagación de aceptación de proveedores

## 🗑️ Tests Eliminados

Los siguientes tests fueron eliminados por estar obsoletos:
- ❌ `design-editor/canvas-dimensions.cy.js`
- ❌ `design-editor/dimensions-test.cy.js`
- ❌ Todos los tests antiguos de seating, email, finance, etc.

## 🚀 Ejecutar Tests

```bash
# Ejecutar el test actual
npm run cypress:run

# Abrir Cypress UI
npm run cypress:open

# Ejecutar test específico
npx cypress run --spec "cypress/e2e/supplier-acceptance-propagation.cy.js"
```

## 📝 Notas

- Los tests antiguos se eliminaron porque el código cambió significativamente
- El test actual (`supplier-acceptance-propagation.cy.js`) es el único mantenido y actualizado
- Para crear nuevos tests E2E, usar este test como referencia

---

**Razón de limpieza:** Cambios arquitectónicos importantes en el proyecto hicieron que los tests antiguos quedaran obsoletos e inutilizables.
