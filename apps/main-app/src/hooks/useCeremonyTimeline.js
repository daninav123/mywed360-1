import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { ceremonyAPI } from '../services/apiService';

const DEFAULT_SECTIONS = [
  {
    id: 'preCeremony',
    title: 'Pre-ceremonia',
    description: 'Preparativos, traslados y llegada de participantes clave.',
    items: [
      {
        id: 'prep-arrival',
        title: 'Llegada de cortejo y testigos',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'sound-check',
        title: 'Prueba de sonido y música',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
    ],
  },
  {
    id: 'ceremony',
    title: 'Ceremonia',
    description: 'Desarrollo completo del protocolo de la ceremonia.',
    items: [
      {
        id: 'processional',
        title: 'Entrada procesional',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'vows',
        title: 'Lectura de votos',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'rings',
        title: 'Intercambio de anillos',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'signing',
        title: 'Firma de acta / certificados',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
    ],
  },
  {
    id: 'postCeremony',
    title: 'Post-ceremonia',
    description: 'Cierre y transición hacia cóctel o banquete.',
    items: [
      {
        id: 'recessional',
        title: 'Salida de los novios',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'photo-session',
        title: 'Sesión de fotos inmediata',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
      {
        id: 'confetti',
        title: 'Confeti / lanzamiento de pétalos',
        time: '',
        responsible: '',
        status: 'pending',
        notes: '',
      },
    ],
  },
];

export default function useCeremonyTimeline() {
  const { activeWedding } = useWedding();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTimeline() {
      try {
        if (!activeWedding) {
          setSections(DEFAULT_SECTIONS);
          setLoading(false);
          return;
        }
        setLoading(true);
        const ceremonyData = await ceremonyAPI.get(activeWedding);
        const timelineData = ceremonyData?.timeline;
        if (timelineData && Array.isArray(timelineData.sections) && timelineData.sections.length) {
          setSections(mergeSections(timelineData.sections));
        } else {
          setSections(DEFAULT_SECTIONS);
        }
        setLoading(false);
      } catch (err) {
        console.error('[useCeremonyTimeline] load error', err);
        setError(err);
        setLoading(false);
      }
    }
    loadTimeline();
  }, [activeWedding]);

  const saveSections = useCallback(
    async (nextSections) => {
      if (!activeWedding) {
        console.warn('[useCeremonyTimeline] saveSections without active wedding');
        return;
      }
      const sanitized = mergeSections(nextSections);
      setSections(sanitized);
      try {
        await ceremonyAPI.updateTimeline(activeWedding, { sections: sanitized });
      } catch (err) {
        console.error('[useCeremonyTimeline] saveSections error', err);
        setError(err);
      }
    },
    [activeWedding],
  );

  const value = useMemo(
    () => ({
      sections,
      loading,
      error,
      saveSections,
      defaults: DEFAULT_SECTIONS,
    }),
    [sections, loading, error, saveSections],
  );

  return value;
}

function mergeSections(candidate) {
  const templateMap = new Map(DEFAULT_SECTIONS.map((s) => [s.id, s]));
  return (Array.isArray(candidate) ? candidate : []).map((section) => {
    const template = templateMap.get(section.id) || {};
    const items = Array.isArray(section.items) ? section.items : [];
    return {
      id: section.id || template.id,
      title: section.title || template.title || 'Sección',
      description: section.description || template.description || '',
      items: items.map((item) => ({
        id: item.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        title: item.title || 'Nuevo hito',
        time: item.time || '',
        responsible: item.responsible || '',
        status: item.status || 'pending',
        notes: item.notes || '',
      })),
    };
  });
}
