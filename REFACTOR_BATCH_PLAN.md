# Plan de Refactorización Masiva de Estilos

## Estado Actual
- **Total archivos con inline styles:** 175
- **Total inline styles:** 3,665
- **Completado:** InfoBoda.jsx (158 → 1)

## Estrategia de Refactorización en Batch

### Fase 1: Utilidades CSS Base (COMPLETADO ✅)
- StatusIndicator component
- TabButton component
- .form-input, .form-select, .form-textarea
- .text-body, .text-secondary, .text-muted, .text-danger, .text-success
- .section-lavender, .section-sage, .section-yellow, .section-info
- .border-soft

### Fase 2: Utilidades CSS Adicionales (PENDIENTE)
Patrones comunes detectados en análisis:
- `.bg-surface` - background var(--color-surface)
- `.bg-hover` - hover:background var(--color-bg)
- `.border-default` - border var(--color-border)
- `.hover-primary` - hover text primary
- `.card-header` - card headers consistentes
- `.table-header` - table headers consistentes
- `.badge-*` - más variantes de badges

### Fase 3: Top 20 Páginas (3,665 → ~500 inline styles objetivo)

**Batch 1 - Crítico (543 styles):**
1. SupplierDashboard.jsx - 128 styles
2. DisenoWeb.jsx - 120 styles
3. DynamicServicePage.jsx - 109 styles
4. DiaDeBoda.jsx - 107 styles
5. TransporteLogistica.jsx - 99 styles

**Batch 2 - Alto (402 styles):**
6. PartnerStats.jsx - 84 styles
7. PostBoda.jsx - 82 styles
8. GestionNinos.jsx - 81 styles
9. StyleDemo.jsx - 79 styles
10. AdminAITraining.jsx - 76 styles

**Batch 3 - Medio (369 styles):**
11. AdminTaskTemplates.jsx - 72 styles
12. More.jsx - 66 styles
13. SupplierRequestDetail.jsx - 63 styles
14. Checklist.jsx - 63 styles
15. WeddingTeam.jsx - 57 styles

**Batch 4 - Email Pages (165 styles):**
- UnifiedEmail.jsx - 106 styles ⚠️ PRIORIDAD USUARIO
- EmailSetup.jsx - 42 styles
- EmailTemplates.jsx - 12 styles
- EmailInbox.jsx - 5 styles

**Batch 5 - Bajo (245 styles):**
16. EventosRelacionados.jsx - 54 styles
17. PublicQuoteResponse.jsx - 51 styles
18. TramitesLegales.jsx - 48 styles
19. TasksAI.jsx - 45 styles
20. PruebasEnsayos.jsx - 44 styles

### Fase 4: Resto (~2,000 styles)
Refactorizar páginas restantes <40 styles usando script automatizado

## Métricas de Éxito
- ✅ Archivos con inline styles: <50 (actual: 175)
- ✅ Inline styles totales: <500 (actual: 3,665)
- ✅ Páginas con >20 inline styles: 0 (actual: 60+)
- ✅ Componentes UI reutilizables: 20+ (actual: 12)
- ✅ Utilidades CSS: 100+ (actual: 85)

## Prioridad Inmediata
1. UnifiedEmail.jsx (solicitado por usuario)
2. SupplierDashboard.jsx (128 styles)
3. DisenoWeb.jsx (120 styles)
