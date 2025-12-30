import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ROLE_OPTIONS = [
  { id: 'owner', label: 'Owner', tier: 'free' },
  { id: 'assistant', label: 'Assistant', tier: 'assistant' },
  { id: 'planner', label: 'Planner', tier: 'wedding_planner_1' },
];

export default function RoleUpgradeHarness() {
  // Leer el rol inicial del localStorage si existe
  const getInitialRole = () => {
    try {
      const profile = window.localStorage.getItem('MaLoveApp_user_profile');
      if (profile) {
        const parsed = JSON.parse(profile);
        return parsed.role || 'owner';
      }
    } catch (e) {
      console.warn('Error reading initial role:', e);
    }
    return 'owner';
  };
  
  const [currentRole, setCurrentRole] = useState(getInitialRole);
  const [status, setStatus] = useState('ready');
  const [loading, setLoading] = useState(false);

  // Sincronizar con localStorage cuando cambie el rol
  useEffect(() => {
    try {
      const profile = window.localStorage.getItem('MaLoveApp_user_profile') || '{}';
      const parsed = JSON.parse(profile);
      window.localStorage.setItem(
        'MaLoveApp_user_profile',
        JSON.stringify({ ...parsed, role: currentRole })
      );
    } catch (e) {
      console.warn('Error updating localStorage:', e);
    }
  }, [currentRole]);

  const handleUpgrade = (option) => {
    if (!option) return;
    setLoading(true);
    setStatus('loading');
    
    // Simular actualización del rol
    setTimeout(() => {
      const nextRole = option.id;
      setCurrentRole(nextRole);
      setStatus(`ok:${nextRole}`);
      setLoading(false);
    }, 100);
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
              {option.label}
            </button>
          ))}
        </div>
        <div
          data-testid="role-upgrade-status"
          className={`text-sm ${
            status.startsWith('ok') ? 'text-green-600' : 
            status.startsWith('error') ? 'text-red-600' : 
            'text-gray-500'
          }`}
        >
          {status || 'ready'}
        </div>
      </section>
    </div>
  );
}
