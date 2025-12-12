# 📦 MaLoveApp Shared Packages

Paquetes compartidos entre las diferentes aplicaciones del proyecto MaLoveApp.

## Estructura

```
packages/
├── ui-components/    # Componentes React compartidos
├── utils/            # Utilidades y helpers
├── hooks/            # Custom React hooks
└── types/            # Definiciones de tipos y constantes
```

## Uso

Los packages están configurados como aliases en los `vite.config.js` de cada aplicación:

```javascript
// apps/suppliers-app/vite.config.js
resolve: {
  alias: {
    '@malove/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
    '@malove/utils': path.resolve(__dirname, '../../packages/utils/src'),
    '@malove/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
    '@malove/types': path.resolve(__dirname, '../../packages/types/src'),
  }
}
```

### Importar en tu código

```javascript
// Importar componentes UI
import { Button, Modal } from '@malove/ui-components';

// Importar utilidades
import { formatDate, validateEmail } from '@malove/utils';

// Importar hooks
import { useAuth, useWedding } from '@malove/hooks';

// Importar tipos
import { USER_ROLES, WEDDING_STATUS } from '@malove/types';
```

## 📝 Agregar nuevo contenido

### 1. Crear el archivo en el package correspondiente

```bash
# Ejemplo: crear un nuevo componente Button
touch packages/ui-components/src/Button.jsx
```

### 2. Exportarlo en el index.js del package

```javascript
// packages/ui-components/src/index.js
export { default as Button } from './Button';
```

### 3. Usarlo en cualquier aplicación

```javascript
// apps/main-app/src/pages/Home.jsx
import { Button } from '@malove/ui-components';

function Home() {
  return <Button>Click me</Button>;
}
```

## 🎯 Propósito de cada package

### @malove/ui-components

Componentes visuales reutilizables:

- Botones, modales, cards
- Formularios y inputs
- Navegación y layouts
- Iconos y badges

### @malove/utils

Funciones utilitarias:

- Formateo de fechas, números, monedas
- Validaciones (email, teléfono, etc.)
- Helpers de performance (debounce, throttle)
- Transformaciones de datos

### @malove/hooks

Custom React hooks:

- useAuth - Autenticación
- useWedding - Gestión de bodas
- useSuppliers - Gestión de proveedores
- useForm - Manejo de formularios

### @malove/types

Tipos y constantes:

- Roles de usuario
- Estados de boda
- Categorías de proveedores
- Configuraciones globales

## ⚡ Ventajas

1. **DRY (Don't Repeat Yourself)**: Código compartido en un solo lugar
2. **Consistencia**: Mismos componentes y estilos en todas las apps
3. **Mantenimiento**: Cambios en un solo lugar afectan a todas las apps
4. **Type Safety**: TypeScript puede usarse para validación
5. **Performance**: Vite optimiza automáticamente los imports

## 🔧 Mantenimiento

- Mantener exports claros y documentados
- No crear dependencias circulares entre packages
- Usar tree-shaking friendly exports
- Documentar props de componentes
- Agregar tests cuando sea relevante

---

**Estado actual:** Estructura creada y configurada ✅  
**Contenido:** Vacío (listo para poblar según necesidad)
