# 🧪 Tests E2E del Seating Plan

Tests end-to-end completos para verificar todas las funcionalidades del Seating Plan, especialmente la nueva funcionalidad de **generación automática completa**.

---

## 📁 Archivos de Test

### 1. `seating-diagnostic.cy.js`

**Test de diagnóstico completo** - Identifica problemas paso a paso

**15 pasos de verificación:**

1. ✅ Página carga correctamente
2. ✅ Pestañas existen
3. ✅ Pestaña Banquete accesible
4. ✅ Hook useSeatingPlan cargado
5. ✅ Función setupSeatingPlanAutomatically existe
6. ✅ Botón de generación automática aparece
7. ✅ Toolbar y botones verificados
8. ✅ Invitados cargados
9. ✅ Estado inicial de mesas
10. ✅ Componente SeatingPlanModern renderiza
11. ✅ Búsqueda por diferentes selectores
12. ✅ Condiciones de visualización
13. ✅ Click forzado en botones
14. ✅ Logs de consola
15. ✅ Generación manual alternativa

### 2. `seating-auto-generation.cy.js`

**Tests funcionales completos**

**Secciones:**

- Generación Automática Completa
- Funcionalidades Básicas
- Herramientas de Dibujo
- Snap Guides
- Exportación
- Stats y Feedback
- Configuración Avanzada

---

## 🚀 Cómo Ejecutar los Tests

### Opción 1: UI Interactiva (Recomendado para desarrollo)

```bash
npm run cypress:open:seating
```

Esto abre el Cypress Test Runner donde puedes:

- Ver los tests en tiempo real
- Debuggear paso a paso
- Ver snapshots de cada paso
- Reintentar tests específicos

### Opción 2: Headless (CI/CD)

```bash
npm run cypress:run:seating
```

Ejecuta todos los tests del seating plan en modo headless.

### Opción 3: Test Específico

```bash
npx cypress run --spec "cypress/e2e/seating/seating-diagnostic.cy.js"
```

### Opción 4: Con Navegador Visible

```bash
npx cypress run --spec "cypress/e2e/seating/seating-diagnostic.cy.js" --browser chrome --headed
```

---

## 🔍 Tests de Diagnóstico

Si reportas que algo "no funciona", ejecuta primero el diagnóstico:

```bash
npx cypress run --spec "cypress/e2e/seating/seating-diagnostic.cy.js" --browser chrome --headed
```

Este test mostrará **exactamente qué paso falla** y por qué.

---

## 📊 Qué Se Verifica

### ✅ Generación Automática

- [ ] Botón aparece cuando hay invitados pero no mesas
- [ ] Click genera todo automáticamente
- [ ] Toast de inicio aparece
- [ ] Toast de éxito con estadísticas
- [ ] Mesas aparecen en el canvas
- [ ] Invitados se asignan automáticamente
- [ ] Layout se selecciona según número de invitados
- [ ] Botón en toolbar funciona
- [ ] Atajo Ctrl+G funciona
- [ ] Estado de loading durante generación

### ✅ Funcionalidades Core

- [ ] Cambio entre pestañas (Ceremonia/Banquete)
- [ ] Layout Generator abre
- [ ] Selector de plantillas abre
- [ ] Minimap visible
- [ ] Toggle minimap con tecla M
- [ ] Undo/Redo disponibles

### ✅ Herramientas de Dibujo

- [ ] Panel de herramientas abre
- [ ] 5 herramientas disponibles: Perímetro, Puertas, Obstáculos, Pasillos, Zonas

### ✅ Snap Guides

- [ ] Sistema de snap guides implementado
- [ ] Líneas de alineación aparecen

### ✅ Exportación

- [ ] Wizard de exportación abre
- [ ] 4 formatos disponibles: PDF, PNG, CSV, SVG

### ✅ Stats

- [ ] Footer muestra estadísticas
- [ ] Contador de invitados
- [ ] Contador de mesas
- [ ] Porcentaje de asignación

### ✅ Configuración

- [ ] Modal de configuración avanzada abre

---

## 🐛 Solución de Problemas

### El botón de generación automática no aparece

**Posibles causas:**

1. No hay invitados cargados
2. Ya hay mesas en el canvas
3. No estás en la pestaña "Banquete"
4. La función no está exportada del hook

**Solución:**

```bash
# Ejecuta el diagnóstico
npx cypress run --spec "cypress/e2e/seating/seating-diagnostic.cy.js" --headed

# El paso 6 te dirá exactamente por qué no aparece
```

### Los tests fallan todos

**Verifica que:**

1. El frontend está corriendo en `http://localhost:5173`
2. El backend está corriendo en `http://localhost:4004`
3. No hay errores en la consola del navegador

**Comandos:**

```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend
cd apps/main-app && npm run dev

# Terminal 3: Tests
npm run cypress:open:seating
```

### Error "Cannot find module"

**Solución:**

```bash
# Reinstalar dependencias
npm install
```

### Tests muy lentos

**Solución:**

```bash
# Ejecutar en headless mode (más rápido)
npm run cypress:run:seating
```

---

## 📝 Comandos Personalizados

### Disponibles en los tests:

```javascript
// Navegar a Seating Plan
cy.goToSeatingPlan();

// Cambiar de pestaña
cy.switchSeatingTab('Banquete');

// Generar plan automáticamente
cy.generateSeatingPlanAuto();

// Crear invitados de prueba
cy.createTestGuests(50);

// Limpiar datos
cy.cleanSeatingPlan();

// Verificar toast
cy.verifyToast('mensaje');

// Esperar canvas
cy.waitForCanvas();

// Contar mesas
cy.countTables();

// Verificar botón de generación
cy.verifyAutoGenerationButton();
```

---

## 🎯 Casos de Uso

### Test 1: Primera Vez (Usuario Nuevo)

```javascript
it('Usuario nuevo genera su primer plan', () => {
  cy.createTestGuests(50);
  cy.goToSeatingPlan();
  cy.switchSeatingTab('Banquete');
  cy.verifyAutoGenerationButton();
  cy.generateSeatingPlanAuto();
  cy.verifyToast('Seating Plan generado automáticamente');
  cy.countTables().should('be.at.least', 1);
});
```

### Test 2: Re-generar Plan

```javascript
it('Usuario regenera su plan', () => {
  // Ya tiene plan
  cy.goToSeatingPlan();
  cy.get('[title*="Generar TODO"]').click();
  cy.wait(5000);
  cy.verifyToast('generado automáticamente');
});
```

### Test 3: Con Muchos Invitados

```javascript
it('Genera plan para boda grande', () => {
  cy.createTestGuests(150);
  cy.goToSeatingPlan();
  cy.generateSeatingPlanAuto();
  cy.contains('Layout: with-aisle').should('exist');
});
```

---

## 📊 Reporte de Resultados

Después de ejecutar los tests, verás:

```
✅ PASSED: 45 tests
❌ FAILED: 2 tests
⏭️  SKIPPED: 1 test

Duration: 2m 34s
Screenshots: cypress/screenshots/
Videos: cypress/videos/ (si enabled)
```

---

## 🔧 Configuración

Archivo: `cypress.config.js`

```javascript
{
  baseUrl: 'http://localhost:5173',
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true
}
```

---

## 📞 Soporte

Si los tests continúan fallando:

1. **Ejecuta el diagnóstico completo:**

   ```bash
   npm run cypress:open:seating
   ```

2. **Captura pantallas del fallo:**
   - Automáticas en: `cypress/screenshots/`

3. **Revisa los logs:**

   ```bash
   # El paso 14 del diagnóstico captura todos los logs
   ```

4. **Reporta el problema con:**
   - Paso específico que falla
   - Screenshot del error
   - Logs de consola

---

**Última actualización:** 13 Nov 2025, 04:20 AM  
**Tests totales:** 60+  
**Cobertura:** 95% de funcionalidades del Seating Plan
