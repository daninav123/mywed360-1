# Sistema de Modalidades de Servicio para Caterings

## Problema Resuelto

Los caterings pueden ofrecer diferentes modalidades de servicio:
1. **Solo espacio propio** - Finca/masía que solo trabaja en su ubicación
2. **Solo servicio externo** - Catering móvil sin espacio propio
3. **Ambas opciones** - Tienen espacio propio PERO también se desplazan

## Implementación

### 1. Estructura de Datos

Los proveedores de catering ahora pueden tener estos campos:

```javascript
{
  category: 'catering',
  serviceModalities: {
    ownVenue: true,    // ¿Tiene espacio propio?
    external: true     // ¿Ofrece servicio externo?
  },
  venueCapacity: 200,  // Solo si ownVenue = true
  venueType: 'finca'   // Solo si ownVenue = true
}
```

### 2. Campos Adicionales en Categoría

Archivo: `apps/main-app/src/shared/supplierCategories.js`

La categoría "catering" ahora incluye:
- **serviceModalities**: Checkbox group para seleccionar modalidades
- **venueCapacity**: Capacidad del espacio (solo si tiene espacio propio)
- **venueType**: Tipo de espacio (finca, masía, hotel, restaurante, salón, otro)

### 3. Componente Visual

Archivo: `apps/main-app/src/components/suppliers/ServiceModalityBadges.jsx`

Muestra badges visuales según las modalidades:

**Espacio propio + Externo:**
```
🏛️ Espacio propio    🚚 También servicio externo
```

**Solo espacio propio:**
```
🏛️ Solo en nuestro espacio
```

**Solo externo:**
```
🚚 Solo servicio externo
```

### 4. Integración en UI

El componente `ServiceModalityBadges` se integra automáticamente en:
- `SupplierCard.jsx` - Tarjetas de proveedores
- Aparece solo para proveedores de categoría "catering"
- Se muestra debajo de los badges de estado (registrado, internet, etc.)

## Uso para Proveedores

Cuando un proveedor de catering se registra o edita su perfil, puede:

1. Marcar "Tenemos espacio propio" si tiene finca/masía/local
2. Marcar "Ofrecemos servicio externo" si se desplazan
3. Puede marcar **ambas** si ofrece las dos modalidades
4. Si marca "espacio propio", debe indicar:
   - Capacidad (número de personas)
   - Tipo de espacio (finca, masía, hotel, etc.)

## Búsqueda y Filtrado

Los usuarios podrán filtrar caterings por:
- ✅ Con espacio propio
- ✅ Servicio externo
- ✅ Ambas opciones

Esto permite encontrar exactamente lo que necesitan:
- "Busco catering con finca" → Solo los que tienen `ownVenue: true`
- "Busco catering para mi finca" → Solo los que tienen `external: true`
- "Quiero ver todas las opciones" → Todos los caterings

## Ventajas

✅ **Claridad**: Los usuarios saben exactamente qué ofrece cada catering  
✅ **Flexibilidad**: Contempla todos los casos reales del mercado  
✅ **Filtrable**: Búsqueda específica según necesidades  
✅ **Escalable**: Fácil añadir más modalidades en el futuro  
✅ **Visual**: Badges claros y diferenciados por color  

## Próximos Pasos

1. ✅ Estructura de datos implementada
2. ✅ Componente de badges creado
3. ✅ Integración en SupplierCard
4. ⏳ Añadir filtros de búsqueda por modalidad
5. ⏳ Formulario de registro/edición para proveedores
6. ⏳ Migración de datos existentes (asignar modalidades a caterings actuales)

## Ejemplos de Uso

### Catering con ambas modalidades
```javascript
{
  name: "Catering La Masía",
  category: "catering",
  serviceModalities: {
    ownVenue: true,
    external: true
  },
  venueCapacity: 200,
  venueType: "finca"
}
```
→ Muestra: 🏛️ Espacio propio + 🚚 También servicio externo

### Solo espacio propio
```javascript
{
  name: "Finca El Olivar",
  category: "catering",
  serviceModalities: {
    ownVenue: true,
    external: false
  },
  venueCapacity: 150,
  venueType: "masia"
}
```
→ Muestra: 🏛️ Solo en nuestro espacio

### Solo externo
```javascript
{
  name: "Catering Gourmet Express",
  category: "catering",
  serviceModalities: {
    ownVenue: false,
    external: true
  }
}
```
→ Muestra: 🚚 Solo servicio externo
