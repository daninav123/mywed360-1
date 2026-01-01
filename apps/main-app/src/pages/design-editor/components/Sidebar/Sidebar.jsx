import React, { useState } from 'react';
import {
  Layout,
  Type,
  Shapes,
  Image,
  Sparkles,
  Upload,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Square,
  Flower2,
  Palette,
  Database,
} from 'lucide-react';

import TemplatesPanel from './TemplatesPanel';
import BlocksPanel from './BlocksPanel';
import TextPanel from './TextPanel';
import ShapesPanel from './ShapesPanel';
import IllustrationsPanel from './IllustrationsPanel';
import PhotosPanel from './PhotosPanel';
import UploadsPanel from './UploadsPanel';
import SpecialElementsPanel from './SpecialElementsPanel';
import VectorElementsPanel from './VectorElementsPanel';
import FloralsPanel from './FloralsPanel';
import BackgroundsPanel from './BackgroundsPanel';

const tabs = [
  { id: 'templates', label: 'Plantillas', icon: Layout },
  { id: 'blocks', label: 'Bloques', icon: Database },
  { id: 'backgrounds', label: 'Fondos', icon: Palette },
  { id: 'florals', label: 'Florales', icon: Flower2 },
  { id: 'vectors', label: 'Vectores', icon: Sparkles },
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'shapes', label: 'Formas', icon: Shapes },
  { id: 'illustrations', label: 'Elementos', icon: ImagePlus },
  { id: 'special', label: 'Especiales', icon: FolderOpen },
  { id: 'photos', label: 'Fotos', icon: Image },
  { id: 'uploads', label: 'Subidas', icon: Upload },
];

export default function Sidebar({ onAddElement, assets, loading }) {
  const [activeTab, setActiveTab] = useState('templates');

  const renderPanel = () => {
    return (
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'templates' && <TemplatesPanel onSelect={onAddElement} />}
        {activeTab === 'blocks' && <BlocksPanel onAddElement={onAddElement} />}
        {activeTab === 'backgrounds' && <BackgroundsPanel onSetBackground={onAddElement} />}
        {activeTab === 'florals' && <FloralsPanel onAddElement={onAddElement} />}
        {activeTab === 'vectors' && <VectorElementsPanel onAddElement={onAddElement} />}
        {activeTab === 'text' && <TextPanel onAdd={onAddElement} />}
        {activeTab === 'shapes' && <ShapesPanel onAddShape={onAddElement} />}
        {activeTab === 'illustrations' && <IllustrationsPanel onAddIllustration={onAddElement} assets={assets} loading={loading} />}
        {activeTab === 'special' && <SpecialElementsPanel onAddElement={onAddElement} />}
        {activeTab === 'photos' && <PhotosPanel onAddPhoto={onAddElement} />}
        {activeTab === 'uploads' && <UploadsPanel onAddUpload={onAddElement} />}
      </div>
    );
  };

  return (
    <aside className="w-64  border-r  flex flex-col" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="flex border-b " style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">{renderPanel()}</div>
    </aside>
  );
}
