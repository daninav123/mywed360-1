import logger from '../logger.js';

function normalizeIp(ip) {
  if (!ip) return '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function ipv4ToInt(ip) {
  const parts = ip.split('.').map((x) => parseInt(x, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function matchCidr(ip, cidr) {
  const [base, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  if (!base || !Number.isFinite(bits)) return false;
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt == null || baseInt == null || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

export default function ipAllowlist(allowed = []) {
  const entries = Array.isArray(allowed) ? allowed : String(allowed || '').split(',');
  const list = entries.map((s) => String(s).trim()).filter(Boolean);
  const disabled = list.length === 0 || list.includes('*');

  return (req, res, next) => {
    if (disabled) return next();
    try {
      const ipRaw = (req.ip || (Array.isArray(req.ips) && req.ips[0]) || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();
      const ip = normalizeIp(ipRaw);
      const ok = list.some((rule) => {
        const r = rule.toLowerCase();
        if (r === 'localhost') return ip === '127.0.0.1';
        if (r.includes('/')) return matchCidr(ip, r);
        return ip === normalizeIp(r);
      });
      if (ok) return next();
      try { logger.warn(`[Allowlist] IP no permitido: ${ip} for ${req.method} ${req.originalUrl}`); } catch {}
      return res.status(403).json({ success: false, error: { code: 'ip_not_allowed', message: 'IP not allowed' } });
    } catch (e) {
      try { logger.error('[Allowlist] Error evaluando allowlist', e); } catch {}
      return res.status(500).json({ success: false, error: { code: 'allowlist_error', message: 'Internal error' } });
    }
  };
}

