# Guía de Debug i18n - MyWed360

Esta guía explica cómo usar el sistema de debug de internacionalización (i18n) para encontrar y solucionar traducciones faltantes.

## 🔍 Modo Debug i18n

### Activación

1. **Accede al selector de idioma** (icono 🌐 en la esquina superior derecha)
2. **Selecciona "🔍 i18n Debug (mostrar claves)"**
3. La interfaz mostrará las **claves i18n** en lugar de las traducciones

### Qué verás en modo debug

En lugar de ver:

```
Inicio | Tareas | Finanzas
```

Verás:

```
navigation.home | navigation.tasks | navigation.finance
```

Esto te permite identificar rápidamente:

- ✅ Qué elementos **sí tienen** traducción (muestran la clave)
- ❌ Qué elementos **no tienen** traducción (muestran texto hardcodeado)

## 📊 Panel de Debug

Cuando activas el modo debug, aparece un **panel amarillo en la esquina inferior derecha** que muestra:

- **Total de claves faltantes** detectadas
- **Claves organizadas por idioma y namespace**
- **Botones de acción**:
  - 🔄 Limpiar log de claves faltantes
  - 📥 Descargar reporte en JSON

### Ejemplo de uso

1. Activa el modo debug
2. Navega por diferentes secciones de la app
3. El panel se actualizará automáticamente mostrando las claves faltantes
4. Haz clic en "Descargar" para obtener un archivo JSON con todas las claves

## 🛠️ Herramientas de Consola

El sistema expone varias funciones globales para depuración:

### Ver claves faltantes

```javascript
// Ver todas las claves faltantes detectadas
window.__I18N_MISSING_KEYS__;

// Obtener copia del log
window.__I18N_GET_MISSING__();

// Exportar organizadas por idioma
window.__I18N_EXPORT_MISSING__();
```

### Descargar reporte

```javascript
// Descarga automáticamente un archivo JSON
window.__I18N_DOWNLOAD_MISSING__();
```

### Limpiar log

```javascript
// Reinicia el contador de claves faltantes
window.__I18N_RESET_MISSING__();
```

### Acceder a la instancia i18next

```javascript
// Acceder a la configuración de i18next
window.__I18N_INSTANCE__;

// Ver idioma actual
window.__I18N_INSTANCE__.language;

// Cambiar idioma programáticamente
window.__I18N_INSTANCE__.changeLanguage('en');
```

## 🔎 Detectar Strings Hardcodeados

Ejecuta el script para encontrar cadenas de texto que deberían usar i18n:

```bash
node scripts/i18n/detectHardcodedStrings.js
```

O para analizar una carpeta específica:

```bash
node scripts/i18n/detectHardcodedStrings.js src/pages
```

El script generará un reporte mostrando:

- Archivos con texto hardcodeado
- Líneas específicas donde aparece
- Sugerencias de qué debe traducirse

## 📝 Flujo de Trabajo Recomendado

### 1. Identificar claves faltantes

```bash
# Paso 1: Activar modo debug en la interfaz
# Paso 2: Navegar por la aplicación
# Paso 3: Descargar el reporte de claves faltantes
```

### 2. Encontrar strings hardcodeados

```bash
node scripts/i18n/detectHardcodedStrings.js
```

### 3. Añadir traducciones

Edita los archivos de traducción correspondientes:

```
src/i18n/locales/
├── es/common.json    # Español (base)
├── en/common.json    # Inglés
├── fr/common.json    # Francés
└── [otros idiomas]/
```

### 4. Verificar

- Vuelve a activar el modo debug
- Verifica que las claves ahora se muestran correctamente
- El contador de claves faltantes debe disminuir

## 📋 Formato del Reporte JSON

El archivo descargado tiene esta estructura:

```json
{
  "es": {
    "common": ["navigation.newSection", "forms.newField"],
    "finance": ["charts.newMetric"]
  },
  "en": {
    "common": ["navigation.newSection"]
  }
}
```

Esto indica que:

- En español faltan 3 claves (2 en `common`, 1 en `finance`)
- En inglés falta 1 clave en `common`

## 🎯 Mejores Prácticas

### ✅ DO

- Activa el modo debug al desarrollar nuevas funcionalidades
- Descarga reportes periódicamente para mantener seguimiento
- Usa el script de detección antes de hacer commits grandes
- Añade traducciones para todos los idiomas soportados

### ❌ DON'T

- No dejes el modo debug activado en producción
- No ignores las claves faltantes (afecta la experiencia del usuario)
- No uses texto hardcodeado en componentes (siempre usa `t()`)

## 🌐 Idiomas Disponibles

El sistema soporta los siguientes idiomas:

| Código  | Idioma              | Estado       |
| ------- | ------------------- | ------------ |
| `es`    | Español (España)    | ✅ Base      |
| `es-MX` | Español (México)    | ⚠️ Parcial   |
| `es-AR` | Español (Argentina) | ⚠️ Parcial   |
| `en`    | Inglés              | ⚠️ Parcial   |
| `fr`    | Francés             | ⚠️ Parcial   |
| `de`    | Alemán              | ⚠️ Parcial   |
| `it`    | Italiano            | ⚠️ Parcial   |
| `pt`    | Portugués           | ⚠️ Parcial   |
| ...     | +20 idiomas más     | ❌ Pendiente |

## 🚀 Próximos Pasos

1. **Completar traducciones prioritarias** (en, fr, de, it, pt)
2. **Automatizar detección** en CI/CD
3. **Integrar con servicio de traducción** (Crowdin, Lokalise, etc.)
4. **Añadir tests** para verificar cobertura de traducciones

## 📚 Recursos

- [Documentación i18next](https://www.i18next.com/)
- [React i18next](https://react.i18next.com/)
- [BCP 47 Language Tags](https://www.iana.org/assignments/language-subtag-registry)

---

**Última actualización**: 2025-01-02
