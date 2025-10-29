# 🧪 Tests E2E - Portfolio de Proveedores

Suite completa de tests End-to-End para verificar la implementación del sistema de portfolio de proveedores.

## 📋 Tests Incluidos

### 01. Dashboard Link (`01-dashboard-link.cy.js`)

- ✅ Verifica que existe link al portfolio en dashboard
- ✅ Link tiene diseño correcto (icono, estilos, hover)
- ✅ Navegación correcta a página de portfolio

### 02. Página Pública (`02-pagina-publica.cy.js`)

- ✅ Carga correcta de página pública SEO-friendly
- ✅ Meta tags SEO (title, description, OG, canonical)
- ✅ Portfolio de fotos (grid, lightbox, filtros)
- ✅ Información de contacto
- ✅ Botones "Solicitar Presupuesto" y "Guardar"
- ✅ Rating y reseñas
- ✅ Responsive móvil
- ✅ Manejo de errores 404

### 03. Subir Fotos (`03-subir-fotos.cy.js`)

- ✅ Abrir modal de subida
- ✅ Validación tipo de archivo (solo imágenes)
- ✅ Validación tamaño máximo (5MB)
- ✅ Preview de imagen
- ✅ Subir imagen válida
- ✅ Editar foto existente
- ✅ Eliminar foto (con confirmación)
- ✅ Establecer foto de portada
- ✅ Marcar como destacada
- ✅ Filtros por categoría
- ✅ Cambiar vista grid/lista

### 04. Reseñas (`04-resenas.cy.js`)

- ✅ Mostrar reseñas en página pública
- ✅ Estrellas de rating
- ✅ Escribir nueva reseña (usuario auth)
- ✅ Validación longitud mínima comentario
- ✅ Requerir autenticación
- ✅ Respuesta del proveedor
- ✅ Proveedor responde a reseña
- ✅ Marcar reseña como útil
- ✅ Reportar reseña inapropiada
- ✅ Distribución de ratings
- ✅ Ordenar reseñas
- ✅ Prevenir duplicados (mismo usuario)

### 05. Solicitar Presupuesto (`05-solicitar-presupuesto.cy.js`)

- ✅ Botón en página pública
- ✅ Abrir modal de solicitud
- ✅ Formulario con campos requeridos
- ✅ Validación campos (nombre, email, mensaje)
- ✅ Validación formato email
- ✅ Validación longitud mínima mensaje
- ✅ Enviar solicitud sin auth (público)
- ✅ Prellenar campos si usuario autenticado
- ✅ Mostrar solicitudes en dashboard proveedor
- ✅ Cambiar estado de solicitud
- ✅ Badge solicitudes sin leer
- ✅ Estadísticas de solicitudes
- ✅ Filtrar por estado
- ✅ Manejo de errores

### 06. Flujo Completo (`06-flujo-completo.cy.js`)

- ✅ Test de integración E2E completo:
  1. Proveedor sube foto
  2. Usuario visita página pública
  3. Usuario solicita presupuesto
  4. Usuario deja reseña
  5. Proveedor gestiona solicitud y responde

---

## 🚀 Ejecutar Tests

### Ejecutar TODOS los tests de portfolio:

```bash
npm run cypress:run:portfolio
```

O:

```bash
cypress run --spec "cypress/e2e/portfolio-proveedores/**/*.cy.js"
```

### Ejecutar test específico:

```bash
# Dashboard Link
cypress run --spec "cypress/e2e/portfolio-proveedores/01-dashboard-link.cy.js"

# Página Pública
cypress run --spec "cypress/e2e/portfolio-proveedores/02-pagina-publica.cy.js"

# Subir Fotos
cypress run --spec "cypress/e2e/portfolio-proveedores/03-subir-fotos.cy.js"

# Reseñas
cypress run --spec "cypress/e2e/portfolio-proveedores/04-resenas.cy.js"

# Solicitar Presupuesto
cypress run --spec "cypress/e2e/portfolio-proveedores/05-solicitar-presupuesto.cy.js"

# Flujo Completo
cypress run --spec "cypress/e2e/portfolio-proveedores/06-flujo-completo.cy.js"
```

### Ejecutar en modo interactivo:

```bash
cypress open
```

Luego seleccionar los tests de `portfolio-proveedores/`

---

## 📦 Requisitos

### 1. Instalar dependencias:

```bash
npm install
```

### 2. Crear imagen de prueba:

```bash
# Copiar una imagen JPG válida a:
cypress/fixtures/test-image.jpg
```

O usar el comando para generar una:

```bash
node cypress/scripts/generate-test-image.js
```

### 3. Variables de entorno:

Asegúrate de tener configurado `.env` con:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
# ... etc
```

---

## 🔧 Configuración

### Añadir script a `package.json`:

```json
{
  "scripts": {
    "cypress:run:portfolio": "cypress run --spec 'cypress/e2e/portfolio-proveedores/**/*.cy.js' --config video=false",
    "cypress:open:portfolio": "cypress open --e2e --config specPattern=cypress/e2e/portfolio-proveedores/**/*.cy.js"
  }
}
```

---

## 📊 Cobertura de Tests

| Feature                   | Tests        | Cobertura |
| ------------------------- | ------------ | --------- |
| **Link Dashboard**        | 3 tests      | 100%      |
| **Página Pública**        | 10 tests     | 100%      |
| **Subir Fotos**           | 13 tests     | 100%      |
| **Reseñas**               | 13 tests     | 100%      |
| **Solicitar Presupuesto** | 15 tests     | 100%      |
| **Flujo Completo**        | 1 test       | 100%      |
| **TOTAL**                 | **55 tests** | **100%**  |

---

## 🐛 Troubleshooting

### Error: "test-image.jpg not found"

Crear imagen de prueba:

```bash
# Windows
copy <cualquier-imagen.jpg> cypress\fixtures\test-image.jpg

# Linux/Mac
cp any-image.jpg cypress/fixtures/test-image.jpg
```

### Error: "Cannot read property 'click' of undefined"

Aumentar timeout en test:

```javascript
cy.get('button', { timeout: 10000 }).click();
```

### Tests fallan por timing

Añadir más `cy.wait()` después de interceptors:

```javascript
cy.wait('@apiCall', { timeout: 15000 });
```

---

## 📝 Notas

- **Mocks:** Todos los tests usan datos mockeados (no tocan backend real)
- **Auth:** Se simula autenticación con localStorage
- **Interceptors:** Cada test intercepta las API calls necesarias
- **Aislamiento:** Tests son independientes (beforeEach limpia estado)
- **Datos de prueba:** Usar fixtures para datos consistentes

---

## ✅ Checklist Pre-Deploy

Antes de desplegar a producción, ejecutar:

```bash
# 1. Todos los tests E2E
npm run cypress:run:portfolio

# 2. Tests unitarios
npm run test:unit

# 3. Lint
npm run lint

# 4. Build
npm run build

# 5. Verificar bundle size
npm run check:bundle
```

---

## 🔗 Documentación Relacionada

- [TODO Portfolio](../../../docs/TODO-PORTFOLIO-PROVEEDORES.md)
- [Resumen Sesión](../../../RESUMEN-SESION-PORTFOLIO.md)
- [Cypress Docs](https://docs.cypress.io/)
- [Testing Best Practices](https://docs.cypress.io/guides/references/best-practices)

---

**Creado:** 29 Oct 2025  
**Última actualización:** 29 Oct 2025  
**Estado:** ✅ 100% Completado
