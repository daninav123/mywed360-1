import { useState, useEffect } from 'react';

import { useWedding } from '../context/WeddingContext';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para gestionar el estado del onboarding del usuario
 * @returns {{
 *   showOnboarding: boolean,
 *   onboardingCompleted: boolean,
 *   completeOnboarding: Function
 * }}
 */
export const useOnboarding = () => {
  const { currentUser } = useAuth();
  const { weddings, activeWedding, weddingsReady } = useWedding();
  // Si existe flag en localStorage, mostramos onboarding sí o sí
  const forceFlag =
    typeof window !== 'undefined' ? localStorage.getItem('forceOnboarding') === '1' : false;
  const [showOnboarding, setShowOnboarding] = useState(forceFlag);
  // No eliminamos el flag aquí; se quitará cuando se complete el tutorial.

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Decidir si mostrar onboarding en función del estado del usuario y sus bodas
  useEffect(() => {
    if (forceFlag) {
      setShowOnboarding(true);
      setOnboardingCompleted(false);
      setLoading(false);
      return;
    }

    if (!currentUser?.uid) {
      setShowOnboarding(false);
      setOnboardingCompleted(false);
      setLoading(false);
      return;
    }

    if (!weddingsReady) {
      // Esperar a que el listado de bodas esté resuelto
      setLoading(true);
      return;
    }

    const hasWedding =
      (Array.isArray(weddings) && weddings.length > 0) || Boolean(activeWedding);

    if (hasWedding) {
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setLoading(false);
      return;
    }

    const localOnboardingKey = `onboarding_completed_${currentUser.uid}`;
    const localCompleted =
      typeof window !== 'undefined' ? localStorage.getItem(localOnboardingKey) : null;

    if (localCompleted === 'true') {
      setShowOnboarding(false);
      setOnboardingCompleted(true);
    } else {
      setShowOnboarding(true);
      setOnboardingCompleted(false);
    }

    setLoading(false);
  }, [forceFlag, currentUser, weddingsReady, weddings, activeWedding]);

  // Función para marcar el onboarding como completado
  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    localStorage.removeItem('forceOnboarding');

    // Guardar en localStorage como backup
    if (currentUser?.uid) {
      const localOnboardingKey = `onboarding_completed_${currentUser.uid}`;
      localStorage.setItem(localOnboardingKey, 'true');
    }
  };

  return {
    showOnboarding,
    onboardingCompleted,
    completeOnboarding,
    loading,
  };
};
