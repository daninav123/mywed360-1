import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import '../styles/craft-canvas-background.css';
import { Toolbox } from '../components/web/craft/Toolbox';
import { SettingsPanel } from '../components/web/craft/SettingsPanel';
import { CraftHeroSection } from '../components/web/craft/CraftHeroSection';
import { CraftStorySection } from '../components/web/craft/CraftStorySection';
import { CraftEventInfoSection } from '../components/web/craft/CraftEventInfoSection';
import { CraftPhotoGallerySection } from '../components/web/craft/CraftPhotoGallerySection';
import { CraftRSVPSection } from '../components/web/craft/CraftRSVPSection';
import { CraftLocationMapSection } from '../components/web/craft/CraftLocationMapSection';
import { CraftMenuSection } from '../components/web/craft/CraftMenuSection';
import { CraftTestimonialsSection } from '../components/web/craft/CraftTestimonialsSection';
import { CraftCountdownSection } from '../components/web/craft/CraftCountdownSection';
import { CraftFAQSection } from '../components/web/craft/CraftFAQSection';
import { CraftDressCodeSection } from '../components/web/craft/CraftDressCodeSection';
import { CraftGiftRegistrySection } from '../components/web/craft/CraftGiftRegistrySection';
import { CraftTravelInfoSection } from '../components/web/craft/CraftTravelInfoSection';
import { ThemeSelector } from '../components/web/craft/ThemeSelector';
import { GlobalStylesPanel } from '../components/web/craft/GlobalStylesPanel';
import { PublishModal } from '../components/web/craft/PublishModal';
import { TEMA_DEFAULT } from '../components/web/craft/themes';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useWeddingData } from '../hooks/useWeddingData';
import { useWedding } from '../context/WeddingContext';
import { WeddingDataProvider } from '../context/WeddingDataContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import {
  saveWeb,
  loadWeb,
  generateWebId,
  publishWeb,
} from '../services/webBuilder/craftWebService';
import { enrichTemplateWithWeddingData, getTemplateSummary } from '../utils/templateDataAdapter';
import useGuests from '../hooks/useGuests';

/**
 * Header Component - Necesita estar dentro de Editor para usar useEditor
 */
const EditorHeader = ({
  enabled,
  setEnabled,
  tema,
  onTemaChange,
  onMostrarEstilos,
  onSave,
  onPublish,
  onBackToDashboard,
  guardando,
  ultimoGuardado,
}) => {
  const { query, actions } = useEditor();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToDashboard}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            title="Volver a Mis Webs"
          >
            ← Mis Webs
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎨 Diseñador de Webs de Boda</h1>
            <p className="text-sm text-gray-600 mt-1">
              Arrastra componentes para crear tu web perfecta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de tema */}
          <ThemeSelector temaActual={tema} onTemaChange={onTemaChange} />

          {/* Botón personalizar */}
          <button
            onClick={onMostrarEstilos}
            className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            ✨ Personalizar
          </button>

          {/* Botón Vista Previa */}
          <button
            onClick={() =>
              window.open(
                `/preview-web?webId=${new URLSearchParams(window.location.search).get('webId')}`,
                '_blank'
              )
            }
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2"
            title="Ver vista previa de la web con todos los estilos aplicados"
          >
            👁️ Vista Previa
          </button>

          {/* Toggle edición */}
          <button
            onClick={() => setEnabled(!enabled)}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-colors
              ${
                enabled
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
              }
            `}
          >
            {enabled ? '✏️ Editando' : '🔒 Bloqueado'}
          </button>

          <button
            onClick={onSave}
            disabled={guardando}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-colors
              ${
                guardando
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }
            `}
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar'}
          </button>

          {ultimoGuardado && (
            <span className="text-xs text-gray-500">Guardado {ultimoGuardado}</span>
          )}

          <button
            onClick={onPublish}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
          >
            ✨ Publicar
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * EditorWrapper - Componente para capturar actions y query del editor
 */
const EditorWrapper = ({ onActionsReady }) => {
  const { actions, query } = useEditor();

  useEffect(() => {
    if (actions && query) {
      onActionsReady({ actions, query });
    }
  }, []); // Solo ejecutar una vez al montar

  return null;
};

/**
 * WebBuilderPageCraft - Página de diseño web usando Craft.js
 */
const WebBuilderPageCraft = () => {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const { weddingData, loading: loadingWeddingData } = useWeddingData();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [tema, setTema] = useState(TEMA_DEFAULT);
  const [mostrarEstilosGlobales, setMostrarEstilosGlobales] = useState(false);
  const [webId, setWebId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [editorState, setEditorState] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [currentSlug, setCurrentSlug] = useState('');
  const webCargada = useRef(false);

  // Log datos de la boda cuando se cargan
  useEffect(() => {
    if (weddingData && !loadingWeddingData) {
      console.log('📋 Datos de la boda cargados:', weddingData);
    }
  }, [weddingData, loadingWeddingData]);

  // Generar o cargar webId al montar
  useEffect(() => {
    if (currentUser) {
      // Intentar cargar desde URL params
      const params = new URLSearchParams(window.location.search);
      const urlWebId = params.get('webId');

      if (urlWebId) {
        setWebId(urlWebId);
        // No cargar aquí, esperar a que editorActions esté listo
      } else {
        // Generar nuevo ID
        const newWebId = generateWebId(currentUser.uid);
        setWebId(newWebId);
        // Actualizar URL sin recargar
        window.history.replaceState({}, '', `?webId=${newWebId}`);
      }
    }
  }, [currentUser]);

  const location = useLocation();

  // Cargar web o plantilla cuando editorState esté disponible
  useEffect(() => {
    if (webId && editorState && !webCargada.current) {
      const params = new URLSearchParams(window.location.search);
      const urlWebId = params.get('webId');

      if (urlWebId && urlWebId === webId) {
        // Verificar si viene una plantilla desde el dashboard
        if (location.state?.template) {
          cargarPlantilla(location.state.template);
        } else {
          cargarWeb(webId);
        }
        webCargada.current = true;
      }
    }
  }, [webId, editorState, location.state]);

  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!webId || !currentUser || !editorState) return;

    const interval = setInterval(() => {
      handleSave(true); // true = es auto-save, no mostrar toast
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [webId, currentUser, editorState]);

  // Auto-save cuando cambia el tema (con debounce)
  useEffect(() => {
    if (!webId || !currentUser || !editorState) return;

    const timeoutId = setTimeout(() => {
      handleSave(true); // Guardar automáticamente sin toast
    }, 2000); // Esperar 2 segundos después del último cambio

    return () => clearTimeout(timeoutId);
  }, [tema]);

  // Exponer función de actualización globalmente para el botón
  useEffect(() => {
    window.actualizarEstilos = actualizarEstilosComponentes;
    return () => {
      delete window.actualizarEstilos;
    };
  }, [editorState]);

  // Obtener invitados para enriquecer plantillas
  const { guests } = useGuests();

  const cargarPlantilla = (template) => {
    try {
      if (template && template.estructura && editorState) {
        // Obtener datos de la boda del contexto
        const weddingInfo = weddingData?.weddingInfo || {};

        // Enriquecer plantilla con datos reales
        const enrichedTemplate = enrichTemplateWithWeddingData(template, weddingInfo, guests);

        // Mostrar resumen de datos cargados
        const summary = getTemplateSummary(enrichedTemplate);
        console.log('📊 Plantilla enriquecida:', summary);

        // Cargar estructura enriquecida
        editorState.actions.deserialize(JSON.stringify(enrichedTemplate.estructura));

        // Aplicar tema de la plantilla
        if (enrichedTemplate.tema) {
          setTema(enrichedTemplate.tema);
        }

        // Mostrar información de invitados si está disponible
        if (enrichedTemplate.metadata?.seatingInfo) {
          toast.success(
            `✅ Plantilla "${enrichedTemplate.nombre}" cargada\n${enrichedTemplate.metadata.seatingInfo}`,
            { autoClose: 5000 }
          );
        } else {
          toast.success(`✅ Plantilla "${enrichedTemplate.nombre}" cargada`);
        }
      }
    } catch (error) {
      console.error('Error cargando plantilla:', error);
      toast.error('❌ Error al cargar la plantilla');
    }
  };

  const cargarWeb = async (idWeb) => {
    try {
      const webData = await loadWeb(idWeb);
      if (webData && webData.craftConfig && editorState) {
        editorState.actions.deserialize(webData.craftConfig);
        if (webData.tema) {
          // Asegurar que el tema tiene decoraciones (para webs antiguas)
          const temaConDecoraciones = {
            ...webData.tema,
            decoraciones: webData.tema.decoraciones || {
              flores: false,
              petalos: false,
              divisores: false,
              animaciones: true,
              marcos: false,
            },
          };
          console.log('🎨 Tema cargado con decoraciones:', temaConDecoraciones);
          setTema(temaConDecoraciones);
        }
        if (webData.slug) {
          setCurrentSlug(webData.slug);
        }
        toast.success('✅ Web cargada correctamente');
      } else {
        console.log('ℹ️ Iniciando con web nueva');
      }
    } catch (error) {
      console.error('Error cargando web:', error);
      toast.error('❌ Error al cargar la web');
    }
  };

  const handleSave = async (esAutoSave = false) => {
    if (!webId || !currentUser || !editorState) {
      toast.error('❌ No se puede guardar ahora');
      return;
    }

    setGuardando(true);
    try {
      const json = editorState.query.serialize();

      await saveWeb(
        currentUser.uid,
        webId,
        {
          craftConfig: json,
          tema: tema,
          nombre: 'Mi Web de Boda', // TODO: hacer editable
        },
        activeWedding
      );

      const ahora = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setUltimoGuardado(ahora);

      if (!esAutoSave) {
        toast.success('✅ Web guardada correctamente');
      }
    } catch (error) {
      console.error('Error guardando web:', error);
      if (!esAutoSave) {
        toast.error('❌ Error al guardar la web');
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleTemaChange = (nuevoTema, mostrarToast = false) => {
    console.log('🔥 =================================');
    console.log('🔥 HANDLE TEMA CHANGE LLAMADO');
    console.log('📝 Tema completo:', nuevoTema);
    console.log('🎨 Colores:', nuevoTema?.colores);
    console.log('✍️ Fuentes:', nuevoTema?.fuentes);
    console.log('🖼️ Fondo:', nuevoTema?.fondo);
    console.log('🌸 Decoraciones:', nuevoTema?.decoraciones);
    console.log('🔥 =================================');

    setTema(nuevoTema);

    // Solo mostrar toast si se indica explícitamente (cambio de tema completo)
    if (mostrarToast && nuevoTema.nombre) {
      toast.success(`✅ Tema "${nuevoTema.nombre}" aplicado`);
    } else {
      // Mostrar indicador sutil de que se guardará
      toast.info('💾 Guardando cambios...', { autoClose: 1000, hideProgressBar: true });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/wedding/web-builder-dashboard');
  };

  // Función para actualizar estilos de componentes existentes
  const actualizarEstilosComponentes = React.useCallback(() => {
    if (!editorState) {
      toast.error('❌ Editor no disponible');
      return;
    }

    try {
      const json = editorState.query.serialize();
      const parsedJson = JSON.parse(json);

      let cambios = 0;
      // Recorrer todos los nodos y actualizar clases bg-white
      Object.keys(parsedJson).forEach((nodeId) => {
        const node = parsedJson[nodeId];
        if (node.props?.className && node.props.className.includes('bg-white')) {
          // Reemplazar bg-white por bg-white/10 backdrop-blur-md
          const oldClassName = node.props.className;
          node.props.className = node.props.className
            .replace(/bg-white\/95\s+backdrop-blur-sm/g, 'bg-white/10 backdrop-blur-md')
            .replace(/bg-white\s/g, 'bg-white/10 backdrop-blur-md ')
            .replace(/bg-white$/g, 'bg-white/10 backdrop-blur-md');
          if (oldClassName !== node.props.className) {
            cambios++;
          }
        }
      });

      if (cambios > 0) {
        // Deserializar el JSON actualizado
        editorState.actions.deserialize(JSON.stringify(parsedJson));
        toast.success(`✅ ${cambios} componente(s) actualizado(s) - Ahora verás el fondo`);
        // Guardar automáticamente
        setTimeout(() => handleSave(true), 500);
      } else {
        toast.info('ℹ️ No hay componentes que actualizar');
      }
    } catch (error) {
      console.error('Error actualizando estilos:', error);
      toast.error('❌ Error actualizando estilos');
    }
  }, [editorState]);

  const handlePublishClick = () => {
    // Guardar antes de publicar
    handleSave(false);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async (slug) => {
    if (!webId || !currentUser || !editorState) {
      toast.error('❌ No se puede publicar ahora');
      return;
    }

    try {
      console.log('📝 Publicando web con slug:', slug);
      console.log('📋 webId:', webId);
      console.log('👤 userId:', currentUser.uid);

      const json = editorState.query.serialize();

      const webData = {
        craftConfig: json,
        tema: tema,
        slug: slug,
        published: true,
      };

      console.log('📦 Datos a guardar:', {
        slug: webData.slug,
        published: webData.published,
        userId: currentUser.uid,
      });

      // Guardar con slug y marcar como publicada
      const result = await saveWeb(currentUser.uid, webId, webData, activeWedding);

      console.log('✅ Resultado de saveWeb:', result);

      // Actualizar estado local
      setCurrentSlug(slug);

      const publicUrl = `${window.location.origin}/web/${slug}`;
      toast.success(`✅ Web publicada en: ${publicUrl}`);

      console.log('🌐 URL pública:', publicUrl);

      // Copiar URL al portapapeles
      try {
        await navigator.clipboard.writeText(publicUrl);
        toast.info('📋 URL copiada al portapapeles');
      } catch (err) {
        console.log('No se pudo copiar al portapapeles');
      }
    } catch (error) {
      console.error('❌ Error publicando web:', error);
      toast.error('❌ Error al publicar la web');
      throw error;
    }
  };

  return (
    <WeddingDataProvider weddingData={weddingData}>
      <ThemeProvider initialTema={tema} externalTema={tema}>
        <Editor
          resolver={{
            CraftHeroSection,
            CraftStorySection,
            CraftEventInfoSection,
            CraftPhotoGallerySection,
            CraftRSVPSection,
            CraftLocationMapSection,
            CraftMenuSection,
            CraftTestimonialsSection,
            CraftCountdownSection,
            CraftFAQSection,
            CraftDressCodeSection,
            CraftGiftRegistrySection,
            CraftTravelInfoSection,
          }}
          enabled={enabled}
        >
          <EditorWrapper onActionsReady={setEditorState} />
          <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <EditorHeader
              enabled={enabled}
              setEnabled={setEnabled}
              tema={tema}
              onTemaChange={handleTemaChange}
              onMostrarEstilos={() => setMostrarEstilosGlobales(!mostrarEstilosGlobales)}
              onSave={handleSave}
              onPublish={handlePublishClick}
              onBackToDashboard={handleBackToDashboard}
              guardando={guardando}
              ultimoGuardado={ultimoGuardado}
            />

            {/* Editor principal */}
            <div className="flex-1 flex overflow-hidden">
              {/* Toolbox izquierda */}
              <div className="w-64 bg-white">
                <Toolbox />
              </div>

              {/* Canvas centro - Fondo limpio para edición */}
              <div className="flex-1 overflow-auto bg-gray-50">
                <div className="min-h-full w-full">
                  <div
                    className="min-h-full w-full"
                    style={{
                      '--color-primario': tema?.colores?.primario || '#000000',
                      '--color-secundario': tema?.colores?.secundario || '#333333',
                      '--color-acento': tema?.colores?.acento || '#666666',
                      '--color-fondo': tema?.colores?.fondo || '#FFFFFF',
                      '--color-texto': tema?.colores?.texto || '#000000',
                      '--color-texto-claro': tema?.colores?.textoClaro || '#FFFFFF',
                      '--fuente-titulo': tema?.fuentes?.titulo || 'Arial',
                      '--fuente-texto': tema?.fuentes?.texto || 'Arial',
                      backgroundColor: 'transparent', // Transparente para que se vea el fondo del padre
                    }}
                  >
                    <Frame>
                      <Element
                        canvas
                        is="div"
                        className="min-h-screen w-full"
                        style={{
                          backgroundColor: 'transparent',
                          position: 'relative',
                        }}
                        data-cy="canvas-root"
                      >
                        {/* Canvas vacío - los usuarios arrastran componentes aquí */}
                        <div className="flex items-center justify-center min-h-screen text-gray-400">
                          <div className="text-center" style={{ position: 'relative', zIndex: 10 }}>
                            <div className="text-6xl mb-4">⬅️</div>
                            <p className="text-lg font-semibold">
                              Arrastra un componente aquí para comenzar
                            </p>
                            <p className="text-sm mt-2">Elige un componente del panel izquierdo</p>
                          </div>
                        </div>
                      </Element>
                    </Frame>
                  </div>
                </div>
              </div>

              {/* Settings derecha */}
              <div className="w-80 bg-white">
                {mostrarEstilosGlobales ? (
                  <GlobalStylesPanel tema={tema} onTemaChange={handleTemaChange} />
                ) : (
                  <SettingsPanel />
                )}
              </div>
            </div>

            {/* Footer con tips */}
            <footer className="bg-white border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  💡 <strong>Tip:</strong> Arrastra componentes al canvas, haz clic para editar
                </p>
                <p className="text-gray-500">Hecho con ❤️ por MaLoveApp</p>
              </div>
            </footer>
          </div>

          {/* Modal de publicación */}
          <PublishModal
            isOpen={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            onPublish={handlePublishConfirm}
            currentSlug={currentSlug}
            webId={webId}
          />
        </Editor>
      </ThemeProvider>
    </WeddingDataProvider>
  );
};

export default WebBuilderPageCraft;
