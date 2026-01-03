---
description: Ejecutar suite de tests completa por categorías
---

# Test Suite - Ejecución por Categorías

Este workflow ejecuta tests divididos por tipo para evitar timeouts.

## 1. Tests Unitarios (Rápidos)

// turbo
```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/unit/
```

Tiempo estimado: 2-5 minutos.

## 2. Tests de Servicios

// turbo
```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/services/
```

Tiempo estimado: 3-7 minutos.

## 3. Tests de Componentes

// turbo
```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/components/
```

Tiempo estimado: 5-10 minutos.

## 4. Tests de Accesibilidad

// turbo
```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/accessibility/
```

Tiempo estimado: 2-5 minutos.

## 5. Tests de Integración (Lentos)

```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/integration/
```

Tiempo estimado: 10-20 minutos.

## 6. Tests End-to-End (Muy lentos)

```bash
cd apps/main-app && npx vitest run --reporter=verbose src/test/e2e/
```

Tiempo estimado: 15-30 minutos.

## Ejecutar todos (con timeout de 30 minutos)

```bash
npm run test:run
```

⚠️ **Advertencia:** La suite completa puede tardar más de 30 minutos y quedar colgada en algunos tests e2e.

## Resultado Esperado

- ✅ Tests unitarios: 100% pass
- ✅ Tests de servicios: 100% pass
- ⚠️ Tests de componentes: Posibles errores de mock
- ⚠️ Tests e2e: Pueden quedar colgados (issue conocido)
