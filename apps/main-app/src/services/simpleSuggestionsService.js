/**
 * Servicio SIMPLIFICADO de sugerencias con IA
 * Usa descripción de texto libre del usuario para generar sugerencias
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Generar sugerencias basadas en descripción libre del usuario
 */
export async function generateSuggestionsFromDescription({
  momentTitle,
  momentType,
  blockType,
  userDescription,
  count = 10,
}) {
  // Si no hay descripción, devolver vacío
  if (!userDescription || userDescription.trim().length === 0) {
    return {
      success: false,
      suggestions: [],
      message: 'No hay descripción',
    };
  }

  try {
    const prompt = buildSimplePrompt({
      momentTitle,
      momentType,
      blockType,
      userDescription: userDescription.trim(),
      count,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto DJ de bodas. Tu especialidad es recomendar canciones perfectas basándote en las descripciones que te dan los usuarios. Eres conciso y preciso.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const suggestions = parseAISuggestions(content);

    return {
      success: true,
      suggestions,
      fromAI: true,
    };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return {
      success: false,
      error: error.message,
      suggestions: [],
    };
  }
}

/**
 * Construir prompt simple y directo
 */
function buildSimplePrompt({ momentTitle, momentType, blockType, userDescription, count }) {
  return `Momento de la boda: "${momentTitle}" (${blockType})

El usuario busca:
"${userDescription}"

Genera exactamente ${count} canciones que encajen perfectamente con esta descripción.

IMPORTANTE:
- Las canciones deben estar disponibles en Spotify
- Prioriza lo que el usuario ha pedido específicamente
- Si menciona idioma, respeta ese idioma
- Si menciona género o estilo, busca ese estilo
- Si menciona energía (enérgico, tranquilo, etc.), ten eso en cuenta
- Incluye una breve razón (máx 50 caracteres) de por qué encaja

Responde SOLO con un JSON array válido:
[
  {
    "title": "Nombre de la canción",
    "artist": "Artista",
    "reason": "Por qué encaja (máx 50 chars)"
  }
]

NO incluyas texto adicional, SOLO el array JSON.`;
}

/**
 * Parsear respuesta de IA
 */
function parseAISuggestions(content) {
  try {
    let cleaned = content.trim();

    // Remover markdown
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((item, index) => ({
      id: `ai-${Date.now()}-${index}`,
      title: item.title || 'Unknown',
      artist: item.artist || 'Unknown',
      reason: item.reason || '',
      source: 'ai-description',
      fromAI: true,
    }));
  } catch (error) {
    console.error('Error parsing AI suggestions:', error);
    return [];
  }
}

/**
 * Enriquecer sugerencias con Spotify
 */
export async function enrichWithSpotify(suggestions) {
  const enriched = [];

  for (const suggestion of suggestions) {
    try {
      const searchQuery = `${suggestion.title} ${suggestion.artist}`;
      const response = await fetch(
        `http://localhost:4004/api/spotify/search?q=${encodeURIComponent(searchQuery)}&limit=1`
      );

      const data = await response.json();

      if (data.ok && data.tracks && data.tracks.length > 0) {
        const spotifyTrack = data.tracks[0];
        enriched.push({
          ...spotifyTrack,
          reason: suggestion.reason,
          fromAI: true,
        });
      } else {
        enriched.push(suggestion);
      }
    } catch (error) {
      console.error('Error enriching:', error);
      enriched.push(suggestion);
    }
  }

  return enriched;
}
