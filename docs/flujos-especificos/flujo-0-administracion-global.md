# 0. Administración Global (estado 2025-10-14)

> Implementado: autenticación reforzada, panel operativo con métricas en tiempo real, alertas de integraciones y gestión de tareas administrativas. La documentación de detalle se encuentra en [docs/panel-admin/panel-admin.md](../panel-admin/panel-admin.md).

## 1. Objetivo y alcance
- Control centralizado de usuarios, bodas, IA, finanzas y comunicaciones críticas.
- Garantizar observabilidad, soporte y configuración global alineada con seguridad.

## 2. Trigger y rutas
- Acceso exclusivo vía `/admin/login` y protección de rutas `/admin/**` mediante `RequireAdmin`.
- Detalle de validaciones, layout y navegación: ver sección 2 del dossier del panel admin.

## 3. Documentación extendida
| Tema | Referencia |
|------|------------|
| Visión general, seguridad y navegación | [Panel Admin - secciones 1-3](../panel-admin/panel-admin.md#1-objetivo-y-alcance) |
| Dashboard, KPIs y tareas administradas | [Panel Admin - sección 3](../panel-admin/panel-admin.md#3-paso-a-paso-ux) |
| Persistencia, endpoints y reglas | [Panel Admin - secciones 4-5](../panel-admin/panel-admin.md#4-persistencia-y-datos) |
| Integración, QA y roadmap | [Panel Admin - secciones 6-13](../panel-admin/panel-admin.md#6-estados-especiales-y-errores) |

## 4. Roadmap y pendientes
- Se mantiene el roadmap descrito en el dossier del panel admin (secciones 11-13).
- Este flujo únicamente verifica que producto y seguridad sigan alineados con los hitos.

## 5. Seguimiento
- Mantener el resumen sincronizado con los avances del panel admin (métricas, alertas y tareas guardadas en tiempo real).
- Para cambios funcionales o técnicos actualizar directamente `docs/panel-admin/panel-admin.md`.

## Cobertura E2E implementada
- `cypress/e2e/admin/admin-flow.cy.js`: recorre login, panel principal, filtros y validación de roles (owner, planner, soporte).
