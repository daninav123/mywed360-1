import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getUserWebs,
  deleteWeb,
  unpublishWeb,
  generateWebId,
} from '../services/webBuilder/craftWebService';
import { toast } from 'react-toastify';
import { ShareWebTools } from '../components/web/ShareWebTools';
import { TemplateSelector } from '../components/web/TemplateSelector';

/**
 * Dashboard para gestionar las webs creadas por el usuario
 */
const WebBuilderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [webs, setWebs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [sharingWeb, setSharingWeb] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserWebs();
    }
  }, [currentUser]);

  const loadUserWebs = async () => {
    try {
      setLoading(true);
      const userWebs = await getUserWebs(currentUser.uid);
      setWebs(userWebs);
    } catch (error) {
      console.error('Error cargando webs:', error);
      toast.error('❌ Error al cargar las webs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setShowTemplateSelector(true);
  };

  const handleSelectTemplate = (template) => {
    const newWebId = generateWebId();
    // Pasar template como state en navegación
    navigate(`/web-builder-craft?webId=${newWebId}`, {
      state: { template },
    });
  };

  const handleStartBlank = () => {
    const newWebId = generateWebId();
    navigate(`/web-builder-craft?webId=${newWebId}`);
  };

  const handleEdit = (webId) => {
    navigate(`/web-builder-craft?webId=${webId}`);
  };

  const handleUnpublish = async (webId) => {
    try {
      await unpublishWeb(webId);
      toast.success('✅ Web despublicada');
      loadUserWebs();
    } catch (error) {
      console.error('Error despublicando:', error);
      toast.error('❌ Error al despublicar');
    }
  };

  const handleDelete = async (webId) => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar esta web? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      setDeletingId(webId);
      await deleteWeb(webId);
      toast.success('✅ Web eliminada');
      loadUserWebs();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('❌ Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (slug) => {
    const url = `${window.location.origin}/web/${slug}`;
    navigator.clipboard.writeText(url);
    toast.info('📋 URL copiada al portapapeles');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin fecha';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando tus webs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎨 Mis Webs de Boda</h1>
              <p className="mt-2 text-gray-600">Gestiona todas tus webs creadas</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Crear Nueva Web
            </button>
          </div>
        </div>

        {/* Lista de Webs */}
        {webs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no has creado ninguna web
            </h3>
            <p className="text-gray-600 mb-6">Crea tu primera web de boda personalizada</p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Crear Mi Primera Web
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {webs.map((web) => (
              <div
                key={web.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Preview */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                  {web.published && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        ✓ Publicada
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-5xl mb-2">🎨</div>
                    <p className="text-sm font-medium text-gray-700">
                      {web.nombre || 'Mi Web de Boda'}
                    </p>
                  </div>
                </div>

                {/* Información */}
                <div className="p-5">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">
                      Actualizada: {formatDate(web.updatedAt)}
                    </p>
                    {web.published && web.slug && (
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-xs text-gray-600 truncate flex-1">/web/{web.slug}</p>
                        <button
                          onClick={() => handleCopyUrl(web.slug)}
                          className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEdit(web.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        ✏️ Editar
                      </button>
                      {web.published ? (
                        <button
                          onClick={() => handleUnpublish(web.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          🔒 Despublicar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(web.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          ✨ Publicar
                        </button>
                      )}
                    </div>

                    {web.published && web.slug && (
                      <button
                        onClick={() => setSharingWeb(web)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        📱 Compartir
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(web.id)}
                    disabled={deletingId === web.id}
                    className="w-full mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === web.id ? '🗑️ Eliminando...' : '🗑️ Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Selector de Plantillas */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleSelectTemplate}
          onStartBlank={handleStartBlank}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Modal de Compartir */}
      {sharingWeb && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Compartir: {sharingWeb.nombre || 'Mi Web'}
              </h2>
              <button
                onClick={() => setSharingWeb(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ShareWebTools
                webUrl={`${window.location.origin}/web/${sharingWeb.slug}`}
                webTitle={sharingWeb.nombre || 'Nuestra Boda'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebBuilderDashboard;
