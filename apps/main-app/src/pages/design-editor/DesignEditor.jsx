import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layers, Sparkles, Download, Save, Undo, Redo, FolderOpen, HelpCircle } from 'lucide-react';

import FabricCanvas from './components/Canvas/FabricCanvas';
import DesignTypeSelector from './components/DesignTypeSelector';
import ContextualSidebar from './components/Sidebar/ContextualSidebar';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import LayersPanel from './components/Sidebar/LayersPanel';
import AIAssistant from './components/AIAssistant/AIAssistant';
import DesignGallery from './components/DesignGallery/DesignGallery';
import QuickGuide from './components/QuickGuide/QuickGuide';
import Toolbar from './components/Canvas/CanvasToolbar';
import AlignmentTools from './components/Canvas/AlignmentTools';
import FlipTools from './components/Canvas/FlipTools';
import GroupingTools from './components/Canvas/GroupingTools';
import LayerOrderTools from './components/Canvas/LayerOrderTools';
import StyleCopyTools from './components/Canvas/StyleCopyTools';
import DoubleSidedToggle from './components/Canvas/DoubleSidedToggle';
import { useCanvas } from './hooks/useCanvas';
import { useDesignAssets } from './hooks/useDesignAssets';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getDimensionsForType, supportsDoubleSided } from './utils/designTypeDimensions';
import { loadWeddingFonts } from './utils/weddingFonts';

export default function DesignEditor() {
  // Cargar fuentes de boda al montar
  useEffect(() => {
    loadWeddingFonts();
  }, []);
  const [designType, setDesignType] = useState('invitation');
  const [selectedElement, setSelectedElement] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1050, height: 1485 });
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [currentSide, setCurrentSide] = useState('front');
  const [frontCanvasState, setFrontCanvasState] = useState(null);
  const [backCanvasState, setBackCanvasState] = useState(null);
  const canvasRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Actualizar canvas al cambiar tipo de diseño
  useEffect(() => {
    const dimensions = getDimensionsForType(designType);
    setCanvasSize(dimensions.defaultSize);
    
    // Si el nuevo tipo no soporta doble cara, desactivarlo
    if (!supportsDoubleSided(designType)) {
      setIsDoubleSided(false);
      setCurrentSide('front');
    }
  }, [designType]);

  const {
    canvasState,
    history,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDesign,
    exportDesign,
    saveToHistory,
    setCanvasRef,
  } = useCanvas();

  const { assets, loading: assetsLoading } = useDesignAssets();

  useKeyboardShortcuts(canvasRef, { onUndo: undo, onRedo: redo });

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasRef(canvasRef.current);
    }
  }, [setCanvasRef]);

  const handleElementSelect = useCallback((element) => {
    setSelectedElement(element);
  }, []);

  const handleAddElement = useCallback((element) => {
    if (canvasRef.current) {
      canvasRef.current.addElement(element);
      setTimeout(() => saveToHistory(canvasRef), 100);
    }
  }, [saveToHistory]);

  const handleSideChange = useCallback((newSide) => {
    // Guardar estado del canvas actual
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const currentState = canvas.toJSON();
      if (currentSide === 'front') {
        setFrontCanvasState(currentState);
      } else {
        setBackCanvasState(currentState);
      }
    }

    // Cambiar a la nueva cara
    setCurrentSide(newSide);

    // Cargar estado de la nueva cara
    setTimeout(() => {
      if (canvas) {
        const stateToLoad = newSide === 'front' ? frontCanvasState : backCanvasState;
        if (stateToLoad) {
          canvas.loadFromJSON(stateToLoad, () => {
            canvas.renderAll();
          });
        } else {
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          canvas.renderAll();
        }
      }
    }, 50);
  }, [currentSide, frontCanvasState, backCanvasState]);

  const handleToggleDoubleSided = useCallback((enabled) => {
    setIsDoubleSided(enabled);
    if (enabled && currentSide === 'front') {
      // Guardar estado actual como front
      const canvas = canvasRef.current?.getCanvas();
      if (canvas) {
        setFrontCanvasState(canvas.toJSON());
      }
    }
  }, [currentSide]);

  const handleSizeChange = useCallback((newSize) => {
    setCanvasSize(newSize);
    // El canvas se actualizará automáticamente por las props
  }, []);

  const handleSave = async () => {
    try {
      const canvas = canvasRef.current?.getCanvas();
      if (canvas) {
        // Guardar estado actual antes de exportar
        const currentState = canvas.toJSON();
        if (currentSide === 'front') {
          setFrontCanvasState(currentState);
        } else {
          setBackCanvasState(currentState);
        }

        // Preparar diseño completo
        const designData = {
          isDoubleSided,
          currentSide,
          canvasSize,
          front: currentSide === 'front' ? currentState : frontCanvasState,
          back: isDoubleSided ? (currentSide === 'back' ? currentState : backCanvasState) : null,
        };

        await saveDesign(designData);
        setLastSaved(new Date());
        
        // Mostrar feedback visual
        const saveBtn = document.querySelector('[data-testid="save-button"]');
        if (saveBtn) {
          const originalText = saveBtn.innerHTML;
          saveBtn.innerHTML = '<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Guardado';
          setTimeout(() => {
            saveBtn.innerHTML = originalText;
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error al guardar el diseño');
    }
  };

  useEffect(() => {
    window.__designEditorAutoSave = handleCanvasChange;
    window.__designEditorSaveHistory = () => saveToHistory(canvasRef);
    
    autoSaveTimerRef.current = setInterval(() => {
      handleSave();
    }, 30000);

    return () => {
      delete window.__designEditorAutoSave;
      delete window.__designEditorSaveHistory;
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveToHistory]);

  const handleCanvasChange = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setInterval(() => {
        handleSave();
      }, 30000);
    }
  }, [handleSave]);

  const handleExport = async (format = 'pdf') => {
    try {
      const result = await exportDesign(format, canvasRef);
      if (result.success) {
        alert(`✅ Diseño exportado: ${result.filename}`);
      } else {
        alert(`❌ Error al exportar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error exporting design:', error);
      alert(`❌ Error al exportar: ${error.message}`);
    }
  };

  const handleLoadDesign = useCallback((design) => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas && design.canvas) {
      canvas.loadFromJSON(design.canvas, () => {
        canvas.renderAll();
      });
    }
  }, []);

  const handleCanvasSizeChange = useCallback((width, height) => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.setDimensions({ width, height });
      setCanvasSize({ width, height });
      canvas.renderAll();
    }
  }, []);

  return (
    <div className="h-screen flex flex-col " style={{ backgroundColor: 'var(--color-bg)' }} data-testid="design-editor">
      <header className=" border-b  px-4 py-3 flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold " style={{ color: 'var(--color-text)' }}>Editor de Diseños</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded hover: disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--color-bg)' }}
              title="Deshacer"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded hover: disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--color-bg)' }}
              title="Rehacer"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Asistente IA
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-blue-700" style={{ backgroundColor: 'var(--color-primary)' }}
            data-testid="save-button"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          
          <button
            onClick={() => setShowGallery(true)}
            className="flex items-center gap-2 px-4 py-2 border   rounded-lg hover:" style={{ borderColor: 'var(--color-border)' }} style={{ color: 'var(--color-text)' }} style={{ backgroundColor: 'var(--color-bg)' }}
            data-testid="my-designs-button"
          >
            <FolderOpen className="w-4 h-4" />
            Mis Diseños
          </button>
          
          <div className="relative group">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-green-700" style={{ backgroundColor: 'var(--color-success)' }}
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <div className="hidden group-hover:block absolute top-full right-0 mt-2  border  rounded-lg shadow-lg p-2 min-w-[150px] z-50" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-3 py-2 text-sm hover: rounded" style={{ backgroundColor: 'var(--color-bg)' }}
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="w-full text-left px-3 py-2 text-sm hover: rounded" style={{ backgroundColor: 'var(--color-bg)' }}
              >
                🎨 SVG
              </button>
              <button
                onClick={() => handleExport('png')}
                className="w-full text-left px-3 py-2 text-sm hover: rounded" style={{ backgroundColor: 'var(--color-bg)' }}
              >
                🖼️ PNG
              </button>
            </div>
          </div>
          
          {lastSaved && (
            <div className="text-xs " style={{ color: 'var(--color-muted)' }}>
              Guardado: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 rounded hover:" style={{ backgroundColor: 'var(--color-bg)' }}
            title="Guía rápida"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Selector de tipo de diseño - Barra horizontal */}
      <DesignTypeSelector 
        selectedType={designType} 
        onSelectType={setDesignType} 
      />

      {/* Contenedor principal con 3 columnas */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar izquierdo - contextual */}
        <ContextualSidebar 
          designType={designType}
          onAddElement={handleAddElement} 
          assets={assets} 
          loading={assetsLoading}
          currentSide={currentSide}
          onSideChange={handleSideChange}
          canvasSize={canvasSize}
          onSizeChange={handleSizeChange}
          isDoubleSided={isDoubleSided}
          onToggleDoubleSided={handleToggleDoubleSided}
        />

        {/* Área central de trabajo - con scroll independiente */}
        <main className="flex-1 flex flex-col  min-w-0" style={{ backgroundColor: 'var(--color-bg)' }}>
          <Toolbar 
            canvasRef={canvasRef} 
            canvasSize={canvasSize}
            onSizeChange={handleCanvasSizeChange}
          />
          <AlignmentTools canvasRef={canvasRef} />
          <FlipTools canvasRef={canvasRef} />
          <div className="h-5 w-px bg-gray-300 mx-2" />
          <GroupingTools canvasRef={canvasRef} />
          <div className="h-5 w-px bg-gray-300 mx-2" />
          <LayerOrderTools canvasRef={canvasRef} />
          <div className="h-5 w-px bg-gray-300 mx-2" />
          <StyleCopyTools canvasRef={canvasRef} />
          <div className="flex-1 overflow-auto">
            <FabricCanvas
              ref={canvasRef}
              onElementSelect={handleElementSelect}
              initialState={canvasState}
              initialWidth={canvasSize.width}
              initialHeight={canvasSize.height}
            />
          </div>
        </main>

        {/* Panel derecho - fijo */}
        <div className="flex flex-shrink-0 overflow-y-auto">
          <PropertiesPanel selectedElement={selectedElement} canvasRef={canvasRef} />
          <div className="w-64">
            <LayersPanel canvasRef={canvasRef} />
          </div>
        </div>
      </div>

      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
          onApplyDesign={(aiDesign) => {
            console.log('AI Design:', aiDesign);
          }}
        />
      )}
      
      <DesignGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onLoadDesign={handleLoadDesign}
      />
      
      <QuickGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
