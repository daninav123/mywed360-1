import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  loadSupplierSpecs,
  saveSupplierSpecs,
  resetSupplierSpecs,
} from '../../services/supplierSpecsService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Categorías principales de proveedores
const SUPPLIER_CATEGORIES = [
  { id: 'fotografia', name: 'Fotografía' },
  { id: 'video', name: 'Vídeo' },
  { id: 'musica', name: 'Música' },
  { id: 'dj', name: 'DJ' },
  { id: 'catering', name: 'Catering' },
  { id: 'lugares', name: 'Lugares' },
  { id: 'restaurantes', name: 'Restaurantes' },
  { id: 'flores-decoracion', name: 'Flores y Decoración' },
  { id: 'decoracion', name: 'Decoración' },
  { id: 'vestidos-trajes', name: 'Vestidos y Trajes' },
  { id: 'belleza', name: 'Belleza' },
  { id: 'joyeria', name: 'Joyería' },
  { id: 'tartas', name: 'Tartas' },
  { id: 'invitaciones', name: 'Invitaciones' },
  { id: 'detalles', name: 'Detalles' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'animacion', name: 'Animación' },
  { id: 'photocall', name: 'Photocall' },
  { id: 'iluminacion', name: 'Iluminación' },
  { id: 'fuegos-artificiales', name: 'Fuegos Artificiales' },
  { id: 'organizacion', name: 'Organización' },
  { id: 'iglesias', name: 'Iglesias' },
  { id: 'ceremonia', name: 'Ceremonia Civil' },
  { id: 'alojamiento', name: 'Alojamiento' },
  { id: 'bar-bebidas', name: 'Bar y Bebidas' },
  { id: 'carpas-mobiliario', name: 'Carpas y Mobiliario' },
  { id: 'candy-bar', name: 'Candy Bar' },
  { id: 'food-trucks', name: 'Food Trucks' },
  { id: 'seguridad-staff', name: 'Seguridad y Staff' },
  { id: 'parking', name: 'Parking' },
  { id: 'cuidado-ninos', name: 'Cuidado de Niños' },
  { id: 'spa-tratamientos', name: 'Spa y Tratamientos' },
  { id: 'brunch-post-boda', name: 'Brunch Post-boda' },
  { id: 'tecnologia-streaming', name: 'Tecnología y Streaming' },
  { id: 'limpieza', name: 'Limpieza' },
  { id: 'luna-de-miel', name: 'Luna de Miel' },
  { id: 'otros', name: 'Otros' },
];

/**
 * Panel de administración para gestionar especificaciones de proveedores
 * Permite añadir, editar y eliminar campos dinámicamente
 */
export default function AdminSpecsManager() {
  const { user } = useAuth();
  const [specs, setSpecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('fotografia');
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({ name: '', type: 'boolean', defaultValue: false });
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const loadedSpecs = await loadSupplierSpecs();
      setSpecs(loadedSpecs);
    } catch (error) {
      toast.error('Error cargando especificaciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveSupplierSpecs(specs, user.uid);
      setDynamicSpecs(specs);
      toast.success('✅ Especificaciones guardadas');
    } catch (error) {
      toast.error('Error guardando especificaciones');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Restaurar todas las especificaciones a valores por defecto? Esto no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);
      await resetSupplierSpecs(user.uid);
      await loadSpecs();
      toast.success('✅ Especificaciones restauradas a valores por defecto');
    } catch (error) {
      toast.error('Error restaurando especificaciones');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async () => {
    if (!newField.name.trim()) {
      toast.error('El nombre del campo es obligatorio');
      return;
    }

    try {
      const updatedSpecs = { ...specs };
      if (!updatedSpecs[selectedCategory].specs) {
        updatedSpecs[selectedCategory].specs = {};
      }

      updatedSpecs[selectedCategory].specs[newField.name] = newField.defaultValue;
      setSpecs(updatedSpecs);
      
      setNewField({ name: '', type: 'boolean', defaultValue: false });
      setShowAddField(false);
      
      toast.success(`✅ Campo "${newField.name}" añadido`);
    } catch (error) {
      toast.error('Error añadiendo campo');
      console.error(error);
    }
  };

  const handleRemoveField = (fieldName) => {
    if (!window.confirm(`¿Eliminar el campo "${fieldName}"?`)) {
      return;
    }

    try {
      const updatedSpecs = { ...specs };
      delete updatedSpecs[selectedCategory].specs[fieldName];
      setSpecs(updatedSpecs);
      toast.success(`✅ Campo "${fieldName}" eliminado`);
    } catch (error) {
      toast.error('Error eliminando campo');
      console.error(error);
    }
  };

  const handleFieldValueChange = (fieldName, value) => {
    const updatedSpecs = { ...specs };
    updatedSpecs[selectedCategory].specs[fieldName] = value;
    setSpecs(updatedSpecs);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Cargando especificaciones...</p>
      </div>
    );
  }

  const selectedCat = SUPPLIER_CATEGORIES.find(c => c.id === selectedCategory);
  const categorySpecs = specs[selectedCategory]?.specs || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Gestión de Especificaciones</h1>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza los campos de especificaciones para cada categoría de proveedor
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<RotateCcw size={16} />}
            onClick={handleReset}
            disabled={saving}
          >
            Restaurar defaults
          </Button>
          <Button
            leftIcon={<Save size={16} />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Info banner */}
      {specs._customized && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Usando especificaciones personalizadas
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Última actualización: {new Date(specs._lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Selector de categorías */}
        <div className="col-span-3">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Categorías</h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {SUPPLIER_CATEGORIES.map(cat => {
                const fieldCount = Object.keys(specs[cat.id]?.specs || {}).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-purple-100 text-purple-900 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-xs text-gray-500">{fieldCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Editor de campos */}
        <div className="col-span-9">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCat?.name}</h2>
                <p className="text-sm text-gray-600">{selectedCat?.description}</p>
              </div>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={() => setShowAddField(true)}
                size="sm"
              >
                Añadir campo
              </Button>
            </div>

            {/* Formulario añadir campo */}
            {showAddField && (
              <Card className="mb-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Nuevo campo</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nombre del campo (ej: catering)"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={newField.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      let defaultValue = false;
                      if (type === 'number') defaultValue = 0;
                      if (type === 'string') defaultValue = '';
                      if (type === 'array') defaultValue = [];
                      setNewField({ ...newField, type, defaultValue });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="boolean">Boolean (sí/no)</option>
                    <option value="number">Number (número)</option>
                    <option value="string">String (texto)</option>
                    <option value="array">Array (lista)</option>
                  </select>
                  <div className="flex gap-2">
                    <Button onClick={handleAddField} size="sm" leftIcon={<Check size={16} />}>
                      Añadir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddField(false)}
                      size="sm"
                      leftIcon={<X size={16} />}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Lista de campos */}
            <div className="space-y-2">
              {Object.keys(categorySpecs).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay campos definidos. Añade el primero.
                </p>
              ) : (
                Object.entries(categorySpecs).map(([fieldName, fieldValue]) => (
                  <div
                    key={fieldName}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{fieldName}</p>
                      <p className="text-xs text-gray-500">
                        Tipo: {typeof fieldValue === 'boolean' ? 'Boolean' :
                              typeof fieldValue === 'number' ? 'Number' :
                              Array.isArray(fieldValue) ? 'Array' : 'String'} 
                        {' · '}
                        Valor por defecto: {JSON.stringify(fieldValue)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveField(fieldName)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
