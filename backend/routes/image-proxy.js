import express from 'express';
import axios from 'axios';
import { isIP } from 'net';
import dns from 'dns';
import { IMAGE_PROXY_ALLOWLIST, IMAGE_PROXY_DENYLIST, IMAGE_PROXY_MAX_BYTES, IMAGE_PROXY_ENFORCE_IMAGE_CT } from '../config.js';

// Sencillo proxy de imágenes para evitar CORS/hotlinking
// GET /api/image-proxy?u=<encoded_url>
// Seguridad básica contra SSRF: sólo http/https y bloqueo de rangos privados/localhost

const router = express.Router();

function isPrivateIp(ip) {
  if (!ip) return false;
  // IPv4 rangos privados y especiales
  const parts = ip.split('.').map((n) => parseInt(n, 10));
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true; // loopback
    if (a === 0) return true; // this network
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  // IPv6 privados/comunes
  const low = ip.toLowerCase();
  if (low === '::1') return true; // loopback
  if (low.startsWith('fc') || low.startsWith('fd')) return true; // unique local
  if (low.startsWith('fe80')) return true; // link-local
  return false;
}

function hostMatches(list, host) {
  const h = String(host || '').toLowerCase();
  for (const entry of list) {
    const e = entry.toLowerCase();
    if (!e) continue;
    if (e.startsWith('*.')) {
      const suf = e.slice(1); // ".domain.com"
      if (h.endsWith(suf)) return true;
    } else if (e.startsWith('.')) {
      if (h.endsWith(e)) return true;
    } else if (h === e) {
      return true;
    }
  }
  return false;
}

router.get('/', async (req, res) => {
  try {
    const u = req.query.u;
    if (!u) return res.status(400).send('Missing parameter: u');

    let target;
    try {
      target = new URL(u);
    } catch {
      return res.status(400).send('Invalid URL');
    }

    const protocol = (target.protocol || '').toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return res.status(400).send('Unsupported protocol');
    }

    const host = (target.hostname || '').toLowerCase();
    if (!host) return res.status(400).send('Invalid host');

    if (host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1' || host === '::1') {
      return res.status(400).send('Blocked host');
    }

    // Si es IP numérica, bloquear rangos privados
    if (isIP(host) && isPrivateIp(host)) {
      return res.status(400).send('Blocked IP');
    }

    // Denylist explícita
    if (IMAGE_PROXY_DENYLIST.length && hostMatches(IMAGE_PROXY_DENYLIST, host)) {
      return res.status(403).send('Host not allowed');
    }

    // Allowlist opcional: si se define, sólo permite esos hosts
    if (IMAGE_PROXY_ALLOWLIST.length && !hostMatches(IMAGE_PROXY_ALLOWLIST, host)) {
      return res.status(403).send('Host not allowed');
    }

    // Resolver hostnames para evitar SSRF a IPs privadas
    try {
      if (!isIP(host)) {
        const addrs = await dns.promises.lookup(host, { all: true, verbatim: true });
        if (Array.isArray(addrs)) {
          for (const a of addrs) {
            if (a && a.address && isPrivateIp(a.address)) {
              return res.status(400).send('Blocked resolved IP');
            }
          }
        }
      }
    } catch {}

    const upstream = await axios.get(target.toString(), {
      responseType: 'stream',
      headers: {
        // “browser-like” headers para mejorar compatibilidad con CDNs
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MyWed360/1.0',
        'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
      timeout: 15000,
      // Acepta 2xx/3xx; axios seguirá redirecciones automáticamente
      validateStatus: (s) => s >= 200 && s < 400,
      maxRedirects: 3,
    });

    const ct = upstream.headers['content-type'] || 'application/octet-stream';
    if (IMAGE_PROXY_ENFORCE_IMAGE_CT && !ct.toLowerCase().startsWith('image/')) {
      return res.status(415).send('Unsupported media type');
    }

    const len = upstream.headers['content-length'] ? parseInt(upstream.headers['content-length'], 10) : null;
    if (Number.isFinite(len) && len > IMAGE_PROXY_MAX_BYTES) {
      return res.status(413).send('Image too large');
    }

    res.setHeader('Content-Type', ct);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Propagar caching razonable si el origen no lo define
    if (upstream.headers['cache-control']) {
      res.setHeader('Cache-Control', upstream.headers['cache-control']);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    }
    if (upstream.headers['etag']) res.setHeader('ETag', upstream.headers['etag']);
    if (upstream.headers['last-modified']) res.setHeader('Last-Modified', upstream.headers['last-modified']);

    let transferred = 0;
    let aborted = false;
    upstream.data.on('data', (chunk) => {
      if (aborted) return;
      try { transferred += chunk.length; } catch {}
      if (transferred > IMAGE_PROXY_MAX_BYTES) {
        aborted = true;
        try { upstream.data.destroy(); } catch {}
        try { if (!res.headersSent) res.status(413); res.end('Image too large'); } catch {}
      }
    });

    upstream.data.on('error', () => {
      try { res.end(); } catch {}
    });
    if (!aborted) upstream.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.statusText || err.message || 'proxy error';
    console.warn('[image-proxy] error:', message);
    res.status(status).send('Image fetch failed');
  }
});

export default router;
