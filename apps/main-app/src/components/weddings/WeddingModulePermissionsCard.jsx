import React, { useEffect, useMemo, useState } from 'react';

import Button from '../ui/Button';
import { Card } from '../ui/Card';
import {
  MODULE_PERMISSION_OPTIONS,
  normalizeModulePermissions,
} from '../../utils/weddingModulePermissions';

const ROLE_LABELS = {
  owner: 'Propietario',
  planner: 'Planner',
  assistant: 'Assistant',
};

const LEVEL_LABELS = {
  manage: 'Completo',
  view: 'Lectura',
  none: 'Sin acceso',
};

const MODULE_LABELS = {
  guests: 'Invitados',
  tasks: 'Tareas',
  finance: 'Finanzas',
  providers: 'Proveedores',
  communications: 'Comunicaciones',
  settings: 'Configuración',
  analytics: 'Analítica',
};

export default function WeddingModulePermissionsCard({
  modulePermissions,
  onSave,
  canEdit = false,
  saving = false,
}) {
  const normalized = useMemo(
    () => normalizeModulePermissions(modulePermissions),
    [modulePermissions]
  );
  const [draft, setDraft] = useState(normalized);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(normalized);
    setDirty(false);
  }, [normalized]);

  const handleChange = (module, role, value) => {
    setDraft((prev) => {
      const next = { ...prev };
      next[module] = { ...next[module], [role]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    if (!dirty || typeof onSave !== 'function') return;
    onSave(draft);
  };

  const modules = MODULE_PERMISSION_OPTIONS
    ? Object.keys(MODULE_PERMISSION_OPTIONS.defaults)
    : Object.keys(draft);

  const levels = MODULE_PERMISSION_OPTIONS?.levels || ['manage', 'view', 'none'];
  const roles = MODULE_PERMISSION_OPTIONS?.roles || ['owner', 'planner', 'assistant'];

  return (
    <Card className="p-4 space-y-4" data-testid="wedding-module-permissions">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            Permisos por módulo
          </h3>
          <p className="text-sm text-muted">
            Ajusta qué puede hacer cada rol en los distintos módulos de la boda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(normalized);
              setDirty(false);
            }}
            disabled={!dirty}
          >
            Restablecer
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || !canEdit || saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[color:var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface)]/70 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Módulo</th>
              {roles.map((role) => (
                <th key={role} className="px-3 py-2 text-left font-semibold">
                  {ROLE_LABELS[role] || role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {modules.map((module) => (
              <tr key={module}>
                <td className="px-3 py-2 font-medium text-[color:var(--color-text)]">
                  {MODULE_LABELS[module] || module}
                </td>
                {roles.map((role) => (
                  <td key={`${module}-${role}`} className="px-3 py-2">
                    <select
                      className="w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
                      value={draft[module]?.[role] || 'view'}
                      onChange={(event) =>
                        handleChange(module, role, event.target.value)
                      }
                      disabled={!canEdit}
                      data-testid={`module-permission-${module}-${role}`}
                    >
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {LEVEL_LABELS[level] || level}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Los cambios aplican inmediatamente al guardar; los usuarios necesitarán recargar la
        página para ver nuevas restricciones.
      </p>
    </Card>
  );
}

