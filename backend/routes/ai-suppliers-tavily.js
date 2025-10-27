// routes/ai-suppliers-tavily.js
// Búsqueda REAL de proveedores usando Tavily Search API + OpenAI
// POST /api/ai-suppliers-tavily
// Body: { query, service, budget, profile, location }

import express from 'express';
import OpenAI from 'openai';
import logger from '../logger.js';

const router = express.Router();

let openai = null;
let openAIConfig = { apiKey: null };

const resolveOpenAIKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const resolveTavilyKey = () => process.env.TAVILY_API_KEY || '';

const ensureOpenAIClient = () => {
  const apiKey = resolveOpenAIKey().trim();
  if (!apiKey) {
    openai = null;
    openAIConfig = { apiKey: null };
    return false;
  }
  if (openai && openAIConfig.apiKey === apiKey) return true;
  try {
    openai = new OpenAI({ apiKey });
    openAIConfig = { apiKey };
    logger.info('[ai-suppliers-tavily] Cliente OpenAI inicializado');
    return true;
  } catch (error) {
    openai = null;
    logger.error('[ai-suppliers-tavily] Error inicializando OpenAI', { message: error?.message });
    return false;
  }
};

// Búsqueda usando Tavily API (optimizada para IA)
// Función auxiliar para extraer imágenes del contenido de Tavily
function extractImageFromContent(result) {
  // Buscar URLs de imágenes en el contenido o raw_content
  const content = result.content || result.raw_content || '';
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif))/i;
  const match = content.match(imageRegex);
  return match ? match[1] : null;
}

// Función para hacer scraping completo del proveedor (imagen, email, teléfono)
async function scrapeProviderData(providerUrl) {
  try {
    const response = await fetch(providerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.warn(`[scrapeProviderData] HTTP ${response.status} para ${providerUrl}`);
      return { image: null, email: null, phone: null };
    }

    const html = await response.text();
    let imageUrl = null;
    let email = null;
    let phone = null;
    let instagram = null;

    // ===== SCRAPING DE IMAGEN =====
    
    // Estrategia 1: Buscar Open Graph image (og:image) - estándar web
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      imageUrl = ogImageMatch[1];
      // console.log(`✅ [scrapeProviderData] OG Image: ${imageUrl}`);
    }

    // Estrategia 2: Buscar twitter:image
    if (!imageUrl) {
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        imageUrl = twitterImageMatch[1];
        // console.log(`✅ [scrapeProviderData] Twitter Image: ${imageUrl}`);
      }
    }

    // Estrategia 3: Buscar imágenes con clases comunes de hero/portada
    if (!imageUrl) {
      const heroImageMatch = html.match(/<img[^>]*class=["'][^"']*(?:hero|main|cover|profile|vendor|banner|featured|portada|gallery|photo)[^"']*["'][^>]*src=["']([^"']+)["']/i);
      if (heroImageMatch && heroImageMatch[1]) {
        try {
          imageUrl = heroImageMatch[1].startsWith('http') 
            ? heroImageMatch[1] 
            : new URL(heroImageMatch[1], providerUrl).href;
          // console.log(`✅ [scrapeProviderData] Hero Image: ${imageUrl}`);
        } catch (e) {
          console.warn(`⚠️ Error construyendo URL de imagen: ${e.message}`);
        }
      }
    }

    // Estrategia 4: Buscar imágenes grandes en srcset o data-src
    if (!imageUrl) {
      const srcsetMatch = html.match(/<img[^>]*(?:srcset|data-src)=["']([^"'\s]+\.(?:jpg|jpeg|png|webp))[^"']*["']/i);
      if (srcsetMatch && srcsetMatch[1]) {
        try {
          imageUrl = srcsetMatch[1].startsWith('http') 
            ? srcsetMatch[1] 
            : new URL(srcsetMatch[1], providerUrl).href;
          // console.log(`✅ [scrapeProviderData] Srcset Image: ${imageUrl}`);
        } catch (e) {
          console.warn(`⚠️ Error construyendo URL de srcset: ${e.message}`);
        }
      }
    }

    // Estrategia 5: Primera imagen grande (excluyendo logos/icons)
    if (!imageUrl) {
      const allImages = html.match(/<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi) || [];
      for (const imgTag of allImages) {
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1] && 
            !srcMatch[1].includes('icon') && 
            !srcMatch[1].includes('logo') &&
            !srcMatch[1].includes('avatar') &&
            !srcMatch[1].includes('thumb')) {
          try {
            imageUrl = srcMatch[1].startsWith('http') 
              ? srcMatch[1] 
              : new URL(srcMatch[1], providerUrl).href;
            // console.log(`✅ [scrapeProviderData] Primera imagen válida: ${imageUrl}`);
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }

    // ===== SCRAPING DE EMAIL =====
    
    // Buscar emails en el HTML
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatches = html.match(emailRegex);
    if (emailMatches && emailMatches.length > 0) {
      // Filtrar emails comunes de spam/genéricos
      const validEmails = emailMatches.filter(e => 
        !e.includes('example.com') && 
        !e.includes('test.com') &&
        !e.includes('sentry.io') &&
        !e.includes('google-analytics') &&
        !e.includes('facebook.com')
      );
      if (validEmails.length > 0) {
        email = validEmails[0];
        // console.log(`✅ [scrapeProviderData] Email encontrado: ${email}`);
      }
    }

    // ===== SCRAPING DE TELÉFONO =====
    
    // Buscar teléfonos españoles (formatos comunes)
    const phoneRegex = /(?:\+34|0034)?\s?[6789]\d{2}\s?\d{3}\s?\d{3}|(?:\+34|0034)?\s?9\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/g;
    const phoneMatches = html.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      phone = phoneMatches[0].trim();
      // console.log(`✅ [scrapeProviderData] Teléfono encontrado: ${phone}`);
    }

    // También buscar en enlaces tel:
    if (!phone) {
      const telLinkMatch = html.match(/href=["']tel:([+\d\s()-]+)["']/i);
      if (telLinkMatch && telLinkMatch[1]) {
        phone = telLinkMatch[1].trim();
        // console.log(`✅ [scrapeProviderData] Teléfono (tel:) encontrado: ${phone}`);
      }
    }

    // ===== SCRAPING DE INSTAGRAM =====
    
    // Buscar enlaces de Instagram en el HTML
    const instagramPatterns = [
      // href="https://www.instagram.com/usuario"
      /href=["'](https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+))\/?["']/i,
      // @usuario en texto
      /@([a-zA-Z0-9._]{3,30})\b/g,
      // instagram.com/usuario en texto plano
      /instagram\.com\/([a-zA-Z0-9._]+)/i
    ];

    // Intentar con cada patrón
    for (const pattern of instagramPatterns) {
      const match = html.match(pattern);
      if (match) {
        if (match[1] && match[1].includes('instagram.com')) {
          // URL completa encontrada
          instagram = match[1];
          break;
        } else if (match[1] && !match[1].includes('instagram')) {
          // Solo el username
          instagram = `https://www.instagram.com/${match[1]}`;
          break;
        }
      }
    }

    // Validar que el username de Instagram no sea genérico
    if (instagram) {
      const genericUsernames = ['instagram', 'share', 'p/', 'explore', 'stories', 'reel'];
      const isGeneric = genericUsernames.some(gen => instagram.toLowerCase().includes(gen));
      if (isGeneric) {
        instagram = null;
      }
    }

    if (!imageUrl) {
      console.warn(`⚠️ [scrapeProviderData] No se encontró imagen para ${providerUrl}`);
    }

    return { image: imageUrl, email, phone, instagram };
  } catch (error) {
    console.error(`❌ [scrapeProviderData] Error scraping ${providerUrl}:`, error.message);
    return { image: null, email: null, phone: null, instagram: null };
  }
}

async function searchTavily(query, location = 'España') {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY no está configurado');
  }

  // Query ultra-específica para encontrar SOLO perfiles individuales de proveedores
  // Usamos operadores de búsqueda para excluir listados
  const searchQuery = `"${query}" ${location} contacto portfolio sobre -directorio -buscar -listado -resultados -encuentra -empresas -proveedores site:bodas.net OR site:*.com OR site:*.es`;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'advanced', // 'advanced' para resultados más específicos
        include_answer: false,
        include_raw_content: true, // Incluir contenido completo para mejor filtrado
        include_images: true, // ✅ ACTIVAR IMÁGENES
        max_results: 20, // Más resultados porque muchos serán filtrados
        // Excluir sitios genéricos y de listados
        exclude_domains: [
          'wikipedia.org',
          'youtube.com',
          'amazon.es',
          'pinterest.com',
          'ebay.es',
          'aliexpress.com',
          'milanuncios.com',
          'wallapop.com',
          'google.com',
          'bing.com'
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // DEBUG: Ver estructura completa de la respuesta
    console.log('🔍 [TAVILY] Estructura de respuesta:', {
      hasResults: !!data.results,
      resultsCount: data.results?.length || 0,
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      firstResult: data.results?.[0],
      firstResultHasOwnImage: !!data.results?.[0]?.image
    });
    
    // DEBUG: Ver el ARRAY COMPLETO de imágenes
    console.log('📸 [TAVILY] Array de imágenes completo:', data.images);
    
    const results = data.results || [];
    const globalImages = data.images || [];
    
    console.log('🖼️ [TAVILY] Mapeo de imágenes:', {
      totalResults: results.length,
      totalGlobalImages: globalImages.length,
      firstGlobalImage: globalImages[0]
    });
    
    // Hacer scraping completo de datos de proveedores en paralelo
    console.log('🔍 [TAVILY] Iniciando scraping completo de proveedores (imagen, email, teléfono, Instagram)...');
    
    const resultsWithData = await Promise.all(
      results.map(async (result, index) => {
        let imageUrl = '';
        let email = '';
        let phone = '';
        let instagram = '';
        
        // 1. Prioridad: imagen específica del resultado de Tavily
        if (result.image) {
          imageUrl = result.image;
          console.log(`✅ [${index}] ${result.title}: Usando imagen de Tavily`);
        }
        
        // 2. SCRAPING: Obtener datos completos del proveedor desde su URL
        if (result.url) {
          const scrapedData = await scrapeProviderData(result.url);
          
          // Usar imagen scraped si no hay de Tavily
          if (!imageUrl && scrapedData.image) {
            imageUrl = scrapedData.image;
            console.log(`🎯 [${index}] ${result.title}: Imagen scraped desde ${result.url}`);
          }
          
          // Asignar email, teléfono e Instagram si se encontraron
          if (scrapedData.email) {
            email = scrapedData.email;
            console.log(`📧 [${index}] ${result.title}: Email encontrado`);
          }
          if (scrapedData.phone) {
            phone = scrapedData.phone;
            console.log(`📱 [${index}] ${result.title}: Teléfono encontrado`);
          }
          if (scrapedData.instagram) {
            instagram = scrapedData.instagram;
            console.log(`📷 [${index}] ${result.title}: Instagram encontrado`);
          }
        }
        
        // 3. Buscar imagen en el contenido de Tavily (fallback)
        if (!imageUrl) {
          imageUrl = extractImageFromContent(result);
          if (imageUrl) console.log(`✅ [${index}] ${result.title}: Imagen extraída del contenido`);
        }
        
        // 4. Usar imágenes globales como último recurso
        if (!imageUrl && globalImages[index]) {
          imageUrl = globalImages[index];
          console.log(`⚠️ [${index}] ${result.title}: Usando imagen global (puede no corresponder)`);
        }
        
        return {
          ...result,
          image: imageUrl,
          email: email,
          phone: phone,
          instagram: instagram
        };
      })
    );
    
    const withImages = resultsWithData.filter(r => r.image).length;
    const withEmail = resultsWithData.filter(r => r.email).length;
    const withPhone = resultsWithData.filter(r => r.phone).length;
    const withInstagram = resultsWithData.filter(r => r.instagram).length;
    
    console.log(`✅ [TAVILY] Scraping completado:
      - ${withImages}/${results.length} con imagen
      - ${withEmail}/${results.length} con email
      - ${withPhone}/${results.length} con teléfono
      - ${withInstagram}/${results.length} con Instagram`);
    
    return resultsWithData;
  } catch (error) {
    logger.error('[ai-suppliers-tavily] Error en búsqueda Tavily', { 
      message: error.message,
      query: searchQuery 
    });
    throw error;
  }
}

// FUNCIÓN OPCIONAL: Usar OpenAI solo para RANKING de proveedores según características de la boda
// Esta función NO modifica los datos, solo reordena por relevancia
async function rankProviders(providers, weddingProfile, budget) {
  if (!openai) {
    // Sin OpenAI, devolver en orden original
    return providers;
  }

  try {
    const prompt = `Analiza estos proveedores y ordénalos por relevancia para esta boda.

CARACTERÍSTICAS DE LA BODA:
- Presupuesto: ${budget || 'No especificado'}
- Perfil: ${JSON.stringify(weddingProfile || {})}

PROVEEDORES:
${providers.map((p, i) => `${i + 1}. ${p.title} (${p.location || 'sin ubicación'}) - ${p.snippet}`).join('\n')}

TAREA:
Devuelve solo un array con los ÍNDICES (0-based) ordenados por relevancia.
NO modifiques ningún dato del proveedor.
Considera: ubicación, presupuesto, descripción del servicio.

Responde SOLO con JSON:
{"rankedIndices": [2, 0, 4, 1, 3, ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Eres un experto en bodas que rankea proveedores por relevancia. Solo devuelves índices ordenados, sin modificar datos.' },
        { role: 'user', content: prompt }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);
    const rankedIndices = result.rankedIndices || providers.map((_, i) => i);
    
    return rankedIndices.map(i => providers[i]).filter(p => p); // Reordenar
  } catch (error) {
    console.error('Error rankeando con OpenAI:', error.message);
    return providers; // Fallback: devolver sin rankear
  }
}

// [DEPRECADO] Usar OpenAI para estructurar y filtrar resultados de Tavily
// Esta función ya NO se usa por defecto, Tavily devuelve datos directamente
async function structureResults(tavilyResults, query, service, location, budget) {
  if (!tavilyResults || tavilyResults.length === 0) {
    return [];
  }

  // Tavily ya devuelve resultados muy limpios, incluyendo imágenes, email y teléfono
  // Log reducido de contenido de Tavily
  if (process.env.DEBUG_AI === 'true') {
    console.log('📝 [Tavily] Contenido disponible para OpenAI:');
    tavilyResults.slice(0, 3).forEach((item, idx) => {
      console.log(`  [${idx}] ${item.title}`);
    });
  }

  const resultsText = tavilyResults.map((item, idx) => {
    const hasImage = item.image && item.image.trim() !== '';
    const hasEmail = item.email && item.email.trim() !== '';
    const hasPhone = item.phone && item.phone.trim() !== '';
    return `[${idx + 1}]
Título: ${item.title}
URL: ${item.url}
Contenido: ${item.content}
Score: ${item.score}
${hasImage ? `✅ IMAGEN DISPONIBLE: ${item.image}` : '❌ Sin imagen'}
${hasEmail ? `📧 EMAIL DISPONIBLE: ${item.email}` : ''}
${hasPhone ? `📱 TELÉFONO DISPONIBLE: ${item.phone}` : ''}
`;
  }).join('\n\n');

  const prompt = `Eres un extractor de datos PRECISO. Tu tarea es extraer información de proveedores de bodas SIN INFERIR NI INVENTAR NADA.

BÚSQUEDA ORIGINAL DEL USUARIO: "${query}"
NOTA: La búsqueda del usuario NO determina la ubicación del proveedor. Lee el contenido para saber dónde opera realmente.

RESULTADOS DE BÚSQUEDA (ordenados por relevancia):
${resultsText}

REGLAS ESTRICTAS DE EXTRACCIÓN:

1. **TÍTULO**: Extrae el nombre EXACTO del proveedor del campo "Título"
   
2. **SNIPPET/DESCRIPCIÓN**: 
   - COPIA textualmente fragmentos del campo "Contenido"
   - NO interpretes, NO resumas con tus palabras
   - Si el contenido menciona ubicación, inclúyela tal cual
   - Máximo 100 palabras
   
3. **UBICACIÓN** (MUY CRÍTICO):
   - SOLO extrae si el campo "Contenido" menciona EXPLÍCITAMENTE una ciudad/provincia
   - Busca frases como: "en Valencia", "Murcia", "ubicado en", "servicio en", etc.
   - Si NO encuentras ubicación en el contenido: deja VACÍO ""
   - NUNCA uses "${location}" de la búsqueda como ubicación real
   - EJEMPLO: Si el contenido dice "eventos en Murcia", escribe "Murcia"
   - EJEMPLO: Si el contenido NO menciona ciudad, deja ""

4. **IMÁGENES**: 
   - Si ves "✅ IMAGEN DISPONIBLE: [URL]", COPIA LA URL EXACTA
   - Si ves "❌ Sin imagen", deja vacío ""

5. **EMAIL Y TELÉFONO**:
   - Si ves "📧 EMAIL DISPONIBLE: [EMAIL]", COPIA el email exacto
   - Si ves "📱 TELÉFONO DISPONIBLE: [PHONE]", COPIA el teléfono exacto
   - Si no hay, deja vacío ""

6. **PRECIO**: Solo si aparece EXPLÍCITAMENTE en el contenido

FORMATO JSON:
{
  "providers": [
    {
      "title": "Nombre exacto del título",
      "link": "URL exacta del resultado",
      "image": "URL de imagen si está disponible, sino vacío",
      "snippet": "Fragmentos TEXTUALES del contenido (máx 100 palabras)",
      "service": "${service}",
      "location": "SOLO si aparece EXPLÍCITAMENTE en el contenido. Si no, VACÍO",
      "email": "Email si está disponible, sino vacío",
      "phone": "Teléfono si está disponible, sino vacío",
      "priceRange": "Precio SOLO si aparece en el contenido, sino vacío",
      "tags": ["1-3 etiquetas basadas EN EL CONTENIDO"]
    }
  ]
}

ADVERTENCIAS FINALES:
❌ NO inventes ubicaciones basándote en la búsqueda del usuario
❌ NO interpretes ni reformules el contenido
❌ NO incluyas información que no esté en el contenido
✅ SOLO extrae información que REALMENTE aparece en "Contenido"
✅ Si tienes dudas sobre una ubicación, déjala VACÍA

Devuelve máximo 8 proveedores con información VERIFICABLE en el contenido.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.0, // Temperature 0 para extracción literal sin inferencias
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un extractor de datos PRECISO y LITERAL. NUNCA infieras, asumas o inventes información. SOLO extraes lo que está EXPLÍCITAMENTE escrito en el contenido proporcionado. Si no encuentras un dato, lo dejas vacío. La ubicación del proveedor DEBE estar en el contenido, NUNCA la inferas de la búsqueda del usuario.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    const providers = parsed.providers || [];
    
    // Log de verificación de ubicaciones
    console.log('\n🔍 [OpenAI] Verificación de datos extraídos:');
    providers.forEach((p, idx) => {
      const tavilyOriginal = tavilyResults[idx];
      console.log(`  [${idx}] ${p.title}`);
      console.log(`      Location extraída: "${p.location}" (${p.location ? '✅ tiene' : '⚠️ vacío'})`);
      console.log(`      Email: ${p.email ? '✅' : '❌'} | Teléfono: ${p.phone ? '✅' : '❌'} | Imagen: ${p.image ? '✅' : '❌'}`);
      
      // Verificar si la ubicación está realmente en el contenido original
      if (p.location && tavilyOriginal) {
        const locationInContent = tavilyOriginal.content.toLowerCase().includes(p.location.toLowerCase());
        console.log(`      ⚠️ Verificación: ¿"${p.location}" está en contenido? ${locationInContent ? '✅ SÍ' : '❌ NO (POSIBLE ERROR)'}`);
      }
    });
    console.log('');
    
    return providers;
  } catch (error) {
    logger.error('[ai-suppliers-tavily] Error estructurando resultados', { 
      message: error.message 
    });
    
    // Fallback: devolver resultados de Tavily con estructura básica
    return tavilyResults.slice(0, 6).map(item => ({
      title: item.title,
      link: item.url,
      snippet: item.content.substring(0, 150),
      service: service,
      location: '', // NO usar la ubicación de la búsqueda
      email: item.email || '',
      phone: item.phone || '',
      image: item.image || '',
      priceRange: '',
      tags: []
    }));
  }
}

ensureOpenAIClient();

router.post('/', async (req, res) => {
  const hasOpenAI = ensureOpenAIClient();
  const hasTavily = resolveTavilyKey();

  if (!hasOpenAI || !openai) {
    logger.error('[ai-suppliers-tavily] OpenAI no disponible');
    return res.status(500).json({ 
      error: 'OPENAI_API_KEY missing',
      message: 'Configura OPENAI_API_KEY en el backend para estructurar resultados'
    });
  }

  if (!hasTavily) {
    logger.error('[ai-suppliers-tavily] Tavily API no configurada');
    return res.status(500).json({ 
      error: 'TAVILY_API_KEY missing',
      message: 'Configura TAVILY_API_KEY en el backend. Obtén una gratis en https://tavily.com/'
    });
  }

  const { 
    query, 
    service = '', 
    budget = '', 
    profile = {}, 
    location = '',
    useRanking = false // NUEVO: activar ranking con OpenAI (opcional)
  } = req.body || {};
  
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const formattedLocation = location || 
    profile?.celebrationPlace || 
    profile?.location || 
    profile?.city || 
    'España';

  const servicioSeleccionado = service || 'Servicios para bodas';

  try {
    logger.info('[ai-suppliers-tavily] Iniciando búsqueda real con Tavily', {
      query,
      service: servicioSeleccionado,
      location: formattedLocation
    });

    // 1. Búsqueda web real con Tavily (YA INCLUYE email, phone, imagen)
    const tavilyResults = await searchTavily(query, formattedLocation);
    
    logger.info('[ai-suppliers-tavily] Resultados de Tavily obtenidos', {
      count: tavilyResults.length
    });

    if (tavilyResults.length === 0) {
      return res.json([]);
    }

    // 2. FILTRAR resultados que no sean proveedores específicos
    // Eliminar páginas de búsqueda, categorías, directorios, etc.
    const isValidProviderUrl = (url) => {
      if (!url) return false;
      
      const urlLower = url.toLowerCase();
      
      // Descartar URLs de búsqueda o listados
      const invalidPatterns = [
        '/buscar', '/search', '/resultados', '/results',
        '/busqueda', '/encuentra', '/directorio', '/listado',
        '/categoria', '/category', '/servicios-de-',
        '?q=', '?search=', '?query=', '?buscar=',
        '/proveedores-de-', '/fotografos-bodas/', '/djs-bodas/',
        '/catering-bodas/', '/floristerias-bodas/', '/musicos-bodas/',
        '/tag/', '/tags/', '/archivo/', '/archive/',
        '/fotografia/', '/video/', '/catering/', '/flores/', '/musica/', // Categorías genéricas
        '/empresas/', '/profesionales/', '/negocios/',
        'bodas.net/fotografos', 'bodas.net/video', 'bodas.net/catering', // URLs de categorías de bodas.net
        'bodas.net/musica', 'bodas.net/flores', 'bodas.net/dj'
      ];
      
      const isInvalid = invalidPatterns.some(pattern => urlLower.includes(pattern));
      if (isInvalid) {
        console.log(`❌ [FILTRO] Descartando URL de listado/búsqueda: ${url}`);
        return false;
      }
      
      // Validar que sea una URL específica de proveedor
      try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
        
        // Si tiene muy pocos segmentos, probablemente es una página genérica
        if (pathSegments.length < 2) {
          console.log(`⚠️ [FILTRO] URL demasiado genérica: ${url}`);
          return false;
        }
        
        // Para bodas.net, verificar que tenga un ID numérico (URLs de proveedores específicos)
        if (urlLower.includes('bodas.net')) {
          const hasNumericId = /\/\d{5,}/.test(urlObj.pathname); // IDs de bodas.net suelen ser largos
          if (!hasNumericId) {
            console.log(`❌ [FILTRO] bodas.net sin ID específico: ${url}`);
            return false;
          }
        }
        
        // Verificar que el último segmento sea específico (no una categoría)
        const lastSegment = pathSegments[pathSegments.length - 1];
        const genericLastSegments = ['fotografia', 'video', 'catering', 'flores', 'musica', 'dj', 'eventos', 'bodas'];
        if (genericLastSegments.includes(lastSegment.toLowerCase())) {
          console.log(`❌ [FILTRO] Último segmento es categoría: ${url}`);
          return false;
        }
        
        return true;
      } catch (e) {
        return false;
      }
    };
    
    // Filtrar solo resultados válidos
    const validResults = tavilyResults.filter((result, idx) => {
      // Validar URL
      const isValidUrl = isValidProviderUrl(result.url);
      if (!isValidUrl) {
        console.log(`🗑️ [${idx}] URL inválida: ${result.title}`);
        return false;
      }
      
      // Validar título (detectar páginas de listado por el título)
      const titleLower = (result.title || '').toLowerCase();
      const invalidTitlePatterns = [
        'encuentra', 'busca', 'directorio', 'listado',
        'todos los', 'mejores', 'top', 'los mejores',
        'buscar', 'resultado', 'empresa',
        'profesionales de', 'servicios de',
        'bodas en', 'para bodas', 'de bodas',
        'fotógrafos en', 'djs en', 'catering en', 'floristerías en',
        'proveedores', 'empresas', 'negocios',
        'compara', 'opiniones', 'valoraciones', 'reseñas'
      ];
      
      // Si el título contiene MÚLTIPLES palabras genéricas, es un listado
      const genericCount = invalidTitlePatterns.filter(pattern => 
        titleLower.includes(pattern)
      ).length;
      
      if (genericCount >= 1) {
        console.log(`🗑️ [${idx}] Título de listado: ${result.title}`);
        return false;
      }
      
      // Si el título es SOLO el tipo de servicio (sin nombre propio), descartarlo
      const serviceOnlyPatterns = [
        /^fotógrafos?\s+(?:de\s+)?bodas?$/i,
        /^videógrafos?\s+(?:de\s+)?bodas?$/i,
        /^dj\s+(?:para\s+)?bodas?$/i,
        /^catering\s+(?:para\s+)?bodas?$/i,
        /^floristería\s+(?:para\s+)?bodas?$/i,
        /^música\s+(?:para\s+)?bodas?$/i
      ];
      
      const isTitleOnlyService = serviceOnlyPatterns.some(pattern => 
        pattern.test(titleLower)
      );
      
      if (isTitleOnlyService) {
        console.log(`🗑️ [${idx}] Título genérico sin nombre: ${result.title}`);
        return false;
      }
      
      // Validar contenido (debe mencionar un proveedor específico)
      const contentLower = (result.content || '').toLowerCase();
      
      // El contenido debe tener longitud mínima
      if (!result.content || contentLower.split(' ').length < 30) {
        console.log(`⚠️ [${idx}] Contenido muy corto: ${result.title}`);
        return false;
      }
      
      // El contenido NO debe tener palabras de listado múltiple
      const multipleProviderIndicators = [
        'compara precios', 'compara presupuestos',
        'consulta disponibilidad de', 'encuentra el mejor',
        'todos los proveedores', 'más de', 'empresas de',
        'opciones de', 'selección de', 'variedad de'
      ];
      
      const hasMultipleIndicators = multipleProviderIndicators.some(indicator => 
        contentLower.includes(indicator)
      );
      
      if (hasMultipleIndicators) {
        console.log(`🗑️ [${idx}] Contenido de listado múltiple: ${result.title}`);
        return false;
      }
      
      // El contenido DEBE tener indicadores de proveedor único
      const singleProviderIndicators = [
        'nuestro', 'nuestra', 'nos dedicamos', 'somos',
        'mi experiencia', 'nuestros servicios', 'contacta con nosotros',
        'sobre nosotros', 'sobre mí', 'mi trabajo', 'portfolio'
      ];
      
      const hasSingleProviderIndicator = singleProviderIndicators.some(indicator => 
        contentLower.includes(indicator)
      );
      
      // Si no tiene indicadores de proveedor único Y el título no es muy específico, descartar
      if (!hasSingleProviderIndicator && titleLower.length < 15) {
        console.log(`⚠️ [${idx}] Sin indicadores de proveedor único: ${result.title}`);
        // No descartamos automáticamente, pero es sospechoso
      }
      
      return true;
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ [FILTRO] ${validResults.length}/${tavilyResults.length} resultados son proveedores específicos`);
    
    if (validResults.length > 0) {
      console.log('\n📋 Proveedores válidos encontrados:');
      validResults.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title}`);
        console.log(`     URL: ${r.url}`);
      });
    }
    console.log('='.repeat(80) + '\n');
    
    if (validResults.length === 0) {
      console.warn('⚠️ [FILTRO] No hay resultados válidos después del filtrado');
      logger.warn('[ai-suppliers-tavily] Todos los resultados fueron filtrados', {
        originalCount: tavilyResults.length,
        query,
        hint: 'Intenta con una búsqueda más específica o un nombre de proveedor concreto'
      });
      return res.json([]);
    }
    
    // Advertir si hay muy pocos resultados
    if (validResults.length < 3) {
      console.warn(`⚠️ [FILTRO] Solo ${validResults.length} resultados válidos. Considera refinar la búsqueda.`);
    }

    // 3. Limitar a los mejores 8 resultados para calidad
    const topResults = validResults.slice(0, 8);
    console.log(`🎯 [FILTRO] Devolviendo los mejores ${topResults.length} proveedores\n`);

    // 4. Convertir resultados válidos a formato de proveedor (SIN OpenAI)
    const providers = topResults.map((result, index) => {
      // === EXTRACCIÓN DEL NOMBRE REAL DEL PROVEEDOR ===
      let providerName = result.title;
      
      // Limpiar el título de Tavily para extraer el nombre real del proveedor
      // Patrones comunes: "Nombre - Descripción", "Nombre | Bodas.net", "Nombre: Servicio"
      
      // 1. Eliminar sufijos comunes de sitios web
      providerName = providerName
        .replace(/\s*[-–|]\s*Bodas\.net.*$/i, '')
        .replace(/\s*[-–|]\s*Bodas\.com\.mx.*$/i, '')
        .replace(/\s*[-–|]\s*Instagram.*$/i, '')
        .replace(/\s*[-–|]\s*Facebook.*$/i, '')
        .replace(/\s*[-–]\s*Consulta disponibilidad.*$/i, '')
        .replace(/\s*[-–]\s*Precios.*$/i, '');
      
      // 2. Tomar solo la primera parte antes de separadores
      const separators = [' - ', ' | ', ' – ', ': ', ' » '];
      for (const sep of separators) {
        if (providerName.includes(sep)) {
          const parts = providerName.split(sep);
          // Tomar la parte que parezca un nombre de empresa (sin palabras genéricas)
          const genericWords = ['fotograf', 'video', 'catering', 'dj', 'músic', 'flor', 'bodas', 'eventos'];
          const firstPart = parts[0].trim();
          const isGeneric = genericWords.some(word => firstPart.toLowerCase().includes(word));
          
          if (!isGeneric || parts.length === 1) {
            providerName = firstPart;
          } else if (parts[1]) {
            providerName = parts[1].trim();
          }
          break;
        }
      }
      
      // 3. Buscar nombre en el contenido si el título parece genérico
      const genericTitleWords = ['fotógrafo', 'videógrafo', 'catering', 'floristería', 'dj', 'música'];
      const titleIsGeneric = genericTitleWords.some(word => 
        providerName.toLowerCase().startsWith(word) || 
        providerName.toLowerCase() === word
      );
      
      if (titleIsGeneric) {
        // Buscar nombres propios en el contenido (palabras capitalizadas)
        const nameMatch = result.content.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})\s+(?:Fotógraf|Videógraf|Catering|Florist|DJ|Músic)/i);
        if (nameMatch) {
          providerName = nameMatch[1].trim();
        }
      }
      
      // 4. Limpiar caracteres extraños y espacios múltiples
      providerName = providerName
        .replace(/\s+/g, ' ')
        .replace(/^[^\w\sÁÉÍÓÚÑáéíóúñ]+/, '')
        .replace(/[^\w\sÁÉÍÓÚÑáéíóúñ]+$/, '')
        .trim();
      
      // === EXTRACCIÓN DE UBICACIÓN ===
      let extractedLocation = '';
      
      // Ciudades españolas comunes
      const cities = [
        'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Murcia', 'Alicante', 
        'Bilbao', 'Granada', 'Zaragoza', 'Valladolid', 'Córdoba', 'Toledo', 'Cádiz',
        'Tarragona', 'Castellón', 'Almería', 'Santander', 'Pamplona', 'Logroño',
        'Salamanca', 'Oviedo', 'Gijón', 'Vigo', 'Coruña', 'Vitoria', 'Lleida',
        'Burgos', 'León', 'Albacete', 'Badajoz', 'Cáceres', 'Jaén', 'Huelva',
        'San Sebastián', 'Marbella', 'Jerez', 'Elche', 'Cartagena'
      ];
      
      // Buscar "en [Ciudad]", "de [Ciudad]", etc.
      const locationPattern = new RegExp(`\\b(?:en|de|desde)\\s+(${cities.join('|')})\\b`, 'i');
      let match = result.content.match(locationPattern);
      
      if (match) {
        extractedLocation = match[1];
      } else {
        // Buscar solo el nombre de la ciudad
        const cityPattern = new RegExp(`\\b(${cities.join('|')})\\b`, 'i');
        match = result.content.match(cityPattern);
        if (match) {
          extractedLocation = match[1];
        }
      }

      return {
        title: providerName,
        link: result.url,
        image: result.image || '',
        snippet: result.content.substring(0, 200) + '...', // Contenido literal de Tavily
        service: servicioSeleccionado,
        location: extractedLocation, // Extraído del contenido, no de la búsqueda
        email: result.email || '',
        phone: result.phone || '',
        instagram: result.instagram || '', // Instagram scraped
        priceRange: '',
        tags: [],
        score: result.score || (1 - index * 0.1), // Score de Tavily o calculado por posición
        _originalTitle: result.title // DEBUG: mantener título original
      };
    });

    // Log reducido (solo si DEBUG_AI=true)
    if (process.env.DEBUG_AI === 'true') {
      console.log('✅ [TAVILY] Proveedores directos (sin OpenAI):');
      providers.slice(0, 3).forEach((p, idx) => {
        console.log(`  [${idx}] Nombre limpio: "${p.title}"`);
        console.log(`       Original: "${p._originalTitle}"`);
        console.log(`       Ubicación: ${p.location || 'sin ubicación'}`);
      });
    }

    // 3. OPCIONAL: Si useRanking=true, rankear con OpenAI según características de la boda
    let finalProviders = providers;
    if (useRanking && hasOpenAI) {
      console.log('🤖 [RANKING] Usando OpenAI para ordenar por relevancia...');
      finalProviders = await rankProviders(providers, profile, budget);
      console.log('✅ [RANKING] Proveedores reordenados por OpenAI');
    } else {
      console.log('ℹ️ [RANKING] Usando orden de Tavily (sin ranking de OpenAI)');
    }

    // Limpiar campos de debug antes de enviar al frontend
    const cleanProviders = finalProviders.map(({ _originalTitle, ...provider }) => provider);

    logger.info('[ai-suppliers-tavily] Proveedores devueltos', {
      count: cleanProviders.length,
      ranked: useRanking,
      withEmail: cleanProviders.filter(p => p.email).length,
      withPhone: cleanProviders.filter(p => p.phone).length,
      withImage: cleanProviders.filter(p => p.image).length
    });

    res.json(cleanProviders);

  } catch (error) {
    logger.error('[ai-suppliers-tavily] Error en búsqueda', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'search_failed',
      message: error.message,
      details: 'Error realizando búsqueda real de proveedores con Tavily'
    });
  }
});

export default router;
