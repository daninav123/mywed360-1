/**
 * Sistema de Logros (Achievements) para Seating Plan
 * Definiciones y lógica de validación
 */

export const ACHIEVEMENTS = {
  FIRST_LAYOUT: {
    id: 'first_layout',
    title: 'Primer Layout',
    description: 'Genera tu primer layout automático',
    icon: '🎨',
    category: 'beginner',
    points: 10,
    condition: (data) => {
      return data.layoutsGenerated >= 1;
    },
  },

  PERFECTIONIST: {
    id: 'perfectionist',
    title: 'Perfeccionista',
    description: '100% de invitados asignados',
    icon: '💯',
    category: 'expert',
    points: 50,
    condition: (data) => {
      const total = data.totalGuests || 0;
      const assigned = data.assignedGuests || 0;
      return total > 0 && assigned === total;
    },
  },

  ARCHITECT: {
    id: 'architect',
    title: 'Arquitecto',
    description: 'Crea 5 distribuciones diferentes',
    icon: '🏗️',
    category: 'intermediate',
    points: 30,
    condition: (data) => {
      return data.layoutsGenerated >= 5;
    },
  },

  COLLABORATOR_PRO: {
    id: 'collaborator_pro',
    title: 'Colaborador Pro',
    description: 'Completa 3 sesiones colaborativas',
    icon: '🤝',
    category: 'intermediate',
    points: 40,
    condition: (data) => {
      return data.collaborativeSessions >= 3;
    },
  },

  MASTER_ORGANIZER: {
    id: 'master_organizer',
    title: 'Organizador Maestro',
    description: 'Logra 0 conflictos detectados',
    icon: '🏆',
    category: 'expert',
    points: 100,
    condition: (data) => {
      const conflicts = data.conflictsCount || 0;
      const assigned = data.assignedGuests || 0;
      return assigned > 0 && conflicts === 0;
    },
  },

  SPEED_PLANNER: {
    id: 'speed_planner',
    title: 'Planificador Rápido',
    description: 'Asigna 50 invitados en una sesión',
    icon: '⚡',
    category: 'intermediate',
    points: 25,
    condition: (data) => {
      return data.guestsAssignedInSession >= 50;
    },
  },

  TABLE_MASTER: {
    id: 'table_master',
    title: 'Maestro de Mesas',
    description: 'Gestiona 20+ mesas en un evento',
    icon: '🎯',
    category: 'advanced',
    points: 35,
    condition: (data) => {
      return data.totalTables >= 20;
    },
  },

  TEMPLATE_EXPLORER: {
    id: 'template_explorer',
    title: 'Explorador de Plantillas',
    description: 'Prueba 3 plantillas diferentes',
    icon: '🎭',
    category: 'beginner',
    points: 15,
    condition: (data) => {
      return data.templatesUsed >= 3;
    },
  },
};

export const ACHIEVEMENT_CATEGORIES = {
  beginner: {
    label: 'Principiante',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
  },
  intermediate: {
    label: 'Intermedio',
    color: 'bg-green-500',
    textColor: 'text-green-700',
  },
  advanced: {
    label: 'Avanzado',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
  },
  expert: {
    label: 'Experto',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
  },
};

/**
 * Verifica qué logros se han desbloqueado
 * @param {Object} data - Datos del usuario
 * @param {Array} unlockedAchievements - Logros ya desbloqueados
 * @returns {Array} - Nuevos logros desbloqueados
 */
export const checkAchievements = (data, unlockedAchievements = []) => {
  const newlyUnlocked = [];

  Object.values(ACHIEVEMENTS).forEach((achievement) => {
    // Si ya está desbloqueado, skip
    if (unlockedAchievements.includes(achievement.id)) {
      return;
    }

    // Verificar condición
    try {
      if (achievement.condition(data)) {
        newlyUnlocked.push(achievement);
      }
    } catch (error) {
      console.warn(`[Achievements] Error checking ${achievement.id}:`, error);
    }
  });

  return newlyUnlocked;
};

/**
 * Calcula el progreso total de achievements
 * @param {Array} unlockedAchievements - IDs de logros desbloqueados
 * @returns {Object} - Progreso y puntos
 */
export const calculateProgress = (unlockedAchievements = []) => {
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedCount = unlockedAchievements.length;
  const percentage =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  const totalPoints = unlockedAchievements.reduce((sum, id) => {
    const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === id);
    return sum + (achievement?.points || 0);
  }, 0);

  const maxPoints = Object.values(ACHIEVEMENTS).reduce((sum, a) => sum + a.points, 0);

  return {
    unlockedCount,
    totalAchievements,
    percentage,
    totalPoints,
    maxPoints,
  };
};

/**
 * Obtiene el siguiente logro por desbloquear
 * @param {Array} unlockedAchievements - IDs desbloqueados
 * @param {Object} data - Datos actuales
 * @returns {Object|null} - Siguiente logro más cercano
 */
export const getNextAchievement = (unlockedAchievements = [], data = {}) => {
  const locked = Object.values(ACHIEVEMENTS).filter((a) => !unlockedAchievements.includes(a.id));

  if (locked.length === 0) return null;

  // Ordenar por categoría (beginner primero)
  const categoryOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
  locked.sort((a, b) => {
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });

  return locked[0];
};
