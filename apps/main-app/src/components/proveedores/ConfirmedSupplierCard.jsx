import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from 'lucide-react';
import React from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

export default function ConfirmedSupplierCard({
  provider,
  selected = false,
  onToggleSelect,
  onDetail,
  onRegisterPayment,
  onOpenContract,
  onOpenPortal,
}) {
  const { t, format } = useTranslations();
  const totalAssigned =
    Number(provider?.assignedBudget ?? provider?.presupuestoAsignado ?? provider?.priceRange) || 0;
  const totalSpent = Number(provider?.spent ?? provider?.gastado) || 0;
  const pending = Math.max(totalAssigned - totalSpent, 0);
  const currency = provider?.currency || 'EUR';
  const notAvailable = t('suppliers.confirmedCard.shared.notAvailable');

  const displayAmount = (value) =>
    value ? format.currency(Number(value), currency) : notAvailable;

  const formatDateValue = (value) => {
    if (!value) return notAvailable;
    try {
      const date =
        typeof value?.toDate === 'function'
          ? value.toDate()
          : value instanceof Date
            ? value
            : new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return typeof format.dateShort === 'function'
        ? format.dateShort(date)
        : format.date(date, { month: 'short' });
    } catch {
      return value;
    }
  };

  return (
    <Card
      className={`relative bg-[var(--color-success-10)] transition ${
        selected ? 'ring-2 ring-[color:var(--color-success)]' : ''
      }`}
    >
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />
      </div>

      <header className="pl-10 pr-3 pt-2 flex items-start justify-between gap-3">
        <div className="space-y-1 text-emerald-900">
          <h3 className="text-lg font-semibold line-clamp-1">
            {provider?.name ||
              provider?.nombre ||
              t('suppliers.confirmedCard.nameFallback')}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
              {t('suppliers.confirmedCard.statusBadge')}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 font-medium text-emerald-600">
              {provider?.service ||
                provider?.servicio ||
                t('suppliers.confirmedCard.serviceFallback')}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-emerald-900/80">
          <p className="font-medium">{t('suppliers.confirmedCard.nextPayment.label')}</p>
          <p className="font-semibold">
            {formatDateValue(provider?.nextPaymentDate || provider?.paymentDate) ||
              t('suppliers.confirmedCard.nextPayment.none')}
          </p>
        </div>
      </header>

      <section className="mt-4 rounded-lg border border-emerald-200/70 bg-white/70 px-4 py-3 text-sm text-emerald-900/80">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">
              {t('suppliers.confirmedCard.summary.assigned')}
            </p>
            <p className="text-lg font-semibold text-emerald-900">{displayAmount(totalAssigned)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">
              {t('suppliers.confirmedCard.summary.paid')}
            </p>
            <p className="text-lg font-semibold text-emerald-900">{displayAmount(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">
              {t('suppliers.confirmedCard.summary.pending')}
            </p>
            <p className="text-lg font-semibold text-emerald-900">{displayAmount(pending)}</p>
          </div>
        </div>
      </section>

      <section className="mt-3 space-y-2 text-sm text-emerald-900/80">
        <div className="flex flex-wrap items-center gap-3">
          {provider?.contact && (
            <span className="inline-flex items-center gap-1 text-xs">
              <UserBullet /> {provider.contact}
            </span>
          )}
          {provider?.email && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Mail size={12} /> {provider.email}
            </span>
          )}
          {provider?.phone && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Phone size={12} /> {provider.phone}
            </span>
          )}
          {provider?.location && (
            <span className="inline-flex items-center gap-1 text-xs">
              <MapPin size={12} /> {provider.location}
            </span>
          )}
        </div>
        {provider?.groupName && (
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
            <ClipboardList size={12} />{' '}
            {t('suppliers.confirmedCard.groupLabel', { name: provider.groupName })}
          </div>
        )}
      </section>

      <footer className="mt-4 flex flex-wrap gap-2 bg-[var(--color-primary)] pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px] border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          onClick={(event) => {
            event.stopPropagation();
            onDetail?.();
          }}
        >
          <CheckCircle2 size={14} className="mr-1" />{' '}
          {t('suppliers.confirmedCard.actions.view')}
        </Button>
        <Button
          size="sm"
          className="flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700"
          onClick={(event) => {
            event.stopPropagation();
            onRegisterPayment?.();
          }}
        >
          <Wallet size={14} className="mr-1" />{' '}
          {t('suppliers.confirmedCard.actions.registerPayment')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[150px] border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          onClick={(event) => {
            event.stopPropagation();
            onOpenContract?.();
          }}
        >
          <ClipboardList size={14} className="mr-1" />{' '}
          {t('suppliers.confirmedCard.actions.viewContract')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 min-w-[140px] text-emerald-700 hover:text-emerald-800"
          onClick={(event) => {
            event.stopPropagation();
            onOpenPortal?.();
          }}
        >
          <ExternalLink size={14} className="mr-1" />{' '}
          {t('suppliers.confirmedCard.actions.portal')}
        </Button>
      </footer>
    </Card>
  );
}

function UserBullet() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
      <path
        d="M8 8.667a3.334 3.334 0 1 0 0-6.667 3.334 3.334 0 0 0 0 6.667Zm0 1.666c-2.227 0-6.667 1.12-6.667 3.333V15h13.334v-1.334c0-2.213-4.44-3.333-6.667-3.333Z"
        fill="currentColor"
      />
    </svg>
  );
}
