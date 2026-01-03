# 2B. Asistente Conversacional para Crear Bodas/Eventos · estado 2025-10-11

> Implementado: `src/pages/CreateWeddingAssistant.jsx`, `src/context/WeddingContext.jsx`, `src/config/eventStyles.js`, servicios en `src/services/WeddingService.js` (createWedding, seedDefaultTasksForWedding).
> Ruta principal: /crear-evento-asistente.
> Pendiente: telemetría dedicada, iterar prompts/UX, habilitar múltiples rondas IA y consolidar con flujo clásico.

## 1. Objetivo y alcance
- Ofrecer una alternativa guiada mediante conversación natural para registrar el primer evento.
- Recopilar los mismos datos clave del flujo 2 (tipo de evento, fecha, ubicación, perfil), pero en formato diálogo libre.
- Permitir al usuario revisar y ajustar respuestas antes de confirmar la creación.
- Mantener la misma persistencia y seeds que el wizard clásico para no duplicar lógica.

## 2. Trigger y rutas
- Acceso manual para owners/parejas en `/crear-evento-asistente` (disponible junto al wizard clásico en `/crear-evento`).
- Bloqueo para planners/assistants: Card informativa + CTA “Volver al panel”.
- En futuras iteraciones se podrá lanzar desde CTA “Habla con un asistente” en dashboard/onboarding (no implementado aún).

## 3. Paso a paso UX (chat supervisado)
1. **Bienvenida**
   - Mensaje inicial contextualiza: “te hará preguntas y preparará el evento”.
   - Conversación se muestra en contenedor tipo chat (`Card` con `overflow-y-auto`).
   - Ejemplo literal:
     - Asistente: _“Hola! Soy tu asistente para crear el evento. Te hará algunas preguntas rápidas y con tus respuestas dejará todo listo.”_
     - Usuario responde libremente o con botones.

2. **Recopilación de datos secuenciales**
   - Preguntas dinámicas (pasos) definidas en `BASE_STEPS`:
     1. Tipo de evento (`boda` | `evento`, botones rápidos + texto libre).
     2. Nombre del evento/pareja.
     3. Fecha (valida formato `YYYY-MM-DD`).
     4. Ubicación.
     5. Estilo (catálogo).
     6. Rango de invitados.
     7. Nivel de formalidad.
     8. Tipo de ceremonia (solo bodas).
     9. Notas opcionales (se puede “saltar”).
   - Cada respuesta se valida: si no es válida, el asistente replica con ayuda contextual y no avanza de paso.
   - Ejemplos de mensajes de error:
     - Fecha inválida → _“No pude entender la fecha. Usa el formato 2025-05-17.”_
     - Ubicación vacía → _“Indica al menos una ciudad o zona aproximada.”_
     - Opción fuera de catálogo → _“Puedes elegir entre: Casual, Semi formal, Formal, Etiqueta / Black tie.”_

3. **Resumen supervisado**
   - Al completar preguntas, el asistente muestra resumen estructurado con todos los campos.
   - Controles:
     - `Cambiar respuestas`: reinicia conversación (volver al paso inicial).
     - `Crear evento`: dispara creación en backend.

4. **Finalización**
   - Tras crear la boda → mensaje positivo + redirección a `/bodas/{id}`.
   - Errores (network, permisos) se narran dentro del chat y dejan botón habilitado para reintentar.

## 4. Interfaz y componentes
- `Card` principal con altura fija (7075vh) para conversación.
- `messages` array con roles `assistant`/`user`, IDs únicos creados localmente (`nextId`).
- Botonera de opciones (chips) para preguntas con catálogo, input de texto para resto.
- Botón “Saltar” visible solo en pasos opcionales (notas).
- Scroll automático al final tras cada mensaje (`messagesRef` + `useEffect`).

## 5. Persistencia y datos
- Payload enviado a `createWedding` idéntico al wizard (campos `name`, `weddingDate`, `location`, `eventType`, `eventProfile`, `preferences.style`).
- Seeds, `eventProfileSummary`, `activeWeddingId` y colecciones asociadas funcionan igual (ver flujo 2).
- No guarda borradores: reiniciar conversación limpia `form`.

## 6. Reglas de negocio y validaciones
- Acceso sólo roles owner-like (`owner`, `pareja`, `admin`); bloqueo para el resto.
- Validadores (`stepParsers`) sanitizan entrada: opciones deben coincidir con catálogo, fecha debe ser válida, ubicación/nombre no vacíos.
- Si el usuario intenta enviar vacío en paso obligatorio, no avanza.
- El asistente registra respuesta del usuario en el chat antes de pasar a la siguiente pregunta.

## 7. Integración con otros flujos
- `WeddingContext` detecta nuevo evento y lo fija como activo (igual que flujo 2).
- Seeds iniciales, checklist, timeline y demás módulos se apoyan en la misma estructura (`eventProfile` y `_seed_meta`).
- Permite coexistencia: ambos flujos crean bodas idénticas; se decidirá más adelante cuál queda como principal.

## 8. Métricas y monitorización (pendiente)
- Eventos sugeridos: `event_creation_assistant_view`, `event_creation_assistant_step_{n}`, `event_creation_assistant_summary`, `event_creation_assistant_submit`, `event_creation_assistant_success`, `event_creation_assistant_error`.
- Propiedades recomendadas: `uid`, `has_previous_wedding`, `eventType`, `guestCountRange`, `formalityLevel`, `style`, `steps_completed`.
- Registrar ratio conversión desde bienvenida → creación (comparar con wizard clásico).
- Capturar `requestError` para diagnósticos (hoy sólo se muestra en chat).

## 9. Pruebas recomendadas
- **E2E conversación feliz**:
  - Iniciar chat, responder con opciones y texto, revisar resumen, crear evento y validar navegación/Firestore.
- **E2E validaciones**:
  - Introducir fecha inválida (“mañana”) → asistente responde con ayuda y mantiene paso.
  - Ignorar pregunta obligatoria → no avanza.
- **Roles**:
  - Usuario planner/assistant debe ver bloqueo.
- **Opcional**: comprobar botón “Saltar” en notas y reinicio con “Cambiar respuestas”.

## Cobertura E2E implementada
- `cypress/e2e/onboarding/assistant-conversation-happy.cy.js`: flujo feliz completo hasta crear un evento.
- `cypress/e2e/onboarding/assistant-context-switch.cy.js`: valida cambios de tema/conversación sin perder respuestas previas.
- `cypress/e2e/onboarding/assistant-followups.cy.js`: comprueba registro de follow-ups y tareas sugeridas.
- `cypress/e2e/onboarding/create-event-assistant.cy.js`: smoke general del asistente y navegación hacia la ficha de boda.

## 10. Checklist de despliegue
- Rutas protegidas (`/crear-evento` y `/crear-evento-asistente`) deben convivir hasta decidir unificar.
- QA: añadir suites Cypress simulando conversación (incl. branch de errores).
- Revisar copy/traducciones de preguntas y botones (ES/EN en la próxima iteración).
- Telemetría pendiente (cuando se integre en analytics).

## 11. Roadmap / pendientes
- Instrumentar eventos para comparar funnels (wizard vs. asistente).
- Añadir capa IA:
  - Sugiere estilos/notas basadas en respuestas anteriores o perfil del usuario.
  - Generar mensaje de agradecimiento/introducción automático listo para enviar a invitados.
  - Respuestas contextualizadas (ej. si fecha está cerca, ofrecer recomendaciones de próximos pasos).
- Documentar copy guía con propuesta de tono (cercano, propositivo, sin tecnicismos); coordinar con equipo de UX writing.
- Integrar CTA desde dashboard/onboarding y ofrecer elección entre modos.
- Soporte para múltiples rondas (editar una respuesta concreta sin reiniciar).
- Posible merge con flujo clásico si el asistente demuestra mejor conversión.

## 12. Resumen de implementación → 2025-10-11
- Nuevo componente `CreateWeddingAssistant.jsx` que modela la conversación, valida respuestas y reutiliza `createWedding`.
- Rutas añadidas: `/crear-evento` (wizard) y `/crear-evento-asistente` (chat) apuntan a componentes lazy para convivir temporalmente.
- Persistencia idéntica al flujo 2, garantizando seeds y contexto sincronizados.

## 13. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- El asistente llama a servicios reales (`createWedding`, `seedDefaultTasksForWedding`); no existen mocks ni entorno sandbox para Cypress.
- Validaciones se implementan en `stepParsers`, pero no hay indicadores visuales (solo mensajes en chat); faltan `data-testid`.
- No se generan follow-ups automáticos (recordatorios/tareas) a partir de comandos; la funcionalidad está descrita pero no implementada.
- Cambios de contexto (ej. catering → música) se limitan a reiniciar flujo; no persiste respuestas parciales.

### Experiencia mínima a construir
- Exponer capa de servicios inyectable (por ejemplo `weddingAssistantApi`) que permita stubear `createWedding` y `seed` durante tests.
- Añadir resumen estructurado con identificadores (`data-testid="assistant-summary"`) y botones que disparen eventos controlables.
- Implementar lógica de follow-ups básicos (crear tarea "Llamar al proveedor X") almacenados en un arreglo visible para validación.
- Guardar respuestas en un store (contexto/react state) que permita editar tema específico sin reiniciar toda la conversación.

### Criterios de prueba E2E propuestos
1. `assistant-conversation-happy`: simular respuestas válidas, interceptar creación y asegurar mensaje final + redirección a `/bodas/{id}` mock.
2. `assistant-context-switch`: responder a dos temas distintos, cambiar a nuevo tópico y comprobar que el resumen conserva respuestas previas.
3. `assistant-followups`: enviar comando "recuérdame reservar catering" y verificar que se genera tarea en lista de follow-ups con estado pendiente.

### Dependencias técnicas
- Mock service layer (puede usarse MSW o `window.__ASSISTANT_TEST_API__`) para controlar respuestas sin tocar Firestore.
- Fixtures de conversación (`cypress/fixtures/assistant-happy.json`) para reutilizar secuencias de mensajes.
- Data-testid en botones de opción (`assistant-option`), input de texto (`assistant-input`) y mensajes (`assistant-message-{role}`) para asserts robustos.
