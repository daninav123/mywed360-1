import React, { useState, useEffect, useRef } from 'react';
import { Mail, Check, AlertCircle, X } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import useTranslations from '../../hooks/useTranslations';

/**
 * EmailAliasConfig - Configurar alias de email personalizado
 *
 * Permite al usuario elegir su alias para @malove.app
 * Ejemplo: usuario elige "ana" → ana@malove.app
 */
const EmailAliasConfig = ({ user, onClose, onSuccess }) => {
  const { t } = useTranslations();
  const tAlias = (key, options = {}) => t(`email.aliasConfig.${key}`, { ns: 'email', ...options });

  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const debounceRef = useRef(null);
  const domainSuffix = '@malove.app';

  // Protección: Si no hay usuario, cerrar el modal (solo una vez)
  useEffect(() => {
    if (!user?.uid) {
      // console.warn('[EmailAliasConfig] No user provided, closing modal');
      if (onClose) onClose();
      return;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !db) return;

    // Cargar email actual
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const current = data.maLoveEmail || data.emailUsername || '';
          setCurrentEmail(current);

          // Extraer el alias actual si tiene el dominio configurado
          if (current.includes(domainSuffix)) {
            const username = current.split('@')[0];
            setAlias(username);
          }
        }
      } catch (err) {
        // console.error('Error loading current email:', err);
      }
    })();
  }, [user?.uid]);

  const validateAlias = (value) => {
    if (!value) return tAlias('errors.required');
    if (value.length < 3) return tAlias('errors.minLength');
    if (value.length > 30) return tAlias('errors.maxLength');
    if (!/^[a-z0-9._-]+$/.test(value)) {
      return tAlias('errors.invalidChars');
    }
    return null;
  };

  const checkAvailability = async (value) => {
    if (!db || !user?.uid) return;

    const validationError = validateAlias(value);
    if (validationError) {
      setAvailable(false);
      setError(validationError);
      return;
    }

    setChecking(true);
    setError('');

    try {
      const emailUsername = value.toLowerCase().trim();

      // Verificar en la colección emailUsernames
      const usernameDoc = await getDoc(doc(db, 'emailUsernames', emailUsername));

      if (usernameDoc.exists()) {
        const data = usernameDoc.data();
        // Permitir si es el mismo usuario
        if (data.userId === user.uid) {
          setAvailable(true);
        } else {
          setAvailable(false);
          setError(tAlias('errors.aliasUsed'));
        }
      } else {
        setAvailable(true);
      }
    } catch (err) {
      // console.error('[EmailAliasConfig] Failed to check availability:', err);
      setError(tAlias('errors.checkFailed'));
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleAliasChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setAlias(value);
    setAvailable(null);
    setError('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce check
    if (value.length >= 3) {
      debounceRef.current = setTimeout(() => checkAvailability(value), 500);
    } else {
      debounceRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!db || !user?.uid) {
      setError(tAlias('errors.config'));
      return;
    }

    const validationError = validateAlias(alias);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (available !== true) {
      setError(tAlias('errors.unavailable'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailUsername = alias.toLowerCase().trim();
      const newEmail = `${emailUsername}${domainSuffix}`;

      // 1. Actualizar usuario
      await setDoc(
        doc(db, 'users', user.uid),
        {
          maLoveEmail: newEmail,
          emailUsername: emailUsername,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Reservar username
      await setDoc(doc(db, 'emailUsernames', emailUsername), {
        userId: user.uid,
        email: newEmail,
        createdAt: new Date().toISOString(),
      });

      if (onSuccess) {
        onSuccess(newEmail);
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      // console.error('[EmailAliasConfig] Failed to save alias:', err);
      setError(tAlias('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  const aliasRulesRaw = tAlias('rules', { returnObjects: true });
  const aliasRules =
    Array.isArray(aliasRulesRaw) && aliasRulesRaw.length > 0
      ? aliasRulesRaw
      : [
          'Between 3 and 30 characters',
          'Lowercase letters, numbers, dots (.), hyphens (-) and underscores (_)',
          'Examples: ana, pedro-2025, my.wedding',
        ];

  // No renderizar si no hay usuario
  if (!user || !user.uid) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{tAlias('header.title')}</h2>
            <p className="text-sm text-gray-500">{tAlias('header.subtitle')}</p>
          </div>
        </div>

        {/* Email actual */}
        {currentEmail && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">{tAlias('currentEmail.label')}</p>
            <p className="text-sm font-mono font-semibold text-gray-900">{currentEmail}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input del alias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tAlias('fields.alias.label')}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={alias}
                onChange={handleAliasChange}
                placeholder={tAlias('fields.alias.placeholder')}
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  available === true
                    ? 'border-green-300 focus:ring-green-500'
                    : available === false
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={loading}
                autoFocus
              />
              <span className="text-gray-600 font-mono">{domainSuffix}</span>

              {checking && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              )}

              {!checking && available === true && <Check className="text-green-600" size={20} />}

              {!checking && available === false && (
                <AlertCircle className="text-red-600" size={20} />
              )}
            </div>

            {/* Reglas */}
            <ul className="mt-2 text-xs text-gray-500 space-y-1">
              {aliasRules.map((rule, index) => (
                <li key={`${rule}-${index}`}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Preview */}
          {alias && available === true && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">{tAlias('preview.label')}</p>
              <p className="text-lg font-mono font-bold text-green-700">
                {alias}
                {domainSuffix}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              {tAlias('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || available !== true}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? tAlias('buttons.saving') : tAlias('buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailAliasConfig;
