import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  fetchAnniversaryAutomation,
  fetchPartnerSummaryAutomation,
  runAnniversaryAutomation,
  runPartnerSummaryAutomation,
  updateAnniversaryAutomation,
  updatePartnerSummaryAutomation,
} from '../../services/adminAutomationsService';
import { performanceMonitor } from '../../services/PerformanceMonitor';

const DEFAULT_ANNIVERSARY_CONFIG = {
  enabled: false,
  sendHourUtc: 9,
  sendMinuteUtc: 0,
  daysOffset: 0,
  includePlanners: false,
  defaultCountryCode: '+34',
  template:
    '¡Feliz aniversario {{couple_names}}! Gracias por confiar en MaLoveApp para vuestro gran día. Aquí tenéis vuestro álbum de recuerdos: {{album_link}}',
};

const DEFAULT_PARTNER_CONFIG = {
  enabled: false,
  dayOfMonth: 1,
  sendHourUtc: 9,
  sendMinuteUtc: 0,
  thresholdPending: 50,
  autoPay: false,
  channel: 'whatsapp',
  defaultCountryCode: '+34',
  paymentLinkBase: '',
  template:
    'Hola {{partner_name}}, aquí tienes tu resumen de {{month}}. Cierres: {{deals}}. Comisión del mes: {{total_earned}}. Pendiente por cobrar: {{pending_amount}}. ¡Gracias por seguir recomendándonos!',
};

const getAnniversaryPlaceholders = (t) => [
  { token: '{{couple_names}}', description: t('admin:automations.placeholders.coupleNames') },
  { token: '{{wedding_name}}', description: t('admin:automations.placeholders.weddingName') },
  { token: '{{wedding_date}}', description: t('admin:automations.placeholders.weddingDate') },
  { token: '{{album_link}}', description: t('admin:automations.placeholders.albumLink') },
  { token: '{{year}}', description: t('admin:automations.placeholders.year') },
];

const getPartnerPlaceholders = (t) => [
  { token: '{{partner_name}}', description: t('admin:automations.placeholders.partnerName') },
  { token: '{{month}}', description: t('admin:automations.placeholders.month') },
  { token: '{{deals}}', description: t('admin:automations.placeholders.deals') },
  { token: '{{total_earned}}', description: t('admin:automations.placeholders.totalEarned') },
  { token: '{{pending_amount}}', description: t('admin:automations.placeholders.pendingAmount') },
  { token: '{{currency}}', description: t('admin:automations.placeholders.currency') },
  { token: '{{payment_link}}', description: t('admin:automations.placeholders.paymentLink') },
];

const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const MINUTES = [0, 15, 30, 45];
const getChannelOptions = (t) => [
  { value: 'whatsapp', label: t('admin:automations.channels.whatsapp') },
  { value: 'whatsapp_email', label: t('admin:automations.channels.whatsappEmail') },
];

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const date =
      typeof value === 'string'
        ? new Date(value)
        : typeof value.toDate === 'function'
          ? value.toDate()
          : new Date(value);
    return date.toLocaleString('es-ES', { hour12: false });
  } catch {
    return String(value);
  }
};

const formatCurrency = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    const val = Number(amount) || 0;
    return `${val.toFixed(2)} ${currency}`;
  }
};

export default function AdminAutomations() {
  const { t } = useTranslation(['admin']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partnerError, setPartnerError] = useState('');

  const [anniversaryConfig, setAnniversaryConfig] = useState(DEFAULT_ANNIVERSARY_CONFIG);
  const [partnerConfig, setPartnerConfig] = useState(DEFAULT_PARTNER_CONFIG);

  const [anniversaryLastRun, setAnniversaryLastRun] = useState(null);
  const [partnerLastRun, setPartnerLastRun] = useState(null);

  const [savingAnniversary, setSavingAnniversary] = useState(false);
  const [runningAnniversary, setRunningAnniversary] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [runningPartner, setRunningPartner] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setPartnerError('');
      try {
        const [anniv, partner] = await Promise.all([
          fetchAnniversaryAutomation({ silent: true }),
          fetchPartnerSummaryAutomation({ silent: true }),
        ]);
        if (!active) return;
        setAnniversaryConfig({ ...DEFAULT_ANNIVERSARY_CONFIG, ...(anniv?.config || {}) });
        setAnniversaryLastRun(anniv?.lastRun || null);
        setPartnerConfig({ ...DEFAULT_PARTNER_CONFIG, ...(partner?.config || {}) });
        setPartnerLastRun(partner?.lastRun || null);
      } catch (err) {
        if (!active) return;
        setError(err?.message || t('admin:automations.runError'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const anniversarySummary = useMemo(() => {
    if (!anniversaryLastRun) return null;
    return {
      attempted: formatDateTime(anniversaryLastRun.attempted || anniversaryLastRun.executedAt),
      processed: anniversaryLastRun.processed ?? 0,
      sent: anniversaryLastRun.sent ?? 0,
      skipped: anniversaryLastRun.skipped ?? 0,
      errors: anniversaryLastRun.errors ?? 0,
      dryRun: anniversaryLastRun.dryRun ?? false,
      notes: Array.isArray(anniversaryLastRun.notes) ? anniversaryLastRun.notes : [],
    };
  }, [anniversaryLastRun]);

  const partnerSummary = useMemo(() => {
    if (!partnerLastRun) return null;
    return {
      attempted: formatDateTime(partnerLastRun.attempted || partnerLastRun.executedAt),
      processed: partnerLastRun.processed ?? 0,
      sent: partnerLastRun.sent ?? 0,
      skipped: partnerLastRun.skipped ?? 0,
      errors: partnerLastRun.errors ?? 0,
      dryRun: partnerLastRun.dryRun ?? false,
      notes: Array.isArray(partnerLastRun.notes) ? partnerLastRun.notes : [],
      period: partnerLastRun.period || partnerLastRun.periodLabel || '—',
      previews: Array.isArray(partnerLastRun.previews)
        ? partnerLastRun.previews.slice(0, 5)
        : [],
    };
  }, [partnerLastRun]);

  const handleAnniversaryToggle = (event) => {
    setAnniversaryConfig((prev) => ({ ...prev, enabled: event.target.checked }));
  };

  const handleAnniversaryChange = (prop) => (event) => {
    const value = event.target.value;
    setAnniversaryConfig((prev) => ({
      ...prev,
      [prop]: prop === 'daysOffset' ? Number(value) || 0 : value,
    }));
  };

  const handleAnniversarySelect = (prop) => (event) => {
    setAnniversaryConfig((prev) => ({
      ...prev,
      [prop]: Number(event.target.value) || 0,
    }));
  };

  const handleAnniversaryIncludePlanners = (event) => {
    setAnniversaryConfig((prev) => ({ ...prev, includePlanners: event.target.checked }));
  };

  const saveAnniversary = async () => {
    setSavingAnniversary(true);
    setError('');
    try {
      await updateAnniversaryAutomation({ config: anniversaryConfig });
      performanceMonitor?.logEvent?.('admin_automation_saved', { type: 'anniversary' });
    } catch (err) {
      setError(err?.message || t('admin:automations.saveError'));
    } finally {
      setSavingAnniversary(false);
    }
  };

  const runAnniversary = async (dryRun = false) => {
    setRunningAnniversary(true);
    setError('');
    try {
      const result = await runAnniversaryAutomation({ dryRun });
      setAnniversaryLastRun({
        ...(result || {}),
        attempted: new Date().toISOString(),
      });
      performanceMonitor?.logEvent?.('admin_automation_run', {
        type: 'anniversary',
        dryRun,
        sent: result?.sent || 0,
        processed: result?.processed || 0,
      });
    } catch (err) {
      setError(err?.message || t('admin:automations.runError'));
    } finally {
      setRunningAnniversary(false);
    }
  };

  const handlePartnerToggle = (event) => {
    setPartnerConfig((prev) => ({ ...prev, enabled: event.target.checked }));
  };

  const handlePartnerChange = (prop) => (event) => {
    const value = event.target.value;
    let parsed = value;
    if (prop === 'dayOfMonth' || prop === 'thresholdPending') {
      parsed = Number(value) || 0;
    }
    setPartnerConfig((prev) => ({
      ...prev,
      [prop]: parsed,
    }));
  };

  const handlePartnerSelect = (prop) => (event) => {
    setPartnerConfig((prev) => ({
      ...prev,
      [prop]: Number(event.target.value) || 0,
    }));
  };

  const handlePartnerSwitch = (prop) => (event) => {
    setPartnerConfig((prev) => ({ ...prev, [prop]: event.target.checked }));
  };

  const savePartnerConfig = async () => {
    setSavingPartner(true);
    setPartnerError('');
    try {
      await updatePartnerSummaryAutomation({ config: partnerConfig });
      performanceMonitor?.logEvent?.('admin_automation_saved', { type: 'partner_summary' });
    } catch (err) {
      setPartnerError(err?.message || t('admin:automations.saveError'));
    } finally {
      setSavingPartner(false);
    }
  };

  const runPartnerAutomation = async (dryRun = false) => {
    setRunningPartner(true);
    setPartnerError('');
    try {
      const result = await runPartnerSummaryAutomation({ dryRun });
      setPartnerLastRun({
        ...(result || {}),
        attempted: new Date().toISOString(),
      });
      performanceMonitor?.logEvent?.('admin_automation_run', {
        type: 'partner_summary',
        dryRun,
        sent: result?.sent || 0,
        processed: result?.processed || 0,
      });
    } catch (err) {
      setPartnerError(err?.message || t('admin:automations.runError'));
    } finally {
      setRunningPartner(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex h-96 items-center justify-center">
        <Typography variant="body1">{t('admin:automations.loading')}</Typography>
      </Box>
    );
  }

  const ANNIVERSARY_PLACEHOLDERS = getAnniversaryPlaceholders(t);
  const PARTNER_PLACEHOLDERS = getPartnerPlaceholders(t);
  const CHANNEL_OPTIONS = getChannelOptions(t);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('admin:automations.title')}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {t('admin:automations.description')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title={t('admin:automations.anniversary.title')}
          subheader={t('admin:automations.anniversary.subtitle')}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1">{t('admin:automations.anniversary.status')}</Typography>
                <Switch
                  color="primary"
                  checked={Boolean(anniversaryConfig.enabled)}
                  onChange={handleAnniversaryToggle}
                  inputProps={{ 'aria-label': t('admin:automations.anniversary.title') }}
                />
                <Typography variant="body2" color="textSecondary">
                  {anniversaryConfig.enabled ? t('admin:automations.anniversary.active') : t('admin:automations.anniversary.paused')}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('admin:automations.anniversary.hourUtc')}
                value={Number(anniversaryConfig.sendHourUtc ?? 9)}
                onChange={handleAnniversarySelect('sendHourUtc')}
                SelectProps={{ native: true }}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('admin:automations.anniversary.minute')}
                value={Number(anniversaryConfig.sendMinuteUtc ?? 0)}
                onChange={handleAnniversarySelect('sendMinuteUtc')}
                SelectProps={{ native: true }}
              >
                {MINUTES.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('admin:automations.anniversary.daysOffset')}
                helperText={t('admin:automations.anniversary.daysOffsetHelp')}
                fullWidth
                type="number"
                value={Number(anniversaryConfig.daysOffset ?? 0)}
                onChange={handleAnniversaryChange('daysOffset')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('admin:automations.anniversary.defaultCountryCode')}
                helperText={t('admin:automations.anniversary.defaultCountryCodeHelp')}
                fullWidth
                value={anniversaryConfig.defaultCountryCode || ''}
                onChange={handleAnniversaryChange('defaultCountryCode')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Switch
                  color="primary"
                  checked={Boolean(anniversaryConfig.includePlanners)}
                  onChange={handleAnniversaryIncludePlanners}
                  inputProps={{ 'aria-label': t('admin:automations.anniversary.includePlanners') }}
                />
                <Typography variant="body2">{t('admin:automations.anniversary.includePlanners')}</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('admin:automations.anniversary.messageTemplate')}
                multiline
                minRows={4}
                fullWidth
                value={anniversaryConfig.template || ''}
                onChange={handleAnniversaryChange('template')}
              />
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {t('admin:automations.anniversary.placeholders')}
                </Typography>
                <ul className="mt-1 space-y-1 text-sm text-[color:var(--color-text-soft)]">
                  {ANNIVERSARY_PLACEHOLDERS.map((item) => (
                    <li key={item.token}>
                      <code>{item.token}</code> — {item.description}
                    </li>
                  ))}
                </ul>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveAnniversary}
                  disabled={savingAnniversary}
                >
                  {savingAnniversary ? t('admin:automations.anniversary.saving') : t('admin:automations.anniversary.saveChanges')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => runAnniversary(true)}
                  disabled={runningAnniversary}
                >
                  {runningAnniversary ? t('admin:automations.anniversary.processing') : t('admin:automations.anniversary.testWithoutSending')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => runAnniversary(false)}
                  disabled={runningAnniversary}
                >
                  {runningAnniversary ? t('admin:automations.anniversary.processing') : t('admin:automations.anniversary.runNow')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {anniversarySummary && (
        <Card>
          <CardHeader title={t('admin:automations.lastRun.anniversaryTitle')} />
          <CardContent>
            <Typography variant="body2" gutterBottom>
              {t('admin:automations.lastRun.date', { date: anniversarySummary.attempted })}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={2}>
              <Typography variant="body2">{t('admin:automations.lastRun.processed', { count: anniversarySummary.processed })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.sent', { count: anniversarySummary.sent })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.skipped', { count: anniversarySummary.skipped })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.errors', { count: anniversarySummary.errors })}</Typography>
              <Typography variant="body2">
                {t('admin:automations.lastRun.mode', { mode: anniversarySummary.dryRun ? t('admin:automations.lastRun.simulation') : t('admin:automations.lastRun.real') })}
              </Typography>
            </Stack>
            {anniversarySummary.notes.length > 0 && (
              <Box>
                <Typography variant="subtitle2">{t('admin:automations.lastRun.notes')}</Typography>
                <ul className="list-disc pl-5 text-sm text-[color:var(--color-text)]">
                  {anniversarySummary.notes.map((note, idx) => (
                    <li key={`anniv-note-${idx}`}>{note}</li>
                  ))}
                </ul>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title={t('admin:automations.partner.title')}
          subheader={t('admin:automations.partner.subtitle')}
        />
        <CardContent>
          {partnerError && (
            <Box mb={2}>
              <Alert severity="error" onClose={() => setPartnerError('')}>
                {partnerError}
              </Alert>
            </Box>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1">{t('admin:automations.partner.status')}</Typography>
                <Switch
                  color="primary"
                  checked={Boolean(partnerConfig.enabled)}
                  onChange={handlePartnerToggle}
                  inputProps={{ 'aria-label': t('admin:automations.partner.title') }}
                />
                <Typography variant="body2" color="textSecondary">
                  {partnerConfig.enabled ? t('admin:automations.partner.active') : t('admin:automations.partner.paused')}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label={t('admin:automations.partner.dayOfMonth')}
                helperText={t('admin:automations.partner.dayOfMonthHelp')}
                fullWidth
                type="number"
                value={Number(partnerConfig.dayOfMonth ?? 1)}
                onChange={handlePartnerChange('dayOfMonth')}
                inputProps={{ min: 1, max: 28 }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('admin:automations.partner.hourUtc')}
                value={Number(partnerConfig.sendHourUtc ?? 9)}
                onChange={handlePartnerSelect('sendHourUtc')}
                SelectProps={{ native: true }}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('admin:automations.partner.minute')}
                value={Number(partnerConfig.sendMinuteUtc ?? 0)}
                onChange={handlePartnerSelect('sendMinuteUtc')}
                SelectProps={{ native: true }}
              >
                {MINUTES.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('admin:automations.partner.channel')}
                value={partnerConfig.channel || 'whatsapp'}
                onChange={handlePartnerChange('channel')}
                SelectProps={{ native: true }}
              >
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('admin:automations.partner.thresholdMin')}
                helperText={t('admin:automations.partner.thresholdMinHelp')}
                fullWidth
                type="number"
                value={Number(partnerConfig.thresholdPending ?? 0)}
                onChange={handlePartnerChange('thresholdPending')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Switch
                  color="primary"
                  checked={Boolean(partnerConfig.autoPay)}
                  onChange={handlePartnerSwitch('autoPay')}
                  inputProps={{ 'aria-label': t('admin:automations.partner.autoPay') }}
                />
                <Typography variant="body2">
                  {t('admin:automations.partner.autoPay')}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('admin:automations.partner.defaultCountryCode')}
                fullWidth
                value={partnerConfig.defaultCountryCode || ''}
                onChange={handlePartnerChange('defaultCountryCode')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('admin:automations.partner.paymentLinkBase')}
                helperText={t('admin:automations.partner.paymentLinkBaseHelp')}
                fullWidth
                value={partnerConfig.paymentLinkBase || ''}
                onChange={handlePartnerChange('paymentLinkBase')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('admin:automations.partner.messageTemplate')}
                multiline
                minRows={4}
                fullWidth
                value={partnerConfig.template || ''}
                onChange={handlePartnerChange('template')}
              />
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  {t('admin:automations.partner.placeholders')}
                </Typography>
                <ul className="mt-1 space-y-1 text-sm text-[color:var(--color-text-soft)]">
                  {PARTNER_PLACEHOLDERS.map((item) => (
                    <li key={item.token}>
                      <code>{item.token}</code> — {item.description}
                    </li>
                  ))}
                </ul>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={savePartnerConfig}
                  disabled={savingPartner}
                >
                  {savingPartner ? t('admin:automations.partner.saving') : t('admin:automations.partner.saveChanges')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => runPartnerAutomation(true)}
                  disabled={runningPartner}
                >
                  {runningPartner ? t('admin:automations.partner.processing') : t('admin:automations.partner.testWithoutSending')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => runPartnerAutomation(false)}
                  disabled={runningPartner}
                >
                  {runningPartner ? t('admin:automations.partner.processing') : t('admin:automations.partner.runNow')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {partnerSummary && (
        <Card>
          <CardHeader title={t('admin:automations.lastRun.partnerTitle', { period: partnerSummary.period || '—' })} />
          <CardContent>
            <Typography variant="body2" gutterBottom>
              {t('admin:automations.lastRun.date', { date: partnerSummary.attempted })}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={2}>
              <Typography variant="body2">{t('admin:automations.lastRun.processed', { count: partnerSummary.processed })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.sent', { count: partnerSummary.sent })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.skipped', { count: partnerSummary.skipped })}</Typography>
              <Typography variant="body2">{t('admin:automations.lastRun.errors', { count: partnerSummary.errors })}</Typography>
              <Typography variant="body2">
                {t('admin:automations.lastRun.mode', { mode: partnerSummary.dryRun ? t('admin:automations.lastRun.simulation') : t('admin:automations.lastRun.real') })}
              </Typography>
            </Stack>
            {partnerSummary.notes.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2">{t('admin:automations.lastRun.notes')}</Typography>
                <ul className="list-disc pl-5 text-sm text-[color:var(--color-text)]">
                  {partnerSummary.notes.map((note, idx) => (
                    <li key={`partner-note-${idx}`}>{note}</li>
                  ))}
                </ul>
              </Box>
            )}
            {partnerSummary.previews.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('admin:automations.lastRun.previews')}
                </Typography>
                <ul className="space-y-1 text-sm text-[color:var(--color-text)]">
                  {partnerSummary.previews.map((preview, idx) => (
                    <li key={`partner-preview-${idx}`} className="rounded border border-soft px-3 py-2">
                      <strong>{preview.partnerName || preview.partnerId}</strong> —
                      {` ${preview.deals} ${t('admin:automations.lastRun.deals')} · ${t('admin:automations.lastRun.commission')} ${formatCurrency(preview.periodCommission, preview.currency)}`}
                      {preview.pendingAmount > 0 && (
                        <span>
                          {' '}
                          · {t('admin:automations.lastRun.pending')} {formatCurrency(preview.pendingAmount, preview.currency)}
                        </span>
                      )}
                      {preview.recipient && <span> · {t('admin:automations.lastRun.recipient')} {preview.recipient}</span>}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
