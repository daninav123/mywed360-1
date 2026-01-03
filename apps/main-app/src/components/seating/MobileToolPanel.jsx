/**
 * MobileToolPanel Component
 * Panel deslizable inferior para herramientas en móvil
 * Sprint 2 - Completar Seating Plan
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Grid,
  Users,
  Settings,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  X
} from 'lucide-react';

const PANEL_STATES = {
  CLOSED: 'closed',
  PEEK: 'peek',
  HALF: 'half',
  FULL: 'full'
};

const PANEL_HEIGHTS = {
  closed: 0,
  peek: 80,
  half: '50vh',
  full: '90vh'
};

/**
 * MobileToolPanel
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del panel
 * @param {string} props.title - Título del panel
 * @param {string} props.initialState - Estado inicial: 'closed' | 'peek' | 'half' | 'full'
 * @param {Function} props.onStateChange - Callback cuando cambia el estado
 * @param {Array} props.tabs - Array de tabs: [{ id, label, icon, content }]
 */
export function MobileToolPanel({
  children,
  title = 'Herramientas',
  initialState = PANEL_STATES.PEEK,
  onStateChange,
  tabs = []
}) {
  const [panelState, setPanelState] = useState(initialState);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleStateChange = (newState) => {
    setPanelState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  const togglePanel = () => {
    if (panelState === PANEL_STATES.CLOSED) {
      handleStateChange(PANEL_STATES.PEEK);
    } else if (panelState === PANEL_STATES.PEEK) {
      handleStateChange(PANEL_STATES.HALF);
    } else if (panelState === PANEL_STATES.HALF) {
      handleStateChange(PANEL_STATES.FULL);
    } else {
      handleStateChange(PANEL_STATES.CLOSED);
    }
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const { velocity, offset } = info;

    // Si el swipe es rápido, usar la velocidad
    if (Math.abs(velocity.y) > 500) {
      if (velocity.y < 0) {
        // Swipe up
        if (panelState === PANEL_STATES.CLOSED) {
          handleStateChange(PANEL_STATES.PEEK);
        } else if (panelState === PANEL_STATES.PEEK) {
          handleStateChange(PANEL_STATES.HALF);
        } else if (panelState === PANEL_STATES.HALF) {
          handleStateChange(PANEL_STATES.FULL);
        }
      } else {
        // Swipe down
        if (panelState === PANEL_STATES.FULL) {
          handleStateChange(PANEL_STATES.HALF);
        } else if (panelState === PANEL_STATES.HALF) {
          handleStateChange(PANEL_STATES.PEEK);
        } else if (panelState === PANEL_STATES.PEEK) {
          handleStateChange(PANEL_STATES.CLOSED);
        }
      }
    } else {
      // Usar el offset para determinar el estado
      if (offset.y < -50 && panelState !== PANEL_STATES.FULL) {
        // Expandir
        if (panelState === PANEL_STATES.CLOSED) {
          handleStateChange(PANEL_STATES.PEEK);
        } else if (panelState === PANEL_STATES.PEEK) {
          handleStateChange(PANEL_STATES.HALF);
        } else if (panelState === PANEL_STATES.HALF) {
          handleStateChange(PANEL_STATES.FULL);
        }
      } else if (offset.y > 50) {
        // Contraer
        if (panelState === PANEL_STATES.FULL) {
          handleStateChange(PANEL_STATES.HALF);
        } else if (panelState === PANEL_STATES.HALF) {
          handleStateChange(PANEL_STATES.PEEK);
        } else if (panelState === PANEL_STATES.PEEK) {
          handleStateChange(PANEL_STATES.CLOSED);
        }
      }
    }
  };

  const currentHeight = PANEL_HEIGHTS[panelState];
  const showContent = panelState !== PANEL_STATES.CLOSED;

  return (
    <>
      {/* Overlay cuando está completamente abierto */}
      <AnimatePresence>
        {panelState === PANEL_STATES.FULL && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => handleStateChange(PANEL_STATES.HALF)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{
          height: currentHeight,
          y: 0
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300
        }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 
                   rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Handle bar */}
        <div 
          className="flex-shrink-0 py-3 px-4 cursor-grab active:cursor-grabbing"
          onClick={togglePanel}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto" />
        </div>

        {/* Header */}
        {showContent && (
          <div className="flex-shrink-0 px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                {panelState === PANEL_STATES.FULL && (
                  <button
                    onClick={() => handleStateChange(PANEL_STATES.HALF)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Minimizar"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
                {(panelState === PANEL_STATES.PEEK || panelState === PANEL_STATES.HALF) && (
                  <button
                    onClick={() => handleStateChange(PANEL_STATES.FULL)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Maximizar"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleStateChange(PANEL_STATES.CLOSED)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            {tabs.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
                                transition-colors ${
                                  isActive
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {showContent && (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {tabs.length > 0 ? (
              <div className="p-4">
                {tabs.find(tab => tab.id === activeTab)?.content || children}
              </div>
            ) : (
              <div className="p-4">
                {children}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

/**
 * MobileToolPanel preconfigurado para Seating
 */
export function SeatingMobilePanel({ onAction }) {
  const tabs = [
    {
      id: 'tables',
      label: 'Mesas',
      icon: Grid,
      content: (
        <div className="space-y-4">
          <button
            onClick={() => onAction?.('add-table')}
            className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors font-medium"
          >
            + Añadir Mesa
          </button>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Tipos de Mesa</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Redonda
              </button>
              <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Rectangular
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'guests',
      label: 'Invitados',
      icon: Users,
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Buscar invitado..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Lista de invitados sin asignar aparecerá aquí
          </div>
        </div>
      )
    },
    {
      id: 'layers',
      label: 'Capas',
      icon: Layers,
      content: (
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Mostrar mesas</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Mostrar invitados</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Mostrar grid</span>
          </label>
        </div>
      )
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <button
            onClick={() => onAction?.('save')}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={() => onAction?.('reset')}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetear
          </button>
        </div>
      )
    }
  ];

  return (
    <MobileToolPanel
      title="Herramientas de Seating"
      initialState={PANEL_STATES.PEEK}
      tabs={tabs}
    />
  );
}

export default MobileToolPanel;
