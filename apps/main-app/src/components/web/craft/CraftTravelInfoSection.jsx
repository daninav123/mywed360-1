import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de información de viaje y alojamiento
 */
export const CraftTravelInfoSection = ({
  titulo = '✈️ Viaje y Alojamiento',
  subtitulo = '',
  autobusesTexto = '',
  hotelesTexto = '',
  mostrarTransporte = true,
  mostrarAeropuertos = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const subtituloFinal = subtitulo || 'Información para planificar tu viaje';
  const autobusesTextoFinal = autobusesTexto || weddingData?.viaje?.autobuses || '';
  const hotelesTextoFinal = hotelesTexto || weddingData?.viaje?.hoteles || '';

  const hoteles = [
    {
      nombre: 'Hotel Cinco Estrellas',
      categoria: '⭐⭐⭐⭐⭐',
      distancia: '500m del lugar',
      precio: 'Desde 150€/noche',
      icono: '🏨',
      telefono: '+34 900 000 000',
      web: 'https://ejemplo.com',
      codigo: 'BODA2025',
      descuento: '15% de descuento',
    },
    {
      nombre: 'Hotel Boutique',
      categoria: '⭐⭐⭐⭐',
      distancia: '1km del lugar',
      precio: 'Desde 100€/noche',
      icono: '🏩',
      telefono: '+34 900 000 001',
      web: 'https://ejemplo.com',
      codigo: 'WEDDING15',
      descuento: '10% de descuento',
    },
    {
      nombre: 'Apartamentos Turísticos',
      categoria: '⭐⭐⭐',
      distancia: '2km del lugar',
      precio: 'Desde 75€/noche',
      icono: '🏘️',
      telefono: '+34 900 000 002',
      web: 'https://ejemplo.com',
      codigo: 'BODA2025',
      descuento: '12% de descuento',
    },
  ];

  const aeropuertos = [
    {
      nombre: 'Aeropuerto Internacional',
      codigo: 'MAD',
      distancia: '25km',
      tiempo: '30 minutos en coche',
      icono: '✈️',
    },
    {
      nombre: 'Aeropuerto Regional',
      codigo: 'BCN',
      distancia: '15km',
      tiempo: '20 minutos en coche',
      icono: '🛬',
    },
  ];

  const transporteOpciones = [
    {
      tipo: 'Servicio Shuttle',
      icono: '🚐',
      descripcion: 'Transporte gratuito desde hoteles principales',
      horario: 'Salidas cada hora de 16:00 a 18:00',
    },
    {
      tipo: 'Taxi/Uber',
      icono: '🚕',
      descripcion: 'Disponible 24/7',
      precio: 'Aprox. 15-25€ desde hoteles cercanos',
    },
    {
      tipo: 'Transporte Público',
      icono: '🚌',
      descripcion: 'Líneas 12 y 34',
      horario: 'Parada a 200m del lugar',
    },
  ];

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
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              color: 'var(--color-primario, #9333EA)',
              fontFamily: 'var(--fuente-titulo, inherit)',
            }}
          >
            {titulo}
          </h2>
          <p className="text-xl text-gray-600">{subtituloFinal}</p>
        </div>

        {/* Hoteles personalizados */}
        {hotelesTextoFinal && (
          <div className="mb-12 bg-white rounded-xl shadow-md p-8">
            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: 'var(--color-secundario, #1F2937)' }}
            >
              🏨 Hoteles Recomendados
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{hotelesTextoFinal}</p>
          </div>
        )}

        {/* Autobuses personalizados */}
        {autobusesTextoFinal && (
          <div className="mb-12 bg-white rounded-xl shadow-md p-8">
            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: 'var(--color-secundario, #1F2937)' }}
            >
              🚌 Información de Autobuses
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {autobusesTextoFinal}
            </p>
          </div>
        )}

        {/* Hoteles recomendados (por defecto) */}
        {!hotelesTextoFinal && (
          <div className="mb-12">
            <h3
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--color-secundario, #1F2937)' }}
            >
              🏨 Hoteles Recomendados
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {hoteles.map((hotel, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">{hotel.icono}</div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">{hotel.nombre}</h4>
                    <p className="text-sm text-yellow-500">{hotel.categoria}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍</span>
                      <span>{hotel.distancia}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>💰</span>
                      <span className="font-semibold">{hotel.precio}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📞</span>
                      <span>{hotel.telefono}</span>
                    </div>
                  </div>

                  {hotel.codigo && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-800 font-semibold mb-1">{hotel.descuento}</p>
                      <p className="text-sm font-mono font-bold text-green-900">
                        Código: {hotel.codigo}
                      </p>
                    </div>
                  )}

                  <a
                    href={hotel.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full text-center px-4 py-2 bg-[var(--color-primary)]/100 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    Reservar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aeropuertos */}
        {mostrarAeropuertos && (
          <div className="mb-12">
            <h3
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--color-secundario, #1F2937)' }}
            >
              ✈️ Aeropuertos Cercanos
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {aeropuertos.map((aeropuerto, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{aeropuerto.icono}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{aeropuerto.nombre}</h4>
                      <p className="text-sm text-purple-600 font-semibold mb-3">
                        {aeropuerto.codigo}
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{aeropuerto.distancia}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span>⏱️</span>
                          <span>{aeropuerto.tiempo}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opciones de transporte */}
        {mostrarTransporte && (
          <div className="mb-12">
            <h3
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--color-secundario, #1F2937)' }}
            >
              🚗 Opciones de Transporte
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {transporteOpciones.map((opcion, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all"
                >
                  <div className="text-5xl mb-3">{opcion.icono}</div>
                  <h4 className="font-bold text-lg text-gray-900 mb-3">{opcion.tipo}</h4>
                  <p className="text-sm text-gray-600 mb-2">{opcion.descripcion}</p>
                  <p className="text-xs text-gray-500 italic">{opcion.horario || opcion.precio}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-4xl mb-3">ℹ️</div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Información Importante</h3>
            <div className="text-left space-y-3 text-blue-800">
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Recomendamos reservar con antelación, especialmente en temporada alta</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0">•</span>
                <span>
                  El servicio de shuttle saldrá desde los hoteles principales 2 horas antes del
                  evento
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Hay estacionamiento gratuito disponible en el lugar del evento</span>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            ¿Necesitas más información sobre alojamiento o transporte?
          </p>
          <a
            href="mailto:contacto@ejemplo.com"
            className="inline-block mt-4 px-6 py-3 bg-[var(--color-primary)]/100 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            📧 Contáctanos
          </a>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftTravelInfoSection
 */
export const CraftTravelInfoSettings = () => {
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Información de Autobuses (opcional)
        </label>
        <textarea
          value={props.autobusesTexto}
          onChange={(e) => setProp((props) => (props.autobusesTexto = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará la info configurada en "Información de la Boda"
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Hoteles Recomendados (opcional)
        </label>
        <textarea
          value={props.hotelesTexto}
          onChange={(e) => setProp((props) => (props.hotelesTexto = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará la info configurada en "Información de la Boda"
        </p>
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Mostrar secciones predefinidas
        </label>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mostrarTransporte"
              checked={props.mostrarTransporte}
              onChange={(e) => setProp((props) => (props.mostrarTransporte = e.target.checked))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mostrarTransporte" className="ml-2 text-sm text-gray-700">
              Mostrar opciones de transporte
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="mostrarAeropuertos"
              checked={props.mostrarAeropuertos}
              onChange={(e) => setProp((props) => (props.mostrarAeropuertos = e.target.checked))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mostrarAeropuertos" className="ml-2 text-sm text-gray-700">
              Mostrar aeropuertos cercanos
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftTravelInfoSection.craft = {
  displayName: 'Travel Info Section',
  props: {
    titulo: '✈️ Viaje y Alojamiento',
    subtitulo: 'Información para planificar tu viaje',
    autobusesTexto: '', // Vacío para usar dato de weddingData
    hotelesTexto: '', // Vacío para usar dato de weddingData
    mostrarTransporte: true,
    mostrarAeropuertos: true,
  },
  related: {
    settings: CraftTravelInfoSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Información de Viaje</h3>
        <p className="text-xs text-gray-600">
          Muestra hoteles recomendados, aeropuertos cercanos y opciones de transporte para los
          invitados.
        </p>
      </div>
    ),
  },
};
