import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { toast } from 'react-toastify';
import { generarWebAutomatica } from '../services/webBuilder/aiGeneratorService';
import WebRenderer from '../components/web/renderer/WebRenderer';
import { defaultWebConfig } from '../schemas/webConfig.schema';
import {
  DragDropProvider,
  DroppableContainer,
  DraggableSection,
} from '../components/web/builder/DragDropProvider';
import ColorPickerPanel from '../components/web/builder/ColorPickerPanel';
import FontSelectorPanel from '../components/web/builder/FontSelectorPanel';
import ImageUploadPanel from '../components/web/builder/ImageUploadPanel';
import SplitViewEditor from '../components/web/builder/SplitViewEditor';
import PublishPanel from '../components/web/builder/PublishPanel';
import {
  saveWebConfig,
  updateWebConfig,
  publishWeb,
} from '../services/webBuilder/webConfigService';

/**
 * WebBuilderPage - Nueva página del sistema de diseño web
 * Sistema completo con generación automática + edición visual
 */
const WebBuilderPage = () => {
  const { currentUser } = useAuth();
  const { activeWedding, profile } = useWedding();

  const [webConfig, setWebConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [paso, setPaso] = useState(1); // 1: Generar, 2: Preview, 3: Editar
  const [profileLoading, setProfileLoading] = useState(true);

  // Detectar cuando el perfil está cargado (con timeout)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Si después de 3 segundos no hay perfil, asumir que está vacío pero continuar
      setProfileLoading(false);
    }, 3000);

    if (profile !== undefined) {
      clearTimeout(timer);
      setProfileLoading(false);
    }

    return () => clearTimeout(timer);
  }, [profile]);

  // Generar web automáticamente
  const handleGenerarAutomatico = async () => {
    setLoading(true);
    try {
      // Usar perfil si existe, si no usar datos vacíos
      const profileToUse = profile || {};

      // Generar web con IA
      const config = await generarWebAutomatica(profileToUse);
      setWebConfig(config);
      setPaso(2);
      toast.success('✨ ¡Web generada automáticamente!');
    } catch (error) {
      console.error('Error generando web:', error);
      toast.error('Error al generar la web');

      // Usar configuración por defecto en caso de error
      setWebConfig({
        ...defaultWebConfig,
        meta: {
          ...defaultWebConfig.meta,
          id: `web_${Date.now()}`,
          titulo:
            profile?.brideInfo?.nombre && profile?.groomInfo?.nombre
              ? `${profile.brideInfo.nombre} y ${profile.groomInfo.nombre}`
              : 'Nuestra Boda',
          slug: 'mi-boda',
        },
      });
      setPaso(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (nuevaConfig) => {
    setWebConfig(nuevaConfig);
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.index === destination.index) return;

    // Reordenar secciones
    const nuevasSecciones = Array.from(webConfig.secciones);
    const [removed] = nuevasSecciones.splice(source.index, 1);
    nuevasSecciones.splice(destination.index, 0, removed);

    // Actualizar orden
    const seccionesConOrden = nuevasSecciones.map((sec, idx) => ({
      ...sec,
      orden: idx + 1,
    }));

    setWebConfig({
      ...webConfig,
      secciones: seccionesConOrden,
    });

    toast.info('📍 Sección reordenada');
  };

  const handleImageUpload = (imageData) => {
    toast.success('✅ Imagen subida correctamente');
    console.log('Imagen subida:', imageData);
  };

  const handleGuardar = async () => {
    if (!currentUser || !activeWedding) {
      toast.error('No se pudo guardar');
      return;
    }

    try {
      setLoading(true);
      await updateWebConfig(currentUser.uid, activeWedding.id, webConfig);
      toast.success('💾 Web guardada correctamente');
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar la web');
    } finally {
      setLoading(false);
    }
  };

  const handlePublicar = async () => {
    if (!currentUser || !activeWedding) {
      toast.error('No se pudo publicar');
      return;
    }

    try {
      setLoading(true);
      const result = await publishWeb(currentUser.uid, activeWedding.id, webConfig);
      toast.success('✅ Web publicada correctamente');
      console.log('Web publicada:', result);

      // Mostrar panel de publicación
      setPaso(4);
    } catch (error) {
      console.error('Error publicando:', error);
      toast.error('Error al publicar la web');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se carga el perfil
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen " style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2  mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <h2 className="text-xl font-semibold " style={{ color: 'var(--color-text)' }}>Cargando tu perfil...</h2>
          <p className=" mt-2" style={{ color: 'var(--color-text-secondary)' }}>Preparando el sistema de diseño web</p>
        </div>
      </div>
    );
  }

  return (
    <div className="web-builder-page min-h-screen " style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header className=" border-b  sticky top-0 z-50" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>
              {paso === 1 && '🎨 Crear tu Web de Boda'}
              {paso === 2 && '👀 Vista Previa'}
              {paso === 3 && '✏️ Editar tu Web'}
            </h1>
            <p className="text-sm  mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {paso === 1 && 'Genera tu web automáticamente en segundos'}
              {paso === 2 && 'Revisa cómo se ve tu web'}
              {paso === 3 && 'Personaliza cada detalle a tu gusto'}
            </p>
          </div>

          <div className="flex gap-3">
            {paso === 2 && (
              <>
                <button
                  onClick={() => {
                    setPaso(1);
                    setWebConfig(null);
                  }}
                  className="px-4 py-2 border  rounded-lg hover: transition-colors" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => {
                    setModoEdicion(true);
                    setPaso(3);
                  }}
                  className="px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={handlePublicar}
                  className="px-4 py-2  text-white rounded-lg hover:bg-green-700 transition-colors" style={{ backgroundColor: 'var(--color-success)' }}
                >
                  ✨ Publicar
                </button>
              </>
            )}

            {paso === 3 && (
              <>
                <button
                  onClick={() => {
                    setModoEdicion(false);
                    setPaso(2);
                  }}
                  className="px-4 py-2 border  rounded-lg hover: transition-colors" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  👁️ Ver Preview
                </button>
                <button
                  onClick={handlePublicar}
                  className="px-4 py-2  text-white rounded-lg hover:bg-green-700 transition-colors" style={{ backgroundColor: 'var(--color-success)' }}
                >
                  ✨ Publicar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Paso 1: Pantalla inicial */}
        {paso === 1 && (
          <div className="max-w-2xl mx-auto text-center">
            <div className=" rounded-2xl shadow-lg p-12" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="text-6xl mb-6">✨</div>
              <h2 className="text-3xl font-bold  mb-4" style={{ color: 'var(--color-text)' }}>¿Listo para crear tu web?</h2>
              <p className=" mb-8 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                En solo <strong>10 segundos</strong> generaremos una web completa con todos tus
                datos. Luego podrás editarla como quieras.
              </p>

              <button
                onClick={handleGenerarAutomatico}
                disabled={loading}
                className="
                  px-8 py-4 bg-[var(--color-primary)] 
                  text-white rounded-xl font-semibold text-lg
                  hover:shadow-xl transition-all transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:transform-none
                "
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generando tu web...
                  </span>
                ) : (
                  '🚀 Generar mi web automáticamente'
                )}
              </button>

              <div className="mt-12 pt-8 border-t " style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>¿Qué incluye?</h3>
                <ul className="text-left  space-y-2 inline-block" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>✓ Portada con tus nombres y fecha</li>
                  <li>✓ Tu historia de amor</li>
                  <li>✓ Información del evento</li>
                  <li>✓ Mapa de ubicación</li>
                  <li>✓ Formulario de confirmación</li>
                  <li>✓ ¡Y mucho más!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Preview */}
        {paso === 2 && webConfig && (
          <div className=" rounded-lg shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
            <WebRenderer
              config={webConfig}
              editable={false}
              onSectionChange={handleSectionChange}
            />
          </div>
        )}

        {/* Paso 3: Split View Edición */}
        {paso === 3 && webConfig && (
          <SplitViewEditor
            config={webConfig}
            onChange={handleSectionChange}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Paso 4: Publicación */}
        {paso === 4 && webConfig && (
          <div className="max-w-2xl mx-auto">
            <PublishPanel config={webConfig} onPublish={handlePublicar} isLoading={loading} />
          </div>
        )}
      </main>
    </div>
  );
};

export default WebBuilderPage;
