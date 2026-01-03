import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import LanguageSelector from '../components/ui/LanguageSelector';
import { useAuth } from '../hooks/useAuth.jsx';
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
        // console.error(err);
        setErrorMessage(err?.message || '');
        setStatusKey('error');
      });
  }, [code, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="minimal" persist={false} />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center shadow-sm">
        <p placeholder={t('acceptInvitation.namePlaceholder')} className="text-[color:var(--color-text)]">
          {t(`common.public.invitation.accept.${statusKey}`, { message: errorMessage })}
        </p>
      </div>
    </div>
      
    
  );
}
