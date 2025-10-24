# 11A. Momentos Especiales de la Boda

> Componentes clave: `src/pages/protocolo/MomentosEspeciales.jsx`, `src/hooks/useSpecialMoments.js`, `src/data/musicInspiration.js`
> Persistencia: `weddings/{id}/specialMoments/main` (blocks + moments) y localStorage `mywed360SpecialMoments`
> Pendiente: campos avanzados (responsables, suppliers), drag&drop, alertas guiadas y destinatarios por momento.

## 1. Objetivo y alcance
- Centralizar todos los momentos significativos del evento (ceremonia, c�ctel, banquete, disco, extras).
- Gestionar lecturas, m�sica, responsables y requisitos t�cnicos de cada bloque.
- Ofrecer inspiraci�n musical asistida por IA y plantillas para duplicar/reordenar momentos.

## 2. Triggers y rutas
- Navegaci�n: `M�s � Protocolo � Momentos especiales`; es la pesta�a principal dentro de Protocolo.
- Acceso r�pido desde tareas que contengan momentos especiales, votos, lecturas (ver `TasksRefactored.jsx`).
- Notificaciones internas pueden enlazar al flujo cuando faltan canciones en bloques cr�ticos.

## 3. Estado actual

### Implementado hoy
- Pesta�as din�micas por bloque (`MomentosEspeciales.jsx:21-33`) con acciones de renombrar/mover via prompt.  
- Edici�n de t�tulo, canci�n, hora y duraci�n; duplicar/mover secciones mediante botones.  
- B�squeda musical (fetch iTunes) y recomendaciones IA b�sicas (`MomentosEspeciales.jsx:601-678`).  
- Persistencia dual: localStorage + Firestore (`useSpecialMoments.js:60-119`).  
- Duplicado/movimiento de momentos entre bloques mediante prompts (`MomentosEspeciales.jsx:1048-1099`).  

## Roadmap / pendientes
- Campos adicionales (responsables, requisitos t�cnicos, suppliers, estado) descritos originalmente.  
- Reordenamiento drag&drop y l�mite de 200 momentos.  
- Alertas por campos faltantes y duplicado/movimiento con UI guiada.  
- Destinatario opcional por momento (selector colapsable que permite asociar invitados/roles concretos para integraciones como seating VIP).

## 4. Datos y modelo
- **Estructura base** (`DEFAULT_BLOCKS` y `defaultData` en `useSpecialMoments.js`).  
- Cada momento incluye campos `id`, `order`, `title`, `song`, `time`, `duration`, `type`, `responsables`, `suppliers`, `optional`, `state` (se a�adir� `recipientId`/`recipientName` como campo opcional).  
- Sincronizaci�n doble: localStorage para respuesta inmediata y Firestore (`setDoc` a `.../specialMoments/main`).  
- Migraciones: hook migra datos antiguos (`momentosEspeciales`) a la nueva colecci�n.

## 5. Reglas de negocio (vigentes)
- Los IDs de bloques proceden del slug generado en el hook; renombrar no sincroniza a�n con Timing.  
- S�lo se valida el t�tulo; el resto de campos son opcionales y no generan alertas.  
- No hay l�mite de momentos activo (por ahora queda abierto).

## 6. Estados especiales
- Si no hay bloques, se inicializa con plantilla por defecto (ceremonia, coctel, banquete, disco).  
- Error en reproducci�n musical � se muestra alerta en consola y se cancela playback; no bloquea edici�n.  
- Cuando no hay conexi�n, los cambios persisten localmente y se sincronizan al recuperar Firestore.

## 7. Integraciones
- **Flujo 11B**: `Timing.jsx` consume `specialMoments` para poblar hitos y permite reordenar desde timeline.  
- **Flujo 11C**: checklist consulta totales de momentos con canci�n asignada.  
- **Flujo 6 (Presupuesto)**: responsables y suppliers se utilizan para cotizaciones de m�sica/sonido.  
- **Flujo 21**: se pueden publicar fragmentos (momentos destacados) en la web p�blica.  
- **Flujo 4 (Seating plan)**: el destinatario opcional alimentar� la lista de VIP para exportaciones y m�tricas del smart panel.

## 8. M�tricas y eventos
- Eventos emitidos: `special_moment_added`, `special_moment_removed`, `special_moment_state_changed`.  
- Indicadores sugeridos: n� momentos por bloque, % con canci�n, bloques personalizados.  
- Logging IA se limita a console.log para depuraci�n.

## 9. Pruebas recomendadas
- Unitarias: `useSpecialMoments` (creaci�n, migraci�n, sincronizaci�n).  
- Integraci�n: a�adir/duplicar momentos � reflejo inmediato en Timeline.  
- E2E: planner crea bloques personalizados, asigna canciones via b�squeda y verifica persistencia tras recarga.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/protocolo-flows.cy.js`: carga la vista con datos simulados de momentos especiales y valida que los bloques y canciones persistidos se renderizan correctamente.

## 10. Checklist de despliegue
- Verificar reglas Firestore de `specialMoments`.  
- Asegurar traducciones (labels de bloques y placeholders).  
- Mantener cat�logo `MUSIC_INSPIRATION` actualizado y sin enlaces ca�dos.
