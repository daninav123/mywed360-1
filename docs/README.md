# Documentación MaLove.App

Bienvenido al repositorio de documentación interna del proyecto. Este índice resume qué encontrar en `docs/` y cómo mantenerse alineado con el estado real del desarrollo.

## 📋 Índice rápido

- [`personalizacion/`](./personalizacion/README.md) · Narrativa de producto, preguntas clave y assets de recomendación.
- [`flujos-especificos/flujo-2c-personalizacion-continua.md`](./flujos-especificos/flujo-2c-personalizacion-continua.md) · Orquestación IA continua de preferencias y recomendaciones.
- [`manual-usuario.md`](./manual-usuario.md) · Guía para usuarios finales.
- [`arquitectura-completa.md`](./arquitectura-completa.md) · Visión técnica y diagramas.
- [`flujos-usuario.md`](./flujos-usuario.md) · Descripción general de todos los flujos funcionales.
- [`FLUJOS-INDICE.md`](./FLUJOS-INDICE.md) · Fuente canónica de numeración y estado por flujo.
- [`ROADMAP.md`](./ROADMAP.md) · Prioridades, entregables y métricas (sincronizado con el índice).
- [`TODO.md`](./TODO.md) · Backlog operativo (se actualiza junto al roadmap).
- [`estimacion-horas-lanzamiento.md`](./estimacion-horas-lanzamiento.md) · Estimaciones (ver notas de vigencia).
- [`flujos-especificos/`](./flujos-especificos) · 40 documentos con detalle por flujo.
- [`monitoring/`](./monitoring) · Guías de Prometheus, Alertmanager y tableros Grafana.
- [`refactoring/`](./refactoring) · Cambios estructurales relevantes (ej. `finance-refactor.md`).
- [`scripts/aggregateRoadmap.md`](./scripts/aggregateRoadmap.md) · Procedimiento para sincronizar ROADMAP/TODO y cobertura E2E.
- [`archive/`](./archive) · Históricos que se mantienen como referencia.

> `docs/archive/roadmap-2025-v2.md` queda como snapshot (09/10/2025). Usa `docs/ROADMAP.md` para decisiones actuales.

## 🧭 Convención de rutas (monorepo)

- Muchos documentos históricos usan `src/...` (estructura antigua). En el monorepo actual, la app principal vive en `apps/main-app/src/...`.

## 🎯 Estado del proyecto (resumen)

- **Core refactorizado** ⇢ Seating Plan, Finance e Invitados cuentan con componentes modulares nuevos y hooks (`useSeatingPlan`, `useFinance`, `useGuests`). Revisar pendientes de colaboración, móviles y exportación en `docs/TODO.md`.
- **Personalización liderada por IA** ⇢ El perfil de boda captura estilo, prioridades y restricciones; sus datos alimentan recomendaciones en checklist, proveedores, presupuesto y contenido (`docs/personalizacion/README.md` y `docs/flujos-especificos/flujo-2-descubrimiento-personalizado.md`).
- **IA & automatización** ⇢ Proveedores, emails y diseño web tienen MVP funcional; continúan abiertos pagos Stripe, publicación de sitios y métricas IA (`docs/ROADMAP.md`, secciones 4, 6 y 20).
- **Protocolo (flujos 11–11E)** ⇢ Documentación funcional completa, implementación marcada como “pendiente” (drag & drop, subcolecciones, alertas).
- **Notificaciones** ⇢ Centro in-app operativo; push, workers y asistente virtual en curso (`docs/ROADMAP.md` flujo 12 y `TODO` sección “Asistente virtual e IA”).
- **Seguimiento** ⇢ Incidentes operativos en `docs/incidents/YYYY-MM-DD_task_errors.md`. Ejecutar `scripts/aggregateRoadmap.js` tras actualizar flujos para sincronizar ROADMAP/TODO.

## ⏱️ Estimaciones

Las cifras de `docs/estimacion-horas-lanzamiento.md` (agosto 2025) calculan 80–100 h para el MVP. Valida dependencias externas (Stripe, automatizaciones, i18n) antes de reutilizar esos números: varias actividades siguen abiertas.

## 📊 Métricas útiles

- **Documentos en `docs/`**: 120+ (40 flujos, 6 guías de monitorización, 4 incidentes, etc.). Usa `rg --files docs` para listar.
- **Hooks clave**: `apps/main-app/src/hooks/useFinance.js`, `apps/main-app/src/hooks/useSeatingPlan.js`, `apps/main-app/src/hooks/useGuests.js`, `apps/main-app/src/hooks/useTranslations.js`.
- **Consolidación pendiente**: `docs/consolidacion-documentacion.md` detalla los restos del sistema de emails y otros duplicados todavía por limpiar.

## 🗂️ Árbol base

```
docs/
├── README.md                     # Este índice
├── ROADMAP.md                    # Estado y prioridades (fuente única)
├── TODO.md                       # Backlog operativo sincronizado con ROADMAP
├── arquitectura-completa.md      # Arquitectura
├── estimacion-horas-lanzamiento.md
├── flujos-usuario.md
├── flujos-especificos/           # 40 documentos de flujos
├── manual-usuario.md
├── monitoring/
├── refactoring/
├── archive/roadmap-2025-v2.md    # Snapshot histórico (09/10/2025)
└── archive/
```

## 🚀 Cómo seguir trabajando

1. Consulta `docs/ROADMAP.md` para prioridades por flujo y sprint.
2. Revisa `docs/TODO.md` para entregables operativos y su estado.
3. Ejecuta `node scripts/aggregateRoadmap.js` tras modificar flujos o el backlog (mantiene consistencia entre ROADMAP y TODO).
4. Completa las guías en `docs/ENVIRONMENT.md` antes de compartir un `.env` (ver sección “Configuración” para detalles actualizados).
5. Recuerda que el backend Express se levanta localmente en `http://localhost:4004`; Vite proxy ya apunta a ese puerto salvo que definas `VITE_BACKEND_BASE_URL`.

---

**Última actualización**: 13 de octubre de 2025  
**Contacto**: Equipo de Desarrollo MaLove.App
