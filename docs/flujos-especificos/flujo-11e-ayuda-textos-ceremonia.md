# 11E. Ayuda a Lecturas y Votos

> Componente clave: `src/pages/protocolo/AyudaCeremonia.jsx`
> Persistencia: actualmente local (state en memoria); pendiente definir almacenamiento en Firestore

## 1. Objetivo y alcance
- Proveer un espacio guiado para que ayudantes, familiares o la pareja redacten y mejoren textos que se leerán durante la ceremonia.  
- Gestionar lecturas, sorpresas y otros momentos discursivos (votos, agradecimientos, discursos post banquete).  
- Facilitar inspiración, control de versiones y seguimiento del estado (borrador, en revisión, final).

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Ayuda Ceremonia`.  
- Desde Momentos Especiales (Flujo 11A) se puede redirigir cuando un momento tipo “lectura” no tiene contenido definido.  
- Eventos de checklist pueden apuntar aquí cuando falte preparar discursos.

## 3. Experiencia de usuario
1. **Tabs temáticos** (`lecturas`, `votos`, `sorpresas`, `discursos`), controlados por `activeTab`.  
2. **Editor ligero**: campos para título, contenido, duración, notas y estado (`draft | review | final`).  
3. **Vista previa**: modal simple para repasar el texto antes de compartirlo.  
4. **Plantillas sugeridas**: se muestran recomendaciones de estructura, saludos e ideas según el tipo de lectura.  
5. **Colaboración básica**: botones para duplicar, marcar como favoritos y exportar (pendiente conectar con almacenamiento).

## 4. Datos y modelo
- El estado actual vive en memoria (arrays `readings`, `surprises`, etc.).  
- Futuro: sincronizar con Firestore (`weddings/{id}/ceremonyTexts`) para compartir entre usuarios.  
- Cada lectura incluye `id`, `title`, `content`, `duration`, `status`.  
- Sorpresas/discursos añaden campos `recipient`, `table`, `notes` para logística.

## 5. Reglas de negocio
- Estados de texto: `draft`, `review`, `final` determinan qué se mostrará al público (cuando se integre con flujo 21).  
- Duplicar un texto genera un nuevo id timestamp.  
- Los ayudantes sólo pueden editar si tienen rol `assistant` o `planner`; `guest` lo verá en modo lectura (validación pendiente en hook de auth).

## 6. Estados especiales
- **Sin lecturas**: se muestra CTA para crear la primera y sugerencias predeterminadas.  
- **Sesión expirada**: si el usuario pierde autenticación, se bloquea la edición hasta re-login.  
- **Modo lectura**: cuando el usuario no tiene permisos, se ocultan botones de edición.

## 7. Integraciones
- **Flujo 11A**: las lecturas se vinculan a momentos concretos (ej. lectura 1, votos).  
- **Flujo 11C**: checklist verifica que todos los textos marcados como obligatorios estén en estado `final`.  
- **Flujo 21**: exportará extractos al sitio público o a PDFs para programas impresos.  
- **IA Generativa** (backlog): botón “Reescribir con IA” para sugerir mejoras automáticas.

## 8. Métricas y eventos
- Eventos (a implementar): `ceremony_text_created`, `ceremony_text_finalized`.  
- Indicadores: número de textos finales, duración total estimada de lecturas, número de sorpresas confirmadas.

## 9. Pruebas recomendadas
- Unitarias: helpers de división de tabs, validación de estados.  
- Integración: crear lectura → asignar a momento en 11A → marcar final y validar checklist.  
- E2E: ayudante inicia sesión, redacta votos, marca como final y planner visualiza el resultado.

## 10. Checklist de despliegue
- Definir persistencia compartida antes de abrir a invitados.  
- Revisar textos de muestra y traducciones.  
- Validar permisos según rol en `useAuth`/`WeddingContext`.
