import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from './useAuth';
import { ceremonyAPI } from '../services/apiService';

const DEFAULT_STATE = {
  readings: [],
  surprises: [],
};

const EDIT_ROLES = ['planner', 'wedding-planner', 'owner', 'assistant', 'ayudante'];

function createReading(payload = {}) {
  const now = Date.now();
  return {
    id: payload.id || now,
    title: payload.title || 'Nueva lectura',
    content: payload.content || '',
    duration: payload.duration || '',
    status: payload.status || 'draft',
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  };
}

function createSurprise(payload = {}) {
  const now = Date.now();
  return {
    id: payload.id || now,
    type: payload.type || 'detalle',
    recipient: payload.recipient || '',
    table: payload.table || '',
    description: payload.description || '',
    notes: payload.notes || '',
    status: payload.status || 'pending',
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  };
}

export default function useCeremonyTexts() {
  const { activeWedding } = useWedding();
  const { currentUser, userProfile, hasRole } = useAuth();

  const [readings, setReadings] = useState([]);
  const [surprises, setSurprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const readingsRef = useRef([]);
  const surprisesRef = useRef([]);


  const canEdit = useMemo(() => {
    try {
      if (!userProfile?.role) return hasRole(...EDIT_ROLES);
      return EDIT_ROLES.includes((userProfile.role || '').toLowerCase()) || hasRole(...EDIT_ROLES);
    } catch {
      return false;
    }
  }, [userProfile?.role, hasRole]);

  const persist = useCallback(
    async (nextReadings, nextSurprises) => {
      if (!activeWedding) return;
      try {
        await ceremonyAPI.updateTexts(activeWedding, {
          readings: nextReadings,
          surprises: nextSurprises,
        });
      } catch (err) {
        console.error('[useCeremonyTexts] persist failed', err);
        setError(err);
      }
    },
    [activeWedding],
  );

  useEffect(() => {
    if (!docRef) {
      setReadings([]);
      setSurprises([]);
      readingsRef.current = [];
      surprisesRef.current = [];
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          const nextReadings = Array.isArray(data.readings)
            ? data.readings.map((r) => createReading(r))
            : [];
          const nextSurprises = Array.isArray(data.surprises)
            ? data.surprises.map((s) => createSurprise(s))
            : [];
          readingsRef.current = nextReadings;
          surprisesRef.current = nextSurprises;
          setReadings(nextReadings);
          setSurprises(nextSurprises);
        } else {
          readingsRef.current = [];
          surprisesRef.current = [];
          setReadings([]);
          setSurprises([]);
        }
        setLoading(false);
      },
      (err) => {
        // console.warn('[useCeremonyTexts] snapshot error', err);
        setError(err);
        setLoading(false);
      },
    );
    return () => {
      unsubscribe?.();
    };
  }, [docRef]);

  const addReading = useCallback(
    (reading) => {
      const base = createReading(reading);
      setReadings((prev) => {
        const next = [...prev, base];
        readingsRef.current = next;
        void persist(next, surprisesRef.current);
        return next;
      });
    },
    [persist, activeWedding],
  );

  const updateReading = useCallback(
    (id, changes) => {
      setReadings((prev) => {
        const next = prev.map((reading) =>
          reading.id === id ? { ...reading, ...changes, updatedAt: Date.now() } : reading,
        );
        readingsRef.current = next;
        void persist(next, surprisesRef.current, 'reading_updated');
        if (changes?.status === 'final') {
          performanceMonitor.logEvent('ceremony_text_finalized', {
            weddingId: activeWedding,
            textType: 'reading',
            textId: id,
          });
        }
        return next;
      });
    },
    [persist, activeWedding],
  );

  const removeReading = useCallback(
    (id) => {
      setReadings((prev) => {
        const next = prev.filter((reading) => reading.id !== id);
        readingsRef.current = next;
        void persist(next, surprisesRef.current, 'reading_removed');
        return next;
      });
    },
    [persist],
  );

  const addSurprise = useCallback(
    (surprise) => {
      const base = createSurprise(surprise);
      setSurprises((prev) => {
        const next = [...prev, base];
        surprisesRef.current = next;
        void persist(readingsRef.current, next, 'surprise_added');
        performanceMonitor.logEvent('ceremony_surprise_added', {
          weddingId: activeWedding,
          surpriseType: base.type,
        });
        return next;
      });
    },
    [persist, activeWedding],
  );

  const updateSurprise = useCallback(
    (id, changes) => {
      setSurprises((prev) => {
        const next = prev.map((item) =>
          item.id === id ? { ...item, ...changes, updatedAt: Date.now() } : item,
        );
        surprisesRef.current = next;
        void persist(readingsRef.current, next, 'surprise_updated');
        return next;
      });
    },
    [persist],
  );

  const toggleSurpriseStatus = useCallback(
    (id) => {
      setSurprises((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: item.status === 'pending' ? 'delivered' : 'pending',
                updatedAt: Date.now(),
              }
            : item,
        );
        surprisesRef.current = next;
        void persist(readingsRef.current, next, 'surprise_status_toggled');
        return next;
      });
    },
    [persist],
  );

  const removeSurprise = useCallback(
    (id) => {
      setSurprises((prev) => {
        const next = prev.filter((item) => item.id !== id);
        surprisesRef.current = next;
        void persist(readingsRef.current, next, 'surprise_removed');
        return next;
      });
    },
    [persist],
  );

  return {
    readings,
    surprises,
    loading,
    error,
    canEdit,
    addReading,
    updateReading,
    removeReading,
    addSurprise,
    updateSurprise,
    removeSurprise,
    toggleSurpriseStatus,
  };
}
