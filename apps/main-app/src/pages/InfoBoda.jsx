import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { Card, Button, Input } from '../components/ui';
import ImageUploader from '../components/ImageUploader';
import { useWedding } from '../context/WeddingContext';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

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
    // CAMPOS NUEVOS
    story: '',
    menu: '',
    dressCode: '',
    dressCodeDetails: '',
    giftMessage: '',
    busInfo: '',
    hotelInfo: '',
    additionalInfo: '',
    faqs: '',
  });
  const [importantInfo, setImportantInfo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [webSlug, setWebSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

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
              // NUEVOS CAMPOS
              story: wi.story || '',
              menu: wi.menu || '',
              dressCode: wi.dressCode || '',
              dressCodeDetails: wi.dressCodeDetails || '',
              giftMessage: wi.giftMessage || '',
              busInfo: wi.busInfo || '',
              hotelInfo: wi.hotelInfo || '',
              additionalInfo: wi.additionalInfo || '',
              faqs: wi.faqs || '',
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
    <div className="p-4 max-w-3xl mx-auto space-y-6">
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

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">
          {t('profile.wedding.title', { defaultValue: 'Información de la boda' })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weddingFields.map((field) => (
            <Input
              key={field.name}
              label={t(field.labelKey, { defaultValue: field.defaultValue })}
              name={field.name}
              type={field.type}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey, { defaultValue: field.placeholderDefault })
                  : field.placeholder
              }
              value={weddingInfo[field.name] ?? ''}
              readOnly={field.readOnly}
              onChange={field.readOnly ? undefined : handleWeddingChange}
            />
          ))}
        </div>
        <div className="text-right">
          <Button onClick={saveWeddingInfo}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

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
              // Auto-guardar
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

          {/* Mostrar imágenes existentes */}
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

          {/* Subir nueva imagen a galería */}
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

      <Card className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          🌐 {t('profile.wedding.webUrl', { defaultValue: 'URL Pública de tu Web' })}
        </h2>
        <p className="text-sm text-gray-600">
          Esta será la dirección web que compartirás con tus invitados
        </p>

        <div className="space-y-3">
          {/* Campo de slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug de la web</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-500 text-sm">{window.location.origin}/web/</span>
                <input
                  type="text"
                  value={webSlug}
                  onChange={(e) => setWebSlug(e.target.value)}
                  placeholder="maria-y-juan-2025"
                  className="flex-1 bg-transparent border-none focus:outline-none text-gray-900"
                />
              </div>
              <Button onClick={generateSlug} className="whitespace-nowrap">
                Generar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 El slug se genera automáticamente del nombre de la pareja. Usa solo letras
              minúsculas, números y guiones.
            </p>
          </div>

          {/* URL completa */}
          {webSlug && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Tu URL pública:</p>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-blue-300">
                <code className="flex-1 text-sm text-blue-700">
                  {window.location.origin}/web/{webSlug}
                </code>
                <button
                  onClick={copyPublicUrl}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm font-medium border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ Recuerda guardar después de cambiar el slug. La web debe estar publicada desde el
                editor para que sea accesible.
              </p>
            </div>
          )}
        </div>

        <div className="text-right">
          <Button onClick={saveWeddingInfo}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">
          {t('profile.wedding.important', { defaultValue: 'Información importante de la boda' })}
        </h2>
        <textarea
          className="w-full min-h-[150px] border rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('profile.wedding.notesPlaceholder', {
            defaultValue:
              'Datos o detalles clave (alergias, proveedores críticos, horarios especiales, etc.)',
          })}
          value={importantInfo}
          onChange={(e) => setImportantInfo(e.target.value)}
        />
        <div className="text-right">
          <Button onClick={saveWeddingInfo}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>
    </div>
  );
}

export default InfoBoda;
