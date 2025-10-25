import { useTranslations } from '../../hooks/useTranslations';
﻿import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import UploadImageCard from '../../components/UploadImageCard';
import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import { saveData, loadData } from '../../services/SyncService';

// Plantillas predefinidas para logos de boda
const logoTemplates = [
  {
  const { t } = useTranslations();

    name: 'Monograma Elegante',
    description: 'Logo con las iniciales de los novios en estilo elegante y sofisticado',
    prompt:
      {t('common.disena_monograma_elegante_para_una')},
  },
  {
    name: 'Emblema Floral',
    description: t('common.logo_rodeado_elementos_florales_organicos'),
    prompt:
      {t('common.crea_logo_para_boda_con')},
  },
  {
    name: 'Minimalista Moderno',
    description: t('common.logo_limpio_minimalista_con_lineas'),
    prompt:
      {t('common.disena_logo_minimalista_moderno_para')},
  },
  {
    name: 'Vintage & Retro',
    description: t('common.logo_con_estetica_vintage_elementos'),
    prompt:
      {t('common.crea_logo_boda_con_estetica')},
  },
  {
    name: t('common.ilustrado_artistico'),
    description: 'Logo personalizado con ilustraciones hechas a mano y elementos creativos',
    prompt:
      {t('common.disena_logo_boda_ilustrado_con')},
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
      <UploadImageCard title="Subir Logo" storageKey="logoImage" />

      <Card className="p-4 flex flex-col gap-4 items-start">
        <h2 className="text-lg font-semibold">Color principal</h2>
        <input
          type="color"
          value={hex}
          onChange={handleColor}
          className="w-16 h-10 p-0 border-0 cursor-pointer"
          aria-label="Seleccionar color del logo"
        />
        <p className="text-sm text-gray-600">Código: {hex}</p>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Diseña el logo para tu boda</h2>
        <p className="text-gray-600">
          Crea un logo personalizado que represente vuestra boda. Podrás usarlo en invitaciones,
          regalos, decoración y más.
        </p>
      </div>

      <ImageGeneratorAI
        category="logo"
        templates={logoTemplates}
        onImageGenerated={async (image) => {
          console.log('Nuevo logo generado:', image);
          // Actualizamos el logo en el contexto de usuario si se desea
          try {
            if (!activeWedding) return;
            // Guardar logo en el campo anidado weddingInfo.logoUrl del doc principal
            await updateDoc(doc(db, 'weddings', activeWedding), { 'weddingInfo.logoUrl': image.url });
            // Notificar a la aplicación que el logo ha cambiado
            window.dispatchEvent(new Event('maloveapp-profile-updated'));
          } catch (err) {
            console.error('Error al guardar el logo en el perfil:', err);
          }
        }}
      />
    </div>
  );
}

