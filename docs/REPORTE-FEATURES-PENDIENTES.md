# Reporte de Features Pendientes - MaLoveApp
> Generado: 2025-12-15
> Basado en: `FLUJOS-INDICE.md` y documentación de flujos específicos

## Resumen Ejecutivo

De los **31 flujos funcionales** documentados:
- ✅ **26 flujos**: En curso con implementación parcial
- ❌ **5 flujos**: Sin implementar completamente
- 📊 **Total features pendientes identificadas**: 80+

---

## 🔴 Flujos SIN Implementar (Prioridad Alta)

### 1. **Flujo 2C: Personalización IA Continua**
**Estado**: No implementado  
**Documentación**: `docs/flujos-especificos/flujo-2c-personalizacion-continua.md`

**Lo que falta:**
- Sistema de exploración inicial guiada con preguntas por arquetipo
- Detección automática de vacíos en perfil (`profileGaps`)
- Worker de descubrimiento continuo que actualiza `specialInterests`/`noGoItems`
- Automatización operativa: crear tareas/briefings desde `mustHave`
- Worker diario de consistencia y alertas de conflictos
- Curación de tendencias con "Ideas sorpresa"
- Sistema de feedback continuo con micro-encuestas

**Impacto**: Sistema central para personalización transversal en toda la app

---

### 2. **Flujo 16: Asistente Virtual IA (Backend Multicanal)**
**Estado**: Frontend básico implementado, backend pendiente  
**Documentación**: `docs/flujos-especificos/flujo-16-asistente-virtual-ia.md`

**Implementado**:
- ✅ Widget flotante `ChatWidget.jsx`
- ✅ Parser local de comandos básicos
- ✅ Persistencia en localStorage

**Lo que falta**:
- Orquestador multicanal (email/chat/WhatsApp)
- Reglas configurables de automatización
- Workers backend dedicados
- Sistema de follow-ups automáticos multicanal
- Integración completa con flujo 2C (packs sorpresa, contrastes)
- Backend `/api/ai/parse-dialog` robusto
- Cobertura E2E específica

**Impacto**: Asistente limitado a respuestas básicas, sin automatizaciones reales

---

### 3. **Flujo 25: Planes y Suscripciones**
**Estado**: Solo documentación estratégica  
**Documentación**: `docs/flujos-especificos/flujo-25-suscripciones.md`

**Implementado**:
- ✅ Documentación de planes en `docs/planes-suscripcion.md`

**Lo que falta**:
- Sistema completo de cobro único por boda
- Integración con pasarela de pago (Stripe/Braintree)
- Catálogo funcional de límites por plan
- Automatizaciones de upgrade/downgrade
- Panel de gestión de suscripciones
- Degradación automática al expirar plan
- Telemetría operativa de conversión
- Dashboards de rentabilidad
- Sistema de incentivos y ofertas dinámicas

**Impacto**: Sin monetización implementada, todas las bodas son "gratis"

---

### 4. **Flujo 29: Upgrade de Rol (Owner→Assistant→Planner)**
**Estado**: Selector de rol implementado, proceso de pago pendiente  
**Documentación**: `docs/flujos-especificos/flujo-29-upgrade-roles.md`

**Implementado**:
- ✅ Selector de rol en registro
- ✅ Navegación condicional por rol
- ✅ Sistema de invitaciones básico

**Lo que falta**:
- Modal `RoleUpgradeModal` con checkout
- Proceso completo de pago (Stripe/RevenueCat)
- Sincronización Firestore/localStorage del nuevo rol
- Límites de bodas por plan (5/10/∞)
- Sistema de downgrade/reversión
- Job backend para degradación automática al expirar
- Panel de gestión para revertir cambios
- Migración de bodas existentes al cambiar rol

**Impacto**: Usuarios no pueden pagar para cambiar de rol

---

### 5. **Flujo 30: Página de Inicio (Integración Datos Reales)**
**Estado**: UI implementada con datos mock  
**Documentación**: `docs/flujos-especificos/flujo-30-pagina-inicio.md`

**Implementado**:
- ✅ Componente `HomePage.jsx` y `HomeUser.jsx`
- ✅ Cards de métricas con datos localStorage
- ✅ Carrusel de inspiración
- ✅ Sección de blog

**Lo que falta**:
- Reemplazar datos mock/localStorage por fuentes reales de Firebase
- Unificar con `Dashboard.jsx` (evitar duplicación)
- Instrumentar telemetría de interacción
- Ocultar helpers de desarrollo en producción
- Integrar progreso real desde `GamificationService`
- Conectar acciones rápidas con módulos reales

**Impacto**: Página de inicio no refleja estado real del evento

---

## 🟡 Features Pendientes por Flujo (En Curso)

### **Flujo 1: Registro y Autenticación**
- Instrumentar métricas de conversión
- Refactor formularios legacy
- Auditoría de accesibilidad completa

### **Flujo 2: Descubrimiento Personalizado**
- Consolidar preguntas y seeds
- Conectar recomendaciones con checklist/proveedores/presupuesto
- Plan de migración del wizard legacy

### **Flujo 3: Gestión de Invitados**
- Dashboard RSVP completo
- Sistema de check-in del día B
- Sincronización automática con Seating Plan

### **Flujo 4: Invitados (Plan de Asientos)**
- Panel inteligente con IA
- Colaboración en tiempo real
- Workflows de exportación

### **Flujo 5A: Proveedores con IA**
- Scoring IA consolidado
- Portal proveedor completo
- RFQ multi-proveedor automatizada

### **Flujo 5B: Timeline y Tareas**
- Motor IA para plantillas padre/subtareas
- Matriz de responsabilidades

### **Flujo 6: Presupuesto**
- Importación CSV/Excel
- Analítica predictiva
- Aportaciones colaborativas
- Reportes avanzados

### **Flujo 7: Comunicación y Emails**
- Búsqueda/ordenación en inbox
- Carpetas personalizadas
- Clasificador backend
- Envíos programados

### **Flujo 8: Diseño Web y Personalización**
- Mover OpenAI al backend ✅ (implementado)
- Prompts editables
- Dominios personalizados
- Analítica de lugares

### **Flujo 9: RSVP y Confirmaciones**
- Confirmaciones grupales
- Recordatorios multicanal
- Analítica detallada
- Integración con catering

### **Flujo 10: Gestión de Bodas Múltiples**
- Dashboards multi-boda
- Permisos granulares por módulo
- Vistas cruzadas consolidadas

### **Flujo 11: Protocolo y Ceremonias**
- Integraciones con registros civiles
- Dashboard operativo
- Alertas en tiempo real

### **Flujo 11A-E: Momentos, Timeline Día B, Checklist, Legal, Textos**
- Campos avanzados y drag & drop
- Estados editables
- Alertas push/sonoras
- Catálogo internacional
- Control de versiones

### **Flujo 12: Notificaciones y Configuración**
- AutomationRules UI
- Notificaciones push/SMS
- Centro unificado de notificaciones

### **Flujo 14: Checklist Avanzado**
- Generación IA de checklists
- Dependencias avanzadas
- Gamificación
- Plantillas colaborativas

### **Flujo 15: Contratos y Documentos**
- Firma digital integrada
- Workflows de aprobación
- Analítica/legal automation

### **Flujo 17: Gamificación y Progreso**
- Integraciones discretas en UI
- Programa de recompensas
- Insights de analytics

### **Flujo 18: Generador de Documentos Legales**
- Repositorio completo de plantillas
- Firma electrónica
- Almacenamiento backend
- Automatización IA

### **Flujo 19: Diseño de Invitaciones**
- Tutoriales guiados
- Colaboración/feedback
- Integración con impresión
- Generación IA

### **Flujo 20: Email Inbox Global**
- Unificar experiencia
- Documentar APIs backend
- Onboarding centralizado
- Telemetría completa

### **Flujo 21: Sitio Público**
- Personalización avanzada
- Dominios personalizados
- SEO/analytics
- Métricas de conversión

### **Flujo 22: Dashboard y Navegación**
- Métricas en vivo
- Proteger herramientas internas
- Actividad reciente

### **Flujo 23: Métricas del Proyecto**
- Dashboard multi-módulo
- Workers de agregación
- Rutas `/analytics/*`

### **Flujo 24: Galería de Inspiración**
- Lightbox accesible
- Métricas completas
- Colecciones automáticas

### **Flujo 26: Blog Interno de Boda**
- Editor enriquecido
- Control de versiones
- Permisos granulares

### **Flujo 27: Momentos (Álbum Compartido)**
- Slideshow público robusto
- Moderación avanzada
- Métricas de participación

### **Flujo 28: Dashboard Wedding Planner**
- Conectar métricas reales
- Empty states
- Contenido curado

### **Flujo 31: Estilo Global**
- Reutilizar paleta en generadores
- Edición centralizada

---

## 📊 Resumen de Prioridades

### **Crítico (Bloquea Monetización)**
1. ❌ Flujo 25: Sistema de suscripciones y pagos
2. ❌ Flujo 29: Upgrade de rol con checkout
3. ❌ Flujo 2C: Personalización IA continua

### **Alta (Mejora UX Significativa)**
4. ❌ Flujo 16: Asistente IA backend multicanal
5. ❌ Flujo 30: Página inicio con datos reales
6. 🟡 Flujo 6: Presupuesto (importación + analítica)
7. 🟡 Flujo 7: Email inbox (búsqueda + carpetas)
8. 🟡 Flujo 9: RSVP (confirmaciones grupales)

### **Media (Features Avanzadas)**
9. 🟡 Flujo 14: Checklist con IA
10. 🟡 Flujo 18: Generador documentos legales
11. 🟡 Flujo 19: Diseño invitaciones con IA
12. 🟡 Flujo 3-4: Integración Invitados ↔ Seating

### **Baja (Optimizaciones)**
13. 🟡 Resto de features pendientes en flujos en curso

---

## 🎯 Recomendaciones

### **Fase 1: Monetización (4-6 semanas)**
- Implementar Flujo 25 completo (suscripciones)
- Completar Flujo 29 (upgrade roles con pago)
- Integrar pasarela Stripe/Braintree
- Dashboard de administración de planes

### **Fase 2: Personalización IA (6-8 semanas)**
- Implementar Flujo 2C (personalización continua)
- Completar Flujo 16 backend (asistente multicanal)
- Workers de detección y automatización
- Sistema de follow-ups inteligente

### **Fase 3: Features Core (8-10 semanas)**
- Flujo 30: Integrar datos reales en home
- Flujo 6: Presupuesto avanzado
- Flujo 7: Email inbox completo
- Flujo 9: RSVP grupal y recordatorios

### **Fase 4: Features Avanzadas (12+ semanas)**
- Generación IA de contenidos (checklists, invitaciones, documentos)
- Integraciones externas (registros, impresión, firma digital)
- Analítica avanzada multi-módulo
- Gamificación completa

---

## 📈 Métricas de Completitud

| Área | Flujos | Implementado | Pendiente | % Completitud |
|------|--------|--------------|-----------|---------------|
| **Monetización** | 2 | 20% | 80% | 🔴 20% |
| **IA & Personalización** | 3 | 35% | 65% | 🟡 35% |
| **Gestión Core** | 12 | 65% | 35% | 🟢 65% |
| **Features Avanzadas** | 10 | 45% | 55% | 🟡 45% |
| **Experiencia Usuario** | 4 | 55% | 45% | 🟡 55% |
| **TOTAL** | 31 | 50% | 50% | 🟡 50% |

---

> **Nota**: Este reporte se basa en la documentación oficial. Se recomienda validar contra el código real para confirmar el estado de implementación de cada feature.
