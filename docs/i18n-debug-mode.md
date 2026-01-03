# 🔧 Modo Debug i18n - Guía de Uso

## ✨ ¿Qué es el Modo Debug?

El modo debug de i18n te permite **visualizar qué elementos de la UI ya están traducidos** y cuáles siguen hardcodeados. Cuando lo activas, en lugar de mostrar las traducciones, muestra las **claves de traducción** (como `common.app.save` en lugar de "Guardar").

## 📋 Características

- ✅ **Código válido BCP 47**: Usa `en-x-i18n` (extensión privada válida)
- ✅ **Solo en desarrollo**: Se activa automáticamente solo en `NODE_ENV=development`
- ✅ **Sin fallback**: No muestra traducciones, solo claves para detectar textos faltantes
- ✅ **Selector integrado**: Aparece como "🔧 i18n Debug (mostrar claves)" en el selector de idioma

---

## 🎯 ¿Para qué sirve?

### ✅ Casos de Uso

1. **Detectar textos hardcodeados**: Si ves texto en español/inglés en lugar de una clave, ese texto NO está usando i18n
2. **Verificar cobertura**: Identificar rápidamente qué secciones de la app ya están traducidas
3. **Auditoría de traducciones**: Revisar todas las claves que faltan en un namespace
4. **Desarrollo de nuevas features**: Asegurarte de que todo nuevo componente usa i18n desde el inicio

### ❌ Ejemplo de Texto Hardcodeado

```jsx
// ❌ MALO - Texto hardcodeado (se verá así en modo debug)
<button>Guardar</button>
```

En modo debug verás: **"Guardar"** (texto español visible = problema detectado)

### ✅ Ejemplo de Texto con i18n

```jsx
// ✅ BIEN - Usando i18n
<button>{t('app.save')}</button>
```

En modo debug verás: **"app.save"** (clave visible = correcto)

---

## 🚀 Cómo Activarlo

### Método 1: Desde el Selector de Idioma

1. Asegúrate de estar en **modo desarrollo** (`npm run dev`)
2. Abre el selector de idioma en la navegación
3. Selecciona **"🔧 i18n Debug (mostrar claves)"**
4. ¡Listo! Ahora verás las claves en lugar de traducciones

### Método 2: Desde la Consola del Navegador

```javascript
// Activar modo debug
i18n.changeLanguage('en-x-i18n');

// Ver idioma actual
i18n.language; // 'en-x-i18n'

// Volver a español
i18n.changeLanguage('es');
```

### Método 3: Programático

```javascript
import { changeLanguage } from '../i18n';

// En un botón de debug, por ejemplo
<button onClick={() => changeLanguage('en-x-i18n')}>
  Activar Debug i18n
</button>
```

---

## 🔍 Interpretando los Resultados

### Qué Verás en Modo Debug

| Lo que ves | Significado | Acción |
|------------|-------------|---------|
| `common.app.save` | ✅ Clave i18n correcta | Ninguna |
| `validation.emailRequired` | ✅ Clave i18n correcta | Ninguna |
| `Guardar cambios` | ❌ Texto hardcodeado | **Necesita corrección** |
| `Error al cargar` | ❌ Texto hardcodeado | **Necesita corrección** |
| `messages.saveSuccess` | ✅ Clave i18n correcta | Ninguna |

### Ejemplo Visual

**Antes (Modo Normal - Español):**
```
Guardar | Cancelar | Eliminar
```

**Después (Modo Debug):**
```
app.save | app.cancel | app.delete
```

Si ves algún botón que sigue diciendo "Guardar" en modo debug, **ese texto está hardcodeado** y necesita migración a i18n.

---

## 📊 Herramientas de Auditoría Incluidas

### Ver Claves Faltantes

```javascript
// En consola del navegador
window.__I18N_MISSING_KEYS__

// Output ejemplo:
[
  {
    languages: ['en'],
    namespace: 'common',
    key: 'suppliers.overview.metrics.totalProviders',
    timestamp: 1635789123456
  },
  // ...
]
```

### Resetear Log de Claves Faltantes

```javascript
window.__I18N_RESET_MISSING__();
```

### Obtener Instancia de i18n

```javascript
const i18n = window.__I18N_INSTANCE__;
console.log('Idioma actual:', i18n.language);
console.log('Idiomas disponibles:', i18n.languages);
```

---

## 🛠️ Workflow Recomendado

### 1. Desarrollo de Nueva Feature

```bash
# 1. Activar modo debug
i18n.changeLanguage('en-x-i18n');

# 2. Desarrollar el componente
# 3. Revisar visualmente - ¿ves claves o texto español?
# 4. Si ves texto español, añade traducción
```

### 2. Auditoría de Sección Existente

```bash
# 1. Activar modo debug
# 2. Navegar a la sección (ej: /proveedores)
# 3. Identificar textos hardcodeados
# 4. Crear lista de pendientes
# 5. Migrar uno por uno a i18n
```

### 3. Verificación Pre-Merge

```bash
# Antes de hacer merge de una PR:
# 1. Activar modo debug
# 2. Navegar por todas las páginas modificadas
# 3. Verificar que solo se ven claves, no texto español
# 4. Si todo son claves → ✅ PR lista para merge
```

---

## 🎨 Ejemplos de Patrones

### Pattern 1: Texto Simple

```jsx
// ❌ ANTES (hardcodeado)
<h1>Gestión de Proveedores</h1>

// ✅ DESPUÉS (con i18n)
<h1>{t('suppliers.overview.title')}</h1>

// En modo debug verás: "suppliers.overview.title"
```

### Pattern 2: Texto con Variable

```jsx
// ❌ ANTES (hardcodeado)
<p>Total: {count} proveedores</p>

// ✅ DESPUÉS (con i18n)
<p>{t('suppliers.total', { count })}</p>

// En modo debug verás: "suppliers.total"
```

### Pattern 3: Alert/Toast

```jsx
// ❌ ANTES (hardcodeado)
alert('Error al guardar');

// ✅ DESPUÉS (con i18n)
toast.error(t('errors.saveError'));

// En modo debug verás el toast con: "errors.saveError"
```

---

## ⚙️ Configuración Técnica

### Código de Idioma Usado

```javascript
const DEBUG_LANGUAGE_CODE = 'en-x-i18n';
```

**Por qué este código:**
- `en` = Idioma base (inglés)
- `x` = Marcador de extensión privada según BCP 47
- `i18n` = Identificador de la extensión

Este formato es **100% válido** según el estándar BCP 47 y no causará errores de validación.

### Disponibilidad

```javascript
// Solo aparece en desarrollo
if (code === DEBUG_LANGUAGE_CODE) {
  return process.env.NODE_ENV === 'development';
}
```

En **producción**, el modo debug **NO estará disponible** en el selector de idioma.

---

## 🚨 Limitaciones

1. **Solo en desarrollo**: No disponible en producción por razones de seguridad
2. **Sin fallback**: Intencionalmente no muestra traducciones para detectar claves faltantes
3. **Formateo de fechas**: Usa español para `Intl.DateTimeFormat` (no afecta la detección)
4. **Componentes externos**: Librerías de terceros no mostrarán claves (solo tu código)

---

## 📝 Checklist de Migración

Cuando encuentres un texto hardcodeado en modo debug:

- [ ] 1. Identificar el texto hardcodeado
- [ ] 2. Crear clave apropiada en `common.json` (es, en, fr)
- [ ] 3. Importar `useTranslations` en el componente
- [ ] 4. Reemplazar el texto por `t('clave.correspondiente')`
- [ ] 5. Verificar en modo debug que ahora muestra la clave
- [ ] 6. Probar en español, inglés y francés
- [ ] 7. ✅ Marcar como completado

---

## 🎓 Tips y Mejores Prácticas

### ✅ DO

- Activa modo debug al inicio de cada sesión de desarrollo
- Usa el modo debug para validar PRs antes de merge
- Revisa periódicamente `window.__I18N_MISSING_KEYS__`
- Documenta claves nuevas con comentarios en el JSON

### ❌ DON'T

- No uses modo debug para reportar bugs (siempre prueba en idioma real)
- No dejes código debug en producción
- No confundas claves faltantes con textos hardcodeados
- No olvides añadir traducciones en los 3 idiomas (es, en, fr)

---

## 🔗 Recursos Relacionados

- [Guía Completa i18n](./i18n.md)
- [Pasos Implementados](./PASOS-IMPLEMENTADOS-I18N.md)
- [Informe de Corrección](./INFORME-I18N-CORRECCION.md)
- [BCP 47 Standard](https://en.wikipedia.org/wiki/IETF_language_tag)

---

**Última actualización:** 28 de Octubre de 2025  
**Estado:** ✅ Funcional y documentado
