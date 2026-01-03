import React, { useState } from 'react';
import { Package } from 'lucide-react';
import AdminSpecsManager from './admin/AdminSpecsManager';
import SupplierOptionsReview from './SupplierOptionsReview';

const SupplierCatalog = () => {
  const [activeTab, setActiveTab] = useState('specs');

  const tabs = [
    { id: 'specs', label: 'Especificaciones Base', icon: '⚙️' },
    { id: 'crowdsourcing', label: 'Sugerencias Crowdsourcing', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Catálogo de Proveedores
            </h1>
          </div>
          <p className="text-gray-600">
            Gestiona las especificaciones predefinidas y revisa las sugerencias de usuarios
          </p>
        </div>

        {/* Pestañas */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido de pestañas */}
        <div>
          {activeTab === 'specs' && <AdminSpecsManager />}
          {activeTab === 'crowdsourcing' && <SupplierOptionsReview />}
        </div>
      </div>
    </div>
  );
};

export default SupplierCatalog;
