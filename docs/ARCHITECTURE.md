# Arquitectura — MyWed360

## Visión General

MyWed360 es una aplicación web React (Vite) que utiliza Firebase (Auth + Firestore) como backend primario de datos y un backend adicional (Render) para integraciones/servicios que requieren claves privadas (WhatsApp, automatizaciones, etc.). Incluye servicios externos como Mailgun (email) y OpenAI (características IA).

Componentes clave:
- Frontend: React + Vite, rutas SPA.
- Datos: Firebase Firestore (colecciones de boda, invitados, tareas, etc.).
- Autenticación: Firebase Auth.
- Backend externo: `VITE_BACKEND_BASE_URL` (Render) para endpoints REST auxiliares.
- Integraciones: Mailgun (correo), OpenAI (IA), WhatsApp Business API vía backend.

## Personalización y recomendaciones

- `WeddingContext` expone `weddingProfile` y `weddingInsights` (derivados del flujo 2).
- Hooks como `useChecklistRecommendations`, `useSupplierSuggestions` y `useBudgetAdvisor` consumen esos datos para mostrar acciones guiadas.
- El backend IA (`/api/ai/*`) recibe el perfil y devuelve sugerencias que se almacenan como `recommendations` (Firestore) o `insights` (cache local).
- Eventos analíticos (`recommendation_shown`, `recommendation_applied`) alimentan dashboards y ajustes de prompts.

## Módulos y Contextos

- `WeddingContext`: control de boda activa y datos compartidos por vistas.
- `useFirestoreCollection`: hook para colecciones (tareas, eventos, etc.).
- `SyncService`: sincronización/carga de datos (p. ej. `loadData`, estado de sync UI).
- Seating: conjunto de componentes `SeatingPlan*` y `useSeatingPlan` (DND, dibujo, exportaciones, auto-asignación).
- Tasks: `TasksRefactored.jsx` (calendar, gantt, ICS, gamificación).

## Flujo de Datos (alto nivel)

1) Usuario inicia sesión (Firebase Auth)
2) Se resuelven documentos principales en Firestore (perfil, bodas, weddingInfo)
3) Vistas consumen hooks/servicios para colecciones específicas (invitados, tareas, diseño, etc.)
4) Acciones que requieren secreto/terceros se delegan al backend en Render (vía `VITE_BACKEND_BASE_URL`)

## Integraciones Externas

- Firebase: Auth + Firestore (colecciones y reglas de seguridad)
- Mailgun: envío de emails (configuración desde UI/ajustes)
- OpenAI: funcionalidades de IA (diseño web, sugerencias, generación)
- WhatsApp Business API: envío/estado vía backend (no accesible desde el cliente directamente)

## Diagrama Lógico (texto)

Cliente (React/Vite)
  ├─ Firebase Auth
  ├─ Firestore (colecciones de boda)
  ├─ Servicios Front (SyncService, WeddingContext)
  └─ Backend Render (REST): RSVP, WhatsApp, automatizaciones
     └─ Integraciones (Mailgun, WhatsApp API, OpenAI)

