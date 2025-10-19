# 0. Administracion Global (estado 2025-10-14)

> Implementado: autenticación reforzada, panel operativo con métricas en tiempo real, alertas de integraciones y gestión de tareas administrativas. La documentación de detalle se encuentra en [docs/panel-admin/panel-admin.md](../panel-admin/panel-admin.md).

## 1. Objetivo y alcance
- Control centralizado de usuarios, bodas, IA, finanzas y comunicaciones criticas.
- Garantizar observabilidad, soporte y configuracion global alineada con seguridad.

## 2. Trigger y rutas
- Acceso exclusivo via `/admin/login` y proteccion de rutas `/admin/**` mediante `RequireAdmin`.
- Detalle de validaciones, layout y navegacion: ver seccion 2 del dossier del panel admin.

## 3. Documentacion extendida
| Tema | Referencia |
|------|------------|
| Visio general, seguridad y navegacion | [Panel Admin - secciones 1-3](../panel-admin/panel-admin.md#1-objetivo-y-alcance) |
| Dashboard, KPIs y tareas administradas | [Panel Admin - seccion 3](../panel-admin/panel-admin.md#3-paso-a-paso-ux) |
| Persistencia, endpoints y reglas | [Panel Admin - secciones 4-5](../panel-admin/panel-admin.md#4-persistencia-y-datos) |
| Integracion, QA y roadmap | [Panel Admin - secciones 6-13](../panel-admin/panel-admin.md#6-estados-especiales-y-errores) |

## 4. Roadmap y pendientes
- Se mantiene el roadmap descrito en el dossier del panel admin (secciones 11-13).
- Este flujo unicamente verifica que producto y seguridad sigan alineados con los hitos.

## 5. Seguimiento
- Mantener el resumen sincronizado con los avances del panel admin (métricas, alertas y tareas guardadas en tiempo real).
- Para cambios funcionales o técnicos actualizar directamente `docs/panel-admin/panel-admin.md`.

## Cobertura E2E implementada
- `cypress/e2e/admin/admin-flow.cy.js`: recorre login, panel principal, filtros y validación de roles (owner, planner, soporte).

