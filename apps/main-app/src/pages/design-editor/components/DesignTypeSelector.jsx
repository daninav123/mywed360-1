import React from 'react';
import { Mail, Award, UtensilsCrossed, Navigation, BookOpen, Calendar, Heart, Layers } from 'lucide-react';

const designTypes = [
  {
    id: 'invitation',
    name: 'Invitación',
    icon: Mail,
    description: 'Invitaciones de boda elegantes',
    color: 'blue',
  },
  {
    id: 'logo',
    name: 'Logo',
    icon: Award,
    description: 'Logo de la boda con iniciales',
    color: 'purple',
  },
  {
    id: 'menu',
    name: 'Menú',
    icon: UtensilsCrossed,
    description: 'Menús del banquete',
    color: 'green',
  },
  {
    id: 'savethedate',
    name: 'Save the Date',
    icon: Calendar,
    description: 'Anuncio previo a la boda',
    color: 'pink',
  },
  {
    id: 'program',
    name: 'Programa',
    icon: BookOpen,
    description: 'Programa de la ceremonia',
    color: 'indigo',
  },
  {
    id: 'signage',
    name: 'Señalética',
    icon: Navigation,
    description: 'Carteles y señales',
    color: 'yellow',
  },
  {
    id: 'thankyou',
    name: 'Agradecimiento',
    icon: Heart,
    description: 'Tarjetas de agradecimiento',
    color: 'red',
  },
  {
    id: 'other',
    name: 'Otro',
    icon: Layers,
    description: 'Diseño libre',
    color: 'gray',
  },
];

export default function DesignTypeSelector({ selectedType, onSelectType }) {
  return (
    <div className="border-b  " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="flex overflow-x-auto">
        {designTypes.map((type) => {
          const Icon = type.icon;
          const isActive = selectedType === type.id;
          
          const colorClasses = {
            blue: isActive ? 'text-blue-600 bg-blue-50 border-blue-600' : 'text-gray-600 hover:bg-blue-50',
            purple: isActive ? 'text-purple-600 bg-purple-50 border-purple-600' : 'text-gray-600 hover:bg-purple-50',
            green: isActive ? 'text-green-600 bg-green-50 border-green-600' : 'text-gray-600 hover:bg-green-50',
            pink: isActive ? 'text-pink-600 bg-pink-50 border-pink-600' : 'text-gray-600 hover:bg-pink-50',
            indigo: isActive ? 'text-indigo-600 bg-indigo-50 border-indigo-600' : 'text-gray-600 hover:bg-indigo-50',
            yellow: isActive ? 'text-yellow-600 bg-yellow-50 border-yellow-600' : 'text-gray-600 hover:bg-yellow-50',
            red: isActive ? 'text-red-600 bg-red-50 border-red-600' : 'text-gray-600 hover:bg-red-50',
            gray: isActive ? 'text-gray-600 bg-gray-50 border-gray-600' : 'text-gray-600 hover:bg-gray-50',
          };

          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`
                flex-shrink-0 px-4 py-3 flex items-center gap-2 border-b-2 transition-all
                ${isActive ? 'border-b-2' : 'border-transparent'}
                ${colorClasses[type.color]}
              `}
              title={type.description}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
