import { useState, useEffect } from 'react';

import { useWedding } from '../context/WeddingContext';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para gestionar el estado del onboarding del usuario.
 * Se asegura de no activar el tutorial cuando se navega por la web publica.
 */
export const useOnboarding = () => {
  const { currentUser, hasRole } = useAuth();
  const { weddings, activeWedding, weddingsReady } = useWedding();

  const marketingView =
    typeof window !== 'undefined' && window.__LOVENDA_MARKETING_VIEW__ === true;
  const ownerLike = hasRole ? hasRole('owner', 'pareja', 'admin') : false;
  const rawForceFlag =
    typeof window !== 'undefined' ? localStorage.getItem('forceOnboarding') === '1' : false;
  const forceFlag = ownerLike && !marketingView && rawForceFlag && Boolean(currentUser?.uid);

  const [showOnboarding, setShowOnboarding] = useState(forceFlag && !marketingView);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Decidir si mostrar onboarding en funcion del estado del usuario y sus bodas.
  useEffect(() => {
    if (marketingView) {
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setLoading(false);
      return;
    }

    if (!ownerLike) {
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setLoading(false);
      return;
    }

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
      // Esperar a que el listado de bodas este resuelto.
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
  }, [marketingView, forceFlag, ownerLike, currentUser, weddingsReady, weddings, activeWedding]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forceOnboarding');
    }

    if (currentUser?.uid && typeof window !== 'undefined') {
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
