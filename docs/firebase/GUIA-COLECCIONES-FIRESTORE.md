# 📚 GUÍA COMPLETA: COLECCIONES FIRESTORE

**Fecha:** 2025-10-28  
**Total colecciones:** 19  
**Documentación de cada colección en el sistema**

---

## 📊 VISTA GENERAL

```
Total: 19 colecciones root
├─ 3 documentos en users
├─ 3 documentos en weddings  
├─ 42 documentos en adminSessions
└─ Otras colecciones auxiliares
```

---

## 👤 USUARIOS

### **`users/`** (3 docs)
**Propósito:** Almacena información de los usuarios registrados

**Campos principales:**
- `uid` - ID único del usuario (Firebase Auth)
- `email` - Email principal
- `myWed360Email` - Email personalizado @malove.app
- `displayName` - Nombre para mostrar
- `photoURL` - Avatar del usuario
- `emailVerified` - Si el email está verificado
- `onboardingCompleted` - Si completó el onboarding
- `createdAt` - Fecha de registro

**Subcollections:**
- `users/{uid}/emails/` - Emails del usuario
- `users/{uid}/weddings/` - Bodas del usuario (referencia)
- `users/{uid}/notifications/` - Notificaciones

**Uso:**
- Login y autenticación
- Perfil de usuario
- Gestión de cuenta

---

## 💒 BODAS

### **`weddings/`** (3 docs)
**Propósito:** Almacena toda la información de las bodas

**Campos principales:**
- `name` - Nombres de los novios
- `weddingDate` - Fecha de la boda
- `ownerIds` - Array de UIDs de los propietarios (novios)
- `plannerIds` - Array de UIDs de wedding planners
- `weddingInfo` - Información adicional (lugar, estilo, etc.)
- `subscription` - Plan de suscripción activo
- `wantedServices` - Servicios que necesitan contratar

**Subcollections:**
- `weddings/{id}/guests/` - Invitados
- `weddings/{id}/tasks/` - Lista de tareas
- `weddings/{id}/suppliers/` - Proveedores contratados
- `weddings/{id}/finance/` - Finanzas y presupuesto
- `weddings/{id}/emailSettings/` - Configuración de email
- `weddings/{id}/automation/` - Reglas de automatización
- `weddings/{id}/metrics/` - Métricas de la boda

**Uso:**
- Core del negocio
- Gestión completa de la boda
- Datos compartidos entre novios y planners

---

## 🎯 PROVEEDORES

### **`suppliers/`** (0 docs actualmente)
**Propósito:** Catálogo de proveedores disponibles

**Estructura esperada:**
```
suppliers/{supplierId}/
  ├─ profile/           # Perfil del proveedor
  ├─ portfolio/         # Portfolio de trabajos
  ├─ reviews/           # Reseñas de clientes
  ├─ pricing/           # Paquetes y precios
  └─ analytics/         # Analítica
      └─ events/
          └─ log/       # Eventos (clicks, views, contacts)
```

**Uso:**
- Buscador de proveedores
- Perfiles públicos
- Tracking de interacciones
- Reseñas y valoraciones

**Nota:** Actualmente vacía porque se limpió en la migración. Los proveedores reales se obtienen de internet (Tavily API).

---

## 🔐 ADMINISTRACIÓN

### **`adminSessions/`** (42 docs)
**Propósito:** Sesiones activas de administradores

**Campos:**
- `sessionId` - ID único de la sesión
- `sessionToken` - Token de autenticación
- `email` - Email del admin
- `profile` - Datos del perfil
- `createdAt` - Fecha de inicio de sesión
- `expiresAt` - Fecha de expiración
- `updatedAt` - Última actividad

**Uso:**
- Autenticación de panel admin
- Control de sesiones
- Seguridad y auditoría

---

### **`adminTaskTemplates/`** (1 doc)
**Propósito:** Plantillas de tareas para bodas

**Campos:**
- `name` - Nombre de la plantilla
- `version` - Versión de la plantilla
- `status` - Estado (draft, published)
- `blocks` - Bloques de tareas organizadas
- `totals` - Totales calculados
- `publishedAt` - Fecha de publicación
- `updatedBy` - Quién la actualizó

**Uso:**
- Plantillas predefinidas de tareas
- Onboarding de nuevas bodas
- Acelerar setup inicial

---

### **`adminTrustedDevices/`** (1 doc)
**Propósito:** Dispositivos confiables de administradores

**Campos:**
- `deviceId` - ID del dispositivo
- `fingerprint` - Huella digital única
- `email` - Email asociado
- `trusted` - Si está marcado como confiable
- `browser` - Navegador usado
- `os` - Sistema operativo
- `ipAddress` - IP del dispositivo
- `userAgent` - User agent completo

**Uso:**
- Seguridad 2FA
- Reconocer dispositivos conocidos
- Evitar re-autenticaciones

---

## 📧 EMAIL

### **`emailAutomationState/`** (1 doc)
**Propósito:** Estado de la automatización de emails

**Campos:**
- `classifications` - Clasificaciones automáticas
- `updatedAt` - Última actualización

**Uso:**
- Estado global de automatización
- Tracking de clasificaciones IA
- Métricas de procesamiento

---

### **`emailInsights/`** (35 docs)
**Propósito:** Análisis e insights de emails individuales

**Campos:**
- `mailId` - ID del email analizado
- `classification` - Clasificación del email (spam, importante, etc.)

**Uso:**
- IA de clasificación de emails
- Filtrado inteligente
- Priorización de inbox

---

### **`emailUsernames/`** (1 doc)
**Propósito:** Mapeo de usernames de email personalizados

**Campos:**
- `userId` - ID del usuario
- `email` - Email personalizado @malove.app
- `createdAt` - Fecha de creación

**Uso:**
- Gestión de emails @malove.app
- Evitar duplicados
- Routing de emails

---

## 🤖 INTELIGENCIA ARTIFICIAL

### **`aiParsedDialogs/`** (1 doc)
**Propósito:** Diálogos procesados por IA

**Campos:**
- `text` - Texto original
- `extracted` - Información extraída
- `reply` - Respuesta generada por IA
- `createdAt` - Fecha de procesamiento

**Uso:**
- Procesamiento NLP
- Respuestas automáticas
- Extracción de intenciones

---

## 📊 ANALÍTICA

### **`searchAnalytics/`** (13 docs)
**Propósito:** Analítica de búsquedas de proveedores

**Campos:**
- `query` - Búsqueda realizada
- `service` - Servicio buscado
- `location` - Ubicación de la búsqueda
- `filters` - Filtros aplicados
- `user_id` - Usuario que buscó
- `wedding_id` - Boda asociada
- `keywords` - Keywords extraídos
- `keyword_count` - Número de keywords

**Uso:**
- Mejorar algoritmo de búsqueda
- Entender necesidades de usuarios
- SEO y keywords populares
- Reportes de uso

---

## 🔔 NOTIFICACIONES

### **`notifications/`** (4 docs)
**Propósito:** Notificaciones generales del sistema

**Campos:**
- `type` - Tipo de notificación
- `message` - Mensaje a mostrar
- `date` - Fecha de la notificación
- `read` - Si fue leída
- `payload` - Datos adicionales

**Uso:**
- Notificaciones push
- Alertas del sistema
- Comunicaciones importantes

---

## 🎫 RSVP

### **`rsvpTokens/`** (3 docs)
**Propósito:** Tokens para confirmación de asistencia

**Campos:**
- `weddingId` - ID de la boda
- `guestId` - ID del invitado
- `createdAt` - Fecha de creación
- `updatedAt` - Última actualización

**Uso:**
- Links únicos para RSVP
- Confirmación de asistencia
- Sin necesidad de login

---

## ⚙️ SISTEMA

### **`_system/`** (0 docs)
**Propósito:** Namespace para colecciones del sistema

**Subcollections:**
- `_system/config/payments/` - Pagos migrados
- `_system/config/discounts/` - Códigos de descuento
- `_system/config/secrets/` - Secretos y configuración
- `_system/config/templates/` - Plantillas del sistema
- `_system/config/auditLogs/` - Logs de auditoría

**Uso:**
- Organización de datos administrativos
- Separar datos de negocio vs sistema
- Configuración global

---

### **`config/`** (1 doc)
**Propósito:** Configuración global de la aplicación

**Campos:**
- `onboarding_enabled` - Si el onboarding está activo

**Uso:**
- Feature flags
- Configuración general
- Parámetros globales

---

### **`diagnosis/`** (1 doc)
**Propósito:** Diagnóstico del sistema

**Campos:**
- `ok` - Estado de salud
- `at` - Timestamp del último check

**Uso:**
- Health checks
- Monitoreo de sistema
- Debugging

---

### **`fallbackLogs/`** (4 docs)
**Propósito:** Logs de errores y fallbacks

**Campos:**
- `service` - Servicio que falló
- `timestamp` - Momento del error
- `userId` - Usuario afectado
- `error` - Código de error
- `errorMessage` - Mensaje detallado
- `userAgent` - Navegador del usuario
- `location` - URL donde ocurrió
- `endpoint` - API endpoint que falló

**Uso:**
- Debugging de errores
- Tracking de problemas
- Mejorar estabilidad
- Reportes de incidencias

---

## 🧪 TESTING

### **`_conexion_prueba/`** (2 docs)
**Propósito:** Tests de conexión a Firestore

**Campos:**
- `source` - Origen del test
- `timestamp` - Momento del test

**Uso:**
- Verificar conectividad
- Tests automatizados
- CI/CD checks

---

### **`_test_connection/`** (1 doc)
**Propósito:** Otra colección de test

**Campos:**
- `test` - Valor de prueba

**Uso:**
- Similar a `_conexion_prueba`
- Redundancia de tests

---

## 🗂️ RESUMEN POR CATEGORÍA

### **🔴 CRÍTICAS (Core del negocio)**
- `users/` - Usuarios registrados
- `weddings/` - Bodas y toda su información
- `suppliers/` - Catálogo de proveedores

### **🟡 IMPORTANTES (Funcionalidad clave)**
- `adminSessions/` - Autenticación de admins
- `emailInsights/` - IA de clasificación de emails
- `searchAnalytics/` - Analítica de búsquedas
- `_system/` - Configuración del sistema

### **🟢 AUXILIARES (Soporte)**
- `notifications/` - Notificaciones
- `rsvpTokens/` - Tokens de RSVP
- `adminTaskTemplates/` - Plantillas de tareas
- `emailUsernames/` - Mapeo de emails
- `aiParsedDialogs/` - Procesamiento IA
- `fallbackLogs/` - Logs de errores
- `config/` - Configuración global
- `diagnosis/` - Health checks

### **⚪ TESTING (Desarrollo)**
- `_conexion_prueba/` - Tests
- `_test_connection/` - Tests

---

## 🔄 COLECCIONES MIGRADAS

Estas colecciones **ya no existen** (fueron migradas):

❌ `mails/` → Ahora: `users/{uid}/emails/`  
❌ `supplier_events/` → Ahora: `suppliers/{id}/analytics/events/`  
❌ `payments/` → Ahora: `_system/config/payments/`  
❌ `discountLinks/` → Ahora: `_system/config/discounts/`  

---

## 📈 ESTADÍSTICAS

```
Total colecciones: 19
Total documentos: ~150 (aproximado)

Distribución:
- Usuarios: 3 docs
- Bodas: 3 docs
- Admin: 44 docs (sessions + templates + devices)
- Email: 37 docs (insights + automation + usernames)
- Analítica: 13 docs
- Otros: 50 docs
```

---

## 🔍 COLECCIONES QUE PUEDEN ELIMINARSE

### **Candidatas a limpieza:**

1. **`_conexion_prueba/`** y **`_test_connection/`**
   - Solo para testing
   - Pueden eliminarse en producción

2. **`diagnosis/`**
   - Si tienes monitoring externo
   - Redundante

### **Mantener todas las demás** - Tienen uso activo en la aplicación.

---

## 📚 DOCUMENTACIÓN ADICIONAL

Para más detalles sobre la estructura:
- `docs/firebase/PROPUESTA-ORGANIZACION-FIRESTORE.md` - Estructura completa
- `docs/firebase/DIAGRAMA-ESTRUCTURA-FIRESTORE.md` - Diagramas visuales
- `docs/firebase/COLECCIONES-PROBLEMATICAS.md` - Problemas detectados

---

**Creado:** 2025-10-28  
**Última actualización:** 2025-10-28  
**Estado:** ✅ Actualizado post-migración
