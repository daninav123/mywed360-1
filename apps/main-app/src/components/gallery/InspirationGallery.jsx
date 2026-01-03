import { Star, StarOff, X } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const normalizeTag = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const humanize = (value = '') =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const TAG_LABELS = {
  favs: 'Favoritos',
  ceremonia: 'Ceremonia',
  decoracion: 'Decoración',
  coctel: 'Cóctel',
  banquete: 'Banquete',
  disco: 'Disco',
  flores: 'Flores',
  vestido: 'Vestidos',
  pastel: 'Pasteles',
  fotografia: 'Fotografía',
  inspiration: 'Inspiración',
};

// Tags base (slug) se sincronizan con servicios y filtros
const BASE_TAGS = [
  'favs',
  'ceremonia',
  'decoracion',
  'coctel',
  'banquete',
  'disco',
  'flores',
  'vestido',
  'pastel',
  'fotografia',
  'inspiration',
];

const DEFAULT_IMAGES = [];

export default function InspirationGallery({
  images = [],
  onSave = () => {},
  onView = () => {},
  lastItemRef = null,
  onTagClick = () => {},
  activeTag = 'all',
  storageKey = 'inspirationFavorites',
}) {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState(activeTag);
  const [favorites, setFavorites] = useState([]); // ids de favoritos
  const [lightbox, setLightbox] = useState(null); // id

  console.log('[InspirationGallery] 📸 Props recibidas - images.length:', images.length, 'activeTag:', activeTag);

  // Mantener filtro sincronizado con prop activeTag
  useEffect(() => {
    console.log('[InspirationGallery] 🔄 Actualizando filter a:', activeTag);
    setFilter(activeTag);
  }, [activeTag]);

  // Cargar favoritos al montar y mantener en sync con otras pestañas
  useEffect(() => {
    const loadFavIds = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return stored.map((p) => p.id);
      } catch {
        return [];
      }
    };
    setFavorites(loadFavIds());
    const handler = (e) => {
      if (!e.key || e.key === storageKey) {
        setFavorites(loadFavIds());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [storageKey]);

  const DATA = images.length ? images : DEFAULT_IMAGES;
  console.log('[InspirationGallery] 📊 DATA.length:', DATA.length, 'images.length:', images.length);

  const allTags = useMemo(() => {
    const tags = new Map();
    BASE_TAGS.forEach((slug) => {
      tags.set(slug, TAG_LABELS[slug] || humanize(slug));
    });
    DATA.forEach((img) =>
      (img.tags || []).forEach((rawTag) => {
        const slug = normalizeTag(rawTag);
        if (!slug) return;
        if (!tags.has(slug)) {
          tags.set(slug, TAG_LABELS[slug] || humanize(rawTag));
        }
      })
    );
    return Array.from(tags.entries());
  }, [DATA]);

  const filtered = useMemo(() => {
    const eff = activeTag || filter;
    console.log('[InspirationGallery] 🔍 Filtrando - eff:', eff, 'DATA.length:', DATA.length);
    
    // Log para ver los tags de las primeras imágenes
    if (DATA.length > 0) {
      console.log('[InspirationGallery] 🏷️ Tags de primera imagen:', DATA[0].tags);
      console.log('[InspirationGallery] 📦 Primera imagen completa:', DATA[0]);
    }
    
    if (eff === 'all') {
      console.log('[InspirationGallery] ✅ Mostrando todos:', DATA.length);
      return DATA;
    }
    if (eff === 'favs') {
      // Si el padre ya nos pasa solo favoritos (activeTag==='favs'), no filtres de nuevo
      if (activeTag === 'favs') {
        console.log('[InspirationGallery] ⭐ Mostrando favoritos (desde padre):', DATA.length);
        return DATA;
      }
      const favs = DATA.filter((img) => favorites.includes(img.id));
      console.log('[InspirationGallery] ⭐ Favoritos filtrados:', favs.length);
      return favs;
    }
    const normalizedEff = normalizeTag(eff);
    console.log('[InspirationGallery] 🏷️ Filtrando por tag normalizado:', normalizedEff);
    
    // Si las imágenes vienen de una búsqueda específica (ej: decoracion), mostrarlas todas
    // porque ya están filtradas por el backend
    if (activeTag && activeTag !== 'all' && activeTag !== 'favs') {
      console.log('[InspirationGallery] ✨ Mostrando todas las imágenes porque ya vienen filtradas del backend');
      return DATA;
    }
    
    const result = DATA.filter((img) =>
      (img.tags || []).some((tag) => normalizeTag(tag) === normalizedEff)
    );
    console.log('[InspirationGallery] 📋 Items después de filtrar:', result.length);
    
    // Si no hay resultados pero hay data, mostrar todo (fallback)
    if (result.length === 0 && DATA.length > 0) {
      console.log('[InspirationGallery] ⚠️ No hay matches, mostrando todas las imágenes como fallback');
      return DATA;
    }
    
    return result;
  }, [filter, activeTag, DATA, favorites]);

  const toggleFav = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Pestañas mejoradas */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => {
            setFilter('all');
            onTagClick('all');
          }}
          data-testid="inspiration-tag-all"
          className="transition-all duration-300"
          style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '13px',
            fontWeight: (activeTag || filter) === 'all' ? 600 : 500,
            padding: '10px 20px',
            borderRadius: '12px',
            border: (activeTag || filter) === 'all' 
              ? '2px solid #F8A5B7'
              : '1px solid #E5E7EB',
            backgroundColor: (activeTag || filter) === 'all' 
              ? '#FCE4EC'
              : '#FFFFFF',
            color: (activeTag || filter) === 'all' 
              ? '#F8A5B7'
              : '#6B7280',
            boxShadow: (activeTag || filter) === 'all'
              ? '0 4px 12px rgba(248, 165, 183, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            if ((activeTag || filter) !== 'all') {
              e.currentTarget.style.borderColor = '#F8A5B7';
              e.currentTarget.style.color = '#F8A5B7';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if ((activeTag || filter) !== 'all') {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          {t('all', 'Todos')}
        </button>
        {allTags.map(([tag, label]) => (
          <button
            key={tag}
            onClick={() => {
              setFilter(tag);
              onTagClick(tag);
            }}
            data-testid={`inspiration-tag-${tag}`}
            className="transition-all duration-300"
            style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: (activeTag || filter) === tag ? 600 : 500,
              padding: '10px 20px',
              borderRadius: '12px',
              border: (activeTag || filter) === tag 
                ? '2px solid #F8A5B7'
                : '1px solid #E5E7EB',
              backgroundColor: (activeTag || filter) === tag 
                ? '#FCE4EC'
                : '#FFFFFF',
              color: (activeTag || filter) === tag 
                ? '#F8A5B7'
                : '#6B7280',
              boxShadow: (activeTag || filter) === tag
                ? '0 4px 12px rgba(248, 165, 183, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              if ((activeTag || filter) !== tag) {
                e.currentTarget.style.borderColor = '#F8A5B7';
                e.currentTarget.style.color = '#F8A5B7';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if ((activeTag || filter) !== tag) {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {DATA.length === 0 && (
        <div className="w-full flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
      {DATA.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {console.log('[InspirationGallery] 🖼️ Renderizando', filtered.length, 'imágenes filtradas')}
          {filtered.map((img, idx) => (
            <div
              key={`${img.id}_${idx}`}
              ref={idx === filtered.length - 1 ? lastItemRef : null}
              className="relative group cursor-pointer"
              onClick={() => {
                setLightbox(img.id);
                onView(img);
              }}
            >
              <img
                src={img.thumb || img.url || img.media_url}
                onError={(e) => {
                  // Manejo robusto de errores de carga de imagen
                  const attempted = e.target.getAttribute('data-attempt') || 'thumb';
                  // Evitar bucle infinito configurando onerror una sola vez
                  if (attempted === 'thumb' && img.url && e.target.src !== img.url) {
                    e.target.setAttribute('data-attempt', 'url');
                    e.target.src = img.url;
                  } else if (
                    attempted === 'url' &&
                    img.media_url &&
                    e.target.src !== img.media_url
                  ) {
                    e.target.setAttribute('data-attempt', 'media_url');
                    e.target.src = img.media_url;
                  } else if (
                    attempted === 'media_url' &&
                    img.original_url &&
                    e.target.src !== img.original_url
                  ) {
                    e.target.setAttribute('data-attempt', 'original');
                    e.target.src = img.original_url;
                  } else {
                    // Último intento fallido, remover onError para evitar loops y mostrar placeholder
                    e.target.onerror = null;
                    // Placeholder local genérico
                    e.target.src = '/badge-72.png';
                  }
                }}
                alt={
                  img.tags && img.tags.length
                    ? t('inspiration.altWithTags', 'inspiración: {{tags}}', {
                        tags: img.tags.join(', '),
                      })
                    : t('inspiration.alt', 'inspiración')
                }
                aria-label={
                  img.tags && img.tags.length
                    ? t('inspiration.ariaWithTags', 'Imagen de inspiración: {{tags}}', {
                        tags: img.tags.join(', '),
                      })
                    : t('inspiration.aria', 'Imagen de inspiración')
                }
                className="w-full aspect-square object-cover rounded-lg"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(img.id);
                  onSave(img);
                }}
                className="absolute top-1 right-1 text-white drop-shadow-md"
                aria-label={
                  favorites.includes(img.id)
                    ? t('inspiration.removeFav', 'Quitar de favoritos')
                    : t('inspiration.addFav', 'Añadir a favoritos')
                }
              >
                {favorites.includes(img.id) ? (
                  <Star size={18} fill="#facc15" />
                ) : (
                  <StarOff size={18} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative">
            <img
              src={DATA.find((i) => i.id === lightbox).url}
              alt=""
              className="max-h-[80vh] rounded"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-1"
              aria-label={t('close', 'Cerrar')}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
