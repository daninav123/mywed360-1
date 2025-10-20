import express from 'express';
import LRU from 'lru-cache';
import Parser from 'rss-parser';
import axios from 'axios';

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
      'User-Agent': 'MyWed360Bot/1.0 (+https://mywed360.com)'
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
    // Google News en español con distintas consultas para diversidad de fuentes
    'https://news.google.com/rss/search?q=boda%20OR%20bodas%20OR%20novias%20vestidos&hl=es-ES&gl=ES&ceid=ES:es',
    'https://news.google.com/rss/search?q=wedding%20planner%20OR%20organizador%20de%20bodas&hl=es-ES&gl=ES&ceid=ES:es',
    'https://news.google.com/rss/search?q=decoraci%C3%B3n%20boda%20OR%20banquete%20de%20boda&hl=es-ES&gl=ES&ceid=ES:es',
    'https://news.google.com/rss/search?q=vestido%20de%20novia%20OR%20peinado%20novia&hl=es-ES&gl=ES&ceid=ES:es',
    'https://news.google.com/rss/search?q=fotograf%C3%ADa%20de%20boda%20OR%20vide%C3%B3grafo%20boda&hl=es-ES&gl=ES&ceid=ES:es',
  ],
  en: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Weddings.xml',
    'https://www.lovemydress.net/feed/',
    'https://weddinginspiration.co/feed/',
  ],
};

// Resolver imagen OG/Twitter si falta en un item
async function resolveOgImage(pageUrl) {
  try {
    const commonHeaders = {
      'User-Agent': 'MyWed360Bot/1.0 (+https://mywed360.com) Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      Referer: 'https://news.google.com/',
    };
    const res = await axios.get(pageUrl, {
      timeout: 8000,
      responseType: 'text',
      maxRedirects: 5,
      headers: commonHeaders,
    });
    const html = String(res.data || '');
    const patterns = [
      /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["'][^>]*>/i,
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i,
      /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["'][^>]*>/i,
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) {
        try { return new URL(m[1], pageUrl).toString(); } catch {}
      }
    }
    // Intento extra: si es Google News, seguir canonical/og:url al origen y volver a buscar imagen
    try {
      const host = new URL(pageUrl).hostname;
      if (/news\.google\.com$/i.test(host)) {
        const canRe = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i;
        const ogUrlRe = /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["'][^>]*>/i;
        const m2 = html.match(canRe) || html.match(ogUrlRe);
        if (m2 && m2[1]) {
          const canonical = new URL(m2[1], pageUrl).toString();
          try {
            const res2 = await axios.get(canonical, {
              timeout: 8000,
              responseType: 'text',
              maxRedirects: 5,
              headers: commonHeaders,
            });
            const html2 = String(res2.data || '');
            for (const re of patterns) {
              const m3 = html2.match(re);
              if (m3 && m3[1]) {
                try { return new URL(m3[1], canonical).toString(); } catch {}
              }
            }
          } catch {}
        }
      }
    } catch {}
  } catch {}
  return null;
}

// Conversión genérica de elementos RSS a esquema del frontend
function mapItems(feed, feedUrl) {
  let feedHost = '';
  try { feedHost = new URL(feedUrl).hostname.replace('www.', ''); } catch {}
  const fromGoogleNews = /news\.google\.com$/i.test(feedHost);
  const items = [];
  (feed.items || []).forEach((it) => {
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
    if (!link || typeof link !== 'string' || !/^https?:\/\//i.test(link)) {
      return;
    }
    if (/^news\.google\.com$/i.test(sourceHost)) {
      return;
    }
    // Resolver imagen del item (absoluta si es relativa)
    let rawImage = (
      it.enclosure?.url ||
      it['media:content']?.url ||
      it['media:thumbnail']?.url ||
      (it['media:group']?.['media:content']?.url) ||
      (Array.isArray(it.enclosure) && it.enclosure[0]?.url) ||
      null
    );
    let absImage = null;
    if (rawImage && typeof rawImage === 'string') {
      try { absImage = new URL(rawImage, link || feedUrl).toString(); } catch {}
    }
    if (!absImage || !/^https?:\/\//i.test(absImage)) {
      return;
    }

    items.push({
      id: it.guid || it.id || it.link,
      title: it.title || '',
      description:
        it.contentSnippet ||
        it.summary ||
        it.content ||
        (typeof it.description === 'string' ? it.description.replace(/<[^>]+>/g, '') : ''),
      url: link,
      image: absImage || null,
      source: sourceHost,
      published: it.isoDate || it.pubDate || new Date().toISOString(),
      feedSource: fromGoogleNews ? 'google-news' : feedHost || 'feed',
    });
  });
  return items;
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
      // No mezclar idiomas: solo rellenar con 'en' si el idioma solicitado es 'en'
      if (distinct.size < MIN_SOURCES && lang === 'en' && RSS_FEEDS['en']) {
        try {
          const extraPromises = RSS_FEEDS['en'].map(async (url) => {
            try { const feed = await parser.parseURL(url); return mapItems(feed, url); } catch { return []; }
          });
          const extraLists = await Promise.all(extraPromises);
          let extra = ([]).concat(...extraLists);
          const seen2 = new Set(results.map(r => r.id || r.url));
          extra = extra.filter(p => { const k = p.id || p.url; if (!k || seen2.has(k)) return false; seen2.add(k); return true; });
          // Asegurar que la imagen es una URL http(s) válida.
          // En un literal regex, solo se necesita escapar cada '/': \/\/
          extra = extra.filter(p => typeof p.image === 'string' && /^https?:\/\//i.test(p.image));
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
    // Permitir maximo 2 items por fuente para mayor densidad inicial
    const perSourceLimit = 2;
    const counts = new Map();
    const pageItems = [];
    const take = (item) => {
      // Para ítems que provienen de Google News, no aplicar el límite por fuente
      if (item && item.feedSource === 'google-news') {
        pageItems.push(item);
        return true;
      }
      const k = item.source || "unknown";
      const c = counts.get(k) || 0;
      if (c >= perSourceLimit) return false;
      counts.set(k, c + 1);
      pageItems.push(item);
      return true;
    };
    // Primer pase: dentro del slice
    for (const p of slice) {
      if (pageItems.length >= pageSize) break;
      take(p);
    }
    // Relleno hacia delante si faltan elementos por ldmites de fuente
    if (pageItems.length < pageSize && end < allPosts.length) {
      for (let i = end; i < allPosts.length && pageItems.length < pageSize; i++) {
        take(allPosts[i]);
      }
    }
    // Relleno hacia atrds como altimo recurso (evitar paginas escuetas)
    if (pageItems.length < pageSize && start > 0) {
      for (let i = start - 1; i >= 0 && pageItems.length < pageSize; i--) {
        take(allPosts[i]);
      }
    }

    // Completar imagen de portada cuando falte y sustituir enlaces de Google News por el medio original
    const withImages = [];
    const blockedHosts = new Set(['news.google.com', 'gstatic.com', 'ssl.gstatic.com', 'googleusercontent.com']);
    const badPatterns = ['logo', 'favicon', 'sprite', 'placeholder', 'default', 'brand', 'apple-touch-icon', 'android-chrome'];
    const canonicalRe = /<link[^>]+rel=['"]canonical['"][^>]+href=['"]([^'\"]+)['"][^>]*>/i;
    const ogUrlRe = /<meta\s+property=['"]og:url['"]\s+content=['"]([^'\"]+)['"][^>]*>/i;
    const reqCfg = {
      timeout: 8000,
      responseType: 'text',
      maxRedirects: 5,
      headers: {
        'User-Agent': 'MyWed360Bot/1.0 (+https://mywed360.com) Mozilla/5.0',
        Referer: 'https://news.google.com/',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    };
    for (const item of pageItems) {
      let img = item.image;
      let finalUrl = item.url;
      const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
      const shouldTryResolve = () => {
        try {
          if (!isHttp(img)) return true;
          const u = new URL(img);
          const host = u.hostname.replace(/^www\./, '').toLowerCase();
          const path = (u.pathname || '').toLowerCase();
          if (blockedHosts.has(host)) return true;
          if (/\.svg(\?|$)/i.test(path)) return true;
          if (badPatterns.some((p) => path.includes(p))) return true;
        } catch {}
        return false;
      };
      if (finalUrl && shouldTryResolve()) {
        try {
          const found = await resolveOgImage(finalUrl);
          if (isHttp(found)) img = found;
        } catch {}
      }
      // Asegurar absoluta si es relativa
      try { if (img && !/^https?:\/\//i.test(img)) img = new URL(img, finalUrl).toString(); } catch {}
      if (!isHttp(img || item.image)) {
        continue;
      }
      // Recalcular fuente desde la URL final
      const finalHost = (() => {
        try { return new URL(finalUrl).hostname.replace('www.', ''); } catch { return item.source || ''; }
      })();
      withImages.push({
        ...item,
        url: finalUrl,
        source: finalHost || item.source || 'unknown',
        image: img || item.image || null,
      });
    }

    res.status(200).json(withImages);
  } catch (err) {
    console.error('wedding-news error', err?.message || err);
    // Degradar con 200 y lista vacia para evitar bucles de errores en el frontend
    res.status(200).json([]);
  }
});

export default router;
