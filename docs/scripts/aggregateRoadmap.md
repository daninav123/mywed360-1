# aggregateRoadmap.js

Guía para ejecutar y mantener `scripts/aggregateRoadmap.js`, el script que alinea la documentación funcional con el backlog y la matriz de pruebas.

## Propósito

- Leer todos los documentos en `docs/flujos-especificos/` y extraer:
  - Estado (`Implementado`, `Pendiente`) y referencias de archivos.
  - Cobertura de pruebas E2E declarada en cada flujo.
  - Checklist de despliegue y pendientes relevantes.
- Generar artefactos consistentes para el equipo:
  - `docs/ROADMAP.md` (resumen canónico por flujo, usado en reuniones y PRs).
  - `roadmap_aggregated.json` (insumo para automatizaciones, dashboards y scripts auxiliares).
  - `docs/testing/e2e-coverage.md` (tabla resumida de specs por flujo; se omite si no hay cambios).

Ejecuta el script **cada vez** que cambien flujos, roadmap o suites E2E para evitar divergencias entre docs y código.

## Uso

```bash
node scripts/aggregateRoadmap.js
```

Opcionalmente establece `DEBUG=1` para imprimir log extendido (archivos procesados, coincidencias de specs, refs sin encontrar).

La ejecución sobrescribe los archivos de salida. Inclúyelos en tu commit cuando actualices documentación o pruebas.

## Requisitos y convenciones

1. Cada flujo debe declarar encabezados estándar:
   - `> Implementado:` y/o `> Pendiente:` en la introducción.
   - Secciones `## Cobertura E2E implementada` y `## Checklist de despliegue`.
2. Las rutas de specs deben escribirse como `cypress/e2e/.../*.cy.js` para que el script pueda verificarlas.
3. Referencias de código deben ir entre backticks (`` `ruta/archivo` ``); el script usa el basename para comprobar su existencia.
4. Los archivos mencionados deben existir en `src/`, `backend/`, `functions/`, `scripts/` o `docs/`. Si están en otra ruta añade una nota manual en este documento.

## Salidas esperadas

| Archivo | Ubicación | Contenido |
|---------|-----------|-----------|
| `docs/ROADMAP.md` | Documentación | Roadmap consolidado con estado por flujo, métricas y checklist. |
| `roadmap_aggregated.json` | Raíz del repo | JSON estructurado con cada flujo (`conclusion`, `implChecks`, `e2eChecks`, checklist, pendientes). |
| `docs/testing/e2e-coverage.md` | Documentación de testing | Tabla generada automáticamente con la cobertura Cypress declarada (se omite si no hay specs detectadas). |

## Checklist después de ejecutarlo

1. Abre `docs/ROADMAP.md` y verifica que los flujos editados reflejen el estado correcto.
2. Revisa `roadmap_aggregated.json` (puedes usar `jq '.modules[0]' roadmap_aggregated.json`) para validar que no existan `implChecks` vacíos inesperados.
3. Si se creó/actualizó `docs/testing/e2e-coverage.md`, confírmalo en tu diff.
4. Ejecuta `npm run validate:roadmap` si existe en tu flujo de trabajo de CI para asegurar coherencia posterior.

## Errores habituales

| Mensaje | Causa probable | Cómo resolver |
|---------|----------------|---------------|
| `Cannot read property 'match' of null` | El documento del flujo no tiene encabezados `##` esperados. | Asegúrate de incluir secciones `##` estándar (Cobertura E2E, Checklist). |
| `Spec not found` en `e2eChecks` | La ruta declarada en el flujo no existe. | Corrige la ruta (relativa a la raíz) o crea la spec correspondiente. |
| `implChecks[].matches = []` | El archivo referenciado en `> Implementado:` no se encuentra. | Comprueba la ruta o añade una nota aclarando que aún no existe. |
| `ENOENT: no such file or directory docs/testing` | Falta el directorio `docs/testing/`. | Crea la carpeta (`mkdir docs/testing`) antes de ejecutar el script. |

## Buenas prácticas

- Integra la ejecución en los hooks de pre-commit o en la pipeline de CI para asegurar que ROADMAP y TODO se mantengan sincronizados.
- Añade referencias a nuevas specs tan pronto como se creen para que `docs/testing/e2e-coverage.md` sirva de inventario.
- Si cambias el formato de los flujos, actualiza `scripts/aggregateRoadmap.js` y esta guía en el mismo PR.
