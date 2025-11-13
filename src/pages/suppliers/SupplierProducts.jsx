import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Tag, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function SupplierProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    basePrice: '',
    unit: 'servicio',
    features: [],
    isPackage: false,
    packageItems: [],
  });

  // Cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      // console.log('[SupplierProducts] Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      // console.log('[SupplierProducts] Supplier ID:', supplierId);

      if (!token || token === 'null' || token === 'undefined') {
        // console.error('[SupplierProducts] No hay token válido, redirigiendo a login');
        navigate('/supplier/login');
        return;
      }

      if (!supplierId || supplierId === 'null' || supplierId === 'undefined') {
        // console.error('[SupplierProducts] No hay supplier ID válido, redirigiendo a login');
        navigate('/supplier/login');
        return;
      }

      // console.log(
        '[SupplierProducts] Haciendo petición a:',
        `/api/suppliers/${supplierId}/products`
      );

      const response = await fetch(`/api/suppliers/${supplierId}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-supplier-id': supplierId,
        },
      });

      // console.log('[SupplierProducts] Respuesta status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // console.warn('[SupplierProducts] 401 Unauthorized, limpiando sesión');
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('Error cargando productos');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Abrir modal para crear/editar
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category || 'general',
        basePrice: product.basePrice,
        unit: product.unit || 'servicio',
        features: product.features || [],
        isPackage: product.isPackage || false,
        packageItems: product.packageItems || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: 'general',
        basePrice: '',
        unit: 'servicio',
        features: [],
        isPackage: false,
        packageItems: [],
      });
    }
    setShowModal(true);
  };

  // Guardar producto
  const handleSave = async () => {
    if (!formData.name || !formData.basePrice) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      const url = editingProduct
        ? `/api/suppliers/${supplierId}/products/${editingProduct.id}`
        : `/api/suppliers/${supplierId}/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-supplier-id': supplierId,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error guardando producto');

      toast.success(editingProduct ? 'Producto actualizado' : 'Producto agregado');
      setShowModal(false);
      loadProducts();
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error guardando producto');
    }
  };

  // Eliminar producto
  const handleDelete = async (productId) => {
    if (!confirm('¿Eliminar este producto del portfolio?')) return;

    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      const response = await fetch(`/api/suppliers/${supplierId}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-supplier-id': supplierId,
        },
      });

      if (!response.ok) throw new Error('Error eliminando producto');

      toast.success('Producto eliminado');
      loadProducts();
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error eliminando producto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4" />
          <p className="text-muted">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="layout-container py-8">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate('/supplier/dashboard/' + localStorage.getItem('supplier_id'))
                }
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-body">Mi Portfolio de Servicios</h1>
                <p className="text-sm text-muted">
                  Gestiona tus productos y servicios para cotizaciones rápidas
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus size={18} className="mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </Card>

        {/* Lista de productos */}
        {products.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-muted" />
              <p className="text-lg font-semibold text-body mb-2">
                No tienes productos en tu portfolio
              </p>
              <p className="text-sm text-muted mb-4">
                Agrega tus servicios para crear cotizaciones más rápido
              </p>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <Plus size={18} className="mr-2" />
                Agregar Primer Producto
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {product.isPackage && <Tag size={16} className="text-primary" />}
                      <h3 className="font-semibold text-body">{product.name}</h3>
                    </div>
                    <p className="text-sm text-muted line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-1 hover:bg-app rounded transition-colors"
                    >
                      <Edit size={16} className="text-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-soft">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-success" />
                    <span className="font-bold text-lg text-body">{product.basePrice}€</span>
                    <span className="text-xs text-muted">/ {product.unit}</span>
                  </div>
                  {product.category && (
                    <span className="text-xs px-2 py-1 bg-app rounded-full text-muted">
                      {product.category}
                    </span>
                  )}
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-soft">
                    <ul className="text-xs text-muted space-y-1">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                      {product.features.length > 3 && (
                        <li className="text-primary">+ {product.features.length - 3} más...</li>
                      )}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Modal de crear/editar */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <Card
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-body mb-4">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-body mb-2">
                    Nombre del Servicio/Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
                    placeholder="Ej: DJ + Equipo de sonido"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-body mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary resize-none"
                    placeholder="Describe tu servicio..."
                  />
                </div>

                {/* Precio y Unidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      Precio Base *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">Unidad</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
                    >
                      <option value="servicio">Servicio</option>
                      <option value="hora">Hora</option>
                      <option value="día">Día</option>
                      <option value="persona">Persona</option>
                      <option value="unidad">Unidad</option>
                    </select>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-body mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
                  >
                    <option value="general">General</option>
                    <option value="basico">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-soft">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleSave} className="flex-1">
                    {editingProduct ? 'Guardar Cambios' : 'Agregar Producto'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
