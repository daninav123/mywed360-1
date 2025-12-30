# 🎨 Análisis de Estilos - Estado de Páginas

**Fecha:** 29 diciembre 2024  
**Objetivo:** Aplicar estilo visual consistente a todas las páginas

---

## 📊 ESTADO ACTUAL

### Estilo Definido en `index.css`
```css
--color-bg: #f7f1e7           /* Beige cálido */
--color-surface: #ffffff       /* Blanco cards */
--color-text: #1f2937          /* Texto principal */
--color-primary: #5ebbff       /* Azul primario */
```

### Clases Utility Estándar
- `layout-container` / `layout-container-wide` - Contenedor centrado
- `page-title` - Títulos de página
- `bg-surface` - Fondo blanco de cards
- `shadow-md` - Sombra estándar
- `rounded-xl` - Bordes redondeados

---

## ✅ PÁGINAS CON ESTILO CORRECTO (24)

Estas páginas YA usan las clases estándar:

### Principales
1. `Tasks.jsx` - ✅ Referencia perfecta
2. `TasksAI.jsx` - ✅ Con layout-container
3. `Invitados.jsx` - ✅ Estilo estándar
4. `InfoBoda.jsx` - ✅ Layout correcto
5. `Finance.jsx` - ✅ Estilo aplicado
6. `ProveedoresNuevo.jsx` - ✅ Actualizado

### Admin
7. `AdminBlog.jsx` - ✅ Layout estándar

### Marketing
8. `Partners.jsx` - ✅ Layout aplicado (6 referencias)
9. `Access.jsx` - ✅ Estilo correcto

### Suppliers
10. `SupplierDashboard.jsx` - ✅ Layout estándar
11. `SupplierProducts.jsx` - ✅ Estilo aplicado
12. `SupplierRequestDetail.jsx` - ✅ Layout correcto
13. `SupplierRequestsNew.jsx` - ✅ Estilo estándar

### Configuración
14. `Perfil.jsx` - ✅ Layout aplicado
15. `NotificationPreferences.jsx` - ✅ Estilo correcto
16. `EmailSetup.jsx` - ✅ Layout estándar
17. `BankConnect.jsx` - ✅ Estilo aplicado

### Públicas
18. `SupplierPublicPage.jsx` - ✅ Layout correcto
19. `PublicQuoteResponse.jsx` - ✅ Estilo estándar

### Protocolo/Wedding Day
20. `ProtocoloLayout.jsx` - ✅ Layout aplicado
21. `WeddingDayMode.jsx` - ✅ Estilo correcto

### Wizard
22. `CreateWeddingAssistant.jsx` - ✅ Layout estándar

### Backups (mantener)
23. `Finance.backup.jsx` - ✅ Mantener como está
24. `ProveedoresNuevo.backup.jsx` - ✅ Mantener como está

### Especiales
25. `Checklist.jsx` - ✅ Con wedding-warm.css importado

---

## ⚠️ PÁGINAS QUE NECESITAN REVISIÓN (21)

### Alta Prioridad (Uso Frecuente)

#### 1. **HomePage / Dashboard**
- **Archivos:** `Home.jsx`, `Home2.jsx`, `HomeUser.jsx`, `HomePage.jsx` (component)
- **Estado:** Revisar si usan degradados o efectos blur
- **Acción:** Verificar consistencia con style guide

#### 2. **Invitaciones**
- `Invitaciones.jsx`
- `InvitationDesigner.jsx`
- **Acción:** Aplicar bg-surface, eliminar degradados

#### 3. **Momentos & Ideas**
- `Momentos.jsx`
- `Ideas.jsx`
- `Inspiration.jsx`
- **Acción:** Estandarizar layout y cards

#### 4. **Gestión**
- `GestionProveedores.jsx`
- `GestionNinos.jsx`
- `InvitadosEspeciales.jsx`
- **Acción:** Aplicar layout-container-wide

#### 5. **Diseño Web**
- `DisenoWeb.jsx`
- `DesignWizard.jsx`
- **Acción:** Mantener diseño especial pero verificar colores

### Media Prioridad

#### 6. **Documentos & Contratos**
- `DocumentosLegales.jsx`
- `Contratos.jsx`
- **Acción:** Aplicar bg-surface en cards

#### 7. **Email & Comunicación**
- `EmailTemplates.jsx`
- `Buzon_fixed_complete.jsx`
- **Acción:** Estandarizar diseño

#### 8. **Eventos**
- `EventosRelacionados.jsx`
- `DiaDeBoda.jsx`
- **Acción:** Aplicar layout estándar

#### 9. **Admin**
- `AdminAITraining.jsx`
- **Acción:** Verificar consistencia

### Baja Prioridad (Dev/Utilities)

#### 10. **Dev Pages**
- `DevEnsureFinance.jsx`
- `DevSeedGuests.jsx`
- `BudgetApprovalHarness.jsx`
- **Acción:** Mantener funcionales, no críticas

#### 11. **Wizard/Onboarding**
- `CreateWeddingAI.jsx`
- **Acción:** Verificar experiencia

#### 12. **Otras**
- `AyudaCeremonia.jsx`
- `DJDownloadsPage.jsx`
- **Acción:** Revisar cuando sea necesario

---

## 📋 PÁGINAS ESPECIALES (No Tocar)

### Marketing (Diseño Propio)
- `Landing.jsx` / `Landing2.jsx` - Diseño marketing específico
- `ForSuppliers.jsx` - Landing proveedores
- `ForPlanners.jsx` - Landing planners
- `Blog.jsx`, `BlogPost.jsx`, `BlogAuthor.jsx` - Diseño blog

### Auth
- `Login.jsx` - Diseño auth específico
- `AcceptInvitation.jsx` - Flow específico

### Bodas Admin
- `Bodas.jsx`, `BodaDetalle.jsx` - Admin de bodas
- `Dashboard.jsx` - Admin general

---

## 🎯 PLAN DE ACCIÓN

### Fase 1: Páginas Críticas (1-2 horas)
```
1. HomePage/Dashboard
2. Invitaciones
3. Momentos
4. Ideas
5. GestionProveedores
```

### Fase 2: Páginas Secundarias (1-2 horas)
```
6. GestionNinos
7. InvitadosEspeciales
8. DocumentosLegales
9. Contratos
10. EmailTemplates
```

### Fase 3: Páginas Terciarias (1 hora)
```
11. EventosRelacionados
12. DiaDeBoda
13. Buzon
14. DJDownloads
15. AyudaCeremonia
```

---

## 🔧 TEMPLATE ESTÁNDAR A APLICAR

```jsx
// Estructura base para cualquier página
import { useTranslations } from '../hooks/useTranslations';

export default function PageName() {
  const { t } = useTranslations();

  return (
    <div className="layout-container-wide space-y-6 pt-4 md:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="page-title">{t('page.title')}</h1>
          <p className="text-muted mt-1">{t('page.subtitle')}</p>
        </div>
        {/* Acciones opcionales */}
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {/* Cards con estilo estándar */}
        <div className="bg-surface rounded-xl shadow-md border border-soft p-6 text-body">
          {/* Contenido del card */}
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ CHECKLIST POR PÁGINA

Antes de marcar como completa, verificar:

- [ ] Usa `layout-container` o `layout-container-wide`
- [ ] Título con clase `page-title`
- [ ] Subtítulo con `text-muted mt-1`
- [ ] Cards con `bg-surface rounded-xl shadow-md border border-soft`
- [ ] NO usa degradados (`bg-gradient-*`)
- [ ] NO usa efectos blur (`blur-*`)
- [ ] NO usa colores hardcodeados
- [ ] Padding consistente `p-6` o `p-4 md:p-6`
- [ ] Espaciado vertical `space-y-6`
- [ ] Botones con estilo estándar

---

## 📊 RESUMEN

**Total páginas:** ~70  
**Con estilo correcto:** 24 (34%)  
**Necesitan actualización:** 21 (30%)  
**Especiales (no tocar):** 25 (36%)

**Tiempo estimado:** 4-5 horas para completar todo  
**Prioridad inmediata:** 5-10 páginas más usadas

---

## 🚀 SIGUIENTE PASO

¿Quieres que empiece con las páginas de alta prioridad?

Puedo actualizar:
1. **HomePage/Dashboard** (más visible)
2. **Invitaciones** (muy usado)
3. **Momentos** (funcionalidad core)
4. **Ideas** (muy usado)
5. **GestionProveedores** (importante)

O prefieres empezar por otra página específica?
