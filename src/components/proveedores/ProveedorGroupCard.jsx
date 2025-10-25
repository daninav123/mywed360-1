import {
  Users,
  Split,
  Eye,
  Lightbulb,
  X,
  Edit2,
  Check,
  XCircle,
  Scissors,
  AlertCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import GroupAllocationModal from './GroupAllocationModal';
import GroupSuggestions from './GroupSuggestions';
import useGroupBudgets from '../../hooks/useGroupBudgets';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useTranslations } from '../../hooks/useTranslations';

/**
 * Tarjeta que representa un grupo manual de proveedores unificados
 * @param {{ group: { id:string, name:string, memberIds:string[], notes?:string }, providers: any[], onDissolve:Function }} props
 */
export default function ProveedorGroupCard({

  group,
  providers = [],
  onDissolve,
  onViewMember,
  highlighted = false,
}) {
  const { t } = useTranslations();

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
  const [openAlloc, setOpenAlloc] = useState(false);

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

  const conflicts = useMemo(() => {
    // detectar solapes simples por misma fecha (YYYY-MM-DD) en reservas
    const dateMap = new Map();
    let overlap = false;
    members.forEach((m) => {
      const res = Array.isArray(m.reservations) ? m.reservations : [];
      res.forEach((r) => {
        const d = (r?.date || r?.fecha || '').toString().slice(0, 10);
        if (!d) return;
        const arr = dateMap.get(d) || [];
        arr.push(m.name || m.id);
        dateMap.set(d, arr);
        if (arr.length > 1) overlap = true;
      });
    });
    return { overlap, dates: Array.from(dateMap.entries()).filter(([, v]) => v.length > 1) };
  }, [members]);

  return (
    <Card
      className={`bg-indigo-50 border-indigo-200 ${highlighted ? 'ring-2 ring-indigo-400 shadow-lg' : ''}`}
    >
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
            <h3 className="text-lg font-semibold text-indigo-900">
              {group.name || 'Grupo de proveedores'}
            </h3>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setName(group.name || '');
                  setNotes(group.notes || '');
                }}
              >
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
                  <Eye size={14} className="mr-1" /> Ver
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
                  aria-label="Quitar proveedor del grupo"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-indigo-900">
        {loading
          ? 'Leyendo presupuestos…'
          : totalRange
            ? `Rango de presupuestos detectado: ${totalRange}`
            : t('common.sin_presupuestos_detectados_aun')}
        {conflicts.overlap && (
          <div className="mt-2 text-sm text-red-700 flex items-center gap-1">
            <AlertCircle size={14} /> Posibles solapes en fechas (
            {conflicts.dates.map((d) => d[0]).join(', ')})
          </div>
        )}
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
      {openAlloc && (
        <GroupAllocationModal
          open={openAlloc}
          onClose={() => setOpenAlloc(false)}
          group={group}
          providers={members}
        />
      )}
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpenAlloc(true)}>
          <Scissors size={16} className="mr-1" /> Dividir alcance
        </Button>
      </div>
    </Card>
  );
}
