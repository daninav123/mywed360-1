# ⚠️ Bloqueador: Tests Firestore Rules Requieren Java

**Fecha**: 27 Diciembre 2025  
**Estado**: ⚠️ BLOQUEADO - Requiere instalación manual

---

## 🔴 Problema Detectado

Los tests de Firestore Rules **no pueden ejecutarse** porque falta Java Runtime Environment (JRE).

### Error Encontrado
```bash
$ npm run test:rules:emulator

Error: Process `java -version` has exited with code 1. 
Please make sure Java is installed and on your system PATH.

The operation couldn't be completed. Unable to locate a Java Runtime.
Please visit http://www.java.com for information on installing Java.
```

---

## 📊 Tests Afectados

Según `roadmap.json`, estos 4 tests han fallado múltiples veces:

| Test ID | Título | Intentos | Estado |
|---------|--------|----------|--------|
| `unit_rules` | Tests unitarios de reglas Firestore (seating) | 53 | ❌ Failed |
| `unit_rules_exhaustive` | Unit: Firestore rules (exhaustive) | 45 | ❌ Failed |
| `unit_rules_extended` | Unit: Firestore rules (extended) | 45 | ❌ Failed |
| `unit_rules_collections` | Unit: Firestore rules (collections) | 20 | ❌ Failed |

**Total de intentos fallidos**: 163

---

## 🎯 Causa Raíz

Los tests de Firestore Rules utilizan **Firebase Emulator Suite** que requiere:
1. ✅ Firebase CLI (instalado)
2. ❌ **Java Runtime Environment 11+** (NO instalado)

### Por Qué Se Requiere Java

El emulador de Firestore está construido en Java y necesita el runtime para ejecutarse localmente.

---

## ✅ Diseño Actual Correcto

El proyecto está **correctamente configurado** para evitar este bloqueo:

### 1. Tests Excluidos de Suite Normal

**Archivo**: `vitest.config.js:35-36`
```javascript
exclude: [
  '**/node_modules/**',
  '**/dist/**',
  // Excluir tests de Firestore rules (requieren emulador)
  '**/firestore.rules*.test.js',
  'backend/test/**',
]
```

### 2. Skip Automático sin Emulador

**Archivo**: `apps/main-app/src/__tests__/firestore.rules.seating.test.js:19-21`
```javascript
const RUN_FIRESTORE_RULES =
  process.env.FIRESTORE_RULES_TESTS === 'true' || 
  !!process.env.FIRESTORE_EMULATOR_HOST;

const describeIf = RUN_FIRESTORE_RULES ? describe : describe.skip;
```

**Resultado**:
- ✅ `npm run test:unit` **pasa sin problemas** (tests skipped)
- ✅ No bloquea desarrollo normal
- ⚠️ Solo falla cuando se intenta ejecutar explícitamente con emulador

---

## 🔧 Solución: Instalar Java

### Opción 1: OpenJDK (Recomendado)

**macOS** (usando Homebrew):
```bash
# Instalar OpenJDK 17 (LTS)
brew install openjdk@17

# Añadir al PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar instalación
java -version
# Debería mostrar: openjdk version "17.x.x"
```

**Alternativa con SDK Manager**:
```bash
# Instalar SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Instalar Java
sdk install java 17.0.9-tem

# Verificar
java -version
```

### Opción 2: Oracle JDK

Descargar desde: https://www.java.com/download/

---

## ✅ Verificación Post-Instalación

```bash
# 1. Verificar Java
java -version
# Debe mostrar versión 11 o superior

# 2. Ejecutar tests de rules
npm run test:rules:emulator
# Debe iniciar emulador y ejecutar tests

# 3. Verificar manualmente
firebase emulators:start --only firestore
# Terminal separada:
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:rules:all
```

---

## 📝 Impacto en Proyecto

### Sin Java (Estado Actual)
- ✅ **Desarrollo normal**: Funciona sin problemas
- ✅ **Tests unitarios**: `npm run test:unit` pasa correctamente
- ✅ **Tests servicios**: Funcionan con mocks
- ❌ **Tests rules**: No pueden ejecutarse
- ❌ **13 tests E2E seating**: Potencialmente bloqueados

### Con Java Instalado
- ✅ Tests de Firestore Rules funcionarán
- ✅ Validación de permisos en local
- ✅ Desbloqueo de 13 tests E2E de seating
- ✅ CI completo (ya configurado para usar emulador)

---

## 🎯 Recomendación

**Prioridad**: 🟡 MEDIA

**Razón**: Los tests de rules están diseñados para no bloquear desarrollo. La instalación de Java es opcional para desarrollo local, pero recomendada para validación completa.

**Cuándo instalar**:
- ✅ Antes de trabajar en seating plan
- ✅ Antes de modificar firestore.rules
- ✅ Para ejecutar suite completa de tests
- ⚠️ No urgente para trabajo en otros módulos

---

## 📚 Referencias

- **Solución documentada**: `docs/SOLUCION_TESTS_FIRESTORE_RULES.md`
- **Configuración vitest**: `vitest.config.js`
- **Script helper**: `scripts/test-with-emulator.js`
- **Firebase Emulator**: https://firebase.google.com/docs/emulator-suite/install_and_configure

---

## 🔄 Estado en roadmap.json

**Acción requerida**: Los 4 tests deben marcarse como "blocked" con motivo "requires_java":

```json
{
  "id": "unit_rules",
  "status": "blocked",
  "blocker": "requires_java",
  "message": "Firebase emulator requiere Java 11+ instalado"
}
```

---

**Conclusión**: El bloqueo es por diseño del Firebase Emulator, no un error del proyecto. La instalación de Java desbloqueará estos tests, pero **no es crítico** para el desarrollo normal gracias al diseño con skip automático.
