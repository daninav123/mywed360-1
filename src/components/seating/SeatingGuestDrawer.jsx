import React, { useMemo, useState } from 'react';
import { X, Search, Users } from 'lucide-react';

export default function SeatingGuestDrawer({
  open,
  onClose,
  guests = [],
  selectedTableId,
  onAssignGuest,
}) {
  const [term, setTerm] = useState('');
  const [side, setSide] = useState('');
  const [isChild, setIsChild] = useState('');
  const [allergen, setAllergen] = useState('');
  const [group, setGroup] = useState('');

  const availableGuests = useMemo(() => {
    const t = (term || '').toLowerCase();
    return (guests || []).filter((g) => {
      const noTable = !g?.table && !g?.tableId;
      if (!noTable) return false;
      const name = String(g?.name || '').toLowerCase();
      if (t && !name.includes(t)) return false;
      if (side && String(g?.side || '').toLowerCase() !== side) return false;
      if (isChild === 'si' && !g?.isChild) return false;
      if (isChild === 'no' && g?.isChild) return false;
      if (allergen) {
        const all = String(g?.allergens || g?.alergenos || '').toLowerCase();
        if (!all.includes(allergen.toLowerCase())) return false;
      }
      if (group) {
        const g1 = String(g?.group || g?.groupName || g?.companionGroupId || '').toLowerCase();
        if (!g1.includes(group.toLowerCase())) return false;
      }
      return true;
    });
  }, [guests, term, side, isChild, allergen, group]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[360px] bg-white border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h3 className="font-medium">Invitados pendientes</h3>
            <span className="text-xs text-gray-500">({availableGuests.length})</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" title="Cerrar">
            <X className="h-4 w-4" />
          </button>
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
            <select value={side} onChange={(e) => setSide(e.target.value)} className="px-2 py-1 border rounded text-xs">
              <option value="">Lado (todos)</option>
              <option value="novia">Novia</option>
              <option value="novio">Novio</option>
            </select>
            <select value={isChild} onChange={(e) => setIsChild(e.target.value)} className="px-2 py-1 border rounded text-xs">
              <option value="">Niños (todos)</option>
              <option value="si">Niños</option>
              <option value="no">Adultos</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={allergen} onChange={(e) => setAllergen(e.target.value)} placeholder="Alergias..." className="px-2 py-1 border rounded text-xs" />
            <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Grupo..." className="px-2 py-1 border rounded text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {availableGuests.length === 0 ? (
            <div className="text-xs text-gray-500">No hay invitados pendientes</div>
          ) : (
            availableGuests.map((g) => (
              <button
                key={g.id}
                onClick={() => selectedTableId && onAssignGuest?.(selectedTableId, g.id)}
                className="w-full text-left p-2 border rounded hover:bg-gray-50 text-sm"
                title={selectedTableId ? 'Asignar a mesa seleccionada' : 'Selecciona una mesa primero'}
              >
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-gray-500">
                  {g.side ? `${g.side} • ` : ''}
                  {g.companion ? `${1 + (parseInt(g.companion,10)||0)} pax` : '1 pax'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
