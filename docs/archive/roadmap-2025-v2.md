# Roadmap Estratégico MaLoveApp - 2025 v2

> ⚠️ **Documento congelado (snapshot 2025-10-09).** Usa [`docs/ROADMAP.md`](./ROADMAP.md) para el estado y los planes vigentes.


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

#### 2. **Timeline y Gestión de Tareas** ⚠ **60% IMPLEMENTADO**
**Estado**: Módulo de tareas refactorizado en producción; cronograma requiere estabilización
- ✅ **Completado**: TasksRefactored.jsx con Gantt, subtareas y sincronización Firestore/GCal básica
- ⚠ **En curso**: Rehacer `Timing.jsx` (estado roto actualmente) y automatizar cronogramas con IA
- ⚠ **Pendiente**: Recordatorios avanzados y vínculos directos con proveedores
- **Tiempo estimado**: 3-4 semanas (incluye refactor de Timing)

#### 3. **Sistema de Invitaciones Digitales** ⚠ **50% IMPLEMENTADO**
**Estado**: Diseñador y flujo IA operativos; falta robustez en plantillas y delivery
- ✅ **Completado**: Páginas principales (Invitaciones.jsx, InvitationDesigner.jsx) con generación IA y recordatorios RSVP
- ⚠ **En curso**: Persistencia/versionado de diseños y plantillas responsive multi-dispositivo
- ❌ **Pendiente**: Pipeline de envío masivo desacoplado del cliente (actualmente requiere `VITE_OPENAI_API_KEY`)
- **Tiempo estimado**: 4-5 semanas

### 🚀 **MEDIA PRIORIDAD (3-6 meses)**

#### 4. **Sistema de Emails con IA** ⚠ **80% IMPLEMENTADO**
**Estado**: Buzón unificado y análisis IA funcionales; faltan métricas y endurecer backends
- ✅ **Completado**: UnifiedEmail.jsx con carpetas, tracking y EmailInsights (OpenAI + heurísticas)
- ✅ **Completado**: Endpoints `/api/email-insights` con fallback y extracción de adjuntos
- ⚠ **En curso**: Métricas/observabilidad y pruebas de regresión de pipelines IA
- **Tiempo estimado**: 2-3 semanas

#### 5. **Sistema de Contratos y Pagos** ⚠ **40% IMPLEMENTADO**
**Estado**: CRUD de contratos y plantillas listo; integración de cobros depende de Stripe
- ✅ **Completado**: Gestión de contratos (Contratos.jsx + almacenamiento Firestore/local)
- ⚠ **En curso**: Sincronización real con proveedores y pagos ligados a contratos
- ❌ **Pendiente**: Activar cobros Stripe (`/api/payments`) y reconciliación de facturas
- **Tiempo estimado**: 5-6 semanas (requiere credenciales Stripe + pruebas)

#### 6. **Sistema de Diseño Web con IA** ⚠ **70% IMPLEMENTADO**
**Estado**: Generación IA vía backend lista; falta cerrar ciclo de publicación y QA
- ✅ **Completado**: DisenoWeb.jsx con prompts dinámicos y requestWebsiteAiHtml -> `/api/ai-website`
- ✅ **Completado**: Editor/Galería manual y post-procesado HTML
- ⚠ **En curso**: Guardado de versiones y pruebas end-to-end de publicación/rollbacks
- **Tiempo estimado**: 2-3 semanas

#### 7. **Internacionalización (i18n)** ⚠ **40% IMPLEMENTADO**
**Estado**: Infraestructura lista; vistas clave siguen con textos duros en español
- ✅ **Completado**: Hook `useTranslations`, recursos `es/en/fr`, helpers de formato
- ⚠ **En curso**: Migrar pantallas core (Proveedores, Invitaciones, Dashboard, Settings) a `t()`
- ❌ **Pendiente**: Auditoría/UI QA multilenguaje + políticas de fallback en runtime
- **Tiempo estimado**: 3-4 semanas (en paralelo con QA)

### 📱 **BAJA PRIORIDAD (6+ meses)**

#### 8. **Sistema de Notificaciones push Avanzado** ⚠ **50% IMPLEMENTADO**
**Estado**: Centro in-app sólido; canal push aún experimental
- ✅ **Completado**: NotificationCenter.jsx, NotificationSettings y SW con handlers push
- ⚠ **En curso**: Gestión de suscripciones con VAPID dev + sincronización preferencia/usuario (`/api/push`)
- ❌ **Pendiente**: Entregas push en producción (Stripe-like approval), métricas y digest configurables
- **Tiempo estimado**: 4-5 semanas

#### 9. **IA y Automatización Avanzada** ⚠ **35% IMPLEMENTADO**
**Estado**: Casos IA dispersos; falta orquestación y analítica global
- ✅ **Completado**: Seating auto-assign, búsqueda IA proveedores, generador imágenes
- ⚠ **En curso**: EmailInsights + automatización presupuestos desde correo
- ❌ **Pendiente**: Asistente virtual contextual, scoring predictivo y playbooks multi-módulo
- **Tiempo estimado**: 12-15 semanas

#### 10. **Sistema de Colaboración y Dashboard avanzado** ❌ **15% IMPLEMENTADO**
**Estado**: Dashboard planner mínimo; no hay colaboración en tiempo real
- ✅ **Completado**: Roles/permissions y PlannerDashboard.jsx como placeholder
- ❌ **Pendiente**: Sesiones compartidas (WebSockets/WebRTC), edición simultánea y analíticas avanzadas
- ❌ **Pendiente**: Vistas comparativas multi-boda con datos en vivo
- **Tiempo estimado**: 15-18 semanas (tras estabilizar notificaciones/IA)

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

**Última actualización**: 2025-10-09  
**Próxima revisión**: 2025-11-15  
**Responsable**: Equipo de Desarrollo MaLoveApp  
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




