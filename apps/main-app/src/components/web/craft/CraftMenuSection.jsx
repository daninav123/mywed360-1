import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de menú del evento
 */
export const CraftMenuSection = ({
  titulo = '🍽️ Nuestro Menú',
  subtitulo = '',
  menuTexto = '',
  mostrarCocktail = true,
  mostrarPrincipal = true,
  mostrarPostre = true,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const subtituloFinal = subtitulo || 'Una experiencia culinaria inolvidable';
  const menuTextoFinal = menuTexto || weddingData?.menu?.descripcion || '';

  const menuCocktail = [
    { nombre: 'Jamón Ibérico', descripcion: 'Cortado a mano' },
    { nombre: 'Canapés Variados', descripcion: 'Salmón, foie y queso' },
    { nombre: 'Mini Brochetas', descripcion: 'De pollo y verduras' },
    { nombre: 'Croquetas Caseras', descripcion: 'De jamón y setas' },
  ];

  const menuPrincipal = [
    {
      tipo: 'Entrante',
      platos: [
        { nombre: 'Ensalada de Burrata', descripcion: 'Con tomates cherry y albahaca' },
        { nombre: 'Carpaccio de Ternera', descripcion: 'Con rúcula y parmesano' },
      ],
    },
    {
      tipo: 'Principal',
      platos: [
        { nombre: 'Solomillo de Ternera', descripcion: 'Con reducción de Pedro Ximénez' },
        { nombre: 'Lubina a la Sal', descripcion: 'Con guarnición de verduras' },
        { nombre: 'Opción Vegetariana', descripcion: 'Risotto de setas y trufa' },
      ],
    },
  ];

  const menuPostre = [
    { nombre: 'Tarta Nupcial', descripcion: 'De chocolate y frutos rojos' },
    { nombre: 'Selección de Postres', descripcion: 'Mini tartas y macarons' },
    { nombre: 'Sorbete de Limón', descripcion: 'Refrescante y digestivo' },
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
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--color-primario)' }}
          >
            {titulo}
          </h2>
          <p className="text-xl text-gray-600">{subtituloFinal}</p>
        </div>

        {/* Menú personalizado de texto */}
        {menuTextoFinal && (
          <div className="max-w-3xl mx-auto mb-12 bg-white border-2 border-purple-100 rounded-xl p-8">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{menuTextoFinal}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cocktail */}
          {mostrarCocktail && (
            <div className="bg-white border-2 border-purple-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🥂</div>
                <h3 className="text-2xl font-bold text-gray-900">Cocktail</h3>
                <p className="text-sm text-gray-600 mt-1">Recepción</p>
              </div>
              <ul className="space-y-4">
                {menuCocktail.map((item, index) => (
                  <li key={index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="font-semibold text-gray-900">{item.nombre}</div>
                    <div className="text-sm text-gray-600">{item.descripcion}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Menú Principal */}
          {mostrarPrincipal && (
            <div className="bg-white border-2 border-purple-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🍽️</div>
                <h3 className="text-2xl font-bold text-gray-900">Banquete</h3>
                <p className="text-sm text-gray-600 mt-1">Menú degustación</p>
              </div>
              <div className="space-y-6">
                {menuPrincipal.map((seccion, index) => (
                  <div key={index}>
                    <h4 className="font-bold text-purple-600 mb-3 text-sm uppercase tracking-wide">
                      {seccion.tipo}
                    </h4>
                    <ul className="space-y-3">
                      {seccion.platos.map((plato, idx) => (
                        <li key={idx} className="text-sm">
                          <div className="font-semibold text-gray-900">{plato.nombre}</div>
                          <div className="text-xs text-gray-600">{plato.descripcion}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Postres */}
          {mostrarPostre && (
            <div className="bg-white border-2 border-purple-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🍰</div>
                <h3 className="text-2xl font-bold text-gray-900">Postres</h3>
                <p className="text-sm text-gray-600 mt-1">Dulce final</p>
              </div>
              <ul className="space-y-4">
                {menuPostre.map((item, index) => (
                  <li key={index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="font-semibold text-gray-900">{item.nombre}</div>
                    <div className="text-sm text-gray-600">{item.descripcion}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Nota sobre alergias */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-purple-50 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-700">
              🌾 Si tienes alergias o intolerancias alimentarias,
              <span className="font-semibold"> indícalo en el formulario RSVP</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftMenuSection
 */
export const CraftMenuSettings = () => {
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
          Menú personalizado (opcional)
        </label>
        <textarea
          value={props.menuTexto}
          onChange={(e) => setProp((props) => (props.menuTexto = e.target.value))}
          placeholder="Deja vacío para usar el dato del perfil o escribe el menú aquí..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará el menú configurado en "Información de la Boda"
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
              id="mostrarCocktail"
              checked={props.mostrarCocktail}
              onChange={(e) => setProp((props) => (props.mostrarCocktail = e.target.checked))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mostrarCocktail" className="ml-2 text-sm text-gray-700">
              Mostrar Cocktail
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="mostrarPrincipal"
              checked={props.mostrarPrincipal}
              onChange={(e) => setProp((props) => (props.mostrarPrincipal = e.target.checked))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mostrarPrincipal" className="ml-2 text-sm text-gray-700">
              Mostrar Plato Principal
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="mostrarPostre"
              checked={props.mostrarPostre}
              onChange={(e) => setProp((props) => (props.mostrarPostre = e.target.checked))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mostrarPostre" className="ml-2 text-sm text-gray-700">
              Mostrar Postre
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftMenuSection.craft = {
  displayName: 'Menu Section',
  props: {
    titulo: '🍽️ Nuestro Menú',
    subtitulo: 'Una experiencia culinaria inolvidable',
    menuTexto: '', // Vacío para usar dato de weddingData
    mostrarCocktail: true,
    mostrarPrincipal: true,
    mostrarPostre: true,
  },
  related: {
    settings: CraftMenuSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Sección de Menú</h3>
        <p className="text-xs text-gray-600">
          Muestra el menú del evento con opciones personalizables
        </p>
      </div>
    ),
  },
};
