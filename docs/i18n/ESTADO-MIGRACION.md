# Estado de Migración i18n - MyWed360

**Última actualización:** 27 Oct 2025, 1:10 AM  
**Progreso global:** 11/664 archivos (1.7%)

---

## ✅ Completado

### FASE 0: Análisis y Preparación (100%)
- [x] Plan completo creado (`PLAN-MIGRACION-COMPLETA.md`)
- [x] Script de inventario (`scripts/i18n/generateInventory.js`)
- [x] Inventario generado (`inventario-archivos.json`)
- [x] Infraestructura i18n verificada

### FASE 1: Componentes UI Core (100%)
- [x] `src/components/Spinner.jsx`
- [x] `src/components/ui/Spinner.jsx`
- [x] `src/components/ui/Loader.jsx`
- [x] `src/components/ui/BaseModal.jsx`
- [x] `src/components/ui/FormField.jsx`

**Componentes sin strings (no requieren migración):**
- Alert.jsx, Badge.jsx, Button.jsx, Card.jsx, Progress.jsx, Tabs.jsx, PageTabs.jsx, icons.jsx, IconComponents.jsx

### FASE 2: Páginas Principales (25% - 3/12)
- [x] `src/pages/ResetPassword.jsx` - 7 claves
- [x] `src/pages/NotificationPreferences.jsx` - 16 claves
- [x] `src/pages/Notificaciones.jsx` - 13 claves

**Páginas ya migradas previamente:**
- [x] `src/pages/Login.jsx` - authLogin.*
- [x] `src/pages/Signup.jsx` - authSignup.*
- [x] `src/pages/More.jsx` - Ya usa useTranslations()
- [x] `src/components/marketing/MarketingLayout.jsx`
- [x] `src/components/Nav.jsx`

---

## ⏸️ Pendiente

### FASE 2: Páginas Principales - PENDIENTES (9/12 restantes)

#### Páginas Simples (Prioridad ALTA)
Estimado: ~4-6 horas

1. **Dashboard.jsx** (~150 líneas)
   - Strings estimados: ~10
   - Complejidad: Baja
   - Tiempo estimado: 25 min

2. **HomeUser.jsx** (20 líneas - solo wrapper)
   - Strings estimados: 0
   - Ya revisado: Solo hace prefetch
   - Tiempo estimado: N/A (sin strings)

3. **Tasks.jsx** (27 líneas - wrapper)
   - Strings estimados: ~3-5 (solo comentarios)
   - Complejidad: Baja
   - Tiempo estimado: 15 min
   - Nota: TasksRefactored.jsx sí tiene muchos strings

4. **Perfil.jsx** (~560 líneas)
   - Strings estimados: ~25
   - Complejidad: Media-Alta
   - Tiempo estimado: 45 min
   - Nota: Ya usa `useTranslation()` parcialmente

5. **Checklist.jsx**
   - Strings estimados: ~15
   - Complejidad: Media
   - Tiempo estimado: 30 min

#### Páginas Complejas (Prioridad MEDIA)
Estimado: ~10-15 horas

6. **Bodas.jsx** (517 líneas)
   - Strings estimados: ~30-40
   - Complejidad: ALTA
   - Tiempo estimado: 90 min
   - Strings identificados:
     - "Bodas activas", "Bodas archivadas", "Resumen multi boda"
     - "Boda sin nombre", "Fecha pendiente", "Ubicación pendiente"
     - "Activa", "Archivada", "Archivar", "Restaurar"
     - "Progreso", "Cargando bodas..."
     - "Crear nueva boda", "Mis Bodas"
     - Mensajes de error/confirmación

7. **BodaDetalle.jsx**
   - Strings estimados: ~25-30
   - Complejidad: Alta
   - Tiempo estimado: 60 min

8. **Finance.jsx**
   - Strings estimados: ~20-25
   - Complejidad: Media-Alta
   - Tiempo estimado: 50 min
   - Nota: Hay claves finance.* ya creadas

9. **Invitados.jsx**
   - Strings estimados: ~15-20
   - Complejidad: Alta
   - Tiempo estimado: 45 min
   - ⚠️ NOTA: Tiene hooks deshabilitados (ver memoria)

10. **Proveedores.jsx**
    - Strings estimados: ~20-25
    - Complejidad: Alta
    - Tiempo estimado: 60 min

11. **ProveedoresNuevo.jsx**
    - Strings estimados: ~15-20
    - Complejidad: Media
    - Tiempo estimado: 40 min

12. **PublicWedding.jsx**
    - Strings estimados: ~20
    - Complejidad: Media
    - Tiempo estimado: 35 min

---

### FASE 3: Componentes de Dominio (198 archivos)
Estimado: ~115 horas

#### Por Módulo

##### Invitados (src/components/guests/) - 8 componentes
- [ ] GuestItem.jsx
- [ ] GuestList.jsx
- [ ] GuestForm.jsx
- [ ] GuestFilters.jsx
- [ ] GuestStats.jsx
- [ ] ImportGuests.jsx
- [ ] GuestCard.jsx
- [ ] GuestEventBridge.js

##### Finanzas (src/components/finance/) - 31 componentes
- [ ] BudgetSummary.jsx
- [ ] TransactionList.jsx
- [ ] CategoryManager.jsx
- [ ] PaymentTracker.jsx
- [ ] InvoiceGenerator.jsx
- [ ] BudgetChart.jsx
- [ ] ExpenseBreakdown.jsx
- [ ] ... (24 más)

##### Tareas (src/components/tasks/) - 22 componentes
- [ ] TasksRefactored.jsx (IMPORTANTE - tiene muchos strings)
- [ ] TaskList.jsx
- [ ] TaskItem.jsx
- [ ] TaskCalendar.jsx
- [ ] GanttChart.jsx
- [ ] TaskFilters.jsx
- [ ] ... (16 más)

##### Proveedores (src/components/proveedores/) - 42 componentes
- [ ] ProviderCard.jsx
- [ ] ProviderList.jsx
- [ ] BudgetComparison.jsx
- [ ] ContractManager.jsx
- [ ] ShortlistBoard.jsx
- [ ] SupplierSearch.jsx
- [ ] ... (36 más)

##### Seating (src/components/seating/) - 48 componentes
- [ ] SeatingPlanRefactored.jsx
- [ ] SeatingCanvas.jsx
- [ ] SeatingToolbar.jsx
- [ ] TableManager.jsx
- [ ] GuestAssignment.jsx
- [ ] SeatingTemplates.jsx
- [ ] ... (42 más)

##### Email (src/components/email/) - 47 componentes
- [ ] EmailComposer.jsx
- [ ] EmailList.jsx
- [ ] EmailViewer.jsx
- [ ] TemplateEditor.jsx
- [ ] AttachmentManager.jsx
- [ ] EmailFilters.jsx
- [ ] ... (41 más)

##### Admin (src/pages/admin/ + components/admin/) - 17 componentes
- [ ] AdminLogin.jsx
- [ ] AdminDashboard.jsx
- [ ] AdminUsers.jsx
- [ ] AdminMetrics.jsx
- [ ] AdminSupport.jsx
- [ ] MetricsDashboard.jsx
- [ ] ... (11 más)

##### Otros Componentes
- [ ] Weddings (~10 componentes)
- [ ] Settings (~8 componentes)
- [ ] Auth (~5 componentes)
- [ ] Dashboard (~6 componentes)
- [ ] Onboarding (~2 componentes)

---

### FASE 4: Servicios y Utils (129 archivos)
Estimado: ~70 horas

#### Servicios con Mensajes de Usuario (ALTA prioridad)
- [ ] `src/services/authService.js` - Mensajes de error auth
- [ ] `src/services/emailService.js` - Textos de email
- [ ] `src/services/notificationService.js` - Notificaciones
- [ ] `src/services/validationService.js` - Mensajes de validación
- [ ] `src/services/WeddingService.js` - Mensajes del sistema
- [ ] `src/services/GuestService.js` - Mensajes de invitados
- [ ] `src/services/FinanceService.js` - Mensajes de finanzas

#### Utils con Strings (MEDIA prioridad)
- [ ] `src/utils/validationUtils.js` - Mensajes de error
- [ ] `src/utils/formatUtils.js` - Formatos de fecha/moneda
- [ ] `src/utils/errorLogger.js` - Mensajes de error
- [ ] `src/utils/notificationUtils.js`

#### Servicios Solo Logs (BAJA prioridad)
- apiClient.js - Solo logs internos
- diagnosticService.js - Solo debugging
- PerformanceMonitor.js - Métricas

---

### FASE 5: Data y Templates (11 archivos)
Estimado: ~7 horas

#### Templates
- [ ] `src/data/templates/contractTemplates.js` (~30 templates)
- [ ] `src/data/templates/generalTemplates.js`
- [ ] `src/data/templates/proveedorTemplates.js`
- [ ] `src/data/templates/invitadosTemplates.js`
- [ ] `src/data/templates/seguimientoTemplates.js`
- [ ] `src/data/invitationTemplates.js`

#### Data Estática
- [ ] `src/data/musicInspiration.js`
- [ ] `src/data/venueTemplates.js`
- [ ] `src/config/eventStyles.js` (ya restaurado)

---

### FASE 6: Testing y Validación
Estimado: ~8 horas

- [ ] Ejecutar `npm run lint` completo
- [ ] Ejecutar script de detección de strings hardcodeados
- [ ] Verificar 0 strings sin traducir
- [ ] Probar todas las páginas en ES/EN/FR
- [ ] Verificar formularios y validaciones
- [ ] Tests E2E en múltiples idiomas
- [ ] Búsqueda de mojibake residual
- [ ] Validar UTF-8 en todos los JSON

---

### FASE 7: Optimización y Deploy
Estimado: ~4 horas

- [ ] Lazy loading de traducciones por namespace
- [ ] Detectar claves duplicadas
- [ ] Consolidar traducciones similares
- [ ] Revisar calidad EN/FR (contratar traductor)
- [ ] Eliminar archivos `.bak`
- [ ] Actualizar documentación
- [ ] Deploy a staging
- [ ] Deploy a producción

---

## 📊 Resumen Numérico

| Categoría | Total | Migrado | Pendiente | % Completado |
|-----------|-------|---------|-----------|--------------|
| **UI Core** | 13 | 4 | 0* | 100% |
| **Páginas** | 12 | 3 | 9 | 25% |
| **Componentes Dominio** | 198 | 0 | 198 | 0% |
| **Servicios/Utils** | 129 | 0 | 129 | 0% |
| **Data/Templates** | 11 | 0 | 11 | 0% |
| **Otros** | 301 | 4 | 297 | 1.3% |
| **TOTAL** | **664** | **11** | **653** | **1.7%** |

\* 9 componentes UI sin strings no requieren migración

---

## 🔑 Claves i18n por Namespace (Existentes)

### Namespaces Principales
- **common** - ~2600 claves (mezcla de legado y nuevas)
- **auth** - 23 claves legacy
- **marketing** - Claves del layout
- **navigation** - Claves de navegación

### Claves Añadidas Esta Sesión
- **authResetPassword** - 7 claves
- **notificationPreferences** - 16 claves
- **notifications** - 13 claves

### Namespaces a Crear/Expandir
- **weddings** - Para módulo de bodas
- **guests** - Para módulo de invitados
- **finance** - Ya existe parcialmente
- **tasks** - Para módulo de tareas
- **providers** - Para proveedores
- **seating** - Para plan de asientos
- **email** - Para módulo de email
- **admin** - Para panel admin

---

## ⚠️ Archivos Problemáticos Identificados

### Con Encoding Issues (Mojibake)
- [x] ~~common.json (ES)~~ - Corregido parcialmente
- [ ] Revisar todos los .json para mojibake residual

### Con Código Corrupto Previo
- [x] ~~eventStyles.js~~ - Restaurado
- [x] ~~ShortlistBoard.jsx~~ - Corregido
- [x] ~~MomentosPublic.jsx~~ - Corregido

### Con Hooks Deshabilitados
- [ ] Invitados.jsx - Requiere atención especial (hooks mock)

---

## 📈 Estimaciones de Tiempo

### Por Fase (Tiempo restante)
- **FASE 2 restante**: ~10-15 horas (9 páginas)
- **FASE 3**: ~115 horas (198 componentes)
- **FASE 4**: ~70 horas (129 archivos)
- **FASE 5**: ~7 horas (11 archivos)
- **FASE 6**: ~8 horas (testing)
- **FASE 7**: ~4 horas (deploy)

**TOTAL RESTANTE: ~214 horas (~27 días laborables)**

### Por Ritmo de Trabajo

#### Full-time (8h/día)
- **Duración**: 27 días (~5.5 semanas)
- **Riesgo**: Bajo
- **Calidad**: Alta

#### Part-time (4h/día)
- **Duración**: 54 días (~11 semanas)
- **Riesgo**: Medio
- **Calidad**: Alta

#### Sprint Intensivo (Equipo de 3)
- **Duración**: 9 días (~2 semanas)
- **Riesgo**: Alto (calidad)
- **Calidad**: Requiere QA exhaustivo

---

## 🎯 Prioridades Recomendadas

### Semana 1-2: Páginas Críticas
1. Completar FASE 2 (9 páginas restantes)
2. Enfoque en páginas simples primero
3. Dejar complejas (Bodas, Finance) para después

### Semana 3-4: Componentes Core
1. Módulo de Invitados (8 componentes)
2. Módulo de Tareas (22 componentes)
3. Componentes de configuración

### Semana 5-6: Módulos Grandes
1. Finanzas (31 componentes)
2. Proveedores (42 componentes)
3. Seating (48 componentes)

### Semana 7-8: Email y Admin
1. Email (47 componentes)
2. Admin (17 componentes)
3. Servicios críticos

### Semana 9: Testing y QA
1. Tests completos
2. Corrección de bugs
3. Revisión de traducciones

### Semana 10: Deploy
1. Optimizaciones
2. Staging
3. Producción

---

## 📝 Notas Importantes

### Patrones Establecidos
✅ Usar `useTranslations()` como estándar
✅ Organizar claves por namespace
✅ Validar con lint después de cada archivo
✅ Commit cada 1-3 archivos
✅ Evitar mojibake con UTF-8

### Evitar
❌ Scripts automáticos masivos (generan corrupción)
❌ Modificar múltiples archivos sin validar
❌ Commits muy grandes (dificulta rollback)
❌ Hardcodear strings en español
❌ Duplicar claves innecesariamente

### Decisiones Técnicas
- **Namespace strategy**: Por módulo funcional
- **Key naming**: camelCase anidado
- **Fallback**: Siempre español
- **Pluralización**: Sintaxis i18next estándar
- **Interpolación**: Variables con `{{variable}}`

---

## 🔄 Próxima Sesión

### Objetivos Inmediatos
1. Completar 3-4 páginas más de FASE 2
2. Llegar al 50% de páginas principales
3. ~1.5-2 horas de trabajo

### Páginas Sugeridas (orden)
1. Dashboard.jsx (simple)
2. Tasks.jsx (wrapper simple)
3. Checklist.jsx (media)
4. Perfil.jsx (si está parcialmente traducido)

---

**Autor:** Cascade AI  
**Fecha:** 27 Oct 2025  
**Versión:** 1.0
