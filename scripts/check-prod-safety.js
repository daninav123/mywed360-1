#!/usr/bin/env node
// Non-blocking safety checks for production builds.
// Logs warnings if risky client-side flags are enabled.

try {
  const env = process.env;
  const isProd = String(env.NODE_ENV || '').toLowerCase() === 'production';

  const directOpenAI = String(env.VITE_ENABLE_DIRECT_OPENAI || '').toLowerCase() === 'true';
  const clientOpenAIKey = !!env.VITE_OPENAI_API_KEY;

  const msgs = [];
  if (directOpenAI) {
    msgs.push("[warn] VITE_ENABLE_DIRECT_OPENAI=true: el frontend intentará llamar a OpenAI directamente. Recomendado false en prod.");
  }
  if (clientOpenAIKey) {
    msgs.push("[warn] VITE_OPENAI_API_KEY definido en build: se incrustará en el bundle del cliente. Evítalo en prod.");
  }

  if (msgs.length) {
    console.warn("[check-prod-safety] Advertencias:");
    for (const m of msgs) console.warn(" -", m);
    if (isProd) console.warn("[check-prod-safety] Sugerencia: usar backend en Render para proxiar OpenAI y no exponer claves.");
  } else {
    console.log("[check-prod-safety] OK: flags de seguridad adecuadas para build");
  }
} catch (e) {
  console.warn('[check-prod-safety] Skipped (', e && e.message, ')');
}

