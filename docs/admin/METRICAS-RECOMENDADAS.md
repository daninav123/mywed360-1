# Métricas Recomendadas - Panel Admin MaLoveApp

## 📊 Resumen Ejecutivo

Este documento define las métricas clave para monitorear la salud del negocio, producto y operaciones de MaLoveApp.

---

## 🎯 **Métricas de Producto (App)**

### 1. **Métricas de Usuario**

#### Adquisición
```
✅ YA IMPLEMENTADO:
- Total usuarios registrados
- Usuarios activos últimos 7 días
- Usuarios activos últimos 30 días (DAU/MAU)

🔄 PENDIENTE:
- Nuevos registros por día/semana/mes (gráfica de tendencia)
- Fuente de registro (orgánico, invitación, marketing)
- Tasa de conversión visitante → registro
- Tiempo promedio hasta primer registro
- Registros por plataforma (web/mobile)
```

#### Activación
```
🔄 PENDIENTE:
- % usuarios que crean su primera boda (Time to Value)
- Tiempo promedio desde registro hasta crear boda
- % usuarios que añaden primer invitado
- % usuarios que suben primera foto
- % usuarios que usan cada módulo (Invitados, Seating, Momentos, etc.)
- Tasa de onboarding completo (pasos completados)
```

#### Engagement
```
✅ YA IMPLEMENTADO:
- D1, D7, D30 retención

🔄 PENDIENTE:
- DAU/MAU ratio (Daily Active Users / Monthly Active Users)
- WAU (Weekly Active Users)
- Sesiones promedio por usuario/día
- Duración promedio de sesión
- Páginas vistas por sesión
- Feature adoption rate por módulo
- Stickiness (DAU/MAU) - ideal >20%
- Frecuencia de uso (días activos/mes)
```

#### Churn
```
🔄 PENDIENTE:
- Tasa de abandono mensual (% usuarios que no vuelven)
- Usuarios dormidos (>30 días sin login)
- Usuarios en riesgo (actividad decreciente)
- Razones de churn (si se captura feedback)
- Resurreción rate (usuarios que vuelven después de inactividad)
```

---

### 2. **Métricas de Bodas**

#### Estado de Bodas
```
✅ YA IMPLEMENTADO:
- Total bodas creadas
- Bodas activas
- Bodas con planner asignado
- Bodas sin planner

🔄 PENDIENTE:
- Bodas por estado (draft, active, completed, archived)
- Tiempo promedio en cada estado
- Tasa de conversión draft → active
- Bodas completadas exitosamente
- Bodas canceladas/archivadas prematuramente
- Distribución por fecha de boda (timeline)
- Bodas por mes (estacionalidad)
```

#### Uso de Features por Boda
```
🔄 PENDIENTE:
- % bodas que usan Lista de Invitados
- % bodas que usan Seating Plan
- % bodas que usan Momentos
- % bodas que usan Proveedores
- % bodas que usan Presupuesto
- % bodas que usan Checklist de Tareas
- % bodas que usan WebEditor (invitaciones digitales)
- Promedio de invitados por boda
- Promedio de proveedores contratados por boda
- Promedio de fotos subidas en Momentos
```

#### Colaboración
```
🔄 PENDIENTE:
- % bodas con múltiples colaboradores (planners, asistentes)
- Promedio de colaboradores por boda
- Invitaciones enviadas vs confirmadas
- Tasa de respuesta RSVP
- Tiempo promedio de respuesta RSVP
```

---

### 3. **Métricas de Módulos Específicos**

#### Momentos (Fotos)
```
🔄 PENDIENTE:
- Total fotos subidas (acumulado)
- Fotos subidas por semana/mes (tendencia)
- Promedio de fotos por boda
- Tasa de aprobación/moderación
- Fotos reportadas/rechazadas
- Tiempo promedio de moderación
- Usuarios que suben fotos vs solo ven
- Storage usado (GB)
```

#### Seating Plan
```
🔄 PENDIENTE:
- % bodas que completan seating plan
- Tiempo promedio en completar seating
- Número de cambios/reorganizaciones promedio
- Mesas promedio por boda
- Asientos promedio por mesa
- Uso de auto-asignación vs manual
```

#### Invitados & RSVP
```
🔄 PENDIENTE:
- Total invitaciones enviadas
- Tasa de apertura de invitaciones digitales
- Tasa de confirmación RSVP
- Tiempo promedio hasta respuesta RSVP
- % confirmaciones Sí/No/Pendiente
- Recordatorios enviados
```

#### WebEditor (Invitaciones)
```
🔄 PENDIENTE:
- % bodas que crean invitación digital
- Templates más usados
- Tiempo promedio en crear invitación
- Invitaciones publicadas vs draft
- Visitas a invitaciones publicadas
- Compartidos en redes sociales
```

#### Presupuesto & Finanzas
```
🔄 PENDIENTE:
- Presupuesto promedio de bodas
- % bodas que completan presupuesto
- Categorías de gasto más comunes
- Desviación presupuesto planeado vs real
```

---

## 💰 **Métricas Económicas (Business)**

### 1. **Revenue & Growth**

#### Ingresos Recurrentes
```
✅ YA IMPLEMENTADO:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Suscripciones activas
- Ticket medio

🔄 PENDIENTE:
- MRR Growth Rate (% crecimiento mensual)
- New MRR (nuevas suscripciones)
- Expansion MRR (upgrades)
- Contraction MRR (downgrades)
- Churned MRR (cancelaciones)
- Net MRR Movement
- ARPU (Average Revenue Per User)
- ARPA (Average Revenue Per Account/Wedding)
```

#### Revenue por Segmento
```
🔄 PENDIENTE:
- Revenue por tipo de plan (Free, Basic, Pro, Premium)
- Revenue por tipo de usuario (Owner, Planner)
- Revenue por geografía
- Revenue por feature add-ons
- Revenue de códigos promocionales
- Revenue de partners/affiliates
```

#### Proyecciones
```
🔄 PENDIENTE:
- Run Rate (MRR × 12)
- Committed MRR (contratos anuales)
- Pipeline de ventas (bodas en proceso)
```

---

### 2. **Costes & Márgenes**

#### Costes Operativos
```
🔄 PENDIENTE:
- CAC (Customer Acquisition Cost)
- COGS (Cost of Goods Sold)
- Hosting/Infrastructure costs
- Storage costs (fotos Momentos)
- CDN costs
- Email/SMS costs (Mailgun, Twilio)
- API costs (OpenAI, otros)
- Coste por usuario activo
```

#### Eficiencia
```
🔄 PENDIENTE:
- Gross Margin (%)
- Contribution Margin por usuario
- CAC:LTV Ratio (ideal >3:1)
- Payback Period (meses para recuperar CAC)
- Magic Number (eficiencia de ventas)
```

---

### 3. **Lifetime Value & Retention**

#### LTV (Lifetime Value)
```
🔄 PENDIENTE:
- LTV promedio por usuario
- LTV por tipo de plan
- LTV por segmento
- Expected LTV (proyección)
- LTV:CAC ratio
```

#### Churn Económico
```
🔄 PENDIENTE:
- Revenue Churn Rate (%)
- Net Revenue Retention (NRR)
- Gross Revenue Retention (GRR)
- Customer Churn Rate vs Revenue Churn Rate
- Cohort Analysis (retención por cohorte de registro)
```

---

### 4. **Conversión & Ventas**

#### Funnel de Conversión
```
✅ YA IMPLEMENTADO:
- Visitantes → Registrados → Bodas activas (básico)

🔄 PENDIENTE:
Funnel detallado:
1. Visitantes únicos
2. Signup iniciado
3. Signup completado
4. Email verificado
5. Primera boda creada
6. Primer invitado añadido
7. Trial iniciado (si aplica)
8. Upgrade a plan de pago
9. Renovación (retained)

Tasas de conversión entre cada paso
```

#### Conversión Owner → Planner
```
✅ YA IMPLEMENTADO:
- Total owners
- Convertidos a planners
- Tasa de conversión
- Tiempo medio de conversión

🔄 MEJORAR:
- Factores que influyen en conversión
- Revenue incremental por conversión
- Funnel de conversión específico
```

---

### 5. **Descuentos & Promociones**

#### Performance de Códigos
```
✅ YA IMPLEMENTADO (parcial en AdminDiscounts):
- Total códigos activos
- Usos por código
- Revenue por código

🔄 PENDIENTE:
- ROI de campañas promocionales
- Tasa de conversión con vs sin descuento
- Descuento promedio aplicado
- Revenue con descuento vs sin descuento
- Códigos más efectivos
- Canales de distribución (partner, influencer, directo)
```

---

## 🚀 **Métricas Técnicas & Operacionales**

### 1. **Performance**

```
🔄 PENDIENTE:
- Page Load Time (promedio por página)
- Time to First Byte (TTFB)
- Core Web Vitals:
  - LCP (Largest Contentful Paint) - ideal <2.5s
  - FID (First Input Delay) - ideal <100ms
  - CLS (Cumulative Layout Shift) - ideal <0.1
- API Response Time (p50, p95, p99)
- Database Query Time
- Uptime (%) - objetivo 99.9%
```

### 2. **Errores & Calidad**

```
🔄 PENDIENTE:
- Error Rate (% requests con error)
- Error 4xx vs 5xx
- Errores JavaScript frontend
- Errores críticos por módulo
- MTTR (Mean Time To Resolution)
- Bugs abiertos vs cerrados
- Bug backlog aging
```

### 3. **Infraestructura**

```
🔄 PENDIENTE:
- Uso de CPU (%)
- Uso de memoria (%)
- Uso de disco/storage (GB)
- Bandwidth usage
- Database connections
- Cache hit rate
- CDN hit rate
- Firebase reads/writes por día
- Coste de infraestructura por usuario
```

---

## 📈 **Métricas de Soporte & Satisfacción**

### 1. **Support**

```
✅ YA IMPLEMENTADO:
- Tickets abiertos/cerrados
- Responder a tickets

🔄 PENDIENTE:
- Tiempo promedio de primera respuesta
- Tiempo promedio de resolución
- Tickets por categoría (bug, feature, ayuda)
- Tickets escalados
- Reopened tickets
- CSAT (Customer Satisfaction Score)
- Support load per agent
```

### 2. **NPS & Feedback**

```
✅ YA IMPLEMENTADO:
- NPS Score
- Promotores/Pasivos/Detractores

🔄 PENDIENTE:
- NPS por segmento (owner, planner)
- Trend de NPS en el tiempo
- Comentarios/feedback cualitativos
- Feature requests más solicitados
- Votes por feature request
```

---

## 🎯 **Métricas de Marketing**

### 1. **Acquisition**

```
🔄 PENDIENTE:
- Fuentes de tráfico (orgánico, paid, referral, social)
- CTR (Click-Through Rate) por canal
- CPL (Cost Per Lead) por canal
- CPM (Cost Per Thousand Impressions)
- CPC (Cost Per Click)
- Conversion Rate por canal
- ROI por canal de marketing
```

### 2. **SEO & Content**

```
🔄 PENDIENTE:
- Tráfico orgánico (visitantes/mes)
- Keywords ranking
- Backlinks
- Domain Authority
- Blog posts publicados
- Engagement en blog (tiempo en página, bounce rate)
```

### 3. **Social Media**

```
🔄 PENDIENTE:
- Followers/seguidores por red
- Engagement rate
- Shares de contenido
- Menciones de marca
- User-generated content (fotos de bodas reales)
```

---

## 🏆 **Métricas Clave (North Star Metrics)**

### Top 5 KPIs Críticos

```
1. **MRR Growth Rate** - Salud financiera
   Target: +10% mensual en fase crecimiento
   
2. **Active Weddings** - Engagement del producto
   Target: +15% mensual
   
3. **NRR (Net Revenue Retention)** - Retención y expansión
   Target: >100% (ideal >110%)
   
4. **CAC:LTV Ratio** - Eficiencia de negocio
   Target: >3:1
   
5. **Feature Adoption Rate** - Valor del producto
   Target: >60% bodas usan al menos 3 módulos
```

---

## 📊 **Dashboard Recomendado**

### Vista Ejecutiva (CEO Dashboard)
```
┌─────────────────────────────────────────────┐
│ MRR: €50,000 (+12% vs último mes)          │
│ ARR: €600,000                               │
│ Active Weddings: 1,234 (+18%)              │
│ NRR: 108%                                   │
│ CAC:LTV: 4.2:1                             │
└─────────────────────────────────────────────┘

[Gráfica MRR últimos 12 meses]
[Gráfica Bodas Activas últimos 6 meses]
[Funnel de Conversión]
```

### Vista Producto (PM Dashboard)
```
┌─────────────────────────────────────────────┐
│ DAU: 342 | MAU: 1,523 | Stickiness: 22.5%  │
│ D7 Retention: 65% | D30: 45%               │
│ Feature Adoption:                           │
│   Invitados: 95% | Seating: 68%           │
│   Momentos: 54% | Presupuesto: 42%        │
└─────────────────────────────────────────────┘

[Gráfica Engagement últimos 30 días]
[Cohort Retention Analysis]
[Feature Funnel]
```

### Vista Tech (CTO Dashboard)
```
┌─────────────────────────────────────────────┐
│ Uptime: 99.92% | Errors: 0.12%             │
│ Avg Response Time: 145ms                    │
│ LCP: 2.1s | FID: 85ms | CLS: 0.08         │
│ Storage Used: 450GB | Costs: €1,234/mo    │
└─────────────────────────────────────────────┘

[Gráfica Error Rate]
[Gráfica Response Times]
[Infra Costs Breakdown]
```

---

## 🔧 **Implementación Técnica**

### Backend Endpoints Necesarios

```javascript
// Métricas de producto
GET /api/admin/metrics/users
  - registrations (daily/weekly/monthly)
  - activation_funnel
  - engagement (DAU/WAU/MAU)
  - retention_cohorts

GET /api/admin/metrics/weddings
  - states_distribution
  - feature_adoption
  - completion_rates

GET /api/admin/metrics/modules/{module}
  - usage_stats
  - performance_metrics

// Métricas económicas
GET /api/admin/metrics/revenue
  - mrr_breakdown
  - revenue_by_segment
  - ltv_analysis

GET /api/admin/metrics/conversion
  - funnel_detailed
  - conversion_rates
  - cohort_analysis

// Métricas técnicas
GET /api/admin/metrics/performance
  - web_vitals
  - api_latency
  - error_rates

GET /api/admin/metrics/infrastructure
  - resource_usage
  - costs_breakdown
```

### Recolección de Datos

```javascript
// Frontend Tracking
window.analytics.track('Wedding Created', {
  userId: user.id,
  weddingId: wedding.id,
  source: 'onboarding',
  timestamp: Date.now()
});

// Backend Events
await db.collection('events').add({
  type: 'feature_used',
  feature: 'seating_plan',
  userId: req.user.uid,
  weddingId: req.body.weddingId,
  metadata: { /* ... */ },
  timestamp: admin.firestore.FieldValue.serverTimestamp()
});

// Agregación Diaria (Cron Job)
node scripts/aggregateMetrics.js --date=2025-10-21
```

---

## 📅 **Frecuencia de Reporte**

### Real-time (Dashboard Live)
- Usuarios activos ahora
- Errores críticos
- Uptime

### Diario
- DAU, nuevos registros
- Revenue del día
- Tickets nuevos

### Semanal
- WAU, engagement
- MRR snapshot
- Feature adoption

### Mensual
- MAU, retention
- MRR growth, churn
- Cohort analysis
- Board reporting

### Trimestral
- OKR review
- Strategy metrics
- LTV updates

---

## 🎯 **Priorización de Implementación**

### Fase 1 (Inmediato) - Crítico
1. ✅ MRR/ARR (completado)
2. ✅ Retention D1/D7/D30 (completado)
3. 🔄 DAU/MAU con gráficas
4. 🔄 Feature adoption por módulo
5. 🔄 Funnel de conversión detallado

### Fase 2 (Corto Plazo) - Importante
6. 🔄 Revenue por segmento
7. 🔄 CAC & LTV
8. 🔄 Performance metrics (Web Vitals)
9. 🔄 Cohort analysis
10. 🔄 Churn rate & revenue churn

### Fase 3 (Medio Plazo) - Nice to Have
11. 🔄 Métricas por módulo específico
12. 🔄 Marketing attribution
13. 🔄 Support metrics detalladas
14. 🔄 Infrastructure costs
15. 🔄 Advanced segmentation

---

## 🚨 **Alertas Recomendadas**

```yaml
Critical:
  - Error rate > 5% for 5 minutes
  - Uptime < 99.5%
  - MRR drop > 10% mensual

Warning:
  - D7 retention < 60%
  - Churn rate > 5% mensual
  - Support tickets backlog > 50

Info:
  - New MRR milestone reached
  - Feature adoption goal met
  - Performance improvement
```

---

**Última actualización:** 21/10/2025  
**Versión:** 1.0
