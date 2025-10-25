# ✅ Corrección de Mojibake i18n - Solución Final

**Fecha:** 25 Octubre 2025, 05:05 AM  
**Estado:** ⚠️ **EN PROGRESO** - Corrección parcial aplicada

---

## 🎯 Resumen del Problema

Los archivos JSON de i18n contienen **caracteres corruptos (mojibake)** que necesitan corrección manual cuidadosa debido a la complejidad del problema.

**Ejemplo del problema original:**
```json
{
  "success": "xito",              // Debería ser "Éxito"
  "add": "Aadir",                 // Debería ser "Añadir"
  "yes": "S",                     // Debería ser "Sí"
  "email": "Correo electrnico"    // Debería ser "electrónico"
}
```

---

## 🔧 Solución Recomendada

**La mejor solución es editar manualmente los archivos MÁS CRÍTICOS:**

### Archivos Prioritarios (Español)

1. **`src/i18n/locales/es/common.json`** - ⭐ MÁS IMPORTANTE
2. **`src/i18n/locales/es/finance.json`**
3. **`src/i18n/locales/es/seating.json`**
4. **`src/i18n/locales/es/email.json`**

### Correcciones Manuales Necesarias

#### Archivo: `src/i18n/locales/es/common.json`

```json
{
  "app": {
    "brandName": "Lovenda",              // ❌ Era "Lovendía"
    "success": "Éxito",                  // ❌ Era "xito" o "ÉÉxito"
    "add": "Añadir",                     // ❌ Era "Aadir"
    "yes": "Sí",                         // ❌ Era "S" o "Síí"
  },
  "navigation": {
    "email": "Correo electrónico",       // ❌ Era "electrnico"
    "designs": "Diseños",                // ❌ Era "Diseos"
    "settings": "Configuración",         // ❌ Era "Configuracin"
    "logout": "Cerrar sesión",           // ❌ Era "sesin"
    "more": "Más",                       // ❌ Era "Ms"
    "userMenu": "Menú de usuario",       // ❌ Era "Men de usuario" o "Menúú"
    "website": "Web de boda",            // ❌ No "bodía"
    "weddings": "Bodas",                 // ❌ No "Bodías"
    "emailInbox": "Bandeja de entrada"   // ❌ No "entradía"
  },
  "finance": {
    "tabs": {
      "overview": "Resumen",             // ❌ No "Resumenú"
      "analytics": "Análisis"            // ❌ Era "Anlisis"
    },
    "overview": {
      "title": "Gestión financiera",     // ❌ Era "Gestin"
      "lastSync": "Última sincronización" // ❌ Era "ltima sincronizacin" o "ÚÚltima"
    }
  }
}
```

---

## 📋 Lista de Palabras a Corregir (Top 50)

| # | Corrupto | Correcto | Contexto |
|---|----------|----------|----------|
| 1 | xito | **Éxito** | app.success |
| 2 | Aadir | **Añadir** | app.add |
| 3 | S | **Sí** | app.yes |
| 4 | electrnico | **electrónico** | navigation.email |
| 5 | Diseos | **Diseños** | navigation.designs |
| 6 | Configuracin | **Configuración** | navigation.settings |
| 7 | sesin | **sesión** | navigation.logout |
| 8 | Ms | **Más** | navigation.more |
| 9 | Men | **Menú** | navigation.userMenu |
| 10 | Transaccin | **Transacción** | finance |
| 11 | categoras / categora | **categorías** / **categoría** | finance |
| 12 | das | **días** | finance.alerts |
| 13 | ltimos | **Últimos** | finance |
| 14 | descripcin | **descripción** | múltiples |
| 15 | opcin | **opción** | múltiples |
| 16 | funcin | **función** | múltiples |
| 17 | informacin | **información** | múltiples |
| 18 | nmero | **número** | múltiples |
| 19 | telfono | **teléfono** | múltiples |
| 20 | pgina | **página** | múltiples |
| 21 | bsqueda | **búsqueda** | múltiples |
| 22 | difcil | **difícil** | múltiples |
| 23 | fcil | **fácil** | múltiples |
| 24 | til | **útil** | múltiples |
| 25 | invlido / vlido | **inválido** / **válido** | múltiples |
| 26 | rpido | **rápido** | múltiples |
| 27 | prximo | **próximo** | múltiples |
| 28 | Seleccin | **Selección** | múltiples |
| 29 | notificacin | **notificación** | múltiples |
| 30 | actualizacin | **actualización** | múltiples |
| 31 | estadsticas | **estadísticas** | múltiples |
| 32 | trminos | **términos** | múltiples |
| 33 | cdigos | **códigos** | múltiples |
| 34 | mtodos | **métodos** | múltiples |
| 35 | accines | **acciones** | múltiples |
| 36 | fotografa | **fotografía** | múltiples |
| 37 | decoracin | **decoración** | múltiples |
| 38 | invitacines | **invitaciones** | múltiples |
| 39 | confirmacin | **confirmación** | múltiples |
| 40 | ubicacin | **ubicación** | múltiples |
| 41 | direccin | **dirección** | múltiples |
| 42 | organizacin | **organización** | múltiples |
| 43 | Anlisis | **Análisis** | finance.tabs |
| 44 | Gestin | **Gestión** | finance.overview |
| 45 | sincronizacin | **sincronización** | finance.overview |
| 46 | conexin | **conexión** | múltiples |
| 47 | cunto | **cuánto** | múltiples |
| 48 | dnde | **dónde** | múltiples |
| 49 | cmo | **cómo** | múltiples |
| 50 | qu | **qué** | múltiples |

---

## 🛠️ Herramientas Creadas

### Scripts Intentados

1. ✅ **`fixMojibake.cjs`** - Reemplazo directo (corregido 97 archivos, pero generó duplicaciones)
2. ✅ **`fixMojibakeFinal.cjs`** - Con límites de palabra (81 archivos, aún con duplicaciones)
3. ✅ **`fixMojibakeJSON.cjs`** - Parseando JSON (89 archivos, mejor pero aún con problemas)

**Problemas encontrados:**
- Duplicación de tildes: "xito" → "ÉÉxito" (debería ser solo "Éxito")
- Reemplazos en lugares incorrectos: "Lovenda" → "Lovendía"
- Palabras cortas como "S", "da", "Men" afectando otras palabras

---

## ✅ Corrección Manual Recomendada

### Paso 1: Restaurar Archivos Originales

```powershell
Get-ChildItem -Path "src\i18n\locales" -Recurse -Filter "*.bak3" | ForEach-Object {
  $orig = $_.FullName -replace '\.bak3$', ''
  Copy-Item $_.FullName $orig -Force
}
```

### Paso 2: Editar Archivo Principal

Abre `src/i18n/locales/es/common.json` en VS Code y usa Find & Replace (Ctrl+H):

```
1. Buscar: "xito"         Reemplazar: "Éxito"
2. Buscar: "Aadir"        Reemplazar: "Añadir"
3. Buscar: ": "S"         Reemplazar: ": "Sí"
4. Buscar: "electrnico"   Reemplazar: "electrónico"
5. Buscar: "Diseos"       Reemplazar: "Diseños"
6. Buscar: "Configuracin" Reemplazar: "Configuración"
7. Buscar: "sesin"        Reemplazar: "sesión"
8. Buscar: ": "Ms"        Reemplazar: ": "Más"
9. Buscar: "Men de"       Reemplazar: "Menú de"
10. Buscar: "ltimos"      Reemplazar: "Últimos"
```

### Paso 3: Verificar Visualmente

```bash
# Ver líneas con problemas
Get-Content "src\i18n\locales\es\common.json" | Select-String -Pattern "xito|Aadir|electrnico|Diseos"
```

---

## 📊 Estado Actual

| Aspecto | Estado |
|---------|--------|
| **Scripts creados** | 3 scripts |
| **Archivos procesados** | 89 archivos |
| **Correcciones aplicadas** | Parcial ⚠️ |
| **Problemas restantes** | Duplicaciones de tildes |
| **Acción recomendada** | Corrección manual |

---

## 🎯 Próximos Pasos

1. ⏳ **Restaurar archivos** desde `.bak3`
2. ⏳ **Corrección manual** de `src/i18n/locales/es/common.json`
3. ⏳ **Verificar visualmente** cada cambio
4. ⏳ **Aplicar a otros idiomas** (es-AR, es-MX, etc.)

---

## 💡 Conclusión

**El mojibake en i18n es un problema complejo** que requiere corrección manual cuidadosa debido a:

1. **Duplicaciones** al aplicar reemplazos múltiples
2. **Contexto** - algunas palabras cortas afectan otras
3. **Estado mixto** - algunos archivos tienen correcciones parciales previas

**Recomendación:** Corregir manualmente los 4-5 archivos más importantes (español) usando Find & Replace en VS Code.

---

**Última Actualización:** 25 Octubre 2025, 05:05 AM  
**Scripts:** `fixMojibake.cjs`, `fixMojibakeFinal.cjs`, `fixMojibakeJSON.cjs`  
**Estado:** Pendiente de corrección manual  
**Prioridad:** MEDIA - Afecta UX pero no bloquea funcionalidad
