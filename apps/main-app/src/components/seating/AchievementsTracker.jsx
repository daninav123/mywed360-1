/**
 * AchievementsTracker - Panel de progreso de logros
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, ChevronRight, Award, Star, Target } from 'lucide-react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../utils/achievements';

const AchievementsTracker = ({
  unlockedAchievements = [],
  progress = {},
  nextAchievement,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Agrupar logros por categoría
  const achievementsByCategory = Object.values(ACHIEVEMENTS).reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  // Filtrar logros
  const filteredAchievements =
    selectedCategory === 'all'
      ? Object.values(ACHIEVEMENTS)
      : achievementsByCategory[selectedCategory] || [];

  // Verificar si está desbloqueado
  const isUnlocked = (achievementId) => {
    return unlockedAchievements.some((a) => a.id === achievementId);
  };

  return (
    <div className="space-y-4">
      {/* Header con progreso global */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h2 className="text-xl font-bold">Tus Logros</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{progress.percentage}%</p>
            <p className="text-xs opacity-90">
              {progress.unlockedCount}/{progress.totalAchievements}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Puntos */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-300" />
            <span>{progress.totalPoints} puntos</span>
          </div>
          <span className="opacity-75">de {progress.maxPoints} totales</span>
        </div>
      </div>

      {/* Siguiente logro */}
      {nextAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Próximo Logro</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nextAchievement.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{nextAchievement.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextAchievement.description}
              </p>
            </div>
            <div className="text-right">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1 mx-auto" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                +{nextAchievement.points}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filtros por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Todos
        </button>
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de logros */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAchievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          const category = ACHIEVEMENT_CATEGORIES[achievement.category];

          return (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`relative rounded-lg border-2 p-4 transition-all ${
                unlocked
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icono */}
                <div className={`text-4xl ${unlocked ? '' : 'grayscale'}`}>
                  {unlocked ? achievement.icon : <Lock className="w-10 h-10 text-gray-400" />}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-semibold ${
                        unlocked
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${category.color} text-white`}
                    >
                      {category.label}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      unlocked
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {achievement.description}
                  </p>
                </div>

                {/* Puntos */}
                <div className="text-right">
                  {unlocked ? (
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <Trophy className="w-6 h-6 text-yellow-600 mb-1" />
                      </motion.div>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{achievement.points}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Lock className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">{achievement.points} pts</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge de desbloqueado */}
              {unlocked && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full"
                >
                  ✓ Desbloqueado
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Sin resultados */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No hay logros en esta categoría</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsTracker;
