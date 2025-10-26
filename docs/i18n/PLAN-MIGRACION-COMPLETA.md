# Plan de Migración i18n Completa - MyWed360

## 📊 Estado Actual

### Completado ✅
- **MarketingLayout.jsx** - Layout de marketing
- **Nav.jsx** - Navegación principal (limpiado)
- **Login.jsx** - Autenticación (corregido mojibake)
- **Spinner.jsx** (x2) - Componentes de carga

**Total migrado: 4 componentes**

### Infraestructura Existente
- ✅ Sistema i18n configurado (`src/i18n/index.js`)
- ✅ Hook `useTranslations.js` disponible
- ✅ Archivos de traducción ES/EN/FR en `src/i18n/locales/`
- ✅ Selector de idioma (`LanguageSelector.jsx`)

---

## 🎯 Objetivo

**Migrar TODOS los strings hardcodeados del proyecto a claves i18n**

### Alcance Total Estimado
- **~250 archivos .jsx** (componentes React)
- **~150 archivos .js** (servicios, utils, hooks)
- **Total: ~400 archivos**

---

## 📋 Plan por Fases

### **FASE 0: Análisis y Preparación** (1-2 días)

#### Objetivos
1. Inventario completo de archivos
2. Identificar archivos sin strings traducibles
3. Categorizar por complejidad y prioridad
4. Crear scripts de validación

#### Tareas
- [ ] Ejecutar script para detectar strings hardcodeados
- [ ] Clasificar archivos por tipo (UI, páginas, servicios)
- [ ] Identificar archivos críticos vs nice-to-have
- [ ] Preparar plantillas de claves i18n

#### Entregables
- `inventario-archivos.json` - Lista completa
- `archivos-criticos.md` - Prioridades
- Script `detectHardcodedStrings.js` mejorado

---

### **FASE 1: Componentes UI Base** (3-4 días)

**Prioridad: CRÍTICA** | **Archivos: ~20**

#### Componentes a Migrar

##### UI Core (`src/components/ui/`)
- [x] Spinner.jsx ✅
- [ ] Button.jsx - ⚠️ No tiene strings
- [ ] Card.jsx
- [ ] Input.jsx  
- [ ] Modal.jsx
- [ ] Alert.jsx
- [ ] Badge.jsx
- [ ] Progress.jsx
- [ ] Tabs.jsx
- [ ] Tooltip.jsx
- [ ] Select.jsx
- [ ] Checkbox.jsx
- [ ] Radio.jsx
- [ ] Switch.jsx
- [ ] Toast.jsx

##### Componentes Base (`src/components/`)
- [x] Nav.jsx ✅
- [ ] PageWrapper.jsx
- [ ] MainLayout.jsx
- [ ] ErrorBoundary.jsx
- [ ] NotificationCenter.jsx

#### Criterios de Éxito
- ✅ 0 errores de lint
- ✅ Todos usan `useTranslations()`
- ✅ Claves añadidas a ES/EN/FR
- ✅ Tests pasando

---

### **FASE 2: Páginas Principales** (5-7 días)

**Prioridad: ALTA** | **Archivos: ~35**

#### Autenticación
- [x] Login.jsx ✅
- [ ] Signup.jsx
- [ ] ResetPassword.jsx
- [ ] VerifyEmail.jsx

#### Dashboard
- [ ] Home.jsx
- [ ] HomePage.jsx
- [ ] PlannerDashboard.jsx

#### Módulos Principales
- [ ] **Invitados** (`src/pages/Invitados.jsx`) ⚠️ Crítico
- [ ] **Bodas** (`src/pages/Bodas.jsx`, `BodaDetalle.jsx`)
- [ ] **Finanzas** (`src/pages/Finance.jsx`, subpáginas)
- [ ] **Tareas** (`src/pages/Tasks.jsx`)
- [ ] **Email** (`src/pages/UnifiedEmail.jsx`)
- [ ] **Proveedores** (`src/pages/Proveedores.jsx`)

#### Admin
- [ ] AdminLogin.jsx
- [ ] AdminDashboard.jsx
- [ ] AdminUsers.jsx
- [ ] AdminMetrics.jsx
- [ ] (10+ páginas admin)

---

### **FASE 3: Componentes de Dominio** (10-14 días)

**Prioridad: MEDIA-ALTA** | **Archivos: ~100**

#### Por Módulo

##### Invitados (`src/components/guests/`)
- [ ] GuestItem.jsx
- [ ] GuestList.jsx
- [ ] GuestForm.jsx
- [ ] GuestFilters.jsx
- [ ] GuestStats.jsx
- [ ] ImportGuests.jsx
- [ ] (15+ componentes)

##### Finanzas (`src/components/finance/`)
- [ ] BudgetSummary.jsx
- [ ] TransactionList.jsx
- [ ] CategoryManager.jsx
- [ ] PaymentTracker.jsx
- [ ] InvoiceGenerator.jsx
- [ ] (20+ componentes)

##### Tareas (`src/components/tasks/`)
- [ ] TaskList.jsx
- [ ] TaskItem.jsx
- [ ] TasksRefactored.jsx
- [ ] TaskCalendar.jsx
- [ ] GanttChart.jsx
- [ ] (15+ componentes)

##### Proveedores (`src/components/proveedores/`)
- [ ] ProviderCard.jsx
- [ ] ProviderList.jsx
- [ ] BudgetComparison.jsx
- [ ] ContractManager.jsx
- [ ] (20+ componentes)

##### Seating (`src/components/seating/`)
- [ ] SeatingPlanRefactored.jsx
- [ ] SeatingCanvas.jsx
- [ ] SeatingToolbar.jsx
- [ ] TableManager.jsx
- [ ] (10+ componentes)

##### Email (`src/components/email/`)
- [ ] EmailComposer.jsx
- [ ] EmailList.jsx
- [ ] EmailViewer.jsx
- [ ] TemplateEditor.jsx
- [ ] (15+ componentes)

---

### **FASE 4: Servicios y Utils Críticos** (7-10 días)

**Prioridad: MEDIA** | **Archivos: ~40**

⚠️ **NOTA**: Servicios y utils tienen menos strings UI pero son críticos

#### Servicios a Revisar

##### Servicios con Mensajes de Usuario
- [ ] `authService.js` - Mensajes de error auth
- [ ] `emailService.js` - Textos de email
- [ ] `notificationService.js` - Notificaciones
- [ ] `validationService.js` - Mensajes de validación
- [ ] `WeddingService.js` - Mensajes del sistema

##### Servicios con Logs/Errores (BAJO)
- `apiClient.js` - Solo logs internos
- `diagnosticService.js` - Solo debugging
- `PerformanceMonitor.js` - Métricas

#### Utils con Strings
- [ ] `validationUtils.js` - Mensajes de error
- [ ] `formatUtils.js` - Formatos de fecha/moneda
- [ ] `errorLogger.js` - Mensajes de error

---

### **FASE 5: Data y Templates** (3-5 días)

**Prioridad: BAJA** | **Archivos: ~15**

#### Templates
- [ ] `src/data/templates/contractTemplates.js`
- [ ] `src/data/templates/generalTemplates.js`
- [ ] `src/data/templates/proveedorTemplates.js`
- [ ] `src/data/invitationTemplates.js`

#### Data Estática
- [ ] `src/data/musicInspiration.js`
- [ ] `src/data/venueTemplates.js`
- [ ] `src/config/eventStyles.js` ✅ (ya restaurado)

---

### **FASE 6: Validación y Testing** (5-7 días)

#### Tareas de QA

1. **Validación Automática**
   - [ ] Ejecutar `npm run lint` en todo el proyecto
   - [ ] Ejecutar `detectHardcodedStrings.js` 
   - [ ] Verificar 0 strings hardcodeados restantes

2. **Testing Manual**
   - [ ] Probar todas las páginas en ES
   - [ ] Probar todas las páginas en EN
   - [ ] Probar todas las páginas en FR
   - [ ] Verificar formularios y validaciones

3. **Testing E2E**
   - [ ] Ejecutar suite completa de Cypress
   - [ ] Verificar flujos críticos multiidioma
   - [ ] Tests de accesibilidad

4. **Revisión de Encoding**
   - [ ] Buscar y corregir mojibake residual
   - [ ] Validar UTF-8 en todos los JSON
   - [ ] Verificar caracteres especiales (ñ, á, ¿, etc.)

---

### **FASE 7: Optimización y Cleanup** (3-4 días)

#### Optimizaciones

1. **Lazy Loading de Traducciones**
   - [ ] Implementar code splitting por namespace
   - [ ] Medir impacto en bundle size
   - [ ] Optimizar carga inicial

2. **Claves Duplicadas**
   - [ ] Detectar claves duplicadas
   - [ ] Consolidar traducciones similares
   - [ ] Crear namespaces consistentes

3. **Traducción Profesional**
   - [ ] Revisar calidad EN (auto-traducido)
   - [ ] Revisar calidad FR (auto-traducido)
   - [ ] Contratar traductor profesional (opcional)

4. **Cleanup**
   - [ ] Eliminar archivos `.bak` de i18n
   - [ ] Eliminar código comentado
   - [ ] Actualizar documentación

---

### **FASE 8: Documentación y Deployment** (2-3 días)

#### Documentación

1. **Guías de Uso**
   - [ ] Actualizar `docs/i18n.md`
   - [ ] Crear guía de contribución i18n
   - [ ] Documentar convenciones de claves

2. **Changelog**
   - [ ] Documentar todos los cambios
   - [ ] Crear release notes
   - [ ] Actualizar README.md

3. **Deployment**
   - [ ] Merge a rama principal
   - [ ] Deploy a staging
   - [ ] Testing en producción
   - [ ] Deploy a producción

---

## 📊 Métricas de Progreso

### Por Fase

| Fase | Archivos | Días Est. | Estado |
|------|----------|-----------|--------|
| 0. Preparación | - | 1-2 | ⏳ En curso |
| 1. UI Base | 20 | 3-4 | ⏸️ Pendiente |
| 2. Páginas | 35 | 5-7 | ⏸️ Pendiente |
| 3. Dominio | 100 | 10-14 | ⏸️ Pendiente |
| 4. Servicios | 40 | 7-10 | ⏸️ Pendiente |
| 5. Data | 15 | 3-5 | ⏸️ Pendiente |
| 6. Testing | - | 5-7 | ⏸️ Pendiente |
| 7. Optimización | - | 3-4 | ⏸️ Pendiente |
| 8. Deploy | - | 2-3 | ⏸️ Pendiente |
| **TOTAL** | **~210** | **39-56 días** | **2% completo** |

### Progreso Actual
- ✅ Completados: **4 archivos** (2%)
- ⏳ En progreso: **0 archivos**
- ⏸️ Pendientes: **~206 archivos** (98%)

---

## 🛠️ Herramientas y Automatización

### Scripts Necesarios

1. **`detectHardcodedStrings.js`** (MEJORAR)
   - Detectar strings con caracteres españoles
   - Excluir comentarios, logs internos
   - Generar reporte por archivo
   - Sugerir claves i18n

2. **`generateTranslationKeys.js`** (NUEVO)
   - Generar claves automáticamente
   - Evitar duplicados
   - Crear estructura de namespaces

3. **`validateTranslations.js`** (NUEVO)
   - Verificar claves faltantes
   - Detectar claves no usadas
   - Validar interpolación

4. **`batchMigrate.js`** (NUEVO)
   - Migrar múltiples archivos similares
   - Aplicar patrones comunes
   - Generar PRs automáticos

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos Identificados

1. **Mojibake / Encoding**
   - **Mitigación**: Validar UTF-8 en cada commit
   - **Herramienta**: `fixMojibake.cjs` ya creado

2. **Traducciones Incorrectas**
   - **Mitigación**: Revisión manual de claves críticas
   - **Herramienta**: Contratar traductor profesional

3. **Regresiones Funcionales**
   - **Mitigación**: Tests E2E completos
   - **Herramienta**: Cypress suite existente

4. **Performance**
   - **Mitigación**: Code splitting y lazy loading
   - **Herramienta**: Bundle analyzer

5. **Tiempo Estimado**
   - **Mitigación**: Priorizar fases críticas
   - **Buffer**: +30% tiempo contingencia

---

## 🎯 Criterios de Éxito Global

### Técnicos
- [ ] 0 strings hardcodeados detectados
- [ ] 100% componentes usando `useTranslations()`
- [ ] 0 errores de lint
- [ ] Todos los tests E2E pasando
- [ ] Bundle size < +15% del original

### Funcionales
- [ ] Cambio de idioma funciona en todas las páginas
- [ ] Todas las validaciones traducidas
- [ ] Todos los mensajes de error traducidos
- [ ] Accesibilidad mantenida (aria-labels)

### Calidad
- [ ] Traducciones ES/EN/FR completas
- [ ] Sin mojibake ni encoding issues
- [ ] Claves organizadas por namespace
- [ ] Documentación actualizada

---

## 📅 Timeline Sugerido

### Opción 1: Full-time (1 desarrollador)
- **Duración**: 8-10 semanas
- **Ritmo**: 5 archivos/día
- **Riesgo**: Bajo

### Opción 2: Part-time (50% dedicación)
- **Duración**: 16-20 semanas  
- **Ritmo**: 2-3 archivos/día
- **Riesgo**: Medio

### Opción 3: Sprint Intensivo (equipo de 2-3)
- **Duración**: 4-6 semanas
- **Ritmo**: 10-15 archivos/día
- **Riesgo**: Alto (calidad)

---

## 🚀 Próximos Pasos Inmediatos

1. **Hoy** - Completar FASE 0
   - Generar inventario completo
   - Categorizar archivos
   - Crear scripts de validación

2. **Esta semana** - FASE 1 (UI Base)
   - Migrar componentes UI core
   - Establecer patrones
   - Crear guía de migración

3. **Próximas 2 semanas** - FASE 2 (Páginas)
   - Páginas críticas (Home, Invitados, etc.)
   - Validar flujos principales
   - Ajustar estrategia según feedback

---

## 📝 Notas Adicionales

### Lecciones Aprendidas (Migración Previa)
- ❌ Scripts automáticos masivos generan código corrupto
- ✅ Migración manual controlada es más segura
- ✅ Validar con lint después de cada archivo
- ✅ Commit frecuente (cada 5-10 archivos)
- ✅ Revisar encoding UTF-8 constantemente

### Decisiones Técnicas
- **Namespace strategy**: Por módulo (common, auth, finance, etc.)
- **Key naming**: snake_case para consistencia
- **Fallback**: Siempre a español
- **Pluralización**: Usar sintaxis i18next estándar

---

**Última actualización**: {{ now }}
**Responsable**: Equipo de desarrollo
**Revisión**: Semanal
