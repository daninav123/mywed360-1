import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de lista de regalos
 */
export const CraftGiftRegistrySection = ({
  titulo = '🎁 Lista de Regalos',
  subtitulo = '',
  mensaje = '',
  mostrarOpcionEfectivo = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const subtituloFinal = subtitulo || 'Tu presencia es nuestro mejor regalo';
  const mensajeFinal =
    mensaje ||
    weddingData?.regalos?.mensajePersonalizado ||
    'Si deseas hacernos un regalo, aquí te dejamos algunas sugerencias';

  const tiendas = [
    {
      nombre: 'Amazon',
      icono: '📦',
      enlace: 'https://www.amazon.com',
      descripcion: 'Artículos para el hogar y decoración',
      color: '#FF9900',
    },
    {
      nombre: 'El Corte Inglés',
      icono: '🏬',
      enlace: 'https://www.elcorteingles.es',
      descripcion: 'Lista de bodas tradicional',
      color: '#00A859',
    },
    {
      nombre: 'Zara Home',
      icono: '🏡',
      enlace: 'https://www.zarahome.com',
      descripcion: 'Textiles y decoración',
      color: '#000000',
    },
    {
      nombre: 'Viajes El Corte Inglés',
      icono: '✈️',
      enlace: 'https://www.viajeselcorteingles.es',
      descripcion: 'Contribución para nuestra luna de miel',
      color: '#0066CC',
    },
  ];

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        backgroundColor: 'var(--color-fondo)',
        color: 'var(--color-texto)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              color: 'var(--color-primario)',
              fontFamily: 'var(--fuente-titulo, inherit)',
            }}
          >
            {titulo}
          </h2>
          <p className="text-2xl text-gray-600 mb-4 font-light italic">{subtituloFinal}</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{mensajeFinal}</p>
        </div>

        {/* Tarjetas de tiendas */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {tiendas.map((tienda, index) => (
            <a
              key={index}
              href={tienda.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {tienda.icono}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ color: tienda.color }}>
                    {tienda.nombre}
                  </h3>
                  <p className="text-gray-600 mb-3">{tienda.descripcion}</p>
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <span>Ver lista de regalos</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Opción de efectivo */}
        {mostrarOpcionEfectivo && (
          <div className="bg-[var(--color-primary)] rounded-xl shadow-md p-8 border-2 border-purple-200">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: 'var(--color-secundario)' }}
              >
                Regalo en Efectivo
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Si prefieres hacernos un regalo en efectivo, puedes depositarlo en nuestra cuenta o
                entregarlo el día de la boda. Lo usaremos para empezar nuestra nueva vida juntos.
              </p>

              <div className="bg-white rounded-lg p-6 inline-block shadow-md">
                <div className="text-left space-y-2">
                  <p className="text-sm text-gray-600">Datos bancarios:</p>
                  <p className="font-mono font-semibold text-gray-900">
                    ES00 0000 0000 0000 0000 0000
                  </p>
                  <p className="text-sm text-gray-600">Titular: [Nombre de los novios]</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje final */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-xl shadow-md px-8 py-6 max-w-2xl">
            <p className="text-gray-700 leading-relaxed">
              💝 <strong>Recuerda:</strong> Lo más importante para nosotros es compartir este día
              especial contigo. Tu presencia es el mejor regalo que podemos recibir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftGiftRegistrySection
 */
export const CraftGiftRegistrySettings = () => {
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
          Mensaje personalizado
        </label>
        <textarea
          value={props.mensaje}
          onChange={(e) => setProp((props) => (props.mensaje = e.target.value))}
          placeholder="Mensaje sobre regalos para tus invitados"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="mostrarOpcionEfectivo"
          checked={props.mostrarOpcionEfectivo}
          onChange={(e) => setProp((props) => (props.mostrarOpcionEfectivo = e.target.checked))}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="mostrarOpcionEfectivo" className="ml-2 text-sm text-gray-700">
          Mostrar opción de efectivo/cuenta bancaria
        </label>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Consejo:</strong> Las tiendas predefinidas se muestran automáticamente. Los
          enlaces y código de descuento se pueden configurar desde "Información de la Boda".
        </p>
      </div>
    </div>
  );
};

CraftGiftRegistrySection.craft = {
  displayName: 'Gift Registry Section',
  props: {
    titulo: '🎁 Lista de Regalos',
    subtitulo: 'Tu presencia es nuestro mejor regalo',
    mensaje: 'Si deseas hacernos un regalo, aquí te dejamos algunas sugerencias',
    mostrarOpcionEfectivo: true,
  },
  related: {
    settings: CraftGiftRegistrySettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Lista de Regalos</h3>
        <p className="text-xs text-gray-600">
          Muestra enlaces a tiendas donde los invitados pueden elegir regalos y opción de regalo en
          efectivo.
        </p>
      </div>
    ),
  },
};
