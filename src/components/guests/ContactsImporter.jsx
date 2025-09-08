import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { UploadCloud, Check, X } from 'lucide-react';
import { Button, Input } from '../ui';

/**
 * VERSION LIMPIA del componente de importación de contactos.
 * Utiliza la Contact Picker API y permite revisar/editar los contactos antes de importarlos.
 */
const ContactsImporterFixed = ({ onImported }) => {
  const [step, setStep] = useState('form'); // 'form' | 'review'
  const [table, setTable] = useState('');
  const [rows, setRows] = useState([]);

  const updateField = (idx, key, value) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  const pickContacts = async () => {
    if (!('contacts' in navigator) || !navigator.contacts?.select) {
      alert('Este dispositivo/navegador no soporta la selección de contactos.');
      return;
    }

    try {
      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
      if (!contacts.length) return;

      const now = Date.now();
      const imported = contacts.map((c, i) => ({
        id: `imported-${now}-${i}`,
        name: c.name?.[0] || 'Sin nombre',
        email: c.email?.[0] || '',
        phone: c.tel?.[0] || '',
        address: '',
        companion: 0,
        table: table || '',
        response: 'Pendiente',
        status: 'pending',
        dietaryRestrictions: '',
        notes: 'Importado desde contactos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setRows(imported);
      setStep('review');
    } catch (err) {
      console.error(err);
      alert('Error al acceder a los contactos.');
    }
  };

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Teléfono</th>
              <th className="border px-2 py-1">Mesa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, idx) => (
              <tr key={g.id}>
                <td className="border px-2 py-1">
                  <input value={g.name} onChange={e => updateField(idx, 'name', e.target.value)} className="w-full" />
                </td>
                <td className="border px-2 py-1">
                  <input value={g.email} onChange={e => updateField(idx, 'email', e.target.value)} className="w-full" />
                </td>
                <td className="border px-2 py-1">
                  <input value={g.phone} onChange={e => updateField(idx, 'phone', e.target.value)} className="w-full" />
                </td>
                <td className="border px-2 py-1 w-24 text-center">
                  <input value={g.table} onChange={e => updateField(idx, 'table', e.target.value)} className="w-full text-center" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setStep('form')} className="flex items-center">
            <X size={16} className="mr-1" />Volver
          </Button>
          <Button variant="secondary" onClick={() => onImported?.(rows)} className="flex items-center">
            <Check size={16} className="mr-1" />Importar {rows.length}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input label="Mesa (opcional)" value={table} onChange={e => setTable(e.target.value)} placeholder="Ej. 5" />
      <Button variant="secondary" onClick={pickContacts} className="flex items-center space-x-2">
        <UploadCloud size={16} />
        <span>Seleccionar contactos</span>
      </Button>
    </div>
  );
};

ContactsImporterFixed.propTypes = { onImported: PropTypes.func };

export default ContactsImporterFixed;
