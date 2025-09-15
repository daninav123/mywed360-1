import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Users, Split, Eye, Lightbulb, X, Edit2, Check, XCircle } from 'lucide-react';
import useGroupBudgets from '../../hooks/useGroupBudgets';
import GroupSuggestions from './GroupSuggestions';
import useSupplierGroups from '../../hooks/useSupplierGroups';

/**
 * Tarjeta que representa un grupo manual de proveedores unificados
 * @param {{ group: { id:string, name:string, memberIds:string[], notes?:string }, providers: any[], onDissolve:Function }} props
 */
export default function ProveedorGroupCard({ group, providers = [], onDissolve, onViewMember, highlighted = false }) {
  const [openSug, setOpenSug] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name || '');
  const [notes, setNotes] = useState(group.notes || '');
  const members = useMemo(
    () => providers.filter((p) => group.memberIds?.includes(p.id)),
    [providers, group.memberIds]
  );
  const { budgetsBySupplier, loading } = useGroupBudgets(group.memberIds || []);
  const { removeMember, updateGroup } = useSupplierGroups();

  const totalRange = useMemo(() => {
    // muestra de coste aproximado si hay amounts
    const amounts = Object.values(budgetsBySupplier || {})
      .flat()
      .map((b) => Number(b.amount))
      .filter((n) => !isNaN(n) && n > 0);
    if (!amounts.length) return null;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return min === max ? `${min} €` : `${min}–${max} €`;
  }, [budgetsBySupplier]);

  return (
    <Card className={`bg-indigo-50 border-indigo-200 ${highlighted ? 'ring-2 ring-indigo-400 shadow-lg' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          {editing ? (
            <input
              className="border rounded px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del grupo"
            />
          ) : (
            <h3 className="text-lg font-semibold text-indigo-900">{group.name || 'Grupo de proveedores'}</h3>
          )}
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setOpenSug(true)}>
              <Lightbulb size={16} className="mr-1" /> Sugerencias
            </Button>
          )}
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit2 size={16} className="mr-1" /> Editar
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={async () => {
                  await updateGroup(group.id, { name, notes });
                  setEditing(false);
                }}
              >
                <Check size={16} className="mr-1" /> Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setName(group.name || ''); setNotes(group.notes || ''); }}>
                <XCircle size={16} className="mr-1" /> Cancelar
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => onDissolve?.(group.id)}>
            <Split size={16} className="mr-1" /> Separar grupo
          </Button>
        </div>
      </div>
      {editing ? (
        <textarea
          className="w-full border rounded p-2 text-sm mb-2"
          rows={2}
          placeholder="Notas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      ) : (
        group.notes && <p className="text-sm text-indigo-800 mb-2">{group.notes}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {members.map((m) => (
          <div key={m.id} className="p-3 bg-white/70 border border-indigo-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-600">{m.service}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="xs" variant="ghost" onClick={() => onViewMember?.(m)}>
                  <Eye size={14} className="mr-1"/> Ver
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={async () => {
                    if (confirm('Quitar este proveedor del grupo?')) {
                      await removeMember(group.id, m.id);
                    }
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-indigo-900">
        {loading ? 'Leyendo presupuestos…' : totalRange ? `Rango de presupuestos detectado: ${totalRange}` : 'Sin presupuestos detectados aún'}
      </div>

      {openSug && (
        <GroupSuggestions
          open={openSug}
          onClose={() => setOpenSug(false)}
          group={group}
          providers={members}
          budgetsBySupplier={budgetsBySupplier}
        />
      )}
    </Card>
  );
}
