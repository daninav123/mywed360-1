import { useEffect, useMemo, useRef, useState } from 'react';

import { useWedding } from '../context/WeddingContext';
import { getNotifications } from '../services/notificationService';

/**
 * Aggregates unread notifications that belong to any wedding managed by the planner.
 * A notification is considered relevant when payload.weddingId matches one of the planner weddings.
 * Returns total count, map per wedding and loading/error flags.
 */
export default function usePlannerAlerts({ refreshOnWindowEvent = true } = {}) {
  const { weddings } = useWedding();
  const [state, setState] = useState({ count: 0, byWedding: {}, loading: false, error: null });
  const abortRef = useRef({ cancelled: false });

  const weddingIds = useMemo(
    () => (Array.isArray(weddings) ? weddings.map((w) => w?.id).filter(Boolean) : []),
    [weddings]
  );

  useEffect(() => {
    abortRef.current.cancelled = false;
    if (!weddingIds.length) {
      setState((prev) => ({ ...prev, count: 0, byWedding: {}, loading: false, error: null }));
      return () => {
        abortRef.current.cancelled = true;
      };
    }

    const compute = async (options = {}) => {
      setState((prev) => ({ ...prev, loading: !options.silent }));
      try {
        const { notifications = [] } = await getNotifications();
        if (abortRef.current.cancelled) return;
        const relevant = Array.isArray(notifications)
          ? notifications.filter(
              (n) =>
                n &&
                !n.read &&
                n.payload &&
                weddingIds.includes(n.payload.weddingId || n.payload.weddingID || n.payload.wid)
            )
          : [];
        const byWedding = {};
        for (const n of relevant) {
          const wid =
            n.payload.weddingId || n.payload.weddingID || n.payload.wid || n.payload.eventId || null;
          if (!wid) continue;
          byWedding[wid] = (byWedding[wid] || 0) + 1;
        }
        setState({ count: relevant.length, byWedding, loading: false, error: null });
      } catch (error) {
        if (abortRef.current.cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('planner_alerts_fetch_failed'),
        }));
      }
    };

    compute();

    let listener = null;
    if (refreshOnWindowEvent && typeof window !== 'undefined') {
      listener = () => compute({ silent: true });
      window.addEventListener('maloveapp-notif', listener);
    }

    return () => {
      abortRef.current.cancelled = true;
      if (listener) window.removeEventListener('maloveapp-notif', listener);
    };
  }, [weddingIds, refreshOnWindowEvent]);

  return state;
}

