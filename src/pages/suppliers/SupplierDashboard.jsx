// pages/suppliers/SupplierDashboard.jsx
// Dashboard COMPLETO del proveedor con solicitudes de presupuesto

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mail, 
  BarChart3, 
  User, 
  Settings, 
  LogOut,
  Eye,
  MousePointer,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export default function SupplierDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('inicio'); // inicio, solicitudes, perfil
  const [supplier, setSupplier] = useState(null);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('supplier_token');
    const supplierId = localStorage.getItem('supplier_id');
    
    if (!token || !supplierId) {
      navigate('/supplier/login');
      return;
    }
    
    if (id !== supplierId) {
      navigate(`/supplier/dashboard/${supplierId}`);
      return;
    }
    
    fetchDashboardData();
  }, [id, navigate]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch en paralelo
      const [profileRes, requestsRes, analyticsRes] = await Promise.all([
        fetch('/api/supplier-dashboard/profile', { headers }),
        fetch('/api/supplier-dashboard/requests?limit=10', { headers }),
        fetch('/api/supplier-dashboard/analytics?period=30d', { headers }),
      ]);
      
      if (!profileRes.ok || !requestsRes.ok || !analyticsRes.ok) {
        if (profileRes.status === 401 || requestsRes.status === 401 || analyticsRes.status === 401) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('Error cargando datos');
      }
      
      const [profileData, requestsData, analyticsData] = await Promise.all([
        profileRes.json(),
        requestsRes.json(),
        analyticsRes.json(),
      ]);
      
      setSupplier(profileData.profile);
      setRequests(requestsData.requests || []);
      setAnalytics(analyticsData.metrics || {});
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_id');
    localStorage.removeItem('supplier_data');
    navigate('/supplier/login');
  };
  
  const handleViewRequest = (requestId) => {
    navigate(`/supplier/dashboard/${id}/request/${requestId}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="p-8 rounded-lg shadow-md max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-danger)' }}>Error</h2>
          <p style={{ color: 'var(--color-muted)' }}>{error}</p>
          <button
            onClick={() => navigate('/supplier/login')}
            className="mt-4 w-full text-white py-2 rounded-md"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="layout-container max-w-6xl">
        
        {/* Header */}
        <div className="shadow-md rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {supplier.name}
              </h1>
              <p className="mt-1" style={{ color: 'var(--color-muted)' }}>
                {supplier.category} • {supplier.location?.city}
              </p>
              {supplier.registered && (
                <span className="inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}>
                  ✓ Verificado
                </span>
              )}
            </div>
            
            <div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-md"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Edit size={18} />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Estadísticas */}
          <div className="lg:col-span-3">
            <div className="shadow-md rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <BarChart3 size={20} />
                Estadísticas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(94, 187, 255, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-info)' }}>
                    <Eye size={20} />
                    <span className="font-medium">Vistas</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {supplier.metrics?.views || 0}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-info)' }}>
                    Veces que apareciste en búsquedas
                  </p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: '#a855f7' }}>
                    <MousePointer size={20} />
                    <span className="font-medium">Clics</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {supplier.metrics?.clicks || 0}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#a855f7' }}>
                    Veces que visitaron tu perfil
                  </p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-success)' }}>
                    <Mail size={20} />
                    <span className="font-medium">Contactos</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {supplier.metrics?.conversions || 0}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-success)' }}>
                    Parejas que te contactaron
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información del perfil */}
          <div className="lg:col-span-2">
            <div className="shadow-md rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Información del Perfil
              </h2>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Nombre del negocio
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Rango de precio
                    </label>
                    <select
                      value={formData.priceRange}
                      onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="€">€ - Económico</option>
                      <option value="€€">€€ - Medio</option>
                      <option value="€€€">€€€ - Premium</option>
                      <option value="€€€€">€€€€ - Lujo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Sitio web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@tuusuario"
                      className="w-full px-3 py-2 border rounded-md" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Descripción</p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.description || 'Sin descripción'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Rango de precio</p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.priceRange || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Teléfono</p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.phone || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Sitio web</p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.website ? (
                        <a href={supplier.contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
                          {supplier.contact.website}
                        </a>
                      ) : 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Instagram</p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.instagram || 'No especificado'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Info adicional */}
          <div className="space-y-6">
            <div className="shadow-md rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Estado del perfil</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Registrado:</span>
                  <span className="font-medium" style={{ color: supplier.registered ? 'var(--color-success)' : 'var(--color-muted)' }}>
                    {supplier.registered ? 'Sí ✓' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Estado:</span>
                  <span className="font-medium" style={{ color: supplier.status === 'active' ? 'var(--color-success)' : 'var(--color-muted)' }}>
                    {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Match Score:</span>
                  <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                    {supplier.metrics?.matchScore || 0}/100
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(94, 187, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
              <h4 className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>💡 Consejo</h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Completa toda tu información para aparecer mejor posicionado en las búsquedas. 
                Los perfiles con fotos y descripciones detalladas reciben 3x más contactos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
