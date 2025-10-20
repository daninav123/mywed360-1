import React, { useEffect, useMemo, useState } from 'react';

import { getDiscountLinks, createDiscountCode, updateDiscountCode, generatePartnerToken } from '../../services/adminDataService';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

const DEFAULT_SUMMARY = {
  totalLinks: 0,
  totalUses: 0,
  totalRevenue: 0,
  currency: 'EUR',
};

const formatCurrency = (value = 0, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(Number(value) || 0);

const STATUS_LABELS = {
  activo: 'Activo',
  agotado: 'Agotado',
  caducado: 'Caducado',
};

const TYPE_LABELS = {
  planner: 'Planner',
  influencer: 'Influencer',
  partner: 'Partner',
  campaign: 'Campaña',
};

const AdminDiscounts = () => {
  const [links, setLinks] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    url: '',
    type: 'campaign',
    maxUses: '',
    isPermanent: true,
    assignedTo: { name: '', email: '' },
    notes: '',
    status: 'activo'
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getDiscountLinks();
        if (!cancelled) {
          setLinks(Array.isArray(data.items) ? data.items : []);
          setSummary(data.summary || DEFAULT_SUMMARY);
          setError('');
        }
      } catch (err) {
        console.error('[AdminDiscounts] load failed:', err);
        if (!cancelled) {
          setError('No se pudieron obtener los enlaces de descuento.');
          setLinks([]);
          setSummary(DEFAULT_SUMMARY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return links.filter((link) => {
      const matchesStatus = statusFilter === 'all' || (link.status || '').toLowerCase() === statusFilter;
      const matchesQuery = query
        ? [link.code, link.url, link.assignedTo?.name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query.toLowerCase()))
        : true;
      return matchesStatus && matchesQuery;
    });
  }, [links, statusFilter, query]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copiado al portapapeles');
    } catch (copyError) {
      console.warn('[AdminDiscounts] clipboard copy failed:', copyError);
      alert('Error al copiar');
    }
  };

  const handleGeneratePartnerLink = async (discountId, code) => {
    if (!confirm(`¿Generar enlace de estadísticas para el código ${code}?`)) return;
    
    try {
      const result = await generatePartnerToken(discountId);
      await copyToClipboard(result.url);
      alert(`Enlace generado y copiado:\n${result.url}`);
    } catch (err) {
      console.error('[AdminDiscounts] generate partner link failed:', err);
      alert(err.message || 'Error al generar enlace');
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    if (creating || !formData.code.trim()) return;

    setCreating(true);
    try {
      const discountData = {
        code: formData.code.trim(),
        url: formData.url.trim() || undefined,
        type: formData.type,
        maxUses: formData.isPermanent ? null : (parseInt(formData.maxUses) || 1),
        assignedTo: formData.assignedTo.name || formData.assignedTo.email ? {
          name: formData.assignedTo.name || null,
          email: formData.assignedTo.email || null
        } : null,
        notes: formData.notes.trim() || undefined
      };

      const newDiscount = await createDiscountCode(discountData);
      
      setLinks(prev => [newDiscount, ...prev]);
      setSummary(prev => ({
        ...prev,
        totalLinks: prev.totalLinks + 1
      }));
      
      resetForm();
      setShowCreateModal(false);
    } catch (err) {
      console.error('[AdminDiscounts] create failed:', err);
      alert(err.message || 'Error al crear el código de descuento');
    } finally {
      setCreating(false);
    }
  };

  const handleEditDiscount = async (e) => {
    e.preventDefault();
    if (updating || !editingDiscount) return;

    setUpdating(true);
    try {
      const discountData = {
        url: formData.url.trim() || undefined,
        type: formData.type,
        maxUses: formData.isPermanent ? null : (parseInt(formData.maxUses) || 1),
        assignedTo: formData.assignedTo.name || formData.assignedTo.email ? {
          name: formData.assignedTo.name || null,
          email: formData.assignedTo.email || null
        } : null,
        notes: formData.notes.trim() || undefined,
        status: formData.status
      };

      const updatedDiscount = await updateDiscountCode(editingDiscount.id, discountData);
      
      setLinks(prev => prev.map(link => 
        link.id === editingDiscount.id ? updatedDiscount : link
      ));
      
      resetForm();
      setShowEditModal(false);
      setEditingDiscount(null);
    } catch (err) {
      console.error('[AdminDiscounts] update failed:', err);
      alert(err.message || 'Error al actualizar el código de descuento');
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      url: discount.url || '',
      type: discount.type || 'campaign',
      maxUses: discount.maxUses || '',
      isPermanent: !discount.maxUses,
      assignedTo: {
        name: discount.assignedTo?.name || '',
        email: discount.assignedTo?.email || ''
      },
      notes: discount.notes || '',
      status: discount.status || 'activo'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      url: '',
      type: 'campaign',
      maxUses: '',
      isPermanent: true,
      assignedTo: { name: '', email: '' },
      notes: '',
      status: 'activo'
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Descuentos y enlaces comerciales</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
            Seguimiento de enlaces de descuento, asignaciones y facturación asociada.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código, URL o responsable"
            className="rounded-md border border-soft px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-soft px-3 py-2 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="agotado">Agotados</option>
            <option value="caducado">Caducados</option>
          </select>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
          >
            + Crear código
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
          Cargando enlaces comerciales...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">{error}</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Enlaces totales</p>
              <p className="mt-2 text-2xl font-semibold">{summary.totalLinks}</p>
            </article>
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Usos acumulados</p>
              <p className="mt-2 text-2xl font-semibold">{summary.totalUses}</p>
            </article>
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Facturación asociada</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(summary.totalRevenue, summary.currency)}
              </p>
            </article>
          </section>

          <section className="rounded-xl border border-soft bg-surface shadow-sm">
            <header className="border-b border-soft px-4 py-3">
              <h2 className="text-sm font-semibold">Enlaces de descuento</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-soft text-sm" data-testid="admin-discounts-table">
                <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Usos</th>
                    <th className="px-4 py-3 text-left">Ingresos</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                    <th className="px-4 py-3 text-right">Facturación</th>
                    <th className="px-4 py-3 text-left">Creado</th>
                    <th className="px-4 py-3 text-left">Último uso</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft">
                  {filtered.map((link) => (
                    <tr key={link.id}>
                      <td className="px-4 py-3 font-medium">{link.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-[color:var(--color-primary,#6366f1)] hover:underline"
                          >
                            {link.url || '—'}
                          </a>
                          {link.url ? (
                            <button
                              type="button"
                              onClick={() => handleCopy(link.url)}
                              className="text-xs text-[var(--color-text-soft,#6b7280)] hover:text-[var(--color-primary,#6366f1)]"
                            >
                              Copiar
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col leading-tight">
                          <span>{link.assignedTo?.name || '—'}</span>
                          <span className="text-xs text-[var(--color-text-soft,#6b7280)]">
                            {TYPE_LABELS[link.assignedTo?.type] || link.assignedTo?.type || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{STATUS_LABELS[link.status] || link.status || '—'}</td>
                      <td className="px-4 py-3 text-right">{link.usageCount ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(link.totalRevenue, link.currency || summary.currency)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-soft,#6b7280)]">{link.createdAt || '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-soft,#6b7280)]">{link.lastUsedAt || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(link)}
                          className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={9}>
                        No se encontraron enlaces con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Modal crear código */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
            <header className="mb-4">
              <h2 className="text-lg font-semibold">Crear código de descuento</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Genera un nuevo código promocional o enlace comercial
              </p>
            </header>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="VERANO2025"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                >
                  <option value="campaign">Campaña</option>
                  <option value="planner">Planner</option>
                  <option value="influencer">Influencer</option>
                  <option value="partner">Partner</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isPermanent}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPermanent: e.target.checked }))}
                  />
                  Código permanente (sin límite de usos)
                </label>
              </div>

              {!formData.isPermanent && (
                <div>
                  <label className="block text-sm font-medium mb-1">Máximo de usos</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    placeholder="100"
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">URL personalizada (opcional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://mywed360.com/registro?ref=CODIGO"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Asignado a (opcional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.assignedTo.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: { ...prev.assignedTo, name: e.target.value } }))}
                    placeholder="Nombre"
                    className="rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    value={formData.assignedTo.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: { ...prev.assignedTo, email: e.target.value } }))}
                    placeholder="Email"
                    className="rounded-md border border-soft px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalles adicionales sobre este código..."
                  rows="2"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="rounded-md border border-soft px-4 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.code.trim()}
                  className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar código */}
      {showEditModal && editingDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
            <header className="mb-4">
              <h2 className="text-lg font-semibold">Editar código: {editingDiscount.code}</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Modifica los detalles del código promocional
              </p>
            </header>

            <form onSubmit={handleEditDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-[var(--color-text-soft,#6b7280)] mt-1">El código no se puede modificar</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                >
                  <option value="activo">Activo</option>
                  <option value="agotado">Agotado</option>
                  <option value="caducado">Caducado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                >
                  <option value="campaign">Campaña</option>
                  <option value="planner">Planner</option>
                  <option value="influencer">Influencer</option>
                  <option value="partner">Partner</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isPermanent}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPermanent: e.target.checked }))}
                  />
                  Código permanente (sin límite de usos)
                </label>
              </div>

              {!formData.isPermanent && (
                <div>
                  <label className="block text-sm font-medium mb-1">Máximo de usos</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    placeholder="100"
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">URL personalizada (opcional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://mywed360.com/registro?ref=CODIGO"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Asignado a (opcional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.assignedTo.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: { ...prev.assignedTo, name: e.target.value } }))}
                    placeholder="Nombre"
                    className="rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    value={formData.assignedTo.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: { ...prev.assignedTo, email: e.target.value } }))}
                    placeholder="Email"
                    className="rounded-md border border-soft px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalles adicionales sobre este código..."
                  rows="2"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDiscount(null);
                    resetForm();
                  }}
                  disabled={updating}
                  className="rounded-md border border-soft px-4 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-50"
                >
                  {updating ? 'Actualizando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;
