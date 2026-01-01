import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TrendingUp, Users, CreditCard, Calendar, ExternalLink, DollarSign, Link2, Copy } from 'lucide-react';
import { db } from '../firebaseConfig';
import { formatDate as formatDateUtil } from '../utils/formatUtils';
const PartnerStats = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004'}/api/partner/${token}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('Código de descuento no encontrado o token inválido');
          } else if (response.status === 403) {
            setError('Este código de descuento está desactivado');
          } else {
            setError('Error al cargar las estadísticas');
          }
          setLoading(false);
          return;
        }

        const result = await response.json();
        setData(result);
        setError('');
      } catch (err) {
        // console.error('[PartnerStats] Error:', err);
        setError('Error de conexión. Por favor, intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const formatCurrency = (amount, currency = 'EUR') => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!Number.isFinite(value)) return '0 %';
    return `${(value * 100).toFixed(2)} %`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-danger-10)' }}>
            <ExternalLink className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Error</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return formatDateUtil(dateString, 'long');
    } catch {
      return null;
    }
  };

  const commissionTotal = data.stats?.total?.commission || null;
  const commissionLastMonth = data.stats?.lastMonth?.commission || null;
  const commissionCurrency = commissionTotal?.currency || data.stats?.total?.currency || 'EUR';
  const hasCommissionRules = !!commissionTotal?.hasRules;
  const commissionBreakdown = Array.isArray(commissionTotal?.breakdown) ? commissionTotal.breakdown : [];

  return (
    <div className="max-w-[1280px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Panel de Partner</h1>
        <p className="text-muted">Código: {data.code}</p>
      </div>
      {/* Info del Partner */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex items-center justify-between">
            <div>
              {data.assignedTo?.name && (
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{data.assignedTo.name}</p>
              )}
              {data.assignedTo?.email && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{data.assignedTo.email}</p>
              )}
            </div>
            {(data.validFrom || data.validUntil) && (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {data.validFrom && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Desde: <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(data.validFrom)}</span>
                    </span>
                  </div>
                )}
                {data.validUntil && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Hasta: <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(data.validUntil)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Commission */}
          <div className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', borderColor: 'var(--color-primary)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Comision Generada</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(commissionTotal?.amount || 0, commissionCurrency)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  {hasCommissionRules ? 'Incluye porcentajes y bonus activos.' : 'Sin reglas configuradas desde el panel administrador.'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-10)' }}>
                <DollarSign className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>

          {/* Código y Enlace */}
          <div className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', borderColor: 'var(--color-success)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tu Código</p>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                  {data.code}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-10)' }}>
                <Link2 className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Enlace copiado al portapapeles');
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-success-10)', color: 'var(--color-success)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-success-10)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-success-10)'}
            >
              <Copy className="w-3 h-3" />
              Copiar enlace de estadísticas
            </button>
          </div>

          {/* Last Month Revenue */}
          <div className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', borderColor: 'var(--color-info)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Ultimo Mes</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(data.stats.lastMonth.revenue, data.stats.lastMonth.currency)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Comision: {formatCurrency(commissionLastMonth?.amount || 0, commissionLastMonth?.currency || commissionCurrency)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info-10)' }}>
                <Calendar className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', borderColor: '#A855F7' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Usuarios Unicos</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{data.stats.total.users}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <Users className="w-6 h-6" style={{ color: '#A855F7' }} />
              </div>
            </div>
          </div>

          {/* Total Uses */}
          <div className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', borderColor: '#F97316' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Usos Totales</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{data.stats.total.uses}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <ExternalLink className="w-6 h-6" style={{ color: '#F97316' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Detalle de comisiones</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Periodos y tramos aplicados sobre la facturacion generada.</p>
          </div>
          {hasCommissionRules ? (
            commissionBreakdown.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  <thead style={{ backgroundColor: 'var(--color-bg)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Periodo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Facturacion evaluada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>% aplicado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Bonus fijo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Comision</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Pagos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    {commissionBreakdown.map((item) => (
                      <tr key={item.periodId} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {(item.tierLabel || 'Tramo base')} - desde {formatCurrency(item.minRevenue || 0, commissionCurrency)}
                            {item.maxRevenue !== null ? ` hasta ${formatCurrency(item.maxRevenue, commissionCurrency)}` : ' sin limite'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{formatCurrency(item.revenue, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{formatPercentage(item.percentageApplied || 0)}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{formatCurrency(item.fixedApplied || 0, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(item.commission, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{item.paymentCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-8 py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Aun no hay pagos dentro de los periodos definidos.</div>
            )
          ) : (
            <div className="px-8 py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Configura reglas de comision desde el panel administrador para mostrar este detalle.</div>
          )}
          {hasCommissionRules && commissionTotal?.unassignedRevenue > 0 && (
            <div className="px-8 py-4 text-xs" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-muted)' }}>
              {formatCurrency(commissionTotal.unassignedRevenue, commissionCurrency)} fuera de periodos definidos (no suma a la comision).
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Usuarios que usaron tu código</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Últimos 50 usuarios registrados</p>
          </div>
          
          {data.users && data.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                      Importe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  {data.users.map((user, idx) => (
                    <tr key={idx} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text)' }}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                        {formatCurrency(user.amount, data.stats.total.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-muted)' }}>
                        {user.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-8 py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>Aún no hay usuarios que hayan usado este código</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>MaLoveApp - Panel de Estadísticas para Partners</p>
          <p className="mt-1">Este enlace es privado, no lo compartas con terceros</p>
        </div>
    </div>
  );
};

export default PartnerStats;
