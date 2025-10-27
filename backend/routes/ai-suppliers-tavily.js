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

async function searchTavily(query, location = 'España') {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY no está configurado');
  }

  const searchQuery = `${query} ${location} proveedores bodas España`;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'basic', // 'basic' or 'advanced'
        include_answer: false,
        include_raw_content: false,
        include_images: true, // ✅ ACTIVAR IMÁGENES
        max_results: 10,
        include_domains: [
          'bodas.net',
          'bodas.com.mx',
          'instagram.com',
          'facebook.com'
        ],
        // exclude_domains: ['wikipedia.org'],
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
    
    // Estrategia inteligente para asignar imágenes
    return results.map((result, index) => {
      let imageUrl = '';
      
      // 1. Prioridad: imagen específica del resultado
      if (result.image) {
        imageUrl = result.image;
        console.log(`✅ [${index}] Usando imagen del resultado`);
      }
      
      // 2. Buscar imagen en el contenido
      if (!imageUrl) {
        imageUrl = extractImageFromContent(result);
        if (imageUrl) console.log(`✅ [${index}] Imagen extraída del contenido`);
      }
      
      // 3. Si hay imágenes globales disponibles, asignar solo si quedan suficientes
      // (evitar asignar favicon de bodas.net)
      if (!imageUrl && globalImages[index] && globalImages.length >= results.length) {
        imageUrl = globalImages[index];
        console.log(`⚠️ [${index}] Usando imagen global por índice`);
      }
      
      // 4. NO usar favicon como fallback (mejor vacío que incorrecto)
      
      return {
        ...result,
        image: imageUrl
      };
    });
  } catch (error) {
    logger.error('[ai-suppliers-tavily] Error en búsqueda Tavily', { 
      message: error.message,
      query: searchQuery 
    });
    throw error;
  }
}

// Usar OpenAI para estructurar y filtrar resultados de Tavily
async function structureResults(tavilyResults, query, service, location, budget) {
  if (!tavilyResults || tavilyResults.length === 0) {
    return [];
  }

  // Tavily ya devuelve resultados muy limpios, incluyendo imágenes
  const resultsText = tavilyResults.map((item, idx) => {
    const hasImage = item.image && item.image.trim() !== '';
    return `[${idx + 1}]
Título: ${item.title}
URL: ${item.url}
Contenido: ${item.content}
Score: ${item.score}
${hasImage ? `✅ IMAGEN DISPONIBLE: ${item.image}` : '❌ Sin imagen'}
`;
  }).join('\n\n');

  const prompt = `Analiza estos resultados de búsqueda web REALES de proveedores de bodas y extrae información estructurada.

BÚSQUEDA: "${query}"
SERVICIO: "${service}"
UBICACIÓN: ${location}
PRESUPUESTO: ${budget || 'No especificado'}

RESULTADOS DE BÚSQUEDA (ordenados por relevancia):
${resultsText}

TAREA:
1. Identifica SOLO proveedores reales (ignora blogs, artículos, directorios genéricos)
2. Extrae: nombre comercial, URL, descripción, ubicación, servicio específico
3. **CRÍTICO - IMÁGENES**: 
   - Si ves "✅ IMAGEN DISPONIBLE: [URL]", COPIA LA URL COMPLETA Y EXACTA al campo "image"
   - Si ves "❌ Sin imagen", deja el campo "image" VACÍO (string vacío "")
   - NO inventes URLs de imágenes
   - NO uses placeholders
4. Si aparece información de precio/rango, inclúyela
5. Devuelve máximo 6 proveedores más relevantes para la búsqueda

FORMATO JSON:
{
  "providers": [
    {
      "title": "Nombre comercial del proveedor (extraído del título o contenido)",
      "link": "URL exacta del resultado",
      "image": "URL EXACTA que aparece después de '✅ IMAGEN DISPONIBLE:'. Si no hay, string vacío.",
      "snippet": "Descripción del servicio (50-100 palabras, basada en el contenido)",
      "service": "${service}",
      "location": "Ciudad/provincia (extraída del contenido si aparece)",
      "priceRange": "Solo si aparece precio mencionado, sino dejar vacío",
      "tags": ["2-3 etiquetas relevantes"]
    }
  ]
}

IMPORTANTE:
- Solo incluye proveedores que aparecen en los resultados
- Usa las URLs exactas proporcionadas
- Si el resultado es un artículo/blog en vez de proveedor, IGNÓRALO
- Prioriza resultados con score más alto`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en extraer información estructurada de proveedores de bodas desde resultados de búsqueda web. Solo incluyes información que aparece explícitamente en los resultados.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    return parsed.providers || [];
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
      location: location,
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

  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};
  
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

    // 1. Búsqueda web real con Tavily
    const tavilyResults = await searchTavily(query, formattedLocation);
    
    logger.info('[ai-suppliers-tavily] Resultados de Tavily obtenidos', {
      count: tavilyResults.length
    });

    if (tavilyResults.length === 0) {
      return res.json([]);
    }

    // 2. Estructurar con OpenAI
    const structuredProviders = await structureResults(
      tavilyResults,
      query,
      servicioSeleccionado,
      formattedLocation,
      budget
    );

    // DEBUG: Imprimir información detallada de imágenes
    console.log('🖼️  [TAVILY DEBUG] Proveedores estructurados:', structuredProviders.length);
    console.log('🖼️  [TAVILY DEBUG] Primer proveedor:', JSON.stringify(structuredProviders[0], null, 2));
    
    logger.info('[ai-suppliers-tavily] Proveedores estructurados', {
      count: structuredProviders.length,
      firstProvider: structuredProviders[0]?.title || 'N/A',
      hasImage: !!structuredProviders[0]?.image,
      imageUrl: structuredProviders[0]?.image || 'N/A'
    });

    res.json(structuredProviders);

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
