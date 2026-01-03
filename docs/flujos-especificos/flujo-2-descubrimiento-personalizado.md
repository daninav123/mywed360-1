# 2. Descubrimiento Personalizado de la Boda

> Estado 2025-10-14. Este flujo inicia la experiencia y alimenta el `weddingProfile`. Cada iteración debe registrarse aquí y sincronizar datos con `docs/DATA_MODEL.md`.

## 1. Objetivo
- Entender la visión de la pareja/planner (estilo, formalidad, temporada, presupuesto, invitados clave).
- Identificar necesidades especiales (restricciones dietarias, accesibilidad, rituales culturales).
- Generar un set inicial de recomendaciones y activar los módulos relevantes (checklist, proveedores, presupuesto, contenido).

## 2. Trigger
- Usuario nuevo sin bodas asociadas → redirección a `/onboarding/discovery`.
- Planner con múltiples bodas → CTA “Agregar nueva boda” abre el flujo en modal.
- Re-configuración → opción “Actualizar perfil de la boda” en dashboard principal.

## 3. Estructura UX
1. **Bienvenida**
   - Avatar planner IA + copy empático (ver `docs/personalizacion/tono-mensajes.md`).
   - Explica cómo se usarán las respuestas.
2. **Datos base**
   - `eventType`, ubicación tentativa, fecha/meta temporal, número estimado de invitados.
3. **Estilo y prioridades**
   - Selección multiopción + texto libre (`weddingStyle`, `vibeKeywords`, `mostImportantAspects`).
4. **Restricciones y necesidades**
   - Presupuesto objetivo, flexibilidad, restricciones dietarias, accesibilidad, rituales especiales.
5. **Experiencias y preferencias únicas**
   - Captura abierta de ideas especiales (`specialInterests`) con campos:
     - `idea` (texto libre), `tipo` (ej. animación, tradición, experiencia), `nivelEntusiasmo` (`mustHave`, `considerar`, `niceToHave`)
     - `contexto` (por qué es relevante, quién lo propuso, notas logísticas)
   - Lista de elementos a evitar (`noGoItems`) con motivo (`cutre`, `presupuesto`, `riesgo`, `no refleja estilo`).
   - Preguntas guiadas por estilo (“¿Están abiertos a experiencias atrevidas como un toro mecánico?”) y opción de añadir etiquetas personalizadas.
   - Permite adjuntar referencias (links, imágenes) para inspirar al equipo de diseño/proveedores.
6. **Momentos destacados**
   - Preguntas condicionales sobre ceremonias, música, eventos paralelos.
7. **Resumen editable**
   - Muestra lo capturado, permite editar antes de guardar.
8. **Entrega de recomendaciones iniciales**
   - Presenta checklist inicial, proveedores destacados y plantillas sugeridas con CTA directos.

## 4. Persistencia
- `weddings/{id}/weddingProfile`
  - `version`: string (semver, inicia en `1.0.0`)
  - `discoverySource`: `onboarding|manual|import`
  - `eventType`, `stylePrimary`, `styleSecondary`, `vibeKeywords[]`
  - `guestCountRange`, `budgetRange`, `priorityAreas[]`
  - `specialInterests[]` (objetos `{ id, idea, tipo, nivelEntusiasmo, contexto, createdBy, createdAt }`)
  - `noGoItems[]` (objetos `{ id, descripcion, motivo, registradoPor, createdAt }`)
  - `mustHaveVendors[]`, `accessibilityNeeds[]`, `dietaryRestrictions[]`
  - `specialMoments[]` (estructura: `id`, `title`, `notes`, `responsibleRole`)
  - `lastUpdatedBy`, `updatedAt`, `confidenceScore` (0-1, heurística IA)
- `weddings/{id}/weddingInsights`
  - Resúmenes procesados para IA y dashboards (texto corto, tags).

## 5. Reglas de negocio
- Todo formulario es guardado en draft tras cada paso (evita pérdida).
- Se debe pedir confirmación antes de publicar recomendaciones.
- Cambios posteriores al perfil generan evento `wedding_profile_updated` y recalculan recomendaciones IA.
- Si la pareja añade nueva prioridad, se programan tareas de checklist en estado “sugerido”.

## 6. Integraciones
- **Checklist (flujo 14)**: usa `priorityAreas` y `specialMoments`.
- **Proveedores IA (flujo 5a)**: filtra base según `stylePrimary`, `budgetRange`, `mustHaveVendors`.
- **Presupuesto (flujo 6)**: precarga categorías y alerta si presupuesto y prioridades no coinciden.
- **Contenido (flujo 8 & 20)**: prompts personalizan textos de invitaciones/emails.
- **Personalización continua (flujo 2C)**: coordina follow-ups IA, curación y automatizaciones con los datos capturados.
- **Asistente IA (flujo 16)**: recibe `weddingInsights` en cada conversación.

## Cobertura E2E implementada
- `cypress/e2e/onboarding/discovery-personalized.cy.js`: recorre el flujo de onboarding personalizado y confirma persistencia del perfil.
- `cypress/e2e/onboarding/onboarding-mode-selector.cy.js`: valida selección de modo (wizard vs. asistente) y rutas resultantes.

