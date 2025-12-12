# 31. Estilo Global (estado 2025-10-13)

> Implementado (oct-2025): tokens base en `src/index.css`, selector oscuro/claro (`src/components/ThemeToggle.jsx`), wizard de creacion (`CreateWeddingAI.jsx`), asistente conversacional (`CreateWeddingAssistant.jsx`), ficha de boda (`BodaDetalle.jsx`), contexto de IA (`ChatWidget.jsx`, `backend/routes/ai.js`), recomendaciones IA de proveedores (`src/utils/providerRecommendation.js`), generador web (`src/services/websiteService.js`, `src/utils/websitePromptBuilder.js`) y editor de paleta (`src/pages/disenos/VectorEditor.jsx`).
>
> Pendiente inmediato: reutilizar `weddings/{id}/branding/main.palette` en los generadores (web, invitaciones, assets), sincronizar cambios de `MaLove.AppProfile` con Firestore sin depender de eventos locales y exponer UI dedicada para editar estilo global dentro de `/perfil`.
>
> Backlog: soportar variaciones por subevento (recepcion, preboda), publicar libreria de tokens reutilizables para IA y front, ampliar coverage de pruebas (paleta, sincronizacion offline) y anadir alertas cuando el estilo no coincide con la configuracion de plantillas activas.

## 1. Objetivo y alcance
- Centralizar la identidad visual de cada boda (estilo, paleta, notas de branding) y del shell de la aplicacion.
- Compartir esos datos con asistentes IA, generadores automaticos y vistas operativas para mantener coherencia.
- Permitir que planners y owners ajusten colores, tono y estilo sin tocar codigo.

## 2. Trigger y rutas
- `/crear-evento` (`CreateWeddingAI.jsx`): formulario wizard con `select[name="style"]` alimentado por `EVENT_STYLE_OPTIONS`.
- `/crear-evento-asistente` (`CreateWeddingAssistant.jsx`): chat step-by-step, paso `style`, mismos options.
- `/perfil` (`Perfil.jsx`): card Datos de la boda con inputs `weddingStyle` y `colorScheme`.
- `/disenos/vector-editor` (`VectorEditor.jsx`): editor para guardar `branding/main.palette`.
- Chat global (`ChatWidget.jsx`): comandos IA `entity=config` que actualizan `MaLove.AppProfile.weddingInfo`.
- Tema global visible desde cualquier vista: `ThemeToggle.jsx` inserta/remueve clase `dark` en `<html>`.

## 3. Paso a paso UX
1. **Alta del evento**  
   - Seleccionar estilo en el paso 1 del wizard o responder en el asistente conversacional.  
   - El valor queda en `form.style` y se envia como `preferences.style` al crear la boda (`createWedding`).
2. **Ajustes posteriores**  
   - En `/perfil`, owners/planners editan texto libre para estilo y paleta para reflejar copy publico.  
   - El guardado actualiza `weddings/{id}.weddingInfo` y emite toast de confirmacion.
3. **Interacciones IA**  
   - El asistente (`ChatWidget`) muestra contexto "tu evento de estilo X" y admite comandos para cambiar estilo o colores; los cambios se guardan en localStorage y se sincronizan con Firestore via `ConfigEventBridge`.
4. **Diseno visual**  
   - `VectorEditor` carga paleta existente y permite modificar cada color; requiere boda activa.  
   - Boton Guardar paleta guarda `branding/main.palette` y muestra alertas basicas (navegador).
5. **Consumo y despliegue**  
   - Generador web (`DisenoWeb.jsx`) incluye estilo y esquema de color en prompts y fallback HTML.  
   - BodaDetalle y listados muestran etiqueta amigable (`STYLE_LABELS`).  
   - App shell usa variables CSS (light/dark) para mantener consistencia general.

## 4. Persistencia y datos
- `weddings/{id}.preferences.style`: enum (`clasico`, `boho`, `moderno`, `rustico`, `glam`, `minimal`).  
- `weddings/{id}.eventProfileSummary.style`: copia mantenida por `createWedding`.  
- `weddings/{id}.weddingInfo.weddingStyle`: texto libre (perfil).  
- `weddings/{id}.weddingInfo.colorScheme`: descripcion o lista de colores.  
- `weddings/{id}/branding/main` documento con `{ palette: string[], updatedAt }`.  
- LocalStorage `MaLove.AppProfile`: cache usado por `ChatWidget` y exportado a Firestore por `ConfigEventBridge`.  
- Variables CSS globales (`:root` y `.dark` en `src/index.css`), usadas por componentes UI.

## 5. Reglas de negocio
- Solo owners/planners autenticados pueden modificar estilo o paleta (rutas protegidas).  
- El wizard aplica `DEFAULT_STYLE` (`clasico`) cuando el usuario no selecciona nada.  
- Assistant ignora `ceremonyType` si `eventType !== 'boda'`.  
- Guardado de paleta requiere boda activa y Firebase inicializado; en caso contrario botones muestran `alert`.
- **Layout responsive:** el shell usa un contenedor reutilizable (`.layout-container`) con `width: 100%`, centrado mediante `margin: 0 auto` y `max-width: var(--layout-max-width, 1280px)`. Se declaran tokens `--layout-max-width`, `--layout-wide-width` (1440px para vistas densas) y breakpoints `--breakpoint-md: 768px`, `--breakpoint-lg: 1024px`, `--breakpoint-xl: 1440px`. El padding lateral se define como `clamp(16px, 4vw, 24px)` en desktop y cae a 16 px cuando `viewport < --breakpoint-md`; entre `--breakpoint-md` y `--breakpoint-lg` el contenedor reduce su `max-width` a 960 px para mantener legibilidad. Vistas de planner/IA pueden aplicar `--layout-wide-width` siempre que mantengan padding ≥32 px.

## 6. Estados especiales y errores
- Falta de estilo => fallback `Clasico` y `Blanco y dorado` en generador web (`sanitizeProfile`).  
- Sin paleta guardada => `VectorEditor` usa array por defecto (azules, verdes, neutros).  
- Offline: `ConfigEventBridge` almacena localmente y sincroniza cuando se emite `MaLove.App-profile`.  
- Fallback IA (sin OpenAI) construye respuestas con estilo y ubicacion (`backend/routes/ai.js:describeEvent`); Cypress cubre que el copy incluya estilo.

## 7. Integracion con otros flujos
- **Flujo 2 / 2B**: se encargan de capturar `preferences.style` en la alta.  
- **Flujo 5 (Proveedores IA)**: `recommendBestProvider` anade estilo a tokens de matching, impacta recomendaciones.  
- **Flujo 7 (Email)**: plantillas IA recomiendan mencionar estilo/paleta; parametros disponibles via perfil sincronizado.  
- **Flujo 8 (Diseno web)** y **21 (Sitio publico)**: prompts y post-procesador insertan `weddingStyle`, `colorScheme` y tokens por plantilla.  
- **Flujo 19 (Invitaciones)**: editor vectorial y assets reutilizan `branding/main.palette`.  
- **Flujo 22 (Dashboard)**: cards resumen usan `eventProfileSummary.style` para mostrar chips de estilo.

## 8. Metricas y monitorizacion
- `performanceMonitor` en `CreateWeddingAI.jsx` registra `event_creation_view`, `event_creation_step1_completed`, `event_creation_submit/succeeded/failed` con `style`.  
- No hay eventos especificos cuando se cambia paleta (`VectorEditor`) ni cuando el perfil se actualiza desde `ChatWidget`.  
- Firestore conserva `updatedAt` en `branding/main`; no se expone dashboard asociado todavia.  
- Globalmente no existen alertas cuando hay discrepancias entre `preferences.style` y `weddingInfo.weddingStyle`.

## 9. Pruebas recomendadas / cobertura actual
- `cypress/e2e/onboarding/create-event-flow.cy.js`: valida seleccion de estilo en el wizard (Flujo 2).  
- `cypress/e2e/assistant/chat-fallback-context.cy.js`: comprueba copy fallback IA incluyendo estilo `Boho`.  
- Faltan pruebas para guardar paleta (`VectorEditor`), edicion en `/perfil` y sincronizacion `ConfigEventBridge`.

## 10. Checklist de despliegue
- Confirmar que `EVENT_STYLE_OPTIONS` coincide con copy publico y traducciones.  
- Verificar reglas de seguridad Firestore para `weddings/{id}/branding`.  
- Asegurar que el bundle incluye `ThemeToggle` y variables CSS sin colisiones.  
- Revisar que asistentes IA reciban contexto (`style`, `guestCount`, `formality`) en `ChatWidget` antes de habilitar nuevas plantillas.

## 11. Roadmap / pendientes
- Consumir `branding/main.palette` en `websitePromptBuilder` y en generadores de invitaciones (`ImageGeneratorAI`).  
- Anadir UI declarativa de paleta/tipografias en `/perfil` con preview y guardado directo en Firestore (sin depender de localStorage).  
- Emitir eventos de monitoreo (p.ej. `style_updated`, `palette_saved`) y panel en dashboard admin.  
- Soportar estilos personalizados (valores libres) con normalizacion y mapeo IA.  
- Consolidar tokens CSS (crear `src/styles/tokens.css` referenciado en docs) y documentar proceso de override.  
- Tests e2e para vector editor y para cambios via comandos IA.

## 12. Pendientes detectados en codigo (2025-10-13)
- `src/pages/disenos/VectorEditor.jsx`: usa `alert` en vez de toasts y no maneja errores Firebase detallados; falta instrumentation y fallback cuando no hay boda activa.  
- `src/components/config/ConfigEventBridge.jsx`: solo escucha evento `MaLove.App-profile`; algunas pantallas (p.ej. guardado de logo) emiten `MaLove.App-profile-updated`, por lo que la sincronizacion no siempre corre. Evaluar ampliar listeners.  
- `src/services/websiteService.js`: `normalizeProfile` no consume `branding/main.palette`, dejando la web sin colores personalizados.  
- No existe repositorio central de CSS tokens (`docs/diseno/README.md` referencia `src/styles/tokens.css` pero el archivo no existe).
## Cobertura E2E implementada
- `cypress/e2e/style/style-global.cy.js`: asegura que el guardado de estilo y paleta desde `/perfil` persista correctamente (incluyendo feedback mediante toasts) incluso cuando se trabaja con Firestore simulado.
