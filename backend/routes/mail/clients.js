import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mailgunJs from 'mailgun-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde backend/.env
const envPath = path.join(__dirname, '..', '..', '.env');
try {
  console.log('Intentando cargar configuración de Mailgun desde:', envPath);
  dotenv.config({ path: envPath });
} catch {}

export function createMailgunClients() {
  const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const MAILGUN_SENDING_DOMAIN = process.env.VITE_MAILGUN_SENDING_DOMAIN || process.env.MAILGUN_SENDING_DOMAIN;
  const MAILGUN_EU_REGION = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();

  try {
    console.log('Configuración de Mailgun:', {
      apiKey: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 5) + '***' : 'no definida',
      domain: MAILGUN_DOMAIN || 'no definido',
      sendingDomain: MAILGUN_SENDING_DOMAIN || 'no definido',
      euRegion: MAILGUN_EU_REGION,
    });
  } catch {}

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun no configurado: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN. Se omitirá el envío real.');
    return { mailgun: null, mailgunAlt: null };
  }

  const commonHostCfg = MAILGUN_EU_REGION === 'true' ? { host: 'api.eu.mailgun.net' } : {};
  try {
    const mailgun = mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, ...commonHostCfg });
    const mailgunAlt = MAILGUN_SENDING_DOMAIN
      ? mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_SENDING_DOMAIN, ...commonHostCfg })
      : null;
    return { mailgun, mailgunAlt };
  } catch (e) {
    console.error('No se pudieron crear los clientes de Mailgun:', e.message);
    return { mailgun: null, mailgunAlt: null };
  }
}

