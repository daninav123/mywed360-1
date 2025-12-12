/**
 * DesignWizard - Wizard completo de diseño de boda
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import StyleQuiz from '../components/design/StyleQuiz';
import ColorPaletteSelector from '../components/design/ColorPaletteSelector';
import MoodBoard from '../components/design/MoodBoard';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const STEPS = [
  { id: 'quiz', label: 'Quiz de Estilo', icon: '🎨' },
  { id: 'palette', label: 'Paleta de Colores', icon: '🎨' },
  { id: 'moodboard', label: 'Mood Board', icon: '📌' },
  { id: 'review', label: 'Revisión', icon: '✅' },
];

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
              currentStep === index
                ? 'border-blue-500 bg-blue-500 text-white'
                : currentStep > index
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {currentStep > index ? (
                <Check className="w-6 h-6" />
              ) : (
                <span className="text-2xl">{step.icon}</span>
              )}
            </div>
            <div className="ml-3 hidden md:block">
              <p className={`text-sm font-medium ${
                currentStep >= index ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-4 rounded ${
              currentStep > index ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ReviewStep = ({ designData, onBack, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Resumen de tu Diseño
        </h2>
        <p className="text-gray-600">
          Revisa y confirma tu visión antes de guardar
        </p>
      </div>

      {/* Style */}
      {designData.style && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎨 Estilo Principal
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {designData.style.name}
            </h4>
            <p className="text-gray-600 mb-3">{designData.style.description}</p>
            <div className="flex flex-wrap gap-2">
              {designData.style.keywords.map((keyword, idx) => (
                <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Palette */}
      {designData.palette && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎨 Paleta de Colores
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">{designData.palette.name}</h4>
            <div className="flex gap-3">
              {designData.palette.colors.map((color, idx) => (
                <div key={idx} className="flex-1">
                  <div
                    className="w-full h-20 rounded-lg shadow-sm border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center text-gray-600 mt-2 font-mono">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mood Board */}
      {designData.moodBoard && designData.moodBoard.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📌 Mood Board ({designData.moodBoard.length} elementos)
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {designData.moodBoard.slice(0, 8).map((item, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.caption || 'Inspiration'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-50 border border-yellow-200 p-2 flex items-center justify-center">
                    <p className="text-xs text-gray-700 line-clamp-4">{item.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {designData.moodBoard.length > 8 && (
            <p className="text-sm text-gray-500 mt-3">
              +{designData.moodBoard.length - 8} elementos más
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <button
          onClick={onBack}
          disabled={saving}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar diseño ✓'}
        </button>
      </div>
    </div>
  );
};

export default function DesignWizard() {
  const { activeWedding } = useWedding();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [designData, setDesignData] = useState({
    style: null,
    styleResults: null,
    palette: null,
    moodBoard: [],
  });

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadDesign = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'design', 'profile');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDesignData({
            style: data.style || null,
            styleResults: data.styleResults || null,
            palette: data.palette || null,
            moodBoard: data.moodBoard || [],
          });
          
          if (data.style) {
            setCurrentStep(1);
          }
          if (data.palette) {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error('Error loading design:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDesign();
  }, [activeWedding]);

  const saveDesign = useCallback(async (data) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'design', 'profile');
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleQuizComplete = useCallback((result) => {
    const updated = {
      ...designData,
      style: result.topStyle,
      styleResults: result.allResults,
    };
    setDesignData(updated);
    saveDesign(updated);
    setCurrentStep(1);
    toast.success('Estilo guardado');
  }, [designData, saveDesign]);

  const handlePaletteSelect = useCallback((palette) => {
    const updated = {
      ...designData,
      palette,
    };
    setDesignData(updated);
    saveDesign(updated);
  }, [designData, saveDesign]);

  const handleMoodBoardUpdate = useCallback((items) => {
    const updated = {
      ...designData,
      moodBoard: items,
    };
    setDesignData(updated);
    saveDesign(updated);
  }, [designData, saveDesign]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSaveAndFinish = useCallback(async () => {
    setSaving(true);
    await saveDesign({
      ...designData,
      completedAt: new Date(),
    });
    setSaving(false);
    toast.success('Diseño guardado correctamente ✓');
  }, [designData, saveDesign]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando wizard...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Wizard de Diseño</h1>
          <p className="text-gray-600">
            Define el estilo visual de tu boda en 4 pasos
          </p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {currentStep === 0 && (
            <StyleQuiz onComplete={handleQuizComplete} />
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Selecciona tu Paleta de Colores
                </h2>
                <p className="text-gray-600">
                  Paletas recomendadas para {designData.style?.name || 'tu estilo'}
                </p>
              </div>

              <ColorPaletteSelector
                styleId={designData.style?.id}
                selectedPalette={designData.palette}
                onSelect={handlePaletteSelect}
              />

              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  disabled={!designData.palette}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Crea tu Mood Board
                </h2>
                <p className="text-gray-600">
                  Reúne imágenes y notas de inspiración
                </p>
              </div>

              <MoodBoard
                items={designData.moodBoard}
                onUpdate={handleMoodBoardUpdate}
              />

              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Revisar diseño
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <ReviewStep
              designData={designData}
              onBack={handleBack}
              onSave={handleSaveAndFinish}
              saving={saving}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
