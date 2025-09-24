---
title: '[Tech] Consolidar duplicidad en Firestore Rules y tests'
labels: [tech, rules]
---

## Objetivo

Consolidar bloques duplicados `match /users/{...}` y normalizar invitaciones como subcolección. Asegurar tests verdes.

## Contexto

- Docs: docs/FIRESTORE_RULES.md:1, docs/SPRINTS_PLAN.md:1
- Tests: src/**tests**/firestore.rules.extended.test.js:1

## Alcance

- [ ] Unificar `match /users/{userId}` y `match /users/{uid}`
- [ ] Comentarios y helpers consistentes
- [ ] Ajustes mínimos en tests para reflejar estructura

## Validación

```
set FIRESTORE_EMULATOR_HOST=localhost:8080
npm run test:unit -- src/__tests__/firestore.rules.extended.test.js
```
