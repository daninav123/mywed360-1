import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import TagsManager from './TagsManager';
import { useAuth } from '../../context/AuthContext';
import {
  getAutomationConfig,
  getAutomationConfigLastSync,
  updateAutomationConfig,
  reloadScheduledEmails,
  cancelScheduledEmail,
  syncAutomationConfigFromServer,
  syncAutomationStateFromServer,
} from '../../services/emailAutomationService';
import { createEmailAlias, initEmailService } from '../../services/emailService';
import Button from '../Button';
import WeddingAccountLink from '../settings/WeddingAccountLink';
import Card from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

const EmailSettings = () => {
  const { t, tVars, format } = useTranslations();
  const tEmail = useCallback((key, options) => t(key, { ns: 'email', ...options }), [t]);
  const tEmailVars = useCallback(
    (key, variables) => tVars(key, { ns: 'email', ...variables }),
    [tVars]
  );

  const defaultSubject = useMemo(
    () => tEmail('settings.autoReply.defaultSubject'),
    [tEmail]
  );
  const defaultGeneralAutoReply = useMemo(
    () => tEmail('settings.autoReply.generalDefault'),
    [tEmail]
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailAlias, setEmailAlias] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const { userProfile, updateUserProfile } = useAuth();
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplySubject, setAutoReplySubject] = useState(defaultSubject);
  const [generalAutoReply, setGeneralAutoReply] = useState(defaultGeneralAutoReply);
  const [providerAutoReply, setProviderAutoReply] = useState('');
  const [guestAutoReply, setGuestAutoReply] = useState('');
  const [financeAutoReply, setFinanceAutoReply] = useState('');
  const [contractAutoReply, setContractAutoReply] = useState('');
  const [invoiceAutoReply, setInvoiceAutoReply] = useState('');
  const [meetingAutoReply, setMeetingAutoReply] = useState('');
  const [rsvpAutoReply, setRsvpAutoReply] = useState('');
  const [autoReplyInterval, setAutoReplyInterval] = useState(24);
  const [autoReplyExclusions, setAutoReplyExclusions] = useState('');
  const [autoReplySaving, setAutoReplySaving] = useState(false);
  const [autoReplySuccess, setAutoReplySuccess] = useState(false);
  const [autoReplyError, setAutoReplyError] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSyncError, setConfigSyncError] = useState('');
  const [lastConfigSync, setLastConfigSync] = useState(getAutomationConfigLastSync());
  const isMountedRef = useRef(true);
  const previousDefaultSubject = useRef(defaultSubject);
  const previousDefaultMessage = useRef(defaultGeneralAutoReply);

  useEffect(() => {
    setAutoReplySubject((prev) =>
      !prev || prev === previousDefaultSubject.current ? defaultSubject : prev
    );
    previousDefaultSubject.current = defaultSubject;
  }, [defaultSubject]);

  useEffect(() => {
    setGeneralAutoReply((prev) =>
      !prev || prev === previousDefaultMessage.current ? defaultGeneralAutoReply : prev
    );
    previousDefaultMessage.current = defaultGeneralAutoReply;
  }, [defaultGeneralAutoReply]);

  const lastConfigSyncLabel = useMemo(() => {
    if (!lastConfigSync) {
      return tEmail('settings.autoReply.lastSyncPending');
    }
    try {
      return format.datetime(lastConfigSync);
    } catch {
      return String(lastConfigSync);
    }
  }, [lastConfigSync, format, tEmail]);

  const applyAutomationConfig = useCallback(
    (config) => {
      if (!config || typeof config !== 'object') return;
      const auto = config.autoReply || {};
      const generalMessage =
        auto.generalMessage && auto.generalMessage.trim()
          ? auto.generalMessage
          : defaultGeneralAutoReply;

      setAutoReplyEnabled(Boolean(auto.enabled));
      setAutoReplySubject(auto.subjectTemplate || defaultSubject);
      setGeneralAutoReply(generalMessage);
      setAutoReplyInterval(Number(auto.replyIntervalHours) || 24);
      setAutoReplyExclusions(
        Array.isArray(auto.excludeSenders) ? auto.excludeSenders.join(', ') : ''
      );

      const ensureMessage = (value) => (value && value.trim() ? value : generalMessage);
      const categories = auto.categories || {};

      setProviderAutoReply(ensureMessage(categories.Proveedor?.message));
      setGuestAutoReply(ensureMessage(categories.Invitado?.message));
      setFinanceAutoReply(ensureMessage(categories.Finanzas?.message));
      setContractAutoReply(ensureMessage(categories.Contratos?.message));
      setInvoiceAutoReply(ensureMessage(categories.Facturas?.message));
      setMeetingAutoReply(ensureMessage(categories.Reuniones?.message));
      setRsvpAutoReply(ensureMessage(categories.RSVP?.message));
    },
    [defaultGeneralAutoReply, defaultSubject]
  );

  useEffect(() => () => { isMountedRef.current = false; }, []);

  const refreshScheduledEmailsState = useCallback(
    async (force = false) => {
      try {
        const scheduled = await reloadScheduledEmails(force);
        if (isMountedRef.current) {
          setScheduledEmails(Array.isArray(scheduled) ? scheduled : []);
        }
      } catch (error) {
        console.error('Unable to load scheduled emails queue', error);
      }
    },
    []
  );

  useEffect(() => {
    if (!userProfile) return;
    const currentEmail = initEmailService(userProfile);
    setEmailAddress(currentEmail);
    setEmailAlias(userProfile.emailAlias || '');
  }, [userProfile]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setConfigLoading(true);
      setConfigSyncError('');

      const cached = getAutomationConfig();
      applyAutomationConfig(cached);
      setLastConfigSync(getAutomationConfigLastSync());

      try {
        await refreshScheduledEmailsState(true);
      } catch (error) {
        console.error('Unable to load scheduled emails queue', error);
      }

      try {
        const [remoteConfig] = await Promise.all([
          syncAutomationConfigFromServer(true),
          syncAutomationStateFromServer(true),
        ]);
        if (!cancelled && remoteConfig) {
          applyAutomationConfig(remoteConfig);
          setLastConfigSync(getAutomationConfigLastSync() || new Date().toISOString());
          setConfigSyncError('');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to sync automation configuration', error);
          setConfigSyncError(tEmail('settings.autoReply.errors.sync'));
        }
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [applyAutomationConfig, refreshScheduledEmailsState, tEmail]);

  const validateAlias = (alias) => {
    if (!alias) return false;
    if (alias.length < 3) return false;
    const validAliasRegex = /^[a-z0-9.]+$/;
    return validAliasRegex.test(alias);
  };

  const handleSaveAutoReply = async (event) => {
    event.preventDefault();
    setAutoReplyError('');
    setConfigSyncError('');
    setAutoReplySaving(true);

    try {
      const ensureMessage = (value) => (value && value.trim() ? value : generalAutoReply);
      const exclusions = autoReplyExclusions
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      const updatedConfig = await updateAutomationConfig({
        autoReply: {
          enabled: autoReplyEnabled,
          subjectTemplate: autoReplySubject || defaultSubject,
          generalMessage: generalAutoReply,
          replyIntervalHours: Number(autoReplyInterval) || 24,
          excludeSenders: exclusions,
          categories: {
            Proveedor: { enabled: true, message: ensureMessage(providerAutoReply) },
            Invitado: { enabled: true, message: ensureMessage(guestAutoReply) },
            Finanzas: { enabled: true, message: ensureMessage(financeAutoReply) },
            Contratos: { enabled: true, message: ensureMessage(contractAutoReply) },
            Facturas: { enabled: true, message: ensureMessage(invoiceAutoReply) },
            Reuniones: { enabled: true, message: ensureMessage(meetingAutoReply) },
            RSVP: { enabled: true, message: ensureMessage(rsvpAutoReply) },
          },
        },
      });
      applyAutomationConfig(updatedConfig);
      setAutoReplySuccess(true);
      setConfigSyncError('');
      setLastConfigSync(getAutomationConfigLastSync() || new Date().toISOString());
      setTimeout(() => setAutoReplySuccess(false), 2500);
    } catch (automationError) {
      setAutoReplyError(
        automationError?.message || tEmail('settings.autoReply.errors.save')
      );
      setAutoReplySuccess(false);
      setConfigSyncError(tEmail('settings.autoReply.errors.sync'));
    } finally {
      setAutoReplySaving(false);
    }
  };

  const handleCancelScheduledEmail = async (id) => {
    try {
      await cancelScheduledEmail(id);
    } catch (error) {
      console.error('Unable to cancel scheduled email', error);
    } finally {
      await refreshScheduledEmailsState(true);
    }
  };

  const handleChangeAlias = async (event) => {
    event.preventDefault();

    if (!validateAlias(newAlias)) {
      setError(tEmail('settings.alias.validationError'));
      return;
    }

    if (!userProfile) return;

    try {
      setLoading(true);
      setError('');

      const result = await createEmailAlias(userProfile, newAlias);

      if (result.success) {
        const updatedProfile = {
          ...userProfile,
          emailAlias: result.alias,
        };
        await updateUserProfile(updatedProfile);

        setEmailAddress(result.email);
        setEmailAlias(result.alias);
        setNewAlias('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (aliasError) {
      console.error('Error changing email alias:', aliasError);
      setError(
        tEmailVars('settings.alias.changeError', {
          message: aliasError?.message || 'unknown',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const aliasPlaceholder = emailAlias || tEmail('settings.alias.placeholder');
  const scheduledSubjectFallback = tEmail('settings.scheduled.subjectFallback');
  const scheduledToFallback = tEmail('settings.scheduled.toFallback');
  const scheduledDateFallback = tEmail('settings.scheduled.scheduledFallback');

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">{tEmail('settings.title')}</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-2">{tEmail('settings.address.title')}</h3>
          <p className="text-gray-600 mb-1">{tEmail('settings.address.description')}</p>
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="font-medium">{emailAddress}</p>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">{tEmail('settings.alias.title')}</h3>
          <p className="text-gray-600 mb-3">{tEmail('settings.alias.description')}</p>

          <form onSubmit={handleChangeAlias} className="space-y-3">
            <div>
              <label
                htmlFor="email-alias"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {tEmail('settings.alias.label')}
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="email-alias"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value.toLowerCase())}
                  className="flex-grow p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500"
                  placeholder={aliasPlaceholder}
                />
                <span className="bg-gray-100 p-2 border-r border-t border-b rounded-r-md flex items-center">
                  {tEmail('settings.alias.suffix')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{tEmail('settings.alias.helper')}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                <Check size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">{tEmail('settings.alias.success')}</p>
              </div>
            )}

            <Button type="submit" variant="default" disabled={loading || !newAlias}>
              {loading
                ? tEmail('settings.alias.button.loading')
                : tEmail('settings.alias.button.default')}
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">{tEmail('settings.notifications.title')}</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-new-email"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-new-email" className="ml-2 block text-sm text-gray-700">
                {tEmail('settings.notifications.newEmail')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-read"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-read" className="ml-2 block text-sm text-gray-700">
                {tEmail('settings.notifications.read')}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-md font-medium">
                {tEmail('settings.autoReply.title')}
              </h3>
              <p className="text-xs text-gray-500">
                {tEmailVars('settings.autoReply.lastSync', { value: lastConfigSyncLabel })}
              </p>
            </div>
            {configLoading && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 size={12} className="animate-spin" />{' '}
                {tEmail('settings.autoReply.syncing')}
              </span>
            )}
          </div>
          <p className="mt-2 mb-4 text-sm text-gray-600">
            {tEmail('settings.autoReply.description')}
          </p>
          {configSyncError && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {configSyncError}
            </div>
          )}
          {autoReplyError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {autoReplyError}
            </div>
          )}
          {autoReplySuccess && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {tEmail('settings.autoReply.success')}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSaveAutoReply}>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              />
              <span>{tEmail('settings.autoReply.enable')}</span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.fields.subject')}
                </label>
                <input
                  type="text"
                  value={autoReplySubject}
                  onChange={(e) => setAutoReplySubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.fields.interval.label')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={autoReplyInterval}
                  onChange={(e) => setAutoReplyInterval(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tEmail('settings.autoReply.fields.general')}
              </label>
              <textarea
                value={generalAutoReply}
                onChange={(e) => setGeneralAutoReply(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-1 text-xs text-gray-500">{tEmail('settings.autoReply.helper')}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.provider')}
                </label>
                <textarea
                  value={providerAutoReply}
                  onChange={(e) => setProviderAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.guest')}
                </label>
                <textarea
                  value={guestAutoReply}
                  onChange={(e) => setGuestAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.finance')}
                </label>
                <textarea
                  value={financeAutoReply}
                  onChange={(e) => setFinanceAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.contract')}
                </label>
                <textarea
                  value={contractAutoReply}
                  onChange={(e) => setContractAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.invoice')}
                </label>
                <textarea
                  value={invoiceAutoReply}
                  onChange={(e) => setInvoiceAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.meeting')}
                </label>
                <textarea
                  value={meetingAutoReply}
                  onChange={(e) => setMeetingAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tEmail('settings.autoReply.categories.rsvp')}
                </label>
                <textarea
                  value={rsvpAutoReply}
                  onChange={(e) => setRsvpAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tEmail('settings.autoReply.fields.exclusions.label')}
              </label>
              <input
                type="text"
                value={autoReplyExclusions}
                onChange={(e) => setAutoReplyExclusions(e.target.value)}
                placeholder={tEmail('settings.autoReply.fields.exclusions.placeholder')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={autoReplySaving || configLoading}>
                {autoReplySaving
                  ? tEmail('settings.autoReply.buttons.saving')
                  : tEmail('settings.autoReply.buttons.save')}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium mb-2">{tEmail('settings.scheduled.title')}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {tEmail('settings.scheduled.description')}
          </p>
          {scheduledEmails.length === 0 ? (
            <p className="text-sm text-gray-500">{tEmail('settings.scheduled.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {scheduledEmails.map((item) => {
                const subject = item.payload?.subject || scheduledSubjectFallback;
                const toValue = item.payload?.to || scheduledToFallback;
                const scheduledValue = item.scheduledAt
                  ? format.datetime(item.scheduledAt)
                  : scheduledDateFallback;
                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{subject}</p>
                      <p className="text-xs text-gray-600">
                        {tEmailVars('settings.scheduled.toLabel', { value: toValue })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {tEmailVars('settings.scheduled.scheduledLabel', {
                          value: scheduledValue,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleCancelScheduledEmail(item.id)}
                    >
                      {tEmail('settings.scheduled.buttons.cancel')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshScheduledEmailsState(true)}
            >
              {tEmail('settings.scheduled.buttons.refresh')}
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <TagsManager />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <WeddingAccountLink />
        </div>
      </div>
    </Card>
  );
};

export default EmailSettings;
