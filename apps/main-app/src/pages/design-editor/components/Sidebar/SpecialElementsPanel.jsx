import React from 'react';
import { Plane, Music, Map, Camera, Heart, Star, Gift, Calendar } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

export default function SpecialElementsPanel({ onAdd }) {
  const specialElements = [
    { 
      id: 'airplane', 
      name: 'Avión', 
      icon: Plane,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 40 L160 100 L140 100 L100 80 L60 100 L40 100 Z" fill="#3498db"/><rect x="95" y="100" width="10" height="60" fill="#3498db"/><path d="M80 140 L95 140 L95 160 L80 150 Z" fill="#3498db"/><path d="M105 140 L120 140 L120 150 L105 160 Z" fill="#3498db"/></svg>'
    },
    { 
      id: 'music-note', 
      name: 'Nota Musical', 
      icon: Music,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="60" cy="150" r="25" fill="#e74c3c"/><rect x="80" y="50" width="8" height="100" fill="#e74c3c"/><circle cx="140" cy="130" r="25" fill="#e74c3c"/><rect x="143" y="40" width="8" height="90" fill="#e74c3c"/><path d="M80 50 Q120 40 151 50" stroke="#e74c3c" stroke-width="8" fill="none"/></svg>'
    },
    { 
      id: 'map-pin', 
      name: 'Ubicación', 
      icon: Map,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 30 C70 30 50 50 50 80 C50 120 100 170 100 170 C100 170 150 120 150 80 C150 50 130 30 100 30 Z" fill="#27ae60"/><circle cx="100" cy="80" r="20" fill="white"/></svg>'
    },
    { 
      id: 'camera', 
      name: 'Cámara', 
      icon: Camera,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="40" y="70" width="120" height="80" rx="10" fill="#34495e"/><circle cx="100" cy="110" r="25" fill="#ecf0f1"/><rect x="70" y="50" width="60" height="20" rx="5" fill="#34495e"/><circle cx="140" cy="85" r="8" fill="#e74c3c"/></svg>'
    },
    { 
      id: 'heart-fancy', 
      name: 'Corazón Elegante', 
      icon: Heart,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 170 C100 170 30 120 30 80 C30 50 50 30 70 30 C85 30 100 45 100 45 C100 45 115 30 130 30 C150 30 170 50 170 80 C170 120 100 170 100 170 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="3"/></svg>'
    },
    { 
      id: 'star-shine', 
      name: 'Estrella Brillante', 
      icon: Star,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 20 L115 75 L170 75 L125 110 L140 165 L100 130 L60 165 L75 110 L30 75 L85 75 Z" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/></svg>'
    },
    { 
      id: 'gift-box', 
      name: 'Regalo', 
      icon: Gift,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="50" y="80" width="100" height="80" fill="#e74c3c"/><rect x="40" y="70" width="120" height="15" fill="#c0392b"/><rect x="95" y="70" width="10" height="90" fill="#c0392b"/><path d="M100 70 Q80 40 60 50 Q50 55 60 65 L100 70" fill="#f39c12"/><path d="M100 70 Q120 40 140 50 Q150 55 140 65 L100 70" fill="#f39c12"/></svg>'
    },
    { 
      id: 'calendar-date', 
      name: 'Calendario', 
      icon: Calendar,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="30" y="50" width="140" height="120" rx="10" fill="white" stroke="#34495e" stroke-width="3"/><rect x="30" y="50" width="140" height="30" fill="#3498db"/><rect x="60" y="40" width="10" height="30" fill="#34495e"/><rect x="130" y="40" width="10" height="30" fill="#34495e"/><text x="100" y="125" text-anchor="middle" font-size="50" font-weight="bold" fill="#e74c3c">15</text></svg>'
    },
  ];

  const addElement = (element) => {
    onAdd({
      type: 'illustration',
      svgData: element.svg,
      name: element.name,
      width: 100,
      height: 100
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>Elementos Especiales</h3>
        <p className="text-xs  mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Elementos temáticos para invitaciones creativas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {specialElements.map((element) => {
          const Icon = element.icon;
          return (
            <button
              key={element.id}
              onClick={() => addElement(element)}
              className="aspect-square  rounded-lg hover: transition-all hover:ring-2 hover:ring-blue-500 p-3 flex flex-col items-center justify-center gap-1" style={{ backgroundColor: 'var(--color-bg)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              title={element.name}
            >
              <Icon className="w-8 h-8 " style={{ color: 'var(--color-text)' }} />
              <span className="text-xs  text-center" style={{ color: 'var(--color-text-secondary)' }}>{element.name}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t pt-4">
        <QRCodeGenerator onAdd={onAdd} />
      </div>

      <div className="bg-purple-50 rounded-lg p-3">
        <p className="text-xs text-purple-900 font-medium mb-2">
          ✨ Templates Creativos
        </p>
        <p className="text-xs text-purple-700">
          Busca en plantillas: "Tarjeta de Embarque", "Ticket de Concierto" o "Pasaporte del Amor" para diseños únicos
        </p>
      </div>
    </div>
  );
}
