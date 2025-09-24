---
title: '[Tech] Test de health WhatsApp provider'
labels: [tech, backend, test]
---

## Objetivo

Asegurar endpoint `/api/whatsapp/provider-status` con test básico (status 200, campos clave).

## Contexto

- Docs: docs/monitoring/WHATSAPP_HEALTH.md:1, docs/api/openapi.yaml:1

## Alcance

- [x] Test Vitest con supertest (añadido en backend/**tests**/whatsapp-provider.test.js)
- [ ] Incluir en CI (ya lo ejecuta `npm run test:unit`)

## Validación

```
cd backend && npm test
```
