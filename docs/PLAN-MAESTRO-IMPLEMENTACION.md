# 🎯 Plan Maestro de Implementación - MaLove.App

**Fecha creación:** Diciembre 2024  
**Objetivo:** Completar el 100% del workflow de usuario  
**Estado actual:** 45% → Meta: 100%  
**Duración estimada:** 6 meses (Q1-Q2 2025)

---

## 📊 Estado Actual

| Fase | % Actual | % Objetivo | Prioridad |
|------|----------|------------|-----------|
| 0. Pre-Planificación | 0% | 100% | 🔴 Alta |
| 1. Planificación Inicial | 70% | 100% | 🟡 Media |
| 2. Búsqueda y Contratación | 75% | 100% | 🔴 Alta |
| 3. Diseño Experiencia | 60% | 100% | 🔴 Alta |
| 4. Trámites Legales | 0% | 80% | 🟡 Media |
| 5. Confirmaciones | 70% | 100% | 🔴 Alta |
| 6. Pre-Boda | 5% | 90% | 🔴 Alta |
| 7. Día de la Boda | 50% | 100% | 🔴 Alta |
| 8. Post-Boda | 0% | 80% | 🟢 Baja |

**Completitud promedio:** 45% → **100%**

---

## 🗓️ SPRINT 1 (Semanas 1-2) - Foundation

### Objetivo: Implementar bases críticas

**Duración:** 10 días laborables  
**Foco:** Quick wins + deuda técnica

#### Día 1-2: Limpieza de Deuda Técnica
- [ ] Limpiar 20 TODOs críticos en SeatingPlan (10 TODOs)
- [ ] Limpiar 20 TODOs críticos en CeremonyProtocol (9 TODOs)
- [ ] Eliminar código duplicado (DocumentosLegales.jsx)
- [ ] Decidir entre SeatingPlan Modern/Refactored

**Output:** Código más limpio, -30 TODOs

#### Día 3-5: FASE 0.2 - Timeline Personalizado (Quick Win)
- [ ] Implementar generador automático desde `masterTimelineTemplate.json`
- [ ] Calcular fechas según meses disponibles hasta boda
- [ ] Añadir alertas "última llamada" (30, 15, 7 días antes)
- [ ] UI para visualizar timeline personalizado
- [ ] Integrar con dashboard

**Output:** Timeline automático funcional

#### Día 6-8: FASE 3.1.5 - Shot List Fotográfico (Quick Win)
- [ ] Crear componente `PhotoShotList.jsx`
- [ ] Categorías: Ceremonia, Familia, Parejas, Detalles, Grupos
- [ ] Checklist interactivo con progreso
- [ ] Compartir lista con fotógrafo (PDF/link)
- [ ] Marcar fotos completadas durante evento

**Output:** Shot list funcional

#### Día 9-10: Testing y Documentación Sprint 1
- [ ] Tests E2E para timeline
- [ ] Tests E2E para shot list
- [ ] Actualizar documentación
- [ ] Fix bugs detectados

---

## 🗓️ SPRINT 2 (Semanas 3-4) - Onboarding

### Objetivo: Implementar cuestionario inicial

**Duración:** 10 días laborables  
**Foco:** FASE 0 completa

#### Día 1-3: FASE 0.1 - Cuestionario Inicial (Parte 1)
- [ ] Expandir `CreateWeddingAssistant.jsx`
- [ ] Añadir preguntas de visión:
  - Tipo de boda (íntima/mediana/grande)
  - Presupuesto estimado
  - Tiempo disponible (meses)
  - Estilo preferido
  - Prioridades (ranking)
- [ ] Almacenar respuestas en `weddings/{id}/onboarding`
- [ ] UI wizard multi-paso

**Output:** Cuestionario funcional (Parte 1)

#### Día 4-6: FASE 0.1 - Cuestionario Inicial (Parte 2)
- [ ] Integración con IA para recomendaciones
- [ ] Generar sugerencias personalizadas
- [ ] Configurar valores iniciales según respuestas
- [ ] Dashboard con resumen de perfil

**Output:** Cuestionario completo con IA

#### Día 7-8: FASE 2.6 - Pruebas y Ensayos
- [ ] Crear página `PruebasEnsayos.jsx`
- [ ] Calendario de citas:
  - Prueba menú
  - Prueba vestido/traje
  - Prueba maquillaje/peluquería
  - Sesión pre-boda
  - Ensayo ceremonia
- [ ] Recordatorios automáticos
- [ ] Notas por prueba
- [ ] Galería de fotos de referencia

**Output:** Módulo pruebas funcional

#### Día 9-10: Testing y Documentación Sprint 2
- [ ] Tests E2E
- [ ] Documentación
- [ ] Fix bugs

---

## 🗓️ SPRINT 3 (Semanas 5-6) - Diseño Mejorado

### Objetivo: Completar wizard de diseño

**Duración:** 10 días laborables  
**Foco:** FASE 1.3 expandida

#### Día 1-4: FASE 1.3 - Wizard de Diseño Completo
- [ ] Expandir `InfoBoda.jsx` a wizard multi-paso
- [ ] Paso 1: Tipo de ceremonia (civil/religiosa/ambas)
- [ ] Paso 2: Quiz de estilo (10 preguntas con imágenes)
- [ ] Paso 3: Generador de paletas de colores
- [ ] Paso 4: Mood board / collage de inspiración
- [ ] Paso 5: Dress code para invitados
- [ ] Integrar con Pinterest/Instagram API (opcional)
- [ ] Guardar en `weddings/{id}/design`

**Output:** Wizard de diseño completo

#### Día 5-7: FASE 5.3 - Regalos y Lista de Deseos (Parte 1)
- [ ] Crear página `ListaRegalos.jsx`
- [ ] CRUD de productos deseados
- [ ] Categorías: hogar, viaje, experiencias, otros
- [ ] Tracking de regalos recibidos
- [ ] Estado: pendiente, reservado, recibido

**Output:** Gestión básica de regalos

#### Día 8-10: FASE 5.3 - Regalos y Lista de Deseos (Parte 2)
- [ ] Integración multi-tienda (links externos)
- [ ] Generador de agradecimientos automático
- [ ] Lista pública para compartir con invitados
- [ ] Opción de crowdfunding para luna de miel
- [ ] Testing y documentación

**Output:** Lista de regalos completa

---

## 🗓️ SPRINT 4 (Semanas 7-8) - Logística

### Objetivo: Transporte y gestión de niños

**Duración:** 10 días laborables  
**Foco:** FASE 6.2 y 6.4

#### Día 1-5: FASE 6.2 - Transporte y Logística
- [ ] Crear página `TransporteLogistica.jsx`
- [ ] Gestión de transporte novios
- [ ] Gestión de autobuses/transporte invitados
- [ ] Hoteles recomendados:
  - Lista de hoteles cercanos
  - Bloques de habitaciones
  - Precios y contacto
- [ ] Mapa interactivo (Google Maps integrado)
- [ ] Información de parking
- [ ] Coordinación de llegadas
- [ ] Compartir info con invitados

**Output:** Módulo transporte completo

#### Día 6-8: FASE 6.4 - Gestión de Niños
- [ ] Tracking de invitados con niños en `Invitados.jsx`
- [ ] Campo "Número de niños" y edades
- [ ] Menús infantiles dedicados
- [ ] Gestión de entretenimiento:
  - Zona de juegos
  - Actividades
  - Servicio de niñera (opcional)
- [ ] Proveedores de servicios infantiles
- [ ] Integrar con seating plan

**Output:** Módulo niños completo

#### Día 9-10: Testing y Documentación Sprint 4
- [ ] Tests E2E
- [ ] Documentación
- [ ] Fix bugs

---

## 🗓️ SPRINT 5 (Semanas 9-10) - Colaboración

### Objetivo: Wedding Team y múltiples eventos

**Duración:** 10 días laborables  
**Foco:** FASE 3.0 y 6.3

#### Día 1-5: FASE 3.0 - Wedding Team y Colaboración
- [ ] Expandir sistema de roles existente
- [ ] Página `WeddingTeam.jsx`:
  - Asignar padrinos/madrinas
  - Asignar testigos
  - Definir coordinador/planner
  - Familiares clave con tareas
- [ ] Sistema de asignación de tareas a personas
- [ ] Permisos granulares por persona
- [ ] Sistema de comentarios en tareas
- [ ] Historial de cambios
- [ ] Notificaciones a equipo

**Output:** Wedding Team funcional

#### Día 6-8: FASE 6.3 - Eventos Múltiples
- [ ] Gestión de eventos pre-boda:
  - Despedida soltero/a
  - Cena de ensayo
  - Welcome party
- [ ] Eventos post-boda:
  - Brunch post-boda
  - After-party
- [ ] Timeline multi-día
- [ ] Invitaciones por evento
- [ ] Coordinación de asistentes
- [ ] RSVP por evento

**Output:** Eventos múltiples funcional

#### Día 9-10: Testing y Documentación Sprint 5
- [ ] Tests E2E
- [ ] Documentación
- [ ] Fix bugs

---

## 🗓️ SPRINT 6 (Semanas 11-12) - Trámites Legales

### Objetivo: Completar gestión legal

**Duración:** 10 días laborables  
**Foco:** FASE 4

#### Día 1-6: FASE 4 - Trámites Legales Completo
- [ ] Expandir `DocumentosLegales.jsx`
- [ ] Checklist por país/región:
  - España (civil, religiosa)
  - Otros países (expansible)
- [ ] Documentos por tipo:
  - Certificado nacimiento
  - Certificado empadronamiento
  - DNI/Pasaporte
  - Expediente matrimonial
- [ ] Recordatorios de plazos
- [ ] Almacenamiento seguro de documentos (Firebase Storage)
- [ ] Guía paso a paso interactiva
- [ ] Estados: pendiente, en trámite, completado

**Output:** Trámites legales funcional

#### Día 7-8: FASE 5.4 - Invitados Especiales
- [ ] Expandir `Invitados.jsx`
- [ ] Gestión de accesibilidad:
  - Movilidad reducida
  - Silla de ruedas
  - Necesidades médicas
- [ ] Alergias graves (ya existe, mejorar)
- [ ] Invitados internacionales:
  - Idiomas
  - Información de viaje
  - Documentación necesaria

**Output:** Invitados especiales mejorado

#### Día 9-10: Testing y Documentación Sprint 6
- [ ] Tests E2E
- [ ] Documentación
- [ ] Fix bugs

---

## 🗓️ SPRINT 7 (Semanas 13-14) - Día de la Boda

### Objetivo: Completar features día del evento

**Duración:** 10 días laborables  
**Foco:** FASE 7 completa

#### Día 1-3: FASE 7.1 - Checklist del Día Mejorado
- [ ] Expandir `Checklist.jsx`
- [ ] Modo "Día de la Boda" especial
- [ ] Checklist interactivo con alertas
- [ ] Verificación de proveedores
- [ ] Coordinación de personas clave
- [ ] Contactos de emergencia
- [ ] Resolución de imprevistos

**Output:** Checklist día mejorado

#### Día 4-6: FASE 6.1 - Logística Final
- [ ] Crear página `LogisticaFinal.jsx`
- [ ] Inventario de elementos a llevar
- [ ] Asignación de responsables
- [ ] Timeline de entregas
- [ ] Coordinación con proveedores
- [ ] Checklist de transporte
- [ ] Verificación de instalaciones

**Output:** Logística final funcional

#### Día 7-10: Mejoras Protocolo Existente
- [ ] Mejorar `Protocolo.jsx`
- [ ] Timeline detallado minuto a minuto
- [ ] Responsables de cada momento
- [ ] Alertas en tiempo real
- [ ] Orden de eventos detallado:
  - Entrada novios
  - Discursos (orden, duración)
  - Corte de tarta
  - Lanzamiento de ramo
  - Apertura de baile
- [ ] Timeline compartido con proveedores
- [ ] Testing y documentación

**Output:** Protocolo mejorado

---

## 🗓️ SPRINT 8 (Semanas 15-16) - Post-Boda

### Objetivo: Completar ciclo post-boda

**Duración:** 10 días laborables  
**Foco:** FASE 8

#### Día 1-3: FASE 8.1 - Gestión de Contenido Final
- [ ] Expandir módulo `Momentos.jsx`
- [ ] Selección de mejores fotos
- [ ] Organización de álbum físico/digital
- [ ] Compartir galería protegida con invitados
- [ ] Descarga masiva de contenido
- [ ] Exportación de álbum completo

**Output:** Gestión contenido funcional

#### Día 4-6: FASE 8.2 - Agradecimientos
- [ ] Crear página `Agradecimientos.jsx`
- [ ] Plantillas personalizables
- [ ] Envío masivo con personalización
- [ ] Inclusión de fotos seleccionadas
- [ ] Sistema de valoración de proveedores
- [ ] Recomendaciones para futuros usuarios

**Output:** Agradecimientos funcional

#### Día 7-8: FASE 8.3 - Archivo Digital
- [ ] Crear página `ArchivoDigital.jsx`
- [ ] Archivo de todos los documentos
- [ ] Exportación de datos completos
- [ ] Modo "Memoria" de la boda
- [ ] Recordatorios de aniversarios

**Output:** Archivo digital funcional

#### Día 9-10: Testing y Documentación Sprint 8
- [ ] Tests E2E
- [ ] Documentación
- [ ] Fix bugs

---

## 🗓️ SPRINT 9 (Semanas 17-18) - Features Adicionales

### Objetivo: Implementar features diferenciadores

**Duración:** 10 días laborables  
**Foco:** Luna de Miel + Extras

#### Día 1-5: FASE 8.4 - Luna de Miel
- [ ] Crear página `LunaDeMiel.jsx`
- [ ] Destinos sugeridos por presupuesto
- [ ] Búsqueda de vuelos/hoteles (integración API)
- [ ] Planificador de actividades
- [ ] Lista de deseos de luna de miel
- [ ] Crowdfunding para viaje
- [ ] Integración con lista de regalos

**Output:** Luna de miel funcional

#### Día 6-8: Features Adicionales
- [ ] Tradiciones y rituales por cultura
- [ ] Elementos simbólicos (ceremonia arena, luz, etc.)
- [ ] Votos personalizados (ya existe, mejorar)
- [ ] Backup plans y emergencias
- [ ] Sostenibilidad/eco-friendly (proveedores)

**Output:** Features adicionales

#### Día 9-10: Testing y Documentación Sprint 9
- [ ] Tests E2E completos
- [ ] Documentación final
- [ ] Fix bugs

---

## 🗓️ SPRINT 10 (Semanas 19-20) - Pulido General

### Objetivo: Optimización y mejoras

**Duración:** 10 días laborables  
**Foco:** Performance + UX + Bugs

#### Día 1-4: Performance y Optimización
- [ ] Auditoría de performance
- [ ] Optimizar carga de imágenes
- [ ] Lazy loading de componentes pesados
- [ ] Optimizar queries Firestore
- [ ] Code splitting avanzado
- [ ] Caché estratégica

**Output:** App más rápida

#### Día 5-7: Mejoras UX Generales
- [ ] Auditoría de UX completa
- [ ] Mejorar mensajes de error
- [ ] Mejorar loading states
- [ ] Mejorar animaciones
- [ ] Mejorar responsividad móvil
- [ ] Accesibilidad (WCAG 2.1)

**Output:** UX pulida

#### Día 8-10: Bug Fixing Final
- [ ] Resolver bugs pendientes
- [ ] Testing de regresión
- [ ] Documentación actualizada
- [ ] Preparar para producción

**Output:** App estable

---

## 🗓️ SPRINT 11-12 (Semanas 21-24) - Integrations & Scale

### Objetivo: Integraciones y escalabilidad

**Duración:** 20 días laborables  
**Foco:** APIs externas + Optimización

#### Semana 21-22: Integraciones de Pago
- [ ] Integrar Stripe/Redsys
- [ ] Sistema de suscripciones por plan
- [ ] Pasarela de pago para proveedores
- [ ] Gestión de facturas
- [ ] Reportes de ingresos

#### Semana 23-24: Features Avanzadas
- [ ] Notificaciones push (Firebase Cloud Messaging)
- [ ] Integración WhatsApp Business
- [ ] Analytics avanzado
- [ ] Dashboard de métricas para admins
- [ ] Sistema de referidos

**Output:** Integraciones completas

---

## 📊 Checklist de Validación por Sprint

### Para cada sprint, validar:

- [ ] **Funcionalidad:** Feature funciona según especificación
- [ ] **Tests E2E:** Cobertura mínima 80%
- [ ] **Documentación:** README actualizado
- [ ] **UX:** Flujo intuitivo, sin fricciones
- [ ] **Performance:** Carga < 3s, no memory leaks
- [ ] **Mobile:** Funciona en todas las resoluciones
- [ ] **Accesibilidad:** Cumple WCAG 2.1 nivel AA
- [ ] **Errores:** Manejo de errores completo

---

## 🎯 Métricas de Éxito

### Por Fase

| Fase | KPI | Meta |
|------|-----|------|
| 0. Pre-Planificación | % usuarios que completan | >80% |
| 1. Planificación | % con presupuesto definido | >90% |
| 2. Búsqueda | % con proveedores contratados | >70% |
| 3. Diseño | % con diseño completo | >85% |
| 4. Trámites | % documentos completados | >60% |
| 5. Confirmaciones | % RSVPs recibidos | >85% |
| 6. Pre-Boda | % checklist completado | >90% |
| 7. Día Boda | Eventos sin incidencias | >95% |
| 8. Post-Boda | % agradecimientos enviados | >70% |

### Generales

- **Completitud workflow:** 45% → 100%
- **NPS:** 45 → 60+
- **Retención:** +15%
- **Tasa abandono:** -20%
- **Tiempo org boda:** -30%

---

## 🔄 Metodología de Trabajo

### Modo Continuo

1. **Implementar feature**
   - Código funcional
   - Sin TODOs pendientes
   - Siguiendo STYLE_GUIDE.md

2. **Testing**
   - Tests E2E
   - Tests unitarios críticos
   - Manual QA

3. **Documentar**
   - Actualizar docs relevantes
   - Comentarios en código
   - Changelog

4. **Pasar a siguiente**
   - Sin esperar aprobación
   - Continuar con siguiente item
   - Ajustar plan si necesario

### Reglas

- ✅ No dejar código a medias
- ✅ No crear TODOs nuevos
- ✅ Testing antes de pasar a siguiente
- ✅ Documentar cambios importantes
- ✅ Commits descriptivos
- ✅ No romper funcionalidad existente

---

## 📅 Timeline Completo

**Total:** 24 semanas (~6 meses)

```
Mes 1: Sprints 1-2  (Foundation + Onboarding)
Mes 2: Sprints 3-4  (Diseño + Logística)
Mes 3: Sprints 5-6  (Colaboración + Legal)
Mes 4: Sprints 7-8  (Día Boda + Post-Boda)
Mes 5: Sprints 9-10 (Extras + Pulido)
Mes 6: Sprints 11-12 (Integraciones + Scale)
```

**Fecha inicio:** Diciembre 2024  
**Fecha fin estimada:** Junio 2025  
**Completitud final:** 100%

---

## 🚀 ¡Comenzar Implementación!

**Modo:** Continuo sin parar  
**Sprint actual:** Sprint 1, Día 1  
**Próxima tarea:** Limpiar TODOs críticos en SeatingPlan

**Estado:** ▶️ EN EJECUCIÓN
