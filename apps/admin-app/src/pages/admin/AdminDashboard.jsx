import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useTranslation(['admin']);
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t('admin.dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-2">👥 Usuarios</h2>
          <p className="text-gray-600">Gestión de usuarios</p>
        </div>
        
        <div 
          onClick={() => navigate('/admin/metrics')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-2">📊 Métricas</h2>
          <p className="text-gray-600">Análisis y estadísticas</p>
        </div>
        
        <div 
          onClick={() => navigate('/admin/suppliers')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-2">🏪 Proveedores</h2>
          <p className="text-gray-600">Gestión de proveedores</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
