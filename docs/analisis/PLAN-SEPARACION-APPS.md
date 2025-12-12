# 📋 Plan: Separar Apps por Subdominios

## 🎯 Objetivo

Separar completamente las apps para que cada una corra en su propio puerto:

| App | Puerto | Dominio | Contenido |
|-----|--------|---------|-----------|
| **main-app** | 5173 | malove.app | Landing + Owners/Parejas |
| **suppliers-app** | 5175 | suppliers.malove.app | Panel de Proveedores |
| **planners-app** | 5174 | planners.malove.app | Panel de Planners |
| **admin-app** | 5176 | admin.malove.app | Panel Admin |

---

## ⚠️ Problema Actual

**suppliers-app NO tiene src/** porque lo eliminamos para liberar espacio.

**Consecuencia:** Las rutas de proveedores están en main-app, lo cual no es correcto para la arquitectura de subdominios.

---

## ✅ Solución

### Opción 1: Recrear suppliers-app (RECOMENDADO)
1. Copiar src/ de main-app a suppliers-app
2. Limpiar rutas que no son de proveedores
3. Crear App.jsx específico para proveedores
4. npm install en suppliers-app
5. Probar en puerto 5175

### Opción 2: Mantener todo en main-app por ahora
- Dejar la arquitectura de subdominios para después
- Continuar con main-app que tiene todo

---

## 🚀 ¿Qué prefieres?

**A) Separar suppliers-app ahora** (30-45 min)
- Arquitectura limpia
- Apps independientes
- Cada una en su puerto

**B) Dejarlo para después**
- Continuar trabajando con main-app
- Separar cuando haya más espacio en disco

---

**Recomendación:** Si tienes espacio en disco (~2GB libres), separemos suppliers-app ahora para tener la arquitectura correcta.
