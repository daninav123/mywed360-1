import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../hooks/useAuth';

const ROLE_OPTIONS = [
  { id: 'owner', label: 'Owner', tier: 'free' },
  { id: 'assistant', label: 'Assistant', tier: 'assistant' },
  { id: 'planner', label: 'Planner', tier: 'wedding_planner_1' },
];

export default function RoleUpgradeHarness() {
  const { userProfile, upgradeRole } = useAuth();
  const initialRole = useMemo(() => userProfile?.role || 'owner', [userProfile?.role]);
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentRole(initialRole);
  }, [initialRole]);

  const handleUpgrade = async (option) => {
    if (!option) return;
    setLoading(true);
    setStatus('');
    try {
      const result = await upgradeRole({ newRole: option.id, tier: option.tier });
      if (result?.success) {
        const nextRole = result.role || option.id;
        setCurrentRole(nextRole);
        setStatus(`ok:${nextRole}`);
        try {
          const rawProfile = window.localStorage.getItem('MaLoveApp_user_profile');
          const parsed = rawProfile ? JSON.parse(rawProfile) : {};
          window.localStorage.setItem(
            'MaLoveApp_user_profile',
            JSON.stringify({ ...parsed, role: nextRole })
          );
        } catch (_) {}
      } else {
        setStatus(`error:${result?.error || 'upgrade_failed'}`);
      }
    } catch (error) {
      setStatus(`error:${error?.message || 'unexpected'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[color:var(--color-text)] p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold" data-testid="role-upgrade-title">
          Harness · Upgrade de roles
        </h1>
        <p className="text-sm text-[color:var(--color-text-70)]">
          Utilidad de pruebas para simular cambios de rol mediante la API de upgrade.
        </p>
      </header>

      <section className="space-y-3">
        <div data-testid="role-upgrade-current">
          Rol actual: <strong>{currentRole}</strong>
        </div>
        <div className="flex flex-wrap gap-3">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="px-4 py-2 rounded border border-soft hover:bg-[var(--color-accent-10)] transition disabled:opacity-60 disabled:pointer-events-none"
              data-testid={`role-upgrade-${option.id}`}
              onClick={() => handleUpgrade(option)}
              disabled={loading}
            >
              Cambiar a {option.label}
            </button>
          ))}
        </div>
        {status && (
          <div
            data-testid="role-upgrade-status"
            className={`text-sm ${status.startsWith('ok') ? 'text-green-600' : 'text-red-600'}`}
          >
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
