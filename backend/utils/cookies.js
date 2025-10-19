export function getCookie(req, name) {
  if (!req || !name) return null;
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null;
  }

  const target = String(name).trim();
  if (!target) {
    return null;
  }

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [rawKey, ...rawValue] = pair.split('=');
    if (!rawKey) continue;
    if (rawKey.trim() === target) {
      return rawValue.join('=').trim() || '';
    }
  }
  return null;
}

export default {
  getCookie,
};
