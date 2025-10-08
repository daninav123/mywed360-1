import { Plus, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import useCeremonyProtocol from '../../hooks/useCeremonyProtocol';
import CeremonyTimeline from '../../components/protocolo/CeremonyTimeline';
import CeremonyChecklist from '../../components/protocolo/CeremonyChecklist';

const EVENT_TYPES = [
  { value: 'ceremonia_civil', label: 'Ceremonia civil' },
  { value: 'ceremonia_religiosa', label: 'Ceremonia religiosa' },
  { value: 'simbolica', label: 'Simbolica / simbólica' },
  { value: 'evento', label: 'Evento sin ceremonia formal' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En curso' },
  { value: 'done', label: 'Completado' },
];

const CeremonyProtocol = () => {
  const { config, loading, saveConfig, resetToDefaults, defaults } = useCeremonyProtocol();
  const [draft, setDraft] = useState(config);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(cloneConfig(config));
    setDirty(false);
  }, [config]);

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const updateNested = (group, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [group]: {
        ...(prev?.[group] || {}),
        [field]: value,
      },
    }));
    setDirty(true);
  };

  const updateRole = (roleId, patch) => {
    setDraft((prev) => ({
      ...prev,
      roles: (prev.roles || []).map((role) =>
        role.id === roleId ? { ...role, ...patch } : role,
      ),
    }));
    setDirty(true);
  };

  const addRole = () => {
    const nextId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setDraft((prev) => ({
      ...prev,
      roles: [
        ...(prev.roles || []),
        { id: nextId, role: 'Nuevo rol', name: '', contact: '', arrival: '', attire: '' },
      ],
    }));
    setDirty(true);
  };

  const removeRole = (roleId) => {
    setDraft((prev) => ({
      ...prev,
      roles: (prev.roles || []).filter((role) => role.id !== roleId),
    }));
    setDirty(true);
  };

  const updateTradition = (traditionId, patch) => {
    setDraft((prev) => ({
      ...prev,
      traditions: (prev.traditions || []).map((tradition) =>
        tradition.id === traditionId ? { ...tradition, ...patch } : tradition,
      ),
    }));
    setDirty(true);
  };

  const addTradition = () => {
    const nextId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setDraft((prev) => ({
      ...prev,
      traditions: [
        ...(prev.traditions || []),
        { id: nextId, label: 'Nueva tradición', required: false, responsible: '' },
      ],
    }));
    setDirty(true);
  };

  const updateLegal = (itemId, patch) => {
    setDraft((prev) => ({
      ...prev,
      legal: (prev.legal || []).map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveConfig(draft);
    setSaving(false);
    setDirty(false);
  };

  const handleReset = async () => {
    setDraft(cloneConfig(defaults));
    setDirty(true);
  };

  const handleResetToDefaults = async () => {
    await resetToDefaults();
    setDraft(cloneConfig(defaults));
    setDirty(false);
  };

  return (
    <PageWrapper title="Protocolo de la ceremonia">
      <div className="space-y-6">
        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Configuración general</h2>
              <p className="text-sm text-gray-600">
                Define los pilares de la ceremonia. Estos datos alimentan el flujo 11 y las tareas
                automáticas asociadas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={handleReset}
                disabled={!dirty}
              >
                Deshacer borrador
              </Button>
              <Button
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={handleResetToDefaults}
              >
                Restaurar plantilla
              </Button>
              <Button
                onClick={handleSave}
                disabled={!dirty || saving}
                leftIcon={<Save size={16} />}
              >
                {saving ? 'Guardando…' : 'Guardar protocolo'}
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando datos de la ceremonia…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Tipo de evento</label>
                  <select
                    className="border rounded px-3 py-2"
                    value={draft.eventType}
                    onChange={(e) => updateField('eventType', e.target.value)}
                  >
                    {EVENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="text-sm text-gray-600">¿Múltiples ceremonias?</label>
                  <input
                    type="checkbox"
                    checked={!!draft.multiCeremony}
                    onChange={(e) => updateField('multiCeremony', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Título personalizado</label>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Ceremonia principal"
                    value={draft.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Capacidad / Aforo</label>
                  <input
                    type="number"
                    min="0"
                    className="border rounded px-3 py-2"
                    value={draft.capacity || 0}
                    onChange={(e) => updateField('capacity', Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Fecha</label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2"
                    value={draft.scheduledDate || ''}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Hora</label>
                  <input
                    type="time"
                    className="border rounded px-3 py-2"
                    value={draft.scheduledTime || ''}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm text-gray-600">Lugar</label>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Ubicación o recinto"
                    value={draft.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Celebrante / Oficiante</label>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Nombre del celebrante"
                    value={draft.celebrant}
                    onChange={(e) => updateField('celebrant', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Contacto celebrante</label>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Email o teléfono"
                    value={draft.celebrantContact}
                    onChange={(e) => updateField('celebrantContact', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Notas / requisitos especiales</label>
                <textarea
                  className="border rounded px-3 py-2"
                  rows={3}
                  placeholder="Montaje, permisos, horarios de montaje…"
                  value={draft.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Ensayo</h3>
              <p className="text-sm text-gray-600">
                Programa un ensayo para alinear roles, tiempos y logística.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Fecha</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={draft.rehearsal?.date || ''}
                onChange={(e) => updateNested('rehearsal', 'date', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Hora</label>
              <input
                type="time"
                className="border rounded px-3 py-2"
                value={draft.rehearsal?.time || ''}
                onChange={(e) => updateNested('rehearsal', 'time', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Lugar</label>
              <input
                className="border rounded px-3 py-2"
                placeholder="Dirección ensayo"
                value={draft.rehearsal?.location || ''}
                onChange={(e) => updateNested('rehearsal', 'location', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm text-gray-600">Participantes</label>
              <textarea
                className="border rounded px-3 py-2"
                rows={2}
                placeholder="Roles confirmados para el ensayo"
                value={draft.rehearsal?.attendees || ''}
                onChange={(e) => updateNested('rehearsal', 'attendees', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Roles clave</h3>
              <p className="text-sm text-gray-600">
                Asegura que cada rol tenga responsable, contacto y hora de llegada.
              </p>
            </div>
            <Button onClick={addRole} leftIcon={<Plus size={16} />}>
              Añadir rol
            </Button>
          </div>

          <div className="space-y-3">
            {(draft.roles || []).map((role) => (
              <div
                key={role.id}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
              >
                <input
                  className="border rounded px-2 py-1 font-medium text-gray-800"
                  value={role.role || ''}
                  onChange={(e) => updateRole(role.id, { role: e.target.value })}
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Nombre"
                  value={role.name || ''}
                  onChange={(e) => updateRole(role.id, { name: e.target.value })}
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Contacto"
                  value={role.contact || ''}
                  onChange={(e) => updateRole(role.id, { contact: e.target.value })}
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Hora llegada"
                  value={role.arrival || ''}
                  onChange={(e) => updateRole(role.id, { arrival: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Vestimenta / notas"
                    value={role.attire || ''}
                    onChange={(e) => updateRole(role.id, { attire: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Tradiciones y rituales</h3>
              <p className="text-sm text-gray-600">
                Marca las tradiciones obligatorias y asigna responsables para su ejecución.
              </p>
            </div>
            <Button onClick={addTradition} leftIcon={<Plus size={16} />}>
              Añadir tradición
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(draft.traditions || []).map((tradition) => (
              <div key={tradition.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <input
                    className="font-medium text-gray-800 border-b border-dashed focus:outline-none"
                    value={tradition.label || ''}
                    onChange={(e) => updateTradition(tradition.id, { label: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!tradition.required}
                      onChange={(e) =>
                        updateTradition(tradition.id, { required: e.target.checked })
                      }
                    />
                    Obligatoria
                  </label>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <label className="block text-xs uppercase tracking-wide text-gray-500">
                    Responsable
                  </label>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Nombre o rol"
                    value={tradition.responsible || ''}
                    onChange={(e) =>
                      updateTradition(tradition.id, { responsible: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-gray-800">Plan de contingencias</h3>
            <p className="text-sm text-gray-600">
              Define respuestas rápidas ante clima adverso, fallos técnicos o incidencias.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Clima / plan alternativo</label>
              <textarea
                className="border rounded px-3 py-2"
                rows={3}
                placeholder="Carpa, interior, reubicación de sillas…"
                value={draft.contingency?.weatherPlan || ''}
                onChange={(e) => updateNested('contingency', 'weatherPlan', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Plan técnico</label>
              <textarea
                className="border rounded px-3 py-2"
                rows={3}
                placeholder="Proveedor backup de sonido, generador eléctrico…"
                value={draft.contingency?.technicalPlan || ''}
                onChange={(e) => updateNested('contingency', 'technicalPlan', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-600">Contactos de emergencia</label>
              <textarea
                className="border rounded px-3 py-2"
                rows={2}
                placeholder="Seguridad, ambulancia, soporte técnico…"
                value={draft.contingency?.emergencyContacts || ''}
                onChange={(e) => updateNested('contingency', 'emergencyContacts', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-600">Plan de movilidad</label>
              <textarea
                className="border rounded px-3 py-2"
                rows={2}
                placeholder="Transporte invitados, alternativas de acceso"
                value={draft.contingency?.mobilityPlan || ''}
                onChange={(e) => updateNested('contingency', 'mobilityPlan', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-gray-800">Requisitos legales</h3>
            <p className="text-sm text-gray-600">
              Seguimiento de documentación obligatoria con estado y notas.
            </p>
          </div>

          <div className="space-y-3">
            {(draft.legal || []).map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3"
              >
                <div className="md:col-span-2">
                  <input
                    className="font-medium text-gray-800 border-b border-dashed focus:outline-none w-full"
                    value={item.label || ''}
                    onChange={(e) => updateLegal(item.id, { label: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">Estado</label>
                  <select
                    className="border rounded px-2 py-1"
                    value={item.status || 'pending'}
                    onChange={(e) => updateLegal(item.id, { status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">Fecha límite</label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={item.dueDate || ''}
                    onChange={(e) => updateLegal(item.id, { dueDate: e.target.value })}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-xs text-gray-500 uppercase">Notas</label>
                  <textarea
                    className="border rounded px-2 py-1 w-full"
                    rows={2}
                    value={item.notes || ''}
                    onChange={(e) => updateLegal(item.id, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <CeremonyTimeline compact />
        <CeremonyChecklist compact />
      </div>
    </PageWrapper>
  );
};

export default CeremonyProtocol;

function cloneConfig(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}
