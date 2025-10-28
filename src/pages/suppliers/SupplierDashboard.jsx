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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/supplier/login')}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {supplier.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {supplier.category} • {supplier.location?.city}
              </p>
              {supplier.registered && (
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  ✓ Verificado
                </span>
              )}
            </div>
            
            <div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Edit size={18} />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
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
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} />
                Estadísticas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Eye size={20} />
                    <span className="font-medium">Vistas</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {supplier.metrics?.views || 0}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Veces que apareciste en búsquedas
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <MousePointer size={20} />
                    <span className="font-medium">Clics</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {supplier.metrics?.clicks || 0}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Veces que visitaron tu perfil
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Mail size={20} />
                    <span className="font-medium">Contactos</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {supplier.metrics?.conversions || 0}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Parejas que te contactaron
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información del perfil */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Perfil
              </h2>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del negocio
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rango de precio
                    </label>
                    <select
                      value={formData.priceRange}
                      onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="€">€ - Económico</option>
                      <option value="€€">€€ - Medio</option>
                      <option value="€€€">€€€ - Premium</option>
                      <option value="€€€€">€€€€ - Lujo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@tuusuario"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descripción</p>
                    <p className="mt-1 text-gray-900">
                      {supplier.business?.description || 'Sin descripción'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rango de precio</p>
                    <p className="mt-1 text-gray-900">
                      {supplier.business?.priceRange || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="mt-1 text-gray-900">
                      {supplier.contact?.phone || 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sitio web</p>
                    <p className="mt-1 text-gray-900">
                      {supplier.contact?.website ? (
                        <a href={supplier.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {supplier.contact.website}
                        </a>
                      ) : 'No especificado'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Instagram</p>
                    <p className="mt-1 text-gray-900">
                      {supplier.contact?.instagram || 'No especificado'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Info adicional */}
          <div className="space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Estado del perfil</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registrado:</span>
                  <span className={supplier.registered ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {supplier.registered ? 'Sí ✓' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={supplier.status === 'active' ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Score:</span>
                  <span className="text-blue-600 font-medium">
                    {supplier.metrics?.matchScore || 0}/100
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Consejo</h4>
              <p className="text-sm text-blue-700">
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
