import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import useTranslations from '../hooks/useTranslations';
import { acceptInvitation } from '../services/WeddingService';

export default function AcceptInvitation() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslations();

  const [statusKey, setStatusKey] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!code || !currentUser) return;

    acceptInvitation(code, currentUser.uid)
      .then((weddingId) => {
        setStatusKey('success');
        setTimeout(() => navigate(`/bodas/${weddingId}`), 2000);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err?.message || '');
        setStatusKey('error');
      });
  }, [code, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center shadow-sm">
        <p className="text-[color:var(--color-text)]">
          {t(`common.public.invitation.accept.${statusKey}`, { message: errorMessage })}
        </p>
      </div>
    </div>
  );
}
