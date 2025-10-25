import React, { useEffect, useMemo, useState } from 'react';

import { getDiscountLinks, createDiscountCode, updateDiscountCode, generatePartnerToken } from '../../services/adminDataService';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useTranslations } from '../../hooks/useTranslations';

const makeId = () => Math.random().toString(36).slice(2, 10);

const createEmptyTier = () => ({
  const { t } = useTranslations();

  id: makeId(),
  label: '',
  minRevenue: '0',
  maxRevenue: '',
  percentage: '0',
  fixedAmount: '0',
});

const createEmptyPeriod = () => ({
  id: makeId(),
  label: '',
  startMonth: '0',
  endMonth: '',
  tiers: [createEmptyTier()],
});

const defaultCommissionState = () => ({
  currency: 'EUR',
  periods: [],
});

const toSafeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const estimateCommissionFromRules = (rules, revenueValue) => {
  if (!rules || !Array.isArray(rules.periods) || rules.periods.length === 0) return 0;
  const revenue = toSafeNumber(revenueValue);
  const tiers = [];

  rules.periods.forEach((period) => {
    if (!period || !Array.isArray(period.tiers)) return;
    period.tiers.forEach((tier) => {
      if (tier) tiers.push(tier);
    });
  });

  if (!tiers.length) return 0;

  const pickTier = (predicate) =>
    tiers
      .filter(predicate)
      .reduce((best, tier) => {
        if (!best) return tier;
        return toSafeNumber(tier.minRevenue) >= toSafeNumber(best.minRevenue) ? tier : best;
      }, null);

  let chosen = pickTier((tier) => {
    const min = toSafeNumber(tier.minRevenue);
    const max =
      tier.maxRevenue === null || tier.maxRevenue === undefined
        ? Infinity
        : toSafeNumber(tier.maxRevenue, Infinity);
    return revenue >= min && revenue <= max;
  });

  if (!chosen) {
    chosen = pickTier((tier) => revenue >= toSafeNumber(tier.minRevenue));
  }

  if (!chosen) {
    chosen = tiers.reduce((best, tier) => {
      if (!best) return tier;
      return toSafeNumber(tier.minRevenue) >= toSafeNumber(best.minRevenue) ? tier : best;
    }, null);
  }

  if (!chosen) return 0;

  const percentage = toSafeNumber(chosen.percentage);
  const fixedAmount = toSafeNumber(chosen.fixedAmount);
  return revenue * percentage + fixedAmount;
};

const hydrateCommissionForm = (rules) => {
  if (!rules || typeof rules !== 'object') {
    return defaultCommissionState();
  }

  const currency = typeof rules.currency === 'string' && rules.currency.trim()
    ? rules.currency.trim().toUpperCase()
    : 'EUR';

  const periods = Array.isArray(rules.periods)
    ? rules.periods.map((period) => {
        const periodId = typeof period.id === 'string' && period.id.trim() ? period.id.trim() : makeId();
        const tiers = Array.isArray(period.tiers) && period.tiers.length
          ? period.tiers.map((tier) => {
              const tierId = typeof tier.id === 'string' && tier.id.trim() ? tier.id.trim() : makeId();
              const pct = Number(tier.percentage ?? 0);
              const percentageValue = Number.isFinite(pct) ? pct * 100 : 0;
              return {
                id: tierId,
                label: typeof tier.label === 'string' ? tier.label : '',
                minRevenue: tier.minRevenue !== undefined && tier.minRevenue !== null ? String(tier.minRevenue) : '0',
                maxRevenue: tier.maxRevenue !== undefined && tier.maxRevenue !== null ? String(tier.maxRevenue) : '',
                percentage: String(Number.isFinite(percentageValue) ? Number(percentageValue.toFixed(4)) : 0),
                fixedAmount: tier.fixedAmount !== undefined && tier.fixedAmount !== null ? String(tier.fixedAmount) : '0',
              };
            })
          : [createEmptyTier()];

        return {
          id: periodId,
          label: typeof period.label === 'string' ? period.label : '',
          startMonth: period.startMonth !== undefined && period.startMonth !== null ? String(period.startMonth) : '0',
          endMonth: period.endMonth !== undefined && period.endMonth !== null ? String(period.endMonth) : '',
          tiers,
        };
      })
    : [];

  return {
    currency,
    periods,
  };
};

const buildCommissionPayload = (state) => {
  if (!state || typeof state !== 'object') return null;

  const currency = typeof state.currency === 'string' && state.currency.trim()
    ? state.currency.trim().toUpperCase()
    : 'EUR';

  const periodsSource = Array.isArray(state.periods) ? state.periods : [];
  const periods = [];

  for (const period of periodsSource) {
    const startMonth = Math.max(0, Number.parseInt(period.startMonth || '0', 10) || 0);
    let endMonth = period.endMonth === '' || period.endMonth === null || period.endMonth === undefined
      ? null
      : Number.parseInt(period.endMonth, 10);

    if (Number.isFinite(endMonth) && endMonth <= startMonth) {
      throw new Error('El mes de fin debe ser mayor que el mes de inicio en cada periodo.');
    }
    if (!Number.isFinite(endMonth)) {
      endMonth = null;
    }

    const tiersSource = Array.isArray(period.tiers) ? period.tiers : [];
    const tiers = [];

    for (const tier of tiersSource) {
      const minRevenue = Number(tier.minRevenue || 0);
      if (!Number.isFinite(minRevenue) || minRevenue < 0) {
        throw new Error('El minimo de facturacion de un tramo no es valido.');
      }

      let maxRevenue = null;
      if (tier.maxRevenue !== '' && tier.maxRevenue !== undefined && tier.maxRevenue !== null) {
        const parsedMax = Number(tier.maxRevenue);
        if (!Number.isFinite(parsedMax) || parsedMax <= minRevenue) {
          throw new Error('El maximo de facturacion debe ser mayor que el minimo.');
        }
        maxRevenue = parsedMax;
      }

      let percentage = Number(tier.percentage || 0);
      if (!Number.isFinite(percentage) || percentage < 0) {
        throw new Error('El porcentaje de comision debe ser mayor o igual a 0.');
      }
      if (percentage > 1) {
        percentage /= 100;
      }
      if (percentage > 1) {
        throw new Error('El porcentaje de comision no puede superar el 100%.');
      }

      let fixedAmount = Number(tier.fixedAmount || 0);
      if (!Number.isFinite(fixedAmount) || fixedAmount < 0) {
        throw new Error('El bonus fijo debe ser un numero positivo.');
      }

      tiers.push({
        id: typeof tier.id === 'string' && tier.id.trim() ? tier.id.trim() : makeId(),
        label: typeof tier.label === 'string' ? tier.label : '',
        minRevenue,
        maxRevenue,
        percentage,
        fixedAmount,
      });
    }

    if (!tiers.length) {
      continue;
    }

    tiers.sort((a, b) => a.minRevenue - b.minRevenue);

    periods.push({
      id: typeof period.id === 'string' && period.id.trim() ? period.id.trim() : makeId(),
      label: typeof period.label === 'string' ? period.label : '',
      startMonth,
      endMonth,
      tiers,
    });
  }

  if (!periods.length) {
    return null;
  }

  periods.sort((a, b) => a.startMonth - b.startMonth);

  return {
    currency,
    periods,
  };
};

const CommissionRulesEditor = ({ value, onChange, disabled }) => {
  const config = value || defaultCommissionState();

  const handleCurrencyChange = (event) => {
    const next = event.target.value.toUpperCase().slice(0, 4);
    onChange({ ...config, currency: next || 'EUR' });
  };

  const handleAddPeriod = () => {
    const nextPeriod = createEmptyPeriod();
    onChange({ ...config, periods: [...(config.periods || []), nextPeriod] });
  };

  const handleRemovePeriod = (periodId) => {
    const next = (config.periods || []).filter((period) => period.id !== periodId);
    onChange({ ...config, periods: next });
  };

  const handlePeriodFieldChange = (periodId, field, value) => {
    const next = (config.periods || []).map((period) =>
      period.id === periodId ? { ...period, [field]: value } : period
    );
    onChange({ ...config, periods: next });
  };

  const handleAddTier = (periodId) => {
    const next = (config.periods || []).map((period) => {
      if (period.id !== periodId) return period;
      return {
        ...period,
        tiers: [...(period.tiers || []), createEmptyTier()],
      };
    });
    onChange({ ...config, periods: next });
  };

  const handleRemoveTier = (periodId, tierId) => {
    const next = (config.periods || []).map((period) => {
      if (period.id !== periodId) return period;
      const remaining = (period.tiers || []).filter((tier) => tier.id !== tierId);
      return {
        ...period,
        tiers: remaining.length ? remaining : [createEmptyTier()],
      };
    });
    onChange({ ...config, periods: next });
  };

  const handleTierFieldChange = (periodId, tierId, field, value) => {
    const next = (config.periods || []).map((period) => {
      if (period.id !== periodId) return period;
      const tiers = (period.tiers || []).map((tier) =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      );
      return { ...period, tiers };
    });
    onChange({ ...config, periods: next });
  };

  return (
    <div className="rounded-lg border border-soft p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Comisiones</h3>
          <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
            Define porcentajes y bonus por periodo. Si lo dejas vacio, el enlace no mostrara comision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--color-text-soft,#6b7280)]">
            Moneda
          </label>
          <input
            type="text"
            maxLength={4}
            value={config.currency || ''}
            onChange={handleCurrencyChange}
            disabled={disabled}
            className="w-20 rounded-md border border-soft px-2 py-1 text-sm uppercase"
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {(config.periods || []).map((period, periodIndex) => (
          <div key={period.id} className="rounded-md border border-dashed border-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-soft,#6b7280)]">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={period.label || ''}
                    onChange={(event) => handlePeriodFieldChange(period.id, 'label', event.target.value)}
                    disabled={disabled}
                    className="rounded-md border border-soft px-3 py-1 text-sm"
                    placeholder={`Periodo ${periodIndex + 1}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-soft,#6b7280)]">
                    Mes inicio
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={period.startMonth}
                    onChange={(event) => handlePeriodFieldChange(period.id, 'startMonth', event.target.value)}
                    disabled={disabled}
                    className="w-24 rounded-md border border-soft px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-soft,#6b7280)]">
                    Mes fin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={period.endMonth === null ? '' : period.endMonth}
                    onChange={(event) => handlePeriodFieldChange(period.id, 'endMonth', event.target.value)}
                    disabled={disabled}
                    className="w-24 rounded-md border border-soft px-3 py-1 text-sm"
                    placeholder="Sin limite"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePeriod(period.id)}
                disabled={disabled}
                className="text-xs text-[var(--color-text-soft,#6b7280)] hover:text-red-500"
              >
                Eliminar periodo
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Tramo</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Min facturacion</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Max facturacion</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">% Comision</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Bonus fijo</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(period.tiers || []).map((tier, tierIndex) => (
                    <tr key={tier.id}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={tier.label || ''}
                          onChange={(event) => handleTierFieldChange(period.id, tier.id, 'label', event.target.value)}
                          disabled={disabled}
                          placeholder={`Tramo ${tierIndex + 1}`}
                          className="w-32 rounded-md border border-soft px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={tier.minRevenue}
                          onChange={(event) =>
                            handleTierFieldChange(period.id, tier.id, 'minRevenue', event.target.value)
                          }
                          disabled={disabled}
                          className="w-28 rounded-md border border-soft px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={tier.maxRevenue === null ? '' : tier.maxRevenue}
                          onChange={(event) =>
                            handleTierFieldChange(period.id, tier.id, 'maxRevenue', event.target.value)
                          }
                          disabled={disabled}
                          className="w-28 rounded-md border border-soft px-2 py-1 text-xs"
                          placeholder="Sin limite"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tier.percentage}
                            onChange={(event) =>
                              handleTierFieldChange(period.id, tier.id, 'percentage', event.target.value)
                            }
                            disabled={disabled}
                            className="w-20 rounded-md border border-soft px-2 py-1 text-xs"
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.fixedAmount}
                          onChange={(event) =>
                            handleTierFieldChange(period.id, tier.id, 'fixedAmount', event.target.value)
                          }
                          disabled={disabled}
                          className="w-24 rounded-md border border-soft px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(period.id, tier.id)}
                          disabled={disabled}
                          className="text-xs text-[var(--color-text-soft,#6b7280)] hover:text-red-500"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleAddTier(period.id)}
                disabled={disabled}
                className="text-xs font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
              >
                Anadir tramo
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddPeriod}
          disabled={disabled}
          className="text-xs font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
        >
          Anadir periodo
        </button>
      </div>

      {!config.periods?.length && (
        <p className="mt-3 text-xs text-[var(--color-text-soft,#6b7280)]">
          Agrega al menos un periodo para calcular comisiones. Los tramos aplican sobre la facturacion del periodo.
        </p>
      )}
    </div>
  );
};

const DEFAULT_SUMMARY = {
  totalLinks: 0,
  totalUses: 0,
  totalRevenue: 0,
  currency: 'EUR',
};

const formatCurrency = (value = 0, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(Number(value) || 0);

const summarizeCommissionRules = (rules) => {
  if (!rules || !Array.isArray(rules.periods) || rules.periods.length === 0) {
    return {
      label: 'Sin reglas',
      description: {t('common.este_enlace_tiene_comisiones_configuradas')},
      hasRules: false,
    };
  }

  const currency = rules.currency || 'EUR';
  const detailParts = [];
  const periodParts = [];

  rules.periods.slice(0, 2).forEach((period, index) => {
    if (!period || !Array.isArray(period.tiers) || period.tiers.length === 0) return;
    const tier = period.tiers[0];
    const label = period.label || `Periodo ${index + 1}`;
    const percentageValue = Number(tier.percentage * 100);
    const percentageLabel = Number.isFinite(percentageValue)
      ? `${percentageValue % 1 === 0 ? percentageValue.toFixed(0) : percentageValue.toFixed(2)}%`
      : '0%';
    const fixedLabel = tier.fixedAmount
      ? formatCurrency(tier.fixedAmount, currency)
      : null;
    const entry = fixedLabel ? `${percentageLabel} + ${fixedLabel}` : percentageLabel;
    detailParts.push(`${label}: ${entry}`);
    periodParts.push(`${label}: ${entry}`);
  });

  const hidden = Math.max(0, rules.periods.length - periodParts.length);
  let label = periodParts.join(' | ');
  if (!label) {
    label = `${rules.periods.length} periodo${rules.periods.length > 1 ? 's' : ''}`;
  }
  if (hidden > 0) {
    label += ` (+${hidden})`;
  }

  return {
    label,
    description: `Moneda ${currency}. ${detailParts.join(' | ') || 'Revisa el detalle para conocer los tramos.'}`,
    hasRules: true,
  };
};

const STATUS_LABELS = {
  activo: 'Activo',
  agotado: 'Agotado',
  caducado: 'Caducado',
};

const TYPE_LABELS = {
  planner: 'Planner',
  influencer: 'Influencer',
  partner: 'Partner',
  campaign: {t('common.campana')},
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
    discountPercentage: '',
    validFrom: '',
    validUntil: '',
    assignedTo: { name: '', email: '' },
    notes: '',
    status: 'activo',
    commissionRules: defaultCommissionState(),
  });
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');

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

  const commissionSummary = useMemo(() => {
    const currency = summary?.commission?.currency || summary?.currency || 'EUR';

    if (summary?.commission) {
      return {
        total: toSafeNumber(summary.commission.total),
        average: toSafeNumber(summary.commission.average),
        missing: Number(summary.commission.missing || 0),
        configured: Number(summary.commission.configured || 0),
        currency,
      };
    }

    if (!Array.isArray(links) || links.length === 0) {
      return { total: 0, average: 0, missing: 0, configured: 0, currency };
    }

    let total = 0;
    let configured = 0;
    let missing = 0;

    links.forEach((link) => {
      const hasRules = link?.commissionRules?.periods?.length;
      if (hasRules) {
        configured += 1;
        const estimateFromBackend = Number(link?.commissionEstimate);
        if (Number.isFinite(estimateFromBackend)) {
          total += estimateFromBackend;
        } else {
          total += estimateCommissionFromRules(link.commissionRules, link.revenue);
        }
      } else {
        missing += 1;
      }
    });

    return {
      total,
      average: configured ? total / configured : 0,
      missing,
      configured,
      currency,
    };
  }, [summary, links]);

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

    setFormError('');

    let commissionPayload = null;
    try {
      commissionPayload = buildCommissionPayload(formData.commissionRules);
    } catch (validationError) {
      setFormError(validationError.message || 'Error al validar las reglas de comision.');
      return;
    }

    setCreating(true);
    try {
      const discountData = {
        code: formData.code.trim(),
        url: formData.url.trim() || undefined,
        type: formData.type,
        maxUses: formData.isPermanent ? null : (parseInt(formData.maxUses) || 1),
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        assignedTo: formData.assignedTo.name || formData.assignedTo.email ? {
          name: formData.assignedTo.name || null,
          email: formData.assignedTo.email || null
        } : null,
        notes: formData.notes.trim() || undefined,
        commissionRules: commissionPayload,
      };

      if (commissionPayload && commissionPayload.currency) {
        discountData.currency = commissionPayload.currency;
      }

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
      setFormError(err.message || 'Error al crear el codigo de descuento');
    } finally {
      setCreating(false);
    }
  };



  const handleEditDiscount = async (e) => {
    e.preventDefault();
    if (updating || !editingDiscount) return;

    setEditError('');

    let commissionPayload = null;
    try {
      commissionPayload = buildCommissionPayload(formData.commissionRules);
    } catch (validationError) {
      setEditError(validationError.message || 'Error al validar las reglas de comision.');
      return;
    }

    setUpdating(true);

    try {
      const discountData = {
        url: formData.url.trim() || undefined,
        type: formData.type,
        maxUses: formData.isPermanent ? null : (parseInt(formData.maxUses) || 1),
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        assignedTo: formData.assignedTo.name || formData.assignedTo.email ? {
          name: formData.assignedTo.name || null,
          email: formData.assignedTo.email || null
        } : null,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        commissionRules: commissionPayload,
      };

      if (commissionPayload && commissionPayload.currency) {
        discountData.currency = commissionPayload.currency;
      }

      const updatedDiscount = await updateDiscountCode(editingDiscount.id, discountData);

      setLinks(prev => prev.map(link =>
        link.id === editingDiscount.id ? updatedDiscount : link
      ));

      resetForm();
      setShowEditModal(false);
      setEditingDiscount(null);
    } catch (err) {
      console.error('[AdminDiscounts] update failed:', err);
      setEditError(err.message || 'Error al actualizar el codigo de descuento');
    } finally {
      setUpdating(false);
    }
  };


  const openEditModal = (discount) => {
    setFormError('');
    setEditError('');
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      url: discount.url || '',
      type: discount.type || 'campaign',
      maxUses: discount.maxUses || '',
      isPermanent: !discount.maxUses,
      discountPercentage: discount.discountPercentage || '',
      validFrom: discount.validFrom ? new Date(discount.validFrom).toISOString().split('T')[0] : '',
      validUntil: discount.validUntil ? new Date(discount.validUntil).toISOString().split('T')[0] : '',
      assignedTo: {
        name: discount.assignedTo?.name || '',
        email: discount.assignedTo?.email || ''
      },
      notes: discount.notes || '',
      status: discount.status || 'activo',
      commissionRules: hydrateCommissionForm(discount.commissionRules),
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
      discountPercentage: '',
      validFrom: '',
      validUntil: '',
      assignedTo: { name: '', email: '' },
      notes: '',
      status: 'activo',
      commissionRules: defaultCommissionState(),
    });
    setFormError('');
    setEditError('');
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
            placeholder={t('common.buscar_por_codigo_url_responsable')}
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
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Comisiones estimadas</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(commissionSummary.total, commissionSummary.currency)}
              </p>
              <div className="mt-3 space-y-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                <div className="flex items-center justify-between">
                  <span>Media por enlace</span>
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(commissionSummary.average, commissionSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enlaces sin reglas</span>
                  <span className="font-semibold text-gray-700">{commissionSummary.missing}</span>
                </div>
              </div>
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
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">% Desc.</th>
                    <th className="px-4 py-3 text-left">Usos</th>
                    <th className="px-4 py-3 text-left">Ingresos</th>
                    <th className="px-4 py-3 text-left">Comision</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft">
                  {filtered.map((link) => {
                    const commissionInfo = summarizeCommissionRules(link.commissionRules);
                    return (
                      <tr key={link.id}>
                        <td className="px-4 py-3 font-medium font-mono">{link.code}</td>
                        <td className="px-4 py-3 capitalize">{TYPE_LABELS[link.type] || link.type || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          {link.discountPercentage ? `${link.discountPercentage}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">{link.uses || 0}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          {formatCurrency(link.revenue, link.currency || summary.currency)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          title={commissionInfo.description}
                        >
                          <span
                            className={
                              commissionInfo.hasRules
                                ? 'inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700'
                                : 'text-xs text-[var(--color-text-soft,#6b7280)]'
                            }
                          >
                            {commissionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              link.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {STATUS_LABELS[link.status] || link.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleGeneratePartnerLink(link.id, link.code)}
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-sm"
                            title="Generar enlace de estad�sticas"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Generar
                          </button>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => copyToClipboard(link.code)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Copiar
                          </button>
                          <button
                            onClick={() => openEditModal(link)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Modal crear c�digo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
            <header className="mb-4">
              <h2 className="text-lg font-semibold">Crear c�digo de descuento</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Genera un nuevo c�digo promocional o enlace comercial
              </p>
            </header>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">C�digo *</label>
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
                  <option value="campaign">Campa�a</option>
                  <option value="planner">Planner</option>
                  <option value="influencer">Influencer</option>
                  <option value="partner">Partner</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Porcentaje de descuento *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                    placeholder="10"
                    className="w-full rounded-md border border-soft px-3 py-2 pr-8 text-sm"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isPermanent}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPermanent: e.target.checked }))}
                  />
                  C�digo permanente (sin l�mite de usos)
                </label>
              </div>

              {!formData.isPermanent && (
                <div>
                  <label className="block text-sm font-medium mb-1">M�ximo de usos</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha inicio validez</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opcional: desde cu�ndo es v�lido</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha fin validez</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opcional: hasta cu�ndo es v�lido</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL personalizada (opcional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://maloveapp.com/registro?ref=CODIGO"
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
                  placeholder="Detalles adicionales sobre este c�digo..."
                  rows="2"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <CommissionRulesEditor
                value={formData.commissionRules}
                onChange={(next) => setFormData(prev => ({ ...prev, commissionRules: next }))}
                disabled={creating}
              />

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
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
                  {creating ? 'Creando...' : 'Crear c�digo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar c�digo */}
      {showEditModal && editingDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
            <header className="mb-4">
              <h2 className="text-lg font-semibold">Editar c�digo: {editingDiscount.code}</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Modifica los detalles del c�digo promocional
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
                <label className="block text-sm font-medium mb-1">Porcentaje de descuento</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                    placeholder="10"
                    className="w-full rounded-md border border-soft px-3 py-2 pr-8 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha inicio validez</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opcional: desde cuándo es válido</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha fin validez</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opcional: hasta cuándo es válido</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL personalizada (opcional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://maloveapp.com/registro?ref=CODIGO"
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
                  placeholder={t('common.detalles_adicionales_sobre_este_codigo')}
                  rows="2"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                />
              </div>

              <CommissionRulesEditor
                value={formData.commissionRules}
                onChange={(next) => setFormData(prev => ({ ...prev, commissionRules: next }))}
                disabled={updating}
              />

              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}

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






