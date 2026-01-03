import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de código de vestimenta
 */
export const CraftDressCodeSection = ({
  titulo = '👔 Código de Vestimenta',
  dresscode = '',
  descripcion = '',
  coloresEvitar = 'blanco, marfil',
  mostrarSugerencias = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const dresscodeFinal = dresscode || weddingData?.codigoVestimenta?.tipo || 'Formal/Elegante';
  const descripcionFinal =
    descripcion ||
    weddingData?.codigoVestimenta?.detalles ||
    'Queremos que estés cómodo y elegante en nuestra celebración';

  const sugerenciasHombres = [
    { icono: '🤵', texto: 'Traje completo o esmoquin' },
    { icono: '👔', texto: 'Corbata o pajarita' },
    { icono: '👞', texto: 'Zapatos de vestir' },
    { icono: '⌚', texto: 'Accesorios discretos' },
  ];

  const sugerenciasMujeres = [
    { icono: '👗', texto: 'Vestido de cóctel o largo' },
    { icono: '👠', texto: 'Tacones elegantes' },
    { icono: '💍', texto: 'Joyería y accesorios' },
    { icono: '💄', texto: 'Maquillaje y peinado' },
  ];

  const coloresRecomendados = [
    { nombre: 'Azul Marino', color: '#1E3A8A', emoji: '💙' },
    { nombre: 'Borgoña', color: '#7C2D12', emoji: '❤️' },
    { nombre: 'Verde Esmeralda', color: '#047857', emoji: '💚' },
    { nombre: 'Dorado', color: '#D97706', emoji: '✨' },
    { nombre: 'Rosa', color: '#EC4899', emoji: '🌸' },
    { nombre: 'Negro', color: '#000000', emoji: '🖤' },
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
          <div className="inline-block bg-white rounded-full px-8 py-4 shadow-lg mb-4">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-secundario)' }}>
              {dresscodeFinal}
            </p>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{descripcionFinal}</p>
        </div>

        {/* Sugerencias por género */}
        {mostrarSugerencias && (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Sugerencias para hombres */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🤵</div>
                <h3
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-secundario)' }}
                >
                  Para Ellos
                </h3>
              </div>
              <div className="space-y-4">
                {sugerenciasHombres.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-2xl">{item.icono}</span>
                    <span className="font-medium text-gray-700">{item.texto}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sugerencias para mujeres */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">👗</div>
                <h3
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-secundario)' }}
                >
                  Para Ellas
                </h3>
              </div>
              <div className="space-y-4">
                {sugerenciasMujeres.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                    <span className="text-2xl">{item.icono}</span>
                    <span className="font-medium text-gray-700">{item.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Paleta de colores sugeridos */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3
            className="text-2xl font-bold text-center mb-6"
            style={{ color: 'var(--color-secundario)' }}
          >
            🎨 Paleta de Colores Sugeridos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {coloresRecomendados.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg shadow-md mb-2 flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer"
                  style={{ backgroundColor: color.color }}
                >
                  {color.emoji}
                </div>
                <p className="text-sm font-medium text-gray-700">{color.nombre}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colores a evitar */}
        {coloresEvitar && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Por favor evita estos colores</h3>
            <p className="text-red-700 font-medium">{coloresEvitar}</p>
            <p className="text-sm text-red-600 mt-2">
              Estos tonos están reservados para los novios
            </p>
          </div>
        )}

        {/* Nota adicional */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-purple-50 rounded-xl px-8 py-4 max-w-2xl">
            <p className="text-gray-700 italic">
              💡 Lo más importante es que te sientas cómodo y disfrutes de la celebración con
              nosotros
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftDressCodeSection
 */
export const CraftDressCodeSettings = () => {
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
          Código de Vestimenta (opcional)
        </label>
        <input
          type="text"
          value={props.dresscode}
          onChange={(e) => setProp((props) => (props.dresscode = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará el código configurado en "Información de la Boda"
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          value={props.descripcion}
          onChange={(e) => setProp((props) => (props.descripcion = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará la descripción configurada en "Información de la Boda"
        </p>
      </div>
    </div>
  );
};

CraftDressCodeSection.craft = {
  displayName: 'Dress Code Section',
  props: {
    titulo: '👔 Código de Vestimenta',
    dresscode: 'Formal/Elegante',
    descripcion: 'Queremos que estés cómodo y elegante en nuestra celebración',
    coloresEvitar: 'blanco, marfil',
    mostrarSugerencias: true,
  },
  related: {
    settings: CraftDressCodeSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Código de Vestimenta</h3>
        <p className="text-xs text-gray-600">
          Informa a tus invitados sobre el código de vestimenta con sugerencias visuales y paleta de
          colores.
        </p>
      </div>
    ),
  },
};
