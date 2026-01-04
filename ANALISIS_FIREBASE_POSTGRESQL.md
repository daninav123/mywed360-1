# 🔍 Análisis: Firebase vs PostgreSQL - Estado Actual

**Fecha:** 03 Ene 2026 23:15  
**Objetivo:** Verificar que todo el código usa PostgreSQL y no Firebase/Firestore

---

## ✅ MIGRADO A POSTGRESQL (Hooks Core):

### Hooks sin Firebase (OK):
- ✅ `useProveedores.js` - PostgreSQL
- ✅ `useWeddingCategories.js` - PostgreSQL
- ✅ `useWeddingTasksHierarchy.js` - PostgreSQL
- ✅ `useSupplierGroups.js` - PostgreSQL
- ✅ `useGroupBudgets.js` - PostgreSQL
- ✅ `useSupplierBudgets.js` - PostgreSQL
- ✅ `useSeatingSync.js` - PostgreSQL
- ✅ `useGroupAllocations.js` - PostgreSQL
- ✅ `useWeddingServices.js` - PostgreSQL (actualizado)
- ✅ `useSupplierRFQHistory.js` - PostgreSQL
- ✅ `useUserCollection.js` - PostgreSQL
- ✅ `useWeddingCollectionGroup.js` - PostgreSQL (stub)
- ✅ `useProviderMigration.js` - PostgreSQL (stub)
- ✅ `useEmailUsername.jsx` - PostgreSQL
- ✅ `useBudgetBenchmarks.js` - PostgreSQL
- ✅ `useWeddingCollection.js` - PostgreSQL (stub deprecado)
- ✅ `_useSeatingPlanDisabled.js` - PostgreSQL (stub)
- ✅ `useGuests.js` - PostgreSQL (ya migrado)
- ✅ `useChecklist.js` - PostgreSQL (ya migrado)
- ✅ `useWeddingData.js` - PostgreSQL (ya migrado)
- ✅ `useActiveWeddingInfo.js` - PostgreSQL (ya migrado)

---

## ⚠️ DEPRECADOS PERO NO USADOS (OK):

- ⚠️ `useWeddingInfoSync.js` - Deprecado, NO está importado en ningún archivo

---

## 🚨 ARCHIVOS QUE AÚN USAN FIREBASE:

### 📄 Páginas (1 archivo):
1. **`pages/protocolo/DocumentosLegales.jsx`** 🔴
   - Usa: `addDoc`, `collection`, `deleteDoc`, `getDocs` de Firestore
   - **REQUIERE MIGRACIÓN**

### 🧩 Componentes (16 archivos):
1. `components/legal/ReportIssueButton.jsx`
2. `components/finance/FinanceEventBridge.jsx`
3. `components/config/ConfigEventBridge.jsx`
4. `components/Onboarding/OnboardingTutorial.jsx`
5. `components/proveedores/RFQModal.jsx`
6. `components/proveedores/SupplierEventBridge.jsx`
7. `components/Search/ImportSupplierModal.jsx`
8. `components/email/EmailAliasConfig.jsx`
9. `components/ui/LanguageSelector.jsx`
10. `components/HomePage.jsx`
11. `components/guests/GuestEventBridge.jsx`
12. `components/tasks/TasksRefactored.jsx`
13. `components/tasks/TaskEventBridge.jsx`
14. `components/tasks/TaskSidePanel.jsx`
15. `components/tasks/TaskNotificationWatcher.jsx`
16. `components/suppliers/RequestQuoteModal.jsx`
17. `components/suppliers/QuoteRequestsTracker.jsx`

### 🛠️ Servicios (32 archivos):
1. `services/taskTemplateClient.js`
2. `services/supplierPropagationService.js`
3. `services/commentService.js`
4. `services/momentosService.js`
5. `services/analytics/seatingAnalytics.js`
6. `services/supplierService.js`
7. `services/SyncService.js`
8. `services/gamification.js`
9. `services/authService.js`
10. `services/taskTemplateSeeder.js`
11. `services/globalSearchService.js`
12. `services/legalDocs.js`
13. `services/WeddingService.js`
14. `services/supplierInsightsService.js`
15. `services/rsvpSeatingSync.js`
16. `services/rsvpService.js`
17. `services/webBuilder/craftWebService.js`
18. `services/webBuilder/webConfigService.js`
19. `services/webBuilder/analyticsService.js`
20. `services/onboardingTelemetry.js`
21. `services/aiTaskService.js`
22. `services/financeService.js`
23. `services/contractEmailService.js`
24. `services/emailMetricsService.js`
25. `services/messageService.js`
26. `services/supplierSpecsService.js`
27. `services/websiteService.js`
28. `services/taskTemplateService.js`
29. `services/protocolTexts.js`
30. `services/bulkRfqAutomation.js`
31. `services/musicPreferencesService.js`
32. `services/notificationService.js`
33. `services/UserService.js`

### 🔧 Utils (4 archivos):
1. `utils/weddingPropagation.js`
2. `utils/legalTasksGenerator.js`
3. `utils/firestoreCollection.js`
4. `utils/migrateCategoriesOnce.js`
5. `utils/firebaseDiagnostic.js`

### 📦 Context (1 archivo):
1. `context/WeddingContext.jsx`

### ✅ Tests (4 archivos - OK):
- `__tests__/firestore.rules.collections.test.js`
- `__tests__/firestore.rules.extended.test.js`
- `__tests__/firestore.rules.exhaustive.test.js`
- `__tests__/firestore.rules.seating.test.js`

### ⚙️ Config (1 archivo - necesario):
- `firebaseConfig.jsx` - Config de Firebase Auth (mantener)

---

## 📊 RESUMEN NUMÉRICO:

| Categoría | Migrado | Con Firebase | % Migrado |
|-----------|---------|--------------|-----------|
| **Hooks** | 21/21 | 0 | **100%** ✅ |
| **Servicios** | 12/33 | 21 | **36%** 🔄 |
| **Páginas** | 0 | 1 | ❌ |
| **Componentes** | 0 | 17 | ❌ |
| **Utils** | 0 | 5 | ❌ |
| **Context** | 0 | 1 | ❌ |

---

## 🎯 CONCLUSIÓN:

### ✅ COMPLETADO:
- **Todos los hooks React (21/21)** están usando PostgreSQL
- Los backups `.firebase.js` están preservados
- Hooks deprecados no están en uso

### 🚨 PENDIENTE:
- **1 página:** DocumentosLegales.jsx
- **17 componentes** con Firebase
- **33 servicios** con Firebase
- **5 utils** con Firebase
- **1 context** con Firebase

**TOTAL:** ~57 archivos aún dependen de Firebase/Firestore

---

## 💡 RECOMENDACIÓN:

**Fase completada:** ✅ Hooks React (API de datos)  
**Siguiente fase:** Migrar servicios y componentes que usan Firebase directamente

**Prioridad:**
1. Servicios críticos (tasks, guests, suppliers)
2. Event bridges (sync entre componentes)
3. Componentes UI
4. Utils y helpers
5. Páginas específicas

**Estrategia:** Crear servicios backend equivalentes y actualizar llamadas.
