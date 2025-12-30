# Limpieza de Nombres Antiguos - Planivia

**Fecha:** 29 diciembre 2024  
**Objetivo:** Eliminar TODAS las referencias a nombres antiguos

---

## 🔍 NOMBRES ANTIGUOS DETECTADOS

El proyecto ha tenido múltiples cambios de nombre:
1. **Lovenda** / lovenda
2. **mywed360**
3. **MaLove** / **Malove** / **MaLove.App** / **MaloveApp** / **maloveapp**

### Cantidad de Referencias Encontradas

```
Lovenda/lovenda:     886 matches en 101 archivos
mywed360:            560 matches en 113 archivos  
MaloveApp/maloveapp: 2,026 matches en 445 archivos
MaLove.App:          1,163 matches en 147 archivos

TOTAL: ~4,635 referencias a limpiar
```

---

## 📂 ARCHIVOS CRÍTICOS IDENTIFICADOS

### Configuración (ALTA PRIORIDAD)
- [x] `/index.html` - Meta tags raíz
- [ ] `/.firebaserc` - Proyecto Firebase (lovenda-98c77)
- [x] `/apps/main-app/index.html` - Ya actualizado
- [x] `/public/app.webmanifest` - Ya actualizado

### Código JavaScript (ALTA PRIORIDAD)
- [ ] `/apps/main-app/src/components/HomePage.jsx` - 16 refs (mywed360, lovenda, maloveapp)
- [ ] `/apps/main-app/src/components/ChatWidget.jsx` - 33 refs (mywed360, maloveapp)
- [ ] `/apps/main-app/src/pages/DisenoWeb.jsx` - 30 refs (maloveapp CSS classes)
- [ ] `/apps/main-app/src/utils/websiteHtmlPostProcessor.js` - 38 refs CSS
- [ ] `/apps/admin-app/src/utils/websiteHtmlPostProcessor.js` - 39 refs CSS

### LocalStorage y Eventos
**HomePage.jsx y ChatWidget.jsx usan:**
```javascript
// ANTIGUO - Necesita actualización:
localStorage.getItem('mywed360Guests')
localStorage.getItem('mywed360Meetings')
localStorage.getItem('mywed360Suppliers')
localStorage.getItem('mywed360Movements')
localStorage.getItem('mywed360Profile')
localStorage.getItem('lovendaProviders')
localStorage.getItem('lovendaNotes')

window.dispatchEvent(new Event('maloveapp-guests'))
window.dispatchEvent(new Event('maloveapp-tasks'))
window.dispatchEvent(new Event('maloveapp-suppliers'))
window.dispatchEvent(new Event('maloveapp-movements'))
window.dispatchEvent(new Event('maloveapp-profile'))

// NUEVO - Debe ser:
localStorage.getItem('planivia_guests')
localStorage.getItem('planivia_meetings')
localStorage.getItem('planivia_suppliers')
localStorage.getItem('planivia_movements')
localStorage.getItem('planivia_profile')
localStorage.getItem('planivia_providers')
localStorage.getItem('planivia_notes')

window.dispatchEvent(new Event('planivia-guests'))
window.dispatchEvent(new Event('planivia-tasks'))
window.dispatchEvent(new Event('planivia-suppliers'))
window.dispatchEvent(new Event('planivia-movements'))
window.dispatchEvent(new Event('planivia-profile'))
```

### Archivos i18n (MASIVO - 30+ idiomas)
**Archivos de traducción con referencias:**
- `/apps/main-app/src/i18n/locales/*/marketing.json` - 71-73 refs cada uno × 35 idiomas
- `/apps/main-app/src/i18n/locales/*/email.json` - 11-22 refs cada uno × 35 idiomas
- `/apps/main-app/src/i18n/locales/*/common.json` - 2-10 refs

**Total archivos i18n:** ~105 archivos × promedio 20 refs = **~2,100 referencias**

### Clases CSS en Templates
**DisenoWeb.jsx usa clases antiguas:**
```css
/* ANTIGUO */
.maloveapp-card
.maloveapp-button-secondary
.maloveapp-section-heading
.maloveapp-grid
.maloveapp-gallery
.maloveapp-gallery__item
.maloveapp-table-wrapper
.maloveapp-faq
.maloveapp-faq__item

/* NUEVO */
.planivia-card
.planivia-button-secondary
.planivia-section-heading
.planivia-grid
.planivia-gallery
.planivia-gallery__item
.planivia-table-wrapper
.planivia-faq
.planivia-faq__item
```

---

## 🎯 ESTRATEGIA DE LIMPIEZA

### Fase 1: Archivos Críticos (MANUAL) ✅ EN PROGRESO
1. ✅ index.html raíz
2. ⏳ .firebaserc (requiere cambio de proyecto)
3. ⏳ HomePage.jsx - localStorage y eventos
4. ⏳ ChatWidget.jsx - localStorage y eventos
5. ⏳ DisenoWeb.jsx - clases CSS

### Fase 2: Archivos i18n (SEMI-AUTOMATIZADO)
Usar script para reemplazar en todos los archivos de traducción:

```bash
# Backup primero
cp -r apps/main-app/src/i18n/locales apps/main-app/src/i18n/locales_backup

# Reemplazos masivos
find apps/main-app/src/i18n/locales -name "*.json" -exec sed -i '' 's/MaLove\.App/Planivia/g' {} \;
find apps/main-app/src/i18n/locales -name "*.json" -exec sed -i '' 's/malove\.app/planivia.net/g' {} \;
find apps/main-app/src/i18n/locales -name "*.json" -exec sed -i '' 's/mywed360/planivia/g' {} \;
find apps/main-app/src/i18n/locales -name "*.json" -exec sed -i '' 's/Lovenda/Planivia/g' {} \;
find apps/main-app/src/i18n/locales -name "*.json" -exec sed -i '' 's/lovenda/planivia/g' {} \;
```

### Fase 3: Archivos HTML estáticos
```bash
find apps/*/public -name "*.html" -exec sed -i '' 's/MaLove\.App/Planivia/g' {} \;
find apps/*/dist -name "*.html" -exec sed -i '' 's/malove\.app/planivia.net/g' {} \;
```

### Fase 4: Archivos compilados (IGNORAR)
- `/apps/*/dist/**` - Se regeneran en build
- `/backend/node_modules/**` - Dependencias externas
- `/.windsurf/**` - Archivos de IDE

---

## ⚠️ CONSIDERACIONES ESPECIALES

### .firebaserc - Proyecto Firebase
```json
{
  "projects": {
    "default": "lovenda-98c77"  // ← ID del proyecto Firebase
  }
}
```

**IMPORTANTE:** Este ID no debe cambiarse a menos que se migre a un nuevo proyecto Firebase. Es el identificador del proyecto real en Google Cloud. Mantener o crear nuevo proyecto según decisión del usuario.

### Compatibilidad con Datos Existentes

**Estrategia de Migración para localStorage:**
```javascript
// Leer con fallback
const guests = 
  localStorage.getItem('planivia_guests') ||  // Nuevo
  localStorage.getItem('mywed360Guests') ||   // Legacy 1
  '[]';

// Migración automática en background
if (localStorage.getItem('mywed360Guests') && !localStorage.getItem('planivia_guests')) {
  localStorage.setItem('planivia_guests', localStorage.getItem('mywed360Guests'));
}
```

---

## 📊 PROGRESO

### Completado
- ✅ index.html raíz (meta tags)
- ✅ apps/main-app/index.html
- ✅ public/app.webmanifest
- ✅ Servicios críticos (emailService, etc.)
- ✅ Páginas de marketing (Landing, ForSuppliers, ForPlanners)

### En Progreso
- ⏳ HomePage.jsx
- ⏳ ChatWidget.jsx
- ⏳ DisenoWeb.jsx

### Pendiente
- ⏸️ 105 archivos i18n (reemplazo masivo)
- ⏸️ Archivos HTML en public/dist
- ⏸️ .firebaserc (decisión manual)

---

## 🚀 COMANDOS ÚTILES

### Buscar referencias restantes
```bash
# Buscar "lovenda" (case-insensitive)
grep -ri "lovenda" apps/main-app/src --include="*.js" --include="*.jsx"

# Buscar "mywed360"
grep -r "mywed360" apps/main-app/src --include="*.js" --include="*.jsx"

# Buscar "maloveapp"
grep -ri "maloveapp" apps/main-app/src --include="*.js" --include="*.jsx"

# Contar referencias totales
grep -r "MaLove" apps/main-app/src --include="*.js" --include="*.jsx" | wc -l
```

### Verificar que solo queda Planivia
```bash
# Debe retornar muchas líneas
grep -r "Planivia" apps/main-app/src --include="*.js" --include="*.jsx" | wc -l

# Debe retornar 0 o muy pocas
grep -r "MaLove" apps/main-app/src --include="*.js" --include="*.jsx" --exclude-dir=i18n | wc -l
```

---

## ✅ OBJETIVO FINAL

**CERO referencias a nombres antiguos en código activo:**
- ✅ Planivia en todos los lugares visibles
- ✅ planivia.net en todas las URLs
- ✅ Clases CSS con prefijo planivia-
- ✅ localStorage con prefijo planivia_
- ✅ Eventos con prefijo planivia-
- ⚠️ Fallbacks legacy para migración suave

**Estado esperado:** Solo "Planivia" y "planivia" en el código nuevo, con fallbacks temporales a nombres antiguos para compatibilidad.
