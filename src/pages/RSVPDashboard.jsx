import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useWedding } from '../context/WeddingContext';

export default function RSVPDashboard() {
  const { activeWedding } = useWedding();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!activeWedding) return;
    const ref = doc(db, 'weddings', activeWedding, 'rsvp', 'stats');
    const unsub = onSnapshot(ref, (snap) => {
      setStats(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [activeWedding]);

  if (!activeWedding) {
    return <div className="p-6">Selecciona una boda para ver el dashboard de RSVP.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard de RSVP</h1>
      {!stats ? (
        <div className="text-gray-600">Sin datos de respuestas todavía.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Invitaciones</div>
              <div className="text-2xl font-bold">{stats.totalInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Respuestas</div>
              <div className="text-2xl font-bold">{stats.totalResponses || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Asistentes Confirmados</div>
              <div className="text-2xl font-bold">{stats.confirmedAttendees || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Rechazadas</div>
              <div className="text-2xl font-bold">{stats.declinedInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Pendientes</div>
              <div className="text-2xl font-bold">{stats.pendingResponses || 0}</div>
            </div>
          </div>

          {stats.dietaryRestrictions && (
            <div className="border rounded p-4 bg-white">
              <h2 className="font-semibold mb-3">Restricciones dietéticas</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Vegetarianos: {stats.dietaryRestrictions.vegetarian || 0}</li>
                <li>Veganos: {stats.dietaryRestrictions.vegan || 0}</li>
                <li>Sin gluten: {stats.dietaryRestrictions.glutenFree || 0}</li>
                <li>Intolerantes a lactosa: {stats.dietaryRestrictions.lactoseIntolerant || 0}</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
