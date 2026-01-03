/**
 * Spotify Service
 * Maneja la autenticación y búsqueda en Spotify API
 */

import axios from 'axios';

class SpotifyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  // Getter para recargar credenciales cada vez
  get clientId() {
    return process.env.SPOTIFY_CLIENT_ID;
  }

  get clientSecret() {
    return process.env.SPOTIFY_CLIENT_SECRET;
  }

  /**
   * Obtener access token de Spotify usando Client Credentials Flow
   */
  async getAccessToken() {
    // Validar que tenemos credenciales
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Credenciales de Spotify no configuradas. Configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env'
      );
    }

    console.log('[SpotifyService] Client ID:', this.clientId);
    console.log('[SpotifyService] Client Secret length:', this.clientSecret?.length);

    // Si ya tenemos un token válido, devolverlo
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
              'base64'
            )}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Guardar cuando expira (con 5 min de margen)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('[SpotifyService] ✅ Token obtenido exitosamente');
      return this.accessToken;
    } catch (error) {
      console.error('[SpotifyService] Error getting access token:', error.message);
      console.error('[SpotifyService] Error details:', error.response?.data);
      throw new Error('No se pudo autenticar con Spotify. Verifica tus credenciales.');
    }
  }

  /**
   * Buscar canciones en Spotify
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Número de resultados (máx 50)
   * @returns {Array} Lista de canciones
   */
  async searchTracks(query, limit = 20) {
    if (!query || query.trim() === '') {
      return [];
    }

    try {
      const token = await this.getAccessToken();

      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: query.trim(),
          type: 'track',
          limit: Math.min(limit, 50), // Spotify máximo es 50
          market: 'ES', // Mercado español
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const tracks = response.data.tracks.items;

      // Transformar a nuestro formato
      return tracks.map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        previewUrl: track.preview_url, // 30s preview (puede ser null)
        trackUrl: track.external_urls.spotify, // URL completa de Spotify
        artwork: track.album.images[0]?.url || track.album.images[1]?.url || '',
        duration: track.duration_ms,
        source: 'spotify',
      }));
    } catch (error) {
      console.error('[SpotifyService] Error searching tracks:', error.message);

      // Si es error de autenticación, intentar refrescar token
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiresAt = null;
        // Reintentar una vez
        return this.searchTracks(query, limit);
      }

      throw new Error('No se pudo buscar en Spotify');
    }
  }

  /**
   * Obtener información de una canción por ID
   * @param {string} trackId - ID de la canción en Spotify
   * @returns {Object} Información de la canción
   */
  async getTrack(trackId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const track = response.data;

      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        previewUrl: track.preview_url,
        trackUrl: track.external_urls.spotify,
        artwork: track.album.images[0]?.url || '',
        duration: track.duration_ms,
        source: 'spotify',
      };
    } catch (error) {
      console.error('[SpotifyService] Error getting track:', error.message);
      throw new Error('No se pudo obtener la canción de Spotify');
    }
  }
}

// Singleton
const spotifyService = new SpotifyService();

export default spotifyService;
