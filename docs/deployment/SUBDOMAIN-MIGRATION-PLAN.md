# 🏗️ Plan de Migración a Arquitectura de Subdominios

**Fecha inicio:** 2025-11-10  
**Estado:** En progreso  
**Rama:** feature/subdomain-architecture  
**Backup:** backup-before-subdomains

---

## 📋 Objetivo

Reorganizar la aplicación en 4 subdominios separados:

1. **malove.app** - Landing + App Parejas (Owners)
2. **planners.malove.app** - App Wedding Planners
3. **suppliers.malove.app** - Panel Proveedores
4. **admin.malove.app** - Panel Administración

---

## 🏗️ Estructura Nueva

```
MaLove.App_windows/
├── apps/
│   ├── main-app/           → malove.app
│   ├── planners-app/       → planners.malove.app
│   ├── suppliers-app/      → suppliers.malove.app
│   └── admin-app/          → admin.malove.app
├── packages/
│   ├── ui-components/      → Componentes compartidos
│   ├── utils/              → Utilidades compartidas
│   ├── hooks/              → Hooks React compartidos
│   └── types/              → Types TypeScript compartidos
├── backend/                → Backend compartido (sin cambios)
└── docs/                   → Documentación
```

---

## ✅ Plan de Implementación

### Fase 1: Preparación

- [x] Crear backup en rama `backup-before-subdomains`
- [x] Crear rama de trabajo `feature/subdomain-architecture`
- [ ] Crear estructura de carpetas
- [ ] Configurar npm workspaces

### Fase 2: Creación de Apps

- [ ] main-app (malove.app)
- [ ] planners-app
- [ ] suppliers-app
- [ ] admin-app

### Fase 3: Paquetes Compartidos

- [ ] Extraer componentes UI comunes
- [ ] Extraer utilidades
- [ ] Extraer hooks
- [ ] Configurar imports

### Fase 4: Testing

- [ ] Probar compilación de cada app
- [ ] Probar funcionamiento básico
- [ ] Verificar routing
- [ ] Verificar autenticación

### Fase 5: Documentación

- [ ] Documentar nueva estructura
- [ ] Actualizar README
- [ ] Commit y push

---

## 🔄 Rollback Plan

Si algo falla:

```bash
git checkout backup-before-subdomains
```

---

## 📝 Notas

- Backend permanece sin cambios
- Firebase config compartido
- Cada app tiene su propio .env
- Rutas organizadas por rol
