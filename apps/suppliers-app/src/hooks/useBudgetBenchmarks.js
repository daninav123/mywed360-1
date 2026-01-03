import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

const computeGuestBucket = (guestCount) => {
  const count = Number(guestCount) || 0;
  if (count <= 0) return '0-0';
  const size = 50;
  const start = Math.floor((count - 1) / size) * size + 1;
  const end = start + size - 1;
  return `${start}-${end}`;
};

const normalizeRegionKey = (country, region) => {
  const parts = [country, region]
    .map((value) =>
      value
        ? String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/gi, '-')
            .trim()
            .toLowerCase()
        : ''
    )
    .filter(Boolean);
  return parts.length ? parts.join('_') : 'global';
};

const computeConfidence = (count) => {
  if (count >= 20) return 'high';
  if (count >= 8) return 'medium';
  if (count >= 3) return 'low';
  return 'very-low';
};

const emptyResult = {
  categories: {},
  total: { avg: 0, p50: 0, p75: 0, count: 0 },
  sampleSize: 0,
  confidence: 'very-low',
  source: null,
  loading: false,
  applySuggestion: () => [],
  metadata: null,
};

const formatSuggestion = (categories, strategy) => {
  if (!categories) return [];
  return Object.entries(categories).map(([key, stats]) => ({
    key,
    amount: Number(stats?.[strategy]) || 0,
    count: stats?.count || 0,
    source: strategy,
  }));
};

const readBenchmarkDocument = async (regionKey, bucket) => {
  try {
    const docRef = doc(db, 'budgetBenchmarks', `${regionKey}_${bucket}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    // Silenciar errores de permisos - benchmarks son opcionales
    return null;
  }
};

export default function useBudgetBenchmarks({ country, region, guestCount, enabled = true } = {}) {
  const [state, setState] = useState({
    loading: enabled,
    data: null,
  });

  const regionKey = normalizeRegionKey(country, region);
  const bucket = computeGuestBucket(guestCount);

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null });
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      const attempts = [
        { regionKey, bucket },
        { regionKey, bucket: 'global' },
        { regionKey: 'global', bucket },
        { regionKey: 'global', bucket: 'global' },
      ];

      for (const attempt of attempts) {
        const data = await readBenchmarkDocument(attempt.regionKey, attempt.bucket);
        if (data) {
          if (!isMounted) return;
          setState({
            loading: false,
            data: {
              ...data,
              source: attempt,
            },
          });
          return;
        }
      }

      if (isMounted) {
        setState({ loading: false, data: null });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [regionKey, bucket, enabled]);

  const result = useMemo(() => {
    if (!state.data) {
      return {
        ...emptyResult,
        loading: state.loading,
      };
    }

    const { categories = {}, total = {}, count = 0, source, lastUpdated } = state.data;
    const confidence = computeConfidence(count);

    return {
      categories,
      total: {
        avg: Number(total?.avg) || 0,
        p50: Number(total?.p50) || 0,
        p75: Number(total?.p75) || 0,
        count: Number(total?.count) || count || 0,
      },
      sampleSize: count || Number(total?.count) || 0,
      confidence,
      source,
      loading: state.loading,
      metadata: { lastUpdated },
      applySuggestion: (strategy = 'p50') => formatSuggestion(categories, strategy),
    };
  }, [state]);

  return result;
}
