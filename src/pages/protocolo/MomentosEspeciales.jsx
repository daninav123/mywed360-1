import React, { useState } from 'react';
import { Music, Edit2, Play, Plus, Trash2, Search as SearchIcon, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import { post as apiPost } from '../../services/apiClient';
import { MUSIC_INSPIRATION } from '../../data/musicInspiration';

const TABS = [
  { key: 'ceremonia', label: 'Ceremonia' },
  { key: 'coctail', label: 'Cóctel' },
  { key: 'banquete', label: 'Banquete' },
  { key: 'disco', label: 'Disco' },
];

const MomentosEspeciales = () => {
  const { moments, addMoment, updateMoment, removeMoment, reorderMoment, duplicateMoment } = useSpecialMoments();

  // Estado básico
  const [activeTab, setActiveTab] = useState('ceremonia');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // IA e inspiración
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSongs, setAiSongs] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);

  // Búsqueda por nombre (iTunes)
  const handleSearch = async () => {
    const term = search.trim();
    if (!term) { setResults([]); return; }
    setLoadingSearch(true);
    setErrorSearch(null);
    try {
      const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`);
      const data = await resp.json();
      if (Array.isArray(data.results)) {
        const mapped = data.results.map(r => ({ id: r.trackId, name: `${r.trackName} - ${r.artistName}` }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando canciones', err);
      setErrorSearch('No se pudo buscar canciones. Intentalo mas tarde.');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Añadir momento
  const handleAddMoment = () => {
    const nextOrder = (moments[activeTab]?.length || 0) + 1;
    addMoment(activeTab, { order: nextOrder, title: `Nuevo momento ${nextOrder}`, song: '', time: '' });
  };

  // Búsqueda con IA via backend
  const handleAISearch = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) { setAiSongs([]); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await apiPost('/api/ai-songs/recommend', { prompt, context: activeTab }, { auth: true });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.songs) ? data.songs : [];
      const mapped = items.map((s, i) => ({
        id: `${Date.now()}-${i}`,
        title: s.title || s.name || 'Cancion',
        artist: s.artist || s.author || '',
        reason: s.reason || s.why || '',
        mood: s.mood || '',
        tempo: s.tempo || '',
        era: s.era || '',
        tags: Array.isArray(s.tags) ? s.tags : [],
      }));
      setAiSongs(mapped);
    } catch (e) {
      console.error('AI songs error', e);
      setAiError('No se pudo obtener recomendaciones. Prueba de nuevo.');
      setAiSongs([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PageWrapper title="Momentos Especiales">
      <div className="space-y-6">
        <p className="text-gray-600">Planifica cada instante clave con la música y el momento adecuados.</p>

        {/* Tabs */}
        <div className="border-b flex gap-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`pb-2 -mb-px font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => { setActiveTab(tab.key); setResults([]); setSearch(''); setAiSongs([]); setAiError(null); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="space-y-5 p-5">
          {/* Inspiración */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-600" />
              <h3 className="font-medium">Inspiración</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(MUSIC_INSPIRATION[activeTab] || {}).map(([cat, songs]) => (
                <div key={cat} className="border rounded-md">
                  <button
                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => setOpenCategory(prev => prev === cat ? null : cat)}
                  >
                    <span className="font-medium text-sm">{cat}</span>
                    <span className="text-xs text-gray-500">{openCategory === cat ? 'Ocultar' : 'Ver sugerencias'}</span>
                  </button>
                  {openCategory === cat && (
                    <ul className="divide-y">
                      {songs.map((s, idx) => (
                        <li key={`${cat}-${idx}`} className="p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{s.title} <span className="text-gray-500">- {s.artist}</span></div>
                            {s.tags?.length ? (
                              <div className="text-xs text-gray-500 truncate">{s.tags.join(' · ')}</div>
                            ) : null}
                          </div>
                          <Button
                            className="text-xs py-1 px-2"
                            onClick={() => {
                              if (!moments[activeTab]?.length) {
                                addMoment(activeTab, { order: 1, title: cat, song: `${s.title} - ${s.artist}`, time: '' });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last) updateMoment(activeTab, last.id, { ...last, song: `${s.title} - ${s.artist}` });
                              }
                            }}
                          >Usar</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* IA */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <h3 className="font-medium">Encuentra la canción perfecta (IA)</h3>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe el momento: 'primer baile, balada en español'"
                className="flex-1 border rounded px-3 py-2"
              />
              <button onClick={handleAISearch} className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-1">
                <Sparkles size={16} /> Buscar con IA
              </button>
            </div>
            {aiLoading && <p className="text-sm text-gray-500">Buscando recomendaciones...</p>}
            {aiError && <p className="text-sm text-red-600">{aiError}</p>}
            {aiSongs.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                  Recomendaciones de IA
                  <button onClick={() => setAiSongs([])} className="float-right text-gray-500 hover:text-gray-700">
                    <X size={16} />
                  </button>
                </div>
                <ul className="divide-y">
                  {aiSongs.map((s) => (
                    <li key={s.id} className="p-2 hover:bg-purple-50 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.title} {s.artist ? <span className="text-gray-500">- {s.artist}</span> : null}</div>
                        {(s.mood || s.tempo || s.era || (s.tags?.length)) && (
                          <div className="text-xs text-gray-500 truncate">
                            {[s.mood, s.tempo, s.era].filter(Boolean).join(' · ')}{s.tags?.length ? ` · ${s.tags.join(' · ')}` : ''}
                          </div>
                        )}
                        {s.reason && <div className="text-xs text-gray-600 line-clamp-2">{s.reason}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            if (!moments[activeTab]?.length) {
                              addMoment(activeTab, { order: 1, title: 'Nuevo momento', song: `${s.title}${s.artist ? ' - ' + s.artist : ''}`, time: '' });
                            } else {
                              const last = [...(moments[activeTab] || [])].pop();
                              if (last) updateMoment(activeTab, last.id, { ...last, song: `${s.title}${s.artist ? ' - ' + s.artist : ''}` });
                            }
                          }}
                        >Usar</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Buscador de canciones (por nombre) */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar canción por nombre..."
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1">
              <SearchIcon size={16} /> Buscar
            </button>
          </div>

          {/* Estado búsqueda */}
          {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados búsqueda */}
          {results.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                Resultados
                <button onClick={() => setResults([])} className="float-right text-gray-500 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>
              <ul className="divide-y">
                {results.map(song => (
                  <li key={song.id} className="p-2 hover:bg-blue-50">
                    <button
                      className="w-full text-left flex justify-between items-center"
                      onClick={() => {
                        if (!moments[activeTab]?.length) {
                          addMoment(activeTab, { order: 1, title: 'Nuevo momento', song: song.name, time: '' });
                        } else {
                          const lastMoment = [...(moments[activeTab] || [])].pop();
                          if (lastMoment) {
                            updateMoment(activeTab, lastMoment.id, { ...lastMoment, song: song.name });
                          }
                        }
                        setResults([]);
                      }}
                    >
                      <span className="truncate">{song.name}</span>
                      <Play size={16} className="text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lista de momentos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{TABS.find(t => t.key === activeTab)?.label || 'Momentos'}</h3>
              <Button onClick={handleAddMoment} className="py-1 px-3 text-sm flex items-center gap-1">
                <Plus size={14} /> Añadir momento
              </Button>
            </div>

            <div className="space-y-3">
              {moments[activeTab]?.length ? (
                moments[activeTab]
                  .sort((a, b) => a.order - b.order)
                  .map((moment, idx) => (
                    <div key={moment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full font-medium border-0 border-b border-transparent focus:border-blue-300 focus:ring-0 p-0 pb-1"
                            value={moment.title || ''}
                            onChange={e => updateMoment(activeTab, moment.id, { ...moment, title: e.target.value })}
                            placeholder="Título del momento"
                          />

                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Music size={12} /> Canción
                              </div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.song || ''}
                                onChange={e => updateMoment(activeTab, moment.id, { ...moment, song: e.target.value })}
                                placeholder="Nombre de la canción"
                              />
                            </div>

                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Duración</div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.time || ''}
                                onChange={e => updateMoment(activeTab, moment.id, { ...moment, time: e.target.value })}
                                placeholder="00:00"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => removeMoment(activeTab, moment.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            onClick={() => duplicateMoment(activeTab, moment.id)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar"
                          >
                            <Edit2 size={16} />
                          </button>

                          {idx > 0 && (
                            <button
                              onClick={() => reorderMoment(activeTab, moment.id, 'up')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover arriba"
                            >
                              <ChevronUp size={16} />
                            </button>
                          )}

                          {idx < moments[activeTab].length - 1 && (
                            <button
                              onClick={() => reorderMoment(activeTab, moment.id, 'down')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover abajo"
                            >
                              <ChevronDown size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No hay momentos en esta sección.</p>
                  <p className="text-sm mt-1">Haz clic en "Añadir momento" para crear uno nuevo.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default MomentosEspeciales;

