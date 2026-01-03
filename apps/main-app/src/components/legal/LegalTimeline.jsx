import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LegalTimeline({ steps, leadTimeDays, weddingDate, costEstimate }) {
  const today = new Date();
  const wedding = weddingDate ? new Date(weddingDate) : null;
  const daysUntilWedding = wedding
    ? Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const shouldStartBy = wedding && leadTimeDays
    ? new Date(wedding.getTime() - leadTimeDays * 24 * 60 * 60 * 1000)
    : null;

  const daysUntilStart = shouldStartBy
    ? Math.ceil((shouldStartBy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysUntilStart !== null && daysUntilStart < 7;
  const isLate = daysUntilStart !== null && daysUntilStart < 0;
  const hasTime = daysUntilStart !== null && daysUntilStart >= 7;

  return (
    <div className="space-y-4">
      {/* Alertas de tiempo */}
      {wedding && leadTimeDays && (
        <div
          className={`rounded-lg p-4 ${
            isLate
              ? 'bg-red-50 border-2 border-red-300'
              : isUrgent
                ? 'bg-orange-50 border-2 border-orange-300'
                : hasTime
                  ? 'bg-green-50 border border-green-300'
                  : 'bg-blue-50 border border-blue-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {isLate ? (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            ) : isUrgent ? (
              <Clock className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            ) : hasTime ? (
              <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <Calendar className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  isLate
                    ? 'text-red-900'
                    : isUrgent
                      ? 'text-orange-900'
                      : hasTime
                        ? 'text-green-900'
                        : 'text-blue-900'
                }`}
              >
                {isLate
                  ? '⚠️ Atención: Ya deberías haber iniciado los trámites'
                  : isUrgent
                    ? '⏰ Urgente: Debes iniciar pronto'
                    : hasTime
                      ? '✅ Tienes tiempo suficiente'
                      : '📅 Planificación de trámites'}
              </h3>
              <div className="text-sm mt-1 space-y-1">
                <p>
                  <strong>Días hasta tu boda:</strong> {daysUntilWedding} días
                </p>
                <p>
                  <strong>Tiempo estimado del proceso:</strong> {leadTimeDays} días
                </p>
                {shouldStartBy && (
                  <p>
                    <strong>Fecha recomendada para iniciar:</strong>{' '}
                    {shouldStartBy.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {daysUntilStart > 0 && ` (en ${daysUntilStart} días)`}
                    {daysUntilStart === 0 && ' (hoy)'}
                    {daysUntilStart < 0 && ` (hace ${Math.abs(daysUntilStart)} días)`}
                  </p>
                )}
                {isLate && (
                  <p className="text-red-700 font-medium mt-2">
                    💡 Contacta urgentemente con la oficina correspondiente para verificar si aún
                    es posible procesar a tiempo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimación de costos */}
      {costEstimate && costEstimate.currency && (
        <div className="rounded-lg bg-slate-50 border border-slate-300 p-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            💰 Costo estimado
          </h3>
          <div className="text-sm text-slate-700">
            {costEstimate.min === 0 && costEstimate.max === 0 ? (
              <p className="font-medium text-green-700">Gratuito (sin tasas oficiales)</p>
            ) : (
              <>
                <p className="font-medium">
                  {costEstimate.min === costEstimate.max ? (
                    <>
                      {costEstimate.currency} {costEstimate.min?.toLocaleString()}
                    </>
                  ) : (
                    <>
                      {costEstimate.currency} {costEstimate.min?.toLocaleString()} -{' '}
                      {costEstimate.max?.toLocaleString()}
                    </>
                  )}
                </p>
                {costEstimate.notes && (
                  <p className="text-xs text-slate-600 mt-1">{costEstimate.notes}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Timeline de pasos */}
      {steps && steps.length > 0 && (
        <div className="rounded-lg bg-white border border-slate-300 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">📋 Pasos del proceso</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id || index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 bg-blue-200 flex-1 my-1" style={{ minHeight: '20px' }} />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <h4 className="font-medium text-slate-900">{step.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      {!wedding && leadTimeDays && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Consejo:</strong> Para calcular cuándo debes iniciar los trámites, añade la
            fecha de tu boda en la configuración de la boda. El plazo estimado es de{' '}
            <strong>{leadTimeDays} días</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
