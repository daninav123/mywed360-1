# Nueva HomePage2 - Dashboard Moderno

## Implementación Completada ✅

Se ha creado una nueva página de inicio moderna inspirada en el diseño dashboard que propusiste.

## 📁 Estructura de Archivos

### Componentes Creados
```
apps/main-app/src/
├── components/
│   ├── HomePage2.jsx                      # Componente principal del dashboard
│   └── dashboard/                         # Componentes modulares
│       ├── MetricCard.jsx                 # Card base reutilizable
│       ├── CountdownCard.jsx              # Cuenta atrás a la boda
│       ├── BudgetCard.jsx                 # Presupuesto gastado/total
│       ├── GuestListCard.jsx              # Invitados confirmados/pendientes
│       ├── BudgetDonutChart.jsx           # Gráfico donut de distribución
│       ├── UpcomingTasksList.jsx          # Lista de próximas tareas
│       ├── InspirationBoardCompact.jsx    # Galería compacta de inspiración
│       └── CoupleIllustration.jsx         # 🆕 Ilustración SVG de pareja
└── pages/
    └── Home2.jsx                          # Página con lazy loading
```

## 🎨 Características Implementadas

### 1. **Métricas Principales** (3 Cards)
- **Countdown**: Días restantes hasta la boda
- **Budget**: Presupuesto gastado de total
- **Guest List**: Confirmados vs Pendientes

### 2. **Upcoming Tasks**
- Lista de las 4 próximas tareas pendientes
- Iconos con colores distintivos
- Click para navegar a /checklist

### 3. **Budget Overview**
- Gráfico donut interactivo con Recharts
- Distribución por categorías (hasta 6)
- Tooltips con porcentajes
- Leyenda de colores

### 4. **Inspiration Board**
- 3 imágenes destacadas
- Link directo a galería completa
- Carga desde servicios existentes

## 🚀 Cómo Acceder

### Opción 1: URL Directa
```
http://localhost:5173/home2
```

### Opción 2: Navegación desde la App
Navegar a `/home2` desde cualquier componente:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/home2');
```

## 🔄 Comparación: Home Original vs Home2

| Característica | Home Original | Home2 Dashboard |
|---|---|---|
| **Diseño** | Lista vertical | Grid de cards |
| **Métricas** | 4 stats básicos | 3 cards destacados |
| **Progreso** | Barra lineal | Cards individuales |
| **Presupuesto** | Número simple | Gráfico donut |
| **Tareas** | No mostradas | Lista de 4 próximas |
| **Inspiración** | Scroll horizontal | Grid 3 columnas |
| **Estilo** | Más tradicional | Moderno/dashboard |

## 📊 Datos que Utiliza

La Home2 conecta automáticamente con:

1. **useFinance**: Presupuesto y movimientos
2. **useFirestoreCollection('guests')**: Invitados confirmados
3. **useWeddingTasksHierarchy**: Tareas pendientes
4. **activeWeddingData**: Fecha de boda y nombres
5. **fetchWall**: Galería de inspiración

## 🌍 Traducciones

Se han añadido traducciones completas en:
- ✅ Español (ES)
- ✅ Inglés (EN)

Las claves están en `home.json` bajo el namespace `home2`:
```json
{
  "home2": {
    "header": { "greeting": "...", ... },
    "countdown": { "title": "...", ... },
    "budget": { "title": "...", ... },
    ...
  }
}
```

## 🎯 Próximos Pasos Sugeridos

### Para Testing
1. Visitar `/home2` en modo autenticado
2. Verificar que los datos se cargan correctamente
3. Probar responsividad en móvil/tablet

### Para Activación
Puedes hacer una de estas opciones:

**Opción A: Reemplazar Home actual**
```javascript
// En App.jsx línea 481
<Route path="home" element={<Home2 />} />
```

**Opción B: Toggle en Settings**
Añadir preferencia de usuario:
```javascript
const preferredHome = userProfile?.preferredHome || 'original';
const HomeComponent = preferredHome === 'dashboard' ? Home2 : HomeUser;
```

**Opción C: Mantener ambas**
- `/home` → HomePage original
- `/home2` → HomePage dashboard (actual)

## 🐛 Debugging

Si encuentras problemas:

```javascript
// Console del navegador
console.log('Wedding data:', activeWeddingData);
console.log('Finance stats:', financeStats);
console.log('Guests:', guestsCollection);
console.log('Tasks:', taskParents);
```

## 📦 Dependencias Utilizadas

- ✅ `recharts` (ya instalada): Gráficos
- ✅ `lucide-react` (ya instalada): Iconos
- ✅ `react-router-dom` (ya instalada): Navegación
- ✅ `date-fns` (ya instalada): Fechas

## 🎨 Personalización de Colores

Los colores de las cards se pueden personalizar en cada componente:

```javascript
// CountdownCard.jsx
color="bg-amber-50"
textColor="text-amber-800"
valueColor="text-amber-600"
accentColor="bg-amber-300"

// BudgetCard.jsx
color="bg-green-50"
...

// GuestListCard.jsx
color="bg-pink-50"
...
```

## ✨ Características Avanzadas

- **Responsive**: Se adapta a móvil, tablet y desktop
- **Lazy loading**: Se carga bajo demanda
- **Performance**: Memoización con useMemo
- **Accesibilidad**: Estructura semántica
- **Internacionalización**: Multiidioma completo

## 🎨 Mejoras Visuales Implementadas (29 Dic 2025)

### Header Mejorado
- ✅ **Imagen GENÉRICA de pareja de bodas** (320x192px) desde Unsplash
- ✅ Foto profesional de pareja real en su boda (genérica para todos los usuarios)
- ✅ Layout exacto del diseño: texto izquierda, imagen derecha
- ✅ Fondo suave beige/crema con gradiente sutil
- ✅ Extracción correcta de nombres desde `weddingInfo.coupleName` (parsea "y", "&", etc.)
- ✅ Formato: "Hi Ana & Carlos!" con nombres separados correctamente
- ✅ Fallback a imagen alternativa de Pexels si falla Unsplash
- ✅ Sin funcionalidad de subir foto (imagen decorativa genérica)

### Ilustración de Pareja (CoupleIllustration.jsx)
- 🎨 **SVG artístico** con novia y novio lado a lado
- 💐 Novia: vestido blanco, velo, flores en cabello, ramo de flores
- 🤵 Novio: traje oscuro, camisa blanca, corbata roja
- 💕 Corazones flotantes decorativos
- 🎨 Gradientes suaves en rosa y melocotón

### Metric Cards Actualizadas
- ✅ **Countdown**: Valor grande con "Days to Go", barra de progreso dorada
- ✅ **Budget**: Muestra gastado/total con barra de progreso verde
- ✅ **Guest List**: Confirmados en grande, pendientes en pequeño
- ✅ Bordes sutiles en todas las cards
- ✅ Títulos en uppercase con tracking-wide

### Secciones Rediseñadas
- ✅ **Upcoming Tasks**: Diseño más compacto con iconos circulares
- ✅ **Budget Chart**: Donut más pequeño, mejor distribución
- ✅ **Inspiration Board**: Iconos de corazón en las miniaturas

## 🔗 Archivos Modificados

1. `apps/main-app/src/App.jsx` - Ruta añadida
2. `apps/main-app/src/i18n/locales/es/home.json` - Traducciones ES
3. `apps/main-app/src/i18n/locales/en/home.json` - Traducciones EN

## 📝 Notas Técnicas

- Los colores usan la paleta existente de Tailwind
- El chart utiliza Recharts 2.x (compatible con React 18)
- La cuenta atrás calcula días completos hasta medianoche
- Las tareas se ordenan por proximidad (las no completadas primero)
- El presupuesto agrupa por categoría automáticamente

---

**Creado**: 29 Diciembre 2025
**Autor**: Sistema de desarrollo MaLoveApp
**Versión**: 1.0.0
