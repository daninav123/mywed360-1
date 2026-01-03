import React, { useState, useEffect } from 'react';
import { getWebSummary, getConversionRate } from '../../../services/webBuilder/analyticsService';

/**
 * AnalyticsDashboard - Dashboard de estadísticas de la web
 */
const AnalyticsDashboard = ({ slug, isLoading = false }) => {
  const [summary, setSummary] = useState(null);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getWebSummary(slug);
        setSummary(data);

        const rate = await getConversionRate(slug);
        setConversionRate(rate);
      } catch (error) {
        console.error('Error cargando analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadAnalytics();
    }
  }, [slug]);

  if (loading || !summary) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  const totalRSVPs = summary.rsvpSi + summary.rsvpNo + summary.rsvpQuizas;
  const confirmationRate = totalRSVPs > 0 ? (summary.rsvpSi / totalRSVPs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Visitantes */}
        <div className="bg-blue-100 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Visitantes</p>
              <p className="text-3xl font-bold text-blue-600">{summary.views}</p>
            </div>
            <div className="text-4xl">👁️</div>
          </div>
        </div>

        {/* Comparticiones */}
        <div className="bg-green-100 rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Comparticiones</p>
              <p className="text-3xl font-bold text-green-600">{summary.shares}</p>
            </div>
            <div className="text-4xl">📤</div>
          </div>
        </div>

        {/* Confirmaciones */}
        <div className="bg-purple-100 rounded-lg shadow-md p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Confirmaciones</p>
              <p className="text-3xl font-bold text-purple-600">{totalRSVPs}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        {/* Tasa de conversión */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Conversión</p>
              <p className="text-3xl font-bold text-orange-600">{conversionRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Desglose de RSVPs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Desglose de Confirmaciones</h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Sí */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-2">Asistirán</p>
            <p className="text-3xl font-bold text-green-600">{summary.rsvpSi}</p>
            <p className="text-xs text-gray-500 mt-2">
              {totalRSVPs > 0 ? ((summary.rsvpSi / totalRSVPs) * 100).toFixed(0) : 0}%
            </p>
          </div>

          {/* No */}
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-2">No Asistirán</p>
            <p className="text-3xl font-bold text-red-600">{summary.rsvpNo}</p>
            <p className="text-xs text-gray-500 mt-2">
              {totalRSVPs > 0 ? ((summary.rsvpNo / totalRSVPs) * 100).toFixed(0) : 0}%
            </p>
          </div>

          {/* Quizás */}
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-2">Aún No Saben</p>
            <p className="text-3xl font-bold text-yellow-600">{summary.rsvpQuizas}</p>
            <p className="text-xs text-gray-500 mt-2">
              {totalRSVPs > 0 ? ((summary.rsvpQuizas / totalRSVPs) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Comparticiones por plataforma */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📱 Comparticiones por Plataforma</h3>

        <div className="space-y-3">
          {Object.entries(summary.sharesByPlatform).map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">
                  {platform === 'whatsapp' && '💬'}
                  {platform === 'facebook' && '👍'}
                  {platform === 'twitter' && '𝕏'}
                  {platform === 'instagram' && '📷'}
                  {platform === 'linkedin' && '💼'}
                  {platform === 'telegram' && '✈️'}
                </span>
                <span className="capitalize font-semibold text-gray-900">{platform}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${summary.shares > 0 ? (count / summary.shares) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="font-bold text-gray-900 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-blue-900 mb-3">💡 Tips para Mejorar</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Comparte tu web en múltiples plataformas</li>
          <li>✓ Personaliza el mensaje de invitación</li>
          <li>✓ Actualiza regularmente tu web con nuevas fotos</li>
          <li>✓ Recuerda a los invitados que confirmen su asistencia</li>
          <li>✓ Usa emojis para hacer el mensaje más atractivo</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
