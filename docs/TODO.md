# TODO Plan de Asientos

## Referencias Generales
- Documentación funcional: `docs/flujos-especificos/flujo-4-plan-asientos.md`
- Especificación de prototipos Figma: `docs/diseno/export-wizard-mobile.md`
- Guía de trabajo con Figma: `docs/diseno/README.md`
- Backlog técnico detallado: `docs/tareas/plan-asientos-export-mobile.md`

## Fase 1 – Prototipos y diseño
- [ ] Crear espacio Figma “Lovenda · Diseño / Plan de Asientos”.
- [ ] Dibujar wireframes y prototipo clickable del wizard de exportación (según doc de diseño).
- [ ] Dibujar wireframes y prototipo de vista móvil/tablet (estructura, FAB radial, panel inferior).
- [ ] Adjuntar enlaces Figma en los tickets correspondientes.

## Fase 2 – Implementación frontend
### Exportación avanzada
- [x] Implementar wizard 3 pasos (formatos → contenido → configuración) en UI (versión inicial, sin backend).
- [ ] Añadir preview en miniatura y guardado de presets (el wizard ya muestra un placeholder).
- [ ] Conectar con Firestore (`exports/{exportId}`) y generar archivos (PDF/SVG/CSV).

### Vista móvil/tablet
- [x] Detectar viewport <=1024 px y activar modo compacto (state `isMobile`).
- [x] Crear minimapa, lista de mesas con barras de capacidad y FAB radial (versión placeholder, sin minimapa interactivo real).
- [ ] Ajustar `GuestSidebar` móvil (tab Alertas/Recomendaciones/Staff).
- [ ] Implementar gestos (pinch, double tap, swipe) y botones alternativos.

### Overlays y plantillas base
- [ ] Añadir biblioteca de plantillas de venue (`VenueTemplates`).
- [ ] Implementar overlays de distancias mínimas y heatmap de accesibilidad.
- [ ] Añadir puntos de interés (altar, pista, DJ, salidas, etc.) con notas exportables.

### Mesas y capacidades
- [ ] Permitir tipos `redonda`, `cuadrada`, `imperial`, `coctel`, `auxiliar/staff`.
- [ ] Calcular capacidad sugerida según dimensiones y bloquear asignaciones extra.
- [ ] Actualizar sidebar para editar ancho/alto/diámetro y mostrar alertas de sobrecupo.

### Colaboración en tiempo real
- [ ] Implementar locks optimistas (`seatingLocks/{resourceId}`) y presencia de usuarios.
- [ ] Mostrar badges “En edición”, toasts de conflicto y modo enfoque por colaborador.
- [ ] Registrar eventos de actividad (`lock_acquired`, `conflict_resolved`).

### GuestSidebar y Tasks/Gamificación
- [ ] Implementar `GuestSidebar` con secciones (Resumen, Recomendaciones, Conflictos, Staff, Historial).
- [ ] Integrar triggers de Tasks automáticas (completar seating, resolver conflictos, compartir plano).
- [ ] Registrar eventos de gamificación (layout_ceremony_ready, layout_banquet_ready, export_generated, conflicts_resolved).

## Fase 3 – Backend / Firestore / Analytics
- [ ] Actualizar `useSeatingPlan` y servicios para guardar `venueTemplateId`, `poiConfig`, `tableDefaults`, overlays y exportes.
- [ ] Crear triggers para refrescar `guestInsights` tras cambios RSVP/asignaciones.
- [ ] Actualizar métricas/analytics (`seating_export_generated`, `guest_sidebar_*`, `seating_mobile_mode_enabled`, `seating_collab_lock_acquired`).

## Fase 4 – Testing y QA
- [ ] Añadir unit tests para nuevas funciones (cálculo de capacidad, bloqueo de mesas, locks colaborativos).
- [ ] Escribir E2E Cypress para cada escenario del flujo 4 (ceremony, banquet, overlays, móvil, export, colaboración, GuestSidebar).
- [ ] Realizar QA manual en tablet/iPad y navegadores principales.
- [ ] Preparar checklist de lanzamiento (comunicación a usuarios, soporte, métricas).

## Fase 5 – Deploy y seguimiento
- [ ] Desplegar funcionalidades en staging → producción.
- [ ] Monitorizar dashboards y alertas para `guest_sidebar_*`, `seating_export_generated`, `seating_mobile_mode_enabled`, `seating_collab_lock_acquired`.
- [ ] Recoger feedback de planners/proveedores y planificar iteraciones.
