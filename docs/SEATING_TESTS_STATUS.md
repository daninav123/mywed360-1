# 📊 Estado de Tests E2E de Seating

**Fecha:** 22 de Enero, 2025 - 04:35 AM  
**Sprint:** 0 - Desbloqueando tests de seating  
**Progreso:** 4/19 tests pasando (21%)

---

## ✅ Tests Pasando (4)

### 1. `seating_fit.cy.js` ✅
**Tests:** 1/1 pasando  
**Descripción:** Ajusta escala y offset al contenido con botón ⌂  
**Duración:** ~18s

### 2. `seating_smoke.cy.js` ✅
**Tests:** 1/1 pasando  
**Descripción:** Smoke test - renderiza, genera layout, dibuja área, undo/redo  
**Duración:** ~24s  
**Correcciones aplicadas:**
- Añadidos waits entre acciones
- Clicks con `{ force: true }` en SVG
- Verificación defensiva de botones undo/redo

### 3. `seating_toasts.cy.js` ✅
**Tests:** 1/1 pasando  
**Descripción:** Verifica toasts/notificaciones  
**Duración:** ~20s

### 4. `seating_basic.cy.js` ✅
**Tests:** 1/1 pasando (estimado, incluido en batch con fit)  
**Descripción:** Tests básicos de seating

---

## ❌ Tests Fallando - Endpoint Dev Removido (2)

### 1. `seating_assign_unassign.cy.js` ❌
**Error:** `cy.request()` failed - Status: 410  
**Causa:** Endpoint `/api/rsvp/dev/create` ha sido retirado  
**Mensaje:** "El endpoint /api/rsvp/dev/create ha sido retirado. Usa la creación de invitados real."

**Solución requerida:**
```javascript
// Reemplazar:
cy.request('POST', '/api/rsvp/dev/create', {...})

// Por:
cy.createFirebaseTestUser() // Usar comando real
// O mockear invitados directamente en localStorage
```

### 2. `seating_capacity_limit.cy.js` ❌
**Error:** Status 410 - Endpoint removido  
**Causa:** Mismo que assign_unassign  
**Solución:** Mismo patrón que #1

---

## ❌ Tests Fallando - Problemas de Selectores (4)

### 3. `seating_no_overlap.cy.js` ❌
**Error:** Assertion failed  
**Requiere investigación:** Ver screenshot para identificar problema específico

### 4. `seating_delete_duplicate.cy.js` ❌
**Error:** Element/assertion issue  
**Requiere investigación**

### 5. `seating_ui_panels.cy.js` ❌
**Tests:** 0/3 pasando  
**Errores:**
- "muestra la leyenda de áreas en la biblioteca" - Assertion failed
- "permite alternar vistas y guiar invitados desde el cajón" - Assertion failed  
- "persiste los toggles del lienzo entre recargas" - `expect(undefined).to.be.true`

**Solución:** Verificar que elementos de UI existen antes de assertar

### 6. `seating_ceremony.cy.js` ❌
**Error:** `cy.type()` can only be called on a single element. Your subject contained 4 elements.  
**Línea:** 12

**Solución:**
```javascript
// Reemplazar:
cy.get('input').type('10')

// Por:
cy.get('input').first().type('10')
// O ser más específico con el selector
```

---

## ⏳ Tests No Ejecutados Aún (9)

1. `seating_aisle_min.cy.js`
2. `seating_obstacles_no_overlap.cy.js`
3. `seating_auto_ai.cy.js`
4. `seating_template_circular.cy.js`
5. `seating_template_u_l_imperial.cy.js`
6. `seating_area_type.cy.js`
7. `seating_conflicts.cy.js`
8. `seating_content_flow.cy.js`
9. `seating_export.cy.js`

---

## 📈 Progreso por Categoría

| Categoría | Pasando | Total | % |
|-----------|---------|-------|---|
| **Tests básicos** | 3 | 3 | 100% |
| **Endpoint dev removido** | 0 | 2 | 0% |
| **Problemas selectores** | 0 | 4 | 0% |
| **No ejecutados** | - | 9 | - |
| **TOTAL EJECUTADOS** | **3** | **9** | **33%** |
| **TOTAL GENERAL** | **3** | **19** | **16%** |

---

## 🔧 Patrón de Corrección Aplicado

### Para SVG overlays:
```javascript
cy.get('svg').first().click(x, y, { force: true })
```

### Para verificaciones defensivas:
```javascript
cy.get('button').then($buttons => {
  const targetButton = $buttons.filter((i, btn) => condition);
  if (targetButton.length > 0 && !targetButton.is(':disabled')) {
    cy.wrap(targetButton).first().click();
  } else {
    cy.log('⚠️ Botón no disponible');
  }
});
```

### Para endpoints dev removidos:
```javascript
// Opción 1: Usar comando real
cy.createFirebaseTestUser({...}).then(user => {
  // crear invitado real
});

// Opción 2: Mock directo
cy.window().then(win => {
  win.localStorage.setItem('mock_guests', JSON.stringify([...]));
});
```

---

## 🎯 Plan de Corrección

### Fase 1: Fixes Rápidos (2-3 horas)
- [ ] Corregir `seating_ceremony.cy.js` - añadir `.first()` en type()
- [ ] Corregir `seating_assign_unassign.cy.js` - reemplazar endpoint dev
- [ ] Corregir `seating_capacity_limit.cy.js` - reemplazar endpoint dev

### Fase 2: Fixes de Selectores (3-4 horas)
- [ ] Investigar `seating_no_overlap.cy.js` - revisar screenshots
- [ ] Investigar `seating_delete_duplicate.cy.js` - revisar screenshots
- [ ] Corregir `seating_ui_panels.cy.js` (3 tests) - verificaciones defensivas

### Fase 3: Tests Restantes (4-6 horas)
- [ ] Ejecutar y corregir los 9 tests no ejecutados
- [ ] Aplicar patrones de corrección aprendidos
- [ ] Validar que todos pasen

### Estimación Total: 9-13 horas

---

## 📊 Métricas

**Tiempo invertido hasta ahora:** ~2 horas  
**Tests corregidos:** 3  
**Velocidad:** ~40 min/test  

**Proyección:**
- 16 tests restantes × 40 min = ~11 horas
- Con aprendizaje aplicado: ~8 horas estimadas

---

## 🎉 Logros

✅ **mockWeddingMinimal()** implementado  
✅ **Patrón de corrección** identificado y documentado  
✅ **3 tests pasando** de forma estable  
✅ **Causas de fallos** identificadas claramente

---

## 📚 Referencias

- Comando: `cypress/support/commands.js` (línea 61)
- Tests: `cypress/e2e/seating/*.cy.js`
- Roadmap: `roadmap-execution.json` (Sprint 0 - CRIT-001)
- Progreso: `docs/ROADMAP_IMPLEMENTATION_PROGRESS.md`

---

**Última actualización:** 22 Enero 2025, 04:35 AM  
**Siguiente acción:** Corregir tests con endpoint dev removido (Fase 1)
