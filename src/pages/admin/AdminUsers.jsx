import React, { useEffect, useState } from 'react';

import { getUsersData } from '../../services/adminDataService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const data = await getUsersData();
      setUsers(data);
      setLoading(false);
    };
    loadUsers();
  }, []);

  const openSuspendModal = (user) => {
    setSelectedUser(user);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const confirmSuspend = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((user) => (user.id === selectedUser.id ? { ...user, status: 'disabled' } : user))
    );
    setShowSuspendModal(false);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Estados y acceso de cuentas críticas.</p>
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl border border-soft bg-surface shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3">Bodas activas</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {users.map((user) => (
              <tr key={user.id} data-testid="admin-user-row" data-status={user.status}>
                <td className="px-4 py-3 font-medium">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3 capitalize">{user.status}</td>
                <td className="px-4 py-3">{user.lastAccess}</td>
                <td className="px-4 py-3">{user.weddings}</td>
                <td className="px-4 py-3">{user.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  {user.status !== 'disabled' && (
                    <button
                      type="button"
                      data-testid="admin-user-suspend"
                      onClick={() => openSuspendModal(user)}
                      className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                    >
                      Suspender
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="admin-user-suspend-modal">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Suspender cuenta</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Estás suspendiendo la cuenta {selectedUser.email}. Introduce el motivo.
              </p>
            </div>
            <textarea
              data-testid="admin-user-suspend-reason"
              rows={4}
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
              placeholder="Motivo de la suspensión"
            />
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={() => setShowSuspendModal(false)} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="admin-user-suspend-confirm"
                onClick={confirmSuspend}
                disabled={!suspendReason.trim()}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)] disabled:opacity-60"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;