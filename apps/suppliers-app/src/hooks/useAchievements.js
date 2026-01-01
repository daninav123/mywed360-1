/**
 * Hook para gestionar el sistema de logros (Achievements)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  checkAchievements,
  calculateProgress,
  getNextAchievement,
  ACHIEVEMENTS,
} from '../utils/achievements';

const STORAGE_KEY = 'seatingPlan:achievements';

export const useAchievements = (weddingId) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState(null);
  const [sessionData, setSessionData] = useState({
    layoutsGenerated: 0,
    totalGuests: 0,
    assignedGuests: 0,
    conflictsCount: 0,
    collaborativeSessions: 0,
    guestsAssignedInSession: 0,
    totalTables: 0,
    templatesUsed: 0,
  });

  // Cargar logros desbloqueados desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:${weddingId || 'default'}`);
      if (stored) {
        const data = JSON.parse(stored);
        setUnlockedAchievements(data.unlocked || []);
        setSessionData(data.sessionData || sessionData);
      }
    } catch (error) {
      console.warn('[useAchievements] Error loading from storage:', error);
    }
  }, [weddingId]);

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    try {
      const data = {
        unlocked: unlockedAchievements,
        sessionData,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}:${weddingId || 'default'}`, JSON.stringify(data));
    } catch (error) {
      console.warn('[useAchievements] Error saving to storage:', error);
    }
  }, [unlockedAchievements, sessionData, weddingId]);

  // Actualizar datos de sesión
  const updateSessionData = useCallback((updates) => {
    setSessionData((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Verificar y desbloquear logros
  const checkAndUnlock = useCallback(() => {
    const newlyUnlocked = checkAchievements(sessionData, unlockedAchievements);

    if (newlyUnlocked.length > 0) {
      const newIds = newlyUnlocked.map((a) => a.id);
      setUnlockedAchievements((prev) => [...prev, ...newIds]);

      // Mostrar el primero desbloqueado
      setRecentlyUnlocked(newlyUnlocked[0]);

      // Limpiar notificación después de 5 segundos
      setTimeout(() => {
        setRecentlyUnlocked(null);
      }, 5000);

      return newlyUnlocked;
    }

    return [];
  }, [sessionData, unlockedAchievements]);

  // Incrementar contador específico
  const incrementCounter = useCallback(
    (counter, value = 1) => {
      updateSessionData({ [counter]: (sessionData[counter] || 0) + value });
    },
    [sessionData, updateSessionData]
  );

  // Trackear evento
  const trackEvent = useCallback(
    (eventType, data = {}) => {
      switch (eventType) {
        case 'layout_generated':
          incrementCounter('layoutsGenerated');
          break;
        case 'guest_assigned':
          incrementCounter('guestsAssignedInSession');
          break;
        case 'template_used':
          incrementCounter('templatesUsed');
          break;
        case 'collaborative_session':
          incrementCounter('collaborativeSessions');
          break;
        case 'stats_updated':
          updateSessionData(data);
          break;
        default:
          break;
      }

      // Verificar logros después de cada evento
      setTimeout(() => {
        checkAndUnlock();
      }, 100);
    },
    [incrementCounter, updateSessionData, checkAndUnlock]
  );

  // Resetear logros (solo para testing)
  const resetAchievements = useCallback(() => {
    setUnlockedAchievements([]);
    setSessionData({
      layoutsGenerated: 0,
      totalGuests: 0,
      assignedGuests: 0,
      conflictsCount: 0,
      collaborativeSessions: 0,
      guestsAssignedInSession: 0,
      totalTables: 0,
      templatesUsed: 0,
    });
    setRecentlyUnlocked(null);
  }, []);

  // Calcular progreso
  const progress = calculateProgress(unlockedAchievements);

  // Obtener siguiente logro
  const nextAchievement = getNextAchievement(unlockedAchievements, sessionData);

  // Obtener logros desbloqueados completos
  const unlockedAchievementsFull = unlockedAchievements
    .map((id) => Object.values(ACHIEVEMENTS).find((a) => a.id === id))
    .filter(Boolean);

  return {
    // Estado
    unlockedAchievements: unlockedAchievementsFull,
    recentlyUnlocked,
    sessionData,
    progress,
    nextAchievement,

    // Acciones
    trackEvent,
    updateSessionData,
    checkAndUnlock,
    resetAchievements,
  };
};
