// routes/ai-suppliers.js
// Endpoint que llama a OpenAI para buscar proveedores de boda
// POST /api/ai-suppliers
// Body (JSON): { query: string, service?: string, budget?: string, profile?: object, location?: string }
// Respuesta: Array<{title, link, snippet, service, location, priceRange}>

import express from 'express';
import OpenAI from 'openai';
import logger from '../logger.js';

const router = express.Router();

let openai = null;
let openAIConfig = { apiKey: null, projectId: null };

const resolveApiKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const resolveProjectId = () => process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';

const ensureOpenAIClient = () => {
  const apiKey = resolveApiKey().trim();
  const projectId = resolveProjectId().trim();

  if (!apiKey) {
    if (openai) logger.warn('[ai-suppliers] cliente OpenAI eliminado porque no hay API key');
    openai = null;
    openAIConfig = { apiKey: null, projectId: null };
    return false;
  }

  if (openai && openAIConfig.apiKey === apiKey && openAIConfig.projectId === projectId) {
    return true;
  }

  try {
    openai = new OpenAI({ apiKey, project: projectId || undefined });
    openAIConfig = { apiKey, projectId };
    logger.info('[ai-suppliers] Cliente OpenAI inicializado/actualizado', {
      apiKeyPrefix: apiKey.slice(0, 8),
      projectId: projectId || null,
    });
    return true;
  } catch (error) {
    openai = null;
    openAIConfig = { apiKey: null, projectId: null };
    logger.error('[ai-suppliers] No se pudo inicializar OpenAI', { message: error?.message });
    return false;
  }
};

// Intento de inicialización al cargar el módulo
ensureOpenAIClient();

router.post('/', async (req, res) => {
  const hasClient = ensureOpenAIClient();
  if (!hasClient || !openai) {
    logger.error('[ai-suppliers] Petición sin cliente OpenAI disponible');
    return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  }
  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const servicioSeleccionado = service;
  // Derivar ubicación desde distintos posibles campos del perfil
  const formattedLocation =
    location ||
    (profile && (profile.celebrationPlace || profile.location || profile.city || profile.ceremonyLocation || profile.receptionVenue)) ||
    (profile && profile.weddingInfo && (profile.weddingInfo.celebrationPlace || profile.weddingInfo.location || profile.weddingInfo.city)) ||
    'Espana';

  const locationPrompt = formattedLocation
    ? `La boda es en ${formattedLocation}.`
    : 'La ubicacion de la boda no esta especificada.';
  const inferredBudget =
    budget ||
    (profile && (profile.budget || profile.estimatedBudget || profile.totalBudget)) ||
    (profile && profile.weddingInfo && (profile.weddingInfo.budget || profile.weddingInfo.estimatedBudget || profile.weddingInfo.totalBudget)) ||
    '';
  const budgetPrompt = inferredBudget ? `El presupuesto es ${inferredBudget}.` : 'No hay un presupuesto especificado.';

  const prompt = `Actua como un asistente de planificacion de bodas que busca proveedores reales.
Necesito encontrar proveedores de "${servicioSeleccionado || 'servicios para bodas'}" que ofrezcan: "${query}".
${locationPrompt}
${budgetPrompt}
Devuelve UNICAMENTE un array JSON con 5 opciones de proveedores reales, con el formato exacto por cada proveedor: \n{
  \"title\": \"Nombre del proveedor\",\n  \"link\": \"URL de su web oficial o perfil en plataforma de bodas\",\n  \"snippet\": \"Breve descripcion del servicio que ofrecen\",\n  \"service\": \"${servicioSeleccionado || 'Servicios para bodas'}\",\n  \"location\": \"Ubicacion del proveedor (ciudad o provincia)\",\n  \"priceRange\": \"Rango de precios aproximado\"\n}\nAsegurate de: 1) incluir enlaces reales y operativos, preferiblemente web oficial o bodas.net; 2) priorizar proveedores en ${formattedLocation}; 3) que sean relevantes para "${query}"; 4) devolver SOLO el array JSON, sin texto adicional.`;

  try {
    logger.info('[ai-suppliers] solicitando resultados a OpenAI', {
      query,
      service: servicioSeleccionado || 'Servicios para bodas',
      projectId: openAIConfig.projectId || null,
      apiKeyPrefix: (openAIConfig.apiKey || '').slice(0, 8),
    });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Eres un asistente experto en planificacion de bodas.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '';
    let results = [];
    try {
      results = JSON.parse(content);
    } catch {
      // Intentar extraer substring que parezca un array JSON
      const match = content.match(/\[.*\]/s);
      if (match) {
        try {
          results = JSON.parse(match[0]);
        } catch {
          /* deja results vacio */
        }
      }
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(502).json({ error: 'openai_invalid_response', raw: content });
    }

    res.json(results);
  } catch (err) {
    logger.error('[ai-suppliers] Error en llamada a OpenAI', {
      message: err?.message,
      stack: err?.stack,
      type: err?.type,
    });
    res.status(500).json({ error: 'openai_failed', details: err?.message || 'unknown' });
  }
});

export default router;
