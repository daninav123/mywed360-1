// routes/playback.js
// Minimal playback API: accepts play/pause/stop commands from frontend.
// Initially returns 200 OK without integrating a provider. Extend later to Spotify Connect.

import express from 'express';
import axios from 'axios';
import admin from 'firebase-admin';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/playback/play
// body: { title, artist?, previewUrl? }
router.post('/play', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { title, artist } = req.body || {};
    if (!uid) return res.status(401).json({ ok: false, error: 'no-auth' });

    // 1) Fetch Spotify tokens for user
    const tokDoc = await admin.firestore().collection('spotifyTokens').doc(uid).get();
    if (!tokDoc.exists) {
      return res.status(412).json({ ok: false, error: 'spotify-not-connected' });
    }
    const tokens = tokDoc.data() || {};

    // 2) Ensure access token (refresh if expired)
    let accessToken = tokens.access_token || null;
    const now = Date.now();
    if ((tokens.expires_at && tokens.expires_at <= now) && tokens.refresh_token) {
      try {
        const params = new URLSearchParams();
        params.set('grant_type', 'refresh_token');
        params.set('refresh_token', tokens.refresh_token);
        params.set('client_id', process.env.SPOTIFY_CLIENT_ID || '');
        params.set('client_secret', process.env.SPOTIFY_CLIENT_SECRET || '');
        const resp = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = resp.data || {};
        accessToken = data.access_token || accessToken;
        const expires_at = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);
        await admin.firestore().collection('spotifyTokens').doc(uid).set({
          access_token: accessToken,
          expires_at,
          scope: data.scope || tokens.scope || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.error('[Playback] refresh failed', e?.response?.data || e?.message || e);
      }
    }

    if (!accessToken) {
      return res.status(412).json({ ok: false, error: 'spotify-no-token' });
    }

    // 3) Find a track by title/artist
    const q = [title, artist].filter(Boolean).join(' ');
    let uri = null;
    try {
      const search = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q, type: 'track', limit: 1 }
      });
      const items = search?.data?.tracks?.items || [];
      uri = items[0]?.uri || null;
    } catch (e) {
      console.error('[Playback] search failed', e?.response?.data || e?.message || e);
    }

    if (!uri) {
      return res.status(404).json({ ok: false, error: 'track-not-found' });
    }

    // 4) Start playback on active device (requires Premium + active device)
    try {
      await axios.put('https://api.spotify.com/v1/me/player/play', { uris: [uri] }, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      const code = e?.response?.status || 500;
      const data = e?.response?.data || null;
      if (code === 404 && data?.error?.reason === 'NO_ACTIVE_DEVICE') {
        return res.status(409).json({ ok: false, error: 'no-active-device' });
      }
      console.error('[Playback] play failed', data || e?.message || e);
      return res.status(code).json({ ok: false, error: 'play-failed' });
    }

    return res.status(200).json({ ok: true, uri });
  } catch (e) {
    console.error('[Playback] play error', e?.message || e);
    res.status(500).json({ ok: false, error: 'play-failed' });
  }
});

// POST /api/playback/pause
router.post('/pause', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, error: 'no-auth' });
    const tokDoc = await admin.firestore().collection('spotifyTokens').doc(uid).get();
    if (!tokDoc.exists) return res.status(412).json({ ok: false, error: 'spotify-not-connected' });
    const accessToken = tokDoc.data()?.access_token;
    if (!accessToken) return res.status(412).json({ ok: false, error: 'spotify-no-token' });
    await axios.put('https://api.spotify.com/v1/me/player/pause', null, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    const code = e?.response?.status || 500;
    res.status(code).json({ ok: false, error: 'pause-failed' });
  }
});

// POST /api/playback/stop
router.post('/stop', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, error: 'no-auth' });
    const tokDoc = await admin.firestore().collection('spotifyTokens').doc(uid).get();
    if (!tokDoc.exists) return res.status(412).json({ ok: false, error: 'spotify-not-connected' });
    const accessToken = tokDoc.data()?.access_token;
    if (!accessToken) return res.status(412).json({ ok: false, error: 'spotify-no-token' });

    // There is no real "stop" in Spotify; emulate by pause
    await axios.put('https://api.spotify.com/v1/me/player/pause', null, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    const code = e?.response?.status || 500;
    res.status(code).json({ ok: false, error: 'stop-failed' });
  }
});

export default router;
