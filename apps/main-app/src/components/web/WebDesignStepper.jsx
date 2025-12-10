import React from 'react';
import { Check } from 'lucide-react';

const WebDesignStepper = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, name: 'Plantilla', icon: '🎨', description: 'Elige tu estilo' },
    { id: 2, name: 'Personalizar', icon: '✏️', description: 'Añade tu toque' },
    { id: 3, name: 'Vista Previa', icon: '👀', description: 'Revisa tu web' },
    { id: 4, name: 'Publicar', icon: '🚀', description: 'Comparte al mundo' },
  ];

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'current':
        return 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100';
      case 'pending':
        return 'bg-gray-100 border-gray-300 text-gray-400';
      default:
        return '';
    }
  };

  const getConnectorColor = (stepId) => {
    return stepId < currentStep ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-lg px-8 py-6 mb-8">
      <div className="max-w-4xl mx-auto">
        {/* Steps */}
        <div className="relative">
          {/* Connector Line */}
          <div
            className="absolute top-10 left-0 right-0 h-1 bg-gray-200 -z-10"
            style={{ top: '2.5rem' }}
          >
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isClickable = step.id <= currentStep;

              return (
                <div key={step.id} className="relative">
                  {/* Step Circle */}
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={`
                      w-full flex flex-col items-center transition-all duration-300
                      ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                      ${status === 'current' ? 'transform scale-105' : ''}
                    `}
                  >
                    {/* Icon Circle */}
                    <div
                      className={`
                        w-20 h-20 rounded-full border-4 flex items-center justify-center
                        transition-all duration-300 relative
                        ${getStepColor(status)}
                        ${isClickable ? 'hover:scale-110' : ''}
                      `}
                    >
                      {status === 'completed' ? (
                        <Check size={32} className="stroke-[3]" />
                      ) : (
                        <span className="text-3xl">{step.icon}</span>
                      )}

                      {/* Pulse effect for current step */}
                      {status === 'current' && (
                        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="mt-3 text-center">
                      <p
                        className={`
                        font-semibold text-sm transition-colors
                        ${status === 'current' ? 'text-blue-900' : ''}
                        ${status === 'completed' ? 'text-green-700' : ''}
                        ${status === 'pending' ? 'text-gray-400' : ''}
                      `}
                      >
                        {step.name}
                      </p>
                      <p
                        className={`
                        text-xs mt-1 transition-colors
                        ${status === 'current' ? 'text-blue-600' : 'text-gray-500'}
                        ${status === 'pending' ? 'text-gray-400' : ''}
                      `}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Step Number Badge */}
                    {status !== 'completed' && (
                      <div
                        className={`
                        absolute -top-2 -right-2 w-6 h-6 rounded-full 
                        flex items-center justify-center text-xs font-bold
                        ${status === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}
                      `}
                      >
                        {step.id}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar and Stats */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
              Progreso:{' '}
              <span className="text-blue-600 font-bold">
                {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%
              </span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {currentStep < steps.length && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{steps.length - currentStep}</span> pasos restantes
            </div>
          )}

          {currentStep === steps.length && (
            <div className="text-sm text-green-600 font-semibold flex items-center gap-2">
              <Check size={16} />
              ¡Completado!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebDesignStepper;
