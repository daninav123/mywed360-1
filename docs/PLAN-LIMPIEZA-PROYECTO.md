# 🧹 Plan de Limpieza del Proyecto

**Creado:** 30 de Octubre de 2025, 4:45 AM  
**Estado:** 🔴 Crítico - Acción inmediata requerida

---

## 🚨 Problemas Críticos Detectados

| Problema                           | Cantidad | Impacto                            | Prioridad |
| ---------------------------------- | -------- | ---------------------------------- | --------- |
| **Claves i18n duplicadas**         | 5,040    | 🔴 Alto - Rompe traducción         | **P0**    |
| **Archivos .bak innecesarios**     | 332      | 🔴 Alto - Infla repositorio        | **P0**    |
| **console.log en producción**      | 1,381    | 🔴 Alto - Afecta performance       | **P1**    |
| **Archivos grandes (>500 líneas)** | 94       | 🟡 Medio - Dificulta mantenimiento | **P2**    |
| **TODOs/FIXMEs**                   | 67       | 🟢 Bajo - Deuda técnica            | **P3**    |

---

## 📅 Plan de Acción por Fases

### ✅ **FASE 1: Limpieza Inmediata** (CRÍTICA)

**Duración estimada:** 2 horas  
**Objetivo:** Eliminar archivos redundantes y duplicados

#### 1.1 Eliminar Archivos .bak (332 archivos)

```bash
# Ejecutar script de limpieza
npm run cleanup:bak

# O manualmente (PowerShell):
Get-ChildItem -Path . -Recurse -Include "*.bak*","*.old" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Remove-Item -Force
```

**Resultado esperado:**

- ✅ Reducción de ~15 MB en el repositorio
- ✅ Elimina confusión con archivos obsoletos
- ✅ Mejora velocidad de búsqueda en IDE

---

#### 1.2 Deduplicar Claves i18n (5,040 duplicados)

**Problema:** Las claves duplicadas causan comportamiento impredecible en las traducciones.

**Archivos afectados:**

- `src/i18n/locales/es/common.json` - 2,236 duplicados
- `src/i18n/locales/en/common.json` - 1,384 duplicados
- `src/i18n/locales/fr/common.json` - 1,420 duplicados

**Estrategia:**

1. Crear script de deduplicación inteligente
2. Analizar qué claves mantener (primera aparición vs. última)
3. Hacer backup antes de modificar
4. Ejecutar deduplicación
5. Verificar con `npm run validate:i18n`

**Script a crear:**

```javascript
// scripts/deduplicateI18nKeys.js
// - Lee JSON
// - Identifica duplicados
// - Mantiene última aparición (más actualizada)
// - Genera reporte de cambios
// - Guarda JSON limpio
```

**Resultado esperado:**

- ✅ Archivos i18n limpios y sin duplicados
- ✅ Traducciones consistentes
- ✅ Reducción de ~50-100 KB en archivos i18n

---

### 🔧 **FASE 2: Optimización de Código** (ALTA)

**Duración estimada:** 8-12 horas  
**Objetivo:** Reducir console.log y refactorizar archivos grandes

#### 2.1 Eliminar console.log (1,381 instancias)

**Top 5 archivos con más console.log:**

1. `src/utils/consoleCommands.js` - 121 logs (archivo de utilidad, OK)
2. `src/hooks/useAuth.jsx` - 43 logs
3. `src/utils/debugAuth.js` - 43 logs (archivo de debug, OK)
4. `src/test/email-integration-test.js` - 40 logs (test, OK)
5. `src/components/email/UnifiedInbox/InboxContainer.jsx` - 34 logs

**Estrategia:**

1. ✅ Mantener en archivos de test y debug
2. ❌ Eliminar de componentes de producción
3. 🔄 Convertir a logger apropiado en hooks críticos

**Script a crear:**

```bash
# Buscar y reemplazar console.log por logger
node scripts/removeConsoleLogs.js --exclude="test,debug" --dry-run
```

**Resultado esperado:**

- ✅ ~700 console.log eliminados
- ✅ ~400 convertidos a logger apropiado
- ✅ Mejora performance en producción

---

#### 2.2 Refactorizar Archivos Grandes (94 archivos >500 líneas)

**Top 10 archivos más grandes:**
| Archivo | Líneas | Acción Recomendada |
|---------|--------|-------------------|
| `src/pages/Invitados.jsx` | 1,983 | 🔴 Dividir en 5+ componentes |
| `src/components/seating/SeatingPlanModern.jsx` | 1,808 | 🔴 Dividir módulos |
| `src/pages/UnifiedEmail.jsx` | 1,616 | 🔴 Extraer hooks y utils |
| `src/components/seating/SeatingPlanRefactored.jsx` | 1,614 | 🟡 Ya refactorizado? Revisar |
| `src/pages/DisenoWeb.jsx` | 1,563 | 🔴 Dividir por secciones |
| `src/pages/ProveedoresNuevo.jsx` | 1,185 | 🟡 Dividir en 3 componentes |
| `src/components/tasks/TasksRefactored.jsx` | 1,144 | 🟡 Extraer lógica |
| `src/pages/Momentos.jsx` | 1,141 | 🟡 Dividir formularios |
| `src/hooks/useProveedores.jsx` | 1,061 | 🟡 Extraer helpers |
| `src/pages/admin/AdminUsers.jsx` | 959 | 🟡 Dividir tabla y filtros |

**Estrategia por archivo:**

1. Identificar lógica reutilizable → Extraer a hooks
2. Dividir UI en componentes más pequeños
3. Mover utilidades a archivos separados
4. Objetivo: Ningún archivo >500 líneas

**Resultado esperado:**

- ✅ Componentes más mantenibles
- ✅ Mejor reutilización de código
- ✅ Facilita testing

---

### 📝 **FASE 3: Deuda Técnica** (MEDIA)

**Duración estimada:** 4-6 horas  
**Objetivo:** Resolver TODOs y FIXMEs

#### 3.1 Resolver TODOs/FIXMEs (67 instancias)

**Distribución:**

- **TODO:** 45 instancias
- **FIXME:** 15 instancias
- **HACK:** 5 instancias
- **XXX:** 2 instancias

**Estrategia:**

1. Convertir cada TODO en issue de GitHub
2. Priorizar FIXMEs y HACKs
3. Eliminar TODOs completados
4. Añadir contexto a TODOs ambiguos

**Resultado esperado:**

- ✅ 67 issues creados en GitHub
- ✅ Código limpio de comentarios obsoletos
- ✅ Roadmap actualizado

---

## 📊 Métricas de Éxito

### Antes de la Limpieza

```
✗ Archivos .bak: 332
✗ Claves i18n duplicadas: 5,040
✗ console.log: 1,381
✗ Archivos >500 líneas: 94
✗ TODOs: 67
✗ Tamaño repositorio: ~850 MB
```

### Después de la Limpieza (Objetivo)

```
✓ Archivos .bak: 0
✓ Claves i18n duplicadas: 0
✓ console.log: <200 (solo en utils/debug/test)
✓ Archivos >500 líneas: <30
✓ TODOs: 0 (convertidos a issues)
✓ Tamaño repositorio: ~750 MB (-12%)
```

---

## 🚀 Ejecución Rápida (Script Automatizado)

Crear script maestro que ejecute todo:

```javascript
// scripts/cleanupProject.js
async function runFullCleanup() {
  console.log('🧹 Iniciando limpieza completa...\n');

  // Fase 1
  await removeBackupFiles();
  await deduplicateI18nKeys();

  // Fase 2
  await removeConsoleLogs();
  await generateRefactorReport();

  // Fase 3
  await convertTodosToIssues();

  console.log('✅ Limpieza completada!');
}
```

**Uso:**

```bash
npm run cleanup:full
```

---

## ⚠️ Precauciones

1. **Hacer backup antes de ejecutar:**

   ```bash
   git checkout -b cleanup-project
   git commit -am "Backup antes de limpieza"
   ```

2. **Ejecutar tests después de cada fase:**

   ```bash
   npm run test:unit
   npm run lint
   npm run validate:i18n
   ```

3. **Verificar funcionalidad en navegador:**
   - Login
   - i18n (cambiar idioma)
   - Funcionalidades core

---

## 📋 Checklist de Ejecución

### Fase 1: Limpieza Inmediata

- [ ] Backup del proyecto (`git checkout -b cleanup-project`)
- [ ] Ejecutar `npm run cleanup:bak`
- [ ] Crear script `deduplicateI18nKeys.js`
- [ ] Ejecutar deduplicación de i18n
- [ ] Verificar con `npm run validate:i18n`
- [ ] Commit: "feat: remove .bak files and deduplicate i18n keys"

### Fase 2: Optimización

- [ ] Crear script `removeConsoleLogs.js`
- [ ] Ejecutar con `--dry-run` primero
- [ ] Revisar cambios propuestos
- [ ] Ejecutar sin `--dry-run`
- [ ] Identificar top 10 archivos grandes
- [ ] Crear plan de refactoring para cada uno
- [ ] Commit: "refactor: remove console.log and optimize large files"

### Fase 3: Deuda Técnica

- [ ] Exportar TODOs a CSV
- [ ] Crear issues en GitHub
- [ ] Eliminar TODOs obsoletos
- [ ] Commit: "docs: convert TODOs to GitHub issues"

### Verificación Final

- [ ] `npm run test:unit` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run validate:i18n` ✅
- [ ] `npm run build` ✅
- [ ] Pruebas manuales en navegador ✅
- [ ] Push a branch y crear PR

---

## 🎯 Resultado Esperado

Al completar este plan:

- ✅ **Repositorio 12% más ligero**
- ✅ **Código más limpio y mantenible**
- ✅ **i18n funcionando correctamente**
- ✅ **Performance mejorado**
- ✅ **Base sólida para futuro desarrollo**

---

**¿Listo para empezar?**

Recomiendo ejecutar **Fase 1** inmediatamente (2 horas). Las otras fases se pueden planificar según prioridades del proyecto.
