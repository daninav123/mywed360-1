/**
 * AchievementUnlocked - Notificación cuando se desbloquea un logro
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles } from 'lucide-react';
import { ACHIEVEMENT_CATEGORIES } from '../../utils/achievements';

const AchievementUnlocked = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const category = ACHIEVEMENT_CATEGORIES[achievement.category] || ACHIEVEMENT_CATEGORIES.beginner;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-4 right-4 z-50 w-80 bg-[var(--color-primary)] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Partículas flotantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: '100%',
                opacity: 0.8,
              }}
              animate={{
                y: '-20%',
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Contenido */}
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                <Trophy className="w-6 h-6 text-yellow-600" />
              </motion.div>
              <div>
                <h3 className="text-black font-bold text-sm">¡Logro Desbloqueado!</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-white text-black`}>
                  {category.label}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Icono grande del logro */}
          <div className="flex items-center justify-center mb-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              className="text-6xl"
            >
              {achievement.icon}
            </motion.div>
          </div>

          {/* Título y descripción */}
          <div className="text-center mb-3">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-white mb-1"
            >
              {achievement.title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-white/90"
            >
              {achievement.description}
            </motion.p>
          </div>

          {/* Puntos */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="flex items-center justify-center gap-2 bg-white/20 rounded-lg py-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span className="text-white font-bold">+{achievement.points} puntos</span>
          </motion.div>
        </div>

        {/* Barra de progreso animada */}
        <motion.div
          className="h-1 bg-white"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
          onAnimationComplete={onClose}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementUnlocked;
