# 16. Asistente Virtual IA (estado 2025-10-07)

> Implementado: `VirtualAssistant.jsx` (chat flotante), `useVirtualAssistant` hook, integracion inicial con OpenAI (stubs), mensajes contextuales basados en `WeddingContext`.
> Pendiente: orquestador conversacional real, acciones automatizadas, telemetria completa, controles de permisos y fallback humano.

## 1. Objetivo y alcance
- Proporcionar soporte conversacional contextual dentro de la plataforma.
- Sugerir tareas, proveedores y respuestas a dudas frecuentes usando datos de la boda.
- Reducir carga de soporte y acelerar adopcion de funcionalidades clave.

## 2. Trigger y rutas
- Icono de chat flotante visible en todas las pantallas (`VirtualAssistant.jsx`).
- Shorcut teclado `Ctrl+Shift+K` (configurable) para abrir chat.
- Entradas proactivas desde notificaciones cuando se detectan bloqueos (pendiente).

## 3. Paso a paso UX
1. Apertura y contexto
   - Chat muestra mensaje de bienvenida basado en pagina actual.
   - Sugiere acciones rapidas (crear checklist, revisar presupuesto, invitar colaboradores).
   - Permite elegir tono (formal, amigable) y idioma (cuando se habilite multi-idioma).
2. Interaccion
   - Usuario escribe pregunta libre o selecciona sugerencia.
   - Backend compone contexto (pagina, rol, progreso, datos claves) antes de llamar a OpenAI.
   - Respuesta incluye enlaces a pantallas, acciones directas (crear tarea, importar invitados) y resumen textual.
3. Acciones automatizadas
   - Acciones confirmables: crear tareas, enviar recordatorios, generar prompts, buscar proveedores (con confirmacion).
   - Escenarios especiales: planificador rapido (timeline), optimizacion presupuesto, seguimiento RSVP.
   - Fallback: si no puede ayudar, ofrece abrir base de conocimiento o contactar soporte.

## 4. Persistencia y datos
- Conversaciones en `weddings/{id}/assistantSessions/{sessionId}` con mensajes, contexto, rating.
- `assistantMetrics` para agregados (uso, temas, satisfaccion) y mejoras.
- Cache temporal en sessionStorage para ultimo estado del chat.
- Configuracion por usuario en `users/{uid}/assistantPreferences` (tono, idioma, sugerencias proactivas).

## 5. Reglas de negocio
- No ejecuta acciones criticas sin confirmacion explicita del usuario.
- Rol determina alcance: assistants reciben sugerencias focalizadas; planners pueden ver datos de multiples bodas.
- Conversaciones se anonimizan antes de enviar a modelos externos.
- Respeta preferencias de privacidad (opt-out desactiva almacenamiento de historial).

## 6. Estados especiales y errores
- Sin conexion -> chat en modo solo lectura con mensaje "Intento reconectar".
- Error de OpenAI -> respuesta fallback con guia paso a paso manual.
- Solicitudes largas -> indicador typing + opcion "Notificar cuando este listo".
- Deteccion de frustracion (feedback negativo repetido) -> ofrece contacto humano.

## 7. Integracion con otros flujos
- Flujo 2/6/9 para sugerir proximos pasos tras onboarding, presupuesto o RSVP.
- Flujo 5 (Proveedores) y 8 (Sitio web) con prompts dinamicos y recomendaciones.
- Flujo 14/17 para actualizar tareas y gamificacion segun progreso sugerido.
- Flujo 20/22 para mostrar actividad reciente y recursos en dashboard.

## 8. Metricas y monitorizacion
- Eventos: `assistant_opened`, `assistant_action_executed`, `assistant_feedback_given`, `assistant_error`.
- KPIs: tasa de adopcion, sesiones por usuario, ratio de acciones confirmadas, feedback positivo.
- Logs en Cloud Functions para auditar mensajes sensibles y latencias.

## 9. Pruebas recomendadas
- Unitarias: composicion de contexto, sanitizacion de prompts, administracion de sesion.
- Integracion: disparar accion (crear tarea) y validar efectos colaterales.
- E2E: flujo ayuda presupuesto, seguimiento RSVP, fallback por error de API.

## 10. Checklist de despliegue
- Configurar `OPENAI_API_KEY`, limites de tokens y politicas de seguridad.
- Revisar trazabilidad y almacenamiento cifrado de conversaciones.
- Ajustar cuota diaria por usuario y reglas de coste.
- Preparar fallback de soporte manual (email/chat humano) antes de lanzar.

## 11. Roadmap / pendientes
- Motor de intenciones propio con memoria a largo plazo.
- Acciones automatizadas encadenadas (playbooks) con confirmaciones.
- Panel de entrenamiento con feedback humano y quick replies.
- Multidioma con traduccion en tiempo real.
- Reportes de adopcion y insights para product/operations.
