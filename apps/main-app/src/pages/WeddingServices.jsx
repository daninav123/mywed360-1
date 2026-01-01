// pages/WeddingServices.jsx
// Página del dashboard de servicios de la boda

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import WeddingServicesOverview from '../components/wedding/WeddingServicesOverview';
import Button from '../components/ui/Button';
import { Plus } from 'lucide-react';
export default function WeddingServices() {
  const navigate = useNavigate();
  
  const handleSearch = (service) => {
    // Navegar a la página de proveedores con el servicio pre-seleccionado
    navigate(`/proveedores?service=${encodeURIComponent(service)}`);
  };
  
  return (
    <div className="p-6">
      <div className="mb-4">
        <Button 
          onClick={() => navigate('/proveedores')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Buscar proveedores
        </Button>
      </div>
      <WeddingServicesOverview onSearch={handleSearch} />
    </div>
  );
}
