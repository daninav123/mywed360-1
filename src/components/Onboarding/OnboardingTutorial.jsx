import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Users,
  ShoppingBag,
  Settings,
  Image,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { db } from '../../firebaseConfig';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../hooks/useAuth';
import { createWedding, getWeddingIdForOwner } from '../../services/WeddingService';

/**
 * Tutorial de onboarding para nuevos usuarios
 */
const OnboardingTutorial = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const { setActiveWedding } = useWedding();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    nombres: '',
    fecha: '',
    lugar: '',
    imagen: '',
  });
  // Paso de timing se implementar� Más adelante
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
        console.error('Error al cargar datos del perfil:', error);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const steps = [
    {
      title: '�Bienvenido a Lovenda!',
      content: (
        <div className="text-center">
          <div className="mx-auto w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <img src="/icon-192.png" alt="Lovenda" className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-bold mb-4">�Comienza a planificar tu boda!</h2>
          <p className="mb-6 text-gray-600">
            Te guiaremos a trav�s de los primeros pasos para configurar tu boda en Lovenda. Este
            tutorial te ayudar� a personalizar la app y conocer sus funcionalidades principales.
          </p>
        </div>
      ),
    },
    {
      title: 'Datos básicos',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completa los datos básicos de tu boda</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombres de la pareja
              </label>
              <input
                type="text"
                value={profileData.nombres}
                onChange={(e) => setProfileData({ ...profileData, nombres: e.target.value })}
                placeholder="Ej: María y Juan"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de la boda</label>
              <input
                type="date"
                value={profileData.fecha}
                onChange={(e) => setProfileData({ ...profileData, fecha: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lugar de celebraci�n
              </label>
              <input
                type="text"
                value={profileData.lugar}
                onChange={(e) => setProfileData({ ...profileData, lugar: e.target.value })}
                placeholder="Ej: Madrid"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Gestión de invitados',
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Gestión de Invitados</h2>
          <p className="mb-4 text-gray-600 text-center">
            Organiza tu lista de invitados, confirma asistencia y asigna mesas para la ceremonia.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Añade invitados y sus acompa�antes</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Organiza por grupos (familia, amigos...)</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Confirma asistencias y alérgenos</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Dise�a el plano de mesas con arrastrar y soltar</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Proveedores</h2>
          <p className="mb-4 text-gray-600 text-center">
            Gestiona tus proveedores, consulta con IA y lleva el seguimiento de todos los servicios
            contratados.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Busca proveedores recomendados con IA</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Marca favoritos para comparar opciones</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Registra pagos y Señales para control financiero</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Calendario y Tareas',
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Planificaci�n</h2>
          <p className="mb-4 text-gray-600 text-center">
            Organiza todo tu calendario y listas de tareas para llevar un control perfecto.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Sincroniza con Google Calendar y otros</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Organiza tareas por prioridad y fecha</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Checklists para antes y durante la boda</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Recibe recordatorios importantes</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Diseños e Invitaciones',
      content: (
        <div>
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Diseños con IA</h2>
          <p className="mb-4 text-gray-600 text-center">
            Crea invitaciones, men�s y otros elementos visuales para tu boda con ayuda de IA.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Genera Diseños personalizados con IA</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Crea invitaciones, men�s y Señalización</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Dise�a tu logo de boda personalizado</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Exporta en alta resoluci�n para imprimir</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: '�Listo para empezar!',
      content: (
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">�Todo listo!</h2>
          <p className="mb-6 text-gray-600">
            Has completado el tutorial inicial. Ya puedes comenzar a utilizar todas las funciones de
            Lovenda para planificar la boda de tus sue�os.
          </p>
          <p className="text-sm text-gray-500">
            Recuerda que puedes acceder a la Configuración en cualquier momento para modificar tus
            datos o consultar esta Guía nuevamente.
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
      // Y tambi�n en la ruta de Configuración legacy: weddings/{id}/info/weddingInfo
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

      // Timing autom�tico se implementar� Más adelante

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
          // Asegurar autenticaci�n con Google; si el usuario no concede, se ignora
          await googleCalendarService.loadClient().catch(() => {});
          if (!googleCalendarService.isAuthenticated()) {
            await googleCalendarService.signIn().catch(() => {});
          }
          if (googleCalendarService.isAuthenticated()) {
            const startDate = new Date(profileData.fecha + 'T12:00:00');
            const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            await googleCalendarService.createEvent({
              title: 'Boda',
              desc: 'Fecha de la boda planificada en Lovenda',
              start: startDate,
              end: endDate,
              location: profileData.lugar || undefined,
              category: 'LUGAR'
            });
          }
        } catch (calErr) {
          console.error('No se pudo crear evento en el calendario:', calErr);
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
      console.error('Error al guardar datos de onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-4 rounded-t-lg flex justify-between items-start">
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
          {/* Bot�n saltar */}
          <button onClick={handleComplete} className="text-xs underline hover:text-gray-200">
            Saltar
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
            <ChevronLeft className="w-5 h-5 mr-1" /> Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-rose-500 text-white rounded flex items-center hover:bg-rose-600"
            >
              Siguiente <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className={`px-4 py-2 bg-green-500 text-white rounded flex items-center hover:bg-green-600 ${
                loading ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {loading ? 'Guardando...' : 'Finalizar'} <Check className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
