import {
  LayoutGrid,
  LayoutList,
  Search,
  Target,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const badgeToneClasses = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  slate: 'bg-slate-100 text-slate-600',
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const collectBadges = (guest) => {
  const badges = [];
  const rawTags = Array.isArray(guest?.tags) ? guest.tags : [];
  const tags = rawTags.map((tag) => (typeof tag === 'string' ? tag.toLowerCase() : ''));
  const isVip = guest?.vip === true || guest?.isVip === true || tags.includes('vip');
  if (isVip) {
    badges.push({ key: 'vip', label: 'VIP', tone: 'emerald' });
  }
  const allergens = normalizeList(guest?.allergens ?? guest?.alergenos);
  if (allergens.length > 0) {
    badges.push({
      key: 'allergens',
      label: `Alergia: ${allergens[0]}`,
      tone: 'amber',
      title: allergens.join(', '),
    });
  }
  const diet = guest?.diet || guest?.dieta;
  if (diet) {
    badges.push({
      key: 'diet',
      label: String(diet),
      tone: 'sky',
    });
  }
  const companionCount = Number.parseInt(guest?.companion, 10) || 0;
  if (companionCount > 0) {
    badges.push({
      key: 'companions',
      label: `+${companionCount}`,
      tone: 'slate',
    });
  }
  return badges;
};

export default function SeatingGuestDrawer({
  open,
  onClose,
  guests = [],
  selectedTableId,
  onAssignGuest,
  guidedGuestId,
  onGuideGuest,
}) {
  const [term, setTerm] = useState('');
  const [side, setSide] = useState('');
  const [isChild, setIsChild] = useState('');
  const [allergen, setAllergen] = useState('');
  const [group, setGroup] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const availableGuests = useMemo(() => {
    const t = (term || '').toLowerCase();
    return (guests || []).filter((guest) => {
      const noTable = !guest?.table && !guest?.tableId;
      if (!noTable) return false;
      const name = String(guest?.name || '').toLowerCase();
      if (t && !name.includes(t)) return false;
      if (side && String(guest?.side || '').toLowerCase() !== side) return false;
      if (isChild === 'si' && !guest?.isChild) return false;
      if (isChild === 'no' && guest?.isChild) return false;
      if (allergen) {
        const all = String(guest?.allergens || guest?.alergenos || '').toLowerCase();
        if (!all.includes(allergen.toLowerCase())) return false;
      }
      if (group) {
        const g1 = String(
          guest?.group ||
            guest?.groupName ||
            guest?.companionGroupId ||
            guest?.segment ||
            ''
        ).toLowerCase();
        if (!g1.includes(group.toLowerCase())) return false;
      }
      return true;
    });
  }, [guests, term, side, isChild, allergen, group]);

  const guidedGuest = useMemo(() => {
    if (!guidedGuestId) return null;
    return guests.find((guest) => guest?.id === guidedGuestId) || null;
  }, [guests, guidedGuestId]);

  const assignDisabled = !selectedTableId;

  const handleAssign = (guestId) => {
    if (!selectedTableId) return;
    onAssignGuest?.(selectedTableId, guestId);
  };

  const handleGuide = (guestId) => {
    if (typeof onGuideGuest !== 'function') return;
    onGuideGuest(guidedGuestId === guestId ? null : guestId);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'list' ? 'cards' : 'list'));
  };

  const renderGuest = (guest) => {
    const isGuided = guidedGuestId === guest.id;
    const badges = collectBadges(guest);
    const companions = Number.parseInt(guest?.companion, 10);
    const pax = 1 + (Number.isFinite(companions) ? companions : 0);
    const sideLabel = guest?.side ? `Lado ${guest.side}` : 'Sin lado';
    const groupLabel = guest?.groupName || guest?.group ? `Grupo ${guest.groupName || guest.group}` : null;
    const meta = [sideLabel, groupLabel].filter(Boolean).join(' • ');
    const containerClasses = [
      'border rounded transition-colors flex flex-col gap-2',
      viewMode === 'cards' ? 'p-3 shadow-sm bg-white h-full' : 'p-2 bg-white hover:bg-gray-50',
      isGuided ? 'border-blue-400 bg-blue-50/70' : 'border-gray-200',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <div key={guest.id} className={viewMode === 'cards' ? 'h-full' : undefined}>
        <article className={containerClasses}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium text-gray-900">{guest.name}</div>
              <div className="text-[11px] text-gray-500">
                {meta || sideLabel} • {pax} pax
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((badge) => (
                    <span
                      key={`${guest.id}-${badge.key}`}
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeToneClasses[badge.tone]}`}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {typeof onGuideGuest === 'function' && (
              <button
                type="button"
                onClick={() => handleGuide(guest.id)}
                className={`px-2 py-1 text-[11px] rounded border flex items-center gap-1 ${
                  isGuided
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Target className="h-3 w-3" />
                {isGuided ? 'Guiado' : 'Guiar'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAssign(guest.id)}
              disabled={assignDisabled}
              className={`px-2 py-1 text-xs rounded border ${
                assignDisabled
                  ? 'cursor-not-allowed border-gray-200 text-gray-400 bg-gray-100'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors'
              }`}
              title={
                assignDisabled
                  ? {t('common.selecciona_una_mesa_para_habilitar')}
                  : 'Asignar a la mesa seleccionada'
              }
            >
              {assignDisabled ? 'Elegir mesa' : 'Asignar'}
            </button>
          </div>
        </article>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[380px] bg-white border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h3 className="font-medium text-gray-900">Invitados pendientes</h3>
            <span className="text-xs text-gray-500">({availableGuests.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleViewMode}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600"
              title={viewMode === 'list' ? 'Ver como tarjetas' : 'Ver como lista'}
            >
              {viewMode === 'list' ? (
                <LayoutGrid className="h-3.5 w-3.5" />
              ) : (
                <LayoutList className="h-3.5 w-3.5" />
              )}
              <span>{viewMode === 'list' ? 'Tarjetas' : 'Lista'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b space-y-1 text-xs text-gray-600">
          {selectedTableId ? (
            <div>
              Asignar a: <span className="font-semibold text-gray-800">Mesa {selectedTableId}</span>
            </div>
          ) : (
            <div className="text-red-600">
              Selecciona una mesa para habilitar la asignación rápida.
            </div>
          )}
          {guidedGuest && (
            <div className="flex items-center gap-1 text-blue-600">
              <Target className="h-3 w-3" />
              Invitado guiado: <span className="font-medium">{guidedGuest.name}</span>
            </div>
          )}
        </div>

        <div className="p-3 border-b">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar invitado..."
              className="w-full pl-7 pr-3 py-1 border rounded text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={side}
              onChange={(e) => setSide(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">Lado (todos)</option>
              <option value="novia">Novia</option>
              <option value="novio">Novio</option>
            </select>
            <select
              value={isChild}
              onChange={(e) => setIsChild(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">Niños (todos)</option>
              <option value="si">Niños</option>
              <option value="no">Adultos</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="Alergias..."
              className="px-2 py-1 border rounded text-xs"
            />
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Grupo..."
              className="px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto ${
            viewMode === 'cards' ? 'p-3' : 'p-3 space-y-2'
          }`}
        >
          {availableGuests.length === 0 ? (
            <div className="text-xs text-gray-500">
              No hay invitados pendientes con los filtros seleccionados.
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2">{availableGuests.map(renderGuest)}</div>
          ) : (
            availableGuests.map(renderGuest)
          )}
        </div>
      </div>
    </div>
  );
}
