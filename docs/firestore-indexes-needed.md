# Índices Necesarios en Firestore

## Problema
El backend no puede consultar pagos porque Firestore requiere índices compuestos para queries con múltiples filtros.

## Índices Requeridos para Facturación

### 1. Índice para payments por status + updatedAt
```
Colección: payments
Campos:
  - status (Ascending)
  - updatedAt (Ascending)
```

**Link de creación rápida:**
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgl1cGRhdGVkQXQQARoMCghfX25hbWVfXxAB

### 2. Índice para payments por status + createdAt
```
Colección: payments
Campos:
  - status (Ascending)
  - createdAt (Ascending)
```

**Link de creación rápida:**
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQARoMCghfX25hbWVfXhAB

## Cómo Crearlos

### Método 1: Links Directos (Rápido)
1. Haz clic en los links de arriba
2. Confirma la creación
3. Espera 2-5 minutos a que se construyan

### Método 2: Firebase Console Manual
1. Abre https://console.firebase.google.com/project/lovenda-98c77/firestore/indexes
2. Click en "Create Index"
3. Configura:
   - Collection ID: `payments`
   - Fields to index:
     - Campo 1: `status` → Ascending
     - Campo 2: `updatedAt` → Ascending (o `createdAt`)
   - Query scope: Collection
4. Click "Create"
5. Repite para el segundo índice

### Método 3: Firebase CLI (Automático)
```bash
firebase deploy --only firestore:indexes
```

## Verificar que Funcionan

Una vez creados, ejecuta:
```powershell
curl http://localhost:4004/api/admin/dashboard/overview
```

Deberías ver `revenue30d` con un valor numérico (no 0 si hay pagos).

## Otros Índices del Proyecto

Revisa también estos errores en los logs:
- `emailAutomationQueue` → status + scheduledAt
- `photos` (collectionGroup) → status + createdAt
- `albums` (collectionGroup) → slug + uploadWindow.cleanupStatus + uploadWindow.cleanupAt
- `tasks` (collectionGroup) → createdAt (para tareas de usuarios)

Todos estos índices pueden crearse desde los links en los errores del log.
