# Análisis Completo - Cambio de Marca a Planivia

**Fecha:** 29 diciembre 2024  
**Nuevo nombre:** Planivia  
**Nuevo dominio:** planivia.net

## 🎯 Resumen Ejecutivo

### Magnitud del cambio
- **549 referencias** de "mywed360" en archivos .json/.js/.jsx
- **1,474 referencias** de "malove" en 374 archivos .js/.jsx
- **89 referencias** de "mywed360" en archivos .env/.md
- **Múltiples apps** afectadas: main-app, admin-app, suppliers-app, planners-app, backend

---

## 📦 1. CONFIGURACIÓN DE PAQUETES

### 1.1 package.json Principal
**Archivo:** `/package.json`
- ✅ `name`: "malove-app" → "planivia"
- Mantener versión actual

### 1.2 Apps Individuales
**Archivos:**
- `/apps/main-app/package.json` - `name`: "@malove/main-app" → "@planivia/main-app"
- `/apps/admin-app/package.json` - Similar
- `/apps/suppliers-app/package.json` - Similar
- `/apps/planners-app/package.json` - Similar
- `/backend/package.json` - `name`: "malove-backend" → "planivia-backend"

---

## 🔧 2. VARIABLES DE ENTORNO

### 2.1 Archivos .env
**Archivos a actualizar:**
- `/.env.example`
- `/backend/.env.example`
- Cualquier `.env` local (no versionado)

**Cambios necesarios:**

```env
# Antes
VITE_APP_NAME=MaLove.App
MAILGUN_DOMAIN=malove.app
VITE_MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app
VITE_MAILGUN_SENDING_DOMAIN=mg.malove.app
ADMIN_EMAIL=admin@malove.app
ADMIN_ALLOWED_DOMAINS=malove.app
VITE_ADMIN_ALLOWED_DOMAINS=malove.app
VITE_ADMIN_SUPPORT_EMAIL=soporte@malove.app
ALERT_EMAIL_TO=alerts@malove.app
ALERT_EMAIL_FROM=alerts@malove.app
ADMIN_NAME=Administrador MaLove.App
PUBLIC_SITES_BASE_DOMAIN=sites.malove.app

# Después
VITE_APP_NAME=Planivia
MAILGUN_DOMAIN=planivia.net
VITE_MAILGUN_DOMAIN=planivia.net
MAILGUN_SENDING_DOMAIN=mg.planivia.net
VITE_MAILGUN_SENDING_DOMAIN=mg.planivia.net
ADMIN_EMAIL=admin@planivia.net
ADMIN_ALLOWED_DOMAINS=planivia.net
VITE_ADMIN_ALLOWED_DOMAINS=planivia.net
VITE_ADMIN_SUPPORT_EMAIL=soporte@planivia.net
ALERT_EMAIL_TO=alerts@planivia.net
ALERT_EMAIL_FROM=alerts@planivia.net
ADMIN_NAME=Administrador Planivia
PUBLIC_SITES_BASE_DOMAIN=sites.planivia.net
```

---

## 🔥 3. FIREBASE

### 3.1 .firebaserc
**Archivo:** `/.firebaserc`
- Proyecto actual: "lovenda-98c77"
- **Acción:** Probablemente mantener el mismo proyecto Firebase (solo es nombre interno)
- **Alternativa:** Crear nuevo proyecto Firebase si se desea separación total

---

## 💻 4. CÓDIGO FUENTE

### 4.1 Referencias en JavaScript/JSX

**Tipos de referencias a cambiar:**

#### A. Hardcoded "MaLove" / "malove" en UI
- Títulos de páginas
- Mensajes de bienvenida
- Textos de marketing
- Nombres de empresa en correos

#### B. Referencias técnicas
- Comentarios con "MaLove.App"
- Logs con nombre de aplicación
- Descripciones en package.json

#### C. URLs y dominios
- `malove.app` → `planivia.net`
- `mg.malove.app` → `mg.planivia.net`

### 4.2 Archivos con más impacto (top 20)
```
1. apps/admin-app/src/utils/websiteHtmlPostProcessor.js (64 refs)
2. apps/main-app/src/utils/websiteHtmlPostProcessor.js (64 refs)
3. scripts/migrateToMaLoveApp.js (58 refs)
4. scripts/migrateRemainingReferences.js (51 refs)
5. apps/admin-app/src/hooks/useAuth.jsx (49 refs)
6. apps/main-app/src/hooks/useAuth.jsx (49 refs)
7. apps/main-app/src/components/ChatWidget.jsx (33 refs)
8. apps/main-app/src/pages/DisenoWeb.jsx (30 refs)
9. apps/main-app/src/pages/marketing/Partners.jsx (21 refs)
10. apps/admin-app/src/utils/consoleCommands.js (18 refs)
11. apps/main-app/src/pages/marketing/ForSuppliers.jsx (18 refs)
12. apps/main-app/src/utils/consoleCommands.js (18 refs)
13. apps/main-app/src/data/email/mockEmailData.js (17 refs)
14. apps/main-app/src/pages/marketing/ForPlanners.jsx (17 refs)
15. apps/main-app/src/pages/marketing/Landing.jsx (17 refs)
16. apps/main-app/src/pages/marketing/AppOverview.jsx (14 refs)
17. apps/main-app/src/components/HomePage.jsx (13 refs)
18. apps/main-app/src/test/services/EmailService.test.js (13 refs)
19. scripts/test-mailgun-config.js (13 refs)
20. apps/main-app/src/pages/marketing/Pricing.jsx (12 refs)
```

---

## 📝 5. DOCUMENTACIÓN

### 5.1 Archivos Markdown (89 referencias)
**Categorías:**
- Documentación técnica en `/docs`
- README.md
- Archivos de análisis y reportes
- Guías de implementación

**Principales archivos:**
- `docs/implementaciones/MIGRACION-MALOVEAPP.md` (9 refs)
- `EMAILS_AUTOMATICOS_IMPLEMENTADOS_28DIC.md` (7 refs)
- `docs/CAMBIO-DOMINIO-EMAIL.md` (7 refs)
- Múltiples archivos en `/docs`

---

## 🎨 6. ASSETS Y RECURSOS

### 6.1 Archivos a revisar
- `/public/app.webmanifest` - Nombre de la app
- Imágenes con marca (logos, iconos)
- Meta tags en HTML
- Service Worker

### 6.2 PWA
- Nombre de la aplicación
- Descripción
- Iconos (mantener o reemplazar)

---

## 🗄️ 7. BASE DE DATOS

### 7.1 Firestore
**Potenciales referencias en datos:**
- Colecciones con nombre "malove" o "mywed360"
- Documentos con campos que contengan URLs antiguas
- Configuraciones almacenadas

**Acción:** Migración de datos si es necesario

---

## 📧 8. SERVICIOS EXTERNOS

### 8.1 Mailgun
**Acciones requeridas:**
- Verificar dominio `planivia.net` en Mailgun
- Configurar DNS (SPF, DKIM, DMARC)
- Crear subdominio `mg.planivia.net`
- Actualizar webhooks

### 8.2 Otros servicios
- Firebase (mantener o migrar)
- Stripe (actualizar nombre de negocio)
- Twilio (actualizar configuración)
- APIs de terceros con callback URLs

---

## 🔒 9. SEGURIDAD Y CONFIGURACIÓN

### 9.1 CORS
- Actualizar dominios permitidos
- Configurar nuevos orígenes

### 9.2 Cookies y sesiones
- Revisar configuración de dominio

### 9.3 OAuth y callbacks
- Actualizar redirect URLs

---

## 📱 10. APPS MÓVILES (si existen)

### 10.1 React Native / Mobile
- `/mobile` - Actualizar configuración si existe

---

## 🧪 11. TESTS

### 11.1 Test E2E (Cypress/Playwright)
- Datos mock con referencias antiguas
- Tests con URLs hardcodeadas
- Fixtures con dominios antiguos

### 11.2 Tests unitarios
- Mocks con nombre antiguo
- Validaciones de dominio

---

## 📋 12. CI/CD Y DEPLOYMENT

### 12.1 GitHub Actions
- `.github/workflows/*.yml`
- Variables de entorno en GitHub

### 12.2 Scripts de deployment
- Verificar scripts en `/scripts`
- Build configurations

---

## 🎯 ESTRATEGIA DE MIGRACIÓN

### Fase 1: Preparación (1-2 días)
1. ✅ Análisis completo (ESTE DOCUMENTO)
2. ⬜ Backup completo del proyecto
3. ⬜ Configurar servicios externos (Mailgun con nuevo dominio)
4. ⬜ Crear nueva rama `rebrand-planivia`

### Fase 2: Cambios Core (2-3 días)
1. ⬜ Actualizar package.json (todos)
2. ⬜ Actualizar .env.example
3. ⬜ Cambiar referencias en código principal (top 20 archivos)
4. ⬜ Actualizar documentación crítica

### Fase 3: Cambios Extendidos (2-3 días)
1. ⬜ Resto de archivos .js/.jsx (búsqueda y reemplazo cuidadoso)
2. ⬜ Actualizar toda la documentación .md
3. ⬜ Revisar y actualizar tests
4. ⬜ Actualizar assets (manifest, meta tags)

### Fase 4: Testing (2-3 días)
1. ⬜ Tests unitarios
2. ⬜ Tests E2E
3. ⬜ Pruebas manuales de funcionalidades críticas
4. ⬜ Verificar emails

### Fase 5: Deployment (1 día)
1. ⬜ Configurar DNS para planivia.net
2. ⬜ Deploy a staging
3. ⬜ Verificación final
4. ⬜ Deploy a producción

---

## ⚠️ RIESGOS Y CONSIDERACIONES

### Riesgos Altos
1. **Emails en producción**: Los usuarios tienen emails @malove.app configurados
2. **URLs públicas**: Enlaces compartidos con dominio antiguo
3. **SEO**: Pérdida de ranking si no se configuran redirects

### Mitigaciones
1. Mantener redirecciones 301 de malove.app → planivia.net
2. Plan de comunicación a usuarios sobre cambio de dominio
3. Período de transición con soporte para ambos dominios

### Datos a NO cambiar
- IDs de Firebase/Firestore
- Claves API (solo si contienen el nombre)
- Hashes y tokens

---

## 📊 ESTIMACIÓN

**Tiempo total estimado:** 8-12 días
**Archivos a modificar:** ~500 archivos
**Referencias a cambiar:** ~2,100+ referencias

---

## 🚀 SIGUIENTE PASO

Decidir estrategia:
- **Opción A**: Cambio completo inmediato (8-12 días de trabajo)
- **Opción B**: Cambio progresivo por fases (mantener compatibilidad temporal)
- **Opción C**: Cambio solo en elementos visibles al usuario (más rápido, 3-5 días)

**Recomendación:** Opción B (cambio por fases) para minimizar riesgos.
