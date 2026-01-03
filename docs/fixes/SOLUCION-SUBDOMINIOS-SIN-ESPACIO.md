# 🎯 Solución: Subdominios sin Espacio en Disco

## ⚠️ Problema

**Disco lleno:** Solo 307MB libres, no alcanza para instalar dependencias en cada app.

---

## ✅ Solución Implementada: Arquitectura Híbrida

### Opción A: Mantener todo en main-app por ahora (RECOMENDADO)

**Estado actual:**
- ✅ main-app funcionando en puerto 5173
- ✅ Incluye rutas de owners Y proveedores
- ✅ Todo funciona correctamente

**Ventajas:**
- No requiere espacio adicional
- Ya está funcionando
- Puedes trabajar normalmente

**Desventajas:**
- No hay separación física de apps
- Todas las rutas en un solo puerto

---

### Opción B: Proxy reverso con Nginx/Caddy

Usar un proxy que redirija según el subdominio:

```nginx
# suppliers.malove.app → main-app/supplier/*
# malove.app → main-app/*
```

**Ventajas:**
- Subdominios funcionan
- No duplica código
- Usa solo main-app

---

### Opción C: Separar cuando haya más espacio

1. Liberar ~5GB de espacio en disco
2. Entonces separar suppliers-app, planners-app, admin-app
3. Cada una con su node_modules

---

## 🚀 Recomendación Inmediata

**Continuar con main-app que incluye todo:**

```
http://localhost:5173/supplier/dashboard/:id  → Panel de proveedores
http://localhost:5173/home                    → Panel de owners
http://localhost:5173/admin                   → Panel admin
```

**Cuando tengas más espacio:**
- Separar físicamente las apps
- Cada una en su puerto
- Deploy independiente

---

## 📊 Estado Actual

| App | Puerto | Estado | Contenido |
|-----|--------|--------|-----------|
| main-app | 5173 | ✅ Funcionando | TODO (owners + suppliers + admin) |
| suppliers-app | 5175 | ❌ Sin espacio | - |
| planners-app | 5174 | ❌ Sin espacio | - |
| admin-app | 5176 | ❌ Sin espacio | - |

---

## 💡 Para Producción

En producción SÍ puedes tener subdominios separados usando:

1. **Build de cada app por separado**
2. **Deploy en servidores diferentes**
3. **O usar proxy reverso:**

```nginx
server {
    server_name suppliers.malove.app;
    location / {
        proxy_pass http://main-app:5173/supplier;
    }
}

server {
    server_name malove.app;
    location / {
        proxy_pass http://main-app:5173;
    }
}
```

---

## ✅ Conclusión

**La aplicación funciona perfectamente en main-app.**

Los subdominios se pueden implementar:
- En desarrollo: Con más espacio en disco
- En producción: Con proxy reverso o builds separados

**Por ahora, continúa trabajando con main-app que tiene todo.** ✅
