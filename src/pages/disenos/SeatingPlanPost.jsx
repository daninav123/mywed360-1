import React from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import { useWedding } from '../../context/WeddingContext';
import useWeddingCollection from '../../hooks/useWeddingCollection';
import { loadData } from '../../services/SyncService';
import { useTranslations } from '../../hooks/useTranslations';

// Plantillas predefinidas para carteles de seating plan
const seatingPlanTemplates = [
  {
  const { t } = useTranslations();

    name: t('common.elegante_clasico'),
    description: t('common.cartel_asignacion_mesas_con_diseno'),
    prompt:
      'Diseña un cartel elegante para el seating plan (asignación de mesas) de una boda. Estilo formal con tipografía serif. Incluye el título "Seating Plan" o {t('common.distribucion_mesas')} con un diseño elegante. El cartel debe tener espacio para listar nombres de invitados organizados por mesas. Usa colores neutros con toques dorados o plateados. El diseño debe ser sofisticado y fácil de leer.',
  },
  {
    name: t('common.rustico_natural'),
    description: t('common.cartel_estilo_rustico_con_elementos'),
    prompt:
      {t('common.crea_cartel_seating_plan_con')},
  },
  {
    name: 'Minimalista & Moderno',
    description: t('common.diseno_limpio_con_tipografia_sencilla'),
    prompt:
      {t('common.disena_cartel_seating_plan_minimalista')},
  },
  {
    name: t('common.tematico_creativo'),
    description: t('common.cartel_personalizado_con_tematica_especial'),
    prompt:
      {t('common.crea_cartel_seating_plan_con')},
  },
  {
    name: t('common.romantico_floral'),
    description: t('common.cartel_decorado_con_flores_motivos'),
    prompt:
      'Diseña un cartel de seating plan romántico con abundantes elementos florales para una boda. Utiliza una paleta de colores suaves como rosa, lavanda y verde salvia. Incorpora ilustraciones delicadas de flores y elementos botánicos. El título puede ser {t('common.con_carino_hemos_asignado')} o similar. Tipografía elegante y caligráfica. El diseño debe transmitir romanticismo y delicadeza, organizado de forma clara para que los invitados encuentren fácilmente su mesa.',
  },
];

export default function SeatingPlanPost() {
  // Obtener información de invitados y mesas si está disponible
  const { activeWedding } = useWedding();
  const { data: dbGuests } = useWeddingCollection('guests', activeWedding, []);

  const getSeatingInfo = () => {
    try {
      const guests = dbGuests;
      const tables = loadData('mywed360Tables', { defaultValue: [], collection: 'userTables' });

      // Si no hay datos suficientes, devolver cadena vacía
      if (!Array.isArray(guests) || guests.length === 0 || !tables.length) return '';

      // Agrupar invitados por mesa
      const guestsByTable = {};
      guests.forEach((guest) => {
        if (guest.tableId) {
          if (!guestsByTable[guest.tableId]) {
            guestsByTable[guest.tableId] = [];
          }
          guestsByTable[guest.tableId].push(guest.name);
        }
      });

      // Crear prompt con la información real
      let tableInfo = [];
      tables.forEach((table) => {
        const tableGuests = guestsByTable[table.id] || [];
        if (tableGuests.length) {
          tableInfo.push(`Mesa ${table.name || table.id}: ${tableGuests.join(', ')}`);
        }
      });

      if (!tableInfo.length) return '';

      return `Incluye las siguientes mesas con sus invitados:\n${tableInfo.join('\n')}`;
    } catch (err) {
      console.error('Error al obtener información de asientos:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño del Seating Plan</h1>
        <p className="text-gray-600">
          Crea carteles para que tus invitados encuentren su mesa asignada. Selecciona un estilo o
          personaliza tu propio diseño.
        </p>

        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para mejores resultados, primero asigna a
            tus invitados en mesas usando la página de Seating Plan.
          </p>
        </div>
      </Card>

      <ImageGeneratorAI
        category="seating-plan"
        templates={seatingPlanTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevo cartel de seating plan generado:', image);
        }}
      />
    </div>
  );
}

