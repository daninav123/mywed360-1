# 🎯 NUEVO ROADMAP PRIORIZADO 2025

**Análisis realizado:** 12 de noviembre de 2025  
**Basado en:** Estado actual + TODO.md + ROADMAP.md + Análisis de gaps

---

## 📊 CONTEXTO

### **Estado Actual:**

- ✅ **Modal de proveedores:** Mejorado y consistente (completado hoy)
- ⚠️ **Tests unitarios:** 3 tests de Firestore requieren corrección
- ✅ **Core funcional:** Seating, Email, Finance, Invitados implementados
- 🚧 **En progreso:** Protocolo, Proveedores IA, Tasks, Asistente
- 🗑️ **Tests E2E:** Eliminados - enfoque en QA manual

### **Necesidades Críticas:**

1. Estabilizar tests para garantizar calidad
2. Completar módulos core al 100%
3. Mejorar UX y onboarding
4. Implementar funcionalidades IA prometidas
5. Performance y optimización

---

## 🚀 TOP 10 PRIORIDADES PARA LOS PRÓXIMOS 3 MESES

### **🔴 PRIORIDAD 1: Estabilizar Tests (Semana 1-2)**

**Impacto:** CRÍTICO | **Esfuerzo:** MEDIO

#### **Por qué es urgente:**

- 3 tests unitarios de Firestore requieren corrección
- Sin tests estables, no hay confianza para deployar
- Enfoque en QA manual para funcionalidades críticas

#### **Tareas:**

1. ✅ Arreglar `unit_rules`, `unit_rules_exhaustive`, `unit_rules_extended`
2. ✅ Estabilizar seeds y fixtures
3. ✅ Implementar QA manual para funcionalidades críticas

#### **Resultado esperado:**

- Tests unitarios pasando
- Seeds y fixtures estables
- QA manual documentado
- Confianza para deployar

---

### **🟠 PRIORIDAD 2: Seating Plan Móvil (Semana 2-3)**

**Impacto:** ALTO | **Esfuerzo:** MEDIO-ALTO

#### **Por qué es importante:**

- 60% de usuarios acceden desde móvil
- Seating es una feature crítica el día de la boda
- Actualmente solo funciona bien en desktop

#### **Tareas:**

1. ✅ Implementar FAB radial y panel inferior
2. ✅ Ajustar `GuestSidebar` móvil con tabs
3. ✅ Gestos táctiles (pinch zoom, double tap, swipe)
4. ✅ Badges "En edición" para colaboración
5. ✅ QA en tablet/iPad

#### **Resultado esperado:**

- Experiencia móvil completa y usable
- Colaboración en tiempo real funcional
- +40% engagement móvil

---

### **🟠 PRIORIDAD 3: Migrar UnifiedInbox (Semana 3-4)**

**Impacto:** ALTO | **Esfuerzo:** MEDIO

#### **Por qué es importante:**

- Código legacy (`Buzon_fixed_complete.jsx`) genera confusión
- Duplicación de esfuerzo en mantenimiento
- UnifiedInbox tiene mejor UX

#### **Tareas:**

1. ✅ Completar integración de carpetas personalizadas
2. ✅ Refinar papelera (restaurar, métricas, vaciado)
3. ✅ Migrar usuarios existentes
4. ✅ Eliminar buzón legacy
5. ✅ Verificar con QA manual

#### **Resultado esperado:**

- Un solo inbox mantenible
- Mejor experiencia de usuario
- -30% código duplicado

---

### **🟡 PRIORIDAD 4: Motor IA de Tasks (Semana 4-6)**

**Impacto:** ALTO | **Esfuerzo:** ALTO

#### **Por qué es diferenciador:**

- Feature prometida a usuarios
- Diferenciador competitivo clave
- Reduce esfuerzo manual significativo

#### **Tareas:**

1. ✅ Mantener plantilla maestra curada
2. ✅ Ingestar datos de la boda (tipo, tamaño, presupuesto, estilo)
3. ✅ Motor híbrido plantillas + LLM
4. ✅ Proponer dependencias y responsables
5. ✅ Modo borrador con explicación

#### **Resultado esperado:**

- Plan personalizado automático
- 80% tareas relevantes generadas
- -5 horas setup manual por boda

---

### **🟡 PRIORIDAD 5: Sincronización Invitados ↔ Seating (Semana 6-7)**

**Impacto:** ALTO | **Esfuerzo:** MEDIO

#### **Por qué es crítico:**

- Usuarios reportan inconsistencias
- Datos duplicados generan errores
- Funcionalidad esperada que no existe

#### **Tareas:**

1. ✅ Persistencia backend bidireccional
2. ✅ Automatizaciones IA reactivas
3. ✅ Exportaciones día B (check-in, QR)
4. ✅ Sincronizar estadísticas RSVP
5. ✅ Tests de integración

#### **Resultado esperado:**

- Datos siempre sincronizados
- -90% errores de inconsistencia
- Exportaciones listas para el día B

---

### **🟢 PRIORIDAD 6: Onboarding Mejorado (Semana 7-8)**

**Impacto:** MEDIO-ALTO | **Esfuerzo:** MEDIO

#### **Por qué mejora retención:**

- Usuarios nuevos se pierden
- No entienden features clave
- Churn del 40% en primera semana

#### **Tareas:**

1. ✅ Tutorial interactivo paso a paso
2. ✅ Tooltips contextuales
3. ✅ Checklist de setup inicial
4. ✅ Videos cortos explicativos
5. ✅ Telemetría de progreso

#### **Resultado esperado:**

- -50% churn primera semana
- +30% features descubiertas
- NPS +15 puntos

---

### **🟢 PRIORIDAD 7: Dashboard Personalizable (Semana 8-9)**

**Impacto:** MEDIO | **Esfuerzo:** MEDIO

#### **Por qué mejora UX:**

- Cada usuario tiene necesidades diferentes
- Dashboard actual muy genérico
- Información importante oculta

#### **Tareas:**

1. ✅ Widgets drag & drop
2. ✅ Configuración por rol (owner/planner/assistant)
3. ✅ Métricas personalizables
4. ✅ Accesos rápidos configurables
5. ✅ Guardar layouts

#### **Resultado esperado:**

- Dashboard adaptado por usuario
- +50% tiempo en dashboard
- -40% clicks para tareas comunes

---

### **🟢 PRIORIDAD 8: Búsqueda Global (Cmd+K) (Semana 9-10)**

**Impacto:** MEDIO | **Esfuerzo:** MEDIO-BAJO

#### **Por qué mejora productividad:**

- Usuarios pierden tiempo navegando
- Información dispersa en múltiples páginas
- Feature esperada en apps modernas

#### **Tareas:**

1. ✅ Implementar modal de búsqueda
2. ✅ Indexar todas las entidades
3. ✅ Búsqueda fuzzy inteligente
4. ✅ Shortcuts de teclado
5. ✅ Acciones rápidas

#### **Resultado esperado:**

- Acceso instantáneo a cualquier dato
- -60% tiempo de navegación
- +80% satisfacción UX

---

### **🔵 PRIORIDAD 9: Performance y Optimización (Semana 10-11)**

**Impacto:** MEDIO | **Esfuerzo:** MEDIO

#### **Por qué es necesario:**

- Bundle grande (>2MB)
- Primera carga lenta
- Queries Firestore costosos

#### **Tareas:**

1. ✅ Lazy loading de módulos
2. ✅ Optimizar queries Firestore
3. ✅ CDN para assets públicos
4. ✅ Lighthouse CI (<2MB bundle)
5. ✅ Code splitting avanzado

#### **Resultado esperado:**

- Bundle <1.5MB
- First Load <2s
- -50% costos Firestore

---

### **🔵 PRIORIDAD 10: Protocolo y Ceremonias (Flujos 11A-11E) (Semana 11-12)**

**Impacto:** MEDIO | **Esfuerzo:** ALTO

#### **Por qué completarlo:**

- Módulo prometido
- Diferenciador vs competencia
- Usuarios lo piden

#### **Tareas:**

1. ✅ Momentos especiales (11A) - campos avanzados, drag&drop
2. ✅ Timeline día B (11B) - estados editables, alertas
3. ✅ Checklist última hora (11C) - alertas push
4. ✅ Guía documentación legal (11D) - catálogo internacional
5. ✅ Ayuda textos ceremonia (11E) - control versiones, IA

#### **Resultado esperado:**

- Módulo protocolo completo
- Feature única en el mercado
- +25% valor percibido

---

## 📈 MÉTRICAS DE ÉXITO

### **Técnicas:**

- ✅ Tests unitarios pasando
- ✅ Bundle <1.5MB
- ✅ First Load <2s
- ✅ 0 errores críticos en producción
- ✅ QA manual documentado

### **Negocio:**

- ✅ -50% churn primera semana
- ✅ NPS +15 puntos
- ✅ +40% engagement móvil
- ✅ +30% features descubiertas

### **Usuario:**

- ✅ -60% tiempo de navegación
- ✅ -5 horas setup manual
- ✅ +80% satisfacción UX
- ✅ +25% valor percibido

---

## 🎯 RESUMEN EJECUTIVO

### **Semanas 1-4 (CRÍTICO):**

1. Estabilizar tests
2. Seating móvil
3. Migrar UnifiedInbox
4. Motor IA de Tasks

### **Semanas 5-8 (IMPORTANTE):**

5. Sincronización Invitados ↔ Seating
6. Onboarding mejorado
7. Dashboard personalizable

### **Semanas 9-12 (MEJORAS):**

8. Búsqueda global
9. Performance
10. Protocolo completo

---

## 🚨 RIESGOS Y DEPENDENCIAS

### **Riesgos:**

- Motor IA requiere ajuste de prompts (puede tomar más tiempo)
- Tests unitarios pueden requerir emulador Firebase
- Performance puede requerir cambios arquitectónicos

### **Dependencias:**

- OpenAI API funcionando
- Firestore con límites adecuados
- Recursos de desarrollo disponibles

---

## ✅ CHECKLIST ANTES DE EMPEZAR

- [ ] Confirmar prioridades con stakeholders
- [ ] Asignar recursos a cada sprint
- [ ] Configurar métricas y monitoreo
- [ ] Preparar ambiente de staging
- [ ] Comunicar roadmap a equipo y usuarios

---

**Este roadmap prioriza:**

1. **Estabilidad** (tests unitarios + QA manual)
2. **Móvil** (seating + UX)
3. **IA** (tasks + diferenciación)
4. **UX** (onboarding + dashboard + búsqueda)
5. **Performance** (optimización)
6. **Features** (protocolo completo)

**¡Roadmap realista y ejecutable en 3 meses!** 🚀
