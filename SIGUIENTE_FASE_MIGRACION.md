# Siguiente Fase de Migración a Planivia

**Estado Actual:** 50% completado  
**Archivos modificados:** 30+  
**Próximos pasos prioritarios**

---

## 📋 Archivos Pendientes por Categoría

### 🔴 ALTA PRIORIDAD (Impacto visible al usuario)

#### 1. Servicios Frontend (28 archivos)
**Ubicación:** `/apps/main-app/src/services/`

Archivos con referencias a "MaLove":
- `emailService.js` (8 refs)
- `whatsappBridge.js` (7 refs)  
- `PlanLimitsService.js` (5 refs)
- `adminSession.js` (5 refs)
- `statsService.js` (5 refs)
- `authService.js` (4 refs)
- `mailgunService.js` (4 refs)
- Y 21 más...

**Acción:** Buscar y reemplazar "MaLove" por "Planivia" en comentarios y strings

#### 2. Utilidades Frontend (7 archivos)
**Ubicación:** `/apps/main-app/src/utils/`

- `websiteHtmlPostProcessor.js` (38 refs - **YA ACTUALIZADO**)
- `consoleCommands.js` (18 refs)
- `compatMigration.js` (6 refs)
- `backendBase.js` (2 refs)
- Y 3 más...

**Acción:** Actualizar referencias en comentarios de debug

#### 3. Scripts Backend (10 archivos)
**Ubicación:** `/backend/scripts/`

Scripts con `malove.app`:
- `check-specific-mail.js` (8 refs)
- `fix-user-email.js` (6 refs)
- `check-latest-mail.js` (5 refs)
- Y 7 más...

**Acción:** Actualizar emails de ejemplo en scripts de testing

#### 4. Páginas de Marketing (7 archivos)
**Ubicación:** `/apps/main-app/src/pages/marketing/`

```
- Access.jsx
- AppOverview.jsx
- ForPlanners.jsx
- ForSuppliers.jsx
- Landing.jsx
- Partners.jsx
- Pricing.jsx
```

**Impacto:** CRÍTICO - Visible en landing pages públicas  
**Acción:** Actualizar textos, títulos, descripciones de producto

---

### 🟡 MEDIA PRIORIDAD (Backend y configuración)

#### 5. Más Servicios Backend (15+ archivos)
- Servicios de notificación
- Servicios de webhooks
- Servicios de API

#### 6. Componentes Restantes (~300 archivos)
- Referencias a `maloveapp_` en localStorage
- Clases CSS adicionales (si existen)

---

### 🟢 BAJA PRIORIDAD (Documentación y tests)

#### 7. Documentación (89 archivos .md)
**Ubicación:** `/docs/`

Categorías:
- `/docs/analisis/` (~30 archivos)
- `/docs/admin/` (~10 archivos)
- `/docs/implementaciones/` (~15 archivos)
- `/docs/features/` (~10 archivos)
- Y más...

**Acción:** Buscar y reemplazar global con confirmación

#### 8. Tests (50+ archivos)
- Unit tests
- E2E tests  
- Fixtures y mocks

---

## 🎯 Plan de Ejecución Recomendado

### Sesión 1 (1 hora) ✅ COMPLETADA
- [x] Configuración de paquetes
- [x] Variables de entorno
- [x] Archivos críticos de código
- [x] Assets PWA
- [x] Servicios de email principales

### Sesión 2 (1-2 horas) 🔄 EN PROGRESO
- [ ] **AHORA:** Servicios frontend (28 archivos)
- [ ] Páginas de marketing (7 archivos)
- [ ] Scripts backend de testing (10 archivos)
- [ ] Utilidades restantes (6 archivos)

### Sesión 3 (1-2 horas)
- [ ] Componentes con localStorage
- [ ] Servicios backend restantes
- [ ] Configuraciones adicionales

### Sesión 4 (2-3 horas)
- [ ] Documentación completa (89 archivos)
- [ ] Tests y fixtures
- [ ] Verificación final

---

## 🛠️ Comandos Útiles para Búsqueda

### Buscar referencias restantes:
```bash
# En servicios
grep -r "MaLove" apps/main-app/src/services/ --include="*.js"

# En componentes
grep -r "maloveapp" apps/main-app/src/components/ --include="*.jsx"

# En backend
grep -r "malove.app" backend/ --include="*.js"

# En documentación
grep -r "MaLove\|malove\|mywed360" docs/ --include="*.md"
```

### Reemplazos seguros:
```bash
# Ejemplo de reemplazo en un archivo
sed -i '' 's/MaLove\.App/Planivia/g' archivo.js
sed -i '' 's/malove\.app/planivia.net/g' archivo.js
```

---

## ⚠️ PRECAUCIONES

### NO cambiar:
- IDs de Firebase/Firestore
- Claves API reales
- Tokens de autenticación
- Nombres de carpetas físicas (por ahora)

### Verificar manualmente:
- URLs hardcodeadas en producción
- Configuraciones de servicios externos
- Redirects y proxies

### Testing obligatorio después de:
- Cambios en servicios de email
- Cambios en autenticación
- Cambios en localStorage (migración gradual)

---

## 📊 Métricas de Progreso

**Completado hasta ahora:**
- ✅ 30+ archivos actualizados
- ✅ ~200 referencias cambiadas
- ✅ Configuración base completa
- ✅ Assets y PWA listos

**Pendiente:**
- ⏳ ~450 archivos por revisar
- ⏳ ~1,900 referencias por actualizar
- ⏳ Documentación completa
- ⏳ Testing exhaustivo

---

## 🚀 CONTINUAR CON

**Prioridad #1:** Servicios frontend
- Comenzar por `emailService.js`
- Luego `whatsappBridge.js`
- Seguir por orden de impacto

**Prioridad #2:** Páginas de marketing
- Landing page primero
- Luego ForSuppliers y ForPlanners

**Prioridad #3:** Scripts de testing backend
- Actualizar emails de ejemplo
- Verificar que sigan funcionando
