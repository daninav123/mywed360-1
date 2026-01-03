import axios from 'axios';
import LRU from 'lru-cache';

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v19.0';

const PINTEREST_TOKEN =
  process.env.PINTEREST_ACCESS_TOKEN ||
  process.env.PINTEREST_TOKEN ||
  process.env.VITE_PINTEREST_TOKEN ||
  '';
const PINTEREST_BOARD_IDS = (process.env.PINTEREST_BOARD_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const INSTAGRAM_ACCESS_TOKEN =
  process.env.INSTAGRAM_ACCESS_TOKEN ||
  process.env.INSTAGRAM_GRAPH_TOKEN ||
  process.env.VITE_INSTAGRAM_TOKEN ||
  '';
const INSTAGRAM_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || '';
const INSTAGRAM_BASE_HASHTAGS = (process.env.INSTAGRAM_HASHTAGS || 'wedding')
  .split(',')
  .map((tag) => tag.trim().toLowerCase())
  .filter(Boolean);

const instagramHashtagMap = (() => {
  const raw = process.env.INSTAGRAM_HASHTAG_IDS || '';
  const entries = raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [tag, id] = pair.split(':').map((part) => part.trim());
      if (!tag || !id) return null;
      return [tag.toLowerCase(), id];
    })
    .filter(Boolean);
  return new Map(entries);
})();

const pinterestCache = new LRU({
  max: 200,
  ttl: 15 * 60 * 1000,
});

const instagramCache = new LRU({
  max: 200,
  ttl: 10 * 60 * 1000,
});

const hashtagIdCache = new LRU({
  max: 100,
  ttl: 24 * 60 * 60 * 1000,
});

function normalizePinterestImage(pin = {}, index = 0) {
  const media = pin.media || {};
  const images = media.images || media.image || pin.images || {};

  // API v5 -> media.images -> { original: { url } } o array
  if (Array.isArray(images)) {
    const candidate = images[index] || images[0];
    if (candidate?.url) return candidate.url;
    if (candidate?.originals?.url) return candidate.originals.url;
  } else {
    const variants = [
      images.original,
      images['736x'],
      images['564x'],
      images['474x'],
      images.medium,
      images.small,
      images.preview,
      images['600x'],
    ].filter(Boolean);
    for (const variant of variants) {
      if (typeof variant === 'string') return variant;
      if (variant?.url) return variant.url;
      if (variant?.images) {
        const nested = normalizePinterestImage({ media: { images: variant.images } }, index);
        if (nested) return nested;
      }
    }
    if (images.url) return images.url;
  }
  if (pin.image_large_url) return pin.image_large_url;
  if (pin.image_medium_url) return pin.image_medium_url;
  if (pin.image_small_url) return pin.image_small_url;
  return null;
}

function normalizePinterestPin(pin = {}) {
  const imageUrl = normalizePinterestImage(pin);
  if (!imageUrl) return null;

  const id = pin.id || pin.pin_id || pin.external_id || `${pin.board_id || 'pin'}_${pin.index || Date.now()}`;
  const permalink =
    pin.link ||
    pin.url ||
    pin.pinned_url ||
    (pin.id ? `https://www.pinterest.com/pin/${pin.id}` : null);

  const description = pin.description || pin.title || pin.alt_text || '';

  return {
    id: `pinterest_${id}`,
    permalink,
    media_url: imageUrl,
    timestamp: pin.created_at || pin.created_time || new Date().toISOString(),
    like_count: pin.save_count || pin.repin_count || 0,
    comments_count: pin.comment_count || 0,
    provider: 'pinterest',
    description,
    categories: pin.board?.name ? [pin.board.name] : pin.section?.title ? [pin.section.title] : pin.topic ? [pin.topic] : [],
  };
}

function normalizeInstagramPost(post = {}) {
  if (!post.media_url) {
    if (Array.isArray(post.children?.data)) {
      const firstImage = post.children.data.find((child) => child.media_type === 'IMAGE' && child.media_url);
      if (!firstImage) return null;
      post.media_url = firstImage.media_url;
    } else {
      return null;
    }
  }

  if (post.media_type && post.media_type !== 'IMAGE' && post.media_type !== 'CAROUSEL_ALBUM') {
    return null;
  }

  return {
    id: `instagram_${post.id}`,
    permalink: post.permalink,
    media_url: post.media_url,
    timestamp: post.timestamp || new Date().toISOString(),
    like_count: post.like_count || 0,
    comments_count: post.comments_count || 0,
    provider: 'instagram',
    description: post.caption || '',
    categories: post.media_product_type ? [post.media_product_type] : [],
  };
}

async function pinterestSearch(query, limit = 20) {
  if (!PINTEREST_TOKEN) return [];

  const cacheKey = `search:${query}:${limit}`;
  if (pinterestCache.has(cacheKey)) {
    return pinterestCache.get(cacheKey);
  }

  try {
    const { data } = await axios.get(`${PINTEREST_API_BASE}/search/pins`, {
      params: {
        query,
        page_size: Math.min(limit, 50),
      },
      headers: {
        Authorization: `Bearer ${PINTEREST_TOKEN}`,
      },
      timeout: 10_000,
    });

    const pins = data?.items || data?.data || data?.results || [];
    const normalized = pins
      .map((pin, index) => normalizePinterestPin({ ...pin, index }))
      .filter(Boolean)
      .slice(0, limit);

    if (normalized.length) {
      pinterestCache.set(cacheKey, normalized);
      return normalized;
    }
  } catch (error) {
    console.warn('[Pinterest] search fallback ->', error.response?.data || error.message);
  }

  return [];
}

async function pinterestBoards(limit = 20) {
  if (!PINTEREST_TOKEN || PINTEREST_BOARD_IDS.length === 0) return [];

  const cacheKey = `boards:${limit}`;
  if (pinterestCache.has(cacheKey)) return pinterestCache.get(cacheKey);

  try {
    const perBoard = Math.max(3, Math.ceil(limit / PINTEREST_BOARD_IDS.length));
    const allPins = [];

    await Promise.all(
      PINTEREST_BOARD_IDS.map(async (boardId) => {
        try {
          const { data } = await axios.get(`${PINTEREST_API_BASE}/boards/${boardId}/pins`, {
            params: { page_size: perBoard },
            headers: { Authorization: `Bearer ${PINTEREST_TOKEN}` },
            timeout: 10_000,
          });
          const items = data?.items || data?.data || [];
          items
            .map((pin, index) => normalizePinterestPin({ ...pin, index }))
            .filter(Boolean)
            .forEach((pin) => allPins.push(pin));
        } catch (boardErr) {
          console.warn(`[Pinterest] board ${boardId} error:`, boardErr.response?.data || boardErr.message);
        }
      })
    );

    const limited = allPins.slice(0, limit);
    if (limited.length) {
      pinterestCache.set(cacheKey, limited);
    }
    return limited;
  } catch (err) {
    console.warn('[Pinterest] boards fallback ->', err.response?.data || err.message);
    return [];
  }
}

async function ensureHashtagId(tag) {
  const cleaned = tag.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (!cleaned) return null;

  if (instagramHashtagMap.has(cleaned)) {
    return instagramHashtagMap.get(cleaned);
  }

  if (hashtagIdCache.has(cleaned)) {
    return hashtagIdCache.get(cleaned);
  }

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) {
    return null;
  }

  try {
    const { data } = await axios.get(`${INSTAGRAM_API_BASE}/ig_hashtag_search`, {
      params: {
        user_id: INSTAGRAM_BUSINESS_ID,
        q: cleaned,
        access_token: INSTAGRAM_ACCESS_TOKEN,
      },
      timeout: 8_000,
    });

    const id = data?.data?.[0]?.id;
    if (id) {
      hashtagIdCache.set(cleaned, id);
      instagramHashtagMap.set(cleaned, id);
      return id;
    }
  } catch (err) {
    console.warn(`[Instagram] hashtag search ${cleaned} failed:`, err.response?.data || err.message);
  }

  return null;
}

async function instagramMediaForHashtag(hashtagId, limit = 20) {
  if (!hashtagId || !INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) return [];

  const cacheKey = `hashtag:${hashtagId}:${limit}`;
  if (instagramCache.has(cacheKey)) {
    return instagramCache.get(cacheKey);
  }

  try {
    const { data } = await axios.get(`${INSTAGRAM_API_BASE}/${hashtagId}/recent_media`, {
      params: {
        user_id: INSTAGRAM_BUSINESS_ID,
        limit: Math.min(limit, 50),
        fields:
          'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,media_product_type,children{media_type,media_url}',
        access_token: INSTAGRAM_ACCESS_TOKEN,
      },
      timeout: 10_000,
    });

    const items = data?.data || [];
    const normalized = items.map(normalizeInstagramPost).filter(Boolean);
    instagramCache.set(cacheKey, normalized);
    return normalized;
  } catch (err) {
    console.warn(`[Instagram] hashtag ${hashtagId} media error:`, err.response?.data || err.message);
    return [];
  }
}

export async function fetchPinterestPins({ query, limit = 20 }) {
  if (!query) query = 'wedding inspiration';

  const primary = await pinterestSearch(query, limit);
  if (primary.length >= limit / 2) return primary.slice(0, limit);

  const fromBoards = await pinterestBoards(limit);
  const combined = [...primary, ...fromBoards];

  const deduped = combined.reduce((acc, pin) => {
    if (!pin || !pin.id) return acc;
    if (acc.some((item) => item.id === pin.id)) return acc;
    acc.push(pin);
    return acc;
  }, []);

  return deduped.slice(0, limit);
}

export async function fetchInstagramMedia({ query, limit = 20 }) {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) return [];

  const baseTags = new Set(INSTAGRAM_BASE_HASHTAGS);
  if (query) {
    query
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/gi, ''))
      .filter(Boolean)
      .forEach((word) => baseTags.add(word));
  }

  const hashtagIds = await Promise.all(
    Array.from(baseTags).map(async (tag) => ({
      tag,
      id: await ensureHashtagId(tag),
    }))
  );

  const validIds = hashtagIds.filter(({ id }) => Boolean(id));
  if (!validIds.length) return [];

  const perTagLimit = Math.max(4, Math.ceil(limit / validIds.length));
  const media = [];

  for (const { id } of validIds) {
    // eslint-disable-next-line no-await-in-loop
    const items = await instagramMediaForHashtag(id, perTagLimit);
    for (const item of items) {
      if (!item) continue;
      if (!media.some((existing) => existing.id === item.id)) {
        media.push(item);
      }
      if (media.length >= limit) break;
    }
    if (media.length >= limit) break;
  }

  return media.slice(0, limit);
}
