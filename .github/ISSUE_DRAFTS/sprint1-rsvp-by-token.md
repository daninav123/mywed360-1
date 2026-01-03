---
title: '[Feature] RSVP by-token GET/PUT + validaciones'
labels: [enhancement, backend]
---

## Descripción

Alinear implementación GET/PUT `/api/rsvp/by-token/{token}` con OpenAPI, validaciones de payload y respuestas 200/400/404.

## Contexto

- Docs: docs/api/openapi.yaml:1, docs/SPRINTS_PLAN.md:1

## Alcance

- [ ] Validación `RSVPPutRequest`
- [ ] Estados `pending|accepted|rejected`
- [ ] Tests de contrato básicos

## Impacto en pruebas

- [x] Unit/integration
- [ ] E2E
