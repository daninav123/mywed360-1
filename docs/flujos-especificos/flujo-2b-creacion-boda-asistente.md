# 2B. Asistente Conversacional para Crear Bodas/Eventos � estado 2025-10-11

> Implementado: `src/pages/CreateWeddingAssistant.jsx`, rutas `/crear-evento-asistente`, servicios `createWedding`, `seedDefaultTasksForWedding`, contexto `WeddingContext`, cat�logos `config/eventStyles.js`.
> Pendiente: telemetr�a dedicada, iterar prompts/UX, habilitar m�ltiples rondas IA y consolidar con flujo cl�sico.

## 1. Objetivo y alcance
- Ofrecer una alternativa guiada mediante conversaci�n natural para registrar el primer evento.
- Recopilar los mismos datos clave del flujo 2 (tipo de evento, fecha, ubicaci�n, perfil), pero en formato di�logo libre.
- Permitir al usuario revisar y ajustar respuestas antes de confirmar la creaci�n.
- Mantener la misma persistencia y seeds que el wizard cl�sico para no duplicar l�gica.

## 2. Trigger y rutas
- Acceso manual para owners/parejas en `/crear-evento-asistente` (disponible junto al wizard cl�sico en `/crear-evento`).
- Bloqueo para planners/assistants: Card informativa + CTA Volver al panel.
- En futuras iteraciones se podr� lanzar desde CTA Habla con un asistente en dashboard/onboarding (no implementado a�n).

## 3. Paso a paso UX (chat supervisado)
1. **Bienvenida**
   - Mensaje inicial contextualiza: te har� preguntas y preparar� el evento.
   - Conversaci�n se muestra en contenedor tipo chat (`Card` con `overflow-y-auto`).
   - Ejemplo literal:
     - Asistente: _�Hola! Soy tu asistente para crear el evento. Te har� algunas preguntas r�pidas y con tus respuestas dejar� todo listo._
     - Usuario responde libremente o con botones.

2. **Recopilaci�n de datos secuenciales**
   - Preguntas din�micas (pasos) definidas en `BASE_STEPS`:
     1. Tipo de evento (`boda` | `evento`, botones r�pidos + texto libre).
     2. Nombre del evento/pareja.
     3. Fecha (valida formato `YYYY-MM-DD`).
     4. Ubicaci�n.
     5. Estilo (cat�logo).
     6. Rango de invitados.
     7. Nivel de formalidad.
     8. Tipo de ceremonia (solo bodas).
     9. Notas opcionales (se puede saltar).
   - Cada respuesta se valida: si no es v�lida, el asistente replica con ayuda contextual y no avanza de paso.
   - Ejemplos de mensajes de error:
     - Fecha inv�lida � _No pude entender la fecha. Usa el formato 2025-05-17._
     - Ubicaci�n vac�a � _Indica al menos una ciudad o zona aproximada._
     - Opci�n fuera de cat�logo � _Puedes elegir entre: Casual, Semi formal, Formal, Etiqueta / Black tie._

3. **Resumen supervisado**
   - Al completar preguntas, el asistente muestra resumen estructurado con todos los campos.
   - Controles:
     - `Cambiar respuestas`: reinicia conversaci�n (volver al paso inicial).
     - `Crear evento`: dispara creaci�n en backend.

4. **Finalizaci�n**
   - Tras crear la boda � mensaje positivo + redirecci�n a `/bodas/{id}`.
   - Errores (network, permisos) se narran dentro del chat y dejan bot�n habilitado para reintentar.

## 4. Interfaz y componentes
- `Card` principal con altura fija (7075vh) para conversaci�n.
- `messages` array con roles `assistant`/`user`, IDs �nicos creados localmente (`nextId`).
- Botonera de opciones (chips) para preguntas con cat�logo, input de texto para resto.
- Bot�n Saltar visible solo en pasos opcionales (notas).
- Scroll autom�tico al final tras cada mensaje (`messagesRef` + `useEffect`).

## 5. Persistencia y datos
- Payload enviado a `createWedding` id�ntico al wizard (campos `name`, `weddingDate`, `location`, `eventType`, `eventProfile`, `preferences.style`).
- Seeds, `eventProfileSummary`, `activeWeddingId` y colecciones asociadas funcionan igual (ver flujo 2).
- No guarda borradores: reiniciar conversaci�n limpia `form`.

## 6. Reglas de negocio y validaciones
- Acceso s�lo roles owner-like (`owner`, `pareja`, `admin`); bloqueo para el resto.
- Validadores (`stepParsers`) sanitizan entrada: opciones deben coincidir con cat�logo, fecha debe ser v�lida, ubicaci�n/nombre no vac�os.
- Si el usuario intenta enviar vac�o en paso obligatorio, no avanza.
- El asistente registra respuesta del usuario en el chat antes de pasar a la siguiente pregunta.

## 7. Integraci�n con otros flujos
- `WeddingContext` detecta nuevo evento y lo fija como activo (igual que flujo 2).
- Seeds iniciales, checklist, timeline y dem�s m�dulos se apoyan en la misma estructura (`eventProfile` y `_seed_meta`).
- Permite coexistencia: ambos flujos crean bodas id�nticas; se decidir� m�s adelante cu�l queda como principal.

## 8. M�tricas y monitorizaci�n (pendiente)
- Eventos sugeridos: `event_creation_assistant_view`, `event_creation_assistant_step_{n}`, `event_creation_assistant_summary`, `event_creation_assistant_submit`, `event_creation_assistant_success`, `event_creation_assistant_error`.
- Propiedades recomendadas: `uid`, `has_previous_wedding`, `eventType`, `guestCountRange`, `formalityLevel`, `style`, `steps_completed`.
- Registrar ratio conversi�n desde bienvenida � creaci�n (comparar con wizard cl�sico).
- Capturar `requestError` para diagn�sticos (hoy s�lo se muestra en chat).

## 9. Pruebas recomendadas
- **E2E conversaci�n feliz**:
  - Iniciar chat, responder con opciones y texto, revisar resumen, crear evento y validar navegaci�n/Firestore.
- **E2E validaciones**:
  - Introducir fecha inv�lida (ma�ana) � asistente responde con ayuda y mantiene paso.
  - Ignorar pregunta obligatoria � no avanza.
- **Roles**:
  - Usuario planner/assistant debe ver bloqueo.
- **Opcional**: comprobar bot�n Saltar en notas y reinicio con Cambiar respuestas.

## Cobertura E2E implementada
- `cypress/e2e/onboarding/assistant-conversation-happy.cy.js`: flujo feliz completo hasta crear un evento.
- `cypress/e2e/onboarding/assistant-context-switch.cy.js`: valida cambios de tema/conversaci�n sin perder respuestas previas.
- `cypress/e2e/onboarding/assistant-followups.cy.js`: comprueba registro de follow-ups y tareas sugeridas.
- `cypress/e2e/onboarding/create-event-assistant.cy.js`: smoke general del asistente y navegaci�n hacia la ficha de boda.

## 10. Checklist de despliegue
- Rutas protegidas (`/crear-evento` y `/crear-evento-asistente`) deben convivir hasta decidir unificar.
- QA: a�adir suites Cypress simulando conversaci�n (incl. branch de errores).
- Revisar copy/traducciones de preguntas y botones (ES/EN en la pr�xima iteraci�n).
- Telemetr�a pendiente (cuando se integre en analytics).

## 11. Roadmap / pendientes
- Instrumentar eventos para comparar funnels (wizard vs. asistente).
- A�adir capa IA:
  - Sugiere estilos/notas basadas en respuestas anteriores o perfil del usuario.
  - Generar mensaje de agradecimiento/introducci�n autom�tico listo para enviar a invitados.
  - Respuestas contextualizadas (ej. si fecha est� cerca, ofrecer recomendaciones de pr�ximos pasos).
- Documentar copy gu�a con propuesta de tono (cercano, propositivo, sin tecnicismos); coordinar con equipo de UX writing.
- Integrar CTA desde dashboard/onboarding y ofrecer elecci�n entre modos.
- Soporte para m�ltiples rondas (editar una respuesta concreta sin reiniciar).
- Posible merge con flujo cl�sico si el asistente demuestra mejor conversi�n.

## 12. Resumen de implementaci�n � 2025-10-11
- Nuevo componente `CreateWeddingAssistant.jsx` que modela la conversaci�n, valida respuestas y reutiliza `createWedding`.
- Rutas a�adidas: `/crear-evento` (wizard) y `/crear-evento-asistente` (chat) apuntan a componentes lazy para convivir temporalmente.
- Persistencia id�ntica al flujo 2, garantizando seeds y contexto sincronizados.

## 13. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- El asistente llama a servicios reales (`createWedding`, `seedDefaultTasksForWedding`); no existen mocks ni entorno sandbox para Cypress.
- Validaciones se implementan en `stepParsers`, pero no hay indicadores visuales (solo mensajes en chat); faltan `data-testid`.
- No se generan follow-ups autom�ticos (recordatorios/tareas) a partir de comandos; la funcionalidad est� descrita pero no implementada.
- Cambios de contexto (ej. catering � m�sica) se limitan a reiniciar flujo; no persiste respuestas parciales.

### Experiencia m�nima a construir
- Exponer capa de servicios inyectable (por ejemplo `weddingAssistantApi`) que permita stubear `createWedding` y `seed` durante tests.
- A�adir resumen estructurado con identificadores (`data-testid="assistant-summary"`) y botones que disparen eventos controlables.
- Implementar l�gica de follow-ups b�sicos (crear tarea "Llamar al proveedor X") almacenados en un arreglo visible para validaci�n.
- Guardar respuestas en un store (contexto/react state) que permita editar tema espec�fico sin reiniciar toda la conversaci�n.

### Criterios de prueba E2E propuestos
1. `assistant-conversation-happy`: simular respuestas v�lidas, interceptar creaci�n y asegurar mensaje final + redirecci�n a `/bodas/{id}` mock.
2. `assistant-context-switch`: responder a dos temas distintos, cambiar a nuevo t�pico y comprobar que el resumen conserva respuestas previas.
3. `assistant-followups`: enviar comando "recu�rdame reservar catering" y verificar que se genera tarea en lista de follow-ups con estado pendiente.

### Dependencias t�cnicas
- Mock service layer (puede usarse MSW o `window.__ASSISTANT_TEST_API__`) para controlar respuestas sin tocar Firestore.
- Fixtures de conversaci�n (`cypress/fixtures/assistant-happy.json`) para reutilizar secuencias de mensajes.
- Data-testid en botones de opci�n (`assistant-option`), input de texto (`assistant-input`) y mensajes (`assistant-message-{role}`) para asserts robustos.
