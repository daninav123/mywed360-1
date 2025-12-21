import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { Card, Button, Input } from '../components/ui';
import ImageUploader from '../components/ImageUploader';
import { useWedding } from '../context/WeddingContext';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import WeddingVisionSection from '../components/wedding/WeddingVisionSection';
import SupplierRequirementsSection from '../components/wedding/SupplierRequirementsSection';
import WeddingDesignChat from '../components/wedding/WeddingDesignChat';
import { initializeWeddingDesign } from '../utils/weddingDesignTemplate';
import { initializeSupplierRequirements } from '../utils/supplierRequirementsTemplate';

function InfoBoda() {
  const { t } = useTranslation();
  const [weddingInfo, setWeddingInfo] = useState({
    coupleName: '',
    celebrationPlace: '',
    celebrationAddress: '',
    banquetPlace: '',
    receptionAddress: '',
    schedule: '',
    weddingDate: '',
    rsvpDeadline: '',
    giftAccount: '',
    transportation: '',
    weddingStyle: '',
    colorScheme: '',
    numGuests: '',
    // CAMPOS BASE
    story: '',
    menu: '',
    dressCode: '',
    dressCodeDetails: '',
    giftMessage: '',
    busInfo: '',
    hotelInfo: '',
    additionalInfo: '',
    faqs: '',
    // VISIÓN Y EXPECTATIVAS
    weddingConcept: '',
    mostImportant: '',
    mustHave: '',
    mustNotHave: '',
    remember10Years: '',
    // CEREMONIA DETALLADA
    ceremonyType: '',
    ceremonyRite: '',
    samePlaceCeremonyReception: false,
    ceremonyStyle: '',
    timeOfDay: '',
    // INVITADOS DETALLES
    weddingSize: '',
    manyChildren: false,
    guestsFromOutside: false,
    weddingAtmosphere: '',
    // ESPACIOS DETALLADOS
    whyThisPlace: '',
    indoorOutdoor: '',
    rainPlanB: '',
    spaceType: '',
    // EXPERIENCIA Y FIESTA
    partyType: '',
    endTime: '',
    longOpenBar: false,
    afterParty: false,
    surprises: '',
    specialMoment: '',
    // LOGÍSTICA AVANZADA
    pets: false,
    soundRestrictions: '',
  });
  const [importantInfo, setImportantInfo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [webSlug, setWebSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [weddingDesign, setWeddingDesign] = useState(initializeWeddingDesign());
  const [supplierRequirements, setSupplierRequirements] = useState(initializeSupplierRequirements());
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatContext, setChatContext] = useState(null);

  const { userProfile, user: authUser } = useAuth();
  const fallbackUid = authUser?.uid || auth.currentUser?.uid || null;
  const { activeWedding } = useWedding();
  const weddingId = activeWedding || userProfile?.weddingId || '';

  // Actualiza número de invitados (con muestra local si no hay datos)
  useEffect(() => {
    function updateGuestCount() {
      let guests = [];
      try {
        guests = JSON.parse(localStorage.getItem('mywed360Guests'));
        if (!Array.isArray(guests)) guests = null;
      } catch {
        guests = null;
      }
      if (!guests) {
        guests = [
          {
            id: 1,
            name: 'Ana García',
            phone: '123456789',
            address: 'Calle Sol 1',
            companion: 1,
            table: '5',
            response: 'SÍ',
          },
          {
            id: 2,
            name: 'Luis Martínez',
            phone: '987654321',
            address: 'Av. Luna 3',
            companion: 0,
            table: '',
            response: 'Pendiente',
          },
        ];
      }
      const total = guests.reduce((acc, g) => acc + 1 + (parseInt(g.companion) || 0), 0);
      setWeddingInfo((w) => ({ ...w, numGuests: total }));
    }
    updateGuestCount();
    window.addEventListener('maloveapp-guests', updateGuestCount);
    return () => window.removeEventListener('maloveapp-guests', updateGuestCount);
  }, []);

  const handleWeddingChange = (e) =>
    setWeddingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Generar slug desde el nombre de la pareja
  const generateSlug = () => {
    const coupleName = weddingInfo.coupleName || '';
    if (!coupleName) {
      toast.error('Primero ingresa el nombre de la pareja');
      return;
    }

    // Convertir a slug: lowercase, sin acentos, guiones
    const slug = coupleName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setWebSlug(slug);
    toast.success('Slug generado. Guarda para aplicar cambios.');
  };

  // Copiar URL pública al portapapeles
  const copyPublicUrl = () => {
    const url = `${window.location.origin}/web/${webSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('¡URL copiada al portapapeles!');
  };

  const handleChatOpen = (context) => {
    setChatContext(context);
    setShowChatModal(true);
  };

  const weddingFields = [
    {
      name: 'coupleName',
      labelKey: 'profile.wedding.coupleName',
      defaultValue: 'Nombre de la pareja',
    },
    {
      name: 'celebrationPlace',
      labelKey: 'profile.wedding.celebrationPlace',
      defaultValue: 'Lugar de la celebración',
    },
    {
      name: 'celebrationAddress',
      labelKey: 'profile.wedding.celebrationAddress',
      defaultValue: 'Dirección de la celebración',
    },
    {
      name: 'banquetPlace',
      labelKey: 'profile.wedding.banquetPlace',
      defaultValue: 'Lugar del banquete',
    },
    {
      name: 'receptionAddress',
      labelKey: 'profile.wedding.receptionAddress',
      defaultValue: 'Dirección del banquete',
    },
    {
      name: 'schedule',
      labelKey: 'profile.wedding.schedule',
      defaultValue: 'Horario (ceremonia/recepción)',
    },
    {
      name: 'weddingDate',
      labelKey: 'profile.wedding.date',
      defaultValue: 'Fecha de la boda',
      type: 'date',
    },
    {
      name: 'rsvpDeadline',
      labelKey: 'profile.wedding.rsvp',
      defaultValue: 'Fecha límite RSVP',
      type: 'date',
    },
    {
      name: 'giftAccount',
      labelKey: 'profile.wedding.giftAccount',
      defaultValue: 'Cuenta de regalos',
    },
    {
      name: 'transportation',
      labelKey: 'profile.wedding.transportation',
      defaultValue: 'Transporte / alojamiento',
    },
    { name: 'weddingStyle', labelKey: 'profile.wedding.style', defaultValue: 'Estilo de la boda' },
    {
      name: 'colorScheme',
      labelKey: 'profile.wedding.colorScheme',
      defaultValue: 'Paleta de colores (web)',
      placeholderKey: 'profile.wedding.colorSchemePlaceholder',
      placeholderDefault: 'Blanco y dorado',
    },
    {
      name: 'numGuests',
      labelKey: 'profile.wedding.numGuests',
      defaultValue: 'Número de invitados',
      type: 'number',
      readOnly: true,
    },
    // NUEVOS CAMPOS
    {
      name: 'story',
      labelKey: 'profile.wedding.story',
      defaultValue: 'Historia de la pareja',
      type: 'textarea',
      placeholder: 'Cuéntanos vuestra historia de amor...',
    },
    {
      name: 'menu',
      labelKey: 'profile.wedding.menu',
      defaultValue: 'Menú del evento',
      type: 'textarea',
      placeholder: 'Entrantes:\n- Ensalada...\n\nPrincipales:\n- Solomillo...',
    },
    {
      name: 'dressCode',
      labelKey: 'profile.wedding.dressCode',
      defaultValue: 'Código de vestimenta',
      placeholder: 'Ej: Formal, Semi-formal, Etiqueta',
    },
    {
      name: 'dressCodeDetails',
      labelKey: 'profile.wedding.dressCodeDetails',
      defaultValue: 'Detalles del código de vestimenta',
      type: 'textarea',
      placeholder: 'Sugerimos tonos pastel y evitar el blanco...',
    },
    {
      name: 'giftMessage',
      labelKey: 'profile.wedding.giftMessage',
      defaultValue: 'Mensaje sobre regalos',
      type: 'textarea',
      placeholder: 'Lo más importante para nosotros es vuestra asistencia...',
    },
    {
      name: 'busInfo',
      labelKey: 'profile.wedding.busInfo',
      defaultValue: 'Información de autobuses',
      type: 'textarea',
      placeholder: 'Ida: 16:00 desde Plaza Mayor\nVuelta: 02:00 desde el lugar...',
    },
    {
      name: 'hotelInfo',
      labelKey: 'profile.wedding.hotelInfo',
      defaultValue: 'Hoteles recomendados',
      type: 'textarea',
      placeholder: 'Hotel Princesa: +34 91 xxx xxxx, 5km del lugar, desde 80€/noche...',
    },
    {
      name: 'additionalInfo',
      labelKey: 'profile.wedding.additionalInfo',
      defaultValue: 'Información adicional',
      type: 'textarea',
      placeholder: 'Cualquier información adicional importante...',
    },
    {
      name: 'faqs',
      labelKey: 'profile.wedding.faqs',
      defaultValue: 'Preguntas frecuentes',
      type: 'textarea',
      placeholder:
        '¿Hay parking?\nSí, hay parking gratuito...\n\n¿Puedo llevar niños?\nPor supuesto...',
    },
  ];

  const saveWeddingInfo = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error(
        t('profile.errors.userNotFound', { defaultValue: 'No se pudo determinar tu usuario' })
      );
      return;
    }
    // Validaciones rápidas
    try {
      if (weddingInfo.weddingDate) {
        const d = new Date(weddingInfo.weddingDate);
        if (isNaN(d.getTime())) {
          toast.error(
            t('profile.errors.invalidWeddingDate', { defaultValue: 'Fecha de boda inválida' })
          );
          return;
        }
      }
    } catch {}

    try {
      if (weddingId) {
        await updateDoc(doc(db, 'weddings', weddingId), {
          weddingInfo,
          webImages: {
            heroImage,
            gallery: galleryImages,
          },
          webSlug,
          weddingDesign,
          supplierRequirements,
          updatedAt: serverTimestamp(),
        });
        setLastSavedAt(new Date());
        toast.success(t('app.savedSuccessfully', { defaultValue: 'Guardado exitosamente' }));
      } else {
        toast.error(
          t('profile.errors.weddingNotFound', { defaultValue: 'No se encontró tu boda' })
        );
      }
    } catch (error) {
      console.error('Error guardando información:', error);
      toast.error(t('profile.errors.savingProfile', { defaultValue: 'Error al guardar' }));
    }
  };

  useEffect(() => {
    const loadWeddingInfo = async () => {
      const uid = fallbackUid;
      if (!uid) return;
      try {
        if (weddingId) {
          const wedSnap = await getDoc(doc(db, 'weddings', weddingId));
          if (wedSnap.exists() && wedSnap.data().weddingInfo) {
            const wi = wedSnap.data().weddingInfo;
            setWeddingInfo({
              coupleName: wi.coupleName || '',
              celebrationPlace: wi.celebrationPlace || '',
              celebrationAddress: wi.celebrationAddress || '',
              banquetPlace: wi.banquetPlace || '',
              receptionAddress: wi.receptionAddress || '',
              schedule: wi.schedule || '',
              weddingDate: wi.weddingDate || '',
              rsvpDeadline: wi.rsvpDeadline || '',
              giftAccount: wi.giftAccount || '',
              transportation: wi.transportation || '',
              weddingStyle: wi.weddingStyle || '',
              colorScheme: wi.colorScheme || '',
              numGuests: wi.numGuests || '',
              story: wi.story || '',
              menu: wi.menu || '',
              dressCode: wi.dressCode || '',
              dressCodeDetails: wi.dressCodeDetails || '',
              giftMessage: wi.giftMessage || '',
              busInfo: wi.busInfo || '',
              hotelInfo: wi.hotelInfo || '',
              additionalInfo: wi.additionalInfo || '',
              faqs: wi.faqs || '',
              // VISIÓN Y EXPECTATIVAS
              weddingConcept: wi.weddingConcept || '',
              mostImportant: wi.mostImportant || '',
              mustHave: wi.mustHave || '',
              mustNotHave: wi.mustNotHave || '',
              remember10Years: wi.remember10Years || '',
              // CEREMONIA DETALLADA
              ceremonyType: wi.ceremonyType || '',
              ceremonyRite: wi.ceremonyRite || '',
              samePlaceCeremonyReception: wi.samePlaceCeremonyReception || false,
              ceremonyStyle: wi.ceremonyStyle || '',
              timeOfDay: wi.timeOfDay || '',
              // INVITADOS DETALLES
              weddingSize: wi.weddingSize || '',
              manyChildren: wi.manyChildren || false,
              guestsFromOutside: wi.guestsFromOutside || false,
              weddingAtmosphere: wi.weddingAtmosphere || '',
              // ESPACIOS DETALLADOS
              whyThisPlace: wi.whyThisPlace || '',
              indoorOutdoor: wi.indoorOutdoor || '',
              rainPlanB: wi.rainPlanB || '',
              spaceType: wi.spaceType || '',
              // EXPERIENCIA Y FIESTA
              partyType: wi.partyType || '',
              endTime: wi.endTime || '',
              longOpenBar: wi.longOpenBar || false,
              afterParty: wi.afterParty || false,
              surprises: wi.surprises || '',
              specialMoment: wi.specialMoment || '',
              // LOGÍSTICA AVANZADA
              pets: wi.pets || false,
              soundRestrictions: wi.soundRestrictions || '',
            });
            if (wi.importantInfo) setImportantInfo(wi.importantInfo);

            // Cargar imágenes
            const webImages = wedSnap.data().webImages || {};
            setHeroImage(webImages.heroImage || '');
            setGalleryImages(webImages.gallery || []);

            // Cargar slug
            setWebSlug(wedSnap.data().webSlug || '');
          }
        }
      } catch (e) {
        toast.error(
          t('profile.errors.loadingProfile', { defaultValue: 'Error al cargar información' })
        );
      }
    };
    loadWeddingInfo();
  }, [weddingId]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">
          {t('navigation.weddingInfo', { defaultValue: 'Información de la Boda' })}
        </h1>
        {lastSavedAt && (
          <div className="text-sm text-muted">
            {t('profile.lastSaved', { defaultValue: 'Último guardado:' })}{' '}
            {new Date(lastSavedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'info'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Información Básica
        </button>
        <button
          onClick={() => setActiveTab('vision')}
          className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'vision'
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🎭 Visión y Estilo
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'suppliers'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          👥 Especificaciones Proveedores
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'images'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📸 Imágenes Web
        </button>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'vision' && (
        <>
          <WeddingVisionSection
            weddingDesign={weddingDesign}
            onChange={setWeddingDesign}
            onChatOpen={handleChatOpen}
          />
          <div className="text-right">
            <Button onClick={saveWeddingInfo}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
          </div>
        </>
      )}

      {activeTab === 'suppliers' && (
        <>
          <SupplierRequirementsSection
            requirements={supplierRequirements}
            onChange={setSupplierRequirements}
            onChatOpen={handleChatOpen}
          />
          <div className="text-right">
            <Button onClick={saveWeddingInfo}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
          </div>
        </>
      )}

      {activeTab === 'images' && (
        <Card className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            📸 {t('profile.wedding.images', { defaultValue: 'Imágenes de la Web' })}
          </h2>
          <p className="text-sm text-gray-600">
            Las imágenes que subas aquí se mostrarán automáticamente en tu página web
          </p>

          {/* Imagen de Portada */}
          <div className="border-t pt-4">
            <ImageUploader
              currentImageUrl={heroImage}
              storagePath={`web-hero-images/${weddingId}`}
              onUploadSuccess={async (url) => {
                setHeroImage(url);
                try {
                  await updateDoc(doc(db, 'weddings', weddingId), {
                    'webImages.heroImage': url,
                    updatedAt: serverTimestamp(),
                  });
                  toast.success('Imagen de portada actualizada');
                } catch (error) {
                  console.error('Error guardando imagen:', error);
                }
              }}
              onDelete={async () => {
                setHeroImage('');
                try {
                  await updateDoc(doc(db, 'weddings', weddingId), {
                    'webImages.heroImage': '',
                    updatedAt: serverTimestamp(),
                  });
                } catch (error) {
                  console.error('Error eliminando imagen:', error);
                }
              }}
              label="Imagen de Portada (Hero)"
              maxSizeMB={10}
              aspectRatio="16:9"
            />
            <p className="text-xs text-gray-500 mt-2">
              Esta imagen se mostrará en la sección principal de tu web (Hero Section)
            </p>
          </div>

          {/* Galería */}
          <div className="border-t pt-4">
            <h3 className="text-md font-medium mb-3">Galería de Fotos</h3>

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {galleryImages.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imgUrl}
                      alt={`Galería ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={async () => {
                        const newGallery = galleryImages.filter((_, i) => i !== index);
                        setGalleryImages(newGallery);
                        try {
                          await updateDoc(doc(db, 'weddings', weddingId), {
                            'webImages.gallery': newGallery,
                            updatedAt: serverTimestamp(),
                          });
                          toast.success('Imagen eliminada');
                        } catch (error) {
                          console.error('Error:', error);
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ImageUploader
              storagePath={`web-galleries/${weddingId}`}
              onUploadSuccess={async (url) => {
                const newGallery = [...galleryImages, url];
                setGalleryImages(newGallery);
                try {
                  await updateDoc(doc(db, 'weddings', weddingId), {
                    'webImages.gallery': newGallery,
                    updatedAt: serverTimestamp(),
                  });
                  toast.success('Foto añadida a la galería');
                } catch (error) {
                  console.error('Error:', error);
                }
              }}
              label={galleryImages.length === 0 ? 'Añadir primera foto' : 'Añadir otra foto'}
              maxSizeMB={5}
            />
            <p className="text-xs text-gray-500 mt-2">
              {galleryImages.length} foto{galleryImages.length !== 1 ? 's' : ''} en la galería • Estas
              fotos se mostrarán en la sección de Galería
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'info' && (
        <>
      {/* Indicador de progreso */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Progreso de Información</h3>
              <p className="text-sm text-gray-600">Completa todos los datos de tu boda</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                const sections = [
                  // Visión General
                  weddingInfo.weddingConcept || weddingInfo.mostImportant,
                  // Información Esencial
                  weddingInfo.coupleName && weddingInfo.weddingDate,
                  // Ceremonia
                  weddingInfo.ceremonyType && weddingInfo.celebrationPlace,
                  // Banquete y Fiesta
                  weddingInfo.banquetPlace && weddingInfo.spaceType,
                  // Estilo y Diseño
                  weddingInfo.weddingStyle || weddingInfo.colorScheme,
                  // Perfil Invitados
                  weddingInfo.weddingSize || weddingInfo.weddingAtmosphere,
                  // Logística
                  weddingInfo.busInfo || weddingInfo.hotelInfo || weddingInfo.transportation,
                  // Historia
                  weddingInfo.story || weddingInfo.giftMessage,
                  // Info Adicional
                  weddingInfo.faqs || weddingInfo.additionalInfo,
                ];
                const completed = sections.filter(Boolean).length;
                return `${completed}/${sections.length}`;
              })()}
            </div>
            <div className="text-xs text-gray-600">secciones</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${(() => {
                  const sections = [
                    weddingInfo.weddingConcept || weddingInfo.mostImportant,
                    weddingInfo.coupleName && weddingInfo.weddingDate,
                    weddingInfo.ceremonyType && weddingInfo.celebrationPlace,
                    weddingInfo.banquetPlace && weddingInfo.spaceType,
                    weddingInfo.weddingStyle || weddingInfo.colorScheme,
                    weddingInfo.weddingSize || weddingInfo.weddingAtmosphere,
                    weddingInfo.busInfo || weddingInfo.hotelInfo || weddingInfo.transportation,
                    weddingInfo.story || weddingInfo.giftMessage,
                    weddingInfo.faqs || weddingInfo.additionalInfo,
                  ];
                  const completed = sections.filter(Boolean).length;
                  return (completed / sections.length) * 100;
                })()}%` 
              }}
            />
          </div>
        </div>
      </Card>

      {/* Visión General */}
      <Card className="border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💭</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Visión General</h2>
            <p className="text-sm text-gray-600">La esencia de vuestra boda</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo os conocisteis?</label>
            <textarea
              name="howWeMet"
              value={weddingInfo.howWeMet ?? ''}
              onChange={handleWeddingChange}
              placeholder="Cuéntanos vuestra historia..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vuestra boda en una frase</label>
            <Input
              name="weddingConcept"
              value={weddingInfo.weddingConcept ?? ''}
              onChange={handleWeddingChange}
              placeholder="Ej: Una celebración íntima y elegante rodeados de naturaleza"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué es lo más importante ese día?</label>
            <textarea
              name="mostImportant"
              value={weddingInfo.mostImportant ?? ''}
              onChange={handleWeddingChange}
              placeholder="Lo que realmente importa para vosotros..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">✅ SÍ queremos</label>
              <textarea
                name="mustHave"
                value={weddingInfo.mustHave ?? ''}
                onChange={handleWeddingChange}
                placeholder="Elementos imprescindibles..."
                className="w-full min-h-[100px] px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">❌ NO queremos</label>
              <textarea
                name="mustNotHave"
                value={weddingInfo.mustNotHave ?? ''}
                onChange={handleWeddingChange}
                placeholder="Cosas que preferís evitar..."
                className="w-full min-h-[100px] px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">💫 ¿Qué recordaréis en 10 años?</label>
            <textarea
              name="remember10Years"
              value={weddingInfo.remember10Years ?? ''}
              onChange={handleWeddingChange}
              placeholder="¿Qué queréis que permanezca en vuestra memoria?"
              className="w-full min-h-[80px] px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
            />
          </div>
        </div>
      </Card>

      {/* Información Esencial */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💑</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Información Esencial</h2>
            <p className="text-sm text-gray-600">Los datos más importantes de vuestra boda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre de la pareja"
            name="coupleName"
            value={weddingInfo.coupleName ?? ''}
            onChange={handleWeddingChange}
            placeholder="María y Juan"
          />
          <Input
            label="Fecha de la boda"
            name="weddingDate"
            type="date"
            value={weddingInfo.weddingDate ?? ''}
            onChange={handleWeddingChange}
          />
          <Input
            label="Número de invitados"
            name="numGuests"
            type="number"
            value={weddingInfo.numGuests ?? ''}
            readOnly
          />
          <Input
            label="Fecha límite RSVP"
            name="rsvpDeadline"
            type="date"
            value={weddingInfo.rsvpDeadline ?? ''}
            onChange={handleWeddingChange}
          />
        </div>
      </Card>

      {/* Ceremonia */}
      <Card className="border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⛪</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ceremonia</h2>
            <p className="text-sm text-gray-600">Detalles de la ceremonia</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ceremonia</label>
              <select
                name="ceremonyType"
                value={weddingInfo.ceremonyType ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="civil">Civil</option>
                <option value="religiosa">Religiosa</option>
                <option value="simbolica">Simbólica</option>
              </select>
            </div>
            {weddingInfo.ceremonyType === 'religiosa' && (
              <Input
                label="Rito o parroquia"
                name="ceremonyRite"
                value={weddingInfo.ceremonyRite ?? ''}
                onChange={handleWeddingChange}
                placeholder="Ej: Católico, Parroquia San Juan"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de ceremonia</label>
              <select
                name="ceremonyStyle"
                value={weddingInfo.ceremonyStyle ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="tradicional">Tradicional</option>
                <option value="moderno">Moderno</option>
                <option value="personalizado">Muy personalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Momento del día</label>
              <select
                name="timeOfDay"
                value={weddingInfo.timeOfDay ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="dia">De día</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="samePlaceCeremonyReception"
              checked={weddingInfo.samePlaceCeremonyReception ?? false}
              onChange={(e) => setWeddingInfo(prev => ({ ...prev, samePlaceCeremonyReception: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">¿Ceremonia y celebración en el mismo lugar?</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Lugar de la celebración"
              name="celebrationPlace"
              value={weddingInfo.celebrationPlace ?? ''}
              onChange={handleWeddingChange}
              placeholder="Iglesia San Juan"
            />
            <Input
              label="Dirección de la celebración"
              name="celebrationAddress"
              value={weddingInfo.celebrationAddress ?? ''}
              onChange={handleWeddingChange}
              placeholder="Calle Mayor, 1"
            />
          </div>
        </div>
      </Card>

      {/* Banquete y Fiesta */}
      <Card className="border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🍽️</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Banquete y Fiesta</h2>
            <p className="text-sm text-gray-600">Lugar, experiencia y celebración</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Lugar del banquete"
              name="banquetPlace"
              value={weddingInfo.banquetPlace ?? ''}
              onChange={handleWeddingChange}
              placeholder="Hacienda Los Robles"
            />
            <Input
              label="Dirección del banquete"
              name="receptionAddress"
              value={weddingInfo.receptionAddress ?? ''}
              onChange={handleWeddingChange}
              placeholder="Carretera M-40, km 23"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de espacio</label>
              <select
                name="spaceType"
                value={weddingInfo.spaceType ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="masia">Masía</option>
                <option value="finca">Finca</option>
                <option value="hotel">Hotel</option>
                <option value="playa">Playa</option>
                <option value="jardin">Jardín</option>
                <option value="castillo">Castillo</option>
                <option value="bodega">Bodega</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Interior o exterior?</label>
              <select
                name="indoorOutdoor"
                value={weddingInfo.indoorOutdoor ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
          </div>
          <div>
            <Input
              label="Horario (ceremonia/recepción/fin)"
              name="schedule"
              value={weddingInfo.schedule ?? ''}
              onChange={handleWeddingChange}
              placeholder="Ceremonia: 12:00 - Cóctel: 13:30 - Banquete: 15:00 - Fin: 04:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menú del evento</label>
            <textarea
              name="menu"
              value={weddingInfo.menu ?? ''}
              onChange={handleWeddingChange}
              placeholder="Entrantes:&#10;- Ensalada...&#10;&#10;Principales:&#10;- Solomillo..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Por qué elegisteis este lugar?</label>
            <textarea
              name="whyThisPlace"
              value={weddingInfo.whyThisPlace ?? ''}
              onChange={handleWeddingChange}
              placeholder="Lo que os enamoró del lugar..."
              className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan B en caso de lluvia</label>
            <Input
              name="rainPlanB"
              value={weddingInfo.rainPlanB ?? ''}
              onChange={handleWeddingChange}
              placeholder="Ej: Carpa, salón interior..."
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">🎉 Experiencia y Fiesta</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de fiesta deseada</label>
                  <select
                    name="partyType"
                    value={weddingInfo.partyType ?? ''}
                    onChange={handleWeddingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecciona...</option>
                    <option value="intima">Íntima y tranquila</option>
                    <option value="festiva">Festiva y animada</option>
                    <option value="elegante">Elegante y formal</option>
                    <option value="desenfadada">Desenfadada</option>
                  </select>
                </div>
                <Input
                  label="Hora fin aproximada"
                  name="endTime"
                  type="time"
                  value={weddingInfo.endTime ?? ''}
                  onChange={handleWeddingChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="longOpenBar"
                    checked={weddingInfo.longOpenBar ?? false}
                    onChange={(e) => setWeddingInfo(prev => ({ ...prev, longOpenBar: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="text-sm font-medium text-gray-700">¿Barra libre larga?</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="afterParty"
                    checked={weddingInfo.afterParty ?? false}
                    onChange={(e) => setWeddingInfo(prev => ({ ...prev, afterParty: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="text-sm font-medium text-gray-700">¿After party?</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sorpresas o shows planeados</label>
                <textarea
                  name="surprises"
                  value={weddingInfo.surprises ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Ej: Fuegos artificiales, banda en directo, baile sorpresa..."
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Momento especial que queréis destacar</label>
                <Input
                  name="specialMoment"
                  value={weddingInfo.specialMoment ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Ej: Primer baile, discurso, entrada de los novios..."
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Estilo y Diseño */}
      <Card className="border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎨</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Estilo y Diseño</h2>
            <p className="text-sm text-gray-600">Detalles visuales de vuestra boda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Estilo de la boda"
            name="weddingStyle"
            value={weddingInfo.weddingStyle ?? ''}
            onChange={handleWeddingChange}
            placeholder="Rústico, Clásico, Moderno..."
          />
          <Input
            label="Paleta de colores"
            name="colorScheme"
            value={weddingInfo.colorScheme ?? ''}
            onChange={handleWeddingChange}
            placeholder="Blanco y dorado"
          />
          <div className="md:col-span-2">
            <Input
              label="Código de vestimenta"
              name="dressCode"
              value={weddingInfo.dressCode ?? ''}
              onChange={handleWeddingChange}
              placeholder="Formal, Semi-formal, Etiqueta..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Detalles del código de vestimenta</label>
            <textarea
              name="dressCodeDetails"
              value={weddingInfo.dressCodeDetails ?? ''}
              onChange={handleWeddingChange}
              placeholder="Sugerimos tonos pastel y evitar el blanco..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Perfil de Invitados */}
      <Card className="border-l-4 border-l-indigo-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">👥</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Perfil de Invitados</h2>
            <p className="text-sm text-gray-600">Detalles sobre vuestros invitados</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de la boda</label>
              <select
                name="weddingSize"
                value={weddingInfo.weddingSize ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="muy-intima">Muy íntima (menos de 30)</option>
                <option value="intima">Íntima (30-80)</option>
                <option value="mediana">Mediana (80-150)</option>
                <option value="grande">Grande (150-250)</option>
                <option value="muy-grande">Muy grande (más de 250)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente deseado</label>
              <select
                name="weddingAtmosphere"
                value={weddingInfo.weddingAtmosphere ?? ''}
                onChange={handleWeddingChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecciona...</option>
                <option value="participativa">Muy participativa</option>
                <option value="mixta">Mixta</option>
                <option value="formal">Formal y protocolaria</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="manyChildren"
                checked={weddingInfo.manyChildren ?? false}
                onChange={(e) => setWeddingInfo(prev => ({ ...prev, manyChildren: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700">¿Habrá muchos niños?</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="guestsFromOutside"
                checked={weddingInfo.guestsFromOutside ?? false}
                onChange={(e) => setWeddingInfo(prev => ({ ...prev, guestsFromOutside: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700">¿Invitados de fuera que necesiten alojamiento?</label>
            </div>
          </div>
        </div>
      </Card>

      {/* Logística para invitados */}
      <Card className="border-l-4 border-l-orange-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚌</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Logística para Invitados</h2>
            <p className="text-sm text-gray-600">Transporte, alojamiento y facilidades</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Información de autobuses</label>
            <textarea
              name="busInfo"
              value={weddingInfo.busInfo ?? ''}
              onChange={handleWeddingChange}
              placeholder="Ida: 16:00 desde Plaza Mayor&#10;Vuelta: 02:00 desde el lugar..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hoteles recomendados</label>
            <textarea
              name="hotelInfo"
              value={weddingInfo.hotelInfo ?? ''}
              onChange={handleWeddingChange}
              placeholder="Hotel Princesa: +34 91 xxx xxxx, 5km del lugar, desde 80€/noche..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <Input
              label="Transporte / alojamiento (resumen)"
              name="transportation"
              value={weddingInfo.transportation ?? ''}
              onChange={handleWeddingChange}
              placeholder="Autobuses desde centro + hoteles cercanos"
            />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">📋 Logística Avanzada</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="pets"
                  checked={weddingInfo.pets ?? false}
                  onChange={(e) => setWeddingInfo(prev => ({ ...prev, pets: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="text-sm font-medium text-gray-700">¿Permitís mascotas?</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restricciones de sonido u horarios</label>
                <textarea
                  name="soundRestrictions"
                  value={weddingInfo.soundRestrictions ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Ej: Música hasta las 02:00, límite de decibelios..."
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Historia y detalles personales */}
      <Card className="border-l-4 border-l-red-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💕</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vuestra Historia</h2>
            <p className="text-sm text-gray-600">Compartid vuestra historia con los invitados</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Historia de la pareja</label>
            <textarea
              name="story"
              value={weddingInfo.story ?? ''}
              onChange={handleWeddingChange}
              placeholder="Cuéntanos vuestra historia de amor..."
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje sobre regalos</label>
            <textarea
              name="giftMessage"
              value={weddingInfo.giftMessage ?? ''}
              onChange={handleWeddingChange}
              placeholder="Lo más importante para nosotros es vuestra asistencia..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <Input
              label="Cuenta de regalos"
              name="giftAccount"
              value={weddingInfo.giftAccount ?? ''}
              onChange={handleWeddingChange}
              placeholder="ES12 3456 7890 1234 5678 90"
            />
          </div>
        </div>
      </Card>

      {/* Información adicional */}
      <Card className="border-l-4 border-l-gray-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📋</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Información Adicional</h2>
            <p className="text-sm text-gray-600">FAQs y detalles extras</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preguntas frecuentes</label>
            <textarea
              name="faqs"
              value={weddingInfo.faqs ?? ''}
              onChange={handleWeddingChange}
              placeholder="¿Hay parking?&#10;Sí, hay parking gratuito...&#10;&#10;¿Puedo llevar niños?&#10;Por supuesto..."
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Información adicional</label>
            <textarea
              name="additionalInfo"
              value={weddingInfo.additionalInfo ?? ''}
              onChange={handleWeddingChange}
              placeholder="Cualquier información adicional importante..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Botón guardar flotante */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button 
          onClick={saveWeddingInfo}
          className="shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          💾 {t('app.save', { defaultValue: 'Guardar Cambios'})}
        </Button>
      </div>
      </>
      )}

      {/* Modal de chat IA */}
      <WeddingDesignChat
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setChatContext(null);
        }}
        context={chatContext}
        weddingInfo={weddingInfo}
        weddingDesign={weddingDesign}
        supplierRequirements={supplierRequirements}
        onUpdateDesign={setWeddingDesign}
        onUpdateRequirements={setSupplierRequirements}
      />
    </div>
  );
}

export default InfoBoda;
