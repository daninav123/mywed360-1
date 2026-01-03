import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Sparkles, Calendar, Users, DollarSign, MapPin, User } from 'lucide-react';
import { buildWeddingContext } from '../../services/taskPersonalizationService';

/**
 * Modal para regenerar el plan de tareas con nuevo contexto
 */
export default function RegenerateModal({ isOpen, onClose, onRegenerate, currentContext, weddingData }) {
  console.log('[RegenerateModal] 🚀 MODAL RENDERIZADO - isOpen:', isOpen, 'weddingData existe:', !!weddingData);
  
  const [formData, setFormData] = useState({
    ceremonyType: currentContext?.ceremonyType || 'civil',
    budget: currentContext?.budget || 'medium',
    leadTimeMonths: currentContext?.leadTimeMonths || 12,
    guestCount: currentContext?.guestCount || 100,
    style: currentContext?.style || 'classic',
    location: currentContext?.location || 'local',
    city: currentContext?.city || '',
    weddingDate: currentContext?.weddingDate || '',
    venueType: currentContext?.venueType || 'mixto',
    manyChildren: currentContext?.manyChildren || false,
    guestsFromOutside: currentContext?.guestsFromOutside || false,
    samePlaceCeremonyReception: currentContext?.samePlaceCeremonyReception || false,
    hasPlanner: currentContext?.hasPlanner || false,
  });

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Cargar datos SOLO cuando el modal se abre por primera vez
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  useEffect(() => {
    console.log('[RegenerateModal] 📌 useEffect - isOpen:', isOpen, 'hasLoadedInitialData:', hasLoadedInitialData);
    
    // Solo cargar datos cuando se abre el modal Y no se han cargado datos aún
    if (isOpen && !hasLoadedInitialData) {
      console.log('[RegenerateModal] 🔄 Cargando datos iniciales del modal...');
      
      // PRIORIDAD 1: Extraer de weddingData (datos reales de Info Boda)
      if (weddingData) {
        console.log('[RegenerateModal] 🔍 Extrayendo datos de Info Boda (weddingData)');
        const freshContext = buildWeddingContext(weddingData);
        console.log('[RegenerateModal] ✅ Contexto extraído de Info Boda:', freshContext);
        setFormData(freshContext);
      }
      // PRIORIDAD 2: Usar currentContext solo si no hay weddingData
      else if (currentContext && Object.keys(currentContext).length > 0) {
        console.log('[RegenerateModal] ⚠️ No hay weddingData, usando currentContext:', currentContext);
        setFormData(currentContext);
      }
      // PRIORIDAD 3: Defaults como último recurso
      else {
        console.log('[RegenerateModal] ⚠️ Sin datos, usando valores por defecto');
      }
      
      setHasLoadedInitialData(true);
    }
    
    // Reset cuando se cierra el modal
    if (!isOpen && hasLoadedInitialData) {
      console.log('[RegenerateModal] 🔄 Modal cerrado - reset hasLoadedInitialData');
      setHasLoadedInitialData(false);
    }
  }, [isOpen, currentContext, weddingData, hasLoadedInitialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[RegenerateModal] 📤 Enviando formData al handleRegenerate:', formData);
    setIsRegenerating(true);
    try {
      await onRegenerate(formData);
      onClose();
    } catch (error) {
      console.error('[RegenerateModal] ❌ Error regenerating:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  console.log('[RegenerateModal] 📊 FormData actual en render:', formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Regenerar plan con IA
              </h2>
              <p className="text-sm text-gray-600">
                Actualiza el contexto para recibir recomendaciones personalizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de ceremonia */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Tipo de ceremonia
            </label>
            <select
              value={formData.ceremonyType}
              onChange={(e) => handleChange('ceremonyType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="civil">Civil</option>
              <option value="religiosa">Religiosa</option>
              <option value="simbolica">Simbólica</option>
              <option value="destino">Destino</option>
            </select>
          </div>

          {/* Presupuesto */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              Presupuesto estimado
            </label>
            <select
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">Ajustado (€10k-€20k)</option>
              <option value="medium">Medio (€20k-€40k)</option>
              <option value="high">Alto (€40k-€70k)</option>
              <option value="luxury">Premium (€70k+)</option>
            </select>
          </div>

          {/* Lead time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Tiempo hasta la boda: {formData.leadTimeMonths} meses
            </label>
            <input
              type="range"
              min="1"
              max="36"
              value={formData.leadTimeMonths}
              onChange={(e) => handleChange('leadTimeMonths', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 mes</span>
              <span>36 meses</span>
            </div>
          </div>

          {/* Número de invitados */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              Número de invitados: {formData.guestCount}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={formData.guestCount}
              onChange={(e) => handleChange('guestCount', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span>
              <span>500</span>
            </div>
          </div>

          {/* Estilo */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Estilo de la boda
            </label>
            <input
              type="text"
              value={formData.style}
              onChange={(e) => handleChange('style', e.target.value)}
              placeholder="ej: bohemio, clásico, moderno..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Tipo de ubicación
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="local">Local (ciudad actual)</option>
              <option value="destino">Destino (otra ciudad/país)</option>
            </select>
          </div>

          {/* Ciudad/Lugar específico */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Ciudad o lugar
            </label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="ej: Valencia, Barcelona, Ibiza..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ayuda a la IA a sugerir proveedores y ajustar logística
            </p>
          </div>

          {/* Fecha de la boda */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Fecha de la boda
            </label>
            <input
              type="date"
              value={formData.weddingDate || ''}
              onChange={(e) => handleChange('weddingDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              La IA ajustará las fechas límite según el tiempo restante
            </p>
          </div>

          {/* Tipo de espacio */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tipo de espacio
            </label>
            <select
              value={formData.venueType || 'mixto'}
              onChange={(e) => handleChange('venueType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="mixto">Mixto (interior/exterior)</option>
              <option value="interior">Solo interior</option>
              <option value="exterior">Solo exterior</option>
              <option value="jardin">Jardín/Finca</option>
              <option value="playa">Playa</option>
              <option value="hotel">Hotel/Salón</option>
              <option value="restaurante">Restaurante</option>
            </select>
          </div>

          {/* Checkboxes contextuales */}
          <div className="space-y-3 bg-gray-50/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Información adicional</p>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="samePlaceCeremonyReception"
                checked={formData.samePlaceCeremonyReception}
                onChange={(e) => handleChange('samePlaceCeremonyReception', e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="samePlaceCeremonyReception" className="text-sm text-gray-700 cursor-pointer">
                Ceremonia y banquete en el mismo lugar
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="manyChildren"
                checked={formData.manyChildren}
                onChange={(e) => handleChange('manyChildren', e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="manyChildren" className="text-sm text-gray-700 cursor-pointer">
                Habrá muchos niños (afecta animación y catering)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="guestsFromOutside"
                checked={formData.guestsFromOutside}
                onChange={(e) => handleChange('guestsFromOutside', e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="guestsFromOutside" className="text-sm text-gray-700 cursor-pointer">
                Invitados de fuera (afecta transporte y alojamiento)
              </label>
            </div>
          </div>

          {/* Wedding planner */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasPlanner"
              checked={formData.hasPlanner}
              onChange={(e) => handleChange('hasPlanner', e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="hasPlanner" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <User className="w-4 h-4" />
              Tengo wedding planner profesional
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regenerar plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
