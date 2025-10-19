# Flujos de Usuario - MyWed360 (Detallado)

> **Nota**: Este documento contiene la especificaci�n t�cnica general. Para detalles espec�ficos de cada flujo, consultar los documentos en `/flujos-especificos/`

## ?? Flujos Espec�ficos Disponibles

- **Flujo 0**: [Administraci�n Global](./flujos-especificos/flujo-0-administracion-global.md)
- **Flujo 1**: [Registro y Autenticaci�n](./flujos-usuario.md#1-flujo-de-registro-y-autenticaci�n)
- **Flujo 2**: [Descubrimiento Personalizado de la Boda](./flujos-especificos/flujo-2-descubrimiento-personalizado.md)
- **Flujo 3**: [Gesti�n de Invitados](./flujos-especificos/flujo-3-gestion-invitados.md)
- **Flujo 4**: [Invitados � Plan de Asientos y Contenido](./flujos-especificos/flujo-4-invitados-operativa.md)
- **Flujo 5A**: [Proveedores con IA](./flujos-especificos/flujo-5-proveedores-ia.md)
- **Flujo 5B**: [Timeline y Tareas](./flujos-especificos/flujo-5-timeline-tareas.md)
- **Flujo 6**: [Presupuesto](./flujos-especificos/flujo-6-presupuesto.md)
- **Flujo 7**: [Comunicaci�n y Emails](./flujos-especificos/flujo-7-comunicacion-emails.md)
- **Flujo 8**: [Dise�o Web Personalizaci�n](./flujos-especificos/flujo-8-diseno-web-personalizacion.md)
- **Flujo 9**: [RSVP y Confirmaciones](./flujos-especificos/flujo-9-rsvp-confirmaciones.md)
- **Flujo 10**: [Gesti�n Bodas M�ltiples](./flujos-especificos/flujo-10-gestion-bodas-multiples.md)
- **Flujo 11**: [Protocolo y Ceremonias (overview)](./flujos-especificos/flujo-11-protocolo-ceremonias.md)
- **Flujo 11A**: [Momentos Especiales de la Boda](./flujos-especificos/flujo-11a-momentos-especiales.md)
- **Flujo 11B**: [Timeline Global del D�a B](./flujos-especificos/flujo-11b-timeline-dia-b.md)
- **Flujo 11C**: [Checklist de �ltima Hora](./flujos-especificos/flujo-11c-checklist-ultima-hora.md)
- **Flujo 11D**: [Gu�a de Documentaci�n Legal](./flujos-especificos/flujo-11d-guia-documentacion-legal.md)
- **Flujo 11E**: [Ayuda a Lecturas y Votos](./flujos-especificos/flujo-11e-ayuda-textos-ceremonia.md)
- **Flujo 12**: [Notificaciones y Configuraci�n](./flujos-especificos/flujo-12-notificaciones-configuracion.md)
- **Flujo 13**: Integrado en [Flujo 4](./flujos-especificos/flujo-4-invitados-operativa.md)
- **Flujo 14**: [Checklist Avanzado](./flujos-especificos/flujo-14-checklist-avanzado.md)
- **Flujo 15**: [Contratos y Documentos](./flujos-especificos/flujo-15-contratos-documentos.md)
- **Flujo 16**: [Asistente Virtual con IA y Orquestador](./flujos-especificos/flujo-16-asistente-virtual-ia.md)
- **Flujo 17**: [Gamificaci�n y Progreso](./flujos-especificos/flujo-17-gamificacion-progreso.md)
- **Flujo 18**: [Generador de Documentos Legales](./flujos-especificos/flujo-18-generador-documentos-legales.md)
- **Flujo 19**: [Dise�o de Invitaciones](./flujos-especificos/flujo-19-diseno-invitaciones.md)
- **Flujo 20**: [Email Inbox Global](./flujos-especificos/flujo-20-email-inbox.md)
- **Flujo 21**: [Sitio P�blico](./flujos-especificos/flujo-21-sitio-publico.md)
- **Flujo 22**: [Dashboard Wedding Planner](./flujos-especificos/flujo-28-dashboard-planner.md)
- **Flujo 23**: [M�tricas del Proyecto](./flujos-especificos/flujo-23-metricas-proyecto.md)
- **Flujo 24**: [Galer�a de Inspiraci�n](./flujos-especificos/flujo-24-galeria-inspiracion.md)
- **Flujo 25**: [Planes y Suscripciones](./flujos-especificos/flujo-25-suscripciones.md)
- **Flujo 26**: [Blog e Inspiraci�n Editorial](./flujos-especificos/flujo-26-blog.md)
- **Flujo 27**: [Momentos y Recuerdos](./flujos-especificos/flujo-27-momentos.md)
- **Flujo 28**: [Upgrade de Rol (Owner→Assistant→Planner)](./flujos-especificos/flujo-29-upgrade-roles.md)

---

## 1. Flujo de Registro y Autenticaci�n

### 1.1 Registro de Usuario
**Objetivo:** Permitir que nuevos usuarios se registren en la plataforma

**Pasos detallados:**
- [ ] **Acceso a registro**
  - Usuario hace clic en  � Registrarse �  desde landing page
  - Redirecci�n a `/register`
  - Componente: `RegisterForm.jsx`

- [ ] **Formulario de registro**
  - Campos: email, contrase�a, confirmar contrase�a, nombre, apellidos
  - Validaci�n en tiempo real (email v�lido, contrase�a fuerte)
  - T�rminos y condiciones checkbox
  - Bot�n  � Crear cuenta � 

- [ ] **Procesamiento**
  - Llamada a Firebase Auth `createUserWithEmailAndPassword()`
  - Creaci�n de documento en Firestore `/users/{uid}`
  - Env�o de email de verificaci�n
  - Estado: loading durante proceso

- [ ] **Verificaci�n de email**
  - Usuario recibe email con link de verificaci�n
  - Redirecci�n a p�gina de confirmaci�n
  - Actualizaci�n de `emailVerified: true` en Firestore

- [ ] **Perfil b�sico**
  - Formulario adicional: tel�fono, fecha de boda estimada
  - Selecci�n de rol: novio/a, planner
  - Guardado en `/users/{uid}/profile`

- [ ] **Redirecci�n**
  - Si email verificado ? Dashboard principal
  - Si no verificado ? P�gina  � Verifica tu email � 

**Componentes necesarios:**
- `RegisterForm.jsx`
- `EmailVerification.jsx`
- `ProfileSetup.jsx`

**APIs/Servicios:**
- Firebase Auth
- Firestore Users collection
- Email service

### 1.2 Inicio de Sesi�n
**Objetivo:** Autenticar usuarios existentes

**Pasos detallados:**
- [ ] **Acceso a login**
  - Usuario hace clic en  � Iniciar sesi�n � 
  - Redirecci�n a `/login`
  - Componente: `LoginForm.jsx`

- [ ] **Formulario de login**
  - Campos: email, contrase�a
  - Checkbox  � Recordarme � 
  - Link  � �Olvidaste tu contrase�a? � 
  - Bot�n  � Iniciar sesi�n � 
  - Opciones sociales: Google, Facebook

- [ ] **Autenticaci�n**
  - Llamada a Firebase Auth `signInWithEmailAndPassword()`
  - Verificaci�n de email confirmado
  - Carga de datos de usuario desde Firestore
  - Establecimiento de contexto de autenticaci�n

- [ ] **Redirecci�n seg�n rol**
  - Novio/a ? `/dashboard` (vista completa)
  - Planner ? `/planner-dashboard` (m�ltiples bodas)
  - Invitado ? *no accede a la app; toda la interacci�n se realiza v�a invitaciones y comunicaciones externas*

- [ ] **Persistencia de sesi�n**
  - Configuraci�n de Firebase Auth persistence
  - Almacenamiento de token en localStorage/sessionStorage
  - Auto-login en pr�ximas visitas

**Componentes necesarios:**
- `LoginForm.jsx`
- `SocialLogin.jsx`
- `AuthGuard.jsx`

### 1.3 Recuperaci�n de Contrase�a
**Objetivo:** Permitir reset de contrase�a olvidada

**Pasos detallados:**
- [ ] **Solicitud de reset**
  - Usuario hace clic en  � �Olvidaste tu contrase�a? � 
  - Redirecci�n a `/forgot-password`
  - Formulario con campo email
  - Validaci�n de email existente

- [ ] **Env�o de email**
  - Llamada a Firebase Auth `sendPasswordResetEmail()`
  - Confirmaci�n visual  � Email enviado � 
  - Instrucciones para revisar bandeja de entrada

- [ ] **Verificaci�n y cambio**
  - Usuario hace clic en link del email
  - Redirecci�n a `/reset-password?token=xxx`
  - Formulario: nueva contrase�a, confirmar contrase�a
  - Validaci�n de contrase�a fuerte

- [ ] **Confirmaci�n**
  - Actualizaci�n exitosa de contrase�a
  - Mensaje de confirmaci�n
  - Redirecci�n autom�tica a login
  - Opci�n de iniciar sesi�n inmediatamente

**Componentes necesarios:**
- `ForgotPasswordForm.jsx`
- `ResetPasswordForm.jsx`
- `PasswordStrengthIndicator.jsx`

## 2. Flujo de Descubrimiento Personalizado (Onboarding IA)

> Referencia detallada en `docs/flujos-especificos/flujo-2-descubrimiento-personalizado.md`.

### 2.1 Bienvenida contextual
**Objetivo:** Presentar al usuario la promesa de acompanamiento personalizado y explicar el uso de sus respuestas.

- Triggers principales:
  - Usuario sin bodas asociadas se redirige a `/onboarding/discovery` tras el login.
  - Planner o agencia selecciona "Agregar nueva boda" y abre el flujo en modal.
- UX:
  - Avatar planner IA + copy empatico (ver `docs/personalizacion/tono-mensajes.md`).
  - Si el perfil existe, se muestra resumen editable antes de continuar.

### 2.2 Captura del perfil de boda
**Objetivo:** Construir `weddingProfile` con estilo, prioridades y restricciones.

- **Datos base:** `eventType`, ubicacion objetivo, rango de fecha, tamano estimado de invitados.
- **Estilo y vibe:** seleccion multiopcion + texto libre (`stylePrimary`, `styleSecondary`, `vibeKeywords`).
- **Prioridades:** checklist de areas clave (`priorityAreas`) con ranking corto.
- **Restricciones:** presupuesto (`budgetRange`), accesibilidad, dietas, rituales especiales.
- **Momentos destacados:** captura inicial de `specialMoments` con responsable y notas.
- **Preferencias de comunicacion:** canal preferido e idioma para recomendaciones futuras.
- Auto-guardado en draft tras cada paso para evitar perdida de informacion.

### 2.3 Confirmacion y recomendaciones iniciales
**Objetivo:** Mostrar el resumen editable y activar recomendaciones guiadas.

- Resumen editable con indicadores de confianza (`confidenceScore`).
- Generacion inicial de:
  - Checklist sugerido (flujo 14) en estado `suggested`.
  - Proveedores destacados (flujo 5A) filtrados por estilo/presupuesto.
  - Plan presupuestario base (flujo 6) con alertas si hay desalineacion.
  - Contenido generado (flujos 8 y 20) alineado al tono seleccionado.
- CTA: "Aplicar todo", "Revisar" o "Modificar perfil".
- Emision de eventos: `recommendation_shown`, `recommendation_applied`, `profile_field_edited`.

### 2.4 Persistencia y servicios
- `weddings/{id}/weddingProfile` y `weddings/{id}/weddingInsights` (ver `docs/DATA_MODEL.md`).
- `weddings/{id}/recommendations` almacena destino, origen (IA/manual) y estado (`suggested|applied|dismissed`).
- Hooks clave: `useWeddingProfile`, `useRecommendationEngine`, `useConfidenceScore`.
- Backend `/api/ai/parse-dialog` procesa inferencias; fallback local en `RecommendationService`.

### 2.5 Metricas y QA
- Funnel: `discovery_started`, `discovery_completed`, `discovery_abandoned_step`.
- KPI: porcentaje de perfiles completos, confianza media, ratio de recomendaciones aplicadas.
- Pruebas:
  - Unitarias: validacion de campos, normalizacion de datos, calculo de confianza.
  - Integracion: completar onboarding y verificar datos en Firestore + recomendaciones disponibles.
  - E2E pendiente: `cypress/e2e/onboarding/discovery-personalized.cy.js`.

## 3. Flujo de Gesti�n de Invitados

### 3.1 Importaci�n de Invitados
- [ ] Importar desde CSV/Excel
- [ ] Importar desde contactos
- [ ] A�adir manualmente uno por uno
- [ ] Validaci�n de datos

### 3.2 Organizaci�n de Invitados
- [ ] Crear grupos/categor�as
- [ ] Asignar relaciones (familia, amigos, trabajo)
- [ ] Configurar restricciones diet�ticas
- [ ] Gestionar acompa�antes

### 3.3 Env�o de Invitaciones
- [ ] Seleccionar plantilla de invitaci�n
- [ ] Personalizar contenido
- [ ] Configurar RSVP
- [ ] Env�o masivo por email/SMS
- [ ] Seguimiento de respuestas

## 4. Flujo de Plan de Asientos

### 4.1 Configuraci�n del Espacio
- [ ] Definir dimensiones del sal�n
- [ ] Dibujar per�metro del espacio
- [ ] A�adir obst�culos (columnas, escenario, etc.)
- [ ] Configurar zonas especiales

### 4.2 Dise�o de Mesas
- [ ] A�adir mesas (redondas/rectangulares)
- [ ] Configurar capacidad por mesa
- [ ] Posicionar mesas en el espacio
- [ ] Numerar/nombrar mesas

### 4.3 Asignaci�n de Invitados
- [ ] Asignar invitados a mesas manualmente
- [ ] Usar asignaci�n autom�tica con IA
- [ ] Resolver conflictos de asignaci�n
- [ ] Generar reportes de asientos

### 4.4 Validaci�n y Exportaci�n
- [ ] Verificar capacidades
- [ ] Revisar restricciones
- [ ] Exportar a PDF/imagen
- [ ] Compartir con proveedores

## 5. Flujo de Gesti�n de Proveedores

### 5.1 B�squeda de Proveedores
- [ ] Buscar por categor�a y ubicaci�n
- [ ] Filtrar por presupuesto y disponibilidad
- [ ] Ver perfiles y portfolios
- [ ] Leer rese�as y valoraciones

### 5.2 Contrataci�n
- [ ] Solicitar presupuestos
- [ ] Comparar ofertas
- [ ] Negociar t�rminos
- [ ] Firmar contratos digitales
- [ ] Gestionar pagos

### 5.3 Seguimiento
- [ ] Comunicaci�n con proveedores
- [ ] Seguimiento de entregas
- [ ] Gesti�n de cambios
- [ ] Evaluaci�n post-evento

## 6. Flujo de Planificaci�n y Timeline

### 6.1 Creaci�n de Timeline
- [ ] Definir hitos importantes
- [ ] Crear cronograma detallado
- [ ] Asignar responsables
- [ ] Establecer recordatorios

### 6.2 Gesti�n de Tareas
- [ ] Crear listas de tareas
- [ ] Asignar prioridades
- [ ] Seguimiento de progreso
- [ ] Notificaciones autom�ticas

## 7. Flujo de Comunicaci�n y Emails

### 7.1 Gesti�n de Emails con IA
- [ ] Recibir emails de invitados y proveedores
- [ ] An�lisis autom�tico con IA para clasificaci�n
- [ ] Extracci�n de datos estructurados (fechas, importes, contactos)
- [ ] Inserci�n autom�tica en m�dulos del sistema
- [ ] Plantillas para IA en comunicaci�n con proveedores
- [ ] Respuestas autom�ticas inteligentes
- [ ] Sin reenv�o a emails personales (seguridad)

### 7.2 Notificaciones Inteligentes
- [ ] Configurar preferencias por tipo de evento
- [ ] Alertas basadas en an�lisis IA
- [ ] Notificaciones push contextuales
- [ ] Res�menes peri�dicos personalizados

## 8. Flujo de Presupuesto

### 8.1 Configuraci�n Inicial
- [ ] Establecer presupuesto total
- [ ] Dividir por categor�as
- [ ] Definir l�mites por concepto

### 8.2 Seguimiento de Gastos
- [ ] Registrar gastos realizados
- [ ] Comparar con presupuesto
- [ ] Alertas de l�mites
- [ ] Reportes financieros

## 9. Flujo de D�a de la Boda

### 9.1 Coordinaci�n
- [ ] Timeline del d�a
- [ ] Comunicaci�n con equipo
- [ ] Seguimiento de proveedores
- [ ] Gesti�n de imprevistos

### 9.2 Check-in de Invitados
- [ ] Lista de asistencia
- [ ] Entrega de materiales
- [ ] Direccionamiento a asientos
- [ ] Gesti�n de cambios de �ltima hora

## 10. Flujo Post-Boda

### 10.1 Seguimiento
- [ ] Agradecimientos a invitados
- [ ] Evaluaci�n de proveedores
- [ ] Compartir fotos/videos
- [ ] Archivo de recuerdos

### 10.2 An�lisis
- [ ] Reportes finales
- [ ] An�lisis de presupuesto
- [ ] Feedback de invitados
- [ ] Lecciones aprendidas

---

## Estado de implementaci�n (resumen 2025-10-08)

| Flujo | Estado | Pendiente principal |
|-------|--------|---------------------|
| 0. Administraci�n global | No (pendiente) | Cerrar alcance t�cnico y endurecer seguridad del backoffice admin |
| 1. Registro / autenticaci�n | S� (en curso) | M�tricas de sign-up/login, refactor de formularios legacy y auditor�a de accesibilidad |
| 2. Creaci�n de boda con IA | S� (en curso) | Opt-in planner, telemetr�a completa del funnel, migraci�n a `/eventos` e IA contextual |
| 3. Gesti�n de invitados | S� (en curso) | Dashboard anal�tico de RSVP, check-in el d�a del evento y sync autom�tica con Seating Plan |
| 4. Invitados � operativo | S� (en curso) | Panel inteligente con IA, automatizaci�n documental y revisi�n de accesibilidad |
| 5a. Proveedores IA | S� (en curso) | Scoring IA consolidado, portal proveedor completo, RFQ multi-proveedor y reportes |
| 5b. Timeline / tareas | S� (en curso) | Motor IA para plan maestro y matriz de responsabilidades |
| 6. Finanzas / presupuesto | S� (en curso) | Importaci�n CSV/Excel, anal�tica predictiva, aportaciones colaborativas y reportes avanzados |
| 7. Emails & IA | S� (en curso) | B�squeda/ordenaci�n, carpetas personalizadas, clasificador backend y env�os programados |
| 8. Dise�o web | S� (en curso) | Ejecutar IA desde backend, prompts editables, dominios personalizados y anal�tica de sitios |
| 9. RSVP | S� (en curso) | Confirmaciones grupales, recordatorios multicanal, anal�tica e integraci�n con catering |
| 10. Bodas m�ltiples | S� (en curso) | Integraci�n CRM externa y activity feed multi-boda |
| 11.x Protocolo y ceremonias | S� (completado) | � |
| 12. Notificaciones | S� (en curso) | AutomationRules UI, push/SMS completos y centro de notificaciones final |
| 13b. Tests Seating Plan | S� (en curso) | Extender cobertura a escenarios futuros (ceremonia avanzada, seating h�brido) |
| 14. Checklist avanzado | S� (en curso) | Generaci�n IA, dependencias, gamificaci�n y plantillas compartidas |
| 15. Contratos y documentos | S� (en curso) | Firma digital integrada, workflows de aprobaci�n y anal�tica legal |
| 16. Asistente virtual IA | No (pendiente) | Orquestador multicanal, reglas configurables y workers backend |
| 17. Gamificaci�n | No (pendiente) | Niveles, logros, retos, recompensas y panel de analytics |
| 18. Generador documentos legales | S� (en curso) | Repositorio completo, firma electr�nica, almacenamiento backend y automatizaci�n IA |
| 19. Dise�o de invitaciones | S� (en curso) | Tutoriales guiados, colaboraci�n/feedback, integraci�n con impresi�n y generaci�n IA |
| 20. Email inbox global | S� (en curso) | Experiencia unificada, documentaci�n APIs backend, onboarding centralizado y telemetr�a |
| 21. Sitio p�blico | S� (en curso) | Personalizaci�n avanzada, dominios propios, SEO/analytics y medici�n de conversi�n |
| 22. Dashboard & navegaci�n | S� (en curso) | Dashboard en vivo, proteger herramientas internas y actividad reciente |
| 23. M�tricas del proyecto | S� (en curso) | Dashboard multi-m�dulo, workers de agregaci�n y rutas `/analytics/*` |

> Referencia cruzada: ver `docs/FLUJOS-INDICE.md` para el detalle completo y enlaces a cada flujo.

## Pr�ximos focos sugeridos

- **Backoffice y automatizaciones**: cerrar flujo 0 (administraci�n) y 16 (asistente/automatizaciones) para operar IA multicanal con seguridad.
- **Experiencias IA completadas**: concluir pendientes de los flujos 5a/5b/6/7/8 para que proveedores, tareas, finanzas, emails y sitios web sean 100?% productivos.
- **Engagement y anal�tica**: priorizar gamificaci�n (17), m�tricas unificadas (23) y mejoras de dashboard (22) para medir adopci�n y mantener usuarios activos.
- **Documentaci�n legal y contratos**: finalizar los gaps cr�ticos de flujos 15 y 18 para soportar firma electr�nica e integraciones de cumplimiento.

