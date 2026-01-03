import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

const VariablesEditor = ({ profile, webOverrides = {}, onSave, onClose }) => {
  const { t } = useTranslations();

  const [variables, setVariables] = useState({
    nombres: '',
    fecha: '',
    ubicacion: '',
    ceremoniaLugar: '',
    ceremoniaHora: '',
    recepcionLugar: '',
    recepcionHora: '',
    historia: '',
    email: '',
    telefono: '',
    ...webOverrides,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Función para formatear fecha (igual que en DisenoWeb.jsx)
  const formatDate = (fecha) => {
    if (!fecha) return '';
    try {
      // Si es un timestamp de Firebase
      if (fecha.seconds) {
        const date = new Date(fecha.seconds * 1000);
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      // Si es un string de fecha
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
        return fecha;
      }
      return fecha.toString();
    } catch (e) {
      return fecha;
    }
  };

  // Función helper para extraer datos del perfil
  const getProfileData = () => {
    const nombresPareja =
      [profile?.brideInfo?.nombre, profile?.groomInfo?.nombre].filter(Boolean).join(' y ') || '';

    return {
      nombres: nombresPareja,
      fecha: formatDate(profile?.ceremonyInfo?.fecha),
      ubicacion: profile?.ceremonyInfo?.ciudad || profile?.ceremonyInfo?.lugar || '',
      ceremoniaLugar: profile?.ceremonyInfo?.lugar || '',
      ceremoniaHora: profile?.ceremonyInfo?.hora || '',
      recepcionLugar: profile?.receptionInfo?.lugar || '',
      recepcionHora: profile?.receptionInfo?.hora || '',
      historia: profile?.story || profile?.ourStory || '',
      email: profile?.contactEmail || '',
      telefono: profile?.contactPhone || '',
    };
  };

  useEffect(() => {
    // Cargar datos del perfil con overrides
    const profileData = getProfileData();
    setVariables({ ...profileData, ...webOverrides });
  }, [profile, webOverrides]);

  const handleChange = (key, value) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = (key) => {
    const profileData = getProfileData();
    const profileValue = profileData[key];
    setVariables((prev) => ({ ...prev, [key]: profileValue }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(variables);
    setHasChanges(false);
  };

  const variableFields = [
    { key: 'nombres', label: 'Nombres de la pareja', placeholder: 'María y Juan', icon: '👫' },
    {
      key: 'fecha',
      label: 'Fecha de la boda',
      placeholder: '15 de Junio, 2025',
      icon: '📅',
      type: 'date',
    },
    { key: 'ubicacion', label: 'Ubicación general', placeholder: 'Barcelona, España', icon: '📍' },
    {
      key: 'ceremoniaLugar',
      label: 'Lugar de ceremonia',
      placeholder: 'Iglesia de Santa María',
      icon: '⛪',
    },
    {
      key: 'ceremoniaHora',
      label: 'Hora de ceremonia',
      placeholder: '18:00',
      icon: '🕐',
      type: 'time',
    },
    {
      key: 'recepcionLugar',
      label: 'Lugar de recepción',
      placeholder: 'Hacienda Los Olivos',
      icon: '🏛️',
    },
    {
      key: 'recepcionHora',
      label: 'Hora de recepción',
      placeholder: '20:00',
      icon: '🕐',
      type: 'time',
    },
    {
      key: 'historia',
      label: 'Vuestra historia',
      placeholder: 'Nos conocimos en...',
      icon: '💕',
      multiline: true,
    },
    {
      key: 'email',
      label: 'Email de contacto',
      placeholder: 'contacto@miboda.com',
      icon: '✉️',
      type: 'email',
    },
    {
      key: 'telefono',
      label: 'Teléfono de contacto',
      placeholder: '+34 600 000 000',
      icon: '📞',
      type: 'tel',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">📝 Variables de la Web</h3>
            <p className="text-sm text-gray-600 mt-1">
              Edita los datos que aparecerán en tu web de boda
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white/50 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">
                Estos datos provienen de tu perfil
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Los cambios aquí solo afectan a la web. Para modificar tu perfil general, ve a la
                sección Perfil.
              </p>
            </div>
          </div>
        </div>

        {/* Variables Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variableFields.map((field) => (
              <div
                key={field.key}
                className={`${field.multiline ? 'md:col-span-2' : ''} bg-white border border-gray-200 rounded-lg p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="text-lg">{field.icon}</span>
                    {field.label}
                  </label>
                  <button
                    onClick={() => handleReset(field.key)}
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                    title="Restaurar del perfil"
                  >
                    <RotateCcw size={12} />
                    Restaurar
                  </button>
                </div>

                {field.multiline ? (
                  <textarea
                    value={variables[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={variables[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                )}

                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-600 font-mono">
                    {`{${field.key}}`}
                  </code>
                  <span className="text-xs text-gray-500">Usa esta variable en tu prompt</span>
                </div>
              </div>
            ))}
          </div>

          {/* Ejemplo de uso */}
          <div className="mt-6 bg-[var(--color-primary)] border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <span className="text-lg">✨</span>
              Ejemplo de uso en el prompt
            </h4>
            <div className="bg-white rounded-lg p-3 font-mono text-sm text-gray-700">
              <p>
                "Crea una web elegante para la boda de{' '}
                <code className="text-purple-600">{'{nombres}'}</code> que se celebrará el{' '}
                <code className="text-purple-600">{'{fecha}'}</code> en{' '}
                <code className="text-purple-600">{'{ubicacion}'}</code>..."
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            {hasChanges && (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Cambios sin guardar
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              Guardar Variables
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablesEditor;
