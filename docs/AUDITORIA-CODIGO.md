# 🔍 Auditoría de Código - Estado Real vs Workflow

**Fecha:** Diciembre 2024  
**Objetivo:** Mapear código existente vs WORKFLOW-USUARIO.md antes de implementar nuevas features

---

## 📊 Resumen Ejecutivo

**Código base analizado:**
- 329 TODOs/FIXMEs en 170 archivos
- 65 páginas principales identificadas
- ~50% del workflow tiene código parcial o completo

**Hallazgos clave:**
- ✅ Buena base en gestión de invitados, finanzas, proveedores
- ⚠️ Mucho código "parcialmente implementado" sin terminar
- 🔴 Features críticas NO implementadas (cuestionario inicial, shot list, pruebas)
- ♻️ Componentes reutilizables identificados para nuevas features

---

## 🎯 Estado de Implementación por Fase del Workflow

### FASE 0: Pre-Planificación (0% implementado)

#### 0.1 Cuestionario Inicial de Visión
**Estado:** ❌ NO EXISTE

**Componentes buscados:**
- Wizard/cuestionario: NO encontrado
- Onboarding inicial: Existe `OnboardingTutorial.jsx` pero es tutorial de UI, no cuestionario

**Archivos relacionados:**
- `src/components/Onboarding/OnboardingTutorial.jsx` (tutorial UI, no cuestionario)
- `src/pages/CreateWeddingAI.jsx` (creación con IA, no cuestionario guiado)
- `src/pages/CreateWeddingAssistant.jsx` (asistente conversacional, podría adaptarse)

**Análisis:**
- `CreateWeddingAssistant.jsx` existe y usa conversación IA
- Podría ser base para cuestionario inicial
- Necesita expansión para capturar: tipo boda, presupuesto, tiempo disponible, prioridades

**Componentes reutilizables:**
- ✅ `CreateWeddingAssistant.jsx` - Base conversacional
- ✅ `src/context/WeddingContext.jsx` - Gestión estado boda
- ✅ Servicios IA existentes

**Esfuerzo estimado:** Medio (40% código base existe)

---

#### 0.2 Generación de Timeline Personalizado
**Estado:** ❌ NO EXISTE

**Componentes buscados:**
- Timeline generator: NO encontrado
- Calendario personalizado: NO encontrado

**Archivos relacionados:**
- `src/components/tasks/EventsCalendar.jsx` - Calendario de eventos (reutilizable)
- `src/components/tasks/LongTermTasksGantt.jsx` - Gantt de tareas (reutilizable)
- `apps/main-app/src/data/tasks/masterTimelineTemplate.json` - Template maestro (¡EXISTE!)

**Análisis:**
- Template de timeline maestro ya existe
- Faltan: generador automático basado en meses disponibles, alertas "última llamada"

**Componentes reutilizables:**
- ✅ `masterTimelineTemplate.json` - Base de datos de tareas
- ✅ `LongTermTasksGantt.jsx` - Visualización timeline
- ✅ `EventsCalendar.jsx` - Calendario

**Esfuerzo estimado:** Bajo-Medio (60% código base existe)

---

### FASE 1: Planificación Inicial (70% implementado)

#### 1.1 Lista Preliminar de Invitados
**Estado:** ✅ IMPLEMENTADO

**Archivos principales:**
- `src/pages/Invitados.jsx` (59 KB - completo)
- Gestión completa de invitados con grupos, categorías, importación

#### 1.2 Definir Presupuesto
**Estado:** ✅ IMPLEMENTADO

**Archivos principales:**
- `src/pages/Finance.jsx` (11 KB)
- `src/components/finance/*` (múltiples componentes)
- Sistema de presupuesto por categorías funcional

#### 1.3 Diseñar la Boda
**Estado:** ⚠️ PARCIAL (30%)

**Archivos relacionados:**
- `src/pages/InfoBoda.jsx` - **EXISTE** con campos:
  ```javascript
  weddingStyle: '',
  colorScheme: '',
  numGuests: '',
  dressCode: '',
  dressCodeDetails: '',
  ```

**Análisis:**
- Formulario básico existe pero NO es wizard guiado
- Faltan: quiz de estilo, generador de paletas, mood board, integración Pinterest

**Componentes reutilizables:**
- ✅ `InfoBoda.jsx` - Formulario base
- ✅ `src/config/eventStyles.js` - Catálogo de estilos
- ⚠️ Falta wizard interactivo completo

**TODOs encontrados en InfoBoda.jsx:** Ninguno específico

**Esfuerzo estimado:** Alto (solo 30% existe, necesita wizard completo)

---

### FASE 2: Búsqueda y Contratación (80% implementado)

#### 2.1-2.5 Proveedores
**Estado:** ✅ IMPLEMENTADO

**Archivos principales:**
- `src/pages/ProveedoresNuevo.jsx` (32 KB)
- `src/components/suppliers/*` (múltiples)
- Sistema de búsqueda con IA, favoritos, comparador

**TODOs encontrados:** 3 TODOs en `QuoteRequestsTracker.jsx`

#### 2.6 Pruebas y Ensayos
**Estado:** ❌ NO EXISTE

**Componentes buscados:**
- Calendario de pruebas: NO encontrado
- Gestión de citas: NO encontrado

**Archivos relacionados:**
- `src/components/tasks/EventsCalendar.jsx` - Calendario general (reutilizable)
- `src/components/protocol/MasterChecklist.jsx` - Checklist maestro (reutilizable)

**Análisis:**
- NO existe módulo dedicado a pruebas/ensayos
- Calendario de eventos podría adaptarse
- Necesita: tipo de prueba, recordatorios, notas, fotos de referencia

**Componentes reutilizables:**
- ✅ `EventsCalendar.jsx` - Base de calendario
- ✅ `MasterChecklist.jsx` - Sistema de checklist
- ✅ Servicio de notificaciones existente

**Esfuerzo estimado:** Medio (40% reutilizable)

---

### FASE 3: Diseño de Experiencia (60% implementado)

#### 3.0 Wedding Team y Colaboración
**Estado:** ⚠️ BÁSICO (20%)

**Archivos relacionados:**
- `src/components/settings/WeddingAccountLink.jsx` - Invitaciones a equipo
- `src/hooks/useAuth.jsx` - Sistema de roles (owner, planner, assistant)

**Análisis:**
- Roles básicos existen
- Falta: asignación de tareas específicas, permisos granulares, comentarios

**TODOs encontrados:** Múltiples relacionados con colaboración en seating

**Esfuerzo estimado:** Medio-Alto (solo 20% existe)

---

#### 3.1 Momentos Especiales
**Estado:** ✅ IMPLEMENTADO (70%)

**Archivos principales:**
- `src/pages/Momentos.jsx` (13 KB)
- `src/components/momentos/*` (múltiples)
- Integración Spotify funcional

**TODOs encontrados:** 2 en Momentos.jsx

---

#### 3.1.5 Shot List Fotográfico
**Estado:** ❌ NO EXISTE

**Componentes buscados:**
- Shot list generator: NO encontrado
- Photo checklist: NO encontrado

**Archivos relacionados:** Ninguno relevante

**Análisis:**
- Feature completamente nueva, sin código base
- Necesita: lista de fotos obligatorias, combinaciones personas, ubicaciones

**Componentes reutilizables:**
- ✅ `MasterChecklist.jsx` - Sistema de checklist base
- ✅ Sistema de categorías (invitados, momentos)

**Esfuerzo estimado:** Bajo-Medio (feature acotada, 0% existe pero reutilizable)

---

#### 3.2 Diseño de Elementos Personalizados
**Estado:** ✅ IMPLEMENTADO (60%)

**Archivos principales:**
- `src/pages/InvitationDesigner.jsx` - Diseñador de invitaciones
- `src/pages/DisenoWeb.jsx` (88 KB - muy completo)
- `src/pages/WebBuilderPageCraft.jsx` - Web builder con CraftJS
- `src/components/web/craft/*` - Múltiples secciones

**Análisis:**
- Web builder muy completo con CraftJS
- Diseñador de invitaciones existe
- Faltan mejoras en UX y plantillas

---

### FASE 4: Trámites Legales (0% implementado)

**Estado:** ❌ NO EXISTE (como módulo completo)

**Archivos relacionados:**
- `src/pages/DocumentosLegales.jsx` - Generador básico de consentimientos
- `src/pages/protocolo/DocumentosLegales.jsx` - Duplicado

**Análisis:**
- Solo genera PDFs de consentimiento de imagen
- NO hay checklist por país, recordatorios, almacenamiento

**Esfuerzo estimado:** Alto (feature nueva compleja)

---

### FASE 5: Confirmaciones Finales (85% implementado)

#### 5.1 RSVP y Confirmaciones
**Estado:** ✅ IMPLEMENTADO

**Archivos principales:**
- `src/pages/RSVPDashboard.jsx` (19 KB)
- `src/pages/PublicRSVP.jsx` (23 KB)
- Sistema completo de confirmaciones

#### 5.2 Seating Plan
**Estado:** ✅ IMPLEMENTADO

**Archivos principales:**
- `src/pages/SeatingPlan.jsx`
- `src/components/seating/*` (múltiples componentes)

**TODOs encontrados:** 10 en SeatingPlanModern.jsx

#### 5.3 Regalos y Lista de Deseos
**Estado:** ⚠️ BÁSICO (25%)

**Archivos relacionados:**
- `src/components/web/sections/GiftListSection/GiftListSection.jsx` (25 menciones)
- `src/components/web/craft/CraftGiftRegistrySection.jsx` (21 menciones)
- `src/components/finance/ContributionSettings.jsx` (22 menciones)

**Análisis:**
- Existe sección de lista de regalos en web builder
- Es para mostrar en la web, NO para gestión interna
- Faltan: gestión de regalos recibidos, tracking, multi-tienda, agradecimientos

**Componentes reutilizables:**
- ⚠️ `GiftListSection.jsx` - Solo visualización web
- ✅ Sistema de finanzas para tracking
- ✅ Sistema de emails para agradecimientos

**Esfuerzo estimado:** Alto (solo 25% existe, necesita módulo completo)

---

#### 5.4 Invitados Especiales y Accesibilidad
**Estado:** ⚠️ BÁSICO (10%)

**Análisis:**
- Existe tracking de alergias en invitados
- NO existe gestión de accesibilidad, necesidades médicas

**Esfuerzo estimado:** Medio

---

### FASE 6: Pre-Boda (10% implementado)

#### 6.1 Llevar Todo a la Locación
**Estado:** ❌ NO EXISTE

**Esfuerzo estimado:** Medio

---

#### 6.2 Transporte y Logística
**Estado:** ⚠️ BÁSICO (20%)

**Archivos relacionados:**
- `src/pages/InfoBoda.jsx` - Campos básicos:
  ```javascript
  transportation: '',
  busInfo: '',
  hotelInfo: '',
  ```
- `src/components/web/craft/CraftTravelInfoSection.jsx` - Sección web de info viaje

**Análisis:**
- Campos básicos de texto para mostrar en web
- NO hay gestión completa: mapas, coordinación llegadas, bloques hoteles

**Componentes reutilizables:**
- ⚠️ Campos básicos en InfoBoda
- ✅ CraftTravelInfoSection para mostrar info

**Esfuerzo estimado:** Alto (solo 20% existe, feature compleja)

---

#### 6.3 Eventos Múltiples
**Estado:** ❌ NO EXISTE

**Esfuerzo estimado:** Medio-Alto

---

#### 6.4 Gestión de Niños
**Estado:** ❌ NO EXISTE

**Análisis:**
- NO hay tracking de invitados con niños
- NO hay menús infantiles dedicados

**Esfuerzo estimado:** Medio

---

### FASE 7: Día de la Boda (50% implementado)

#### 7.1 Checklist del Día
**Estado:** ⚠️ PARCIAL (40%)

**Archivos relacionados:**
- `src/components/protocol/MasterChecklist.jsx`
- `src/pages/protocolo/Checklist.jsx`

**Esfuerzo estimado:** Medio (ampliar existente)

---

#### 7.2 Timeline/Protocolo
**Estado:** ✅ IMPLEMENTADO (70%)

**Archivos principales:**
- `src/pages/Protocolo.jsx`
- `src/components/protocol/CeremonyProtocol.jsx` (9 TODOs)
- `src/components/protocolo/CeremonyTimeline.jsx`

**TODOs encontrados:** 9 en CeremonyProtocol.jsx

---

#### 7.3 Álbum Colaborativo en Vivo
**Estado:** ✅ IMPLEMENTADO (70%)

**Archivos principales:**
- `src/pages/Momentos.jsx` (50 referencias a "album/colaborat/slideshow")
- `src/pages/MomentosPublic.jsx` (17 referencias)
- `src/pages/MomentosGuest.jsx` (14 referencias)
- `src/components/momentos/LiveSlideshow.jsx` - **EXISTE**
- `src/components/momentos/UploadWidget.jsx` - Upload desde móvil
- `src/components/momentos/MediaGallery.jsx` - Galería
- `src/components/momentos/ModerationBoard.jsx` - Moderación

**Análisis:**
- **Sistema casi completo ya implementado**
- Existe: upload, slideshow, moderación, galería
- Faltan: QR para invitados (probablemente fácil de añadir), mejoras UX

**TODOs encontrados:** 2 en Momentos.jsx

**Componentes reutilizables:**
- ✅ `LiveSlideshow.jsx` - Ya funcional
- ✅ `UploadWidget.jsx` - Ya funcional
- ✅ `MediaGallery.jsx` - Ya funcional
- ✅ `ModerationBoard.jsx` - Ya funcional

**Esfuerzo estimado:** Bajo (70% existe, solo pulir y añadir QR)

---

### FASE 8: Post-Boda (0% implementado)

**Estado:** ❌ NO EXISTE

**Esfuerzo estimado:** Medio-Alto

---

## 🔧 Componentes Reutilizables Identificados

### Alta Reutilización (70-100%)

1. **Sistema de Calendario**
   - `EventsCalendar.jsx` - Para pruebas, eventos múltiples
   - `LongTermTasksGantt.jsx` - Para timeline personalizado

2. **Sistema de Checklist**
   - `MasterChecklist.jsx` - Para shot list, checklist día, trámites

3. **Sistema de Invitados**
   - Categorización, grupos - Reutilizable para niños, accesibilidad

4. **Sistema de Finanzas**
   - Tracking - Reutilizable para regalos

5. **Sistema de Emails**
   - Plantillas - Reutilizable para agradecimientos

6. **Álbum Colaborativo (Momentos)**
   - ✅ 70% completo, mínimas mejoras necesarias

### Media Reutilización (40-70%)

7. **CreateWeddingAssistant.jsx**
   - Base conversacional - Adaptable para cuestionario inicial

8. **InfoBoda.jsx**
   - Formulario base - Expandible para wizard diseño

9. **WeddingContext**
   - Gestión estado - Reutilizable en todas las features

### Baja Reutilización (0-40%)

10. **GiftListSection**
    - Solo visualización web - Necesita módulo gestión completo

11. **CraftTravelInfoSection**
    - Solo info estática - Necesita gestión logística completa

---

## 📈 Análisis de TODOs/FIXMEs

**Total encontrados:** 329 en 170 archivos

**Top archivos con más TODOs:**
1. `SeatingPlanModern.jsx` - 10 TODOs
2. `CeremonyProtocol.jsx` - 9 TODOs
3. `ForPlanners.jsx` (marketing) - 9 TODOs

**Categorías principales de TODOs:**
- Refactorización pendiente
- Features incompletas
- Optimizaciones de rendimiento
- Mejoras de UX
- Integraciones pendientes

**Archivos críticos con TODOs:**
- `src/components/seating/*` - Múltiples (sistema complejo)
- `src/components/protocol/*` - Varios (área en desarrollo)
- `src/pages/marketing/*` - Varios (menos crítico)

---

## 🎯 Priorización de Implementación

### Quick Wins (Esfuerzo Bajo, Alto Impacto)

1. **FASE 0.2: Timeline Personalizado**
   - 60% código existe (`masterTimelineTemplate.json`, `Gantt`)
   - Solo necesita: generador automático + alertas
   - Esfuerzo: 3-5 días

2. **FASE 3.1.5: Shot List Fotográfico**
   - 0% existe pero muy acotado
   - Reutiliza: `MasterChecklist.jsx`, sistema categorías
   - Esfuerzo: 3-5 días

3. **FASE 7.3: Álbum Colaborativo - Mejoras**
   - 70% existe y funcional
   - Solo falta: QR invitados, pulir UX
   - Esfuerzo: 2-3 días

### Esfuerzo Medio, Alto Impacto

4. **FASE 0.1: Cuestionario Inicial**
   - 40% existe (`CreateWeddingAssistant.jsx`)
   - Necesita: expansión de preguntas, integración
   - Esfuerzo: 5-7 días

5. **FASE 2.6: Pruebas y Ensayos**
   - 40% reutilizable (`EventsCalendar`, `MasterChecklist`)
   - Necesita: módulo dedicado, recordatorios
   - Esfuerzo: 5-8 días

### Esfuerzo Alto, Alto Impacto

6. **FASE 1.3: Wizard de Diseño Completo**
   - 30% existe (`InfoBoda.jsx`, `eventStyles.js`)
   - Necesita: wizard interactivo, paletas, mood board
   - Esfuerzo: 10-12 días

7. **FASE 5.3: Regalos y Lista de Deseos**
   - 25% existe (solo visualización)
   - Necesita: módulo gestión completo, multi-tienda
   - Esfuerzo: 10-15 días

8. **FASE 6.2: Transporte y Logística**
   - 20% existe (campos básicos)
   - Necesita: mapas, coordinación, bloques hoteles
   - Esfuerzo: 12-15 días

---

## 🚨 Problemas Críticos Detectados

### 1. Código Duplicado
- `DocumentosLegales.jsx` existe en 2 ubicaciones
- Múltiples componentes de seating (Modern vs Refactored)

### 2. Features Incompletas (con TODOs)
- SeatingPlan tiene 10+ TODOs pendientes
- CeremonyProtocol tiene 9 TODOs pendientes
- Sistema complejo pero inacabado

### 3. Falta de Consistencia
- Algunos módulos muy pulidos (Finance, Web Builder)
- Otros muy básicos o inexistentes (Trámites, Post-boda)

### 4. Deuda Técnica
- 329 TODOs pendientes
- Componentes legacy sin refactorizar
- Código comentado sin limpiar

---

## 📋 Recomendaciones

### Inmediatas (Esta semana)

1. **Limpiar TODOs críticos**
   - Priorizar 10 TODOs en SeatingPlan
   - Resolver 9 TODOs en CeremonyProtocol

2. **Eliminar duplicados**
   - Consolidar `DocumentosLegales.jsx`
   - Decidir entre SeatingPlan Modern/Refactored

### Corto Plazo (Q1 2025)

3. **Implementar Quick Wins**
   - Timeline Personalizado (usar template existente)
   - Shot List (nuevo pero simple)
   - Mejorar Álbum Colaborativo (casi listo)

4. **Completar features parciales**
   - Wizard Diseño (expandir InfoBoda)
   - Pruebas y Ensayos (nuevo módulo)

### Medio Plazo (Q2 2025)

5. **Features complejas**
   - Regalos completo (nuevo módulo)
   - Transporte completo (nuevo módulo)
   - Wedding Team (expandir existente)

---

## 📊 Métricas de Código

> Nota: este informe cuenta TODOs/FIXMEs en el código fuente (scope amplio) y puede no coincidir con `docs/AUDITORIA-PROYECTO.md`, que resume otros criterios y puede estar generado en otra fecha.

| Métrica | Valor | Estado |
|---------|-------|--------|
| Páginas principales | 65 | ✅ |
| TODOs/FIXMEs | 329 | ⚠️ Alto |
| Features completas | ~25 | 🟢 |
| Features parciales | ~15 | 🟡 |
| Features no iniciadas | ~18 | 🔴 |
| Código reutilizable | ~40% | ✅ |
| Deuda técnica | Media-Alta | ⚠️ |

---

## ✅ Conclusiones

### Fortalezas
- ✅ Buena base en módulos core (Invitados, Finance, Proveedores)
- ✅ Web Builder muy completo
- ✅ Álbum Colaborativo 70% funcional
- ✅ Componentes reutilizables identificados

### Debilidades
- ⚠️ Mucho código parcial sin terminar (329 TODOs)
- 🔴 Features críticas del workflow no implementadas
- 🔴 Inconsistencia entre módulos
- ⚠️ Deuda técnica acumulada

### Oportunidades
- 🎯 Quick wins identificados (Timeline, Shot List, Álbum)
- ♻️ Alto porcentaje de código reutilizable (40%)
- 📦 Componentes base sólidos para expandir

### Riesgos
- ⚠️ Complejidad creciente sin refactorización
- 🔴 TODOs pueden convertirse en bugs
- ⚠️ Código duplicado puede causar inconsistencias

---

## 🚀 Plan de Acción Recomendado

### Sprint 1 (Semana 1-2)
1. Limpiar 20 TODOs críticos más urgentes
2. Implementar Timeline Personalizado (Quick Win)
3. Implementar Shot List Fotográfico (Quick Win)

### Sprint 2 (Semana 3-4)
4. Mejorar Álbum Colaborativo (añadir QR)
5. Comenzar Cuestionario Inicial (FASE 0.1)

### Sprint 3 (Semana 5-6)
6. Completar Cuestionario Inicial
7. Implementar Pruebas y Ensayos

**Objetivo Q1:** 7 features de alta prioridad implementadas + deuda técnica reducida

---

**Siguiente paso sugerido:** Comenzar con Timeline Personalizado (Quick Win, 60% código existe)
