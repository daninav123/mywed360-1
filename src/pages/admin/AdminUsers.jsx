import React, { useCallback, useEffect, useState } from 'react';

import { getUsersData, getUsersRoleSummary, suspendUser } from '../../services/adminDataService';

const ROLE_CARDS = [
  { key: 'owner', label: 'Owners' },
  { key: 'planner', label: 'Wedding planners' },
  { key: 'assistant', label: 'Assistants' },
];

const createEmptyRoleSummary = () => ({
  generatedAt: null,
  durationMs: null,
  scanned: 0,
  totals: { total: 0, real: 0, excluded: 0 },
  roles: ROLE_CARDS.reduce((acc, { key, label }) => {
    acc[key] = {
      label,
      total: 0,
      real: 0,
      excluded: {
        total: 0,
        byReason: { status: 0, flags: 0, email: 0 },
      },
    };
    return acc;
  }, {}),
  filters: {
    allowedStatuses: [],
    excludedEmailSuffixes: [],
    excludedEmailPrefixes: [],
    excludedEmailContains: [],
    excludedTags: [],
    excludedBooleanKeys: [],
  },
  source: 'fallback',
  error: '',
});

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [roleSummary, setRoleSummary] = useState(() => createEmptyRoleSummary());
  const [loadingRoleSummary, setLoadingRoleSummary] = useState(true);
  const [roleSummaryError, setRoleSummaryError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsersData();
      setUsers(data);
    } catch (error) {
      console.error('[AdminUsers] Failed to load users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoleSummary = useCallback(async () => {
    setLoadingRoleSummary(true);
    try {
      const result = await getUsersRoleSummary();
      const summary = result?.summary ?? createEmptyRoleSummary();
      setRoleSummary(summary);
      if (result?.error) {
        const message = result.error === 'firestore_unavailable'
          ? 'Firestore no está disponible; mostramos valores de referencia.'
          : 'No se pudo cargar el resumen por rol.';
        setRoleSummaryError(message);
      } else {
        setRoleSummaryError('');
      }
    } catch (error) {
      console.warn('[AdminUsers] role summary error', error);
      setRoleSummary(createEmptyRoleSummary());
      setRoleSummaryError('No se pudo cargar el resumen por rol.');
    } finally {
      setLoadingRoleSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoleSummary();
  }, [fetchRoleSummary]);

  const openSuspendModal = (user) => {
    setSelectedUser(user);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) return;
    
    try {
      // Llamar al endpoint real del backend
      await suspendUser(selectedUser.id, suspendReason);
      
      // Actualizar el estado local para reflejar el cambio
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, status: 'disabled' } : user)),
      );
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('[AdminUsers] Failed to suspend user', error);
      alert('Error al suspender el usuario: ' + error.message);
    }
  };

  const renderUsersTable = () => {
    if (loading) {
      return (
        <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
          Cargando usuarios...
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-soft bg-surface shadow-sm" data-testid="admin-users-table">
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
    );
  };

  const summaryData = roleSummary ?? createEmptyRoleSummary();

  const renderRoleSummary = () => (
    <div
      className="space-y-4 rounded-xl border border-soft bg-surface p-4 shadow-sm"
      data-testid="admin-users-role-summary"
    >
      {loadingRoleSummary ? (
        <div className="text-sm text-[var(--color-text-soft,#6b7280)]">Cargando resumen de roles...</div>
      ) : (
        <>
          {roleSummaryError ? (
            <div className="rounded-md border border-soft bg-[var(--color-bg-soft,#fff7ed)] px-3 py-2 text-xs text-[color:var(--color-text,#b45309)]">
              {roleSummaryError}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ROLE_CARDS.map(({ key, label }) => {
              const bucket = summaryData.roles?.[key] || {
                label,
                total: 0,
                real: 0,
                excluded: {
                  total: 0,
                  byReason: { status: 0, flags: 0, email: 0 },
                },
              };
              const excluded = bucket.excluded || { total: 0, byReason: {} };
              const byReason = excluded.byReason || {};
              return (
                <div
                  key={key}
                  className="rounded-lg border border-soft bg-[var(--color-bg-soft,#f3f4f6)] p-4"
                  data-testid={`admin-users-role-card-${key}`}
                >
                  <h2 className="text-sm font-medium text-[var(--color-text-soft,#6b7280)]">
                    {bucket.label || label}
                  </h2>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-text,#111827)]">
                    {bucket.real}
                  </p>
                  <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Usuarios reales</p>
                  <dl className="mt-3 space-y-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                    <div className="flex justify-between">
                      <dt>Total cuentas</dt>
                      <dd>{bucket.total}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Excluidas</dt>
                      <dd>{excluded.total ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>- Estado</dt>
                      <dd>{byReason.status ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>- Flags</dt>
                      <dd>{byReason.flags ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>- Email</dt>
                      <dd>{byReason.email ?? 0}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 text-xs text-[var(--color-text-soft,#6b7280)] md:flex-row md:items-center md:justify-between">
            <div>
              Estados permitidos:{' '}
              {summaryData.filters?.allowedStatuses?.length
                ? summaryData.filters.allowedStatuses.join(', ')
                : 'sin restricción definida'}
              {summaryData.filters?.excludedEmailSuffixes?.length ? (
                <span className="ml-2">
                  Dominios excluidos: {summaryData.filters.excludedEmailSuffixes.join(', ')}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-1 text-xs text-[var(--color-text-soft,#6b7280)] md:flex-row md:items-center md:gap-3">
              <span>
                Fuente:{' '}
                {summaryData.source === 'firestore'
                  ? 'Firestore'
                  : summaryData.source === 'fallback'
                  ? 'Valores de referencia'
                  : summaryData.source === 'empty'
                  ? 'Sin registros en Firestore'
                  : summaryData.source || 'Desconocida'}
              </span>
              {summaryData.generatedAt ? (
                <span>
                  Actualizado {new Date(summaryData.generatedAt).toLocaleString('es-ES')}
                </span>
              ) : null}
              <button
                type="button"
                onClick={fetchRoleSummary}
                className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                data-testid="admin-users-role-refresh"
              >
                Actualizar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
            Estados y acceso de cuentas críticas.
          </p>
        </div>
      </header>

      <div className="flex items-center gap-3 border-b border-soft" role="tablist">
        <button
          type="button"
          data-testid="admin-users-tab-list"
          onClick={() => setActiveTab('list')}
          className={
            activeTab === 'list'
              ? 'border-b-2 border-[color:var(--color-primary,#6366f1)] px-3 py-2 text-sm font-medium text-[color:var(--color-primary,#6366f1)]'
              : 'px-3 py-2 text-sm text-[var(--color-text-soft,#6b7280)] hover:text-[var(--color-text,#111827)]'
          }
        >
          Listado
        </button>
        <button
          type="button"
          data-testid="admin-users-tab-roles"
          onClick={() => setActiveTab('roles')}
          className={
            activeTab === 'roles'
              ? 'border-b-2 border-[color:var(--color-primary,#6366f1)] px-3 py-2 text-sm font-medium text-[color:var(--color-primary,#6366f1)]'
              : 'px-3 py-2 text-sm text-[var(--color-text-soft,#6b7280)] hover:text-[var(--color-text,#111827)]'
          }
        >
          Roles reales
        </button>
      </div>

      {activeTab === 'list' ? renderUsersTable() : renderRoleSummary()}

      {showSuspendModal && selectedUser && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          data-testid="admin-user-suspend-modal"
        >
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
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]"
              >
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


