import React, { useMemo } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';

function toCSV(rows) {
  const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const headers = [
    'Nombre',
    'Servicio',
    'Estado',
    'Precio',
    'Rating',
    'Ubicación',
    'Email',
    'Teléfono',
  ];
  const csv = [headers.join(',')]
    .concat(
      rows.map((r) =>
        [
          r.name,
          r.service,
          r.status,
          r.priceRange,
          r.ratingCount > 0 ? (r.rating / r.ratingCount).toFixed(1) : '',
          r.location || r.address || '',
          r.email || '',
          r.phone || '',
        ]
          .map(esc)
          .join(',')
      )
    )
    .join('\n');
  return csv;
}

export default function CompareSelectedModal({ open, onClose, providers = [] }) {
  const rows = useMemo(() => providers, [providers]);
  const exportCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparativa_proveedores.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Modal open={open} onClose={onClose} title={`Comparar (${rows.length})`}>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Servicio</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Precio</th>
                <th className="text-left p-2">Rating</th>
                <th className="text-left p-2">Ubicación</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2">{r.service}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.priceRange || '-'}</td>
                  <td className="p-2">
                    {r.ratingCount > 0 ? (r.rating / r.ratingCount).toFixed(1) : '-'}
                  </td>
                  <td className="p-2">{r.location || r.address || '-'}</td>
                  <td className="p-2">{r.email || '-'}</td>
                  <td className="p-2">{r.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}
