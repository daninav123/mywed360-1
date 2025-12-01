// routes/ai-website.js
// Generacion de HTML para sitios de boda mediante OpenAI

import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const projectId = process.env.OPENAI_PROJECT_ID;
let openai = null;

if (apiKey) {
  openai = new OpenAI({ apiKey, project: projectId });
  logger.info('[ai-website] Cliente OpenAI inicializado');
} else {
  logger.warn('[ai-website] OPENAI_API_KEY no definido. /api/ai-website/generate devolvera 503');
}

router.post('/generate', async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: 'openai_unavailable' });
  }

  const {
    systemMessage,
    userMessage,
    temperature = 0.55,
    model,
    weddingId = null,
    templateKey = 'personalizada',
  } = req.body || {};

  if (typeof systemMessage !== 'string' || !systemMessage.trim()) {
    return res.status(400).json({ error: 'invalid_prompt', detail: 'systemMessage required' });
  }
  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return res.status(400).json({ error: 'invalid_prompt', detail: 'userMessage required' });
  }

  const parsedTemperature = Number.parseFloat(temperature);
  const safeTemperature = Number.isFinite(parsedTemperature) ? parsedTemperature : 0.55;
  const finalModel =
    model || process.env.OPENAI_MODEL_WEBSITE || process.env.OPENAI_MODEL || 'gpt-4o';

  try {
    const completion = await openai.chat.completions.create({
      model: finalModel,
      temperature: safeTemperature,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
    });

    const html = completion?.choices?.[0]?.message?.content || '';
    const usage = completion?.usage || null;

    return res.json({
      ok: true,
      html,
      usage,
      model: completion?.model || finalModel,
      id: completion?.id || null,
      templateKey,
      weddingId,
    });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    logger.error('[ai-website] Error generando sitio', {
      message: err?.message || err,
      status,
    });

    if (status === 429) {
      return res.status(429).json({ error: 'openai_rate_limited' });
    }
    if (status === 401 || status === 403) {
      return res.status(502).json({ error: 'openai_auth_failed' });
    }

    return res.status(502).json({ error: 'openai_failed', detail: err?.message || 'unknown' });
  }
});

export default router;
