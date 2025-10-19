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

const formatCurrency = (value, currency = 'EUR') => {
  if (!Number.isFinite(Number(value))) return '—';
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
};

export default function ConfirmedSupplierCard({
  provider,
  selected = false,
  onToggleSelect,
  onDetail,
  onRegisterPayment,
  onOpenContract,
  onOpenPortal,
}) {
  const totalAssigned =
    Number(provider?.assignedBudget ?? provider?.presupuestoAsignado ?? provider?.priceRange) || 0;
  const totalSpent = Number(provider?.spent ?? provider?.gastado) || 0;
  const pending = Math.max(totalAssigned - totalSpent, 0);

  return (
    <Card
      className={`relative border border-emerald-200 bg-emerald-50/80 backdrop-blur-sm transition ${
        selected ? 'ring-2 ring-emerald-400' : ''
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
            {provider?.name || provider?.nombre || 'Proveedor'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
              Confirmado
            </span>
            <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 font-medium text-emerald-600">
              {provider?.service || provider?.servicio || 'Servicio sin definir'}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-emerald-900/80">
          <p className="font-medium">Próximo pago</p>
          <p className="font-semibold">
            {provider?.nextPaymentDate || provider?.paymentDate || 'Sin fecha'}
          </p>
        </div>
      </header>

      <section className="mt-4 rounded-lg border border-emerald-200/70 bg-white/70 px-4 py-3 text-sm text-emerald-900/80">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">Asignado</p>
            <p className="text-lg font-semibold text-emerald-900">
              {totalAssigned ? formatCurrency(totalAssigned, provider?.currency || 'EUR') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">Pagado</p>
            <p className="text-lg font-semibold text-emerald-900">
              {totalSpent ? formatCurrency(totalSpent, provider?.currency || 'EUR') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700/60">Pendiente</p>
            <p className="text-lg font-semibold text-emerald-900">
              {pending ? formatCurrency(pending, provider?.currency || 'EUR') : '—'}
            </p>
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
            <ClipboardList size={12} /> Grupo: {provider.groupName}
          </div>
        )}
      </section>

      <footer className="mt-4 flex flex-wrap gap-2 border-t border-emerald-200/60 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px] border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          onClick={(event) => {
            event.stopPropagation();
            onDetail?.();
          }}
        >
          <CheckCircle2 size={14} className="mr-1" /> Ver ficha
        </Button>
        <Button
          size="sm"
          className="flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700"
          onClick={(event) => {
            event.stopPropagation();
            onRegisterPayment?.();
          }}
        >
          <Wallet size={14} className="mr-1" /> Registrar pago
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
          <ClipboardList size={14} className="mr-1" /> Ver contrato
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
          <ExternalLink size={14} className="mr-1" /> Portal proveedor
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
