�import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWeddingNews } from '../services/blogService';
import Spinner from '../components/Spinner';
import { getBackendBase } from '@/utils/backendBase.js';
import PageWrapper from '../components/PageWrapper';

export default function Blog() {
  const { i18n } = useTranslation();
  const normalizeLang = (l) => (String(l || 'es').toLowerCase().match(/^[a-z]{2}/)?.[0] || 'es');
  const lang = normalizeLang(i18n.language);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const observer = useRef();
  // Límites para evitar bucles de llamadas cuando el backend devuelve []
  const MAX_LOOKAHEAD = 10; // antes 60
  const MAX_EMPTY_BATCHES = 2; // corta pronto si no hay más datos
  const MAX_FETCHES_PER_LOAD = 12;

  const lastRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((p) => p + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (import.meta?.env?.DEV) console.info('[Blog] load start', { page, lang, existing: posts.length });
      let newPosts = [...posts];
      const targetLength = Math.ceil((newPosts.length + 1) / 10) * 10; // siguiente múltiplo de 10
      const domainCounts = {};
      const windowStart = Math.floor(newPosts.length / 10) * 10;
      for (let i = windowStart; i < newPosts.length; i++) {
        const d = (()=>{try{return (new URL(newPosts[i].url)).hostname.replace(/^www\./,'');}catch{return 'unk';}})();
        domainCounts[d] = (domainCounts[d] || 0) + 1;
      }

      // Acumular candidatos para un relleno posterior si faltan dominios únicos
      const candidates = [];

      let fetchPage = page;
      let consecutiveErrors = 0;
      let emptyBatches = 0;
      let fetches = 0;
      while (
        newPosts.length < targetLength &&
        fetchPage < page + MAX_LOOKAHEAD &&
        fetches < MAX_FETCHES_PER_LOAD &&
        emptyBatches <= MAX_EMPTY_BATCHES
      ) {
        let batch = [];
        try {
          batch = await fetchWeddingNews(fetchPage, 10, lang);
          consecutiveErrors = 0;
        } catch (err) {
          console.error(err);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) break;
        }
        fetchPage++;
        fetches++;
        if (!Array.isArray(batch) || batch.length === 0) {
          emptyBatches++;
          continue;
        } else {
          emptyBatches = 0;
        }
        for (const p of batch) {
          if (!p?.url) continue;
          const dom = (()=>{try{return (new URL(p.url)).hostname.replace(/^www\./,'');}catch{return 'unk';}})();
          const placeholder = `${import.meta.env.BASE_URL}logo-app.png`;
          const withImage = p.image ? p : { ...p, image: placeholder };
          // Guardar como candidato global para posibles rellenos
          if (!candidates.some(x => x.url === withImage.url || x.id === withImage.id)) {
            candidates.push(withImage);
          }
          // Estricto: 1 por dominio por bloque
          if ((domainCounts[dom] || 0) >= 1) continue;
          if (newPosts.some(x => x.url === withImage.url || x.id === withImage.id)) continue;
          domainCounts[dom] = (domainCounts[dom] || 0) + 1;
          newPosts.push(withImage);
          if (newPosts.length >= targetLength) break;
        }
      }

      // Fallback: si tras buscar no llenamos el bloque, relajamos dominio y buscamos en inglés
      if (newPosts.length < targetLength) {
        fetchPage = 1;
        consecutiveErrors = 0;
        let emptyBatchesEn = 0;
        let fetchesEn = 0;
        while (
          newPosts.length < targetLength &&
          fetchPage <= MAX_LOOKAHEAD &&
          fetchesEn < MAX_FETCHES_PER_LOAD &&
          emptyBatchesEn <= MAX_EMPTY_BATCHES
        ) {
          let batch = [];
          try {
            batch = await fetchWeddingNews(fetchPage, 10, 'en');
            consecutiveErrors = 0;
          } catch (err) {
            console.error(err);
            consecutiveErrors++;
            if (consecutiveErrors >= 3) break;
          }
          fetchPage++;
          fetchesEn++;
          if (!Array.isArray(batch) || batch.length === 0) {
            emptyBatchesEn++;
            continue;
          } else {
            emptyBatchesEn = 0;
          }
          for (const p of batch) {
            if (!p?.url) continue;
            const dom = (()=>{try{return (new URL(p.url)).hostname.replace(/^www\./,'');}catch{return 'unk';}})();
            const placeholder = `${import.meta.env.BASE_URL}logo-app.png`;
            const withImage = p.image ? p : { ...p, image: placeholder };
            if (!candidates.some(x => x.url === withImage.url || x.id === withImage.id)) {
              candidates.push(withImage);
            }
            if ((domainCounts[dom] || 0) >= 1) continue;
            if (newPosts.some(x => x.url === withImage.url || x.id === withImage.id)) continue;
            domainCounts[dom] = (domainCounts[dom] || 0) + 1;
            newPosts.push(withImage);
            if (newPosts.length >= targetLength) break;
          }
        }
      }

      // Relleno final: si no hay suficientes dominios únicos, permitir hasta 2 por dominio
      if (newPosts.length < targetLength && candidates.length) {
        const exists = (p) => newPosts.some(x => x.url === p.url || x.id === p.id);
        const notUsed = candidates.filter((c) => !exists(c));
        if (notUsed.length) {
          const dom2 = { ...domainCounts };
          for (const p of notUsed) {
            if (newPosts.length >= targetLength) break;
            const d = (()=>{try{return (new URL(p.url)).hostname.replace(/^www\./,'');}catch{return 'unk';}})();
            if ((dom2[d] || 0) >= 2) continue;
            dom2[d] = (dom2[d] || 0) + 1;
            newPosts.push(p);
          }
        }
        // Si aun as no se llena, ignorar limite por dominio
        if (newPosts.length < targetLength) {
          for (const p of candidates) {
            if (newPosts.length >= targetLength) break;
            if (newPosts.some(x => x.url === p.url || x.id === p.id)) continue;
            newPosts.push(p);
          }
        }
      }

      setPosts(newPosts);
      setLoading(false);
      setAttempts((a) => a + 1);
      if (import.meta?.env?.DEV) console.info('[Blog] load end', { added: newPosts.length - posts.length, total: newPosts.length });
    }
    load();
  }, [page]);

  return (
    <PageWrapper title="Blog" className="max-w-5xl mx-auto">
      {!loading && attempts > 0 && posts.length === 0 && (
        <div className="py-20 text-center text-muted">
          <p className="mb-4">No hay noticias disponibles ahora mismo.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setPage((p) => p + 1); }}
          >
            Reintentar
          </button>
        </div>
      )}
      {posts.map((p, idx) => (
        <ArticleCard key={p.url || p.id || idx} post={p} ref={idx === posts.length - 1 ? lastRef : null} />
      ))}
      {loading && <div className="flex justify-center my-6"><Spinner /></div>}
    </PageWrapper>
  );
}

const ArticleCard = React.forwardRef(({ post }, ref) => {
  const base = getBackendBase();
  // Resolver URL de imagen relativa respecto al enlace de la noticia
  let resolvedImage = post.image || null;
  try {
    if (post.image && post.url) {
      resolvedImage = new URL(post.image, post.url).toString();
    }
  } catch {}
  const isHttpUrl = typeof resolvedImage === 'string' && /^https?:\/\//i.test(resolvedImage);
  const [useProxy, setUseProxy] = React.useState(false);
  const imgSrc = resolvedImage
    ? (useProxy && base && isHttpUrl ? `${base}/api/image-proxy?u=${encodeURIComponent(resolvedImage)}` : resolvedImage)
    : null;
  return (
    <div ref={ref} className="border border-soft bg-[var(--color-surface)] rounded-lg overflow-hidden shadow hover:shadow-md transition">
      {imgSrc && (
        <img
          src={imgSrc}
          alt={post.title}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={() => { if (!useProxy && base && isHttpUrl) setUseProxy(true); }}
        />
      )}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="text-sm text-body line-clamp-3">{post.description}</p>
        <div className="text-xs text-muted flex justify-between">
          <span>{post.source}</span>
          <span>{new Date(post.published).toLocaleDateString()}</span>
        </div>
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm">Leer mas</a>
      </div>
    </div>
  );
});





