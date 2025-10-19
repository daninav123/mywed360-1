// Centralized backend configuration with validation
import { z } from 'zod';

const env = process.env;

const ConfigSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_AI_MAX: z.string().optional(),
  RATE_LIMIT_GLOBAL_MAX: z.string().optional(),
  ADMIN_IP_ALLOWLIST: z.string().optional(),
  WEBHOOK_RATE_LIMIT_MAX: z.string().optional(),
  WHATSAPP_WEBHOOK_RATE_LIMIT_MAX: z.string().optional(),
  MAILGUN_WEBHOOK_RATE_LIMIT_MAX: z.string().optional(),
  WHATSAPP_WEBHOOK_IP_ALLOWLIST: z.string().optional(),
  MAILGUN_WEBHOOK_IP_ALLOWLIST: z.string().optional(),
  IMAGE_PROXY_ALLOWLIST: z.string().optional(),
  IMAGE_PROXY_DENYLIST: z.string().optional(),
  IMAGE_PROXY_MAX_BYTES: z.string().optional(),
  IMAGE_PROXY_ENFORCE_IMAGE_CT: z.string().optional(),
});

const parsed = ConfigSchema.safeParse(env);
if (!parsed.success) {
  // Non-fatal; fall back to process.env defaults
  // eslint-disable-next-line no-console
  console.warn('[config] Failed to parse env, using defaults');
}

const cfg = parsed.success ? parsed.data : {
  NODE_ENV: env.NODE_ENV || 'development',
  PORT: env.PORT,
  ALLOWED_ORIGIN: env.ALLOWED_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_AI_MAX: env.RATE_LIMIT_AI_MAX,
  RATE_LIMIT_GLOBAL_MAX: env.RATE_LIMIT_GLOBAL_MAX,
  ADMIN_IP_ALLOWLIST: env.ADMIN_IP_ALLOWLIST,
  WEBHOOK_RATE_LIMIT_MAX: env.WEBHOOK_RATE_LIMIT_MAX,
  WHATSAPP_WEBHOOK_RATE_LIMIT_MAX: env.WHATSAPP_WEBHOOK_RATE_LIMIT_MAX,
  MAILGUN_WEBHOOK_RATE_LIMIT_MAX: env.MAILGUN_WEBHOOK_RATE_LIMIT_MAX,
  WHATSAPP_WEBHOOK_IP_ALLOWLIST: env.WHATSAPP_WEBHOOK_IP_ALLOWLIST,
  MAILGUN_WEBHOOK_IP_ALLOWLIST: env.MAILGUN_WEBHOOK_IP_ALLOWLIST,
  IMAGE_PROXY_ALLOWLIST: env.IMAGE_PROXY_ALLOWLIST,
  IMAGE_PROXY_DENYLIST: env.IMAGE_PROXY_DENYLIST,
  IMAGE_PROXY_MAX_BYTES: env.IMAGE_PROXY_MAX_BYTES,
  IMAGE_PROXY_ENFORCE_IMAGE_CT: env.IMAGE_PROXY_ENFORCE_IMAGE_CT,
};

const isProd = String(cfg.NODE_ENV).toLowerCase() === 'production';

// Always allow known frontend domains even if ALLOWED_ORIGIN is misconfigured.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://mywed360.netlify.app',
  'https://mywed360.web.app',
  'https://app.mywed360.com',
  'https://lovenda.mywed360.com',
].filter(Boolean);

// Derived values
const PORT = cfg.PORT ? Number(cfg.PORT) : 4004;
const envAllowedOrigins = String(cfg.ALLOWED_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(
  new Set([...DEFAULT_ALLOWED_ORIGINS, ...envAllowedOrigins])
);

const RATE_LIMIT_AI = cfg.RATE_LIMIT_AI_MAX
  ? Number(cfg.RATE_LIMIT_AI_MAX)
  : (isProd ? 60 : 0);

const RATE_LIMIT_GLOBAL = cfg.RATE_LIMIT_GLOBAL_MAX
  ? Number(cfg.RATE_LIMIT_GLOBAL_MAX)
  : (isProd ? 600 : 0);

const CORS_EXPOSE_HEADERS = ['X-Request-ID'];

const ADMIN_IP_ALLOWLIST = (cfg.ADMIN_IP_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const IMAGE_PROXY_ALLOWLIST = (cfg.IMAGE_PROXY_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const IMAGE_PROXY_DENYLIST = (cfg.IMAGE_PROXY_DENYLIST || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const IMAGE_PROXY_MAX_BYTES = cfg.IMAGE_PROXY_MAX_BYTES ? Number(cfg.IMAGE_PROXY_MAX_BYTES) : 2 * 1024 * 1024;
const IMAGE_PROXY_ENFORCE_IMAGE_CT = (cfg.IMAGE_PROXY_ENFORCE_IMAGE_CT || '').toLowerCase() !== 'false';

// Webhook-specific rate limits (fallback to general WEBHOOK_RATE_LIMIT_MAX, then default)
const WEBHOOK_RATE_LIMIT_MAX = cfg.WEBHOOK_RATE_LIMIT_MAX
  ? Number(cfg.WEBHOOK_RATE_LIMIT_MAX)
  : (isProd ? 120 : 0);

const WHATSAPP_WEBHOOK_RATE_LIMIT_MAX = cfg.WHATSAPP_WEBHOOK_RATE_LIMIT_MAX
  ? Number(cfg.WHATSAPP_WEBHOOK_RATE_LIMIT_MAX)
  : WEBHOOK_RATE_LIMIT_MAX;

const MAILGUN_WEBHOOK_RATE_LIMIT_MAX = cfg.MAILGUN_WEBHOOK_RATE_LIMIT_MAX
  ? Number(cfg.MAILGUN_WEBHOOK_RATE_LIMIT_MAX)
  : WEBHOOK_RATE_LIMIT_MAX;

const WHATSAPP_WEBHOOK_IP_ALLOWLIST = (cfg.WHATSAPP_WEBHOOK_IP_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MAILGUN_WEBHOOK_IP_ALLOWLIST = (cfg.MAILGUN_WEBHOOK_IP_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export {
  PORT,
  ALLOWED_ORIGINS,
  RATE_LIMIT_AI as RATE_LIMIT_AI_MAX,
  RATE_LIMIT_GLOBAL as RATE_LIMIT_GLOBAL_MAX,
  CORS_EXPOSE_HEADERS,
  ADMIN_IP_ALLOWLIST,
  WEBHOOK_RATE_LIMIT_MAX,
  WHATSAPP_WEBHOOK_RATE_LIMIT_MAX,
  MAILGUN_WEBHOOK_RATE_LIMIT_MAX,
  WHATSAPP_WEBHOOK_IP_ALLOWLIST,
  MAILGUN_WEBHOOK_IP_ALLOWLIST,
  IMAGE_PROXY_ALLOWLIST,
  IMAGE_PROXY_DENYLIST,
  IMAGE_PROXY_MAX_BYTES,
  IMAGE_PROXY_ENFORCE_IMAGE_CT,
};
