# 2C. Personalización IA Continua (estado 2025-10-14)

> Flujo transversal que orquesta cómo la IA mantiene, enriquece y aplica las preferencias únicas de cada boda a lo largo de todo el ciclo de vida. Se alimenta principalmente de `weddingProfile`, `weddingInsights`, `specialInterests` y `noGoItems`, y coordina recomendaciones, tareas y comunicaciones.

## 1. Objetivo
- Garantizar que las preferencias declaradas (gustos, experiencias únicas, restricciones) se recojan y actualicen con iniciativa IA.
- Traducir cada preferencia en acciones concretas (tareas, briefings, ajustes de presupuesto, contenidos) sin que el usuario tenga que configurarlo manualmente.
- Detectar inconsistencias, huecos de información o cambios de contexto y proponer follow-ups oportunos.

## 2. Momentos IA clave
1. **Exploración inicial guiada**
   - Tras crear/actualizar `weddingProfile`, la IA lanza un set de preguntas sugeridas por arquetipo y vibe. Ej.: “Para bodas boho íntimas suele funcionar iluminación cálida y animación lúdica. ¿Te gustaría añadir algún elemento como toro mecánico, photobooth vintage, etc.?”
   - Clasifica cada respuesta en `specialInterests` (`mustHave`, `considerar`, `niceToHave`) o `noGoItems` (con motivo).
2. **Detección de vacíos**
   - Evalúa la completitud del perfil: categorías sin datos (entretenimiento, protocolos culturales, logística invitados especiales) o preferencias conflictivas.
   - Marca `weddingInsights.profileGaps[]` y agenda follow-ups automáticos (chat, email o notificación).
3. **Descubrimiento continuo**
   - Cada vez que el usuario acepta o rechaza una recomendación, la IA:
     - Sugiere variaciones relevantes.
     - Pregunta por motivos de rechazo para enriquecer filtros.
     - Actualiza `specialInterests`/`noGoItems` y recalcula `confidenceScore`.
     - Para ideas disruptivas solicita `motivo`, `ambito`, `nivelContraste` (`complementa`, `contraste_controlado`, `full_contraste`) y enlaza con `relacionaConStyle` y `zonaAplicacion`.
4. **Automatización operativa**
   - Para cada `specialInterests.mustHave` la IA crea:
     - Tareas en checklist (flujo 14) con responsables y deadlines sugeridos.
     - Briefings en proveedores IA (flujo 5A) con notas, presupuesto estimado y riesgos.
     - Ajustes en presupuesto (flujo 6) añadiendo partidas o actualizando valores.
   - Para `noGoItems`, marca reglas de exclusión en proveedores, inspiración y contenidos.
   - Si un interés tiene `nivelContraste` distinto de `complementa`, limita su aplicación a `zonaAplicacion`, etiqueta tareas/briefings con contexto y evita que se replique en assets globales.
5. **Consistencia y alertas**
   - Un worker diario revisa recomendaciones activas vs. preferencias, presupuesto y restricciones. Si detecta conflictos (p. ej. recomendación de toro mecánico cuando figura como “cutre”), lanza evento `recommendation_conflict` y sugiere alternativas o limpieza de datos.
   - Calcula pesos de estilo (`coreStyleWeight`, `contrasteWeight`) y genera `style_balance_alert` si el contraste supera el umbral acordado.
   - Marca entradas disruptivas como `requiresReview` y solicita confirmación antes de propagar cambios a copy global, inspiración o plantillas.
6. **Curación de tendencias**
   - Agrega insights anonimizados por arquetipo (`weddingInsights.trends`). Cuando detecta baja inspiración, propone “Ideas sorpresa” etiquetadas con nivel de riesgo y solicita confirmación antes de guardarlas.
7. **Feedback continuo**
   - Tras hitos clave (reunión con proveedor, prueba de menú, sesión de inspiración) envía micro-encuestas IA, actualiza satisfacción y ajusta prompts futuros.

## 3. Datos y eventos
- **Colecciones**: `weddingProfile`, `weddingInsights`, `recommendations`, `tasks`, `budgetAdjustments`.
- **Eventos rastreados**:
  - `preference_prompt_shown`, `preference_logged`, `preference_rejected`
  - `recommendation_conflict_detected`, `recommendation_conflict_resolved`
  - `trend_suggestion_offered`, `trend_suggestion_applied`
  - `feedback_micro_survey_sent`, `feedback_micro_survey_completed`
- **KPIs**:
  - % de bodas con `profileGaps` resueltos < 48h.
  - Ratio de recomendaciones aceptadas sin intervención manual.
  - Satisfacción media de micro-encuestas post-hito.

## 4. Integraciones
- **Flujo 2** (Descubrimiento inicial): provee datos base; este flujo coordina follow-ups.
- **Flujo 5A/14/6/8/20**: consumen tareas, briefings, presupuesto y contenidos generados automáticamente.
- **Flujo 16** (Asistente virtual): superficie primaria para lanzar prompts, resolver dudas y registrar feedback.
- **Analítica/monitorización**: dashboards que muestran embudos “preferencia capturada → acción aplicada → satisfacción”.

## 4.1 UX Recomendada
1. **Panel de exploración**
   - Modal/panel lateral “Explora tu estilo”: cards por categoría (decoración, experiencias, gastronomía, after-party) con chips `❤️ Me encanta`, `🤔 Lo consideraríamos`, `🚫 No va con nosotros`.
   - Botón “Algo distinto” abre wizard contextual (seleccionar zona, tono, intensidad) y registra contraste con `nivelContraste`, `zonaAplicacion`.
   - Tooltip IA explica por qué se sugiere cada idea y cómo encaja con el estilo base.
2. **Mapa de preferencias**
   - Visualización circular con núcleo (estilo core) y órbitas (contrastes). Cada chip muestra etiquetas `Core`, `Contraste`, `Revisión`.
   - Indicador de equilibrio (`StyleMeter`) con semáforo: verde (< límite), ámbar (cerca del límite), rojo (excedido). Tooltip resume pesos (`coreStyleWeight`, `contrasteWeight`) y tareas asociadas.
   - Acciones inline: editar zona, responsable, notas; botón “Marcar como resuelto” cuando un contraste pasa a producción.
3. **Recomendaciones accionables**
   - Checklist y proveedores muestran badges `Core`, `Contraste (After-party)`, `Revisión pendiente`.
   - Al aceptar una tarjeta de contraste se abre hoja lateral “Confirmar contraste” con resumen, tareas prellenadas, ajustes de presupuesto y CTA “Confirmar y crear”.
   - Descartes solicitan motivo rápido (menú inline); la respuesta alimenta `noGoItems` y baja el peso del contraste.
4. **Alertas y seguimiento**
   - Widget “Salud del perfil” en dashboard: lista `profileGaps`, `recommendation_conflict`, `style_balance_alert` con CTAs “Resolver ahora”.
   - Toasts IA cuando detecta contradicción (“Esta sugerencia choca con un no-go” → opciones “Revisar recomendación” / “Marcar como excepción”).
   - Historial de decisiones muestra quién aprobó cada contraste y cuándo.
5. **Asistente IA**
   - Chat mantiene memoria del estilo y propone “packs sorpresa” con tarjeta (idea + por qué encaja + esfuerzo + costo).
   - Cuando un contraste requiere revisión, el asistente genera resumen compartible (texto o PDF breve) con botón “Enviar a planning interno”.
   - Métricas visibles: `assistant_contrast_followup_sent`, `assistant_contrast_followup_resolved`.
6. **Modo QA / seeds**
   - Toggle “Ver datasets demo” (sólo entornos non-prod) que carga bodas sembradas (`seedPersonalizationProfiles`) para testear la UI.
   - Panel muestra aviso “Modo demo” y guía rápida (`docs/personalizacion/README.md`) sobre cómo limpiar/restaurar datos.

## 5. Pendientes
- Definir librería de prompts por arquetipo (tono, preguntas, ejemplos).
- Implementar workers y colas para `recommendation_conflict` y `trend_suggestion`.
- Diseñar panel interno que muestre estado de preferencias, huecos y recomendaciones en conflicto.
- Añadir suites E2E/contract tests que validen flujo completo (guardar preferencia → tarea/briefing → follow-up IA).
- Seeds y fixtures:
  - Crear datasets de ejemplo que combinen estilos base y contrastes (`minimalista + circo`, `boho + urbano nocturno`) con registros de `zonaAplicacion`, `nivelContraste`, `coreStyleWeight`.
  - Asegurar que scripts de seed insertan recomendaciones generadas, tareas, ajustes de presupuesto y eventos de conflicto/resolución para pruebas.
  - Documentar en `docs/personalizacion/README.md` cómo cargar estos escenarios antes de correr suites.
- Testing automatizado:
  - Unit tests para `RecommendationEngine` y `StyleConsistencyService` que validen cálculo de pesos, detección de conflictos y aplicación de contrastes.
  - E2E: secuencia “perfil → preferencia disruptiva → auto-tarea → conflicto detectado → resolución” tanto en UI como en asistente (flujo 16).
  - Contract tests para la API IA que aseguren prompts/outputs etiquetan correctamente `nivelContraste` y motivos.
- Asistente IA (flujo 16):
  - Diseñar storyboards de conversación con follow-ups para preferencias extremas, confirmaciones de ámbito y revisiones manuales.
  - Implementar memorias contextuales que recuerden si una preferencia está en revisión y eviten sugerirla en canales inadecuados.
  - Añadir métricas específicas (`assistant_contrast_followup_sent`, `assistant_contrast_followup_resolved`).
## Cobertura E2E implementada
- `cypress/e2e/personalization/personalization-preferences.cy.js`: recorre la creación asistida de un evento y verifica que el estilo elegido queden registrados en `preferences.style` y en el `eventProfileSummary` del documento de la boda.
