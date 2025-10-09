import React, { useState } from 'react';

import CompareSelectedModal from '../../components/proveedores/CompareSelectedModal';

const SAMPLE_PROVIDERS = [
  {
    id: 'p1',
    name: 'Fotografia Naturaleza Viva',
    service: 'Fotografia',
    status: 'Pendiente',
    priceRange: '1200 EUR - 2500 EUR',
    rating: 45,
    ratingCount: 10,
    location: 'Madrid',
    email: 'foto@nviva.com',
    phone: '+34 600 000 001',
    aiMatch: 88,
  },
  {
    id: 'p2',
    name: 'Catering Delicious Moments',
    service: 'Catering',
    status: 'Contactado',
    priceRange: '70 - 120 EUR por persona',
    rating: 0,
    ratingCount: 0,
    location: 'Barcelona',
    email: 'hola@delicious.es',
    phone: '+34 600 000 002',
    aiMatch: 73,
  },
  {
    id: 'p3',
    name: 'Flores del Jardin',
    service: 'Flores',
    status: 'Pendiente',
    priceRange: '500 - 1500 EUR',
    rating: 20,
    ratingCount: 5,
    location: 'Sevilla',
    email: 'contacto@floresjardin.es',
    phone: '+34 600 000 003',
    match: 81,
  },
];

export default function ProveedoresCompareTest() {
  const [providers, setProviders] = useState(SAMPLE_PROVIDERS);
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Test Comparativa Proveedores</h1>
      <CompareSelectedModal
        open
        onClose={() => {}}
        providers={providers}
        onRemoveFromSelection={(id) => setProviders((prev) => prev.filter((p) => p.id !== id))}
        createGroupOverride={async () => ({ success: true, id: 'g-test' })}
        updateProviderOverride={async () => ({})}
      />
    </div>
  );
}
