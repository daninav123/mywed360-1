import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos
const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const servicesPath = path.join(__dirname, '../apps/main-app/src/data/services.json');

const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
const services = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));

console.log('🚀 Generando páginas long-tail keywords...\n');

// Variantes long-tail por servicio
const serviceVariants = {
  'gestion-invitados-boda': [
    { suffix: 'pequena', name: 'Gestión de Invitados para Boda Pequeña', sizeContext: 'boda íntima de 30-50 invitados' },
    { suffix: 'grande', name: 'Gestión de Invitados para Boda Grande', sizeContext: 'boda grande de 150+ invitados' },
    { suffix: 'internacional', name: 'Gestión de Invitados Boda Internacional', sizeContext: 'boda con invitados de múltiples países' },
    { suffix: 'destino', name: 'Gestión de Invitados Boda Destino', sizeContext: 'boda destino con invitados viajeros' },
    { suffix: 'virtual', name: 'Gestión de Invitados Boda Híbrida/Virtual', sizeContext: 'boda con asistencia presencial y virtual' }
  ],
  'invitaciones-digitales': [
    { suffix: 'elegantes', name: 'Invitaciones Digitales Elegantes', styleContext: 'diseño sofisticado y clásico' },
    { suffix: 'modernas', name: 'Invitaciones Digitales Modernas', styleContext: 'estética contemporánea y minimalista' },
    { suffix: 'animadas', name: 'Invitaciones Digitales Animadas', styleContext: 'con video y elementos interactivos' },
    { suffix: 'rusticas', name: 'Invitaciones Digitales Rústicas', styleContext: 'estilo campestre y natural' },
    { suffix: 'personalizadas', name: 'Invitaciones Digitales 100% Personalizadas', styleContext: 'diseño único desde cero' }
  ],
  'presupuesto-boda': [
    { suffix: 'economico', name: 'Presupuesto para Boda Económica', budgetContext: 'presupuesto ajustado, máxima optimización' },
    { suffix: 'lujo', name: 'Presupuesto para Boda de Lujo', budgetContext: 'boda premium, sin límites' },
    { suffix: 'medio', name: 'Presupuesto para Boda Estándar', budgetContext: 'presupuesto medio equilibrado' },
    { suffix: 'destino', name: 'Presupuesto para Boda Destino', budgetContext: 'incluye viajes y alojamiento' },
    { suffix: 'detallado', name: 'Calculadora de Presupuesto Detallado', budgetContext: 'desglose completo por categorías' }
  ],
  'seating-plan': [
    { suffix: 'grande', name: 'Seating Plan para Boda Grande', tablasContext: '15+ mesas, 150+ invitados' },
    { suffix: 'circular', name: 'Seating Plan Mesas Circulares', tablasContext: 'disposición en mesas redondas' },
    { suffix: 'imperial', name: 'Seating Plan Mesa Imperial', tablasContext: 'mesa única tipo banquete' },
    { suffix: 'mixto', name: 'Seating Plan Distribución Mixta', tablasContext: 'combinación de tipos de mesa' },
    { suffix: 'interactivo', name: 'Seating Plan Digital Interactivo', tablasContext: 'con vista 3D y drag & drop' }
  ],
  'lista-regalos': [
    { suffix: 'experiencias', name: 'Lista de Regalos en Experiencias', giftContext: 'viajes, cenas, actividades' },
    { suffix: 'efectivo', name: 'Lista de Regalos en Efectivo', giftContext: 'contribución monetaria flexible' },
    { suffix: 'sostenible', name: 'Lista de Regalos Sostenible', giftContext: 'productos eco-friendly' },
    { suffix: 'mixta', name: 'Lista de Regalos Mixta', giftContext: 'productos + efectivo + experiencias' },
    { suffix: 'online', name: 'Lista de Regalos 100% Online', giftContext: 'gestión digital completa' }
  ],
  'pagina-boda': [
    { suffix: 'personalizada', name: 'Página Web de Boda Personalizada', webContext: 'diseño único a medida' },
    { suffix: 'minimalista', name: 'Página Web de Boda Minimalista', webContext: 'diseño limpio y elegante' },
    { suffix: 'multimedia', name: 'Página Web de Boda con Galería', webContext: 'fotos, videos, timeline' },
    { suffix: 'bilingue', name: 'Página Web de Boda Bilingüe', webContext: 'múltiples idiomas' },
    { suffix: 'rsvp', name: 'Página Web con RSVP Avanzado', webContext: 'confirmación y menús online' }
  ],
  'gestion-tareas': [
    { suffix: 'automatizada', name: 'Gestión de Tareas con Automatización', taskContext: 'recordatorios automáticos' },
    { suffix: 'colaborativa', name: 'Gestión de Tareas Colaborativa', taskContext: 'trabajo en equipo con wedding planner' },
    { suffix: 'cronograma', name: 'Cronograma Completo de Boda', taskContext: '12 meses de planificación' },
    { suffix: 'checklist', name: 'Checklist Interactivo de Boda', taskContext: 'paso a paso guiado' },
    { suffix: 'urgente', name: 'Planificación Boda en Poco Tiempo', taskContext: 'organizar en 3-6 meses' }
  ]
};

// Función para generar contenido long-tail
function generateLongTailContent(cityData, serviceData, variant) {
  const contextKey = Object.keys(variant).find(k => k.endsWith('Context'));
  const contextValue = variant[contextKey];
  
  return {
    guide: `
# ${variant.name} en ${cityData.name}

Planificar una ${contextValue} en ${cityData.name} requiere atención especial a detalles específicos que hacen única esta modalidad.

## Particularidades para ${variant.name}

En el contexto de ${contextValue}, las necesidades son distintas a una boda convencional. ${cityData.name} ofrece recursos especializados para este tipo de celebración.

### Consideraciones Específicas

**Para ${contextValue}:**
- Adaptación de servicios a esta modalidad particular
- Proveedores especializados en ${cityData.name}
- Ajustes de presupuesto específicos
- Timeline personalizado
- Requisitos técnicos o logísticos únicos

### Ventajas en ${cityData.name}

${cityData.name} es ideal para ${variant.name.toLowerCase()} porque:
- Infraestructura adecuada disponible
- Proveedores con experiencia en este tipo
- Múltiples opciones de venues adaptados
- Servicios complementarios accesibles

## Presupuesto para ${variant.name}

Los costos varían según las particularidades de ${contextValue}:
- Presupuesto base adaptado
- Servicios adicionales específicos requeridos
- Optimizaciones posibles
- ROI en inversión específica

## Proveedores Especializados en ${cityData.name}

No todos los proveedores están familiarizados con ${contextValue}. En ${cityData.name}, busca profesionales con experiencia comprobada en este tipo de eventos.

### Qué Buscar

- Portfolio con casos similares
- Comprensión de necesidades específicas
- Flexibilidad para adaptarse
- Precios ajustados a esta modalidad
- Referencias verificables

## Planificación Step-by-Step

### 12 Meses Antes
Investigación inicial y decisiones fundamentales específicas para ${contextValue}.

### 9 Meses Antes
Contratación de proveedores especializados en ${cityData.name}.

### 6 Meses Antes
Detalles técnicos y logística particular de ${variant.name.toLowerCase()}.

### 3 Meses Antes
Confirmaciones finales y ajustes específicos.

### 1 Mes Antes
Ensayos y verificaciones finales adaptadas.

## Casos de Éxito en ${cityData.name}

Múltiples parejas han celebrado exitosamente ${variant.name.toLowerCase()} en ${cityData.name}, aprovechando las ventajas únicas que ofrece la ciudad para esta modalidad.

## Errores Comunes a Evitar

1. No considerar particularidades de ${contextValue}
2. Elegir proveedores sin experiencia en este tipo
3. Subestimar requisitos específicos
4. Presupuesto genérico sin adaptación
5. No aprovechar ventajas de ${cityData.name}

## Recursos y Herramientas

Planivia ofrece herramientas específicas para ${variant.name.toLowerCase()}:
- Plantillas adaptadas
- Checklist personalizado
- Calculadora de presupuesto ajustada
- Conexión con proveedores especializados en ${cityData.name}

## FAQ Específicas

**¿Es ${cityData.name} buen lugar para ${variant.name.toLowerCase()}?**
Absolutamente. La ciudad cuenta con todos los recursos necesarios.

**¿Cuánto cuesta en promedio?**
Varía, pero espera ajustes específicos al presupuesto estándar.

**¿Qué hace única a esta modalidad?**
Las particularidades de ${contextValue} requieren enfoque especializado.

## Conclusión

${variant.name} en ${cityData.name} es completamente viable con la planificación adecuada. Aprovecha las ventajas de la ciudad y conecta con proveedores que entienden las necesidades específicas de ${contextValue}.

**¿Listo para empezar?** Planivia te guía paso a paso en la organización de tu ${variant.name.toLowerCase()} perfecta en ${cityData.name}.
`,
    faqs: [
      {
        question: `¿${cityData.name} es buena opción para ${variant.name.toLowerCase()}?`,
        answer: `Sí, ${cityData.name} cuenta con excelente infraestructura y proveedores especializados en ${contextValue}.`
      },
      {
        question: `¿Cuánto cuesta ${variant.name.toLowerCase()} en ${cityData.name}?`,
        answer: `Los costos varían según escala y servicios, pero ${cityData.name} ofrece opciones para todos los presupuestos adaptados a ${contextValue}.`
      },
      {
        question: `¿Necesito wedding planner para ${variant.name.toLowerCase()}?`,
        answer: `Es altamente recomendable, especialmente dado las particularidades de ${contextValue}. Un profesional local en ${cityData.name} conoce los mejores proveedores especializados.`
      }
    ],
    tips: [
      `Investiga proveedores en ${cityData.name} con experiencia específica en ${contextValue}`,
      `Adapta tu presupuesto considerando las particularidades de ${variant.name.toLowerCase()}`,
      `Aprovecha las ventajas únicas que ofrece ${cityData.name} para este tipo de boda`,
      `Planifica con tiempo extra para aspectos específicos de ${contextValue}`,
      `Consulta casos de éxito previos en ${cityData.name}`
    ]
  };
}

// Generar páginas long-tail
let generatedCount = 0;

for (const [citySlug, cityData] of Object.entries(cities)) {
  for (const [serviceSlug, variants] of Object.entries(serviceVariants)) {
    // Solo generar si el servicio existe en la ciudad
    if (!cityData.services || !cityData.services[serviceSlug]) {
      continue;
    }
    
    // Crear variante para cada long-tail
    for (const variant of variants) {
      const variantSlug = `${serviceSlug}-${variant.suffix}`;
      
      // Evitar sobrescribir servicios existentes
      if (cityData.services[variantSlug]) {
        continue;
      }
      
      // Generar contenido
      const content = generateLongTailContent(cityData, cityData.services[serviceSlug], variant);
      
      // Añadir nueva variante al servicio de la ciudad
      cityData.services[variantSlug] = {
        name: variant.name,
        slug: variantSlug,
        description: `${variant.name} en ${cityData.name}. ${content.guide.substring(0, 150)}...`,
        ...content,
        longTail: true, // Marcar como página long-tail
        parentService: serviceSlug
      };
      
      generatedCount++;
      
      if (generatedCount % 500 === 0) {
        console.log(`✓ Generadas ${generatedCount} páginas long-tail...`);
      }
    }
  }
}

// Guardar archivo actualizado
fs.writeFileSync(citiesPath, JSON.stringify(cities, null, 2), 'utf-8');

console.log('\n✅ Generación de páginas long-tail completada!');
console.log(`📊 Estadísticas:`);
console.log(`   - Páginas long-tail generadas: ${generatedCount}`);
console.log(`   - Servicios base: ${Object.keys(serviceVariants).length}`);
console.log(`   - Variantes por servicio: ~5`);
console.log(`   - Ciudades: ${Object.keys(cities).length}`);
console.log(`\n📄 Archivo actualizado: ${citiesPath}`);
console.log(`\n🎯 Total páginas SEO: ${generatedCount + (Object.keys(cities).length * 7)} (base + long-tail)`);
