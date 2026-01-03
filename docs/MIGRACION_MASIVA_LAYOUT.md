# Migración Masiva al Estilo Home2

**Estado:** 2 de 90 páginas migradas (2%)  
**Objetivo:** Migrar todas las 90 páginas al estilo de Home2  
**Referencia:** `HomePage2.jsx` es el estándar perfecto

---

## 📊 Progreso

### ✅ Páginas Migradas (2)
- Home2.jsx
- Finance.jsx

### 🔄 Páginas Prioritarias (Siguiente)
1. **Invitados.jsx** - Gestión de invitados
2. **Checklist.jsx** - Lista de tareas
3. **Proveedores.jsx** - Búsqueda de proveedores
4. **Tasks.jsx** - Tareas generales
5. **InfoBoda.jsx** - Información de la boda
6. **DisenoWeb.jsx** - Diseño de página web
7. **Momentos.jsx** - Momentos especiales
8. **UnifiedEmail.jsx** - Gestión de emails
9. **SeatingPlan.jsx** - Plan de asientos
10. **RSVPDashboard.jsx** - Dashboard de confirmaciones

### 📋 Páginas Pendientes (88)

**Dashboard y Gestión (20):**
- AdminAITraining.jsx
- Dashboard.jsx
- PartnerStats.jsx
- SubscriptionDashboard.jsx
- WebBuilderDashboard.jsx
- GestionProveedores.jsx
- GestionNinos.jsx
- NotificationPreferences.jsx
- Perfil.jsx
- More.jsx
- (10 más...)

**Contenido y Diseño (20):**
- Blog.jsx
- BlogPost.jsx
- BlogAuthor.jsx
- Ideas.jsx
- Inspiration.jsx
- DesignWizard.jsx
- InvitationDesigner.jsx
- WebEditor.jsx
- WebBuilderPage.jsx
- WebBuilderPageCraft.jsx
- (10 más...)

**Eventos y Ceremonias (15):**
- DiaDeBoda.jsx
- PostBoda.jsx
- EventosRelacionados.jsx
- AyudaCeremonia.jsx
- PruebasEnsayos.jsx
- TramitesLegales.jsx
- TransporteLogistica.jsx
- DocumentosLegales.jsx
- WeddingTeam.jsx
- Timing.jsx
- (5 más...)

**Proveedores y Suppliers (15):**
- SupplierPortal.jsx
- SupplierRegistration.jsx
- SupplierPublicPage.jsx
- SupplierCompare.jsx
- SavedSuppliers.jsx
- PublicQuoteResponse.jsx
- QuoteResponsesPage.jsx
- (8 más...)

**Públicas y Marketing (10):**
- Landing2.jsx
- PublicWeb.jsx
- PublicWedding.jsx
- PublicRSVP.jsx
- WeddingSite.jsx
- (5 más...)

**Otras (8):**
- Login.jsx
- Signup.jsx
- ResetPassword.jsx
- VerifyEmail.jsx
- AcceptInvitation.jsx
- (3 más...)

---

## 🔧 Patrón de Migración

### Antes:
```jsx
function MiPagina() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Título</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {/* contenido */}
      </div>
    </div>
  );
}
```

### Después:
```jsx
import { PageLayout, PageSection } from '../components/layouts';

function MiPagina() {
  return (
    <PageLayout title="Título" subtitle="Descripción" icon="🎯">
      <PageSection>
        {/* contenido */}
      </PageSection>
    </PageLayout>
  );
}
```

---

## 📝 Checklist por Página

- [ ] Agregar import: `import { PageLayout, PageSection } from '../components/layouts';`
- [ ] Envolver con `<PageLayout title="..." subtitle="..." icon="...">`
- [ ] Mover título y descripción a props de PageLayout
- [ ] Envolver cada sección de contenido con `<PageSection>`
- [ ] Actualizar cards internos con estilos correctos
- [ ] Eliminar clases antiguas de layout
- [ ] Probar visualmente

---

## 🚀 Estrategia de Migración

### Fase 1: Páginas Críticas (10 páginas) - PRIORIDAD ALTA
Páginas más usadas del flujo principal de usuario.
**Tiempo estimado:** 2-3 horas

### Fase 2: Páginas de Dashboard (20 páginas) - PRIORIDAD MEDIA
Páginas de gestión y administración.
**Tiempo estimado:** 4-5 horas

### Fase 3: Páginas de Contenido (20 páginas) - PRIORIDAD MEDIA
Blog, ideas, diseño.
**Tiempo estimado:** 4-5 horas

### Fase 4: Páginas Restantes (38 páginas) - PRIORIDAD BAJA
Páginas secundarias y auxiliares.
**Tiempo estimado:** 6-8 horas

**TOTAL:** 16-21 horas de trabajo

---

## ⚡ Migración Automática vs Manual

### Automática (Script)
- ✅ Rápida para cambios estructurales
- ❌ Puede no capturar casos especiales
- ❌ Requiere revisión manual después

### Manual (Una por una)
- ✅ Control total sobre cada detalle
- ✅ Captura casos especiales
- ❌ Muy lenta (15-20 min por página)

### Recomendación: **Híbrida**
1. Script para cambios básicos (imports, estructura)
2. Revisión manual de páginas críticas
3. Testing visual de cada grupo

---

**Última actualización:** 30 de diciembre de 2024
