import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import axios from 'axios';
import { z } from 'zod';

let openaiClient = null;
let openAIConfig = { apiKeyPrefix: null, projectId: null };

function getOpenAIConfig() {
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_TOKEN || '';
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';
  return { apiKey, projectId };
}
const FALLBACK_COVER_PROMPT =
  'Editorial wedding photography, elegant pastel palette, minimal styling, soft natural light';
const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
const DEFAULT_TRANSLATION_MODEL =
  process.env.OPENAI_MODEL_TRANSLATION || process.env.OPENAI_MODEL || 'gpt-4o-mini';
const SUPPORTED_TRANSLATION_LANGUAGES = (
  process.env.BLOG_SUPPORTED_LANGUAGES || 'es,en,fr,pt,it,de'
)
  .split(',')
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean);

async function ensureOpenAI() {
  const { apiKey, projectId } = getOpenAIConfig();
  const apiKeyPrefix = apiKey ? apiKey.slice(0, 8) : null;

  if (!apiKey) return null;
  if (
    openaiClient &&
    openAIConfig.apiKeyPrefix === apiKeyPrefix &&
    openAIConfig.projectId === (projectId || null)
  ) {
    return openaiClient;
  }
  const { default: OpenAI } = await import('openai');
  openaiClient = new OpenAI({
    apiKey,
    project: projectId || undefined,
    timeout: 15000,
    maxRetries: 2,
  });
  openAIConfig = { apiKeyPrefix, projectId: projectId || null };
  return openaiClient;
}

export async function getOpenAiClient() {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
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

const TranslationResponseSchema = AiResponseSchema.omit({ coverPrompt: true });

function resolveLanguageDescriptor(code = '') {
  const normalized = String(code || '').toLowerCase();
  switch (normalized) {
    case 'es':
      return { code: 'es', english: 'Spanish', native: 'español' };
    case 'en':
      return { code: 'en', english: 'English', native: 'inglés' };
    case 'fr':
      return { code: 'fr', english: 'French', native: 'francés' };
    case 'pt':
      return { code: 'pt', english: 'Portuguese', native: 'portugués' };
    case 'it':
      return { code: 'it', english: 'Italian', native: 'italiano' };
    default:
      return {
        code: normalized || 'es',
        english: normalized || 'Spanish',
        native: normalized || 'español',
      };
  }
}

const GenerationInputSchema = z.object({
  topic: z.string().min(6),
  language: z.string().default('es'),
  tone: z.string().default('cálido cercano'),
  length: z.enum(['corto', 'medio', 'largo', 'short', 'medium', 'long']).default('medio'),
  keywords: z.array(z.string().min(2)).max(12).optional(),
  audience: z.string().optional(),
  includeTips: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
  authorPrompt: z.string().max(2000).optional(),
  author: z
    .object({
      id: z.string(),
      name: z.string(),
      title: z.string().optional(),
      signature: z.string().optional(),
      narrativeStyle: z.string().optional(),
    })
    .optional(),
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
    '¿Quieres más inspiración personalizada? Inicia sesión en Planivia y descubre herramientas exclusivas.';

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

  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
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

    const baseSystemPrompt =
      language === 'en'
        ? 'You are a senior wedding editor for Planivia. You craft helpful, actionable wedding articles with a warm, empathetic tone — sounding like a trusted planner speaking directly to engaged couples. Provide vivid examples grounded in verified information and never invent facts.'
        : 'Eres editor senior de bodas en Planivia. Redactas artículos útiles y accionables con un tono cercano, humano y experto, como una planner de confianza que asesora a la pareja. Incluye ejemplos concretos basados en información verificada y nunca inventes datos.';
    const authorRolePrompt = input.author
      ? language === 'en'
        ? `Your byline is ${input.author.name}${input.author.title ? `, ${input.author.title}` : ''}.`
        : `Tu firma es ${input.author.name}${input.author.title ? `, ${input.author.title}` : ''}.`
      : '';
    const systemPrompt = `${baseSystemPrompt} ${authorRolePrompt}${
      input.authorPrompt ? ` ${input.authorPrompt}` : ''
    }`.trim();

    const researchContext = buildResearchContext(input.research, language);
    const authorQuoteInstruction = input.author
      ? language === 'en'
        ? `Include at least one brief quote or field observation attributed to ${input.author.name}.`
        : `Incluye al menos una cita breve u observación de campo atribuida a ${input.author.name}.`
      : '';
    const humanTouchInstruction =
      language === 'en'
        ? 'Let the article feel reported: weave mini anecdotes, sensory details, and transitions that connect paragraphs naturally.'
        : 'Haz que el artículo tenga sensación de reporterismo: añade mini anécdotas, detalles sensoriales y transiciones naturales entre párrafos.';

    const userPrompt =
      language === 'en'
        ? `Write a complete wedding blog post about "${input.topic}". Audience: engaged couples. Target length: ${wordsRange}. Tone: ${input.tone}. ${keywordsText} If relevant, mention Spanish wedding context. Use a warm, human voice that opens with an empathetic hook, sprinkles in real-life style examples, and closes with an encouraging note. Ground every fact in this research:
${researchContext}

${humanTouchInstruction} ${authorQuoteInstruction}

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
        : `Redacta un artículo completo de blog de bodas sobre "${input.topic}". Público: parejas que planean su boda. Longitud objetivo: ${wordsRange}. Tono: ${input.tone}. ${keywordsText} Si procede, menciona contexto de bodas en España. Usa una voz cálida y cercana que abra con un gancho empático, incluya ejemplos reales y cierre con un mensaje de ánimo. Basado en esta investigación contrastada:
${researchContext}

${humanTouchInstruction} ${authorQuoteInstruction}

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
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || error?.status || 'unknown';
    console.error('[blogAiService] generateBlogArticle failed:', {
      message: errorMsg,
      code: errorCode,
      type: error?.constructor?.name,
    });
    return { ...fallbackArticle(input), source: 'error', error: errorMsg, code: errorCode };
  }
}

export async function translateBlogArticleToLanguages({
  article,
  fromLanguage = 'es',
  targetLanguages = [],
  tone = 'cálido cercano',
  references = [],
  author = null,
} = {}) {
  const baseSections =
    Array.isArray(article.sections) && article.sections.length
      ? article.sections
      : [
          {
            heading: 'Contenido',
            body: article.markdown ? article.markdown.split('\n\n') : [''],
          },
        ];
  const baseTips = Array.isArray(article.tips) ? article.tips : [];
  const baseConclusion = typeof article.conclusion === 'string' ? article.conclusion : '';
  const baseCta = typeof article.cta === 'string' ? article.cta : '';
  const baseTags = Array.isArray(article.tags) ? article.tags : [];
  const baseTitle = article.title || 'Artículo de Planivia';
  const baseExcerpt = typeof article.excerpt === 'string' ? article.excerpt : '';

  const uniqueTargets = Array.from(
    new Set(
      targetLanguages
        .map((code) => code && code.toLowerCase())
        .filter((code) => code && code !== fromLanguage.toLowerCase())
    )
  );

  if (!uniqueTargets.length) {
    return {};
  }

  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
    return {};
  }

  await ensureOpenAI();
  const client = openaiClient;

  const payload = {
    title: baseTitle,
    excerpt: baseExcerpt || '',
    sections: baseSections,
    tips: baseTips,
    conclusion: baseConclusion,
    cta: baseCta,
  };

  const results = {};
  for (const target of uniqueTargets) {
    const fromDescriptor = resolveLanguageDescriptor(fromLanguage);
    const targetDescriptor = resolveLanguageDescriptor(target);

    try {
      const authorStyle = author?.name
        ? `The article voice belongs to ${author.name}${
            author.title ? `, ${author.title}` : ''
          }. Preserve this voice, cadence, and personality.`
        : 'Preserve the original narrative voice and warmth.';
      const systemPrompt = `You are a bilingual wedding editor for Planivia. Translate wedding content from ${fromDescriptor.english} into ${targetDescriptor.english} while keeping a warm, human, conversational tone. Preserve structure, actionable advice, and factual accuracy. ${authorStyle}`;

      const userPrompt = `Translate the following Planivia wedding article.
Source language: ${fromDescriptor.english} (${fromDescriptor.native}).
Target language: ${targetDescriptor.english} (${targetDescriptor.native}).
Desired tone: ${tone}.
Keep sections, tips, and CTA structure exactly as the source. Use natural wording that sounds like a trusted wedding planner speaking to engaged couples. If the article includes quotes or observations, keep them meaningful in the new language without inventing data.
Return valid JSON with this structure:
{
  "title": "string",
  "excerpt": "string",
  "sections": [
    { "heading": "string", "body": ["paragraph 1", "paragraph 2"] }
  ],
  "tips": ["string"],
  "conclusion": "string",
  "cta": "string",
  "tags": ["string"]
}

Article JSON:
${JSON.stringify(payload, null, 2)}

Useful references to keep context (do not translate URLs): ${JSON.stringify(
        references.map((ref) => ({ title: ref.title, url: ref.url })),
        null,
        2
      )}`;

      const completion = await client.chat.completions.create({
        model: DEFAULT_TRANSLATION_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const text = completion.choices?.[0]?.message?.content || '';
      const parsed = TranslationResponseSchema.safeParse(safeJsonParse(text) || {});
      if (!parsed.success) {
        results[target] = {
          status: 'failed',
          error: parsed.error.flatten?.() || 'invalid-translation-schema',
        };
        continue;
      }

      const translated = parsed.data;
      const markdown = buildMarkdownFromAi(translated);
      const excerpt = translated.excerpt ? translated.excerpt.trim() : buildExcerpt(markdown);

      results[target] = {
        status: 'ready',
        title: translated.title.trim(),
        excerpt,
        content: {
          markdown,
          outline: translated.sections || [],
          tips: translated.tips || [],
          conclusion: translated.conclusion || '',
          cta: translated.cta || '',
          references,
        },
        tags: translated.tags || baseTags || [],
        generatedAt: new Date().toISOString(),
        provider: 'openai',
        model: DEFAULT_TRANSLATION_MODEL,
        raw: {
          id: completion.id,
          usage: completion.usage,
        },
      };
    } catch (error) {
      const errorMsg = error?.message || String(error);
      const errorCode = error?.code || error?.status || 'unknown';
      console.error(
        '[blogAiService] translateBlogArticleToLanguages failed for %s -> %s:',
        fromLanguage,
        target,
        {
          message: errorMsg,
          code: errorCode,
          type: error?.constructor?.name,
        }
      );
      results[target] = {
        status: 'failed',
        error: errorMsg,
        code: errorCode,
      };
    }
  }

  return results;
}

export function getSupportedBlogLanguages() {
  return SUPPORTED_TRANSLATION_LANGUAGES.length
    ? Array.from(new Set(SUPPORTED_TRANSLATION_LANGUAGES))
    : ['es', 'en', 'fr'];
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

  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
    return {
      status: 'skipped',
      reason: 'missing-openai-key',
      url: null,
      provider: 'none',
    };
  }

  const size = options.size || '1024x1024';
  const quality = options.quality === 'hd' ? 'hd' : 'standard';

  try {
    await ensureOpenAI();
    const client = openaiClient;

    const response = await client.images.generate({
      model: DEFAULT_IMAGE_MODEL,
      prompt: `${prompt}\nEscenario editorial de bodas, estilo Planivia, alta calidad.`,
      size,
      quality,
      n: 1,
    });

    const imageUrl = response?.data?.[0]?.url || null;
    if (!imageUrl) {
      throw new Error('cover-image-empty-response');
    }

    let storageInfo = null;
    const bucketName =
      process.env.BLOG_COVER_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.VITE_FIREBASE_STORAGE_BUCKET ||
      null;

    if (bucketName) {
      try {
        const download = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(download.data);
        const contentType = download.headers?.['content-type'] || 'image/png';
        const extension = (() => {
          const ct = contentType.toLowerCase();
          if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
          if (ct.includes('png')) return 'png';
          if (ct.includes('webp')) return 'webp';
          return 'png';
        })();

        const storagePath = `blog/covers/${new Date().toISOString().slice(0, 10)}/${createLocalId()}.${extension}`;
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(storagePath);

        await file.save(buffer, {
          contentType,
          metadata: {
            cacheControl: 'public,max-age=31536000,immutable',
          },
        });

        let publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
        let signedUrlExpiresAt = null;
        let madePublic = false;
        try {
          await file.makePublic();
          madePublic = true;
        } catch (publishError) {
          // Bucket may have uniform access. Fallback to signed URL.
          const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 año
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: expiresAt,
          });
          publicUrl = signedUrl;
          signedUrlExpiresAt = expiresAt.toISOString();
        }

        storageInfo = {
          bucket: bucketName,
          storagePath,
          contentType,
          publicUrl,
          madePublic,
          signedUrlExpiresAt,
          originalUrl: imageUrl,
        };
      } catch (uploadError) {
        const uploadErrorMsg = uploadError?.message || String(uploadError);
        const uploadErrorCode = uploadError?.code || uploadError?.status || 'unknown';
        console.error('[blogAiService] cover upload failed:', {
          message: uploadErrorMsg,
          code: uploadErrorCode,
          type: uploadError?.constructor?.name,
        });
        storageInfo = {
          bucket: bucketName,
          error: uploadErrorMsg,
          code: uploadErrorCode,
          originalUrl: imageUrl,
        };
      }
    }

    return {
      status: 'ready',
      url: storageInfo?.publicUrl || imageUrl,
      provider: 'openai',
      model: DEFAULT_IMAGE_MODEL,
      storagePath: storageInfo?.storagePath || null,
      bucket: storageInfo?.bucket || null,
      signedUrlExpiresAt: storageInfo?.signedUrlExpiresAt || null,
      originalUrl: imageUrl,
      upload: storageInfo || null,
      error: storageInfo?.error || null,
      raw: {
        id: response.id,
        created: response.created,
        usage: response.usage,
      },
    };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || error?.status || 'unknown';
    console.error('[blogAiService] generateCoverImageFromPrompt failed:', {
      message: errorMsg,
      code: errorCode,
      type: error?.constructor?.name,
    });
    return {
      status: 'failed',
      url: null,
      provider: 'openai',
      error: errorMsg,
      code: errorCode,
    };
  }
}
