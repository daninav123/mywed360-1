# 11E. Ayuda a Lecturas y Votos

> Componente clave: `src/pages/protocolo/AyudaCeremonia.jsx`
> Persistencia: Firestore (`weddings/{id}/ceremonyTexts/main`) con sincronizaci�n en tiempo real y metadatos de usuario
> Pendiente: ampliar tabs dedicadas, control de versiones, integracion IA y cobertura E2E para usuarios ayudantes.

## 1. Objetivo y alcance
- Proveer un espacio guiado para que ayudantes, familiares o la pareja redacten y mejoren textos que se leer�n durante la ceremonia.  
- Gestionar lecturas, sorpresas y otros momentos discursivos (votos, agradecimientos, discursos post banquete).  
- Facilitar inspiraci�n, control de versiones y seguimiento del estado (borrador, en revisi�n, final).

## 2. Triggers y rutas
- Navegaci�n: `M�s � Protocolo � Ayuda Ceremonia`.  
- Desde Momentos Especiales (Flujo 11A) se puede redirigir cuando un momento tipo lectura no tiene contenido definido.  
- Eventos de checklist pueden apuntar aqu� cuando falte preparar discursos.

## 3. Estado actual

### Implementado hoy
- Secciones dedicadas para "Lecturas" y "Ramos y Sorpresas", disponibles como rutas independientes dentro de Protocolo.  
- Editor de lecturas con duraci�n estimada autom�tica, vista previa modal y control de estado (`draft`/`final`).  
- Persistencia compartida en Firestore con `updatedAt`, `updatedBy` y registro de eventos (`ceremony_text_created`, `ceremony_text_finalized`).  
- Lista de sorpresas con alta, cambio de estado y eliminaci�n sincronizados en tiempo real.  
- Permisos de edici�n basados en rol (planner/owner/assistant) expuestos desde `useCeremonyTexts`.

## Roadmap / pendientes
- Tabs adicionales (votos, discursos) y plantillas espec�ficas por tipo.  
- Tabs deben soportar experiencias segmentadas para cada miembro de la pareja (votos ella/�l/elle) y para ayudantes.  
- Campos extra: notas privadas, enlace directo a momentos de 11A, responsables asignados y tags de inspiraci�n.  
- Control de versiones con historial consultable, duplicado, favoritos y exportaci�n (PDF/proyecci�n).  
- Validaciones en cliente (t�tulo requerido, evitar duplicados, longitud m�nima) con surfaced feedback y recuperaci�n ante errores de red.  
- Integraci�n IA (reescritura, tono) y publicaci�n autom�tica en flujo 21.  
- Validaci�n de permisos en backend y auditor�a detallada, incluyendo trazabilidad de qui�n vio o edit� cada texto.  
- M�tricas operativas en UI (duraci�n total de ceremonia, ratio de textos finalizados) y eventos adicionales para checklist 11C.  
- Pruebas E2E dedicadas para usuarios ayudantes y miembros de la pareja cubriendo visibilidad, estados y vistas previas.

## 4. Datos y modelo
- Documento `weddings/{id}/ceremonyTexts/main` con `{ readings, surprises, updatedAt, updatedBy, lastAction }`.  
- Lecturas: `id`, `title`, `content`, `duration`, `status`, timestamps.  
- Sorpresas: `id`, `type`, `recipient`, `table`, `description`, `notes`, `status`, timestamps.

## 5. Reglas de negocio
- Estados de texto: `draft`, `review`, `final` determinan qu� se mostrar� al p�blico (cuando se integre con flujo 21); la interfaz debe permitir transiciones explicitas y registro de qui�n mueve cada estado.  
- Duplicar un texto genera un nuevo id timestamp.  
- Los ayudantes s�lo pueden editar si tienen rol `assistant` o `planner`; `guest` lo ver� en modo lectura (validaci�n pendiente en hook de auth).
- Visibilidad segmentada: cada miembro de la pareja �nicamente accede a sus votos hasta que ambos est�n en `final`; los votos de la otra persona se ocultan salvo para el planner. Las lecturas creadas por ayudantes permanecen invisibles para los novios hasta que se marquen `final` o el planner las comparta expl�citamente.

## 6. Estados especiales
- **Sin lecturas**: se muestra CTA para crear la primera y sugerencias predeterminadas.  
- **Sesi�n expirada**: si el usuario pierde autenticaci�n, se bloquea la edici�n hasta re-login.  
- **Modo lectura**: cuando el usuario no tiene permisos, se ocultan botones de edici�n.

## 7. Integraciones
- **Flujo 11A**: las lecturas se vinculan a momentos concretos (ej. lectura 1, votos).  
- **Flujo 11C**: checklist verifica que todos los textos marcados como obligatorios est�n en estado `final`.  
- **Flujo 21**: exportar� extractos al sitio p�blico o a PDFs para programas impresos.  
- **IA Generativa** (backlog): bot�n Reescribir con IA para sugerir mejoras autom�ticas.

## 8. M�tricas y eventos
- Eventos emitidos: `ceremony_text_created`, `ceremony_text_finalized`, `ceremony_surprise_added`; a�adir `ceremony_text_state_changed` y `ceremony_text_viewed` para auditor�a.  
- Indicadores sugeridos: n� textos finalizados, duraci�n total estimada, sorpresas entregadas, ratio de textos en `review` y distribuciones de visibilidad por rol.

## 9. Pruebas recomendadas
- Unitarias: helpers de divisi�n de tabs, validaci�n de estados y reglas de visibilidad segmentada.  
- Integraci�n: crear lectura � asignar a momento en 11A � marcar final y validar checklist.  
- E2E: ayudante inicia sesi�n, redacta votos, marca como final y planner visualiza el resultado.


## Cobertura E2E implementada
- `cypress/e2e/email/smart-composer.cy.js y cypress/e2e/email/ai-provider-email.cy.js`: cubren la generaci�n asistida de textos, reutilizada por el asistente de ceremonia.
- Cobertura adicional pendiente para el flujo espec�fico de textos.

## 10. Checklist de despliegue
- Verificar reglas Firestore para `ceremonyTexts`.  
- Revisar textos de muestra y traducciones.  
- Validar permisos seg�n rol y auditor�a (`updatedBy`).
