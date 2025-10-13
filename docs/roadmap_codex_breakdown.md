# Roadmap Breakdown - Codex Ready Tasks

Source sections: `docs/roadmap.md` (11A Momentos especiales, 11B Timeline dia B, flujo 6 Presupuesto) y `roadmap.json`.

## 11A - Momentos Especiales

- **11A-01 | Firestore schema + reglas + seeds**
  - Extender `specialMoments` con campos `responsible`, `suppliers`, `status`, `techRequirements`, `ownerNotes`.
  - Actualizar `firestore.rules` para validar tipos y tamano de colecciones (max 200 momentos, max 12 suppliers por momento).
  - Ajustar `src/hooks/useSpecialMoments.js`, `src/utils/timingGenerator.js` y seeds (`scripts/seedTestDataForPlanner.js`) para inicializar los campos.
  - Migrar datos existentes con script en `scripts/migrations/migrateSpecialMomentsFields.js`.
  - **Aceptacion**: documentos nuevos/antiguos incluyen los campos con defaults; reglas bloquean valores no permitidos; seeds reflejan cambios.
  - **Checks**: `npm run test:unit -- src/__tests__/firestore.rules.seating.test.js`, `npm run lint`, ejecutar script de migracion en entorno local.

- **11A-02 | UI avanzada para campos extra**
  - Ampliar formularios en `src/pages/protocolo/MomentosEspeciales.jsx` y componentes reutilizados para capturar responsables, suppliers (multi-select con chips), estado y requisitos tecnicos.
  - Exponer notas internas (`ownerNotes`) con editor simple (textarea) y traducciones via i18n.
  - Persistir cambios usando helpers existentes en `useSpecialMoments`.
  - **Aceptacion**: crear/editar momento muestra los nuevos campos, persiste y rehidrata datos; proveedores destacados limitados a 12 elementos con feedback.
  - **Checks**: `npm run test:unit -- src/__tests__/protocolo/momentosEspeciales.form.test.js` (crear nuevo si no existe), smoke manual creando momento con suppliers.

- **11A-03 | Drag & drop y limites**
  - Integrar `@dnd-kit` (ya en repo) o utilidades locales en `MomentosEspeciales.jsx` para permitir reordenar momentos dentro de bloque.
  - Aplicar limite de 200 momentos totales; mostrar aviso al alcanzar 190 y bloquear creacion adicional al superar 200.
  - Guardar orden via `reorderMoment` en `useSpecialMoments`; agregar pruebas unitarias a `src/hooks/__tests__/useSpecialMoments.reorder.test.js`.
  - **Aceptacion**: reordenar actualiza Firestore/estado; se impide exceder el limite; tests cubren overflow.
  - **Checks**: `npm run test:unit -- src/hooks/__tests__/useSpecialMoments.reorder.test.js`.

- **11A-04 | Alertas guiadas y destinatarios**
  - Implementar validacion de campos obligatorios con toasts contextualizados y banner por bloque (faltantes, duplicados, movimiento de bloques).
  - Añadir panel colapsable "Destinatarios" usando `recipientOptions` ya derivados de `useGuests`; persistir en campo `recipients` (array de strings).
  - Exponer resumen de destinatarios en vista de lista; sincronizar con Seating (enviar evento `specialMomentRecipientsUpdated` a `hooks/_useSeatingPlanDisabled.js`).
  - **Aceptacion**: validaciones se muestran al intentar guardar; selector de destinatarios persiste y se refleja en seating hook.
  - **Checks**: `npm run test:unit -- src/__tests__/protocolo/momentosEspeciales.alerts.test.js`, smoke manual asignando destinatario.

## 11B - Timeline dia B

- **11B-01 | Persistencia en subcoleccion**
  - Mover almacenamiento desde `weddings/{id}.timing` a `weddings/{id}/timing/{blockId}`.
  - Actualizar `src/hooks/useCeremonyTimeline.js`, `src/pages/protocolo/Timing.jsx` y `src/components/protocolo/CeremonyTimeline.jsx` para usar `collection`/`onSnapshot`.
  - Crear migracion `scripts/migrations/moveTimingToSubcollection.js` que copie datos existentes.
  - Ajustar `firestore.rules` para nueva ruta y limites (max 30 bloques, items anidados max 50).
  - **Aceptacion**: nuevas escrituras ocurren en subcoleccion, migracion convierte datos existentes, UI sigue funcionando.
  - **Checks**: `npm run test:unit -- src/__tests__/firestore.rules.timing.test.js`, ejecutar migracion en entorno local con verificacion manual.

- **11B-02 | UI de estado editable y coherencia horaria**
  - Unificar opciones de estado (`on-time`, `slightly-delayed`, `delayed`) en `CeremonyTimeline.jsx` y permitir cambiarlo desde UI.
  - Implementar validacion de coherencia (inicio <= fin, bloques ordenados) con mensajes inline.
  - Mostrar badge de estado y ultima actualizacion en `Timing.jsx`.
  - **Aceptacion**: estados editables persisten y se renderizan con colores; validacion impide horarios incoherentes.
  - **Checks**: `npm run test:unit -- src/__tests__/protocolo/timing.validations.test.js`, smoke manual actualizando tiempos.

- **11B-03 | Alertas automaticas de retraso**
  - Crear util `src/services/timelineAlertService.js` para detectar retrasos (15/30+ minutos) y publicar eventos.
  - Integrar con Notification Center via `NotificationService.enqueue` (ya usado en otros modulos) y fallback a toast.
  - Permitir activar/desactivar alertas por bloque (`notifyOnDelay` en cada doc).
  - **Aceptacion**: al marcar bloque como `delayed` con retraso > 15 min se dispara notificacion; toggle por bloque funciona.
  - **Checks**: `npm run test:unit -- src/__tests__/protocolo/timing.alerts.test.js`.

## Flujo 6 - Presupuesto

- **F6-01 | Importacion CSV/Excel con mapeo**
  - Extender `CsvImportModal.jsx` y `TransactionManager.jsx` para aceptar `.csv` y `.xlsx` usando `papaparse` + `sheetjs` (deps ya en repo? añadir si falta).
  - Implementar parseo en `src/services/finance/importService.js` con validaciones (duplicados, montos negativos, formato fecha).
  - Crear endpoint temporal en `functions/src/finance/importTransactions.ts` para batch insert con limites (500 filas) y auditoria.
  - **Aceptacion**: importar archivo muestra preview, permite mapear columnas y genera registros en Firestore (`finance/main/transactions`).
  - **Checks**: `npm run test:unit -- src/__tests__/finance/importService.test.js`, `npm run lint`.

- **F6-02 | Exportes PDF/Excel de presupuesto**
  - Construir `src/services/finance/exportService.js` para generar Excel (SheetJS) y PDF (pdfmake) basados en datos actuales.
  - Añadir botones en `FinanceOverview.jsx` y `BudgetManager.jsx` con indicador de progreso y toasts.
  - Guardar exportes en Storage (`finance/exports/{weddingId}/...`) y proporcionar descarga directa.
  - **Aceptacion**: exportar genera archivos con resumen (totales, categorias, contribuciones) y respeta permisos; enlaces caducan tras 24h.
  - **Checks**: `npm run test:unit -- src/__tests__/finance/exportService.test.js`, smoke manual descargando archivos.

- **F6-03 | Gestion avanzada de contribuciones**
  - Ampliar `ContributionSettings.jsx` y hooks relacionados para manejar recordatorios automaticos (Mailgun) y panel compartido.
  - Crear cola en `functions/src/finance/contributionReminders.ts` que programe y envíe emails usando plantillas existentes.
  - Añadir pagina compartible `src/pages/finance/ContributionsPublic.jsx` protegida por token para ver progreso.
  - **Aceptacion**: activar recordatorios crea jobs programados, usuarios reciben emails de prueba, pagina publica refleja estado en tiempo real.
  - **Checks**: `npm run test:unit -- src/__tests__/finance/contributions.reminders.test.js`, `npm run test:e2e -- --spec cypress/e2e/finance/finance-contributions.cy.js`.

