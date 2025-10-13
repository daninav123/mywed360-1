import React, { useMemo } from 'react';
import { CalendarClock, PieChart, Archive, Activity } from 'lucide-react';

import { Card } from '../ui/Card';

const CARD_ICON_MAP = {
  active: Activity,
  upcoming: CalendarClock,
  progress: PieChart,
  archived: Archive,
};

const ROLE_TITLES = {
  active: 'Bodas activas',
  upcoming: 'Próximos 30 días',
  progress: 'Progreso medio',
  archived: 'Archivadas',
};

const formatNumber = (value, suffix = '') => {
  if (suffix === '%' && typeof value === 'number') {
    return `${value}%`;
  }
  return value;
};

const parseDate = (raw) => {
  if (!raw) return null;
  try {
    if (typeof raw === 'string') {
      const date = new Date(raw);
      if (!Number.isNaN(date.getTime())) return date;
    } else if (typeof raw?.toDate === 'function') {
      const date = raw.toDate();
      if (!Number.isNaN(date.getTime())) return date;
    }
  } catch {}
  return null;
};

export default function MultiWeddingSummary({ weddings = [] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const active = weddings.filter((w) => w.active !== false);
    const archived = weddings.filter((w) => w.active === false);
    const upcoming = active.filter((w) => {
      const eventDate = parseDate(w.weddingDate);
      if (!eventDate) return false;
      return eventDate.getTime() >= now.getTime() && eventDate.getTime() - now.getTime() <= THIRTY_DAYS_MS;
    });
    const averageProgress =
      active.length > 0
        ? Math.round(
            active.reduce((acc, w) => acc + (Number.isFinite(w.progress) ? w.progress : 0), 0) /
              active.length
          )
        : 0;

    return {
      active: active.length,
      upcoming: upcoming.length,
      progress: averageProgress,
      archived: archived.length,
    };
  }, [weddings]);

  const cards = [
    { key: 'active', suffix: '' },
    { key: 'upcoming', suffix: '' },
    { key: 'progress', suffix: '%' },
    { key: 'archived', suffix: '' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, suffix }) => {
        const Icon = CARD_ICON_MAP[key];
        return (
          <Card key={key} className="p-4 flex items-center gap-4 shadow-sm border border-soft">
            <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted uppercase tracking-wide">{ROLE_TITLES[key]}</p>
              <p className="text-2xl font-semibold text-[color:var(--color-text)]">
                {formatNumber(stats[key], suffix)}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
