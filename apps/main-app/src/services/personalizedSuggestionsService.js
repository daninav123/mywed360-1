/**
 * Servicio de sugerencias personalizadas de música usando OpenAI
 * Genera recomendaciones basadas en gustos del usuario y contexto
 * Usa el proxy backend para centralizar llamadas a OpenAI
 */

import { generateUserMusicProfile } from './musicPreferencesService';
import { apiPost } from './apiClient';

/**
 * Generar sugerencias personalizadas para un momento específico
 */
export async function generatePersonalizedSuggestions({
  momentTitle,
  momentType,
  blockType,
  userPreferences,
  selectedSongsAnalysis,
  count = 10,
}) {
  try {
    // Construir perfil del usuario
    const userProfile = generateUserMusicProfile(userPreferences, selectedSongsAnalysis);

    // Construir prompt personalizado
    const prompt = buildSuggestionPrompt({
      momentTitle,
      momentType,
      blockType,
      userProfile,
      selectedSongs: selectedSongsAnalysis?.songs || [],
      count,
    });

    // Llamar a OpenAI vía proxy backend
    const response = await apiPost('/api/proxy/openai', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto DJ de bodas y curador musical. Tu especialidad es recomendar canciones perfectas para momentos específicos de bodas, considerando los gustos musicales únicos de cada pareja.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    if (!response.ok) {
      throw new Error(`Proxy OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parsear respuesta JSON
    const suggestions = parseOpenAISuggestions(content);

    return {
      success: true,
      suggestions,
      personalized: true,
    };
  } catch (error) {
    console.error('Error generating personalized suggestions:', error);

    // Fallback a sugerencias genéricas
    return {
      success: false,
      error: error.message,
      suggestions: [],
      personalized: false,
    };
  }
}

/**
 * Construir prompt para OpenAI
 */
function buildSuggestionPrompt({
  momentTitle,
  momentType,
  blockType,
  userProfile,
  selectedSongs,
  count,
}) {
  const context = [];

  // Contexto del momento
  context.push(`Momento de la boda: "${momentTitle}" (tipo: ${momentType || 'otro'})`);
  context.push(`Bloque: ${blockType}`);

  // Perfil del usuario
  if (userProfile) {
    context.push(`\nPerfil musical de la pareja:\n${userProfile}`);
  }

  // Canciones ya seleccionadas (para entender el estilo)
  if (selectedSongs && selectedSongs.length > 0) {
    const recentSongs = selectedSongs
      .slice(-10)
      .map((s) => `"${s.title}" - ${s.artist}`)
      .join(', ');
    context.push(`\nCanciones que ya han elegido para otros momentos: ${recentSongs}`);
  }

  const prompt = `${context.join('\n')}

Genera exactamente ${count} sugerencias de canciones PERFECTAS y ALTAMENTE PERSONALIZADAS para este momento específico.

IMPORTANTE:
- Las sugerencias deben ser coherentes con el perfil musical de la pareja
- Considera el contexto del momento (${momentTitle})
- Varía entre canciones conocidas y algunas menos obvias pero perfectas
- Incluye canciones que estén disponibles en Spotify
- Mezcla idiomas según las preferencias
- Cada sugerencia debe tener título, artista y una breve razón personalizada

Responde SOLO con un JSON array válido en este formato:
[
  {
    "title": "Nombre de la canción",
    "artist": "Nombre del artista",
    "reason": "Por qué es perfecta para esta pareja y momento (máx 60 caracteres)"
  }
]

NO incluyas texto adicional, SOLO el array JSON.`;

  return prompt;
}

/**
 * Parsear respuesta de OpenAI
 */
function parseOpenAISuggestions(content) {
  try {
    // Limpiar content si tiene markdown
    let cleaned = content.trim();

    // Remover markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Parsear JSON
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validar y normalizar cada sugerencia
    return parsed.map((item, index) => ({
      id: `ai-${Date.now()}-${index}`,
      title: item.title || 'Unknown',
      artist: item.artist || 'Unknown',
      reason: item.reason || '',
      source: 'ai-personalized',
      personalized: true,
    }));
  } catch (error) {
    console.error('Error parsing OpenAI suggestions:', error);
    return [];
  }
}

/**
 * Obtener sugerencias rápidas (sin OpenAI, basadas en patrones)
 */
export function getQuickPersonalizedSuggestions({
  momentType,
  userPreferences,
  selectedSongsAnalysis,
  count = 5,
}) {
  // Implementar lógica simple basada en:
  // 1. Artistas favoritos del usuario
  // 2. Géneros preferidos
  // 3. Artistas que ya han seleccionado

  const suggestions = [];

  // Si tienen artistas favoritos, sugerir otras canciones de esos artistas
  if (userPreferences.favoriteArtists && userPreferences.favoriteArtists.length > 0) {
    userPreferences.favoriteArtists.slice(0, count).forEach((artist, index) => {
      suggestions.push({
        id: `quick-${index}`,
        title: `Buscar canciones de ${artist}`,
        artist: artist,
        reason: 'De tus artistas favoritos',
        source: 'quick-personalized',
        searchQuery: artist, // Para usar en búsqueda directa
      });
    });
  }

  return suggestions.slice(0, count);
}

/**
 * Enriquecer sugerencias con búsqueda en Spotify
 */
export async function enrichSuggestionsWithSpotify(suggestions) {
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
          ...suggestion,
          ...spotifyTrack,
          reason: suggestion.reason, // Preservar la razón personalizada
          personalized: true,
        });
      } else {
        // Si no se encuentra en Spotify, mantener la sugerencia original
        enriched.push(suggestion);
      }
    } catch (error) {
      console.error('Error enriching suggestion:', error);
      enriched.push(suggestion);
    }
  }

  return enriched;
}

/**
 * Generar sugerencias para bloque completo
 */
export async function generateBlockSuggestions({
  blockType,
  blockName,
  userPreferences,
  selectedSongsAnalysis,
  momentsInBlock,
}) {
  try {
    const userProfile = generateUserMusicProfile(userPreferences, selectedSongsAnalysis);

    const prompt = `Contexto: Bloque "${blockName}" de una boda con ${momentsInBlock.length} momentos.

Perfil musical de la pareja:
${userProfile}

Genera 15 canciones perfectas para este bloque completo de la boda. Considera que:
- ${blockType === 'ceremonia' ? 'Es un momento emotivo y solemne' : ''}
- ${blockType === 'coctail' ? 'Es un momento social y relajado' : ''}
- ${blockType === 'banquete' ? 'Es el momento central con la cena y el baile' : ''}
- ${blockType === 'disco' ? 'Es el momento de máxima fiesta y baile' : ''}

Las canciones deben ser coherentes con el perfil y perfectas para el ambiente del bloque.

Responde SOLO con un JSON array en este formato:
[
  {
    "title": "Nombre de la canción",
    "artist": "Artista",
    "reason": "Por qué encaja en este bloque (máx 50 chars)"
  }
]`;

    const response = await apiPost('/api/proxy/openai', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto DJ de bodas especializado en curar playlists perfectas.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    if (!response.ok) {
      throw new Error(`Proxy OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response;
    const suggestions = parseOpenAISuggestions(content);

    return {
      success: true,
      suggestions,
      blockType,
    };
  } catch (error) {
    console.error('Error generating block suggestions:', error);
    return {
      success: false,
      error: error.message,
      suggestions: [],
    };
  }
}
