// Servicio de WhatsApp – integra envío por API (backend) y utilidades de deeplink

let authContext = null;

export const setAuthContext = (context) => {
  authContext = context || null;
};

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';
const DEFAULT_CC = (import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '').replace('+', '');

async function getAuthToken() {
  const resolvers = [];

  if (authContext?.getIdToken) {
    resolvers.push(async () => {
      try {
        const refreshed = await authContext.getIdToken(true);
        if (refreshed) return refreshed;
      } catch (err) {
        // console.warn('[whatsappService] No se pudo refrescar token desde authContext:', err);
      }
      return authContext.getIdToken();
    });
  }

  resolvers.push(async () => {
    try {
      const mod = await import('../firebaseConfig');
      const { auth } = mod;
      const user = auth?.currentUser;
      if (user?.getIdToken) {
        try {
          const refreshed = await user.getIdToken(true);
          if (refreshed) return refreshed;
        } catch (err) {
          // console.warn('[whatsappService] No se pudo refrescar token Firebase:', err);
        }
        return user.getIdToken();
      }
    } catch (error) {
      // console.warn('[whatsappService] Error importando firebaseConfig:', error);
    }
    return null;
  });

  for (const resolver of resolvers) {
    try {
      const token = await resolver();
      if (token) return token;
    } catch (error) {
      // console.warn('[whatsappService] Error obteniendo token de autenticación:', error);
    }
  }

  throw new Error('WhatsAppService: autenticación requerida');
}

export function toE164(phone) {
  if (!phone) return null;
  let p = String(phone)
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '');
  // 00 -> +
  if (p.startsWith('00')) p = '+' + p.slice(2);
  // Si ya viene con +, devolver tal cual
  if (p.startsWith('+')) return p;
  // Si empieza con el CC por defecto ya incluido (sin +), no duplicar
  if (DEFAULT_CC && p.startsWith(String(DEFAULT_CC))) {
    return '+' + p;
  }
  // Caso general: anteponer CC por defecto o +
  return DEFAULT_CC ? `+${DEFAULT_CC}${p}` : `+${p}`;
}

export function waDeeplink(phoneE164, text) {
  const t = encodeURIComponent(text || '');
  const ph = (phoneE164 || '').replace(/^\+/, '');
  return `https://wa.me/${ph}?text=${t}`;
}

export async function sendText({
  to,
  message,
  weddingId,
  guestId,
  templateId = null,
  scheduleAt = null,
  metadata = {},
  deliveryChannel = 'whatsapp',
  assetUrl,
  instagramPollId,
}) {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const url = base ? `${base}/api/whatsapp/send` : `/api/whatsapp/send`;
    if (import.meta.env.DEV)
      // console.log('[whatsappService] sendText →', {
        url,
        hasAuth: !!token,
        to,
        hasMessage: !!message,
        base,
      });
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to,
        message,
        weddingId,
        guestId,
        templateId,
        scheduleAt,
        metadata,
        deliveryChannel,
        assetUrl,
        instagramPollId,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (import.meta.env.DEV)
      // console.log('[whatsappService] sendText ←', { status: res.status, ok: res.ok, body: json });
    if (!res.ok || json.success === false) {
      const msg = json?.error || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }
    return json;
  } catch (e) {
    if (import.meta.env.DEV) // console.warn('[whatsappService] sendText exception', e);
    return { success: false, error: e.message || 'error' };
  }
}

export async function getProviderStatus() {
  try {
    const token = await getAuthToken();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const url = base ? `${base}/api/whatsapp/provider-status` : `/api/whatsapp/provider-status`;
    const res = await fetch(url, { headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      return { success: false, configured: false, error: json?.error || `HTTP ${res.status}` };
    return json;
  } catch (e) {
    return { success: false, configured: false, error: e.message || 'error' };
  }
}

export async function schedule(items = [], scheduledAt) {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const url = base ? `${base}/api/whatsapp/schedule` : `/api/whatsapp/schedule`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items, scheduledAt }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const msg = json?.error || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }
    return json;
  } catch (e) {
    return { success: false, error: e.message || 'error' };
  }
}

export async function getMetrics({ weddingId, from, to, groupBy = 'day' } = {}) {
  try {
    const token = await getAuthToken();
    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const params = new URLSearchParams();
    if (weddingId) params.append('weddingId', weddingId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (groupBy) params.append('groupBy', groupBy);
    const url = (base ? `${base}` : '') + `/api/whatsapp/metrics?` + params.toString();
    const res = await fetch(url, { headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const msg = json?.error || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }
    return json;
  } catch (e) {
    return { success: false, error: e.message || 'error' };
  }
}

export async function getHealth() {
  try {
    const token = await getAuthToken();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const url = base ? `${base}/api/whatsapp/health` : `/api/whatsapp/health`;
    const res = await fetch(url, { headers });
    const json = await res.json().catch(() => ({ success: false }));
    return { ok: res.ok, ...json };
  } catch (e) {
    return { ok: false, success: false, error: e?.message || 'error' };
  }
}
