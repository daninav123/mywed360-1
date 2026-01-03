import React from 'react';
import { FaApple, FaFacebookF, FaGoogle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';

const PROVIDER_META = {
  google: {
    label: 'Google',
    Icon: FaGoogle,
    color: '#DB4437',
  },
  facebook: {
    label: 'Facebook',
    Icon: FaFacebookF,
    color: '#1877F2',
  },
  apple: {
    label: 'Apple',
    Icon: FaApple,
    color: '#111827',
  },
};

export default function SocialLoginButtons({
  providers = ['google', 'facebook', 'apple'],
  onProviderClick,
  busyProvider,
  disabled,
  getProviderLabel,
}) {
  const { t } = useTranslations();
  const availableProviders = providers.filter((provider) => PROVIDER_META[provider]);

  if (!availableProviders.length) {
    return null;
  }

  return (
    <div className="grid gap-3" data-testid="social-login-buttons">
      {availableProviders.map((provider) => {
        const { label, Icon, color } = PROVIDER_META[provider];
        const providerDisplayName = getProviderLabel?.(provider) || label;
        const buttonLabel = t('authLogin.social.button', {
          provider: providerDisplayName,
          defaultValue: `Continue with ${providerDisplayName}`,
        });
        const isLoading = busyProvider === provider;
        return (
          <button
            key={provider}
            type="button"
            onClick={() => onProviderClick?.(provider)}
            disabled={disabled || isLoading}
            className="flex items-center justify-center gap-3 rounded-md border border-soft bg-surface py-2.5 text-sm font-medium transition-colors hover:bg-[color:var(--color-bg-soft)] disabled:cursor-not-allowed disabled:opacity-70"
            data-provider={provider}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
            ) : (
              <Icon className="h-4 w-4" style={{ color }} />
            )}
            <span>{buttonLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
