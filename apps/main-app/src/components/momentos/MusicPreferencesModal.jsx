import React, { useState, useEffect } from 'react';
import { X, Music, Heart, Calendar, Globe, Sparkles, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui';
import { useWedding } from '../../context/WeddingContext';
import { getMusicPreferences, saveMusicPreferences, DEFAULT_MUSIC_PREFERENCES } from '../../services/musicPreferencesService';

/**
 * Modal para configurar preferencias musicales del usuario
 * Personaliza las sugerencias de canciones
 */
const MusicPreferencesModal = ({ isOpen, onClose, onSave }) => {
  const { activeWedding } = useWedding();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_MUSIC_PREFERENCES);
  const [artistInput, setArtistInput] = useState('');

  useEffect(() => {
    if (isOpen && activeWedding) {
      loadPreferences();
    }
  }, [isOpen, activeWedding]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await getMusicPreferences(activeWedding);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreChange = (genre, value) => {
    setPreferences(prev => ({
      ...prev,
      favoriteGenres: {
        ...prev.favoriteGenres,
        [genre]: value,
      },
    }));
  };

  const handleDecadeToggle = (decade) => {
    setPreferences(prev => ({
      ...prev,
      favoriteDecades: {
        ...prev.favoriteDecades,
        [decade]: !prev.favoriteDecades[decade],
      },
    }));
  };

  const handleMoodToggle = (mood) => {
    setPreferences(prev => ({
      ...prev,
      preferredMoods: {
        ...prev.preferredMoods,
        [mood]: !prev.preferredMoods[mood],
      },
    }));
  };

  const handleLanguageToggle = (language) => {
    setPreferences(prev => ({
      ...prev,
      languages: {
        ...prev.languages,
        [language]: !prev.languages[language],
      },
    }));
  };

  const handleAddArtist = () => {
    const artist = artistInput.trim();
    if (artist && !preferences.favoriteArtists.includes(artist)) {
      setPreferences(prev => ({
        ...prev,
        favoriteArtists: [...prev.favoriteArtists, artist],
      }));
      setArtistInput('');
    }
  };

  const handleRemoveArtist = (artist) => {
    setPreferences(prev => ({
      ...prev,
      favoriteArtists: prev.favoriteArtists.filter(a => a !== artist),
    }));
  };

  const handleSave = async () => {
    if (!activeWedding) {
      toast.error('No hay boda activa');
      return;
    }

    setSaving(true);
    try {
      await saveMusicPreferences(activeWedding, {
        ...preferences,
        setupCompleted: true,
      });
      
      toast.success('✨ Preferencias guardadas. Las sugerencias serán más personalizadas', {
        autoClose: 3000,
      });

      if (onSave) {
        onSave(preferences);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} />
            <div>
              <h2 className="text-xl font-bold">Personaliza tus Sugerencias</h2>
              <p className="text-sm text-purple-100">Cuéntanos sobre vuestros gustos musicales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-purple-600" size={48} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Géneros */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Music className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Géneros Favoritos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Desliza para indicar cuánto os gusta cada género (0 = nada, 5 = mucho)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(preferences.favoriteGenres).map(([genre, value]) => (
                  <div key={genre} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {genre === 'hiphop' ? 'Hip Hop' : genre}
                      </label>
                      <span className="text-sm font-bold text-purple-600">{value}/5</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={value}
                      onChange={(e) => handleGenreChange(genre, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Artistas Favoritos */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="text-red-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Artistas Favoritos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Añade vuestros artistas o bandas favoritas
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArtist()}
                  placeholder="Ej: Ed Sheeran, Coldplay..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Button onClick={handleAddArtist} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Añadir
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.favoriteArtists.map((artist, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                  >
                    {artist}
                    <button
                      onClick={() => handleRemoveArtist(artist)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {preferences.favoriteArtists.length === 0 && (
                  <p className="text-sm text-gray-500">No hay artistas añadidos</p>
                )}
              </div>
            </section>

            {/* Décadas */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Décadas Preferidas</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                {Object.entries(preferences.favoriteDecades).map(([decade, selected]) => (
                  <button
                    key={decade}
                    onClick={() => handleDecadeToggle(decade)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      selected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {decade}
                  </button>
                ))}
              </div>
            </section>

            {/* Ambiente */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Ambiente Preferido</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(preferences.preferredMoods).map(([mood, selected]) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodToggle(mood)}
                    className={`px-4 py-3 rounded-lg font-medium capitalize transition-all ${
                      selected
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </section>

            {/* Idiomas */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Idiomas</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(preferences.languages).map(([language, selected]) => (
                  <button
                    key={language}
                    onClick={() => handleLanguageToggle(language)}
                    className={`px-4 py-3 rounded-lg font-medium capitalize transition-all ${
                      selected
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {language === 'spanish' ? 'Español' :
                     language === 'english' ? 'Inglés' :
                     language === 'italian' ? 'Italiano' :
                     language === 'french' ? 'Francés' : 'Otro'}
                  </button>
                ))}
              </div>
            </section>

            {/* Preferencias adicionales */}
            <section className="bg-gray-50 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.avoidExplicit}
                  onChange={(e) => setPreferences(prev => ({ ...prev, avoidExplicit: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Evitar canciones con contenido explícito
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.preferLive}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferLive: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Preferir versiones en vivo
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.preferRemixes}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferRemixes: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Incluir remixes y versiones alternativas
                </span>
              </label>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 Estas preferencias mejorarán las sugerencias de canciones
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Guardar Preferencias
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPreferencesModal;
