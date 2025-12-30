import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Canvas, IText, Rect, Circle, Image, Path } from 'fabric';
import LiveDimensions from './LiveDimensions';

const FabricCanvas = forwardRef(({ onElementSelect, initialState, initialWidth = 1050, initialHeight = 1485 }, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(0.5);
  const [liveDimensions, setLiveDimensions] = useState(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    // PASO 1: Configurar dimensiones del canvas (SIEMPRE tamaño real)
    canvasEl.width = initialWidth;
    canvasEl.height = initialHeight;
    canvasEl.style.width = `${initialWidth}px`;
    canvasEl.style.height = `${initialHeight}px`;
    canvasEl.style.display = 'block';

    console.log('🎨 Inicializando Fabric.js con:', { width: initialWidth, height: initialHeight });

    // PASO 2: Inicializar Fabric.js
    const canvas = new Canvas(canvasEl, {
      width: initialWidth,
      height: initialHeight,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      snapAngle: 15,
      snapThreshold: 10,
    });

    fabricCanvasRef.current = canvas;
    
    // Canvas siempre a tamaño real 1:1 - zoom visual con CSS transform
    setTimeout(() => {
      canvas.renderAll();
      setIsCanvasReady(true);
      console.log('✅ Fabric.js inicializado a tamaño real 1:1 - Zoom visual CSS:', currentZoom);
    }, 150);
    
    
    // Pan con Espacio + Drag o Botón Medio del Ratón
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPanning && !e.target.isContentEditable) {
        isPanning = true;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isPanning = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
      }
    };
    
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      // Botón medio (rueda) o Espacio + Click izquierdo
      if (evt.button === 1 || isPanning) {
        isPanning = true;
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        evt.preventDefault();
      }
    });
    
    canvas.on('mouse:move', (opt) => {
      if (isPanning && opt.e) {
        const vpt = canvas.viewportTransform;
        vpt[4] += opt.e.clientX - lastPosX;
        vpt[5] += opt.e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = opt.e.clientX;
        lastPosY = opt.e.clientY;
      }
    });
    
    canvas.on('mouse:up', (opt) => {
      if (isPanning && opt.e.button === 1) {
        isPanning = false;
      }
      if (isPanning) {
        canvas.defaultCursor = 'grab';
      } else {
        canvas.defaultCursor = 'default';
      }
      canvas.selection = true;
    });
    
    // Zoom con rueda del ratón (Ctrl + Scroll) - solo visual con CSS
    canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e;
      if (evt.ctrlKey || evt.metaKey) {
        evt.preventDefault();
        evt.stopPropagation();
        
        const delta = evt.deltaY;
        let zoom = currentZoom;
        zoom *= 0.999 ** delta;
        
        // Limitar zoom entre 0.1x y 5x
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;
        
        // Solo actualizar zoom visual CSS, NO Fabric interno
        setCurrentZoom(zoom);
        
        return false;
      }
    });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Atajos de teclado
    const handleKeyboard = (e) => {
      if (e.target.isContentEditable) return;
      
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        canvas.remove(activeObject);
        canvas.renderAll();
      }
      
      // Cmd/Ctrl + C - Copiar
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        activeObject.clone((cloned) => {
          window._clipboard = cloned;
        });
      }
      
      // Cmd/Ctrl + V - Pegar
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        if (window._clipboard) {
          window._clipboard.clone((cloned) => {
            cloned.set({
              left: cloned.left + 10,
              top: cloned.top + 10,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
          });
        }
      }
      
      // Cmd/Ctrl + D - Duplicar
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        activeObject.clone((cloned) => {
          cloned.set({
            left: cloned.left + 20,
            top: cloned.top + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        });
      }

      // Cmd/Ctrl + G - Agrupar
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (activeObject.type === 'activeSelection') {
          activeObject.toGroup();
          canvas.requestRenderAll();
        }
      }

      // Cmd/Ctrl + Shift + G - Desagrupar
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        if (activeObject.type === 'group') {
          activeObject.toActiveSelection();
          canvas.requestRenderAll();
        }
      }

      // Cmd/Ctrl + ] - Traer al frente
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        canvas.bringToFront(activeObject);
        canvas.renderAll();
      }

      // Cmd/Ctrl + [ - Enviar al fondo
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        canvas.sendToBack(activeObject);
        canvas.renderAll();
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    
    // Retornar cleanup
    const originalCleanup = () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
    
    // Exponer canvas globalmente para tests e2e
    if (typeof window !== 'undefined') {
      window.fabricCanvas = canvas;
    }

    canvas.on('selection:created', (e) => {
      if (onElementSelect) {
        onElementSelect(e.selected[0]);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (onElementSelect) {
        onElementSelect(e.selected[0]);
      }
    });

    canvas.on('selection:cleared', () => {
      if (onElementSelect) {
        onElementSelect(null);
      }
    });

    // Habilitar edición de texto con doble click
    canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      if (target && target.type === 'i-text') {
        target.enterEditing();
        target.selectAll();
      }
    });

    // Mostrar dimensiones en vivo al redimensionar
    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (obj) {
        const width = obj.width * obj.scaleX;
        const height = obj.height * obj.scaleY;
        const rect = canvasEl.getBoundingClientRect();
        
        setLiveDimensions({
          width,
          height,
          x: rect.left + obj.left * currentZoom,
          y: rect.top + obj.top * currentZoom,
        });
      }
    });
    
    canvas.on('object:modified', (e) => {
      setLiveDimensions(null);
      
      if (window.__designEditorAutoSave) {
        window.__designEditorAutoSave();
      }
      if (window.__designEditorSaveHistory) {
        window.__designEditorSaveHistory();
      }
    });

    canvas.on('object:added', () => {
      if (window.__designEditorAutoSave) {
        window.__designEditorAutoSave();
      }
      if (window.__designEditorSaveHistory) {
        window.__designEditorSaveHistory();
      }
    });

    canvas.on('object:removed', () => {
      if (window.__designEditorSaveHistory) {
        window.__designEditorSaveHistory();
      }
    });

    // Soporte para Drag & Drop desde el panel de vectores
    const canvasElement = canvasRef.current;
    const canvasContainer = canvasElement.parentElement;
    
    console.log('🎨 Canvas drag & drop setup:', { canvasElement, canvasContainer });
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      console.log('👆 Drag over canvas');
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎯 Drop event on canvas!', e);
      
      try {
        const jsonData = e.dataTransfer.getData('text/plain');
        console.log('📦 Received data:', jsonData);
        
        const data = JSON.parse(jsonData);
        if (data && data.path) {
          // Obtener posición del drop relativa al canvas
          const rect = canvasElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          console.log('📍 Drop position:', { x, y, clientX: e.clientX, clientY: e.clientY, rect });
          
          // Crear elemento SVG path en la posición del drop
          const shape = new Path(data.path, {
            left: x,
            top: y,
            fill: data.fill || '#000000',
            stroke: data.stroke || null,
            strokeWidth: data.strokeWidth || 0,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
          });
          
          console.log('✨ Adding shape to canvas:', shape);
          canvas.add(shape);
          canvas.setActiveObject(shape);
          canvas.renderAll();
          
          if (window.__designEditorSaveHistory) {
            window.__designEditorSaveHistory();
          }
          
          console.log('✅ Shape added successfully!');
        } else {
          console.warn('⚠️ No path data found in drop');
        }
      } catch (error) {
        console.error('❌ Error en drag & drop:', error);
      }
    };
    
    // Registrar listeners en canvas y contenedor
    canvasElement.addEventListener('dragover', handleDragOver);
    canvasElement.addEventListener('drop', handleDrop);
    canvasContainer.addEventListener('dragover', handleDragOver);
    canvasContainer.addEventListener('drop', handleDrop);
    
    console.log('✅ Drag & drop listeners registered');

    if (initialState?.objects) {
      canvas.loadFromJSON(initialState, () => {
        canvas.renderAll();
      });
    }

    return () => {
      canvas.dispose();
      canvasElement.removeEventListener('dragover', handleDragOver);
      canvasElement.removeEventListener('drop', handleDrop);
      console.log('✅ Drag & drop listeners removed');
    };
  }, [onElementSelect, initialState]);

  // Efecto separado para detectar cambios en dimensiones
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const canvasEl = canvasRef.current;
    if (!canvas || !canvasEl) return;

    console.log('📐 Redimensionando canvas:', { width: initialWidth, height: initialHeight });
    
    // Actualizar Fabric.js
    canvas.setDimensions({
      width: initialWidth,
      height: initialHeight
    });
    
    // Actualizar elemento HTML también
    canvasEl.width = initialWidth;
    canvasEl.height = initialHeight;
    canvasEl.style.width = `${initialWidth}px`;
    canvasEl.style.height = `${initialHeight}px`;
    
    canvas.renderAll();
    
    console.log('✅ Canvas redimensionado - Fabric:', canvas.width, 'x', canvas.height, 
                '| HTML:', canvasEl.width, 'x', canvasEl.height);
  }, [initialWidth, initialHeight]);

  useImperativeHandle(ref, () => ({
    addElement: (element) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) {
        console.error('❌ Canvas no disponible');
        return;
      }

      console.log('🎨 FabricCanvas.addElement llamado:', {
        type: element.type,
        canvasExists: !!canvas,
        currentObjects: canvas.getObjects().length
      });

      switch (element.type) {
        case 'template':
          if (element.template?.canvas) {
            console.log('Loading template:', element.template.name);
            canvas.clear();
            canvas.backgroundColor = element.template.canvas.backgroundColor || '#ffffff';
            
            // NO escalar - cargar plantilla a tamaño real 1:1
            const templateWidth = element.template.canvas.width || 1050;
            const templateHeight = element.template.canvas.height || 1485;
            const scaleFactor = 1; // Siempre 1:1, sin escalar
            
            console.log('📐 Cargando plantilla a tamaño real 1:1:', {
              templateSize: `${templateWidth}x${templateHeight}`,
              canvasSize: `${initialWidth}x${initialHeight}`,
              scaleFactor: 1
            });
            
            element.template.canvas.objects?.forEach((obj, index) => {
              console.log('Adding object:', index, obj.type, obj);
              
              if (obj.type === 'i-text' || obj.text) {
                const fabricObj = new IText(obj.text || 'Texto', {
                  left: (obj.left || 100) * scaleFactor,
                  top: (obj.top || 100) * scaleFactor,
                  fontSize: (obj.fontSize || 32) * scaleFactor,
                  fontFamily: obj.fontFamily || 'Arial',
                  fill: obj.fill || '#000000',
                  fontWeight: obj.fontWeight || 'normal',
                  textAlign: obj.textAlign || 'left',
                  originX: obj.originX || 'left',
                  originY: obj.originY || 'top',
                  letterSpacing: obj.letterSpacing || 0,
                  lineHeight: obj.lineHeight || 1,
                });
                canvas.add(fabricObj);
              } else if (obj.type === 'image') {
                // Cargar imagen desde URL
                import('fabric').then(({ Image: FabricImage }) => {
                  FabricImage.fromURL(obj.src, (img) => {
                    img.set({
                      left: (obj.left || 0) * scaleFactor,
                      top: (obj.top || 0) * scaleFactor,
                      scaleX: (obj.scaleX || 1) * scaleFactor,
                      scaleY: (obj.scaleY || 1) * scaleFactor,
                      opacity: obj.opacity || 1,
                      originX: obj.originX || 'left',
                      originY: obj.originY || 'top',
                    });
                    canvas.add(img);
                    canvas.renderAll();
                  }, { crossOrigin: 'anonymous' });
                });
              } else if (obj.type === 'rect') {
                const fabricObj = new Rect({
                  left: (obj.left || 100) * scaleFactor,
                  top: (obj.top || 100) * scaleFactor,
                  width: (obj.width || 200) * scaleFactor,
                  height: (obj.height || 100) * scaleFactor,
                  fill: obj.fill || '#cccccc',
                  stroke: obj.stroke,
                  strokeWidth: obj.strokeWidth ? obj.strokeWidth * scaleFactor : 0,
                });
                canvas.add(fabricObj);
              } else if (obj.type === 'circle') {
                const fabricObj = new Circle({
                  left: (obj.left || 100) * scaleFactor,
                  top: (obj.top || 100) * scaleFactor,
                  radius: (obj.radius || 50) * scaleFactor,
                  fill: obj.fill || '#cccccc',
                  stroke: obj.stroke,
                  strokeWidth: obj.strokeWidth ? obj.strokeWidth * scaleFactor : 0,
                });
                canvas.add(fabricObj);
              }
            });
            canvas.renderAll();
            console.log('✅ Plantilla cargada con', canvas.getObjects().length, 'objetos');
          }
          break;

        case 'icon':
          if (element.data?.path) {
            const pathObj = new Path(element.data.path, {
              left: canvas.width / 2 - 50,
              top: canvas.height / 2 - 50,
              fill: element.data.fill || '#000000',
              scaleX: (element.data.width || 100) / 24,
              scaleY: (element.data.height || 100) / 24,
              originX: 'center',
              originY: 'center',
            });
            canvas.add(pathObj);
            canvas.setActiveObject(pathObj);
            canvas.renderAll();
            console.log('✅ Icono añadido:', element.data.name);
          }
          break;

        case 'frame':
          if (element.data?.create) {
            console.log('🖼️ Añadiendo marco:', element.data.name);
            const frameConfig = element.data.create(canvas.width, canvas.height);
            
            if (frameConfig.objects) {
              frameConfig.objects.forEach(obj => {
                let fabricObj;
                
                if (obj.type === 'rect') {
                  fabricObj = new Rect({
                    left: obj.left,
                    top: obj.top,
                    width: obj.width,
                    height: obj.height,
                    fill: obj.fill || 'transparent',
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    rx: obj.rx || 0,
                    ry: obj.ry || 0,
                    selectable: true,
                  });
                } else if (obj.type === 'line') {
                  fabricObj = new Path(`M ${obj.x1} ${obj.y1} L ${obj.x2} ${obj.y2}`, {
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    fill: '',
                    selectable: true,
                  });
                }
                
                if (fabricObj) {
                  canvas.add(fabricObj);
                }
              });
              
              canvas.renderAll();
              console.log('✅ Marco añadido:', element.data.name);
            }
          }
          break;

        case 'text':
          const text = new IText(element.text || 'Texto', {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontSize: element.fontSize || 32,
            fontFamily: element.fontFamily || 'Arial',
            fill: element.fill || '#000000',
            originX: 'center',
            originY: 'center',
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          break;

        case 'shape':
          let shape;
          
          // Si tiene path SVG, crear un Path
          if (element.path) {
            shape = new Path(element.path, {
              left: element.left || canvas.width / 2,
              top: element.top || canvas.height / 2,
              fill: element.fill || '#000000',
              stroke: element.stroke || null,
              strokeWidth: element.strokeWidth || 0,
              scaleX: element.scaleX || 1,
              scaleY: element.scaleY || 1,
              angle: element.angle || 0,
              originX: 'center',
              originY: 'center',
            });
          } else if (element.shape === 'rectangle') {
            shape = new Rect({
              left: canvas.width / 2,
              top: canvas.height / 2,
              width: 200,
              height: 100,
              fill: element.fill || '#000000',
              originX: 'center',
              originY: 'center',
            });
          } else if (element.shape === 'circle') {
            shape = new Circle({
              left: canvas.width / 2,
              top: canvas.height / 2,
              radius: 50,
              fill: element.fill || '#000000',
              originX: 'center',
              originY: 'center',
            });
          }
          
          if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
          }
          break;

        case 'svg':
          console.log('🌸 Cargando elemento SVG floral desde:', element.url);
          console.log('🌸 Canvas tiene actualmente:', canvas.getObjects().length, 'objetos');
          import('fabric').then(async ({ loadSVGFromURL, Group }) => {
            try {
              // Fabric.js v6+ usa Promises
              console.log('🔍 Iniciando carga de SVG floral...');
              const result = await loadSVGFromURL(element.url);
              
              console.log('🔍 Resultado de loadSVGFromURL:', result);
              
              // result puede ser { objects, options } o directamente un array
              const objects = result.objects || result;
              
              console.log('✅ SVG cargado, objetos:', objects?.length);
              
              if (!objects || objects.length === 0) {
                console.error('❌ No se cargaron objetos del SVG');
                return;
              }
              
              // Crear grupo con todos los objetos
              const group = new Group(objects, {
                left: element.left || canvas.width / 2,
                top: element.top || canvas.height / 2,
                originX: 'center',
                originY: 'center',
              });
              
              console.log('✅ Grupo SVG creado con', objects.length, 'elementos');
              
              canvas.add(group);
              canvas.setActiveObject(group);
              canvas.renderAll();
              console.log('✅ SVG añadido al canvas, total objetos:', canvas.getObjects().length);
            } catch (error) {
              console.error('❌ Error cargando SVG:', error);
            }
          }).catch(err => {
            console.error('❌ Error importando fabric:', err);
          });
          break;

        case 'image':
          console.log('📸 Cargando imagen desde URL:', element.url);
          Image.fromURL(
            element.url,
            (img) => {
              console.log('✅ Imagen cargada exitosamente');
              img.set({
                left: element.left || canvas.width / 2,
                top: element.top || canvas.height / 2,
                originX: 'center',
                originY: 'center',
              });
              img.scaleToWidth(300);
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              console.log('✅ Imagen añadida al canvas, total objetos:', canvas.getObjects().length);
            },
            { crossOrigin: 'anonymous' }
          );
          break;

        case 'solid':
          console.log('🎨 Aplicando fondo sólido:', element.value);
          canvas.backgroundColor = element.value;
          canvas.renderAll();
          console.log('✅ Fondo sólido aplicado');
          break;

        case 'gradient':
          console.log('🎨 Aplicando gradiente:', element.value);
          canvas.backgroundColor = element.value;
          canvas.renderAll();
          console.log('✅ Gradiente aplicado');
          break;

        case 'background':
          console.log('🎨 Cambiando fondo a:', element.color || element.value);
          canvas.backgroundColor = element.color || element.value || '#ffffff';
          canvas.renderAll();
          console.log('✅ Fondo cambiado');
          break;

        default:
          console.warn('⚠️ Tipo de elemento no reconocido:', element.type);
          break;
      }

      canvas.renderAll();
      console.log('🎨 Renderizado completo, objetos totales:', canvas.getObjects().length);
    },

    deleteSelected: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
      }
    },

    getJSON: () => {
      const canvas = fabricCanvasRef.current;
      return canvas ? canvas.toJSON() : null;
    },

    loadJSON: (json) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
      });
    },

    exportToPNG: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 3,
      });
    },

    exportToSVG: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      return canvas.toSVG();
    },

    setZoom: (zoomLevel) => {
      const canvas = fabricCanvasRef.current;
      const canvasEl = canvasRef.current;
      if (!canvas || !canvasEl) return;
      
      // Obtener centro del viewport
      const center = canvas.getVpCenter();
      
      // Aplicar zoom desde el centro
      canvas.zoomToPoint(center, zoomLevel);
      
      // Actualizar estado de zoom para que el contenedor visual también cambie
      setCurrentZoom(zoomLevel);
      
      console.log('🔍 Zoom aplicado:', zoomLevel, 'x - Dimensiones visuales:', initialWidth * zoomLevel, 'x', initialHeight * zoomLevel);
      canvas.requestRenderAll();
    },

    getCanvas: () => fabricCanvasRef.current,
  }));

  return (
    <>
      <LiveDimensions dimensions={liveDimensions} position={liveDimensions} />
      
      <div className="flex items-center justify-center h-full bg-gray-200 p-8 overflow-auto">
        <div 
          ref={containerRef}
          className="relative" 
          style={{ 
            flexShrink: 0,
            width: `${initialWidth * currentZoom}px`,
            height: `${initialHeight * currentZoom}px`,
            opacity: isCanvasReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in',
          }}>
          {/* Indicador de dimensiones */}
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-mono">
              {initialWidth} × {initialHeight} px
            </span>
          </div>

        {/* Canvas con borde, sombra - zoom con CSS transform */}
        <div 
          className="bg-white shadow-2xl relative origin-top-left"
          style={{
            border: '3px solid #3b82f6',
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            width: `${initialWidth}px`,
            height: `${initialHeight}px`,
            transform: `scale(${currentZoom})`,
            transformOrigin: 'top left',
          }}
        >
          <canvas
            ref={canvasRef}
            width={initialWidth}
            height={initialHeight}
            style={{
              display: 'block',
              width: `${initialWidth}px`,
              height: `${initialHeight}px`,
              margin: 0,
              padding: 0,
            }}
          />
          
          {/* Esquinas decorativas */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-600" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-600" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-600" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-600" />
        </div>

        {/* Indicador inferior con formato */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="inline-block bg-gray-700 text-white text-xs px-3 py-1 rounded-full">
            {Math.round(initialWidth / 7.09)} × {Math.round(initialHeight / 7.09)} mm
          </span>
        </div>
      </div>
    </div>
    </>
  );
});

FabricCanvas.displayName = 'FabricCanvas';

export default FabricCanvas;
