# 11A. Momentos Especiales de la Boda

> Componentes clave: `src/pages/protocolo/MomentosEspeciales.jsx`, `src/hooks/useSpecialMoments.js`, `src/data/musicInspiration.js`
> Persistencia: `weddings/{id}/specialMoments/main` (blocks + moments) y localStorage `MaLove.AppSpecialMoments`
> Pendiente: campos avanzados (responsables, suppliers), drag&drop, alertas guiadas y destinatarios por momento.

## 1. Objetivo y alcance
- Centralizar todos los momentos significativos del evento (ceremonia, cóctel, banquete, disco, extras).
- Gestionar lecturas, música, responsables y requisitos técnicos de cada bloque.
- Ofrecer inspiración musical asistida por IA y plantillas para duplicar/reordenar momentos.

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Momentos especiales`; se trata de una ruta dedicada dentro del módulo Protocolo (sin pestañas compartidas).
- Acceso rápido desde tareas que contengan "momentos especiales", "votos", "lecturas" (ver `TasksRefactored.jsx`).
- Notificaciones internas pueden enlazar al flujo cuando faltan canciones en bloques críticos.

## 3. Estado actual

### Implementado hoy
- Pestañas dinámicas por bloque (`MomentosEspeciales.jsx:21-33`) con acciones de renombrar/mover vía prompt.  
- Edición de título, canción, hora y duración; duplicar/mover secciones mediante botones.  
- Búsqueda musical (fetch iTunes) y recomendaciones IA básicas (`MomentosEspeciales.jsx:601-678`).  
- Persistencia dual: localStorage + Firestore (`useSpecialMoments.js:60-119`).  
- Duplicado/movimiento de momentos entre bloques mediante prompts (`MomentosEspeciales.jsx:1048-1099`).  

## Roadmap / pendientes
- Campos adicionales (responsables, requisitos técnicos, suppliers, estado) descritos originalmente.  
- Reordenamiento drag&drop y límite de 200 momentos.  
- Alertas por campos faltantes y duplicado/movimiento con UI guiada.  
- Destinatario opcional por momento (selector colapsable que permite asociar invitados/roles concretos para integraciones como seating VIP).

## 4. Datos y modelo
- **Estructura base** (`DEFAULT_BLOCKS` y `defaultData` en `useSpecialMoments.js`).  
- Cada momento incluye campos `id`, `order`, `title`, `song`, `time`, `duration`, `type`, `responsables`, `suppliers`, `optional`, `state` (se añadirá `recipientId`/`recipientName` como campo opcional).  
- Sincronización doble: localStorage para respuesta inmediata y Firestore (`setDoc` a `.../specialMoments/main`).  
- Migraciones: hook migra datos antiguos (`momentosEspeciales`) a la nueva colección.

## 5. Reglas de negocio (vigentes)
- Los IDs de bloques proceden del slug generado en el hook; renombrar no sincroniza aún con Timing.  
- Sólo se valida el título; el resto de campos son opcionales y no generan alertas.  
- No hay límite de momentos activo (por ahora queda abierto).

## 6. Estados especiales
- Si no hay bloques, se inicializa con plantilla por defecto (ceremonia, cóctel, banquete, disco).  
- Error en reproducción musical → se muestra alerta en consola y se cancela playback; no bloquea edición.  
- Cuando no hay conexión, los cambios persisten localmente y se sincronizan al recuperar Firestore.

## 7. Integraciones
- **Flujo 11B**: `Timing.jsx` consume `specialMoments` para poblar hitos y permite reordenar desde timeline.  
- **Flujo 11C**: checklist consulta totales de momentos con canción asignada.  
- **Flujo 6 (Presupuesto)**: responsables y suppliers se utilizan para cotizaciones de música/sonido.  
- **Flujo 21**: se pueden publicar fragmentos (momentos destacados) en la web pública.  
- **Flujo 4 (Seating plan)**: el destinatario opcional alimentará la lista de VIP para exportaciones y métricas del smart panel.

## 8. Métricas y eventos
- Eventos emitidos: `special_moment_added`, `special_moment_removed`, `special_moment_state_changed`.  
- Indicadores sugeridos: nº momentos por bloque, % con canción, bloques personalizados.  
- Logging IA se limita a console.log para depuración.

## 9. Pruebas recomendadas
- Unitarias: `useSpecialMoments` (creación, migración, sincronización).  
- Integración: añadir/duplicar momentos → reflejo inmediato en Timeline.  
- E2E: planner crea bloques personalizados, asigna canciones via búsqueda y verifica persistencia tras recarga.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/protocolo-flows.cy.js`: carga la vista con datos simulados de momentos especiales y valida que los bloques y canciones persistidos se renderizan correctamente.

## 10. Checklist de despliegue
- Verificar reglas Firestore de `specialMoments`.  
- Asegurar traducciones (labels de bloques y placeholders).  
- Mantener catálogo `MUSIC_INSPIRATION` actualizado y sin enlaces caídos.
