import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * CraftEventInfoSection - Event Info adaptado para Craft.js
 */
export const CraftEventInfoSection = ({
  ceremoniaHora,
  ceremoniaLugar,
  ceremoniaDireccion,
  recepcionHora,
  recepcionLugar,
  recepcionDireccion,
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Usar datos de la boda si no se han proporcionado props
  const ceremoniaHoraFinal = ceremoniaHora || weddingData?.ceremonia?.hora || '16:00';
  const ceremoniaLugarFinal =
    ceremoniaLugar || weddingData?.ceremonia?.lugar || 'Iglesia de San Miguel';
  const ceremoniaDireccionFinal =
    ceremoniaDireccion || weddingData?.ceremonia?.direccion || 'Calle Principal 123, Madrid';

  const recepcionHoraFinal = recepcionHora || weddingData?.recepcion?.hora || '19:00';
  const recepcionLugarFinal = recepcionLugar || weddingData?.recepcion?.lugar || 'Finca El Jardín';
  const recepcionDireccionFinal =
    recepcionDireccion || weddingData?.recepcion?.direccion || 'Carretera M-607, Km 28, Madrid';

  const EventCard = ({ titulo, hora, lugar, direccion, icon }) => (
    <div
      className="bg-white rounded-lg shadow-lg p-8 border-t-4"
      style={{ borderColor: 'var(--color-primario)' }}
    >
      <div className="text-4xl mb-4 text-center">{icon}</div>
      <h3
        className="text-2xl font-bold mb-4 text-center"
        style={{
          fontFamily: 'var(--fuente-titulo)',
          color: 'var(--color-secundario)',
        }}
      >
        {titulo}
      </h3>
      <div className="space-y-3 text-center">
        <p
          className="flex items-center justify-center"
          style={{
            fontFamily: 'var(--fuente-texto)',
            color: 'var(--color-texto)',
          }}
        >
          <span className="mr-2">🕐</span>
          <span className="font-semibold">{hora}</span>
        </p>
        <p
          className="flex items-center justify-center"
          style={{
            fontFamily: 'var(--fuente-texto)',
            color: 'var(--color-texto)',
          }}
        >
          <span className="mr-2">📍</span>
          <span className="font-semibold">{lugar}</span>
        </p>
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--fuente-texto)',
            color: 'var(--color-texto)',
          }}
        >
          {direccion}
        </p>
      </div>
    </div>
  );

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className={`
        py-16 px-4
        ${selected ? 'ring-4 ring-blue-500' : ''}
      `}
      style={{ backgroundColor: 'var(--color-fondo)' }}
    >
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-4xl font-bold mb-12 text-center"
          style={{
            fontFamily: 'var(--fuente-titulo)',
            color: 'var(--color-primario)',
          }}
        >
          📅 Información del Evento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ceremonia */}
          <EventCard
            titulo="Ceremonia"
            hora={ceremoniaHoraFinal}
            lugar={ceremoniaLugarFinal}
            direccion={ceremoniaDireccionFinal}
            icon="💒"
          />

          {/* Recepción */}
          <EventCard
            titulo="Recepción"
            hora={recepcionHoraFinal}
            lugar={recepcionLugarFinal}
            direccion={recepcionDireccionFinal}
            icon="🎉"
          />
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftEventInfoSection
 */
export const CraftEventInfoSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-6">
      {/* Ceremonia */}
      <div className="border-b pb-4">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💒</span> Ceremonia
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
            <input
              type="text"
              value={props.ceremoniaHora}
              onChange={(e) => setProp((props) => (props.ceremoniaHora = e.target.value))}
              placeholder="16:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lugar</label>
            <input
              type="text"
              value={props.ceremoniaLugar}
              onChange={(e) => setProp((props) => (props.ceremoniaLugar = e.target.value))}
              placeholder="Iglesia de San Miguel"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <textarea
              value={props.ceremoniaDireccion}
              onChange={(e) => setProp((props) => (props.ceremoniaDireccion = e.target.value))}
              rows={2}
              placeholder="Calle Principal 123, Madrid"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Recepción */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">🎉</span> Recepción
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
            <input
              type="text"
              value={props.recepcionHora}
              onChange={(e) => setProp((props) => (props.recepcionHora = e.target.value))}
              placeholder="19:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lugar</label>
            <input
              type="text"
              value={props.recepcionLugar}
              onChange={(e) => setProp((props) => (props.recepcionLugar = e.target.value))}
              placeholder="Finca El Jardín"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <textarea
              value={props.recepcionDireccion}
              onChange={(e) => setProp((props) => (props.recepcionDireccion = e.target.value))}
              rows={2}
              placeholder="Carretera M-607, Km 28, Madrid"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Configuración de Craft.js
CraftEventInfoSection.craft = {
  props: {
    ceremoniaHora: '', // Se usará dato de la boda si está vacío
    ceremoniaLugar: '',
    ceremoniaDireccion: '',
    recepcionHora: '',
    recepcionLugar: '',
    recepcionDireccion: '',
  },
  related: {
    settings: CraftEventInfoSettings,
  },
  displayName: 'Event Info Section',
};
