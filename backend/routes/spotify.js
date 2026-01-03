// routes/spotify.js
// Spotify OAuth (Authorization Code) integration + connection status

import express from 'express';
import axios from 'axios';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import spotifyService from '../services/spotifyService.js';

const router = express.Router();

function getSpotifyConfig() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
  const SPOTIFY_REDIRECT_URI =
    process.env.SPOTIFY_REDIRECT_URI ||
    `${process.env.BACKEND_BASE_URL || 'http://localhost:4004'}/api/spotify/callback`;
  const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    (process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',')[0] : 'http://localhost:5173');
  return { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, FRONTEND_URL };
}

function ensureConfig(res) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = getSpotifyConfig();
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    res.status(503).json({ ok: false, error: 'Spotify no configurado en el servidor' });
    return false;
  }
  return true;
}

// GET /api/spotify/login -> 302 redirect to Spotify authorize
router.get('/login', optionalAuth, async (req, res) => {
  if (!ensureConfig(res)) return;
  try {
    const uid = req.user?.uid || 'anonymous';
    const state = randomUUID();
    await admin
      .firestore()
      .collection('spotifyAuthStates')
      .doc(state)
      .set(
        {
          uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          returnTo: req.query.return || null,
        },
        { merge: true }
      );
    const scope = [
      'user-read-email',
      'user-read-private',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
    ].join(' ');
    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
    url.searchParams.set('scope', scope);
    url.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI);
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (e) {
    res.status(500).json({ ok: false, error: 'login-failed' });
  }
});

// GET /api/spotify/callback?code&state
router.get('/callback', optionalAuth, async (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    return res.status(500).send('Spotify no configurado');
  }
  const { code, state, error } = req.query || {};
  if (error) return res.status(400).send('Spotify error: ' + error);
  if (!code || !state) return res.status(400).send('Missing code/state');
  try {
    const stDoc = await admin.firestore().collection('spotifyAuthStates').doc(state).get();
    if (!stDoc.exists) return res.status(400).send('Invalid state');
    const { uid, returnTo } = stDoc.data() || {};
    await admin
      .firestore()
      .collection('spotifyAuthStates')
      .doc(state)
      .delete()
      .catch(() => {});

    // Exchange code for tokens
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', SPOTIFY_REDIRECT_URI);
    params.set('client_id', SPOTIFY_CLIENT_ID);
    params.set('client_secret', SPOTIFY_CLIENT_SECRET);
    const tokenResp = await axios.post(
      'https://accounts.spotify.com/api/token',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    const tok = tokenResp.data || {};
    const expires_at = Date.now() + (tok.expires_in ? tok.expires_in * 1000 : 3600 * 1000);

    // Fetch profile
    let profile = null;
    try {
      const me = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      });
      profile = me.data || null;
    } catch {}

    await admin
      .firestore()
      .collection('spotifyTokens')
      .doc(uid)
      .set(
        {
          access_token: tok.access_token,
          refresh_token: tok.refresh_token || null,
          scope: tok.scope || '',
          token_type: tok.token_type || 'Bearer',
          expires_at,
          profile,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const target = returnTo || `${FRONTEND_URL}/perfil?spotify=ok`;
    res.redirect(target);
  } catch (e) {
    console.error('Spotify callback error', e?.message || e);
    res.status(500).send('Callback error');
  }
});

// GET /api/spotify/search?q=query - Buscar canciones en Spotify (público)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;

    if (!query.trim()) {
      return res.json({ ok: true, tracks: [] });
    }

    const tracks = await spotifyService.searchTracks(query, limit);
    res.json({ ok: true, tracks });
  } catch (error) {
    console.error('[Spotify Search] Error:', error.message);
    res.status(500).json({ ok: false, error: error.message || 'Error buscando en Spotify' });
  }
});

// GET /api/spotify/track/:id - Obtener info de una canción (público)
router.get('/track/:id', async (req, res) => {
  try {
    const trackId = req.params.id;
    const track = await spotifyService.getTrack(trackId);
    res.json({ ok: true, track });
  } catch (error) {
    console.error('[Spotify Track] Error:', error.message);
    res.status(500).json({ ok: false, error: error.message || 'Error obteniendo canción' });
  }
});

// GET /api/spotify/status - Verificar estado de autenticación (sin middleware, manual)
router.get('/status', async (req, res) => {
  try {
    // Intentar obtener token de Firebase manualmente
    const authHeader = req.headers.authorization;
    let uid = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (error) {
        // Token inválido o expirado, continuar sin uid
        console.log('[Spotify Status] Token inválido:', error.message);
      }
    }

    // Si no hay usuario autenticado, retornar no conectado
    if (!uid) {
      return res.json({ ok: true, connected: false });
    }

    // Verificar si el usuario tiene token de Spotify guardado en Firestore
    const tokenDoc = await admin.firestore().collection('spotifyTokens').doc(uid).get();

    if (!tokenDoc.exists) {
      return res.json({ ok: true, connected: false });
    }

    const tokenData = tokenDoc.data();

    // Verificar si el token no ha expirado
    const now = Date.now();
    const isExpired = tokenData.expires_at && tokenData.expires_at < now;

    if (isExpired) {
      return res.json({ ok: true, connected: false, expired: true });
    }

    const profile = tokenData.profile || null;

    res.json({
      ok: true,
      connected: true,
      profile: profile
        ? {
            display_name: profile.display_name,
            email: profile.email,
            id: profile.id,
            images: profile.images || [],
          }
        : null,
    });
  } catch (error) {
    console.error('[Spotify Status] Error:', error.message);
    res.json({ ok: true, connected: false });
  }
});

// POST /api/spotify/logout - Cerrar sesión de Spotify
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, error: 'no-auth' });

    // Eliminar token de Firestore
    await admin.firestore().collection('spotifyTokens').doc(uid).delete();

    res.json({ ok: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('[Spotify Logout] Error:', error.message);
    res.status(500).json({ ok: false, error: 'logout-failed' });
  }
});

export default router;
