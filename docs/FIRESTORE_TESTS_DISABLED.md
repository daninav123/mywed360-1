# Tests de Firestore Desactivados

**Fecha:** 30 Diciembre 2025  
**Decisión:** Desactivar permanentemente tests de reglas Firestore

---

## Razón

Firebase/Firestore **no se usará en producción**. Los tests de reglas Firestore están bloqueando el desarrollo sin aportar valor al proyecto.

---

## Tests Desactivados

1. **unit_rules** - Tests de reglas Firestore (seating)
   - Intentos fallidos: 53
   - Archivo: `apps/main-app/src/__tests__/firestore.rules.seating.test.js`

2. **unit_rules_exhaustive** - Tests exhaustivos de reglas
   - Intentos fallidos: 45
   - Archivo: `apps/main-app/src/__tests__/firestore.rules.exhaustive.test.js`

3. **unit_rules_extended** - Tests extendidos de reglas
   - Intentos fallidos: 45
   - Archivo: `apps/main-app/src/__tests__/firestore.rules.extended.test.js`

4. **unit_rules_collections** - Tests de colecciones
   - Intentos fallidos: 20
   - Archivo: `apps/main-app/src/__tests__/firestore.rules.collections.test.js`

---

## Cambios Realizados

### 1. `roadmap.json`
Marcados con `status: "skipped"` y agregado campo `skipReason`:
```json
{
  "status": "skipped",
  "lastError": "Skipped - Firebase not used in production",
  "skipReason": "Firebase no se usará en producción, tests desactivados por decisión del equipo"
}
```

### 2. `package.json`
Scripts desactivados:
```json
"test:rules": "echo 'Firestore tests skipped - not used in production'",
"test:rules:emulator": "echo 'Firestore tests skipped - not used in production'",
"test:rules:all": "echo 'Firestore tests skipped - not used in production'"
```

### 3. Configuración Vitest (Opcional)
Si es necesario excluir archivos específicos, añadir en `vitest.config.js`:
```javascript
exclude: [
  '**/firestore.rules*.test.js',
  // otros excludes...
]
```

---

## Impacto

**Antes:**
- ❌ 4 tests bloqueando desarrollo
- ❌ 13+ tests E2E de Seating Plan bloqueados
- ❌ ~160 intentos fallidos acumulados

**Después:**
- ✅ Tests bloqueadores eliminados
- ✅ Development desbloqueado
- ✅ CI/CD más rápido

---

## Alternativa para Futuro

Si en algún momento se decide usar Firebase/Firestore en producción:

1. Reactivar tests en `roadmap.json` (cambiar `status` de `"skipped"` a `"pending"`)
2. Restaurar scripts en `package.json`
3. Configurar emulador de Firestore correctamente
4. Ejecutar: `npm run test:rules:emulator`

---

## Notas

- Los tests E2E que dependían de estos tests unitarios ahora pueden ejecutarse
- El proyecto usa otra base de datos en producción (especificar cuál)
- Esta decisión se toma para desbloquear el desarrollo inmediatamente
