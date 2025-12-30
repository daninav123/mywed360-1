/**
 * TramitesLegales - Gestión de trámites y documentación legal
 * FASE 4 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Calendar, AlertCircle, CheckCircle2, Clock, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';
import { 
  CATEGORIAS_TRAMITES, 
  getTramitesByCategoria, 
  calcularFechaLimite,
  getTramitesUrgentes 
} from '../data/tramitesData';

const TramiteCard = ({ tramite, fechaBoda, onToggle, onEdit, onDelete }) => {
  const fechaLimite = fechaBoda ? calcularFechaLimite(fechaBoda, tramite.tramite.plazo) : null;
  const hoy = new Date();
  const diasRestantes = fechaLimite ? Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24)) : null;
  
  const getUrgencia = () => {
    if (!diasRestantes || tramite.completado) return 'normal';
    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 7) return 'critico';
    if (diasRestantes <= 30) return 'urgente';
    return 'normal';
  };

  const urgencia = getUrgencia();
  
  const urgenciaColors = {
    vencido: 'border-red-500 bg-red-50',
    critico: 'border-orange-500 bg-orange-50',
    urgente: 'border-yellow-500 bg-yellow-50',
    normal: 'border-gray-200 bg-white'
  };

  const urgenciaBadge = {
    vencido: { text: 'VENCIDO', color: 'bg-red-600 text-white' },
    critico: { text: 'CRÍTICO', color: 'bg-orange-600 text-white' },
    urgente: { text: 'URGENTE', color: 'bg-yellow-600 text-white' },
    normal: { text: 'Normal', color: 'bg-gray-500 text-white' }
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      tramite.completado ? 'border-green-200 bg-green-50' : urgenciaColors[urgencia]
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onToggle(tramite.id)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 mt-0.5 transition-all ${
              tramite.completado
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {tramite.completado && <CheckCircle2 className="w-5 h-5 text-white" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold text-gray-800 ${
                tramite.completado ? 'line-through' : ''
              }`}>
                {tramite.tramite.nombre}
                {tramite.tramite.obligatorio && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>
              {!tramite.completado && urgencia !== 'normal' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgenciaBadge[urgencia].color}`}>
                  {urgenciaBadge[urgencia].text}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {tramite.tramite.descripcion}
            </p>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Plazo: {tramite.tramite.plazo} días antes</span>
              </div>
              
              {fechaLimite && !tramite.completado && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Fecha límite: {fechaLimite.toLocaleDateString('es-ES')}
                    {diasRestantes !== null && (
                      <span className={`ml-1 font-medium ${
                        diasRestantes < 0 ? 'text-red-600' : 
                        diasRestantes <= 7 ? 'text-orange-600' : 
                        diasRestantes <= 30 ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>
                        ({diasRestantes < 0 ? `${Math.abs(diasRestantes)} días vencido` : `${diasRestantes} días restantes`})
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div>📍 Dónde: {tramite.tramite.donde}</div>
              <div>👤 Responsable: {tramite.tramite.responsable}</div>
              
              {tramite.tramite.notas && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                  💡 {tramite.tramite.notas}
                </div>
              )}
            </div>

            {tramite.fechaCompletado && (
              <div className="mt-2 text-xs text-green-700">
                ✓ Completado el {new Date(tramite.fechaCompletado).toLocaleDateString('es-ES')}
              </div>
            )}

            {tramite.notas && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                {tramite.notas}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onEdit(tramite)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!tramite.tramite.obligatorio && (
            <button
              onClick={() => onDelete(tramite.id)}
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TramiteModal = ({ tramite, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    tramite || {
      notas: '',
      documentoUrl: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Editar trámite
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-1">
              {tramite.tramite.nombre}
            </h3>
            <p className="text-sm text-gray-600">
              {tramite.tramite.descripcion}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas personales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder={t('legalProcedures.namePlaceholder')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del documento (opcional)
              </label>
              <input
                type="url"
                value={formData.documentoUrl}
                onChange={(e) => setFormData({ ...formData, documentoUrl: e.target.value })}
                placeholder={t('legalProcedures.searchPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link a Drive, Dropbox, etc. donde guardas el documento
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function TramitesLegales() {
  const { activeWedding, weddingData } = useWedding();
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTramite, setEditingTramite] = useState(null);
  const [activeCategory, setActiveCategory] = useState('civil');

  const fechaBoda = weddingData?.weddingDate;

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'legal', 'tramites');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTramites(data.tramites || []);
        } else {
          const defaultTramites = [];
          CATEGORIAS_TRAMITES.forEach(cat => {
            const catTramites = getTramitesByCategoria(cat.id);
            catTramites.forEach(t => {
              defaultTramites.push({
                id: `${cat.id}-${t.id}`,
                categoria: cat.id,
                tramite: t,
                completado: false,
                fechaCompletado: null,
                notas: '',
                documentoUrl: ''
              });
            });
          });
          setTramites(defaultTramites);
          await saveData(defaultTramites);
        }
      } catch (error) {
        console.error('Error loading tramites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newTramites) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'legal', 'tramites');
      await setDoc(docRef, {
        tramites: newTramites,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving tramites:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleToggle = useCallback((id) => {
    const newTramites = tramites.map(t => {
      if (t.id === id) {
        const completado = !t.completado;
        return {
          ...t,
          completado,
          fechaCompletado: completado ? new Date().toISOString() : null
        };
      }
      return t;
    });
    
    setTramites(newTramites);
    saveData(newTramites);
  }, [tramites, saveData]);

  const handleEdit = useCallback((formData) => {
    const newTramites = tramites.map(t => 
      t.id === editingTramite.id ? { ...t, ...formData } : t
    );
    
    setTramites(newTramites);
    saveData(newTramites);
    setShowModal(false);
    setEditingTramite(null);
    toast.success('Trámite actualizado');
  }, [tramites, editingTramite, saveData]);

  const handleDelete = useCallback((id) => {
    if (!confirm('¿Eliminar este trámite?')) return;
    
    const newTramites = tramites.filter(t => t.id !== id);
    setTramites(newTramites);
    saveData(newTramites);
    toast.success('Trámite eliminado');
  }, [tramites, saveData]);

  const stats = useMemo(() => {
    const categoriaTramites = tramites.filter(t => t.categoria === activeCategory);
    const total = categoriaTramites.length;
    const completados = categoriaTramites.filter(t => t.completado).length;
    const obligatorios = categoriaTramites.filter(t => t.tramite.obligatorio).length;
    const obligatoriosCompletados = categoriaTramites.filter(t => t.tramite.obligatorio && t.completado).length;
    const urgentes = fechaBoda ? getTramitesUrgentes(categoriaTramites, fechaBoda, 30) : [];
    
    return {
      total,
      completados,
      obligatorios,
      obligatoriosCompletados,
      urgentes: urgentes.length,
      porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0
    };
  }, [tramites, activeCategory, fechaBoda]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando trámites...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const activeTramites = tramites
    .filter(t => t.categoria === activeCategory)
    .sort((a, b) => {
      if (a.completado !== b.completado) return a.completado ? 1 : -1;
      if (a.tramite.obligatorio !== b.tramite.obligatorio) return a.tramite.obligatorio ? -1 : 1;
      return 0;
    });

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Trámites Legales</h1>
                  <p className="text-sm text-gray-600">
                    Documentación necesaria para tu boda
                  </p>
                </div>
              </div>
            </div>

            {!fechaBoda && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Configura la fecha de tu boda</strong> para ver las fechas límite de cada trámite.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-600">Total trámites</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{stats.completados}</div>
                <div className="text-xs text-gray-600">Completados</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{stats.obligatorios}</div>
                <div className="text-xs text-gray-600">Obligatorios</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-orange-600">{stats.urgentes}</div>
                <div className="text-xs text-gray-600">Urgentes</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{stats.porcentaje}%</div>
                <div className="text-xs text-gray-600">Progreso</div>
              </div>
            </div>

            {stats.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">Progreso de categoría</span>
                  <span className="text-gray-600">{stats.completados}/{stats.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${stats.porcentaje}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIAS_TRAMITES.map((cat) => {
              const catTramites = tramites.filter(t => t.categoria === cat.id);
              const catCompletados = catTramites.filter(t => t.completado).length;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    activeCategory === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icono}</div>
                  <div className="font-semibold text-gray-800 text-sm mb-1">
                    {cat.nombre}
                  </div>
                  <div className="text-xs text-gray-600">
                    {catCompletados}/{catTramites.length} completados
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tramites List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {CATEGORIAS_TRAMITES.find(c => c.id === activeCategory)?.nombre}
                </h2>
                <p className="text-sm text-gray-600">
                  {CATEGORIAS_TRAMITES.find(c => c.id === activeCategory)?.descripcion}
                </p>
              </div>
            </div>

            {activeTramites.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay trámites en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTramites.map((tramite) => (
                  <TramiteCard
                    key={tramite.id}
                    tramite={tramite}
                    fechaBoda={fechaBoda}
                    onToggle={handleToggle}
                    onEdit={(t) => {
                      setEditingTramite(t);
                      setShowModal(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && editingTramite && (
          <TramiteModal
            tramite={editingTramite}
            onSave={handleEdit}
            onClose={() => {
              setShowModal(false);
              setEditingTramite(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
