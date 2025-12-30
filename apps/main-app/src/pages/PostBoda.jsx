/**
 * PostBoda - Gestión post-boda
 * FASE 8.1 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Mail, Image, Star, MessageCircle, Plus, Edit2, Trash2, Download, Send, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const getCategoriesThankYou = (t) => [
  { id: 'invitados', nombre: t('postBoda.categories.guests'), icon: '👥', color: 'blue' },
  { id: 'familia', nombre: t('postBoda.categories.closeFamily'), icon: '👨‍👩‍👧‍👦', color: 'purple' },
  { id: 'padrinos', nombre: t('postBoda.categories.godparents'), icon: '👑', color: 'yellow' },
  { id: 'proveedores', nombre: t('postBoda.categories.suppliers'), icon: '💼', color: 'green' }
];

const getMemoryTypes = (t) => [
  { id: 'foto', nombre: t('postBoda.memoryTypes.photo'), icon: '📸', color: 'pink' },
  { id: 'video', nombre: t('postBoda.memoryTypes.video'), icon: '🎥', color: 'red' },
  { id: 'mensaje', nombre: t('postBoda.memoryTypes.message'), icon: '💌', color: 'purple' },
  { id: 'otro', nombre: t('postBoda.memoryTypes.other'), icon: '⭐', color: 'gray' }
];

const getSupplierTypes = (t) => [
  t('postBoda.supplierTypes.photographer'), 
  t('postBoda.supplierTypes.videographer'), 
  t('postBoda.supplierTypes.ceremonyVenue'), 
  t('postBoda.supplierTypes.receptionVenue'),
  t('postBoda.supplierTypes.catering'), 
  t('postBoda.supplierTypes.florist'), 
  t('postBoda.supplierTypes.djMusic'), 
  t('postBoda.supplierTypes.coordinator'),
  t('postBoda.supplierTypes.hairdresser'), 
  t('postBoda.supplierTypes.makeup'), 
  t('postBoda.supplierTypes.transport'), 
  t('postBoda.supplierTypes.other')
];

const AgradecimientoCard = ({ agradecimiento, onEdit, onDelete, onToggleEnviado }) => {
  const { t } = useTranslation('pages');
  const CATEGORIAS_AGRADECIMIENTOS = getCategoriesThankYou(t);
  const categoria = CATEGORIAS_AGRADECIMIENTOS.find(c => c.id === agradecimiento.categoria) || CATEGORIAS_AGRADECIMIENTOS[0];
  
  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      agradecimiento.enviado ? 'bg-green-50 border-green-200' : `bg-white border-${categoria.color}-200`
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleEnviado(agradecimiento.id)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${
              agradecimiento.enviado
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {agradecimiento.enviado && <CheckCircle2 className="w-5 h-5 text-white" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{categoria.icon}</span>
              <h3 className={`font-semibold text-gray-800 ${
                agradecimiento.enviado ? 'line-through' : ''
              }`}>
                {agradecimiento.destinatario}
              </h3>
            </div>
            <p className="text-xs text-gray-600">{categoria.nombre}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(agradecimiento)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(agradecimiento.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {agradecimiento.mensaje && (
        <div className="text-sm text-gray-700 mb-2 pl-9">
          {agradecimiento.mensaje.length > 100 
            ? `${agradecimiento.mensaje.substring(0, 100)}...` 
            : agradecimiento.mensaje
          }
        </div>
      )}

      {agradecimiento.email && (
        <div className="text-xs text-gray-600 pl-9 flex items-center gap-2">
          <Mail className="w-3 h-3" />
          {agradecimiento.email}
        </div>
      )}

      {agradecimiento.enviado && agradecimiento.fechaEnvio && (
        <div className="text-xs text-green-700 mt-2 pl-9">
          ✓ Enviado el {new Date(agradecimiento.fechaEnvio).toLocaleDateString('es-ES')}
        </div>
      )}
    </div>
  );
};

const RecuerdoCard = ({ recuerdo, onEdit, onDelete }) => {
  const tipo = TIPOS_RECUERDO.find(t => t.id === recuerdo.tipo) || TIPOS_RECUERDO[0];
  
  return (
    <div className={`border-2 border-${tipo.color}-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tipo.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{recuerdo.titulo}</h3>
            <p className="text-xs text-gray-600">{tipo.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(recuerdo)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(recuerdo.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {recuerdo.descripcion && (
        <p className="text-sm text-gray-700 mb-2">{recuerdo.descripcion}</p>
      )}

      {recuerdo.url && (
        <a 
          href={recuerdo.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          {t('postBoda.viewDownload')}
        </a>
      )}

      {recuerdo.fecha && (
        <div className="text-xs text-gray-500 mt-2">
          📅 {new Date(recuerdo.fecha).toLocaleDateString('es-ES')}
        </div>
      )}
    </div>
  );
};

const ValoracionCard = ({ valoracion, onEdit, onDelete }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{valoracion.proveedor}</h3>
          <p className="text-sm text-gray-600 mb-2">{valoracion.tipo}</p>
          <div className="flex items-center gap-1">
            {renderStars(valoracion.puntuacion)}
            <span className="text-sm text-gray-600 ml-2">({valoracion.puntuacion}/5)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(valoracion)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(valoracion.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {valoracion.comentario && (
        <p className="text-sm text-gray-700 mt-3 pt-3 border-t border-gray-200">
          {valoracion.comentario}
        </p>
      )}

      {valoracion.recomendaria !== undefined && (
        <div className="mt-2 text-sm">
          {valoracion.recomendaria ? (
            <span className="text-green-600">✓ {t('postBoda.wouldRecommend')}</span>
          ) : (
            <span className="text-red-600">✗ {t('postBoda.wouldNotRecommend')}</span>
          )}
        </div>
      )}
    </div>
  );
};

const AgradecimientoModal = ({ agradecimiento, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    agradecimiento || {
      categoria: 'invitados',
      destinatario: '',
      email: '',
      mensaje: '',
      enviado: false
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.destinatario) {
      toast.error('El destinatario es obligatorio');
      return;
    }
    onSave(formData);
  };

  const mensajesPlantilla = {
    invitados: 'Queridos amigos,\n\nGracias por acompañarnos en el día más especial de nuestras vidas. Vuestra presencia hizo que todo fuera aún más memorable.\n\nCon cariño,\n[Nombres]',
    familia: 'Querida familia,\n\nGracias por vuestro amor y apoyo incondicional. No podríamos haber llegado hasta aquí sin vosotros.\n\nCon todo nuestro amor,\n[Nombres]',
    padrinos: 'Queridos padrinos,\n\nGracias por aceptar ser parte tan importante de nuestro día. Vuestra presencia y apoyo significan el mundo para nosotros.\n\nCon gratitud,\n[Nombres]',
    proveedores: 'Estimado/a [Nombre],\n\nQueremos agradecerle su excelente trabajo y profesionalidad. Todo salió perfecto gracias a usted.\n\nSaludos cordiales,\n[Nombres]'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {agradecimiento ? 'Editar agradecimiento' : 'Nuevo agradecimiento'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CATEGORIAS_AGRADECIMIENTOS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, categoria: cat.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.categoria === cat.id
                        ? `border-${cat.color}-500 bg-${cat.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{cat.icon}</span>
                    <span className="text-xs text-gray-700">{cat.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinatario *
              </label>
              <input
                type="text"
                value={formData.destinatario}
                onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                placeholder={t('postBoda.recipientNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
        </div>
      );
    };

    const RecuerdoCard = ({ recuerdo, onEdit, onDelete }) => {
      const tipo = TIPOS_RECUERDO.find(t => t.id === recuerdo.tipo) || TIPOS_RECUERDO[0];
      
      return (
        <div className={`border-2 border-${tipo.color}-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tipo.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-800">{recuerdo.titulo}</h3>
                <p className="text-xs text-gray-600">{tipo.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
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
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                {recuerdo ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ValoracionModal = ({ valoracion, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    valoracion || {
      proveedor: '',
      tipo: '',
      puntuacion: 5,
      comentario: '',
      recomendaria: true
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.proveedor) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {valoracion ? 'Editar valoración' : 'Nueva valoración'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor *
              </label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                placeholder={t('common.providerNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de servicio
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {PROVEEDORES_TIPO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntuación *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, puntuacion: rating })}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        rating <= formData.puntuacion 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">({formData.puntuacion}/5)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario
              </label>
              <textarea
                value={formData.comentario}
                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                placeholder={t('postBoda.tellUsExperiencePlaceholder')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recomendaria}
                  onChange={(e) => setFormData({ ...formData, recomendaria: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">¿Recomendarías este proveedor?</span>
              </label>
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {valoracion ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function PostBoda() {
  const { activeWedding } = useWedding();
  const [agradecimientos, setAgradecimientos] = useState([]);
  const [recuerdos, setRecuerdos] = useState([]);
  const [valoraciones, setValoraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('agradecimientos');
  
  const [showAgradecimientoModal, setShowAgradecimientoModal] = useState(false);
  const [showRecuerdoModal, setShowRecuerdoModal] = useState(false);
  const [showValoracionModal, setShowValoracionModal] = useState(false);
  
  const [editingAgradecimiento, setEditingAgradecimiento] = useState(null);
  const [editingRecuerdo, setEditingRecuerdo] = useState(null);
  const [editingValoracion, setEditingValoracion] = useState(null);

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'post-wedding', 'data');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAgradecimientos(data.agradecimientos || []);
          setRecuerdos(data.recuerdos || []);
          setValoraciones(data.valoraciones || []);
        }
      } catch (error) {
        console.error('Error loading post-wedding data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newAgradecimientos, newRecuerdos, newValoraciones) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'post-wedding', 'data');
      await setDoc(docRef, {
        agradecimientos: newAgradecimientos,
        recuerdos: newRecuerdos,
        valoraciones: newValoraciones,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving post-wedding data:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleToggleEnviado = useCallback((id) => {
    const newAgradecimientos = agradecimientos.map(a => {
      if (a.id === id) {
        const enviado = !a.enviado;
        return {
          ...a,
          enviado,
          fechaEnvio: enviado ? new Date().toISOString() : null
        };
      }
      return a;
    });
    
    setAgradecimientos(newAgradecimientos);
    saveData(newAgradecimientos, recuerdos, valoraciones);
  }, [agradecimientos, recuerdos, valoraciones, saveData]);

  const handleSaveAgradecimiento = useCallback((formData) => {
    let newAgradecimientos;
    
    if (editingAgradecimiento) {
      newAgradecimientos = agradecimientos.map(a => 
        a.id === editingAgradecimiento.id ? { ...a, ...formData } : a
      );
      toast.success('Agradecimiento actualizado');
    } else {
      const newItem = {
        ...formData,
        id: `agradecimiento-${Date.now()}`,
      };
      newAgradecimientos = [...agradecimientos, newItem];
      toast.success('Agradecimiento añadido');
    }
    
    setAgradecimientos(newAgradecimientos);
    saveData(newAgradecimientos, recuerdos, valoraciones);
    setShowAgradecimientoModal(false);
    setEditingAgradecimiento(null);
  }, [agradecimientos, recuerdos, valoraciones, editingAgradecimiento, saveData]);

  const handleDeleteAgradecimiento = useCallback((id) => {
    if (!confirm('¿Eliminar este agradecimiento?')) return;
    
    const newAgradecimientos = agradecimientos.filter(a => a.id !== id);
    setAgradecimientos(newAgradecimientos);
    saveData(newAgradecimientos, recuerdos, valoraciones);
    toast.success('Agradecimiento eliminado');
  }, [agradecimientos, recuerdos, valoraciones, saveData]);

  const handleSaveRecuerdo = useCallback((formData) => {
    let newRecuerdos;
    
    if (editingRecuerdo) {
      newRecuerdos = recuerdos.map(r => 
        r.id === editingRecuerdo.id ? { ...r, ...formData } : r
      );
      toast.success('Recuerdo actualizado');
    } else {
      const newItem = {
        ...formData,
        id: `recuerdo-${Date.now()}`,
      };
      newRecuerdos = [...recuerdos, newItem];
      toast.success('Recuerdo añadido');
    }
    
    setRecuerdos(newRecuerdos);
    saveData(agradecimientos, newRecuerdos, valoraciones);
    setShowRecuerdoModal(false);
    setEditingRecuerdo(null);
  }, [recuerdos, agradecimientos, valoraciones, editingRecuerdo, saveData]);

  const handleDeleteRecuerdo = useCallback((id) => {
    if (!confirm('¿Eliminar este recuerdo?')) return;
    
    const newRecuerdos = recuerdos.filter(r => r.id !== id);
    setRecuerdos(newRecuerdos);
    saveData(agradecimientos, newRecuerdos, valoraciones);
    toast.success('Recuerdo eliminado');
  }, [recuerdos, agradecimientos, valoraciones, saveData]);

  const handleSaveValoracion = useCallback((formData) => {
    let newValoraciones;
    
    if (editingValoracion) {
      newValoraciones = valoraciones.map(v => 
        v.id === editingValoracion.id ? { ...v, ...formData } : v
      );
      toast.success('Valoración actualizada');
    } else {
      const newItem = {
        ...formData,
        id: `valoracion-${Date.now()}`,
        fecha: new Date().toISOString()
      };
      newValoraciones = [...valoraciones, newItem];
      toast.success('Valoración añadida');
    }
    
    setValoraciones(newValoraciones);
    saveData(agradecimientos, recuerdos, newValoraciones);
    setShowValoracionModal(false);
    setEditingValoracion(null);
  }, [valoraciones, agradecimientos, recuerdos, editingValoracion, saveData]);

  const handleDeleteValoracion = useCallback((id) => {
    if (!confirm('¿Eliminar esta valoración?')) return;
    
    const newValoraciones = valoraciones.filter(v => v.id !== id);
    setValoraciones(newValoraciones);
    saveData(agradecimientos, recuerdos, newValoraciones);
    toast.success('Valoración eliminada');
  }, [valoraciones, agradecimientos, recuerdos, saveData]);

  const stats = useMemo(() => {
    const enviados = agradecimientos.filter(a => a.enviado).length;
    const puntuacionMedia = valoraciones.length > 0
      ? (valoraciones.reduce((sum, v) => sum + v.puntuacion, 0) / valoraciones.length).toFixed(1)
      : 0;
    
    return {
      agradecimientos: agradecimientos.length,
      enviados,
      recuerdos: recuerdos.length,
      valoraciones: valoraciones.length,
      puntuacionMedia
    };
  }, [agradecimientos, recuerdos, valoraciones]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando post-boda...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Post-Boda</h1>
                  <p className="text-sm text-gray-600">
                    Agradecimientos, recuerdos y valoraciones
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{stats.agradecimientos}</div>
                <div className="text-xs text-gray-600">Agradecimientos</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{stats.enviados}</div>
                <div className="text-xs text-gray-600">Enviados</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-pink-600">{stats.recuerdos}</div>
                <div className="text-xs text-gray-600">Recuerdos</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{stats.valoraciones}</div>
                <div className="text-xs text-gray-600">Valoraciones</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{stats.puntuacionMedia}</div>
                <div className="text-xs text-gray-600">Puntuación media</div>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setActiveView('agradecimientos')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'agradecimientos'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <Mail className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold text-gray-800">Agradecimientos</div>
              <div className="text-xs text-gray-600">{stats.enviados}/{stats.agradecimientos}</div>
            </button>

            <button
              onClick={() => setActiveView('recuerdos')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'recuerdos'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <Image className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <div className="font-semibold text-gray-800">Recuerdos</div>
              <div className="text-xs text-gray-600">{stats.recuerdos} archivos</div>
            </button>

            <button
              onClick={() => setActiveView('valoraciones')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'valoraciones'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 bg-white hover:border-yellow-300'
              }`}
            >
              <Star className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="font-semibold text-gray-800">Valoraciones</div>
              <div className="text-xs text-gray-600">{stats.valoraciones} proveedores</div>
            </button>
          </div>

          {/* Agradecimientos View */}
          {activeView === 'agradecimientos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Agradecimientos</h2>
                <button
                  onClick={() => {
                    setEditingAgradecimiento(null);
                    setShowAgradecimientoModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir
                </button>
              </div>

              {agradecimientos.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No hay agradecimientos registrados</p>
                  <button
                    onClick={() => setShowAgradecimientoModal(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Añadir primer agradecimiento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {agradecimientos.map((agradecimiento) => (
                    <AgradecimientoCard
                      key={agradecimiento.id}
                      agradecimiento={agradecimiento}
                      onEdit={(a) => {
                        setEditingAgradecimiento(a);
                        setShowAgradecimientoModal(true);
                      }}
                      onDelete={handleDeleteAgradecimiento}
                      onToggleEnviado={handleToggleEnviado}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recuerdos View */}
          {activeView === 'recuerdos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recuerdos y Álbum</h2>
                <button
                  onClick={() => {
                    setEditingRecuerdo(null);
                    setShowRecuerdoModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir
                </button>
              </div>

              {recuerdos.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No hay recuerdos guardados</p>
                  <button
                    onClick={() => setShowRecuerdoModal(true)}
                    className="text-pink-600 hover:text-pink-700"
                  >
                    Añadir primer recuerdo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recuerdos.map((recuerdo) => (
                    <RecuerdoCard
                      key={recuerdo.id}
                      recuerdo={recuerdo}
                      onEdit={(r) => {
                        setEditingRecuerdo(r);
                        setShowRecuerdoModal(true);
                      }}
                      onDelete={handleDeleteRecuerdo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Valoraciones View */}
          {activeView === 'valoraciones' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Valoraciones de Proveedores</h2>
                <button
                  onClick={() => {
                    setEditingValoracion(null);
                    setShowValoracionModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir
                </button>
              </div>

              {valoraciones.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No hay valoraciones registradas</p>
                  <button
                    onClick={() => setShowValoracionModal(true)}
                    className="text-green-600 hover:text-green-700"
                  >
                    Añadir primera valoración
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {valoraciones.map((valoracion) => (
                    <ValoracionCard
                      key={valoracion.id}
                      valoracion={valoracion}
                      onEdit={(v) => {
                        setEditingValoracion(v);
                        setShowValoracionModal(true);
                      }}
                      onDelete={handleDeleteValoracion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showAgradecimientoModal && (
          <AgradecimientoModal
            agradecimiento={editingAgradecimiento}
            onSave={handleSaveAgradecimiento}
            onClose={() => {
              setShowAgradecimientoModal(false);
              setEditingAgradecimiento(null);
            }}
          />
        )}

        {showRecuerdoModal && (
          <RecuerdoModal
            recuerdo={editingRecuerdo}
            onSave={handleSaveRecuerdo}
            onClose={() => {
              setShowRecuerdoModal(false);
              setEditingRecuerdo(null);
            }}
          />
        )}

        {showValoracionModal && (
          <ValoracionModal
            valoracion={editingValoracion}
            onSave={handleSaveValoracion}
            onClose={() => {
              setShowValoracionModal(false);
              setEditingValoracion(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
