---
description: Verificación completa de salud del sistema
---

# Health Check Completo del Proyecto

Este workflow verifica el estado de todos los componentes críticos del proyecto.

## 1. Verificar servicios activos

```bash
ps aux | grep -E "node.*dev|vite.*517" | grep -v grep
```

Debe mostrar 5 procesos activos (backend + 4 apps frontend).

## 2. Verificar conectividad HTTP

```bash
curl -fsS --max-time 3 http://localhost:4004/
curl -fsS --max-time 3 http://localhost:5173/
curl -fsS --max-time 3 http://localhost:5174/
curl -fsS --max-time 3 http://localhost:5175/
curl -fsS --max-time 3 http://localhost:5176/
```

Todos deben responder con código 200.

## 3. Ejecutar linter

// turbo
```bash
npm run lint
```

Debe completar sin errores en todas las apps.

## 4. Verificar Node.js y dependencias

```bash
node -v
npm -v
npm list --depth=0 | head -n 20
```

Node debe ser >=20.0.0 (actualmente v18 - requiere actualización).

## 5. Revisar vulnerabilidades

```bash
npm audit --json | grep -E '"total"|"high"|"critical"'
```

Debe mostrar 0 critical, < 10 high.

## 6. Verificar archivos críticos

```bash
ls -la backend/.env
ls -la .husky/_/h
ls -la apps/main-app/src/components/Onboarding/
```

Todos deben existir y ser legibles.

## 7. Comprobar logs del backend

```bash
tail -n 50 backend/logs/error.log 2>/dev/null || echo "No error log found"
```

Revisar últimos errores si existen.

## 8. Test de casing en imports

```bash
grep -r "from.*EmailService" apps/main-app/src/ | grep -v emailService | wc -l
```

Debe devolver 0 (todos los imports en minúsculas).

## Resultado Esperado

- ✅ 5 servicios activos
- ✅ 5 endpoints HTTP respondiendo
- ✅ Lint sin errores
- ⚠️ Node v18 (actualizar a v20)
- ⚠️ 22 vulnerabilidades (ver informe)
- ✅ Archivos críticos presentes
- ✅ Imports con casing correcto
