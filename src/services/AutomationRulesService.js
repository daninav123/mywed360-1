// AutomationRulesService.js - Cliente frontend para /api/automation
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/automation`;

export async function listRules(weddingId) {
  const url = new URL(`${base()}/rules`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('listRules failed');
  const data = await res.json();
  return data.rules || [];
}

export async function upsertRule(weddingId, rule) {
  const res = await fetch(`${base()}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ weddingId, rule })
  });
  if (!res.ok) throw new Error('upsertRule failed');
  const data = await res.json();
  return data.rule;
}

export async function evaluateTrigger(weddingId, trigger) {
  const res = await fetch(`${base()}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ weddingId, trigger })
  });
  if (!res.ok) throw new Error('evaluate failed');
  return res.json();
}
