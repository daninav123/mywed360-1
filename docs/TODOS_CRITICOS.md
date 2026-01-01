# 📋 TODOs Críticos en Código

**Fecha:** 30 Diciembre 2025  
**Análisis:** TODOs encontrados en código frontend y backend  
**Total:** 30+ TODOs identificados

---

## 🔴 **CRÍTICO - Seguridad y Autenticación** (6 TODOs)

### **1. Autenticación Hardcodeada**

**Archivo:** `apps/main-app/src/services/stripeService.js:16`
```javascript
const token = localStorage.getItem('authToken'); // TODO: Ajustar según tu sistema de auth
```
**Impacto:** Sistema de autenticación no integrado correctamente  
**Prioridad:** 🔴 Crítica  
**Acción:** Integrar con sistema de auth centralizado

---

**Archivo:** `apps/main-app/src/pages/SubscriptionDashboard.jsx:33`
```javascript
const token = localStorage.getItem('authToken'); // TODO: Ajustar según tu auth
```
**Impacto:** Mismo problema de auth hardcodeado  
**Prioridad:** 🔴 Crítica  
**Acción:** Usar contexto de autenticación global

---

**Archivo:** `apps/main-app/src/pages/AdminAITraining.jsx:68`
```javascript
adminUserId: 'admin', // TODO: obtener del auth context
```
**Impacto:** Admin ID hardcodeado sin validación real  
**Prioridad:** 🔴 Crítica  
**Acción:** Obtener del contexto de autenticación

---

### **2. Backend - Verificación Admin**

**Archivo:** `backend/routes/fallback-monitor.js:84`
```javascript
// TODO: Verificar que usuario es admin
// const isAdmin = req.user?.role === 'admin';
```
**Impacto:** Endpoint sin protección admin  
**Prioridad:** 🔴 Crítica  
**Acción:** Implementar middleware requireAdmin

---

**Archivo:** `backend/routes/fallback-monitor.js:126`
```javascript
// TODO: Verificar que usuario es admin
```
**Impacto:** Otro endpoint sin protección  
**Prioridad:** 🔴 Crítica  
**Acción:** Aplicar requireAdmin middleware

---

**Archivo:** `backend/routes/supplier-options.js:259, 310`
```javascript
// TODO: Notificar usuario
// TODO: Implementar notificación al usuario
```
**Impacto:** Sistema de notificaciones incompleto  
**Prioridad:** 🔴 Alta  
**Acción:** Implementar notificaciones push/email

---

## 🟠 **ALTA PRIORIDAD - Integraciones Externas** (8 TODOs)

### **3. Integraciones de Pago (Stripe)**

**Archivo:** `apps/main-app/src/pages/suppliers/SupplierPlans.jsx:136`
```javascript
// TODO: Integrar con Stripe
// Por ahora, simular el upgrade
setTimeout(() => {
  toast.success(t('suppliers:plans.toast.welcomePlan', { planName: PLANS[planId].name }));
}, 1500);
```
**Impacto:** Sistema de pagos simulado, no funcional  
**Prioridad:** 🟠 Alta  
**Acción:** Integrar Stripe Checkout completo  
**Estimación:** 4-6 horas

---

### **4. Integración Spotify**

**Archivo:** `apps/main-app/src/services/multiPlaylistExportService.js:186`
```javascript
async function createSpotifyPlaylistAPI({ name, description, tracks }) {
  // TODO: Integrar con Spotify Web API
  // 1. Autenticar usuario
  // 2. Crear playlist
  // 3. Añadir tracks
```
**Impacto:** Feature de exportación a Spotify no funcional  
**Prioridad:** 🟠 Media-Alta  
**Acción:** Implementar OAuth + API Spotify  
**Estimación:** 6-8 horas

---

### **5. Generación de Thumbnails**

**Archivo:** `apps/main-app/src/services/portfolioStorageService.js:47`
```javascript
// TODO: Generar thumbnails (esto se puede hacer con Cloud Functions o en el cliente)
// Por ahora, usamos la misma URL para todos los tamaños
return {
  original: downloadURL,
  large: downloadURL,
  medium: downloadURL,
  thumbnail: downloadURL,
};
```
**Impacto:** Performance degradada, carga imágenes full-size siempre  
**Prioridad:** 🟠 Alta  
**Acción:** Implementar generación de thumbnails (Sharp/Cloud Functions)  
**Estimación:** 3-4 horas

---

### **6. Generación IA de Contenido**

**Archivo:** `apps/main-app/src/services/webBuilder/aiGeneratorService.js:58`
```javascript
const seleccionarTemaAutomatico = async (perfil) => {
  // Lógica simple por ahora - TODO: mejorar con IA
  const estilo = perfil?.weddingStyle?.toLowerCase() || '';
```
**Impacto:** Selección de tema no inteligente  
**Prioridad:** 🟠 Media  
**Acción:** Integrar modelo IA para recomendaciones

---

**Archivo:** `apps/main-app/src/services/webBuilder/aiGeneratorService.js:214`
```javascript
export const generarTextoIA = async (tipo, contexto) => {
  // Por ahora, textos por defecto
  // TODO: Llamar a OpenAI API
```
**Impacto:** Generación de texto no usa IA real  
**Prioridad:** 🟠 Media-Alta  
**Acción:** Integrar OpenAI API para generación de textos

---

### **7. Upload de Archivos**

**Archivo:** `apps/main-app/src/pages/PublicQuoteResponse.jsx:157`
```javascript
attachments: [], // TODO: Implementar upload de archivos
```
**Impacto:** No se pueden adjuntar archivos en cotizaciones  
**Prioridad:** 🟠 Alta  
**Acción:** Implementar upload con Firebase Storage

---

### **8. Templates de Formularios**

**Archivo:** `apps/main-app/src/data/quoteFormTemplates.js:417`
```javascript
// TODO: Añadir más templates en futuras iteraciones
// 'lugares': VENUE_TEMPLATE,
// 'flores-decoracion': FLORES_TEMPLATE,
// 'decoracion': DECORACION_TEMPLATE,
```
**Impacto:** Templates faltantes para categorías importantes  
**Prioridad:** 🟠 Media  
**Acción:** Crear templates para categorías restantes

---

## 🟡 **MEDIA PRIORIDAD - Features Incompletas** (16 TODOs)

### **9. Seating Plan - Colaboración Tiempo Real**

**Archivo:** `apps/main-app/src/components/seating/SeatingCollaborationBadge.jsx:173`
```javascript
React.useEffect(() => {
  // TODO: Implementar lógica real de presencia
  // Ejemplo básico:
  // const presenceRef = firebase.database().ref(`seating/${weddingId}/${elementId}/presence`);
}, [elementId, currentUser]);
```
**Impacto:** Colaboración en tiempo real no funcional  
**Prioridad:** 🟡 Media-Alta  
**Acción:** Implementar con Firebase Realtime Database  
**Estimación:** 8-10 horas

---

**Archivo:** `apps/main-app/src/components/seating/SeatingCollaborationBadge.jsx:187, 198`
```javascript
const startEditing = () => {
  // TODO: Actualizar presencia en Firebase
};

const stopEditing = () => {
  // TODO: Remover presencia de Firebase
};
```
**Impacto:** Badges de "En edición" no funcionan  
**Prioridad:** 🟡 Media  
**Relacionado con:** #9

---

**Archivo:** `apps/main-app/src/components/seating/SeatingPlanModern.jsx:218`
```javascript
collaborativeEditors={{}} // TODO: Integrar colaboración en tiempo real
```
**Impacto:** Prop vacío, feature no conectada  
**Prioridad:** 🟡 Media  
**Relacionado con:** #9

---

### **10. Seating Plan - Auto Layout**

**Archivo:** `apps/main-app/src/components/seating/SeatingPlanRefactored.jsx:795`
```javascript
// TODO: Re-enable auto layout generation after fixing initialization order
// handleGenerateAutoLayout(template.layout);
```
**Impacto:** Generación automática de layout deshabilitada  
**Prioridad:** 🟡 Media  
**Acción:** Debugear orden de inicialización y reactivar

---

**Archivo:** `apps/main-app/src/components/seating/SeatingPlanRefactored.jsx:2091`
```javascript
// TODO: Re-enable after fixing initialization order
// if (action === 'auto-generate') handleGenerateAutoLayout('columns');
```
**Impacto:** Botón de auto-generate deshabilitado  
**Prioridad:** 🟡 Media  
**Relacionado con:** #10

---

### **11. Seating Plan - Herramientas de Alineación**

**Archivo:** `apps/main-app/src/components/seating/SeatingPropertiesSidebar.jsx:332`
```javascript
onClick={() => {
  // TODO: Implementar alineación
  console.log('Alinear mesas');
}}
```
**Impacto:** Botón de alineación no funcional  
**Prioridad:** 🟡 Baja  
**Acción:** Implementar algoritmo de alineación de mesas

---

**Archivo:** `apps/main-app/src/components/seating/SeatingPropertiesSidebar.jsx:341`
```javascript
onClick={() => {
  // TODO: Implementar distribución
  console.log('Distribuir mesas');
}}
```
**Impacto:** Botón de distribución no funcional  
**Prioridad:** 🟡 Baja  
**Acción:** Implementar algoritmo de distribución uniforme

---

### **12. Proveedores - Detalles de Cotizaciones**

**Archivo:** `apps/main-app/src/pages/suppliers/SupplierRequestsNew.jsx:523`
```javascript
onClick={() => {
  // TODO: Mostrar modal con la cotización enviada
  toast.info('Ver detalles de cotización');
}}
```
**Impacto:** No se pueden ver detalles de cotizaciones  
**Prioridad:** 🟡 Media  
**Acción:** Crear modal ViewQuotationDetailsModal

---

### **13. Proveedores - Export PDF Favoritos**

**Archivo:** `apps/main-app/src/components/suppliers/FavoritesSection.jsx:79`
```javascript
const handleExport = () => {
  toast.info(t('suppliers.favorites.toasts.exportSoon'));
  // TODO: Implement PDF export
};
```
**Impacto:** No se puede exportar lista de favoritos  
**Prioridad:** 🟡 Baja  
**Acción:** Implementar generación PDF con jsPDF

---

### **14. Proveedores - Rating Real**

**Archivo:** `apps/main-app/src/components/suppliers/QuoteRequestsTracker.jsx:249`
```javascript
supplier: {
  rating: 4.5, // TODO: Obtener del proveedor real
  reviewCount: 25,
},
```
**Impacto:** Ratings hardcodeados, no reales  
**Prioridad:** 🟡 Media  
**Acción:** Obtener ratings de Firestore

---

### **15. Web Builder - Nombre Editable**

**Archivo:** `apps/main-app/src/pages/WebBuilderPageCraft.jsx:355`
```javascript
{
  craftConfig: json,
  tema: tema,
  nombre: 'Mi Web de Boda', // TODO: hacer editable
},
```
**Impacto:** Nombre de web hardcodeado  
**Prioridad:** 🟡 Baja  
**Acción:** Añadir input para nombre personalizado

---

### **16. Tests - Mock Compatible Vitest**

**Archivo:** `apps/main-app/test/setup.js:97`
```javascript
// DESHABILITADO TEMPORALMENTE: Mock incompatible con Vitest v1.x
// Para tests que requieran providers, se deben envolver manualmente
// TODO: Implementar solución alternativa compatible con Vitest v1.x
```
**Impacto:** Tests requieren wrapping manual  
**Prioridad:** 🟡 Media  
**Acción:** Actualizar setup para Vitest v1.x

---

### **17. Backend - Notificaciones Email**

**Backend TODOs de notificaciones:**
- `supplier-messages.js:153` - Notificación push al cliente
- `supplier-payments.js:205` - Email con PDF factura
- `supplier-dashboard.js:1182` - Email notificación al cliente

**Impacto:** Sistema de notificaciones incompleto  
**Prioridad:** 🟡 Media  
**Acción:** Implementar servicio de notificaciones unificado

---

### **18. Backend - Sincronización Google Calendar**

**Archivo:** `backend/routes/supplier-availability.js:152`
```javascript
// TODO: Implementar sincronización con Google Calendar API
// Por ahora, solo guardamos la configuración
```
**Impacto:** Sincronización de calendario no funcional  
**Prioridad:** 🟡 Media  
**Acción:** Integrar Google Calendar API

---

### **19. Backend - Límites y Validaciones**

**Archivo:** `backend/routes/supplier-options.js:19`
```javascript
// TEMPORAL: Comentado mientras se construye el índice de Firestore (2-5 min)
// TODO: Descomentar cuando el índice esté listo
```
**Impacto:** Query menos eficiente  
**Prioridad:** 🟡 Baja  
**Acción:** Verificar índice y descomentar

---

## 📊 **Resumen por Categoría**

| Categoría | TODOs | Prioridad | Estimación |
|-----------|-------|-----------|------------|
| **Seguridad/Auth** | 6 | 🔴 Crítica | 8-12 horas |
| **Integraciones Pago** | 2 | 🟠 Alta | 6-10 horas |
| **Integraciones Externas** | 6 | 🟠 Alta | 15-20 horas |
| **Seating Plan** | 8 | 🟡 Media | 20-25 horas |
| **Proveedores** | 4 | 🟡 Media | 6-8 horas |
| **Otros** | 4 | 🟡 Baja | 4-6 horas |
| **TOTAL** | **30** | - | **~70 horas** |

---

## 🎯 **Top 10 TODOs Más Urgentes**

1. **Autenticación hardcodeada** (3 archivos) - Riesgo seguridad
2. **Endpoints admin sin protección** (2 archivos) - Riesgo seguridad
3. **Integración Stripe** - Feature bloqueada
4. **Generación thumbnails** - Performance crítica
5. **Upload archivos cotizaciones** - Feature incompleta
6. **Colaboración tiempo real Seating** - Feature premium bloqueada
7. **Notificaciones email** (3 archivos) - UX incompleta
8. **Integración IA generación textos** - Diferenciador clave
9. **Auto-layout Seating deshabilitado** - Feature rota
10. **Ratings proveedores hardcodeados** - Datos incorrectos

---

## 📝 **Recomendaciones**

### **Sprint Inmediato (7 días)**
1. Fix autenticación hardcodeada (crítico seguridad)
2. Proteger endpoints admin (crítico seguridad)
3. Implementar upload de archivos (bloqueador UX)

### **Sprint 2 (14 días)**
1. Integración Stripe completa
2. Generación de thumbnails
3. Sistema de notificaciones unificado

### **Sprint 3 (21 días)**
1. Colaboración tiempo real Seating
2. Integración IA para textos
3. Fix auto-layout Seating

---

## 🔗 **Issues Relacionados**

- `.github/ISSUE_DRAFTS/sprint1-supplier-auth-middleware.md` - Middleware auth proveedores
- TODOs de backend relacionados con TODOs similares en frontend

---

**Última actualización:** 30 Diciembre 2025  
**Próxima revisión:** Después de completar Sprint 1
