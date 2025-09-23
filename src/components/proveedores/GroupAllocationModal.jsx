import React, { useMemo, useState } from 'react';

import useGroupAllocations from '../../hooks/useGroupAllocations';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function GroupAllocationModal({ open, onClose, group, providers = [] }) {
  const { items, addAllocation, updateAllocation, removeAllocation } = useGroupAllocations(
    group?.id
  );
  const { updateGroup } = useSupplierGroups();
  const [editingBudget, setEditingBudget] = useState(false);
  const total = useMemo(() => items.reduce((s, i) => s + (Number(i.amount) || 0), 0), [items]);

  const handleAdd = async () => {
    await addAllocation({
      part: 'Nueva partida',
      supplierId: providers[0]?.id || '',
      amount: 0,
      notes: '',
    });
  };

  const targetBudget = Number(group?.targetBudget || 0);
  const exceeded = targetBudget > 0 && total > targetBudget;

  return (
    <Modal open={open} onClose={onClose} title="Dividir alcance del grupo">
      <div className="space-y-4">
        <div
          className={`p-3 rounded border ${exceeded ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total asignado</p>
              <p className="text-xl font-semibold">{total.toFixed(2)} €</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Presupuesto objetivo</p>
              {!editingBudget ? (
                <button
                  className="text-lg font-semibold underline"
                  onClick={() => setEditingBudget(true)}
                >
                  {targetBudget > 0 ? `${targetBudget.toFixed(2)} €` : '—'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded p-1 w-32"
                    defaultValue={targetBudget || ''}
                    id="gbudget"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const val = Number(document.getElementById('gbudget').value || 0);
                      await updateGroup(group.id, {
                        name: group.name,
                        notes: group.notes,
                        targetBudget: val,
                      });
                      setEditingBudget(false);
                    }}
                  >
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </div>
          {exceeded && (
            <p className="text-sm mt-2">Sobrepresupuesto: {(total - targetBudget).toFixed(2)} €</p>
          )}
        </div>

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-center border rounded p-2">
              <input
                className="col-span-3 border rounded p-1"
                value={it.part || ''}
                onChange={(e) => updateAllocation(it.id, { part: e.target.value })}
              />
              <select
                className="col-span-3 border rounded p-1"
                value={it.supplierId || ''}
                onChange={(e) => updateAllocation(it.id, { supplierId: e.target.value })}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                className="col-span-2 border rounded p-1"
                value={it.amount || 0}
                onChange={(e) => updateAllocation(it.id, { amount: Number(e.target.value || 0) })}
              />
              <input
                className="col-span-3 border rounded p-1"
                value={it.notes || ''}
                placeholder="Notas"
                onChange={(e) => updateAllocation(it.id, { notes: e.target.value })}
              />
              <div className="col-span-1 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => removeAllocation(it.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-600">Sin partidas. Crea la primera.</p>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleAdd}>
            Añadir partida
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
