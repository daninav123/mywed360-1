import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, HelpCircle } from 'lucide-react';

const SimpleWebDesigner = ({
  currentStep,
  onStepChange,
  templates,
  selectedTemplate,
  onTemplateSelect,
  prompt,
  onPromptChange,
  variables,
  onGenerateClick,
  loading,
  html,
  children,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const steps = ['Plantilla', 'Contenido', 'Previsualizar', 'Publicar'];

  const VariableBadge = ({ label, value, onClick }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
      title="Click para editar"
    >
      <span className="font-medium">{label}</span>
      <span className="text-blue-900">·</span>
      <span>{value || 'sin datos'}</span>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Minimalista */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Diseño Web</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paso {currentStep} de {steps.length}
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Ayuda"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Stepper Simple */}
      <div className="mb-8 flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              <button
                onClick={() => stepNum <= currentStep && onStepChange(stepNum)}
                disabled={stepNum > currentStep}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-all
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                        : 'bg-gray-100 text-gray-400'
                  }
                  ${stepNum <= currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? <Check size={16} /> : stepNum}
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`
                  w-12 h-0.5 mx-1
                  ${stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Contenido por Paso */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">{children}</div>

      {/* Navegación */}
      <div className="mt-6 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            onClick={() => onStepChange(currentStep - 1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
        ) : (
          <div />
        )}

        {currentStep < steps.length && (
          <button
            onClick={() => onStepChange(currentStep + 1)}
            disabled={!html && currentStep === 3}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Panel de Ayuda */}
      {showHelp && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Ayuda: {steps[currentStep - 1]}</h3>
          <p className="text-sm text-blue-700">
            {currentStep === 1 && 'Elige el estilo que mejor represente tu boda.'}
            {currentStep === 2 &&
              'Describe cómo quieres que sea tu web. Usa las variables para personalizar.'}
            {currentStep === 3 && 'Revisa cómo se verá tu web antes de publicarla.'}
            {currentStep === 4 && 'Publica tu web y comparte el enlace con tus invitados.'}
          </p>
        </div>
      )}
    </div>
  );
};

// Componente para Paso 1: Plantillas Simples
export const SimpleTemplateSelector = ({ templates, selectedTemplate, onSelect }) => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Elige una plantilla</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(templates || {}).map(([key, template]) => {
          const isSelected = selectedTemplate === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                text-left p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                {isSelected && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{template.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Componente para Paso 2: Editor Simple
export const SimplePromptEditor = ({ prompt, onChange, variables = {}, onEditVariable }) => {
  const [showVariables, setShowVariables] = useState(false);

  const availableVars = [
    { key: 'nombres', label: 'Pareja', value: variables.nombres },
    { key: 'fecha', label: 'Fecha', value: variables.fecha },
    { key: 'ubicacion', label: 'Lugar', value: variables.ubicacion },
    { key: 'ceremoniaLugar', label: 'Ceremonia', value: variables.ceremoniaLugar },
    { key: 'recepcionLugar', label: 'Recepción', value: variables.recepcionLugar },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-2">Describe tu web</label>
        <p className="text-sm text-gray-500 mb-3">
          Explica cómo quieres que sea tu página web de boda
        </p>
        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ejemplo: Quiero una web elegante con colores suaves, que muestre nuestra historia..."
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
        />
        <div className="mt-2 text-xs text-gray-500 text-right">{prompt.length} caracteres</div>
      </div>

      {/* Variables como Badges Bonitas */}
      <div>
        <button
          onClick={() => setShowVariables(!showVariables)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showVariables ? '▼' : '▶'} Personalizar con tus datos
        </button>

        {showVariables && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-3">
              Usa estas variables en tu texto para personalizar automáticamente:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableVars.map((v) => (
                <div
                  key={v.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <span className="font-medium text-gray-700">{v.label}:</span>
                  <span className="text-gray-900">{v.value || 'No configurado'}</span>
                  {onEditVariable && (
                    <button
                      onClick={() => onEditVariable(v.key)}
                      className="ml-1 text-blue-600 hover:text-blue-700 text-xs"
                    >
                      editar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ejemplos Colapsables */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium list-none flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Ver ejemplos de texto
        </summary>
        <div className="mt-3 space-y-2">
          <button
            onClick={() =>
              onChange(
                'Quiero una web elegante con colores suaves (rosa y blanco), que muestre nuestra historia de amor, fotos de la pareja, y toda la información práctica de la boda.'
              )
            }
            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200"
          >
            💕 <strong>Romántica:</strong> Web elegante con colores suaves...
          </button>
          <button
            onClick={() =>
              onChange(
                'Diseña una web moderna y minimalista con colores neutros (gris, blanco, dorado), diseño limpio, galería de fotos en grid, y sección de confirmación de asistencia.'
              )
            }
            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200"
          >
            ✨ <strong>Moderna:</strong> Web minimalista con colores neutros...
          </button>
        </div>
      </details>
    </div>
  );
};

export default SimpleWebDesigner;
