# 🔄 SCRIPTS DE MIGRACIÓN FIRESTORE

Scripts para migrar colecciones problemáticas a la nueva estructura.

---

## 📋 MIGRACIONES DISPONIBLES

### **1. Migración de Emails** (`01-migrate-mails.mjs`)
**Origen:** `mails/` (45 documentos)  
**Destino:** `users/{uid}/emails/`  
**Prioridad:** 🔴 CRÍTICA

```bash
# Dry-run (simulación)
node scripts/migrations/01-migrate-mails.mjs

# Migración real
node scripts/migrations/01-migrate-mails.mjs --force
```

---

### **2. Migración de Eventos de Proveedores** (`02-migrate-supplier-events.mjs`)
**Origen:** `supplier_events/` (3 documentos)  
**Destino:** `suppliers/{id}/analytics/events/`  
**Prioridad:** 🟡 MEDIA

```bash
# Dry-run
node scripts/migrations/02-migrate-supplier-events.mjs

# Migración real
node scripts/migrations/02-migrate-supplier-events.mjs --force
```

---

### **3. Migración a System** (`03-migrate-to-system.mjs`)
**Origen:** 
- `payments/` (50 documentos) → `system/payments/`
- `discountLinks/` (1 documento) → `system/discounts/`

**Prioridad:** 🟢 BAJA

```bash
# Dry-run
node scripts/migrations/03-migrate-to-system.mjs

# Migración real
node scripts/migrations/03-migrate-to-system.mjs --force
```

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

### **Fase 1: Dry-Run de todas**
```bash
# Ver qué hará cada migración sin cambios reales
node scripts/migrations/01-migrate-mails.mjs
node scripts/migrations/02-migrate-supplier-events.mjs
node scripts/migrations/03-migrate-to-system.mjs
```

### **Fase 2: Ejecutar en orden de prioridad**
```bash
# 1. Emails (crítico)
node scripts/migrations/01-migrate-mails.mjs --force

# 2. Eventos de proveedores (medio)
node scripts/migrations/02-migrate-supplier-events.mjs --force

# 3. System (bajo)
node scripts/migrations/03-migrate-to-system.mjs --force
```

### **Fase 3: Verificar y limpiar**
Después de cada migración, verificar que los datos estén correctos antes de eliminar colecciones antiguas.

---

## ⚠️ IMPORTANTE

### **Antes de ejecutar:**
1. ✅ Backup completo de Firestore
2. ✅ Ejecutar dry-run primero
3. ✅ Verificar resultados del dry-run
4. ✅ Preparar rollback si es necesario

### **Durante la migración:**
- ✅ Monitorear logs
- ✅ No interrumpir el proceso
- ✅ Verificar conteos

### **Después de migrar:**
- ✅ Verificar datos en nueva ubicación
- ✅ Probar funcionalidad de la app
- ✅ Solo entonces eliminar colecciones antiguas

---

## 🔍 VERIFICACIÓN

### **Verificar migración de emails:**
```bash
# En Firebase Console o con script:
# Antes: mails/ (45 docs)
# Después: users/{uid}/emails/ (45 docs totales distribuidos)
```

### **Verificar eventos de proveedores:**
```bash
# Antes: supplier_events/ (3 docs)
# Después: suppliers/{id}/analytics/events/log/ (3 docs distribuidos)
```

### **Verificar system:**
```bash
# Antes: payments/ (50 docs), discountLinks/ (1 doc)
# Después: system/payments/ (50 docs), system/discounts/ (1 doc)
```

---

## 🗑️ LIMPIEZA (DESPUÉS DE VERIFICAR)

**NO EJECUTAR hasta verificar completamente**

```bash
# Eliminar colecciones antiguas (crear estos scripts si es necesario)
node scripts/migrations/cleanup-mails.mjs --force
node scripts/migrations/cleanup-supplier-events.mjs --force
node scripts/migrations/cleanup-system.mjs --force
```

---

## 🔙 ROLLBACK

Si algo sale mal:

### **1. Restaurar desde backup**
```bash
# Usar Firebase Console o gcloud CLI
gcloud firestore import gs://your-bucket/backup-folder
```

### **2. Eliminar datos migrados (si es necesario)**
```bash
# Crear scripts de rollback específicos si es necesario
```

---

## 📊 IMPACTO ESTIMADO

| Migración | Docs | Tiempo | Downtime | Riesgo |
|-----------|------|--------|----------|--------|
| Emails | 45 | 5 min | No | Medio |
| Supplier Events | 3 | 1 min | No | Bajo |
| System | 51 | 5 min | No | Bajo |
| **TOTAL** | **99** | **~15 min** | **No** | **Medio** |

---

## ❓ PREGUNTAS FRECUENTES

### **¿Qué pasa con los attachments de los emails?**
Los attachments están en subcollections (`mails/{id}/attachments/`). El script migra la referencia del email, pero verifica si las subcollections también necesitan migración.

### **¿Se puede hacer rollback?**
Sí, siempre que tengas un backup. Los scripts NO eliminan datos originales automáticamente.

### **¿Puedo ejecutar en producción?**
Sí, los scripts están diseñados para no tener downtime. Pero siempre haz backup primero.

### **¿Qué pasa si falla a medio camino?**
Los scripts usan batches de Firestore que son transaccionales. Si falla, reintenta desde donde quedó.

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa los logs del script
2. Verifica permisos de Firestore
3. Comprueba que serviceAccount.json es válido
4. Documenta el error para análisis

---

**Creado:** 2025-10-28  
**Última actualización:** 2025-10-28
