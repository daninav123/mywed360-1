import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import useTranslations from '../../hooks/useTranslations';
import {
  checkUsernameAvailability,
  sendEmail,
  validateEmail,
} from '../../services/mailgunService';

/**
 * Herramienta para verificar la integracion con Mailgun:
 * - Envio de emails
 * - Validacion de direcciones
 * - Comprobacion de disponibilidad de alias
 */
function MailgunTester() {
  const { t, tVars, i18n } = useTranslations();
  const tEmail = (key, options) => t(key, { ns: 'email', ...options });
  const tEmailVars = (key, variables) => tVars(key, { ns: 'email', ...variables });

  const sendPlaceholders = useMemo(
    () => ({
      from: tEmail('mailgunTester.sections.send.placeholders.from'),
      to: tEmail('mailgunTester.sections.send.placeholders.to'),
      subject: tEmail('mailgunTester.sections.send.placeholders.subject'),
      text: tEmail('mailgunTester.sections.send.placeholders.text'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  );

  const [sending, setSending] = useState(false);
  const [emailForm, setEmailForm] = useState(() => ({
    from: sendPlaceholders.from,
    to: '',
    subject: sendPlaceholders.subject,
    text: sendPlaceholders.text,
  }));

  const [validating, setValidating] = useState(false);
  const [emailToValidate, setEmailToValidate] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const [checking, setChecking] = useState(false);
  const [usernameToCheck, setUsernameToCheck] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleEmailFormChange = (event) => {
    const { name, value } = event.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendEmail = async (event) => {
    event.preventDefault();
    setSending(true);

    try {
      const result = await sendEmail(emailForm);
      setNotification({
        open: true,
        message: tEmailVars('mailgunTester.notifications.sendSuccess', {
          id: result?.messageId ?? 'N/A',
        }),
        severity: 'success',
      });
      // console.log('Respuesta del servidor:', result);
    } catch (error) {
      setNotification({
        open: true,
        message: tEmailVars('mailgunTester.notifications.sendError', {
          message: error?.message ?? 'unknown',
        }),
        severity: 'error',
      });
      // console.error('Error al enviar:', error);
    } finally {
      setSending(false);
    }
  };

  const handleValidateEmail = async (event) => {
    event.preventDefault();
    setValidating(true);

    try {
      const result = await validateEmail(emailToValidate);
      setValidationResult(result);
      setNotification({
        open: true,
        message: result.isValid
          ? tEmail('mailgunTester.validation.success')
          : tEmailVars('mailgunTester.validation.invalid', {
              reason:
                result.reason ||
                tEmail('mailgunTester.sections.validate.defaultReason'),
            }),
        severity: result.isValid ? 'success' : 'warning',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: tEmailVars('mailgunTester.notifications.validateError', {
          message: error?.message ?? 'unknown',
        }),
        severity: 'error',
      });
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleCheckAvailability = async (event) => {
    event.preventDefault();
    setChecking(true);

    try {
      const isAvailable = await checkUsernameAvailability(usernameToCheck);
      setAvailabilityResult(isAvailable);
      setNotification({
        open: true,
        message: isAvailable
          ? tEmailVars('mailgunTester.availability.available', {
              username: usernameToCheck,
            })
          : tEmailVars('mailgunTester.availability.unavailable', {
              username: usernameToCheck,
            }),
        severity: isAvailable ? 'success' : 'warning',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: tEmailVars('mailgunTester.notifications.availabilityError', {
          message: error?.message ?? 'unknown',
        }),
        severity: 'error',
      });
      setAvailabilityResult(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {tEmail('mailgunTester.title')}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        {tEmail('mailgunTester.subtitle')}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {tEmail('mailgunTester.sections.send.title')}
            </Typography>
            <Box component="form" onSubmit={handleSendEmail}>
              <TextField
                label={tEmail('mailgunTester.sections.send.fields.from')}
                name="from"
                value={emailForm.from}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                placeholder={sendPlaceholders.from}
                required
              />
              <TextField
                label={tEmail('mailgunTester.sections.send.fields.to')}
                name="to"
                value={emailForm.to}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                placeholder={sendPlaceholders.to}
                required
              />
              <TextField
                label={tEmail('mailgunTester.sections.send.fields.subject')}
                name="subject"
                value={emailForm.subject}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                placeholder={sendPlaceholders.subject}
                required
              />
              <TextField
                label={tEmail('mailgunTester.sections.send.fields.text')}
                name="text"
                value={emailForm.text}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                placeholder={sendPlaceholders.text}
                required
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    {tEmail('mailgunTester.sections.send.button.loading')}
                  </>
                ) : (
                  tEmail('mailgunTester.sections.send.button.default')
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {tEmail('mailgunTester.sections.validate.title')}
            </Typography>
            <Box component="form" onSubmit={handleValidateEmail}>
              <TextField
                label={tEmail('mailgunTester.sections.validate.field')}
                value={emailToValidate}
                onChange={(event) => setEmailToValidate(event.target.value)}
                fullWidth
                margin="normal"
                required
                placeholder={tEmail('mailgunTester.sections.validate.placeholder')}
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                disabled={validating}
              >
                {validating ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    {tEmail('mailgunTester.sections.validate.button.loading')}
                  </>
                ) : (
                  tEmail('mailgunTester.sections.validate.button.default')
                )}
              </Button>

              {validationResult && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography
                    variant="body1"
                    color={validationResult.isValid ? 'success.main' : 'error.main'}
                  >
                    {validationResult.isValid
                      ? tEmail('mailgunTester.validation.resultValid')
                      : tEmail('mailgunTester.validation.resultInvalid')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {tEmail('mailgunTester.sections.availability.title')}
            </Typography>
            <Box component="form" onSubmit={handleCheckAvailability}>
              <TextField
                label={tEmail('mailgunTester.sections.availability.field')}
                value={usernameToCheck}
                onChange={(event) => setUsernameToCheck(event.target.value)}
                fullWidth
                margin="normal"
                required
                placeholder={tEmail('mailgunTester.sections.availability.placeholder')}
                helperText={tEmail('mailgunTester.sections.availability.helper')}
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    {tEmail('mailgunTester.sections.availability.button.loading')}
                  </>
                ) : (
                  tEmail('mailgunTester.sections.availability.button.default')
                )}
              </Button>

              {availabilityResult !== null && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography
                    variant="body1"
                    color={availabilityResult ? 'success.main' : 'error.main'}
                  >
                    {availabilityResult
                      ? tEmailVars('mailgunTester.availability.available', {
                          username: usernameToCheck,
                        })
                      : tEmailVars('mailgunTester.availability.unavailable', {
                          username: usernameToCheck,
                        })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MailgunTester;
