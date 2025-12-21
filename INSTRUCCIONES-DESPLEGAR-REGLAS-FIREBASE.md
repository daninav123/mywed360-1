# 🔥 Desplegar Reglas de Firestore

Las reglas actualizadas están en `firestore.rules` pero **necesitan ser desplegadas** a Firebase.

## Opción 1: Consola Web de Firebase (MÁS RÁPIDO) ⚡

1. Ve a: https://console.firebase.google.com/project/lovenda-98c77/firestore/rules

2. **Copia el contenido completo** de `firestore.rules` (este archivo en la raíz del proyecto)

3. **Pega** en el editor de la consola (reemplaza todo el contenido)

4. Click en **"Publicar"** (botón azul arriba a la derecha)

5. ✅ Listo - Las reglas estarán activas inmediatamente

---

## Opción 2: Firebase CLI (si ya tienes configurado)

```bash
# Desde la raíz del proyecto
firebase login
firebase deploy --only firestore:rules
```

---

## ¿Qué reglas se añadieron?

Se añadieron permisos para:

1. **Solicitudes de presupuesto de proveedores registrados**:
   - Usuarios pueden leer/crear/eliminar sus propias solicitudes
   - Ruta: `suppliers/{supplierId}/quote-requests/{requestId}`

2. **Solicitudes de presupuesto de proveedores de internet** (Google Places):
   - Usuarios pueden leer/crear/actualizar/eliminar sus propias solicitudes
   - Ruta: `quote-requests-internet/{requestId}`

3. **Lectura pública de proveedores**:
   - Cualquiera puede leer la colección `suppliers` (necesario para buscar y solicitar presupuestos)

---

## Después de desplegar

1. **Recarga la app** (Cmd+R o Ctrl+R)
2. **Busca "ReSona Events"** de nuevo
3. **Solicita presupuesto**
4. **Debería aparecer** en "Presupuestos Pendientes" sin errores

---

## ¿Por qué no se desplegaron automáticamente?

Firebase CLI requiere autenticación manual (`firebase login`). El Admin SDK no puede actualizar reglas directamente por seguridad.
