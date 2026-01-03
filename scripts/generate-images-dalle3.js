#!/usr/bin/env node

/**
 * Generación automática de imágenes con DALL-E 3
 * Genera todas las imágenes necesarias para reemplazar Unsplash
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

// Configuración
const QUALITY = 'standard'; // 'standard' o 'hd'
const STYLE = 'natural'; // 'natural' o 'vivid'

// Catálogo de imágenes a generar
const IMAGE_CATALOG = {
  services: [
    {
      name: 'fotografia.png',
      prompt: 'Professional wedding photographer with camera, elegant wedding venue background, soft natural lighting, romantic atmosphere, high quality, professional photography style, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'video.png',
      prompt: 'Wedding videographer with professional video camera, filming elegant wedding ceremony, cinematic lighting, modern wedding venue, professional videography style, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'catering.png',
      prompt: 'Elegant wedding catering display, gourmet food presentation, beautiful table setting, fine dining setup, luxury wedding reception, professional food photography, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'flores.png',
      prompt: 'Beautiful wedding flower bouquet, roses and peonies, elegant floral arrangement, soft pastel colors, romantic wedding flowers, professional floral design, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'decoracion.png',
      prompt: 'Elegant wedding decoration, floral centerpieces, romantic table settings, candlelight, luxury wedding venue decor, sophisticated styling, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'planner.png',
      prompt: 'Professional wedding planner organizing details, elegant wedding planning workspace, luxury stationery, flowers, soft lighting, sophisticated workspace, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'musica.png',
      prompt: 'DJ equipment at elegant wedding reception, professional audio setup, dance floor lighting, modern wedding party, entertainment setup, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'pastel.png',
      prompt: 'Elegant multi-tier wedding cake, white frosting, floral decorations, luxury cake design, romantic wedding dessert, professional cake photography, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'maquillaje.png',
      prompt: 'Bridal makeup application, professional makeup artist, elegant bride, soft romantic makeup, wedding beauty preparation, luxury setting, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'peluqueria.png',
      prompt: 'Elegant bridal hairstyle, professional hairstylist, romantic updo with flowers, wedding hair preparation, luxury salon setting, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'invitaciones.png',
      prompt: 'Elegant wedding invitation suite, calligraphy, luxury paper, floral details, sophisticated stationery design, romantic wedding cards, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'iluminacion.png',
      prompt: 'Elegant wedding lighting setup, romantic string lights, candlelight, professional lighting design, luxury wedding venue ambiance, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'mobiliario.png',
      prompt: 'Elegant wedding furniture arrangement, luxury chairs and tables, sophisticated venue setup, modern wedding decor, professional event design, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'transporte.png',
      prompt: 'Classic luxury wedding car, vintage automobile decorated with flowers, elegant transportation for bride and groom, romantic vehicle, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'viajes.png',
      prompt: 'Romantic honeymoon destination, luxury travel, beach paradise, couples getaway, wedding travel inspiration, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'joyeria.png',
      prompt: 'Elegant wedding rings on velvet, diamond engagement ring, luxury jewelry display, romantic ring photography, professional jewelry shot, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'default.png',
      prompt: 'Elegant wedding celebration, happy bride and groom, romantic wedding venue, flowers and decorations, joyful atmosphere, professional wedding photography, realistic photo',
      size: '1024x1024',
    },
  ],

  backgrounds: [
    {
      name: 'texture-paper.png',
      prompt: 'Subtle paper texture, cream colored, elegant wedding stationery background, soft grain, high quality paper texture, neutral tones, seamless tileable pattern',
      size: '1024x1024',
    },
    {
      name: 'texture-linen.png',
      prompt: 'Natural linen fabric texture, beige neutral color, soft woven textile background, elegant fabric pattern, wedding invitation texture, seamless tileable pattern',
      size: '1024x1024',
    },
    {
      name: 'texture-canvas.png',
      prompt: 'Canvas texture background, neutral cream color, subtle weave pattern, artistic background, wedding design texture, seamless tileable pattern',
      size: '1024x1024',
    },
    {
      name: 'texture-kraft.png',
      prompt: 'Kraft paper texture, natural brown paper background, rustic wedding texture, eco-friendly paper, subtle grain pattern, seamless tileable pattern',
      size: '1024x1024',
    },
    {
      name: 'watercolor-blush.png',
      prompt: 'Soft pink watercolor wash background, blush tones, romantic wedding background, gentle pastel watercolor, elegant design, abstract art',
      size: '1024x1024',
    },
    {
      name: 'watercolor-sage.png',
      prompt: 'Soft sage green watercolor background, gentle green tones, natural wedding background, elegant watercolor wash, botanical style, abstract art',
      size: '1024x1024',
    },
    {
      name: 'watercolor-blue.png',
      prompt: 'Soft blue watercolor background, dusty blue tones, romantic wedding background, elegant watercolor wash, serene atmosphere, abstract art',
      size: '1024x1024',
    },
    {
      name: 'watercolor-neutral.png',
      prompt: 'Soft neutral watercolor background, beige and cream tones, elegant wedding background, gentle watercolor wash, sophisticated design, abstract art',
      size: '1024x1024',
    },
  ],

  cities: [
    {
      name: 'es-madrid.png',
      prompt: 'Elegant wedding venue in Madrid Spain, Spanish capital cityscape, luxury wedding setting, romantic European venue, beautiful architecture, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'es-barcelona.png',
      prompt: 'Mediterranean wedding venue Barcelona, coastal wedding setting with sea view, Catalan architecture, romantic seaside, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'es-valencia.png',
      prompt: 'Modern wedding venue Valencia Spain, Spanish Mediterranean coast, elegant beach wedding setting, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'es-sevilla.png',
      prompt: 'Traditional Spanish wedding venue Seville, Andalusian architecture, romantic courtyard wedding, orange trees, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'es-coast.png',
      prompt: 'Spanish coastal wedding venue, Mediterranean beach, elegant seaside celebration, sunset over sea, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'es-interior.png',
      prompt: 'Rustic Spanish countryside wedding venue, rural estate, vineyard wedding setting, rolling hills, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'mx-cdmx.png',
      prompt: 'Elegant wedding venue Mexico City, modern Mexican architecture, luxury celebration, urban sophistication, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'mx-guadalajara.png',
      prompt: 'Traditional Mexican wedding venue Guadalajara, colonial architecture, romantic hacienda, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'mx-cancun.png',
      prompt: 'Tropical beach wedding Cancun, Caribbean coast turquoise water, luxury resort wedding, palm trees, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'mx-playadelcarmen.png',
      prompt: 'Beach wedding Playa del Carmen, tropical paradise, romantic coastal venue, white sand, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'ar-buenosaires.png',
      prompt: 'Elegant wedding venue Buenos Aires, European-style architecture, sophisticated Argentine celebration, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'ar-mendoza.png',
      prompt: 'Vineyard wedding Mendoza Argentina, Andes mountains backdrop, wine country celebration, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'ar-cordoba.png',
      prompt: 'Colonial wedding venue Cordoba Argentina, historic architecture, romantic celebration, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'fr-paris.png',
      prompt: 'Romantic Parisian wedding venue, Eiffel Tower in background, elegant French celebration, luxury setting, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'fr-provence.png',
      prompt: 'Lavender fields Provence wedding, French countryside, rustic elegant celebration, purple flowers, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'generic-beach.png',
      prompt: 'Beautiful beach wedding venue, tropical paradise, sunset ceremony, romantic ocean view, palm trees, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'generic-mountain.png',
      prompt: 'Mountain wedding venue, alpine scenery, elegant mountain resort, romantic landscape, snow-capped peaks, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'generic-garden.png',
      prompt: 'Botanical garden wedding, lush greenery, floral paradise, romantic outdoor venue, beautiful flowers, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'generic-historic.png',
      prompt: 'Historic mansion wedding venue, classical architecture, elegant estate, luxury celebration, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'generic-modern.png',
      prompt: 'Modern luxury wedding venue, contemporary architecture, sophisticated urban celebration, glass and steel, realistic photo',
      size: '1024x1024',
    },
  ],

  landing: [
    {
      name: 'hero-wedding-celebration.png',
      prompt: 'Joyful wedding celebration, happy bride and groom dancing, elegant venue, romantic atmosphere, professional wedding photography, realistic photo',
      size: '1792x1024',
    },
    {
      name: 'couple-planning.png',
      prompt: 'Happy couple planning wedding, looking at wedding plans together, romantic moment, engaged couple, joyful planning session, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'demo-decoration.png',
      prompt: 'Elegant wedding table decoration, floral centerpiece, romantic setting, candlelight, luxury venue, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'demo-ceremony.png',
      prompt: 'Beautiful wedding ceremony, outdoor setting, floral arch, romantic atmosphere, guests seated, realistic photo',
      size: '1024x1024',
    },
    {
      name: 'demo-flowers.png',
      prompt: 'Wedding flower arrangement, bridal bouquet with roses, elegant floral design, soft colors, realistic photo',
      size: '1024x1024',
    },
  ],
};

// Función para descargar imagen
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

// Función para generar una imagen
async function generateImage(category, imageConfig, index, total) {
  const outputPath = path.join(rootDir, 'public', 'assets', category, imageConfig.name);
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Verificar si ya existe
  if (fs.existsSync(outputPath)) {
    console.log(`   ⏭️  Ya existe: ${imageConfig.name}`);
    return { success: true, cached: true };
  }

  try {
    console.log(`   🎨 [${index}/${total}] Generando: ${imageConfig.name}`);
    console.log(`      Prompt: ${imageConfig.prompt.substring(0, 80)}...`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imageConfig.prompt,
      n: 1,
      size: imageConfig.size,
      quality: QUALITY,
      style: STYLE,
    });

    const imageUrl = response.data[0].url;
    console.log(`   ⬇️  Descargando...`);

    await downloadImage(imageUrl, outputPath);
    console.log(`   ✅ Guardada: ${outputPath}`);

    // Pequeña pausa para evitar rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, cached: false };
  } catch (error) {
    console.error(`   ❌ Error generando ${imageConfig.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          🎨 GENERACIÓN DE IMÁGENES CON DALL-E 3           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY no encontrada en .env');
    process.exit(1);
  }

  console.log('⚙️  Configuración:');
  console.log(`   API Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
  console.log(`   Project: ${process.env.OPENAI_PROJECT_ID || 'default'}`);
  console.log(`   Quality: ${QUALITY}`);
  console.log(`   Style: ${STYLE}\n`);

  const stats = {
    total: 0,
    generated: 0,
    cached: 0,
    failed: 0,
    costEstimate: 0,
  };

  // Calcular total
  for (const category of Object.keys(IMAGE_CATALOG)) {
    stats.total += IMAGE_CATALOG[category].length;
  }

  console.log(`📊 Total de imágenes a generar: ${stats.total}\n`);
  console.log(`💰 Costo estimado: $${(stats.total * 0.04).toFixed(2)} (standard) o $${(stats.total * 0.08).toFixed(2)} (HD)\n`);

  // Confirmar antes de continuar
  console.log('⚠️  Esto generará todas las imágenes con DALL-E 3.');
  console.log('   Presiona Ctrl+C para cancelar o espera 5 segundos...\n');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Generar por categorías
  for (const [category, images] of Object.entries(IMAGE_CATALOG)) {
    console.log(`\n📂 Categoría: ${category.toUpperCase()} (${images.length} imágenes)`);
    console.log('─'.repeat(60));

    let categoryIndex = 0;
    for (const imageConfig of images) {
      categoryIndex++;
      const result = await generateImage(category, imageConfig, categoryIndex, images.length);

      if (result.success) {
        if (result.cached) {
          stats.cached++;
        } else {
          stats.generated++;
          stats.costEstimate += QUALITY === 'hd' ? 0.08 : 0.04;
        }
      } else {
        stats.failed++;
      }
    }
  }

  // Resumen final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ✨ GENERACIÓN COMPLETADA                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Estadísticas:');
  console.log(`   Total imágenes: ${stats.total}`);
  console.log(`   ✅ Generadas: ${stats.generated}`);
  console.log(`   ⏭️  Ya existían: ${stats.cached}`);
  console.log(`   ❌ Fallidas: ${stats.failed}`);
  console.log(`   💰 Costo real: $${stats.costEstimate.toFixed(2)}\n`);

  if (stats.failed > 0) {
    console.log('⚠️  Algunas imágenes fallaron. Puedes ejecutar el script de nuevo.');
    console.log('   Solo se generarán las que falten.\n');
  }

  console.log('🚀 Próximos pasos:');
  console.log('   1. Revisar imágenes en public/assets/');
  console.log('   2. Ejecutar: node scripts/migrate-unsplash-to-local.js');
  console.log('   3. Ejecutar: node scripts/update-cities-and-blog-images.js');
  console.log('   4. Probar: npm run dev\n');
}

main().catch(console.error);
