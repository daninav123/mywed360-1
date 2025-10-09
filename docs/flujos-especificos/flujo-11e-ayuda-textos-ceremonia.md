# 11E. Ayuda a Lecturas y Votos

> Componente clave: `src/pages/protocolo/AyudaCeremonia.jsx`
> Persistencia: Firestore (`weddings/{id}/ceremonyTexts/main`) con sincronización en tiempo real y metadatos de usuario

## 1. Objetivo y alcance
- Proveer un espacio guiado para que ayudantes, familiares o la pareja redacten y mejoren textos que se leerán durante la ceremonia.  
- Gestionar lecturas, sorpresas y otros momentos discursivos (votos, agradecimientos, discursos post banquete).  
- Facilitar inspiración, control de versiones y seguimiento del estado (borrador, en revisión, final).

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Ayuda Ceremonia`.  
- Desde Momentos Especiales (Flujo 11A) se puede redirigir cuando un momento tipo “lectura” no tiene contenido definido.  
- Eventos de checklist pueden apuntar aquí cuando falte preparar discursos.

## 3. Estado actual vs. pendientes

**Implementado hoy**
- Dos pestañas operativas: "Lecturas" y "Ramos y Sorpresas".  
- Editor de lecturas con duración estimada automática, vista previa modal y control de estado (`draft`/`final`).  
- Persistencia compartida en Firestore con `updatedAt`, `updatedBy` y registro de eventos (`ceremony_text_created`, `ceremony_text_finalized`).  
- Lista de sorpresas con alta, cambio de estado y eliminación sincronizados en tiempo real.  
- Permisos de edición basados en rol (planner/owner/assistant) expuestos desde `useCeremonyTexts`.

**Pendiente / roadmap**
- Tabs adicionales (votos, discursos) y plantillas específicas por tipo.  
- Campos extra: notas privadas, enlace directo a momentos de 11A y responsables asignados.  
- Control de versiones, duplicado, favoritos y exportación (PDF/proyección).  
- Integración IA (reescritura, tono) y publicación automática en flujo 21.  
- Validación de permisos en backend y auditoría detallada.

## 4. Datos y modelo
- Documento `weddings/{id}/ceremonyTexts/main` con `{ readings, surprises, updatedAt, updatedBy, lastAction }`.  
- Lecturas: `id`, `title`, `content`, `duration`, `status`, timestamps.  
- Sorpresas: `id`, `type`, `recipient`, `table`, `description`, `notes`, `status`, timestamps.

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
- Eventos emitidos: `ceremony_text_created`, `ceremony_text_finalized`, `ceremony_surprise_added`.  
- Indicadores sugeridos: nº textos finalizados, duración total estimada, sorpresas entregadas.

## 9. Pruebas recomendadas
- Unitarias: helpers de división de tabs, validación de estados.  
- Integración: crear lectura → asignar a momento en 11A → marcar final y validar checklist.  
- E2E: ayudante inicia sesión, redacta votos, marca como final y planner visualiza el resultado.


## Cobertura E2E implementada
- `cypress/e2e/email/smart-composer.cy.js y cypress/e2e/email/ai-provider-email.cy.js`: cubren la generación asistida de textos, reutilizada por el asistente de ceremonia.
- Cobertura adicional pendiente para el flujo específico de textos.

## 10. Checklist de despliegue
- Verificar reglas Firestore para `ceremonyTexts`.  
- Revisar textos de muestra y traducciones.  
- Validar permisos según rol y auditoría (`updatedBy`).
