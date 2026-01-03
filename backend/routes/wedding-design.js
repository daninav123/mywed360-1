import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID || 'proj_7IWFKysvJciPmnkpqop9rrpT',
});

/**
 * POST /api/wedding-design/chat
 * Chat IA para ayudar a diseñar la boda y especificar proveedores
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context, phase } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Construir system prompt según el contexto
    const systemPrompt = buildSystemPrompt(context, phase);

    logger.info('[wedding-design-chat] Procesando mensaje:', {
      messageLength: message.length,
      phase: phase || 'general',
      hasContext: !!context,
    });

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    // Intentar extraer actualizaciones estructuradas de la respuesta
    const updates = extractStructuredUpdates(response, context);

    res.json({
      success: true,
      response,
      updates, // Cambios sugeridos a weddingDesign o supplierRequirements
      usage: completion.usage,
    });
  } catch (error) {
    logger.error('[wedding-design-chat] Error:', error);
    res.status(500).json({
      error: 'Error procesando mensaje',
      message: error.message,
    });
  }
});

/**
 * Construir system prompt según contexto
 */
function buildSystemPrompt(context = {}, phase = 'general') {
  const { weddingInfo, weddingDesign, supplierRequirements, currentSection, currentCategory } =
    context;

  let basePrompt = `Eres un wedding designer experto y amigable que ayuda a parejas a planificar su boda perfecta.

Tu objetivo es:
1. Descubrir el estilo único de la pareja
2. Ayudarles a tomar decisiones de diseño
3. Definir especificaciones claras para proveedores
4. Documentar todas sus preferencias

REGLAS DE ORO:
- Sé conversacional, cálido y entusiasta
- Haz preguntas abiertas pero ofrece opciones concretas
- Valida siempre sus ideas ("¡Me encanta!", "Genial elección")
- Sugiere pero nunca impongas
- Usa emojis con moderación para dar personalidad
- Sé breve pero útil (máximo 3-4 párrafos por respuesta)
- Si mencionan algo específico, profundiza en ello

INFORMACIÓN ACTUAL DE LA BODA:
${
  weddingInfo
    ? `- Fecha: ${weddingInfo.weddingDate || 'No definida'}
- Lugar: ${weddingInfo.celebrationPlace || 'No definido'}
- Estilo general: ${weddingInfo.weddingStyle || 'No definido'}
- Invitados: ${weddingInfo.numGuests || 'No definido'}`
    : 'No hay información básica todavía'
}

${weddingDesign?.vision?.overallStyle?.primary ? `ESTILO ELEGIDO: ${weddingDesign.vision.overallStyle.primary}` : ''}
${weddingDesign?.vision?.mood?.atmosphere ? `AMBIENTE: ${weddingDesign.vision.mood.atmosphere}` : ''}
`;

  // Prompts específicos según sección
  if (currentSection === 'vision') {
    basePrompt += `

CONTEXTO: Estás ayudando a definir la VISIÓN Y ESTILO general de la boda.

ENFOQUE:
- Pregunta por sus referencias (Pinterest, bodas que han visto)
- Ayúdales a identificar su estilo (rústico, moderno, clásico, etc.)
- Define el ambiente/mood que quieren crear
- Identifica elementos que SÍ quieren y los que NO quieren
- Detecta elementos imprescindibles

EJEMPLOS DE PREGUNTAS:
- "¿Qué os atrae de ese estilo?"
- "¿Preferís algo más íntimo o festivo?"
- "¿Hay algún color o elemento que NO queráis ver en vuestra boda?"
`;
  } else if (currentCategory) {
    const categoryName = getCategoryName(currentCategory);
    basePrompt += `

CONTEXTO: Estás ayudando a definir especificaciones para: ${categoryName}

ENFOQUE:
- Identifica requisitos técnicos específicos
- Sugiere extras populares para esta categoría
- Pregunta por experiencias previas o referencias
- Define presupuesto orientativo
- Documenta preferencias claras

${getCategorySpecificPrompt(currentCategory)}
`;
  }

  return basePrompt;
}

/**
 * Obtener nombre de categoría
 */
function getCategoryName(categoryId) {
  const names = {
    fotografia: 'Fotografía',
    video: 'Vídeo',
    dj: 'DJ',
    musica: 'Música',
    catering: 'Catering',
    animacion: 'Animación',
    iluminacion: 'Iluminación',
  };
  return names[categoryId] || categoryId;
}

/**
 * Prompts específicos por categoría
 */
function getCategorySpecificPrompt(categoryId) {
  const prompts = {
    fotografia: `
EXTRAS IMPORTANTES:
- Dron para fotos aéreas (muy popular y espectacular)
- Sesión pre-boda/engagement
- Álbum físico premium
- Visita previa al lugar

PREGUNTAS CLAVE:
- "¿Os gustaría tener fotos aéreas con dron? Dan una perspectiva increíble"
- "¿Cuántas horas necesitáis? (típicamente 6-10 horas)"
- "¿Estilo natural/espontáneo o más posado?"
`,
    video: `
EXTRAS IMPORTANTES:
- Dron para vídeo aéreo
- Highlights (resumen corto de 3-5 min)
- Same day edit (vídeo el mismo día)
- Ceremonia completa vs highlights

PREGUNTAS CLAVE:
- "¿Queréis vídeo aéreo con dron?"
- "¿Preferís un vídeo corto emotivo o toda la ceremonia completa?"
`,
    dj: `
EFECTOS ESPECIALES POPULARES:
- ⭐ Fuego frío (cold sparks) - seguro y espectacular
- ⭐ Confeti
- Máquina de humo
- Cañones CO2
- Luces LED

PREGUNTAS CLAVE:
- "¿Qué efectos especiales os gustarían? El fuego frío es brutal para el primer baile"
- "¿En qué momento queréis el efecto? (primer baile, corte tarta, etc.)"
- "¿Géneros musicales que no pueden faltar?"
`,
    animacion: `
EFECTOS DISPONIBLES:
- Fuegos artificiales
- Fuego frío
- Confeti
- Burbujas
- Palomas

PREGUNTAS CLAVE:
- "¿Queréis fuegos artificiales al final de la noche?"
- "¿Espectáculo interactivo o exhibición?"
`,
    iluminacion: `
OPCIONES POPULARES:
- Iluminación ambiental (uplighting)
- Proyección de nombres/logo (gobo)
- Luces de hadas (fairy lights)
- Neón personalizado

PREGUNTAS CLAVE:
- "¿Queréis proyectar vuestros nombres en algún sitio?"
- "¿Preferís luz cálida o puedo sugerir algún color especial?"
`,
  };

  return prompts[categoryId] || '';
}

/**
 * Extraer actualizaciones estructuradas de la respuesta
 */
function extractStructuredUpdates(response, context) {
  const updates = {};

  // Buscar menciones de extras específicos
  const extraKeywords = {
    drone: /dron|drone|aéreo|aerial/i,
    coldSparks: /fuego\s+frío|cold\s+spark/i,
    confetti: /confeti|confetti/i,
    fireworks: /fuegos\s+artificiales|firework/i,
    smoke: /humo|smoke/i,
    gobo: /proyec.*nombre|gobo|proyec.*logo/i,
  };

  // Si la respuesta sugiere algo, marcarlo
  for (const [key, regex] of Object.entries(extraKeywords)) {
    if (regex.test(response)) {
      if (!updates.suggestions) updates.suggestions = [];
      updates.suggestions.push(key);
    }
  }

  return updates;
}

export default router;
