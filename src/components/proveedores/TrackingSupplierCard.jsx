import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import React from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';

const formatField = (value, placeholder = '—') => {
  if (!value) return placeholder;
  return value;
};

export default function TrackingSupplierCard({
  provider,
  selected = false,
  hasPending = false,
  onToggleSelect,
  onPromote,
  onSchedule,
  onDetail,
  onArchive,
}) {
  const statusBadge =
    provider?.status && typeof provider.status === 'string'
      ? provider.status.trim()
      : 'Por definir';

  return (
    <Card
      className={`relative border border-dashed border-[var(--color-primary)]/35 bg-white/80 backdrop-blur-sm transition-all ${
        selected ? 'ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
        />
      </div>
      {hasPending && (
        <span
          className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-red-500 shadow-inner shadow-red-200"
          title="Pendiente de seguimiento"
        />
      )}

      <header className="pl-10 pr-3 pt-2 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[color:var(--color-text)] line-clamp-1">
            {provider?.name || provider?.nombre || 'Proveedor sin nombre'}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              {provider?.service || provider?.servicio || 'Servicio sin definir'}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {statusBadge}
            </span>
            {Number.isFinite(provider?.intelligentScore?.score) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                <Star size={12} /> {Math.round(provider.intelligentScore.score)}
              </span>
            )}
          </div>
        </div>
        {provider?.priceRange && (
          <div className="text-right text-sm text-[color:var(--color-text)]/70">
            <p className="font-medium">Presupuesto estimado</p>
            <p className="font-semibold text-[color:var(--color-text)]">{provider.priceRange}</p>
          </div>
        )}
      </header>

      <section className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/75">
        <div className="flex flex-col gap-1 border-l-2 border-dashed border-[var(--color-primary)]/40 pl-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/50">
              Último contacto
            </span>
            <span className="font-medium text-[color:var(--color-text)]">
              {formatField(provider?.lastContact || provider?.contactedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpRight size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/50">
              Próximo paso
            </span>
            <span className="font-medium text-[color:var(--color-text)]">
              {formatField(provider?.nextAction)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/50">
              Responsable
            </span>
            <span className="font-medium text-[color:var(--color-text)]">
              {formatField(provider?.owner || provider?.responsable)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/50">
              Próximo pago
            </span>
            <span className="font-medium text-[color:var(--color-text)]">
              {formatField(provider?.nextPaymentDate || provider?.paymentDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-md bg-white/70 px-3 py-2">
          {provider?.email && (
            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-text)]/60">
              <Mail size={12} /> {provider.email}
            </span>
          )}
          {provider?.phone && (
            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-text)]/60">
              <Phone size={12} /> {provider.phone}
            </span>
          )}
          {provider?.location && (
            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-text)]/60">
              <MapPin size={12} /> {provider.location}
            </span>
          )}
        </div>
      </section>

      <footer className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-[var(--color-primary)]/30 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px]"
          onClick={(event) => {
            event.stopPropagation();
            onDetail?.();
          }}
        >
          <EyeIcon size={14} className="mr-1" /> Ver ficha
        </Button>
        <Button
          size="sm"
          className="flex-1 min-w-[150px]"
          onClick={(event) => {
            event.stopPropagation();
            onPromote?.();
          }}
        >
          <CheckCircle2 size={14} className="mr-1" /> Promover a confirmado
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[150px]"
          onClick={(event) => {
            event.stopPropagation();
            onSchedule?.();
          }}
        >
          <Calendar size={14} className="mr-1" /> Registrar próxima acción
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 min-w-[140px] text-red-600 hover:text-red-700"
          onClick={(event) => {
            event.stopPropagation();
            onArchive?.();
          }}
        >
          <Trash2 size={14} className="mr-1" /> Descartar
        </Button>
      </footer>
    </Card>
  );
}

function EyeIcon(props) {
  return <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M10 3.5c3.889 0 7.05 2.45 8.5 5.5-1.45 3.05-4.611 5.5-8.5 5.5s-7.05-2.45-8.5-5.5c1.45-3.05 4.611-5.5 8.5-5.5Zm0 8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>;
}
