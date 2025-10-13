# Flujos de Usuario - MyWed360 (Detallado)

> **Nota**: Este documento contiene la especificaci�n t�cnica general. Para detalles espec�ficos de cada flujo, consultar los documentos en `/flujos-especificos/`

## ?? Flujos Espec�ficos Disponibles

0. **Flujo 0**: [Administraci�n Global](./flujos-especificos/flujo-0-administracion-global.md)
1. **Flujo 3**: [Gesti�n de Invitados](./flujos-especificos/flujo-3-gestion-invitados.md)
2. **Flujo 4**: [Invitados � Plan de Asientos y Contenido](./flujos-especificos/flujo-4-invitados-operativa.md)
3. **Flujo 5**: [Proveedores con IA](./flujos-especificos/flujo-5-proveedores-ia.md)
4. **Flujo 5**: [Timeline y Tareas](./flujos-especificos/flujo-5-timeline-tareas.md)
5. **Flujo 6**: [Presupuesto](./flujos-especificos/flujo-6-presupuesto.md)
6. **Flujo 7**: [Comunicaci�n y Emails](./flujos-especificos/flujo-7-comunicacion-emails.md)
7. **Flujo 8**: [Dise�o Web Personalizaci�n](./flujos-especificos/flujo-8-diseno-web-personalizacion.md)
8. **Flujo 9**: [RSVP y Confirmaciones](./flujos-especificos/flujo-9-rsvp-confirmaciones.md)
9. **Flujo 10**: [Gesti�n Bodas M�ltiples](./flujos-especificos/flujo-10-gestion-bodas-multiples.md)
10. **Flujo 11**: [Protocolo y Ceremonias (overview)](./flujos-especificos/flujo-11-protocolo-ceremonias.md)
11. **Flujo 11A**: [Momentos Especiales de la Boda](./flujos-especificos/flujo-11a-momentos-especiales.md)
12. **Flujo 11B**: [Timeline Global del D�a B](./flujos-especificos/flujo-11b-timeline-dia-b.md)
13. **Flujo 11C**: [Checklist de �ltima Hora](./flujos-especificos/flujo-11c-checklist-ultima-hora.md)
14. **Flujo 11D**: [Gu�a de Documentaci�n Legal](./flujos-especificos/flujo-11d-guia-documentacion-legal.md)
15. **Flujo 11E**: [Ayuda a Lecturas y Votos](./flujos-especificos/flujo-11e-ayuda-textos-ceremonia.md)
16. **Flujo 12**: [Notificaciones y Configuraci�n](./flujos-especificos/flujo-12-notificaciones-configuracion.md)
17. **Flujo 13**: Integrado en [Flujo 4](./flujos-especificos/flujo-4-invitados-operativa.md)
18. **Flujo 14**: [Checklist Avanzado](./flujos-especificos/flujo-14-checklist-avanzado.md)
19. **Flujo 15**: [Contratos y Documentos](./flujos-especificos/flujo-15-contratos-documentos.md)
20. **Flujo 16**: [Asistente Virtual con IA](./flujos-especificos/flujo-16-asistente-virtual-ia.md)
21. **Flujo 17**: [Gamificaci�n y Progreso](./flujos-especificos/flujo-17-gamificacion-progreso.md)
22. **Flujo 18**: [Generador de Documentos Legales](./flujos-especificos/flujo-18-generador-documentos-legales.md)
23. **Flujo 23**: [M�tricas del Proyecto](./flujos-especificos/flujo-23-metricas-proyecto.md)
24. **Flujo 28**: [Dashboard Wedding Planner](./flujos-especificos/flujo-28-dashboard-planner.md)
25. **Flujo 29**: [Upgrade de Rol (Owner→Assistant→Planner)](./flujos-especificos/flujo-29-upgrade-roles.md)
19. **Flujo 16**: [Orquestador IA de Automatizaciones](./flujos-especificos/flujo-16-asistente-virtual-ia.md)

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

## 2. Flujo de Creaci�n de Boda (Tutorial IA Conversacional)

### 2.1 Tutorial IA - Primera Experiencia
**Objetivo:** Guiar al usuario novato a trav�s de una conversaci�n natural para crear su boda

**Pasos detallados:**
- [ ] **Detecci�n de usuario nuevo**
  - Al hacer login por primera vez
  - No existe ninguna boda asociada al usuario
  - Redirecci�n autom�tica a `/tutorial-welcome`
  - Componente: **pendiente** (`AIWeddingTutorial.jsx` a�n no implementado)

- [ ] **Bienvenida conversacional**
  - Avatar de wedding planner IA
  - Mensaje:  � �Hola! Soy Sofia, tu wedding planner virtual. Te ayudar� a organizar tu boda perfecta. �C�mo te llamas? � 
  - Input de chat conversacional
  - Procesamiento de respuesta con OpenAI

- [ ] **Recopilaci�n de datos b�sicos (conversacional)**
  - IA pregunta de forma natural:
    -  � �Cu�l es el nombre de tu pareja? � 
    -  � �Ya tienen fecha para la boda o a�n la est�n decidiendo? � 
    -  � �Tienen idea de d�nde les gustar�a celebrarla? � 
    -  � �Cu�ntos invitados aproximadamente esperan? � 
    -  � �Cu�l es su presupuesto estimado? � 
  - Cada respuesta se procesa y almacena
  - IA adapta siguientes preguntas seg�n respuestas

- [ ] **Asignaci�n de email interno de la plataforma**
  - IA genera email personalizado: `ana.carlos.boda2024@mywed360.com`
  - Formato: `[nombre].[pareja].boda[a�o]@mywed360.com`
  - Verificaci�n de disponibilidad del email
  - Si no est� disponible, a�adir n�mero: `ana.carlos.boda2024.2@mywed360.com`
  - Presentaci�n al usuario:  � He creado un email especial para tu boda: [email] � 
  -  � Este email te servir� para toda la comunicaci�n relacionada con tu boda � 
  - Configuraci�n autom�tica de redirecci�n a email personal
  - Almacenamiento en perfil de usuario

- [ ] **Creaci�n impl�cita de boda**
  - Durante la conversaci�n se va creando el documento en Firestore
  - `/weddings/{weddingId}` se genera autom�ticamente
  - Datos se van completando progresivamente
  - Usuario no ve formularios, solo conversaci�n natural

- [ ] **Informaci�n b�sica (Paso 1)**
  - Nombres de los novios
  - Fecha de la boda (date picker)
  - Ubicaci�n principal (autocomplete con Google Places)
  - Tipo de boda: religiosa, civil, simb�lica
  - Estilo: cl�sica, moderna, r�stica, etc.
  - N�mero estimado de invitados

- [ ] **Configuraci�n avanzada (Paso 2)**
  - Presupuesto estimado
  - Moneda preferida
  - Idioma de la boda
  - Zona horaria
  - C�digo de vestimenta

- [ ] **Invitar co-organizadores (Paso 3)**
  - Campo email para invitar pareja
  - Lista de familiares/amigos organizadores
  - Definir niveles de acceso por persona
  - Env�o de invitaciones por email

- [ ] **Establecer permisos (Paso 4)**
  - Matriz de permisos por rol:
    - Novio/a: acceso completo
    - Pareja: acceso completo o limitado
    - Padres: ver y editar invitados, ver presupuesto
    - Planner: acceso completo excepto finanzas
    - Amigos: solo ver lista de invitados

- [ ] **Finalizaci�n**
  - Resumen de configuraci�n
  - Creaci�n de documento en Firestore `/weddings/{weddingId}`
  - Generaci�n de ID �nico de boda
  - Redirecci�n a dashboard de la boda

**Estructura de datos:**
```javascript
// /weddings/{weddingId}
{
  id:  � wedding_123 � ,
  bride: { name:  � Ana � , email:  � ana@email.com �  },
  groom: { name:  � Carlos � , email:  � carlos@email.com �  },
  weddingEmail:  � ana.carlos.boda2024@mywed360.com � , // Email interno generado
  date:  � 2024-06-15 � ,
  location: {
    name:  � Hotel Majestic � ,
    address:  � Calle Mayor 123, Madrid � ,
    coordinates: { lat: 40.4168, lng: -3.7038 }
  },
  type:  � civil � ,
  style:  � moderna � ,
  estimatedGuests: 120,
  budget: 25000,
  currency:  � EUR � ,
  language:  � es � ,
  timezone:  � Europe/Madrid � ,
  dressCode:  � formal � ,
  organizers: [
    { uid:  � user1 � , role:  � bride � , permissions: [ � all � ] },
    { uid:  � user2 � , role:  � groom � , permissions: [ � all � ] }
  ],
  emailSettings: {
    forwardToPersonal: true,
    personalEmails: [ � ana@email.com � ,  � carlos@email.com � ],
    autoReply: {
      enabled: true,
      message:  � Gracias por contactarnos sobre nuestra boda. Te responderemos pronto. � 
    }
  },
  createdAt:  � 2024-01-15T10:00:00Z � ,
  updatedAt:  � 2024-01-15T10:00:00Z � 
}
```

### 2.2 Configuraci�n de Momentos de la Boda
**Objetivo:** Definir los diferentes momentos/ceremonias que componen el d�a de la boda

**Pasos detallados:**
- [ ] **Definir momentos principales**
  - Lista predeterminada: ceremonia, c�ctel, banquete, fiesta
  - Opci�n de a�adir momentos personalizados
  - Cada momento tiene: nombre, tipo, obligatorio/opcional

- [ ] **Configurar ceremonia**
  - Tipo: religiosa, civil, simb�lica
  - Ubicaci�n (puede ser diferente a la principal)
  - Hora de inicio y duraci�n estimada
  - Capacidad m�xima
  - Requisitos especiales (m�sica, decoraci�n)

- [ ] **Configurar c�ctel**
  - Ubicaci�n (interior/exterior)
  - Duraci�n
  - Tipo de servicio: canap�s, buffet, estaciones
  - Capacidad de pie

- [ ] **Configurar banquete**
  - Ubicaci�n del sal�n
  - Hora de inicio
  - Tipo de servicio: buffet, men� cerrado, estaciones
  - Distribuci�n de mesas
  - Capacidad sentada

- [ ] **Configurar fiesta**
  - Misma ubicaci�n que banquete o diferente
  - Hora de inicio y fin
  - Tipo de m�sica/entretenimiento
  - Barra libre o consumici�n

- [ ] **Eventos adicionales**
  - Ensayo de ceremonia
  - Cena de ensayo
  - Brunch del d�a siguiente
  - Despedidas de soltero/a

- [ ] **Timeline general**
  - Vista cronol�gica de todos los eventos
  - Detecci�n de conflictos de horario
  - Tiempo de transici�n entre eventos
  - Coordinaci�n con proveedores

**Estructura de datos:**
```javascript
// /weddings/{weddingId}/moments/{momentId}
{
  id:  � ceremony_1 � ,
  name:  � Ceremonia � ,
  type:  � ceremony � ,
  required: true,
  date:  � 2024-06-15 � ,
  startTime:  � 17:00 � ,
  duration: 45, // minutos
  location: {
    name:  � Iglesia San Miguel � ,
    address:  � Plaza Mayor 1, Madrid � ,
    coordinates: { lat: 40.4168, lng: -3.7038 }
  },
  capacity: 150,
  settings: {
    ceremonyType:  � religious � ,
    musicRequired: true,
    decorationStyle:  � classic � ,
    specialRequirements: [ � altar flowers � ,  � red carpet � ]
  },
  vendors: [ � photographer_1 � ,  � musician_1 � ],
  createdAt:  � 2024-01-15T10:00:00Z � 
}
```

### 2.3 Finalizaci�n del Tutorial B�sico
**Pasos detallados:**
- [ ] **Resumen de informaci�n recopilada**
  - IA presenta resumen de datos recopilados
  -  � Perfecto, ya tengo la informaci�n b�sica de tu boda... � 
  - Confirmaci�n de datos por parte del usuario
  - Opci�n de corregir informaci�n

- [ ] **Presentaci�n del dashboard**
  -  � Ahora te voy a mostrar tu panel de control... � 
  - Tour guiado por las diferentes secciones
  - Explicaci�n de qu� puede hacer en cada �rea
  - �nfasis en que puede empezar por donde prefiera

- [ ] **Elecci�n de siguiente paso**
  -  � �Por d�nde te gustar�a empezar? � 
  - Opciones: Invitados, Presupuesto, Proveedores, Plan de Asientos, Timeline
  - Redirecci�n a mini-tutorial de la secci�n elegida
  - Posibilidad de cambiar de secci�n en cualquier momento

**Componentes necesarios:**
- `AIWeddingTutorial.jsx`
- `ConversationalChat.jsx`
- `AIWeddingPlanner.jsx`
- `TutorialDashboard.jsx`
- `MomentConfiguration.jsx`
- `TimelineView.jsx`

**APIs/Servicios:**
- OpenAI API para conversaci�n natural
- Speech-to-text (opcional)
- Text-to-speech (opcional)
- Firestore para almacenamiento progresivo
- Email service para creaci�n de cuentas internas
- Domain management para subdominios @mywed360.com

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
