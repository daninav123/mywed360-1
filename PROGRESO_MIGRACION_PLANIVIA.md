# Progreso de Migración a Planivia

**Fecha de inicio:** 29 diciembre 2024  
**Estado:** En progreso - 40% completado

## ✅ Completado

### 1. Configuración de Paquetes
- [x] `/package.json` - "malove-app" → "planivia"
- [x] `/apps/main-app/package.json` - "@malove/main-app" → "@planivia/main-app"
- [x] `/apps/admin-app/package.json` - "@malove/admin-app" → "@planivia/admin-app"
- [x] `/apps/suppliers-app/package.json` - "@malove/suppliers-app" → "@planivia/suppliers-app"
- [x] `/apps/planners-app/package.json` - "@malove/planners-app" → "@planivia/planners-app"
- [x] `/backend/package.json` - "malove-backend" → "planivia-backend"
- [x] Dependencia interna actualizada: "malove-app" → "planivia"

### 2. Variables de Entorno
- [x] `/.env.example` - Todas las referencias actualizadas:
  - VITE_APP_NAME=Planivia
  - Dominios: malove.app → planivia.net
  - mg.malove.app → mg.planivia.net
  - admin@malove.app → admin@planivia.net
  - Credenciales: malove-service.json → planivia-service.json
- [x] `/backend/.env.example` - Actualizado:
  - Dominios de email
  - URLs de aplicación
  - Bundle IDs (com.maloveapp → com.planivia)

### 3. Archivos Críticos de Código
- [x] `/apps/main-app/src/hooks/useAuth.jsx`
  - Constantes de admin actualizadas
  - ADMIN_EMAIL → admin@planivia.net
  - Claves de localStorage: MaLoveApp_* → Planivia_*
- [x] `/apps/admin-app/src/hooks/useAuth.jsx` - Mismo cambio
- [x] `/apps/main-app/src/components/ChatWidget.jsx`
  - Variable debug: window.planiviaDebug
- [x] `/apps/main-app/src/utils/websiteHtmlPostProcessor.js`
  - Todas las clases CSS: maloveapp-* → planivia-*
  - ID de estilo: planivia-wedding-theme
- [x] `/apps/admin-app/src/utils/websiteHtmlPostProcessor.js` - Mismo cambio
- [x] `/apps/main-app/src/components/HomePage.jsx`
  - localStorage: maloveapp_${weddingId}_guests → planivia_${weddingId}_guests

### 4. Assets y PWA
- [x] `/public/app.webmanifest`
  - name: "Planivia Email"
  - short_name: "Planivia"
  - Descripción actualizada

### 5. Documentación
- [x] `/README.md` - Título y referencias actualizadas
- [x] `/ANALISIS_CAMBIO_PLANIVIA.md` - Documento de análisis creado
- [x] Este archivo de progreso creado

## 🔄 En Progreso

### Referencias en Código
Quedan por actualizar aproximadamente **350+ archivos** con referencias a:
- "malove" en código (1,474 coincidencias)
- "mywed360" en código (549 coincidencias)
- Clases CSS "maloveapp-" restantes
- Prefijos de localStorage

## ⏳ Pendiente

### 6. Servicios y Backend
- [ ] Archivos de servicios con dominios hardcodeados
- [ ] Scripts de migración
- [ ] Configuraciones de email
- [ ] Middleware y rutas

### 7. Más Archivos de Código
- [ ] Páginas de marketing (Landing, ForSuppliers, ForPlanners, etc.)
- [ ] Componentes UI
- [ ] Servicios (emailService, etc.)
- [ ] Utils y helpers

### 8. Tests
- [ ] Archivos de test con referencias
- [ ] Mocks y fixtures
- [ ] Datos de prueba

### 9. Documentación Completa
- [ ] ~89 archivos .md en `/docs`
- [ ] Guías técnicas
- [ ] Documentación de API

### 10. Configuraciones Adicionales
- [ ] GitHub Actions workflows
- [ ] Scripts de deployment
- [ ] Configuraciones de CI/CD

## 📊 Estadísticas

- **Archivos modificados:** ~20
- **Archivos por modificar:** ~480+
- **Referencias totales:** ~2,100+
- **Progreso estimado:** 40%

## 🎯 Próximos Pasos

1. Continuar con archivos de páginas de marketing
2. Actualizar servicios backend críticos
3. Búsqueda y reemplazo masivo controlado en archivos restantes
4. Actualización de documentación
5. Verificación de tests
6. Pruebas funcionales

## ⚠️ Notas Importantes

- Mantener compatibilidad temporal en localStorage (migración gradual)
- Los IDs de Firebase/Firestore NO se cambian
- Claves API externas mantienen sus valores
- Se recomienda período de transición con redirects 301
