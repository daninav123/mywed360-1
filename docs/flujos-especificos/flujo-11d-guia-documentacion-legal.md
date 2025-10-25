# 11D. Guía de Documentación Legal

> Componentes clave: `src/pages/protocolo/DocumentosLegales.jsx`, plantillas en `docs/protocolo/*.md`
> Persistencia actual: localStorage (`legalRequirements_{weddingId}`), Cloud Storage y documentos en `weddings/{id}/documents` con `category = 'legal'` y `relatedCeremonyId` derivado del requisito
> Pendiente: ampliar el catalogo internacional, sincronizacion multiusuario y automatismos con la checklist legal.

## 1. Objetivo y alcance
- Ofrecer a la pareja una guía paso a paso para reunir toda la documentación necesaria (civil, religiosa, simbólica).  
- Centralizar plantillas descargables y enlaces útiles por país/region.  
- Sugerir qué documentos adjuntar a la carpeta de la boda en el panel de Documentos.
- Personalizar la experiencia con requisitos, plazos y autoridades según la jurisdicción principal de la pareja, permitiendo contrastar alternativas cuando la ceremonia se celebra en otro país.

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Documentos` (enlace independiente del layout).  
- Enlaces desde la checklist cuando un ítem legal permanece pendiente.  
- Notificaciones legales pueden dirigir a esta página para completar trámites.
- El país por defecto se resuelve desde `weddings/{id}/profile.location.country` (fallback a la preferencia idiomática), con selector manual destacado para cambiar la jurisdicción cuando la pareja celebra en otro destino.

## 3. Estado actual

### Implementado hoy
- Resumen de datos de la boda (`DocumentosLegales.jsx:250-275`).  
- Tabs por tipo “civil” / “iglesia” y selección de país (ES/FR/US).  
- Seguimiento local mediante `localStorage` (`loadLegalProgress` / `saveLegalProgress`).  
- Plantillas descargables (.DOC/.PDF) generadas en cliente (`generateTemplateHTML`).  
- Subida de archivos con registro automático en `weddings/{id}/documents` (categoría `legal`, `relatedCeremonyId` deducido) y almacenamiento en Cloud Storage.

## Roadmap / pendientes
- Tipos adicionales (simbólica, destino) y más países.  
- Desplegar variaciones completas por país: para cada combinación `tipo de ceremonia × país` se definen bloques (preparación, obtención, legalización), responsables, plazos sugeridos y alertas contextuales (ej. apostillas). La disposición se ajusta por jurisdicción sin depender de pestañas compartidas.
- Selector de país con memoria multiusuario: el país asignado automáticamente se almacena en `weddings/{id}/ceremony/legal.countryOrigin`, mientras que los overrides manuales se registran por usuario para evitar conflictos (`legalSettings/{uid}` con `preferredCountry` y timestamp).
- Sincronización multiusuario (guardar progreso en Firestore) y notas por requisito.  
- Instrumentación (`ceremony_document_guide_opened`) y automatismos en checklist (marcar estado).
- Catálogo global de requisitos mantenido en Firestore/Storage para cubrir certificados civiles, religiosos y especiales (ver sección de Datos y modelo).

## 4. Datos y modelo
- `LEGAL_REQUIREMENTS` incluye ES/FR/US; se migrará a `LEGAL_REQUIREMENTS_CATALOG`, colección Firestore (`legalRequirementsCatalog/{countryCode}/{ceremonyType}/{requirementId}`) versionada mediante campo `schemaVersion`.  
  - Campos mínimos: `displayName`, `description`, `authority`, `documentation`, `steps[]`, `leadTimeDays`, `costEstimate`, `requiresAppointment`, `digitalAvailability`, `translationsNeeded`, `relatedCertificates[]`, `evidences[]`, `links[]`.  
  - Cada requisito referencia la entidad emisora (`authorityRef`) y, cuando aplica, dependencias previas (`prerequisiteIds`).  
  - Se mantiene snapshot estático en `docs/protocolo/legal/` para versiones offline y QA (ver `docs/protocolo/legal/catalogo-requisitos-union-europea.md` como lote inicial).
  - `docs/protocolo/legal/legal-requirements-catalog.json` expone el dataset estructurado (`schemaVersion = 1`) listo para importarse en Firestore o servirse vía API.

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2025-10-11T16:51:33Z",
  "countries": {
    "ES": {
      "name": "España",
      "metadata": { "notes": ["El expediente suele tardar 30–90 días", "..."] },
      "ceremonyTypes": {
        "civil": {
          "requirements": [
            {
              "id": "civil-core",
              "displayName": "Expediente civil",
              "authority": "Registro Civil municipal o juzgado de paz para expediente y ceremonia",
              "documentation": [
                "DNI/NIE/pasaporte",
                "certificado literal de nacimiento (<6 meses)",
                "..."
              ],
              "steps": [
                {
                  "id": "collect_documents",
                  "title": "Reunir documentación",
                  "description": "DNI/NIE/pasaporte; certificado literal de nacimiento..."
                }
              ],
              "leadTimeDays": 90,
              "requiresAppointment": false,
              "digitalAvailability": "in_person",
              "translationsNeeded": true,
              "links": [
                {
                  "type": "reference",
                  "label": "Your Europe – España",
                  "url": "https://europa.eu/youreurope/..."
                }
              ]
            }
          ]
        },
        "religious_catholic": {
          "requirements": [
            {
              "id": "religious-catholic",
              "displayName": "Ceremonia religiosa con efectos civiles",
              "documentation": ["parroquia solicita partida de bautismo actualizada", "..."]
            }
          ]
        }
      }
    }
  }
}
```
- **Importación sugerida**: leer el JSON, recorrer `countries.{code}.ceremonyTypes.{type}.requirements[]` y persistir cada elemento como documento `legalRequirementsCatalog/{code}/{type}/{requirement.id}`. Incluir `countryName`, `schemaVersion` y `metadata.sourceUrl` como campos redundantes para las vistas clientes.
- **Actualización**: regenerar el JSON tras cambios en `catalogo-requisitos-union-europea.md` para mantener alineados documentación y dataset operacional.
- **Sync script**: ejecutar `node scripts/syncLegalRequirementsCatalog.js` (flags opcionales `--dry-run`, `--prune`, `--file=...`) para volcar el catálogo en Firestore. Se requieren credenciales de servicio (`GOOGLE_APPLICATION_CREDENTIALS`).

- Progreso almacenado sólo en localStorage (sin notas ni deadlines).  
- Cada archivo subido crea o actualiza un documento en `weddings/{id}/documents` con campos `{ name, url, category: 'legal', relatedCeremonyId, status: 'uploaded', requirementKey, storagePath, size, uploadedAt, uploadedBy }`.

## 5. Reglas de negocio
- La guía es orientativa: no bloquea el avance del planner ni valida datos contra autoridades.  
- Los links dependen de configuración regional (`useTranslations` detecta idioma y preferencia geográfica).  
- La jurisdicción inicial corresponde al país del perfil de la boda; la UI muestra aviso cuando el lugar de celebración (`event.country`) difiere para invitar a comparar ambos catálogos.  
- Al cambiar de país se recalculan los requisitos y se persiste el override; el histórico de acciones (`legalCountryChange`) se envía al analytics para medir uso.  
- Los testigos se consideran confirmados sólo cuando existe archivo en Documentos o se marca manualmente en checklist.  
- En bodas destino, se enfatiza la necesidad de apostillas y traducciones juradas (texto destacado).

## 6. Estados especiales
- **Sin datos de boda**: se muestran requisitos genéricos.  
- **Cambios de idioma**: se recomputa el listado y las plantillas sugeridas.  
- **Falta de almacenamiento local**: si `localStorage` falla, se mantiene la guía en modo sólo lectura (toast informativo).

## 7. Integraciones
- **Flujo 11C**: los documentos subidos aparecen automáticamente como adjuntos en la checklist.  
- **Flujo 14/15**: la subida de documentos desde esta guía rellena entradas en Contratos/Documentos.  
- **Seeds**: plantilla demo genera documentación base (`scripts/seedTestDataForPlanner.js:188`).

## 8. Métricas y eventos
- Evento `ceremony_document_uploaded` al registrar cada archivo (incluye `relatedCeremonyId`).  
- Evento `ceremony_legal_country_changed` para rastrear overrides manuales y medir divergencias entre país origen y destino.  
- Indicadores propuestos: requisitos marcados, archivos subidos, días restantes; `ceremony_document_guide_opened` continúa en backlog.

## 9. Pruebas recomendadas
- Unitarias: carga de requisitos por país, persistencia en localStorage.  
- Integración: marcar requisito → reflejo en checklist y subida de archivo.  
- E2E: pareja completa todos los pasos, descarga plantillas y adjunta documentos.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/protocolo-flows.cy.js`: comprueba la carga de la guía de documentos legales y la disponibilidad del generador de PDFs en modo stub.

## 10. Checklist de despliegue
- Revisar contenidos por país y mantener enlaces actualizados.  
- Verificar traducciones y formato de fechas.  
- Confirmar que las plantillas existen en `docs/protocolo` y se exponen correctamente desde la UI.
