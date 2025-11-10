import React, { useMemo, useState } from 'react';

import useProveedores from '../../hooks/useProveedores';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import useTranslations from '../../hooks/useTranslations';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function AssignSupplierToGroupModal({ open, onClose, provider }) {
  const { groups, addMembers, createGroup } = useSupplierGroups();
  const { updateProvider } = useProveedores();
  const { t } = useTranslations();
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
    <Modal
      open={open}
      onClose={() => onClose?.()}
      title={t('suppliers.assignModal.title', { count: provider ? 1 : 0 })}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'assign'} onChange={() => setMode('assign')} />
            {t('suppliers.assignModal.modeAssign')}
          </label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="radio" checked={mode === 'create'} onChange={() => setMode('create')} />
            {t('suppliers.assignModal.modeCreate')}
          </label>
        </div>

        {mode === 'assign' ? (
          (!groups || groups.length === 0) ? (
            <p className="text-sm text-gray-600">
              {t('suppliers.assignModal.emptyGroups')}
            </p>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                {t('suppliers.assignModal.groupLabel')}
              </label>
              <select
                className="w-full border rounded p-2"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                <option value="">{t('suppliers.assignModal.groupPlaceholder')}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || g.id}{' '}
                    {t('suppliers.assignModal.membersCount', {
                      count: (g.memberIds || []).length,
                    })}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('suppliers.assignModal.newGroupLabel')}
            </label>
            <input
              className="w-full border rounded p-2"
              placeholder={t('suppliers.assignModal.newGroupPlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose?.()}>
            {t('suppliers.assignModal.cancel')}
          </Button>
          <Button onClick={confirm} disabled={!canAssign}>
            {mode === 'assign'
              ? t('suppliers.assignModal.confirmAssign')
              : t('suppliers.assignModal.confirmCreate')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
