/**
 * OnboardingDashboard - Dashboard con recomendaciones del cuestionario inicial
 * FASE 0.1 - Parte 2
 */
import React, { useMemo } from 'react';
import { AlertCircle, TrendingUp, Clock, Target, Lightbulb, DollarSign } from 'lucide-react';
import { generateRecommendations } from '../../services/onboardingRecommendations';

const UrgencyBadge = ({ urgency }) => {
  const config = {
    critical: { label: '🚨 Crítico', color: 'bg-red-100 text-red-700 border-red-300' },
    urgent: { label: '⚠️ Urgente', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    moderate: { label: '⏰ Moderado', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    comfortable: { label: '✓ Confortable', color: 'bg-green-100 text-green-700 border-green-300' },
    relaxed: { label: '😌 Relajado', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  };

  const badge = config[urgency] || config.comfortable;

  return (
    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-blue-600" />
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

export default function OnboardingDashboard({ onboardingData, weddingData }) {
  const recommendations = useMemo(() => {
    if (!onboardingData) return null;
    
    const combined = {
      ...onboardingData,
      guestCountRange: weddingData?.eventProfile?.guestCountRange,
      style: weddingData?.preferences?.style,
    };
    
    return generateRecommendations(combined);
  }, [onboardingData, weddingData]);

  if (!onboardingData || !recommendations) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Completa el cuestionario inicial
        </h3>
        <p className="text-sm text-gray-500">
          Responde las preguntas del asistente para recibir recomendaciones personalizadas
        </p>
      </div>
    );
  }

  const { budgetAdvice, timelineAdjustments, priorityFocus, styleRecommendations, concernsSolutions, nextSteps, estimatedCosts } = recommendations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Tu Plan Personalizado</h2>
            <p className="text-sm text-gray-600">
              Recomendaciones basadas en tus respuestas
            </p>
          </div>
          {timelineAdjustments?.urgency && (
            <UrgencyBadge urgency={timelineAdjustments.urgency} />
          )}
        </div>
      </div>

      {/* Timeline Alert */}
      {timelineAdjustments && (
        <Section title="Timeline y Urgencia" icon={Clock}>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-700 font-medium mb-2">
              {timelineAdjustments.message}
            </p>
            {timelineAdjustments.months && (
              <p className="text-xs text-gray-600">
                Tienes {timelineAdjustments.months} meses para organizar todo
              </p>
            )}
          </div>

          {timelineAdjustments.priorities && timelineAdjustments.priorities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Prioridades inmediatas:</p>
              <ul className="space-y-1.5">
                {timelineAdjustments.priorities.map((priority, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Budget Advice */}
      {budgetAdvice && (
        <Section title="Recomendaciones de Presupuesto" icon={DollarSign}>
          {budgetAdvice.category && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                Categoría: {budgetAdvice.category}
              </span>
              {budgetAdvice.perPerson && (
                <p className="text-sm text-gray-600">
                  Aproximadamente {budgetAdvice.perPerson}
                </p>
              )}
            </div>
          )}

          <p className="text-sm text-gray-700 mb-3">{budgetAdvice.advice}</p>

          {budgetAdvice.tips && budgetAdvice.tips.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">💡 Consejos:</p>
              <ul className="space-y-1">
                {budgetAdvice.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Estimated Costs */}
      {estimatedCosts && (
        <Section title="Distribución Sugerida del Presupuesto" icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(estimatedCosts).map(([category, amount]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">{category}</p>
                <p className="text-lg font-bold text-gray-800">{amount.toLocaleString()}€</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * Estas son estimaciones orientativas. Ajusta según tus necesidades.
          </p>
        </Section>
      )}

      {/* Priority Focus */}
      {priorityFocus && priorityFocus.top1 && (
        <Section title="Enfoque en Prioridades" icon={Target}>
          <div className="space-y-3">
            <p className="text-sm text-gray-700 mb-3">{priorityFocus.message}</p>

            {[priorityFocus.top1, priorityFocus.top2, priorityFocus.top3].map((priority, idx) => (
              priority && (
                <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800">
                      #{idx + 1} {priority.name}
                    </p>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                      {priority.budget}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {priority.tips.map((tip, tipIdx) => (
                      <li key={tipIdx} className="text-sm text-gray-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </Section>
      )}

      {/* Style Recommendations */}
      {styleRecommendations && (
        <Section title={`Estilo: ${styleRecommendations.style}`} icon={Lightbulb}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Locaciones sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {styleRecommendations.venues.map((venue, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {venue}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Paleta de colores:</p>
              <div className="flex flex-wrap gap-2">
                {styleRecommendations.colorPalette.map((color, idx) => (
                  <span key={idx} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                    {color}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Elementos decorativos:</p>
              <div className="flex flex-wrap gap-2">
                {styleRecommendations.decor.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">💰 Consejos de ahorro:</p>
              <ul className="space-y-1">
                {styleRecommendations.savingTips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500 italic">
              💡 {styleRecommendations.inspiration}
            </p>
          </div>
        </Section>
      )}

      {/* Concerns Solutions */}
      {concernsSolutions && concernsSolutions.identified && concernsSolutions.identified.length > 0 && (
        <Section title="Soluciones a tus Preocupaciones" icon={AlertCircle}>
          {concernsSolutions.userConcern && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600 mb-1">Tu preocupación:</p>
              <p className="text-sm text-gray-800 italic">"{concernsSolutions.userConcern}"</p>
            </div>
          )}

          <div className="space-y-3">
            {concernsSolutions.identified.map((concern, idx) => (
              <div key={idx} className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                <p className="font-semibold text-gray-800 mb-2">{concern.title}</p>
                <ul className="space-y-1">
                  {concern.solutions.map((solution, solIdx) => (
                    <li key={solIdx} className="text-sm text-gray-700">
                      ✓ {solution}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <Section title="Próximos Pasos" icon={Target}>
          <div className="space-y-2">
            {nextSteps.map((step, idx) => (
              <div key={idx} className={`border rounded-lg p-3 ${
                step.urgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                      {step.order}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">{step.task}</p>
                      <p className="text-xs text-gray-600 mt-1">{step.why}</p>
                    </div>
                  </div>
                  {step.urgent && (
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                      URGENTE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">⏱️ Tiempo estimado: {step.duration}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
