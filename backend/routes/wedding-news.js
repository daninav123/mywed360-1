﻿﻿import express from 'express';
import LRU from 'lru-cache';
import Parser from 'rss-parser';

// Ruta que recupera titulares del sector nupcial desde varios feeds RSS.
// Se usa en el frontend Blog cuando no hay NEWSAPI_KEY.
// GET /api/wedding-news?pageSize=10&lang=es
// Devuelve: [{ id, title, description, url, image, source, published }]

const router = express.Router();

// Cache en memoria: 6 horas
// Guardamos listas completas por idioma para poder paginar sin refetch
const cache = new LRU({ max: 4, ttl: 1000 * 60 * 60 * 6 });
const parser = new Parser({
  requestOptions: {
    headers: {
      // Algunos hosts bloquean user-agents desconocidos
      'User-Agent': 'LovendaBot/1.0 (+https://lovenda.app)'
    },
  },
});

// Feeds RSS categorizados por idioma
const RSS_FEEDS = {
  es: [
    'https://www.hola.com/feeds/rss/any/novias/any/50.xml',
    'https://e00-telva.uecdn.es/rss/novias.xml',
    'https://luciasecasa.com/feed/',
    'https://www.zankyou.es/feed/',
    'https://luciasecasa.com/feed/vestidos-de-novia',
    'https://www.zankyou.it/feed/',
    'https://news.google.com/rss/search?q=boda%20OR%20novias%20vestidos&hl=es-ES&gl=ES&ceid=ES:es',
  ],
  en: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Weddings.xml',
    'https://www.lovemydress.net/feed/',
    'https://weddinginspiration.co/feed/',
  ],
};

// Conversión genérica de elementos RSS a esquema del frontend
function mapItems(feed, feedUrl) {
  return (feed.items || []).map((it) => {
    let link = it.link || '';
    try {
      if (typeof link === 'string' && link.includes('news.google.com')) {
        const u = new URL(link);
        const orig = u.searchParams.get('url');
        if (orig) link = decodeURIComponent(orig);
      }
    } catch {}
    let sourceHost = '';
    try {
      sourceHost = new URL(link || feedUrl).hostname.replace('www.', '');
    } catch {
      try { sourceHost = new URL(feedUrl).hostname.replace('www.', ''); } catch { sourceHost = 'unknown'; }
    }
    return {
      id: it.guid || it.id || it.link,
      title: it.title || '',
      description:
        it.contentSnippet ||
        it.summary ||
        it.content ||
        (typeof it.description === 'string' ? it.description.replace(/<[^>]+>/g, '') : ''),
      url: link,
      image:
        it.enclosure?.url ||
        it['media:content']?.url ||
        it['media:thumbnail']?.url ||
        (it['media:group']?.['media:content']?.url) ||
        (Array.isArray(it.enclosure) && it.enclosure[0]?.url) ||
        null,
      source: sourceHost,
      published: it.isoDate || it.pubDate || new Date().toISOString(),
    };
  });
}
// Fin mapItems

router.get('/', async (req, res) => {
  try {
    const lang = String(req.query.lang || 'es').toLowerCase().slice(0, 2);
    const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10) || 10, 1), 100);

    // Recuperar o construir el cache por idioma (lista completa limitada)
    const bypassCache = ('bust' in req.query) || ('nocache' in req.query);
    let allPosts = !bypassCache ? cache.get(`posts_${lang}`) : null;
    if (!allPosts) {
      const sources = RSS_FEEDS[lang] || RSS_FEEDS['en'];

      const promises = sources.map(async (url) => {
        try {
          const feed = await parser.parseURL(url);
          return mapItems(feed, url);
        } catch (err) {
          console.warn('RSS fetch failed', url, err?.message || err);
          return [];
        }
      });

      const lists = await Promise.all(promises);
      let results = ([]).concat(...lists);
      // Eliminar duplicados por id/url
      const seen = new Set();
      results = results.filter((p) => {
        const key = p.id || p.url;
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Ordenar por fecha descendente
      results.sort((a, b) => new Date(b.published) - new Date(a.published));
      const MIN_SOURCES = 10;
      const distinct = new Set(results.map(r => r.source));
      if (distinct.size < MIN_SOURCES && RSS_FEEDS['en']) {
        try {
          const extraPromises = RSS_FEEDS['en'].map(async (url) => {
            try { const feed = await parser.parseURL(url); return mapItems(feed, url); } catch { return []; }
          });
          const extraLists = await Promise.all(extraPromises);
          let extra = ([]).concat(...extraLists);
          const seen2 = new Set(results.map(r => r.id || r.url));
          extra = extra.filter(p => { const k = p.id || p.url; if (!k || seen2.has(k)) return false; seen2.add(k); return true; });
          extra = extra.filter(p => typeof p.image === 'string' && /^https?:\\/\\//i.test(p.image));
          results = results.concat(extra);
        } catch {}
      }
      // Mezclar de forma balanceada por fuente (round-robin)
      const groups = new Map();
      for (const p of results) {
        const k = (p.source || "unknown");
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(p);
      }
      for (const arr of groups.values()) {
        arr.sort((a, b) => new Date(b.published) - new Date(a.published));
      }
      const groupArrays = Array.from(groups.values());
      const balanced = [];
      const maxAll = 200;
      let round = 0;
      while (balanced.length < maxAll) {
        let added = false;
        for (const arr of groupArrays) {
          if (round < arr.length) {
            balanced.push(arr[round]);
            added = true;
            if (balanced.length >= maxAll) break;
          }
        }
        if (!added) break;
        round++;
      }
      // Limitar lista completa para cache (evitar memoria excesiva)
      allPosts = balanced.slice(0, 200);
      cache.set(`posts_${lang}`, allPosts);
    }

    // Paginacion por desplazamiento
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = start < allPosts.length ? allPosts.slice(start, end) : [];
    const perSourceLimit = 1;
    const counts = new Map();
    const pageItems = [];
    for (const p of slice) {
      const k = p.source || "unknown";
      const c = counts.get(k) || 0;
      if (c >= perSourceLimit) continue;
      counts.set(k, c + 1);
      pageItems.push(p);
      if (pageItems.length >= pageSize) break;
    }

    res.status(200).json(pageItems);
  } catch (err) {
    console.error('wedding-news error', err?.message || err);
    // Degradar con 200 y lista vacia para evitar bucles de errores en el frontend
    res.status(200).json([]);
  }
});

export default router;
