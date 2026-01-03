import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Music, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * TimelineAlerts - Sistema de detección inteligente de problemas
 * Analiza el timeline completo y muestra alertas críticas
 */
const TimelineAlerts = ({ moments, blocks }) => {
  const alerts = useMemo(() => {
    const detectedAlerts = [];

    // Analizar cada bloque
    blocks.forEach((block) => {
      const blockMoments = (moments[block.id] || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );

      if (blockMoments.length === 0) return;

      // ALERTA 1: Momentos sin canción definitiva (solo para tipo 'song')
      const withoutDefinitiveSong = blockMoments.filter((m) => {
        const musicType = m.musicType || 'song';
        // Solo alertar si es tipo canción y no tiene definitiva
        return musicType === 'song' && !m.isDefinitive && m.type === 'musical';
      });
      if (withoutDefinitiveSong.length > 0) {
        detectedAlerts.push({
          type: 'warning',
          category: 'music',
          severity: 'medium',
          title: `${withoutDefinitiveSong.length} momento(s) sin canción definitiva en ${block.name}`,
          description: `Los momentos "${withoutDefinitiveSong.map((m) => m.title).join('", "')}" necesitan una canción marcada como definitiva.`,
          blockId: block.id,
          momentIds: withoutDefinitiveSong.map((m) => m.id),
        });
      }

      // ALERTA 1B: Playlists sin configurar
      const playlistsWithoutUrl = blockMoments.filter((m) => {
        const musicType = m.musicType || 'song';
        return musicType === 'playlist' && (!m.playlistUrl || m.playlistUrl.trim() === '');
      });
      if (playlistsWithoutUrl.length > 0) {
        detectedAlerts.push({
          type: 'warning',
          category: 'music',
          severity: 'medium',
          title: `${playlistsWithoutUrl.length} playlist(s) sin configurar en ${block.name}`,
          description: `Los momentos "${playlistsWithoutUrl.map((m) => m.title).join('", "')}" necesitan un enlace de playlist de Spotify.`,
          blockId: block.id,
          momentIds: playlistsWithoutUrl.map((m) => m.id),
        });
      }

      // ALERTA 2: Momentos sin horario
      const withoutTime = blockMoments.filter((m) => !m.time || m.time.trim() === '');
      if (withoutTime.length > 0) {
        detectedAlerts.push({
          type: 'warning',
          category: 'time',
          severity: 'high',
          title: `${withoutTime.length} momento(s) sin horario en ${block.name}`,
          description: `Configura la hora para: "${withoutTime.map((m) => m.title).join('", "')}"`,
          blockId: block.id,
          momentIds: withoutTime.map((m) => m.id),
        });
      }

      // ALERTA 3: Detectar huecos grandes entre momentos
      for (let i = 0; i < blockMoments.length - 1; i++) {
        const current = blockMoments[i];
        const next = blockMoments[i + 1];

        if (current.time && next.time) {
          const gap = calculateGap(current.time, next.time);
          if (gap > 30) {
            // Más de 30 minutos
            detectedAlerts.push({
              type: 'info',
              category: 'gap',
              severity: 'low',
              title: `Hueco de ${gap} minutos en ${block.name}`,
              description: `Entre "${current.title}" (${current.time}) y "${next.title}" (${next.time})`,
              blockId: block.id,
              momentIds: [current.id, next.id],
            });
          }
        }
      }

      // ALERTA 4: Detectar solapamientos
      for (let i = 0; i < blockMoments.length - 1; i++) {
        const current = blockMoments[i];
        const next = blockMoments[i + 1];

        if (current.time && next.time && current.time >= next.time) {
          detectedAlerts.push({
            type: 'error',
            category: 'overlap',
            severity: 'critical',
            title: `Solapamiento en ${block.name}`,
            description: `"${current.title}" (${current.time}) está después de "${next.title}" (${next.time})`,
            blockId: block.id,
            momentIds: [current.id, next.id],
          });
        }
      }

      // ALERTA 5: Momento con candidatas pero sin definitiva
      const withCandidatesNoDefinitive = blockMoments.filter(
        (m) => m.songCandidates && m.songCandidates.length > 0 && !m.isDefinitive
      );
      if (withCandidatesNoDefinitive.length > 0) {
        detectedAlerts.push({
          type: 'info',
          category: 'music',
          severity: 'low',
          title: `${withCandidatesNoDefinitive.length} momento(s) con opciones en ${block.name}`,
          description: `Tienes opciones de canciones pero aún no has marcado ninguna como definitiva: "${withCandidatesNoDefinitive.map((m) => m.title).join('", "')}"`,
          blockId: block.id,
          momentIds: withCandidatesNoDefinitive.map((m) => m.id),
        });
      }
    });

    // Ordenar por severidad
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return detectedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [moments, blocks]);

  const calculateGap = (time1, time2) => {
    try {
      const [h1, m1] = time1.split(':').map(Number);
      const [h2, m2] = time2.split(':').map(Number);
      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      return minutes2 - minutes1;
    } catch {
      return 0;
    }
  };

  const getAlertStyle = (type, severity) => {
    if (type === 'error' || severity === 'critical') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-900',
      };
    }
    if (severity === 'high') {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        text: 'text-orange-900',
      };
    }
    if (severity === 'medium') {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        text: 'text-yellow-900',
      };
    }
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
    };
  };

  const getIcon = (category) => {
    switch (category) {
      case 'music':
        return Music;
      case 'time':
        return Clock;
      case 'overlap':
        return AlertCircle;
      default:
        return AlertTriangle;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">¡Todo perfecto! ✨</h3>
            <p className="text-sm text-green-700">
              No se han detectado problemas en tu timeline. Tu cronograma está completo y bien
              organizado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div className="space-y-3">
      {/* Header con resumen */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="text-orange-500" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              Sistema de Alertas Detectó {alerts.length} Punto(s) de Atención
            </h3>
            <p className="text-sm text-gray-600">
              {criticalCount > 0 && `${criticalCount} crítica(s)`}
              {criticalCount > 0 && highCount > 0 && ', '}
              {highCount > 0 && `${highCount} importante(s)`}
            </p>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-2">
          {alerts.map((alert, idx) => {
            const style = getAlertStyle(alert.type, alert.severity);
            const Icon = getIcon(alert.category);

            return (
              <div
                key={idx}
                className={`${style.bg} ${style.border} border rounded-lg p-3 transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`${style.icon} flex-shrink-0 mt-0.5`} size={18} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${style.text} text-sm mb-1`}>{alert.title}</h4>
                    <p className={`text-xs ${style.text} opacity-90`}>{alert.description}</p>
                  </div>
                  {alert.severity === 'critical' && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                      CRÍTICO
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consejos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          💡 <strong>Consejo:</strong> Resuelve primero las alertas críticas e importantes antes del
          día de la boda.
        </p>
      </div>
    </div>
  );
};

export default TimelineAlerts;
