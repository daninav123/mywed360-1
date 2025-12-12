/**
 * AILayoutAnalyzer - Panel de análisis IA del layout
 * FASE 5.2: Auto-Layout IA Mejorado
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Zap, Target } from 'lucide-react';
import { analyzeLayout, suggestOptimizations } from '../../utils/aiLayoutOptimizer';

export default function AILayoutAnalyzer({ tables, hallSize, guests, onApplyOptimization }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (tables.length > 0) {
      setIsAnalyzing(true);
      setTimeout(() => {
        const result = analyzeLayout(tables, hallSize, guests);
        setAnalysis(result);
        setIsAnalyzing(false);
      }, 500);
    }
  }, [tables, hallSize, guests]);

  if (!analysis && !isAnalyzing) return null;

  const suggestions = suggestOptimizations(analysis || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[var(--color-primary)] rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Análisis IA</h3>
          <p className="text-xs text-gray-500">Layout Optimizer</p>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="w-8 h-8 text-purple-600" />
          </motion.div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Analizando...</p>
        </div>
      ) : (
        <>
          {/* Score */}
          <div className="mb-4 p-4 rounded-lg bg-[var(--color-primary)]/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Puntuación</span>
              <span className="text-3xl font-bold text-[color:var(--color-primary)]">
                {analysis.emoji} {analysis.score}/{analysis.maxScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(analysis.score / analysis.maxScore) * 100}%` }}
                className="h-full rounded-full bg-[var(--color-primary)]"
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
              {analysis.rating}
            </p>
          </div>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Problemas Detectados
              </h4>
              <div className="space-y-2">
                {analysis.issues.slice(0, 3).map((issue, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">{issue.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Sugerencias ({suggestions.length})
              </h4>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onApplyOptimization?.(suggestion.type)}
                    className="w-full p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                  >
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">{suggestion.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
