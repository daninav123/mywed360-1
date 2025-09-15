import express from 'express';
import axios from 'axios';
import { isIP } from 'net';

// Sencillo proxy de imágenes para evitar CORS/hotlinking
// GET /api/image-proxy?u=<encoded_url>
// Seguridad básica contra SSRF: sólo http/https y bloqueo de rangos privados/localhost

const router = express.Router();

function isPrivateIp(ip) {
  if (!ip) return false;
  // IPv4 rangos privados y especiales
  return (
    ip.startsWith('10.') ||
    ip.startsWith('127.') ||
    ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
    ip.startsWith('172.2') || // cubre 172.20.0.0 — 172.29.x.x rápidamente
    ip.startsWith('172.30.') || ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('0.') ||
    ip === '::1'
  );
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
    res.setHeader('Content-Type', ct);
    // Propagar caching razonable si el origen no lo define
    if (upstream.headers['cache-control']) {
      res.setHeader('Cache-Control', upstream.headers['cache-control']);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    }
    if (upstream.headers['etag']) res.setHeader('ETag', upstream.headers['etag']);
    if (upstream.headers['last-modified']) res.setHeader('Last-Modified', upstream.headers['last-modified']);

    upstream.data.on('error', () => {
      try { res.end(); } catch {}
    });
    upstream.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.statusText || err.message || 'proxy error';
    console.warn('[image-proxy] error:', message);
    res.status(status).send('Image fetch failed');
  }
});

export default router;

