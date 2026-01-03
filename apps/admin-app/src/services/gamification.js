/**
 * Gamification Service
 * Sistema de gamificaci�n con triggers para eventos
 * Sprint 2 - Completar Seating Plan
 */

import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Definici�n de achievements/logros
 */
export const ACHIEVEMENTS = {
  // Seating Plan
  FIRST_TABLE_CREATED: {
    id: 'first_table_created',
    name: 'Primera Mesa',
    description: 'Creaste tu primera mesa',
    icon: '>�',
    points: 10,
    category: 'seating'
  },
  FIRST_LAYOUT_COMPLETE: {
    id: 'first_layout_complete',
    name: 'Distribuci�n Completa',
    description: 'Completaste tu primer layout',
    icon: '',
    points: 50,
    category: 'seating'
  },
  LAYOUT_CEREMONY_READY: {
    id: 'layout_ceremony_ready',
    name: 'Ceremonia Lista',
    description: 'Layout de ceremonia completado',
    icon: '=�',
    points: 75,
    category: 'seating'
  },
  LAYOUT_BANQUET_READY: {
    id: 'layout_banquet_ready',
    name: 'Banquete Listo',
    description: 'Layout de banquete completado',
    icon: '<}',
    points: 100,
    category: 'seating'
  },
  ALL_GUESTS_SEATED: {
    id: 'all_guests_seated',
    name: 'Todos Sentados',
    description: 'Asignaste todos los invitados',
    icon: '=e',
    points: 150,
    category: 'seating'
  },
  SEATING_PERFECTIONIST: {
    id: 'seating_perfectionist',
    name: 'Perfeccionista',
    description: 'Sin conflictos de asientos',
    icon: 'P',
    points: 200,
    category: 'seating'
  },

  // Collaboration
  FIRST_COLLABORATION: {
    id: 'first_collaboration',
    name: 'Trabajo en Equipo',
    description: 'Primera colaboraci�n en tiempo real',
    icon: '>',
    points: 25,
    category: 'collaboration'
  },
  FREQUENT_COLLABORATOR: {
    id: 'frequent_collaborator',
    name: 'Colaborador Frecuente',
    description: '10+ sesiones colaborativas',
    icon: '=k',
    points: 100,
    category: 'collaboration'
  },

  // RSVP
  FIRST_RSVP_SENT: {
    id: 'first_rsvp_sent',
    name: 'Primeras Invitaciones',
    description: 'Enviaste tus primeras invitaciones',
    icon: '	',
    points: 20,
    category: 'rsvp'
  },
  RSVP_50_PERCENT: {
    id: 'rsvp_50_percent',
    name: 'Medio Camino',
    description: '50% de respuestas RSVP',
    icon: '=�',
    points: 50,
    category: 'rsvp'
  },
  RSVP_100_PERCENT: {
    id: 'rsvp_100_percent',
    name: 'Confirmaciones Completas',
    description: '100% de respuestas RSVP',
    icon: '<�',
    points: 200,
    category: 'rsvp'
  },

  // Finance
  BUDGET_CREATED: {
    id: 'budget_created',
    name: 'Presupuesto Inicial',
    description: 'Creaste tu presupuesto',
    icon: '=�',
    points: 15,
    category: 'finance'
  },
  BUDGET_ON_TRACK: {
    id: 'budget_on_track',
    name: 'Bajo Control',
    description: 'Presupuesto dentro del l�mite',
    icon: '=�',
    points: 100,
    category: 'finance'
  },

  // Tasks
  FIRST_TASK_COMPLETED: {
    id: 'first_task_completed',
    name: 'Primera Tarea',
    description: 'Completaste tu primera tarea',
    icon: '',
    points: 10,
    category: 'tasks'
  },
  TASK_MASTER: {
    id: 'task_master',
    name: 'Maestro de Tareas',
    description: '50+ tareas completadas',
    icon: '<�',
    points: 150,
    category: 'tasks'
  },

  // Milestones
  WEDDING_DATE_SET: {
    id: 'wedding_date_set',
    name: 'Fecha Elegida',
    description: 'Estableciste la fecha de la boda',
    icon: '=�',
    points: 50,
    category: 'milestone'
  },
  VENUE_SELECTED: {
    id: 'venue_selected',
    name: 'Lugar Reservado',
    description: 'Seleccionaste el lugar',
    icon: '<�',
    points: 100,
    category: 'milestone'
  },
  SIX_MONTHS_TO_GO: {
    id: 'six_months_to_go',
    name: '6 Meses Para El D�a',
    description: 'Faltan 6 meses',
    icon: '�',
    points: 75,
    category: 'milestone'
  },
  ONE_MONTH_TO_GO: {
    id: 'one_month_to_go',
    name: '�Un Mes!',
    description: 'Falta solo un mes',
    icon: '<�',
    points: 100,
    category: 'milestone'
  }
};

/**
 * Niveles de gamificaci�n
 */
export const LEVELS = [
  { level: 1, name: 'Novato', minPoints: 0, maxPoints: 99, icon: '<1' },
  { level: 2, name: 'Aprendiz', minPoints: 100, maxPoints: 249, icon: '=�' },
  { level: 3, name: 'Organizador', minPoints: 250, maxPoints: 499, icon: '=�' },
  { level: 4, name: 'Planificador', minPoints: 500, maxPoints: 999, icon: '<�' },
  { level: 5, name: 'Experto', minPoints: 1000, maxPoints: 1999, icon: 'P' },
  { level: 6, name: 'Maestro', minPoints: 2000, maxPoints: 3999, icon: '=Q' },
  { level: 7, name: 'Leyenda', minPoints: 4000, maxPoints: Infinity, icon: '<�' }
];

/**
 * Obtiene el nivel actual basado en puntos
 */
export function getLevelInfo(points) {
  const level = LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minPoints > points);
  
  return {
    current: level,
    next: nextLevel,
    progress: nextLevel 
      ? ((points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
      : 100,
    pointsToNext: nextLevel ? nextLevel.minPoints - points : 0
  };
}

/**
 * GamificationService Class
 */
class GamificationService {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Registra un evento de gamificaci�n
   */
  async triggerEvent(userId, weddingId, eventType, metadata = {}) {
    try {
      if (!userId || !weddingId) {
        // console.warn('GamificationService: userId and weddingId are required');
        return null;
      }

      // Buscar achievement relacionado
      const achievement = Object.values(ACHIEVEMENTS).find(a => 
        a.id === eventType || a.id.toLowerCase() === eventType.toLowerCase()
      );

      if (!achievement) {
        // console.warn(`GamificationService: No achievement found for event: ${eventType}`);
        return null;
      }

      // Verificar si ya fue desbloqueado
      const userProgressRef = doc(db, 'users', userId, 'gamification', 'progress');
      const progressDoc = await getDoc(userProgressRef);
      const progress = progressDoc.data() || { totalPoints: 0, achievements: [] };

      if (progress.achievements?.includes(achievement.id)) {
        // console.log(`Achievement ${achievement.id} already unlocked`);
        return null;
      }

      // Desbloquear achievement
      await setDoc(userProgressRef, {
        totalPoints: increment(achievement.points),
        achievements: [...(progress.achievements || []), achievement.id],
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Registrar en historial
      const historyRef = doc(db, 'users', userId, 'gamification', 'history', `${Date.now()}`);
      await setDoc(historyRef, {
        achievementId: achievement.id,
        points: achievement.points,
        weddingId,
        metadata,
        timestamp: serverTimestamp()
      });

      // Notificar listeners
      this.notifyListeners(userId, {
        type: 'achievement_unlocked',
        achievement,
        totalPoints: progress.totalPoints + achievement.points,
        level: getLevelInfo(progress.totalPoints + achievement.points)
      });

      return {
        achievement,
        totalPoints: progress.totalPoints + achievement.points,
        levelInfo: getLevelInfo(progress.totalPoints + achievement.points)
      };
    } catch (error) {
      // console.error('Error triggering gamification event:', error);
      return null;
    }
  }

  /**
   * Obtiene el progreso del usuario
   */
  async getUserProgress(userId) {
    try {
      const progressRef = doc(db, 'users', userId, 'gamification', 'progress');
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        return {
          totalPoints: 0,
          achievements: [],
          level: getLevelInfo(0)
        };
      }

      const data = progressDoc.data();
      return {
        ...data,
        level: getLevelInfo(data.totalPoints || 0)
      };
    } catch (error) {
      // console.error('Error getting user progress:', error);
      return null;
    }
  }

  /**
   * Obtiene achievements desbloqueados
   */
  async getUnlockedAchievements(userId) {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return [];

      return progress.achievements.map(id => 
        Object.values(ACHIEVEMENTS).find(a => a.id === id)
      ).filter(Boolean);
    } catch (error) {
      // console.error('Error getting unlocked achievements:', error);
      return [];
    }
  }

  /**
   * Obtiene achievements disponibles
   */
  getAvailableAchievements(category = null) {
    const achievements = Object.values(ACHIEVEMENTS);
    return category 
      ? achievements.filter(a => a.category === category)
      : achievements;
  }

  /**
   * Registra un listener para eventos de gamificaci�n
   */
  on(userId, callback) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, []);
    }
    this.listeners.get(userId).push(callback);

    // Retornar funci�n para desregistrar
    return () => {
      const callbacks = this.listeners.get(userId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notifica a los listeners
   */
  notifyListeners(userId, event) {
    const callbacks = this.listeners.get(userId) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        // console.error('Error in gamification listener:', error);
      }
    });
  }

  /**
   * Triggers espec�ficos para Seating Plan
   */
  async seatingTriggers(userId, weddingId) {
    return {
      tableCreated: () => this.triggerEvent(userId, weddingId, 'first_table_created'),
      layoutComplete: () => this.triggerEvent(userId, weddingId, 'first_layout_complete'),
      ceremonyReady: () => this.triggerEvent(userId, weddingId, 'layout_ceremony_ready'),
      banquetReady: () => this.triggerEvent(userId, weddingId, 'layout_banquet_ready'),
      allGuestsSeated: () => this.triggerEvent(userId, weddingId, 'all_guests_seated'),
      perfectionist: () => this.triggerEvent(userId, weddingId, 'seating_perfectionist'),
    };
  }
}

// Instancia singleton
const gamificationService = new GamificationService();

export default gamificationService;

/**
 * Hook de React para usar gamificaci�n
 */
export function useGamification(userId) {
  const [progress, setProgress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;

    // Cargar progreso inicial
    gamificationService.getUserProgress(userId).then(data => {
      setProgress(data);
      setLoading(false);
    });

    // Escuchar actualizaciones
    const unsubscribe = gamificationService.on(userId, (event) => {
      if (event.type === 'achievement_unlocked') {
        setProgress(prev => ({
          ...prev,
          totalPoints: event.totalPoints,
          level: event.level,
          achievements: [...(prev?.achievements || []), event.achievement.id]
        }));

        // Mostrar notificaci�n (opcional)
        // console.log('<� Achievement unlocked:', event.achievement.name);
      }
    });

    return unsubscribe;
  }, [userId]);

  const triggerEvent = React.useCallback((weddingId, eventType, metadata) => {
    return gamificationService.triggerEvent(userId, weddingId, eventType, metadata);
  }, [userId]);

  return {
    progress,
    loading,
    triggerEvent,
    getLevelInfo: (points) => getLevelInfo(points)
  };
}
