import React, { useEffect, useMemo, useState } from 'react';
import { getSummary } from '../services/GamificationService';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { Card } from './ui/Card';

const INITIAL_SUMMARY = {
  points: 0,
  level: 1,
  progressToNext: 0,
  achievements: [],
  history: [],
};

export default function GamificationPanel({ embed = false, className = '' }) {
  const { currentUser, userProfile } = useAuth();
  const { activeWedding } = useWedding();

  const authContext = useMemo(() => {
    let storedWeddingId = null;
    if (typeof window !== 'undefined') {
      try {
        storedWeddingId = window.localStorage.getItem('maloveapp_active_wedding');
      } catch (_) {
        storedWeddingId = null;
      }
    }

    return {
      uid: currentUser?.uid || userProfile?.uid || null,
      weddingId: activeWedding?.id || storedWeddingId || null,
    };
  }, [currentUser?.uid, userProfile?.uid, activeWedding?.id]);

  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!authContext.uid) {
      setSummary(INITIAL_SUMMARY);
      setLoading(false);
      return () => {};
    }

    (async () => {
      setLoading(true);
      try {
        const data = await getSummary(authContext);
        if (mounted) {
          setSummary({ ...INITIAL_SUMMARY, ...data });
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setSummary(INITIAL_SUMMARY);
          setError(e?.message || 'No se pudo obtener el progreso');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authContext.uid, authContext.weddingId]);

  const progressPercent = Math.round((summary.progressToNext || 0) * 100);
  const achievementsPreview = summary.achievements.slice(0, 2);
  const historyPreview = summary.history.slice(0, 3);
  const hasAchievements = achievementsPreview.length > 0;
  const hasHistory = historyPreview.length > 0;
  const hasSummaryData =
    summary.level > 1 || summary.points > 0 || progressPercent > 0;
  const hasContent = hasSummaryData || hasAchievements || hasHistory;

  if (!loading && !error && !hasContent) {
    return null;
  }

  const sharedContainerClasses = 'flex flex-col gap-3';

  const body = (
    <>
      {hasSummaryData && (
        <>
          <header className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">
                Gamificación
              </p>
              <h3
                className="text-lg font-semibold text-[color:var(--color-text)]"
                data-testid="gamification-level"
              >
                Nivel {summary.level}
              </h3>
              <p
                className="text-sm text-[color:var(--color-text)]/70"
                data-testid="gamification-points"
              >
                {summary.points} puntos
              </p>
            </div>
            <span
              className="text-xs text-[color:var(--color-text)]/60 font-medium"
              data-testid="gamification-progress-label"
            >
              {progressPercent}%
            </span>
          </header>

          <p
            className="text-sm text-[color:var(--color-text)]/60"
            data-testid="gamification-progress-text"
          >
            Progreso hacia el siguiente nivel: {progressPercent}%
          </p>
        </>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2 text-xs text-[color:var(--color-text)]/50">
          Cargando progreso...
        </div>
      ) : (
        <div className="space-y-4">
          {hasAchievements && (
            <section data-testid="gamification-achievements" className="space-y-2">
              <h4 className="text-xs font-semibold text-[color:var(--color-text)]/70 uppercase tracking-wide">
                Logros recientes
              </h4>
              <ul className="space-y-1 text-sm text-[color:var(--color-text)]/80">
                {achievementsPreview.map((ach) => (
                  <li key={ach.id} className="flex items-start gap-2">
                    <span className="mt-1 block h-2 w-2 rounded-full bg-[var(--color-primary)]/70" />
                    <div>
                      <p className="font-medium text-[color:var(--color-text)]">
                        {ach.name}
                      </p>
                      {ach.description && (
                        <p className="text-xs text-[color:var(--color-text)]/60">
                          {ach.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasHistory && (
            <section data-testid="gamification-history" className="space-y-2">
              <h4 className="text-xs font-semibold text-[color:var(--color-text)]/70 uppercase tracking-wide">
                Historial reciente
              </h4>
              <ul className="space-y-1 text-xs text-[color:var(--color-text)]/70">
                {historyPreview.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span>{item.label}</span>
                    {item.date && (
                      <span className="text-[color:var(--color-text)]/40 whitespace-nowrap">
                        {item.date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {error && !loading && (
        <div
          className="text-xs text-red-500"
          role="alert"
          data-testid="gamification-error"
        >
          {error}
        </div>
      )}
    </>
  );

  if (embed) {
    return (
      <section
        className={`mt-4 border-t border-[color:var(--color-text)]/10 pt-4 ${sharedContainerClasses} ${className}`}
        data-testid="gamification-card"
      >
        {body}
      </section>
    );
  }

  return (
    <Card
      className={`h-full bg-[var(--color-surface)]/80 backdrop-blur-md p-4 ${sharedContainerClasses} ${className}`}
      data-testid="gamification-card"
    >
      {body}
    </Card>
  );
}
