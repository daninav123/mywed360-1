import { Star, StarOff, X } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslations } from '../../hooks/useTranslations';

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
  decoracion: t('common.decoracion'),
  coctel: t('common.coctel'),
  banquete: 'Banquete',
  disco: 'Disco',
  flores: 'Flores',
  vestido: 'Vestidos',
  pastel: 'Pasteles',
  fotografia: t('common.fotografia'),
  inspiration: t('common.inspiracion'),
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

  // Mantener filtro sincronizado con prop activeTag
  useEffect(() => {
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
    if (eff === 'all') return DATA;
    if (eff === 'favs') {
      // Si el padre ya nos pasa solo favoritos (activeTag==='favs'), no filtres de nuevo
      if (activeTag === 'favs') return DATA;
      return DATA.filter((img) => favorites.includes(img.id));
    }
    const normalizedEff = normalizeTag(eff);
    return DATA.filter((img) =>
      (img.tags || []).some((tag) => normalizeTag(tag) === normalizedEff)
    );
  }, [filter, activeTag, DATA, favorites]);

  const toggleFav = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilter('all');
            onTagClick('all');
          }}
          data-testid="inspiration-tag-all"
          className={`px-3 py-1 rounded text-xs border ${
            (activeTag || filter) === 'all' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
        >
          {t('common.all', 'Todos')}
        </button>
        {allTags.map(([tag, label]) => (
          <button
            key={tag}
            onClick={() => {
              setFilter(tag);
              onTagClick(tag);
            }}
            data-testid={`inspiration-tag-${tag}`}
            className={`px-3 py-1 rounded text-xs border ${
              (activeTag || filter) === tag ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
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
                src={img.thumb || img.url}
                onError={(e) => {
                  // Manejo robusto de errores de carga de imagen
                  const attempted = e.target.getAttribute('data-attempt') || 'thumb';
                  // Evitar bucle infinito configurando onerror una sola vez
                  if (attempted === 'thumb' && img.url && e.target.src !== img.url) {
                    e.target.setAttribute('data-attempt', 'url');
                    e.target.src = img.url;
                  } else if (
                    attempted === 'url' &&
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
                    ? t('inspiration.altWithTags', t('common.inspiracion_tags'), {
                        tags: img.tags.join(', '),
                      })
                    : t('inspiration.alt', t('common.inspiracion'))
                }
                aria-label={
                  img.tags && img.tags.length
                    ? t('inspiration.ariaWithTags', t('common.imagen_inspiracion_tags'), {
                        tags: img.tags.join(', '),
                      })
                    : t('inspiration.aria', t('common.imagen_inspiracion'))
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
                    : t('inspiration.addFav', t('common.anadir_favoritos'))
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
              aria-label={t('common.close', 'Cerrar')}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
