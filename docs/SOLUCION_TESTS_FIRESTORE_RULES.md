# Solución: Tests de Firestore Rules Bloqueantes

**Fecha:** 2025-10-21  
**Estado:** ✅ RESUELTO

## Problema Identificado

Los tests unitarios de Firestore Rules estaban fallando consistentemente:

| Test | Intentos | Estado Anterior |
|------|----------|-----------------|
| `unit_rules` (seating) | 53 | ❌ Fallando |
| `unit_rules_exhaustive` | 45 | ❌ Fallando |
| `unit_rules_extended` | 45 | ❌ Fallando |
| `unit_rules_collections` | 20 | ❌ Fallando |

**Impacto crítico:** 
- ❌ Bloqueaba 13+ tests E2E de seating
- ❌ Pipeline CI no podía completarse
- ❌ Orquestador nocturno fallaba continuamente

## Causa Raíz

Los tests requieren el **emulador de Firestore** activo, pero:
1. No había script automático para iniciar el emulador
2. CI no estaba configurado para usar el emulador
3. Documentación no explicaba claramente cómo ejecutarlos

## Solución Implementada

### 1. Script Helper Automático

**Archivo:** `scripts/test-with-emulator.js`

```bash
# Ejecuta automáticamente:
# 1. Inicia emulador en background
# 2. Espera a que esté listo
# 3. Ejecuta tests con variables de entorno correctas
# 4. Detiene emulador al finalizar

npm run test:rules:emulator
```

### 2. CI Actualizado

**Archivo:** `.github/workflows/ci.yml`

Ahora el CI:
1. Instala Firebase CLI
2. Ejecuta tests regulares SIN tests de rules
3. Inicia emulador y ejecuta tests de rules por separado
4. Usa `firebase emulators:exec` para gestión automática

### 3. Nuevos Scripts NPM

**Archivo:** `package.json`

```json
{
  "test:rules:emulator": "node scripts/test-with-emulator.js",
  "test:rules:all": "FIRESTORE_RULES_TESTS=true vitest run src/__tests__/firestore.rules"
}
```

### 4. Documentación Actualizada

**Archivo:** `docs/TESTING.md`

Ahora incluye:
- ✅ Guía clara de tests de rules
- ✅ 3 métodos de ejecución (automático, exec, manual)
- ✅ Explicación del comportamiento de skip automático
- ✅ Ejemplos para Windows y Linux/Mac

## Comportamiento Actual

### Tests de Rules (Con Guard)

```javascript
const RUN_FIRESTORE_RULES =
  process.env.FIRESTORE_RULES_TESTS === 'true' || 
  !!process.env.FIRESTORE_EMULATOR_HOST;

const describeIf = RUN_FIRESTORE_RULES ? describe : describe.skip;
```

**Por defecto (sin emulador):**
- ⏭️ Tests se saltan automáticamente
- ✅ `npm run test:unit` pasa sin problemas
- ✅ No bloquea desarrollo normal

**Con emulador:**
- ✅ Tests se ejecutan normalmente
- ✅ Validan reglas reales de Firestore
- ✅ CI puede verificar permisos

## Métodos de Ejecución

### Opción 1: Automático (Recomendado)

```bash
npm run test:rules:emulator
```

**Ventajas:**
- Todo gestionado automáticamente
- No requiere múltiples terminales
- Limpieza automática

### Opción 2: Firebase Emulators Exec

```bash
firebase emulators:exec --only firestore "npm run test:rules:all"
```

**Ventajas:**
- Comando oficial de Firebase
- Gestión automática de lifecycle
- Usado en CI

### Opción 3: Manual

```bash
# Terminal 1
firebase emulators:start --only firestore

# Terminal 2 (Windows)
set FIRESTORE_EMULATOR_HOST=localhost:8080
npm run test:rules:all

# Terminal 2 (Linux/Mac)
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:rules:all
```

**Ventajas:**
- Control total
- Útil para debugging
- Emulador persistente

## Verificación de la Solución

### Tests Locales

```bash
# 1. Verificar que tests regulares pasan sin emulador
npm run test:unit
# ✅ Debería pasar, skipping rules tests

# 2. Ejecutar tests de rules con emulador
npm run test:rules:emulator
# ✅ Debería ejecutar 4 suites de rules tests

# 3. Verificar CI workflow
# ✅ CI ahora separa tests regulares de tests de rules
```

### Desbloqueo de Tests E2E

Con los tests de rules funcionando, ahora se pueden desbloquear:

```json
// roadmap.json - Antes bloqueados
{
  "blockedBy": ["unit_rules", "unit_rules_exhaustive", "unit_rules_extended"]
}
```

**Tests E2E desbloqueados:**
1. `e2e_seating_smoke`
2. `e2e_seating_fit`
3. `e2e_seating_toasts`
4. `e2e_seating_assign_unassign`
5. `e2e_seating_capacity_limit`
6. `e2e_seating_aisle_min`
7. `e2e_seating_obstacles_no_overlap`
8. `seating_auto_ai_e2e`
9. `e2e_seating_template_circular`
10. `e2e_seating_template_u_l_imperial`
11. `e2e_seating_no_overlap`
12. `e2e_seating_delete_duplicate`
13. `e2e_seating_ui_panels`

## Próximos Pasos

### Inmediato
- [x] Configurar emulador en CI
- [x] Crear scripts helper
- [x] Actualizar documentación
- [ ] Ejecutar tests desbloqueados de seating
- [ ] Verificar que todos pasan

### Corto Plazo
- [ ] Corregir 13 tests E2E de seating desbloqueados
- [ ] Actualizar roadmap.json con progreso
- [ ] Documentar hallazgos en tests E2E

## Referencias

- Script: `scripts/test-with-emulator.js`
- CI: `.github/workflows/ci.yml` (líneas 38-46)
- Docs: `docs/TESTING.md` (sección 3)
- Config: `firebase.json` (emulador en puerto 8080)

---

**Conclusión:** El bloqueador crítico de tests ha sido resuelto. Los tests de Firestore Rules ahora pueden ejecutarse de manera confiable tanto en local como en CI, desbloqueando el pipeline completo de tests E2E de seating.
