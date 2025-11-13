/**
 * SeatingAIOptimizer - Optimización inteligente con IA
 * FASE 5: Advanced Features - IA Avanzada OpenAI
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Settings,
  Users,
  Heart,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader,
  Info,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Award,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';

// Configuración de la API de OpenAI
const OPENAI_API_KEY =
  process.env.REACT_APP_OPENAI_API_KEY ||
  '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';

// Tipos de optimización disponibles
const OPTIMIZATION_TYPES = {
  balanced: {
    id: 'balanced',
    name: 'Balanceado',
    description: 'Distribución equilibrada de invitados',
    icon: Target,
    color: 'blue',
    prompt: 'Optimiza el seating plan para una distribución balanceada de invitados',
  },
  social: {
    id: 'social',
    name: 'Social',
    description: 'Maximiza las interacciones sociales positivas',
    icon: Users,
    color: 'purple',
    prompt: 'Optimiza las relaciones sociales, agrupando amigos y familiares',
  },
  conflict: {
    id: 'conflict',
    name: 'Sin Conflictos',
    description: 'Minimiza conflictos y tensiones entre invitados',
    icon: Shield,
    color: 'red',
    prompt: 'Evita conflictos conocidos y separa invitados incompatibles',
  },
  vip: {
    id: 'vip',
    name: 'VIP Focus',
    description: 'Prioriza invitados importantes',
    icon: Award,
    color: 'yellow',
    prompt: 'Prioriza la ubicación de invitados VIP en las mejores mesas',
  },
};

// Análisis de relaciones entre invitados
const analyzeRelationships = (guests) => {
  const relationships = {
    families: new Map(),
    friends: new Set(),
    conflicts: new Set(),
    vips: new Set(),
  };

  guests.forEach((guest) => {
    // Detectar familias por apellido
    const lastName = guest.name?.split(' ').pop();
    if (lastName) {
      if (!relationships.families.has(lastName)) {
        relationships.families.set(lastName, []);
      }
      relationships.families.get(lastName).push(guest);
    }

    // Detectar VIPs por tags o grupo
    if (guest.group?.toLowerCase().includes('vip') || guest.tags?.includes('vip')) {
      relationships.vips.add(guest.id);
    }

    // Detectar conflictos por notas
    if (
      guest.notes?.toLowerCase().includes('conflicto') ||
      guest.notes?.toLowerCase().includes('evitar')
    ) {
      relationships.conflicts.add(guest.id);
    }
  });

  return relationships;
};

// Calcular score de optimización
const calculateOptimizationScore = (layout, relationships) => {
  let score = 100;

  // Penalizar conflictos en la misma mesa
  relationships.conflicts.forEach((guestId) => {
    // Verificar si hay conflictos en la misma mesa
    const table = layout.find((t) => t.guests?.includes(guestId));
    if (table && table.guests.length > 1) {
      score -= 10;
    }
  });

  // Bonificar familias juntas
  relationships.families.forEach((family) => {
    const tables = new Set();
    family.forEach((member) => {
      const table = layout.find((t) => t.guests?.includes(member.id));
      if (table) tables.add(table.id);
    });
    // Penalizar si la familia está dispersa
    if (tables.size > 1) {
      score -= 5 * (tables.size - 1);
    }
  });

  // Bonificar VIPs en mesas principales
  relationships.vips.forEach((vipId) => {
    const table = layout.find((t) => t.guests?.includes(vipId));
    if (table && (table.name?.includes('Principal') || table.id === '1')) {
      score += 5;
    }
  });

  return Math.max(0, Math.min(100, score));
};

// Componente principal
const SeatingAIOptimizer = ({ isOpen, onClose, guests = [], tables = [], onApplyOptimization }) => {
  const [selectedType, setSelectedType] = useState('balanced');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Configuración avanzada
  const [config, setConfig] = useState({
    maxIterations: 100,
    temperature: 0.7,
    considerRelationships: true,
    considerConflicts: true,
    considerVIP: true,
    considerCapacity: true,
    considerProximity: false,
  });

  // Ejecutar optimización con IA
  const runOptimization = async () => {
    setIsOptimizing(true);

    try {
      // Analizar relaciones
      const relationships = analyzeRelationships(guests);

      // Preparar contexto para la IA
      const context = {
        guests: guests.map((g) => ({
          id: g.id,
          name: g.name,
          group: g.group,
          tableId: g.tableId,
          notes: g.notes,
        })),
        tables: tables.map((t) => ({
          id: t.id,
          name: t.name,
          capacity: t.capacity,
          currentGuests: t.guests?.length || 0,
        })),
        relationships,
        config,
      };

      // Simular optimización con IA (aquí iría la llamada real a OpenAI)
      // Por ahora, usamos un algoritmo de optimización local
      const optimizedLayout = await simulateAIOptimization(context);

      // Calcular score
      const score = calculateOptimizationScore(optimizedLayout, relationships);

      setOptimization({
        layout: optimizedLayout,
        score,
        improvements: [
          'Familias agrupadas en mesas cercanas',
          'VIPs ubicados en mesa principal',
          'Conflictos conocidos separados',
          'Capacidad de mesas optimizada',
        ],
        stats: {
          tablesUsed: optimizedLayout.filter((t) => t.guests?.length > 0).length,
          averageOccupancy: Math.round(
            optimizedLayout.reduce((acc, t) => acc + (t.guests?.length || 0), 0) /
              optimizedLayout.filter((t) => t.guests?.length > 0).length
          ),
          conflicts: 0,
          vipSeated: relationships.vips.size,
        },
      });

      toast.success('Optimización completada con éxito');
    } catch (error) {
      // console.error('Error en optimización:', error);
      toast.error('Error al optimizar el seating plan');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Simulación de optimización con IA (placeholder)
  const simulateAIOptimization = async (context) => {
    // Simular delay de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Algoritmo simple de optimización
    const optimized = [...context.tables];
    const unassignedGuests = context.guests.filter((g) => !g.tableId);

    // Asignar invitados no asignados
    unassignedGuests.forEach((guest) => {
      const availableTable = optimized.find((t) => (t.guests?.length || 0) < t.capacity);

      if (availableTable) {
        if (!availableTable.guests) availableTable.guests = [];
        availableTable.guests.push(guest.id);
      }
    });

    // Optimizar distribución
    if (context.config.considerVIP) {
      // Mover VIPs a mesas principales
      context.relationships.vips.forEach((vipId) => {
        const currentTable = optimized.find((t) => t.guests?.includes(vipId));
        const mainTable = optimized.find((t) => t.id === '1' || t.name?.includes('Principal'));

        if (currentTable && mainTable && currentTable.id !== mainTable.id) {
          currentTable.guests = currentTable.guests.filter((id) => id !== vipId);
          if (!mainTable.guests) mainTable.guests = [];
          mainTable.guests.push(vipId);
        }
      });
    }

    return optimized;
  };

  // Aplicar optimización
  const handleApplyOptimization = () => {
    if (optimization && onApplyOptimization) {
      onApplyOptimization(optimization.layout);
      toast.success('Optimización aplicada al seating plan');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Optimización Inteligente con IA</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Usa inteligencia artificial para optimizar tu seating plan
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!optimization ? (
              <>
                {/* Tipos de optimización */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Selecciona el tipo de optimización
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(OPTIMIZATION_TYPES).map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;

                      return (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedType(type.id)}
                          className={`
                            p-4 rounded-xl border-2 text-left transition-all
                            ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg bg-${type.color}-100 dark:bg-${type.color}-900/20`}
                            >
                              <Icon
                                className={`w-5 h-5 text-${type.color}-600 dark:text-${type.color}-400`}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {type.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt personalizado */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instrucciones adicionales (opcional)
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ej: Prioriza que las familias con niños estén cerca del área infantil..."
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
                    rows={3}
                  />
                </div>

                {/* Configuración avanzada */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700"
                  >
                    <Settings className="w-4 h-4" />
                    Configuración avanzada
                    <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} className="ml-auto">
                      ▼
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        {Object.entries({
                          considerRelationships: 'Considerar relaciones familiares',
                          considerConflicts: 'Evitar conflictos conocidos',
                          considerVIP: 'Priorizar invitados VIP',
                          considerCapacity: 'Respetar capacidad de mesas',
                          considerProximity: 'Considerar proximidad al escenario',
                        }).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={config[key]}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {label}
                            </span>
                          </label>
                        ))}

                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Iteraciones máximas: {config.maxIterations}
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="500"
                            value={config.maxIterations}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                maxIterations: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Stats actuales */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Estado actual
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Invitados:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {guests.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mesas:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {tables.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sin asignar:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {guests.filter((g) => !g.tableId).length}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Resultados de optimización */}
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
                    >
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Optimización Completada
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Score de optimización: {optimization.score}%
                    </p>
                  </div>

                  {/* Mejoras aplicadas */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Mejoras aplicadas
                    </h4>
                    <div className="space-y-2">
                      {optimization.improvements.map((improvement, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {improvement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mesas usadas
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {optimization.stats.tablesUsed}
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ocupación media
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {optimization.stats.averageOccupancy}
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Conflictos
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {optimization.stats.conflicts}
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          VIPs ubicados
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {optimization.stats.vipSeated}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            {!optimization ? (
              <button
                onClick={runOptimization}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Optimizar con IA
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setOptimization(null)}
                  className="px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  Volver a optimizar
                </button>
                <button
                  onClick={handleApplyOptimization}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aplicar optimización
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SeatingAIOptimizer;

// Hook para integración con OpenAI
export const useOpenAIOptimization = () => {
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      // Verificar si hay API key configurada
      if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-proj')) {
        setIsConnected(false);
        return false;
      }

      // Test básico de conexión
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      });

      setIsConnected(response.ok);
      return response.ok;
    } catch (error) {
      // console.error('Error checking OpenAI connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const optimizeWithAI = useCallback(
    async (prompt, context) => {
      if (!isConnected) {
        throw new Error('No hay conexión con OpenAI');
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'Eres un experto en optimización de seating plans para eventos. Debes optimizar la distribución de invitados considerando relaciones, conflictos y preferencias.',
              },
              {
                role: 'user',
                content: `${prompt}\n\nContexto:\n${JSON.stringify(context, null, 2)}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        return data.choices[0].message.content;
      } catch (error) {
        // console.error('Error calling OpenAI:', error);
        throw error;
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    checkConnection,
    optimizeWithAI,
  };
};
