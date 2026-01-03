import React, { useState } from 'react';
import { uploadImage } from '../../../services/imageUploadService';

/**
 * GlobalStylesPanel - Panel para personalizar estilos globales
 */
export const GlobalStylesPanel = ({ tema, onTemaChange }) => {
  const [uploadingBg, setUploadingBg] = useState(false);

  console.log('🌐 GlobalStylesPanel renderizado con tema:', tema);

  // Asegurar que tema tiene todas las propiedades necesarias
  const temaSeguro = {
    ...tema,
    colores: tema.colores || {},
    fuentes: tema.fuentes || {},
    fondo: tema.fondo || {
      tipo: 'color',
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: tema.decoraciones || {
      flores: false,
      petalos: false,
      divisores: false,
      animaciones: true,
      marcos: false,
    },
  };

  console.log('✅ temaSeguro con decoraciones:', temaSeguro.decoraciones);

  const handleColorChange = (clave, valor) => {
    onTemaChange({
      ...temaSeguro,
      colores: {
        ...temaSeguro.colores,
        [clave]: valor,
      },
    });
  };

  const handleFuenteChange = (tipo, valor) => {
    onTemaChange({
      ...temaSeguro,
      fuentes: {
        ...temaSeguro.fuentes,
        [tipo]: valor,
      },
    });
  };

  const handleBackgroundChange = (clave, valor) => {
    onTemaChange({
      ...temaSeguro,
      fondo: {
        ...temaSeguro.fondo,
        [clave]: valor,
      },
    });
  };

  const handleBackgroundImageUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingBg(true);
      const url = await uploadImage(file, 'web-backgrounds');
      handleBackgroundChange('imagen', url);
      handleBackgroundChange('tipo', 'imagen');
    } catch (error) {
      console.error('Error subiendo fondo:', error);
      alert('Error al subir la imagen de fondo');
    } finally {
      setUploadingBg(false);
    }
  };

  const fuentesDisponibles = [
    { nombre: 'Playfair Display', categoria: 'Serif elegante' },
    { nombre: 'Montserrat', categoria: 'Sans-serif moderno' },
    { nombre: 'Cormorant Garamond', categoria: 'Serif clásico' },
    { nombre: 'Open Sans', categoria: 'Sans-serif versátil' },
    { nombre: 'Lora', categoria: 'Serif legible' },
    { nombre: 'Raleway', categoria: 'Sans-serif refinado' },
    { nombre: 'Cinzel', categoria: 'Serif formal' },
    { nombre: 'Pacifico', categoria: 'Display playero' },
    { nombre: 'Quicksand', categoria: 'Sans-serif amigable' },
    { nombre: 'Libre Baskerville', categoria: 'Serif natural' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-gray-900 text-lg">🌐 Estilos Globales</h2>
        <p className="text-xs text-gray-600 mt-1">Personaliza colores y fuentes para toda tu web</p>
      </div>

      <div className="p-4 space-y-6">
        {/* COLORES */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">🎨 Paleta de Colores</h3>

          <div className="space-y-3">
            {/* Color Primario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={temaSeguro.colores.primario}
                  onChange={(e) => handleColorChange('primario', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={temaSeguro.colores.primario}
                  onChange={(e) => handleColorChange('primario', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Color Secundario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Secundario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={temaSeguro.colores.secundario}
                  onChange={(e) => handleColorChange('secundario', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={temaSeguro.colores.secundario}
                  onChange={(e) => handleColorChange('secundario', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Color Acento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Acento</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={temaSeguro.colores.acento}
                  onChange={(e) => handleColorChange('acento', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={temaSeguro.colores.acento}
                  onChange={(e) => handleColorChange('acento', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Color de Fondo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={temaSeguro.colores.fondo}
                  onChange={(e) => handleColorChange('fondo', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={temaSeguro.colores.fondo}
                  onChange={(e) => handleColorChange('fondo', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Color de Texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de Texto</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={temaSeguro.colores.texto}
                  onChange={(e) => handleColorChange('texto', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={temaSeguro.colores.texto}
                  onChange={(e) => handleColorChange('texto', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FONDO DE PÁGINA */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">🖼️ Fondo de Página</h3>

          {/* Tipo de fondo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Fondo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBackgroundChange('tipo', 'color')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  temaSeguro.fondo?.tipo === 'color' || !temaSeguro.fondo?.tipo
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                }`}
              >
                🎨 Color
              </button>
              <button
                onClick={() => handleBackgroundChange('tipo', 'imagen')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  temaSeguro.fondo?.tipo === 'imagen'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                }`}
              >
                🖼️ Imagen
              </button>
              <button
                onClick={() => handleBackgroundChange('tipo', 'gradiente')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  temaSeguro.fondo?.tipo === 'gradiente'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                }`}
              >
                🌈 Gradiente
              </button>
              <button
                onClick={() => handleBackgroundChange('tipo', 'patron')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  temaSeguro.fondo?.tipo === 'patron'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                }`}
              >
                📐 Patrón
              </button>
            </div>
          </div>

          {/* Opciones según tipo */}
          {(temaSeguro.fondo?.tipo === 'color' || !temaSeguro.fondo?.tipo) && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              ℹ️ El color de fondo se configura arriba en "Color de Fondo"
            </div>
          )}

          {/* IMAGEN */}
          {temaSeguro.fondo?.tipo === 'imagen' && (
            <div className="space-y-3">
              {/* Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Imagen de Fondo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBackgroundImageUpload(e.target.files[0])}
                  disabled={uploadingBg}
                  className="hidden"
                  id="bg-upload"
                />
                <label
                  htmlFor="bg-upload"
                  className={`block w-full px-4 py-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                    uploadingBg
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : 'border-purple-300 bg-purple-50 hover:border-purple-500'
                  }`}
                >
                  {uploadingBg ? '⏳ Subiendo...' : '📄 Click para subir imagen'}
                </label>
              </div>

              {/* URL manual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  o URL de Imagen
                </label>
                <input
                  type="url"
                  value={temaSeguro.fondo?.imagen || ''}
                  onChange={(e) => handleBackgroundChange('imagen', e.target.value)}
                  placeholder="https://ejemplo.com/fondo.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Opciones de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajuste de Imagen
                </label>
                <select
                  value={temaSeguro.fondo?.ajuste || 'cover'}
                  onChange={(e) => handleBackgroundChange('ajuste', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="cover">Cubrir (Cover)</option>
                  <option value="contain">Contener (Contain)</option>
                  <option value="auto">Tamaño original</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repetición</label>
                <select
                  value={temaSeguro.fondo?.repeticion || 'no-repeat'}
                  onChange={(e) => handleBackgroundChange('repeticion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="no-repeat">No repetir</option>
                  <option value="repeat">Repetir</option>
                  <option value="repeat-x">Repetir horizontal</option>
                  <option value="repeat-y">Repetir vertical</option>
                </select>
              </div>

              {/* Opacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacidad: {Math.round((temaSeguro.fondo?.opacidad || 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temaSeguro.fondo?.opacidad || 1}
                  onChange={(e) => handleBackgroundChange('opacidad', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* GRADIENTE */}
          {temaSeguro.fondo?.tipo === 'gradiente' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gradientes Predefinidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    nombre: 'Atardecer',
                    valor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  },
                  { nombre: 'Océano', valor: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)' },
                  { nombre: 'Rosa', valor: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)' },
                  { nombre: 'Bosque', valor: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' },
                  { nombre: 'Fuego', valor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
                  { nombre: 'Noche', valor: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
                ].map((grad) => (
                  <button
                    key={grad.nombre}
                    onClick={() => handleBackgroundChange('gradiente', grad.valor)}
                    className="h-16 rounded-lg border-2 border-gray-300 hover:border-purple-500 transition-all relative overflow-hidden"
                    style={{ background: grad.valor }}
                  >
                    <span className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-60 text-white text-xs py-1 rounded">
                      {grad.nombre}
                    </span>
                  </button>
                ))}
              </div>

              {/* CSS personalizado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSS Personalizado (Avanzado)
                </label>
                <textarea
                  value={temaSeguro.fondo?.gradiente || ''}
                  onChange={(e) => handleBackgroundChange('gradiente', e.target.value)}
                  placeholder="linear-gradient(135deg, #color1, #color2)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  rows="2"
                />
              </div>
            </div>
          )}

          {/* PATRÓN */}
          {temaSeguro.fondo?.tipo === 'patron' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patrones Disponibles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    nombre: 'Puntos',
                    url: 'data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="2" cy="2" r="1" fill="%23ddd"/%3E%3C/svg%3E',
                  },
                  {
                    nombre: 'Líneas',
                    url: 'data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 40L40 0" stroke="%23ddd" stroke-width="1"/%3E%3C/svg%3E',
                  },
                  {
                    nombre: 'Cuadrícula',
                    url: 'data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="40" height="40" fill="none" stroke="%23ddd"/%3E%3C/svg%3E',
                  },
                  {
                    nombre: 'Rombos',
                    url: 'data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="%23ddd"/%3E%3C/svg%3E',
                  },
                ].map((patron) => (
                  <button
                    key={patron.nombre}
                    onClick={() => handleBackgroundChange('patron', patron.url)}
                    className="h-16 rounded-lg border-2 border-gray-300 hover:border-purple-500 transition-all relative"
                    style={{
                      backgroundImage: `url("${patron.url}")`,
                      backgroundRepeat: 'repeat',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <span className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-60 text-white text-xs py-1 rounded">
                      {patron.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TIPOGRAFÍA */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">✍️ Tipografía</h3>

          <div className="space-y-3">
            {/* Fuente para Títulos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente para Títulos
              </label>
              <select
                value={temaSeguro.fuentes.titulo}
                onChange={(e) => handleFuenteChange('titulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                style={{ fontFamily: temaSeguro.fuentes.titulo }}
              >
                {fuentesDisponibles.map((fuente) => (
                  <option
                    key={fuente.nombre}
                    value={fuente.nombre}
                    style={{ fontFamily: fuente.nombre }}
                  >
                    {fuente.nombre} - {fuente.categoria}
                  </option>
                ))}
              </select>
              <p
                className="mt-2 text-2xl font-bold text-gray-900"
                style={{ fontFamily: temaSeguro.fuentes.titulo }}
              >
                Vista Previa del Título
              </p>
            </div>

            {/* Fuente para Texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente para Texto
              </label>
              <select
                value={temaSeguro.fuentes.texto}
                onChange={(e) => handleFuenteChange('texto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                style={{ fontFamily: temaSeguro.fuentes.texto }}
              >
                {fuentesDisponibles.map((fuente) => (
                  <option
                    key={fuente.nombre}
                    value={fuente.nombre}
                    style={{ fontFamily: fuente.nombre }}
                  >
                    {fuente.nombre} - {fuente.categoria}
                  </option>
                ))}
              </select>
              <p
                className="mt-2 text-base text-gray-700"
                style={{ fontFamily: temaSeguro.fuentes.texto }}
              >
                Vista previa del texto de párrafo. Los cambios se aplican inmediatamente a toda la
                web.
              </p>
            </div>
          </div>
        </div>

        {/* DECORACIONES */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">🌸 Decoraciones</h3>
          <p className="text-xs text-gray-600 mb-4">Añade elementos decorativos a tu web</p>

          <div className="space-y-3">
            {/* Flores en esquinas */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">🌺 Flores en esquinas</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={temaSeguro.decoraciones?.flores || false}
                onChange={(e) => {
                  console.log('🌺 Flores cambiado a:', e.target.checked);
                  onTemaChange({
                    ...temaSeguro,
                    decoraciones: {
                      ...temaSeguro.decoraciones,
                      flores: e.target.checked,
                    },
                  });
                }}
              />
            </label>

            {/* Pétalos cayendo */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">✨ Pétalos cayendo</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={temaSeguro.decoraciones?.petalos || false}
                onChange={(e) => {
                  console.log('✨ Pétalos cambiado a:', e.target.checked);
                  onTemaChange({
                    ...temaSeguro,
                    decoraciones: {
                      ...temaSeguro.decoraciones,
                      petalos: e.target.checked,
                    },
                  });
                }}
              />
            </label>

            {/* Divisores florales */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">🌿 Divisores florales</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={temaSeguro.decoraciones?.divisores || false}
                onChange={(e) =>
                  onTemaChange({
                    ...temaSeguro,
                    decoraciones: {
                      ...temaSeguro.decoraciones,
                      divisores: e.target.checked,
                    },
                  })
                }
              />
            </label>

            {/* Animaciones al scroll */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">🎬 Animaciones al scroll</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={temaSeguro.decoraciones?.animaciones || false}
                onChange={(e) =>
                  onTemaChange({
                    ...temaSeguro,
                    decoraciones: {
                      ...temaSeguro.decoraciones,
                      animaciones: e.target.checked,
                    },
                  })
                }
              />
            </label>

            {/* Marcos en fotos */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">🖼️ Marcos en fotos</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                checked={temaSeguro.decoraciones?.marcos || false}
                onChange={(e) =>
                  onTemaChange({
                    ...temaSeguro,
                    decoraciones: {
                      ...temaSeguro.decoraciones,
                      marcos: e.target.checked,
                    },
                  })
                }
              />
            </label>
          </div>

          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-700">
            <strong>💡 Tip:</strong> Las decoraciones dan un toque más elegante y romántico a tu
            web. Puedes activar/desactivar cualquiera en cualquier momento.
          </div>
        </div>

        {/* Preview combinado */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3">👀 Vista Previa</h3>
          <div
            className="rounded-lg p-6 border-2"
            style={{
              backgroundColor: temaSeguro.colores.fondo,
              borderColor: temaSeguro.colores.primario,
            }}
          >
            <h1
              className="text-3xl font-bold mb-3"
              style={{
                fontFamily: temaSeguro.fuentes.titulo,
                color: temaSeguro.colores.primario,
              }}
            >
              Título Principal
            </h1>
            <p
              className="text-base mb-2"
              style={{
                fontFamily: temaSeguro.fuentes.texto,
                color: temaSeguro.colores.texto,
              }}
            >
              Este es un ejemplo de cómo se verá el texto en tu web con la combinación de colores y
              fuentes seleccionadas.
            </p>
            <button
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                backgroundColor: temaSeguro.colores.acento,
                color: temaSeguro.colores.textoClaro,
              }}
            >
              Botón de Acción
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <strong>💡 Tip:</strong> Los cambios se aplican automáticamente a todos los componentes de
          tu web. Puedes volver a elegir un tema predefinido en cualquier momento.
        </div>
      </div>
    </div>
  );
};
