# 📋 Qué Falta por Hacer (roadmap.json)

**Fuente:** `roadmap.json`  
**Nota:** Este documento resume únicamente el estado del `roadmap.json` actual. Para el informe histórico (25/10/2025) ver `docs/archive/QUE-FALTA-POR-HACER_2025-10-25_LEGACY.md`.

## 📊 Resumen

| Estado | Cantidad |
|--------|----------|
| ✅ Completadas | 22 |
| ❌ Fallidas | 4 |
| **Total** | **26** |

## 🔴 Pendiente (fallidas)

1. **`unit_rules`** — Tests unitarios de reglas Firestore (seating)  
   - Comando: `npm run test:unit -- apps/main-app/src/__tests__/firestore.rules.seating.test.js`  
   - Intentos: 53  
   - Bloqueada por: `validate_schemas`

2. **`unit_rules_exhaustive`** — Unit: Firestore rules (exhaustive)  
   - Comando: `npm run test:unit -- apps/main-app/src/__tests__/firestore.rules.exhaustive.test.js`  
   - Intentos: 45  
   - Bloqueada por: `validate_schemas`

3. **`unit_rules_extended`** — Unit: Firestore rules (extended)  
   - Comando: `npm run test:unit -- apps/main-app/src/__tests__/firestore.rules.extended.test.js`  
   - Intentos: 45  
   - Bloqueada por: `validate_schemas`

4. **`unit_rules_collections`** — Unit: Firestore rules (collections)  
   - Comando: `npm run test:unit -- apps/main-app/src/__tests__/firestore.rules.collections.test.js`  
   - Intentos: 20

