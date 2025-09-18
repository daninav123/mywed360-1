import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWeddingNews } from '../services/blogService';
import Spinner from '../components/Spinner';
import { getBackendBase } from '@/utils/backendBase.js';

export default function Blog() {
  const { i18n } = useTranslation();
  const normalizeLang = (l) => (String(l || 'es').toLowerCase().match(/^[a-z]{2}/)?.[0] || 'es');
  const lang = normalizeLang(i18n.language);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
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
      let newPosts = [...posts];
      const targetLength = Math.ceil((newPosts.length + 1) / 10) * 10; // siguiente múltiplo de 10
      const domainCounts = {};
      const windowStart = Math.floor(newPosts.length / 10) * 10;
      for (let i = windowStart; i < newPosts.length; i++) {
        const d = (()=>{try{return (new URL(newPosts[i].url)).hostname.replace(/^www\./,'');}catch{return 'unk';}})();
        domainCounts[d] = (domainCounts[d] || 0) + 1;
      }

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
          batch = await fetchWeddingNews(fetchPage, 50, lang);
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
          if ((domainCounts[dom] || 0) >= 1) continue; // 1 por dominio por bloque
          if (newPosts.some(x => x.url === p.url || x.id === p.id)) continue;
          domainCounts[dom] = (domainCounts[dom] || 0) + 1;
          const placeholder = `${import.meta.env.BASE_URL}logo-app.png`;
          const withImage = p.image ? p : { ...p, image: placeholder };
          newPosts.push(withImage);
          if (newPosts.length >= targetLength) break;
        }
      }

      // Fallback: si tras buscar no llenamos el bloque, relajamos dominio y buscamos en inglés
      if (newPosts.length < targetLength && (lang === 'en' || import.meta?.env?.VITE_TRANSLATE_KEY)) {
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
            batch = await fetchWeddingNews(fetchPage, 50, 'en');
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
            if ((domainCounts[dom] || 0) >= 1) continue;
            if (newPosts.some(x => x.url === p.url || x.id === p.id)) continue;
            domainCounts[dom] = (domainCounts[dom] || 0) + 1;
            const placeholder = `${import.meta.env.BASE_URL}logo-app.png`;
            const withImage = p.image ? p : { ...p, image: placeholder };
            newPosts.push(withImage);
            if (newPosts.length >= targetLength) break;
          }
        }
      }

      setPosts(newPosts);
      setLoading(false);
    }
    load();
  }, [page]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Blog</h1>
      {posts.map((p, idx) => (
        <ArticleCard key={p.url || p.id || idx} post={p} ref={idx === posts.length - 1 ? lastRef : null} />
      ))}
      {loading && <div className="flex justify-center my-6"><Spinner /></div>}
    </div>
  );
}

const ArticleCard = React.forwardRef(({ post }, ref) => {
  const base = getBackendBase();
  const imgSrc = post.image
    ? (base ? `${base}/api/image-proxy?u=${encodeURIComponent(post.image)}` : post.image)
    : null;
  return (
    <div ref={ref} className="border rounded-lg overflow-hidden shadow hover:shadow-md transition">
      {imgSrc && <img src={imgSrc} alt={post.title} className="w-full h-48 object-cover" />}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="text-sm text-gray-700 line-clamp-3">{post.description}</p>
        <div className="text-xs text-gray-500 flex justify-between">
          <span>{post.source}</span>
          <span>{new Date(post.published).toLocaleDateString()}</span>
        </div>
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">Leer más</a>
      </div>
    </div>
  );
});

