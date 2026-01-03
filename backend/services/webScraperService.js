/**
 * 🌐 Web Scraper Service
 * 
 * Analiza websites de proveedores para detectar servicios ofrecidos
 * y mejorar la clasificación automática
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../config/firebase.js';
import OpenAI from 'openai';

let openaiClient = null;
let openaiClientConfig = { apiKeyPrefix: null, projectId: null };

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || null;

  const apiKeyPrefix = apiKey ? apiKey.slice(0, 8) : null;

  if (!apiKey) return null;

  if (openaiClient && openaiClientConfig.apiKeyPrefix === apiKeyPrefix && openaiClientConfig.projectId === projectId) {
    return openaiClient;
  }

  openaiClient = new OpenAI({
    apiKey,
    project: projectId || undefined,
    timeout: 25000,
    maxRetries: 2,
  });

  openaiClientConfig = { apiKeyPrefix, projectId };
  console.log('✅ [WebScraper] Cliente OpenAI inicializado', {
    projectId: projectId || null,
  });

  return openaiClient;
}

/**
 * Analiza la web de un proveedor para extraer servicios
 * @param {string} url - URL del website a analizar
 * @param {string} supplierName - Nombre del proveedor
 * @returns {Promise<Object>} Análisis del website
 */
/**
 * Extrae email de contacto de la página
 * @param {CheerioAPI} $ - Instancia de cheerio
 * @param {string} html - HTML completo de la página
 * @returns {string|null} Email de contacto encontrado
 */
function extractEmailFromPage($, html) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = [];
  
  // 1. Buscar en enlaces mailto:
  $('a[href^="mailto:"]').each((i, el) => {
    const href = $(el).attr('href');
    const match = href.match(/mailto:([^?]+)/i);
    if (match && match[1]) {
      emails.push(match[1].toLowerCase().trim());
    }
  });
  
  // 2. Buscar en el HTML completo
  const htmlMatches = html.match(emailRegex) || [];
  htmlMatches.forEach(email => {
    const cleanEmail = email.toLowerCase().trim();
    // Filtrar emails comunes de tracking/analytics
    if (!cleanEmail.includes('example.com') && 
        !cleanEmail.includes('test.com') &&
        !cleanEmail.includes('sentry.io') &&
        !cleanEmail.includes('google') &&
        !cleanEmail.includes('facebook') &&
        !cleanEmail.includes('tracking')) {
      emails.push(cleanEmail);
    }
  });
  
  // 3. Priorizar emails típicos de contacto
  const priorityEmails = emails.filter(email => 
    email.includes('info@') || 
    email.includes('contacto@') ||
    email.includes('contact@') ||
    email.includes('hola@')
  );
  
  // Retornar el más probable (primero los prioritarios)
  const uniqueEmails = [...new Set([...priorityEmails, ...emails])];
  const foundEmail = uniqueEmails.length > 0 ? uniqueEmails[0] : null;
  
  if (foundEmail) {
    logger.info('[WebScraper] Email encontrado', { emailFound: true });
  }
  
  return foundEmail;
}

/**
 * Extrae enlaces internos relevantes de una página
 * @param {CheerioAPI} $ - Instancia de cheerio
 * @param {string} baseUrl - URL base del sitio
 * @returns {Array<string>} URLs de páginas relevantes
 */
function extractRelevantInternalLinks($, baseUrl) {
  const links = new Set();
  const baseHost = new URL(baseUrl).hostname;
  
  // Keywords que indican páginas con info de servicios
  const relevantKeywords = [
    'servicio', 'service', 'que-hace', 'what-we-do', 'nosotros', 'about',
    'ofrece', 'offer', 'portfolio', 'boda', 'wedding', 'musica', 'music',
    'dj', 'sonido', 'audio', 'especialidad', 'specialty'
  ];
  
  $('a[href]').each((i, el) => {
    let href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    
    try {
      // Convertir a URL absoluta
      const linkUrl = new URL(href, baseUrl);
      
      // Solo enlaces del mismo dominio
      if (linkUrl.hostname !== baseHost) return;
      
      // Evitar PDFs, imágenes, etc.
      const path = linkUrl.pathname.toLowerCase();
      if (path.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/)) return;
      
      // Buscar keywords relevantes en la URL o el texto del enlace
      const linkText = $(el).text().toLowerCase();
      const fullUrl = linkUrl.href.toLowerCase();
      
      const isRelevant = relevantKeywords.some(kw => 
        fullUrl.includes(kw) || linkText.includes(kw)
      );
      
      if (isRelevant && links.size < 10) {
        links.add(linkUrl.href);
      }
    } catch (e) {
      // Ignorar URLs inválidas
    }
  });
  
  return Array.from(links).slice(0, 3); // Max 3 páginas adicionales
}

/**
 * Fetch y parsea una página con timeout
 * @param {string} url - URL a analizar
 * @param {number} timeout - Timeout en ms
 * @returns {Promise<CheerioAPI|null>} Instancia de cheerio o null si falla
 */
async function fetchAndParse(url, timeout = 15000) {
  try {
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyWed360Bot/1.0; +https://mywed360.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });
    return cheerio.load(response.data);
  } catch (error) {
    console.warn(`⚠️ [WebScraper] No se pudo cargar ${url}:`, error.message);
    return null;
  }
}

export async function analyzeSupplierWebsite(url, supplierName = '') {
  try {
    console.log(`🌐 [WebScraper] Analizando: ${url}`);

    // 1. Fetch HTML de la home con timeout
    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaLoveBot/1.0; +https://malove.app)',
      },
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // 2. Extraer textos relevantes
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    
    // 2b. Extraer emails de contacto
    const contactEmail = extractEmailFromPage($, html);
    
    // 3. Extraer encabezados
    const h1s = $('h1').map((i, el) => $(el).text().trim()).get();
    const h2s = $('h2').map((i, el) => $(el).text().trim()).get();
    const h3s = $('h3').map((i, el) => $(el).text().trim()).get();
    
    // 4. Buscar secciones de servicios
    const serviceSections = [];
    $('section, div, article').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const hasServiceKeywords = 
        text.includes('servicio') || 
        text.includes('ofrecemos') || 
        text.includes('especialidad') ||
        text.includes('qué hacemos') ||
        text.includes('nuestros servicios') ||
        text.includes('lo que hacemos');
      
      if (hasServiceKeywords && text.length < 2000 && text.length > 50) {
        serviceSections.push($(el).text().trim());
      }
    });

    // 5. Extraer listas (suelen contener servicios)
    const lists = [];
    $('ul, ol').each((i, el) => {
      const listText = $(el).text().trim();
      if (listText.length > 20 && listText.length < 1000) {
        lists.push(listText);
      }
    });

    // 6. Extraer y crawlear páginas internas relevantes
    const internalLinks = extractRelevantInternalLinks($, url);
    console.log(`🔗 [WebScraper] Enlaces internos relevantes encontrados: ${internalLinks.length}`);
    
    const additionalTexts = [];
    for (const link of internalLinks) {
      console.log(`  📄 [WebScraper] Analizando página interna: ${link}`);
      const $internal = await fetchAndParse(link, 5000);
      if ($internal) {
        const internalH1s = $internal('h1').map((i, el) => $internal(el).text().trim()).get();
        const internalH2s = $internal('h2').map((i, el) => $internal(el).text().trim()).get();
        const internalSections = [];
        
        $internal('section, div, article').each((i, el) => {
          const text = $internal(el).text().toLowerCase();
          const hasServiceKeywords = 
            text.includes('servicio') || text.includes('ofrecemos') || 
            text.includes('especialidad') || text.includes('qué hacemos');
          
          if (hasServiceKeywords && text.length < 2000 && text.length > 50) {
            internalSections.push($internal(el).text().trim());
          }
        });
        
        additionalTexts.push([
          ...internalH1s,
          ...internalH2s.slice(0, 5),
          ...internalSections.slice(0, 2)
        ].join(' '));
      }
    }

    // 7. Combinar todo el texto relevante (home + páginas internas)
    const fullText = [
      title,
      metaDescription,
      metaKeywords,
      ...h1s,
      ...h2s,
      ...h3s.slice(0, 10),
      ...serviceSections.slice(0, 3),
      ...lists.slice(0, 5),
      ...additionalTexts, // Texto de páginas internas
    ].join(' ').substring(0, 12000); // Límite total aumentado

    // 8. Detectar servicios usando OpenAI
    const { services: detectedServices, meta: aiMeta } = await detectServicesWithAI(fullText, supplierName);

    console.log(`✅ [WebScraper] Análisis completado. Servicios detectados: ${detectedServices.length}`);

    return {
      success: true,
      url,
      analyzedAt: new Date().toISOString(),
      data: {
        title,
        metaDescription,
        h1s: h1s.slice(0, 3),
        h2s: h2s.slice(0, 5),
        serviceSections: serviceSections.slice(0, 2),
        detectedServices,
        aiUsed: !!aiMeta?.aiUsed,
        fullText: fullText.substring(0, 3000), // Guardar muestra
        contactEmail, // Email extraído de la web
      }
    };
    
  } catch (error) {
    console.error(`❌ [WebScraper] Error analizando ${url}:`, error.message);
    return {
      success: false,
      url,
      error: error.message,
      errorType: error.code || 'UNKNOWN'
    };
  }
}

/**
 * Detecta servicios de boda usando OpenAI
 * @param {string} text - Texto de la web a analizar
 * @param {string} supplierName - Nombre del proveedor
 * @returns {Promise<Array>} Lista de servicios detectados con IA
 */
async function detectServicesWithAI(text, supplierName = '') {
  try {
    console.log(`🤖 [AI Classifier] Analizando ${supplierName}...`);

    const openai = getOpenAIClient();
    if (!openai) {
      console.warn('⚠️ [AI Classifier] OPENAI_API_KEY no está configurada. Usando fallback por keywords.');
      return { services: detectServicesFromText(text, supplierName), meta: { aiUsed: false, reason: 'missing_api_key' } };
    }
    
    const prompt = `Eres un experto en clasificación de proveedores de bodas en España.

Analiza el siguiente texto de la página web de "${supplierName}" y determina qué servicios de boda ofrece.

SERVICIOS POSIBLES (lee las definiciones con atención):

- fotografia: Fotógrafos profesionales de bodas, reportajes fotográficos
- video: Videógrafos, cinematografía de bodas, producción audiovisual DE LA CEREMONIA Y EVENTO
- musica: Música para bodas - incluye bandas, orquestas, músicos en vivo, DJs, empresas de sonido/audio, alquiler de equipos de audio, empresas de eventos musicales. SI ofrecen música/DJs/sonido como servicio principal → ES "musica", aunque también organicen eventos.
- catering: Catering, banquetes, comida, servicio de comida
- lugares: Salones, fincas, haciendas, masías, espacios para eventos y celebraciones
- decoracion: Decoración de eventos, ambientación
- flores-decoracion: Flores, floristería, ramos, arreglos florales
- organizacion: Wedding planners PUROS, organizadores/coordinadores de bodas. SOLO si NO mencionan música/DJs/sonido como servicio. Si hablan de música → NO es "organizacion", es "musica".
- animacion: Animación, animadores, magos, espectáculos, shows
- photocall: Photocall, photobooth, fotomatón, cabina de fotos, props, atrezzo fotográfico
- vestidos-novia: Vestidos de novia, tiendas nupciales, moda nupcial femenina
- trajes-novio: Trajes de novio, sastrería para novios, moda nupcial masculina
- vestidos-trajes: Tiendas que venden TANTO vestidos de novia COMO trajes de novio
- joyeria: Joyería, anillos de compromiso, alianzas, joyas para novios
- tartas: Tartas de boda, pastelería nupcial, mesas dulces, candy bar
- belleza: Maquillaje, peluquería, estética para novias/os, tratamientos de belleza
- transporte: Alquiler de coches para bodas, limusinas, autobuses, transporte de invitados
- invitaciones: Invitaciones de boda, papelería nupcial, tarjetas, caligrafía
- detalles: Detalles para invitados, regalos, recuerdos de boda
- fuegos-artificiales: Fuegos artificiales, pirotecnia, efectos especiales
- otros: Solo si NO encaja claramente en ninguna categoría anterior

IMPORTANTE - REGLAS DE CLASIFICACIÓN:

1. MÚSICA (categoría PRIORITARIA para servicios de audio/sonido/DJs):
• Si mencionan: DJs, sonido, audio, equipos de música, animación musical, bandas, disc jockey → SIEMPRE ES "musica"
• "Alkilaudio", "ReSona Events", "Audioprobe", "Gente de Bien" → TODOS son "musica"
• "eventos con DJ", "sonido para bodas", "alquiler audio", "música para eventos", "producción musical" → ES "musica"
• Empresas de eventos que ofrecen música/DJs/sonido como servicio → "musica", NO "organizacion"
• Si hablan de música/sonido Y ADEMÁS organizan → ES "musica" (la música es más específica)
• Si es empresa de EVENTOS/PRODUCCIÓN sin mencionar grabar/filmar → ES "musica", NO "video"

2. VÍDEO (SOLO grabación/filmación):
• SOLAMENTE si mencionan explícitamente: "grabar", "filmar", "cinematografía", "videógrafo", "cámara", "grabación de bodas" → ES "video"
• Si dicen "producción de eventos", "eventos", "audiovisual" pero NO mencionan grabar/filmar → NO es "video", es "musica"
• "Audiovisual" en contexto de eventos (sonido+luces) → ES "musica", NO "video"
• "Audiovisual" en contexto de grabación/filmación → ES "video"

3. ORGANIZACIÓN (SOLO wedding planners SIN servicios de música):
• EXCLUSIVAMENTE para wedding planners/coordinadores que NO ofrecen música/DJs/sonido
• Si mencionan aunque sea UNA VEZ música/sonido/DJ → ES "musica", NO "organizacion"
• "Organizamos eventos con DJ" → ES "musica", NO "organizacion"
• "Wedding planner" sin mencionar música → "organizacion"

EJEMPLOS CRÍTICOS:
• "Audioprobe - producción de eventos con sonido" → musica (NO organizacion, NO dj)
• "Alkilaudio - alquiler de audio profesional" → musica
• "Gente de Bien - eventos con DJs y música" → musica (NO organizacion)
• "ReSona Events - producción de eventos" → musica (empresa de eventos musicales)
• "Organizamos bodas con DJ y animación" → musica (NO organizacion - mencionan DJ)
• "DJ profesional para bodas" → musica
• "Empresa de sonido e iluminación" → musica
• "Videógrafo, grabamos tu ceremonia" → video (menciona grabar/filmar)
• "Wedding planner, coordinamos tu boda" (SIN mencionar música) → organizacion

TEXTO DE LA WEB:
${text.substring(0, 5000)}

Responde SOLO con un JSON con este formato exacto:
{
  "services": [
    {"category": "categoria", "confidence": 85, "reason": "breve razón"}
  ]
}

REGLAS IMPORTANTES:
- confidence debe ser un número entre 0-100
- Si ofrece múltiples servicios, incluye todos
- NUNCA uses "dj" como categoría - usa "musica" en su lugar
- Para cualquier servicio de audio, sonido, DJ, música → SIEMPRE usa "musica"
- Si no estás seguro de nada, retorna [{"category": "otros", "confidence": 50, "reason": "No se puede determinar"}]
- Ordena por confidence descendente`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    console.log(`📄 [AI Classifier] Texto enviado a OpenAI (primeros 800 chars):`);
    console.log(text.substring(0, 800));
    console.log(`... (total: ${text.length} caracteres)`);
    
    const rawResponse = response.choices[0].message.content;
    console.log(`📝 [AI Classifier] Respuesta RAW de OpenAI:`, rawResponse);
    
    const result = JSON.parse(rawResponse);
    console.log(`✅ [AI Classifier] Servicios detectados:`, result.services);
    
    // Post-procesamiento automático
    if (result.services) {
      // 1. Reemplazar dj → musica (categoría deprecada)
      result.services = result.services.map(service => {
        if (service.category === 'dj') {
          console.log(`⚠️ [AI Classifier] Reemplazo: "dj" → "musica"`);
          return { ...service, category: 'musica' };
        }
        return service;
      });
      
      // 2. Análisis automático de keywords para corrección
      const textLower = text.toLowerCase();
      const musicKeywords = ['dj', 'disc jockey', 'música', 'musica', 'sonido', 'audio', 'equipo de sonido', 'alquiler de audio', 'sonorización', 'iluminación musical', 'animación musical'];
      const videoKeywords = ['videógrafo', 'videografo', 'grabar', 'filmar', 'filmación', 'grabación', 'cámara', 'cinematografía'];
      
      // Contar menciones
      const musicCount = musicKeywords.filter(kw => textLower.includes(kw)).length;
      const videoCount = videoKeywords.filter(kw => textLower.includes(kw)).length;
      
      console.log(`🔍 [AI Classifier] Análisis keywords - Música: ${musicCount}, Video: ${videoCount}`);
      
      const hasMusica = result.services.some(s => s.category === 'musica');
      const hasOrganizacion = result.services.some(s => s.category === 'organizacion');
      
      // Si tiene muchas keywords de música (>=3) pero OpenAI no detectó música
      if (musicCount >= 3 && !hasMusica) {
        console.log(`🎵 [AI Classifier] Corrección automática: ${musicCount} keywords de música detectadas - añadiendo categoría`);
        result.services.unshift({
          category: 'musica',
          confidence: Math.min(85 + (musicCount * 2), 95),
          reason: `Detectadas ${musicCount} menciones de servicios musicales/audio en el texto`
        });
      }
      
      // Si clasificaron como organización pero hay keywords de música y NO de video
      if (hasOrganizacion && musicCount >= 2 && videoCount === 0 && !hasMusica) {
        console.log(`🎵 [AI Classifier] Corrección: Empresa de organización con servicios de música - priorizando música`);
        result.services.unshift({
          category: 'musica',
          confidence: 85,
          reason: 'Empresa de eventos con servicios de música/DJ detectados'
        });
      }
    }
    
    return { services: result.services || [], meta: { aiUsed: true } };
    
  } catch (error) {
    console.error(`❌ [AI Classifier] Error:`, error.message);
    // Fallback a detección por keywords
    return { services: detectServicesFromText(text, supplierName), meta: { aiUsed: false, reason: 'openai_error', error: error.message } };
  }
}

/**
 * Fallback: Detecta servicios de boda en el texto usando keywords
 * @param {string} text - Texto a analizar
 * @param {string} supplierName - Nombre del proveedor
 * @returns {Array} Lista de servicios detectados
 */
function detectServicesFromText(text, supplierName = '') {
  const normalized = text.toLowerCase();
  const services = [];

  // Combinar nombre + texto para análisis más completo
  const fullContext = `${supplierName} ${text}`.toLowerCase();

  // DJ - Múltiples variantes (mapear a musica: categoría 'dj' deprecada)
  const djKeywords = ['dj ', ' dj', 'disc jockey', 'discjockey', 'pincha', 'disc-jockey'];
  const djMatches = djKeywords.filter(kw => fullContext.includes(kw)).length;
  if (djMatches > 0) {
    services.push({
      category: 'musica',
      confidence: Math.min(95, 70 + (djMatches * 10)),
      evidence: `Menciones de DJ: ${djMatches}`
    });
  }

  // Música - Bandas, orquestas, músicos
  const musicKeywords = ['música', 'musica', 'banda', 'orquesta', 'músico', 'musico', 'grupo musical', 'conjunto musical'];
  const musicMatches = musicKeywords.filter(kw => normalized.includes(kw)).length;
  if (musicMatches > 0) {
    services.push({ 
      category: 'musica', 
      confidence: Math.min(90, 65 + (musicMatches * 8)),
      evidence: `Menciones de música: ${musicMatches}`
    });
  }

  // Sonido / Audio (fuerte indicador de Música + DJ)
  const audioKeywords = ['sonido', 'audio', 'equipos de sonido', 'equipos de audio', 'iluminación', 'alquiler audio', 'alquiler sonido'];
  const audioMatches = audioKeywords.filter(kw => normalized.includes(kw)).length;
  if (audioMatches > 0) {
    // Si detecta audio pero no DJ ni música, añadir ambos con alta confidence
    if (services.length === 0) {
      services.push({ 
        category: 'musica', 
        confidence: 85,
        evidence: `Empresa de audio/sonido: ${audioMatches} menciones`
      });
    } else {
      // Boost a servicios ya detectados
      services.forEach(s => {
        if (s.category === 'musica') {
          s.confidence = Math.min(95, s.confidence + 15);
          s.evidence += ' + equipos audio/sonido';
        }
      });
    }
  }

  // Fotografía
  const photoKeywords = ['fotograf', 'photo', 'fotografo', 'sesión fotográfica', 'reportaje fotográfico'];
  if (photoKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'fotografia', 
      confidence: 95,
      evidence: 'Menciones de fotografía'
    });
  }

  // Vídeo (solo grabación/filmación; evitar falsos positivos por “audiovisual” de sonido/luces)
  const videoKeywords = ['videógrafo', 'videografo', 'grabación', 'grabacion', 'grabar', 'filmar', 'filmación', 'filmacion', 'cinematograf', 'cámara', 'camara', 'rodaje'];
  if (videoKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'video', 
      confidence: 95,
      evidence: 'Menciones de vídeo'
    });
  }

  // Catering
  const cateringKeywords = ['catering', 'banquete', 'menú', 'menu', 'gastronomía', 'gastronómica', 'cocina', 'chef'];
  const cateringMatches = cateringKeywords.filter(kw => normalized.includes(kw)).length;
  if (cateringMatches >= 2) {
    services.push({ 
      category: 'catering', 
      confidence: Math.min(95, 70 + (cateringMatches * 8)),
      evidence: `Menciones de catering: ${cateringMatches}`
    });
  }

  // Lugares / Venues
  const venueKeywords = ['salon', 'salón', 'finca', 'hacienda', 'venue', 'espacio', 'celebración'];
  const venueMatches = venueKeywords.filter(kw => normalized.includes(kw)).length;
  if (venueMatches >= 2) {
    services.push({ 
      category: 'lugares', 
      confidence: Math.min(90, 65 + (venueMatches * 7)),
      evidence: `Menciones de lugares: ${venueMatches}`
    });
  }

  // Decoración
  const decorKeywords = ['decoración', 'decoracion', 'ambientación', 'ambientacion', 'montaje', 'flores'];
  if (decorKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'decoracion', 
      confidence: 85,
      evidence: 'Menciones de decoración'
    });
  }

  // Flores
  const flowerKeywords = ['flores', 'florista', 'floristería', 'floristeria', 'ramo', 'arreglo floral'];
  if (flowerKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'flores-decoracion', 
      confidence: 90,
      evidence: 'Menciones de flores'
    });
  }

  // Wedding Planner (solo si NO hay señales claras de musica)
  const hasMusica = services.some(s => s.category === 'musica');
  const plannerKeywords = ['wedding planner', 'organizador', 'coordinador', 'planificador', 'organización'];
  if (!hasMusica && plannerKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'organizacion', 
      confidence: 85,
      evidence: 'Menciones de organización'
    });
  }

  // Photocall (separado de animación)
  const photocallKeywords = ['photocall', 'photobooth', 'fotomaton', 'foto maton', 'cabina fotos', 'corner fotos'];
  if (photocallKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'photocall', 
      confidence: 85,
      evidence: 'Menciones de photocall/photobooth'
    });
  }

  // Animación (sin photocall)
  const entertainmentKeywords = ['animación', 'animacion', 'animador', 'entretenimiento', 'mago', 'espectaculo'];
  if (entertainmentKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'animacion', 
      confidence: 80,
      evidence: 'Menciones de animación'
    });
  }

  // Joyería
  const jewelryKeywords = ['joyería', 'joyeria', 'anillos', 'alianzas', 'pendientes', 'joyas', 'brillantes'];
  if (jewelryKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'joyeria', 
      confidence: 90,
      evidence: 'Menciones de joyería'
    });
  }

  // Tartas
  const cakeKeywords = ['tarta', 'pastel', 'repostería', 'reposteria', 'dulces', 'mesa dulce', 'candy bar', 'pastelería', 'pasteleria'];
  if (cakeKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'tartas', 
      confidence: 90,
      evidence: 'Menciones de tartas/repostería'
    });
  }

  // Belleza
  const beautyKeywords = ['maquillaje', 'peluquería', 'peluqueria', 'estética', 'estetica', 'peinado', 'makeup', 'belleza'];
  if (beautyKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'belleza', 
      confidence: 90,
      evidence: 'Menciones de belleza'
    });
  }

  // Transporte
  const transportKeywords = ['limusina', 'coche clásico', 'autobús', 'autobus', 'transporte', 'vehículo', 'chofer'];
  if (transportKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'transporte', 
      confidence: 90,
      evidence: 'Menciones de transporte'
    });
  }

  // Invitaciones
  const inviteKeywords = ['invitaciones', 'tarjetas', 'papelería', 'papeleria', 'caligrafía', 'caligrafia', 'imprenta'];
  if (inviteKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'invitaciones', 
      confidence: 85,
      evidence: 'Menciones de invitaciones'
    });
  }

  // Detalles
  const favorKeywords = ['detalles', 'regalos', 'recuerdos', 'souvenirs', 'obsequios'];
  if (favorKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'detalles', 
      confidence: 85,
      evidence: 'Menciones de detalles/regalos'
    });
  }

  // Fuegos Artificiales
  const fireworksKeywords = ['fuegos artificiales', 'pirotecnia', 'bengalas', 'efectos especiales'];
  if (fireworksKeywords.some(kw => normalized.includes(kw))) {
    services.push({ 
      category: 'fuegos-artificiales', 
      confidence: 95,
      evidence: 'Menciones de pirotecnia'
    });
  }

  return services;
}

/**
 * Guarda análisis en caché de Firestore
 * @param {string} url - URL analizada
 * @param {Object} analysis - Resultado del análisis
 * @param {number} daysToCache - Días de validez del caché
 */
export async function cacheWebAnalysis(url, analysis, daysToCache = 30) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToCache);

    await db.collection('supplier_web_analysis').doc(encodeURIComponent(url)).set({
      url,
      ...analysis,
      cachedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    console.log(`💾 [WebScraper] Análisis guardado en caché: ${url}`);
  } catch (error) {
    console.error(`❌ [WebScraper] Error guardando caché:`, error.message);
  }
}

/**
 * Obtiene análisis desde caché
 * @param {string} url - URL a buscar
 * @returns {Promise<Object|null>} Análisis cacheado o null
 */
export async function getCachedWebAnalysis(url) {
  try {
    const doc = await db.collection('supplier_web_analysis').doc(encodeURIComponent(url)).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const expiresAt = new Date(data.expiresAt);
    
    // Verificar si expiró
    if (expiresAt < new Date()) {
      console.log(`⏰ [WebScraper] Caché expirado para: ${url}`);
      return null;
    }

    console.log(`✅ [WebScraper] Usando caché para: ${url}`);
    return data;
    
  } catch (error) {
    console.error(`❌ [WebScraper] Error leyendo caché:`, error.message);
    return null;
  }
}

export default {
  analyzeSupplierWebsite,
  detectServicesFromText,
  cacheWebAnalysis,
  getCachedWebAnalysis,
};
