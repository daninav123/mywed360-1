import React, { useEffect, useMemo, useState } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import useProveedores from '../../hooks/useProveedores';
import { useTranslations } from '../../hooks/useTranslations';

const STATUS_OPTIONS = [
  {
  const { t } = useTranslations();
 value: 'Pendiente', label: 'Pendiente' },
  { value: 'Contactado', label: 'Contactado' },
  { value: 'Presupuesto', label: 'Presupuesto' },
  { value: 'Seleccionado', label: 'Seleccionado' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Rechazado', label: 'Rechazado' },
];

function sanitizeBudget(value) {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const defaultWizardState = {
  selectedIds: [],
  mode: 'merge', // 'merge' | 'split'
  mergePrimaryId: '',
  mergeName: '',
  mergeStatus: '',
  mergeBudget: '',
  mergeNotes: '',
  splitName: '',
  splitService: '',
  splitStatus: 'Pendiente',
  copyContact: true,
};

export default function SupplierMergeWizard({ open, onClose, provider, onCompleted }) {
  const {
    addProvider,
    addServiceLine,
    deleteServiceLine,
    mergeServiceLines,
    loadProviders,
  } = useProveedores();

  const [state, setState] = useState(defaultWizardState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const serviceLines = useMemo(() => provider?.serviceLines || [], [provider?.serviceLines]);

  useEffect(() => {
    if (!open) {
      setState(defaultWizardState);
      setError('');
      setSubmitting(false);
    } else if (serviceLines.length > 0) {
      setState((prev) => ({
        ...prev,
        selectedIds: serviceLines.map((line) => line.id),
        mergePrimaryId: serviceLines[0].id,
        mergeName: serviceLines[0].name || provider?.service || '',
        splitService: serviceLines[0].name || provider?.service || '',
      }));
    }
  }, [open, serviceLines, provider?.service]);

  const selectedLines = useMemo(
    () => serviceLines.filter((line) => state.selectedIds.includes(line.id)),
    [serviceLines, state.selectedIds]
  );

  const canMerge =
    state.mode === 'merge' &&
    state.selectedIds.length >= 2 &&
    state.mergePrimaryId &&
    state.selectedIds.includes(state.mergePrimaryId);

  const canSplit = state.mode === 'split' && state.selectedIds.length >= 1 && state.splitName.trim();

  const handleToggleLine = (lineId) => {
    setState((prev) => {
      const selected = prev.selectedIds.includes(lineId)
        ? prev.selectedIds.filter((id) => id !== lineId)
        : [...prev.selectedIds, lineId];
      const nextPrimary =
        selected.length > 0 && selected.includes(prev.mergePrimaryId)
          ? prev.mergePrimaryId
          : selected[0] || '';
      return { ...prev, selectedIds: selected, mergePrimaryId: nextPrimary };
    });
  };

  const handleConfirmMerge = async () => {
    if (!provider?.id || !canMerge) return;
    setSubmitting(true);
    setError('');
    try {
      const options = {};
      if (state.mergeName.trim()) options.name = state.mergeName.trim();
      if (state.mergeStatus) options.status = state.mergeStatus;
      const budgetNum = sanitizeBudget(state.mergeBudget);
      if (budgetNum != null) options.budget = budgetNum;
      if (state.mergeNotes.trim()) options.notes = state.mergeNotes.trim();

      const secondaryIds = state.selectedIds.filter((id) => id !== state.mergePrimaryId);
      await mergeServiceLines(provider.id, state.mergePrimaryId, secondaryIds, options);
      await loadProviders();
      setSubmitting(false);
      if (typeof onCompleted === 'function') onCompleted({ type: 'merge', primaryId: state.mergePrimaryId });
      onClose?.();
    } catch (e) {
      setError(e?.message || {t('common.pudo_completar_fusion')});
      setSubmitting(false);
    }
  };

  const handleConfirmSplit = async () => {
    if (!provider?.id || !canSplit || selectedLines.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const baseName = state.splitName.trim();
      const serviceName = state.splitService.trim() || selectedLines[0]?.name || provider.service || '';
      const newProviderPayload = {
        name: baseName,
        service: serviceName,
        status: state.splitStatus || provider.status || 'Pendiente',
        sourceProviderId: provider.id,
      };
      if (state.copyContact) {
        newProviderPayload.contact = provider.contact || '';
        newProviderPayload.email = provider.email || '';
        newProviderPayload.phone = provider.phone || '';
        newProviderPayload.link = provider.link || '';
      }
      const newProvider = await addProvider(newProviderPayload);
      if (!newProvider?.id) {
        throw new Error('No se pudo crear el nuevo proveedor.');
      }

      for (const line of selectedLines) {
        await addServiceLine(newProvider.id, {
          name: line.name,
          status: line.status,
          budget: line.budget,
          notes: line.notes,
        });
        await deleteServiceLine(provider.id, line.id);
      }

      await loadProviders();
      setSubmitting(false);
      if (typeof onCompleted === 'function') {
        onCompleted({ type: 'split', newProviderId: newProvider.id, lineCount: selectedLines.length });
      }
      onClose?.();
    } catch (e) {
      setError(e?.message || 'No se pudo dividir el proveedor.');
      setSubmitting(false);
    }
  };

  const renderActionFields = () => {
    if (state.mode === 'merge') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Línea principal</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={state.mergePrimaryId}
              onChange={(e) => setState((prev) => ({ ...prev, mergePrimaryId: e.target.value }))}
            >
              <option value="">Selecciona una línea</option>
              {serviceLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name || 'Sin nombre'} · {line.status || '—'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre combinado</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Ej. Catering + Barra libre"
                value={state.mergeName}
                onChange={(e) => setState((prev) => ({ ...prev, mergeName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={state.mergeStatus}
                onChange={(e) => setState((prev) => ({ ...prev, mergeStatus: e.target.value }))}
              >
                <option value="">Mantener existente</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto combinado</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Ej. 2500"
                value={state.mergeBudget}
                onChange={(e) => setState((prev) => ({ ...prev, mergeBudget: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Notas adicionales"
                value={state.mergeNotes}
                onChange={(e) => setState((prev) => ({ ...prev, mergeNotes: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del nuevo proveedor</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. Catering Exclusivo"
              value={state.splitName}
              onChange={(e) => setState((prev) => ({ ...prev, splitName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio principal</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. Catering"
              value={state.splitService}
              onChange={(e) => setState((prev) => ({ ...prev, splitService: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado inicial</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={state.splitStatus}
              onChange={(e) => setState((prev) => ({ ...prev, splitStatus: e.target.value }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              id="copy-contact"
              type="checkbox"
              checked={state.copyContact}
              onChange={(e) => setState((prev) => ({ ...prev, copyContact: e.target.checked }))}
            />
            <label htmlFor="copy-contact" className="text-sm text-gray-700">
              Copiar datos de contacto del proveedor original
            </label>
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={t('common.combinar_dividir_lineas_servicio')}
      size="large"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Selecciona las líneas de servicio afectadas y elige si quieres combinarlas en una sola
          ficha o moverlas a un proveedor nuevo. Los cambios se registran inmediatamente en
          Firestore.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Líneas del proveedor</h3>
              <span className="text-xs text-gray-500">
                Seleccionadas: {state.selectedIds.length}/{serviceLines.length}
              </span>
            </div>
            {serviceLines.length === 0 ? (
              <p className="text-sm text-gray-500">Este proveedor no tiene líneas registradas.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {serviceLines.map((line) => {
                  const checked = state.selectedIds.includes(line.id);
                  return (
                    <li
                      key={line.id}
                      className={`border rounded px-3 py-2 flex items-start gap-3 text-sm ${
                        checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => handleToggleLine(line.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{line.name || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-600">
                          Estado: {line.status || '—'} · Presupuesto:{' '}
                          {line.budget != null ? `€ ${line.budget}` : '—'}
                        </p>
                        {line.notes ? (
                          <p className="text-xs text-gray-500 truncate">{line.notes}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Acción</h3>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mergeMode"
                    checked={state.mode === 'merge'}
                    onChange={() => setState((prev) => ({ ...prev, mode: 'merge' }))}
                  />
                  Combinar en una sola línea
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mergeMode"
                    checked={state.mode === 'split'}
                    onChange={() => setState((prev) => ({ ...prev, mode: 'split' }))}
                  />
                  Mover a un proveedor nuevo
                </label>
              </div>
            </div>
            {renderActionFields()}
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Cambios irreversibles. Considera exportar el proveedor antes de realizar ajustes
            permanentes.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            {state.mode === 'merge' ? (
              <Button onClick={handleConfirmMerge} disabled={!canMerge || submitting}>
                {submitting ? 'Aplicando…' : {t('common.combinar_lineas')}}
              </Button>
            ) : (
              <Button onClick={handleConfirmSplit} disabled={!canSplit || submitting}>
                {submitting ? 'Creando…' : 'Crear proveedor nuevo'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
