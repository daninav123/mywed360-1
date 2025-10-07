# Roadmap Estratégico MyWed360 - 2025 v2

## Estado Actual del Proyecto

✅ **Completado Recientemente:**
- ✅ **SeatingPlan completamente refactorizado** (1572 líneas → 7 componentes modulares + hook useSeatingPlan)
- ✅ **Finance completamente refactorizado** (571 líneas → 9 componentes modulares + hook useFinance)
- ✅ **Invitados completamente refactorizado** (597 líneas → 3 componentes modulares + hook useGuests)
- ✅ **Sistema de emails con análisis IA** (clasificación automática, extracción de datos)
- ✅ **Búsqueda global implementada** (GlobalSearch.jsx)
- ✅ **Centro de notificaciones implementado** (NotificationCenter.jsx)
- ✅ **Sistema de autenticación optimizado y unificado**
- ✅ **Sistema de roles completo** (Owner, Wedding Planner, Ayudante)
- ✅ **Documentación completa** (18 flujos específicos + planes de suscripción)
- ✅ **Tests unitarios y validación integral**

## Nuevo Roadmap - 10 Prioridades Estratégicas

### 🔥 **ALTA PRIORIDAD (1-3 meses)**

#### 1. **Sistema de Proveedores con IA** ✅ **85% IMPLEMENTADO**
**Estado**: Funcional con oportunidades de mejora (pagos/contratos externos)
- ✅ **Completado**: Páginas principales (Proveedores.jsx, GestionProveedores.jsx, ProveedoresNuevo.jsx)
- ✅ **Completado**: Búsqueda con IA (ProviderSearchModal.jsx, AISearchModal.jsx)
- ✅ **Completado**: Gestión de servicios y categorías
- **Pendiente**: Integración completa con sistema de pagos y contratos
- **Tiempo estimado**: 1-2 semanas

#### 2. **Timeline y Gestión de Tareas** ❌ **30% IMPLEMENTADO**
**Estado**: Estructura básica creada, necesita desarrollo
- ✅ **Completado**: Página básica (Tasks.jsx, Timing.jsx)
- ❌ **Pendiente**: Sistema completo de cronograma automático con IA
- ❌ **Pendiente**: Gestión avanzada de tareas y recordatorios
- ❌ **Pendiente**: Integración con calendario y proveedores
- **Tiempo estimado**: 3-4 semanas

#### 3. **Sistema de Invitaciones Digitales** ❌ **20% IMPLEMENTADO**
**Estado**: Componentes básicos creados, necesita desarrollo completo
- ✅ **Completado**: Páginas básicas (Invitaciones.jsx, InvitationDesigner.jsx)
- ❌ **Pendiente**: Sistema completo de diseño de invitaciones
- ❌ **Pendiente**: Envío masivo y gestión de RSVP
- ❌ **Pendiente**: Plantillas personalizables y responsive
- **Tiempo estimado**: 4-5 semanas

### 🚀 **MEDIA PRIORIDAD (3-6 meses)**

#### 4. **Sistema de Emails con IA** ✅ **90% DOCUMENTADO**
**Estado**: Completamente especificado, pendiente implementación
- ✅ **Completado**: Buzón completo (Buzon_fixed_complete.jsx)
- ✅ **Completado**: Servicios de email (EmailService.js)
- ✅ **Completado**: Especificación de análisis IA automático
- ✅ **Completado**: Plantillas para comunicación IA con proveedores
- **Pendiente**: Implementación de análisis IA y extracción de datos
- **Tiempo estimado**: 3-4 semanas

#### 5. **Sistema de Contratos y Pagos** ❌ **25% IMPLEMENTADO**
**Estado**: Estructura básica creada
- ✅ **Completado**: Página básica (Contratos.jsx)
- ❌ **Pendiente**: Sistema completo de gestión de contratos
- ❌ **Pendiente**: Integración con pasarelas de pago
- ❌ **Pendiente**: Seguimiento de pagos y facturas
- **Tiempo estimado**: 5-6 semanas

#### 6. **Sistema de Diseño Web con IA** ✅ **80% DOCUMENTADO**
**Estado**: Completamente rediseñado con generación automática
- ✅ **Completado**: Editor web básico (WebEditor.jsx, DisenoWeb.jsx)
- ✅ **Completado**: Páginas de diseño (disenos/ folder completo)
- ✅ **Completado**: Especificación de generación automática por prompts
- ✅ **Completado**: Sistema de 4 prompts editables con variables dinámicas
- **Pendiente**: Implementación de generador IA con OpenAI API
- **Tiempo estimado**: 2-3 semanas

#### 7. **Internacionalización (i18n)** ✅ **40% IMPLEMENTADO**
**Estado**: Estructura básica implementada
- ✅ **Completado**: Hook useTranslations.js implementado
- ✅ **Completado**: Archivos de traducción (es/en/fr) en i18n/locales/
- ✅ **Completado**: Integración básica en componentes principales
- **Pendiente**: Traducción completa de toda la interfaz
- **Tiempo estimado**: 3-4 semanas

### 📱 **BAJA PRIORIDAD (6+ meses)**

#### 8. **Sistema de Notificaciones push Avanzado** ✅ **50% IMPLEMENTADO**
**Estado**: Centro básico implementado, necesita expansión
- ✅ **Completado**: NotificationCenter.jsx funcional
- ✅ **Completado**: Estructura básica de notificaciones
- **Pendiente**: Notificaciones push reales y preferencias granulares
- **Tiempo estimado**: 4-5 semanas

#### 9. **IA y Automatización Avanzada** ✅ **35% IMPLEMENTADO**
**Estado**: Implementaciones parciales en múltiples módulos
- ✅ **Completado**: IA en SeatingPlan (asignación automática)
- ✅ **Completado**: IA en Proveedores (búsqueda inteligente)
- ✅ **Completado**: Generador de imágenes IA (ImageGeneratorAI.jsx)
- **Pendiente**: Asistente virtual completo y análisis predictivo
- **Tiempo estimado**: 12-15 semanas

#### 10. **Sistema de Colaboración y Dashboard avanzado** ❌ **15% IMPLEMENTADO**
**Estado**: Componentes básicos creados
- ✅ **Completado**: PlannerDashboard.jsx básico
- ✅ **Completado**: Estructura de permisos básica
- **Pendiente**: WebSockets, colaboración en tiempo real, analytics avanzados
- **Tiempo estimado**: 15-18 semanas

## Métricas de Éxito

### Técnicas
- **Performance**: Lighthouse score > 95
- **Bundle Size**: < 2MB inicial
- **Test Coverage**: > 90%
- **Error Rate**: < 0.1%

### Negocio
- **User Engagement**: +40%
- **Retention Rate**: +25%
- **Feature Adoption**: > 80%
- **Customer Satisfaction**: > 4.5/5

## Próximos Pasos Inmediatos

### Esta Semana
1. Implementar generador IA de sitios web con prompts editables
2. Desarrollar análisis automático de emails con IA
3. Completar sistema de roles técnico (Owner/Wedding Planner/Ayudante)
4. Proveedores: reflejar enlaces/estado de pagos/contratos externos (sin procesar pagos)

### Próximo Mes
1. Sistema de contratos y documentos completo
2. Checklist avanzado con automatización
3. Timeline automático con IA para tareas
4. RSVP inteligente con confirmaciones automáticas

### Próximo Trimestre
1. Sistema de Notificaciones push avanzado
2. IA y automatización completa
3. Colaboración en tiempo real y analytics

## Cierre de Gaps Transversales

- Cliente API unificado: migrar servicios restantes (email, inbox, AI, provider search) a `apiClient` con `Authorization` opcional (Sprint 2).
- WhatsApp provider: definir health real o fallback para `/api/whatsapp/provider-status` y añadir healthcheck (Sprint 1).
- CI/CD gates: Sprint 1 (unit rules + seating smoke + `roadmapOrder --check` en PR). Sprint 2 (añadir E2E email/budget en develop).
- A11y/i18n: auditoría y fixes en vistas core (Seating, Invitados, Tasks, Email) (Sprint 2).
- Performance/Observabilidad: Lighthouse CI, budget de bundle (<2MB), monitorización de errores (Sprint 2–4).
- Seating Auto‑IA: E2E específico con `VITE_ENABLE_AUTO_ASSIGN=true` y documentación (Sprint 1–2).
- Legal/compliance: plantillas por jurisdicción y evaluación firma electrónica (Sprint 4).

## Consideraciones Técnicas

### Deuda Técnica Identificada
- ✅ **RESUELTO**: Refactorización de componentes monolíticos completada
- ✅ **RESUELTO**: Hooks personalizados implementados (useFinance, useSeatingPlan, useGuests)
- ❌ **PENDIENTE**: Archivos `.bak` y código duplicado por limpiar
- ❌ **PENDIENTE**: Tests E2E estables
- ❌ **PENDIENTE**: Optimizaciones de bundle

### Arquitectura Futura
- Microservicios para funcionalidades complejas
- CDN para assets estáticos
- Cache distribuido para performance
- Monitoreo y observabilidad avanzados

---

**Última actualización**: 2025-08-26  
**Próxima revisión**: 2025-09-15  
**Responsable**: Equipo de Desarrollo MyWed360  
**Documentación**: 18 flujos específicos + sistema de roles técnico + planes de suscripción

## Plan de Sprints (8 semanas)

Notas:
- Duración: 4 sprints de 2 semanas.
- Objetivo: estabilizar core (Seating/RSVP/Tasks), luego IA/Contratos.
- E2E claves deben pasar en CI al final de cada sprint.

### Sprint 1 (Semanas 1–2) — Estabilización Core
- Seating Plan: hardening + E2E verdes (smoke, fit, toasts, assign/unassign, capacity/aisle, templates).
- Firestore Rules: “self‑planner” + invitaciones como subcolección + tests verdes.
- RSVP: by‑token (GET/PUT), generación `rsvp-link`, recordatorios básicos.
- Métricas: envío desde UI con `apiClient`.

Entregables:
- E2E seating: `seating_smoke`, `seating_fit`, `seating_toasts`, `seating_assign_unassign`, `seating_capacity_limit`, `seating_aisle_min`, `seating_template_*`.
- Unit rules: extended/exhaustive verdes.
- E2E RSVP: confirmación por token verde.

### Sprint 2 (Semanas 3–4) — Tareas/Notificaciones/Email
- Tasks/Checklist avanzado: dependencias, recordatorios, UX; ICS export estable.
- Notificaciones: CRUD estable con auth; hooks UI consolidados.
- Email: E2E enviar/leer/carpetas; plantillas base.

Entregables:
- E2E email: `send-email`, `read-email`, `folders-management`.
- Budget flow E2E básico.

### Sprint 3 (Semanas 5–6) — Diseño Web IA + Multi‑Bodas
- IA Diseño Web: pipeline básico de generación (prompts → preview), historial simple.
- Multi‑bodas: UX final, `BodaDetalle` desde Firestore (sin mocks).

Entregables:
- Generación básica funcionando en entorno dev.
- Navegación planner multi‑boda estable.

### Sprint 4 (Semanas 7–8) — Contratos/Docs + Gamificación + IA Asistente (proto)
- Contratos/Docs: plantillas y gestión documental; firma externa opcional (post‑MVP).
- Gamificación: puntos, hitos básicos vinculados a eventos.
- IA Asistente: prototipo contextual con prompts mínimos y guardrails.

Entregables:
- Contratos CRUD y templates operativos.
- Eventos de gamificación en Tasks/Timeline.
- Chat IA mínimo funcional.



