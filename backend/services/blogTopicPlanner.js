import { addDays, formatISO, parseISO, startOfDay } from 'date-fns';

import logger from '../utils/logger.js';
import { getOpenAiClient } from './blogAiService.js';

const DEFAULT_TOPICS_MODEL =
  process.env.OPENAI_MODEL_BLOG_PLAN ||
  process.env.OPENAI_MODEL_BLOG ||
  process.env.OPENAI_MODEL ||
  'gpt-4o-mini';

function normalizeStartDate(startDate) {
  if (!startDate) return startOfDay(new Date());
  if (startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
    return startOfDay(startDate);
  }
  const parsed = parseISO(String(startDate));
  if (Number.isNaN(parsed.getTime())) return startOfDay(new Date());
  return startOfDay(parsed);
}

function createFallbackPlan(startDate, days, language = 'es') {
  const themes = [
    'Tendencias de decoración',
    'Proveedores locales destacados',
    'Consejos para la ceremonia',
    'Inspiración para banquetes',
    'Moda nupcial',
    'Fotografía y vídeo',
    'Bienestar de los novios',
    'Planificación financiera',
    'Ideas para bodas civiles',
    'Experiencias de parejas Planivia',
  ];

  const entries = [];
  for (let index = 0; index < days; index += 1) {
    const date = addDays(startDate, index);
    const theme = themes[index % themes.length];
    const isoDate = formatISO(date, { representation: 'date' });
    entries.push({
      date: isoDate,
      topic: language.startsWith('en')
        ? `${theme} - wedding inspiration`
        : `${theme} para bodas modernas en España`,
      angle: language.startsWith('en')
        ? 'Actionable tips for engaged couples'
        : 'Consejos prácticos para parejas que se casan',
      keywords: ['planivia', 'bodas', 'proveedores'],
      tone: language.startsWith('en') ? 'warm expert' : 'experto cercano',
      audience: language.startsWith('en') ? 'engaged couples' : 'parejas comprometidas',
      language,
    });
  }
  return entries;
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function generateDailyTopicPlan({
  startDate,
  days = 30,
  language = 'es',
  focus = 'bodas',
} = {}) {
  const normalizedStart = normalizeStartDate(startDate);
  const normalizedDays = Math.max(7, Math.min(days, 120));
  const languageCode = String(language || 'es')
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'es';

  try {
    const client = await getOpenAiClient();
    const systemPrompt =
      languageCode === 'en'
        ? 'You are a senior wedding content strategist for Planivia. Build practical daily blog topics tailored to engaged couples in Spain.'
        : 'Eres estratega senior de contenidos de bodas para Planivia. Diseñas temas diarios accionables para parejas que se casan en España.';

    const userPrompt =
      languageCode === 'en'
        ? `Create a daily editorial plan covering ${normalizedDays} consecutive days starting on ${formatISO(
            normalizedStart,
            { representation: 'date' }
          )}. Focus: ${focus}. Provide diverse angles (planning, decor, budgeting, stories, legal, trends) and align with the wedding season in Spain. Return valid JSON array with objects like:
[
  {
    "date": "2025-01-15",
    "topic": "How to plan an eco-friendly wedding menu",
    "angle": "Sustainable catering ideas for Spanish venues",
    "keywords": ["eco weddings", "wedding menu", "sustainability"],
    "tone": "warm expert",
    "audience": "engaged couples",
    "language": "en"
  }
]`
        : `Genera un plan editorial diario para ${normalizedDays} días consecutivos a partir del ${formatISO(
            normalizedStart,
            { representation: 'date' }
          )}. Enfoque: ${focus}. Alterna enfoques (planificación, decoración, presupuesto, historias reales, trámites, tendencias) teniendo en cuenta la temporada de bodas en España. Devuelve JSON válido con objetos así:
[
  {
    "date": "2025-01-15",
    "topic": "Cómo planificar un menú de boda sostenible sin perder el sabor",
    "angle": "Ideas eco-friendly para caterings en fincas españolas",
    "keywords": ["boda sostenible", "menú de boda", "catering eco"],
    "tone": "experto cercano",
    "audience": "parejas comprometidas",
    "language": "es"
  }
]`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_TOPICS_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = completion?.choices?.[0]?.message?.content || '';
    const safeJson = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1);
    const parsed = JSON.parse(safeJson);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('topic-plan-empty');
    }

    const entries = parsed.slice(0, normalizedDays).map((item, index) => {
      const defaultDate = addDays(normalizedStart, index);
      const parsedDate = item.date ? parseISO(String(item.date)) : defaultDate;
      const isoDate = Number.isNaN(parsedDate.getTime())
        ? formatISO(defaultDate, { representation: 'date' })
        : formatISO(parsedDate, { representation: 'date' });
      return {
        date: isoDate,
        topic: String(item.topic || '').trim() || 'Tema pendiente de definir',
        angle: String(item.angle || '').trim(),
        keywords: sanitizeArray(item.keywords || item.tags),
        tone: String(
          item.tone || (languageCode === 'en' ? 'warm expert' : 'experto cercano')
        ).trim(),
        audience: String(
          item.audience || (languageCode === 'en' ? 'engaged couples' : 'parejas comprometidas')
        ).trim(),
        language: item.language ? String(item.language).toLowerCase() : languageCode,
      };
    });

    return {
      source: 'openai',
      entries,
      raw: {
        response: text,
        id: completion.id,
        created: completion.created,
        usage: completion.usage,
      },
    };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || error?.status || 'unknown';
    logger.error('[blogTopicPlanner] generateDailyTopicPlan failed:', {
      message: errorMsg,
      code: errorCode,
      type: error?.constructor?.name,
    });
    return {
      source: 'fallback',
      entries: createFallbackPlan(normalizedStart, normalizedDays, languageCode),
      raw: { error: errorMsg, code: errorCode },
    };
  }
}
