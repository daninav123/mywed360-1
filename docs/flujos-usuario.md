# Flujos de Usuario - MyWed360 (Detallado)

> **Nota**: Este documento contiene la especificación técnica general. Para detalles específicos de cada flujo, consultar los documentos en `/flujos-especificos/`

## 📋 Flujos Específicos Disponibles

1. **Flujo 3**: [Gestión de Invitados](./flujos-especificos/flujo-3-gestion-invitados.md)
2. **Flujo 4**: [Plan de Asientos](./flujos-especificos/flujo-4-plan-asientos.md)
3. **Flujo 5**: [Proveedores con IA](./flujos-especificos/flujo-5-proveedores-ia.md)
4. **Flujo 5**: [Timeline y Tareas](./flujos-especificos/flujo-5-timeline-tareas.md)
5. **Flujo 6**: [Presupuesto](./flujos-especificos/flujo-6-presupuesto.md)
6. **Flujo 7**: [Comunicación y Emails](./flujos-especificos/flujo-7-comunicacion-emails.md)
7. **Flujo 8**: [Diseño Web Personalización](./flujos-especificos/flujo-8-diseno-web-personalizacion.md)
8. **Flujo 9**: [RSVP y Confirmaciones](./flujos-especificos/flujo-9-rsvp-confirmaciones.md)
9. **Flujo 10**: [Gestión Bodas Múltiples](./flujos-especificos/flujo-10-gestion-bodas-multiples.md)
10. **Flujo 11**: [Protocolo de Ceremonias](./flujos-especificos/flujo-11-protocolo-ceremonias.md)
11. **Flujo 12**: [Notificaciones y Configuración](./flujos-especificos/flujo-12-notificaciones-configuracion.md)
12. **Flujo 13**: [Gestión de Contenido](./flujos-especificos/flujo-13-gestion-contenido.md)
13. **Flujo 14**: [Checklist Avanzado](./flujos-especificos/flujo-14-checklist-avanzado.md)
14. **Flujo 15**: [Contratos y Documentos](./flujos-especificos/flujo-15-contratos-documentos.md)
15. **Flujo 16**: [Asistente Virtual con IA](./flujos-especificos/flujo-16-asistente-virtual-ia.md)
16. **Flujo 17**: [Gamificación y Progreso](./flujos-especificos/flujo-17-gamificacion-progreso.md)
17. **Flujo 18**: [Generador de Documentos Legales](./flujos-especificos/flujo-18-generador-documentos-legales.md)

---

## 1. Flujo de Registro y Autenticación

### 1.1 Registro de Usuario
**Objetivo:** Permitir que nuevos usuarios se registren en la plataforma

**Pasos detallados:**
- [ ] **Acceso a registro**
  - Usuario hace clic en  – Registrarse –  desde landing page
  - Redirección a `/register`
  - Componente: `RegisterForm.jsx`

- [ ] **Formulario de registro**
  - Campos: email, contraseña, confirmar contraseña, nombre, apellidos
  - Validación en tiempo real (email válido, contraseña fuerte)
  - Términos y condiciones checkbox
  - Botón  – Crear cuenta – 

- [ ] **Procesamiento**
  - Llamada a Firebase Auth `createUserWithEmailAndPassword()`
  - Creación de documento en Firestore `/users/{uid}`
  - Envío de email de verificación
  - Estado: loading durante proceso

- [ ] **Verificación de email**
  - Usuario recibe email con link de verificación
  - Redirección a página de confirmación
  - Actualización de `emailVerified: true` en Firestore

- [ ] **Perfil básico**
  - Formulario adicional: teléfono, fecha de boda estimada
  - Selección de rol: novio/a, planner
  - Guardado en `/users/{uid}/profile`

- [ ] **Redirección**
  - Si email verificado → Dashboard principal
  - Si no verificado → Página  – Verifica tu email – 

**Componentes necesarios:**
- `RegisterForm.jsx`
- `EmailVerification.jsx`
- `ProfileSetup.jsx`

**APIs/Servicios:**
- Firebase Auth
- Firestore Users collection
- Email service

### 1.2 Inicio de Sesión
**Objetivo:** Autenticar usuarios existentes

**Pasos detallados:**
- [ ] **Acceso a login**
  - Usuario hace clic en  – Iniciar sesión – 
  - Redirección a `/login`
  - Componente: `LoginForm.jsx`

- [ ] **Formulario de login**
  - Campos: email, contraseña
  - Checkbox  – Recordarme – 
  - Link  – ¿Olvidaste tu contraseña? – 
  - Botón  – Iniciar sesión – 
  - Opciones sociales: Google, Facebook

- [ ] **Autenticación**
  - Llamada a Firebase Auth `signInWithEmailAndPassword()`
  - Verificación de email confirmado
  - Carga de datos de usuario desde Firestore
  - Establecimiento de contexto de autenticación

- [ ] **Redirección según rol**
  - Novio/a → `/dashboard` (vista completa)
  - Planner → `/planner-dashboard` (múltiples bodas)
  - Invitado → `/guest-view/{weddingId}` (vista limitada)

- [ ] **Persistencia de sesión**
  - Configuración de Firebase Auth persistence
  - Almacenamiento de token en localStorage/sessionStorage
  - Auto-login en próximas visitas

**Componentes necesarios:**
- `LoginForm.jsx`
- `SocialLogin.jsx`
- `AuthGuard.jsx`

### 1.3 Recuperación de Contraseña
**Objetivo:** Permitir reset de contraseña olvidada

**Pasos detallados:**
- [ ] **Solicitud de reset**
  - Usuario hace clic en  – ¿Olvidaste tu contraseña? – 
  - Redirección a `/forgot-password`
  - Formulario con campo email
  - Validación de email existente

- [ ] **Envío de email**
  - Llamada a Firebase Auth `sendPasswordResetEmail()`
  - Confirmación visual  – Email enviado – 
  - Instrucciones para revisar bandeja de entrada

- [ ] **Verificación y cambio**
  - Usuario hace clic en link del email
  - Redirección a `/reset-password?token=xxx`
  - Formulario: nueva contraseña, confirmar contraseña
  - Validación de contraseña fuerte

- [ ] **Confirmación**
  - Actualización exitosa de contraseña
  - Mensaje de confirmación
  - Redirección automática a login
  - Opción de iniciar sesión inmediatamente

**Componentes necesarios:**
- `ForgotPasswordForm.jsx`
- `ResetPasswordForm.jsx`
- `PasswordStrengthIndicator.jsx`

## 2. Flujo de Creación de Boda (Tutorial IA Conversacional)

### 2.1 Tutorial IA - Primera Experiencia
**Objetivo:** Guiar al usuario novato a través de una conversación natural para crear su boda

**Pasos detallados:**
- [ ] **Detección de usuario nuevo**
  - Al hacer login por primera vez
  - No existe ninguna boda asociada al usuario
  - Redirección automática a `/tutorial-welcome`
  - Componente: `AIWeddingTutorial.jsx`

- [ ] **Bienvenida conversacional**
  - Avatar de wedding planner IA
  - Mensaje:  – ¡Hola! Soy Sofia, tu wedding planner virtual. Te ayudaré a organizar tu boda perfecta. ¿Cómo te llamas? – 
  - Input de chat conversacional
  - Procesamiento de respuesta con OpenAI

- [ ] **Recopilación de datos básicos (conversacional)**
  - IA pregunta de forma natural:
    -  – ¿Cuál es el nombre de tu pareja? – 
    -  – ¿Ya tienen fecha para la boda o aún la están decidiendo? – 
    -  – ¿Tienen idea de dónde les gustaría celebrarla? – 
    -  – ¿Cuántos invitados aproximadamente esperan? – 
    -  – ¿Cuál es su presupuesto estimado? – 
  - Cada respuesta se procesa y almacena
  - IA adapta siguientes preguntas según respuestas

- [ ] **Asignación de email interno de la plataforma**
  - IA genera email personalizado: `ana.carlos.boda2024@mywed360.com`
  - Formato: `[nombre].[pareja].boda[año]@mywed360.com`
  - Verificación de disponibilidad del email
  - Si no está disponible, añadir número: `ana.carlos.boda2024.2@mywed360.com`
  - Presentación al usuario:  – He creado un email especial para tu boda: [email] – 
  -  – Este email te servirá para toda la comunicación relacionada con tu boda – 
  - Configuración automática de redirección a email personal
  - Almacenamiento en perfil de usuario

- [ ] **Creación implícita de boda**
  - Durante la conversación se va creando el documento en Firestore
  - `/weddings/{weddingId}` se genera automáticamente
  - Datos se van completando progresivamente
  - Usuario no ve formularios, solo conversación natural

- [ ] **Información básica (Paso 1)**
  - Nombres de los novios
  - Fecha de la boda (date picker)
  - Ubicación principal (autocomplete con Google Places)
  - Tipo de boda: religiosa, civil, simbólica
  - Estilo: clásica, moderna, rústica, etc.
  - Número estimado de invitados

- [ ] **Configuración avanzada (Paso 2)**
  - Presupuesto estimado
  - Moneda preferida
  - Idioma de la boda
  - Zona horaria
  - Código de vestimenta

- [ ] **Invitar co-organizadores (Paso 3)**
  - Campo email para invitar pareja
  - Lista de familiares/amigos organizadores
  - Definir niveles de acceso por persona
  - Envío de invitaciones por email

- [ ] **Establecer permisos (Paso 4)**
  - Matriz de permisos por rol:
    - Novio/a: acceso completo
    - Pareja: acceso completo o limitado
    - Padres: ver y editar invitados, ver presupuesto
    - Planner: acceso completo excepto finanzas
    - Amigos: solo ver lista de invitados

- [ ] **Finalización**
  - Resumen de configuración
  - Creación de documento en Firestore `/weddings/{weddingId}`
  - Generación de ID único de boda
  - Redirección a dashboard de la boda

**Estructura de datos:**
```javascript
// /weddings/{weddingId}
{
  id:  – wedding_123 – ,
  bride: { name:  – Ana – , email:  – ana@email.com –  },
  groom: { name:  – Carlos – , email:  – carlos@email.com –  },
  weddingEmail:  – ana.carlos.boda2024@mywed360.com – , // Email interno generado
  date:  – 2024-06-15 – ,
  location: {
    name:  – Hotel Majestic – ,
    address:  – Calle Mayor 123, Madrid – ,
    coordinates: { lat: 40.4168, lng: -3.7038 }
  },
  type:  – civil – ,
  style:  – moderna – ,
  estimatedGuests: 120,
  budget: 25000,
  currency:  – EUR – ,
  language:  – es – ,
  timezone:  – Europe/Madrid – ,
  dressCode:  – formal – ,
  organizers: [
    { uid:  – user1 – , role:  – bride – , permissions: [ – all – ] },
    { uid:  – user2 – , role:  – groom – , permissions: [ – all – ] }
  ],
  emailSettings: {
    forwardToPersonal: true,
    personalEmails: [ – ana@email.com – ,  – carlos@email.com – ],
    autoReply: {
      enabled: true,
      message:  – Gracias por contactarnos sobre nuestra boda. Te responderemos pronto. – 
    }
  },
  createdAt:  – 2024-01-15T10:00:00Z – ,
  updatedAt:  – 2024-01-15T10:00:00Z – 
}
```

### 2.2 Configuración de Momentos de la Boda
**Objetivo:** Definir los diferentes momentos/ceremonias que componen el día de la boda

**Pasos detallados:**
- [ ] **Definir momentos principales**
  - Lista predeterminada: ceremonia, cóctel, banquete, fiesta
  - Opción de añadir momentos personalizados
  - Cada momento tiene: nombre, tipo, obligatorio/opcional

- [ ] **Configurar ceremonia**
  - Tipo: religiosa, civil, simbólica
  - Ubicación (puede ser diferente a la principal)
  - Hora de inicio y duración estimada
  - Capacidad máxima
  - Requisitos especiales (música, decoración)

- [ ] **Configurar cóctel**
  - Ubicación (interior/exterior)
  - Duración
  - Tipo de servicio: canapés, buffet, estaciones
  - Capacidad de pie

- [ ] **Configurar banquete**
  - Ubicación del salón
  - Hora de inicio
  - Tipo de servicio: buffet, menú cerrado, estaciones
  - Distribución de mesas
  - Capacidad sentada

- [ ] **Configurar fiesta**
  - Misma ubicación que banquete o diferente
  - Hora de inicio y fin
  - Tipo de música/entretenimiento
  - Barra libre o consumición

- [ ] **Eventos adicionales**
  - Ensayo de ceremonia
  - Cena de ensayo
  - Brunch del día siguiente
  - Despedidas de soltero/a

- [ ] **Timeline general**
  - Vista cronológica de todos los eventos
  - Detección de conflictos de horario
  - Tiempo de transición entre eventos
  - Coordinación con proveedores

**Estructura de datos:**
```javascript
// /weddings/{weddingId}/moments/{momentId}
{
  id:  – ceremony_1 – ,
  name:  – Ceremonia – ,
  type:  – ceremony – ,
  required: true,
  date:  – 2024-06-15 – ,
  startTime:  – 17:00 – ,
  duration: 45, // minutos
  location: {
    name:  – Iglesia San Miguel – ,
    address:  – Plaza Mayor 1, Madrid – ,
    coordinates: { lat: 40.4168, lng: -3.7038 }
  },
  capacity: 150,
  settings: {
    ceremonyType:  – religious – ,
    musicRequired: true,
    decorationStyle:  – classic – ,
    specialRequirements: [ – altar flowers – ,  – red carpet – ]
  },
  vendors: [ – photographer_1 – ,  – musician_1 – ],
  createdAt:  – 2024-01-15T10:00:00Z – 
}
```

### 2.3 Finalización del Tutorial Básico
**Pasos detallados:**
- [ ] **Resumen de información recopilada**
  - IA presenta resumen de datos recopilados
  -  – Perfecto, ya tengo la información básica de tu boda... – 
  - Confirmación de datos por parte del usuario
  - Opción de corregir información

- [ ] **Presentación del dashboard**
  -  – Ahora te voy a mostrar tu panel de control... – 
  - Tour guiado por las diferentes secciones
  - Explicación de qué puede hacer en cada área
  - Énfasis en que puede empezar por donde prefiera

- [ ] **Elección de siguiente paso**
  -  – ¿Por dónde te gustaría empezar? – 
  - Opciones: Invitados, Presupuesto, Proveedores, Plan de Asientos, Timeline
  - Redirección a mini-tutorial de la sección elegida
  - Posibilidad de cambiar de sección en cualquier momento

**Componentes necesarios:**
- `AIWeddingTutorial.jsx`
- `ConversationalChat.jsx`
- `AIWeddingPlanner.jsx`
- `TutorialDashboard.jsx`
- `MomentConfiguration.jsx`
- `TimelineView.jsx`

**APIs/Servicios:**
- OpenAI API para conversación natural
- Speech-to-text (opcional)
- Text-to-speech (opcional)
- Firestore para almacenamiento progresivo
- Email service para creación de cuentas internas
- Domain management para subdominios @mywed360.com

## 3. Flujo de Gestión de Invitados

### 3.1 Importación de Invitados
- [ ] Importar desde CSV/Excel
- [ ] Importar desde contactos
- [ ] Añadir manualmente uno por uno
- [ ] Validación de datos

### 3.2 Organización de Invitados
- [ ] Crear grupos/categorías
- [ ] Asignar relaciones (familia, amigos, trabajo)
- [ ] Configurar restricciones dietéticas
- [ ] Gestionar acompañantes

### 3.3 Envío de Invitaciones
- [ ] Seleccionar plantilla de invitación
- [ ] Personalizar contenido
- [ ] Configurar RSVP
- [ ] Envío masivo por email/SMS
- [ ] Seguimiento de respuestas

## 4. Flujo de Plan de Asientos

### 4.1 Configuración del Espacio
- [ ] Definir dimensiones del salón
- [ ] Dibujar perímetro del espacio
- [ ] Añadir obstáculos (columnas, escenario, etc.)
- [ ] Configurar zonas especiales

### 4.2 Diseño de Mesas
- [ ] Añadir mesas (redondas/rectangulares)
- [ ] Configurar capacidad por mesa
- [ ] Posicionar mesas en el espacio
- [ ] Numerar/nombrar mesas

### 4.3 Asignación de Invitados
- [ ] Asignar invitados a mesas manualmente
- [ ] Usar asignación automática con IA
- [ ] Resolver conflictos de asignación
- [ ] Generar reportes de asientos

### 4.4 Validación y Exportación
- [ ] Verificar capacidades
- [ ] Revisar restricciones
- [ ] Exportar a PDF/imagen
- [ ] Compartir con proveedores

## 5. Flujo de Gestión de Proveedores

### 5.1 Búsqueda de Proveedores
- [ ] Buscar por categoría y ubicación
- [ ] Filtrar por presupuesto y disponibilidad
- [ ] Ver perfiles y portfolios
- [ ] Leer reseñas y valoraciones

### 5.2 Contratación
- [ ] Solicitar presupuestos
- [ ] Comparar ofertas
- [ ] Negociar términos
- [ ] Firmar contratos digitales
- [ ] Gestionar pagos

### 5.3 Seguimiento
- [ ] Comunicación con proveedores
- [ ] Seguimiento de entregas
- [ ] Gestión de cambios
- [ ] Evaluación post-evento

## 6. Flujo de Planificación y Timeline

### 6.1 Creación de Timeline
- [ ] Definir hitos importantes
- [ ] Crear cronograma detallado
- [ ] Asignar responsables
- [ ] Establecer recordatorios

### 6.2 Gestión de Tareas
- [ ] Crear listas de tareas
- [ ] Asignar prioridades
- [ ] Seguimiento de progreso
- [ ] Notificaciones automáticas

## 7. Flujo de Comunicación y Emails

### 7.1 Gestión de Emails con IA
- [ ] Recibir emails de invitados y proveedores
- [ ] Análisis automático con IA para clasificación
- [ ] Extracción de datos estructurados (fechas, importes, contactos)
- [ ] Inserción automática en módulos del sistema
- [ ] Plantillas para IA en comunicación con proveedores
- [ ] Respuestas automáticas inteligentes
- [ ] Sin reenvío a emails personales (seguridad)

### 7.2 Notificaciones Inteligentes
- [ ] Configurar preferencias por tipo de evento
- [ ] Alertas basadas en análisis IA
- [ ] Notificaciones push contextuales
- [ ] Resúmenes periódicos personalizados

## 8. Flujo de Presupuesto

### 8.1 Configuración Inicial
- [ ] Establecer presupuesto total
- [ ] Dividir por categorías
- [ ] Definir límites por concepto

### 8.2 Seguimiento de Gastos
- [ ] Registrar gastos realizados
- [ ] Comparar con presupuesto
- [ ] Alertas de límites
- [ ] Reportes financieros

## 9. Flujo de Día de la Boda

### 9.1 Coordinación
- [ ] Timeline del día
- [ ] Comunicación con equipo
- [ ] Seguimiento de proveedores
- [ ] Gestión de imprevistos

### 9.2 Check-in de Invitados
- [ ] Lista de asistencia
- [ ] Entrega de materiales
- [ ] Direccionamiento a asientos
- [ ] Gestión de cambios de última hora

## 10. Flujo Post-Boda

### 10.1 Seguimiento
- [ ] Agradecimientos a invitados
- [ ] Evaluación de proveedores
- [ ] Compartir fotos/videos
- [ ] Archivo de recuerdos

### 10.2 Análisis
- [ ] Reportes finales
- [ ] Análisis de presupuesto
- [ ] Feedback de invitados
- [ ] Lecciones aprendidas

---

## Estado de Implementación

### ✅ Completado
- Autenticación básica con Firebase
- Gestión completa de invitados (refactorizado)
- Plan de asientos completo (refactorizado en 7 componentes)
- Sistema de finanzas (refactorizado en 9 componentes)
- Gestión de emails con análisis IA
- Sistema de roles (Owner, Wedding Planner, Ayudante)
- Documentación completa (18 flujos específicos)
- Planes de suscripción definidos

### 🚧 En Desarrollo
- Diseño web con generación IA por prompts
- Sistema de proveedores (85% completado)
- RSVP avanzado con confirmaciones inteligentes
- Timeline y tareas automáticas

### ❌ Pendiente
- Invitaciones digitales avanzadas
- Sistema de contratos y documentos
- Checklist avanzado con automatización
- Protocolo de ceremonias completo
- Check-in del día de la boda

### 🔍 Requiere Investigación
- Integración con sistemas de pago
- APIs de proveedores externos
- White-label para Teams Ilimitado
- Optimización móvil avanzada

---

## Prioridades de Desarrollo

1. **Alta Prioridad**
   - Implementar generador IA de sitios web
   - Completar análisis automático de emails
   - Sistema de roles técnico completo
   - Finalizar sistema de proveedores

2. **Media Prioridad**
   - Timeline automático con IA
   - Sistema de contratos y documentos
   - Checklist avanzado
   - RSVP inteligente

3. **Baja Prioridad**
   - Funcionalidades del día de la boda
   - White-label completo
   - Análisis post-evento
   - Integraciones avanzadas
