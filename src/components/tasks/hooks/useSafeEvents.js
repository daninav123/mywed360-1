import { useMemo } from 'react';

import { validateAndNormalizeDate } from '../utils/dateUtils';
import { useTranslations } from '../../hooks/useTranslations';

export function useSafeEvents(meetingsState) {
  const { t } = useTranslations();

  const safeEvents = useMemo(() => {
    const allEvents = Array.isArray(meetingsState) ? meetingsState : [];
    return allEvents
      .filter((event) => event !== null && event !== undefined)
      .map((event) => {
        if (!event.start || !event.end) return null;
        const start = validateAndNormalizeDate(event.start);
        const end = validateAndNormalizeDate(event.end);
        if (!start || !end) return null;
        return {
          ...event,
          start,
          end,
          title: event.title || event.name || {t('common.sin_titulo')},
        };
      })
      .filter(Boolean);
  }, [meetingsState]);

  const sortedEvents = useMemo(() => {
    return [...safeEvents].sort((a, b) => a.start - b.start);
  }, [safeEvents]);

  const safeMeetings = useMemo(() => {
    const raw = (Array.isArray(meetingsState) ? meetingsState : [])
      .filter((e) => e !== null && e !== undefined)
      .map((event) => {
        if (!event.start || !event.end) return null;
        const start = validateAndNormalizeDate(event.start);
        const end = validateAndNormalizeDate(event.end);
        if (!start || !end) return null;
        return { ...event, start, end, title: event.title || event.name || {t('common.sin_titulo')} };
      })
      .filter(Boolean);

    const seen = new Set();
    const unique = [];
    for (const ev of raw) {
      const key = ev.id || `${ev.title}-${ev.start?.toISOString?.() ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ev);
      }
    }
    return unique;
  }, [meetingsState]);

  const safeMeetingsFiltered = useMemo(
    () => safeMeetings.filter((ev) => ev.id !== 'wedding-day' && ev.autoKey !== 'wedding-day'),
    [safeMeetings]
  );

  return { safeEvents, sortedEvents, safeMeetings, safeMeetingsFiltered };
}
