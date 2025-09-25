import express from 'express';
import axios from 'axios';

const router = express.Router();

function getNordigenEnv() {
  const {
    NORDIGEN_SECRET_ID,
    NORDIGEN_SECRET_KEY,
    // Nordigen was acquired by GoCardless; default to GoCardless domain
    NORDIGEN_BASE_URL = 'https://ob.gocardless.com/api/v2',
    BANK_REDIRECT_URL,
    VITE_BACKEND_BASE_URL,
    PUBLIC_URL,
  } = process.env;
  return {
    NORDIGEN_SECRET_ID,
    NORDIGEN_SECRET_KEY,
    NORDIGEN_BASE_URL,
    BANK_REDIRECT_URL,
    VITE_BACKEND_BASE_URL,
    PUBLIC_URL,
  };
}

async function getNordigenToken() {
  const { NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY, NORDIGEN_BASE_URL } = getNordigenEnv();
  // Allow using a pre-generated access token from console if provided
  const STATIC_TOKEN = process.env.NORDIGEN_ACCESS_TOKEN || process.env.GOCARDLESS_ACCESS_TOKEN || process.env.BANK_ACCESS_TOKEN;
  if (STATIC_TOKEN) return STATIC_TOKEN;
  if (!NORDIGEN_SECRET_ID || !NORDIGEN_SECRET_KEY) {
    throw Object.assign(new Error('Nordigen credentials missing'), { status: 400 });
  }
  const tokenResp = await axios.post(`${NORDIGEN_BASE_URL}/token/new/`, {
    secret_id: NORDIGEN_SECRET_ID,
    secret_key: NORDIGEN_SECRET_KEY,
  });
  return tokenResp.data.access;
}

// Resolve redirect URL for aggregator callback (front page is fine)
function resolveRedirectUrl(req) {
  const { BANK_REDIRECT_URL, PUBLIC_URL } = getNordigenEnv();
  if (BANK_REDIRECT_URL) return BANK_REDIRECT_URL;
  if (PUBLIC_URL) return `${PUBLIC_URL.replace(/\/$/, '')}/finance/bank-connect`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
  return `${proto}://${host}/finance/bank-connect`;
}

// GET /api/bank/institutions?country=ES
router.get('/institutions', async (req, res) => {
  try {
    const country = (req.query.country || 'ES').toString().toUpperCase();
    const access = await getNordigenToken();
    const { NORDIGEN_BASE_URL } = getNordigenEnv();
    const resp = await axios.get(`${NORDIGEN_BASE_URL}/institutions/?country=${encodeURIComponent(country)}`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    res.json(resp.data || []);
  } catch (err) {
    const status = Number(err?.status || err?.response?.status || 500);
    res.status(status).json({ error: 'institutions_error', message: err?.message || 'error' });
  }
});

// POST /api/bank/requisition { institution_id, reference? }
router.post('/requisition', async (req, res) => {
  try {
    const { institution_id, reference } = req.body || {};
    if (!institution_id) return res.status(400).json({ error: 'missing_institution_id' });
    const access = await getNordigenToken();
    const { NORDIGEN_BASE_URL } = getNordigenEnv();
    const redirect = resolveRedirectUrl(req);
    const payload = {
      redirect,
      institution_id,
      reference: reference || `mywed360_${Date.now()}`,
      agree: true,
      user_language: 'ES',
    };
    const resp = await axios.post(`${NORDIGEN_BASE_URL}/requisitions/`, payload, {
      headers: { Authorization: `Bearer ${access}` },
    });
    res.json({ id: resp.data?.id, link: resp.data?.link, status: resp.data?.status || 'CREATED' });
  } catch (err) {
    const status = Number(err?.status || err?.response?.status || 500);
    res.status(status).json({ error: 'requisition_error', message: err?.message || 'error' });
  }
});

// GET /api/bank/requisition/:id -> details (includes accounts)
router.get('/requisition/:id', async (req, res) => {
  try {
    const access = await getNordigenToken();
    const { NORDIGEN_BASE_URL } = getNordigenEnv();
    const id = req.params.id;
    const resp = await axios.get(`${NORDIGEN_BASE_URL}/requisitions/${id}/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    res.json(resp.data || {});
  } catch (err) {
    const status = Number(err?.status || err?.response?.status || 500);
    res.status(status).json({ error: 'requisition_get_error', message: err?.message || 'error' });
  }
});

export default router;

