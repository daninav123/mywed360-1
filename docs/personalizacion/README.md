# Hub de Personalización de Bodas

Este espacio centraliza cómo MaLoveApp detecta las necesidades únicas de cada boda y distribuye ese conocimiento al resto de la plataforma.

## Objetivos
- Capturar estilo, prioridades, restricciones y momentos clave de cada evento.
- Traducir el perfil de la boda en recomendaciones accionables (checklist, proveedores, presupuesto, contenido).
- Mantener alineados diseño, copy y prompts de IA con la promesa de “wedding planner digital”.

## Componentes Clave
- **Descubrimiento inicial** · `docs/flujos-especificos/flujo-2-descubrimiento-personalizado.md`
- **Orquestación continua** · `docs/flujos-especificos/flujo-2c-personalizacion-continua.md`
- **Modelo de datos** · `docs/DATA_MODEL.md` → secciones `weddingProfile` y `weddingInsights`.
- **Guía de tono** · `docs/personalizacion/tono-mensajes.md`
- **Roadmap & métricas** · `docs/ROADMAP.md`, apartados “Personalización”.
- **Fixtures & scripts** · Documenta aquí los comandos para sembrar/limpiar datos de ejemplo (perfiles, insights, recomendaciones) antes de QA.

## Scripts y datasets de referencia

| Script | Propósito | Parámetros útiles | Salida principal |
|--------|-----------|-------------------|------------------|
| `node scripts/seedPersonalizationProfiles.js` | Crea bodas demo con perfiles híbridos, contrastes, recomendaciones, tareas y ajustes de presupuesto para validar flujos 2/2C/6/14. | `--dryRun` lista los seeds sin escribir;<br>`--prefix=<slug>` cambia el prefijo de los IDs;<br>`--force` sobrescribe bodas ya existentes con el mismo prefijo;<br>`--keyPath=<ruta>` usa un JSON de servicio concreto. | `weddings/{prefix-*/}` con subcolecciones `recommendations`, `tasks`, `budgetAdjustments` consistentes con el modelo actual. |
| `node scripts/seedTestDataForPlanner.js --email=<planner>` | Genera (o actualiza) un planner con boda demo completa para revisar la experiencia “planner” junto a personalización. | `--password=<pwd>` define acceso temporal;<br>`--weddingId=<id>` reutiliza una boda existente;<br>`--keyPath=<ruta>` credencial alternativa. | Usuario planner + boda con invitados, proveedores, tareas y documentos base listos para conectar con seeds de personalización. |
| `node scripts/seedSuppliersSimple.js <email> <weddingId>` | Añade proveedores sintéticos alineados a los estilos sugeridos para validar recomendaciones cruzadas. | Argumentos posicionales: email del planner y `weddingId`; acepta `--force` para limpiar proveedores previos. | Subcolección `suppliers` enriquecida (categoría, contacto) para pruebas de recomendaciones, IA proveedores y presupuesto. |
| `node scripts/seedFinanceMovements.js --weddingId=<id>` | Inyecta movimientos financieros base para comprobar la redistribución que generan las recomendaciones de presupuesto. | `--months=<n>` (placeholder, hoy sólo genera movimientos del mes actual);<br>`--force` reemplaza datos existentes. | Actualiza `weddings/{id}/finance/main.movements` con ingresos/gastos demo listos para los gráficos y el advisor. |

> Todos los scripts requieren credenciales Firebase válidas (`GOOGLE_APPLICATION_CREDENTIALS` o `--keyPath`). Ejecuta primero `seedPersonalizationProfiles` y, si necesitas experiencia completa para planners, encadena `seedTestDataForPlanner` apuntando al mismo email.

### Procedimiento rápido de QA

1. **Preparar entorno**  
   - Exporta la variable `GOOGLE_APPLICATION_CREDENTIALS` o ten a mano `--keyPath`.  
   - Verifica conexión a Firestore (elige proyecto de ensayo).
2. **Sembrar perfiles base**  
   - `node scripts/seedPersonalizationProfiles.js --prefix=qa-personalizacion --force`  
   - Confirma en Firestore que existen `weddings/qa-personalizacion-*`.
3. **Extender para planners** (opcional)  
   - `node scripts/seedTestDataForPlanner.js --email=planner.demo@maloveapp.com --keyPath=./serviceAccount.json`  
   - Usa el `weddingId` que imprime el script para futuras semillas.
4. **Completar proveedores y finanzas**  
   - `node scripts/seedSuppliersSimple.js planner.demo@maloveapp.com <weddingId>`  
   - `node scripts/seedFinanceMovements.js --weddingId=<weddingId> --months=6`
5. **Limpiar al finalizar**  
   - Ejecuta `firebase firestore:delete --project <id> --recursive /weddings/<slug>` o usa `--force` en los scripts para regenerar los datos con el mismo prefijo.

Registra cualquier nuevo script o dataset en esta tabla para que QA y desarrollo puedan replicar escenarios sin buscar en el código.

## Qué mantener actualizado
- Preguntas y lógica de inferencia del onboarding conversacional.
- Campos y versiones del perfil (`weddingProfile`) y derivados (`weddingInsights`).
- Recomendaciones habilitadas en checklist, proveedores, presupuesto y contenido.
- KPI/OKR asociados al uso de recomendaciones (véase roadmap).
- Copy, prompts y assets visuales alineados con cada arquetipo de boda.

## Flujo de trabajo sugerido
1. Actualiza el flujo de descubrimiento cuando cambien preguntas o lógicas de IA.
2. Sincroniza los nuevos campos en `docs/DATA_MODEL.md` y valida seeds/fixtures en QA.
3. Revisa `docs/manual-usuario.md` y materiales de soporte para reflejar novedades.
4. Notifica al equipo de diseño para mantener prototipos y assets coherentes (`docs/diseno/README.md`).

## Seeds & QA
- Ejecuta `node scripts/seedPersonalizationProfiles.js --force` para cargar perfiles híbridos (`minimalista + circo`, `boho + urbano`, `clasico + futurista`) con recomendaciones, tareas y ajustes de presupuesto.
- Usa `--dryRun` para listar sin escribir, `--prefix=<texto>` si necesitas aislar los datasets por entorno.
- Limpia/recarga estos datos antes de suites E2E relacionadas con personalización; las pruebas asumen que existen subcolecciones `recommendations`, `tasks` y `budgetAdjustments` en los weddings sembrados.
