import React, { useState, useMemo, useEffect } from 'react';
import { Star, StarOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Ejemplo estático: en producción vendrá de API o CMS
const BASE_TAGS = ['favs','ceremonia','decoración','cóctel','banquete','disco','flores','vestido','pastel','fotografía','inspiration'];


const DEFAULT_IMAGES = [];

export default function InspirationGallery({ images = [], onSave = () => {}, onView = () => {}, lastItemRef = null, onTagClick = () => {}, activeTag = 'all' }) {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState(activeTag);
  const [favorites, setFavorites] = useState([]); // ids de favoritos
  const [lightbox, setLightbox] = useState(null); // id

  // Mantener filtro sincronizado con prop activeTag
  useEffect(()=>{
    setFilter(activeTag);
  }, [activeTag]);

  // Cargar favoritos al montar y mantener en sync con otras pestañas
  useEffect(() => {
    const loadFavIds = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('ideasPhotos') || '[]');
        return stored.map(p => p.id);
      } catch {
        return [];
      }
    };
    setFavorites(loadFavIds());
    const handler = (e) => {
      if (e.key === 'ideasPhotos') {
        setFavorites(loadFavIds());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const DATA = images.length ? images : DEFAULT_IMAGES;

  const allTags = useMemo(() => {
    const tags = new Set(BASE_TAGS);
    DATA.forEach(img => (img.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [DATA]);

  const filtered = useMemo(() => {
    const eff = activeTag || filter;
    if (eff === 'all') return DATA;
    if (eff === 'favs') {
      // Si el padre ya nos pasa solo favoritos (activeTag==='favs'), no filtres de nuevo
      if (activeTag === 'favs') return DATA;
      return DATA.filter(img => favorites.includes(img.id));
    }
    return DATA.filter(img => (img.tags || []).includes(eff));
  }, [filter, activeTag, DATA, favorites]);

  const toggleFav = id => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => {setFilter('all'); onTagClick('all');}} className={`px-3 py-1 rounded text-xs border ${(activeTag||filter)==='all'?'bg-blue-600 text-white':'bg-white'}`}>Todos</button>
        {allTags.map(tag => (
          <button key={tag} onClick={()=>{setFilter(tag); onTagClick(tag);}} className={`px-3 py-1 rounded text-xs border capitalize ${(activeTag||filter)===tag?'bg-blue-600 text-white':'bg-white'}`}>{tag}</button>
        ))}
      </div>

      {DATA.length === 0 && (
          <div className="w-full flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        )}
        {DATA.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((img, idx) => (
          <div key={`${img.id}_${idx}`} ref={idx===filtered.length-1 ? lastItemRef : null} className="relative group cursor-pointer" onClick={()=>{setLightbox(img.id); onView(img);}}>
            <img
              src={img.thumb || img.url}
              onError={e => {
                // Manejo robusto de errores de carga de imagen
                const attempted = e.target.getAttribute('data-attempt') || 'thumb';
                // Evitar bucle infinito configurando onerror una sola vez
                if (attempted === 'thumb' && img.url && e.target.src !== img.url) {
                  e.target.setAttribute('data-attempt', 'url');
                  e.target.src = img.url;
                } else if (attempted === 'url' && img.original_url && e.target.src !== img.original_url) {
                  e.target.setAttribute('data-attempt', 'original');
                  e.target.src = img.original_url;
                } else {
                  // Último intento fallido, remover onError para evitar loops y mostrar placeholder
                  e.target.onerror = null;
                  // Opcional: establece un placeholder local genérico
                  e.target.src = '/badge-72.png';
                }
              }}
              alt={(img.tags && img.tags.length ? `inspiración: ${img.tags.join(', ')}` : 'inspiración')}
              aria-label={(img.tags && img.tags.length ? `Imagen de inspiración: ${img.tags.join(', ')}` : 'Imagen de inspiración')}
              className="w-full aspect-square object-cover rounded-lg"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={e=>{e.stopPropagation();toggleFav(img.id); onSave(img);}}
              className="absolute top-1 right-1 text-white drop-shadow-md"
              aria-label={favorites.includes(img.id)?'Quitar de favoritos':'Añadir a favoritos'}
            >
              {favorites.includes(img.id)?<Star size={18} fill="#facc15"/>:<StarOff size={18} />}
            </button>
          </div>
        ))}
      </div> )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative">
            <img src={DATA.find(i=>i.id===lightbox).url} alt="" className="max-h-[80vh] rounded" />
            <button onClick={()=>setLightbox(null)} className="absolute -top-4 -right-4 bg-white rounded-full p-1"><X size={20}/></button>
          </div>
        </div>
      )}
    </div>
  );
}


