const BASE_URL = '/api/blog';

async function sendRequest(url, init = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(payload?.error || 'blog-request-failed');
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

export async function fetchBlogPosts(options = {}) {
  const { language, limit, cursor, authorId } = options;
  const url = new URL(BASE_URL, window.location.origin);
  if (language) url.searchParams.set('language', language);
  if (limit) url.searchParams.set('limit', String(limit));
  if (cursor) url.searchParams.set('cursor', cursor);
  if (authorId) url.searchParams.set('author', authorId);
  return sendRequest(url.toString().replace(window.location.origin, ''));
}

export async function fetchBlogPostBySlug(slug, options = {}) {
  if (!slug) throw new Error('missing-slug');
  const urlObj = new URL(`${BASE_URL}/${encodeURIComponent(slug)}`, window.location.origin);
  if (options.language) {
    urlObj.searchParams.set('language', options.language);
  }
  const url = urlObj.toString().replace(window.location.origin, '');
  return sendRequest(url);
}
