# 19. Diseno de Invitaciones (estado 2025-10-07)

> Implementado: `InvitationDesigner.jsx`, `MisDisenos.jsx`, `VectorEditor.jsx`, `MenuCatering.jsx`, `PapelesNombres.jsx`, utils `pdfExport.js` y biblioteca de plantillas.
> Pendiente: tutoriales guiados, colaboracion/feedback, integracion con proveedores de impresion y generacion IA.

## 1. Objetivo y alcance
- Permitir crear, editar y gestionar invitaciones, menus y papeleria personalizada de la boda.
- Proveer plantillas, capas vectoriales y exportacion profesional a PDF.
- Centralizar disenos para compartir con invitados, proveedores o imprimir.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Extras** → “Diseños” (`/disenos`, lista `MisDisenos.jsx`) con enlaces a cada editor específico.
- Variantes dedicadas: `/diseno/invitaciones` (invitaciones), `/diseno/menu`, `/diseno/papeleria` — todos reutilizan `InvitationDesigner.jsx`.

## 3. Paso a paso UX
1. Seleccion de plantilla
   - Galeria por estilo, formato y categoria (invitacion, save-the-date, menu, seating cards).
   - Vista previa y duplicado de disenos existentes.
2. Edicion
   - Canvas con capas (texto, imagen, vector) y herramientas de estilo (fuentes, colores, alineacion, grid, undo/redo).
   - Soporte para assets propios (imagenes, SVG) y banco interno.
   - Ajustes de formato (tamano, sangria, safe zone) para impresion.
3. Exportacion y gestion
   - Exportar a PDF/PNG con sangrias, marcas de corte y perfiles de color.
   - Guardado automatico en Cloud Storage y versionado en `MisDisenos`.
   - Compartir con colaboradores (link o descarga) y asociar a proveedores.

## 4. Persistencia y datos
- Firestore `weddings/{id}/designs/{designId}`: metadata, tipo, categorias, estado, version.
- Storage `designs/{weddingId}/{designId}`: archivos renderizados y assets subidos.
- `designTemplates` (global) con definiciones base y previews.
- Historial/actividad en `weddings/{id}/designActivity` (quien edita, cuando exporta).

## 5. Reglas de negocio
- Solo owner/planner pueden crear y borrar; assistants pueden duplicar/editar segun permisos.
- Limite de disenos activos para cuentas gratuitas (configurable).
- Exportacion a alta resolucion requiere completar metadata (fecha, nombres, ubicacion).
- Assets con derechos reservados se marcan y piden confirmacion de uso.

## 6. Estados especiales y errores
- Sin plantillas -> mostrar mensaje "Carga tus plantillas" y CTA.
- Archivo demasiado pesado -> sugerencia de compresion o resolucion maxima.
- Error de render -> log en `designErrors` y fallback a version anterior.
- Guardado offline -> cola local y aviso para reconectar.

## 7. Integracion con otros flujos
- Flujo 3/9 para generar invitaciones con enlaces RSVP y codigos QR.
- Flujo 5 (Proveedores) vincula disenos a proveedores de impresion.
- Flujo 8 (Sitio web) reutiliza assets para hero e imagenes.
- Flujo 14 crea tareas de revision y entrega.
- Flujo 21 publica disenos seleccionados en sitio publico.

## 8. Metricas y monitorizacion
- Eventos: `design_created`, `design_exported`, `design_shared`, `design_template_used`.
- Indicadores: ratio de exportacion, tiempo promedio de edicion, plantillas mas usadas.
- Telemetria para fallos de render y errores de carga de assets.

## 9. Pruebas recomendadas
- Unitarias: reducers de capas, normalizacion de estilos, generador PDF.
- Integracion: editar -> guardar -> exportar -> verificar archivo en storage.
- E2E: crear invitacion desde plantilla, insertar QR RSVP, descargar PDF.

## 10. Checklist de despliegue
- Reglas Firestore para `designs`, `designActivity`, `designTemplates`, `designErrors`.
- Configurar limites de upload y validaciones en Cloud Storage.
- Revisar fuentes licenciadas y paquetes de iconos.
- Actualizar portada/template default por temporada.

## 11. Roadmap / pendientes
- Editor colaborativo con comentarios y versionado.
- Generacion IA de propuestas a partir del perfil de la boda.
- Integracion con proveedores (impresion/envio) y tracking.
- Biblioteca de tutoriales y guias de estilo interactivas.
- Marketplace de plantillas premium.
