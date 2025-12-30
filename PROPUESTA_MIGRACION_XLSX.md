# Propuesta de Migración: xlsx → exceljs

## 🎯 Objetivo
Reemplazar la dependencia vulnerable `xlsx` por `exceljs` (ya instalado y seguro).

## 📊 Archivos Afectados

### 1. `/apps/main-app/src/components/finance/TransactionImportModal.jsx`
**Línea 139**: `const mod = await import('xlsx');`
- Usado para importar transacciones desde archivos Excel
- Funcionalidad: Lectura de archivos .xlsx

### 2. `/apps/main-app/src/components/finance/ReportGenerator.jsx`
**Línea 170**: `const XLSX = await import('xlsx');`
- Usado para generar reportes de finanzas en Excel
- Funcionalidad: Escritura de archivos .xlsx con múltiples hojas

### 3. `/backend/services/attachmentText.js`
**Línea 37**: `const mod = await tryImport('xlsx');`
- Usado para extraer texto de adjuntos Excel
- Funcionalidad: Lectura de contenido para indexación

## ✅ Ventajas de exceljs

1. **Seguridad**: Sin vulnerabilidades conocidas
2. **Ya instalado**: Presente en node_modules
3. **Funcionalidad completa**: Soporta lectura/escritura
4. **Mejor API**: Más moderna y mantenible
5. **TypeScript**: Tipos incluidos

## 🔧 Cambios Requeridos

### TransactionImportModal.jsx
```javascript
// ANTES
const mod = await import('xlsx');
const XLSX = mod.default || mod;
const workbook = XLSX.read(data, { type: 'array' });

// DESPUÉS
const ExcelJS = await import('exceljs');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(data);
```

### ReportGenerator.jsx
```javascript
// ANTES
const XLSX = await import('xlsx');
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');

// DESPUÉS
const ExcelJS = await import('exceljs');
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Transacciones');
```

### attachmentText.js
```javascript
// ANTES
const mod = await tryImport('xlsx');
const XLSX = (mod.default || mod);
const wb = XLSX.read(buf);

// DESPUÉS
const ExcelJS = await tryImport('exceljs');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buf);
```

## 📋 Plan de Implementación

1. **Migrar TransactionImportModal.jsx** (lectura)
2. **Migrar ReportGenerator.jsx** (escritura)
3. **Migrar attachmentText.js** (lectura)
4. **Tests**: Validar importación/exportación
5. **Remover**: Eliminar dependencia xlsx del package.json
6. **Verificar**: npm audit para confirmar reducción de vulnerabilidades

## ⚠️ Consideraciones

- exceljs usa API basada en Promesas (async/await)
- Los archivos ya usan import dinámico, compatible
- Funcionalidad 100% compatible
- Sin breaking changes para usuarios finales

## 🚀 Impacto

- **Vulnerabilidades eliminadas**: 2 (Prototype Pollution + ReDoS)
- **Tiempo estimado**: 1-2 horas
- **Tests requeridos**: Importar/exportar Excel en módulo Finance
- **Riesgo**: Bajo (API similar, funcionalidad equivalente)
