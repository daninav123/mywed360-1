# 🏗️ Arquitectura de Subdominios - MaLove.App

**Versión:** 2.0  
**Fecha:** 2025-11-10  
**Estado:** Implementando

---

## 📊 Arquitectura General

```
┌──────────────────────────────────────────────────┐
│                 malove.app                       │
│         Landing + Owners (Parejas)               │
└──────────────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┬──────────────┐
    │               │               │              │
┌───▼────┐   ┌──────▼─────┐  ┌─────▼──────┐  ┌───▼────┐
│planners│   │ suppliers  │  │   admin    │  │        │
│.malove │   │ .malove    │  │  .malove   │  │        │
│  .app  │   │   .app     │  │   .app     │  │        │
└────────┘   └────────────┘  └────────────┘  └────────┘
```

---

## 🗂️ Estructura del Proyecto

```
mywed360_windows/
├── apps/
│   ├── main-app/              → malove.app
│   │   ├── src/
│   │   │   ├── pages/         → Landing + Owner pages
│   │   │   ├── components/    → Componentes específicos
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── .env
│   │   └── package.json
│   │
│   ├── planners-app/          → planners.malove.app
│   │   ├── src/
│   │   │   ├── pages/         → Planner pages
│   │   │   ├── components/    → Componentes específicos
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── .env
│   │   └── package.json
│   │
│   ├── suppliers-app/         → suppliers.malove.app
│   │   ├── src/
│   │   │   ├── pages/         → Supplier pages
│   │   │   ├── components/    → Componentes específicos
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── .env
│   │   └── package.json
│   │
│   └── admin-app/             → admin.malove.app
│       ├── src/
│       │   ├── pages/         → Admin pages
│       │   ├── components/    → Componentes específicos
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── public/
│       ├── index.html
│       ├── vite.config.js
│       ├── .env
│       └── package.json
│
├── packages/
│   ├── ui-components/         → Componentes compartidos
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── index.js
│   │   └── package.json
│   │
│   ├── utils/                 → Utilidades compartidas
│   │   ├── src/
│   │   │   ├── api.js
│   │   │   ├── formatters.js
│   │   │   └── index.js
│   │   └── package.json
│   │
│   ├── hooks/                 → Hooks compartidos
│   │   ├── src/
│   │   │   ├── useAuth.jsx
│   │   │   ├── useTranslations.jsx
│   │   │   └── index.js
│   │   └── package.json
│   │
│   └── types/                 → Types TypeScript compartidos
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── backend/                   → Backend compartido (sin cambios)
│   ├── index.js
│   ├── routes/
│   ├── services/
│   └── ...
│
├── docs/                      → Documentación
├── package.json               → Root package con workspaces
└── ...
```

---

## 📦 NPM Workspaces

El `package.json` raíz configurará workspaces:

```json
{
  "name": "malove-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

---

## 🔗 Imports entre paquetes

```javascript
// Dentro de cualquier app
import { Button, Card } from '@malove/ui-components';
import { formatDate, api } from '@malove/utils';
import { useAuth, useTranslations } from '@malove/hooks';
```

---

## 🌐 Distribución de Páginas por Subdominio

### **1. malove.app (main-app)**

**Páginas públicas:**

- Landing, App Overview, Pricing, Blog, Login, Signup
- Wedding sites públicos, Perfiles públicos de proveedores

**Páginas privadas (owners):**

- Home, Bodas, Invitados, Finance, Proveedores
- Tasks, Checklist, Timeline, Protocolo, Ideas
- Email, Web Editor, Momentos, Perfil

### **2. planners.malove.app (planners-app)**

- Home (PlannerDashboard)
- Weddings (lista y detalle), Clients
- Team, Templates, Resources
- Business Finance, Calendar, Overview

### **3. suppliers.malove.app (suppliers-app)**

- Login, Register
- Dashboard, Requests, Messages
- Portfolio, Products, Plans, Payments, Reviews
- Analytics, Availability, Settings

### **4. admin.malove.app (admin-app)**

- Login, Dashboard, Metrics
- Users, Suppliers, Blog, Portfolio
- Broadcast, Automations, Alerts
- Settings, Integrations, Support
- Finance, Reports

---

## 🚀 Scripts de Desarrollo

```bash
# Desarrollo
npm run dev:main       # malove.app en puerto 5173
npm run dev:planners   # planners.malove.app en puerto 5174
npm run dev:suppliers  # suppliers.malove.app en puerto 5175
npm run dev:admin      # admin.malove.app en puerto 5176
npm run dev:all        # Todas las apps en paralelo

# Build
npm run build:main
npm run build:planners
npm run build:suppliers
npm run build:admin
npm run build:all

# Backend
npm run backend        # Backend en puerto 4004
```

---

## 🔐 Autenticación

```javascript
// Redirect después de login en malove.app/login
const redirectByRole = {
  owner: '/home', // Mismo dominio
  planner: 'https://planners.malove.app', // Subdominio
  supplier: 'https://suppliers.malove.app', // Subdominio
  admin: 'https://admin.malove.app', // Subdominio
};
```

---

## 🎯 Ventajas de esta Arquitectura

### ✅ **Separación de responsabilidades**

- Cada rol tiene su app optimizada
- Bundle size reducido por app
- Mejor rendimiento

### ✅ **Seguridad mejorada**

- Aislamiento de código por rol
- Diferentes políticas de CORS
- Tokens específicos por subdominio

### ✅ **Escalabilidad**

- Deploy independiente
- Versionado por app
- Rollback sin afectar otros roles

### ✅ **Desarrollo más fácil**

- Equipos pueden trabajar en apps separadas
- Menos conflictos en git
- Builds más rápidos

### ✅ **Mantenibilidad**

- Código más organizado
- Dependencias claras
- Testing más fácil

---

## 📝 Próximos Pasos

1. ✅ Crear estructura de carpetas
2. ⏳ Configurar npm workspaces
3. ⏳ Crear package.json para cada app
4. ⏳ Copiar código relevante a cada app
5. ⏳ Crear paquetes compartidos
6. ⏳ Configurar variables de entorno
7. ⏳ Probar compilación
8. ⏳ Documentar y commit

---

**Autor:** Sistema de Migración  
**Última actualización:** 2025-11-10
