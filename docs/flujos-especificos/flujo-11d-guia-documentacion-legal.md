# 11D. Guía de Documentación Legal

> Componentes clave: `src/pages/protocolo/DocumentosLegales.jsx`, plantillas en `docs/protocolo/*.md`
> Persistencia: localStorage (`legalRequirements_{weddingId}`) y Firestore `weddings/{id}/documents` (cuando la pareja sube archivos)

## 1. Objetivo y alcance
- Ofrecer a la pareja una guía paso a paso para reunir toda la documentación necesaria (civil, religiosa, simbólica).  
- Centralizar plantillas descargables y enlaces útiles por país/region.  
- Sugerir qué documentos adjuntar a la carpeta de la boda en el panel de Documentos.

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Documentos` (enlace independiente del layout).  
- Enlaces desde la checklist cuando un ítem legal permanece pendiente.  
- Notificaciones legales pueden dirigir a esta página para completar trámites.

## 3. Estado actual vs. pendientes

**Implementado hoy**
- Resumen de datos de la boda (`DocumentosLegales.jsx:250-275`).  
- Tabs por tipo “civil” / “iglesia” y selección de país (ES/FR/US).  
- Seguimiento local mediante `localStorage` (`loadLegalProgress` / `saveLegalProgress`).  
- Plantillas descargables (.DOC/.PDF) generadas en cliente (`generateTemplateHTML`).  
- Subida opcional de archivos al Storage, guardando referencia en el progreso local.  

**Pendiente / roadmap**
- Tipos adicionales (simbólica, destino) y más países.  
- Registro automático en `weddings/{id}/documents` con `relatedCeremonyId`.  
- Sincronización multiusuario (Firestore) y notas por requisito.  
- Instrumentación (`ceremony_document_guide_opened`) y checklist integrada.

## 4. Datos y modelo
- `LEGAL_REQUIREMENTS` incluye ES/FR/US; resto queda pendiente.  
- Progreso almacenado sólo en localStorage (no hay notas ni deadlines).  
- Archivos subidos actualmente quedan sólo en Storage/localProgress; no se crea documento en Firestore.

## 5. Reglas de negocio
- La guía es orientativa: no bloquea el avance del planner ni valida datos contra autoridades.  
- Los links dependen de configuración regional (`useTranslations` detecta idioma y preferencia geográfica).  
- Los testigos se consideran confirmados sólo cuando existe archivo en Documentos o se marca manualmente en checklist.  
- En bodas destino, se enfatiza la necesidad de apostillas y traducciones juradas (texto destacado).

## 6. Estados especiales
- **Sin datos de boda**: se muestran requisitos genéricos.  
- **Cambios de idioma**: se recomputa el listado y las plantillas sugeridas.  
- **Falta de almacenamiento local**: si `localStorage` falla, se mantiene la guía en modo sólo lectura (toast informativo).

## 7. Integraciones
- **Flujo 11C**: checklist enlaza a secciones concretas según `relatedDocType`.  
- **Flujo 14/15**: la subida de documentos desde esta guía rellena entradas en Contratos/Documentos.  
- **Seeds**: plantilla demo genera documentación base (`scripts/seedTestDataForPlanner.js:188`).

## 8. Métricas y eventos
- Sin eventos capturados todavía; `ceremony_document_guide_opened` se mantiene como mejora futura.  
- Indicadores propuestos: requisitos marcados, archivos subidos, días restantes.

## 9. Pruebas recomendadas
- Unitarias: carga de requisitos por país, persistencia en localStorage.  
- Integración: marcar requisito → reflejo en checklist y subida de archivo.  
- E2E: pareja completa todos los pasos, descarga plantillas y adjunta documentos.

## 10. Checklist de despliegue
- Revisar contenidos por país y mantener enlaces actualizados.  
- Verificar traducciones y formato de fechas.  
- Confirmar que las plantillas existen en `docs/protocolo` y se exponen correctamente desde la UI.
