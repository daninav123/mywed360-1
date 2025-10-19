# Guía de diseño y prototipado (Figma)

## Objetivo
Adoptar Figma como herramienta estándar para prototipar el flujo de Plan de Asientos y futuras funcionalidades.

## Organización sugerida en Figma
- **Equipo / Espacio**: `Lovenda · Diseño`
- **Proyecto**: `Plan de Asientos`
  - Archivo `01 - Wizard Exportación` (wireframes + prototipo interactivo)
  - Archivo `02 - Vista móvil / tablet`
  - Archivo `03 - Componentes comunes`
- Usar la biblioteca UI Lovenda (si no existe, duplicar desde `Lovenda · UI Kit`).

## Setup rápido
1. Crear cuenta en [figma.com](https://figma.com) y solicitar acceso al espacio compartido.
2. Duplicar archivo base desde `Lovenda · UI Kit` → `Plan de Asientos`.
3. Configurar estilos (colores, tipografía) según tokens definidos en `src/styles/tokens.css`.
4. Activar plugins recomendados: **Autoflow** (mapa de flujos) y **Contrast** (accessibilidad).

## Buenas prácticas
- Nombrar frames con el patrón `LOVENDA - [Flujo] - [Paso]` (ej: `LOVENDA - Export Wizard - Step 1`).
- Mantener componentes dentro de la página `Components` y publicarlos en la biblioteca local.
- Anotar decisiones o dudas con comentarios (`C`).
- Vincular cada pantalla con tareas en `docs/tareas/plan-asientos-export-mobile.md`.

## Entregables mínimos
- Wireframes low-fi (ver `docs/diseno/export-wizard-mobile.md`).
- Prototipo clickable (modo Prototype) del wizard y vista móvil/tablet.
- Handoff con medidas (`Inspect` en Figma) para desarrollo y QA.
- Capturas o GIF corto para documentación/soporte.

## Workflow recomendado
1. Revisar documentación funcional (`docs/flujos-especificos/flujo-4-invitados-operativa.md`).
2. Actualizar prototipos en Figma siguiendo esta guía.
3. Adjuntar enlaces de Figma y capturas en los tickets.
4. Tras cada entrega, reflejar cambios en la documentación técnica y backlog.

## Personalización y estilos de boda
- Consulta `docs/personalizacion/README.md` para conocer los arquetipos activos y preguntas del onboarding.
- Mantén un frame por estilo principal (boho, clásica urbana, microboda, etc.) con variantes de copy acordes al hub de tono.
- Documenta en Figma qué componentes o tokens cambian según el perfil para que frontend pueda reutilizarlos.
- Para la experiencia de personalización continua (mapa de preferencias, StyleMeter, panel IA) sigue la guía en `docs/diseno/personalizacion-continua.md`.

## Recursos
- `docs/diseno/export-wizard-mobile.md`: estructuras y notas de interacción.
- `docs/diseno/personalizacion-continua.md`: blueprint de la experiencia IA continua.
- `docs/tareas/plan-asientos-export-mobile.md`: backlog técnico asociado.
- Canal interno de diseño (Slack/Teams) para feedback.
