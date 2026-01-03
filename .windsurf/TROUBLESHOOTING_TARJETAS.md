# 🔍 TROUBLESHOOTING: Tarjetas de Servicios no se actualizan

**Commit:** `ef11668f` (Debug logs añadidos)

---

## 📋 **SÍNTOMAS DEL PROBLEMA:**

1. Abres el modal "Gestionar servicios"
2. Activas/desactivas servicios (DJ, Tarta, etc.)
3. Cierras el modal
4. ❌ **Las tarjetas NO aparecen ni desaparecen**

---

## 🧪 **PASOS PARA DIAGNOSTICAR:**

### **PASO 1: Abrir la consola**

1. Presiona **F12** en el navegador
2. Ve a la pestaña **"Console"**
3. Limpia la consola (click en 🚫)

---

### **PASO 2: Reproducir el problema**

1. Ve a `/proveedores`
2. Click en botón **"Gestionar servicios"** (arriba a la derecha)
3. **Desactiva "DJ"** (si está activo)
4. **Activa "Tarta"** (si no está activo)
5. Click en **"Guardar y cerrar"**

---

### **PASO 3: Verificar logs en consola**

Deberías ver esta secuencia:

```javascript
// 1. Click en un servicio
🎯 [ManageServicesModal] handleToggle: dj
   Estado actual: ACTIVO

// 2. Se remueve la categoría
➖ [useWeddingCategories] removeCategory: dj
   Removiendo categoría: DJ

// 3. Se actualiza Firestore
📝 [useWeddingCategories] Actualizando categorías activas...
   Antes: ["fotografia", "video", "musica", "dj"]
   Después: ["fotografia", "video", "musica"]
   ✅ Estado actualizado en hook

// 4. Toggle completa
   ✅ toggleCategory completado
   🔓 Toggle desbloqueado

// 5. useMemo recalcula
🔄 [WeddingServicesOverview] Recalculando weddingServices...
   activeCategories: ["fotografia", "video", "musica"]
   ✅ Servicios calculados: 3 ["Fotografía", "Video", "Música"]
```

---

## ❌ **ESCENARIOS DE ERROR:**

### **ERROR 1: No ves NINGÚN log**

**Problema:** El código actualizado no se cargó

**Solución:**

```bash
# 1. Hard refresh en el navegador
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)

# 2. Si no funciona, limpiar caché:
- Abre DevTools (F12)
- Click derecho en el botón de refresh
- Selecciona "Empty Cache and Hard Reload"
```

---

### **ERROR 2: Ves logs pero se detiene en "handleToggle"**

**Problema:** La función `toggleCategory` está fallando

**Busca en consola:**

```javascript
❌ Error en toggleCategory: [mensaje de error]
```

**Causas posibles:**

1. No hay usuario autenticado
2. No hay boda activa
3. Error de permisos en Firestore

**Verifica:**

```javascript
// En consola del navegador, ejecuta:
console.log('Usuario:', localStorage.getItem('userId'));
console.log('Boda activa:', localStorage.getItem('activeWedding'));
```

---

### **ERROR 3: Los logs se ejecutan pero las tarjetas NO cambian**

**Problema:** El `useMemo` en `WeddingServicesOverview` no se recalcula

**Busca en consola:**

```javascript
// Si NO ves esto después de hacer el toggle:
🔄 [WeddingServicesOverview] Recalculando weddingServices...
```

**Entonces el problema es:** El componente no se está re-renderizando

**Verifica en consola del navegador:**

```javascript
// Ejecuta esto ANTES de hacer toggle:
window.__WEDDING_DEBUG__ = true;

// Luego haz el toggle y observa
```

---

### **ERROR 4: Se recalcula pero con datos antiguos**

**Problema:** El estado no se actualizó correctamente

**Busca en consola:**

```javascript
🔄 [WeddingServicesOverview] Recalculando weddingServices...
   activeCategories: ["fotografia", "video", "musica", "dj"]  // ← DJ sigue aquí ❌
```

**Si DJ sigue en la lista después de desactivarlo:**

**Solución:**

1. Verifica que Firestore se actualizó:
   - Abre Firebase Console
   - Ve a Firestore
   - Navega a: `users/{tu-uid}/weddings/{wedding-id}`
   - Verifica el campo `activeCategories`

2. Si Firestore está correcto pero el frontend no:
   ```javascript
   // Forzar recarga del estado en consola:
   window.location.reload();
   ```

---

## 🔧 **SOLUCIONES RÁPIDAS:**

### **Solución 1: Hard Refresh**

```
Ctrl + Shift + R
```

### **Solución 2: Limpiar localStorage y recargar**

```javascript
// En consola del navegador:
localStorage.clear();
window.location.reload();
```

### **Solución 3: Verificar que estás en la rama correcta**

```bash
git branch
# Deberías ver: * windows
```

### **Solución 4: Pull los últimos cambios**

```bash
git pull origin windows
```

---

## 📊 **VERIFICACIÓN FINAL:**

Después de aplicar la solución, verifica:

### ✅ **Checklist de funcionamiento:**

1. [ ] Abres modal "Gestionar servicios"
2. [ ] Click en un servicio (ej: DJ)
3. [ ] Ves toast: ❌ "DJ desactivado"
4. [ ] Cierras el modal
5. [ ] La tarjeta de DJ **desaparece**
6. [ ] Abres modal de nuevo
7. [ ] Click en otro servicio (ej: Tarta)
8. [ ] Ves toast: ✅ "Tarta añadido"
9. [ ] Cierras el modal
10. [ ] La tarjeta de Tarta **aparece**

---

## 🆘 **SI NADA FUNCIONA:**

Copia y pega todos los logs de la consola en un mensaje y te ayudo a diagnosticar el problema específico.

**Qué copiar:**

- Todos los logs desde que abres el modal hasta que cierras
- Cualquier error en rojo
- El resultado de ejecutar en consola:
  ```javascript
  {
    user: localStorage.getItem('userId'),
    wedding: localStorage.getItem('activeWedding'),
    location: window.location.href
  }
  ```

---

**Última actualización:** 30 Oct 2025, 5:30am
