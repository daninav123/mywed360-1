# Roadmap EstratÃ©gico MyWed360 - 2025 v2

## Estado Actual del Proyecto

âœ… **Completado Recientemente:**
- âœ… **SeatingPlan completamente refactorizado** (1572 lÃ­neas â†’ 7 componentes modulares + hook useSeatingPlan)
- âœ… **Finance completamente refactorizado** (571 lÃ­neas â†’ 9 componentes modulares + hook useFinance)
- âœ… **Invitados completamente refactorizado** (597 lÃ­neas â†’ 3 componentes modulares + hook useGuests)
- âœ… **Sistema de emails con anÃ¡lisis IA** (clasificaciÃ³n automÃ¡tica, extracciÃ³n de datos)
- âœ… **BÃºsqueda global implementada** (GlobalSearch.jsx)
- âœ… **Centro de notificaciones implementado** (NotificationCenter.jsx)
- âœ… **Sistema de autenticaciÃ³n optimizado y unificado**
- âœ… **Sistema de roles completo** (Owner, Wedding Planner, Ayudante)
- âœ… **DocumentaciÃ³n completa** (18 flujos especÃ­ficos + planes de suscripciÃ³n)
- âœ… **Tests unitarios y validaciÃ³n integral**

## Nuevo Roadmap - 10 Prioridades EstratÃ©gicas

### ðŸ”¥ **ALTA PRIORIDAD (1-3 meses)**

#### 1. **Sistema de Proveedores con IA** âœ… **85% IMPLEMENTADO**
**Estado**: Funcional con oportunidades de mejora (pagos/contratos externos)
- âœ… **Completado**: PÃ¡ginas principales (Proveedores.jsx, GestionProveedores.jsx, ProveedoresNuevo.jsx)
- âœ… **Completado**: BÃºsqueda con IA (ProviderSearchModal.jsx, AISearchModal.jsx)
- âœ… **Completado**: GestiÃ³n de servicios y categorÃ­as
- **Pendiente**: IntegraciÃ³n completa con sistema de pagos y contratos
- **Tiempo estimado**: 1-2 semanas

#### 2. **Timeline y GestiÃ³n de Tareas** âŒ **30% IMPLEMENTADO**
**Estado**: Estructura bÃ¡sica creada, necesita desarrollo
- âœ… **Completado**: PÃ¡gina bÃ¡sica (Tasks.jsx, Timing.jsx)
- âŒ **Pendiente**: Sistema completo de cronograma automÃ¡tico con IA
- âŒ **Pendiente**: GestiÃ³n avanzada de tareas y recordatorios
- âŒ **Pendiente**: IntegraciÃ³n con calendario y proveedores
- **Tiempo estimado**: 3-4 semanas

#### 3. **Sistema de Invitaciones Digitales** âŒ **20% IMPLEMENTADO**
**Estado**: Componentes bÃ¡sicos creados, necesita desarrollo completo
- âœ… **Completado**: PÃ¡ginas bÃ¡sicas (Invitaciones.jsx, InvitationDesigner.jsx)
- âŒ **Pendiente**: Sistema completo de diseÃ±o de invitaciones
- âŒ **Pendiente**: EnvÃ­o masivo y gestiÃ³n de RSVP
- âŒ **Pendiente**: Plantillas personalizables y responsive
- **Tiempo estimado**: 4-5 semanas

### ðŸš€ **MEDIA PRIORIDAD (3-6 meses)**

#### 4. **Sistema de Emails con IA** âœ… **90% DOCUMENTADO**
**Estado**: Completamente especificado, pendiente implementaciÃ³n
- âœ… **Completado**: BuzÃ³n completo (Buzon_fixed_complete.jsx)
- âœ… **Completado**: Servicios de email (EmailService.js)
- âœ… **Completado**: EspecificaciÃ³n de anÃ¡lisis IA automÃ¡tico
- âœ… **Completado**: Plantillas para comunicaciÃ³n IA con proveedores
- **Pendiente**: ImplementaciÃ³n de anÃ¡lisis IA y extracciÃ³n de datos
- **Tiempo estimado**: 3-4 semanas

#### 5. **Sistema de Contratos y Pagos** âŒ **25% IMPLEMENTADO**
**Estado**: Estructura bÃ¡sica creada
- âœ… **Completado**: PÃ¡gina bÃ¡sica (Contratos.jsx)
- âŒ **Pendiente**: Sistema completo de gestiÃ³n de contratos
- âŒ **Pendiente**: IntegraciÃ³n con pasarelas de pago
- âŒ **Pendiente**: Seguimiento de pagos y facturas
- **Tiempo estimado**: 5-6 semanas

#### 6. **Sistema de DiseÃ±o Web con IA** âœ… **80% DOCUMENTADO**
**Estado**: Completamente rediseÃ±ado con generaciÃ³n automÃ¡tica
- âœ… **Completado**: Editor web bÃ¡sico (WebEditor.jsx, DisenoWeb.jsx)
- âœ… **Completado**: PÃ¡ginas de diseÃ±o (disenos/ folder completo)
- âœ… **Completado**: EspecificaciÃ³n de generaciÃ³n automÃ¡tica por prompts
- âœ… **Completado**: Sistema de 4 prompts editables con variables dinÃ¡micas
- **Pendiente**: ImplementaciÃ³n de generador IA con OpenAI API
- **Tiempo estimado**: 2-3 semanas

#### 7. **InternacionalizaciÃ³n (i18n)** âœ… **40% IMPLEMENTADO**
**Estado**: Estructura bÃ¡sica implementada
- âœ… **Completado**: Hook useTranslations.js implementado
- âœ… **Completado**: Archivos de traducciÃ³n (es/en/fr) en i18n/locales/
- âœ… **Completado**: IntegraciÃ³n bÃ¡sica en componentes principales
- **Pendiente**: TraducciÃ³n completa de toda la interfaz
- **Tiempo estimado**: 3-4 semanas

### ðŸ“± **BAJA PRIORIDAD (6+ meses)**

#### 8. **Sistema de Notificaciones push Avanzado** âœ… **50% IMPLEMENTADO**
**Estado**: Centro bÃ¡sico implementado, necesita expansiÃ³n
- âœ… **Completado**: NotificationCenter.jsx funcional
- âœ… **Completado**: Estructura bÃ¡sica de notificaciones
- **Pendiente**: Notificaciones push reales y preferencias granulares
- **Tiempo estimado**: 4-5 semanas

#### 9. **IA y AutomatizaciÃ³n Avanzada** âœ… **35% IMPLEMENTADO**
**Estado**: Implementaciones parciales en mÃºltiples mÃ³dulos
- âœ… **Completado**: IA en SeatingPlan (asignaciÃ³n automÃ¡tica)
- âœ… **Completado**: IA en Proveedores (bÃºsqueda inteligente)
- âœ… **Completado**: Generador de imÃ¡genes IA (ImageGeneratorAI.jsx)
- **Pendiente**: Asistente virtual completo y anÃ¡lisis predictivo
- **Tiempo estimado**: 12-15 semanas

#### 10. **Sistema de ColaboraciÃ³n y DashboarDíavanzado** âŒ **15% IMPLEMENTADO**
**Estado**: Componentes bÃ¡sicos creados
- âœ… **Completado**: PlannerDashboard.jsx bÃ¡sico
- âœ… **Completado**: Estructura de permisos bÃ¡sica
- **Pendiente**: WebSockets, colaboraciÃ³n en tiempo real, analytics avanzados
- **Tiempo estimado**: 15-18 semanas

## MÃ©tricas de Ã‰xito

### TÃ©cnicas
- **Performance**: Lighthouse score > 95
- **Bundle Size**: < 2MB inicial
- **Test Coverage**: > 90%
- **Error Rate**: < 0.1%

### Negocio
- **User Engagement**: +40%
- **Retention Rate**: +25%
- **Feature Adoption**: > 80%
- **Customer Satisfaction**: > 4.5/5

## PrÃ³ximos Pasos Inmediatos

### Esta Semana
1. Implementar generador IA de sitios web con prompts editables
2. Desarrollar anÃ¡lisis automÃ¡tico de emails con IA
3. Completar sistema de roles tÃ©cnico (Owner/Wedding Planner/Ayudante)
4. Proveedores: reflejar enlaces/estado de pagos/contratos externos (sin procesar pagos)

### PrÃ³ximo Mes
1. Sistema de contratos y documentos completo
2. Checklist avanzado con automatizaciÃ³n
3. Timeline automÃ¡tico con IA para tareas
4. RSVP inteligente con confirmaciones automÃ¡ticas

### PrÃ³ximo Trimestre
1. Sistema de Notificaciones push avanzado
2. IA y automatizaciÃ³n completa
3. ColaboraciÃ³n en tiempo real y analytics

## Cierre de Gaps Transversales

- Cliente API unificado: migrar servicios restantes (email, inbox, AI, provider search) a `apiClient` con `Authorization` opcional (Sprint 2).
- WhatsApp provider: definir health real o fallback para `/api/whatsapp/provider-status` y aÃ±adir healthcheck (Sprint 1).
- CI/CD gates: Sprint 1 (unit rules + seating smoke + `roadmapOrder --check` en PR). Sprint 2 (aÃ±adir E2E email/budget en develop).
- A11y/i18n: auditorÃ­a y fixes en vistas core (Seating, Invitados, Tasks, Email) (Sprint 2).
- Performance/Observabilidad: Lighthouse CI, budget de bundle (<2MB), monitorizaciÃ³n de errores (Sprint 2â€“4).
- Seating Autoâ€‘IA: E2E especÃ­fico con `VITE_ENABLE_AUTO_ASSIGN=true` y documentaciÃ³n (Sprint 1â€“2).
- Legal/compliance: plantillas por jurisdicciÃ³n y evaluaciÃ³n firma electrÃ³nica (Sprint 4).

## Consideraciones TÃ©cnicas

### Deuda TÃ©cnica Identificada
- âœ… **RESUELTO**: RefactorizaciÃ³n de componentes monolÃ­ticos completada
- âœ… **RESUELTO**: Hooks personalizados implementados (useFinance, useSeatingPlan, useGuests)
- âŒ **PENDIENTE**: Archivos `.bak` y cÃ³digo duplicado por limpiar
- âŒ **PENDIENTE**: Tests E2E estables
- âŒ **PENDIENTE**: Optimizaciones de bundle

### Arquitectura Futura
- Microservicios para funcionalidades complejas
- CDN para assets estÃ¡ticos
- Cache distribuido para performance
- Monitoreo y observabilidaDíavanzados

---

**Ãšltima actualizaciÃ³n**: 2025-08-26  
**PrÃ³xima revisiÃ³n**: 2025-09-15  
**Responsable**: Equipo de Desarrollo MyWed360  
**DocumentaciÃ³n**: 18 flujos especÃ­ficos + sistema de roles tÃ©cnico + planes de suscripciÃ³n

## Plan de Sprints (8 semanas)

Notas:
- DuraciÃ³n: 4 sprints de 2 semanas.
- Objetivo: estabilizar core (Seating/RSVP/Tasks), luego IA/Contratos.
- E2E claves deben pasar en CI al final de cada sprint.

### Sprint 1 (Semanas 1â€“2) â€” EstabilizaciÃ³n Core
- Seating Plan: hardening + E2E verdes (smoke, fit, toasts, assign/unassign, capacity/aisle, templates).
- Firestore Rules: â€œselfâ€‘plannerâ€ + invitaciones como subcolecciÃ³n + tests verdes.
- RSVP: byâ€‘token (GET/PUT), generaciÃ³n `rsvp-link`, recordatorios bÃ¡sicos.
- MÃ©tricas: envÃ­o desde UI con `apiClient`.

Entregables:
- E2E seating: `seating_smoke`, `seating_fit`, `seating_toasts`, `seating_assign_unassign`, `seating_capacity_limit`, `seating_aisle_min`, `seating_template_*`.
- Unit rules: extended/exhaustive verdes.
- E2E RSVP: confirmaciÃ³n por token verde.

### Sprint 2 (Semanas 3â€“4) â€” Tareas/Notificaciones/Email
- Tasks/Checklist avanzado: dependencias, recordatorios, UX; ICS export estable.
- Notificaciones: CRUD estable con auth; hooks UI consolidados.
- Email: E2E enviar/leer/carpetas; plantillas base.

Entregables:
- E2E email: `send-email`, `read-email`, `folders-management`.
- Budget flow E2E bÃ¡sico.

### Sprint 3 (Semanas 5â€“6) â€” DiseÃ±o Web IA + Multiâ€‘Bodas
- IA DiseÃ±o Web: pipeline bÃ¡sico de generaciÃ³n (prompts â†’ preview), historial simple.
- Multiâ€‘bodas: UX final, `BodaDetalle` desde Firestore (sin mocks).

Entregables:
- GeneraciÃ³n bÃ¡sica funcionando en entorno dev.
- NavegaciÃ³n planner multiâ€‘boda estable.

### Sprint 4 (Semanas 7â€“8) â€” Contratos/Docs + GamificaciÃ³n + IA Asistente (proto)
- Contratos/Docs: plantillas y gestiÃ³n documental; firma externa opcional (postâ€‘MVP).
- GamificaciÃ³n: puntos, hitos bÃ¡sicos vinculados a eventos.
- IA Asistente: prototipo contextual con prompts mÃ­nimos y guardrails.

Entregables:
- Contratos CRUD y templates operativos.
- Eventos de gamificaciÃ³n en Tasks/Timeline.
- Chat IA mÃ­nimo funcional.



