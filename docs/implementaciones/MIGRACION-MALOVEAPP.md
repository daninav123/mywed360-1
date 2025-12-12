# Migración de Marca: Lovenda/myWed360 → MaLoveApp

## Resumen Ejecutivo

Se ha completado exitosamente la migración completa de todas las referencias antiguas del proyecto a la nueva marca **MaLoveApp**.

**Fecha de migración:** 23 de octubre de 2025
**Archivos procesados:** 1,642
**Archivos modificados:** 396
**Total de reemplazos:** 1,339

## Cambios Realizados

### 1. Nombres de Marca

- `Lovenda` → `MaLoveApp`
- `MyWed360` → `MaLoveApp`
- `myWed360` → `MaLoveApp` (variantes)

### 2. Clases CSS

Todas las clases CSS han sido actualizadas:
- `lovenda-*` → `maloveapp-*`
- Ejemplo: `lovenda-card` → `maloveapp-card`
- Ejemplo: `lovenda-hero` → `maloveapp-hero`
- Ejemplo: `lovenda-button-primary` → `maloveapp-button-primary`

### 3. LocalStorage Keys

Todas las claves de almacenamiento local han sido migradas:
- `lovenda_*` → `maloveapp_*`
- `MaLove.App_*` → `maloveapp_*`
- `MyWed360_*` → `MaLoveApp_*`
- `MYWED360_*` → `MALOVEAPP_*`

### 4. Eventos Personalizados

- `MaLove.App:*` → `maloveapp:*`
- `lovenda:*` → `maloveapp:*`
- `'MaLove.App-*'` → `'maloveapp-*'`

### 5. Dominios y URLs

- `maloveapp.com` → `maloveapp.com`
- `maloveapp.netlify.app` → `maloveapp.netlify.app`
- `maloveapp.web.app` → `maloveapp.web.app`
- `maloveapp-backend.onrender.com` → `maloveapp-backend.onrender.com`
- `maloveapp.app` → `maloveapp.app`

### 6. Direcciones de Email

- `@maloveapp.com` → `@maloveapp.com`
- `@maloveapp.com` → `@maloveapp.com`
- `admin@maloveapp.com` → `admin@maloveapp.com`
- `soporte@maloveapp.com` → `soporte@maloveapp.com`

### 7. Service Workers y Cache

- `MaLove.App-v*` → `maloveapp-v*`
- `MaLove.App-static` → `maloveapp-static`
- `MaLove.App-dynamic` → `maloveapp-dynamic`
- `MaLove.App-api` → `maloveapp-api`
- `MaLove.App-share-target` → `maloveapp-share-target`

### 8. Configuraciones de Firebase

- `MaLove.App-test*` → `maloveapp-test*`
- `us-central1-MaLove.App` → `us-central1-maloveapp`

### 9. Variables Globales y Flags

- `__MYWED360_*` → `__MALOVEAPP_*`
- `__LOVENDA_*` → `__MALOVEAPP_*`

### 10. Branding en Configuración

- `branding: 'MaLove.App'` → `branding: 'maloveapp'`
- `"Marca MyWed360 visible"` → `"Marca MaLoveApp visible"`
- `"Sin marca MyWed360"` → `"Sin marca MaLoveApp"`

## Archivos Críticos Actualizados

### Frontend
- `src/main.jsx` - Punto de entrada principal
- `src/App.jsx` - Componente raíz
- `src/pwa/serviceWorker.js` - Service Worker
- `src/utils/compatMigration.js` - Sistema de compatibilidad
- `src/utils/websiteHtmlPostProcessor.js` - Procesador de HTML (67 reemplazos)
- `src/pages/**/*.jsx` - Todas las páginas
- `src/components/**/*.jsx` - Todos los componentes
- `src/services/**/*.js` - Todos los servicios
- `src/i18n/locales/*/common.json` - Archivos de traducción

### Backend
- `backend/index.js` - Servidor principal
- `backend/config.js` - Configuración
- `backend/middleware/authMiddleware.js` - Middleware de autenticación
- `backend/routes/**/*.js` - Todas las rutas
- `backend/services/**/*.js` - Todos los servicios
- `backend/config/stripe-products.js` - Productos de Stripe

### Tests
- `cypress/e2e/**/*.cy.js` - Tests E2E
- `src/test/**/*.test.js(x)` - Tests unitarios e integración
- `backend/__tests__/**/*.test.js` - Tests de backend

### Documentación
- `docs/**/*.md` - Toda la documentación
- `README.md` - Readme principal
- `CHANGELOG.md` - Registro de cambios

## Compatibilidad hacia Atrás

El archivo `src/utils/compatMigration.js` mantiene compatibilidad temporal con las claves antiguas de localStorage para que los usuarios existentes no pierdan sus datos. Este sistema:

1. Migra automáticamente claves antiguas a nuevas en el primer acceso
2. Mantiene sincronización bidireccional temporal
3. Permite una transición suave para usuarios existentes

## Acciones Post-Migración Requeridas

### 1. Configuración de Infraestructura

⚠️ **IMPORTANTE**: Actualizar configuraciones externas:

- [ ] **Mailgun**: Configurar dominio `maloveapp.com`
- [ ] **Firebase**: Actualizar proyecto si es necesario
- [ ] **Netlify**: Configurar dominio `maloveapp.netlify.app`
- [ ] **Render**: Actualizar backend a `maloveapp-backend.onrender.com`
- [ ] **Stripe**: Verificar configuración de productos
- [ ] **DNS**: Configurar registros para nuevos dominios

### 2. Variables de Entorno

Actualizar archivos `.env`:
```bash
# Backend
MAILGUN_DOMAIN=maloveapp.com
BACKEND_URL=https://maloveapp-backend.onrender.com
FIREBASE_PROJECT_ID=maloveapp # si aplica

# Frontend
VITE_BACKEND_URL=https://maloveapp-backend.onrender.com
VITE_FIREBASE_PROJECT_ID=maloveapp # si aplica
```

### 3. Verificación y Testing

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar linter
npm run lint

# 3. Ejecutar tests
npm test

# 4. Build de producción
npm run build

# 5. Verificar en desarrollo
npm run dev
```

### 4. Git y Control de Versiones

```bash
# Ver todos los cambios
git diff

# Revisar archivos modificados
git status

# Hacer commit de los cambios
git add .
git commit -m "feat: migración completa de marca a MaLoveApp

- Actualizado 396 archivos con 1,339 reemplazos
- Migradas todas las referencias de Lovenda/myWed360 a MaLoveApp
- Actualizadas clases CSS, localStorage keys, dominios y configuraciones
- Mantenida compatibilidad hacia atrás en compatMigration.js

BREAKING CHANGES:
- Nuevos dominios: maloveapp.com, maloveapp.netlify.app
- Nuevas claves de localStorage (con migración automática)
- Actualización de configuraciones de servicios externos requerida"
```

## Script de Migración

El script de migración está disponible en:
```bash
node scripts/migrateToMaLoveApp.js
```

Opciones:
- `--dry-run`: Previsualizar cambios sin aplicarlos
- `--verbose`: Mostrar detalles de cada reemplazo

## Verificación de Cambios Clave

### Ejemplo 1: Clases CSS
```css
/* Antes */
.lovenda-card { ... }
.lovenda-hero { ... }

/* Después */
.maloveapp-card { ... }
.maloveapp-hero { ... }
```

### Ejemplo 2: LocalStorage
```javascript
// Antes
localStorage.getItem('MaLove.App_user_session')
localStorage.setItem('lovenda_active_wedding', ...)

// Después
localStorage.getItem('maloveapp_user_session')
localStorage.setItem('maloveapp_active_wedding', ...)
```

### Ejemplo 3: Eventos
```javascript
// Antes
window.dispatchEvent(new Event('MaLove.App-profile-updated'))

// Después
window.dispatchEvent(new Event('maloveapp-profile-updated'))
```

### Ejemplo 4: Service Worker
```javascript
// Antes
const CACHE_NAME = 'MaLove.App-v1.0.0';

// Después
const CACHE_NAME = 'maloveapp-v1.0.0';
```

## Notas Importantes

1. **Retrocompatibilidad**: El sistema mantiene compatibilidad con claves antiguas de localStorage mediante `compatMigration.js`

2. **Tests**: Todos los tests han sido actualizados para reflejar la nueva marca

3. **Documentación**: Toda la documentación ha sido actualizada

4. **i18n**: Todas las traducciones mantienen el nuevo nombre de marca

5. **Mobile**: Apps de Android e iOS requieren actualización de configuración

## Siguientes Pasos

1. ✅ Migración de código completada
2. ⚠️ Pendiente: Actualizar configuraciones de servicios externos
3. ⚠️ Pendiente: Configurar nuevos dominios
4. ⚠️ Pendiente: Ejecutar tests completos
5. ⚠️ Pendiente: Desplegar en entornos de staging/producción

## Soporte

Si encuentras algún problema relacionado con la migración:
1. Revisa este documento
2. Verifica las variables de entorno
3. Comprueba la configuración de servicios externos
4. Revisa el archivo `src/utils/compatMigration.js` para problemas de localStorage

---

**Generado por:** Script de migración automática
**Fecha:** 23 de octubre de 2025
**Versión del script:** 1.0.0
