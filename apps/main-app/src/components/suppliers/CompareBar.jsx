import React from 'react';
import { Link } from 'react-router-dom';
import { X, GitCompare, ChevronRight } from 'lucide-react';
import { useSupplierCompare } from '../../contexts/SupplierCompareContext';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompareList } = useSupplierCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-2xl border-t-4 border-blue-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Lado izquierdo: Proveedores seleccionados */}
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <GitCompare size={20} />
              <span className="font-semibold">
                {compareList.length} {compareList.length === 1 ? 'proveedor' : 'proveedores'} para
                comparar
              </span>
            </div>

            <div className="flex items-center gap-2">
              {compareList.map((supplier) => (
                <div
                  key={supplier.id || supplier.slug}
                  className="flex items-center gap-2 bg-blue-700 rounded-lg px-3 py-1.5"
                >
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {supplier.name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(supplier.id || supplier.slug)}
                    className="hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    title="Quitar"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lado derecho: Acciones */}
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompareList}
              className="text-sm hover:underline whitespace-nowrap"
            >
              Limpiar todo
            </button>

            {compareList.length >= 2 ? (
              <Link
                to="/proveedores/comparar"
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Comparar ahora
                <ChevronRight size={16} />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold opacity-50 cursor-not-allowed whitespace-nowrap"
                title="Selecciona al menos 2 proveedores"
              >
                Comparar ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
