import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

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

export default function useBudgetBenchmarks({ country, region, guestCount, enabled = true } = {}) {
  const [state, setState] = useState({
    loading: enabled,
    data: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null });
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      try {
        const response = await axios.get(`${API_URL}/budget-benchmarks`, {
          params: { country, region, guestCount }
        });

        if (isMounted && response.data.success) {
          setState({
            loading: false,
            data: response.data.data
          });
        } else if (isMounted) {
          setState({ loading: false, data: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({ loading: false, data: null });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [country, region, guestCount, enabled]);

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
