import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { acceptInvitation } from '../services/WeddingService';

export default function AcceptInvitation() {
  const { code } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Procesando...');

  useEffect(() => {
    if (!code || !currentUser) return;
    acceptInvitation(code, currentUser.uid)
      .then((weddingId) => {
        setStatus('¡Invitación aceptada! Redirigiendo...');
        setTimeout(() => navigate(`/bodas/${weddingId}`), 2000);
      })
      .catch((err) => {
        console.error(err);
        setStatus('No se pudo aceptar la invitación: ' + err.message);
      });
  }, [code, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center shadow-sm">
        <p className="text-[color:var(--color-text)]">{status}</p>
      </div>
    </div>
  );
}
