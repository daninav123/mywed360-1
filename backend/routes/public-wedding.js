import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch (err) {
    logger.warn('Firebase admin init (public-wedding):', err?.message || String(err));
  }
}

const db = admin.firestore();
const router = express.Router();

async function getWeddingByIdOrSlug(idOrSlug) {
  try {
    const docRef = db.collection('weddings').doc(idOrSlug);
    const snap = await docRef.get();
    if (snap.exists) return { id: snap.id, ref: docRef, data: snap.data() };
  } catch {}
  const q = await db.collection('weddings').where('publicSite.slug', '==', idOrSlug).limit(1).get();
  if (!q.empty) {
    const d = q.docs[0];
    return { id: d.id, ref: d.ref, data: d.data() };
  }
  return null;
}

async function buildPublicPayload(weddingId, includeHtml = true) {
  const ref = db.collection('weddings').doc(weddingId);
  const docSnap = await ref.get();
  if (!docSnap.exists) return null;
  const wedding = docSnap.data() || {};

  const publicCfg = wedding.publicSite || {};
  if (!publicCfg.enabled) return { error: 'not_public' };
  try {
    const expiresAt = publicCfg.expiresAt?.toMillis?.() || publicCfg.expiresAt || null;
    if (publicCfg.isDefaultSlug && expiresAt && Date.now() > Number(expiresAt)) return { error: 'expired' };
  } catch {}

  let weddingInfo = {};
  try {
    const infoSnap = await ref.collection('weddingInfo').limit(1).get();
    if (!infoSnap.empty) weddingInfo = infoSnap.docs[0].data() || {};
  } catch {}

  const safeWedding = {
    id: docSnap.id,
    name: wedding.name || weddingInfo.brideAndGroom || weddingInfo.coupleName || '',
    date: wedding.date || wedding.weddingDate || weddingInfo.weddingDate || weddingInfo.date || '',
    location: wedding.location || weddingInfo.celebrationPlace || weddingInfo.ceremonyLocation || '',
    story: weddingInfo.story || wedding.story || '',
  };

  const sections = {
    showTimeline: true,
    showGallery: true,
    showRsvp: true,
    showVendors: false,
    showGuests: false,
    ...((publicCfg && publicCfg.sections) || {}),
  };

  const result = { wedding: safeWedding, sections, site: { slug: publicCfg.slug || '' } };

  if (sections.showTimeline) {
    try {
      const tlSnap = await ref.collection('timeline').get();
      result.timeline = tlSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {}
  }
  if (sections.showGallery) {
    try {
      const gSnap = await ref.collection('gallery').get();
      result.gallery = gSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {}
  }
  if (sections.showVendors) {
    try {
      const sSnap = await ref.collection('suppliers').get();
      result.suppliers = sSnap.docs.map(d => {
        const s = d.data() || {};
        return { id: d.id, name: s.name || s.displayName || '', category: s.category || s.type || '' };
      });
    } catch {}
  }
  if (sections.showGuests) {
    try {
      const gSnap = await ref.collection('guests').get();
      result.guests = gSnap.docs.map(d => {
        const g = d.data() || {};
        return { id: d.id, name: g.name || g.nombre || '', status: g.status || 'pending' };
      });
    } catch {}
  }

  if (includeHtml) {
    try {
      const siteSnap = await ref.collection('publicSite').doc('site').get();
      if (siteSnap.exists) {
        const site = siteSnap.data() || {};
        if (site.html) result.site.html = site.html;
        if (site.theme) result.site.theme = site.theme;
      }
    } catch {}
  }

  return result;
}

function renderHtmlFromPayload(payload) {
  const w = payload?.wedding || {};
  const timeline = payload?.timeline || [];
  const gallery = payload?.gallery || [];
  const title = w.name || 'Nuestra Boda';
  const subtitle = [w.date, w.location].filter(Boolean).join(' · ');
  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return (`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(subtitle)}" />
  <style>
    :root { --txt:#1f2937; --muted:#6b7280; --bg:#ffffff; --bg2:#f9fafb; --brand:#0ea5e9; }
    *{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:var(--txt); background:var(--bg)}
    .hero{min-height:55vh;display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(180deg,#111827,#1f2937);color:#fff;padding:32px}
    .hero h1{font-size:clamp(32px,6vw,56px);margin:0 0 8px;font-weight:800}
    .hero p{opacity:.9}
    .wrap{max-width:960px;margin:0 auto;padding:40px 16px}
    h2{font-size:clamp(22px,3vw,28px);margin:0 0 16px}
    .muted{color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    @media (max-width:720px){.grid{grid-template-columns:1fr}}
    .card{background:var(--bg2);border-radius:8px;padding:16px}
    img{width:100%;height:200px;object-fit:cover;border-radius:8px}
    footer{padding:24px;text-align:center;color:var(--muted)}
  </style>
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(subtitle)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="robots" content="index,follow" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><text y='1em' font-size='96'>💍</text></svg>">
  <script>document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.origin!==location.origin){a.target='_blank'}})</script>
  </head>
<body>
  <section class="hero">
    <div>
      <h1>${esc(title)}</h1>
      <p>${esc(subtitle)}</p>
    </div>
  </section>

  ${w.story ? `<section class="wrap"><h2>Nuestra Historia</h2><p class="muted" style="white-space:pre-line">${esc(w.story)}</p></section>` : ''}

  ${timeline.length ? `<section class="wrap"><h2>Programa</h2>
    <div class="card">${timeline.map(t=>`<div style="display:flex;gap:12px;align-items:flex-start;margin:8px 0">
      <div style="width:90px;color:var(--muted);font-size:14px">${esc(t.time||t.hour||'')}</div>
      <div><div style="font-weight:600">${esc(t.label||t.title||'')}</div>
      ${t.desc?`<div class="muted" style="font-size:14px">${esc(t.desc)}</div>`:''}</div></div>`).join('')}</div>
  </section>` : ''}

  ${gallery.length ? `<section class="wrap"><h2>Galería</h2>
    <div class="grid">${gallery.map(g=>`<img src="${esc(g.url||g.src||'')}" alt="Foto"/>`).join('')}</div>
  </section>` : ''}

  <footer>© ${new Date().getFullYear()} ${esc(w.name||'')}</footer>
</body>
</html>`);
}

export async function getHtmlForWeddingIdOrSlug(idOrSlug) {
  const found = await getWeddingByIdOrSlug(idOrSlug);
  if (!found) return null;
  try {
    const cfg = (found.data && found.data.publicSite) || {};
    const expiresAt = cfg.expiresAt?.toMillis?.() || cfg.expiresAt || null;
    if (cfg.isDefaultSlug && expiresAt && Date.now() > Number(expiresAt)) return null;
  } catch {}
  const payload = await buildPublicPayload(found.id, true);
  if (!payload || payload.error === 'not_public' || payload.error === 'expired') return null;
  if (payload?.site?.html) return payload.site.html;
  return renderHtmlFromPayload(payload);
}

router.get('/:idOrSlug', async (req, res) => {
  try {
    const entry = await getWeddingByIdOrSlug(req.params.idOrSlug);
    if (!entry) return res.status(404).json({ error: 'not-found' });
    const payload = await buildPublicPayload(entry.id, true);
    if (!payload) return res.status(404).json({ error: 'not-found' });
    if (payload.error === 'expired') return res.status(404).json({ error: 'expired' });
    if (payload.error === 'not_public') return res.status(403).json({ error: 'not-public' });
    return res.json(payload);
  } catch (err) {
    logger.error('public-wedding:get', err);
    res.status(500).json({ error: 'internal' });
  }
});

router.get('/:idOrSlug/html', async (req, res) => {
  try {
    const html = await getHtmlForWeddingIdOrSlug(req.params.idOrSlug);
    if (!html) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    logger.error('public-wedding:html', err);
    res.status(500).send('Internal error');
  }
});

router.get('/:idOrSlug/download', async (req, res) => {
  try {
    const html = await getHtmlForWeddingIdOrSlug(req.params.idOrSlug);
    if (!html) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
    return res.send(html);
  } catch (err) {
    logger.error('public-wedding:download', err);
    res.status(500).send('Internal error');
  }
});

router.post('/:weddingId/publish', async (req, res) => {
  try {
    const { weddingId } = req.params;
    let { html, slug = '', sections = {}, theme = null } = req.body || {};
    if (!html || typeof html !== 'string') return res.status(400).json({ error: 'html-required' });

    const uid = req.user?.uid || null;
    const role = req.userProfile?.role || 'particular';

    const ref = db.collection('weddings').doc(weddingId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};
    const owners = Array.isArray(data.ownerIds) ? data.ownerIds : [];
    const planners = Array.isArray(data.plannerIds) ? data.plannerIds : [];
    const allowed = role === 'admin' || (uid && (owners.includes(uid) || planners.includes(uid)));
    if (!allowed) return res.status(403).json({ error: 'forbidden' });

    if (slug) {
      slug = String(slug).toLowerCase().trim();
      const valid = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
      if (!valid) return res.status(400).json({ error: 'slug-invalid' });
      const excluded = (process.env.PUBLIC_SITES_EXCLUDED_SUBDOMAINS || 'www,api,mail,mg,cdn,static,assets,admin').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
      if (excluded.includes(slug)) return res.status(400).json({ error: 'slug-reserved' });
      const q = await db.collection('weddings').where('publicSite.slug', '==', slug).limit(1).get();
      if (!q.empty && q.docs[0].id !== weddingId) return res.status(409).json({ error: 'slug-taken' });
    }

    const infoSnap = await ref.collection('weddingInfo').limit(1).get();
    const info = !infoSnap.empty ? (infoSnap.docs[0].data() || {}) : {};
    const toSlug = s => String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    const first = s => String(s||'').trim().split(/\s+/)[0] || '';
    const fmt = d => { try{ const dt=new Date(d); return `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}` }catch{ return '' } };
    const eventDateRaw = data.weddingDate || data.date || info.weddingDate || info.date || null;
    const suggested = [toSlug(first(info?.brideInfo?.nombre || info?.brideName || info?.bride)), toSlug(first(info?.groomInfo?.nombre || info?.groomName || info?.groom)), fmt(eventDateRaw || Date.now())].filter(Boolean).join('-') || weddingId;

    let isDefaultSlug = false;
    if (!slug) {
      slug = suggested;
      isDefaultSlug = true;
    } else if (slug === suggested) {
      isDefaultSlug = true;
    }

    const excluded = (process.env.PUBLIC_SITES_EXCLUDED_SUBDOMAINS || 'www,api,mail,mg,cdn,static,assets,admin').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    if (excluded.includes(slug)) slug = `${slug}-${weddingId.slice(0,6)}`;
    const q2 = await db.collection('weddings').where('publicSite.slug', '==', slug).limit(1).get();
    if (!q2.empty && q2.docs[0].id !== weddingId) slug = `${slug}-${weddingId.slice(0,6)}`;

    let expiresAt = null;
    try {
      if (isDefaultSlug && eventDateRaw) {
        const base = new Date(eventDateRaw);
        const exp = new Date(base.getTime());
        exp.setMonth(exp.getMonth() + 3);
        expiresAt = admin.firestore.Timestamp.fromDate(exp);
      }
    } catch {}

    const newCfg = {
      ...(data.publicSite || {}),
      enabled: true,
      slug,
      sections: { ...(data.publicSite?.sections || {}), ...(sections || {}) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid || null,
      isDefaultSlug,
      ...(expiresAt ? { expiresAt } : {}),
    };
    await ref.set({ publicSite: newCfg }, { merge: true });

    const siteDoc = { html, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (theme) siteDoc.theme = theme;
    await ref.collection('publicSite').doc('site').set(siteDoc, { merge: true });

    const path = `/p/${slug || weddingId}`;
    const baseDomain = process.env.PUBLIC_SITES_BASE_DOMAIN || '';
    const publicUrl = baseDomain && (slug || weddingId) ? `https://${(slug || weddingId)}.${baseDomain}` : null;
    return res.json({ ok: true, publicPath: path, publicUrl, suggested });
  } catch (err) {
    logger.error('public-wedding:publish', err);
    res.status(500).json({ error: 'internal' });
  }
});

export default router;
export { buildPublicPayload, getHtmlForWeddingIdOrSlug };

