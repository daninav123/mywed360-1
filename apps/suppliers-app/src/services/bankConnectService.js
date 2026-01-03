import { get, post } from './apiClient';

export async function getInstitutions(country = 'ES') {
  const res = await get(`/api/bank/institutions?country=${encodeURIComponent(country)}`, {
    auth: true,
  });
  if (!res.ok) throw new Error('Error fetching institutions');
  return res.json();
}

export async function createRequisition(institutionId, reference) {
  const res = await post(
    '/api/bank/requisition',
    { institution_id: institutionId, reference },
    { auth: true }
  );
  if (!res.ok) throw new Error('Error creating requisition');
  return res.json();
}

export async function getRequisition(id) {
  const res = await get(`/api/bank/requisition/${encodeURIComponent(id)}`, { auth: true });
  if (!res.ok) throw new Error('Error fetching requisition');
  return res.json();
}
