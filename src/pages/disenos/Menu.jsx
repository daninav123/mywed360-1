import { useTranslations } from '../../hooks/useTranslations';
﻿import { Plus, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import { saveData, loadData } from '../../services/SyncService';

const defaultMenu = {
  const { t } = useTranslations();
 entradas: [], principales: [], postres: [], bebidas: [] };
const initialState = () => {
  try {
    return loadData('menuDesigner', {
      defaultValue: { entradas: [], principales: [], postres: [], bebidas: [] },
      collection: 'userMenus',
    });
  } catch (error) {
    console.error('Error al cargar el diseño del menú:', error);
    return { entradas: [], principales: [], postres: [], bebidas: [] };
  }
};

// Plantillas predefinidas para menús de boda
const menuTemplates = [
  {
    name: t('common.elegante_clasico'),
    description: t('common.diseno_menu_formal_con_estilo'),
    prompt:
      {t('common.disena_menu_elegante_para_una')},
  },
  {
    name: t('common.rustico_natural'),
    description: t('common.menu_con_estetica_rustica_elementos'),
    prompt:
      {t('common.crea_menu_boda_con_estetica')},
  },
  {
    name: 'Minimalista & Moderno',
    description: t('common.diseno_limpio_contemporaneo_con_espacios'),
    prompt:
      {t('common.disena_menu_minimalista_moderno_para')},
  },
  {
    name: t('common.botanico_floral'),
    description: t('common.menu_decorado_con_elementos_botanicos'),
    prompt:
      {t('common.crea_menu_boda_con_tematica')},
  },
  {
    name: t('common.vintage_romantico'),
    description: t('common.menu_con_estetica_nostalgica_detalles'),
    prompt:
      {t('common.disena_menu_boda_con_estetica')},
  },
];

export default function MenuDiseno() {
  const [menu, setMenu] = useState(defaultMenu);
  const [course, setCourse] = useState('entradas');
  const [dish, setDish] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadData('menuDesigner', {
          defaultValue: defaultMenu,
          collection: 'userMenus',
        });
        if (loaded && typeof loaded === 'object') setMenu(loaded);
      } catch (error) {
        console.error('Error al cargar el diseño del menú:', error);
      }
    })();
  }, []);

  useEffect(() => {
    saveData('menuDesigner', menu, {
      collection: 'userMenus',
      showNotification: false,
    });
  }, [menu]);

  const addDish = () => {
    if (!dish.trim()) return;
    setMenu((prev) => ({ ...prev, [course]: [...prev[course], dish.trim()] }));
    setDish('');
  };

  const removeDish = (courseKey, idx) => {
    setMenu((prev) => ({
      ...prev,
      [courseKey]: prev[courseKey].filter((_, i) => i !== idx),
    }));
  };

  // Generar un prompt personalizado basado en los datos del menú
  const generateCustomPrompt = () => {
    const menuItems = [];
    if (menu.entradas.length > 0) menuItems.push(`Entrantes: ${menu.entradas.join(', ')}`);
    if (menu.principales.length > 0)
      menuItems.push(`Platos principales: ${menu.principales.join(', ')}`);
    if (menu.postres.length > 0) menuItems.push(`Postres: ${menu.postres.join(', ')}`);
    if (menu.bebidas.length > 0) menuItems.push(`Bebidas: ${menu.bebidas.join(', ')}`);

    if (menuItems.length === 0) return '';

    return `Diseña un menú elegante para boda con los siguientes platos:\n${menuItems.join('\n')}`;
  };

  return (
    <div className="space-y-8">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño del Menú</h1>
        <div className="flex flex-col md:flex-row gap-2 md:items-end">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="entradas">Entradas</option>
            <option value="principales">Plato principal</option>
            <option value="postres">Postres</option>
            <option value="bebidas">Bebidas</option>
          </select>
          <input
            type="text"
            placeholder="Nombre del plato"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            className="flex-grow border rounded px-3 py-2"
          />
          <button
            onClick={addDish}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Plus size={16} /> Añadir
          </button>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <h2 className="text-xl font-semibold">Vista Previa</h2>
        <div className="space-y-4 text-center font-serif">
          {Object.entries(menu).map(([key, dishes]) => (
            <div key={key} className="space-y-1">
              <h3 className="text-lg font-bold capitalize">{key}</h3>
              {dishes.length === 0 && <p className="text-sm text-gray-500">Sin elementos</p>}
              {dishes.map((d, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 group">
                  <span>{d}</span>
                  <button
                    onClick={() => removeDish(key, idx)}
                    className="hidden group-hover:inline-flex text-red-600"
                    aria-label={`Eliminar ${d}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-lg font-semibold mb-2">Diseña tu menú</h2>
        <p className="text-gray-600">
          Genera diseños para tu menú utilizando IA. Los datos que has introducido arriba se
          incluirán automáticamente.
        </p>
      </div>

      <ImageGeneratorAI
        category="menu"
        templates={menuTemplates}
        customPrompt={generateCustomPrompt()}
        onImageGenerated={(image) => {
          console.log('Nuevo diseño de menú generado:', image);
        }}
      />
    </div>
  );
}
