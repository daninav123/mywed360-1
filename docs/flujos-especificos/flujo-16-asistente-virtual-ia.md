# 16. Asistente Virtual y Automatizaciones IA (estado 2025-10-07)

> Implementado hoy: `ChatWidget.jsx`, utilidades locales (memoria, notas importantes) y llamadas opcionales a `/api/ai/parse-dialog` (con fallback local contextual).  
> En desarrollo: orquestador multicanal (email/chat/WhatsApp), reglas configurables y workers backend.
> Pendiente: habilitar backend multicanal, reglas configurables, workers dedicados y cobertura E2E especifica.

## 1. Objetivo y alcance
- Ofrecer un asistente flotante que resuelva dudas y proponga acciones rápidas desde cualquier pantalla.
- Guardar contexto local (historial corto, notas marcadas como importantes) para consultas posteriores.
- Sentar las bases para automatizaciones IA futuras (respuesta automática y orquestación de acciones).
- Actuar como front principal del flujo 2C: proponer ideas sorpresa, registrar contrastes, equilibrar estilos y coordinar follow-ups multicanal.

## 2. Trigger y rutas
- Botón flotante (esquina inferior derecha) con icono de chat → abre el `ChatWidget`.
- Atajo de teclado `Ctrl + Shift + K` (configurable) para abrir/cerrar.
- No existe hoy un panel dedicado; el trabajo futuro se documentará en `/automation` cuando haya UI.

## 3. Paso a paso UX (estado actual)
1. **Apertura**
   - El widget muestra bienvenida contextual (página actual, boda activa).
   - Permite elegir tono (formal/amistoso) y conserva el estado abierto en `localStorage`.
2. **Interacción**
   - Mensajes se guardan en `chatMessages`; se limita a 50 mensajes recientes (MVP sin backend).
   - Parser local reconoce comandos básicos (crear tarea, asignar categoría sugerida) aunque muchas acciones solo generan recomendaciones.
   - Contexto IA: envía `eventType`, estilo, rango invitados, ubicación, `weddingProfile`, `specialInterests`, `noGoItems` y `weddingInsights.styleWeights` al backend para ajustar prompts y respuestas.
   - Propone “packs sorpresa” y contrastes etiquetados (Core / Contraste) con detalles de `zonaAplicacion`, `nivelContraste`, responsable sugerido y presupuesto estimado.
   - Si detecta `profileGaps`, `style_balance_alert` o `recommendation_conflict`, inicia follow-ups automáticos con CTA para resolverlos (crear tarea, abrir proveedor, ajustar presupuesto).
   - Fallback offline personalizado menciona el tipo de evento y guía rutas manuales.
3. **Notas importantes**
   - Cada mensaje puede marcarse “⭐ importante”; se guarda en `importantNotes` y dispara evento `mywed360-important-note`.
4. **Persistencia**
   - `chatSummary` almacena conversaciones compactadas.
   - Si se dispone de token (OAuth vigente) se intenta llamar a `/api/ai/parse-dialog` (con fallback local contextual); si falla, se usa fallback local con mensajes predefinidos.

## 4. Persistencia y datos
- `localStorage`: `chatOpen`, `chatMessages`, `chatSummary`, `importantNotes`.
- Firestore planificado: `weddings/{id}/assistant/conversation` con historial truncado, `assistantInsights` para almacenar packs sugeridos, `assistantFollowUps` para pendientes de contraste.
- API preferente: `POST /api/ai/parse-dialog` (OpenAI) con fallback heurístico local cuando no hay clave o hay timeout. La petición incluye `personalizationContext` (perfil, contrastes, styleWeights).
- Métricas/memoria adicional: `assistantContrastFollowups` guarda follow-ups abiertos hasta que se resuelven.

## 5. Reglas de negocio
- El asistente **no ejecuta** acciones críticas (pagos, cambios permanentes) sin confirmación manual.
- Para usuarios sin sesión activa se muestra modo “recordatorio” (no se permiten acciones).
- En modo offline se muestra aviso y el chat entra en solo lectura.\n- No propone elementos marcados como 
oGoItems; si el usuario insiste, solicita confirmación adicional y registra la excepción.

## 6. Estados especiales y errores
- `loading`: spinner mientras se espera respuesta (tanto local como remota).
- Error API → toast “No se pudo conectar, prueba de nuevo” y se mantiene el mensaje en la lista.
- Respuesta offline contextual: menciona el tipo de evento vigente y sugiere rutas manuales cuando la IA no responde.\n- Si el backend devuelve style_balance_alert o ecommendation_conflict, muestra banner con CTA (abrir presupuesto/checklist) y limita nuevas sugerencias contrastantes hasta resolver.
- Si el usuario borra `localStorage`, se reinicia la conversación (no existe recuperación).

## 7. Integración con otros flujos (hoy)
- Flujos 2/6/9: el widget usa el `eventType` y estilo actuales para sugerir próximos pasos (checklist, presupuesto, RSVP) y ajustar prompts.
- Flujo 5 (Proveedores) y 8 (Diseño web) utilizan prompts generados manualmente para guiar al usuario.
- Flujo 12 (Notificaciones) genera evento cuando se marca mensaje como importante.
- Flujo 17 (Gamificación) podría sumar puntos en futuro (aún no implementado).

## 8. Métricas y monitorización (MVP)
- Eventos básicos: `chat_opened`, `chat_message_sent`, `chat_mark_important` (registrados localmente).
- No hay agregadores centralizados; se prevé usar `assistantMetrics` en la fase de orquestador.
- Logs locales mediante `window.mywed360Debug` para diagnóstico.

## 9. Pruebas recomendadas
- Unitarias: utilidades del widget (parser de comandos, compactación, marcado importante, calculo de follow-ups y etiqueta de contrastes).
- Integración: apertura → envío mensaje → marcado importante → comprobar `localStorage`.
- E2E: flujo ayuda presupuesto (respuestas de fallback), aceptación de contraste (crea tareas/presupuesto) y recuperación tras refrescar pestaña.


## Cobertura E2E implementada
- `cypress/e2e/email/ai-provider-email.cy.js y cypress/e2e/email/smart-composer.cy.js`: ejercitan respuestas sugeridas por IA y generación de contenido que reutiliza el asistente virtual.
- `cypress/e2e/assistant/chat-fallback-context.cy.js`: fuerza fallback offline y verifica que el copy incluya datos del evento activo (tipo, estilo, ubicación).
- Cobertura e2e dedicada al asistente general pendiente.

## 10. Checklist de despliegue
- Clave `OPENAI_API_KEY` solo si el backend `/api/ai/parse-dialog` (con fallback local contextual) está habilitado.
- Revisar políticas de almacenamiento local (GDPR) y permitir al usuario limpiar historial.
- En entornos productivos, habilitar tracking de eventos antes de lanzar automatizaciones reales.

## 11. Roadmap / pendientes
- **Orquestador multicanal** (`AutomationOrchestrator`): ingerir emails, chats, WhatsApp y decidir acciones.
- **Reglas configurables**: panel para if/then (ej. “si proveedor responde con presupuesto > X → crear tarea”).
- **Workers**: procesar colas (`automationLogs`, `automationRules`) sin depender del cliente.
- **Auditoría**: panel `/automation` con historiales, posibilidad de revertir acciones y métricas (ratio automatización, reversión, latencias).
- **Integración con flujos**: generación automática de tareas (flujo 14), actualizaciones de proveedores (flujo 5), avisos en notificaciones (flujo 12).

Cuando estas piezas estén listas, se documentarán de nuevo (ver antiguo flujo 24 como referencia de visión).






