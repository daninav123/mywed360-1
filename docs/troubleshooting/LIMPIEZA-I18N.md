# 🧹 Limpieza de localStorage después de corregir error i18n

## Problema Corregido
Se eliminó el código de idioma inválido `'i18n'` de la configuración de i18next.

## Limpieza Requerida

### Opción 1: Desde la Consola del Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Limpiar el idioma guardado
localStorage.removeItem('i18nextLng');

// O limpiar todo el localStorage (más drástico)
localStorage.clear();

// Recargar la página
location.reload();
```

### Opción 2: Desde DevTools

1. Abre DevTools (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. En el panel izquierdo, selecciona "Local Storage"
4. Busca la clave `i18nextLng`
5. Elimínala
6. Recarga la página (F5)

### Opción 3: Modo Incógnito

Abre el sitio en una ventana de incógnito (Ctrl+Shift+N en Chrome) para probar sin caché ni localStorage.

## Verificación

Después de la limpieza, verifica que:

1. ✅ No aparece el error "Invalid language tag: i18n"
2. ✅ El idioma por defecto es español (es)
3. ✅ Puedes cambiar entre español, inglés y francés sin problemas
4. ✅ Las traducciones se muestran correctamente

## Idiomas Disponibles Ahora

- 🇪🇸 **Español (es)** - Idioma por defecto
- 🇬🇧 **Inglés (en)**
- 🇫🇷 **Francés (fr)**

El modo debug `'i18n'` ha sido eliminado permanentemente para evitar errores de validación.
