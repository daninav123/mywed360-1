import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, Users, CreditCard, Calendar, ExternalLink, DollarSign } from 'lucide-react';

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
        console.error('[PartnerStats] Error:', err);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
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
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Partner
              </h1>
              <p className="text-gray-600 mt-1">
                Código: <span className="font-mono font-semibold text-indigo-600">{data.code}</span>
              </p>
            </div>
            <div className="text-right">
              {data.assignedTo?.name && (
                <p className="text-lg font-semibold text-gray-900">{data.assignedTo.name}</p>
              )}
              {data.assignedTo?.email && (
                <p className="text-sm text-gray-600">{data.assignedTo.email}</p>
              )}
            </div>
          </div>
          
          {/* Fechas de validez */}
          {(data.validFrom || data.validUntil) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {data.validFrom && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      Válido desde: <span className="font-semibold text-gray-900">{formatDate(data.validFrom)}</span>
                    </span>
                  </div>
                )}
                {data.validUntil && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span className="text-gray-600">
                      Válido hasta: <span className="font-semibold text-gray-900">{formatDate(data.validUntil)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Commission */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Comision Generada</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionTotal?.amount || 0, commissionCurrency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {hasCommissionRules ? 'Incluye porcentajes y bonus activos.' : 'Sin reglas configuradas desde el panel administrador.'}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Facturacion Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.stats.total.revenue, data.stats.total.currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Last Month Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ultimo Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.stats.lastMonth.revenue, data.stats.lastMonth.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Comision: {formatCurrency(commissionLastMonth?.amount || 0, commissionLastMonth?.currency || commissionCurrency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usuarios Unicos</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.total.users}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Uses */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.total.uses}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Detalle de comisiones</h2>
            <p className="text-sm text-gray-600 mt-1">Periodos y tramos aplicados sobre la facturacion generada.</p>
          </div>
          {hasCommissionRules ? (
            commissionBreakdown.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facturacion evaluada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% aplicado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus fijo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comision</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionBreakdown.map((item) => (
                      <tr key={item.periodId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500">
                            {(item.tierLabel || 'Tramo base')} - desde {formatCurrency(item.minRevenue || 0, commissionCurrency)}
                            {item.maxRevenue !== null ? ` hasta ${formatCurrency(item.maxRevenue, commissionCurrency)}` : ' sin limite'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.revenue, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatPercentage(item.percentageApplied || 0)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.fixedApplied || 0, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(item.commission, commissionCurrency)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.paymentCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-8 py-10 text-center text-sm text-gray-500">Aun no hay pagos dentro de los periodos definidos.</div>
            )
          ) : (
            <div className="px-8 py-10 text-center text-sm text-gray-500">Configura reglas de comision desde el panel administrador para mostrar este detalle.</div>
          )}
          {hasCommissionRules && commissionTotal?.unassignedRevenue > 0 && (
            <div className="px-8 py-4 bg-gray-50 text-xs text-gray-500">
              {formatCurrency(commissionTotal.unassignedRevenue, commissionCurrency)} fuera de periodos definidos (no suma a la comision).
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Usuarios que usaron tu código</h2>
            <p className="text-sm text-gray-600 mt-1">Últimos 50 usuarios registrados</p>
          </div>
          
          {data.users && data.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.users.map((user, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(user.amount, data.stats.total.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-8 py-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aún no hay usuarios que hayan usado este código</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>MyWed360 - Panel de Estadísticas para Partners</p>
          <p className="mt-1">Este enlace es privado, no lo compartas con terceros</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerStats;
