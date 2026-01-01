import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import UploadImageCard from '../../components/UploadImageCard';
import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import { saveData, loadData } from '../../services/SyncService';

// Plantillas predefinidas para logos de boda
const logoTemplates = [
  {
    name: 'Monograma Elegante',
    description: 'Logo con las iniciales de los novios en estilo elegante y sofisticado',
    prompt:
      'Diseña un monograma elegante para una boda con iniciales entrelazadas. Estilo sofisticado y clásico con tipografía serif. Usa colores dorado y blanco sobre fondo oscuro. Incluye algún elemento decorativo sutil como hojas o flores. El logo debe ser limpio y versátil para usar en invitaciones y decoración.',
  },
  {
    name: 'Emblema Floral',
    description: 'Logo rodeado de elementos florales y orgánicos',
    prompt:
      'Crea un logo para boda con nombres o iniciales rodeados de elementos florales. Utiliza un estilo botánico con flores y hojas delicadas. Paleta de colores suaves como verde sage, rosa pálido y toques dorados. Diseño circular u ovalado que funcione bien como sello o emblema. Estilo romántico y natural.',
  },
  {
    name: 'Minimalista Moderno',
    description: 'Logo limpio y minimalista con líneas finas y estética contemporánea',
    prompt:
      'Diseña un logo minimalista y moderno para boda. Utiliza líneas finas, formas geométricas simples y tipografía sans-serif. Estilo limpio y contemporáneo sin adornos excesivos. Incorpora iniciales o nombres completos en un diseño equilibrado. Usa colores neutros como negro, gris o azul marino. El logo debe transmitir elegancia y simplicidad.',
  },
  {
    name: 'Vintage & Retro',
    description: 'Logo con estética vintage y elementos decorativos de época',
    prompt:
      'Crea un logo de boda con estética vintage o retro. Utiliza tipografías clásicas con serifs pronunciados o estilo script elegante. Incorpora elementos decorativos como marcos ornamentados, cintas o víñetas. Usa una paleta de colores envejecida como sepia, borgoña o azul marino. El diseño debe evocar nostalgia y elegancia atemporal, inspirado en los años 20-50.',
  },
  {
    name: 'Ilustrado & Artístico',
    description: 'Logo personalizado con ilustraciones hechas a mano y elementos creativos',
    prompt:
      'Diseña un logo de boda ilustrado con elementos personalizados. Estilo artístico que parece hecho a mano, con trazos de acuarela, tinta o dibujo. Incluye pequenos elementos simbólicos relacionados con la pareja (hobbies, lugares significativos, mascotas). Combina las ilustraciones con tipografía manuscrita o caligráfica. Colorido pero armonioso, con aspecto único y personal.',
  },
];

export default function Logo() {
  const { activeWedding } = useWedding();
  const [hex, setHex] = useState('#FF69B4');

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadData('logoColor', {
          defaultValue: '#FF69B4',
          collection: 'userLogo',
        });
        if (typeof stored === 'string') setHex(stored);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleColor = (e) => {
    setHex(e.target.value);
    saveData('logoColor', e.target.value, {
      collection: 'userLogo',
      showNotification: false,
    });
  };

  return (
    <div className="space-y-6">
      <UploadImageCard title={t('design.logo.uploadImage')} storageKey="logoImage" />

      <Card className="p-4 flex flex-col gap-4 items-start">
        <h2 className="text-lg font-semibold">{t('design.logo.mainColor')}</h2>
        <input
          type="color"
          value={hex}
          onChange={handleColor}
          className="w-16 h-10 p-0 border-0 cursor-pointer"
          aria-label={t('design.logo.selectColor')}
        />
        <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{t('design.logo.colorCode')}: {hex}</p>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('design.logo.designLogo')}</h2>
        <p className="" style={{ color: 'var(--color-text-secondary)' }}>
          {t('design.logo.createCustomLogo')}
        </p>
      </div>

      <ImageGeneratorAI
        category="logo"
        templates={logoTemplates}
        onImageGenerated={async (image) => {
          // console.log('Nuevo logo generado:', image);
          // Actualizamos el logo en el contexto de usuario si se desea
          try {
            if (!activeWedding) return;
            // Guardar logo en el campo anidado weddingInfo.logoUrl del doc principal
            await updateDoc(doc(db, 'weddings', activeWedding), { 'weddingInfo.logoUrl': image.url });
            // Notificar a la aplicación que el logo ha cambiado
            window.dispatchEvent(new Event('maloveapp-profile-updated'));
          } catch (err) {
            // console.error('Error al guardar el logo en el perfil:', err);
          }
        }}
      />
    </div>
  );
}

