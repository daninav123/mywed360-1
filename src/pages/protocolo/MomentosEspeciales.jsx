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

const TABS = [
  { key: 'ceremonia', label: 'Ceremonia' },
  { key: 'coctail', label: 'Cóctel' },
  { key: 'banquete', label: 'Banquete' },
  { key: 'disco', label: 'Disco' },
];

const MomentosEspeciales = () => {
  const { moments, addMoment, updateMoment, removeMoment, reorderMoment, duplicateMoment } =
    useSpecialMoments();

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
        // Prefijar idioma si viene vacío
        if (!aiLanguage && parsed?.languages?.length) {
          setAiLanguage(parsed.languages[0]);
        }
      }
    } catch {}
  }, []);
  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      try {
        Playback.stop();
      } catch {}
    };
  }, []);
  const [playingId, setPlayingId] = useState(null);

  // Estado de conexión con Spotify (opcional para reproducción remota)
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState({ connected: false, profile: null });

  const checkSpotifyStatus = async () => {
    try {
      setSpotifyLoading(true);
      const res = await apiPost('/api/spotify/status', {}, { auth: true });
      if (res?.ok) {
        const data = await res.json();
        setSpotifyStatus({ connected: !!data.connected, profile: data.profile || null });
      }
    } catch {
    } finally {
      setSpotifyLoading(false);
    }
  };

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  const connectSpotify = () => {
    try {
      const current = typeof window !== 'undefined' ? window.location.href : '';
      const base = import.meta?.env?.VITE_BACKEND_BASE_URL || '';
      const loginUrl = base
        ? `${base}/api/spotify/login?return=${encodeURIComponent(current)}`
        : `/api/spotify/login?return=${encodeURIComponent(current)}`;
      window.location.assign(loginUrl);
    } catch {}
  };

  // Extrae un embed URL de Spotify si el campo "canción" contiene un enlace válido
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

  // Guardar preferencias músicales en localStorage
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
  };

  // Búsqueda por nombre (iTunes)
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
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`
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
    addMoment(activeTab, {
      order: nextOrder,
      title: `Nuevo momento ${nextOrder}`,
      song: '',
      time: '',
    });
  };

  // Búsqueda con IA via backend
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
      // Idioma explícito del selector
      if (aiLanguage === 'es') prefs.push('idioma español');
      else if (aiLanguage === 'en') prefs.push('idioma inglés');
      // Si no hay género/decada en UI, usa preferencias del perfil
      if (aiTempo) prefs.push(`tempo ${aiTempo}`);
      if (aiEra) prefs.push(`década ${aiEra}`);
      if (aiGenre) prefs.push(`género ${aiGenre}`);
      if (!aiGenre && profilePrefs.genres?.length)
        prefs.push(`géneros: ${profilePrefs.genres.join(', ')}`);
      if (!aiEra && profilePrefs.decades?.length)
        prefs.push(`décadas: ${profilePrefs.decades.join(', ')}`);
      // Idiomas adicionales como pista
      const extraLangs = (profilePrefs.languages || []).filter((l) => l !== aiLanguage);
      if (extraLangs.length) prefs.push(`también considerar idiomas: ${extraLangs.join(', ')}`);
      const fullPrompt = prefs.length ? `${prompt}. Preferencias: ${prefs.join(', ')}` : prompt;
      const res = await apiPost(
        '/api/ai-songs/recommend',
        { prompt: fullPrompt, context: activeTab },
        { auth: true }
      );
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
      // Intentar enriquecer con previews de iTunes (best-effort)
      const enrich = async (song) => {
        try {
          const q = `${song.title} ${song.artist}`.trim();
          if (!q) return song;
          const resp = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`
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
        // Secuencial para evitar ráfagas innecesarias
        // Se puede mejorar con límite de concurrencia si hiciera falta
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
        {/* Conexión opcional con Spotify para reproducción remota */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Spotify</div>
              <div className="text-sm text-gray-600">
                {spotifyLoading
                  ? 'Comprobando estado...'
                  : spotifyStatus.connected
                    ? `Conectado${spotifyStatus.profile?.display_name ? ` como ${spotifyStatus.profile.display_name}` : ''}`
                    : 'Conecta tu cuenta para controlar la reproducción en tu dispositivo'}
              </div>
            </div>
            {!spotifyStatus.connected && <Button onClick={connectSpotify}>Conectar Spotify</Button>}
          </div>
        </Card>
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
              <div className="text-sm font-medium mb-1">Generos</div>
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
              <div className="text-sm font-medium mb-1">Decadas</div>
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

        {/* Tabs */}
        <div className="border-b flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`pb-2 -mb-px font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => {
                stopAudio();
                setActiveTab(tab.key);
                setResults([]);
                setSearch('');
                setAiSongs([]);
                setAiError(null);
              }}
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
                                {s.tags.join(' · ')}
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
              <h3 className="font-medium">Encuentra la canción perfecta (IA)</h3>
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
                <option value="rápido">Rápido</option>
              </select>
              <label className="text-gray-600">Década</label>
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
              <label className="text-gray-600">Género</label>
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
                <option value="clásica">Clásica</option>
                <option value="indie">Indie</option>
                <option value="r&b">R&B</option>
              </select>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe el momento: 'primer baile, balada en español'"
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
                              {[s.mood, s.tempo, s.era].filter(Boolean).join(' · ')}
                              {s.tags?.length ? ` · ${s.tags.join(' · ')}` : ''}
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
                            <span> · </span>
                            <a
                              className="hover:underline"
                              href={`https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Spotify
                            </a>
                            <span> · </span>
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

          {/* Buscador de canciones (por nombre) */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar canción por nombre..."
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

          {/* Estado búsqueda */}
          {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados búsqueda */}
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
                          <span> · </span>
                          <a
                            className="hover:underline"
                            href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Spotify
                          </a>
                          <span> · </span>
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
              <h3 className="font-medium">
                {TABS.find((t) => t.key === activeTab)?.label || 'Momentos'}
              </h3>
              <Button
                onClick={handleAddMoment}
                className="py-1 px-3 text-sm flex items-center gap-1"
              >
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
                            onChange={(e) =>
                              updateMoment(activeTab, moment.id, {
                                ...moment,
                                title: e.target.value,
                              })
                            }
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
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    song: e.target.value,
                                  })
                                }
                                placeholder="Nombre de la canción"
                              />
                              {/* Si pega un enlace de Spotify válido, mostramos el reproductor embebido */}
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
                                      Pegaste un enlace de Spotify. Se muestra un reproductor de
                                      vista previa.
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Duración</div>
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
