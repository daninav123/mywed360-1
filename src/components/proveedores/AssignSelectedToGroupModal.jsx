import React, { useMemo, useState } from 'react';

import useProveedores from '../../hooks/useProveedores';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function AssignSelectedToGroupModal({ open, onClose, providers = [] }) {
  const { groups, addMembers, createGroup } = useSupplierGroups();
  const { updateProvider } = useProveedores();

  const [mode, setMode] = useState('assign'); // 'assign' | 'create'
  const [groupId, setGroupId] = useState('');
  const [name, setName] = useState('');
  const ids = useMemo(() => (providers || []).map((p) => p.id).filter(Boolean), [providers]);
  const canConfirm = useMemo(() => {
    if (ids.length === 0) return false;
    if (mode === 'assign') return !!groupId;
    return name.trim().length > 1;
  }, [ids.length, mode, groupId, name]);

  const applyLocal = async (gid, gname) => {
    try {
      await Promise.all(
        providers.map((p) => updateProvider(p.id, { ...p, groupId: gid, groupName: gname }))
      );
    } catch {}
  };

  const confirm = async () => {
    if (!canConfirm) return;
    try {
      if (mode === 'assign') {
        await addMembers(groupId, ids);
        const g = (groups || []).find((x) => x.id === groupId);
        await applyLocal(groupId, g?.name || '');
        onClose?.({ success: true, groupId, groupName: g?.name || '' });
      } else {
        const res = await createGroup({ name: name.trim(), memberIds: ids });
        if (res?.success && res?.id) {
          await applyLocal(res.id, name.trim());
          onClose?.({ success: true, groupId: res.id, groupName: name.trim() });
        } else {
          onClose?.({ success: false, error: res?.error || 'create failed' });
        }
      }
    } catch (e) {
      onClose?.({ success: false, error: e?.message || 'error' });
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={() => onClose?.()} title={`Agrupar (${ids.length})`}>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Seleccionados: {(providers || []).map((p) => p.name).join(', ') || 'ninguno'}
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'assign'} onChange={() => setMode('assign')} />
            Asignar a grupo existente
          </label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'create'} onChange={() => setMode('create')} />
            Crear grupo nuevo
          </label>
        </div>

        {mode === 'assign' ? (
          (!groups || groups.length === 0) ? (
            <p className="text-sm text-gray-600">No hay grupos aún. Puedes crear uno nuevo.</p>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Grupo</label>
              <select className="w-full border rounded p-2" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">Seleccionar…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || g.id} ({(g.memberIds || []).length} miembros)
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nombre del grupo</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ej. Fotógrafos finalistas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose?.()}>Cancelar</Button>
          <Button onClick={confirm} disabled={!canConfirm}>{mode === 'assign' ? 'Asignar' : 'Crear y asignar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

