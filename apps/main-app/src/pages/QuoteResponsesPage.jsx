/**
 * 📊 Página principal para ver presupuestos recibidos por email
 */

import React, { useState } from 'react';
import { Sparkles, Mail } from 'lucide-react';
import QuoteResponsesList from '../components/quotes/QuoteResponsesList';
import QuoteResponseDetail from '../components/quotes/QuoteResponseDetail';
import { useAuth } from '../hooks/useAuth';
export default function QuoteResponsesPage() {
  const { user } = useAuth();
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
  };

  const handleCloseDetail = () => {
    setSelectedQuote(null);
  };

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedQuote(null);
  };

  return (
    <div className="min-h-screen " style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3  bg-opacity-20 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                Presupuestos Recibidos
              </h1>
              <p className="text-purple-100 mt-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Analizados automáticamente con Inteligencia Artificial
              </p>
            </div>
          </div>
          <p className="text-purple-100 max-w-2xl">
            Los proveedores responden directamente por email y nuestro sistema analiza 
            automáticamente los presupuestos, extrayendo precios, servicios y condiciones.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuoteResponsesList
          key={refreshKey}
          weddingId={user?.weddingId}
          onSelectQuote={handleSelectQuote}
        />
      </div>

      {/* Modal de detalle */}
      {selectedQuote && (
        <QuoteResponseDetail
          quote={selectedQuote}
          onClose={handleCloseDetail}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
