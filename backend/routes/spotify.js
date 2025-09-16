// routes/spotify.js
// Spotify OAuth (Authorization Code) integration + connection status

import express from 'express';
import axios from 'axios';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${process.env.BACKEND_BASE_URL || 'http://localhost:4004'}/api/spotify/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',')[0] : 'http://localhost:5173');

function ensureConfig(res) {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
    res.status(503).json({ ok: false, error: 'Spotify no configurado en el servidor' });
    return false;
  }
  return true;
}

// GET /api/spotify/status -> { connected, scopes, expiresAt }
router.get('/status', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, error: 'no-auth' });
    const snap = await admin.firestore().collection('spotifyTokens').doc(uid).get();
    if (!snap.exists) return res.json({ ok: true, connected: false });
    const data = snap.data() || {};
    const now = Date.now();
    const connected = Boolean(data.access_token) && (data.expires_at ? data.expires_at > now : true);
    res.json({ ok: true, connected, scopes: data.scope || data.scopes || '', expiresAt: data.expires_at || null, profile: data.profile || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'status-failed' });
  }
});

// GET /api/spotify/login -> 302 redirect to Spotify authorize
router.get('/login', requireAuth, async (req, res) => {
  if (!ensureConfig(res)) return;
  try {
    const uid = req.user?.uid;
    const state = randomUUID();
    await admin.firestore().collection('spotifyAuthStates').doc(state).set({
      uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      returnTo: req.query.return || null,
    }, { merge: true });
    const scope = [
      'user-read-email',
      'user-read-private',
      'user-top-read',
      'playlist-read-private'
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
    await admin.firestore().collection('spotifyAuthStates').doc(state).delete().catch(()=>{});

    // Exchange code for tokens
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', SPOTIFY_REDIRECT_URI);
    params.set('client_id', SPOTIFY_CLIENT_ID);
    params.set('client_secret', SPOTIFY_CLIENT_SECRET);
    const tokenResp = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const tok = tokenResp.data || {};
    const expires_at = Date.now() + (tok.expires_in ? tok.expires_in * 1000 : 3600 * 1000);

    // Fetch profile
    let profile = null;
    try {
      const me = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tok.access_token}` }
      });
      profile = me.data || null;
    } catch {}

    await admin.firestore().collection('spotifyTokens').doc(uid).set({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || null,
      scope: tok.scope || '',
      token_type: tok.token_type || 'Bearer',
      expires_at,
      profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const target = returnTo || `${FRONTEND_URL}/perfil?spotify=ok`;
    res.redirect(target);
  } catch (e) {
    console.error('Spotify callback error', e?.message || e);
    res.status(500).send('Callback error');
  }
});

export default router;

