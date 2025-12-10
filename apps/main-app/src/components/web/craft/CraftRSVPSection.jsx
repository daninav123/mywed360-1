import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección RSVP con instrucciones para invitados
 */
export const CraftRSVPSection = ({
  titulo = '📨 Confirma tu Asistencia',
  subtitulo = '',
  instrucciones = '',
  mostrarFormularioDemo = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  // Usar datos de la boda si no se han proporcionado props
  const subtituloFinal = subtitulo || 'Tu presencia es importante para nosotros';
  const instruccionesFinal =
    instrucciones ||
    `Confirma antes del ${weddingData?.rsvp?.fechaLimite ? new Date(weddingData.rsvp.fechaLimite).toLocaleDateString('es-ES') : ''}` ||
    'Introduce tu nombre completo para confirmar';

  // Obtener el slug de la URL actual
  const getSlugFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/web\/([^/]+)/);
    return match ? match[1] : null;
  };

  const slug = getSlugFromUrl();
  const rsvpUrl = slug ? `/rsvp/${slug}` : '#';

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        backgroundColor: 'var(--color-fondo, #FFFFFF)',
        color: 'var(--color-texto, #1F2937)',
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Título */}
        <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-primario, #9333EA)' }}>
          {titulo}
        </h2>

        {/* Subtítulo */}
        <p className="text-xl text-gray-600 mb-8">{subtituloFinal}</p>

        {/* Formulario */}
        <div className="bg-purple-50 rounded-lg p-6 mb-8">
          <p className="text-gray-700 mb-4">{instruccionesFinal}</p>
          {enabled ? (
            // Modo edición: mostrar disabled
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <input
                type="text"
                placeholder="Ej: Juan García López"
                className="px-4 py-3 border-2 border-purple-300 rounded-lg text-lg w-full sm:flex-1"
                disabled
              />
              <button
                disabled
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all w-full sm:w-auto opacity-50"
              >
                Continuar
              </button>
            </div>
          ) : (
            // Vista pública: enlace funcional
            <div className="text-center">
              <a
                href={rsvpUrl}
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                ✨ Confirmar Asistencia
              </a>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-3">
            💡{' '}
            {enabled ? 'Vista previa del formulario RSVP' : 'Haz clic para confirmar tu asistencia'}
          </p>
        </div>

        {/* Info adicional */}
        {mostrarFormularioDemo && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">¿Cómo funciona?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Solo necesitas tu nombre completo. El sistema te identificará automáticamente y podrás
              confirmar tu asistencia.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-semibold text-gray-900">Confirma</div>
                <div className="text-gray-600">Tu asistencia</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">👥</div>
                <div className="font-semibold text-gray-900">Acompañantes</div>
                <div className="text-gray-600">Indica cuántos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🍽️</div>
                <div className="font-semibold text-gray-900">Menú</div>
                <div className="text-gray-600">Preferencias</div>
              </div>
            </div>
          </div>
        )}

        {/* Nota de privacidad */}
        <p className="text-xs text-gray-500 mt-6">
          🔒 Tu información está protegida y solo será utilizada para la organización del evento
        </p>
      </div>
    </section>
  );
};

/**
 * Settings para CraftRSVPSection
 */
export const CraftRSVPSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={props.titulo}
          onChange={(e) => setProp((props) => (props.titulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Subtítulo</label>
        <input
          type="text"
          value={props.subtitulo}
          onChange={(e) => setProp((props) => (props.subtitulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Instrucciones</label>
        <textarea
          value={props.instrucciones}
          onChange={(e) => setProp((props) => (props.instrucciones = e.target.value))}
          placeholder="Instrucciones para confirmar asistencia"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, mostrará la fecha límite configurada en "Información de la Boda"
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="mostrarFormularioDemo"
          checked={props.mostrarFormularioDemo}
          onChange={(e) => setProp((props) => (props.mostrarFormularioDemo = e.target.checked))}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="mostrarFormularioDemo" className="ml-2 text-sm text-gray-700">
          Mostrar formulario de ejemplo
        </label>
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Nota:</strong> En la web pública, los invitados accederán a un formulario RSVP
          funcional. Este formulario es solo para vista previa en el editor.
        </p>
      </div>
    </div>
  );
};

CraftRSVPSection.craft = {
  displayName: 'RSVP Section',
  props: {
    titulo: '📨 Confirma tu Asistencia',
    subtitulo: 'Tu presencia es importante para nosotros',
    instrucciones: 'Introduce tu nombre completo para confirmar',
    mostrarFormularioDemo: true,
  },
  related: {
    settings: CraftRSVPSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Sección RSVP</h3>
        <p className="text-xs text-gray-600">
          Permite a los invitados confirmar su asistencia introduciendo su nombre.
        </p>
      </div>
    ),
  },
};
