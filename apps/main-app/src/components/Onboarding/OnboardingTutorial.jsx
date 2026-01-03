import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Users,
  ShoppingBag,
  Image,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createWedding, getWeddingIdForOwner } from '../../services/WeddingService';

/**
 * Tutorial de onboarding para nuevos usuarios
 */
const OnboardingTutorial = ({ onComplete }) => {
  const { t } = useTranslation(['onboarding']);
  const { currentUser } = useAuth();
  const { setActiveWedding } = useWedding();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    nombres: '',
    fecha: '',
    lugar: '',
    imagen: '',
  });
  // Paso de timing se implementar Ms adelante
  const [loading, setLoading] = useState(false);

  // Carga datos del perfil si existen
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser?.uid) return;

      try {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.weddingInfo) {
            setProfileData({
              nombres: data.weddingInfo.brideAndGroom || '',
              fecha: data.weddingInfo.weddingDate || '',
              lugar: data.weddingInfo.celebrationPlace || '',
              imagen: data.weddingInfo.profileImage || '',
            });
          }
        }
      } catch (error) {
        // console.error('Error al cargar datos del perfil:', error);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const steps = [
    {
      title: t('onboarding:tutorial.steps.welcome.title'),
      content: (
        <div className="text-center">
          <div className="mx-auto w-32 h-32 bg-100 rounded-full flex items-center justify-center mb-6">
            <img src="/icon-192.png" alt="MaLoveApp" className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('onboarding:tutorial.steps.welcome.heading')}</h2>
          <p className="mb-6 text-gray-600">
            {t('onboarding:tutorial.steps.welcome.description')}
          </p>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.basicData.title'),
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('onboarding:tutorial.steps.basicData.heading')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('onboarding:tutorial.steps.basicData.coupleNames')}
              </label>
              <input
                type="text"
                value={profileData.nombres}
                onChange={(e) => setProfileData({ ...profileData, nombres: e.target.value })}
                placeholder={t('onboarding:tutorial.steps.basicData.coupleNamesPlaceholder')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('onboarding:tutorial.steps.basicData.weddingDate')}</label>
              <input
                type="date"
                value={profileData.fecha}
                onChange={(e) => setProfileData({ ...profileData, fecha: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('onboarding:tutorial.steps.basicData.celebrationPlace')}
              </label>
              <input
                type="text"
                value={profileData.lugar}
                onChange={(e) => setProfileData({ ...profileData, lugar: e.target.value })}
                placeholder={t('onboarding:tutorial.steps.basicData.celebrationPlacePlaceholder')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.guestManagement.title'),
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">{t('onboarding:tutorial.steps.guestManagement.heading')}</h2>
          <p className="mb-4 text-gray-600 text-center">
            {t('onboarding:tutorial.steps.guestManagement.description')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.guestManagement.features.addGuests')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.guestManagement.features.organizeGroups')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.guestManagement.features.confirmAttendance')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.guestManagement.features.designSeating')}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.suppliers.title'),
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">{t('onboarding:tutorial.steps.suppliers.heading')}</h2>
          <p className="mb-4 text-gray-600 text-center">
            {t('onboarding:tutorial.steps.suppliers.description')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.suppliers.features.searchAI')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.suppliers.features.markFavorites')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.suppliers.features.registerPayments')}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.calendarTasks.title'),
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">{t('onboarding:tutorial.steps.calendarTasks.heading')}</h2>
          <p className="mb-4 text-gray-600 text-center">
            {t('onboarding:tutorial.steps.calendarTasks.description')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.calendarTasks.features.syncCalendar')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.calendarTasks.features.organizeTasks')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.calendarTasks.features.checklists')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.calendarTasks.features.reminders')}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.designs.title'),
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-100 rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">{t('onboarding:tutorial.steps.designs.heading')}</h2>
          <p className="mb-4 text-gray-600 text-center">
            {t('onboarding:tutorial.steps.designs.description')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.designs.features.generateDesigns')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.designs.features.createInvitations')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.designs.features.designLogo')}</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{t('onboarding:tutorial.steps.designs.features.exportHighRes')}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: t('onboarding:tutorial.steps.ready.title'),
      content: (
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('onboarding:tutorial.steps.ready.heading')}</h2>
          <p className="mb-6 text-gray-600">
            {t('onboarding:tutorial.steps.ready.description')}
          </p>
          <p className="text-sm text-gray-500">
            {t('onboarding:tutorial.steps.ready.hint')}
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!currentUser?.uid) {
      onComplete && onComplete();
      return;
    }

    setLoading(true);
    try {
      // Guardar datos en weddingInfo
      let wid = await getWeddingIdForOwner(currentUser.uid);
      if (!wid) {
        wid = await createWedding(currentUser.uid, {
          name: profileData.nombres || 'Mi Boda',
          weddingDate: profileData.fecha || undefined,
        });
      }

      const weddingInfoPayload = {
        brideAndGroom: profileData.nombres,
        weddingDate: profileData.fecha,
        celebrationPlace: profileData.lugar,
        profileImage: profileData.imagen,
      };

      // Guardar weddingInfo como un campo del documento principal de la boda
      await setDoc(doc(db, 'weddings', wid), { weddingInfo: weddingInfoPayload }, { merge: true });
      // Y tambin en la ruta de Configuracin legacy: weddings/{id}/info/weddingInfo
      try {
        await setDoc(doc(db, 'weddings', wid, 'info', 'weddingInfo'), weddingInfoPayload, {
          merge: true,
        });
      } catch (_) {}

      // Asegurar que la boda aparece en users/{uid}/weddings (para carga en WeddingContext)
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'weddings', wid),
          {
            id: wid,
            name: profileData.nombres || 'Mi Boda',
            weddingDate: profileData.fecha || '',
            location: profileData.lugar || '',
            progress: 0,
            active: true,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (_) {}

      // Timing automtico se implementar Ms adelante

      // Marcar onboarding completado en users/{uid}
      const profileRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        profileRef,
        { onboardingCompleted: true, lastUpdated: new Date().toISOString() },
        { merge: true }
      );

      /* Crear evento en calendario si hay fecha de boda
      if (profileData.fecha) {
        try {
          // Asegurar autenticacin con Google; si el usuario no concede, se ignora
          await googleCalendarService.loadClient().catch(() => {});
          if (!googleCalendarService.isAuthenticated()) {
            await googleCalendarService.signIn().catch(() => {});
          }
          if (googleCalendarService.isAuthenticated()) {
            const startDate = new Date(profileData.fecha + 'T12:00:00');
            const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            await googleCalendarService.createEvent({
              title: 'Boda',
              desc: 'Fecha de la boda planificada en MaLoveApp',
              start: startDate,
              end: endDate,
              location: profileData.lugar || undefined,
              category: 'LUGAR'
            });
          }
        } catch (calErr) {
          // console.error('No se pudo crear evento en el calendario:', calErr);
        }
      }
      */

      // Establecer la boda activa en el contexto/localStorage
      try {
        setActiveWedding?.(wid);
      } catch {}

      // Llamar al callback cuando se completa
      onComplete && onComplete();
    } catch (error) {
      // console.error('Error al guardar datos de onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="bg-[var(--color-primary)] text-white px-6 py-4 rounded-t-lg flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{steps[currentStep].title}</h3>
            <div className="flex mt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full mr-1 flex-1 ${
                    index <= currentStep ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Botn saltar */}
          <button onClick={handleComplete} className="text-xs underline hover:text-gray-200">
            {t('onboarding:tutorial.skip')}
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">{steps[currentStep].content}</div>

        {/* Botones */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded flex items-center ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> {t('onboarding:tutorial.previous')}
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-rose-500 text-white rounded flex items-center hover:bg-rose-600"
            >
              {t('onboarding:tutorial.next')} <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className={`px-4 py-2 bg-green-500 text-white rounded flex items-center hover:bg-green-600 ${
                loading ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {loading ? t('onboarding:tutorial.saving') : t('onboarding:tutorial.finish')} <Check className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;



