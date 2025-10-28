# 🌍 Migración Masiva i18n - Guía Completa

**Fecha:** 28 de Octubre de 2025  
**Estado:** ✅ **Infraestructura completada** - Listo para migración masiva

---

## 📊 **Estado Actual**

### ✅ **Completado**

| Tarea | Estado | Detalles |
|-------|--------|----------|
| Sistema i18n base | ✅ 100% | react-i18next configurado |
| Archivos de traducción | ✅ 100% | ES, EN, FR completos |
| validationUtils.js | ✅ 100% | Refactorizado con i18n |
| WebEditor.jsx | ✅ 100% | 12 alert() migrados |
| ProveedoresNuevo.jsx | ✅ 100% | Texto hardcodeado corregido |
| Claves de errores | ✅ 100% | 15 claves añadidas (es, en, fr) |
| Claves de mensajes | ✅ 100% | 20 claves añadidas (es, en, fr) |
| Claves de website | ✅ 100% | 13 claves añadidas (es, en, fr) |
| Modo debug | ✅ 100% | `en-x-i18n` funcional |

### ⚠️ **Pendiente de Migración**

| Archivo | alert() | Textos Hardcodeados | Prioridad |
|---------|---------|---------------------|-----------|
| **DisenoWeb.jsx** | 9 | ~30 | 🔴 Alta |
| **AdminDiscounts.jsx** | 8 | ~25 | 🔴 Alta |
| **Invitados.jsx** | 53 | ~80 | 🟡 Media |
| **AdminDashboard.jsx** | 6 | ~40 | 🟡 Media |
| **Finance.jsx** | 12 | ~50 | 🟡 Media |
| **Other pages** | ~100 | ~500 | 🟢 Baja |

---

## 🎯 **Objetivos de la Migración**

1. **Eliminar 100% de textos hardcodeados** en páginas críticas
2. **Reemplazar todos los alert()** por toast con i18n
3. **Estandarizar mensajes** de éxito, error y advertencia
4. **Preparar para multi-idioma** real (ES, EN, FR)

---

## 📝 **Claves Añadidas (Listas para Usar)**

### **Errores (errors.***)**

```json
{
  "errors": {
    "generic": "Ha ocurrido un error inesperado",
    "networkError": "Error de red. Verifica tu conexión.",
    "permissionDenied": "Permisos insuficientes",
    "openaiDisabled": "OpenAI directo deshabilitado (usa backend)",
    "missingOpenAIKey": "Falta la clave de OpenAI",
    "openaiError": "Error al conectar con OpenAI",
    "loadError": "Error al cargar los datos",
    "saveError": "Error al guardar los cambios",
    "deleteError": "Error al eliminar",
    "updateError": "Error al actualizar",
    "publishError": "Error al publicar",
    "offlineError": "Estás sin conexión. Conéctate a internet para publicar el micrositio.",
    "generateWebError": "Ha ocurrido un error al generar la página web. Por favor, inténtalo de nuevo.",
    "activateUrlError": "No se pudo activar la URL pública en este momento. Inténtalo de nuevo más tarde.",
    "saveLogisticsError": "No se pudo guardar la logística. Inténtalo de nuevo."
  }
}
```

### **Mensajes (messages.***)**

```json
{
  "messages": {
    "saveSuccess": "Guardado correctamente",
    "saveError": "Error al guardar",
    "deleteSuccess": "Eliminado correctamente",
    "deleteError": "Error al eliminar",
    "updateSuccess": "Actualizado correctamente",
    "updateError": "Error al actualizar",
    "loadError": "Error al cargar datos",
    "networkError": "Error de red",
    "confirmDelete": "¿Seguro que deseas eliminar?",
    "unsavedChanges": "Tienes cambios sin guardar",
    "permissionDenied": "Permiso denegado",
    "notFound": "No encontrado",
    "sessionExpired": "Tu sesión ha expirado",
    "pleaseLogin": "Por favor inicia sesión",
    "logisticsUpdated": "Logística actualizada correctamente",
    "publishSuccess": "¡Página publicada!",
    "publishSuccessWithUrl": "¡Página publicada! URL pública: {{url}}",
    "savedNoActiveWedding": "Página guardada. No hay boda activa para publicar públicamente.",
    "generateWebFirst": "Genera la web primero"
  }
}
```

### **Website (website.***)**

```json
{
  "website": {
    "generate": "Generar web",
    "publish": "Publicar",
    "preview": "Vista previa",
    "edit": "Editar",
    "logistics": {
      "title": "Logística",
      "venue": "Lugar",
      "address": "Dirección",
      "time": "Hora",
      "parking": "Parking",
      "accommodation": "Alojamiento"
    }
  }
}
```

---

## 🚀 **Guía de Migración por Archivo**

### **Patrón Estándar de Migración**

#### **1. Imports necesarios**

```javascript
import { toast } from 'react-toastify';
import useTranslations from '../hooks/useTranslations';
```

#### **2. Inicializar hook**

```javascript
const { t } = useTranslations();
```

#### **3. Reemplazar alert()**

```javascript
// ❌ ANTES
alert('Logística actualizada correctamente.');
alert('No se pudo guardar la logística. Inténtalo de nuevo.');
alert('Error al publicar');

// ✅ DESPUÉS
toast.success(t('messages.logisticsUpdated'));
toast.error(t('errors.saveLogisticsError'));
toast.error(t('errors.publishError'));
```

#### **4. Reemplazar textos hardcodeados**

```javascript
// ❌ ANTES
<button>Publicar</button>
<h1>Vista previa</h1>

// ✅ DESPUÉS
<button>{t('website.publish')}</button>
<h1>{t('website.preview')}</h1>
```

---

## 📋 **Plan de Migración: DisenoWeb.jsx**

### **Ocurrencias de alert() en DisenoWeb.jsx**

| Línea | Texto Hardcodeado | Clave i18n |
|-------|-------------------|------------|
| 1588 | `'Logística actualizada correctamente.'` | `messages.logisticsUpdated` |
| 1592 | `'No se pudo guardar la logística. Inténtalo de nuevo.'` | `errors.saveLogisticsError` |
| 1778 | `'Ha ocurrido un error al generar la página web. Por favor, inténtalo de nuevo.'` | `errors.generateWebError` |
| 1804 | `'Genera la web primero'` | `messages.generateWebFirst` |
| 1818 | `'Estás sin conexión. Conéctate a internet para publicar el micrositio.'` | `errors.offlineError` |
| 1859 | `'No se pudo activar la URL pública en este momento. Inténtalo de nuevo más tarde.'` | `errors.activateUrlError` |
| 1868 | `` `¡Página publicada! URL pública: ${url}` `` | `messages.publishSuccessWithUrl` (con interpolación) |
| 1870 | `'Página guardada. No hay boda activa para publicar públicamente.'` | `messages.savedNoActiveWedding` |
| 1910 | `'Error al publicar'` | `errors.publishError` |

### **Código de Migración para DisenoWeb.jsx**

```javascript
// 1. Añadir imports al inicio del archivo
import { toast } from 'react-toastify';
import useTranslations from '../hooks/useTranslations';

// 2. Dentro del componente, añadir el hook
export default function DisenoWeb() {
  const { t } = useTranslations();
  // ... resto del código

  // 3. Reemplazar cada alert()
  
  // Línea 1588
  toast.success(t('messages.logisticsUpdated'));
  
  // Línea 1592
  toast.error(t('errors.saveLogisticsError'));
  
  // Línea 1778
  toast.error(t('errors.generateWebError'));
  
  // Línea 1804
  toast.warning(t('messages.generateWebFirst'));
  
  // Línea 1818
  toast.error(t('errors.offlineError'));
  
  // Línea 1859
  toast.error(t('errors.activateUrlError'));
  
  // Línea 1868 (con interpolación)
  toast.success(t('messages.publishSuccessWithUrl', { url }));
  
  // Línea 1870
  toast.info(t('messages.savedNoActiveWedding'));
  
  // Línea 1910
  toast.error(t('errors.publishError'));
}
```

---

## 📋 **Plan de Migración: AdminDiscounts.jsx**

### **Pasos**

1. ✅ Añadir imports de `toast` y `useTranslations`
2. ⚠️ Identificar los 8 alert() en el archivo
3. ⚠️ Añadir claves necesarias en common.json si faltan
4. ⚠️ Reemplazar cada alert()

### **Claves Probables Necesarias**

```json
{
  "admin": {
    "discounts": {
      "created": "Descuento creado correctamente",
      "updated": "Descuento actualizado correctamente",
      "deleted": "Descuento eliminado correctamente",
      "error": "Error al procesar el descuento",
      "confirmDelete": "¿Seguro que deseas eliminar este descuento?",
      "invalidCode": "El código de descuento no es válido",
      "expired": "Este descuento ha expirado",
      "limitReached": "Se ha alcanzado el límite de usos"
    }
  }
}
```

---

## 📋 **Plan de Migración: Invitados.jsx**

### **Desafío Especial**

Según la memoria del sistema, `Invitados.jsx` tiene **hooks deshabilitados** por estabilidad. Los hooks `useAuth()`, `useWedding()` y **`useTranslations()`** fueron eliminados.

### **Solución**

1. **Opción A (Recomendada):** Reintegrar `useTranslations()` de forma segura
   ```javascript
   const { t } = useTranslations() || { t: (key) => key };
   ```

2. **Opción B:** Usar `i18n` directamente sin hook
   ```javascript
   import i18n from '../i18n';
   // ...
   toast.success(i18n.t('messages.saveSuccess'));
   ```

---

## 🛠️ **Herramientas de Ayuda**

### **Script de Detección Automática**

Crear en `scripts/i18n/detectHardcodedStrings.js`:

```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const SPANISH_PATTERN = /['"`]([^'"`]*[áéíóúñÁÉÍÓÚÑ¿¡][^'"`]*)['"`]/g;
const ALERT_PATTERN = /alert\s*\(['"`]([^'"`]+)['"`]\)/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const findings = [];
  
  // Buscar alerts
  let match;
  while ((match = ALERT_PATTERN.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    findings.push({
      type: 'alert',
      text: match[1],
      line: lineNumber
    });
  }
  
  return findings;
}

// Escanear directorio src/pages
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

console.log('📊 Resultados de escaneo i18n\\n');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  const findings = scanFile(filePath);
  
  if (findings.length > 0) {
    console.log(`\n📄 ${file}:`);
    findings.forEach(({ type, text, line }) => {
      console.log(`  Línea ${line}: ${text}`);
    });
  }
});
```

**Uso:**
```bash
node scripts/i18n/detectHardcodedStrings.js
```

---

## 📊 **Progreso de Migración**

### **Archivos Completados**

- ✅ WebEditor.jsx (12/12 alert migrados)
- ✅ ProveedoresNuevo.jsx (1/1 texto hardcodeado)
- ✅ validationUtils.js (15/15 mensajes)

### **Archivos en Cola**

| Archivo | Estimación | Prioridad |
|---------|------------|-----------|
| DisenoWeb.jsx | 30 min | 🔴 Alta |
| AdminDiscounts.jsx | 25 min | 🔴 Alta |
| Finance.jsx | 45 min | 🟡 Media |
| AdminDashboard.jsx | 35 min | 🟡 Media |
| Invitados.jsx | 90 min | 🟡 Media (hooks deshabilitados) |

**Total estimado:** ~4 horas de trabajo

---

## 🎯 **Checklist de Validación**

Después de cada migración, verificar:

- [ ] No quedan alert() en el archivo
- [ ] Todos los textos hardcodeados usan t()
- [ ] Las claves existen en es/common.json
- [ ] Las claves existen en en/common.json
- [ ] Las claves existen en fr/common.json
- [ ] Los toast usan el tipo correcto (success, error, warning, info)
- [ ] La interpolación de variables funciona (ej: {{url}})
- [ ] El modo debug muestra claves en lugar de textos
- [ ] No hay errores de consola
- [ ] La app funciona en ES, EN y FR

---

## 🚨 **Errores Comunes a Evitar**

### **1. Olvidar inicializar el hook**

```javascript
// ❌ MAL
export default function MyComponent() {
  toast.success(t('messages.saveSuccess')); // t no está definido
}

// ✅ BIEN
export default function MyComponent() {
  const { t } = useTranslations();
  toast.success(t('messages.saveSuccess'));
}
```

### **2. Usar claves inexistentes**

```javascript
// ❌ MAL
toast.success(t('messages.discountCreated')); // Clave no existe

// ✅ BIEN
// 1. Añadir clave en common.json primero
// 2. Luego usar
toast.success(t('messages.discountCreated'));
```

### **3. Interpolación incorrecta**

```javascript
// ❌ MAL
toast.success(`¡Página publicada! URL: ${url}`); // Hardcodeado

// ✅ BIEN
toast.success(t('messages.publishSuccessWithUrl', { url }));
// En common.json: "publishSuccessWithUrl": "¡Página publicada! URL pública: {{url}}"
```

### **4. No usar toast types apropiados**

```javascript
// ❌ MAL - Todo con toast.success
toast.success(t('errors.networkError')); // Es un error, no éxito

// ✅ BIEN
toast.error(t('errors.networkError'));
toast.success(t('messages.saveSuccess'));
toast.warning(t('messages.unsavedChanges'));
toast.info(t('messages.savedNoActiveWedding'));
```

---

## 📚 **Recursos y Documentación**

- [Guía Completa i18n](./i18n.md)
- [Pasos Implementados](./PASOS-IMPLEMENTADOS-I18N.md)
- [Modo Debug](./i18n-debug-mode.md)
- [Informe de Corrección](./INFORME-I18N-CORRECCION.md)

---

## 🎉 **Estado Final Esperado**

Al completar la migración masiva:

- ✅ **0 alert()** en toda la aplicación
- ✅ **0 textos hardcodeados** en componentes críticos
- ✅ **100% cobertura i18n** en páginas principales
- ✅ **3 idiomas funcionales** (ES, EN, FR)
- ✅ **Sistema escalable** para añadir nuevos idiomas
- ✅ **UX mejorada** con notificaciones toast consistentes

---

**Última actualización:** 28 de Octubre de 2025  
**Próxima acción recomendada:** Migrar DisenoWeb.jsx usando esta guía
