import { UploadCloud, Check, X } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import useTranslations from '../../hooks/useTranslations';

import { Button, Input } from '../ui';

/**
 * VERSION LIMPIA del componente de importación de contactos.
 * Utiliza la Contact Picker API y permite revisar/editar los contactos antes de importarlos.
 */
const ContactsImporterFixed = ({ onImported }) => {
  const { t } = useTranslations();
  const [step, setStep] = useState('form'); // 'form' | 'review'
  const [table, setTable] = useState('');
  const [rows, setRows] = useState([]);
  const fileInputRef = useRef(null);

  const updateField = (idx, key, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  const pickContacts = async () => {
    if (!('contacts' in navigator) || !navigator.contacts?.select) {
      alert(
        t('guests.contacts.unsupported', {
          defaultValue: 'Este dispositivo/navegador no soporta la selección de contactos.',
        })
      );
      return;
    }

    try {
      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], {
        multiple: true,
      });
      if (!contacts.length) return;

      const now = Date.now();
      const imported = contacts.map((c, i) => ({
        id: `imported-${now}-${i}`,
        name: c.name?.[0] || t('guests.contacts.noName', { defaultValue: 'Sin nombre' }),
        email: c.email?.[0] || '',
        phone: c.tel?.[0] || '',
        address: '',
        companion: 0,
        table: table || '',
        response: t('guests.status.pending', { defaultValue: 'Pendiente' }),
        status: 'pending',
        dietaryRestrictions: '',
        notes: t('guests.contacts.importedFromPicker', {
          defaultValue: 'Importado desde contactos',
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setRows(imported);
      setStep('review');
    } catch (err) {
      console.error(err);
      alert(
        t('guests.contacts.errorAccess', {
          defaultValue: 'Error al acceder a los contactos.',
        })
      );
    }
  };

  // Importación desde CSV (opcional)
  const handleImportCSVClick = () => fileInputRef.current?.click();

  const parseCSV = (text) => {
    // Parser básico para CSV sencillo (campos separados por coma, comillas opcionales)
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
    if (lines.length === 0) return [];
    const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const headers = rawHeaders.map((h) => h.toLowerCase());

    const mapKey = (h) => {
      if (h.includes('name') || h.includes('nombre')) return 'name';
      if (h.includes('mail') || h === 'email') return 'email';
      if (h.includes('tel') || h.includes('phone') || h.includes('telefono')) return 'phone';
      if (h.includes('mesa') || h === 'table') return 'table';
      if (h.includes('acompan') || h.includes('compan')) return 'companion';
      if (h.includes('diet') || h.includes('restric')) return 'dietaryRestrictions';
      if (h.includes('nota') || h === 'notes') return 'notes';
      if (h.includes('group')) return 'companionGroupId';
      return h; // sin mapa, mantener
    };

    const mappedHeaders = headers.map(mapKey);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Split simple por comas (soporta comillas básicas)
      const cols = [];
      let cur = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());

      if (cols.every((v) => v === '')) continue;
      const obj = {};
      mappedHeaders.forEach((key, idx) => {
        const val = (cols[idx] || '').replace(/^"|"$/g, '');
        obj[key] = val;
      });
      data.push(obj);
    }
    return data;
  };

  const handleCSVSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (!parsed.length) {
        alert(
          t('guests.contacts.csvEmpty', {
            defaultValue: 'El CSV no contiene filas válidas',
          })
        );
        return;
      }
      // Normalizar y preparar preview
      const now = Date.now();
      const imported = parsed.map((r, i) => ({
        id: `csv-${now}-${i}`,
        name: r.name || 'Sin nombre',
        email: r.email || '',
        phone: r.phone || '',
        address: r.address || '',
        companion: parseInt(r.companion, 10) || 0,
        table: r.table || table || '',
        response: t('guests.status.pending', { defaultValue: 'Pendiente' }),
        status: 'pending',
        dietaryRestrictions: r.dietaryRestrictions || '',
        notes:
          r.notes || t('guests.contacts.importedFromCsv', { defaultValue: 'Importado desde CSV' }),
        companionGroupId: r.companionGroupId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setRows(imported);
      setStep('review');
    } catch (err) {
      console.error('Error leyendo CSV:', err);
      alert(
        t('guests.contacts.csvReadError', {
          defaultValue: 'No se pudo leer el archivo CSV',
        })
      );
    } finally {
      e.target.value = '';
    }
  };

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1">{t('guests.fields.name', { defaultValue: 'Nombre' })}</th>
              <th className="border px-2 py-1">{t('guests.fields.email', { defaultValue: 'Email' })}</th>
              <th className="border px-2 py-1">{t('guests.fields.phone', { defaultValue: 'Teléfono' })}</th>
              <th className="border px-2 py-1">{t('guests.fields.table', { defaultValue: 'Mesa' })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, idx) => (
              <tr key={g.id}>
                <td className="border px-2 py-1">
                  <input
                    value={g.name}
                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                    className="w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    value={g.email}
                    onChange={(e) => updateField(idx, 'email', e.target.value)}
                    className="w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    value={g.phone}
                    onChange={(e) => updateField(idx, 'phone', e.target.value)}
                    className="w-full"
                  />
                </td>
                <td className="border px-2 py-1 w-24 text-center">
                  <input
                    value={g.table}
                    onChange={(e) => updateField(idx, 'table', e.target.value)}
                    className="w-full text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setStep('form')} className="flex items-center">
            <X size={16} className="mr-1" />
            {t('app.back', { defaultValue: 'Volver' })}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onImported?.(rows)}
            className="flex items-center"
          >
            <Check size={16} className="mr-1" />
            {t('guests.contacts.importCount', { defaultValue: 'Importar {{count}}', count: rows.length })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        label={t('guests.fields.tableOptional', { defaultValue: 'Mesa (opcional)' })}
        value={table}
        onChange={(e) => setTable(e.target.value)}
        placeholder={t('guests.examples.table', { defaultValue: 'Ej. 5' })}
      />
      <Button variant="secondary" onClick={pickContacts} className="flex items-center space-x-2">
        <UploadCloud size={16} />
        <span>{t('guests.contacts.selectContacts', { defaultValue: 'Seleccionar contactos' })}</span>
      </Button>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVSelected}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={handleImportCSVClick}
          className="flex items-center space-x-2"
        >
          <UploadCloud size={16} />
          <span>{t('guests.contacts.importCsv', { defaultValue: 'Importar CSV' })}</span>
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          {t('guests.contacts.supportedColumns', {
            defaultValue:
              'Columnas soportadas: name, email, phone, table, companion, dietaryRestrictions, notes, companionGroupId',
          })}
        </p>
      </div>
    </div>
  );
};

ContactsImporterFixed.propTypes = { onImported: PropTypes.func };

export default ContactsImporterFixed;
