import { randomUUID } from 'crypto';
import { z } from 'zod';

let openaiClient = null;

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_TOKEN || '';
const FALLBACK_COVER_PROMPT =
  'Editorial wedding photography, elegant pastel palette, minimal styling, soft natural light';
const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

async function ensureOpenAI() {
  if (openaiClient || !OPENAI_API_KEY) return openaiClient;
  const { default: OpenAI } = await import('openai');
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  return openaiClient;
}

export async function getOpenAiClient() {
  if (!OPENAI_API_KEY) {
    throw new Error('openai-missing-api-key');
  }
  const client = await ensureOpenAI();
  if (!client) {
    throw new Error('openai-client-unavailable');
  }
  return client;
}

const SectionSchema = z.object({
  heading: z.string().min(4),
  body: z.array(z.string().min(2)).nonempty(),
});

const AiResponseSchema = z.object({
  title: z.string().min(8),
  excerpt: z.string().min(32).optional(),
  sections: z.array(SectionSchema).min(2),
  tips: z.array(z.string().min(6)).optional(),
  conclusion: z.string().min(16).optional(),
  cta: z.string().min(12).optional(),
  tags: z.array(z.string().min(2)).max(8).optional(),
  coverPrompt: z.string().min(8).optional(),
});

const GenerationInputSchema = z.object({
  topic: z.string().min(6),
  language: z.string().default('es'),
  tone: z.string().default('inspiracional'),
  length: z.enum(['corto', 'medio', 'largo', 'short', 'medium', 'long']).default('medio'),
  keywords: z.array(z.string().min(2)).max(12).optional(),
  audience: z.string().optional(),
  includeTips: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
  research: z
    .object({
      summary: z.string().min(10).max(4000).optional(),
      references: z
        .array(
          z.object({
            title: z.string().min(2),
            url: z.string().url(),
            snippet: z.string().optional(),
          })
        )
        .max(12)
        .optional(),
    })
    .optional(),
});

function safeJsonParse(text = '') {
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function toTitleCase(str = '') {
  return str
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      return `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

function mapLengthToWords(length = 'medio') {
  const normalized = length.toLowerCase();
  switch (normalized) {
    case 'corto':
    case 'short':
      return 'entre 500 y 650 palabras';
    case 'largo':
    case 'long':
      return 'entre 950 y 1200 palabras';
    default:
      return 'entre 700 y 900 palabras';
  }
}

function buildResearchContext(research, language) {
  if (!research) {
    return language === 'en'
      ? 'No external research was provided. Focus on verified guidance for Spanish weddings.'
      : 'No se proporcionó investigación externa. Ofrece orientación verificada para bodas en España.';
  }

  const lines = [];
  if (research.summary) {
    lines.push(research.summary.trim());
  }

  const references = Array.isArray(research.references) ? research.references.slice(0, 6) : [];
  if (references.length > 0) {
    lines.push(language === 'en' ? 'Key references:' : 'Referencias clave:');
    references.forEach((ref, index) => {
      const title = String(ref.title || `Fuente ${index + 1}`).trim();
      const snippet = ref.snippet ? String(ref.snippet).trim() : '';
      const url = ref.url ? String(ref.url).trim() : '';
      const line = [`${index + 1}. ${title}`, url ? `(${url})` : '', snippet ? `– ${snippet}` : '']
        .filter(Boolean)
        .join(' ');
      lines.push(line);
    });
  }

  if (lines.length === 0) {
    return language === 'en'
      ? 'No external research was provided. Focus on verified guidance for Spanish weddings.'
      : 'No se proporcionó investigación externa. Ofrece orientación verificada para bodas en España.';
  }

  return lines.join('\n');
}

function buildMarkdownFromAi(ai) {
  const lines = [];
  if (ai.title) lines.push(`# ${ai.title}`, '');
  if (ai.excerpt) lines.push(ai.excerpt.trim(), '');

  if (Array.isArray(ai.sections)) {
    for (const section of ai.sections) {
      lines.push(`## ${section.heading.trim()}`, '');
      for (const paragraph of section.body) {
        lines.push(paragraph.trim(), '');
      }
    }
  }

  if (Array.isArray(ai.tips) && ai.tips.length > 0) {
    lines.push('### Consejos clave', '');
    for (const tip of ai.tips) {
      lines.push(`- ${tip.trim()}`);
    }
    lines.push('');
  }

  if (ai.conclusion) {
    lines.push('### Conclusión', '', ai.conclusion.trim(), '');
  }

  if (ai.cta) {
    lines.push('> ' + ai.cta.trim(), '');
  }

  return lines.join('\n').trim();
}

function buildExcerpt(markdown) {
  if (!markdown) return '';
  const plain = markdown
    .replace(/[#>*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 220);
}

function fallbackArticle(input) {
  const title = toTitleCase(`${input.topic} - inspiración para parejas modernas`);
  const researchSummary =
    input.research?.summary ||
    `Explora tendencias recientes relacionadas con ${input.topic}. Adapta las propuestas a distintos estilos de boda y mantén un tono ${input.tone}.`;
  const sections = [
    {
      heading: 'Ideas principales',
      body: [
        researchSummary,
        'Incluye recomendaciones prácticas y recursos útiles para comenzar a planificar.',
      ],
    },
    {
      heading: 'Cómo aplicarlo a tu boda',
      body: [
        'Propón pasos concretos, con ejemplos de proveedores y presupuestos orientativos.',
        'Aconseja combinaciones de decoración, paletas de color y moodboards.',
      ],
    },
  ];

  const tips = [
    'Define un presupuesto estimado y revisa disponibilidad de proveedores con antelación.',
    'Recopila referencias visuales para compartir con tu planner o equipo creativo.',
    'No dudes en personalizar cada idea con elementos simbólicos de la pareja.',
  ];

  const conclusion =
    'Con planificación y un buen equipo de profesionales, cualquier idea puede transformarse en un recuerdo inolvidable.';
  const cta =
    '¿Quieres más inspiración personalizada? Inicia sesión en Lovenda y descubre herramientas exclusivas.';

  const markdown = buildMarkdownFromAi({ title, excerpt: '', sections, tips, conclusion, cta });

  return {
    title,
    sections,
    tips,
    conclusion,
    cta,
    excerpt: buildExcerpt(markdown),
    markdown,
    tags: input.keywords?.slice(0, 6) || [],
    coverPrompt: FALLBACK_COVER_PROMPT,
    raw: null,
  };
}

export async function generateBlogArticle(options) {
  const input = GenerationInputSchema.parse(options || {});

  if (!OPENAI_API_KEY) {
    return { ...fallbackArticle(input), source: 'fallback' };
  }

  try {
    await ensureOpenAI();
    const client = openaiClient;

    const language = input.language?.startsWith('en') ? 'en' : 'es';
    const wordsRange = mapLengthToWords(input.length);
    const keywordsText =
      input.keywords && input.keywords.length
        ? `Palabras clave: ${input.keywords.join(', ')}.`
        : 'Palabras clave opcionales.';

    const systemPrompt =
      language === 'en'
        ? 'You are a senior wedding editor for Lovenda. You craft helpful, actionable wedding articles with a warm expert tone. Always deliver detailed advice without inventing facts that cannot be verified.'
        : 'Eres editor senior de bodas en Lovenda. Redactas artículos útiles y accionables con tono cálido y experto. Ofrece detalle práctico sin inventar hechos que no se puedan verificar.';

    const researchContext = buildResearchContext(input.research, language);

    const userPrompt =
      language === 'en'
        ? `Write a complete wedding blog post about "${input.topic}". Audience: engaged couples. Target length: ${wordsRange}. Tone: ${input.tone}. ${keywordsText} If relevant, mention Spanish wedding context. Ground every fact in this research:
${researchContext}

Return valid JSON matching this structure:
{
  "title": "string",
  "excerpt": "string",
  "sections": [
    { "heading": "string", "body": ["paragraph 1", "paragraph 2"] }
  ],
  "tips": ["string"],
  "conclusion": "string",
  "cta": "string",
  "tags": ["string"],
  "coverPrompt": "string"
}`
        : `Redacta un artículo completo de blog de bodas sobre "${input.topic}". Público: parejas que planean su boda. Longitud objetivo: ${wordsRange}. Tono: ${input.tone}. ${keywordsText} Si procede, menciona contexto de bodas en España. Basado en esta investigación contrastada:
${researchContext}

Devuelve JSON válido con esta estructura:
{
  "title": "string",
  "excerpt": "string",
  "sections": [
    { "heading": "string", "body": ["párrafo 1", "párrafo 2"] }
  ],
  "tips": ["string"],
  "conclusion": "string",
  "cta": "string",
  "tags": ["string"],
  "coverPrompt": "string"
}`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL_BLOG || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || '';
    const parsed = AiResponseSchema.safeParse(safeJsonParse(text) || {});
    if (!parsed.success) {
      return { ...fallbackArticle(input), source: 'fallback', error: parsed.error.flatten() };
    }

    const aiData = parsed.data;
    const markdown = buildMarkdownFromAi(aiData);
    const excerpt = aiData.excerpt || buildExcerpt(markdown);

    return {
      title: aiData.title.trim(),
      excerpt: excerpt.trim(),
      markdown,
      tags: aiData.tags?.map((tag) => tag.trim().toLowerCase()) || input.keywords || [],
      tips: aiData.tips || [],
      sections: aiData.sections,
      conclusion: aiData.conclusion || '',
      cta: aiData.cta || '',
      coverPrompt: aiData.coverPrompt || FALLBACK_COVER_PROMPT,
      raw: {
        response: text,
        id: completion.id,
        created: completion.created,
        usage: completion.usage,
      },
      source: 'openai',
    };
  } catch (error) {
    console.error('[blogAiService] generateBlogArticle failed:', error?.message || error);
    return { ...fallbackArticle(input), source: 'error', error: error?.message || 'unknown-error' };
  }
}

export function ensureExcerpt(markdown, existing) {
  if (existing && existing.length >= 32) return existing;
  return buildExcerpt(markdown);
}

export function computeDefaultTags(keywords = [], sections = []) {
  const base = new Set();
  for (const kw of keywords) {
    if (kw) base.add(kw.trim().toLowerCase());
  }
  for (const section of sections) {
    if (!section?.heading) continue;
    const slug = section.heading
      .toLowerCase()
      .replace(/[^a-záéíóúñ\s]/gi, '')
      .trim();
    const tokens = slug.split(/\s+/).filter((t) => t.length > 4);
    for (const tk of tokens.slice(0, 2)) {
      base.add(tk);
    }
  }
  return Array.from(base).slice(0, 6);
}

export function createLocalId() {
  return randomUUID();
}

export async function generateCoverImageFromPrompt(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('cover-image-missing-prompt');
  }

  if (!OPENAI_API_KEY) {
    return {
      status: 'skipped',
      reason: 'missing-openai-key',
      url: null,
      provider: 'none',
    };
  }

  const size = options.size || '1024x1024';
  const quality = options.quality || 'hd';

  try {
    await ensureOpenAI();
    const client = openaiClient;

    const response = await client.images.generate({
      model: DEFAULT_IMAGE_MODEL,
      prompt: `${prompt}\nEscenario editorial de bodas, estilo Lovenda, alta calidad.`,
      size,
      quality,
      n: 1,
    });

    const imageUrl = response?.data?.[0]?.url || null;
    if (!imageUrl) {
      throw new Error('cover-image-empty-response');
    }

    return {
      status: 'ready',
      url: imageUrl,
      provider: 'openai',
      model: DEFAULT_IMAGE_MODEL,
      raw: {
        id: response.id,
        created: response.created,
        usage: response.usage,
      },
    };
  } catch (error) {
    console.error('[blogAiService] generateCoverImageFromPrompt failed:', error?.message || error);
    return {
      status: 'failed',
      url: null,
      provider: 'openai',
      error: error?.message || 'unknown-error',
    };
  }
}
