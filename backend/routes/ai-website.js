// routes/ai-website.js
// Generacion de HTML para sitios de boda mediante OpenAI

import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

let openai = null;
let openAIConfig = { apiKeyPrefix: null, projectId: null };

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';
  return { apiKey, projectId };
}

function ensureOpenAI() {
  const { apiKey, projectId } = getOpenAIConfig();
  const apiKeyPrefix = apiKey ? apiKey.slice(0, 8) : null;

  if (!apiKey) {
    openai = null;
    openAIConfig = { apiKeyPrefix: null, projectId: null };
    return null;
  }

  if (openai && openAIConfig.apiKeyPrefix === apiKeyPrefix && openAIConfig.projectId === (projectId || null)) {
    return openai;
  }

  openai = new OpenAI({
    apiKey,
    project: projectId || undefined,
    timeout: 15000,
    maxRetries: 2,
  });
  openAIConfig = { apiKeyPrefix, projectId: projectId || null };
  logger.info('[ai-website] Cliente OpenAI inicializado/actualizado', {
    projectId: projectId || null,
  });
  return openai;
}

router.post('/generate', async (req, res) => {
  const client = ensureOpenAI();
  if (!client) {
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
    const completion = await client.chat.completions.create({
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
