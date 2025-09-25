import React, { useMemo, useState } from 'react';

import useSupplierGroups from '../../hooks/useSupplierGroups';
import useProveedores from '../../hooks/useProveedores';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function AssignSupplierToGroupModal({ open, onClose, provider }) {
  const { groups, addMembers, createGroup } = useSupplierGroups();
  const { updateProvider } = useProveedores();
  const [mode, setMode] = useState('assign'); // 'assign' | 'create'
  const [groupId, setGroupId] = useState('');
  const [name, setName] = useState('');
  const canAssign = useMemo(() => {
    if (!provider?.id) return false;
    if (mode === 'assign') return !!groupId;
    return name.trim().length > 1;
  }, [groupId, name, mode, provider?.id]);

  const finalizeLocal = async (gid, gname) => {
    try {
      await updateProvider(provider.id, { ...provider, groupId: gid, groupName: gname });
    } catch {}
  };

  const confirm = async () => {
    if (!canAssign) return;
    try {
      if (mode === 'assign') {
        await addMembers(groupId, [provider.id]);
        const g = (groups || []).find((x) => x.id === groupId);
        await finalizeLocal(groupId, g?.name || '');
        onClose?.({ success: true, groupId });
      } else {
        const res = await createGroup({ name: name.trim(), memberIds: [provider.id] });
        if (res?.success && res?.id) {
          await finalizeLocal(res.id, name.trim());
          onClose?.({ success: true, groupId: res.id });
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
    <Modal open={open} onClose={() => onClose?.()} title="Asignar a grupo">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'assign'} onChange={() => setMode('assign')} />
            Asignar a existente
          </label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'create'} onChange={() => setMode('create')} />
            Crear nuevo grupo
          </label>
        </div>

        {mode === 'assign' ? (
          (!groups || groups.length === 0) ? (
            <p className="text-sm text-gray-600">
              No hay grupos creados todavía. Puedes crear uno nuevo.
            </p>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Selecciona un grupo existente</label>
              <select
                className="w-full border rounded p-2"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
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
            <label className="block text-sm text-gray-700 mb-1">Nombre del nuevo grupo</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ej. Fotógrafos favoritos"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose?.()}>Cancelar</Button>
          <Button onClick={confirm} disabled={!canAssign}>{mode === 'assign' ? 'Asignar' : 'Crear y asignar'}</Button>
        </div>
      </div>
    </Modal>
  );
}
