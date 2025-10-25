import React from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import { useWedding } from '../../context/WeddingContext';
import useWeddingCollection from '../../hooks/useWeddingCollection';
import { loadData } from '../../services/SyncService';
import { useTranslations } from '../../hooks/useTranslations';

// Plantillas predefinidas para marcadores de mesa y papelitos con nombres
const nameCardsTemplates = [
  {
  const { t } = useTranslations();

    name: 'Elegante & Minimalista',
    description: t('common.marcador_mesa_elegante_con_tipografia'),
    prompt:
      {t('common.disena_marcador_mesa_elegante_minimalista')},
  },
  {
    name: t('common.rustico_natural'),
    description: 'Marcador de mesa con elementos naturales, madera y estilo campestre',
    prompt:
      {t('common.crea_marcador_mesa_con_estilo')},
  },
  {
    name: t('common.floral_romantico'),
    description: t('common.marcador_decorado_con_flores_motivos'),
    prompt:
      {t('common.disena_marcador_mesa_con_motivos')},
  },
  {
    name: t('common.moderno_geometrico'),
    description: t('common.marcador_con_lineas_limpias_formas'),
    prompt:
      {t('common.crea_marcador_mesa_moderno_con')},
  },
  {
    name: t('common.tematico_personalizado'),
    description: t('common.marcador_tematico_que_refleja_algun'),
    prompt:
      {t('common.disena_marcador_mesa_tematico_para')},
  },
];

export default function PapelesNombres() {
  const { activeWedding } = useWedding();
  const { data: dbGuests } = useWeddingCollection('guests', activeWedding, []);
  // Obtener información de invitados si está disponible
  const getGuestsInfo = () => {
    try {
      const guests = dbGuests;

      // Si no hay suficientes invitados, devolver cadena vacía
      if (guests.length < 5) return '';

      // Seleccionar algunos invitados para incluir en el ejemplo
      const selectedGuests = guests
        .filter((g) => g.name && g.name.trim() !== '')
        .slice(0, 8)
        .map((g) => g.name);

      if (selectedGuests.length === 0) return '';

      return `Incluye ejemplos para los siguientes nombres: ${selectedGuests.join(', ')}`;
    } catch (err) {
      console.error('Error al obtener información de invitados:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Marcadores de Mesa</h1>
        <p className="text-gray-600">
          Crea elegantes marcadores con los nombres de tus invitados para identificar su lugar en la
          mesa. Selecciona un estilo o personaliza tu propio diseño.
        </p>

        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para mejores resultados, añade primero a
            tus invitados en la sección de Invitados.
          </p>
        </div>
      </Card>

      <ImageGeneratorAI
        category="place-cards"
        templates={nameCardsTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevos marcadores de mesa generados:', image);
        }}
      />
    </div>
  );
}
