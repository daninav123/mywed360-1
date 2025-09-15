// routes/ai-songs.js
// Recomendaciones de canciones con IA para momentos especiales
// Requiere: OPENAI_API_KEY en entorno. Si falta, devuelve sugerencias básicas locales.

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde raíz del monorepo si existe
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

let openai = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

async function ensureOpenAI() {
  if (openai || !OPENAI_API_KEY) return;
  const { default: OpenAI } = await import('openai');
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

const router = express.Router();

// Fallback simple si no hay OpenAI
function localFallback(prompt = '', context = 'ceremonia') {
  const base = {
    ceremonia: [
      { title: 'A Thousand Years', artist: 'Christina Perri', mood: 'romántica', tempo: 'lento', era: '2010s', tags: ['entrada novia','moderna'], reason: 'Balada emotiva y popular para entrada de la novia.' },
      { title: 'Canon in D', artist: 'Pachelbel', mood: 'clásica', tempo: 'lento', era: 'barroco', tags: ['procesional','clásica'], reason: 'Clásico atemporal para procesional y momentos solemnes.' },
      { title: 'Perfect', artist: 'Ed Sheeran', mood: 'romántica', tempo: 'medio', era: '2010s', tags: ['entrada','moderna'], reason: 'Letra romántica ideal para entrada o intercambio de anillos.' }
    ],
    coctail: [
      { title: 'Fly Me To The Moon', artist: 'Frank Sinatra', mood: 'elegante', tempo: 'medio', era: '60s', tags: ['jazz','chill'], reason: 'Clásico suave para ambiente de cóctel.' },
      { title: 'Put Your Records On', artist: 'Corinne Bailey Rae', mood: 'relajado', tempo: 'medio', era: '2000s', tags: ['soul','acústico'], reason: 'Vibra cálida y agradable para recibir a los invitados.' }
    ],
    banquete: [
      { title: 'Marry You', artist: 'Bruno Mars', mood: 'feliz', tempo: 'rápido', era: '2010s', tags: ['entrada salón','celebración'], reason: 'Energía festiva para entrada de los novios al salón.' },
      { title: 'Sugar', artist: 'Maroon 5', mood: 'alegre', tempo: 'rápido', era: '2010s', tags: ['corte de tarta','pop'], reason: 'Pop animado que funciona muy bien con momentos señalados.' }
    ],
    disco: [
      { title: 'Thinking Out Loud', artist: 'Ed Sheeran', mood: 'romántica', tempo: 'lento', era: '2010s', tags: ['primer baile','balada'], reason: 'Favorito para primer baile por su ritmo y letra.' },
      { title: 'Danza Kuduro', artist: 'Don Omar', mood: 'fiesta', tempo: 'rápido', era: '2010s', tags: ['abrir pista','latino'], reason: 'Abre y mantiene la pista llena al instante.' }
    ]
  };
  const pick = base[context] || base.ceremonia;
  return { songs: pick, tips: 'Estos son ejemplos locales. Añade más contexto para afinar.' };
}

// Utilidad para intentar extraer JSON aunque venga con "```json" o texto extra
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = text.slice(start, end + 1);
    try { return JSON.parse(sliced); } catch {}
  }
  return null;
}

router.post('/recommend', async (req, res) => {
  const { prompt = '', context = 'ceremonia', language = 'es' } = req.body || {};
  try {
    if (!OPENAI_API_KEY) {
      // Sin clave, devolvemos sugerencias locales
      return res.json(localFallback(prompt, context));
    }

    await ensureOpenAI();
    const model = process.env.OPENAI_MODEL_SONGS || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const sys = language.startsWith('en')
      ? 'You are a wedding DJ and music expert. Suggest songs tailored to the user description and wedding moment. Respond ONLY valid JSON.'
      : 'Eres un DJ de bodas y experto musical. Sugiere canciones en función de la descripción y el momento de la boda. Responde SOLO JSON válido.';

    const user = language.startsWith('en')
      ? `Context: ${context}. Description: ${prompt}`
      : `Contexto: ${context}. Descripción: ${prompt}`;

    const schemaHint = {
      songs: [
        { title: 'Song title', artist: 'Artist', reason: 'Why it fits', mood: 'romántica', tempo: 'lento|medio|rápido', era: '1990s|2000s|2010s|classic', tags: ['primer baile','entrada','salida'] }
      ],
      tips: 'Brief tips to apply the list'
    };

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: `${sys} Devuelve exactamente ${JSON.stringify(schemaHint)} con entre 6 y 12 canciones.` },
        { role: 'user', content: user }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '';
    const data = safeJsonParse(text);
    if (!data || !Array.isArray(data.songs)) {
      // Fallback suave si la IA no devuelve JSON
      return res.json(localFallback(prompt, context));
    }
    return res.json(data);
  } catch (err) {
    console.error('AI songs error:', err?.message || err);
    // No romper UX: devolver fallback
    return res.json(localFallback(prompt, context));
  }
});

export default router;

