import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTranslations } from '../../hooks/useTranslations';

// Temporary static templates; in real app, fetched from API or context
const templates = [
  {
  const { t } = useTranslations();

    id: 1,
    name: {t('common.clasico_dorado')},
    thumbnail: '/assets/templates/classic-gold-thumb.jpg',
    style: {t('common.clasico')},
    colors: ['#d4af37', '#ffffff'],
    fontFamily: 'Times New Roman',
    orientation: 'vertical',
  },
  {
    id: 2,
    name: 'Minimal Blanco',
    thumbnail: '/assets/templates/minimal-white-thumb.jpg',
    style: 'Minimalista',
    colors: ['#ffffff', '#000000'],
    fontFamily: 'Helvetica',
    orientation: 'vertical',
  },
  {
    id: 3,
    name: {t('common.rustico_kraft')},
    thumbnail: '/assets/templates/rustic-kraft-thumb.jpg',
    style: {t('common.rustico')},
    colors: ['#a78c6b', '#ffffff'],
    fontFamily: 'Georgia',
    orientation: 'horizontal',
  },
];

const STYLES = [{t('common.clasico')}, 'Moderno', {t('common.rustico')}, 'Minimalista'];
const ORIENTATIONS = ['vertical', 'horizontal'];

function TemplateGallery({ onSelect }) {
  const [filterStyle, setFilterStyle] = useState('');
  const [filterOrientation, setFilterOrientation] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const styleOk = filterStyle ? tpl.style === filterStyle : true;
      const orientOk = filterOrientation ? tpl.orientation === filterOrientation : true;
      const colorOk = filterColor
        ? tpl.colors.some((c) => c.toLowerCase() === filterColor.toLowerCase())
        : true;
      return styleOk && orientOk && colorOk;
    });
  }, [filterStyle, filterOrientation, filterColor]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Todos los estilos</option>
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filterOrientation}
          onChange={(e) => setFilterOrientation(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Todas las orientaciones</option>
          {ORIENTATIONS.map((o) => (
            <option key={o} value={o}>
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </option>
          ))}
        </select>

        <button
          className="px-3 py-1 rounded border bg-gray-100"
          onClick={() => setShowColorPicker((v) => !v)}
        >
          {filterColor ? (
            <span className="inline-block w-4 h-4 rounded" style={{ background: filterColor }} />
          ) : (
            'Filtrar color'
          )}
        </button>
        {showColorPicker && (
          <div className="absolute z-10 bg-white p-2 border rounded shadow">
            <HexColorPicker color={filterColor} onChange={setFilterColor} />
            <div className="flex justify-end mt-2">
              <button className="text-sm text-blue-600 mr-2" onClick={() => setFilterColor('')}>
                Limpiar
              </button>
              <button className="text-sm text-gray-600" onClick={() => setShowColorPicker(false)}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredTemplates.map((tpl) => (
          <button
            key={tpl.id}
            className="relative group border rounded overflow-hidden"
            onClick={() => onSelect(tpl)}
            aria-label={`Seleccionar plantilla ${tpl.name}`}
          >
            <img
              src={tpl.thumbnail}
              alt={`Plantilla ${tpl.name}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-semibold transition-opacity">
              Aplicar
            </div>
          </button>
        ))}
        {filteredTemplates.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No se encontraron plantillas.</p>
        )}
      </div>
    </div>
  );
}

TemplateGallery.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default TemplateGallery;
