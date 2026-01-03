import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Globe, ChevronDown, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { auth, db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth.jsx';
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../../i18n';

// Selector de idioma con dropdown
const LanguageSelector = ({
  className = '',
  showFlag = true,
  showText = true,
  variant = 'button',
  persist = true,
}) => {
  const { t } = useTranslation();
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();
  const currentLang =
    availableLanguages.find((lang) => lang.code === currentLanguage) || availableLanguages[0];

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }
    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      // Persistir preferencia para el detector de i18next
      localStorage.setItem('i18nextLng', languageCode);
      // Update Firebase Auth language if available
      try {
        if (auth) auth.languageCode = languageCode;
      } catch {}

      if (persist) {
        // Persist in local profile (useAuth)
        try {
          const prefs = (userProfile && userProfile.preferences) || {};
          if (updateUserProfile) {
            await updateUserProfile({ preferences: { ...prefs, language: languageCode } });
          }
        } catch (e) {
          // console.warn('Could not update local user profile language', e);
        }

        // Persist in Firestore (if user available)
        try {
          if (currentUser?.uid && db) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              'preferences.language': languageCode,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          // console.warn('Could not save language to Firestore; using localStorage only', e);
        }
      }
    } catch (err) {
      // console.error('Error cambiando idioma:', err);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e) => {
      if (!e.target.closest('.language-selector')) setIsOpen(false);
    };
    // Delay para permitir que el click del botón se procese primero
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', onDocClick);
    };
  }, [isOpen]);

  // Cerrar con tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (variant === 'minimal') {
    return (
      <div className={`relative language-selector ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          title={t('navigation.settings', { defaultValue: 'Ajustes' })}
          disabled={isChanging}
        >
          <Globe size={20} className={isChanging ? 'animate-spin' : ''} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px] max-h-80 overflow-y-auto">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${language.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="flex-1">{language.name}</span>
                {language.code === currentLanguage && <Check size={16} className="text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative language-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors min-w-[120px] ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {showFlag && <span className="text-lg">{currentLang.flag}</span>}
        {showText && (
          <span className="flex-1 text-left text-sm font-medium">{currentLang.name}</span>
        )}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isChanging ? 'animate-spin' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-full max-h-80 overflow-y-auto">
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${language.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="flex-1">{language.name}</span>
              {language.code === currentLanguage && <Check size={16} className="text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
