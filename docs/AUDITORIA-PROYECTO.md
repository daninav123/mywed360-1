# 🔍 Auditoría Completa del Proyecto

**Fecha:** 30/10/2025, 4:41:02

> Nota: este informe es un snapshot puntual y su métrica de TODOs/FIXMEs puede diferir de `docs/AUDITORIA-CODIGO.md` por alcance, reglas de conteo y fecha de generación.

---

## 📋 Resumen Ejecutivo

| Categoría              | Cantidad | Nivel    |
| ---------------------- | -------- | -------- |
| Archivos .bak          | 332      | 🔴 Alto  |
| Claves i18n duplicadas | 5040     | 🔴 Alto  |
| Console.log en código  | 1381     | 🔴 Alto  |
| TODOs/FIXMEs           | 67       | 🟡 Medio |
| Archivos grandes       | 94       | 🔴 Alto  |

## 🗑️ Archivos .bak (332)

**Recomendación:** Eliminar estos archivos con `npm run cleanup:bak`

```
.env.bak.20251011225347 (2.01 KB)
.env.local.bak.20251011225347 (0.41 KB)
backend\index.js.bak (10.21 KB)
firestore.rules.bak-encoding (9.40 KB)
roadmap.json.bak.2025-10-09T15-46-28-825Z (17.61 KB)
roadmap.json.bak.2025-10-11T20-12-42-685Z (26.69 KB)
src\i18n\locales\ar\common.json.bak (36.78 KB)
src\i18n\locales\ar\common.json.bak-final (36.78 KB)
src\i18n\locales\ar\common.json.bak-json (36.78 KB)
src\i18n\locales\ar\common.json.bak3 (36.78 KB)
src\i18n\locales\bg\common.json.bak-json (0.15 KB)
src\i18n\locales\bg\common.json.bak3 (0.15 KB)
src\i18n\locales\ca\common.json.bak (36.83 KB)
src\i18n\locales\ca\common.json.bak-final (36.84 KB)
src\i18n\locales\ca\common.json.bak-json (36.84 KB)
src\i18n\locales\ca\common.json.bak3 (36.84 KB)
src\i18n\locales\cs\common.json.bak-json (0.15 KB)
src\i18n\locales\cs\common.json.bak3 (0.15 KB)
src\i18n\locales\da\common.json.bak (36.76 KB)
src\i18n\locales\da\common.json.bak-final (36.76 KB)
src\i18n\locales\da\common.json.bak-json (36.76 KB)
src\i18n\locales\da\common.json.bak3 (36.76 KB)
src\i18n\locales\de\admin.json.bak-json (0.65 KB)
src\i18n\locales\de\admin.json.bak3 (0.65 KB)
src\i18n\locales\de\chat.json.bak (4.46 KB)
src\i18n\locales\de\chat.json.bak-final (4.48 KB)
src\i18n\locales\de\chat.json.bak-json (4.48 KB)
src\i18n\locales\de\chat.json.bak3 (4.48 KB)
src\i18n\locales\de\common.json.bak (49.95 KB)
src\i18n\locales\de\common.json.bak-final (50.04 KB)
... y 302 más
```

## 🌍 Claves i18n Duplicadas

### ES (2236 duplicados)

| Clave                 | Línea 1 | Línea 2 |
| --------------------- | ------- | ------- |
| `add`                 | 47      | 61      |
| `delete`              | 45      | 62      |
| `save`                | 44      | 63      |
| `cancel`              | 43      | 64      |
| `forgotPassword`      | 114     | 142     |
| `title`               | 135     | 148     |
| `invalidCredentials`  | 127     | 161     |
| `title`               | 135     | 171     |
| `subtitle`            | 136     | 172     |
| `emailLabel`          | 137     | 173     |
| `passwordLabel`       | 138     | 174     |
| `emailPlaceholder`    | 139     | 176     |
| `passwordPlaceholder` | 140     | 177     |
| `rememberMe`          | 141     | 178     |
| `forgotPassword`      | 114     | 179     |

_... y 2221 más_

### EN (1384 duplicados)

| Clave                | Línea 1 | Línea 2 |
| -------------------- | ------- | ------- |
| `add`                | 13      | 27      |
| `delete`             | 11      | 28      |
| `save`               | 10      | 29      |
| `cancel`             | 9       | 30      |
| `email`              | 38      | 56      |
| `forgotPassword`     | 59      | 87      |
| `title`              | 80      | 93      |
| `invalidCredentials` | 72      | 106     |
| `title`              | 80      | 121     |
| `description`        | 94      | 122     |
| `addSection`         | 124     | 135     |
| `location`           | 160     | 186     |
| `song`               | 162     | 187     |
| `time`               | 163     | 188     |
| `duration`           | 164     | 189     |

_... y 1369 más_

### FR (1420 duplicados)

| Clave                 | Línea 1 | Línea 2 |
| --------------------- | ------- | ------- |
| `add`                 | 47      | 61      |
| `delete`              | 45      | 62      |
| `save`                | 44      | 63      |
| `cancel`              | 43      | 64      |
| `forgotPassword`      | 114     | 142     |
| `title`               | 135     | 148     |
| `invalidCredentials`  | 127     | 161     |
| `title`               | 135     | 171     |
| `subtitle`            | 136     | 172     |
| `emailLabel`          | 137     | 173     |
| `passwordLabel`       | 138     | 174     |
| `emailPlaceholder`    | 139     | 176     |
| `passwordPlaceholder` | 140     | 177     |
| `rememberMe`          | 141     | 178     |
| `forgotPassword`      | 114     | 179     |

_... y 1405 más_

## 📝 Console.log en Producción (50)

**Recomendación:** Remover o convertir a loggers apropiados

- `src\components\admin\AdminDashboard.jsx:142` → `console.warn('[AdminDashboard] overview load error:', error);`
- `src\components\admin\AdminDashboard.jsx:170` → `console.warn('[AdminDashboard] metrics load error:', error);`
- `src\components\admin\AdminDashboard.jsx:253` → `console.error('[AdminDashboard] resolve alert error:', error);`
- `src\components\admin\CachePerformancePanel.jsx:55` → `console.error('Error generando informe de caché:', error);`
- `src\components\admin\CachePerformancePanel.jsx:75` → `console.error('Error ejecutando benchmark:', error);`
- `src\components\admin\CachePerformancePanel.jsx:96` → `console.error(`Error probando precarga de categoría ${selectedCategory}:`, error`
- `src\components\admin\EmailAdminDashboard.jsx:95` → `console.error('Error al cargar estadsticas:', error);`
- `src\components\admin\MetricsDashboard.jsx:72` → `console.log('No se encontraron mtricas locales');`
- `src\components\admin\MetricsDashboard.jsx:126` → `console.error('Error al cargar mtricas:', err);`
- `src\components\admin\UserManagement.jsx:103` → `console.log('Usuario actualizado:', selectedUser);`
- `src\components\admin\UserManagement.jsx:113` → `console.log('Usuario eliminado:', userId);`
- `src\components\admin\UserManagement.jsx:120` → `console.log('Exportando datos de usuarios:', filteredUsers);`
- `src\components\AsyncWrapper.jsx:38` → `console.error('Error en AsyncWrapper:', err);`
- `src\components\ChatWidget.jsx:743` → `console.error('Timeout en la llamada a la API de IA');`
- `src\components\ChatWidget.jsx:777` → `console.warn(`
- `src\components\ChatWidget.jsx:790` → `console.log('ðŸ¤– Respuesta completa del backend IA:', data);`
- `src\components\ChatWidget.jsx:913` → `console.warn('Backend AI error:', data.error, data.details);`
- `src\components\ChatWidget.jsx:920` → `console.error('Backend AI error:', data.error, data.details);`
- `src\components\ChatWidget.jsx:927` → `console.error('Error en chat de IA:', error);`
- `src\components\ChatWidget.jsx:935` → `console.error('Timeout en la llamada a la API de IA:', error.message);`
- `src\components\ChatWidget.jsx:942` → `console.error('Error de red en la llamada a la API de IA:', error.message);`
- `src\components\ChatWidget.jsx:949` → `console.error('Error genérico en la API de IA:', error.message);`
- `src\components\config\ConfigEventBridge.jsx:46` → `console.warn('[ConfigEventBridge] persist error', e);`
- `src\components\debug\ErrorBoundary.jsx:25` → `console.error('Error report failed:', e);`
- `src\components\DiagnosticPanel.jsx:271` → `console.log('📊 Reporte actualizado en consola');`
- `src\components\email\CalendarIntegration.jsx:222` → `console.error('[CalendarIntegration] Failed to analyze email:', err);`
- `src\components\email\ComposeEmail.jsx:105` → `console.warn('[ComposeEmail] Failed to load shared files', e);`
- `src\components\email\ComposeEmail.jsx:170` → `console.error('[ComposeEmail] Failed to send email:', err);`
- `src\components\email\ComposeEmailModal.jsx:78` → `console.error('Error al enviar correo:', error);`
- `src\components\email\ComposeModal.jsx:52` → `console.error('Error enviando correo:', err);`
- `src\components\email\EmailAliasConfig.jsx:29` → `console.warn('[EmailAliasConfig] No user provided, closing modal');`
- `src\components\email\EmailAliasConfig.jsx:55` → `console.error('Error loading current email:', err);`
- `src\components\email\EmailAliasConfig.jsx:102` → `console.error('[EmailAliasConfig] Failed to check availability:', err);`
- `src\components\email\EmailAliasConfig.jsx:180` → `console.error('[EmailAliasConfig] Failed to save alias:', err);`
- `src\components\email\EmailComments.jsx:28` → `console.error('No se pudieron cargar los comentarios', error);`
- `src\components\email\EmailComments.jsx:51` → `console.error('No se pudo guardar el comentario', error);`
- `src\components\email\EmailComments.jsx:62` → `console.error('No se pudo eliminar el comentario', error);`
- `src\components\email\EmailComposer.jsx:47` → `console.error('[EmailComposer] Error setting auth context:', e);`
- `src\components\email\EmailComposer.jsx:83` → `console.error('[EmailComposer] Failed to load templates:', err);`
- `src\components\email\EmailComposer.jsx:205` → `console.log('[EmailComposer] Send already in progress, ignoring.');`
- `src\components\email\EmailComposer.jsx:308` → `console.error('[EmailComposer] Failed to send email:', err);`
- `src\components\email\EmailConfigValidation.jsx:51` → `console.error('Error validating email config:', err);`
- `src\components\email\EmailConfigValidation.jsx:81` → `console.error('Error sending test email:', err);`
- `src\components\email\EmailDetail.jsx:88` → `console.error('Error al formatear fecha:', e);`
- `src\components\email\EmailDetail.jsx:244` → `console.log('Etiquetas actualizadas:', tags);`
- `src\components\email\EmailFeedbackCollector.jsx:98` → `console.error('Error al enviar feedback:', error);`
- `src\components\email\EmailInbox.jsx:134` → `console.warn('[EmailInbox] automation processing failed', automationError);`
- `src\components\email\EmailInbox.jsx:163` → `console.warn('[EmailInbox] automation processing failed', automationError);`
- `src\components\email\EmailInbox.jsx:166` → `console.error(e);`
- `src\components\email\EmailInbox.jsx:224` → `console.warn('[EmailInbox] auto loadMore failed', err);`

_... y 1331 más_

## ✏️ TODOs y FIXMEs (30)

### TODO (66)

- `src\components\email\EmailInbox.jsx:280` → queda vacío por mocks inconsistentes, usar dataset por defecto
- `src\components\finance\BudgetAlerts.jsx:67` → en orden! No hay alertas importantes.',
- `src\components\finance\PaymentModal.jsx:150` → de Pago \*/}
- `src\components\finance\PaymentModal.jsx:153` → de Pago
- `src\components\finance\TransactionForm.jsx:381` → de pago \*/}
- `src\components\finance\TransactionForm.jsx:384` → de pago' })}
- `src\components\finance\TransactionImportModal.jsx:17` → de pago', required: false, examples: ['Método', 'Payment Method'] },
- `src\components\HomePage.jsx:276` → se maneja con modales locales
- `src\components\Onboarding\OnboardingTutorial.jsx:197` → tu calendario y listas de tareas para llevar un control perfecto.
- `src\components\Onboarding\OnboardingTutorial.jsx:263` → listo!</h2>

_... y 56 más_

### XXX (1)

- `src\utils\validationUtils.js:26` → XXX XXX, 6XXXXXXXX, 9XXXXXXXX

## 📦 Archivos Grandes (>500 líneas)

**Top 20 archivos más grandes:**

| Archivo                                                | Líneas | Tamaño    |
| ------------------------------------------------------ | ------ | --------- |
| `src\hooks\_useSeatingPlanDisabled.js`                 | 3945   | 131.85 KB |
| `src\components\tasks\TasksRefactored.jsx`             | 2968   | 113.59 KB |
| `src\pages\admin\AdminDiscounts.jsx`                   | 2383   | 95.24 KB  |
| `src\pages\DisenoWeb.jsx`                              | 2305   | 83.42 KB  |
| `src\pages\protocolo\MomentosEspeciales.jsx`           | 2214   | 94.95 KB  |
| `src\hooks\useFinance.js`                              | 2073   | 72.08 KB  |
| `src\components\seating\SeatingPlanRefactored.jsx`     | 2007   | 69.93 KB  |
| `src\components\email\UnifiedInbox\InboxContainer.jsx` | 1696   | 61.26 KB  |
| `src\pages\Invitados.jsx`                              | 1620   | 58.15 KB  |
| `src\components\tasks\LongTermTasksGantt.jsx`          | 1609   | 58.03 KB  |
| `src\hooks\useAuth.jsx`                                | 1594   | 53.68 KB  |
| `src\services\momentosService.js`                      | 1441   | 43.51 KB  |
| `src\pages\admin\AdminTaskTemplates.jsx`               | 1425   | 59.51 KB  |
| `src\hooks\useGuests.js`                               | 1408   | 48.13 KB  |
| `src\services\adminDataService.js`                     | 1405   | 45.69 KB  |
| `src\components\proveedores\ProveedorDetail.jsx`       | 1381   | 58.02 KB  |
| `src\components\HomePage.jsx`                          | 1371   | 71.91 KB  |
| `src\pages\ProveedoresNuevo.jsx`                       | 1348   | 51.53 KB  |
| `src\data\adminTaskTemplatesFallback.js`               | 1258   | 33.98 KB  |
| `src\services\emailAutomationService.js`               | 1204   | 36.53 KB  |

## 📊 Estadísticas del Proyecto

- **Total de archivos JS/JSX:** 722
- **Total de líneas de código:** 191.874
- **Promedio líneas/archivo:** 266

## 💡 Recomendaciones Prioritarias

### 🔴 Crítico

1. **Eliminar claves i18n duplicadas** (5040 encontradas)
   - Crear script de deduplicación
   - Verificar que no rompa funcionalidad

2. **Limpiar archivos .bak** (332 encontrados)
   - Ejecutar: `npm run cleanup:bak`

### 🟡 Medio

1. **Reducir console.log** (1381 encontrados)
   - Implementar logger centralizado
   - Remover logs de debug en producción

2. **Refactorizar archivos grandes** (94 >500 líneas)
   - Dividir en componentes más pequeños
   - Mejorar mantenibilidad

### 🟢 Bajo

1. **Resolver TODOs/FIXMEs** (67 encontrados)
   - Crear issues en GitHub
   - Priorizar por impacto
