import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import { useWedding } from '../../context/WeddingContext';
import { db, firebaseReady } from '../../firebaseConfig';

const fsImport = () => import('firebase/firestore');

function formatDateLong(d) {
  try {
    const dt = new Date(d);
    if (!dt || isNaN(dt.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dt);
  } catch {
    return '';
  }
}

export default function Invitaciones() {
  const { activeWedding } = useWedding();
  const [profile, setProfile] = useState({
    coupleName: '',
    celebrationPlace: '',
    schedule: '',
    weddingDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!activeWedding) return;
      setLoading(true);
      try {
        await firebaseReady;
        const { doc, getDoc } = await fsImport();
        const ref = doc(db, 'weddings', activeWedding);
        const snap = await getDoc(ref);
        if (!ignore && snap.exists()) {
          const wi = snap.data()?.weddingInfo || {};
          setProfile({
            coupleName: wi.coupleName || wi.brideAndGroom || '',
            celebrationPlace: wi.celebrationPlace || wi.ceremonyLocation || wi.location || '',
            schedule: wi.schedule || wi.ceremonyTime || '',
            weddingDate: wi.weddingDate || wi.date || '',
          });
        }
      } catch {
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [activeWedding]);

  const autoPrompt = useMemo(() => {
    const names = (profile.coupleName || '').trim();
    const date = formatDateLong(profile.weddingDate);
    const time = (profile.schedule || '').trim();
    const place = (profile.celebrationPlace || '').trim();
    const parts = [
      'Diseña una invitación de boda lista para imprimir, elegante y minimalista.',
      names ? `Nombres: ${names}.` : '',
      [date, time].filter(Boolean).length
        ? `Fecha y hora: ${[date, time].filter(Boolean).join(' a las ')}.`
        : '',
      place ? `Lugar: ${place}.` : '',
      'Usa tipografías serif/sans de estilo clásico/contemporáneo.',
      'Sin sombras, sin efectos de luz, sin brillos, sin texturas de fondo.',
      'Fondo limpio blanco, alto contraste en negro o gris muy oscuro.',
      'Composición equilibrada, clara y legible, con jerarquía tipográfica.',
      'Incluye los textos indicados en el diseño (no placeholders).',
    ].filter(Boolean);
    return parts.join(' ');
  }, [profile]);

  const invitationTemplates = [
    {
      name: 'Elegante & Minimalista',
      description: 'Estilo sobrio y limpio',
      prompt: `${autoPrompt}`,
    },
    {
      name: 'Clásico',
      description: 'Serif, adornos muy sutiles',
      prompt: `${autoPrompt} Estilo clásico, serif sobria, marcos finos.`,
    },
    {
      name: 'Geométrico',
      description: 'Líneas y formas simples',
      prompt: `${autoPrompt} Estilo geométrico con líneas finas y simetría.`,
    },
    {
      name: 'Floral line-art',
      description: 'Trazos florales muy sutiles',
      prompt: `${autoPrompt} Añade un motivo floral en line-art muy sutil.`,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Diseña tus invitaciones</h2>
        <p className="text-gray-600">
          Genera una invitación completa con IA a partir de tus datos de Perfil. Lista para imprimir
          y exportable a PDF.
        </p>
      </div>

      <ImageGeneratorAI
        category="invitaciones"
        templates={invitationTemplates}
        defaultPrompt={autoPrompt}
        autoGenerate={true}
        onImageGenerated={() => {}}
      />

      {loading && <div className="text-sm text-gray-500 mt-3">Cargando datos de perfil…</div>}
    </div>
  );
}
