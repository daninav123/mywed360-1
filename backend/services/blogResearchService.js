import logger from '../utils/logger.js';

const TAVILY_API_KEY =
  process.env.TAVILY_API_KEY || process.env.VITE_TAVILY_API_KEY || process.env.SEARCH_API_KEY || '';

const TAVILY_ENDPOINT = process.env.TAVILY_API_URL || 'https://api.tavily.com/search';
const DEFAULT_MAX_RESULTS = 6;

function sanitizeSnippet(text = '') {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

function normalizeLanguage(language = 'es') {
  if (!language) return 'es';
  const match = String(language)
    .toLowerCase()
    .match(/^[a-z]{2}/);
  return match ? match[0] : 'es';
}

export async function researchTopic({
  topic,
  language = 'es',
  maxResults = DEFAULT_MAX_RESULTS,
  searchDepth = 'advanced',
} = {}) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('blog-research-missing-topic');
  }

  const normalizedLanguage = normalizeLanguage(language);

  if (!TAVILY_API_KEY) {
    logger.warn('[blogResearch] Tavily API key missing, returning empty research payload.');
    return {
      provider: 'none',
      summary: '',
      references: [],
      raw: null,
    };
  }

  const supportsAbort = typeof AbortController !== 'undefined';
  const controller = supportsAbort ? new AbortController() : null;
  const timeoutMs = Number(process.env.TAVILY_TIMEOUT_MS || 15000);
  const timeoutHandle =
    supportsAbort && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const response = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Planivia-Blog-Automation/1.0',
        'X-Tavily-API-Key': TAVILY_API_KEY,
      },
      body: JSON.stringify({
        query: `${topic} tendencias bodas 2025 España`,
        max_results: Math.max(3, Math.min(maxResults, 12)),
        include_images: false,
        include_answer: true,
        search_depth: searchDepth,
        topic: 'general',
        language: normalizedLanguage,
      }),
      ...(supportsAbort && controller ? { signal: controller.signal } : {}),
    });

    if (timeoutHandle) clearTimeout(timeoutHandle);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown-error');
      throw new Error(`tavily-http-${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const references = Array.isArray(data.results)
      ? data.results
          .map((item) => ({
            title: item.title || item.url || 'Fuente sin título',
            url: item.url || null,
            snippet: sanitizeSnippet(item.snippet || item.content || ''),
          }))
          .filter((ref) => ref.url)
      : [];

    const summary =
      sanitizeSnippet(data.answer || data.summary || '') ||
      references
        .slice(0, 3)
        .map((ref) => ref.snippet)
        .filter(Boolean)
        .join(' ');

    return {
      provider: 'tavily',
      summary,
      references,
      raw: data,
    };
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || error?.status || 'unknown';

    if (supportsAbort && error?.name === 'AbortError') {
      logger.error('[blogResearch] Tavily request timed out after %dms', timeoutMs);
    } else {
      logger.error('[blogResearch] Tavily research failed:', {
        message: errorMsg,
        code: errorCode,
        type: error?.constructor?.name,
      });
    }
    return {
      provider: 'tavily-error',
      summary: '',
      references: [],
      raw: { error: errorMsg, code: errorCode },
    };
  }
}
