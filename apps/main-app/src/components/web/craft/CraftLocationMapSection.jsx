import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección con ubicación y mapa
 */
export const CraftLocationMapSection = ({
  titulo = '📍 Ubicación',
  nombreLugar = '',
  direccion = '',
  descripcion = 'Un lugar mágico para nuestra celebración',
  coordenadas = { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
  mostrarMapa = true,
  mostrarBotonMaps = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const nombreLugarFinal = nombreLugar || weddingData?.ceremonia?.lugar || 'Salón de Celebraciones';
  const direccionFinal =
    direccion || weddingData?.ceremonia?.direccion || 'Calle Principal 123, Ciudad';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordenadas.lat},${coordenadas.lng}`;
  const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.0!2d${coordenadas.lng}!3d${coordenadas.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM40CsMjAnMzQuMyJOIDPCsDQyJzEzLjQiVw!5e0!3m2!1ses!2ses!4v1234567890!5m2!1ses!2ses`;

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        backgroundColor: 'var(--color-fondo, #F9FAFB)',
        color: 'var(--color-texto, #1F2937)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--color-primario, #9333EA)' }}
          >
            {titulo}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Información del lugar */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">{nombreLugarFinal}</h3>
              <p className="text-gray-600 flex items-start gap-2">
                <span className="text-xl">📍</span>
                <span>{direccionFinal}</span>
              </p>
            </div>

            {descripcion && <p className="text-gray-700 mb-6 leading-relaxed">{descripcion}</p>}

            {/* Botones de acción */}
            <div className="space-y-3">
              {mostrarBotonMaps && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:shadow-lg transition-all font-semibold text-center"
                >
                  🗺️ Abrir en Google Maps
                </a>
              )}

              <button
                className="w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                onClick={() => alert('Función de añadir al calendario próximamente')}
              >
                📅 Añadir al Calendario
              </button>
            </div>

            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Aparcamiento</div>
                <div className="font-semibold text-gray-900">✅ Disponible</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Accesibilidad</div>
                <div className="font-semibold text-gray-900">♿ Adaptado</div>
              </div>
            </div>
          </div>

          {/* Mapa */}
          {mostrarMapa && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[400px] md:h-full">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftLocationMapSection
 */
export const CraftLocationMapSettings = () => {
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nombre del lugar (opcional)
        </label>
        <input
          type="text"
          value={props.nombreLugar}
          onChange={(e) => setProp((props) => (props.nombreLugar = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará el lugar de ceremonia del perfil
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Dirección (opcional)
        </label>
        <input
          type="text"
          value={props.direccion}
          onChange={(e) => setProp((props) => (props.direccion = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará la dirección de ceremonia del perfil
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Descripción del lugar
        </label>
        <textarea
          value={props.descripcion}
          onChange={(e) => setProp((props) => (props.descripcion = e.target.value))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Coordenadas GPS</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Latitud</label>
            <input
              type="number"
              step="0.0001"
              value={props.coordenadas?.lat || 40.4168}
              onChange={(e) =>
                setProp(
                  (props) =>
                    (props.coordenadas = { ...props.coordenadas, lat: parseFloat(e.target.value) })
                )
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Longitud</label>
            <input
              type="number"
              step="0.0001"
              value={props.coordenadas?.lng || -3.7038}
              onChange={(e) =>
                setProp(
                  (props) =>
                    (props.coordenadas = { ...props.coordenadas, lng: parseFloat(e.target.value) })
                )
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📍 Tip: Busca tu lugar en Google Maps, haz clic derecho y selecciona las coordenadas
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mostrarMapa"
            checked={props.mostrarMapa}
            onChange={(e) => setProp((props) => (props.mostrarMapa = e.target.checked))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="mostrarMapa" className="ml-2 text-sm text-gray-700">
            Mostrar mapa integrado
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="mostrarBotonMaps"
            checked={props.mostrarBotonMaps}
            onChange={(e) => setProp((props) => (props.mostrarBotonMaps = e.target.checked))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="mostrarBotonMaps" className="ml-2 text-sm text-gray-700">
            Mostrar botón "Abrir en Google Maps"
          </label>
        </div>
      </div>
    </div>
  );
};

CraftLocationMapSection.craft = {
  displayName: 'Location Map',
  props: {
    titulo: '📍 Ubicación',
    nombreLugar: 'Salón de Celebraciones',
    direccion: 'Calle Principal 123, Ciudad',
    descripcion: 'Un lugar mágico para nuestra celebración',
    coordenadas: { lat: 40.4168, lng: -3.7038 },
    mostrarMapa: true,
    mostrarBotonMaps: true,
  },
  related: {
    settings: CraftLocationMapSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Mapa de Ubicación</h3>
        <p className="text-xs text-gray-600">
          Muestra la ubicación del evento con mapa interactivo de Google Maps.
        </p>
      </div>
    ),
  },
};
