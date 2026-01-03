import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos existentes
const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const blogOutputPath = path.join(__dirname, '../apps/main-app/src/data/blog-posts.json');

const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
const existingPosts = JSON.parse(fs.readFileSync(blogOutputPath, 'utf-8'));

console.log('🚀 Generando artículos de blog adicionales...\n');

// Nuevas plantillas de artículos
const newTemplates = [
  {
    id: 'propuesta-matrimonio',
    title: (city) => `10 Lugares Románticos para Pedir Matrimonio en ${city}`,
    category: 'Inspiración',
    getContent: (city, country) => `
# 10 Lugares Románticos para Pedir Matrimonio en ${city}

La pedida de mano es uno de los momentos más especiales en la vida de una pareja. Si estás planeando dar el gran paso en ${city}, has elegido un destino perfecto que combina romanticismo, belleza y lugares emblemáticos inolvidables.

## Los Mejores Lugares para la Gran Pregunta

### 1. Miradores con Vista Panorámica
${city} cuenta con varios miradores que ofrecen vistas espectaculares, especialmente al atardecer. La puesta de sol crea el ambiente perfecto para ese momento mágico.

### 2. Parques y Jardines Históricos
Los espacios verdes del centro histórico ofrecen rincones íntimos rodeados de naturaleza. Ideal para una propuesta discreta pero memorable.

### 3. Restaurantes con Encanto
Varios establecimientos en ${city} ofrecen cenas románticas con vistas privilegiadas. Coordina con el restaurante para añadir detalles especiales.

### 4. Monumentos Emblemáticos
Pide matrimonio frente a los lugares icónicos de ${city}. La fotografía será inolvidable.

### 5. Paseos Junto al Agua
Si ${city} tiene río, lago o mar cercano, aprovecha estos espacios naturales para crear un momento único.

### 6. Hoteles Boutique
Las terrazas privadas de hoteles exclusivos ofrecen privacidad total y servicios personalizados.

### 7. Lugares con Significado Personal
¿Dónde se conocieron? ¿Dónde fue su primera cita? Los lugares con historia personal añaden emotividad.

### 8. Escapadas a las Afueras
Los alrededores de ${city} ofrecen paisajes naturales perfectos para una propuesta alejada del bullicio.

### 9. Eventos Culturales
Conciertos, exposiciones o eventos especiales pueden ser el telón de fondo perfecto.

### 10. Lugares Únicos y Originales
Considera opciones creativas como paseos en globo aerostático, experiencias gastronómicas únicas o actividades de aventura.

## Consejos para una Propuesta Perfecta

**Planificación:** Reserva con anticipación, especialmente en lugares populares. Verifica horarios y condiciones climáticas.

**Fotografía:** Contrata un fotógrafo discreto para capturar el momento sin que tu pareja se percate.

**Personalización:** Añade detalles que reflejen su relación: su canción, flores favoritas, o referencias a momentos especiales.

**Timing:** Elige un momento del día con buena iluminación natural. El atardecer es clásico por algo.

## ¿Y Después de Decir Sí?

Una vez que tu pareja acepte, ${city} ofrece múltiples opciones para celebrar: desde cenas románticas hasta escapadas de fin de semana. Y cuando llegue el momento de planificar la boda, Planivia te ayudará a organizar cada detalle de tu gran día en ${city}.

**Recuerda:** Lo más importante no es el lugar, sino el amor que comparten y el compromiso que están por iniciar juntos.
`,
    tags: (city) => ['pedida de mano', city, 'romance', 'propuesta matrimonio', 'lugares románticos']
  },
  
  {
    id: 'tendencias-2026',
    title: (city) => `Tendencias de Bodas 2026 en ${city}: Lo Último en Celebraciones Nupciales`,
    category: 'Tendencias',
    getContent: (city, country) => `
# Tendencias de Bodas 2026 en ${city}

El mundo de las bodas evoluciona constantemente, y ${city} no es la excepción. Estas son las tendencias que dominarán las celebraciones nupciales en 2026.

## 1. Bodas Sostenibles y Eco-Friendly

La conciencia ambiental llega al altar. Parejas en ${city} optan por:
- Decoración con flores locales y de temporada
- Menús con ingredientes orgánicos y de proximidad
- Invitaciones digitales o papel reciclado
- Regalos sostenibles para invitados
- Reducción de plásticos de un solo uso

## 2. Micro-Bodas Íntimas

Menos invitados, más experiencia. Las micro-bodas (30-50 personas) permiten:
- Mayor presupuesto por invitado
- Venues exclusivos e íntimos
- Atención personalizada a cada asistente
- Experiencias más significativas
- Menor estrés organizativo

## 3. Celebraciones de Varios Días

Las parejas extienden la celebración:
- Welcome dinner el día anterior
- Ceremonia y recepción el día principal
- Brunch de despedida al día siguiente
- Actividades grupales pre-boda
- Más tiempo de calidad con seres queridos

## 4. Tecnología en la Boda

La digitalización llega al gran día:
- Streaming en vivo para invitados remotos
- Apps personalizadas de la boda
- Filtros de realidad aumentada
- Drones para fotografía aérea
- Photobooth digitales interactivos

## 5. Paletas de Color Atrevidas

Adiós a los colores pastel tradicionales:
- Terracota y mostaza
- Verde esmeralda y azul klein
- Combinaciones inesperadas
- Metalicos: cobre y latón
- Monocromáticas sofisticadas

## 6. Gastronomía Experiencial

La comida como protagonista:
- Estaciones de comida interactivas
- Chefs en vivo
- Maridajes de vinos o cervezas artesanales
- Menús temáticos personalizados
- Opciones veganas y sin gluten de calidad

## 7. Ceremonia y Recepción en Un Solo Espacio

Simplificación logística:
- Espacios versátiles que se transforman
- Menos traslados = más tiempo celebrando
- Reducción de costos de transporte
- Mayor comodidad para invitados

## 8. Toques Personalizados Únicos

Cada boda cuenta una historia:
- Señalética personalizada
- Detalles DIY significativos
- Incorporación de tradiciones familiares
- Elementos que reflejan hobbies de la pareja
- Historia de amor contada en decoración

## 9. Hora Dorada para Ceremonias

Aprovechando la luz natural:
- Ceremonias al atardecer
- "Golden hour" para fotografías perfectas
- Ambiente mágico y romántico
- Temperatura más agradable

## 10. Bodas Multiculturales

Fusión de tradiciones:
- Ceremonias que combinan dos culturas
- Menús fusion
- Música internacional
- Vestimenta híbrida
- Rituales de ambas familias

## En ${city} Específicamente

Las parejas en ${city} están adoptando estas tendencias con toque local, incorporando proveedores regionales y venues únicos de la ciudad. La combinación de modernidad y tradición define las bodas 2026 aquí.

## ¿Listo para Planificar tu Boda en ${city}?

En Planivia te ayudamos a incorporar estas tendencias en tu celebración, conectándote con los mejores proveedores de ${city} que pueden hacer realidad tu visión.
`,
    tags: (city) => ['tendencias 2026', city, 'bodas modernas', 'inspiración boda', 'wedding trends']
  },
  
  {
    id: 'fotografos-boda',
    title: (city) => `Cómo Elegir el Mejor Fotógrafo de Bodas en ${city}`,
    category: 'Proveedores',
    getContent: (city, country) => `
# Cómo Elegir el Mejor Fotógrafo de Bodas en ${city}

Las fotografías son el recuerdo tangible más importante de tu boda. Elegir al fotógrafo adecuado en ${city} requiere investigación y criterio.

## Factores Clave a Considerar

### 1. Estilo Fotográfico

**Documental/Fotoperiodismo:** Captura momentos naturales sin poses.
**Editorial/Fine Art:** Estética de revista, cuidadosamente compuesta.
**Tradicional/Clásico:** Poses familiares organizadas y retratos formales.
**Oscuro y Dramático:** Tonos moody, juego de luces y sombras.

Revisa portfolios y determina qué estilo resuena contigo.

### 2. Experiencia en ${city}

Un fotógrafo local conoce:
- Los mejores ángulos de venues populares
- Horarios de luz óptima en diferentes locaciones
- Lugares emblemáticos para sesiones
- Cómo moverse en la ciudad eficientemente

### 3. Química Personal

Pasarás todo el día con tu fotógrafo. Debe ser alguien con quien te sientas cómodo, que entienda tu visión y te haga sentir relajado frente a la cámara.

### 4. Paquetes y Precios en ${city}

Los precios promedio varían:
- **Básico:** 4-6 horas, 1 fotógrafo, entrega digital
- **Estándar:** 8-10 horas, 1-2 fotógrafos, álbum básico
- **Premium:** Cobertura completa, 2 fotógrafos, álbum de lujo, sesión engagement

### 5. Entregables Incluidos

¿Qué obtienes exactamente?
- Número de fotografías editadas
- Formato de entrega (digital, USB, galería online)
- Álbum físico incluido o adicional
- Derechos de impresión
- Time frame de entrega

## Preguntas Clave para el Fotógrafo

1. ¿Cuántas bodas has fotografiado?
2. ¿Has trabajado en mi venue antes?
3. ¿Traes equipo de respaldo?
4. ¿Cómo es tu proceso de edición?
5. ¿Cuánto tiempo tardas en entregar las fotos?
6. ¿Qué incluye tu contrato?
7. ¿Trabajas solo o con asistente?
8. ¿Puedo ver una boda completa editada, no solo highlights?

## Red Flags a Evitar

- No muestra bodas completas, solo las mejores fotos
- Paquetes poco claros o sin contrato formal
- Sin seguro profesional
- Promesas de entrega inmediata
- Precios excesivamente bajos (calidad cuestionable)
- Mala comunicación durante el proceso previo

## Tendencias Fotográficas en ${city}

Las parejas en ${city} actualmente prefieren:
- Edición luminosa y natural sobre filtros pesados
- Mix de fotos posadas y candid
- Sesiones en locaciones icónicas de ${city}
- Incorporación de drone para tomas aéreas
- Mini-sesiones durante la golden hour

## Cuándo Reservar

Los fotógrafos populares en ${city} se reservan con 12-18 meses de anticipación. Si tu boda es en temporada alta (mayo-octubre), contacta cuanto antes.

## El Álbum de Boda

Considera invertir en un álbum de calidad museística:
- Encuadernación profesional
- Papel de alta gramaje
- Diseño cuidado que cuenta una historia
- Durará generaciones como reliquia familiar

## Conclusión

Tu fotógrafo capturará los momentos que revivirás durante décadas. No escatimes en esta inversión crucial. En Planivia conectamos a parejas en ${city} con fotógrafos excepcionales que se alinean con su visión y presupuesto.
`,
    tags: (city) => ['fotógrafos boda', city, 'fotografía nupcial', 'proveedores boda', 'elegir fotógrafo']
  },
  
  {
    id: 'checklist-legal',
    title: (city) => `Checklist Legal Completo para Casarse en ${city}`,
    category: 'Legal',
    getContent: (city, country) => `
# Checklist Legal Completo para Casarse en ${city}

Organizar una boda implica más que elegir flores y menú. Los trámites legales son fundamentales y varían según la ubicación. Esta guía cubre todo lo necesario para casarte legalmente en ${city}.

## Timeline Recomendado

### 6-12 Meses Antes
- Investigar requisitos específicos
- Iniciar recopilación de documentos
- Decidir tipo de ceremonia (civil, religiosa, simbólica)

### 3-6 Meses Antes
- Solicitar cita en Registro Civil
- Obtener certificados necesarios
- Coordinar con testigos

### 1-3 Meses Antes
- Entregar documentación completa
- Confirmar fecha y hora de ceremonia
- Realizar trámites finales

## Documentos Necesarios

### Para Ciudadanos Nacionales

**Identificación:**
- DNI/Pasaporte vigente (original y 2 copias)
- CURP o equivalente

**Certificados:**
- Acta de nacimiento reciente (menos de 6 meses)
- Certificado de soltería o divorcio (si aplica)
- Certificado de viudez (si aplica)
- Comprobante de domicilio actual

**Médicos:**
- Certificado médico prenupcial
- Análisis de sangre (según jurisdicción)

**Testigos:**
- 2-4 testigos mayores de edad
- Identificación oficial de cada testigo
- No requieren ser familiares

### Para Extranjeros Casándose en ${city}

**Documentación Adicional:**
- Pasaporte vigente
- Visa o permiso de estancia legal
- Acta de nacimiento apostillada
- Certificado de capacidad matrimonial del país de origen
- Traducción oficial por perito autorizado
- Comprobante de domicilio en ${city} (mínimo 30 días)

**Apostilla de Documentos:**
Todos los documentos extranjeros deben llevar apostilla de La Haya o legalización consular. Verifica qué aplica según país de origen.

## Tipos de Ceremonia

### Matrimonio Civil

**Dónde:** Registro Civil de ${city}
**Costo:** Variable según municipio
**Duración trámite:** 8-15 días hábiles desde solicitud
**Ceremonia:** En oficinas del Registro o lugar autorizado

**Opciones:**
- Ceremonia básica en Registro (económica)
- Juez a domicilio (venue de tu elección, costo adicional)

### Matrimonio Religioso

**Requisitos Adicionales:**
- Certificados de bautismo (católica)
- Certificado de confirmación (católica)
- Curso prematrimonial (2-3 meses)
- Entrevista con sacerdote/pastor/rabino

**Nota Legal:** El matrimonio religioso debe registrarse civilmente para tener validez legal. Muchas instituciones facilitan este trámite.

### Ceremonia Simbólica

Si tu boda legal fue en otro lugar o momento, puedes realizar una ceremonia simbólica en ${city} sin trámites. Ideal para bodas destino o renovaciones de votos.

## Costos Aproximados en ${city}

- **Ceremonia civil básica:** Consulta tarifa municipal
- **Juez a domicilio:** Varía según distancia
- **Actas certificadas:** Tarifa por copia
- **Legalización documentos:** Según notaría
- **Traducciones oficiales:** Por perito autorizado

## Cambio de Apellidos

Tras el matrimonio puedes:
- Mantener tu apellido
- Añadir apellido del cónyuge
- Usar apellido de casada/o

Solicita actas de matrimonio suficientes para trámites posteriores (bancos, identificaciones, etc.).

## Matrimonios Internacionales

Si uno o ambos son extranjeros:
- Verificar validez del matrimonio en país de origen
- Registro en embajada/consulado respectivo
- Requisitos para visas conyugales si aplica

## Uniones de Hecho / Parejas del Mismo Sexo

Verifica legislación actual en ${city} sobre:
- Matrimonio igualitario
- Uniones civiles
- Derechos y obligaciones

## Checklist Final

□ Todos los documentos originales y copias
□ Cita confirmada en Registro Civil
□ Testigos confirmados con identificaciones
□ Anillos (si se intercambian en ceremonia civil)
□ Pago de derechos realizado
□ Coordinar con fotógrafo (si permitido en Registro)
□ Planificar celebración post-registro

## Consejos Prácticos

1. **Anticipa Tiempos:** Los trámites burocráticos toman más de lo esperado.
2. **Conserva Copias:** De toda documentación entregada.
3. **Verifica Vigencias:** Certificados tienen períodos de validez limitados.
4. **Asesórate:** Si hay complejidad (extranjeros, divorcios previos), considera asesoría legal.

## Asesoría Legal Especializada

Para casos complejos, contacta:
- Notarías especializadas en derecho familiar
- Abogados matrimonialistas
- Servicios consulares de tu país

## Conclusión

Cumplir los requisitos legales es esencial para que tu matrimonio sea válido. Aunque parezca tedioso, una vez completado, podrás disfrutar tu boda en ${city} con total tranquilidad. 

En Planivia no solo te ayudamos con la organización de tu celebración, sino que te guiamos en los aspectos legales para que todo sea perfecto el día de tu boda en ${city}.
`,
    tags: (city) => ['trámites legales', city, 'requisitos matrimonio', 'documentos boda', 'checklist legal']
  }
];

// Generar artículos para cada ciudad
const newBlogPosts = [];
const cityList = Object.values(cities);

for (const template of newTemplates) {
  for (const cityData of cityList) {
    const slug = `${template.id}-${cityData.slug}`;
    
    // Evitar duplicados
    if (existingPosts.find(p => p.slug === slug)) {
      continue;
    }
    
    const post = {
      id: `${template.id}-${cityData.slug}`,
      slug: slug,
      title: template.title(cityData.name),
      excerpt: `Todo lo que necesitas saber sobre ${template.title(cityData.name).toLowerCase()}.`,
      content: template.getContent(cityData.name, cityData.country),
      category: template.category,
      tags: template.tags(cityData.name),
      author: 'Equipo Planivia',
      publishedAt: '2026-01-02T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
      readTime: '8 min',
      featured: false,
      city: cityData.name,
      country: cityData.countryName,
      metaTitle: `${template.title(cityData.name)} | Planivia`,
      metaDescription: `Guía completa: ${template.title(cityData.name)}. Consejos expertos, recomendaciones y todo lo que necesitas para tu boda perfecta.`,
      keywords: template.tags(cityData.name).join(', ')
    };
    
    newBlogPosts.push(post);
  }
}

// Combinar con posts existentes
const allPosts = [...existingPosts, ...newBlogPosts];

// Guardar
fs.writeFileSync(blogOutputPath, JSON.stringify(allPosts, null, 2), 'utf-8');

console.log('✅ Generación de artículos completada!');
console.log(`📊 Estadísticas:`);
console.log(`   - Artículos existentes: ${existingPosts.length}`);
console.log(`   - Artículos nuevos generados: ${newBlogPosts.length}`);
console.log(`   - Total de artículos: ${allPosts.length}`);
console.log(`\n📄 Archivo actualizado: ${blogOutputPath}`);
