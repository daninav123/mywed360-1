import React, { useState } from 'react';
import {
  Layout,
  Type,
  Shapes,
  Image,
  Sparkles,
  Upload,
  Flower2,
  Palette,
  Database,
  Square,
} from 'lucide-react';

import TemplatesPanel from './TemplatesPanel';
import BlocksPanel from './BlocksPanel';
import TextPanel from './TextPanel';
import ShapesPanel from './ShapesPanel';
import IllustrationsPanel from './IllustrationsPanel';
import PhotosPanel from './PhotosPanel';
import UploadsPanel from './UploadsPanel';
import FloralsPanel from './FloralsPanel';
import BackgroundsPanel from './BackgroundsPanel';
import DoubleSidedToggle from '../Canvas/DoubleSidedToggle';

export default function ContextualSidebar({ 
  designType, 
  onAddElement, 
  assets, 
  loading,
  currentSide,
  onSideChange,
  canvasSize,
  onSizeChange,
  isDoubleSided,
  onToggleDoubleSided
}) {
  const [activeTab, setActiveTab] = useState('templates');

  const getTabsForDesignType = (type) => {
    const commonTabs = [
      { id: 'text', label: 'Texto', icon: Type },
      { id: 'icons', label: 'Iconos', icon: Sparkles },
      { id: 'shapes', label: 'Formas', icon: Shapes },
      { id: 'frames', label: 'Marcos', icon: Square },
      { id: 'florals', label: 'Florales', icon: Flower2 },
      { id: 'backgrounds', label: 'Fondos', icon: Palette },
      { id: 'photos', label: 'Fotos', icon: Image },
      { id: 'uploads', label: 'Subidas', icon: Upload },
    ];

    switch (type) {
      case 'invitation':
        return [
          { id: 'templates', label: 'Plantillas', icon: Layout },
          { id: 'blocks', label: 'Bloques', icon: Database },
          ...commonTabs,
        ];
      
      case 'logo':
        return [
          { id: 'templates', label: 'Plantillas', icon: Layout },
          { id: 'shapes', label: 'Formas', icon: Shapes },
          { id: 'text', label: 'Texto', icon: Type },
          { id: 'florals', label: 'Decoración', icon: Flower2 },
          { id: 'uploads', label: 'Subidas', icon: Upload },
        ];
      
      case 'menu':
        return [
          { id: 'templates', label: 'Plantillas', icon: Layout },
          { id: 'blocks', label: 'Bloques', icon: Database },
          { id: 'text', label: 'Texto', icon: Type },
          { id: 'florals', label: 'Florales', icon: Flower2 },
          { id: 'backgrounds', label: 'Fondos', icon: Palette },
          { id: 'uploads', label: 'Subidas', icon: Upload },
        ];
      
      case 'savethedate':
      case 'program':
      case 'thankyou':
      case 'signage':
        return [
          { id: 'templates', label: 'Plantillas', icon: Layout },
          { id: 'blocks', label: 'Bloques', icon: Database },
          ...commonTabs,
        ];
      
      default:
        return [
          { id: 'templates', label: 'Plantillas', icon: Layout },
          { id: 'text', label: 'Texto', icon: Type },
          { id: 'shapes', label: 'Formas', icon: Shapes },
          { id: 'florals', label: 'Florales', icon: Flower2 },
          { id: 'backgrounds', label: 'Fondos', icon: Palette },
          { id: 'photos', label: 'Fotos', icon: Image },
          { id: 'uploads', label: 'Subidas', icon: Upload },
        ];
    }
  };

  const tabs = getTabsForDesignType(designType);

  const renderPanel = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplatesPanel onSelect={onAddElement} designType={designType} />;
      case 'blocks':
        return <BlocksPanel onAddElement={onAddElement} designType={designType} />;
      case 'backgrounds':
        return <BackgroundsPanel onSetBackground={onAddElement} />;
      case 'frames':
        return <FramesPanel onAddElement={onAddElement} />;
      case 'florals':
        return <FloralsPanel onAddElement={onAddElement} />;
      case 'text':
        return <TextPanel onAdd={onAddElement} />;
      case 'shapes':
        return <ShapesPanel onAddShape={onAddElement} />;
      case 'photos':
        return <PhotosPanel onAddPhoto={onAddElement} />;
      case 'uploads':
        return <UploadsPanel onAddUpload={onAddElement} />;
      default:
        return <div className="p-4 text-gray-500">Selecciona una pestaña</div>;
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Título contextual */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          {designType === 'invitation' && '💌 Diseño de Invitación'}
          {designType === 'logo' && '🎨 Diseño de Logo'}
          {designType === 'menu' && '🍽️ Diseño de Menú'}
          {designType === 'savethedate' && '📅 Save the Date'}
          {designType === 'program' && '📖 Programa de Ceremonia'}
          {designType === 'thankyou' && '💐 Tarjeta de Agradecimiento'}
          {designType === 'signage' && '🪧 Señalética'}
          {designType === 'other' && '✨ Diseño Libre'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Elementos para tu {designType === 'invitation' ? 'invitación' : 'diseño'}
        </p>
      </div>

      {/* Configuración de dimensiones - Para todos los tipos */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <DoubleSidedToggle
          currentSide={currentSide}
          onSideChange={onSideChange}
          canvasSize={canvasSize}
          onSizeChange={onSizeChange}
          isDoubleSided={isDoubleSided}
          onToggleDoubleSided={onToggleDoubleSided}
          designType={designType}
        />
      </div>

      {/* Tabs horizontales */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors min-w-[60px] ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de contenido */}
      <div className="flex-1 overflow-y-auto">{renderPanel()}</div>
    </aside>
  );
}
