import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function SupplierPayments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('supplier_token');
    fetch(`${API_BASE}/api/supplier-payments/payments/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setStatus(d));
  }, []);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <button onClick={() => navigate(`/supplier/dashboard/${id}`)} className="mb-6">
        <ArrowLeft size={20} /> Volver
      </button>
      <h1 className="text-3xl font-bold mb-6">Pagos y Facturación</h1>
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
        <CreditCard size={32} className="mb-4" />
        <p>Estado: {status?.paymentsEnabled ? 'Activo' : 'No configurado'}</p>
      </div>
    </div>
  );
}
