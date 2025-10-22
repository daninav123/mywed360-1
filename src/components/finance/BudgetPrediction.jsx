import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Sparkles, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import { post } from '../../services/apiClient';
import useTranslations from '../../hooks/useTranslations';

/**
 * Predicción IA de gastos futuros basada en histórico
 */
const BudgetPrediction = ({ transactions = [], budget = {}, weddingDate }) => {
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    if (transactions.length >= 5) {
      generatePrediction();
    }
  }, [transactions]);

  const generatePrediction = async () => {
    setPredicting(true);

    try {
      // Análisis local de tendencias
      const localAnalysis = analyzeLocalTrends();
      
      // Intentar llamar a IA backend si está disponible
      try {
        const response = await post('/api/ai/budget-predict', {
          transactions: transactions.slice(0, 50), // Últimas 50
          budget: budget.total || 0,
          weddingDate,
          categories: budget.categories || {}
        });

        if (response.success) {
          setPrediction({
            ...localAnalysis,
            aiInsights: response.data
          });
          return;
        }
      } catch (err) {
        console.log('IA backend no disponible, usando análisis local');
      }

      // Fallback: solo análisis local
      setPrediction(localAnalysis);
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setPredicting(false);
    }
  };

  const analyzeLocalTrends = () => {
    if (transactions.length === 0) {
      return {
        totalSpent: 0,
        projectedTotal: 0,
        confidence: 0,
        risk: 'low',
        recommendations: []
      };
    }

    // Calcular totales
    const totalSpent = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const budgetTotal = budget.total || 0;
    const percentageSpent = budgetTotal > 0 ? (totalSpent / budgetTotal) * 100 : 0;

    // Calcular días hasta la boda
    const today = new Date();
    const weddingDateObj = weddingDate ? new Date(weddingDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const daysUntilWedding = Math.max(1, Math.ceil((weddingDateObj - today) / (1000 * 60 * 60 * 24)));

    // Calcular tasa de gasto diaria
    const earliestTransaction = transactions.reduce((earliest, t) => {
      const tDate = new Date(t.date);
      return tDate < earliest ? tDate : earliest;
    }, new Date());

    const daysSinceStart = Math.max(1, Math.ceil((today - earliestTransaction) / (1000 * 60 * 60 * 24)));
    const dailySpendRate = totalSpent / daysSinceStart;

    // Proyección simple
    const projectedTotal = totalSpent + (dailySpendRate * daysUntilWedding);
    const projectedOverage = projectedTotal - budgetTotal;

    // Determinar riesgo
    let risk = 'low';
    let confidence = 70;

    if (percentageSpent > 90) {
      risk = 'critical';
      confidence = 85;
    } else if (percentageSpent > 75 || projectedOverage > 0) {
      risk = 'high';
      confidence = 80;
    } else if (percentageSpent > 50) {
      risk = 'medium';
      confidence = 75;
    }

    // Generar recomendaciones
    const recommendations = [];

    if (projectedOverage > 0) {
      recommendations.push({
        type: 'warning',
        message: t('budgetPrediction.recommendations.projectedOverage.message', {
          amount: projectedOverage.toFixed(2),
          defaultValue: 'Se proyecta un exceso de €{{amount}}',
        }),
        action: t('budgetPrediction.recommendations.projectedOverage.action', {
          defaultValue: 'Considera revisar gastos discrecionales',
        }),
      });
    }

    if (dailySpendRate > (budgetTotal / 365)) {
      recommendations.push({
        type: 'info',
        message: 'Tu tasa de gasto diaria es alta',
        action: 'Intenta espaciar más las compras grandes'
      });
    }

    if (daysUntilWedding < 60 && percentageSpent < 60) {
      recommendations.push({
        type: 'success',
        message: '¡Vas muy bien con el presupuesto!',
        action: 'Mantén este ritmo de gasto'
      });
    }

    // Análisis por categorías
    const categoryAnalysis = analyzeCategorySpending();

    return {
      totalSpent,
      projectedTotal,
      projectedOverage,
      percentageSpent,
      dailySpendRate,
      daysUntilWedding,
      confidence,
      risk,
      recommendations,
      categoryAnalysis
    };
  };

  const analyzeCategorySpending = () => {
    const categoryTotals = {};

    transactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([category, spent]) => ({
        category,
        spent,
        budgeted: budget.categories?.[category] || 0,
        percentage: budget.categories?.[category] 
          ? (spent / budget.categories[category]) * 100 
          : 0
      }))
      .sort((a, b) => b.spent - a.spent);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-700 bg-green-50 border-green-200';
    }
  };

  const getRiskLabel = (risk) => {
    switch (risk) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      default:
        return 'Bajo';
    }
  };

  if (transactions.length < 5) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="font-semibold text-blue-900 mb-2">
          Predicciones IA disponibles próximamente
        </h3>
        <p className="text-sm text-blue-700">
          Necesitas al menos 5 transacciones para generar predicciones.
          Actualmente tienes {transactions.length}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Predicción IA
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Análisis inteligente de tu presupuesto
          </p>
        </div>
        <Button
          onClick={generatePrediction}
          disabled={predicting}
          variant="secondary"
          className="flex items-center gap-2"
        >
          {predicting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Actualizar Predicción
            </>
          )}
        </Button>
      </div>

      {prediction && (
        <>
          {/* Risk Level */}
          <div className={`border rounded-lg p-4 ${getRiskColor(prediction.risk)}`}>
            <div className="flex items-center gap-3">
              {prediction.risk === 'low' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    Nivel de Riesgo: {getRiskLabel(prediction.risk)}
                  </span>
                  <span className="text-sm">
                    Confianza: {prediction.confidence}%
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${prediction.percentageSpent}%`,
                      backgroundColor: 'currentColor'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Gastado</p>
              <p className="text-2xl font-bold text-gray-900">
                €{prediction.totalSpent.toFixed(0)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Proyectado</p>
              <p className="text-2xl font-bold text-purple-700">
                €{prediction.projectedTotal.toFixed(0)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Gasto Diario</p>
              <p className="text-2xl font-bold text-blue-700">
                €{prediction.dailySpendRate.toFixed(0)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Días Restantes</p>
              <p className="text-2xl font-bold text-green-700">
                {prediction.daysUntilWedding}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {prediction.recommendations?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Recomendaciones
              </h3>
              <div className="space-y-3">
                {prediction.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {rec.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : rec.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rec.message}</p>
                      <p className="text-sm text-gray-600">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Analysis */}
          {prediction.categoryAnalysis?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Análisis por Categoría
              </h3>
              <div className="space-y-2">
                {prediction.categoryAnalysis.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 font-medium">
                        €{cat.spent.toFixed(0)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        cat.percentage > 100 
                          ? 'bg-red-100 text-red-700'
                          : cat.percentage > 80
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetPrediction;
