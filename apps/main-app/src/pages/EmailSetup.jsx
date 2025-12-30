import { Mail, CheckCircle, AlertCircle, ArrowLeft, Loader2, RefreshCw, ShieldAlert, ShieldCheck, Copy, ExternalLink } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import EmailSetupForm from '../components/email/EmailSetupForm';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { auth } from '../firebaseConfig';
import useEmailUsername from '../hooks/useEmailUsername';
import { fetchMailgunDomainStatus, sendAliasVerificationEmail } from '../services/mailgunService';

/**
 * P�gina de configuraci�n de correo electr�nico MaLove.App
 * Permite a los usuarios crear su direcci�n personalizada
 */
const EmailSetup = () => {
  const navigate = useNavigate();
  const { getCurrentUsername, reserveUsername, checkUsernameAvailability, loading, error } =
    useEmailUsername();
  const [currentUsername, setCurrentUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const [dnsStatus, setDnsStatus] = useState(null);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsError, setDnsError] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState({ status: 'idle', error: null, lastSent: null });
  const [lastDnsCheck, setLastDnsCheck] = useState(null);
  const [dnsAutoRefreshing, setDnsAutoRefreshing] = useState(false);
  const [copiedRecordKey, setCopiedRecordKey] = useState(null);
  const autoRefreshTimerRef = useRef(null);
  const autoTestTriggeredRef = useRef(false);
  const copyFeedbackTimeoutRef = useRef(null);
  // Cargar nombre de usuario actual si existe
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const username = await getCurrentUsername();
        setCurrentUsername(username);
      } catch (err) {
        // console.error('Error al cargar el nombre de usuario:', err);
        setGeneralError('Error al cargar tus datos de correo electr�nico');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      loadUsername();
    } else {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login', {
        state: {
          returnUrl: '/email-setup',
          message: 'Debes iniciar sesi�n para configurar tu correo MaLove.App',
        },
      });
    }
  }, [getCurrentUsername, navigate]);

  const handleSaveUsername = async (username) => {
    try {
      const success = await reserveUsername(username);
      if (success) {
        autoTestTriggeredRef.current = false;
        setCurrentUsername(username);
        setSaveSuccess(true);
        // Ocultar mensaje de �xito despu�s de 5 segundos
        setTimeout(() => {
          setSaveSuccess(false);
        }, 5000);
        // Revalidar estado DNS tras reservar el alias
        try {
          await refreshDnsStatus();
        } catch {}
        setTestEmailStatus({ status: 'idle', error: null, lastSent: null });
      }
      return success;
    } catch (err) {
      // console.error('Error al guardar el nombre de usuario:', err);
      setGeneralError('Ha ocurrido un error al guardar tu direcci�n de correo.');
      return false;
    }
  };

  const refreshDnsStatus = useCallback(async () => {
    setDnsLoading(true);
    setDnsError('');
    try {
      const status = await fetchMailgunDomainStatus();
      setDnsStatus(status);
      setLastDnsCheck(new Date().toISOString());
    } catch (err) {
      setDnsStatus(null);
      setDnsError(err?.message || 'No se pudo consultar el estado DNS.');
      setLastDnsCheck(new Date().toISOString());
    } finally {
      setDnsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDnsStatus();
  }, [refreshDnsStatus]);

  const dnsSections = useMemo(
    () => ({
      dkim: dnsStatus?.dkim || null,
      spf: dnsStatus?.spf || null,
      dmarc: dnsStatus?.dmarc || null,
    }),
    [dnsStatus]
  );

  const dnsNeedsAttention = useMemo(() => {
    if (!dnsStatus) return true;
    return ['dkim', 'spf'].some((key) => {
      const section = dnsSections[key];
      if (!section) return true;
      return !section.verified;
    });
  }, [dnsStatus, dnsSections]);

  const dnsFullyVerified = useMemo(() => {
    if (!dnsStatus) return false;
    return Boolean(dnsStatus?.dkim?.verified && dnsStatus?.spf?.verified);
  }, [dnsStatus]);

  const runAliasVerification = useCallback(
    async (aliasToTest) => {
      const destination = auth.currentUser?.email || '';
      if (!aliasToTest || !destination) {
        return;
      }
      setTestEmailStatus({ status: 'running', error: null, lastSent: null });
      try {
        await sendAliasVerificationEmail({ alias: aliasToTest, toEmail: destination });
        setTestEmailStatus({ status: 'success', error: null, lastSent: new Date().toISOString() });
      } catch (err) {
        setTestEmailStatus({
          status: 'error',
          error: err?.message || 'No se pudo enviar el correo de prueba',
          lastSent: null,
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!currentUsername) return;
    if (!dnsFullyVerified) return;
    if (testEmailStatus.status !== 'idle' && testEmailStatus.status !== 'error') return;
    if (autoTestTriggeredRef.current) return;
    autoTestTriggeredRef.current = true;
    runAliasVerification(currentUsername);
  }, [currentUsername, dnsFullyVerified, runAliasVerification, testEmailStatus.status]);

  useEffect(() => {
    if (dnsNeedsAttention) {
      autoTestTriggeredRef.current = false;
    }
  }, [dnsNeedsAttention]);

  useEffect(() => {
    if (dnsNeedsAttention) {
      if (!autoRefreshTimerRef.current) {
        autoRefreshTimerRef.current = setInterval(() => {
          refreshDnsStatus();
        }, 30000);
      }
      setDnsAutoRefreshing(true);
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      setDnsAutoRefreshing(false);
    }
  }, [dnsNeedsAttention, refreshDnsStatus]);

  useEffect(() => {
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
        copyFeedbackTimeoutRef.current = null;
      }
    };
  }, []);

  const dnsHelpTexts = useMemo(() => {
    const domain = dnsStatus?.domain || 'tu-dominio.com';
    return {
      dkim:
        'Publica el registro CNAME indicado por Mailgun en la consola DNS de tu dominio. Una vez propagado, tus correos saldr�n firmados.',
      spf:
        'Actualiza el registro TXT SPF de tu dominio para incluir "include:mailgun.org" y autorizar a Mailgun a enviar en tu nombre.',
      dmarc: `Recomendado: a�ade un registro TXT _dmarc.${domain} con tu pol�tica de DMARC (por ejemplo: "v=DMARC1; p=none; rua=mailto:postmaster@${domain}").`,
    };
  }, [dnsStatus?.domain]);

  const lastDnsCheckLabel = useMemo(() => {
    if (!lastDnsCheck) return null;
    try {
      return new Date(lastDnsCheck).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return lastDnsCheck;
    }
  }, [lastDnsCheck]);

  const handleCopyRecord = useCallback(
    (key, value) => {
      if (!value) return;
      const text = String(value);

      const copy = async () => {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
      };

      copy()
        .then(() => {
          setCopiedRecordKey(key);
          if (copyFeedbackTimeoutRef.current) {
            clearTimeout(copyFeedbackTimeoutRef.current);
          }
          copyFeedbackTimeoutRef.current = setTimeout(() => {
            setCopiedRecordKey(null);
            copyFeedbackTimeoutRef.current = null;
          }, 2000);
        })
        .catch((err) => {
          // console.warn('No se pudo copiar al portapapeles', err);
        });
    },
    []
  );

  const renderDnsCard = (sectionKey, label) => {
    const status = dnsSections[sectionKey] || null;
    const verified = Boolean(status?.verified);
    const records = Array.isArray(status?.records) ? status.records : [];
    const helperText =
      dnsHelpTexts[sectionKey] ||
      'Revisa tu configuraci�n DNS y a�ade los valores sugeridos por Mailgun.';
    const pending = !verified;

    return (
      <div
        key={sectionKey}
        className="rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
          {verified ? (
            <ShieldCheck size={16} className="text-[color:var(--color-success)]" />
          ) : (
            <ShieldAlert size={16} className="text-[color:var(--color-warning)]" />
          )}
          <span>{label}</span>
        </div>
        <p
          className={`mt-1 text-xs ${
            verified ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-warning)]'
          }`}
        >
          {verified ? 'Registros verificados correctamente.' : helperText}
        </p>

        <div className="mt-3 space-y-2 text-xs text-[color:var(--color-muted)]">
          {records.length === 0 ? (
            <div className="rounded border border-dashed border-[color:var(--color-border-60)] bg-[color:var(--color-surface-40)] px-3 py-2">
              <p className="text-[color:var(--color-muted)]">
                Mailgun a�n no detecta registros publicados para este apartado. A�ade los valores
                sugeridos en tu proveedor DNS y espera unos minutos.
              </p>
              {sectionKey === 'dmarc' ? (
                <>
                  <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                    DMARC es opcional pero recomendable para mejorar la entrega y recibir reportes de seguridad.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="gap-1"
                      onClick={() =>
                        handleCopyRecord(
                          `v=DMARC1; p=none; rua=mailto:postmaster@${dnsStatus?.domain || 'tu-dominio.com'}`,
                          `${sectionKey}-template`
                        )
                      }
                    >
                      <Copy size={12} /> Copiar plantilla recomendada
                    </Button>
                    {copiedRecordKey === `${sectionKey}-template` && (
                      <span className="text-[11px] text-[color:var(--color-success)]">
                        Plantilla copiada
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            records.map((record, index) => {
              const recordKeyBase = `${sectionKey}-${index}`;
              const isRecordVerified = Boolean(record?.verified || record?.valid);
              return (
                <div
                  key={recordKeyBase}
                  className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface-60)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-xs font-semibold text-[color:var(--color-text)]">
                        {record?.name || 'Registro'}
                      </p>
                      {record?.type ? (
                        <p className="text-[11px] font-mono uppercase text-[color:var(--color-muted)]">
                          Tipo: {record.type}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isRecordVerified
                          ? 'text-[color:var(--color-success)]'
                          : 'text-[color:var(--color-warning)]'
                      }`}
                    >
                      {isRecordVerified ? 'OK' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-[color:var(--color-text)]">
                    {record?.value || '--'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="gap-1"
                      onClick={() => handleCopyRecord(record?.name, `${recordKeyBase}-name`)}
                    >
                      <Copy size={12} /> Nombre
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="gap-1"
                      onClick={() => handleCopyRecord(record?.value, `${recordKeyBase}-value`)}
                    >
                      <Copy size={12} /> Valor
                    </Button>
                    {copiedRecordKey === `${recordKeyBase}-name` && (
                      <span className="text-[11px] text-[color:var(--color-success)]">
                        Nombre copiado
                      </span>
                    )}
                    {copiedRecordKey === `${recordKeyBase}-value` && (
                      <span className="text-[11px] text-[color:var(--color-success)]">
                        Valor copiado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {pending && records.length > 0 && (
            <p className="text-[11px] text-[color:var(--color-warning)]">
              Una vez que tu proveedor DNS propague los cambios volveremos a comprobar estos valores
              autom�ticamente.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="layout-container max-w-4xl space-y-6 px-4 pb-16 pt-8">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
          Configuraci�n de tu correo MaLove.App
        </h1>
      </div>

      <div className="rounded-xl border border-[color:var(--color-primary-40)] bg-[color:var(--color-primary-10)] px-4 py-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[color:var(--color-primary)]" />
          <p className="text-sm text-[color:var(--color-text)]">
            Configura tu direcci�n de correo personalizada para comunicarte con proveedores y otros
            usuarios desde la plataforma MaLove.App.
          </p>
        </div>
      </div>

      {generalError && (
        <div className="rounded-xl border border-[color:var(--color-danger-50)] bg-[color:var(--color-danger-10)] px-4 py-4 text-sm text-[color:var(--color-danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>{generalError}</p>
          </div>
        </div>
      )}

      {error && !generalError && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-[color:var(--color-success-40)] bg-[color:var(--color-success-10)] px-4 py-4 text-sm text-[color:var(--color-success)]">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5" />
            <p>
              �Tu direcci�n de correo <strong>{currentUsername}@mywed360</strong> ha sido guardada
              con �xito!
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[color:var(--color-primary)]"></div>
        </div>
      ) : (
        <>
          {currentUsername ? (
            <div className="mb-6 space-y-2">
              <p className="text-[color:var(--color-text)]">
                Ya tienes configurada tu direcci�n de correo MaLove.App:
                <strong className="ml-2 text-lg">{currentUsername}@mywed360</strong>
              </p>
              <p className="text-sm text-[color:var(--color-muted)]">
                Puedes cambiarla a continuaci�n si deseas una direcci�n diferente:
              </p>
            </div>
          ) : null}

          <EmailSetupForm
            onSave={handleSaveUsername}
            onCheckAvailability={checkUsernameAvailability}
            defaultUsername={currentUsername || ''}
          />

          <div className="mt-10 border-t border-[color:var(--color-border)] pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
                Verificaci�n DNS (DKIM / SPF / DMARC)
              </h2>
              <div className="mt-1 space-y-1 text-xs text-[color:var(--color-muted)]">
                <p>
                  Dominio monitorizado:{' '}
                  <span className="font-medium text-[color:var(--color-text)]">
                    {dnsStatus?.domain || 'sin configurar'}
                  </span>
                </p>
                <p>
                  �ltima comprobaci�n:{' '}
                  {lastDnsCheckLabel || 'pendiente'}
                  {dnsAutoRefreshing ? ' " Revisando cada 30s' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDnsStatus}
                disabled={dnsLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} className={dnsLoading ? 'animate-spin' : ' '} />
                {dnsLoading ? 'Comprobando...' : 'Revisar ahora'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
                onClick={() => navigate('/email/test')}
              >
                <ExternalLink size={14} /> Diagn�stico avanzado
              </Button>
            </div>
          </div>
          {dnsLoading ? (
            <div className="mt-4 flex items-center text-sm text-[color:var(--color-muted)]">
              <Loader2 size={16} className="mr-2 animate-spin" />
              <span>Consultando registros publicados...</span>
            </div>
          ) : dnsError ? (
            <div className="mt-4 flex items-center text-sm text-[color:var(--color-danger)]">
              <AlertCircle size={16} className="mr-2" />
              <span>{dnsError}</span>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderDnsCard('dkim', 'DKIM')}
              {renderDnsCard('spf', 'SPF')}
              {renderDnsCard('dmarc', 'DMARC (opcional)')}
            </div>
          )}

          <div className="mt-10 border-t border-[color:var(--color-border)] pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
                Env�o de correo de prueba
              </h2>
              <Button
                variant="outline"
                size="sm"
                disabled={testEmailStatus.status === 'running' || !currentUsername}
                onClick={() => currentUsername && runAliasVerification(currentUsername)}
                className="flex items-center gap-2"
              >
                {testEmailStatus.status === 'running' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {testEmailStatus.status === 'running' ? 'Enviando...' : 'Enviar correo de prueba'}
              </Button>
            </div>
            <div className="mt-4 text-sm">
              {testEmailStatus.status === 'success' && (
                <div className="flex items-center text-[color:var(--color-success)]">
                  <ShieldCheck size={16} className="mr-2" />
                  <span>
                    Correo de prueba enviado correctamente a {auth.currentUser?.email}. Revisa tu bandeja para confirmar.
                  </span>
                </div>
              )}
              {testEmailStatus.status === 'error' && (
                <div className="flex items-center text-[color:var(--color-danger)]">
                  <AlertCircle size={16} className="mr-2" />
                  <span>{testEmailStatus.error || 'No se pudo enviar el correo de prueba.'}</span>
                </div>
              )}
              {testEmailStatus.status === 'idle' && (
                <p className="text-[color:var(--color-muted)]">
                  Enviaremos un correo de verificaci�n cuando DKIM y SPF est�n listos. Tambi�n puedes
                  reenviarlo manualmente en cualquier momento.
                </p>
              )}
              {!dnsFullyVerified && (
                <p className="mt-2 text-xs text-[color:var(--color-warning)]">
                  A�n vemos registros DKIM/SPF pendientes. Mailgun puede rechazar el env�o de prueba hasta que se propaguen los cambios.
                </p>
              )}
            </div>
          </div>

          {currentUsername && (
            <div className="mt-8 border-t border-[color:var(--color-border)] pt-6">
              <h2 className="mb-3 text-lg font-semibold text-[color:var(--color-text)]">
                �Qu� puedo hacer con mi correo MaLove.App?
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[color:var(--color-muted)]">
                <li>Enviar y recibir emails desde la plataforma</li>
                <li>Comunicarte directamente con proveedores sin exponer tu correo personal</li>
                <li>Recibir notificaciones importantes sobre tu boda</li>
                <li>Centralizar todas las comunicaciones relacionadas con tu evento</li>
              </ul>

              <div className="mt-6">
                <Button onClick={() => navigate('/email/inbox')} className="mr-4">
                  Ir a mi bandeja de entrada
                </Button>
                <Button variant="outline" onClick={() => navigate('/email/compose')}>
                  Escribir nuevo correo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailSetup;
