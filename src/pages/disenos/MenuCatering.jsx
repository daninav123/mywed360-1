import React, { useState } from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import { saveData, loadData } from '../../services/SyncService';
import { useTranslations } from '../../hooks/useTranslations';

// Plantillas predefinidas para menús especiales de catering
const cateringTemplates = [
  {
  const { t } = useTranslations();

    name: t('common.menu_vegetariano'),
    description: t('common.diseno_elegante_para_menus_vegetarianos'),
    prompt:
      {t('common.disena_una_tarjeta_menu_vegetariano')},
  },
  {
    name: t('common.menu_infantil'),
    description: t('common.diseno_divertido_pero_elegante_para'),
    prompt:
      {t('common.crea_diseno_menu_infantil_para')},
  },
  {
    name: t('common.menu_sin_gluten'),
    description: t('common.diseno_elegante_para_menus_sin'),
    prompt:
      {t('common.disena_una_tarjeta_menu_sin')},
  },
  {
    name: t('common.menu_sin_lacteos'),
    description: t('common.diseno_para_menus_libres_lacteos'),
    prompt:
      'Crea un diseño de menú sin lácteos para boda. El diseño debe ser elegante y refinado, en línea con la estética general de la boda. Incluye un título claro como "Menú Sin Lácteos" o {t('common.menu_libre_lacteos')}. Proporciona espacio para listar entrantes, plato principal y postre. Puedes incorporar algún elemento gráfico sutil que indique la ausencia de lácteos. La paleta de colores debe ser armoniosa con el resto de la decoración del evento.',
  },
  {
    name: t('common.menu_personalizado'),
    description: t('common.diseno_versatil_para_cualquier_necesidad'),
    prompt:
      {t('common.disena_formato_menu_personalizable_para')},
  },
];

export default function MenuCatering() {
  // Estado para los diferentes tipos de menús especiales
  const [specialMenus, setSpecialMenus] = useState(() => {
    try {
      return loadData('specialMenus', {
        defaultValue: { vegetariano: [], infantil: [], sinGluten: [], sinLacteos: [], otros: [] },
        collection: 'userSpecialMenus',
      });
    } catch (error) {
      console.error('Error al cargar menús especiales:', error);
      return { vegetariano: [], infantil: [], sinGluten: [], sinLacteos: [], otros: [] };
    }
  });

  // Generar un prompt personalizado basado en los datos del menú
  const generateCustomPrompt = () => {
    // Ejemplo: si hay menús vegetarianos definidos, incluirlos en el prompt
    const menuTypes = Object.keys(specialMenus).filter((type) => specialMenus[type].length > 0);

    if (menuTypes.length === 0) return '';

    const menuDetails = menuTypes.map((type) => {
      const items = specialMenus[type];
      const typeLabel =
        {
          vegetariano: t('common.menu_vegetariano'),
          infantil: t('common.menu_infantil'),
          sinGluten: t('common.menu_sin_gluten'),
          sinLacteos: t('common.menu_sin_lacteos'),
          otros: t('common.menu_especial'),
        }[type] || {t('common.menu_especial')};

      return `${typeLabel}: ${items.join(', ')}`;
    });

    return `Diseña un conjunto de tarjetas de menús especiales para boda con los siguientes tipos: ${menuDetails.join('. ')}. Cada tarjeta debe identificar claramente el tipo de menú especial.`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño de Menús Especiales</h1>
        <p className="text-gray-600">
          Crea tarjetas elegantes para los menús especiales de tu boda (vegetarianos, infantil, sin
          gluten, etc). Selecciona un estilo o personaliza tu propio diseño.
        </p>

        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para una experiencia completa, define
            primero los platos de cada menú especial en la sección de Menú principal.
          </p>
        </div>
      </Card>

      <ImageGeneratorAI
        category="special-menus"
        templates={cateringTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevos diseños de menús especiales generados:', image);
        }}
      />
    </div>
  );
}
