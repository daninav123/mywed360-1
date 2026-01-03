---
title: '[Tech] Prometheus metrics + Grafana importables'
labels: [tech, monitoring]
---

## Objetivo

Exponer `/metrics` estable con `prom-client` y verificar dashboards importables.

## Contexto

- Docs: docs/monitoring/README.md:1, docs/SPRINTS_PLAN.md:1

## Alcance

- [ ] Validar counters/histogramas disponibles
- [ ] Probar `/api/admin/metrics/http` JSON
- [ ] Documentar pasos de import en README

## Validación

- [ ] `curl /metrics` (admin)
- [ ] Importar `docs/monitoring/grafana/http-overview.json`
