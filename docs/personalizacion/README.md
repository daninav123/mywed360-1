# Hub de Personalización de Bodas

Este espacio centraliza cómo MyWed360 detecta las necesidades únicas de cada boda y distribuye ese conocimiento al resto de la plataforma.

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
