import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import InspirationGallery from '../components/gallery/InspirationGallery';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { trackInteraction } from '../services/inspirationService';
import { saveData, loadData } from '../services/SyncService';
import { fetchWall } from '../services/wallService';

const normalizeTag = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeFilterValue = (value) => {
  if (!value) return 'all';
  if (value === 'all' || value === 'favs') return value;
  return normalizeTag(value);
};

export default function Inspiration() {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const userId = currentUser?.uid || 'anon';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('wedding');
  const [selectedTag, setSelectedTag] = useState('all');
  const [prefTags, setPrefTags] = useState([]); // top tags del usuario
  const observer = useRef();
  const storageKey = useMemo(
    () => (activeWedding ? `inspirationFavorites_${activeWedding}` : 'inspirationFavorites'),
    [activeWedding]
  );
  const syncOptions = useMemo(() => {
    if (activeWedding && currentUser) {
      return {
        firestore: true,
        docPath: `weddings/${activeWedding}/inspiration/favorites`,
        field: 'items',
        fallbackToLocal: true,
        mergeWithExisting: true,
      };
    }
    return {
      firestore: false,
      fallbackToLocal: true,
    };
  }, [activeWedding, currentUser]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setQuery('wedding');
    setSelectedTag('all');
  }, [activeWedding]);

  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );

  const loadFavorites = useCallback(async () => {
    const loadLegacy = async () => {
      if (currentUser) {
        try {
          const legacyRemote = await loadData('ideasPhotos', {
            firestore: true,
            collection: 'userIdeas',
            fallbackToLocal: true,
            placeholder: { title: t('inspiration.titlePlaceholder'), imageUrl: t('inspiration.imageUrlPlaceholder') },
          });
          if (Array.isArray(legacyRemote) && legacyRemote.length) {
            return legacyRemote;
          }
        } catch (error) {
          console.warn(`[Inspiration] No se pudo leer favoritos legacy remotos: ${error}`);
        }
      }
      try {
        const legacyLocal =
          JSON.parse(localStorage.getItem('ideasPhotos') || 'null') ||
          JSON.parse(localStorage.getItem('inspirationFavorites') || 'null');
        return Array.isArray(legacyLocal) && legacyLocal.length ? legacyLocal : null;
      } catch {
        return null;
      }
    };

    let favs = await loadData(storageKey, syncOptions);
    let migrated = false;

    if (!Array.isArray(favs) || favs.length === 0) {
      const legacy = await loadLegacy();
      if (Array.isArray(legacy) && legacy.length) {
        favs = legacy;
        migrated = true;
        await saveData(storageKey, legacy, { ...syncOptions, showNotification: false });
      } else {
        favs = Array.isArray(favs) ? favs : [];
      }
    }

    if (migrated) {
      try {
        localStorage.removeItem('ideasPhotos');
        localStorage.removeItem('inspirationFavorites');
      } catch {
        /* noop */
      }
    }

    if (Array.isArray(favs) && favs.length) {
      const counts = {};
      favs.forEach((p) =>
        (p.tags || []).forEach((t) => {
          const slug = normalizeTag(t);
          if (!slug) return;
          counts[slug] = (counts[slug] || 0) + 1;
        })
      );
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([slug]) => slug);
      setPrefTags(sorted.slice(0, 5));
    } else {
      setPrefTags([]);
    }

    if (selectedTag === 'favs') {
      setItems(favs);
    }

    try {
      window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
    } catch {
      /* noop */
    }

    return favs;
  }, [storageKey, syncOptions, selectedTag, currentUser]);

  // Obtener tags preferidos basados en favoritos guardados
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (selectedTag === 'favs') {
      console.log('[Inspiration] 🏷️ selectedTag es "favs", no cargando muro');
      return; // No cargar muro cuando estamos en pestaña favoritos
    }
    async function load() {
      console.log('[Inspiration] 📡 Cargando muro - page:', page, 'query:', query, 'selectedTag:', selectedTag);
      setLoading(true);
      try {
        const newItems = await fetchWall(page, query);
        console.log('[Inspiration] ✅ fetchWall devolvió', newItems?.length || 0, 'items');
        if (newItems && newItems.length > 0) {
          console.log('[Inspiration] 📸 Primera imagen:', newItems[0]);
        }
        setItems((prev) => {
          const merged = [...prev, ...newItems.filter((it) => !prev.some((p) => p.id === it.id))];
          console.log('[Inspiration] 🔀 Items merged:', merged.length, 'total');
          // Personalización: boost posts que incluyan tags preferidos
          const score = (item) =>
            (item.tags || []).some((t) => prefTags.includes(normalizeTag(t))) ? 1 : 0;
          return merged.sort((a, b) => score(b) - score(a));
        });
      } catch (error) {
        console.error('[Inspiration] ❌ Error en fetchWall:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, query, selectedTag]);

  const handleSave = async (item) => {
    // Cargar estado actual de favoritos (Firestore si autenticado)
    const current = (await loadData(storageKey, syncOptions)) || [];
    const exists = Array.isArray(current) && current.some((p) => p.id === item.id);
    let next;
    const isAdding = !exists;
    if (exists) {
      // Unfavorite: eliminar del array
      next = current.filter((p) => p.id !== item.id);
    } else {
      // Favorite: añadir al array
      next = [...current, item];
      // actualizar prefTags en memoria SOLO al añadir
      const newTags = (item.tags || [])
        .map((t) => normalizeTag(t))
        .filter((slug) => slug && !prefTags.includes(slug));
      if (newTags.length) {
        setPrefTags((prev) => {
          const merged = Array.from(new Set([...prev, ...newTags]));
          return merged.slice(0, 5);
        });
      }
    }
    // Guardar array resultante (Firestore si autenticado; siempre actualiza localStorage)
    await saveData(storageKey, next, {
      ...syncOptions,
      showNotification: false,
    });
    // Si estamos en la pestaña de favoritos, refrescar inmediatamente el listado
    if (selectedTag === 'favs') {
      setItems(next);
    }
    // Tracking de interacción (mañado estrella)
    trackInteraction(userId, item, 0, true);
    if (isAdding) {
      try {
        window.dispatchEvent(new Event('maloveapp-important-note'));
      } catch (_) {
        // no-op si el entorno bloquea eventos personalizados
      }
    }
  };

  const handleView = (item, dwellStart) => {
    const dwellTime = Date.now() - dwellStart;
    trackInteraction(userId, item, dwellTime, false);
  };

  const handleSearch = ({ query: q }) => {
    setItems([]);
    setPage(1);
    setQuery(q || 'wedding');
    setSelectedTag('all');
  };

  const handleTag = async (rawTag) => {
    console.log('[Inspiration] 🏷️ handleTag llamado con rawTag:', rawTag);
    const tag = normalizeFilterValue(rawTag);
    console.log('[Inspiration] 🏷️ Tag normalizado:', tag);
    setSelectedTag(tag);
    if (tag === 'favs') {
      console.log('[Inspiration] ⭐ Cambiando a pestaña favoritos');
      const favs = await loadData(storageKey, syncOptions);
      setItems(Array.isArray(favs) ? favs : []);
      setPage(1);
      return;
    }
    console.log('[Inspiration] 🔄 Reseteando items y cargando nueva categoría');
    setItems([]);
    setPage(1);
    const newQuery = tag === 'all' ? 'wedding' : tag;
    console.log('[Inspiration] 🔍 Nueva query:', newQuery);
    setQuery(newQuery);
  };

  // Leer tag de URL al cargar (ej: /inspiracion?tag=decoracion)
  useEffect(() => {
    console.log('[Inspiration] 🌐 Leyendo tag de URL');
    const urlParams = new URLSearchParams(window.location.search);
    const urlTag = urlParams.get('tag');
    console.log('[Inspiration] 🌐 Tag de URL:', urlTag);
    if (urlTag) {
      console.log('[Inspiration] 🚀 Aplicando filtro desde URL');
      handleTag(urlTag);
    } else {
      console.log('[Inspiration] ℹ️ No hay tag en URL, carga normal');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Inspiración</h1>
      <SearchBar onResults={() => {}} onSearch={handleSearch} />
      <InspirationGallery
        images={items}
        onSave={handleSave}
        onView={(item) => handleView(item, Date.now())}
        lastItemRef={lastItemRef}
        onTagClick={handleTag}
        activeTag={selectedTag}
        storageKey={storageKey}
      />

      {loading && (
        <div className="flex justify-center my-6">
          <Spinner />
        </div>
      )}
    </div>
  );
}
