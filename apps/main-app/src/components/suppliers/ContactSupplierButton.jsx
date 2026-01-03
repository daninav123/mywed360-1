import React, { useState } from 'react';
import { Send } from 'lucide-react';
import ContactSupplierModal from './ContactSupplierModal';

/**
 * Botón para contactar a un proveedor
 * Abre el modal de solicitud de presupuesto
 */
export default function ContactSupplierButton({ supplier, variant = 'primary' }) {
  const [showModal, setShowModal] = useState(false);

  const buttonStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600',
    outline: 'bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-600',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-lg 
          font-medium transition-colors
          ${buttonStyles[variant]}
        `}
      >
        <Send size={20} />
        Solicitar Presupuesto
      </button>

      {showModal && (
        <ContactSupplierModal supplier={supplier} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
