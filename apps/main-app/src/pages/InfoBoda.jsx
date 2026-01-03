import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { Card, Button, Input } from '../components/ui';
import ImageUploader from '../components/ImageUploader';
import { useAuth } from '../hooks/useAuth.jsx';
import { useWedding } from '../context/WeddingContext';
import useGuests from '../hooks/useGuests';
import useWeddingData from '../hooks/useWeddingData';
import WeddingVisionSection from '../components/wedding/WeddingVisionSection';
import SupplierRequirementsSection from '../components/wedding/SupplierRequirementsSection';
import WeddingDesignChat from '../components/wedding/WeddingDesignChat';
import { initializeWeddingDesign } from '../utils/weddingDesignTemplate';
import { initializeSupplierRequirements } from '../utils/supplierRequirementsTemplate';
import {
  validateIBAN,
  formatIBAN,
  getIBANCountry,
  getIBANErrorMessage,
} from '../utils/ibanValidator';

function InfoBoda() {
  const { t } = useTranslation();
  const [weddingInfo, setWeddingInfo] = useState({
    coupleName: '',
    celebrationPlace: '',
    celebrationAddress: '',
    celebrationCity: '',
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
    howWeMet: '',
    weddingConcept: '',
    mostImportant: '',
    mustHave: '',
    mustNotHave: '',
    remember10Years: '',
    // COORDENADAS GPS
    ceremonyGPS: '',
    banquetGPS: '',
    // REDES SOCIALES
    weddingHashtag: '',
    instagramHandle: '',
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
    hasPlanB: false,
    needsTent: false,
    rainPlanB: '',
    spaceType: '',
    // TIMING
    ceremonyTime: '',
    cocktailTime: '',
    banquetTime: '',
    partyStartTime: '',
    endTime: '',
    // EXPERIENCIA Y FIESTA
    partyType: '',
    longOpenBar: false,
    afterParty: false,
    surprises: '',
    specialMoment: '',
    // LOGÍSTICA AVANZADA
    pets: false,
    soundRestrictions: '',
    // CONTACTOS DE EMERGENCIA
    coordinatorName: '',
    coordinatorPhone: '',
    venueManagerName: '',
    venueManagerPhone: '',
    photographerContact: '',
    musicContact: '',
    cateringContact: '',
    // EVENTOS RELACIONADOS
    rehearsalDinnerDate: '',
    rehearsalDinnerTime: '',
    rehearsalDinnerPlace: '',
    rehearsalDinnerAddress: '',
    postWeddingBrunchDate: '',
    postWeddingBrunchTime: '',
    postWeddingBrunchPlace: '',
    postWeddingBrunchAddress: '',
    bachelorettePartyDate: '',
    bachelorPartyDate: '',
    welcomePartyDate: '',
    welcomePartyTime: '',
    welcomePartyPlace: '',
  });
  const [importantInfo, setImportantInfo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [webSlug, setWebSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [weddingDesign, setWeddingDesign] = useState(initializeWeddingDesign());
  const [supplierRequirements, setSupplierRequirements] = useState(
    initializeSupplierRequirements()
  );
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [ibanError, setIbanError] = useState('');
  const [ibanCountry, setIbanCountry] = useState('');

  const { userProfile, user: authUser } = useAuth();
  const { activeWedding } = useWedding();
  const weddingId = activeWedding || userProfile?.weddingId || '';

  const handleWeddingChange = (e) => {
    const { name, value } = e.target;
    setWeddingInfo((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);

    // Validar IBAN en tiempo real
    if (name === 'giftAccount') {
      handleIBANChange(value);
    }
  };

  const handleIBANChange = (value) => {
    if (!value || value.trim() === '') {
      setIbanError('');
      setIbanCountry('');
      return;
    }

    const error = getIBANErrorMessage(value);
    setIbanError(error);

    if (!error && value.length >= 2) {
      setIbanCountry(getIBANCountry(value));
    } else {
      setIbanCountry('');
    }
  };

  // Generar slug desde el nombre de la pareja
  const generateSlug = () => {
    const coupleName = weddingInfo.coupleName || '';
    if (!coupleName) {
      toast.error(t('weddingInfo.toasts.enterCoupleName'));
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
    toast.success(t('weddingInfo.toasts.slugGenerated'));
  };

  // Copiar URL pública al portapapeles
  const copyPublicUrl = () => {
    const url = `${window.location.origin}/web/${webSlug}`;
    navigator.clipboard.writeText(url);
    toast.success(t('weddingInfo.toasts.urlCopied'));
  };

  // Generar QR Code
  const generateQRCode = () => {
    if (!webSlug) {
      toast.error(t('weddingInfo.toasts.generateSlugFirst'));
      return;
    }
    const url = `${window.location.origin}/web/${webSlug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, '_blank');
    toast.success(t('weddingInfo.toasts.qrGenerated'));
  };

  // Preview de la web
  const previewWeb = () => {
    if (!webSlug) {
      toast.error(t('weddingInfo.toasts.generateSlugFirst'));
      return;
    }
    window.open(`/web/${webSlug}`, '_blank');
  };

  const handleChatOpen = (context) => {
    setChatContext(context);
    setShowChatModal(true);
  };

  const weddingFields = [
    {
      name: 'coupleName',
      labelKey: 'profile.wedding.coupleName',
    },
    {
      name: 'celebrationPlace',
      labelKey: 'profile.wedding.celebrationPlace',
    },
    {
      name: 'celebrationAddress',
      labelKey: 'profile.wedding.celebrationAddress',
    },
    {
      name: 'banquetPlace',
      labelKey: 'profile.wedding.banquetPlace',
    },
    {
      name: 'receptionAddress',
      labelKey: 'profile.wedding.receptionAddress',
    },
    {
      name: 'schedule',
      labelKey: 'profile.wedding.schedule',
    },
    {
      name: 'weddingDate',
      labelKey: 'profile.wedding.date',
      type: 'date',
    },
    {
      name: 'rsvpDeadline',
      labelKey: 'profile.wedding.rsvp',
      type: 'date',
    },
    {
      name: 'giftAccount',
      labelKey: 'profile.wedding.giftAccount',
    },
    {
      name: 'transportation',
      labelKey: 'profile.wedding.transportation',
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

  const saveWeddingInfo = async (showToast = true) => {
    if (!weddingId) {
      if (showToast) {
        toast.error(t('weddingInfo.toasts.loginRequired'));
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}/wedding-info/${weddingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          weddingInfo,
          webImages: {
            heroImage,
            gallery: galleryImages,
          },
          webSlug,
          isPublished,
          weddingDesign,
          supplierRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      setLastSavedAt(new Date());
      if (showToast) {
        toast.success(t('weddingInfo.toasts.saved'));
      }
    } catch (error) {
      console.error('Error guardando:', error);
      if (showToast) {
        toast.error(t('weddingInfo.toasts.errorSaving'));
      }
    }
  };

  // Detectar cambios en supplierRequirements y weddingDesign
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [supplierRequirements, weddingDesign]);

  // Auto-guardado con debounce de 3 segundos (se guarda 3s después del último cambio)
  useEffect(() => {
    if (!hasUnsavedChanges || !weddingId) return;

    const timer = setTimeout(() => {
      saveWeddingInfo(false); // Sin toast para no molestar
      setHasUnsavedChanges(false);
    }, 3000); // 3 segundos de debounce

    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, weddingInfo, supplierRequirements, weddingDesign]);

  useEffect(() => {
    const loadWeddingInfo = async () => {
      if (!weddingId) return;
      try {
        const response = await fetch(`${API_URL}/wedding-info/${weddingId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar información');
        }
        
        const wedding = await response.json();
        if (wedding && wedding.weddingInfo) {
          const wi = wedding.weddingInfo;
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
              // COORDENADAS GPS
              ceremonyGPS: wi.ceremonyGPS || '',
              banquetGPS: wi.banquetGPS || '',
              // REDES SOCIALES
              howWeMet: wi.howWeMet || '',
              weddingHashtag: wi.weddingHashtag || '',
              instagramHandle: wi.instagramHandle || '',
            });
            if (wi.importantInfo) setImportantInfo(wi.importantInfo);

            // Cargar imágenes
            const webImages = wedding.webImages || {};
            setHeroImage(webImages.heroImage || '');
            setGalleryImages(webImages.gallery || []);

            // Cargar slug
            setWebSlug(wedding.webSlug || '');

            // Cargar weddingDesign y supplierRequirements
            if (wedding.weddingDesign) {
              setWeddingDesign(wedding.weddingDesign);
            }
            if (wedding.supplierRequirements) {
              setSupplierRequirements(wedding.supplierRequirements);
            }
          }
        }
      } catch (e) {
        console.error('[InfoBoda] Error cargando:', e);
        toast.error(
          t('profile.errors.loadingProfile', { defaultValue: 'Error al cargar información' })
        );
      }
    };
    loadWeddingInfo();
  }, [weddingId]);

  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        <div className="mx-auto my-8" style={{
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div className="p-6 space-y-6">
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">
              {t('navigation.weddingInfo', { defaultValue: 'Información de la Boda' })}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {lastSavedAt && (
                <div className="text-sm text-muted">
                  {t('profile.lastSaved', { defaultValue: 'Último guardado:' })}{' '}
                  {new Date(lastSavedAt).toLocaleString()}
                </div>
              )}
              {hasUnsavedChanges && (
                <span 
                  className="text-xs px-2 py-1 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'var(--color-info-10)',
                    color: 'var(--color-info)',
                  }}
                >
                  {t('weddingInfo.labels.saving')}
                </span>
              )}
              {!hasUnsavedChanges && lastSavedAt && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-success-10)',
                    color: 'var(--color-success)',
                  }}
                >
                  {t('weddingInfo.labels.autoSaved')}
                </span>
              )}
            </div>
          </div>
          {webSlug && (
            <div className="flex gap-2">
              <Button 
                onClick={previewWeb} 
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
              >
                {t('weddingInfo.labels.previewWeb')}
              </Button>
              <Button
                onClick={generateQRCode}
                style={{
                  backgroundColor: 'var(--color-lavender)',
                  color: 'var(--color-text)',
                }}
              >
                {t('weddingInfo.labels.generateQR')}
              </Button>
              <Button
                onClick={copyPublicUrl}
                style={{
                  backgroundColor: 'var(--color-success)',
                  color: 'var(--color-on-primary)',
                }}
              >
                {t('weddingInfo.labels.copyUrl')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b-2">
        <button
          onClick={() => setActiveTab('info')}
          className="px-4 py-2 font-medium whitespace-nowrap transition-all"
          style={{
            backgroundColor: activeTab === 'info' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'info' ? 'var(--color-on-primary)' : 'var(--color-text)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: `1px solid ${activeTab === 'info' ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
            borderBottom: 'none',
            boxShadow: activeTab === 'info' ? '0 2px 8px rgba(94, 187, 255, 0.15)' : 'none',
          }}
        >
          📝 Información Básica
        </button>
        <button
          onClick={() => setActiveTab('vision')}
          className="px-4 py-2 font-medium whitespace-nowrap transition-all"
          style={{
            backgroundColor: activeTab === 'vision' ? 'var(--color-lavender)' : 'var(--color-surface)',
            color: activeTab === 'vision' ? 'var(--color-text)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: `1px solid ${activeTab === 'vision' ? 'var(--color-lavender)' : 'var(--color-border-soft)'}`,
            borderBottom: 'none',
            boxShadow: activeTab === 'vision' ? '0 2px 8px rgba(230, 217, 255, 0.4)' : 'none',
          }}
        >
          🎭 Visión y Estilo
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className="px-4 py-2 font-medium whitespace-nowrap transition-all"
          style={{
            backgroundColor: activeTab === 'suppliers' ? 'var(--color-sage)' : 'var(--color-surface)',
            color: activeTab === 'suppliers' ? 'var(--color-text)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: `1px solid ${activeTab === 'suppliers' ? 'var(--color-sage)' : 'var(--color-border-soft)'}`,
            borderBottom: 'none',
            boxShadow: activeTab === 'suppliers' ? '0 2px 8px rgba(205, 234, 192, 0.4)' : 'none',
          }}
        >
          👥 Especificaciones Proveedores
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className="px-4 py-2 font-medium whitespace-nowrap transition-all"
          style={{
            backgroundColor: activeTab === 'images' ? 'var(--color-pink)' : 'var(--color-surface)',
            color: activeTab === 'images' ? 'var(--color-text)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: `1px solid ${activeTab === 'images' ? 'var(--color-pink)' : 'var(--color-border-soft)'}`,
            borderBottom: 'none',
            boxShadow: activeTab === 'images' ? '0 2px 8px rgba(252, 228, 236, 0.4)' : 'none',
          }}
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
        </>
      )}

      {activeTab === 'suppliers' && (
        <>
          <SupplierRequirementsSection
            requirements={supplierRequirements}
            onChange={setSupplierRequirements}
            onChatOpen={handleChatOpen}
          />
        </>
      )}

      {activeTab === 'images' && (
        <Card className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            📸 {t('profile.wedding.images', { defaultValue: 'Imágenes de la Web' })}
          </h2>
          <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
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
                  toast.success(t('weddingInfo.toasts.heroImageUpdated'));
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
            <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
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
                      className="w-full h-32 object-cover rounded-lg border-2 " style={{ borderColor: 'var(--color-border)' }}
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
                          toast.success(t('weddingInfo.toasts.imageDeleted'));
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
                  toast.success(t('weddingInfo.toasts.photoAdded'));
                } catch (error) {
                  console.error('Error:', error);
                }
              }}
              label={galleryImages.length === 0 ? 'Añadir primera foto' : 'Añadir otra foto'}
              maxSizeMB={5}
            />
            <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
              {galleryImages.length} foto{galleryImages.length !== 1 ? 's' : ''} en la galería •
              Estas fotos se mostrarán en la sección de Galería
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
                  <h3 className="text-lg font-bold " style={{ color: 'var(--color-text)' }}>Progreso de Información</h3>
                  <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>Completa todos los datos de tu boda</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold " style={{ color: 'var(--color-primary)' }}>
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
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>secciones</div>
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
                    })()}%`,
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
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>{t('infoBoda.vision.title')}</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{t('infoBoda.vision.subtitle')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('infoBoda.vision.howWeMet')}
                </label>
                <textarea
                  name="howWeMet"
                  value={weddingInfo.howWeMet ?? ''}
                  onChange={handleWeddingChange}
                  placeholder={t('infoBoda.vision.howWeMetPlaceholder')}
                  className="w-full min-h-[80px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('infoBoda.vision.mostImportant')}
                </label>
                <textarea
                  name="mostImportant"
                  value={weddingInfo.mostImportant ?? ''}
                  onChange={handleWeddingChange}
                  placeholder={t('infoBoda.vision.mostImportantPlaceholder')}
                  className="w-full min-h-[80px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                    ✅ {t('infoBoda.vision.mustHave')}
                  </label>
                  <textarea
                    name="mustHave"
                    value={weddingInfo.mustHave ?? ''}
                    onChange={handleWeddingChange}
                    placeholder={t('infoBoda.vision.mustHavePlaceholder')}
                    className="w-full min-h-[100px] px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                    ❌ {t('infoBoda.vision.mustNotHave')}
                  </label>
                  <textarea
                    name="mustNotHave"
                    value={weddingInfo.mustNotHave ?? ''}
                    onChange={handleWeddingChange}
                    placeholder={t('infoBoda.vision.mustNotHavePlaceholder')}
                    className="w-full min-h-[100px] px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  💫 {t('infoBoda.vision.remember10Years')}
                </label>
                <textarea
                  name="remember10Years"
                  value={weddingInfo.remember10Years ?? ''}
                  onChange={handleWeddingChange}
                  placeholder={t('infoBoda.vision.remember10YearsPlaceholder')}
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
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>{t('infoBoda.essential.title')}</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{t('infoBoda.essential.subtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label={`👫 ${t('infoBoda.essential.coupleName')}`}
                  name="coupleName"
                  value={weddingInfo.coupleName ?? ''}
                  onChange={handleWeddingChange}
                  placeholder={t('infoBoda.essential.coupleNamePlaceholder')}
                />
                <p className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>{t('infoBoda.essential.coupleNameHint')}</p>
              </div>
              <Input
                label={t('infoBoda.essential.weddingDate')}
                name="weddingDate"
                type="date"
                value={weddingInfo.weddingDate ?? ''}
                onChange={handleWeddingChange}
              />
              <Input
                label={t('infoBoda.essential.numGuests')}
                name="numGuests"
                type="number"
                value={weddingInfo.numGuests ?? ''}
                readOnly
              />
              <Input
                label={t('infoBoda.essential.rsvpDeadline')}
                name="rsvpDeadline"
                type="date"
                value={weddingInfo.rsvpDeadline ?? ''}
                onChange={handleWeddingChange}
              />
            </div>
          </Card>

          {/* Ceremonia y Celebración */}
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⛪</span>
              <div>
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>Ceremonia y Celebración</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>Dónde y cómo será vuestra boda</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Tipo de Ceremonia */}
              <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-lavender)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                <h3 
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span>📋</span> {t('infoBoda.ceremony.ceremonyType')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      <span className="" style={{ color: 'var(--color-danger)' }}>*</span>
                      Tipo de ceremonia
                    </label>
                    <select
                      name="ceremonyType"
                      value={weddingInfo.ceremonyType ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent " style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">Selecciona...</option>
                      <option value="civil">Civil</option>
                      <option value="religiosa">Religiosa</option>
                      <option value="simbolica">Simbólica</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      Estilo de ceremonia
                    </label>
                    <select
                      name="ceremonyStyle"
                      value={weddingInfo.ceremonyStyle ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent " style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">Selecciona...</option>
                      <option value="tradicional">Tradicional</option>
                      <option value="moderno">Moderno</option>
                      <option value="personalizado">Muy personalizado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      Momento del día
                    </label>
                    <select
                      name="timeOfDay"
                      value={weddingInfo.timeOfDay ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent " style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">Selecciona...</option>
                      <option value="dia">De día ☀️</option>
                      <option value="tarde">Tarde 🌅</option>
                      <option value="noche">Noche 🌙</option>
                    </select>
                  </div>
                </div>
                
                {/* Ayuda contextual según tipo */}
                {weddingInfo.ceremonyType === 'religiosa' && (
                  <div 
                    className="mt-3 p-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-info-10)',
                      color: 'var(--color-text)',
                    }}
                  >
                    💡 <strong>Consejo:</strong> Tramita los papeles en la parroquia con 6 meses de antelación. Algunos ritos requieren cursillos prematrimoniales.
                  </div>
                )}
                {weddingInfo.ceremonyType === 'civil' && (
                  <div 
                    className="mt-3 p-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-info-10)',
                      color: 'var(--color-text)',
                    }}
                  >
                    💡 <strong>Consejo:</strong> Reserva el lugar (juzgado, ayuntamiento o finca) con 3-4 meses de antelación.
                  </div>
                )}
                {weddingInfo.ceremonyType === 'simbolica' && (
                  <div 
                    className="mt-3 p-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-info-10)',
                      color: 'var(--color-text)',
                    }}
                  >
                    💡 <strong>Consejo:</strong> Las ceremonias simbólicas permiten total personalización. Considera contratar un oficiante profesional.
                  </div>
                )}
              </div>

              {/* Checkbox PRIMERO - Mismo lugar o no */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="samePlaceCeremonyReception"
                    checked={weddingInfo.samePlaceCeremonyReception ?? false}
                    onChange={(e) =>
                      setWeddingInfo((prev) => ({
                        ...prev,
                        samePlaceCeremonyReception: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-purple-600  rounded focus:ring-purple-500 mt-0.5" style={{ borderColor: 'var(--color-border)' }}
                  />
                  <div>
                    <p className="font-semibold " style={{ color: 'var(--color-text)' }}>¿Ceremonia y celebración en el mismo lugar?</p>
                    <p className="text-sm  mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {weddingInfo.samePlaceCeremonyReception 
                        ? '✅ Todo en un mismo sitio - más cómodo para los invitados'
                        : '📍 En lugares diferentes - deberás especificar ambas ubicaciones'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Ubicaciones - Condicional según checkbox */}
              {weddingInfo.samePlaceCeremonyReception ? (
                // MISMO LUGAR - Un solo bloque
                <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-yellow)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                  <h3 className="text-sm font-semibold  mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <span>📍</span> Lugar de la Boda (Ceremonia y Celebración)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre del lugar"
                      name="celebrationPlace"
                      value={weddingInfo.celebrationPlace ?? ''}
                      onChange={handleWeddingChange}
                      placeholder="Ej: Finca El Campillo, Hotel Gran Vía"
                    />
                    <Input
                      label="Dirección completa"
                      name="celebrationAddress"
                      value={weddingInfo.celebrationAddress ?? ''}
                      onChange={handleWeddingChange}
                      placeholder="Calle Mayor, 1, Valencia"
                    />
                    <div className="mt-2">
                      <Input
                        label="Ciudad/Región"
                        name="celebrationCity"
                        value={weddingInfo.celebrationCity ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Valencia"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      📍 Coordenadas GPS o enlace Maps (opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="ceremonyGPS"
                        value={weddingInfo.ceremonyGPS ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="40.4168, -3.7038 o enlace Google Maps"
                        className="flex-1 px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                      {(weddingInfo.ceremonyGPS || weddingInfo.celebrationPlace) && (
                        <button
                          type="button"
                          onClick={() => {
                            const query = weddingInfo.ceremonyGPS || 
                                         `${weddingInfo.celebrationPlace}, ${weddingInfo.celebrationAddress}`;
                            window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank');
                          }}
                          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-on-primary)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <span>🗺️</span>
                          {t('infoBoda.venue.openMaps')}
                        </button>
                      )}
                    </div>
                    <p className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>
                      {t('infoBoda.venue.gpsHint')}
                    </p>
                  </div>
                </div>
              ) : (
                // LUGARES DIFERENTES - Dos bloques
                <div className="space-y-4">
                  {/* Lugar CEREMONIA */}
                  <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-lavender)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                    <h3 
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                      <span>⛪</span> Lugar de la Ceremonia
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre del lugar"
                        name="celebrationPlace"
                        value={weddingInfo.celebrationPlace ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Ej: Iglesia San Juan, Juzgado Valencia"
                      />
                      <Input
                        label="Dirección"
                        name="celebrationAddress"
                        value={weddingInfo.celebrationAddress ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Calle Mayor, 1, Valencia"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                        📍 Coordenadas GPS ceremonia (opcional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="ceremonyGPS"
                          value={weddingInfo.ceremonyGPS ?? ''}
                          onChange={handleWeddingChange}
                          placeholder="40.4168, -3.7038 o enlace Google Maps"
                          className="flex-1 px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                        />
                        {(weddingInfo.ceremonyGPS || weddingInfo.celebrationPlace) && (
                          <button
                            type="button"
                            onClick={() => {
                              const query = weddingInfo.ceremonyGPS || 
                                           `${weddingInfo.celebrationPlace}, ${weddingInfo.celebrationAddress}`;
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank');
                            }}
                            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-on-primary)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <span>🗺️</span>
                            Ver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lugar CELEBRACIÓN/BANQUETE */}
                  <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-sage)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                    <h3 
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                      <span>🍽️</span> Lugar de la Celebración / Banquete
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre del lugar"
                        name="banquetPlace"
                        value={weddingInfo.banquetPlace ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Ej: Finca El Campillo, Hotel Odeón"
                      />
                      <Input
                        label="Dirección"
                        name="receptionAddress"
                        value={weddingInfo.receptionAddress ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Carretera Valencia-Madrid km 15"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                        📍 Coordenadas GPS banquete (opcional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="banquetGPS"
                          value={weddingInfo.banquetGPS ?? ''}
                          onChange={handleWeddingChange}
                          placeholder="40.4168, -3.7038 o enlace Google Maps"
                          className="flex-1 px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                        />
                        {(weddingInfo.banquetGPS || weddingInfo.banquetPlace) && (
                          <button
                            type="button"
                            onClick={() => {
                              const query = weddingInfo.banquetGPS || 
                                           `${weddingInfo.banquetPlace}, ${weddingInfo.receptionAddress}`;
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank');
                            }}
                            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'var(--color-on-primary)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <span>🗺️</span>
                            Ver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Experiencia y Atmósfera */}
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🎉</span>
              <div>
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>{t('infoBoda.experience.title')}</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{t('infoBoda.experience.subtitle')}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Espacio y Ambiente */}
              <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-sage)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                <h3 
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span>🏞️</span> {t('infoBoda.spaces.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      {t('infoBoda.spaces.spaceType')}
                    </label>
                    <select
                      name="spaceType"
                      value={weddingInfo.spaceType ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent " style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">{t('common.select')}</option>
                      <option value="masia">{t('infoBoda.spaces.types.farmhouse')}</option>
                      <option value="finca">{t('infoBoda.spaces.types.estate')}</option>
                      <option value="hotel">{t('infoBoda.spaces.types.hotel')}</option>
                      <option value="playa">{t('infoBoda.spaces.types.beach')}</option>
                      <option value="jardin">{t('infoBoda.spaces.types.garden')}</option>
                      <option value="castillo">{t('infoBoda.spaces.types.castle')}</option>
                      <option value="bodega">{t('infoBoda.spaces.types.winery')}</option>
                      <option value="otro">{t('infoBoda.spaces.types.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      {t('infoBoda.spaces.indoorOutdoor')}
                    </label>
                    <select
                      name="indoorOutdoor"
                      value={weddingInfo.indoorOutdoor ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent " style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">{t('common.select')}</option>
                      <option value="interior">{t('infoBoda.spaces.indoor')}</option>
                      <option value="exterior">{t('infoBoda.spaces.outdoor')}</option>
                      <option value="mixto">{t('infoBoda.spaces.mixed')}</option>
                    </select>
                  </div>
                </div>
                
                {/* Plan B Lluvia */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="hasPlanB"
                      checked={weddingInfo.hasPlanB ?? false}
                      onChange={(e) =>
                        setWeddingInfo((prev) => ({ ...prev, hasPlanB: e.target.checked }))
                      }
                      className="w-4 h-4   rounded focus:ring-green-500" style={{ color: 'var(--color-success)', borderColor: 'var(--color-border)' }}
                    />
                    <label className="text-sm font-medium " style={{ color: 'var(--color-text)' }}>
                      ☔ ¿Hay plan B en caso de lluvia?
                    </label>
                  </div>
                  
                  {weddingInfo.hasPlanB && (
                    <>
                      <div className="flex items-center gap-2 ml-6">
                        <input
                          type="checkbox"
                          name="needsTent"
                          checked={weddingInfo.needsTent ?? false}
                          onChange={(e) =>
                            setWeddingInfo((prev) => ({ ...prev, needsTent: e.target.checked }))
                          }
                          className="w-4 h-4   rounded focus:ring-green-500" style={{ color: 'var(--color-success)', borderColor: 'var(--color-border)' }}
                        />
                        <label className="text-sm font-medium " style={{ color: 'var(--color-text)' }}>
                          ⛺ {t('infoBoda.spaces.tentNeeded')}
                        </label>
                      </div>
                      
                      <div className="ml-6">
                        <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                          {t('infoBoda.spaces.planBDetails')}
                        </label>
                        <textarea
                          name="rainPlanB"
                          value={weddingInfo.rainPlanB ?? ''}
                          onChange={handleWeddingChange}
                          placeholder={t('infoBoda.spaces.planBPlaceholder')}
                          className="w-full min-h-[60px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                        />
                      </div>
                    </>
                  )}
                </div>
                
              </div>
              
              {/* Timing */}
              <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-lavender)',
                  border: '1px solid var(--color-border-soft)',
                }}
              >
                <h3 
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span>⏰</span> Timing del Día
                </h3>
                <p className="text-xs  mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Especifica la hora exacta de cada momento de vuestra boda
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      ⛪ Hora de la ceremonia
                    </label>
                    <input
                      type="time"
                      name="ceremonyTime"
                      value={weddingInfo.ceremonyTime ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      🥂 Hora del cóctel
                    </label>
                    <input
                      type="time"
                      name="cocktailTime"
                      value={weddingInfo.cocktailTime ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      🍽️ {t('infoBoda.timing.banquetTime')}
                    </label>
                    <input
                      type="time"
                      name="banquetTime"
                      value={weddingInfo.banquetTime ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      🎉 Hora inicio fiesta
                    </label>
                    <input
                      type="time"
                      name="partyStartTime"
                      value={weddingInfo.partyStartTime ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2 flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                      🌙 Hora fin aproximada
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={weddingInfo.endTime ?? ''}
                      onChange={handleWeddingChange}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Contactos de Emergencia */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span>🚨</span> {t('infoBoda.emergency.title')}
                </h3>
                <p className="text-xs  mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('infoBoda.emergency.subtitle')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      👔 {t('infoBoda.emergency.coordinator')}
                    </label>
                    <input
                      type="text"
                      name="coordinatorName"
                      value={weddingInfo.coordinatorName ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.fullNamePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2" style={{ borderColor: 'var(--color-border)' }}
                    />
                    <input
                      type="tel"
                      name="coordinatorPhone"
                      value={weddingInfo.coordinatorPhone ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.phonePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      🏛️ {t('infoBoda.emergency.venueManager')}
                    </label>
                    <input
                      type="text"
                      name="venueManagerName"
                      value={weddingInfo.venueManagerName ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.fullNamePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2" style={{ borderColor: 'var(--color-border)' }}
                    />
                    <input
                      type="tel"
                      name="venueManagerPhone"
                      value={weddingInfo.venueManagerPhone ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.phonePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      📸 {t('infoBoda.emergency.photographer')}
                    </label>
                    <input
                      type="tel"
                      name="photographerContact"
                      value={weddingInfo.photographerContact ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.contactPhonePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      🎵 {t('infoBoda.emergency.music')}
                    </label>
                    <input
                      type="tel"
                      name="musicContact"
                      value={weddingInfo.musicContact ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.contactPhonePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      🍽️ Catering/Banquete
                    </label>
                    <input
                      type="tel"
                      name="cateringContact"
                      value={weddingInfo.cateringContact ?? ''}
                      onChange={handleWeddingChange}
                      placeholder={t('infoBoda.emergency.contactPhonePlaceholder')}
                      className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Eventos Relacionados */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <span>🎊</span> Eventos Relacionados
                </h3>
                <p className="text-xs  mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Otros eventos importantes alrededor de vuestra boda
                </p>
                
                {/* Cena de ensayo */}
                <div className="mb-4 pb-4 border-b border-purple-200">
                  <h4 className="text-sm font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>🍷 Cena de Ensayo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.date')}</label>
                      <input
                        type="date"
                        name="rehearsalDinnerDate"
                        value={weddingInfo.rehearsalDinnerDate ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.time')}</label>
                      <input
                        type="time"
                        name="rehearsalDinnerTime"
                        value={weddingInfo.rehearsalDinnerTime ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.venue')}</label>
                      <input
                        type="text"
                        name="rehearsalDinnerPlace"
                        value={weddingInfo.rehearsalDinnerPlace ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Ej: Restaurante La Pérgola"
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.address')}</label>
                      <input
                        type="text"
                        name="rehearsalDinnerAddress"
                        value={weddingInfo.rehearsalDinnerAddress ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Brunch post-boda */}
                <div className="mb-4 pb-4 border-b border-purple-200">
                  <h4 className="text-sm font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>☕ Brunch Post-boda</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.date')}</label>
                      <input
                        type="date"
                        name="postWeddingBrunchDate"
                        value={weddingInfo.postWeddingBrunchDate ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.time')}</label>
                      <input
                        type="time"
                        name="postWeddingBrunchTime"
                        value={weddingInfo.postWeddingBrunchTime ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.venue')}</label>
                      <input
                        type="text"
                        name="postWeddingBrunchPlace"
                        value={weddingInfo.postWeddingBrunchPlace ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Ej: Hotel Miramar"
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.address')}</label>
                      <input
                        type="text"
                        name="postWeddingBrunchAddress"
                        value={weddingInfo.postWeddingBrunchAddress ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Welcome Party */}
                <div className="mb-4 pb-4 border-b border-purple-200">
                  <h4 className="text-sm font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>🎉 Welcome Party</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.date')}</label>
                      <input
                        type="date"
                        name="welcomePartyDate"
                        value={weddingInfo.welcomePartyDate ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.time')}</label>
                      <input
                        type="time"
                        name="welcomePartyTime"
                        value={weddingInfo.welcomePartyTime ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>{t('common.venue')}</label>
                      <input
                        type="text"
                        name="welcomePartyPlace"
                        value={weddingInfo.welcomePartyPlace ?? ''}
                        onChange={handleWeddingChange}
                        placeholder="Ej: Bar El Jardín"
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Despedidas */}
                <div>
                  <h4 className="text-sm font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>🎊 Despedidas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>👰 Despedida de soltera</label>
                      <input
                        type="date"
                        name="bachelorettePartyDate"
                        value={weddingInfo.bachelorettePartyDate ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>🤵 Despedida de soltero</label>
                      <input
                        type="date"
                        name="bachelorPartyDate"
                        value={weddingInfo.bachelorPartyDate ?? ''}
                        onChange={handleWeddingChange}
                        className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Menú */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <span>🍽️</span> Menú del Evento
                </h3>
                <textarea
                  name="menu"
                  value={weddingInfo.menu ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Entrantes:&#10;- Ensalada...&#10;&#10;Principales:&#10;- Solomillo..."
                  className="w-full min-h-[100px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>
          </Card>

          {/* Estilo y Diseño */}
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎨</span>
              <div>
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>Estilo y Diseño</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>Detalles visuales de vuestra boda</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Estilo de la boda"
                name="weddingStyle"
                value={weddingInfo.weddingStyle ?? ''}
                onChange={handleWeddingChange}
                placeholder={t('infoBoda.experience.ambiancePlaceholder')}
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
                  placeholder={t('infoBoda.experience.activitiesPlaceholder')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  Detalles del código de vestimenta
                </label>
                <textarea
                  name="dressCodeDetails"
                  value={weddingInfo.dressCodeDetails ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Sugerimos tonos pastel y evitar el blanco..."
                  className="w-full min-h-[80px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>
          </Card>

          {/* Logística para invitados */}
          <Card className="border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚌</span>
              <div>
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>Logística para Invitados</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>Transporte, alojamiento y facilidades</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  Información de autobuses
                </label>
                <textarea
                  name="busInfo"
                  value={weddingInfo.busInfo ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Ida: 16:00 desde Plaza Mayor&#10;Vuelta: 02:00 desde el lugar..."
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
                <h3 className="text-md font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>📋 Logística Avanzada</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="pets"
                      checked={weddingInfo.pets ?? false}
                      onChange={(e) =>
                        setWeddingInfo((prev) => ({ ...prev, pets: e.target.checked }))
                      }
                      className="w-4 h-4 text-orange-600  rounded focus:ring-orange-500" style={{ borderColor: 'var(--color-border)' }}
                    />
                    <label className="text-sm font-medium " style={{ color: 'var(--color-text)' }}>¿Permitís mascotas?</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                      Restricciones de sonido u horarios
                    </label>
                    <textarea
                      name="soundRestrictions"
                      value={weddingInfo.soundRestrictions ?? ''}
                      onChange={handleWeddingChange}
                      placeholder="Ej: Música hasta las 02:00, límite de decibelios..."
                      className="w-full min-h-[60px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
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
                <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>Vuestra Historia</h2>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                  Compartid vuestra historia con los invitados
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                {t('infoBoda.experience.musicType')}
              </label>
                <textarea
                  name="giftMessage"
                  value={weddingInfo.giftMessage ?? ''}
                  onChange={handleWeddingChange}
                  placeholder="Lo más importante para nosotros es vuestra asistencia..."
                  className="w-full min-h-[80px] px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  💳 Cuenta de regalos (IBAN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="giftAccount"
                    value={weddingInfo.giftAccount ?? ''}
                    onChange={handleWeddingChange}
                    placeholder="ES12 3456 7890 1234 5678 90"
                    maxLength="34"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      ibanError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : weddingInfo.giftAccount && !ibanError
                          ? 'border-green-500 focus:ring-green-500 bg-green-50'
                          : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {weddingInfo.giftAccount && (
                    <div className="absolute right-3 top-2.5">
                      {ibanError ? (
                        <span className=" text-xl" style={{ color: 'var(--color-danger)' }}>❌</span>
                      ) : (
                        <span className="text-green-500 text-xl">✅</span>
                      )}
                    </div>
                  )}
                </div>
                {ibanError && (
                  <p className="mt-1 text-sm  flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                    <span>⚠️</span>
                    {ibanError}
                  </p>
                )}
                {!ibanError && ibanCountry && weddingInfo.giftAccount && (
                  <p className="mt-1 text-sm  flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                    <span>✓</span>
                    IBAN válido - {ibanCountry}
                  </p>
                )}
                <p className="mt-1 text-xs " style={{ color: 'var(--color-muted)' }}>
                  Este IBAN aparecerá en las invitaciones y en la web para que los invitados puedan
                  enviar regalos
                </p>
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>📱 Redes Sociales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="#️⃣ Hashtag de la boda"
                    name="weddingHashtag"
                    value={weddingInfo.weddingHashtag ?? ''}
                    onChange={handleWeddingChange}
                    placeholder="#MariaYJuan2026"
                  />
                  <Input
                    label="📸 Instagram (opcional)"
                    name="instagramHandle"
                    value={weddingInfo.instagramHandle ?? ''}
                    onChange={handleWeddingChange}
                    placeholder={t('infoBoda.experience.musicPlaceholder')}
                  />
                </div>
                <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
                  💡 Invita a tus invitados a compartir fotos con vuestro hashtag
                </p>
              </div>
            </div>
          </Card>

          {/* Indicador de auto-guardado */}
          {hasUnsavedChanges && (
            <div className="sticky bottom-4 z-10 flex justify-end">
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full shadow-lg text-sm flex items-center gap-2">
                <span className="animate-pulse">💾</span>
                Guardando automáticamente...
              </div>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </div>

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
    </>
  );
}

export default InfoBoda;
