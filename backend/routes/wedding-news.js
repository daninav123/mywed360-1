import express from 'express';
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
  ],
  en: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Weddings.xml',
    'https://www.lovemydress.net/feed/',
    'https://weddinginspiration.co/feed/',
  ],
};

// Conversión genérica de elementos RSS a esquema del frontend
function mapItems(feed, feedUrl) {
  return (feed.items || []).map((it) => ({
    id: it.guid || it.id || it.link,
    title: it.title || '',
    description:
      it.contentSnippet ||
      it.summary ||
      it.content ||
      (typeof it.description === 'string' ? it.description.replace(/<[^>]+>/g, '') : ''),
    url: it.link || '',
    image:
      it.enclosure?.url ||
      it['media:content']?.url ||
      (Array.isArray(it.enclosure) && it.enclosure[0]?.url) ||
      null,
    source: new URL(feedUrl).hostname.replace('www.', ''),
    published: it.isoDate || it.pubDate || new Date().toISOString(),
  }));
}
// Fin mapItems

router.get('/', async (req, res) => {
  try {
    const lang = String(req.query.lang || 'es').toLowerCase().slice(0, 2);
    const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10) || 10, 1), 100);

    // Recuperar o construir el cache por idioma (lista completa limitada)
    let allPosts = cache.get(`posts_${lang}`);
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
      // Limitar lista completa para cache (evitar memoria excesiva)
      allPosts = results.slice(0, 200);
      cache.set(`posts_${lang}`, allPosts);
    }

    // Paginacion por desplazamiento
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = start < allPosts.length ? allPosts.slice(start, end) : [];

    res.status(200).json(pageItems);
  } catch (err) {
    console.error('wedding-news error', err?.message || err);
    // Degradar con 200 y lista vacia para evitar bucles de errores en el frontend
    res.status(200).json([]);
  }
});

export default router;
