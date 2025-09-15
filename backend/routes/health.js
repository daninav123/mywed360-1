import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

// Asegurar Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch {
    // no-op
  }
}

router.get('/', async (_req, res) => {
  const env = process.env || {};
  const now = new Date().toISOString();

  // web-push disponible
  let webPushAvailable = false;
  try {
    const mod = await import('web-push');
    webPushAvailable = !!(mod.default || mod);
  } catch {
    webPushAvailable = false;
  }

  // VAPID configurado
  const vapidConfigured = !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

  // Suscripciones (muestra)
  const subscriptions = { countSampled: 0, sample: [] };
  try {
    const db = admin.firestore();
    const snap = await db.collection('pushSubscriptions').limit(5).get();
    subscriptions.countSampled = snap.size;
    subscriptions.sample = snap.docs.map((d) => {
      const data = d.data() || {};
      const ep = data.subscription && data.subscription.endpoint ? String(data.subscription.endpoint) : '';
      return {
        id: d.id,
        uid: data.uid || null,
        endpointPreview: ep ? ep.slice(0, 48) + (ep.length > 48 ? '…' : '') : null,
      };
    });
  } catch {}

  // Integraciones
  const mailgunConfigured = !!(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN);
  const openaiConfigured = !!env.OPENAI_API_KEY;
  const stripeConfigured = !!env.STRIPE_SECRET_KEY;
  const whatsappProvider = (env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();
  const whatsappConfigured = whatsappProvider === 'twilio'
    ? !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM)
    : false;

  res.json({
    ok: true,
    time: now,
    env: {
      nodeEnv: env.NODE_ENV || 'development',
      allowedOrigin: env.ALLOWED_ORIGIN || null,
      frontendBaseUrl: env.FRONTEND_BASE_URL || null,
      backendBaseUrl: env.BACKEND_BASE_URL || null,
    },
    push: {
      vapidConfigured,
      webPushAvailable,
      subscriptions,
    },
    integrations: {
      mailgun: { configured: mailgunConfigured },
      openai: { configured: openaiConfigured },
      stripe: { configured: stripeConfigured },
      whatsapp: { provider: whatsappProvider, configured: whatsappConfigured },
    },
  });
});

export default router;

