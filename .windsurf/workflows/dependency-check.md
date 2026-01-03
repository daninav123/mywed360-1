---
description: Verificar estado de dependencias y actualizaciones disponibles
---

# Dependency Check - Verificación de Dependencias

Este workflow verifica el estado de las dependencias del proyecto.

## 1. Listar dependencias desactualizadas

```bash
npm outdated
```

Muestra paquetes con actualizaciones disponibles.

## 2. Verificar vulnerabilidades de seguridad

// turbo
```bash
npm audit --production
```

Solo verifica dependencias de producción (excluye devDependencies).

## 3. Verificar integridad de package-lock.json

// turbo
```bash
npm ci --dry-run
```

Simula instalación limpia para verificar consistencia.

## 4. Buscar dependencias duplicadas

```bash
npm dedupe --dry-run
```

Identifica paquetes instalados múltiples veces.

## 5. Verificar engines de Node/npm

```bash
node -v
npm -v
cat package.json | grep -A 3 '"engines"'
```

Debe ser Node >=20.0.0, npm >=10.0.0 (actual: v18.20.8 ⚠️).

## 6. Listar paquetes instalados en cada app

```bash
cd apps/main-app && npm list --depth=0 | head -20
cd apps/admin-app && npm list --depth=0 | head -20
cd apps/planners-app && npm list --depth=0 | head -20
cd apps/suppliers-app && npm list --depth=0 | head -20
```

## 7. Verificar paquetes críticos

```bash
npm list firebase vitest vite react react-dom tailwindcss
```

Confirma versiones de frameworks principales.

## Problemas Conocidos

- ⚠️ Node.js v18.20.8 (requiere v20+)
- ⚠️ 22 vulnerabilidades (19 moderate, 3 high)
- ⚠️ `xlsx` vulnerable sin fix - reemplazar con `exceljs`
- ⚠️ Firebase SDK con `undici` vulnerable
- ✅ `baseline-browser-mapping` actualizado

## Recomendaciones

1. **Actualizar Node.js a v20 LTS** (crítico)
2. **Reemplazar `xlsx` con `exceljs`**
3. **Actualizar Firebase SDK** cuando disponible
4. **Ejecutar `npm dedupe`** si hay duplicados
