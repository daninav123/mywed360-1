---
title: '[Feature] Seating E2E smoke + básicos verdes'
labels: [enhancement, e2e]
---

## Descripción

Estabilizar E2E de Seating: smoke, fit, assign/unassign, capacity limit, aisle min, templates mínimas.

## Contexto/Diseño

- Docs: docs/SPRINTS_PLAN.md:1, docs/TESTING.md:1

## Alcance

- [ ] Specs Cypress: `seating_smoke`, `seating_fit`, `seating_toasts`, `seating_assign_unassign`, `seating_capacity_limit`, `seating_aisle_min`, `seating_template_*`
- [ ] Datos seed deterministas
- [ ] Retries y estabilidad (CI)

## Impacto en pruebas

- [x] E2E
- [ ] Unit tests

## Observabilidad/Seguridad

- [ ] Logs sin PII
