# Scripts Disponibles para Migración i18n

**Ubicación:** `scripts/i18n/`  
**Total scripts:** 17 herramientas

---

## 🔧 Scripts Principales (Recomendados)

### 1. **generateInventory.js** ✅ USADO
**Propósito:** Genera inventario completo de archivos a migrar

```bash
node scripts/i18n/generateInventory.js
```

**Salida:** `docs/i18n/inventario-archivos.json`

**Funcionalidad:**
- Escanea todos los archivos .jsx/.js del proyecto
- Categoriza por tipo (ui, pages, services, etc.)
- Estima complejidad (líneas, strings españoles)
- Calcula tiempo estimado de migración
- Genera reporte con estadísticas

**Cuándo usar:** Al inicio y para revisar progreso

---

### 2. **findHardcodedStrings.js** ⭐ CRÍTICO
**Propósito:** Detecta strings hardcodeados en español

```bash
node scripts/i18n/findHardcodedStrings.js [directorio]
# Ejemplo:
node scripts/i18n/findHardcodedStrings.js src/pages
node scripts/i18n/findHardcodedStrings.js src/components/guests
```

**Funcionalidad:**
- Busca texto con acentos/ñ
- Detecta palabras comunes en español
- Excluye className, console.log, comentarios
- Ignora texto ya dentro de `t()`
- Genera reporte por archivo

**Cuándo usar:** 
- Antes de migrar un archivo (identificar strings)
- Después de migrar (validar 0 hardcoded)
- En revisiones de código

---

### 3. **validateTranslations.js** ⭐ CRÍTICO
**Propósito:** Valida integridad de traducciones

```bash
node scripts/i18n/validateTranslations.js
```

**Funcionalidad:**
- Verifica claves faltantes entre idiomas
- Detecta claves no usadas en el código
- Valida interpolación correcta `{{variable}}`
- Encuentra duplicados
- Reporta claves huérfanas

**Cuándo usar:** 
- Después de añadir claves nuevas
- Antes de commits importantes
- En testing final

---

### 4. **verifyComplete.js**
**Propósito:** Verifica migración completa de un archivo

```bash
node scripts/i18n/verifyComplete.js src/pages/Login.jsx
```

**Funcionalidad:**
- Comprueba que el archivo usa `useTranslations()`
- Verifica que no hay strings hardcodeados
- Valida que todas las claves existen en JSON
- Genera checklist de validación

**Cuándo usar:** Después de migrar cada archivo

---

### 5. **fixMojibake.js** / **fixMojibakeV2.js** / **fixMojibakeV3.cjs**
**Propósito:** Corrige encoding corrupto (mojibake)

```bash
node scripts/i18n/fixMojibake.js src/i18n/locales/es/common.json
# o la versión mejorada:
node scripts/i18n/fixMojibakeV2.js
```

**Funcionalidad:**
- Detecta caracteres corruptos (� → ñ, etc.)
- Corrige encoding UTF-8
- Valida JSON después de la corrección
- Crea backup antes de modificar

**Cuándo usar:**
- Cuando encuentres caracteres �
- Después de ediciones manuales de JSON
- Si aparecen "�"

---

## ⚙️ Scripts de Automatización (Usar con Precaución)

### 6. **migrateComponent.js** ⚠️
**Propósito:** Migración automática de un componente individual

```bash
node scripts/i18n/migrateComponent.js src/pages/Dashboard.jsx
```

**Funcionalidad:**
- Añade import de `useTranslations`
- Extrae strings y genera claves
- Reemplaza strings por `t()`
- Añade claves a JSON

**⚠️ PRECAUCIÓN:**
- Puede generar código corrupto
- Requiere revisión manual después
- Mejor usar para componentes simples
- NO RECOMENDADO para archivos complejos

---

### 7. **migrateAllStrings.js** ❌ NO USAR
**Propósito:** Migración masiva automática

```bash
# NO EJECUTAR SIN SUPERVISIÓN
node scripts/i18n/migrateAllStrings.js
```

**⚠️ PELIGRO:**
- Modifica múltiples archivos a la vez
- Alta probabilidad de corrupción
- Difícil hacer rollback
- Experiencia previa: generó código corrupto

**Alternativa:** Migración manual controlada (actual estrategia)

---

### 8. **autoMigrate.js** ⚠️
**Propósito:** Migración semi-automática con validación

```bash
node scripts/i18n/autoMigrate.js --dry-run
node scripts/i18n/autoMigrate.js --file src/pages/Dashboard.jsx
```

**Funcionalidad:**
- Modo dry-run para preview
- Validación antes de aplicar cambios
- Backup automático
- Rollback si falla

**Uso recomendado:**
- Solo con `--dry-run` primero
- Un archivo a la vez
- Revisar diff antes de commit

---

## 🛠️ Utilidades de Soporte

### 9. **createNamespace.js**
**Propósito:** Crear nuevo namespace de traducción

```bash
node scripts/i18n/createNamespace.js weddings
# Crea: src/i18n/locales/es/weddings.json
#       src/i18n/locales/en/weddings.json
#       src/i18n/locales/fr/weddings.json
```

**Cuándo usar:** Al empezar un módulo nuevo

---

### 10. **translateKeys.js**
**Propósito:** Traducir claves automáticamente ES→EN/FR

```bash
node scripts/i18n/translateKeys.js
```

**Funcionalidad:**
- Usa API de traducción (OpenAI/DeepL)
- Traduce solo claves faltantes
- Mantiene interpolación `{{var}}`
- Genera traducciones naturales

**⚠️ Nota:** Requiere API key configurada

---

### 11. **migrateAriaLabels.js**
**Propósito:** Migrar específicamente aria-labels

```bash
node scripts/i18n/migrateAriaLabels.js src/components
```

**Funcionalidad:**
- Busca `aria-label="texto"`
- Reemplaza por `aria-label={t('key')}`
- Mejora accesibilidad traducida

---

### 12. **migrateServicesUtils.js**
**Propósito:** Migrar servicios y utils (código no-React)

```bash
node scripts/i18n/migrateServicesUtils.js src/services
```

**Funcionalidad:**
- Maneja archivos sin JSX
- Importa i18n de forma diferente
- Adecuado para validaciones, errores

---

### 13. **fixHookPlacement.js**
**Propósito:** Corregir ubicación incorrecta de hooks

```bash
node scripts/i18n/fixHookPlacement.js src/pages
```

**Funcionalidad:**
- Mueve `useTranslations()` al inicio del componente
- Corrige violaciones de reglas de hooks
- Fix automático de errores de lint

---

### 14. **fixBracedTranslations.js**
**Propósito:** Corregir sintaxis incorrecta de traducción

```bash
node scripts/i18n/fixBracedTranslations.js
```

**Funcionalidad:**
- Encuentra `{t('key')}` fuera de JSX
- Corrige a `t('key')` donde aplica
- Arregla interpolación rota

---

### 15. **revertNonComponents.js**
**Propósito:** Revertir migración de archivos no-componente

```bash
node scripts/i18n/revertNonComponents.js
```

**Funcionalidad:**
- Identifica archivos sin JSX
- Revierte cambios incorrectos
- Útil tras migración masiva fallida

---

## 📊 Scripts de Análisis

### 16. **validateI18n.js** (raíz scripts/)
**Propósito:** Validación completa del sistema i18n

```bash
node scripts/validateI18n.js
```

**Funcionalidad:**
- Valida sintaxis de todos los JSON
- Verifica consistencia ES/EN/FR
- Detecta claves rotas
- Genera reporte completo

---

### 17. **syncTranslations.js** (raíz scripts/)
**Propósito:** Sincronizar traducciones entre idiomas

```bash
node scripts/syncTranslations.js
```

**Funcionalidad:**
- Copia estructura de claves
- Añade claves faltantes
- Marca traducciones pendientes

---

## 🚀 Workflow Recomendado

### Para Migrar un Archivo Individual

```bash
# 1. Identificar strings hardcodeados
node scripts/i18n/findHardcodedStrings.js src/pages/MiArchivo.jsx

# 2. Migrar manualmente (recomendado) o usar script
# MANUAL (preferido):
#   - Añadir claves a common.json
#   - Modificar componente con useTranslations()

# SCRIPT (solo archivos simples):
node scripts/i18n/migrateComponent.js src/pages/MiArchivo.jsx --dry-run
# Revisar output, si OK:
node scripts/i18n/migrateComponent.js src/pages/MiArchivo.jsx

# 3. Validar
node scripts/i18n/verifyComplete.js src/pages/MiArchivo.jsx
npm run lint -- src/pages/MiArchivo.jsx

# 4. Commit
git add -A
git commit -m "feat(i18n): migrar MiArchivo.jsx"
```

---

### Para Validar Todo el Proyecto

```bash
# 1. Generar inventario actualizado
node scripts/i18n/generateInventory.js

# 2. Buscar strings hardcodeados en todo
node scripts/i18n/findHardcodedStrings.js src/ > hardcoded-report.txt

# 3. Validar traducciones
node scripts/i18n/validateTranslations.js

# 4. Validar JSON
node scripts/validateI18n.js

# 5. Lint completo
npm run lint
```

---

### Para Corregir Mojibake

```bash
# Si encuentras caracteres �:
node scripts/i18n/fixMojibake.js src/i18n/locales/es/common.json

# O script mejorado:
node scripts/i18n/fixMojibakeV2.js

# Validar después:
node scripts/validateI18n.js
```

---

## ⚠️ Reglas de Seguridad

### ✅ SEGUROS para usar:
- `generateInventory.js`
- `findHardcodedStrings.js`
- `validateTranslations.js`
- `verifyComplete.js`
- `createNamespace.js`
- `validateI18n.js`

### ⚠️ USAR CON PRECAUCIÓN:
- `migrateComponent.js` (revisar diff después)
- `autoMigrate.js` (solo con --dry-run)
- `fixMojibake.js` (hace backup)
- `translateKeys.js` (requiere API key)

### ❌ NO USAR SIN SUPERVISIÓN:
- `migrateAllStrings.js` (alto riesgo)
- Scripts masivos (pueden corromper)

---

## 📝 Otros Scripts Útiles (raíz scripts/)

### Relacionados con i18n:
- `syncLocales.js` - Sincronizar locales
- `cleanAllI18n.mjs` - Limpiar archivos i18n
- `repairI18nJSON.js` - Reparar JSON corrupto
- `fixI18nEncoding.js` - Fix encoding issues
- `test-i18n.sh` / `test-i18n.ps1` - Tests i18n

### Calidad de código:
- `npm run lint` - ESLint completo
- `validateSchemas.js` - Validar schemas
- `runQualityChecks.ps1` - Checks de calidad

---

## 🎯 Estrategia Actual (Manual Controlada)

### Por qué NO usar scripts automáticos masivos:

❌ **Experiencia previa negativa:**
- Generaron código corrupto
- Mojibake en archivos
- Difícil rollback
- Pérdida de tiempo corrigiendo

✅ **Migración manual ventajas:**
- Control total del código
- Sin corrupción
- Código de calidad
- Commits limpios
- Fácil rollback

### Proceso Actual (FUNCIONA):

1. **Identificar** → `findHardcodedStrings.js`
2. **Añadir claves** → Manual en JSON
3. **Migrar componente** → Manual con `useTranslations()`
4. **Validar** → `verifyComplete.js` + lint
5. **Commit** → Cada 1-3 archivos
6. **Repetir**

**Resultado:** 11 archivos migrados sin errores ✅

---

## 📚 Documentación Adicional

- `PLAN-MIGRACION-COMPLETA.md` - Plan completo
- `ESTADO-MIGRACION.md` - Estado actual
- `inventario-archivos.json` - Inventario detallado

---

**Última actualización:** 27 Oct 2025  
**Autor:** Documentación generada en sesión de migración
