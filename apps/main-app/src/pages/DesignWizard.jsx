/**
 * DesignWizard - Wizard completo de diseño de boda
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';
import { User, Mail, Moon, LogOut, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../hooks/useAuth.jsx';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import PageWrapper from '../components/PageWrapper';
import StyleQuiz from '../components/design/StyleQuiz';
import ColorPaletteSelector from '../components/design/ColorPaletteSelector';
import MoodBoard from '../components/design/MoodBoard';
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
        <h2 className="text-3xl font-bold  mb-2" className="text-body">
          {t('designWizard.summaryTitle')}
        </h2>
        <p className="" className="text-secondary">
          {t('designWizard.visionPlaceholder')} antes de guardar
        </p>
      </div>

      {/* Style */}
      {designData.style && (
        <div className=" border  rounded-xl p-6" className="border-default" className="bg-surface">
          <h3 className="text-lg font-semibold  mb-3" className="text-body">
            🎨 {t('designWizard.styleTitle')} {designData.style.name}
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h4 className="text-xl font-bold  mb-2" className="text-body">
              {designData.style.name}
            </h4>
            <p className=" mb-3" className="text-secondary">{designData.style.description}</p>
            <div className="flex flex-wrap gap-2">
              {designData.style.keywords.map((keyword, idx) => (
                <span key={idx} className="px-3 py-1  rounded-full text-sm  border " className="border-default" className="text-body" className="bg-surface">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Palette */}
      {designData.palette && (
        <div className=" border  rounded-xl p-6" className="border-default" className="bg-surface">
          <h3 className="text-lg font-semibold  mb-3" className="text-body">
            🎨 {t('designWizard.colorsTitle')} {designData.palette.name}
          </h3>
          <div className=" rounded-lg p-4" className="bg-page">
            <h4 className="font-semibold  mb-3" className="text-body">{designData.palette.name}</h4>
            <div className="flex gap-3">
              {designData.palette.colors.map((color, idx) => (
                <div key={idx} className="flex-1">
                  <div
                    className="w-full h-20 rounded-lg shadow-sm border " className="border-default"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center  mt-2 font-mono" className="text-secondary">
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
        <div className=" border  rounded-xl p-6" className="border-default" className="bg-surface">
          <h3 className="text-lg font-semibold  mb-3" className="text-body">
            📌 {t('designWizard.moodboardTitle')} ({designData.moodBoard.length} elementos)
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
                    <p className="text-xs  line-clamp-4" className="text-body">{item.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {designData.moodBoard.length > 8 && (
            <p className="text-sm  mt-3" className="text-muted">
              +{designData.moodBoard.length - 8} elementos más
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <button
          onClick={onBack}
          disabled={saving}
          className="px-6 py-3 border-2  rounded-lg font-medium hover: transition-colors disabled:opacity-50 flex items-center gap-2" className="border-default" className="bg-page"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-6 py-3  text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {saving ? 'Guardando...' : 'Guardar diseño ✓'}
        </button>
      </div>
    </div>
  );
};

export default function DesignWizard() {
  const { t } = useTranslation();
  const { activeWedding } = useWedding();
  const { logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2  mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="" className="text-secondary">Cargando wizard...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
    <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
      <LanguageSelector variant="minimal" />
      <div className="relative" data-user-menu>
        <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
          <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
        </button>
        {openUserMenu && (
          <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
            <div className="px-2 py-1"><NotificationCenter /></div>
            <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
            </Link>
            <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body">
              <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
            </Link>
            <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center justify-between"><span className="text-sm flex items-center" className="text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
            <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
            </button>
          </div>
        )}
      </div>
    </div>
    <PageWrapper>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2" className="text-body">{t('designWizard.title')}</h1>
          <p className="" className="text-secondary">
            {t('designWizard.stylePlaceholder')} de tu boda en 4 pasos
          </p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className=" rounded-xl shadow-sm border  p-6 md:p-8" className="border-default" className="bg-surface">
          {currentStep === 0 && (
            <StyleQuiz onComplete={handleQuizComplete} />
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold  mb-2" className="text-body">
                  Selecciona tu Paleta de Colores
                </h2>
                <p className="" className="text-secondary">
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
                  className="px-6 py-3 border-2  rounded-lg font-medium hover: transition-colors flex items-center gap-2" className="border-default" className="bg-page"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  disabled={!designData.palette}
                  className="flex-1 px-6 py-3  text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-primary)' }}
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
                <h2 className="text-2xl font-bold  mb-2" className="text-body">
                  Crea tu Mood Board
                </h2>
                <p className="" className="text-secondary">
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
                  className="px-6 py-3 border-2  rounded-lg font-medium hover: transition-colors flex items-center gap-2" className="border-default" className="bg-page"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3  text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-primary)' }}
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
    <Nav />
    </>
  );
}
