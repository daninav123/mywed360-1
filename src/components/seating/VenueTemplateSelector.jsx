import React from 'react';
import { venueTemplates } from '../../data/venueTemplates';

export default function VenueTemplateSelector({ onApply, selectedTemplateId }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Selecciona una plantilla base para ajustar el plano según el venue. Estas plantillas son editables y sirven como punto de partida.
      </p>
      <div className="space-y-3">
        {venueTemplates.map((tpl) => {
          const selected = tpl.id === selectedTemplateId;
          return (
            <div
              key={tpl.id}
              className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => onApply?.(tpl)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{tpl.name}</h4>
                <span className="text-xs text-gray-500">
                  {(tpl.hallSize.width / 100).toFixed(1)} × {(tpl.hallSize.height / 100).toFixed(1)} m
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{tpl.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                <strong>POI:</strong> {tpl.pointsOfInterest.map((p) => p.label).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
