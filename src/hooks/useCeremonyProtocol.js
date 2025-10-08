import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';

const DEFAULT_TRADITIONS = [
  { id: 'arras', label: 'Ceremonia de arras', required: false, responsible: '' },
  { id: 'lazo', label: 'Ceremonia del lazo', required: false, responsible: '' },
  { id: 'arena', label: 'Ceremonia de la arena', required: false, responsible: '' },
  { id: 'unity_candle', label: 'Unity candle', required: false, responsible: '' },
];

const DEFAULT_ROLES = [
  { id: 'celebrant', role: 'Celebrante', name: '', contact: '', arrival: '', attire: '' },
  { id: 'witness1', role: 'Testigo 1', name: '', contact: '', arrival: '', attire: '' },
  { id: 'witness2', role: 'Testigo 2', name: '', contact: '', arrival: '', attire: '' },
  { id: 'ring_bearer', role: 'Porta anillos / alianzas', name: '', contact: '', arrival: '', attire: '' },
  { id: 'flower_kid', role: 'Paje / Damas de honor', name: '', contact: '', arrival: '', attire: '' },
];

const DEFAULT_LEGAL = [
  {
    id: 'id-docs',
    label: 'Identificaciones oficiales de los novios',
    status: 'pending',
    dueDate: '',
    notes: '',
  },
  {
    id: 'marriage-license',
    label: 'Expediente matrimonial / licencia',
    status: 'pending',
    dueDate: '',
    notes: '',
  },
  {
    id: 'premarital-course',
    label: 'Curso prematrimonial completado',
    status: 'pending',
    dueDate: '',
    notes: '',
  },
  {
    id: 'witness-statements',
    label: 'Declaraciones de testigos firmadas',
    status: 'pending',
    dueDate: '',
    notes: '',
  },
];

export const CEREMONY_CONFIG_DEFAULT = {
  eventType: 'ceremonia_civil', // ceremonia_civil | ceremonia_religiosa | simbolica | evento
  multiCeremony: false,
  title: 'Ceremonia principal',
  scheduledDate: '',
  scheduledTime: '',
  location: '',
  capacity: 0,
  celebrant: '',
  celebrantContact: '',
  notes: '',
  rehearsal: {
    date: '',
    time: '',
    location: '',
    attendees: '',
  },
  traditions: DEFAULT_TRADITIONS,
  roles: DEFAULT_ROLES,
  legal: DEFAULT_LEGAL,
  contingency: {
    weatherPlan: '',
    technicalPlan: '',
    emergencyContacts: '',
    mobilityPlan: '',
  },
};

export default function useCeremonyProtocol() {
  const { activeWedding } = useWedding();
  const [config, setConfig] = useState(CEREMONY_CONFIG_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    async function listen() {
      try {
        if (!activeWedding) {
          setConfig(CEREMONY_CONFIG_DEFAULT);
          setLoading(false);
          return;
        }

        const ref = doc(db, 'weddings', activeWedding, 'ceremony', 'config');
        unsubscribe = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() || {};
              setConfig((prev) => mergeConfig(prev, data));
            } else {
              setConfig(CEREMONY_CONFIG_DEFAULT);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('[useCeremonyProtocol] onSnapshot error', err);
            setError(err);
            setLoading(false);
          },
        );
      } catch (err) {
        console.warn('[useCeremonyProtocol] listen error', err);
        setError(err);
        setLoading(false);
      }
    }

    listen();
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [activeWedding]);

  const resetToDefaults = useCallback(async () => {
    if (!activeWedding) return;
    setConfig(CEREMONY_CONFIG_DEFAULT);
    const ref = doc(db, 'weddings', activeWedding, 'ceremony', 'config');
    try {
      await setDoc(
        ref,
        {
          ...CEREMONY_CONFIG_DEFAULT,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.warn('[useCeremonyProtocol] resetToDefaults error', err);
      setError(err);
    }
  }, [activeWedding]);

  const saveConfig = useCallback(
    async (nextConfig) => {
      if (!activeWedding) {
        console.warn('[useCeremonyProtocol] saveConfig called without active wedding');
        return;
      }
      const ref = doc(db, 'weddings', activeWedding, 'ceremony', 'config');
      const merged = mergeConfig(config, nextConfig);
      setConfig(merged);
      try {
        await setDoc(
          ref,
          {
            ...merged,
            updatedAt: serverTimestamp(),
            createdAt: config?.createdAt || serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        console.warn('[useCeremonyProtocol] saveConfig error', err);
        setError(err);
      }
    },
    [activeWedding, config],
  );

  const value = useMemo(
    () => ({
      config,
      loading,
      error,
      saveConfig,
      resetToDefaults,
      defaults: CEREMONY_CONFIG_DEFAULT,
    }),
    [config, loading, error, saveConfig, resetToDefaults],
  );

  return value;
}

function mergeConfig(current, incoming) {
  const base = current || CEREMONY_CONFIG_DEFAULT;
  const next = { ...CEREMONY_CONFIG_DEFAULT, ...base, ...incoming };

  if (incoming?.traditions) {
    next.traditions = mergeArrayById(DEFAULT_TRADITIONS, base.traditions, incoming.traditions);
  } else if (!Array.isArray(base.traditions) || !base.traditions.length) {
    next.traditions = DEFAULT_TRADITIONS;
  }

  if (incoming?.roles) {
    next.roles = mergeArrayById(DEFAULT_ROLES, base.roles, incoming.roles);
  } else if (!Array.isArray(base.roles) || !base.roles.length) {
    next.roles = DEFAULT_ROLES;
  }

  if (incoming?.legal) {
    next.legal = mergeArrayById(DEFAULT_LEGAL, base.legal, incoming.legal);
  } else if (!Array.isArray(base.legal) || !base.legal.length) {
    next.legal = DEFAULT_LEGAL;
  }

  if (incoming?.rehearsal) {
    next.rehearsal = { ...CEREMONY_CONFIG_DEFAULT.rehearsal, ...incoming.rehearsal };
  } else if (base?.rehearsal) {
    next.rehearsal = { ...CEREMONY_CONFIG_DEFAULT.rehearsal, ...base.rehearsal };
  }

  if (incoming?.contingency) {
    next.contingency = { ...CEREMONY_CONFIG_DEFAULT.contingency, ...incoming.contingency };
  } else if (base?.contingency) {
    next.contingency = { ...CEREMONY_CONFIG_DEFAULT.contingency, ...base.contingency };
  }

  return next;
}

function mergeArrayById(...arrays) {
  const map = new Map();
  arrays
    .filter((arr) => Array.isArray(arr))
    .forEach((arr) => {
      arr.forEach((item) => {
        if (!item || !item.id) return;
        const existing = map.get(item.id) || {};
        map.set(item.id, { ...existing, ...item });
      });
    });
  return Array.from(map.values());
}
