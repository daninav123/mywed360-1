import React, { useMemo } from 'react';
import { useFirestoreCollection } from '../../../hooks/useFirestoreCollection';

export const GuestListWidget = ({ config }) => {
  const { data: guests = [] } = useFirestoreCollection('guests', []);
  const filteredGuests = useMemo(() => {
    const base = Array.isArray(guests) ? guests.map(g => ({
      id: g.id,
      name: g.name || g.fullName || g.nombre || 'Invitado',
      email: g.email || g.mail || '',
      rsvp: g.rsvp || g.attendance || 'pending',
      group: g.group || g.category || 'General'
    })) : [];
    const res = [...base];
    if (config?.sortBy === 'name') {
      res.sort((a, b) => a.name.localeCompare(b.name));
    } else if (config?.sortBy === 'group') {
      res.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
    }
    return res;
  }, [guests, config?.sortBy]);
  
  if (config.sortBy === 'name') {
    filteredGuests.sort((a, b) => a.name.localeCompare(b.name));
  } else if (config.sortBy === 'group') {
    filteredGuests.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  }

  const getRsvpStatus = (status) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Confirmado', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
      case 'declined':
        return { text: 'No asiste', color: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Pendiente', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="font-medium">{filteredGuests.length}</span>
          <span className="text-sm text-gray-500 ml-1">invitados</span>
        </div>
        <div className="flex space-x-1">
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            {filteredGuests.filter(g => (g.rsvp || '').toLowerCase() === 'confirmed').length} Sí
          </span>
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            {filteredGuests.filter(g => (g.rsvp || '').toLowerCase() === 'pending').length} Pendiente
          </span>
          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
            {filteredGuests.filter(g => (g.rsvp || '').toLowerCase() === 'declined').length} No
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {filteredGuests.map(guest => {
          const rsvp = getRsvpStatus(guest.rsvp);
          return (
            <div key={guest.id} className="flex items-center p-2 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                {guest.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{guest.name}</div>
                <div className="text-xs text-gray-500 truncate">{guest.email}</div>
              </div>
              <div className="ml-2">
                <span className={`text-xs px-2 py-1 rounded-full ${rsvp.color}`}>
                  {rsvp.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-right">
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Ver lista completa →
        </button>
      </div>
    </div>
  );
};
