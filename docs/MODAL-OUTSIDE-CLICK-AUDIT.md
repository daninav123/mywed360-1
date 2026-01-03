# Auditoría de cierres por clic exterior en modales

> Fecha: 2025-10-25  
> Responsable: Equipo de verificación i18n / UI – ejecución Codex

## Metodología

- Se listaron todos los archivos `*Modal*.jsx` dentro de `src/` y se agruparon según el componente base que utilizan.
- Se revisaron los contenedores de cada modal para asegurar que el overlay (`div` a pantalla completa) capture el clic y ejecute el `onClose` únicamente cuando el evento proviene del propio overlay (es decir, `event.target === event.currentTarget`), evitando cierres accidentales al interactuar con el contenido interno.
- Se verificó que los modales basados en bibliotecas externas (p. ej. `@mui/material/Dialog`) mantuvieran su comportamiento de cierre al hacer clic en el backdrop.
- Se añadieron manejadores faltantes donde no existían, garantizando además los atributos accesibles `role="dialog"` y `aria-modal="true"` cuando aplicaba.

## Resultado por categorías

### 1. Modales que usan `src/components/Modal.jsx`

El componente `Modal.jsx` ya cerraba el modal al hacer clic fuera mediante `onClick={onClose}` y un `stopPropagation` en el contenedor interno. Todos los modales que lo importan comparten automáticamente este comportamiento:

`src/components/BanquetConfigModal.jsx` · `src/components/CeremonyConfigModal.jsx` · `src/components/finance/BankImportModal.jsx` · `src/components/finance/BudgetManager.jsx` · `src/components/finance/CsvImportModal.jsx` · `src/components/finance/PaymentSuggestions.jsx` · `src/components/finance/TransactionImportModal.jsx` · `src/components/finance/TransactionManager.jsx` · `src/components/guests/GroupManager.jsx` · `src/components/proveedores/AssignSelectedToGroupModal.jsx` · `src/components/proveedores/AssignSupplierToGroupModal.jsx` · `src/components/proveedores/BulkStatusModal.jsx` · `src/components/proveedores/CompareSelectedModal.jsx` · `src/components/proveedores/DuplicateDetectorModal.jsx` · `src/components/proveedores/GroupAllocationModal.jsx` · `src/components/proveedores/GroupCreateModal.jsx` · `src/components/proveedores/GroupSuggestions.jsx` · `src/components/proveedores/ProveedorDetail.jsx` · `src/components/proveedores/RFQModal.jsx` · `src/components/proveedores/SupplierMergeWizard.jsx` · `src/components/proveedores/WantedServicesModal.jsx` · `src/components/SpaceConfigModal.jsx` · `src/components/TableConfigModal.jsx` · `src/components/TemplatesModal.jsx` · `src/components/WeddingFormModal.jsx` · `src/components/weddings/WeddingTeamModal.jsx` · `src/components/whatsapp/FormalInvitationModal.jsx` · `src/components/whatsapp/InviteTemplateModal.jsx` · `src/components/whatsapp/SaveTheDateModal.jsx` · `src/components/whatsapp/WhatsAppSender.jsx` · `src/pages/Finance.jsx` · `src/pages/Invitados.jsx` · `src/pages/ProveedoresNuevo.jsx` · `src/pages/protocolo/Checklist.jsx` · `src/pages/test/ProveedoresFlowHarness.jsx`.

### 2. Modales que usan `src/components/ui/BaseModal.jsx`

`BaseModal.jsx` ya contemplaba `closeOnOverlayClick` con un manejador que invoca `onClose` sólo al clicar en el overlay. Están cubiertos: `src/components/tasks/AllTasksModal.jsx` y las instancias dentro de `src/pages/Contratos.jsx`.

### 3. Modales personalizados con overlay propio

Se añadieron (o confirmaron) manejadores explícitos en los siguientes archivos. Todos cierran al detectar `event.target === event.currentTarget` en el overlay y mantienen accesibilidad básica:

- `src/components/email/ComposeEmailModal.jsx`
- `src/components/email/ComposeModal.jsx`
- `src/components/email/EmptyTrashModal.jsx`
- `src/components/email/FolderSelectionModal.jsx` *(ya lo hacía)*
- `src/components/email/ManageFoldersModal.jsx`
- `src/components/finance/PaymentModal.jsx`
- `src/components/proveedores/AIBusquedaModal.jsx`
- `src/components/proveedores/ProveedorFormModal.jsx`
- `src/components/proveedores/ProviderEmailModal.jsx`
- `src/components/proveedores/ReservationModal.jsx` *(ya lo hacía via `onClick` + `stopPropagation`)*
- `src/components/proveedores/SupplierOnboardingModal.jsx`
- `src/components/proveedores/ai/AIEmailModal.jsx`
- `src/components/proveedores/ai/AISearchModal.jsx` *(ya lo hacía)*
- `src/components/proveedores/tracking/TrackingModal.jsx`
- `src/components/seating/EnhancedExportModal.jsx` *(ya lo hacía)*
- `src/components/whatsapp/WhatsAppModal.jsx`
- `src/components/ProviderSearchModal.jsx` *(usa `onMouseDownCapture` en overlay)*

### 4. Modales basados en `@mui/material/Dialog`

Los diálogos dentro de `src/components/admin/UserManagement.jsx` utilizan `<Dialog open=… onClose={…}>` de MUI. El backdrop de MUI desencadena `onClose` con `reason === 'backdropClick'`, por lo que cumplen el requisito.

### 5. Componentes auxiliares

Archivos como `src/components/ProviderConfigModal.jsx` sólo representan el contenido del modal; se renderizan dentro de contenedores que ya gestionan el overlay y, por tanto, heredaron el comportamiento de cierre al actualizar los hosts anteriores.

## Spot-checks realizados

- `src/components/email/ComposeModal.jsx:46` — se añadió `handleOverlayClick` y el overlay principal dispara `onClose` sólo cuando el usuario hace clic fuera del panel.
- `src/components/proveedores/ProveedorFormModal.jsx:174` — overlay actualizado con `onMouseDown` más atributos `role="dialog"`/`aria-modal`.
- `src/components/proveedores/tracking/TrackingModal.jsx:130` — overlay actualizado siguiendo el mismo patrón.
- `src/components/whatsapp/WhatsAppModal.jsx:89` — overlay actualizado, garantizando que el modal se cierre al clicar fuera en cualquier pestaña.

## Conclusiones

- Todos los modales presentes en el repositorio tienen ahora un mecanismo explícito para cerrarse al hacer clic fuera del contenido.
- Se homogenizó la semántica ARIA en los overlays modificados.
- Los componentes que dependen de bibliotecas externas o de contenedores reutilizables ya proporcionaban esta funcionalidad y sólo se documentaron.
- Se añadió, en los modales que carecían de él, un botón visual de cierre con icono `X` y etiqueta accesible, manteniendo una experiencia consistente en todo el producto.

> Recomendación: añadir pruebas E2E puntuales que abran un modal representativo de cada categoría (Modal base, BaseModal, overlay personalizado) y verifiquen el cierre al clicar el backdrop para evitar regresiones futuras.
