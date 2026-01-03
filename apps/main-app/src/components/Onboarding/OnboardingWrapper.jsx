import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useWedding } from '../../context/WeddingContext';
import OnboardingTutorial from './OnboardingTutorial';
import SetupChecklist from './SetupChecklist';
import { useOnboarding } from '../../hooks/useOnboarding';
import { trackOnboardingEvent, OnboardingEvents } from '../../services/onboardingTelemetry';

/**
 * Wrapper de Onboarding - Orquesta el flujo completo
 * Muestra el tutorial inicial y luego el checklist de progreso
 */
const OnboardingWrapper = () => {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const { showOnboarding, completeOnboarding, loading } = useOnboarding();
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  // Verificar si el checklist fue desactivado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('setup_checklist_dismissed');
      setChecklistDismissed(dismissed === 'true');
    }
  }, []);

  // Mostrar checklist después de completar el tutorial
  useEffect(() => {
    if (!showOnboarding && activeWedding && !checklistDismissed) {
      // Pequeño delay para que la transición sea suave
      const timer = setTimeout(() => {
        setShowChecklist(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, activeWedding, checklistDismissed]);

  const handleTutorialComplete = () => {
    // Track evento
    if (currentUser?.uid && activeWedding) {
      trackOnboardingEvent(
        currentUser.uid, 
        activeWedding, 
        OnboardingEvents.TUTORIAL_COMPLETED
      );
    }
    
    completeOnboarding();
  };

  const handleChecklistDismiss = () => {
    setShowChecklist(false);
    setChecklistDismissed(true);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('setup_checklist_dismissed', 'true');
    }

    // Track evento
    if (currentUser?.uid && activeWedding) {
      trackOnboardingEvent(
        currentUser.uid,
        activeWedding,
        OnboardingEvents.CHECKLIST_DISMISSED
      );
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Tutorial inicial */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={handleTutorialComplete} />
      )}

      {/* Checklist de progreso (sticky en la página) */}
      {showChecklist && !showOnboarding && (
        <div className="fixed bottom-4 right-4 z-40 max-w-md w-full">
          <SetupChecklist onDismiss={handleChecklistDismiss} />
        </div>
      )}
    </>
  );
};

export default OnboardingWrapper;
