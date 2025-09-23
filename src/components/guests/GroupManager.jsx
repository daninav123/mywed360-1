import React, { useMemo, useState } from 'react';

import Modal from '../Modal';
import { Button, Input } from '../ui';

export default function GroupManager({
  open,
  onClose,
  guests = [],
  selectedIds = [],
  onAssignGroup,
  onRenameGroup,
  onMergeGroups,
}) {
  const [newGroup, setNewGroup] = useState('');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');

  const groupList = useMemo(() => {
    const set = new Set();
    (guests || []).forEach((g) => {
      if (g.group) set.add(String(g.group));
      if (g.companionGroupId) set.add(String(g.companionGroupId));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guests]);

  const selectedCount = Array.isArray(selectedIds) ? selectedIds.length : 0;

  return (
    <Modal open={open} onClose={onClose} title="Gestión de grupos" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asignar grupo a seleccionados */}
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Asignar a seleccionados</div>
            <div className="text-sm text-gray-600 mb-3">Seleccionados: {selectedCount}</div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1"
                onChange={(e) => setNewGroup(e.target.value)}
                value={newGroup}
              >
                <option value="">Nuevo grupo…</option>
                {groupList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {newGroup === '' && (
                <Input
                  placeholder="Nombre de grupo"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                />
              )}
              <Button
                disabled={!selectedCount || !newGroup}
                onClick={() => {
                  onAssignGroup?.(newGroup);
                }}
              >
                Asignar
              </Button>
            </div>
          </div>

          {/* Renombrar grupo */}
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Renombrar grupo</div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1"
                value={renameFrom}
                onChange={(e) => setRenameFrom(e.target.value)}
              >
                <option value="">Origen…</option>
                {groupList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Nuevo nombre"
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
              />
              <Button
                disabled={!renameFrom || !renameTo}
                onClick={() => onRenameGroup?.(renameFrom, renameTo)}
              >
                Renombrar
              </Button>
            </div>
          </div>

          {/* Fusionar grupos */}
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Fusionar grupos</div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1"
                value={mergeFrom}
                onChange={(e) => setMergeFrom(e.target.value)}
              >
                <option value="">Origen…</option>
                {groupList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={mergeTo}
                onChange={(e) => setMergeTo(e.target.value)}
              >
                <option value="">Destino…</option>
                {groupList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <Button
                disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo}
                onClick={() => onMergeGroups?.(mergeFrom, mergeTo)}
              >
                Fusionar
              </Button>
            </div>
          </div>

          {/* Listado de grupos */}
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Grupos existentes</div>
            {groupList.length === 0 ? (
              <div className="text-sm text-gray-600">No hay grupos aún.</div>
            ) : (
              <ul className="list-disc pl-6 text-sm">
                {groupList.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
