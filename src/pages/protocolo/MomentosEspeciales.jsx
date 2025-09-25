import {
  Music,
  Edit2,
  Play,
  Plus,
  Trash2,
  Search as SearchIcon,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Pause,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { MUSIC_INSPIRATION } from '../../data/musicInspiration';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import { post as apiPost } from '../../services/apiClient';
import * as Playback from '../../services/PlaybackService';

// Tabs pasan a ser dinÃ¡micas desde el hook (blocks)

const MomentosEspeciales = () => {
  const {
    blocks,
    moments,
    addMoment,
    updateMoment,
    removeMoment,
    reorderMoment,
    duplicateMoment,
    addBlock,
    renameBlock,
    removeBlock,
    reorderBlocks,
  } = useSpecialMoments();

  // Estado bÃ¡sico
  const [activeTab, setActiveTab] = useState('ceremonia');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // IA e Inspiración
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSongs, setAiSongs] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [aiLanguage, setAiLanguage] = useState('es');
  const [aiTempo, setAiTempo] = useState('');
  const [aiEra, setAiEra] = useState('');
  const [aiGenre, setAiGenre] = useState('');
  const [profilePrefs, setProfilePrefs] = useState({ languages: ['es'], genres: [], decades: [] });

  // Cargar preferencias guardadas en Perfil desde localStorage si existen
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lovenda_music_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfilePrefs({
          languages: Array.isArray(parsed?.languages) ? parsed.languages : ['es'],
          genres: Array.isArray(parsed?.genres) ? parsed.genres : [],
          decades: Array.isArray(parsed?.decades) ? parsed.decades : [],
        });
        // Prefijar idiomási viene vacÃ­o
        if (!aiLanguage && parsed?.languages?.length) {
          setAiLanguage(parsed.languages[0]);
        }
      }
    } catch {}
  }, []);
  // Asegura que la pestaÃ±a activa exista entre los bloques dinÃ¡micos
  useEffect(() => {
    try {
      if (!Array.isArray(blocks) || !blocks.length) return;
      if (!blocks.find((b) => b.id === activeTab)) {
        setActiveTab(blocks[0]?.id || 'ceremonia');
      }
    } catch {}
  }, [blocks]);
  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      try {
        Playback.stop();
      } catch {}
    };
  }, []);
  const [playingId, setPlayingId] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerState, setPlayerState] = useState({ currentId: null, currentTime: 0, duration: 0, volume: 1, paused: true });

  useEffect(() => {
    try {
      const unsub = Playback.subscribe((s) => {
        setPlayerState(s || {});
        if (!s?.currentId) setPlayingId(null);
      });
      return () => { try { unsub && unsub(); } catch {} };
    } catch {}
  }, []);

  const formatTime = (s) => {
    try {
      const sec = Math.max(0, Math.floor(Number(s) || 0));
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      return `${m}:${String(r).padStart(2, '0')}`;
    } catch { return '0:00'; }
  };

  // (Se eliminÃ³ la sección de conexión con Spotify)

  // Extrae un embed URL de Spotify si el campo "Canción" contiene un enlace vÃ¡lido
  const getSpotifyEmbedUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      // Acepta formatos:
      //  - https://open.spotify.com/track/{id}
      //  - https://open.spotify.com/track/{id}?si=...
      //  - spotify:track:{id}
      let id = null;
      const urlMatch = raw.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (urlMatch && urlMatch[1]) id = urlMatch[1];
      if (!id) {
        const uriMatch = raw.match(/spotify:track:([a-zA-Z0-9]+)/);
        if (uriMatch && uriMatch[1]) id = uriMatch[1];
      }
      return id ? `https://open.spotify.com/embed/track/${id}` : null;
    } catch {
      return null;
    }
  };

  // Guardar Preferencias músicales en localStorage
  const saveProfilePrefs = () => {
    try {
      localStorage.setItem('lovenda_music_prefs', JSON.stringify(profilePrefs));
      if (Array.isArray(profilePrefs.languages) && profilePrefs.languages.length) {
        setAiLanguage(profilePrefs.languages[0]);
      }
    } catch {}
  };

  const stopAudio = async () => {
    await Playback.stop();
    setPlayingId(null);
  };

  const togglePreview = async (item) => {
    if (!item) return;
    if (playingId === item.id) {
      await Playback.pause();
      setPlayingId(null);
      return;
    }
    await Playback.stop();
    const ok = await Playback.playTrack(item);
    setPlayingId(ok ? item.id : null);
    if (ok) setPlayerOpen(true);
  };

  // BÃºsqueda por nombre (iTunes)
  const handleSearch = async () => {
    const term = search.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    setErrorSearch(null);
    try {
      const resp = await fetch(
        `https://music.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`
      );
      const data = await resp.json();
      if (Array.isArray(data.results)) {
        const mapped = data.results.map((r) => ({
          id: String(r.trackId),
          name: `${r.trackName} - ${r.artistName}`,
          title: r.trackName,
          artist: r.artistName,
          previewUrl: r.previewUrl,
          trackUrl: r.trackViewUrl || r.collectionViewUrl,
          artwork: r.artworkUrl60 || r.artworkUrl100,
        }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando Canciónes', err);
      setErrorSearch('No se pudo buscar Canciónes. Inténtalo más tarde.');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Añadir momento
  const handleAddMoment = () => {
    const nextOrder = (moments[activeTab]?.length || 0) + 1;
    addMoment(activeTab, {
      order: nextOrder,
      title: `Nuevo momento ${nextOrder}`,
      song: '',
      time: '',
    });
  };

  // BÃºsqueda con IA via backend
  const handleAISearch = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiSongs([]);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const prefs = [];
      // Idioma explÃ­cito del selector
      if (aiLanguage === 'es') prefs.push('idioma espaÃ±ol');
      else if (aiLanguage === 'en') prefs.push('idioma inglÃ©s');
      // Si no hay gÃ©nero/decada en UI, usa preferencias del perfil
      if (aiTempo) prefs.push(`tempo ${aiTempo}`);
      if (aiEra) prefs.push(`dÃ©cada ${aiEra}`);
      if (aiGenre) prefs.push(`gÃ©nero ${aiGenre}`);
      if (!aiGenre && profilePrefs.genres?.length)
        prefs.push(`gÃ©neros: ${profilePrefs.genres.join(', ')}`);
      if (!aiEra && profilePrefs.decades?.length)
        prefs.push(`dÃ©cadas: ${profilePrefs.decades.join(', ')}`);
      // Idiomas adicionales como pista
      const extraLangs = (profilePrefs.languages || []).filter((l) => l !== aiLanguage);
      if (extraLangs.length) prefs.push(`tambiÃ©n considerar Idiomas: ${extraLangs.join(', ')}`);
      const fullPrompt = prefs.length ? `${prompt}. Preferencias: ${prefs.join(', ')}` : prompt;
      const res = await apiPost(
        '/api/ai-songs/recommend',
        { prompt: fullPrompt, context: activeTab, language: aiLanguage },
        { auth: true }
      );
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.songs) ? data.songs : [];
      const mapped = items.map((s, i) => ({
        id: `${Date.now()}-${i}`,
        title: s.title || s.name || 'Canción',
        artist: s.artist || s.author || '',
        reason: s.reason || s.why || '',
        mood: s.mood || '',
        tempo: s.tempo || '',
        era: s.era || '',
        tags: Array.isArray(s.tags) ? s.tags : [],
      }));
      // Intentar enriquecer con previews de iTunes (best-effort)
      const enrich = async (song) => {
        try {
          const q = `${song.title} ${song.artist}`.trim();
          if (!q) return song;
          const resp = await fetch(
            `https://music.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`
          );
          const json = await resp.json();
          const hit = Array.isArray(json?.results) && json.results[0] ? json.results[0] : null;
          if (hit?.previewUrl) {
            return {
              ...song,
              previewUrl: hit.previewUrl,
              artwork: hit.artworkUrl60 || hit.artworkUrl100 || song.artwork,
              trackUrl: hit.trackViewUrl || hit.collectionViewUrl || song.trackUrl,
            };
          }
        } catch {}
        return song;
      };
      const enriched = [];
      for (let i = 0; i < mapped.length; i++) {
        // Secuencial para evitar rÃ¡fagas innecesarias
        // Se puede mejorar con lÃ­mite de concurrencia si hiciera falta
        // eslint-disable-next-line no-await-in-loop
        enriched.push(await enrich(mapped[i]));
      }
      setAiSongs(enriched);
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
        {/* Se eliminÃ³ la tarjeta de conexión con Spotify */}
        {/* Preferencias músicales (movidas desde Perfil) */}
        <Card className="space-y-4 p-5">
          <h3 className="text-md font-medium flex items-center gap-2">
            <Music size={16} /> Preferencias músicales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Idiomas</div>
              <div className="flex flex-wrap gap-2">
                {['es', 'en', 'it', 'fr', 'pt'].map((lang) => (
                  <label
                    key={lang}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.languages.includes(lang) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.languages.includes(lang)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.languages);
                          e.target.checked ? set.add(lang) : set.delete(lang);
                          return { ...prev, languages: Array.from(set) };
                        });
                      }}
                    />
                    {lang.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Géneros</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'pop',
                  'rock',
                  'jazz',
                  'latino',
                  'cl\\u00E1sica',
                  'indie',
                  'r&b',
                  'electr\\u00F3nica',
                ].map((genre) => (
                  <label
                    key={genre}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.genres.includes(genre) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.genres.includes(genre)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.genres);
                          e.target.checked ? set.add(genre) : set.delete(genre);
                          return { ...prev, genres: Array.from(set) };
                        });
                      }}
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Décadas</div>
              <div className="flex flex-wrap gap-2">
                {['70s', '80s', '90s', '2000s', '2010s', 'actual'].map((dec) => (
                  <label
                    key={dec}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.decades.includes(dec) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.decades.includes(dec)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.decades);
                          e.target.checked ? set.add(dec) : set.delete(dec);
                          return { ...prev, decades: Array.from(set) };
                        });
                      }}
                    />
                    {dec}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Button onClick={saveProfilePrefs}>Guardar preferencias</Button>
          </div>
        </Card>
        <p className="text-gray-600">
          Planifica cada instante clave con la música y el momento adecuados.
        </p>

        {/* Tabs (dinÃ¡micas desde blocks) */}
        <div className="border-b flex gap-4">
          {(blocks || []).map((tab) => (
            <button
              key={tab.id}
              className={`pb-2 -mb-px font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => {
                stopAudio();
                setActiveTab(tab.id);
                setResults([]);
                setSearch('');
                setAiSongs([]);
                setAiError(null);
              }}
              title={tab.name}
            >
              {tab.name}
            </button>
          ))}
          <button
            className="ml-auto text-xs border rounded px-2 py-1 hover:bg-gray-50"
            onClick={() => {
              const name = prompt('Nombre de la nueva sección (ej. Ensayo, Brunch...)');
              if (!name) return;
              try { addBlock(name); } catch {}
            }}
            title="Añadir sección personalizada"
          >
            Añadir sección
          </button>
        </div>

        {/* Content */}
        <Card className="space-y-5 p-5">
          {/* Mini reproductor (desplegable) para previews HTML5 */}
          {playerState?.currentId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 truncate mr-2">
                  Reproduciendo vista previa
                </div>
                <button
                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                  onClick={() => setPlayerOpen((v) => !v)}
                >
                  {playerOpen ? 'Ocultar' : 'Reproductor'}
                </button>
              </div>
              {playerOpen && (
                <div className="border rounded-md p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={async () => {
                        if (playerState.paused) await Playback.resume(); else await Playback.pause();
                      }}
                      className="p-1 text-gray-700 hover:text-blue-600"
                      title={playerState.paused ? 'Reproducir' : 'Pausar'}
                    >
                      {playerState.paused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                      onClick={async () => { await Playback.stop(); setPlayerOpen(false); }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Detener"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {/* Barra de progreso */}
                  <div className="space-y-1 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={playerState?.duration || 0}
                      step={0.1}
                      value={Math.min(playerState?.currentTime || 0, playerState?.duration || 0)}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        Playback.seek(v);
                      }}
                      className="w-full"
                      disabled={!playerState?.duration}
                    />
                    <div className="text-[11px] text-gray-500 flex justify-between">
                      <span>{formatTime(playerState?.currentTime || 0)}</span>
                      <span>{formatTime(playerState?.duration || 0)}</span>
                    </div>
                  </div>
                  {/* Volumen */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Volumen</div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={typeof playerState?.volume === 'number' ? playerState.volume : 1}
                      onChange={(e) => Playback.setVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
                    onClick={() => setOpenCategory((prev) => (prev === cat ? null : cat))}
                  >
                    <span className="font-medium text-sm">{cat}</span>
                    <span className="text-xs text-gray-500">
                      {openCategory === cat ? 'Ocultar' : 'Ver sugerencias'}
                    </span>
                  </button>
                  {openCategory === cat && (
                    <ul className="divide-y">
                      {songs.map((s, idx) => (
                        <li
                          key={`${cat}-${idx}`}
                          className="p-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {s.title} <span className="text-gray-500">- {s.artist}</span>
                            </div>
                            {s.tags?.length ? (
                              <div className="text-xs text-gray-500 truncate">
                                {s.tags.join(' Â· ')}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            className="text-xs py-1 px-2"
                            onClick={() => {
                              if (!moments[activeTab]?.length) {
                                addMoment(activeTab, {
                                  order: 1,
                                  title: cat,
                                  song: `${s.title} - ${s.artist}`,
                                  time: '',
                                });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last)
                                  updateMoment(activeTab, last.id, {
                                    ...last,
                                    song: `${s.title} - ${s.artist}`,
                                  });
                              }
                            }}
                          >
                            Usar
                          </Button>
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
              <h3 className="font-medium">Encuentra la Canción perfecta (IA)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="text-gray-600">Idioma</label>
              <select
                className="border rounded px-2 py-1"
                value={aiLanguage}
                onChange={(e) => setAiLanguage(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
              <label className="text-gray-600">Tempo</label>
              <select
                className="border rounded px-2 py-1"
                value={aiTempo}
                onChange={(e) => setAiTempo(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="lento">Lento</option>
                <option value="medio">Medio</option>
                <option value="rÃ¡pido">RÃ¡pido</option>
              </select>
              <label className="text-gray-600">DÃ©cada</label>
              <select
                className="border rounded px-2 py-1"
                value={aiEra}
                onChange={(e) => setAiEra(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="80s">80s</option>
                <option value="90s">90s</option>
                <option value="2000s">2000s</option>
                <option value="2010s">2010s</option>
                <option value="actual">Actual</option>
              </select>
              <label className="text-gray-600">GÃ©nero</label>
              <select
                className="border rounded px-2 py-1"
                value={aiGenre}
                onChange={(e) => setAiGenre(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="jazz">Jazz</option>
                <option value="latino">Latino</option>
                <option value="clÃ¡sica">ClÃ¡sica</option>
                <option value="indie">Indie</option>
                <option value="r&b">R&B</option>
              </select>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe el momento: 'primer baile, balada en espaÃ±ol'"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleAISearch}
                className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-1"
              >
                <Sparkles size={16} /> Buscar con IA
              </button>
            </div>
            {aiLoading && <p className="text-sm text-gray-500">Buscando recomendaciones...</p>}
            {aiError && <p className="text-sm text-red-600">{aiError}</p>}
            {aiSongs.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                  Recomendaciones de IA
                  <button
                    onClick={() => setAiSongs([])}
                    className="float-right text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <ul className="divide-y">
                  {aiSongs.map((s) => (
                    <li key={s.id} className="p-2 hover:bg-purple-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.title}{' '}
                            {s.artist ? <span className="text-gray-500">- {s.artist}</span> : null}
                          </div>
                          {(s.mood || s.tempo || s.era || s.tags?.length) && (
                            <div className="text-xs text-gray-500 truncate">
                              {[s.mood, s.tempo, s.era].filter(Boolean).join(' Â· ')}
                              {s.tags?.length ? ` Â· ${s.tags.join(' Â· ')}` : ''}
                            </div>
                          )}
                          {s.reason && (
                            <div className="text-xs text-gray-600 line-clamp-2">{s.reason}</div>
                          )}
                          <div className="text-xs text-gray-500 truncate mt-1">
                            Ver en:
                            <a
                              className="ml-1 hover:underline"
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              YouTube
                            </a>
                            <span> Â· </span>
                            <a
                              className="hover:underline"
                              href={`https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Spotify
                            </a>
                            <span> Â· </span>
                            <a
                              className="hover:underline"
                              href={`https://music.apple.com/search?term=${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Apple
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            title={playingId === s.id ? 'Pausar' : 'Reproducir'}
                            onClick={() => togglePreview(s)}
                            className="text-gray-500 hover:text-purple-600 p-1"
                          >
                            {playingId === s.id ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <Button
                            className="text-xs py-1 px-2"
                            onClick={() => {
                              if (!moments[activeTab]?.length) {
                                addMoment(activeTab, {
                                  order: 1,
                                  title: 'Nuevo momento',
                                  song: `${s.title}${s.artist ? ' - ' + s.artist : ''}`,
                                  time: '',
                                });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last)
                                  updateMoment(activeTab, last.id, {
                                    ...last,
                                    song: `${s.title}${s.artist ? ' - ' + s.artist : ''}`,
                                  });
                              }
                            }}
                          >
                            Usar
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Buscador de Canciónes (por nombre) */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar Canción por nombre..."
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
            >
              <SearchIcon size={16} /> Buscar
            </button>
          </div>

          {/* Estado bÃºsqueda */}
          {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados bÃºsqueda */}
          {results.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                Resultados
                <button
                  onClick={() => {
                    setResults([]);
                    stopAudio();
                  }}
                  className="float-right text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="divide-y">
                {results.map((song) => (
                  <li key={song.id} className="p-2 hover:bg-blue-50">
                    <div className="w-full flex items-center gap-2">
                      {song.artwork && (
                        <img
                          src={song.artwork}
                          alt="cover"
                          className="w-8 h-8 rounded object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {song.title} <span className="text-gray-500">- {song.artist}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          <a
                            className="hover:underline"
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            YouTube
                          </a>
                          <span> Â· </span>
                          <a
                            className="hover:underline"
                            href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Spotify
                          </a>
                          <span> Â· </span>
                          <a
                            className="hover:underline"
                            href={
                              song.trackUrl ||
                              `https://music.apple.com/search?term=${encodeURIComponent(`${song.title} ${song.artist}`)}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Apple
                          </a>
                        </div>
                      </div>

                      <button
                        title={playingId === song.id ? 'Pausar' : 'Reproducir'}
                        onClick={() => togglePreview(song)}
                        className="text-gray-500 hover:text-blue-600 p-1"
                      >
                        {playingId === song.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>

                      <button
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        onClick={() => {
                          if (!moments[activeTab]?.length) {
                            addMoment(activeTab, {
                              order: 1,
                              title: 'Nuevo momento',
                              song: `${song.title} - ${song.artist}`,
                              time: '',
                            });
                          } else {
                            const lastMoment = [...(moments[activeTab] || [])].pop();
                            if (lastMoment) {
                              updateMoment(activeTab, lastMoment.id, {
                                ...lastMoment,
                                song: `${song.title} - ${song.artist}`,
                              });
                            }
                          }
                          setResults([]);
                          stopAudio();
                        }}
                      >
                        Usar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Lista de momentos */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
              <h3
                className="font-medium"
                onDoubleClick={() => {
                  try {
                    const current = (blocks || []).find((b) => (b.id || b.key) === activeTab);
                    if (!current) return;
                    const newName = prompt('Nuevo nombre de la sección:', current.name || '');
                    if (!newName) return;
                    renameBlock(current.id || current.key, newName);
                  } catch {}
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  try {
                    if (!Array.isArray(blocks) || !blocks.length) return;
                    const idx = blocks.findIndex((b) => (b.id || b.key) === activeTab);
                    if (idx === -1) return;
                    const action = prompt('Acción: eliminar | mover-izquierda | mover-derecha');
                    if (!action) return;
                    const lower = action.trim().toLowerCase();
                    if (lower.startsWith('elimi')) {
                      if (!confirm(`Eliminar sección "${blocks[idx].name}"?`)) return;
                      const nextIdx = idx > 0 ? idx - 1 : (blocks.length > 1 ? 1 : -1);
                      removeBlock(blocks[idx].id || blocks[idx].key);
                      if (nextIdx !== -1 && blocks[nextIdx]) setActiveTab(blocks[nextIdx].id || blocks[nextIdx].key);
                    } else if (lower.includes('izq')) {
                      if (idx <= 0) return;
                      reorderBlocks(idx, idx - 1);
                    } else if (lower.includes('der')) {
                      if (idx >= blocks.length - 1) return;
                      reorderBlocks(idx, idx + 1);
                    }
                  } catch {}
                }}
                title="Doble clic para renombrar sección (clic derecho para más opciones)"
              >
                {blocks?.find((b) => (b.id || b.key) === activeTab)?.name || 'Momentos'}
              </h3>
              <Button
                onClick={handleAddMoment}
                className="py-1 px-3 text-sm flex items-center gap-1"
              >
                <Plus size={14} /> Añadir momento
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Consejo: doble clic sobre el nombre de la sección para renombrar. Clic derecho para eliminar o mover la sección. Usa â€œDup â†’â€ para duplicar un momento en otra sección y â€œMov â†’â€ para moverlo.
            </p>

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
                            onChange={(e) =>
                              updateMoment(activeTab, moment.id, {
                                ...moment,
                                title: e.target.value,
                              })
                            }
                            placeholder="TÃ­tulo del momento"
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
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    song: e.target.value,
                                  })
                                }
                                placeholder="Nombre de la Canción"
                              />
                              {/* Si pega un enlace de Spotify vÃ¡lido, mástramás el reproductor embebido */}
                              {(() => {
                                const embed = getSpotifyEmbedUrl(moment.song);
                                if (!embed) return null;
                                return (
                                  <div className="mt-2">
                                    <iframe
                                      title="Spotify Player"
                                      src={embed}
                                      width="100%"
                                      height="80"
                                      frameBorder="0"
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"
                                    />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                      Pegaste un enlace de Spotify. Se mástra un reproductor de
                                      vista previa.
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Hora</div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.time || ''}
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    time: e.target.value,
                                  })
                                }
                                placeholder="hh:mm"
                              />
                            </div>

                            <div className="w-28">
                              <div className="text-xs text-gray-500 mb-1">Duración</div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.duration || ''}
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    duration: e.target.value,
                                  })
                                }
                                placeholder="ej. 10 min"
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
                            onClick={() => duplicateMoment(activeTab, moment.id, activeTab)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => {
                              try {
                                const names = (blocks || []).map((b) => `${b.name}:::${b.id}`);
                                const choice = prompt(`Duplicar en (escribe tal cual):\n${names.map(n => '- ' + n.split(':::')[0]).join('\n')}`);
                                if (!choice) return;
                                const found = (blocks || []).find((b) => b.name === choice || `${b.name}:::${b.id}` === choice);
                                if (!found) return;
                                duplicateMoment(activeTab, moment.id, found.id);
                              } catch {}
                            }}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar en otra sección"
                          >
                            <span className="text-[11px]">Dup →</span>
                          </button>

                          <button
                            onClick={() => {
                              try {
                                const names = (blocks || []).map((b) => `${b.name}:::${b.id}`);
                                const choice = prompt(`Mover a (escribe tal cual):\n${names.map(n => '- ' + n.split(':::')[0]).join('\n')}`);
                                if (!choice) return;
                                const found = (blocks || []).find((b) => b.name === choice || `${b.name}:::${b.id}` === choice);
                                if (!found) return;
                                duplicateMoment(activeTab, moment.id, found.id);
                                removeMoment(activeTab, moment.id);
                              } catch {}
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Mover a otra sección"
                          >
                            <span className="text-[11px]">Mov →</span>
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

























