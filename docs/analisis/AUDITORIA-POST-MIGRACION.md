# Auditoría Post-Migración - Análisis de Referencias Restantes

**Fecha:** 23 de octubre de 2025  
**Estado:** En revisión

## 📊 Resumen Ejecutivo

Tras el análisis exhaustivo post-migración, se han encontrado **referencias restantes** que se clasifican en tres categorías:

1. ✅ **LEGÍTIMAS** - Deben mantenerse por diseño
2. ⚠️ **REQUIEREN CORRECCIÓN** - Deben actualizarse
3. 📝 **OPCIONAL** - Pueden mantenerse o actualizarse según necesidad

---

## ✅ Referencias LEGÍTIMAS (No requieren cambios)

### 1. Archivo de Compatibilidad
**Archivo:** `src/utils/compatMigration.js`
- ✅ **Mantener**: Este archivo DEBE contener referencias a nombres antiguos
- **Razón**: Su función es migrar datos de localStorage de los nombres antiguos a los nuevos
- **Líneas**: Múltiples referencias a `lovenda` y `MaLove.App` son intencionales

### 2. Documentación de Migración
**Archivos:**
- `MIGRACION-MALOVEAPP.md`
- `scripts/migrateToMaLoveApp.js`
- ✅ **Mantener**: Documentan el proceso de migración
- **Razón**: Referencias históricas y ejemplos de cambios realizados

### 3. Archivos de Test con Dominios Mock
**Archivos:**
- `cypress/**/*.cy.js` (múltiples archivos)
- Referencias como `@lovenda.test`, `owner@mail.lovenda.test`
- ✅ **Mantener**: Son dominios de prueba falsos
- **Razón**: No afectan producción, útiles para distinguir tests

### 4. Logs y Resultados Históricos
**Archivos:**
- `cypress-results.json`
- `lint_errors.json`
- ✅ **Mantener**: Son registros históricos
- **Razón**: No afectan el funcionamiento actual

---

## ⚠️ Referencias que REQUIEREN CORRECCIÓN

### Categoría A: Archivos i18n (ALTA PRIORIDAD)

#### Problema: Brand Name en traducciones
**Archivos afectados (35 archivos):**
```
src/i18n/locales/*/common.json
```

**Referencias encontradas:**
- `"brandName": "Lovenda"` en múltiples idiomas (ar, bg, ca, cs, da, de, el, et, eu, fi, fr, fr-CA, hr, hu, is, it, lt, lv, mt, nl, no, pl, pt, ro, ru, sk, sl, sv, tr)
- `"title": "Bienvenida a Lovenda"` en español
- `"title": "Welcome to Lovenda"` en inglés

**Impacto:** ALTO - Afecta la marca visible en múltiples idiomas

**Solución recomendada:**
```json
{
  "app": {
    "brandName": "MaLoveApp",
    "hero": {
      "title": "Bienvenida a MaLoveApp"
    }
  }
}
```

---

### Categoría B: User Agent Detection (MEDIA PRIORIDAD)

#### Archivo: `src/App.jsx`
**Líneas problemáticas:**
```javascript
userAgent.includes('lovendaapp') ||
userAgent.includes('MaLove.Appapp') ||
```

**Impacto:** MEDIO - Afecta detección de apps móviles

**Solución recomendada:**
```javascript
userAgent.includes('maloveapp') ||
userAgent.includes('maloveapp-android') ||
userAgent.includes('maloveapp-ios') ||
// Mantener las antiguas temporalmente para retrocompatibilidad
userAgent.includes('lovendaapp') ||
userAgent.includes('MaLove.Appapp') ||
```

---

### Categoría C: localStorage Keys (MEDIA PRIORIDAD)

#### Referencias encontradas en múltiples archivos:

**1. `src/services/emailAutomationService.js`**
```javascript
// PROBLEMAS:
const CONFIG_KEY = 'MaLove.App.email.automation.config';
const CONFIG_LAST_SYNC_KEY = 'MaLove.App.email.automation.config.lastSync';
const STATE_KEY = 'MaLove.App.email.automation.state';
const CLASSIFICATION_CACHE_KEY = 'MaLove.App.email.automation.classification';
const SCHEDULE_KEY = 'MaLove.App.email.automation.schedule';
const raw = storageGet('MaLove.App.email.init');
```

**Solución:**
```javascript
const CONFIG_KEY = 'maloveapp.email.automation.config';
const CONFIG_LAST_SYNC_KEY = 'maloveapp.email.automation.config.lastSync';
// etc...
```

**2. Múltiples componentes con referencias:**
- `src/hooks/useAuth.jsx`: `myWed360Email` property
- `src/hooks/useEmailUsername.jsx`: `myWed360Email` property
- `src/hooks/useGuests.js`: `MaLove.AppGuests`
- `src/hooks/useSpecialMoments.js`: `MaLove.AppSpecialMoments`
- `src/hooks/useUserCollection.js`: `MaLove.AppUser_`
- `src/hooks/useWeddingCollection.js`: `MaLove.App-${wid}-${name}`
- `src/components/HomePage.jsx`: Múltiples keys
- `src/components/ChatWidget.jsx`: Múltiples keys

---

### Categoría D: Propiedades de Objetos (MEDIA PRIORIDAD)

#### Problema: Nombres de propiedades en objetos de usuario

**Archivos afectados:**
- `src/hooks/useAuth.jsx`
- `src/hooks/useEmailUsername.jsx`
- `src/components/email/EmailComposer.jsx`
- `src/pages/UnifiedEmail.jsx`

**Propiedades problemáticas:**
```javascript
myWed360Email: '...'  // Debería ser: maLoveAppEmail o simplemente email
```

**Impacto:** MEDIO - Afecta estructura de datos de usuario

---

### Categoría E: URLs y Dominios de Producción (ALTA PRIORIDAD)

#### Archivos con URLs hardcodeadas:

**1. `src/pages/EmailSetup.jsx`**
```javascript
// PROBLEMA:
¡Tu dirección de correo <strong>{currentUsername}@MaLove.App</strong>
Tu dirección de correo será <strong>{username || 'tunombre'}@MaLove.App</strong>
```

**2. `src/pages/admin/AdminLayout.jsx`**
```javascript
'https://lovenda.com/security'  // Debería ser maloveapp.com
```

**3. `src/hooks/useAuth.jsx`**
```javascript
ADMIN_ALLOWED_DOMAINS = 'lovenda.com'  // Debería incluir maloveapp.com
```

**4. `render.yaml`**
```javascript
name: MaLove.App-backend  // Debería ser maloveapp-backend
```

**5. `public/enable-auth.html`**
```javascript
authDomain: "MaLove.App.firebaseapp.com"  // Debería actualizarse
```

---

### Categoría F: Comentarios y Strings UI (BAJA PRIORIDAD)

#### Referencias en comentarios de código:

**Archivos:**
- `src/components/email/EmailSetupForm.jsx`: Comentarios con "myWed360"
- `src/components/email/MailgunTester.jsx`: "Probador de Mailgun myWed360"
- `scripts/aggregateRoadmap.js`: "Roadmap - Lovenda/MaLoveApp"
- Múltiples archivos con referencias en comentarios

**Impacto:** BAJO - Solo afecta legibilidad del código

---

## 📝 Referencias OPCIONALES

### Tests de Cypress
Los archivos de test en `cypress/` usan dominios como `lovenda.test` que son claramente para testing. Pueden mantenerse o actualizarse según preferencia del equipo.

### Datos Mock
Archivos como `src/data/adminMock.js` contienen datos de prueba con referencias antiguas. Pueden actualizarse pero no es crítico.

---

## 🔧 Plan de Acción Recomendado

### Fase 1: Correcciones Críticas (HACER AHORA)

1. ✅ **Actualizar i18n brandName en todos los idiomas**
   - Impacto: Alto
   - Archivos: 35+ archivos en `src/i18n/locales/*/common.json`

2. ✅ **Actualizar URLs de dominio en UI**
   - `src/pages/EmailSetup.jsx`
   - `src/pages/admin/AdminLayout.jsx`

3. ✅ **Actualizar configuraciones de producción**
   - `render.yaml`
   - `public/enable-auth.html`

### Fase 2: Mejoras Importantes (HACER PRONTO)

4. ⚠️ **Migrar localStorage keys en servicios**
   - `src/services/emailAutomationService.js`
   - Mantener compatibilidad con `compatMigration.js`

5. ⚠️ **Actualizar propiedades de objetos**
   - `myWed360Email` → `maLoveAppEmail` o `email`
   - Requerirá migración de datos en Firebase

6. ⚠️ **Actualizar user agent detection**
   - `src/App.jsx`
   - Mantener retrocompatibilidad temporal

### Fase 3: Limpieza Final (HACER DESPUÉS)

7. 📝 **Actualizar comentarios y documentación**
   - Bajo impacto
   - Mejora legibilidad

8. 📝 **Actualizar tests (opcional)**
   - Dominios de prueba
   - No crítico

---

## 📋 Checklist de Correcciones Pendientes

### Alta Prioridad
- [ ] Actualizar `brandName` en 35 archivos i18n
- [ ] Corregir `@MaLove.App` en `src/pages/EmailSetup.jsx`
- [ ] Actualizar URL en `src/pages/admin/AdminLayout.jsx`
- [ ] Corregir `render.yaml`
- [ ] Actualizar `public/enable-auth.html`

### Media Prioridad
- [ ] Migrar keys en `src/services/emailAutomationService.js`
- [ ] Actualizar user agents en `src/App.jsx`
- [ ] Revisar propiedades `myWed360Email` en hooks
- [ ] Actualizar `ADMIN_ALLOWED_DOMAINS` en useAuth

### Baja Prioridad
- [ ] Limpiar comentarios con referencias antiguas
- [ ] Actualizar strings en componentes mock/test
- [ ] Revisar y actualizar tests de Cypress (opcional)

---

## 🎯 Resumen de Impacto

| Categoría | Archivos | Prioridad | Impacto Usuario |
|-----------|----------|-----------|-----------------|
| i18n brandName | 35+ | 🔴 ALTA | Visible en UI |
| localStorage keys | 15+ | 🟡 MEDIA | Funcional |
| Propiedades objetos | 5+ | 🟡 MEDIA | Base de datos |
| URLs producción | 3 | 🔴 ALTA | Crítico |
| Comentarios | 20+ | 🟢 BAJA | Ninguno |

---

## ✅ Conclusión

La migración inicial fue **exitosa** con 1,339 reemplazos en 396 archivos. Las referencias restantes son en su mayoría:

1. **Legítimas** (archivos de compatibilidad y documentación)
2. **Traducciones** que requieren actualización sistemática
3. **localStorage keys** que necesitan migración cuidadosa
4. **Propiedades de datos** que requieren estrategia de migración

**Recomendación:** Ejecutar las correcciones de Fase 1 (alta prioridad) antes del siguiente despliegue.
