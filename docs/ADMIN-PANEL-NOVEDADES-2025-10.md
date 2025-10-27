# Novedades del panel admin (Octubre 2025)

Este documento resume los cambios recientes aplicados al panel de administración para dar visibilidad rápida a soporte, producto y operaciones.

## Sidebar desplegable

- **¿Qué cambia?** en pantallas `lg` (≥1024px) ahora el menú lateral puede colapsarse.
- **Cómo funciona:** el botón redondo flotante, junto al logotipo, alterna el estado.
- **Persistencia:** la preferencia se guarda en `localStorage` (`maloveapp_admin_sidebar_collapsed`), por lo que cada usuario conserva su última elección tras recargar o volver a entrar.
- **Fallback:** en viewports menores a `lg` el comportamiento no cambia; el sidebar permanece oculto como antes.

## Sección de finanzas → Revolut

- **Ruta:** `/admin/finance/revolut`.
- **Permite:**
  - Ver el estado de la cuenta Revolut Business (saldo, límites, webhooks, último sync).
  - Lanzar acciones manuales: sincronizar, rearmar webhooks, solicitar enlace de conexión o desconectar la cuenta.
  - Visualizar movimientos recientes y descargar extractos.
- **Back-end esperado:** endpoints bajo `/api/admin/dashboard/finance/revolut*` deben devolver `account`, `transfers`, `statements` y aceptar las mutaciones (`sync`, `webhooks/refresh`, `connect`, `disconnect`).
- **Copia de seguridad:** si no hay datos reales, el front muestra contenido neutro (estados “sin verificar”, totales a 0).

## Gestión de comerciales con jefe asignado

- **Formulario de enlaces comerciales (`/admin/commerce`):**
  - Se añadió el bloque “Jefe de comerciales (opcional)” para capturar nombre, email y teléfono del responsable.
  - La API ahora envía/recibe `salesManager` junto con `assignedTo`.
  - Al guardar se normaliza la información (strings vacíos → `null`).
- **Resumen y monitorización:**
  - Nueva tarjeta de métricas (“Jefes comerciales”) contando responsables únicos.
  - Sección “Jefes de comerciales” con datos agregados por manager, listando los comerciales a su cargo y su desempeño (usos, facturación, enlaces).
  - Tabla de enlaces incluye columnas “Comercial” y “Jefe” para facilitar filtros y auditorías.
  - El buscador contempla nombre/email tanto de comerciales como de jefes.
- **Alta rápida de contactos:**
  - Botones “Crear comercial” y “Crear jefe” abren modales ligeros para registrar nuevos contactos sin salir del panel.
  - Tras guardar, se actualizan el catálogo y los contadores; los nuevos managers aparecen con métricas en cero hasta que se les asigne un enlace.
- **Requisitos de backend:** el endpoint `/api/admin/dashboard/discounts` debería incluir `salesManager` por elemento y, opcionalmente, un array `managers` para enriquecer la libreta de contactos que usa el front. Además, se esperan los nuevos endpoints `POST /api/admin/dashboard/commerce/sales-managers` y `POST /api/admin/dashboard/commerce/commercials` para persistir los formularios de alta.

## Próximos pasos sugeridos

1. Confirmar con backend que las respuestas/mutaciones devuelvan los campos nuevos (`salesManager`, `managers`, payload Revolut).
2. Añadir regresiones E2E que cubran:
   - Alternar sidebar y persistencia.
   - Flujo de sincronización Revolut (mock).
   - Creación/edición de enlace comercial con jefe.
3. Comunicar a soporte interno la ubicación del panel Revolut para la operativa diaria.
