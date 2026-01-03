import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import { Button } from '../ui';
import useTranslations from '../../hooks/useTranslations';
import BudgetWizardStep1 from './BudgetWizardStep1';
import BudgetWizardStep2 from './BudgetWizardStep2';
import BudgetWizardStep3 from './BudgetWizardStep3';

export default function BudgetWizardModal({
  open,
  onClose,
  guestCount = 0,
  wantedServices = [],
  contributions,
  onComplete,
  onRequestAdvisor,
  advisorData,
  advisorLoading,
  benchmarks,
  onApplyBenchmark,
}) {
  const { t } = useTranslations();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    guestCount: guestCount || 0,
    budgetPerPerson: 150,
    totalBudget: 0,
    selectedServices: [],
    distribution: [],
  });

  useEffect(() => {
    if (guestCount > 0) {
      setWizardData(prev => ({
        ...prev,
        guestCount,
        totalBudget: guestCount * prev.budgetPerPerson,
      }));
    }
  }, [guestCount]);

  const handleUpdateData = (updates) => {
    setWizardData(prev => {
      const newData = { ...prev, ...updates };
      if (updates.guestCount !== undefined || updates.budgetPerPerson !== undefined) {
        newData.totalBudget = (updates.guestCount ?? prev.guestCount) * 
                              (updates.budgetPerPerson ?? prev.budgetPerPerson);
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const existingServices = wizardData.distribution
        .map(d => d.name)
        .filter(n => n !== 'Imprevistos');
      
      const servicesChanged = 
        existingServices.length !== wizardData.selectedServices.length ||
        !existingServices.every(s => wizardData.selectedServices.includes(s));
      
      if (servicesChanged && wizardData.distribution.length > 0) {
        console.log('[Wizard] Limpiando distribución anterior, servicios cambiaron');
        setWizardData(prev => ({ ...prev, distribution: [] }));
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (typeof onComplete === 'function') {
      await onComplete(wizardData);
    }
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.guestCount > 0 && wizardData.totalBudget > 0;
      case 2:
        return wizardData.selectedServices.length > 0;
      case 3:
        return wizardData.distribution.length > 0;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('finance.wizard.step1.title', { defaultValue: 'Configuración Base' });
      case 2:
        return t('finance.wizard.step2.title', { defaultValue: 'Selecciona tus Servicios' });
      case 3:
        return t('finance.wizard.step3.title', { defaultValue: 'Distribución del Presupuesto' });
      default:
        return '';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[color:var(--color-primary)]" />
          <span>{t('finance.wizard.title', { defaultValue: 'Configuración de Presupuesto' })}</span>
        </div>
      }
      className="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step === currentStep
                    ? 'bg-[var(--color-primary)] text-white scale-110'
                    : step < currentStep
                    ? 'bg-[var(--color-success)] text-white'
                    : 'bg-[var(--color-text-10)] text-[color:var(--color-text-50)]'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    step < currentStep ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-10)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-body">{getStepTitle()}</h3>
          <p className="text-sm text-muted mt-1">
            {t('finance.wizard.stepCounter', { 
              current: currentStep, 
              total: 3,
              defaultValue: `Paso ${currentStep} de 3` 
            })}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <BudgetWizardStep1
              data={wizardData}
              onUpdate={handleUpdateData}
              contributions={contributions}
              t={t}
            />
          )}
          {currentStep === 2 && (
            <BudgetWizardStep2
              data={wizardData}
              onUpdate={handleUpdateData}
              wantedServices={wantedServices}
              t={t}
            />
          )}
          {currentStep === 3 && (
            <BudgetWizardStep3
              data={wizardData}
              onUpdate={handleUpdateData}
              onRequestAdvisor={onRequestAdvisor}
              advisorData={advisorData}
              advisorLoading={advisorLoading}
              benchmarks={benchmarks}
              onApplyBenchmark={onApplyBenchmark}
              t={t}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-soft">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            leftIcon={<ChevronLeft size={16} />}
          >
            {t('app.back', { defaultValue: 'Atrás' })}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t('app.cancel', { defaultValue: 'Cancelar' })}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ChevronRight size={16} />}
              >
                {t('app.next', { defaultValue: 'Siguiente' })}
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed()}
                leftIcon={<Sparkles size={16} />}
              >
                {t('finance.wizard.finish', { defaultValue: 'Finalizar Configuración' })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
