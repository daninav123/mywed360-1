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

import {
  fetchAnniversaryAutomation,
  fetchPartnerSummaryAutomation,
  runAnniversaryAutomation,
  runPartnerSummaryAutomation,
  updateAnniversaryAutomation,
  updatePartnerSummaryAutomation,
} from '../../services/adminAutomationsService';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { useTranslations } from '../../hooks/useTranslations';

const DEFAULT_ANNIVERSARY_CONFIG = {
  const { t } = useTranslations();

  enabled: false,
  sendHourUtc: 9,
  sendMinuteUtc: 0,
  daysOffset: 0,
  includePlanners: false,
  defaultCountryCode: '+34',
  template:
    {t('common.feliz_aniversario_couplenames_gracias_por')},
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
    {t('common.hola_partnername_aqui_tienes_resumen')},
};

const ANNIVERSARY_PLACEHOLDERS = [
  { token: '{{couple_names}}', description: 'Nombres de la pareja anfitriona.' },
  { token: '{{wedding_name}}', description: 'Nombre de la boda/evento.' },
  { token: '{{wedding_date}}', description: 'Fecha original de la boda.' },
  { token: '{{album_link}}', description: {t('common.enlace_galeria_momentos_existe')} },
  { token: '{{year}}', description: {t('common.numero_anos_cumplidos')} },
];

const PARTNER_PLACEHOLDERS = [
  { token: '{{partner_name}}', description: 'Nombre del partner/comercial.' },
  { token: '{{month}}', description: 'Mes del resumen (ej. septiembre 2025).' },
  { token: '{{deals}}', description: {t('common.numero_cierres_captados_periodo')} },
  { token: '{{total_earned}}', description: {t('common.comision_generada_periodo')} },
  { token: '{{pending_amount}}', description: 'Importe pendiente de pago.' },
  { token: '{{currency}}', description: {t('common.codigo_moneda_eur_usd')} },
  { token: '{{payment_link}}', description: 'Enlace para subir factura o revisar pagos.' },
];

const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const MINUTES = [0, 15, 30, 45];
const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'whatsapp_email', label: {t('common.whatsapp_email_proximamente')} },
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
        setError(err?.message || 'No se pudieron cargar las automatizaciones.');
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
      setError(err?.message || {t('common.pudo_guardar_configuracion')});
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
      setError(err?.message || {t('common.pudo_ejecutar_automatizacion')});
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
      setPartnerError(err?.message || {t('common.pudo_guardar_configuracion')});
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
      setPartnerError(err?.message || 'No se pudo ejecutar el resumen mensual.');
    } finally {
      setRunningPartner(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex h-96 items-center justify-center">
        <Typography variant="body1">Cargando automatizaciones...</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Automatizaciones
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configura y lanza los flujos automáticos clave (WhatsApp aniversario, resumen mensual de partners).
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="WhatsApp primer aniversario"
          subheader={t('common.felicitacion_automatica_para_pareja_anfitriona')}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1">Estado</Typography>
                <Switch
                  color="primary"
                  checked={Boolean(anniversaryConfig.enabled)}
                  onChange={handleAnniversaryToggle}
                  inputProps={{ 'aria-label': 'Activar WhatsApp aniversario' }}
                />
                <Typography variant="body2" color="textSecondary">
                  {anniversaryConfig.enabled ? {t('common.automatizacion_activa')} : {t('common.automatizacion_pausada')}}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label="Hora (UTC)"
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
                label="Minuto"
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
                label={t('common.desplazamiento_dias')}
                helperText={t('common.dia_del_aniversario_dia_anterior')}
                fullWidth
                type="number"
                value={Number(anniversaryConfig.daysOffset ?? 0)}
                onChange={handleAnniversaryChange('daysOffset')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('common.codigo_pais_por_defecto')}
                helperText={t('common.antepone_cuando_telefono_tiene_prefijo')}
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
                  inputProps={{ 'aria-label': 'Incluir planner principal' }}
                />
                <Typography variant="body2">Enviar copia al planner principal</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Plantilla de mensaje"
                multiline
                minRows={4}
                fullWidth
                value={anniversaryConfig.template || ''}
                onChange={handleAnniversaryChange('template')}
              />
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  Placeholders disponibles:
                </Typography>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-text-soft,#6b7280)]">
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
                  {savingAnniversary ? 'Guardando…' : 'Guardar cambios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => runAnniversary(true)}
                  disabled={runningAnniversary}
                >
                  {runningAnniversary ? 'Procesando…' : 'Probar (sin enviar)'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => runAnniversary(false)}
                  disabled={runningAnniversary}
                >
                  {runningAnniversary ? 'Procesando…' : 'Ejecutar ahora'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {anniversarySummary && (
        <Card>
          <CardHeader title={t('common.ultima_ejecucion_aniversario')} />
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Fecha: {anniversarySummary.attempted}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={2}>
              <Typography variant="body2">Procesadas: {anniversarySummary.processed}</Typography>
              <Typography variant="body2">Enviadas: {anniversarySummary.sent}</Typography>
              <Typography variant="body2">Omitidas: {anniversarySummary.skipped}</Typography>
              <Typography variant="body2">Errores: {anniversarySummary.errors}</Typography>
              <Typography variant="body2">
                Modo: {anniversarySummary.dryRun ? {t('common.simulacion')} : 'Real'}
              </Typography>
            </Stack>
            {anniversarySummary.notes.length > 0 && (
              <Box>
                <Typography variant="subtitle2">Notas</Typography>
                <ul className="list-disc pl-5 text-sm text-[var(--color-text,#111827)]">
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
          title="Resumen mensual partners (WhatsApp)"
          subheader="Informa a comerciales e influencers de sus resultados mensuales y pendientes de cobro."
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
                <Typography variant="subtitle1">Estado</Typography>
                <Switch
                  color="primary"
                  checked={Boolean(partnerConfig.enabled)}
                  onChange={handlePartnerToggle}
                  inputProps={{ 'aria-label': 'Activar resumen partners' }}
                />
                <Typography variant="body2" color="textSecondary">
                  {partnerConfig.enabled ? {t('common.automatizacion_activa')} : {t('common.automatizacion_pausada')}}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label={t('common.dia_del_mes')}
                helperText="Se recomienda entre el 1 y el 5."
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
                label="Hora (UTC)"
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
                label="Minuto"
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
                label="Canal"
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
                label={t('common.umbral_minimo_eur')}
                helperText={t('common.comision_pendiente_menor_omite_aviso')}
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
                  inputProps={{ 'aria-label': 'Pago automático Revolut' }}
                />
                <Typography variant="body2">
                  Solicitar payout automático (Revolut). Requiere contrapartes validadas.
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t('common.codigo_pais_por_defecto')}
                fullWidth
                value={partnerConfig.defaultCountryCode || ''}
                onChange={handlePartnerChange('defaultCountryCode')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Base enlace de pagos/facturas"
                helperText="URL opcional para que el partner suba factura o vea sus pagos (ej. https://lovenda.app/partners)"
                fullWidth
                value={partnerConfig.paymentLinkBase || ''}
                onChange={handlePartnerChange('paymentLinkBase')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Plantilla de mensaje"
                multiline
                minRows={4}
                fullWidth
                value={partnerConfig.template || ''}
                onChange={handlePartnerChange('template')}
              />
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  Placeholders disponibles:
                </Typography>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-text-soft,#6b7280)]">
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
                  {savingPartner ? 'Guardando…' : 'Guardar cambios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => runPartnerAutomation(true)}
                  disabled={runningPartner}
                >
                  {runningPartner ? 'Procesando…' : 'Probar (sin enviar)'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => runPartnerAutomation(false)}
                  disabled={runningPartner}
                >
                  {runningPartner ? 'Procesando…' : 'Ejecutar ahora'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {partnerSummary && (
        <Card>
          <CardHeader title={`Última ejecución (partners • ${partnerSummary.period || '—'})`} />
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Fecha: {partnerSummary.attempted}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={2}>
              <Typography variant="body2">Procesadas: {partnerSummary.processed}</Typography>
              <Typography variant="body2">Enviadas: {partnerSummary.sent}</Typography>
              <Typography variant="body2">Omitidas: {partnerSummary.skipped}</Typography>
              <Typography variant="body2">Errores: {partnerSummary.errors}</Typography>
              <Typography variant="body2">
                Modo: {partnerSummary.dryRun ? {t('common.simulacion')} : 'Real'}
              </Typography>
            </Stack>
            {partnerSummary.notes.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2">Notas</Typography>
                <ul className="list-disc pl-5 text-sm text-[var(--color-text,#111827)]">
                  {partnerSummary.notes.map((note, idx) => (
                    <li key={`partner-note-${idx}`}>{note}</li>
                  ))}
                </ul>
              </Box>
            )}
            {partnerSummary.previews.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Previsualizaciones (primeros 5)
                </Typography>
                <ul className="space-y-1 text-sm text-[var(--color-text,#111827)]">
                  {partnerSummary.previews.map((preview, idx) => (
                    <li key={`partner-preview-${idx}`} className="rounded border border-soft px-3 py-2">
                      <strong>{preview.partnerName || preview.partnerId}</strong> —
                      {` ${preview.deals} cierres · comisión ${formatCurrency(preview.periodCommission, preview.currency)}`}
                      {preview.pendingAmount > 0 && (
                        <span>
                          {' '}
                          · pendiente {formatCurrency(preview.pendingAmount, preview.currency)}
                        </span>
                      )}
                      {preview.recipient && <span> · destino {preview.recipient}</span>}
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
