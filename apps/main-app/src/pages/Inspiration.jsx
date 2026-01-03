import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, Mail, Moon, LogOut } from 'lucide-react';

import InspirationGallery from '../components/gallery/InspirationGallery';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import LanguageSelector from '../components/ui/LanguageSelector';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import Nav from '../components/Nav';
import { useAuth } from '../hooks/useAuth.jsx';
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
  const { t } = useTranslation();
  const { currentUser, logout: logoutUnified } = useAuth();
  const { activeWedding } = useWedding();
  const userId = currentUser?.uid || 'anon';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('wedding');
  const [selectedTag, setSelectedTag] = useState('all');
  const [prefTags, setPrefTags] = useState([]);
  const [openMenu, setOpenMenu] = useState(false); // top tags del usuario
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
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        {/* Botones superiores derechos */}
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          
          <div className="relative" data-user-menu>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={t('common:inspiration.userMenu')}
              style={{
                backgroundColor: openMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${openMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: openMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <User className="w-5 h-5" style={{ color: openMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            
            {openMenu && (
              <div 
                className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1"
                style={{
                  minWidth: '220px',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 9999,
                }}
              >
                <div className="px-2 py-1">
                  <NotificationCenter />
                </div>

                <Link
                  to="/perfil"
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 mr-3" />
                  {t('common:inspiration.profile')}
                </Link>

                <Link
                  to="/email"
                  onClick={() => setOpenMenu(false)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                >
                  <Mail className="w-4 h-4 mr-3" />
                  {t('common:inspiration.emailInbox')}
                </Link>

                <div 
                  className="px-3 py-2.5 rounded-xl transition-all duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center" className="text-body">
                      <Moon className="w-4 h-4 mr-3" />
                      {t('common:inspiration.darkMode')}
                    </span>
                    <DarkModeToggle className="ml-2" />
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
                
                <button
                  onClick={() => {
                    logoutUnified();
                    setOpenMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center"
                  className="text-danger"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {t('common:inspiration.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            {/* Título con líneas decorativas */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>{t('common:inspiration.pageTitle')}</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            
            {/* Subtítulo como tag uppercase */}
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>{t('common:inspiration.pageSubtitle')}</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
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
      </div>
      </div>
      <Nav />
    </>
  );
}
